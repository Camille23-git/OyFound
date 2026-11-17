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
import { Link, useLocation } from "react-router-dom";

import logo from "../assets/FOUND.png";
import "../css/NavStudent.css";
import { auth, db } from "../firebase";

const DEFAULT_ICON = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const CATEGORIES = [
    { id: "All", label: "All Items", icon: "grid" },
    { id: "Personal Valuables", label: "Valuables", icon: "shield" },
    { id: "Electronics", label: "Electronics", icon: "cpu" },
    { id: "Keys & Accessories", label: "Keys & Acc.", icon: "key" },
    { id: "Sports Equipment", label: "Sports", icon: "activity" },
    { id: "Containers & Bottles", label: "Bottles", icon: "coffee" },
    { id: "Documents & IDs", label: "IDs & Docs", icon: "file-text" },
    { id: "Bags & Luggage", label: "Bags", icon: "briefcase" },
    { id: "Apparel & Accessories", label: "Apparel", icon: "tag" },
    { id: "General Items", label: "General", icon: "box" }
];

function CategoryIcon({ name }) {
    switch (name) {
        case "grid":
            return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
        case "shield":
            return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
        case "cpu":
            return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/></svg>;
        case "key":
            return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;
        case "activity":
            return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
        case "coffee":
            return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
        case "file-text":
            return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
        case "briefcase":
            return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
        case "tag":
            return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
        case "box":
            return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
        default:
            return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
    }
}

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
            <div className="nav-student-notification-content">
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
                className="toast-close-btn"
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

export default function NavStudent({ 
    selectedCategory,
    setSelectedCategory
}) {
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const [activeCategory, setActiveCategory] = useState(() => {
        return selectedCategory || localStorage.getItem("selectedStudentCategory") || "All";
    });

    const [searchText, setSearchText] = useState(() => {
        return localStorage.getItem("studentSearchQuery") || "";
    });

    const [notifications, setNotifications] = useState([]);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

    const isInitialNotifLoad = useRef(true);
    const notifDropdownRef = useRef(null);

    // Check if we are currently on the Home / Dashboard page where items are posted
    const isHomeDashboard = location.pathname === "/student" || location.pathname === "/";

    useEffect(() => {
        if (selectedCategory !== undefined) {
            setActiveCategory(selectedCategory);
        }
    }, [selectedCategory]);

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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
                setIsNotifDropdownOpen(false);
            }
        };

        if (isNotifDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isNotifDropdownOpen]);

    useEffect(() => {
        const handleScroll = () => {
            if (isNotifDropdownOpen && window.innerWidth <= 991) {
                setIsNotifDropdownOpen(false);
            }
        };

        if (isNotifDropdownOpen) {
            window.addEventListener("scroll", handleScroll, { passive: true });
        }

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [isNotifDropdownOpen]);

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
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        if (!user?.uid || notifications.length === 0) return;

        const currentNotifs = [...notifications];
        setNotifications([]);

        try {
            const batch = writeBatch(db);
            currentNotifs.forEach((item) => {
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

    const handleCategorySelect = (categoryId) => {
        setActiveCategory(categoryId);
        if (typeof setSelectedCategory === "function") {
            setSelectedCategory(categoryId);
        }
        localStorage.setItem("selectedStudentCategory", categoryId);
        window.dispatchEvent(new Event("storage"));
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchText(value);
        localStorage.setItem("studentSearchQuery", value);
        window.dispatchEvent(new Event("storage"));
    };

    const handleClearSearch = () => {
        setSearchText("");
        localStorage.setItem("studentSearchQuery", "");
        window.dispatchEvent(new Event("storage"));
    };

    const fullName =
        userData?.fullName ||
        `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim() ||
        user?.displayName ||
        "User";

    const profilePhoto = userData?.photoURL || user?.photoURL || DEFAULT_ICON;

    return (
        <div className="nav-student-wrapper">
            {/* Main Navbar Row */}
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

                    <div className="collapse navbar-collapse justify-content-end" id="studentNavbar">
                        <ul className="navbar-nav align-items-lg-center nav-student-menu-list">
                            <li className="nav-item nav-student-notification-wrapper me-lg-2" ref={notifDropdownRef}>
                                <button 
                                    type="button" 
                                    className="nav-student-notification-btn" 
                                    onClick={toggleNotifDropdown}
                                >
                                    <svg 
                                        width="19" 
                                        height="19" 
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
                                    <span className="nav-student-mobile-label">Notifications</span>
                                    {unreadNotifCount > 0 && (
                                        <span className="nav-student-notification-badge">
                                            {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
                                        </span>
                                    )}
                                </button>

                                {isNotifDropdownOpen && (
                                    <div className="nav-student-notification-dropdown">
                                        <div className="nav-student-notification-header">
                                            <div>
                                                <h6>Notifications</h6>
                                                <span className="nav-student-notification-count">{notifications.length} updates</span>
                                            </div>
                                            {notifications.length > 0 && (
                                                <button type="button" className="nav-student-notification-mark-read" onClick={handleClearAllNotifs}>
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

                                        <div className="nav-student-notification-footer">
                                            <Link to="/student" onClick={() => setIsNotifDropdownOpen(false)}>
                                                View all campus items
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </li>

                            <li className="nav-item nav-student-messages-wrapper">
                                <Link className="nav-link nav-student-messages-link" to="/studentmessages">
                                    <svg className="nav-student-msg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                    <span>Messages</span>
                                    {unreadCount > 0 && (
                                        <span className="badge bg-danger rounded-pill ms-1 nav-student-message-badge">
                                            {unreadCount > 99 ? "99+" : unreadCount}
                                        </span>
                                    )}
                                </Link>
                            </li>

                            <li className="nav-item ms-lg-3 ps-lg-3 border-start nav-student-user-section">
                                <Link className="nav-student-profile-link" to="/profile">
                                    <img src={profilePhoto} alt={fullName} className="nav-student-profile-image rounded-circle" />
                                    <span className="nav-student-user-name">{fullName}</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            {/* Sub-Bar (Search Bar & Category Pills) - VISIBLE ONLY ON HOME DASHBOARD */}
            {isHomeDashboard && (
                <div className="nav-student-subbar">
                    <div className="container-fluid nav-student-subbar-container">
                        <div className="category-filter-container mx-auto">
                            <div className="category-filter-scroll justify-content-lg-center">
                                {/* Glassmorphic Search Input */}
                                <div className="nav-student-search-box">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="nav-student-search-icon">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                    <input
                                        type="text"
                                        className="nav-student-search-input"
                                        placeholder="Search items, location..."
                                        value={searchText}
                                        onChange={handleSearchChange}
                                    />
                                    {searchText && (
                                        <button
                                            type="button"
                                            className="nav-student-search-clear"
                                            onClick={handleClearSearch}
                                            title="Clear search"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {/* Clickable Category Pills */}
                                {CATEGORIES.map((cat) => {
                                    const isActive = activeCategory === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            className={`category-pill ${isActive ? "active" : ""}`}
                                            onClick={() => handleCategorySelect(cat.id)}
                                        >
                                            <span className="pill-icon">
                                                <CategoryIcon name={cat.icon} />
                                            </span>
                                            <span className="pill-text">{cat.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}