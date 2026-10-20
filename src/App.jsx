
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";

import "./App.css";
import { auth, db } from "./firebase";

// Public pages
import ForgotPassword from "./components/Forgotpassword.jsx";
import Home from "./components/Home.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";

// Navigation
import NavAdmin from "./navbar/NavAdmin.jsx";
import Navbar from "./navbar/Navbar.jsx";
import NavStudent from "./navbar/NavStudent.jsx";

// Pages
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import EditProfile from "./pages/EditProfile.jsx";
import HomeAdmin from "./pages/HomeAdmin.jsx";
import HomeStudent from "./pages/HomeStudent.jsx";
import Messages from "./pages/Messages.jsx";
import Profile from "./pages/Profile.jsx";
import ReportItem from "./pages/ReportItem.jsx";
import SMessages from "./pages/SMessages.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";

// CSS
import "./css/About.css";
import "./css/AISupportPage.css";
import "./css/Contact.css";
import "./css/Dashboard.css";
import "./css/Footer.css";
import "./css/HomeAdmin.css";
import "./css/HomeStudent.css";
import "./css/Login.css";
import "./css/Messages.css";
import "./css/Navbar.css";
import "./css/NavStudent.css";
import "./css/Profile.css";
import "./css/Register.css";
import "./css/Report.css";
import "./css/SMessages.css";

function App() {
    const [role, setRole] = useState(
        () => localStorage.getItem("userRole") || null
    );

    const [authLoading, setAuthLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showContact, setShowContact] = useState(false);
    const [showAbout, setShowAbout] = useState(false);

    const location = useLocation();

    // Restore Firebase authentication and the user's role.
    useEffect(() => {
        let isMounted = true;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                if (isMounted) {
                    localStorage.removeItem("userRole");
                    setRole(null);
                    setAuthLoading(false);
                }
                return;
            }

            try {
                const userRef = doc(db, "users", user.uid);
                const userSnapshot = await getDoc(userRef);

                if (!isMounted) return;

                if (userSnapshot.exists()) {
                    const userData = userSnapshot.data();
                    const userRole = userData.role;

                    if (userRole === "admin" || userRole === "student") {
                        localStorage.setItem("userRole", userRole);
                        setRole(userRole);
                    } else {
                        localStorage.removeItem("userRole");
                        setRole(null);
                    }
                } else {
                    localStorage.removeItem("userRole");
                    setRole(null);
                }
            } catch (error) {
                console.error("Error restoring user role:", error);

                // Keep the cached role during a temporary Firestore error.
                if (isMounted) {
                    const cachedRole = localStorage.getItem("userRole");
                    setRole(
                        cachedRole === "admin" ||
                        cachedRole === "student"
                            ? cachedRole
                            : null
                    );
                }
            } finally {
                if (isMounted) {
                    setAuthLoading(false);
                }
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    // Preserve the requested route while authentication is initializing.
    if (authLoading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#E0E1DD",
                    color: "#1B263B",
                    fontFamily: "Poppins, sans-serif",
                }}
            >
                Loading OyFound...
            </div>
        );
    }

    const isStudent = role === "student";
    const isAdmin = role === "admin";
    const isAuthenticated = isStudent || isAdmin;

    // Guest access is preserved for the student-facing pages.
    const isGuest = role === "guest";

    return (
        <>
            {/* PUBLIC NAVBAR */}
            {!role && (
                <Navbar
                    onContact={() => setShowContact(true)}
                    onAbout={() => setShowAbout(true)}
                />
            )}

            {/* ADMIN NAVBAR */}
            {isAdmin && (
                <NavAdmin
                    setRole={setRole}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
            )}

            {/* STUDENT / GUEST NAVBAR */}
            {(isStudent || isGuest) && (
                <NavStudent
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
            )}

            {/* ROUTES */}
            <Routes>
                {/* Public */}
                <Route path="/" element={<Home />} />

                <Route
                    path="/login"
                    element={
                        isAuthenticated
                            ? <Navigate to={isAdmin ? "/admin" : "/student"} replace />
                            : <Login setRole={setRole} />
                    }
                />

                <Route
                    path="/register"
                    element={<Register setRole={setRole} />}
                />

                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                />

                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />

                {/* Admin */}
                <Route
                    path="/admin"
                    element={
                        isAdmin
                            ? <HomeAdmin searchQuery={searchQuery} />
                            : <Navigate to={isStudent ? "/student" : "/login"} replace />
                    }
                />

                <Route
                    path="/messages"
                    element={
                        isAdmin
                            ? <Messages />
                            : <Navigate to={isStudent ? "/student" : "/login"} replace />
                    }
                />

                <Route
                    path="/dashboard"
                    element={
                        isAdmin
                            ? <Dashboard />
                            : <Navigate to={isStudent ? "/student" : "/login"} replace />
                    }
                />

                <Route
                    path="/report"
                    element={
                        isAdmin
                            ? <ReportItem />
                            : <Navigate to={isStudent ? "/student" : "/login"} replace />
                    }
                />

                {/* Student */}
                <Route
                    path="/student"
                    element={
                        isStudent || isGuest
                            ? <HomeStudent searchQuery={searchQuery} />
                            : <Navigate to={isAdmin ? "/admin" : "/login"} replace />
                    }
                />

                <Route
                    path="/studentdashboard"
                    element={
                        isStudent || isGuest
                            ? <StudentDashboard />
                            : <Navigate to={isAdmin ? "/admin" : "/login"} replace />
                    }
                />

                <Route
                    path="/studentmessages"
                    element={
                        isStudent || isGuest
                            ? <SMessages />
                            : <Navigate to={isAdmin ? "/admin" : "/login"} replace />
                    }
                />

                {/* Shared authenticated pages */}
                <Route
                    path="/profile"
                    element={
                        isAuthenticated
                            ? <Profile setRole={setRole} />
                            : <Navigate to="/login" replace />
                    }
                />

                <Route
                    path="/edit-profile"
                    element={
                        isAuthenticated
                            ? <EditProfile setRole={setRole} />
                            : <Navigate to="/login" replace />
                    }
                />

                {/* Fallback: preserve access to known route groups */}
                <Route
                    path="*"
                    element={
                        location.pathname.startsWith("/admin") ||
                        location.pathname === "/messages" ||
                        location.pathname === "/dashboard" ||
                        location.pathname === "/report"
                            ? <Navigate to={isAdmin ? "/admin" : "/login"} replace />
                            : location.pathname.startsWith("/student")
                                ? <Navigate to={isStudent || isGuest ? "/student" : "/login"} replace />
                                : <Navigate to="/" replace />
                    }
                />
            </Routes>

            {/* CONTACT POPUP */}
            {showContact && (
                <div
                    className="popup-overlay"
                    onClick={() => setShowContact(false)}
                >
                    <div onClick={(event) => event.stopPropagation()}>
                        <Contact onClose={() => setShowContact(false)} />
                    </div>
                </div>
            )}

            {/* ABOUT POPUP */}
            {showAbout && (
                <div
                    className="popup-overlay"
                    onClick={() => setShowAbout(false)}
                >
                    <div onClick={(event) => event.stopPropagation()}>
                        <About onClose={() => setShowAbout(false)} />
                    </div>
                </div>
            )}
        </>
    );
}

export default App;
