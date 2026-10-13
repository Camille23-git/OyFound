import { 
    addDoc, 
    collection, 
    collectionGroup, 
    deleteDoc, 
    doc, 
    getDoc, 
    getDocs, 
    onSnapshot, 
    orderBy, 
    query, 
    serverTimestamp, 
    setDoc, 
    where 
} from "firebase/firestore";
import { useEffect, useState } from 'react';
import Oybot from '../components/Oybot.jsx';
import { auth, db } from '../firebase';

// Helper to convert 24h string ("14:30") to 12h AM/PM string ("2:30 PM")
const convert24To12h = (time24) => {
    if (!time24 || !time24.includes(":")) return time24 || "";
    const [hoursStr, minutes] = time24.split(":");
    let hours = parseInt(hoursStr, 10);
    if (isNaN(hours)) return time24;
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
};

// Helper to format Date and Time into "Month/Day/Year Time"
const formatDateTime = (report) => {
    let dateStr = "";
    let timeStr = "";

    // 1. Process Date
    if (report.date) {
        if (report.date.includes("-")) {
            const [y, m, d] = report.date.split("-");
            dateStr = `${m}/${d}/${y}`;
        } else {
            dateStr = report.date;
        }
    }

    // 2. Process Time (convert 24h to 12h AM/PM if needed)
    if (report.timeFormatted) {
        timeStr = report.timeFormatted;
    } else if (report.time) {
        timeStr = convert24To12h(report.time);
    }

    if (dateStr || timeStr) {
        return `${dateStr} ${timeStr}`.trim();
    }

    // Fallback to timestamp if date/time string fields are not in the document
    if (report.timestamp && report.timestamp.seconds) {
        const dateObj = new Date(report.timestamp.seconds * 1000);
        return dateObj.toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    return "Not specified";
};

const autoIdentifyCategory = (itemName, dbCategory) => {
    if (dbCategory && dbCategory.trim() !== "") {
        return dbCategory;
    }

    if (!itemName) return "Uncategorized";

    const name = itemName.toLowerCase().trim();

    if (name.includes("key") || name.includes("fob") || name.includes("lanyard")) return "Keys & Accessories";
    if (name.includes("pickleball") || name.includes("racket") || name.includes("ball") || name.includes("bat") || name.includes("glove")) return "Sports Equipment";
    if (name.includes("wallet") || name.includes("purse") || name.includes("pouch") || name.includes("card holder") || name.includes("cash")) return "Personal Valuables";
    if (name.includes("headphone") || name.includes("earphone") || name.includes("airpods") || name.includes("charger") || name.includes("phone") || name.includes("laptop")) return "Electronics";
    if (name.includes("tumbler") || name.includes("bottle") || name.includes("flask") || name.includes("mug") || name.includes("cup")) return "Containers & Bottles";
    if (name.includes("id") || name.includes("license") || name.includes("card") || name.includes("document") || name.includes("paper")) return "Documents & IDs";
    if (name.includes("bag") || name.includes("backpack") || name.includes("tote") || name.includes("handbag")) return "Bags & Luggage";
    if (name.includes("jacket") || name.includes("hoodie") || name.includes("shirt") || name.includes("cap") || name.includes("umbrella")) return "Apparel & Accessories";

    return "General Items";
};

function HomeStudent({ searchQuery }) {
    const [activeTab, setActiveTab] = useState('All');
    const [reports, setReports] = useState([]);
    const [userClaims, setUserClaims] = useState({});
    const [allGlobalClaims, setAllGlobalClaims] = useState({});
    const [loadingItemId, setLoadingItemId] = useState(null);

    // =========================================================
    // REAL-TIME REPORTS LISTENER
    // =========================================================
    useEffect(() => {
        const qActive = query(collection(db, "reports"), orderBy("timestamp", "desc"));
        const unsub = onSnapshot(qActive, (snap) => {
            const reportsArr = [];
            snap.docs.forEach((docSnap) => {
                const data = docSnap.data();
                const status = (data.status || "").toLowerCase();

                // Exclude items that are already approved or claimed
                if (status !== "approved" && status !== "claimed") {
                    reportsArr.push({ ...data, id: docSnap.id });
                }
            });
            setReports(reportsArr);
        });
        return () => unsub();
    }, []);

    // =========================================================
    // GLOBAL REAL-TIME CLAIMS LISTENER
    // =========================================================
    useEffect(() => {
        const globalClaimsRef = collectionGroup(db, "claims");
        const unsubGlobalClaims = onSnapshot(globalClaimsRef, (snap) => {
            const globalClaimsMap = {};
            snap.docs.forEach(docSnap => {
                const data = docSnap.data();
                if (data.itemId && (data.status === "pending" || !data.status)) {
                    globalClaimsMap[data.itemId] = data;
                }
            });
            setAllGlobalClaims(globalClaimsMap);
        }, (error) => {
            console.warn("Global claims listener notice:", error);
        });

        return () => unsubGlobalClaims();
    }, []);

    // =========================================================
    // REAL-TIME CURRENT USER CLAIMS LISTENER
    // =========================================================
    useEffect(() => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const claimsRef = collection(db, "messages", currentUser.uid, "claims");
        const unsubClaims = onSnapshot(claimsRef, (snap) => {
            const claimsMap = {};
            snap.docs.forEach(docSnap => {
                claimsMap[docSnap.id] = docSnap.data(); 
            });
            setUserClaims(claimsMap);
        });

        return () => unsubClaims();
    }, []);

    // =========================================================
    // CLAIM TOGGLE (SUBMIT / CANCEL CLAIM)
    // =========================================================
    const handleToggleClaim = async (e, item, category) => {
        e.stopPropagation(); 
        
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert("You must be logged in to claim or cancel a claim for an item.");
            return;
        }

        if (loadingItemId) return;

        const currentClaim = userClaims[item.id];
        const globalClaim = allGlobalClaims[item.id];
        
        const activeCurrentClaim = currentClaim?.status === "pending" ? currentClaim : null;
        const activeGlobalClaim = globalClaim?.status === "pending" ? globalClaim : null;

        const isOwnerOfClaim = (activeGlobalClaim && activeGlobalClaim.studentId === currentUser.uid) || !!activeCurrentClaim;

        if ((activeGlobalClaim || (item.isPendingClaim && item.claimedBy)) && !isOwnerOfClaim) {
            alert("This item has already been requested for claim by another student.");
            return;
        }

        setLoadingItemId(item.id);

        const claimDocRef = doc(db, "messages", currentUser.uid, "claims", item.id);
        const reportDocRef = doc(db, "reports", item.id);
        
        try {
            if (isOwnerOfClaim) {
                // 1. Delete claim document for this item
                await deleteDoc(claimDocRef);

                // 2. Delete replies tied to this item
                const repliesRef = collection(db, "messages", currentUser.uid, "replies");
                const qReplies = query(repliesRef, where("itemId", "==", item.id));
                const replySnap = await getDocs(qReplies);
                
                const deletePromises = replySnap.docs.map(docSnap => deleteDoc(docSnap.ref));
                await Promise.all(deletePromises);

                // 3. Fallback to latest remaining conversation message or delete conversation doc entirely
                const remainingRepliesQuery = query(repliesRef, orderBy("timestamp", "desc"));
                const remainingRepliesSnap = await getDocs(remainingRepliesQuery);

                if (remainingRepliesSnap.empty) {
                    // Completely remove conversation from sidebar if no messages remain
                    await deleteDoc(doc(db, "messages", currentUser.uid));
                } else {
                    // Set preview to the actual content of the last remaining reply
                    const lastReply = remainingRepliesSnap.docs[0].data();
                    const lastReplyText = lastReply.imageUrl ? "📷 Sent an image" : (lastReply.text || "");
                    const lastRole = lastReply.role || lastReply.sender || "student";

                    await setDoc(doc(db, "messages", currentUser.uid), {
                        message: lastReplyText,
                        lastSenderRole: lastRole,
                        timestamp: lastReply.timestamp || serverTimestamp()
                    }, { merge: true });
                }

                // 4. Reset global report flags in Firestore (if document still exists in reports)
                const reportSnap = await getDoc(reportDocRef);
                if (reportSnap.exists()) {
                    await setDoc(reportDocRef, { 
                        isPendingClaim: false,
                        claimedBy: null,
                        claimedByName: null
                    }, { merge: true });
                }

                alert(`Claim request for "${item.itemName}" was cancelled.`);
            } else {
                let activeFirstName = "";
                let activeLastName = "";
                const activeEmail = currentUser.email || "";

                const userDocRef = doc(db, "users", currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    activeFirstName = userData.firstName || userData.firstname || "";
                    activeLastName = userData.lastName || userData.lastname || "";
                }

                if (!activeFirstName && !activeLastName && currentUser.displayName) {
                    const nameParts = currentUser.displayName.split(" ");
                    activeFirstName = nameParts[0] || "";
                    activeLastName = nameParts.slice(1).join(" ") || "";
                }

                const finalStudentName = `${activeFirstName} ${activeLastName}`.trim() || activeEmail.split('@')[0] || "Student User";
                const claimText = `Hello Admin, I am requesting to claim the item "${item.itemName}" found at "${item.locationName || item.landmark || 'Not specified'}". Please review and verify my claim request.`;

                const conversationDocRef = doc(db, "messages", currentUser.uid);

                await setDoc(conversationDocRef, {
                    firstName: activeFirstName,
                    lastName: activeLastName,
                    fullName: finalStudentName,
                    email: activeEmail,
                    avatarUrl: currentUser.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                    message: claimText,
                    lastSenderRole: 'student',
                    timestamp: serverTimestamp(),
                    unread: true,
                    unreadStudent: false,
                    isDeleted: false,
                    isArchived: false
                }, { merge: true });

                await setDoc(claimDocRef, {
                    itemId: item.id,
                    itemName: item.itemName,
                    itemCategory: category || "",
                    studentId: currentUser.uid,
                    studentEmail: activeEmail,
                    studentName: finalStudentName,
                    status: "pending",
                    timestamp: serverTimestamp()
                });

                await addDoc(collection(db, "messages", currentUser.uid, "replies"), {
                    itemId: item.id,
                    isClaimRequest: true,
                    text: claimText,
                    imageUrl: item.imageUrl || null, 
                    sender: "student",
                    senderId: currentUser.uid, 
                    senderName: finalStudentName,
                    role: 'student',
                    timestamp: serverTimestamp()
                });
                
                // 5. Update global report document in Firestore
                await setDoc(reportDocRef, { 
                    isPendingClaim: true,
                    claimedBy: currentUser.uid,
                    claimedByName: finalStudentName
                }, { merge: true });

                alert(`Claim request for "${item.itemName}" has been submitted! Waiting for Admin approval.`);
            }
        } catch (error) {
            console.error("Error toggling claim request:", error);
            alert("Failed to update claim state.");
        } finally {
            setLoadingItemId(null);
        }
    };

    // =========================================================
    // FILTERING LOGIC
    // =========================================================
    const filteredItems = reports.filter(item => {
        const itemStatus = (item.status || "").toLowerCase();
        const tabLower = activeTab.toLowerCase();
        
        let matchesTab = false;
        if (activeTab === 'All') {
            matchesTab = true;
        } else if (tabLower === 'lost') {
            matchesTab = itemStatus === 'lost' || itemStatus === 'unclaimed';
        } else if (tabLower === 'found') {
            matchesTab = itemStatus === 'found' || itemStatus === 'unclaimed';
        } else {
            matchesTab = itemStatus === tabLower;
        }
        
        const queryClean = (searchQuery || "").toLowerCase().trim();
        const nameToSearch = (item.itemName || "").toLowerCase();
        const descToSearch = (item.description || "").toLowerCase();
        const locationToSearch = (item.locationName || item.landmark || "").toLowerCase();
        const categoryToSearch = autoIdentifyCategory(item.itemName, item.category).toLowerCase();

        const matchesSearch = queryClean === "" || 
            nameToSearch.includes(queryClean) || 
            descToSearch.includes(queryClean) || 
            locationToSearch.includes(queryClean) ||
            categoryToSearch.includes(queryClean);

        return matchesTab && matchesSearch;
    });

    const renderClaimButtonText = (item, claimData, globalClaim, isMine) => {
        const itemStatus = (item.status || "").toLowerCase();

        if (claimData?.status === "approved" || itemStatus === "claimed" || itemStatus === "approved") {
            return "Claim Approved ✓";
        }

        const isPending = 
            claimData?.status === "pending" || 
            globalClaim?.status === "pending" || 
            (item.isPendingClaim && item.claimedBy) || 
            itemStatus === "pending";

        if (isPending) {
            return isMine ? "Pending Admin" : "Claim In Progress";
        }

        return "Claim Item";
    };

    return (
        <div className="student-home">
            <div className="category-header">
                <button className={activeTab === 'Lost' ? 'active' : ''} onClick={() => setActiveTab('Lost')}>Lost</button>
                <button className={activeTab === 'Found' ? 'active' : ''} onClick={() => setActiveTab('Found')}>Found</button>
                <button className={activeTab === 'All' ? 'active' : ''} onClick={() => setActiveTab('All')}>All</button>
            </div>

            <div className="dashboard-widgets">
                {filteredItems.length === 0 ? (
                    <div className="empty-state-card">
                        <p>No item reports found here.</p>
                    </div>
                ) : (
                    <div className="reports-grid">
                        {filteredItems.map(item => {
                            const identifiedCategory = autoIdentifyCategory(item.itemName, item.category);
                            const claimData = userClaims[item.id];
                            const globalClaim = allGlobalClaims[item.id];
                            const itemStatus = (item.status || "").toLowerCase();
                            const currentUser = auth.currentUser;
                            
                            const isPendingClaimActive = 
                                (globalClaim && globalClaim.status === "pending") || 
                                (claimData && claimData.status === "pending") || 
                                (item.isPendingClaim && item.claimedBy && itemStatus !== "rejected");

                            const isMine = 
                                (currentUser && (globalClaim?.studentId === currentUser.uid || item.claimedBy === currentUser.uid)) || 
                                (claimData && claimData.status === "pending");

                            const isApprovedOrClaimed = 
                                itemStatus === "claimed" || 
                                itemStatus === "approved" || 
                                claimData?.status === "approved";

                            const locationDisplay = item.locationName || item.landmark || 'Not specified';

                            return (
                                <div key={item.id} className="student-card-container">
                                    <div className="student-card-left">
                                        {item.imageUrl ? (
                                            <img 
                                                src={item.imageUrl} 
                                                alt={item.itemName} 
                                                className="student-card-image"
                                            />
                                        ) : (
                                            <div className="placeholder-box">350 x 250</div>
                                        )}
                                    </div>
                                    <div className="student-card-right">
                                        <h3 className="card-item-title" title={item.itemName}>
                                            Item name: {item.itemName}
                                        </h3>
                                        <p className="card-info-text">
                                            <strong>Category:</strong> {identifiedCategory}
                                        </p>
                                        <p className="card-info-text" title={locationDisplay}>
                                            <strong>Location:</strong> {locationDisplay}
                                        </p>
                                        <p className="card-info-text">
                                            <strong>Date & Time:</strong> {formatDateTime(item)}
                                        </p>
                                        <div className="card-description-box">
                                            <strong>Description:</strong>
                                            <p className="description-text">{item.description || 'No description provided.'}</p>
                                        </div>
                                        <div className="card-actions-row">
                                            <span className={`status-pill status-${itemStatus}`}>
                                                STATUS: {(item.status || "UNCLAIMED").toUpperCase()}
                                            </span>
                                            <button 
                                                className={`claim-btn ${
                                                    isPendingClaimActive && isMine
                                                        ? 'pending' 
                                                        : isPendingClaimActive && !isMine
                                                        ? 'claimed-other'
                                                        : isApprovedOrClaimed 
                                                        ? 'claimed' 
                                                        : ''
                                                }`}
                                                onClick={(e) => handleToggleClaim(e, item, identifiedCategory)}
                                                disabled={
                                                    loadingItemId === item.id || 
                                                    isApprovedOrClaimed || 
                                                    (isPendingClaimActive && !isMine)
                                                }
                                            >
                                                {loadingItemId === item.id 
                                                    ? "Processing..." 
                                                    : renderClaimButtonText(item, claimData, globalClaim, isMine)
                                                }
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* DRAGGABLE OYBOT FOR STUDENT VIEW */}
            <Oybot />
        </div>
    );
}

export default HomeStudent;