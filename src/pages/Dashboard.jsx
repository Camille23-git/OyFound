import {
    collection,
    collectionGroup,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    where,
    writeBatch
} from "firebase/firestore";
import {
    onAuthStateChanged,
    signOut
} from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";

// =========================================================
// VECTOR SVG ICONS
// =========================================================
const StudentIcon = () => (
    <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
);
const GuestIcon = () => (
    <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);
const LostSectionIcon = () => (
    <svg className="svg-icon section-3d-svg" viewBox="0 0 32 32" aria-hidden="true">
        <defs>
            <linearGradient id="lostLens" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff"/><stop offset="1" stopColor="#8fc7ec"/></linearGradient>
            <linearGradient id="lostHandle" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d9f1ff"/><stop offset="1" stopColor="#6ba4d0"/></linearGradient>
        </defs>
        <circle cx="13" cy="13" r="8.2" fill="url(#lostLens)" stroke="#ffffff" strokeWidth="2.2"/>
        <path d="M19.2 19.2 26 26" stroke="url(#lostHandle)" strokeWidth="5" strokeLinecap="round"/>
        <path d="M9 10.5c1.2-2 3.7-2.8 5.9-1.8" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity=".9"/>
    </svg>
);
const FoundSectionIcon = () => (
    <svg className="svg-icon section-3d-svg" viewBox="0 0 32 32" aria-hidden="true">
        <defs>
            <linearGradient id="foundBox" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff0bd"/><stop offset="1" stopColor="#d99a3d"/></linearGradient>
            <linearGradient id="foundTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff8dc"/><stop offset="1" stopColor="#f0c46b"/></linearGradient>
        </defs>
        <path d="m5 11 11-6 11 6-11 6z" fill="url(#foundTop)" stroke="#fff" strokeWidth="1.4"/>
        <path d="M5 11v12l11 6V17z" fill="#d99a3d" stroke="#fff" strokeWidth="1.4"/>
        <path d="M27 11v12l-11 6V17z" fill="url(#foundBox)" stroke="#fff" strokeWidth="1.4"/>
        <path d="M16 5v12m-5-9 10 5" stroke="#fff8df" strokeWidth="1.5" opacity=".9"/>
    </svg>
);
const ClaimedSectionIcon = () => (
    <svg className="svg-icon section-3d-svg" viewBox="0 0 32 32" aria-hidden="true">
        <defs>
            <linearGradient id="claimedCheck" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d7ffe9"/><stop offset="1" stopColor="#54c58a"/></linearGradient>
        </defs>
        <circle cx="16" cy="16" r="12" fill="url(#claimedCheck)" stroke="#fff" strokeWidth="1.8"/>
        <path d="m9.5 16.3 4.2 4.1 8.8-9" fill="none" stroke="#075b3b" strokeWidth="3.1" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.5 9.5c2-2.3 5-3.5 8-3.2" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity=".9"/>
    </svg>
);
const UsersSectionIcon = () => (
    <svg className="svg-icon section-3d-svg" viewBox="0 0 32 32" aria-hidden="true">
        <defs>
            <linearGradient id="usersMain" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e4f3ff"/><stop offset="1" stopColor="#78acd5"/></linearGradient>
        </defs>
        <circle cx="12" cy="11" r="5" fill="url(#usersMain)" stroke="#fff" strokeWidth="1.4"/>
        <circle cx="23" cy="13" r="4" fill="#9bc7e7" stroke="#fff" strokeWidth="1.3"/>
        <path d="M3.5 27c.2-5 3.6-8 8.5-8s8.3 3 8.5 8" fill="url(#usersMain)" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M20 20c4.8-.7 8 2 8.5 6.5" fill="none" stroke="#d9efff" strokeWidth="3" strokeLinecap="round"/>
    </svg>
);


