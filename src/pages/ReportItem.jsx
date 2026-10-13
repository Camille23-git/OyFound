import { addDoc, collection } from "firebase/firestore";
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import '../css/Report.css';

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

// Helper to get current Date (YYYY-MM-DD) and Time (HH:MM) in Philippines timezone
const getPhilippinesDateTime = () => {
    const now = new Date();

    const dateOptions = { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' };
    const dateParts = new Intl.DateTimeFormat('en-CA', dateOptions).formatToParts(now);
    const dateStr = `${dateParts.find(p => p.type === 'year').value}-${dateParts.find(p => p.type === 'month').value}-${dateParts.find(p => p.type === 'day').value}`;

    const timeOptions = { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: false };
    const timeParts = new Intl.DateTimeFormat('en-GB', timeOptions).formatToParts(now);
    const timeStr = `${timeParts.find(p => p.type === 'hour').value}:${timeParts.find(p => p.type === 'minute').value}`;

    return { date: dateStr, time: timeStr };
};

function ReportItem() {
    const navigate = useNavigate();
    const [itemStatus, setItemStatus] = useState('Lost');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [location] = useState({ lat: 0, lng: 0 }); 

    const phDateTime = getPhilippinesDateTime();

    const [formData, setFormData] = useState({
        itemName: '',
        category: 'Personal Valuables',
        locationName: '',
        date: phDateTime.date,
        time: phDateTime.time,
        description: ''
    });

    const fileInputRef = useRef(null);

    const uploadImageToCloudinary = async (file) => {
        const apiKey = "396127833722297"; 
        const cloudName = "dvfykqznw";
        const uploadPreset = "Oyfound"; 

        const body = new FormData();
        body.append("file", file);
        body.append("upload_preset", uploadPreset);
        body.append("api_key", apiKey);

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: "POST",
                body: body,
            });

            const result = await response.json();

            if (response.ok) {
                return result.secure_url; 
            } else {
                console.error("Cloudinary Error:", result.error);
                throw new Error(result.error.message || "Cloudinary Upload Failed");
            }
        } catch (error) {
            throw new Error(error.message || "Connection to Cloudinary failed.");
        }
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) setSelectedFile(e.target.files[0]);
    };

    const handleStatusChange = (status) => {
        setItemStatus(status);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsUploading(true); 
        
        try {
            let imageUrl = "";

            if (selectedFile) {
                imageUrl = await uploadImageToCloudinary(selectedFile);
            }

            await addDoc(collection(db, "reports"), {
                ...formData,
                status: itemStatus,
                imageUrl: imageUrl,
                location: { lat: location.lat, lng: location.lng },
                timestamp: new Date()
            });

            alert("Report Published successfully!");
            navigate('/admin');

        } catch (error) {
            console.error("Submission Error:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="report-page-container"> 
            <div className="report-item-box">
                <div className="form-header">
                    <h2 className="form-title">Submit a Report</h2>
                    <div className="status-selector">
                        <button 
                            type="button" 
                            className={`toggle-btn lost-btn ${itemStatus === 'Lost' ? 'selected' : ''}`} 
                            onClick={() => handleStatusChange('Lost')} 
                            disabled={isUploading}
                        >
                            Lost
                        </button>
                        <button 
                            type="button" 
                            className={`toggle-btn found-btn ${itemStatus === 'Found' ? 'selected' : ''}`} 
                            onClick={() => handleStatusChange('Found')} 
                            disabled={isUploading}
                        >
                            Found
                        </button>
                    </div>
                </div>

                <div className="status-banner">
                    Reporting a <strong className={itemStatus.toLowerCase()}>{itemStatus}</strong> item
                </div>
                
                <div className="report-item-wrapper">
                    <form className={`report-item-form ${isUploading ? 'form-faded' : ''}`} onSubmit={handleSubmit}>
                        
                        {isUploading && (
                            <div className="loading-overlay">
                                <div className="spinner"></div>
                                <p>Uploading report to OyFound...</p>
                            </div>
                        )}

                        <div className="form-grid">
                            <div className="input-block">
                                <label htmlFor="itemName">Item Name</label>
                                <input 
                                    type="text" 
                                    id="itemName" 
                                    placeholder="e.g. Blue Hydro Flask, Black Wallet"
                                    value={formData.itemName} 
                                    onChange={handleInputChange} 
                                    required 
                                    disabled={isUploading}
                                />
                            </div>

                            <div className="input-block">
                                <label htmlFor="category">Category</label>
                                <select 
                                    id="category" 
                                    value={formData.category} 
                                    onChange={handleInputChange} 
                                    disabled={isUploading}
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="input-block">
                            <label htmlFor="locationName">Location</label>
                            <input 
                                type="text" 
                                id="locationName" 
                                placeholder="e.g. 2nd floor building near Senior High Comlab"
                                value={formData.locationName} 
                                onChange={handleInputChange} 
                                required 
                                disabled={isUploading}
                            />
                        </div>

                        <div className="form-grid">
                            <div className="input-block">
                                <label htmlFor="date">Date</label>
                                <input 
                                    type="date" 
                                    id="date" 
                                    value={formData.date} 
                                    onChange={handleInputChange} 
                                    required 
                                    disabled={isUploading}
                                />
                            </div>

                            <div className="input-block">
                                <label htmlFor="time">Time</label>
                                <input 
                                    type="time" 
                                    id="time" 
                                    value={formData.time} 
                                    onChange={handleInputChange} 
                                    required 
                                    disabled={isUploading}
                                />
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="input-block description-box">
                                <label htmlFor="description">Description</label>
                                <textarea 
                                    id="description" 
                                    rows="3" 
                                    placeholder="Add distinct features, color, brand, condition..."
                                    value={formData.description} 
                                    onChange={handleInputChange} 
                                    disabled={isUploading}
                                ></textarea>
                            </div>

                            <div className="input-block">
                                <label htmlFor="file-input">Attach Image</label>
                                <div className="file-upload-wrapper">
                                    <input 
                                        type="file" 
                                        id="file-input"
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        accept="image/*" 
                                        disabled={isUploading}
                                    />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="final-report-btn" disabled={isUploading}>
                            {isUploading ? "Uploading..." : "Publish Report"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ReportItem;