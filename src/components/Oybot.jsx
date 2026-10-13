import { useEffect, useRef, useState } from 'react';
import '../css/Oybot.css';

// Read API Key from environment variables (.env)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Default initial state for chat messages
const INITIAL_MESSAGE = [
    {
        id: 1,
        sender: "bot",
        text: "Hello! I am OyBot. How can I help you today?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
];

// Smart Fallback Engine for offline mode or general questions when API is inactive
const getSmartFallbackReply = (userPrompt) => {
    const text = userPrompt.toLowerCase().trim();

    // Language detection helpers
    const isBisaya = /kinsa|asa|unsa|unsaon|tan-awon|kuhaon|storya|pahibalo|salamat|buntag|hapon|gabiie|nako|kaila|pasensya/.test(text);
    const isTagalog = /sino|saan|ano|paano|tingnan|kunin|kausapin|patalastas|salamat|umaga|hapon|gabi|ako|kilala|pasensya|patawad/.test(text);

    // Apologies: "sorry" / "pasensya" / "patawad"
    if (/sorry|pasensya|patawad|my bad|apologies|apologize/.test(text)) {
        if (isBisaya) return "Walay problema! Dili kinahanglan nga mangayo kag pasensya. Unsaon tika pagtabang karon?";
        if (isTagalog) return "Walang problema! Hindi mo kailangang magpaumanhin. Paano kita matutulungan ngayon?";
        return "No need to apologize at all! How can I help you today?";
    }

    // Proof Verification: "Will admin ask me about the item to verify proof?"
    if (/verify.*proof|proof.*ownership|admin.*ask.*item|verify.*item|ask.*details|proof/i.test(text)) {
        if (isBisaya) return "Oo, mangutana ang administrator bahin sa mga detalye sa imong nawala nga item (sama sa brand, kolor, o uban pang ilhanan) aron ma-verify ang imong proof of ownership.";
        if (isTagalog) return "Oo, magtatanong ang administrator tungkol sa mga detalye ng iyong nawawalang gamit (tulad ng brand, kulay, o natatanging marka) para ma-verify ang iyong proof of ownership.";
        return "Yes, the administrator will ask you for specific details about your lost item (such as its brand, color, or distinctive marks) to verify your proof of ownership.";
    }

    // Personal identity question: "You know me?" / "Kilala mo ako?" / "Kaila ka nako?"
    if (/you know me|do you know me|who am i|kilala mo (ba )?ako|kaila (ba )?ka nako|kaila ka nako/.test(text)) {
        if (isBisaya) return "Ako si OyBot, ang AI assistant sa OyFound. Wala koy access sa imong personal nga impormasyon o mga rekor para sa imong privacy.";
        if (isTagalog) return "Ako si OyBot, ang AI assistant ng OyFound. Wala akong access sa iyong personal na impormasyon o mga rekord para sa iyong privacy.";
        return "I am OyBot, the AI assistant for OyFound. I don't access or store your personal identity details to protect your privacy, but I'm here to help you!";
    }

    // Gratitude / Thank You
    if (/thank|thanks|ty|appreciated|salamat|daghang salamat|mabalos/.test(text)) {
        if (isBisaya) return "Walay sapayan! Pagpahibalo lang kon naa pa kay ubang pangutana.";
        if (isTagalog) return "Walang anuman! Sabihin mo lang kung may iba ka pang kailangan.";
        return "You are very welcome! Let me know if you need anything else.";
    }

    // Farewells / Goodbye
    if (/bye|goodbye|cya|paalam|babay|adios|see you|good night|goodnight/.test(text)) {
        if (isBisaya) return "Babay! Mag-amping ka kanunay.";
        if (isTagalog) return "Paalam! Mag-iingat ka palagi.";
        return "Goodbye! Have a great day ahead!";
    }

    // Exact Greeting Mirroring
    let greetingPrefix = "";
    if (/good\s*morning|maayong\s*buntag|magandang\s*umaga/.test(text)) {
        greetingPrefix = isBisaya ? "Maayong buntag! " : isTagalog ? "Magandang umaga! " : "Good morning! ";
    } else if (/good\s*afternoon|maayong\s*hapon|magandang\s*hapon/.test(text)) {
        greetingPrefix = isBisaya ? "Maayong hapon! " : isTagalog ? "Magandang hapon! " : "Good afternoon! ";
    } else if (/good\s*evening|maayong\s*gabiie|magandang\s*gabi/.test(text)) {
        greetingPrefix = isBisaya ? "Maayong gabiie! " : isTagalog ? "Magandang gabi! " : "Good evening! ";
    } else if (/hello|hi|hey|sup|greetings|ola|wazzup|bud|yo|kamusta|kumusta/.test(text)) {
        greetingPrefix = isBisaya ? "Hello! " : isTagalog ? "Hello! " : "Hello! ";
    }

    // OYFOUND SPECIFIC INQUIRIES
    if (/how to use|unsaon paggamit|paano gamitin|guide|how oyfound works/.test(text)) {
        if (isBisaya) return `${greetingPrefix}Aron magamit ang OyFound, i-browse ang mga gipost nga items sa Home page. Kon naa kay nakit-an nga imoha, i-click ang 'Claim Item' ug sunda ang verification sa Messages.`;
        if (isTagalog) return `${greetingPrefix}Para gamitin ang OyFound, i-browse ang mga pino-post na items sa Home page. Kapag nahanap mo ang gamit mo, i-click ang 'Claim Item' at sundan ang verification sa Messages.`;
        return `${greetingPrefix}To use OyFound, browse the item listings posted by administrators on the Home page. If you spot your item, click 'Claim Item' and follow the verification process in Messages.`;
    }

    if (/who.*admin|who.*administrator|administrators|admins|kinsa.*admin|sino.*admin/.test(text)) {
        if (isBisaya) return `${greetingPrefix}Ang OyFound kay gidumala sa mga authorized faculty members, school personnel, school heads, ug designated developers.`;
        if (isTagalog) return `${greetingPrefix}Ang OyFound ay pinangangasiwaan ng mga authorized faculty members, school personnel, school heads, at designated developers.`;
        return `${greetingPrefix}OyFound is administered by authorized faculty members, school personnel, school heads, and designated developers.`;
    }

    if (/onsite|office|where to claim|where to pick|where to get|physical location|where.*claim|asa.*kuhaon|saan.*kukunin/.test(text)) {
        if (isBisaya) return `${greetingPrefix}Aron makakuha ug item onsite, pakibisita ang campus Administrator Office o pakigsulti sa admin pinaagi sa support chat sa OyFound.`;
        if (isTagalog) return `${greetingPrefix}Para mag-claim ng item onsite, bisitahin ang campus Administrator Office o makipag-ugnayan sa admin gamit ang support chat ng OyFound.`;
        return `${greetingPrefix}To claim an item onsite, please visit the campus Administrator Office or coordinate directly with an administrator through OyFound's support chat for location details.`;
    }

    if (/communicate|contact|talk|speak|chat|message|pakig-chat|makipag-usap|pakigsulti/.test(text)) {
        if (isBisaya) return `${greetingPrefix}Makahimo ka sa pakig-storya sa mga administrator gamit ang support chat sa Messages panel.`;
        if (isTagalog) return `${greetingPrefix}Maaari kang makipag-usap sa mga administrator gamit ang support chat ng Messages panel.`;
        return `${greetingPrefix}You can communicate directly with administrators using OyFound's support chat feature in the Messages panel.`;
    }

    if (/status|verify|pending|approved|check|tan-awon|tingnan|status.*claim/.test(text)) {
        if (isBisaya) return `${greetingPrefix}Pwede nimo tan-awon ug i-verify ang status sa imong claim sa Messages section sa OyFound. Mag-update kini automatic kon ma-review na sa admin.`;
        if (isTagalog) return `${greetingPrefix}Maaari mong tingnan at i-verify ang status ng iyong claim sa Messages section ng OyFound. Kusang mag-uupdate ito kapag na-review na ng admin.`;
        return `${greetingPrefix}You can check and verify your claim status under the Messages section in OyFound. It updates automatically once reviewed by an administrator.`;
    }

    if (/claim|get my item|receive|kuhaon|kunin/.test(text)) {
        if (isBisaya) return `${greetingPrefix}Aron mag-claim ug item, i-browse ang listings sa Home page, i-click ang 'Claim Item', ug e-check ang claim status sa Messages.`;
        if (isTagalog) return `${greetingPrefix}Para mag-claim ng item, i-browse ang listings sa Home page, i-click ang 'Claim Item', at i-check ang claim status sa Messages.`;
        return `${greetingPrefix}To claim an item, browse the listings posted by administrators on the Home page, click 'Claim Item', and check your claim status in Messages.`;
    }

    // Standard Greetings alone
    if (greetingPrefix.trim().length > 0) {
        if (isBisaya) return `${greetingPrefix}Ako si OyBot, imong AI assistant. Unsaon tika pagtabang karon?`;
        if (isTagalog) return `${greetingPrefix}Ako si OyBot, ang AI assistant mo. Paano kita matutulungan ngayon?`;
        return `${greetingPrefix}I am OyBot, your AI assistant. How can I help you today?`;
    }

    // GENERAL KNOWLEDGE FALLBACK
    if (isBisaya) return "Makatabang ko sa pagtubag sa imong mga pangutana bahin sa OyFound o bisan unsang pangkalahatang pangutana. Palihug iklaro ang imong gipangutana!";
    if (isTagalog) return "Makatutulong ako sa pagsagot sa iyong mga tanong tungkol sa OyFound o kahit anong pangkalahatang paksa. Paki-linaw lang ang iyong tanong!";
    return "I can help answer questions about OyFound as well as general knowledge topics. Could you please clarify your question?";
};

// Gemini AI Call — Unrestricted assistant that answers general knowledge & OyFound queries
const queryGeminiAI = async (userPrompt, chatHistory) => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here' || GEMINI_API_KEY.includes('YourActualGeminiApiKey')) {
        return getSmartFallbackReply(userPrompt);
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const formattedContents = [
        ...chatHistory.map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
        })),
        { role: 'user', parts: [{ text: userPrompt }] }
    ];

    const systemRules = `
You are OyBot, a smart, friendly, multi-lingual AI assistant inside the 'OyFound' campus web application.

BEHAVIOR INSTRUCTIONS:
1. ANSWER ALL GENERAL QUESTIONS: You are an intelligent AI. Answer general knowledge questions, programming queries, advice, science, math, or casual chit-chat accurately and helpfully. Do NOT restrict yourself to only OyFound topics.
2. PROOF VERIFICATION: If the user asks if an administrator will ask about their lost item to verify proof, explain clearly that yes, the administrator will ask for specific details (such as brand, color, or distinctive marks) to verify proof of ownership before approving the claim.
3. APOLOGIES: If the user says "sorry", "pasensya", "patawad", or similar, reply warmly assuring them that no apology is necessary (e.g., "No need to apologize at all! How can I help you?").
4. PERSONAL IDENTITY QUESTIONS: If the user asks "You know me?", "Do you know who I am?", "Kilala mo ako?", or similar, explain politely that you are OyBot, the AI assistant for OyFound, and you do not access or store personal user identity records to protect their privacy.
5. OYFOUND KNOWLEDGE: If the user specifically asks about OyFound or campus lost-and-found operations:
   - HOW TO USE OYFOUND: Students browse admin-posted items on the Home page, click 'Claim Item', and verify/track claims under Messages.
   - WHO ARE THE ADMINISTRATORS: Respond with "OyFound is administered by authorized faculty members, school personnel, school heads, and designated developers."
   - WHERE TO CLAIM ITEMS ONSITE: Visit the campus Administrator Office or coordinate with an administrator via support chat.
   - HOW TO COMMUNICATE: Use OyFound's support chat feature available in the Messages panel.
   - HOW TO VERIFY STATUS: Check claim status under the Messages section.
   - CREATING LISTINGS: Only administrators can create and manage item listings. Students cannot post items directly.
   - SECURITY: Never ask for or handle passwords or verification codes.
6. GREETINGS & POLITENESS: Mirror back greetings (e.g., "Good morning", "Hi") and acknowledge gratitude/farewells warmly in the user's language.
7. LANGUAGE MATCHING: Always respond in the EXACT SAME language or dialect used by the user (English, Tagalog, Bisaya, Taglish, etc.).
8. FORMATTING: Avoid markdown bolding or excessive emojis. Keep answers concise, natural, and friendly for a chat widget interface.
`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: formattedContents,
                systemInstruction: {
                    parts: [{ text: systemRules }]
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        return replyText ? replyText.trim() : getSmartFallbackReply(userPrompt);
    } catch (err) {
        console.warn("Gemini API call failed, using fallback responder:", err);
        return getSmartFallbackReply(userPrompt);
    }
};