// Matching glossy 3D icons for the summary cards (unique gradient IDs).
const TotalItemsSummaryIcon = () => (
    <svg className="svg-icon section-3d-svg" viewBox="0 0 32 32" aria-hidden="true">
        <defs>
            <linearGradient id="summaryItemBox" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff0bd"/><stop offset="1" stopColor="#d99a3d"/></linearGradient>
            <linearGradient id="summaryItemTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff8dc"/><stop offset="1" stopColor="#f0c46b"/></linearGradient>
        </defs>
        <path d="m5 11 11-6 11 6-11 6z" fill="url(#summaryItemTop)" stroke="#fff" strokeWidth="1.4"/>
        <path d="M5 11v12l11 6V17z" fill="#d99a3d" stroke="#fff" strokeWidth="1.4"/>
        <path d="M27 11v12l-11 6V17z" fill="url(#summaryItemBox)" stroke="#fff" strokeWidth="1.4"/>
        <path d="M16 5v12m-5-9 10 5" stroke="#fff8df" strokeWidth="1.5" opacity=".9"/>
    </svg>
);
const TotalUsersSummaryIcon = () => (
    <svg className="svg-icon section-3d-svg" viewBox="0 0 32 32" aria-hidden="true">
        <defs>
            <linearGradient id="summaryUsersMain" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e4f3ff"/><stop offset="1" stopColor="#78acd5"/></linearGradient>
        </defs>
        <circle cx="12" cy="11" r="5" fill="url(#summaryUsersMain)" stroke="#fff" strokeWidth="1.4"/>
        <circle cx="23" cy="13" r="4" fill="#9bc7e7" stroke="#fff" strokeWidth="1.3"/>
        <path d="M3.5 27c.2-5 3.6-8 8.5-8s8.3 3 8.5 8" fill="url(#summaryUsersMain)" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M20 20c4.8-.7 8 2 8.5 6.5" fill="none" stroke="#d9efff" strokeWidth="3" strokeLinecap="round"/>
    </svg>
);
const SchoolIcon = () => (
    <svg className="svg-icon inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10l-10-5L2 10l10 5 10-5z" />
        <path d="M6 12v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7" />
    </svg>
);
const SearchIcon = () => (
    <svg className="svg-icon search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);
const EmailIcon = () => (
    <svg className="svg-icon inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);
const PhoneIcon = () => (
    <svg className="svg-icon inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);
const IdBadgeIcon = () => (
    <svg className="svg-icon inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="9" r="2" />
        <path d="M9 16h6" />
        <path d="M10 13h4" />
    </svg>
);
const LockIcon = () => (
    <svg className="svg-icon inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);
const TrashIcon = () => (
    <svg 
        className="svg-icon inline-icon" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);
const ReturnIcon = () => (
    <svg className="svg-icon inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 14 4 9 9 4" />
        <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </svg>
);
const CheckIcon = () => (
    <svg className="svg-icon inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const FilterIcon = () => (
    <svg className="svg-icon inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
);

function Dashboard({ setRole }) {
    const navigate = useNavigate();
    // =========================================================
    // STATE
    // =========================================================
    const [activeTab, setActiveTab] = useState("Lost");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [reports, setReports] = useState([]);
    const [claimedReports, setClaimedReports] = useState([]);
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingAdmin, setCheckingAdmin] = useState(true);
    const [processingItemId, setProcessingItemId] = useState(null);
    const [processingUserId, setProcessingUserId] = useState(null);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSelectedCategory("All");
    };

    // =========================================================
    // DEFAULT PROFILE ICON
    // =========================================================
    const DEFAULT_ICON =
        "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    // =========================================================
    // FORMAT FIRESTORE TIMESTAMP / DATE & TIME
    // =========================================================
    const getTimestampValue = (timestamp) => {
        if (!timestamp) {
            return 0;
        }
        if (
            typeof timestamp.toMillis === "function"
        ) {
            return timestamp.toMillis();
        }
        if (
            typeof timestamp.toDate === "function"
        ) {
            return timestamp.toDate().getTime();
        }
        if (timestamp instanceof Date) {
            return timestamp.getTime();
        }
        const parsed = new Date(timestamp);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.getTime();
        }
        return 0;
    };

    const formatDateTime = (report) => {
        let dateStr = "";
        let timeStr = "";
        if (report.date) {
            if (report.date.includes("-")) {
                const [y, m, d] = report.date.split("-");
                dateStr = `${m}/${d}/${y}`;
            } else {
                dateStr = report.date;
            }
        }
        if (report.timeFormatted) {
            timeStr = report.timeFormatted;
        } else if (report.time) {
            if (report.time.includes(":")) {
                const [hoursStr, minutes] = report.time.split(":");
                let hours = parseInt(hoursStr, 10);
                if (!isNaN(hours)) {
                    const ampm = hours >= 12 ? "PM" : "AM";
                    hours = hours % 12 || 12;
                    timeStr = `${hours}:${minutes} ${ampm}`;
                } else {
                    timeStr = report.time;
                }
            } else {
                timeStr = report.time;
            }
        }
        if (dateStr || timeStr) {
            return `${dateStr} ${timeStr}`.trim();
        }
        const ts = activeTab === "Claimed" && report.claimedAt ? report.claimedAt : report.timestamp;
        if (ts && ts.seconds) {
            const dateObj = new Date(ts.seconds * 1000);
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

    // =========================================================
    // CHECK CURRENT USER / ADMIN ROLE
    // =========================================================
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {
                setCurrentUser(user);
                setCheckingAdmin(true);
                if (!user) {
                    setIsAdmin(false);
                    setCheckingAdmin(false);
                    return;
                }
                try {
                    let admin = false;
                    const userRef = doc(
                        db,
                        "users",
                        user.uid
                    );
                    const userSnap =
                        await getDoc(userRef);
                    if (userSnap.exists()) {
                        const userData =
                            userSnap.data();
                        if (
                            String(
                                userData.role || ""
                            ).toLowerCase() ===
                            "admin"
                        ) {
                            admin = true;
                        }
                    }
                    if (!admin && user.email) {
                        const emailQuery =
                            query(
                                collection(
                                    db,
                                    "users"
                                ),
                                where(
                                    "email",
                                    "==",
                                    user.email
                                )
                            );
                        const emailSnap =
                            await getDocs(
                                emailQuery
                            );
                        admin =
                            emailSnap.docs.some(
                                (userDoc) => {
                                    const data =
                                        userDoc.data();
                                    return (
                                        String(
                                            data.role ||
                                                ""
                                        ).toLowerCase() ===
                                        "admin"
                                    );
                                }
                            );
                    }
                    setIsAdmin(admin);
                } catch (error) {
                    console.error(
                        "Error checking administrator role:",
                        error
                    );
                    setIsAdmin(false);
                } finally {
                    setCheckingAdmin(false);
                }
            }
        );
        return () => unsubscribe();
    }, []);

    // =========================================================
    // REALTIME LISTENER: AUTOMATICALLY TRANSFER APPROVED CLAIMS
    // =========================================================
    useEffect(() => {
        const claimsQuery = query(
            collectionGroup(db, "claims"),
            where("status", "==", "approved")
        );
        const processClaimTransfer = async (claimData, docId) => {
            const itemId = claimData.itemId || docId;
            if (!itemId) return;
            try {
                const reportRef = doc(db, "reports", itemId);
                const reportSnap = await getDoc(reportRef);
                if (reportSnap.exists()) {
                    const reportData = reportSnap.data();
                    const claimedRef = doc(db, "claimed_reports", itemId);
                    const batch = writeBatch(db);
                    batch.set(claimedRef, {
                        ...reportData,
                        status: "Claimed",
                        originalStatus: reportData.status || "Lost",
                        claimedAt: serverTimestamp(),
                        claimedBy: claimData.studentId || claimData.userId || "",
                        claimedByEmail: claimData.studentEmail || claimData.userEmail || ""
                    });
                    batch.delete(reportRef);
                    await batch.commit();
                }
            } catch (err) {
                console.error("Auto transfer to claimed failed:", err);
            }
        };
        const unsubscribeApprovedClaims = onSnapshot(
            claimsQuery,
            (snapshot) => {
                snapshot.docs.forEach((docSnap) => {
                    processClaimTransfer(docSnap.data(), docSnap.id);
                });
            },
            (error) => {
                console.error("Approved claims listener error:", error);
            }
        );
        return () => unsubscribeApprovedClaims();
    }, []);

    // =========================================================
    // REALTIME REPORTS
    // =========================================================
    useEffect(() => {
        const reportsQuery = query(
            collection(db, "reports")
        );
        const unsubscribeReports =
            onSnapshot(
                reportsQuery,
                (snapshot) => {
                    const data =
                        snapshot.docs
                            .map((reportDoc) => ({
                                ...reportDoc.data(),
                                id: reportDoc.id
                            }))
                            .sort(
                                (a, b) =>
                                    getTimestampValue(
                                        b.timestamp
                                    ) -
                                    getTimestampValue(
                                        a.timestamp
                                    )
                            );
                    setReports(data);
                },
                (error) => {
                    console.error(
                        "Reports listener error:",
                        error
                    );
                }
            );
        return () => unsubscribeReports();
    }, []);

    // =========================================================
    // REALTIME CLAIMED REPORTS
    // =========================================================
    useEffect(() => {
        const claimedQuery = query(
            collection(
                db,
                "claimed_reports"
            )
        );
        const unsubscribeClaimed =
            onSnapshot(
                claimedQuery,
                (snapshot) => {
                    const data =
                        snapshot.docs
                            .map((reportDoc) => ({
                                ...reportDoc.data(),
                                id: reportDoc.id
                            }))
                            .sort(
                                (a, b) =>
                                    getTimestampValue(
                                        b.claimedAt
                                    ) -
                                    getTimestampValue(
                                        a.claimedAt
                                    )
                            );
                    setClaimedReports(data);
                },
                (error) => {
                    console.error(
                        "Claimed reports listener error:",
                        error
                    );
                }
            );
        return () => unsubscribeClaimed();
    }, []);

    // =========================================================
    // REALTIME USERS
    // =========================================================
    useEffect(() => {
        const usersQuery = query(
            collection(db, "users")
        );
        const unsubscribeUsers =
            onSnapshot(
                usersQuery,
                (snapshot) => {
                    const data =
                        snapshot.docs.map(
                            (userDoc) => ({
                                ...userDoc.data(),
                                id: userDoc.id
                            })
                        );
                    setUsers(data);
                },
                (error) => {
                    console.error(
                        "Users listener error:",
                        error
                    );
                }
            );
        return () => unsubscribeUsers();
    }, []);

    // =========================================================
    // LOGOUT
    // =========================================================
    const handleLogout = async () => {
        try {
            await signOut(auth);
            if (typeof setRole === "function") {
                setRole(null);
            }
            localStorage.removeItem(
                "userRole"
            );
            navigate("/");
        } catch (error) {
            console.error(
                "Logout failed:",
                error
            );
            alert(
                "Logout failed. Please try again."
            );
        }
    };

    // =========================================================
    // ADMIN ACCESS CHECK
    // =========================================================
    const requireAdmin = () => {
        if (!currentUser) {
            alert(
                "You must be logged in to perform this action."
            );
            return false;
        }
        if (!isAdmin) {
            alert(
                "Only administrators can perform this action."
            );
            return false;
        }
        return true;
    };

    // =========================================================
    // MARK CLAIMED REPORT AS UNCLAIMED (NO INDEX REQUIRED)
    // =========================================================
    const handleMoveToUnclaimed = async (item) => {
        if (!requireAdmin()) {
            return;
        }
        if (!item?.id) {
            alert("Unable to identify this report.");
            return;
        }
        if (processingItemId === item.id) {
            return;
        }
        const itemName = item.itemName || "this item";
        const confirmed = window.confirm(
            `Mark "${itemName}" as unclaimed and return it to active reports?`
        );
        if (!confirmed) {
            return;
        }
        setProcessingItemId(item.id);
        try {
            const restoredStatus =
                item.originalStatus === "Lost" || item.originalStatus === "Found"
                    ? item.originalStatus
                    : item.status === "Lost" || item.status === "Found"
                    ? item.status
                    : "Found";
            const cleanClaimedData = { ...item };
            delete cleanClaimedData.id;
            delete cleanClaimedData.claimedAt;
            delete cleanClaimedData.claimedBy;
            delete cleanClaimedData.claimedByEmail;
            delete cleanClaimedData.originalStatus;
            delete cleanClaimedData.unclaimedAt;
            Object.keys(cleanClaimedData).forEach((key) => {
                if (cleanClaimedData[key] === undefined) {
                    delete cleanClaimedData[key];
                }
            });
            const claimedRef = doc(db, "claimed_reports", item.id);
            const reportRef = doc(db, "reports", item.id);
            const batch = writeBatch(db);
            batch.set(reportRef, {
                ...cleanClaimedData,
                status: restoredStatus,
                timestamp: item.timestamp || serverTimestamp()
            });
            batch.delete(claimedRef);
            if (item.claimedBy) {
                const claimRef = doc(db, "messages", item.claimedBy, "claims", item.id);
                batch.delete(claimRef);
            }
            users.forEach((u) => {
                if (u.id) {
                    const fallbackClaimRef = doc(db, "messages", u.id, "claims", item.id);
                    batch.delete(fallbackClaimRef);
                }
            });
            await batch.commit();
            alert(`"${itemName}" has been marked as unclaimed and posted back to feeds.`);
        } catch (error) {
            console.error("Mark Unclaimed Error:", error);
            alert("Failed to mark item as unclaimed:\n" + error.message);
        } finally {
            setProcessingItemId(null);
        }
    };

    // =========================================================
    // DELETE ITEM - ADMIN ONLY
    // =========================================================
    const handleDelete = async (item) => {
        if (!requireAdmin()) {
            return;
        }
        if (!item?.id) {
            alert("Unable to identify this report.");
            return;
        }
        if (processingItemId === item.id) {
            return;
        }
        const collectionName =
            activeTab === "Claimed"
                ? "claimed_reports"
                : "reports";
        const itemName = item.itemName || "this item";
        const confirmed = window.confirm(
            `Are you sure you want to permanently delete "${itemName}"?`
        );
        if (!confirmed) {
            return;
        }
        setProcessingItemId(item.id);
        try {
            await deleteDoc(doc(db, collectionName, item.id));
            alert("Deleted successfully.");
        } catch (error) {
            console.error("Delete Error:", error);
            alert("Failed to delete:\n" + error.message);
        } finally {
            setProcessingItemId(null);
        }
    };

    // =========================================================
    // DELETE USER - ADMIN ONLY
    // =========================================================
    const handleDeleteUser = async (userToDelete) => {
        if (!requireAdmin()) {
            return;
        }
        if (!userToDelete?.id) {
            alert("Unable to identify this user.");
            return;
        }
        if (processingUserId === userToDelete.id) {
            return;
        }
        const userName =
            userToDelete.fullName ||
            userToDelete.displayName ||
            userToDelete.name ||
            userToDelete.email ||
            "this user";
        const confirmed = window.confirm(
            `Are you sure you want to delete the registered account for "${userName}"?`
        );
        if (!confirmed) {
            return;
        }
        setProcessingUserId(userToDelete.id);
        try {
            await deleteDoc(doc(db, "users", userToDelete.id));
            alert("User deleted successfully.");
        } catch (error) {
            console.error("Delete User Error:", error);
            alert("Failed to delete user:\n" + error.message);
        } finally {
            setProcessingUserId(null);
        }
    };

    // =========================================================
    // USER CATEGORIES
    // =========================================================
    const allStudents =
        users.filter(
            (user) =>
                String(
                    user.role || ""
                ).toLowerCase() ===
                    "student" ||
                (!user.role &&
                    (
                        user.schoolName ||
                        user.school
                    ))
        );
    const allAdmins =
        users.filter(
            (user) =>
                String(
                    user.role || ""
                ).toLowerCase() ===
                    "admin" ||
                String(
                    user.role || ""
                ).toLowerCase() ===
                    "guest" ||
                (
                    !user.schoolName &&
                    !user.school &&
                    String(
                        user.role || ""
                    ).toLowerCase() !==
                        "student"
                )
        );

    // =========================================================
    // TAB COUNTS
    // =========================================================
    const getCount = (type) => {
        if (type === "Claimed") {
            return claimedReports.length;
        }
        if (type === "Users") {
            return users.length;
        }
        return reports.filter(
            (report) =>
                report.status === type
        ).length;
    };

    // =========================================================
    // ITEM COUNTS
    // =========================================================
    const lostCount = getCount("Lost");
    const foundCount = getCount("Found");
    const claimedCount = getCount("Claimed");
    const totalItems =
        lostCount +
        foundCount +
        claimedCount;
    const getPercentage =
        (count) => {
            if (totalItems === 0) {
                return "0.0";
            }
            return (
                (count / totalItems) *
                100
            ).toFixed(1);
        };

    // =========================================================
    // CHART DATA
    // =========================================================
    const chartData = [
        {
            name: "Lost",
            count: lostCount,
            color: "#dc2626"
        },
        {
            name: "Found",
            count: foundCount,
            color: "#059669"
        },
        {
            name: "Claimed",
            count: claimedCount,
            color: "#062438"
        }
    ];
    const pieData =
        chartData.filter(
            (item) =>
                item.count > 0
        );

    // =========================================================
    // CATEGORY LIST FOR ACTIVE TAB
    // =========================================================
    const currentTabSourceItems = useMemo(() => {
        if (activeTab === "Claimed") return claimedReports;
        if (activeTab === "Lost") return reports.filter((r) => r.status === "Lost");
        if (activeTab === "Found") return reports.filter((r) => r.status === "Found");
        return [];
    }, [activeTab, reports, claimedReports]);

    const availableCategories = useMemo(() => {
        const catMap = new Map();
        currentTabSourceItems.forEach((item) => {
            const cat = (item.category || "General Items").trim();
            catMap.set(cat, (catMap.get(cat) || 0) + 1);
        });
        return Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);
    }, [currentTabSourceItems]);

    // =========================================================
    // FILTER INVENTORY
    // =========================================================
    const filteredItems = currentTabSourceItems.filter((item) => {
        const itemCat = (item.category || "General Items").trim();
        const matchesCategory = selectedCategory === "All" || itemCat === selectedCategory;
        if (!matchesCategory) return false;

        const search =
            searchTerm
                .toLowerCase()
                .trim();
        if (!search) {
            return true;
        }
        return (
            String(
                item.itemName || ""
            )
                .toLowerCase()
                .includes(search) ||
            itemCat
                .toLowerCase()
                .includes(search) ||
            String(
                item.locationName || item.landmark || ""
            )
                .toLowerCase()
                .includes(search)
        );
    });

    // =========================================================
    // FILTER USERS
    // =========================================================
    const filteredUsers =
        users.filter((user) => {
            const userName =
                user.fullName ||
                user.displayName ||
                user.name ||
                "";
            const userEmail =
                user.email || "";
            const userSchool =
                user.schoolName ||
                user.school ||
                user.university ||
                "";
            const userRole =
                user.role || "";
            const search =
                searchTerm
                    .toLowerCase()
                    .trim();
            return (
                userName
                    .toLowerCase()
                    .includes(search) ||
                userEmail
                    .toLowerCase()
                    .includes(search) ||
                userSchool
                    .toLowerCase()
                    .includes(search) ||
                userRole
                    .toLowerCase()
                    .includes(search)
            );
        });

    // =========================================================
    // DISPLAY STUDENTS & ADMINS
    // =========================================================
    const displayStudents =
        filteredUsers.filter(
            (user) =>
                String(
                    user.role || ""
                ).toLowerCase() ===
                    "student" ||
                (!user.role &&
                    (
                        user.schoolName ||
                        user.school
                    ))
        );
    const adminCandidates =
        filteredUsers.filter(
            (user) =>
                String(user.role || "").toLowerCase() === "admin" ||
                String(user.role || "").toLowerCase() === "guest" ||
                (
                    !user.schoolName &&
                    !user.school &&
                    String(user.role || "").toLowerCase() !== "student"
                )
        );

    // Show one administrator card per email address. If the signed-in
    // administrator has a duplicate record, keep the record matching auth UID.
    const displayAdmins = (() => {
        const uniqueAdmins = new Map();
        adminCandidates.forEach((adminUser) => {
            const normalizedEmail = String(adminUser.email || "")
                .trim()
                .toLowerCase();
            const uniqueKey = normalizedEmail || `uid:${adminUser.id}`;
            const existingAdmin = uniqueAdmins.get(uniqueKey);
            if (
                !existingAdmin ||
                (currentUser?.uid === adminUser.id && currentUser?.uid !== existingAdmin.id)
            ) {
                uniqueAdmins.set(uniqueKey, adminUser);
            }
        });
        return Array.from(uniqueAdmins.values());
    })();

    // =========================================================
    // GROUP STUDENTS BY SCHOOL
    // =========================================================
    const studentsBySchool =
        displayStudents.reduce(
            (groups, student) => {
                const rawSchool =
                    student.schoolName ||
                    student.school ||
                    student.university ||
                    "Consolatrix College of Toledo City";
                const schoolName =
                    String(
                        rawSchool
                    ).trim();
                if (!groups[schoolName]) {
                    groups[schoolName] = [];
                }
                groups[schoolName].push(
                    student
                );
                return groups;
            },
            {}
        );

    // =========================================================
    // ADMIN CHECKING
    // =========================================================
    if (checkingAdmin) {
        return (
            <div className="dashboard-wrapper">
                <div className="empty-state-card dashboard-loading-card">
                    <div className="dashboard-loading-spinner">
                    </div>
                    <p>
                        Checking administrator access...
                    </p>
                </div>
            </div>
        );
    }

    // =========================================================
    // RENDER
    // =========================================================
    return (
        <div className="dashboard-wrapper">
            {/* =================================================
                FULL-WIDTH TOP HEADER & PROFILE BAR
            ================================================= */}
            <div className="dashboard-header">
                <div className="dashboard-title-area">
                    <h1>Dashboard</h1>
                    {isAdmin ? (
                        <span className="admin-badge">ADMIN</span>
                    ) : (
                        <span className="dashboard-access-badge denied">View Only</span>
                    )}
                </div>
                {currentUser && (
                    <div className="dashboard-admin-profile">
                        <div className="dashboard-admin-info">
                            <img
                                src={currentUser.photoURL || DEFAULT_ICON}
                                alt="User Avatar"
                                className="dashboard-admin-avatar"
                            />
                            <div className="dashboard-admin-details">
                                <strong>
                                    {currentUser.displayName &&
                                    currentUser.displayName.trim().toLowerCase() !== String(currentUser.email || "").trim().toLowerCase() &&
                                    currentUser.displayName.trim().toLowerCase() !== "administrator"
                                        ? currentUser.displayName
                                        : (isAdmin ? "Admin Account" : (currentUser.email || "User"))}
                                </strong>
                                <span>
                                    {currentUser.email || ""}
                                </span>
                                <small>
                                    {isAdmin ? "Administrator" : "View Only Mode"}
                                </small>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="dashboard-logout-button"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>

            {/* =================================================
                CONTROL BAR (SEARCH & ADMIN NOTICE BANNER)
            ================================================= */}
            <div className="dashboard-control-bar">
                <div className="dashboard-search-wrapper">
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder="Search items, locations, or users..."
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(
                                event.target.value
                            )
                        }
                        className="dashboard-search"
                    />
                </div>
                {isAdmin && (
                    <div className="admin-notice">
                        <LockIcon />
                        <div>
                            <strong>Admin Controls Enabled:</strong>{" "}
                            <span>Claim requests auto-transfer upon approval. You can return claimed items or remove records.</span>
                        </div>
                    </div>
                )}
            </div>

            {/* =================================================
                2-COLUMN MAIN LAYOUT GRID
            ================================================= */}
            <div className="dashboard-main-grid">
                {/* LEFT COLUMN: SUMMARY CARDS, TABS & CONTENT FEEDS */}
                <div className="dashboard-left-column">
                    {/* USER REGISTRATION SUMMARY */}
                    <div className="registration-summary">
                        <div className="summary-card">
                            <div>
                                <p className="summary-label">
                                    Total Reported Items
                                </p>
                                <h3 className="summary-number">
                                    {totalItems}
                                </h3>
                            </div>
                            <span className="summary-icon">
                                <TotalItemsSummaryIcon />
                            </span>
                        </div>
                        <div className="summary-card">
                            <div>
                                <p className="summary-label">
                                    Total Users
                                </p>
                                <h3 className="summary-number">
                                    {users.length}
                                </h3>
                            </div>
                            <span className="summary-icon">
                                <TotalUsersSummaryIcon />
                            </span>
                        </div>
                    </div>

                    {/* TAB NAVIGATION + CATEGORY FILTER IN ONE CONTINUOUS GLASS CONTAINER */}
                    <div className="inventory-filter-shell">
                    <div className="tab-navigation">
                        {[
                            "Lost",
                            "Found",
                            "Claimed",
                            "Users"
                        ].map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() =>
                                    handleTabChange(tab)
                                }
                                className={`tab-button ${
                                    activeTab === tab
                                        ? "active"
                                        : ""
                                }`}
                            >
                                <span className={`tab-icon tab-icon-${tab.toLowerCase()}`} aria-hidden="true">
                                    {tab === "Lost" ? <LostSectionIcon /> : tab === "Found" ? <FoundSectionIcon /> : tab === "Claimed" ? <ClaimedSectionIcon /> : <UsersSectionIcon />}
                                </span>
                                {tab}
                                <span className="tab-badge">
                                    {getCount(tab)}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* CATEGORY FILTER DROPDOWN BAR */}
                    {activeTab !== "Users" && availableCategories.length > 0 && (
                        <div className="category-filter-bar">
                            <span className="category-filter-label">
                                <FilterIcon /> Category Filter:
                            </span>
                            <div className="category-dropdown-wrapper">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="category-dropdown-select"
                                >
                                    <option value="All">All Items ({currentTabSourceItems.length})</option>
                                    {availableCategories.map(([catName, count]) => (
                                        <option key={catName} value={catName}>
                                            {catName} ({count})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                    </div>

                    {/* USERS VIEW OR INVENTORY FEEDS */}
                    {activeTab === "Users" ? (
                        <>
                        <div className="inventory-heading-row users-heading-row">
                            <h3>
                                <span className="recent-items-cube" aria-hidden="true">♟</span>
                                Registered Users
                            </h3>
                            <button
                                type="button"
                                className="recent-items-view-all"
                                onClick={() => setSearchTerm("")}
                                aria-label="View all registered users"
                            >
                                View All
                            </button>
                        </div>
                        <div className="users-section">
                            {/* STUDENTS */}
                            <div className="students-group-wrapper">
                                <h3 className="section-heading">
                                    <StudentIcon /> Registered Students (By School)
                                </h3>
                                {Object.keys(studentsBySchool).length === 0 ? (
                                    <p className="empty-text">
                                        No students registered yet.
                                    </p>
                                ) : (
                                    Object.entries(studentsBySchool).map(([school, studentList]) => (
                                        <div key={school} className="school-group-card">
                                            <div className="school-heading-row">
                                                <h4 className="school-name">
                                                    <SchoolIcon /> {school}
                                                </h4>
                                                <span className="count-tag">
                                                    {studentList.length}
                                                </span>
                                            </div>
                                            <div className="user-grid">
                                                {studentList.map((student) => {
                                                    const name = student.fullName || student.displayName || student.name || "Unnamed Student";
                                                    const isUserProcessing = processingUserId === student.id;
                                                    return (
                                                        <div key={student.id} className="user-card" style={{ position: "relative" }}>
                                                            {isAdmin && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteUser(student)}
                                                                    disabled={isUserProcessing}
                                                                    title="Delete Student"
                                                                    className="btn-delete-user"
                                                                >
                                                                    {isUserProcessing ? "..." : <TrashIcon />}
                                                                </button>
                                                            )}
                                                            <div className="user-avatar">
                                                                {name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="user-info">
                                                                <p className="user-name">{name}</p>
                                                                <p className="user-email"><EmailIcon /> {student.email || "No email"}</p>
                                                                {student.studentId && <p className="user-meta"><IdBadgeIcon /> ID: {student.studentId}</p>}
                                                                {student.phone && <p className="user-meta"><PhoneIcon /> {student.phone}</p>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            {/* ADMINS */}
                            <div className="guests-group-wrapper">
                                <h3 className="section-heading guests-heading">
                                    <GuestIcon /> Registered Admin ({displayAdmins.length})
                                </h3>
                                {displayAdmins.length === 0 ? (
                                    <p className="empty-text">No Admin registered.</p>
                                ) : (
                                    <div className="user-grid">
                                        {displayAdmins.map((adminUser) => {
                                            const name = adminUser.fullName || adminUser.displayName || adminUser.name || "Unnamed Admin";
                                            const contact = adminUser.phone || adminUser.contact;
                                            const isUserProcessing = processingUserId === adminUser.id;
                                            return (
                                                <div key={adminUser.id} className="user-card guest-card" style={{ position: "relative" }}>
                                                    {isAdmin && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteUser(adminUser)}
                                                            disabled={isUserProcessing}
                                                            title="Delete Admin"
                                                            className="btn-delete-user"
                                                        >
                                                            {isUserProcessing ? "..." : <TrashIcon />}
                                                        </button>
                                                    )}
                                                    <div className="user-avatar guest-avatar">
                                                        {name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="user-info">
                                                        <p className="user-name">{name}</p>
                                                        <p className="user-email"><EmailIcon /> {adminUser.email || "No email"}</p>
                                                        {contact && <p className="user-meta"><PhoneIcon /> {contact}</p>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                        </>
                    ) : (
                        /* RECENT ITEMS - compact reference-style cards */
                        <>
                            <div className="inventory-heading-row">
                                <h3>
                                    <span className="recent-items-cube" aria-hidden="true">◆</span>
                                    {activeTab === "Claimed" ? "Claimed Items" : activeTab === "Found" ? "Found Items" : "Lost Items"}
                                </h3>
                                <button
                                    type="button"
                                    className="recent-items-view-all"
                                    onClick={() => {
                                        setSearchTerm("");
                                        setSelectedCategory("All");
                                        handleTabChange(activeTab);
                                    }}
                                    aria-label={`View all ${activeTab.toLowerCase()} items`}
                                >
                                    View All
                                </button>
                            </div>
                            <div className="content-grid">
                                {filteredItems.length === 0 ? (
                                    <div className="empty-state-card">
                                        <p>No reports found in this section.</p>
                                    </div>
                                ) : (
                                    filteredItems.map((item) => {
                                        const isProcessing = processingItemId === item.id;
                                        const locationDisplay = item.locationName || item.landmark || "No location provided";
                                        const categoryDisplay = item.category || "General Items";
                                        const dateTimeDisplay = formatDateTime(item);
                                        return (
                                            <div key={item.id} className="item-card">
                                                <div className="item-image-wrapper">
                                                    {item.imageUrl ? (
                                                        <img
                                                            src={item.imageUrl}
                                                            alt={item.itemName || "Reported item"}
                                                            className="item-image"
                                                            onError={(event) => {
                                                                event.currentTarget.style.display = "none";
                                                                if (event.currentTarget.nextElementSibling) {
                                                                    event.currentTarget.nextElementSibling.style.display = "flex";
                                                                }
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div
                                                        className="item-image-placeholder"
                                                        style={{ display: item.imageUrl ? "none" : "flex" }}
                                                    >
                                                        No Image
                                                    </div>
                                                </div>
                                                <div className="item-details">
                                                    <h3 className="item-name" title={item.itemName || "Unnamed Item"}>
                                                        <strong>Item name:</strong> {item.itemName || "Unnamed Item"}
                                                    </h3>
                                                    <span className={`recent-item-status ${activeTab.toLowerCase()}`}>
                                                        {activeTab === "Claimed" ? "Claimed" : (item.status || activeTab)}
                                                    </span>
                                                    <p className="item-timestamp" title={dateTimeDisplay}>
                                                        <span aria-hidden="true">◷</span> <strong>Date &amp; Time:</strong> {dateTimeDisplay}
                                                    </p>

                                                    <div className="recent-item-extra-details">
                                                        <p className="item-category"><strong>Category:</strong> {categoryDisplay}</p>
                                                        <p className="item-location"><strong>Location:</strong> {locationDisplay}</p>
                                                        <div className="recent-item-description-row">
                                                            <strong>Description:</strong>
                                                            <p className="item-description">{item.description || "No description provided"}</p>
                                                        </div>
                                                    </div>

                                                    {activeTab === "Claimed" && (
                                                        <div className="claimed-status">
                                                            <CheckIcon /> Claimed
                                                            {item.originalStatus && (
                                                                <span>Originally {item.originalStatus}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                {isAdmin && (
                                                    <div className="item-actions">
                                                        {activeTab === "Claimed" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleMoveToUnclaimed(item)}
                                                                disabled={isProcessing}
                                                                className="btn-mark-unclaimed"
                                                            >
                                                                {isProcessing ? "Processing..." : <><ReturnIcon /> Mark Unclaimed</>}
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(item)}
                                                            disabled={isProcessing}
                                                            className="btn-delete"
                                                        >
                                                            {isProcessing ? "..." : <><TrashIcon /> Delete</>}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* RIGHT COLUMN: STICKY ANALYTICS PANEL */}
                <div className="dashboard-right-column">
                    <div className="analytics-section">
                        {/* BAR CHART */}
                        <div className="analytics-panel-bar">
                            <h4 className="analytics-title">
                                Inventory Volume
                            </h4>
                            <div className="analytics-chart">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="rgba(6, 36, 56, 0.12)"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fill: "#08283e", fontSize: 12 }}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{ fill: "#08283e", fontSize: 12 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: "12px",
                                                background: "rgba(255, 255, 255, 0.95)",
                                                border: "1px solid rgba(255, 255, 255, 0.8)",
                                                color: "#062438"
                                            }}
                                        />
                                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`bar-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* PIE CHART */}
                        <div className="analytics-panel-circular">
                            <h4 className="analytics-title">
                                Share Distribution
                            </h4>
                            <div className="distribution-content">
                                <div className="donut-container">
                                    {totalItems === 0 ? (
                                        <div className="empty-donut">
                                            Empty
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    dataKey="count"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={36}
                                                    outerRadius={52}
                                                    paddingAngle={3}
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`pie-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                                <div className="metric-buttons">
                                    {chartData.map((item) => (
                                        <button
                                            key={item.name}
                                            type="button"
                                            onClick={() => handleTabChange(item.name)}
                                            className={`metric-button ${
                                                activeTab === item.name ? "metric-button-active" : ""
                                            }`}
                                            style={{ "--metric-color": item.color }}
                                        >
                                            <span className="metric-name">
                                                <span
                                                    className="metric-dot"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                {item.name}
                                            </span>
                                            <span className="metric-percentage">
                                                {getPercentage(item.count)}%
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;