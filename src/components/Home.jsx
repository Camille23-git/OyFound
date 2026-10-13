import React from "react";
import { useNavigate } from "react-router-dom";

import "../css/Home.css";

function Home() {
    const navigate = useNavigate();

    const goToLogin = () => {
        navigate("/login");
    };

    return (
        <main className="home-page">

            {/* BACKGROUND GLOW */}
            <div className="hero-background"></div>

            {/* PHOTOREALISTIC FLOATING LOST ITEMS */}

            {/* 1. PHOTOREALISTIC SMARTPHONE */}
            <div className="lost-item phone-item phone-left">
                <svg viewBox="0 0 120 240" className="real-item-svg">
                    <defs>
                        <filter id="shadowPhone" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="4" dy="12" stdDeviation="8" floodColor="#000000" floodOpacity="0.5" />
                        </filter>
                        <linearGradient id="phoneBody" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4a5560" />
                            <stop offset="30%" stopColor="#252d34" />
                            <stop offset="100%" stopColor="#0b0e11" />
                        </linearGradient>
                        <linearGradient id="phoneScreen" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1e2933" />
                            <stop offset="100%" stopColor="#070a0d" />
                        </linearGradient>
                        <linearGradient id="glassReflection" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
                            <stop offset="25%" stopColor="rgba(255,255,255,0.15)" />
                            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
                        </linearGradient>
                    </defs>

                    {/* Outer Body & Rim */}
                    <rect x="4" y="4" width="112" height="232" rx="24" fill="url(#phoneBody)" stroke="#6b7c8a" strokeWidth="1.2" filter="url(#shadowPhone)" />
                    
                    {/* Screen Frame */}
                    <rect x="8" y="8" width="104" height="224" rx="20" fill="url(#phoneScreen)" />
                    
                    {/* Screen Wallpaper Accent Glow */}
                    <circle cx="60" cy="120" r="45" fill="#3b82f6" opacity="0.15" filter="blur(10px)" />
                    
                    {/* Dynamic Island Notch */}
                    <rect x="42" y="14" width="36" height="10" rx="5" fill="#000000" />
                    <circle cx="48" cy="19" r="2.2" fill="#0d151c" stroke="#1f2d3a" strokeWidth="0.8" />

                    {/* Glossy Glass Specular Highlight */}
                    <path d="M 8,28 L 112,8 L 112,60 L 8,160 Z" fill="url(#glassReflection)" opacity="0.7" />
                </svg>
            </div>

            {/* 2. PHOTOREALISTIC STAINLESS TUMBLER */}
            <div className="lost-item tumbler-item">
                <svg viewBox="0 0 100 240" className="real-item-svg">
                    <defs>
                        <filter id="shadow3D" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="5" dy="15" stdDeviation="6" floodColor="#000" floodOpacity="0.45" />
                        </filter>
                        <linearGradient id="tumblerMetal" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#2e382b" />
                            <stop offset="20%" stopColor="#677a5b" />
                            <stop offset="45%" stopColor="#b4c7a8" />
                            <stop offset="55%" stopColor="#eaf5e4" />
                            <stop offset="80%" stopColor="#55664b" />
                            <stop offset="100%" stopColor="#1f261d" />
                        </linearGradient>
                        <linearGradient id="chromeRim" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#4a5568" />
                            <stop offset="35%" stopColor="#ffffff" />
                            <stop offset="65%" stopColor="#a0aec0" />
                            <stop offset="100%" stopColor="#2d3748" />
                        </linearGradient>
                    </defs>

                    {/* Lid Carry Loop */}
                    <path d="M35 16 C35 2, 65 2, 65 16" fill="none" stroke="#1c2118" strokeWidth="7" strokeLinecap="round" />
                    
                    {/* Lid Cap */}
                    <rect x="20" y="14" width="60" height="20" rx="5" fill="#2d3627" stroke="#151a12" strokeWidth="1" filter="url(#shadow3D)" />
                    
                    {/* Metallic Neck Band */}
                    <rect x="18" y="34" width="64" height="9" rx="2" fill="url(#chromeRim)" />

                    {/* Insulated Flask Body */}
                    <path d="M20 43 L80 43 L76 225 C76 233, 24 233, 24 225 Z" fill="url(#tumblerMetal)" filter="url(#shadow3D)" />

                    {/* Matte Silicone Grip Sleeve */}
                    <rect x="20" y="105" width="60" height="35" fill="#1b2118" opacity="0.8" />
                    <line x1="20" y1="105" x2="80" y2="105" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    <line x1="20" y1="140" x2="80" y2="140" stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
                </svg>
            </div>

            {/* 3. PHOTOREALISTIC GLASSES */}
            <div className="lost-item glasses-item">
                <svg viewBox="0 0 160 80" className="real-item-svg">
                    <defs>
                        <filter id="glassGlow">
                            <feDropShadow dx="2" dy="8" stdDeviation="5" floodColor="#000" floodOpacity="0.4" />
                        </filter>
                        <linearGradient id="frameMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4a5d6e" />
                            <stop offset="50%" stopColor="#1e262e" />
                            <stop offset="100%" stopColor="#0a0d10" />
                        </linearGradient>
                        <linearGradient id="lensGlare" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
                            <stop offset="40%" stopColor="rgba(255,255,255,0.1)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                        </linearGradient>
                    </defs>

                    {/* Left Frame & Glass */}
                    <rect x="10" y="15" width="62" height="48" rx="14" fill="rgba(255,255,255,0.12)" stroke="url(#frameMetallic)" strokeWidth="4.5" filter="url(#glassGlow)" />
                    <rect x="13" y="18" width="56" height="42" rx="11" fill="url(#lensGlare)" />

                    {/* Right Frame & Glass */}
                    <rect x="88" y="15" width="62" height="48" rx="14" fill="rgba(255,255,255,0.12)" stroke="url(#frameMetallic)" strokeWidth="4.5" filter="url(#glassGlow)" />
                    <rect x="91" y="18" width="56" height="42" rx="11" fill="url(#lensGlare)" />

                    {/* Nose Bridge */}
                    <path d="M72 26 Q80 18 88 26" fill="none" stroke="url(#frameMetallic)" strokeWidth="4" strokeLinecap="round" />

                    {/* Hinges & Temple Arms */}
                    <path d="M10 22 C -5 20, -2 42, -6 58" fill="none" stroke="url(#frameMetallic)" strokeWidth="3" />
                    <path d="M150 22 C 165 20, 162 42, 166 58" fill="none" stroke="url(#frameMetallic)" strokeWidth="3" />
                </svg>
            </div>

            {/* 4. PHOTOREALISTIC LEATHER WALLET */}
            <div className="lost-item wallet-item">
                <svg viewBox="0 0 180 130" className="real-item-svg">
                    <defs>
                        <filter id="walletShadow">
                            <feDropShadow dx="3" dy="10" stdDeviation="6" floodColor="#000" floodOpacity="0.45" />
                        </filter>
                        <linearGradient id="leatherTexture" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#5c6f75" />
                            <stop offset="40%" stopColor="#38474c" />
                            <stop offset="100%" stopColor="#1a2326" />
                        </linearGradient>
                        <linearGradient id="goldCard" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ffe8b5" />
                            <stop offset="50%" stopColor="#c7a159" />
                            <stop offset="100%" stopColor="#785a22" />
                        </linearGradient>
                    </defs>

                    {/* Main Leather Body */}
                    <rect x="6" y="10" width="168" height="110" rx="16" fill="url(#leatherTexture)" stroke="#7b939c" strokeWidth="0.8" filter="url(#walletShadow)" />
                    
                    {/* Real Stitching Effect */}
                    <rect x="11" y="15" width="158" height="100" rx="12" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeDasharray="3 2" />

                    {/* Pocket Fold Layer */}
                    <path d="M18 38 Q90 48 162 38 L162 105 L18 105 Z" fill="#243034" stroke="#485c63" strokeWidth="0.8" />

                    {/* Inserted Credit Card */}
                    <g transform="rotate(-5 100 35)">
                        <rect x="75" y="14" width="72" height="44" rx="5" fill="url(#goldCard)" filter="url(#walletShadow)" />
                        {/* EMV Chip */}
                        <rect x="85" y="24" width="11" height="9" rx="2" fill="#fff3d1" stroke="#8a692b" strokeWidth="0.8" />
                    </g>

                    {/* Leather Clasp Strap */}
                    <path d="M162 50 L180 50 Q186 50 186 65 Q186 80 180 80 L162 80 Z" fill="#28353a" stroke="#526870" strokeWidth="1" />
                    <circle cx="176" cy="65" r="4.5" fill="url(#goldCard)" />
                </svg>
            </div>

            {/* 5. PHOTOREALISTIC KEYCHAIN */}
            <div className="lost-item keys-item">
                <svg viewBox="0 0 120 120" className="real-item-svg">
                    <defs>
                        <filter id="keyShadow">
                            <feDropShadow dx="3" dy="8" stdDeviation="4" floodColor="#000" floodOpacity="0.4" />
                        </filter>
                        <linearGradient id="silverKeyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="50%" stopColor="#b0c0ce" />
                            <stop offset="100%" stopColor="#4a5966" />
                        </linearGradient>
                        <linearGradient id="brassKeyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fff3cd" />
                            <stop offset="50%" stopColor="#d4aa55" />
                            <stop offset="100%" stopColor="#6e501a" />
                        </linearGradient>
                    </defs>

                    {/* Metallic Split Ring */}
                    <circle cx="45" cy="35" r="22" fill="none" stroke="url(#silverKeyGrad)" strokeWidth="4.5" filter="url(#keyShadow)" />

                    {/* Leather Key Fob */}
                    <rect x="62" y="15" width="42" height="26" rx="6" fill="#091b29" stroke="#486275" strokeWidth="1.2" filter="url(#keyShadow)" />

                    {/* Brass Key */}
                    <g transform="rotate(-22 45 35)" filter="url(#keyShadow)">
                        <circle cx="45" cy="62" r="12" fill="url(#brassKeyGrad)" />
                        <circle cx="45" cy="62" r="4" fill="#0f171d" />
                        <rect x="42" y="74" width="6" height="38" fill="url(#brassKeyGrad)" />
                        <path d="M48 88 L52 88 L48 94 L53 94 L48 100 L51 100 L48 106" fill="url(#brassKeyGrad)" />
                    </g>

                    {/* Silver Key */}
                    <g transform="rotate(28 45 35)" filter="url(#keyShadow)">
                        <circle cx="45" cy="62" r="12" fill="url(#silverKeyGrad)" />
                        <circle cx="45" cy="62" r="4" fill="#0f171d" />
                        <rect x="42" y="74" width="6" height="38" fill="url(#silverKeyGrad)" />
                        <path d="M48 88 L52 88 L48 94 L53 94 L48 100 L51 100 L48 106" fill="url(#silverKeyGrad)" />
                    </g>
                </svg>
            </div>

            {/* 6. PHOTOREALISTIC SMART WATCH */}
            <div className="lost-item smartwatch-item">
                <svg viewBox="0 0 100 220" className="real-item-svg">
                    <defs>
                        <filter id="watchShadow">
                            <feDropShadow dx="4" dy="12" stdDeviation="6" floodColor="#000" floodOpacity="0.5" />
                        </filter>
                        <linearGradient id="watchBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#435866" />
                            <stop offset="100%" stopColor="#141c22" />
                        </linearGradient>
                        <linearGradient id="strapGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#1a252c" />
                            <stop offset="50%" stopColor="#3d515e" />
                            <stop offset="100%" stopColor="#11181d" />
                        </linearGradient>
                    </defs>

                    {/* Top Strap */}
                    <rect x="28" y="10" width="44" height="60" rx="8" fill="url(#strapGrad)" />
                    {/* Bottom Strap */}
                    <rect x="28" y="150" width="44" height="60" rx="8" fill="url(#strapGrad)" />

                    {/* Metallic Casing */}
                    <rect x="12" y="55" width="76" height="90" rx="22" fill="url(#watchBodyGrad)" stroke="#5d778a" strokeWidth="1.2" filter="url(#watchShadow)" />

                    {/* Curved Screen */}
                    <rect x="20" y="63" width="60" height="74" rx="16" fill="#080d10" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
                    
                    {/* Screen Glare Reflection */}
                    <polygon points="20,63 80,63 45,137 20,137" fill="rgba(255,255,255,0.25)" />

                    {/* UI Display Element */}
                    <rect x="30" y="94" width="40" height="12" rx="4" fill="#38bdf8" opacity="0.85" />

                    {/* Rotary Crown Dial */}
                    <rect x="88" y="88" width="5" height="20" rx="2" fill="#5d778a" stroke="#12181c" strokeWidth="0.5" />
                </svg>
            </div>

            {/* 7. PHOTOREALISTIC BACKPACK */}
            <div className="lost-item bag-item">
                <svg viewBox="0 0 200 250" className="real-item-svg">
                    <defs>
                        <filter id="bagShadow">
                            <feDropShadow dx="5" dy="15" stdDeviation="8" floodColor="#000" floodOpacity="0.5" />
                        </filter>
                        <linearGradient id="fabricGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#55697a" />
                            <stop offset="60%" stopColor="#2c3b47" />
                            <stop offset="100%" stopColor="#121a21" />
                        </linearGradient>
                    </defs>

                    {/* Top Handle Loop */}
                    <path d="M75 35 C75 8, 125 8, 125 35" fill="none" stroke="#10171d" strokeWidth="12" strokeLinecap="round" />

                    {/* Padded Shoulder Straps */}
                    <path d="M30 40 L12 220" stroke="#162028" strokeWidth="20" strokeLinecap="round" />
                    <path d="M170 40 L188 220" stroke="#162028" strokeWidth="20" strokeLinecap="round" />

                    {/* Backpack Body */}
                    <rect x="20" y="32" width="160" height="206" rx="42" fill="url(#fabricGradient)" stroke="#10171d" strokeWidth="1.5" filter="url(#bagShadow)" />

                    {/* Zipper Rim */}
                    <path d="M38 58 Q100 42 162 58" fill="none" stroke="#8da0b3" strokeWidth="3" strokeDasharray="5 3" />

                    {/* Front Pocket */}
                    <rect x="35" y="120" width="130" height="100" rx="18" fill="#1e2a33" stroke="rgba(255,255,255,0.15)" strokeWidth="1" filter="url(#bagShadow)" />
                    <line x1="48" y1="136" x2="152" y2="136" stroke="#7e93a6" strokeWidth="3" strokeDasharray="4 2" />

                    {/* Leather Badge */}
                    <rect x="130" y="185" width="22" height="15" rx="3" fill="#b89353" stroke="#523e1b" strokeWidth="1" />
                </svg>
            </div>

            {/* MAIN CONTENT CARD */}
            <section className="hero-content">
                <h1>
                    WELCOME TO
                    <span>OYFOUND!</span>
                </h1>

                <p className="hero-description">
                    A Smart Web-Based Platform for Reporting
                    and Recovering Lost Items
                </p>

                <p className="hero-tagline">
                    “Helping You Find Lost Items and Bring Them Back Home.”
                </p>

                <button
                    type="button"
                    className="get-started-button"
                    onClick={goToLogin}
                >
                    Get Started
                </button>
            </section>

            {/* FOOTER */}
            <footer className="home-footer">
                <p className="text-start">2026 @Copyright Oyfound rights</p>
            </footer>

        </main>
    );
}

export default Home;