import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import HomeStudent from './HomeStudent'; // Adjust if HomeStudent is in the same folder

const CATEGORIES = [
    { id: "All", label: "All Categories", icon: "grid" },
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

export default function StudentDashboard() {
    // 1. Shared state for category selection (defaults to Personal Valuables)
    const [selectedCategory, setSelectedCategory] = useState("Personal Valuables");
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="student-dashboard-wrapper" style={{ minHeight: '100vh', background: '#071a2d' }}>
            {/* 2. Integrated Category Navigation Bar */}
            <div className="nav-student-subbar mb-3" style={{ padding: '12px 20px', background: 'rgba(7, 26, 45, 0.95)', borderBottom: '1px solid rgba(119, 141, 169, 0.25)' }}>
                <div className="container-fluid" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ color: '#93b2c9', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap' }}>Categories:</span>
                    <div style={{ flex: 1, overflowX: 'auto', display: 'flex', gap: '8px', scrollbarWidth: 'none' }}>
                        {CATEGORIES.map((cat) => {
                            const isActive = selectedCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    className={`category-pill ${isActive ? "active" : ""}`}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 14px',
                                        background: isActive ? 'linear-gradient(135deg, #415A77 0%, #1B263B 100%)' : 'rgba(27, 38, 59, 0.7)',
                                        border: isActive ? '1px solid #8da4c4' : '1px solid rgba(119, 141, 169, 0.25)',
                                        color: '#FFFFFF',
                                        fontSize: '0.78rem',
                                        fontWeight: '500',
                                        borderRadius: '50px',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <span>{cat.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 3. Pass selectedCategory into HomeStudent so the feed filters live */}
            <main className="student-main-container">
                <HomeStudent 
                    selectedCategory={selectedCategory} 
                    searchQuery={searchQuery} 
                />
            </main>
        </div>
    );
}