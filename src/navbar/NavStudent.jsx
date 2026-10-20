import { onAuthStateChanged } from "firebase/auth";
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    setDoc,
    writeBatch
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import logo from "../assets/OYFD.png";
import "../css/NavStudent.css";
import { auth, db } from "../firebase";

const DEFAULT_ICON = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

// Sub-component for individual notification item supporting mobile swipe-to-dismiss
function NotificationItem({ item, onDelete, user }) {
    const [translateX, setTranslateX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const touchStartX = useRef(0);

    const handleTouchStart = (e) => {
        if (window.innerWidth > 576) return;
        touchStartX.current = e.touches[0].clientX;
        setIsSwiping(true);
    };

    const handleTouchMove = (e) => {
        if (!isSwiping || window.innerWidth > 576) return;
        const currentX = e.touches[0].clientX;
        const diffX = currentX - touchStartX.current;
        setTranslateX(diffX);
    };

    const handleTouchEnd = (e) => {
        if (!isSwiping || window.innerWidth > 576) return;
        setIsSwiping(false);

        // Swipe threshold of 80px to dismiss
        if (Math.abs(translateX) > 80) {
            onDelete(e, item.id);
        } else {
            setTranslateX(0);
        }
    };

    return (
        <div
            className={`nav-student-notification-item ${!item.isRead ? "unread" : ""}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transform: `translateX(${translateX}px)`,
                opacity: 1 - Math.abs(translateX) / 250,
                transition: isSwiping ? 'none' : 'transform 0.2s ease-out, opacity 0.2s ease-out'
            }}
        >
            <div>
                <div className="nav-student-notification-title">
                    Claim {item.status === "approved" ? "Approved" : "Rejected"}
                </div>
                <div className="nav-student-notification-text">
                    Your claim for "{item.itemName}" was {item.status}.
                </div>
            </div>
            <button
                type="button"
                onClick={(e) => onDelete(e, item.id)}
                style={{
                    border: 'none',
                    background: 'none',
                    color: '#dc3545',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s'
                }}
                title="Dismiss notification"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
            </button>
        </div>
    );
}

export default function NavStudent({ searchQuery = "", setSearchQuery = () => {} }) {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const [notifications, setNotifications] = useState([]);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

    const isInitialNotifLoad = useRef(true);
    const notifDropdownRef = useRef(null);

    useEffect(() => {
        return onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) setUserData(null);
        });
    }, []);

    useEffect(() => {
        if (!user?.uid) return;
        const userRef = doc(db, "users", user.uid);
        return onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
                setUserData(snapshot.data());
            } else {
                setUserData({
                    fullName: user.displayName || "",
                    email: user.email || "",
                    photoURL: user.photoURL || DEFAULT_ICON,
                });
            }
        });
    }, [user]);

    useEffect(() => {
        if (!user?.uid) {
            setUnreadCount(0);
            return;
        }

        const msgDocRef = doc(db, "messages", user.uid);
        return onSnapshot(msgDocRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setUnreadCount(data.unreadStudent ? 1 : 0);
            } else {
                setUnreadCount(0);
            }
        });
    }, [user]);

    useEffect(() => {
        if (!user?.uid) {
            setNotifications([]);
            setUnreadNotifCount(0);
            return;
        }

        const claimsQuery = query(collection(db, "messages", user.uid, "claims"));

        return onSnapshot(
            claimsQuery,
            async (snapshot) => {
                const updatedList = [];
                let unreadCounter = 0;

                for (const docSnap of snapshot.docs) {
                    const data = docSnap.data();
                    const status = data.status?.toLowerCase();

                    if ((status === "approved" || status === "rejected") && !data.dismissedByStudent) {
                        const isRead = data.isReadByStudent ?? false;
                        if (!isRead) unreadCounter++;

                        let resolvedItemName = data.itemName || data.title;

                        // Retrieve the specific item name from reports if omitted on claim document
                        if (!resolvedItemName) {
                            const targetItemId = data.itemId || docSnap.id;
                            if (targetItemId) {
                                try {
                                    const reportSnap = await getDoc(doc(db, "reports", targetItemId));
                                    if (reportSnap.exists()) {
                                        const reportData = reportSnap.data();
                                        resolvedItemName = reportData.itemName || reportData.title;
                                    }
                                } catch (err) {
                                    console.error("Error fetching report details for notification:", err);
                                }
                            }
                        }

                        updatedList.push({
                            id: docSnap.id,
                            itemName: resolvedItemName || "Item",
                            status: status,
                            updatedAt: data.updatedAt?.toDate
                                ? data.updatedAt.toDate()
                                : new Date(),
                            isRead: isRead,
                        });
                    }
                }

                updatedList.sort((a, b) => b.updatedAt - a.updatedAt);
                setNotifications(updatedList);
                setUnreadNotifCount(unreadCounter);
                isInitialNotifLoad.current = false;
            }
        );
    }, [user]);

    const toggleNotifDropdown = () => {
        setIsNotifDropdownOpen((prev) => !prev);
        if (!isNotifDropdownOpen) {
            setUnreadNotifCount(0);
        }
    };

    const handleDeleteNotif = async (e, notifId) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        if (!user?.uid || !notifId) return;

        setNotifications((prev) => prev.filter((item) => item.id !== notifId));

        try {
            const notifDocRef = doc(db, "messages", user.uid, "claims", notifId);
            await setDoc(notifDocRef, {
                dismissedByStudent: true,
                isReadByStudent: true
            }, { merge: true });
        } catch (error) {
            console.error("Error hiding notification:", error);
        }
    };

    const handleClearAllNotifs = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!user?.uid || notifications.length === 0) return;

        setNotifications([]);

        try {
            const batch = writeBatch(db);
            notifications.forEach((item) => {
                const notifRef = doc(db, "messages", user.uid, "claims", item.id);
                batch.set(notifRef, {
                    dismissedByStudent: true,
                    isReadByStudent: true
                }, { merge: true });
            });
            await batch.commit();
        } catch (error) {
            console.error("Error clearing notifications:", error);
        }
    };

    const fullName =
        userData?.fullName ||
        `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim() ||
        user?.displayName ||
        "User";

    const profilePhoto = userData?.photoURL || user?.photoURL || DEFAULT_ICON;

    return (
        <nav className="navbar navbar-expand-lg nav-student-navbar">
            <div className="container-fluid nav-student-container">
                <Link className="nav-student-brand" to="/student">
                    <img src={logo} alt="OyFound Logo" className="nav-student-logo" />
                </Link>

                <button 
                    className="navbar-toggler nav-student-toggler" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#studentNavbar" 
                    aria-controls="studentNavbar" 
                    aria-expanded="false" 
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="studentNavbar">
                    <form className="d-flex mx-lg-4 nav-student-search-form" onSubmit={(e) => e.preventDefault()}>
                        <input
                            type="search"
                            className="form-control search-bar"
                            placeholder="Search lost and found items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>

                    <ul className="navbar-nav ms-auto align-items-lg-center">
                        <li className="nav-item nav-student-notification-wrapper me-lg-2" ref={notifDropdownRef}>
                            <button 
                                type="button" 
                                className="nav-student-notification-btn" 
                                onClick={toggleNotifDropdown}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    position: 'relative',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                <svg 
                                    width="20" 
                                    height="20" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                >
                                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                                </svg>
                                {unreadNotifCount > 0 && (
                                    <span className="nav-student-notification-badge badge bg-danger rounded-pill">
                                        {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
                                    </span>
                                )}
                            </button>

                            {isNotifDropdownOpen && (
                                <div className="nav-student-notification-dropdown">
                                    <div className="nav-student-notification-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h6 style={{ margin: 0 }}>Notifications</h6>
                                            <span className="nav-student-notification-count">{notifications.length} updates</span>
                                        </div>
                                        {notifications.length > 0 && (
                                            <button type="button" onClick={handleClearAllNotifs} style={{ background: 'none', border: 'none', color: '#d32f2f', fontSize: '12px', cursor: 'pointer', fontWeight: '700' }}>
                                                Clear All
                                            </button>
                                        )}
                                    </div>

                                    <div className="nav-student-notification-list">
                                        {notifications.length === 0 ? (
                                            <div className="nav-student-notification-empty">No claim updates yet.</div>
                                        ) : (
                                            notifications.map((item) => (
                                                <NotificationItem
                                                    key={item.id}
                                                    item={item}
                                                    onDelete={handleDeleteNotif}
                                                    user={user}
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </li>

                        <li className="nav-item">
                            <Link className="nav-link nav-student-messages-link" to="/studentmessages">
                                Messages
                                {unreadCount > 0 && (
                                    <span className="badge bg-danger rounded-pill ms-1 nav-student-message-badge">
                                        {unreadCount > 99 ? "99+" : unreadCount}
                                    </span>
                                )}
                            </Link>
                        </li>

                        <li className="nav-item ms-lg-3 ps-lg-3 border-start nav-student-user-section">
                            <Link className="nav-student-profile-link d-flex align-items-center gap-2 text-decoration-none" to="/profile">
                                <img src={profilePhoto} alt={fullName} className="nav-student-profile-image rounded-circle" />
                                <span className="nav-student-user-name">{fullName}</span>
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}