function Oybot() {
    const [isOpen, setIsOpen] = useState(false);
    const [inputMessage, setInputMessage] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [messages, setMessages] = useState(INITIAL_MESSAGE);

    const [position, setPosition] = useState({ x: window.innerWidth - 90, y: window.innerHeight - 90 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, moved: false });
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen, isThinking]);

    const handleResetChat = () => {
        setMessages([
            {
                id: Date.now(),
                sender: "bot",
                text: "Hello! I am OyBot. How can I help you today?",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialX: position.x,
            initialY: position.y,
            moved: false
        };
    };

    const handleTouchStart = (e) => {
        if (!e.touches[0]) return;
        setIsDragging(true);
        dragRef.current = {
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY,
            initialX: position.x,
            initialY: position.y,
            moved: false
        };
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - dragRef.current.startX;
            const deltaY = e.clientY - dragRef.current.startY;

            if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
                dragRef.current.moved = true;
            }

            const newX = Math.min(Math.max(10, dragRef.current.initialX + deltaX), window.innerWidth - 70);
            const newY = Math.min(Math.max(10, dragRef.current.initialY + deltaY), window.innerHeight - 70);

            setPosition({ x: newX, y: newY });
        };

        const handleTouchMove = (e) => {
            if (!isDragging || !e.touches[0]) return;
            const deltaX = e.touches[0].clientX - dragRef.current.startX;
            const deltaY = e.touches[0].clientY - dragRef.current.startY;

            if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
                dragRef.current.moved = true;
            }

            const newX = Math.min(Math.max(10, dragRef.current.initialX + deltaX), window.innerWidth - 70);
            const newY = Math.min(Math.max(10, dragRef.current.initialY + deltaY), window.innerHeight - 70);

            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging]);

    const handleToggleOpen = () => {
        if (!dragRef.current.moved) {
            setIsOpen(!isOpen);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || isThinking) return;

        const userText = inputMessage.trim();

        // Immediate reset check
        if (/^(reset|clear|start over|reset chat|clear chat|bag-o)$/i.test(userText)) {
            setInputMessage("");
            handleResetChat();
            return;
        }

        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const userMsg = {
            id: Date.now(),
            sender: "user",
            text: userText,
            time: timeNow
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputMessage("");
        setIsThinking(true);

        const aiReply = await queryGeminiAI(userText, messages);

        const botMsg = {
            id: Date.now() + 1,
            sender: "bot",
            text: aiReply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsThinking(false);
    };

    return (
        <div 
            className="oybot-wrapper"
            style={{ 
                left: `${position.x}px`, 
                top: `${position.y}px`,
                position: 'fixed',
                zIndex: 9999
            }}
        >
            {!isOpen && (
                <button
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    onClick={handleToggleOpen}
                    className="oybot-toggle-btn"
                    title="Click or drag to open OyBot"
                    style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
                >
                    🤖
                </button>
            )}

            {isOpen && (
                <div className="oybot-modal">
                    <div 
                        className="oybot-header"
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                        style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
                    >
                        <div className="oybot-header-info">
                            <div className="oybot-avatar-icon">🤖</div>
                            <div className="oybot-title-stack">
                                <h4>OyBot Assistant</h4>
                                <span className="oybot-status-online">● Online</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                                onClick={handleResetChat}
                                className="oybot-close-btn"
                                title="Reset chat"
                                style={{ fontSize: '14px' }}
                            >
                                ↺
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="oybot-close-btn"
                                title="Close chat"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className="oybot-body">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`oybot-msg-row ${msg.sender === 'user' ? 'sent' : 'received'}`}
                            >
                                <div className={`oybot-bubble ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                                    {msg.text}
                                </div>
                                <span className="oybot-timestamp">
                                    {msg.time}
                                </span>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="oybot-msg-row received">
                                <div className="oybot-bubble bot" style={{ fontStyle: 'italic', opacity: 0.7 }}>
                                    OyBot is typing...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="oybot-footer">
                        <input
                            type="text"
                            placeholder="Ask any question or type 'reset'..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            className="oybot-input"
                        />
                        <button type="submit" className="oybot-send-btn" disabled={isThinking}>
                            ➔
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default Oybot;