import { onAuthStateChanged } from "firebase/auth";
import { 
    addDoc, 
    collection, 
    deleteDoc, 
    doc, 
    getDoc, 
    getDocs,
    onSnapshot, 
    orderBy, 
    query, 
    serverTimestamp, 
    setDoc, 
    updateDoc, 
    writeBatch 
} from "firebase/firestore";
import { useEffect, useRef, useState } from 'react';
import '../css/Messages.css';
import { auth, db } from '../firebase';

const DEFAULT_ICON = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
const CLOUDINARY_CLOUD_NAME = "dvfykqznw"; 
const CLOUDINARY_UPLOAD_PRESET = "messages";

function Messages() {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUserProfile, setCurrentUserProfile] = useState(null); 
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [contextMenu, setContextMenu] = useState(null);
    const [imageFile, setImageFile] = useState(null); 
    const [uploading, setUploading] = useState(false); 
    const [userProfilesMap, setUserProfilesMap] = useState({});
    
    const [searchTerm, setSearchTerm] = useState("");
    const [viewArchived, setViewArchived] = useState(false);
    const [undoToast, setUndoToast] = useState(null);

    const [activeUserClaims, setActiveUserClaims] = useState([]);

    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null); 
    const undoTimerRef = useRef(null);

    const selectedChatIdRef = useRef(null);
    useEffect(() => {
        selectedChatIdRef.current = selectedChat?.id || null;
    }, [selectedChat]);

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

    const deleteMessage = async (messageId) => {
        if (!currentUser || !selectedChat?.id) return;
        const chatId = selectedChat.id;

        try {
            await deleteDoc(doc(db, "messages", chatId, "replies", messageId));
            hideContextMenu();

            const repliesRef = collection(db, "messages", chatId, "replies");
            const remainingQuery = query(repliesRef, orderBy("timestamp", "desc"));
            const remainingSnap = await getDocs(remainingQuery);

            if (remainingSnap.empty) {
                await updateDoc(doc(db, "messages", chatId), {
                    message: "",
                    lastSenderRole: null,
                    timestamp: serverTimestamp()
                });
            } else {
                const lastReply = remainingSnap.docs[0].data();
                const lastReplyText = lastReply.imageUrl ? "📷 Sent an image" : (lastReply.text || "");
                const lastRole = lastReply.role || lastReply.sender || "student";

                await updateDoc(doc(db, "messages", chatId), {
                    message: lastReplyText,
                    lastSenderRole: lastRole,
                    timestamp: lastReply.timestamp || serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    const softDeleteConversation = async (chat) => {
        if (!currentUser || !chat?.id) return;
        hideContextMenu();

        const chatId = chat.id;

        try {
            await updateDoc(doc(db, "messages", chatId), {
                isDeleted: true,
                deletedAt: serverTimestamp()
            });
        } catch (err) {
            console.error("Error soft deleting in Firestore:", err);
        }

        setConversations(prev => prev.filter(c => c.id !== chatId));

        if (selectedChatIdRef.current === chatId) {
            setSelectedChat(null);
        }

        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

        setUndoToast({
            chatId: chatId,
            chatName: getChatName(chat)
        });

        undoTimerRef.current = setTimeout(async () => {
            await hardDeleteConversation(chatId);
            setUndoToast(null);
        }, 5000);
    };

    const handleUndoDelete = async () => {
        if (!undoToast?.chatId) return;
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

        const restoredChatId = undoToast.chatId;

        try {
            await updateDoc(doc(db, "messages", restoredChatId), {
                isDeleted: false
            });
        } catch (error) {
            console.error("Error restoring conversation:", error);
        } finally {
            setUndoToast(null);
        }
    };

    const hardDeleteConversation = async (conversationId) => {
        try {
            const batch = writeBatch(db);

            const repliesRef = collection(db, "messages", conversationId, "replies");
            const repliesSnapshot = await getDocs(repliesRef);
            repliesSnapshot.docs.forEach((replyDoc) => {
                batch.delete(doc(db, "messages", conversationId, "replies", replyDoc.id));
            });

            const claimsRef = collection(db, "messages", conversationId, "claims");
            const claimsSnapshot = await getDocs(claimsRef);
            claimsSnapshot.docs.forEach((claimDoc) => {
                batch.delete(doc(db, "messages", conversationId, "claims", claimDoc.id));
            });

            batch.delete(doc(db, "messages", conversationId));

            await batch.commit();
        } catch (error) {
            console.error("Error hard deleting conversation:", error);
        }
    };

    const toggleArchiveConversation = async (conversationId, currentArchiveStatus) => {
        if (!currentUser || !conversationId) return;
        try {
            await updateDoc(doc(db, "messages", conversationId), {
                isArchived: !currentArchiveStatus
            });
            hideContextMenu();
            if (selectedChatIdRef.current === conversationId) {
                setSelectedChat(null);
            }
        } catch (error) {
            console.error("Error archiving conversation:", error);
        }
    };

    const showContextMenu = (e, chatObj = null, isConversation = false, messageId = null) => {
        e.preventDefault();
        setContextMenu({ 
            x: e.pageX, 
            y: e.pageY, 
            chatObj, 
            isConversation, 
            messageId 
        });
    };

    const hideContextMenu = () => setContextMenu(null);

    useEffect(() => {
        let unsubscribeAdminProfile = () => {};

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                unsubscribeAdminProfile = onSnapshot(
                    userDocRef,
                    (userDocSnap) => {
                        if (userDocSnap.exists()) {
                            setCurrentUserProfile(userDocSnap.data());
                        }
                        setLoading(false);
                    },
                    (error) => {
                        console.error("Error fetching admin profile:", error);
                        setLoading(false);
                    }
                );
            } else {
                setCurrentUserProfile(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribeAdminProfile();
        };
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const usersCollectionRef = collection(db, "users");
        const unsubscribeUsers = onSnapshot(usersCollectionRef, (snapshot) => {
            const profilesMap = {};
            snapshot.docs.forEach((docSnap) => {
                profilesMap[docSnap.id] = docSnap.data();
            });
            setUserProfilesMap(profilesMap);
        });

        return () => unsubscribeUsers();
    }, [currentUser]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory, activeUserClaims]);

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const convos = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setConversations(convos);

            snapshot.docChanges().forEach((change) => {
                if (change.type === "modified") {
                    const data = change.doc.data();
                    if (data.isArchived && data.unread) {
                        updateDoc(doc(db, "messages", change.doc.id), {
                            isArchived: false,
                            lastSenderRole: 'student',
                            lastSender: 'student'
                        }).catch(err => console.error("Error auto-unarchiving chat:", err));
                    }
                }
            });

            if (selectedChatIdRef.current) {
                const currentId = selectedChatIdRef.current;
                const updatedSelected = convos.find(c => c.id === currentId && !c.isDeleted);
                if (updatedSelected) {
                    setSelectedChat(prev => {
                        if (JSON.stringify(prev) !== JSON.stringify(updatedSelected)) {
                            return updatedSelected;
                        }
                        return prev;
                    });
                } else {
                    setSelectedChat(null);
                }
            }
        });
        return () => unsubscribe();
    }, [currentUser]);

    const selectAndMarkRead = async (chat) => {
        setSelectedChat(chat);
        if (chat.unread) {
            try {
                await updateDoc(doc(db, "messages", chat.id), { unread: false });
            } catch (error) {
                console.error(error);
            }
        }
    };

    useEffect(() => {
        if (!selectedChat?.id) {
            setActiveUserClaims([]);
            setChatHistory([]);
            return;
        }
        
        const repliesQuery = query(
            collection(db, "messages", selectedChat.id, "replies"),
            orderBy("timestamp", "asc")
        );
        const unsubscribeReplies = onSnapshot(repliesQuery, (snapshot) => {
            setChatHistory(snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
        });

        const claimsRef = collection(db, "messages", selectedChat.id, "claims");
        const unsubscribeClaims = onSnapshot(claimsRef, (snapshot) => {
            const claimsList = snapshot.docs
                .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setActiveUserClaims(claimsList);
        });

        return () => {
            unsubscribeReplies();
            unsubscribeClaims();
        };
    }, [selectedChat?.id]);

    const handleUpdateClaimStatus = async (targetItemId, newStatus) => {
        if (!selectedChat?.id || !targetItemId) return;

        try {
            const claimDocRef = doc(db, "messages", selectedChat.id, "claims", targetItemId);
            
            await setDoc(claimDocRef, {
                itemId: targetItemId,
                status: newStatus,
                updatedAt: serverTimestamp()
            }, { merge: true });

            const reportDocRef = doc(db, "reports", targetItemId);
            const reportSnap = await getDoc(reportDocRef);

            let itemName = "Item";

            if (reportSnap.exists()) {
                const reportData = reportSnap.data();
                itemName = reportData?.itemName || reportData?.title || "Item";
                
                if (newStatus === "approved") {
                    // Automatically transfer the report to claimed_reports and delete it from reports
                    const batch = writeBatch(db);
                    const claimedRef = doc(db, "claimed_reports", targetItemId);

                    batch.set(claimedRef, {
                        ...reportData,
                        status: "Claimed",
                        originalStatus: reportData.status || "Lost",
                        claimedAt: serverTimestamp(),
                        claimedBy: selectedChat.userId || selectedChat.id || "",
                        claimedByEmail: selectedChat.email || ""
                    });

                    batch.delete(reportDocRef);
                    await batch.commit();
                } else {
                    await updateDoc(reportDocRef, {
                        status: "Unclaimed",
                        claimedBy: null,
                        updatedAt: serverTimestamp()
                    });
                }
            }

            const claimObj = activeUserClaims.find(c => c.id === targetItemId || c.itemId === targetItemId);
            if (claimObj?.itemName) {
                itemName = claimObj.itemName;
            }

            const formattedMessageText = `Claim request for "${itemName}" was ${newStatus.toUpperCase()} by Admin.`;

            await addDoc(collection(db, "messages", selectedChat.id, "replies"), {
                itemId: targetItemId,
                text: formattedMessageText,
                sender: "admin",
                senderId: currentUser.uid,
                senderName: getAdminFullName(),
                role: 'admin',
                timestamp: serverTimestamp()
            });

            await updateDoc(doc(db, "messages", selectedChat.id), {
                message: formattedMessageText,
                lastSenderRole: 'admin',
                lastSender: 'admin',
                timestamp: serverTimestamp(),
                unreadStudent: true
            });

        } catch (error) {
            console.error("Error updating claim status:", error);
            alert("Failed to update claim status: " + error.message);
        }
    };

    const uploadToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: "POST", body: formData }
        );

        if (!response.ok) throw new Error("Upload failed");
        const data = await response.json();
        return data.secure_url; 
    };

    const getChatName = (chatObj) => {
        if (!chatObj) return "";

        const liveProfile = userProfilesMap[chatObj.id] || userProfilesMap[chatObj.userId];
        if (liveProfile) {
            const liveFullName = liveProfile.fullName || `${liveProfile.firstName || ''} ${liveProfile.lastName || ''}`.trim();
            if (liveFullName) return liveFullName;
        }

        const first = chatObj.firstName || chatObj.firstname || "";
        const last = chatObj.lastName || chatObj.lastName || "";
        if (first || last) return `${first} ${last}`.trim();
        if (chatObj.fullName) return chatObj.fullName;
        if (chatObj.email) return chatObj.email.split('@')[0];
        return "Anonymous User";
    };

    const getChatAvatar = (chatObj) => {
        if (!chatObj) return DEFAULT_ICON;
        const liveProfile = userProfilesMap[chatObj.id] || userProfilesMap[chatObj.userId];
        if (liveProfile && liveProfile.photoURL) return liveProfile.photoURL;
        return chatObj.avatarUrl || chatObj.photoURL || DEFAULT_ICON;
    };

    const getIsUserOnline = (chatObj) => {
        if (!chatObj) return false;
        const liveProfile = userProfilesMap[chatObj.id] || userProfilesMap[chatObj.userId];
        if (liveProfile && liveProfile.isOnline !== undefined) {
            return liveProfile.isOnline === true;
        }
        return chatObj.isOnline === true;
    };

    const getAdminFullName = () => {
        if (!currentUserProfile) return currentUser?.displayName || "Admin";
        const fullName = currentUserProfile.fullName || `${currentUserProfile.firstName || ''} ${currentUserProfile.lastName || ''}`.trim();
        if (fullName) return fullName;
        return currentUser?.displayName || "Admin";
    };

    const handleSendMessage = async () => {
        if ((!replyText.trim() && !imageFile) || !selectedChat || !currentUser) return;
        
        try {
            setUploading(true);
            let imageUrl = null;

            if (imageFile) {
                imageUrl = await uploadToCloudinary(imageFile);
            }

            const finalSenderName = getAdminFullName();
            const messagePreviewText = imageUrl ? "📷 Sent an image" : replyText;
            
            await addDoc(collection(db, "messages", selectedChat.id, "replies"), {
                text: replyText || "",
                imageUrl: imageUrl, 
                sender: "admin",
                senderId: currentUser.uid,
                senderName: finalSenderName,
                role: 'admin',
                timestamp: serverTimestamp()
            });

            await updateDoc(doc(db, "messages", selectedChat.id), {
            status: "active",
            message: messagePreviewText,
            lastSenderRole: 'admin',
            lastSender: 'admin',
            timestamp: serverTimestamp(),
            unread: false,
            });

            setReplyText("");
            setImageFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
            alert("Failed to send reply");
        } finally {
            setUploading(false);
        }
    };

    /* FIXED PREVIEW FUNCTION TO ACCURATELY CHECK SENDER ROLE */
    const renderConvoPreview = (chat) => {
        if (!chat || !chat.message) return "";
        const text = chat.message;

        const isClaimRequest = text.includes("CLAIM REQUEST") || text.includes("requesting to claim");
        
        const isStudent = (
            chat.lastSenderRole === 'student' || 
            chat.lastSender === 'student' || 
            chat.sender === 'student' || 
            chat.role === 'student'
        );

        const isSentByAdmin = (
            chat.lastSenderRole === 'admin' || 
            chat.lastSender === 'admin'
        ) && !isStudent && !isClaimRequest;

        if (isSentByAdmin) {
            return (
                <>
                    You: {renderFormattedText(text)}
                </>
            );
        }

        return renderFormattedText(text);
    };

    const filteredConversations = conversations.filter((chat) => {
        if (chat.isDeleted) return false;
        const name = getChatName(chat).toLowerCase();
        const matchesSearch = name.includes(searchTerm.toLowerCase().trim());
        const isArchived = chat.isArchived === true;
        const matchesArchive = viewArchived ? isArchived : !isArchived;
        return matchesSearch && matchesArchive;
    });

    const renderFormattedText = (rawText) => {
        if (!rawText) return "";
        
        let cleanText = rawText
            .replace(/^[🛡️📢]\s*/, '')
            .replace(/^📢\s*CLAIM REQUEST:\s*/i, '')
            .replace(/^CLAIM REQUEST:\s*/i, '');

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

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    return (
        <div className={`messages-container ${selectedChat ? 'mobile-chat-active' : ''}`} onClick={hideContextMenu}>
            <div className="messages-sidebar">
                <div className="sidebar-header">
                    <h2>Messages</h2>
                    <button 
                        className="archive-toggle-btn"
                        onClick={() => setViewArchived(!viewArchived)}
                    >
                        {viewArchived ? "View Active" : "View Archived"}
                    </button>
                </div>

                <div className="search-bar-wrapper">
                    <input 
                        type="text" 
                        className="search-input-field"
                        placeholder="Search student name..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="conversation-list">
                    {filteredConversations.length > 0 ? (
                        filteredConversations.map((chat) => {
                            const formattedName = getChatName(chat);
                            const avatarUrl = getChatAvatar(chat);
                            const isOnline = getIsUserOnline(chat);

                            return (
                                <div 
                                    key={chat.id} 
                                    onClick={() => selectAndMarkRead(chat)}
                                    onContextMenu={(e) => showContextMenu(e, chat, true)}
                                    className={`convo-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                                >
                                    <div className="convo-avatar-wrapper">
                                        <img src={avatarUrl} alt="" className="convo-avatar" />
                                        {isOnline && <span className="online-status-dot" title="Online"></span>}
                                        {chat.unread && <span className="unread-badge"></span>}
                                    </div>
                                    <div className="convo-info">
                                        <strong>{formattedName}</strong>
                                        <p>{renderConvoPreview(chat)}</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="no-convos-found">
                            {viewArchived ? "No archived conversations." : "No matching conversations found."}
                        </div>
                    )}
                </div>
            </div>

            <div className="chat-main-area">
                {selectedChat ? (
                    <>
                        <div className="chat-header">
                            <button className="mobile-back-btn" onClick={() => setSelectedChat(null)}>
                                ← Back
                            </button>
                            <div className="chat-header-user">
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <img src={getChatAvatar(selectedChat)} alt="" className="header-avatar" />
                                    {getIsUserOnline(selectedChat) && <span className="online-status-dot header-online" title="Online"></span>}
                                </div>
                                <div>
                                    <h4>{getChatName(selectedChat)}</h4>
                                    <span>{selectedChat.email || "No email provided"}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="chat-history">
                            {chatHistory.map((msg) => {
                                const isYourMessage = msg.role === 'admin' || msg.sender === 'admin';
                                const isClaimMessage = msg.itemId || msg.isClaimRequest || msg.claimId || (msg.text && msg.text.toLowerCase().includes("requesting to claim"));
                                const targetItemId = msg.itemId || msg.claimId;
                                const matchingClaim = activeUserClaims.find(c => c.id === targetItemId || c.itemId === targetItemId);

                                return (
                                    <div key={msg.id} className={`msg-row ${isYourMessage ? 'msg-sent' : 'msg-received'}`} onContextMenu={(e) => showContextMenu(e, null, false, msg.id)}>
                                        {!isYourMessage && <img src={getChatAvatar(selectedChat)} alt="" className="msg-avatar" />}
                                        <div className={isYourMessage ? 'sent-container' : 'received-container'}>
                                            <div className={`msg-bubble ${isYourMessage ? 'sent' : 'received'}`}>
                                                {msg.imageUrl && (
                                                    <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                                        <img src={msg.imageUrl} alt="" className="message-image-attachment" />
                                                    </a>
                                                )}

                                                {msg.text && <span>{renderFormattedText(msg.text)}</span>}

                                                {isClaimMessage && !isYourMessage && targetItemId && (
                                                    <div className="claim-actions-wrapper">
                                                        {(!matchingClaim || matchingClaim.status === 'pending') ? (
                                                            <>
                                                                <button
                                                                    className="claim-btn approve-btn"
                                                                    onClick={() => handleUpdateClaimStatus(targetItemId, 'approved')}
                                                                >
                                                                    Approve Claim
                                                                </button>
                                                                <button
                                                                    className="claim-btn reject-btn"
                                                                    onClick={() => handleUpdateClaimStatus(targetItemId, 'rejected')}
                                                                >
                                                                    Reject Claim
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <div className={`claim-status-badge ${matchingClaim.status === 'approved' ? 'status-approved' : 'status-rejected'}`}>
                                                                {matchingClaim.status === 'approved' ? '✓ Claim Approved' : (matchingClaim.status === 'cancelled' || matchingClaim.status === 'canceled') ? '✕ Claim Cancelled' : '✕ Claim Rejected'}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="msg-time">
                                                {formatDateTime(msg.timestamp)}
                                                {isYourMessage && <span className="sender-tag">You</span>}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="chat-input-section">
                            {imageFile && (
                                <div className="image-preview-bar">
                                    <span>📷 Attachment: {imageFile.name}</span>
                                    <button onClick={() => { setImageFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}>✕</button>
                                </div>
                            )}

                            <div className="input-box-container">
                                <div className="input-with-sender">
                                    <label htmlFor="admin-file-upload" className="attachment-btn" title="Attach file">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                                        </svg>
                                    </label>
                                    <input 
                                        id="admin-file-upload" 
                                        type="file" 
                                        accept="image/*" 
                                        ref={fileInputRef}
                                        style={{ display: 'none' }} 
                                        onChange={(e) => setImageFile(e.target.files[0])}
                                        disabled={uploading}
                                    />
                                    <textarea 
                                        placeholder={uploading ? "Uploading..." : "Type your message..."} 
                                        value={replyText} 
                                        onChange={(e) => setReplyText(e.target.value)} 
                                        disabled={uploading}
                                        rows="1"
                                        onKeyDown={(e) => { 
                                            if(e.key === 'Enter' && !e.shiftKey) { 
                                                e.preventDefault(); 
                                                handleSendMessage(); 
                                            } 
                                        }}
                                    />
                                    <button 
                                        type="button"
                                        className="send-message-btn"
                                        onClick={handleSendMessage}
                                        disabled={uploading || (!replyText.trim() && !imageFile)}
                                        title="Send Message"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(45deg)', marginLeft: '-2px' }}>
                                            <line x1="22" y1="2" x2="11" y2="13"></line>
                                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                        </svg>
                                    </button>
                                    <span className="sender-tag-right">Admin</span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="empty-chat-state">
                        <p>Select a message to view details</p>
                    </div>
                )}
            </div>

            {contextMenu && (
                <div className="glass-context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
                    {contextMenu.isConversation && contextMenu.chatObj ? (
                        <>
                            <button onClick={() => toggleArchiveConversation(contextMenu.chatObj.id, contextMenu.chatObj.isArchived)}>
                                {contextMenu.chatObj.isArchived ? "Unarchive Conversation" : "Archive Conversation"}
                            </button>
                            <button className="delete-option" onClick={() => softDeleteConversation(contextMenu.chatObj)}>
                                Delete Conversation
                            </button>
                        </>
                    ) : (
                        <button className="delete-option" onClick={() => deleteMessage(contextMenu.messageId)}>
                            Delete Message
                        </button>
                    )}
                </div>
            )}

            {undoToast && (
                <div className="undo-toast-banner">
                    <span>Conversation with <strong>{undoToast.chatName}</strong> deleted.</span>
                    <button onClick={handleUndoDelete}>UNDO</button>
                </div>
            )}
        </div>
    );
}

export default Messages;