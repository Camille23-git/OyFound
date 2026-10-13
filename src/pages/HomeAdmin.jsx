import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    updateDoc
} from "firebase/firestore";
import { useEffect, useState } from 'react';
import { db } from '../firebase';

const CATEGORIES = [
    "Personal Valuables",
    "Electronics",
    "Keys & Accessories",
    "Sports Equipment",
    "Containers & Bottles",
    "Documents & IDs",
    "Bags & Luggage",
    "Apparel & Accessories",
    "General Items"
];

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

function HomeAdmin() {
    const [reports, setReports] = useState([]);
    const [selectedImg, setSelectedImg] = useState(null);
    
    const [editingReport, setEditingReport] = useState(null);
    const [editFormData, setEditFormData] = useState({
        itemName: '',
        category: '',
        locationName: '',
        landmark: '',
        description: '',
        status: '',
        date: '',
        time: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const reportsArr = [];
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const status = (data.status || "").toLowerCase();

                // Exclude items that have already been approved or claimed
                if (status !== "approved" && status !== "claimed") {
                    reportsArr.push({ ...data, id: docSnap.id });
                }
            });
            setReports(reportsArr);
        });
        return () => unsubscribe();
    }, []);
    const handleOpenEditModal = (report) => {
        setEditingReport(report);
        setEditFormData({
            itemName: report.itemName || '',
            category: report.category || 'General Items',
            locationName: report.locationName || '',
            landmark: report.landmark || '',
            description: report.description || '',
            status: report.status || 'Lost',
            date: report.date || '',
            time: report.time || ''
        });
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editingReport) return;

        setIsSaving(true);
        try {
            const newStatus = editFormData.status;
            const reportRef = doc(db, "reports", editingReport.id);

            // Calculate formatted time if time was provided
            const formattedTime = editFormData.time ? convert24To12h(editFormData.time) : '';

            // 1. Update main report document status & date/time
            await updateDoc(reportRef, {
                itemName: editFormData.itemName,
                category: editFormData.category,
                locationName: editFormData.locationName,
                landmark: editFormData.landmark,
                description: editFormData.description,
                status: newStatus,
                date: editFormData.date,
                time: editFormData.time,
                timeFormatted: formattedTime
            });

            // 2. If marked as Unclaimed, Lost, or Found, wipe all student claim approvals for this item across user subcollections safely
            const isUnclaimedState = 
                newStatus.toLowerCase() === "unclaimed" || 
                newStatus.toLowerCase() === "lost" || 
                newStatus.toLowerCase() === "found";

            if (isUnclaimedState) {
                try {
                    const usersSnap = await getDocs(collection(db, "users"));
                    const deletePromises = [];

                    usersSnap.docs.forEach((userDoc) => {
                        const claimRef = doc(db, "messages", userDoc.id, "claims", editingReport.id);
                        deletePromises.push(deleteDoc(claimRef).catch(() => {}));
                    });

                    if (editingReport.claimedBy) {
                        const directClaimRef = doc(db, "messages", editingReport.claimedBy, "claims", editingReport.id);
                        deletePromises.push(deleteDoc(directClaimRef).catch(() => {}));
                    }

                    await Promise.all(deletePromises);
                } catch (cleanErr) {
                    console.warn("Could not sweep existing claims, but report was saved:", cleanErr);
                }
            }

            alert(`Report updated to "${newStatus}"! ${isUnclaimedState ? "Item is now restored to Active Reports." : ""}`);
            setEditingReport(null);
        } catch (error) {
            console.error("Error updating report:", error);
            alert("Failed to update report: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="home-admin-container">
            {selectedImg && (
                <div className="image-modal-overlay" onClick={() => setSelectedImg(null)}>
                    <div className="modal-content">
                        <span className="close-modal" onClick={() => setSelectedImg(null)}>&times;</span>
                        <img src={selectedImg} alt="Full size" />
                    </div>
                </div>
            )}

            {/* EDIT REPORT MODAL */}
            {editingReport && (
                <div className="edit-modal-overlay" onClick={() => setEditingReport(null)}>
                    <div className="edit-modal-box" onClick={(e) => e.stopPropagation()}>
                        <button className="close-edit-btn" onClick={() => setEditingReport(null)}>&times;</button>
                        <h2 className="edit-modal-title">Edit Report</h2>
                        
                        <form onSubmit={handleSaveEdit} className="edit-modal-form">
                            <div className="edit-input-group">
                                <label>Item Name</label>
                                <input 
                                    type="text" 
                                    value={editFormData.itemName} 
                                    onChange={(e) => setEditFormData({...editFormData, itemName: e.target.value})} 
                                    required 
                                />
                            </div>

                            <div className="edit-input-group">
                                <label>Category</label>
                                <select 
                                    value={editFormData.category} 
                                    onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="edit-input-group">
                                <label>Location</label>
                                <input 
                                    type="text" 
                                    value={editFormData.locationName || editFormData.landmark} 
                                    onChange={(e) => setEditFormData({
                                        ...editFormData, 
                                        locationName: e.target.value,
                                        landmark: e.target.value
                                    })} 
                                    required 
                                />
                            </div>

                            <div className="edit-input-group">
                                <label>Date</label>
                                <input 
                                    type="date" 
                                    value={editFormData.date} 
                                    onChange={(e) => setEditFormData({...editFormData, date: e.target.value})} 
                                />
                            </div>

                            <div className="edit-input-group">
                                <label>Time</label>
                                <input 
                                    type="time" 
                                    value={editFormData.time} 
                                    onChange={(e) => setEditFormData({...editFormData, time: e.target.value})} 
                                />
                            </div>

                            <div className="edit-input-group">
                                <label>Description</label>
                                <textarea 
                                    rows="3" 
                                    value={editFormData.description} 
                                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                                ></textarea>
                            </div>

                            <div className="edit-input-group">
                                <label>Status</label>
                                <select 
                                    value={editFormData.status} 
                                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                                >
                                    <option value="Lost">Lost</option>
                                    <option value="Found">Found</option>
                                    <option value="Unclaimed">Unclaimed</option>
                                    <option value="Claimed">Claimed</option>
                                </select>
                            </div>

                            <div className="edit-modal-actions">
                                <button 
                                    type="button" 
                                    className="edit-cancel-btn"
                                    onClick={() => setEditingReport(null)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="edit-save-btn"
                                    disabled={isSaving}
                                >
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <main className="admin-main-content w-100">
                <header className="content-header">
                    <h1>Recent Reports</h1>
                </header>

                <div className="dashboard-widgets">
                    {reports.length === 0 ? (
                        <div className="empty-state-card">
                            <p>No active reports found.</p>
                        </div>
                    ) : (
                        <div className="reports-grid">
                            {reports.map((report) => {
                                const locationDisplay = report.locationName || report.landmark || 'Not specified';
                                const categoryDisplay = report.category || 'General Items';
                                const dateTimeDisplay = formatDateTime(report);

                                return (
                                    <div key={report.id} className="admin-card-container">
                                        <div 
                                            className="admin-card-left"
                                            onClick={() => report.imageUrl && setSelectedImg(report.imageUrl)}
                                            style={{ cursor: report.imageUrl ? 'zoom-in' : 'default' }}
                                        >
                                            {report.imageUrl ? (
                                                <img src={report.imageUrl} alt={report.itemName} className="admin-card-image" />
                                            ) : (
                                                <div className="placeholder-box">350 x 250</div>
                                            )}
                                        </div>
                                        
                                        <div className="admin-card-right">
                                            <h3 className="card-item-title" title={report.itemName}>
                                                <strong>Item name:</strong> {report.itemName}
                                            </h3>
                                            <p className="card-info-text">
                                                <strong>Category:</strong> {categoryDisplay}
                                            </p>
                                            <p className="card-info-text card-info-location" title={locationDisplay}>
                                                <strong>Location:</strong> {locationDisplay}
                                            </p>
                                            <p className="card-info-text">
                                                <strong>Date & Time:</strong> {dateTimeDisplay}
                                            </p>
                                            <div className="card-description-box">
                                                <strong>Description:</strong>
                                                <p className="description-text">{report.description || 'No description provided.'}</p>
                                            </div>

                                            <div className="card-actions-row">
                                                <span className={`status-pill status-${report.status ? report.status.toLowerCase() : ''}`}>
                                                    STATUS:{report.status ? report.status.toUpperCase() : 'UNKNOWN'}
                                                </span>
                                                <button 
                                                    className="action-btn claim-btn"
                                                    onClick={() => handleOpenEditModal(report)}
                                                >
                                                    Edit Report
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default HomeAdmin;