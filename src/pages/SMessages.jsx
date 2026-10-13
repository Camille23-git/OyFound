import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from 'react';
import '../css/Messages.css';
import { auth, db } from '../firebase';

const DEFAULT_ICON = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
const CLOUDINARY_CLOUD_NAME = "dvfykqznw"; 
const CLOUDINARY_UPLOAD_PRESET = "messages";

function SMessages() {
    const adminProfile = {
        fullName: 'Support Admin',
        role: 'Representative',
        avatarUrl: DEFAULT_ICON, 
        greeting: "Hello! How can we help you today?"
    };

    const [selectedAdmin, setSelectedAdmin] = useState(adminProfile);
    const [studentMessage, setStudentMessage] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [userClaims, setUserClaims] = useState([]);
    const [imageFile, setImageFile] = useState(null); 
    const [uploading, setUploading] = useState(false); 
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null); 
    
    const user = auth.currentUser;
    const studentDocId = useMemo(() => user ? user.uid : null, [user]);

    const unreadCount = useMemo(() => {
        return chatHistory.filter(msg => {
            const isAdminMsg = msg.role !== 'student' && msg.sender !== 'student' && msg.senderId !== user?.uid;
            return isAdminMsg && (msg.unreadByStudent === true || msg.unread === true);
        }).length;
    }, [chatHistory, user?.uid]);

    const formatDateTime = (timestamp) => {
        if (!timestamp) return "Sending...";
        const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    useEffect(() => {
        if (!studentDocId || !user) return;
        const studentMsgRef = doc(db, "messages", studentDocId);
        setDoc(studentMsgRef, { unreadStudent: false }, { merge: true }).catch(() => {});
    }, [studentDocId, user]);

    useEffect(() => {
        if (!studentDocId || !user) return;

        const q = query(
            collection(db, "messages", studentDocId, "replies"),
            orderBy("timestamp", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setChatHistory(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })));
        });

        return () => unsubscribe();
    }, [studentDocId, user]);

    useEffect(() => {
        if (!user?.uid) return;
        const claimsQuery = query(collection(db, "messages", user.uid, "claims"));

        const unsubscribe = onSnapshot(claimsQuery, (snapshot) => {
            setUserClaims(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })));
        });

        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory]);

    const uploadToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: "POST", body: formData }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || "Cloudinary Upload Failed");
        }

        const data = await response.json();
        return data.secure_url; 
    };

    const handleSendToAdmin = async () => {
        if ((!studentMessage.trim() && !imageFile) || !user || !studentDocId) {
            alert("Please type a message or select an image.");
            return;
        }

        try {
            setUploading(true);
            let imageUrl = null;

            if (imageFile) {
                imageUrl = await uploadToCloudinary(imageFile);
            }

            let activeFirstName = "";
            let activeLastName = "";
            const activeEmail = user.email || "";

            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                activeFirstName = userData.firstName || userData.firstname || "";
                activeLastName = userData.lastName || userData.lastname || "";
            }

            if (!activeFirstName && !activeLastName && user.displayName) {
                const nameParts = user.displayName.split(" ");
                activeFirstName = nameParts[0] || "";
                activeLastName = nameParts.slice(1).join(" ") || "";
            }

            const finalStudentName = `${activeFirstName} ${activeLastName}`.trim() || activeEmail.split('@')[0] || "User";
            const mainDocRef = doc(db, "messages", studentDocId);

            await setDoc(mainDocRef, {
                firstName: activeFirstName,
                lastName: activeLastName,
                fullName: finalStudentName,
                email: activeEmail,
                avatarUrl: user.photoURL || DEFAULT_ICON,
                message: imageUrl ? "📷 Sent an image" : studentMessage, 
                timestamp: serverTimestamp(),
                unread: true,
                unreadStudent: false,
                isDeleted: false,
                isArchived: false,
                lastSenderRole: 'student',
                lastSender: 'student'
            }, { merge: true });

            await addDoc(collection(db, "messages", studentDocId, "replies"), {
                text: studentMessage || "",
                imageUrl: imageUrl, 
                sender: "student",
                senderName: finalStudentName,
                senderId: user.uid,
                role: 'student',
                timestamp: serverTimestamp(),
            });

            setStudentMessage("");
            setImageFile(null);
            if (fileInputRef.current) fileInputRef.current.value = ""; 
        } catch (error) {
            console.error(error);
            alert("Failed to send message.");
        } finally {
            setUploading(false);
        }
    };

    const renderFormattedText = (rawText) => {
        if (!rawText) return "";
        const cleanText = rawText.replace(/^[🛡️📢]\s*/, '');
        const lower = cleanText.toLowerCase();

        let statusWord = null;
        let color = "";

        if (lower.includes("approved")) {
            statusWord = "Approved";
            color = "#22c55e";
        } else if (lower.includes("rejected")) {
            statusWord = "Rejected";
            color = "#ef4444";
        } else if (lower.includes("cancelled") || lower.includes("canceled")) {
            statusWord = "Cancelled";
            color = "#ef4444";
        }

        if (statusWord) {
            return (
                <>
                    <span style={{ 
                        color: color, 
                        fontWeight: '700', 
                        marginRight: '6px',
                        display: 'inline-block'
                    }}>
                        [{statusWord}]
                    </span>
                    {cleanText}
                </>
            );
        }

        return cleanText;
    };

    if (!user) {
        return (
            <div className="messages-container login-prompt">
                <div className="login-overlay">
                    <div className="login-card">
                        <h2>Login Required</h2>
                        <p>Please log in to access support chat</p>
                        <button className="login-btn" onClick={() => window.location.href = '/login'}>Go to Login</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`messages-container ${selectedAdmin ? 'mobile-chat-active' : ''}`}>
            <div className="messages-sidebar">
                <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#062438', lineHeight: 1.2 }}>
                        Support Chat
                    </h2>
                    <small style={{ color: '#0284c7', display: 'block', marginTop: '4px', fontWeight: '500', fontSize: '0.85rem' }}>
                        You: {user.displayName || user.email}
                    </small>
                </div>
                <div className="conversation-list">
                    <div className={`convo-item ${selectedAdmin ? 'active' : ''}`} onClick={() => setSelectedAdmin(adminProfile)}>
                        <div className="convo-avatar-wrapper">
                            <img src={adminProfile.avatarUrl} alt="" className="convo-avatar" />
                            {unreadCount > 0 ? (
                                <span className="unread-badge" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '18px',
                                    height: '18px',
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    color: '#ffffff'
                                }}>
                                    {unreadCount}
                                </span>
                            ) : (
                                <span className="online-status-dot"></span>
                            )}
                        </div>
                        <div className="convo-info">
                            <strong>{adminProfile.fullName}</strong>
                            <p className="convo-preview" style={{ color: '#22c55e', fontWeight: '600' }}>Online</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="chat-main-area">
                {selectedAdmin ? (
                    <>
                        <div className="chat-header">
                            <button className="mobile-back-btn" onClick={() => setSelectedAdmin(null)}>
                                ← Back
                            </button>
                            <div className="chat-header-user">
                                <img src={adminProfile.avatarUrl} alt="" className="header-avatar" />
                                <div>
                                    <h4>{adminProfile.fullName}</h4>
                                    <span style={{ color: '#0284c7', fontWeight: '600' }}>{adminProfile.role}</span>
                                </div>
                            </div>
                        </div>

                        <div className="chat-history">
                            {chatHistory && chatHistory?.map((msg) => {
                                const isYourMessage = msg.role === 'student' || msg.sender === 'student' || msg.senderId === user.uid;

                                return (
                                    <div key={msg.id} className={`msg-row ${isYourMessage ? 'msg-sent' : 'msg-received'}`}>
                                        {!isYourMessage && <img src={adminProfile.avatarUrl} alt="" className="msg-avatar" />}
                                        <div className={isYourMessage ? 'sent-container' : 'received-container'}>
                                            <div className={`msg-bubble ${isYourMessage ? 'sent' : 'received'}`}>
                                                {msg.imageUrl && (
                                                    <img src={msg.imageUrl} alt="" className="message-image-attachment" />
                                                )}
                                                {msg.text && <span>{renderFormattedText(msg.text)}</span>}
                                            </div>
                                            <span className="msg-time">
                                                {formatDateTime(msg.timestamp)}
                                                {isYourMessage && <span className="sender-tag" style={{ marginLeft: '6px' }}>You</span>}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {chatHistory.length === 0 && (
                                <div className="msg-row msg-received">
                                    <img src={adminProfile.avatarUrl} alt="" className="msg-avatar" />
                                    <div className="received-container">
                                        <div className="msg-bubble">{adminProfile.greeting}</div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="chat-input-section">
                            {imageFile && (
                                <div className="attachment-preview-bar">
                                    <span>📷 Attachment: {imageFile.name}</span>
                                    <button onClick={() => { setImageFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}>✕</button>
                                </div>
                            )}

                            <div className="input-box-container">
                                <div className="input-with-sender">
                                    <label htmlFor="file-upload" className="attachment-btn" title="Attach an image">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                                        </svg>
                                    </label>
                                    <input 
                                        id="file-upload" 
                                        type="file" 
                                        accept="image/*" 
                                        ref={fileInputRef}
                                        style={{ display: 'none' }} 
                                        onChange={(e) => setImageFile(e.target.files[0])}
                                        disabled={uploading}
                                    />
                                    <textarea 
                                        placeholder={uploading ? "Uploading..." : "Type your message..."} 
                                        value={studentMessage}
                                        disabled={uploading}
                                        rows="1"
                                        onChange={(e) => setStudentMessage(e.value)}
                                        onKeyDown={(e) => { 
                                            if(e.key === 'Enter' && !e.shiftKey) { 
                                                e.preventDefault(); 
                                                handleSendToAdmin(); 
                                            } 
                                        }}
                                    />
                                    <span className="sender-tag-right">{user.displayName || user.email?.split('@')[0] || 'User'}</span>
                                </div>
                                <button className="send-btn" onClick={handleSendToAdmin} disabled={uploading || (!studentMessage.trim() && !imageFile)}>
                                    {uploading ? "..." : "Send"}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="empty-chat-state">
                        <p>Select Support to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SMessages;