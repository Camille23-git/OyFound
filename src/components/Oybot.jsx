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

// Quick suggestion chips for fast user queries
const SUGGESTIONS = [
    "How do I search for a specific lost item on campus?",
    "What should I do if I find a misplaced item on campus?",
    "How do I submit a claim for an item that belongs to me?",
    "What proof do I need to present when picking up my item?",
    "How long does it take for an administrator to review my claim?"
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

    // 1. What proof do I need to bring when picking up my item? (PRIORITY CHECK)
    if (/proof.*bring|what to bring|requirements.*claim|what proof|proof.*pick|picking up/i.test(text)) {
        if (isBisaya) return "Magdala ug valid school ID ug bisan unsang gipangayong proof sa admin (sama sa litrato o klarong description) igkuha nimo sa item.";
        if (isTagalog) return "Magdala ng valid school ID at anumang hiniling na proof ng admin (tulad ng larawan o detalyadong paglalarawan) kapag kukunin na ang item.";
        return "Please bring a valid school ID and any supporting proof mentioned during your chat verification with the administrator (e.g., a photo of the item, purchase receipt, or matching description/distinctive marks).";
    }

    // 2. Proof Verification (General details check)
    if (/verify.*proof|proof.*ownership|admin.*ask.*item|verify.*item|ask.*details/i.test(text)) {
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

    // What is OyFound?
    if (/what is oyfound|what\'s oyfound|unsa ang oyfound|unsa man ang oyfound|ano ang oyfound|about oyfound/.test(text)) {
        if (isBisaya) return `${greetingPrefix}Ang OyFound kay usa ka campus web application nga gihimo aron matabangan ang mga estudyante ug komunidad sa pagpangita ug pag-claim sa ilang mga nawala nga gamit o items.`;
        if (isTagalog) return `${greetingPrefix}Ang OyFound ay isang campus web application na idinisenyo upang tulungan ang mga estudyante at komunidad na mahanap at ma-claim ang kanilang mga nawawalang gamit.`;
        return `${greetingPrefix}OyFound is a campus web application designed to help students and the school community locate, verify, and recover misplaced or lost belongings easily.`;
    }

    // How long does it take for an admin to review my claim?
    if (/how long.*review|time.*review|review.*claim|pila ka adlaw|gaano katagal/i.test(text)) {
        if (isBisaya) return `${greetingPrefix}Ang review sa claim magsurod ug 24 hangtod 48 oras sa operating hours. Pwede nimo tan-awon ang status sa Messages section.`;
        if (isTagalog) return `${greetingPrefix}Tumatagal ang review ng claim ng 24 hanggang 48 oras sa operating hours. Maaari mong tingnan ang status sa Messages section.`;
        return `${greetingPrefix}Admin claim reviews usually take 24 to 48 hours during office hours. You can track your status anytime in the Messages section.`;
    }

    // What happens if two people claim the same lost item?
    if (/two people.*claim|multiple.*claim|claim in progress|already claimed|another student.*claim/i.test(text)) {
        if (isBisaya) return `${greetingPrefix}Dili makipag-duplicate claim ang ubang estudyante kon naa nay 'Claim in Progress'. Maghululat lang sila kon ma-reject sa admin ang naunang claim aron ma-open ra usab ang 'Claim Item' button.`;
        if (isTagalog) return `${greetingPrefix}Hindi makakapag-submit ng duplicate claim ang ibang estudyante kapag may 'Claim in Progress' na. Maghihintay muna sila kung ma-re-reject ng admin ang unang claim para maging available ulit ang 'Claim Item' button.`;
        return `${greetingPrefix}Other students cannot claim an item if a 'Claim in Progress' is already active. They must wait for the administrator to review the current request; if rejected, the 'Claim Item' button will become available again.`;
    }

    // What should I do if I found a lost item on campus?
    if (/found an item|nakakita ug item|nakakita ng gamit|surrender|found.*campus/i.test(text)) {
        if (isBisaya) return `${greetingPrefix}Kon nakakita kag item sa campus, palihug i-turn over kini sa Administrator Office aron ma-post kini sa OyFound.`;
        if (isTagalog) return `${greetingPrefix}Kapag nakakita ka ng gamit sa campus, mangyaring i-turn over ito sa Administrator Office upang ma-post sa OyFound.`;
        return `${greetingPrefix}If you found an item on campus, please turn it over to the Administrator Office so an admin can list it on OyFound.`;
    }

    // Can students post lost or found items directly on OyFound?
    if (/can students post|student.*post|post item|mag-post ug item|can i post/i.test(text)) {
        if (isBisaya) return `${greetingPrefix}Dili makapost ug item ang estudyante. Ang mga authorized administrators ra ang makacreate ug item listings sa OyFound.`;
        if (isTagalog) return `${greetingPrefix}Hindi pwedeng mag-post ang estudyante. Ang mga authorized administrators lamang ang makakagawa ng item listings sa OyFound.`;
        return `${greetingPrefix}Students cannot post items directly. Only authorized administrators can create and manage item listings on OyFound.`;
    }

    // How can I search for a specific item I lost?
    if (/how.*search|search item|pangitaon|hanapin|how to find/i.test(text)) {
        if (isBisaya) return `${greetingPrefix}Gamita ang search bar o category filters sa Home page aron makapangita sa imong nawala nga item.`;
        if (isTagalog) return `${greetingPrefix}Gamitin ang search bar o category filters sa Home page para mahanap ang iyong nawawalang gamit.`;
        return `${greetingPrefix}Use the search bar or category filters on the Home page to locate your lost item easily.`;
    }

    // Why can't I access my account or messages?
    if (/cannot access|can\'t access|access.*account|login.*issue|messages.*not.*loading|cant access/i.test(text)) {
        if (isBisaya) return `${greetingPrefix}Siguraduha nga nakatala ka sa sakto nga account. Kon dili gihapon maka-access, e-try ang pag-refresh sa browser o pag-login pag-usab.`;
        if (isTagalog) return `${greetingPrefix}Siguraduhing naka-login ka sa tamang account. Kung hindi pa rin makapasok, subukang i-refresh ang browser o mag-login ulit.`;
        return `${greetingPrefix}Make sure you are logged into your account. If the issue persists, try refreshing your browser or re-logging in.`;
    }

    // How do I update my profile information?
    if (/update profile|edit profile|change info|bag-ohon ang profile|how to update/i.test(text)) {
        if (isBisaya) return `${greetingPrefix}Adto sa imong Profile page, i-click ang 'Edit Profile', usba ang imong impormasyon, ug i-click ang 'Save Changes'.`;
        if (isTagalog) return `${greetingPrefix}Pumunta sa iyong Profile page, i-click ang 'Edit Profile', palitan ang iyong impormasyon, at i-click ang 'Save Changes'.`;
        return `${greetingPrefix}Go to your Profile page, click 'Edit Profile', update your details, and click 'Save Changes'.`;
    }

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
2. PROOF VERIFICATION & PICKUP:
   - What proof to bring: "Please bring a valid school ID and any supporting proof mentioned during your chat verification with the administrator (e.g., a photo of the item, purchase receipt, or matching description/distinctive marks)."
   - Review timeline: Admin reviews take 24 to 48 hours during office hours.
   - Proof verification details: Admin will ask for specific item details (brand, color, marks) to verify ownership before approving.
3. CLAIM SYSTEM RULES:
   - Duplicate claims: OyFound uses 'Claim in Progress' lock. If someone already clicked 'Claim Item', others must wait until admin reviews it. If rejected, the button unlocks for the next student.
   - Found an item: Students who find items should turn them over to the campus Administrator Office so an admin can list them.
   - Student posting: Students cannot post items directly. Only authorized administrators can create and manage listings.
   - Searching: Students search for items using the Home page search bar or category filters.
   - Account/Access: Verify account login. Try browser refresh or re-logging in.
   - Updating Profile: Go to Profile, click 'Edit Profile', update details, click 'Save Changes'.
4. APOLOGIES: If the user says "sorry", "pasensya", "patawad", or similar, reply warmly assuring them that no apology is necessary (e.g., "No need to apologize at all! How can I help you?").
5. PERSONAL IDENTITY QUESTIONS: If the user asks "You know me?", "Do you know who I am?", "Kilala mo ako?", or similar, explain politely that you are OyBot, the AI assistant for OyFound, and you do not access or store personal user identity records to protect their privacy.
6. OYFOUND KNOWLEDGE:
   - WHAT IS OYFOUND: OyFound is a campus web application designed to help students and the school community locate, verify, and recover misplaced belongings easily.
   - HOW TO USE OYFOUND: Students browse admin-posted items on the Home page, click 'Claim Item', and verify/track claims under Messages.
   - WHO ARE THE ADMINISTRATORS: "OyFound is administered by authorized faculty members, school personnel, school heads, and designated developers."
   - WHERE TO CLAIM ITEMS ONSITE: Visit the campus Administrator Office or coordinate with an administrator via support chat.
   - SECURITY: Never ask for or handle passwords or verification codes.
7. GREETINGS & POLITENESS: Mirror back greetings (e.g., "Good morning", "Hi") and acknowledge gratitude/farewells warmly in the user's language.
8. LANGUAGE MATCHING: Always respond in the EXACT SAME language or dialect used by the user (English, Tagalog, Bisaya, Taglish, etc.).
9. FORMATTING: Avoid markdown bolding or excessive emojis. Keep answers concise, natural, and friendly for a chat widget interface.
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
        // Desktop dragging mouse handler
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
        // Disable dragging on mobile devices (screens width <= 576px)
        if (window.innerWidth <= 576) {
            dragRef.current.moved = false;
            return;
        }

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
            if (!isDragging || !e.touches[0] || window.innerWidth <= 576) return;
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

    const processMessageSubmission = async (promptText) => {
        if (!promptText.trim() || isThinking) return;

        const userText = promptText.trim();

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

    const handleSendMessage = async (e) => {
        e.preventDefault();
        await processMessageSubmission(inputMessage);
    };

    const handleSuggestionClick = async (suggestionText) => {
        await processMessageSubmission(suggestionText);
    };

    return (
        <div 
            className="oybot-wrapper"
            style={window.innerWidth > 576 ? { 
                left: `${position.x}px`, 
                top: `${position.y}px`,
                position: 'fixed',
                zIndex: 9999
            } : { position: 'fixed', zIndex: 9999 }}
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

                    {/* Quick suggestion chips above search bar */}
                    <div className="oybot-suggestions-container">
                        {SUGGESTIONS.map((suggestion, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleSuggestionClick(suggestion)}
                                disabled={isThinking}
                                className="oybot-suggestion-chip"
                            >
                                {suggestion}
                            </button>
                        ))}
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