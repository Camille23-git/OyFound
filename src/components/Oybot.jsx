import { useEffect, useRef, useState } from 'react';
import '../css/Oybot.css';
import oybotIcon from '../assets/Y.png';

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

// Smart Idiom & Colloquial Expression Engine
const interpretIdiomsAndSlang = (userPrompt) => {
    const text = userPrompt.toLowerCase().trim();

    // 1. BISAYA IDIOMS & COLLOQUIAL SLANG
    if (/bugnaw ug ulo|bugnawog ulo/i.test(text)) {
        return "Ang pasabot sa 'bugnaw ug ulo' kay kalmado o walay kasuko. Unsaon nako pagtabang nimo karon nga malinawon ang atong panag-istorya?";
    }
    if (/init ug ulo|initog ulo|abtik pa sa alas kuwatro/i.test(text)) {
        if (/init/i.test(text)) return "Murag init kaayo ang imong ulo karon da! Pwede ra nimo i-share unsa ang nakapa-init sa imong ulo, basin matabangan ka nako bahin sa OyFound.";
        return "Ang pasabot ana kay abtik kaayo o paspas molihok!";
    }
    if (/hangin kaayo|taas ug ihi|dako ka ug ulo/i.test(text)) {
        return "Murag naglibog ka sa mga ekspresyon ah! Hinay-hinay lang ta, ari lang sa OyFound magpatabang para masulbad imong problema.";
    }
    if (/kaluoy sa Ginoo|ginoo ray nasayod/i.test(text)) {
        return "Tinuod gyud na! Pero ayaw kabalaka, ania ra ko aron motabang sa imong mga kinahanglanon diri sa OyFound.";
    }

    // 2. TAGALOG IDIOMS (Sawikain) & SLANG
    if (/ningas-kugon|ningas kugon/i.test(text)) {
        return "Ang 'ningas-kugon' ay nangangahulugang panandalian lamang o sa simula lamang masipag. May gusto ka bang tapusin o hanapin dito sa OyFound ngayon?";
    }
    if (/balat-sibuyas|balat sibuyas/i.test(text)) {
        return "Ang 'balat-sibuyas' ay ibig sabihin ay sensitibo o madaling masaktan. Huwag kang mag-alala, mabait at handang tumulong ang mga admin dito sa OyFound!";
    }
    if (/pusong mamon|pusong-mamon/i.test(text)) {
        return "Ang 'pusong-mamon' ay tumutukoy sa taong maawain o mabait ang kalooban. Tungkol saan ang gusto mong itanong sa OyFound?";
    }
    if (/bahala na si batman|bahala na/i.test(text)) {
        return "Huwag mong i-bahala kay Batman ang paghahanap ng gamit mo! Gamitin na natin ang search bar o i-check ang iyong claims sa OyFound.";
    }
    if (/isang kahig, isang tuka/i.test(text)) {
        return "Iyan ay tumutukoy sa mahirap na kalagayan sa buhay na sakto lang ang kinikita para sa araw-araw. Pagdating naman sa pagbawi ng nawalang gamit dito sa OyFound, libre at laging handang tumulong ang admin!";
    }

    // 3. ENGLISH IDIOMS
    if (/piece of cake/i.test(text)) {
        return "A 'piece of cake' means something is very easy to do! Finding or claiming your lost items on OyFound is just as easy. How can I help you navigate it?";
    }
    if (/break a leg/i.test(text)) {
        return "Good luck! Though here on OyFound, you won't need luck to find your items—just use our search tools or check your claim status!";
    }
    if (/bite the bullet/i.test(text)) {
        return "To 'bite the bullet' means to get through a tough situation with courage. If you're stressed about a lost item, don't worry, we're here to help you recover it!";
    }
    if (/under the weather/i.test(text)) {
        return "Feeling 'under the weather' means feeling a bit sick or unwell. Take care of yourself! While you rest, you can easily track your lost item status right here on OyFound.";
    }

    return null; // Returns null if no idiom matches, falling back to standard intelligent routing
};

// Smart Fallback Engine for offline mode or general questions when API is inactive
const getSmartFallbackReply = (userPrompt) => {
    const text = userPrompt.toLowerCase().trim();

    // Check idioms first
    const idiomMatch = interpretIdiomsAndSlang(text);
    if (idiomMatch) return idiomMatch;

    // Language detection helpers (Bisaya & Tagalog)
    const isBisaya = /kinsa|asa|unsa|unsaon|tan-awon|kuhaon|storya|pahibalo|salamat|buntag|hapon|gabiie|nako|kaila|pasensya|giunsa|ngano|palihug|mabalos|pila|dugay|pila ka adlaw|naa|wala|estudante|akong|imong|adlaw/i.test(text);
    const isTagalog = /sino|saan|ano|paano|tingnan|kunin|kausapin|patalastas|salamat|umaga|hapon|gabi|ako|kilala|pasensya|patawad|bakit|paki|gaano|kailan|meron|wala|estudyante|aking|iyong|araw/i.test(text);

    // Apologies: "sorry" / "pasensya" / "patawad"
    if (/sorry|pasensya|patawad|my bad|apologies|apologize/i.test(text)) {
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

    // Personal identity question
    if (/you know me|do you know me|who am i|kilala mo (ba )?ako|kaila (ba )?ka nako|kaila ka nako/i.test(text)) {
        if (isBisaya) return "Ako si OyBot, ang AI assistant sa OyFound. Wala koy access sa imong personal nga impormasyon o mga rekor para sa imong privacy.";
        if (isTagalog) return "Ako si OyBot, ang AI assistant ng OyFound. Wala akong access sa iyong personal na impormasyon o mga rekord para sa iyong privacy.";
        return "I am OyBot, the AI assistant for OyFound. I don't access or store your personal identity details to protect your privacy, but I'm here to help you!";
    }

    // Gratitude / Thank You
    if (/thank|thanks|ty|appreciated|salamat|daghang salamat|mabalos/i.test(text)) {
        if (isBisaya) return "Walay sapayan! Pagpahibalo lang kon naa pa kay ubang pangutana.";
        if (isTagalog) return "Walang anuman! Sabihin mo lang kung may iba ka pang kailangan.";
        return "You are very welcome! Let me know if you need anything else.";
    }

    // Farewells / Goodbye
    if (/bye|goodbye|cya|paalam|babay|adios|see you|good night|goodnight/i.test(text)) {
        if (isBisaya) return "Babay! Mag-amping ka kanunay.";
        if (isTagalog) return "Paalam! Mag-iingat ka palagi.";
        return "Goodbye! Have a great day ahead!";
    }

    // Greeting Mirroring
    let greetingPrefix = "";
    if (/good\s*morning|maayong\s*buntag|magandang\s*umaga/i.test(text)) {
        greetingPrefix = isBisaya ? "Maayong buntag! " : isTagalog ? "Magandang umaga! " : "Good morning! ";
    } else if (/good\s*afternoon|maayong\s*hapon|magandang\s*hapon/i.test(text)) {
        greetingPrefix = isBisaya ? "Maayong hapon! " : isTagalog ? "Magandang hapon! " : "Good afternoon! ";
    } else if (/good\s*evening|maayong\s*gabiie|magandang\s*gabi/i.test(text)) {
        greetingPrefix = isBisaya ? "Maayong gabiie! " : isTagalog ? "Magandang gabi! " : "Good evening! ";
    } else if (/hello|hi|hey|sup|greetings|ola|wazzup|bud|yo|kamusta|kumusta/i.test(text)) {
        greetingPrefix = isBisaya ? "Hello! " : isTagalog ? "Hello! " : "Hello! ";
    }

    // OYFOUND SPECIFIC INQUIRIES
    if (/what is oyfound|what\'s oyfound|unsa ang oyfound|unsa man ang oyfound|ano ang oyfound|about oyfound/i.test(text)) {
        if (isBisaya) return `${greetingPrefix}Ang OyFound kay usa ka campus web application nga gihimo aron matabangan ang mga estudyante ug komunidad sa pagpangita ug pag-claim sa ilang mga nawala nga gamit o items.`;
        if (isTagalog) return `${greetingPrefix}Ang OyFound ay isang campus web application na idinisenyo upang tulungan ang mga estudyante at komunidad na mahanap at ma-claim ang kanilang mga nawawalang gamit.`;
        return `${greetingPrefix}OyFound is a campus web application designed to help students and the school community locate, verify, and recover misplaced or lost belongings easily.`;
    }

    if (/how long.*review|time.*review|review.*claim|pila ka adlaw|gaano katagal/i.test(text)) {
        if (isBisaya) return `${greetingPrefix}Ang review sa claim magsurod ug 24 hangtod 48 oras sa operating hours. Pwede nimo tan-awon ang status sa Messages section.`;
        if (isTagalog) return `${greetingPrefix}Tumatagal ang review ng claim ng 24 hanggang 48 oras sa operating hours. Maaari mong tingnan ang status sa Messages section.`;
        return `${greetingPrefix}Admin claim reviews usually take 24 to 48 hours during office hours. You can track your status anytime in the Messages section.`;
    }

    if (/two people.*claim|multiple.*claim|claim in progress|already claimed|another student.*claim/i.test(text)) {
        if (isBisaya) return `${greetingPrefix}Dili makipag-duplicate claim ang ubang estudyante kon naa nay 'Claim in Progress'. Maghululat lang sila kon ma-reject sa admin ang naunang claim aron ma-open ra usab ang 'Claim Item' button.`;
        if (isTagalog) return `${greetingPrefix}Hindi makakapag-submit ng duplicate claim ang ibang estudyante kapag may 'Claim in Progress' na. Maghihintay muna sila kung ma-re-reject ng admin ang unang claim para maging available ulit ang 'Claim Item' button.`;
        return `${greetingPrefix}Other students cannot claim an item if a 'Claim in Progress' is already active. They must wait for the administrator to review the current request; if rejected, the 'Claim Item' button will become available again.`;
    }

    if (/found an item|nakakita ug item|nakakita ng gamit|surrender|found.*campus/i.test(text)) {
        if (isBisaya) return `${greetingPrefix}Kon nakakita kag item sa campus, palihug i-turn over kini sa Administrator Office aron ma-post kini sa OyFound.`;
        if (isTagalog) return `${greetingPrefix}Kapag nakakita ka ng gamit sa campus, mangyaring i-turn over ito sa Administrator Office upang ma-post sa OyFound.`;
        return `${greetingPrefix}If you found an item on campus, please turn it over to the Administrator Office so an admin can list it on OyFound.`;
    }

    if (/can students post|student.*post|post item|mag-post ug item|can i post/i.test(text)) {
        if (isBisaya) return `${greetingPrefix}Dili makapost ug item ang estudyante. Ang mga authorized administrators ra ang makacreate ug item listings sa OyFound.`;
        if (isTagalog) return `${greetingPrefix}Hindi pwedeng mag-post ang estudyante. Ang mga authorized administrators lamang ang makakagawa ng item listings sa OyFound.`;
        return `${greetingPrefix}Students cannot post items directly. Only authorized administrators can create and manage item listings on OyFound.`;
    }

    if (/how.*search|search item|pangitaon|hanapin|how to find/i.test(text)) {
        if (isBisaya) return `${greetingPrefix}Gamita ang search bar o category filters sa Home page aron makapangita sa imong nawala nga item.`;
        if (isTagalog) return `${greetingPrefix}Gamitin ang search bar o category filters sa Home page para mahanap ang iyong nawawalang gamit.`;
        return `${greetingPrefix}Use the search bar or category filters on the Home page to locate your lost item easily.`;
    }

    if (/cannot access|can\'t access|access.*account|login.*issue|messages.*not.*loading|cant access/i.test(text)) {
        if (isBisaya) return `${greetingPrefix}Siguraduha nga nakatala ka sa sakto nga account. Kon dili gihapon maka-access, e-try ang pag-refresh sa browser o pag-login pag-usab.`;
        if (isTagalog) return `${greetingPrefix}Siguraduhing naka-login ka sa tamang account. Kung hindi pa rin makapasok, subukang i-refresh ang browser o mag-login ulit.`;
        return `${greetingPrefix}Make sure you are logged into your account. If the issue persists, try refreshing your browser or re-logging in.`;
    }

    if (/update profile|edit profile|change info|bag-ohon ang profile|how to update/i.test(text)) {
        if (isBisaya) return `${greetingPrefix}Adto sa imong Profile page, i-click ang 'Edit Profile', usba ang imong impormasyon, ug i-click ang 'Save Changes'.`;
        if (isTagalog) return `${greetingPrefix}Pumunta sa iyong Profile page, i-click ang 'Edit Profile', palitan ang iyong impormasyon, at i-click ang 'Save Changes'.`;
        return `${greetingPrefix}Go to your Profile page, click 'Edit Profile', update your details, and click 'Save Changes'.`;
    }

    if (/how to use|unsaon paggamit|paano gamitin|guide|how oyfound works/i.test(text)) {
        if (isBisaya) return `${greetingPrefix}Aron magamit ang OyFound, i-browse ang mga gipost nga items sa Home page. Kon naa kay nakit-an nga imoha, i-click ang 'Claim Item' ug sunda ang verification sa Messages.`;
        if (isTagalog) return `${greetingPrefix}Para gamitin ang OyFound, i-browse ang mga pino-post na items sa Home page. Kapag nahanap mo ang gamit mo, i-click ang 'Claim Item' at sundan ang verification sa Messages.`;
        return `${greetingPrefix}To use OyFound, browse the item listings posted by administrators on the Home page. If you spot your item, click 'Claim Item' and follow the verification process in Messages.`;
    }

    if (/who.*admin|who.*administrator|administrators|admins|kinsa.*admin|sino.*admin/i.test(text)) {
        if (isBisaya) return `${greetingPrefix}Ang OyFound kay gidumala sa mga authorized faculty members, school personnel, school heads, ug designated developers.`;
        if (isTagalog) return `${greetingPrefix}Ang OyFound ay pinangangasiwaan ng mga authorized faculty members, school personnel, school heads, at designated developers.`;
        return `${greetingPrefix}OyFound is administered by authorized faculty members, school personnel, school heads, and designated developers.`;
    }

    if (/onsite|office|where to claim|where to pick|where to get|physical location|where.*claim|asa.*kuhaon|saan.*kukunin/i.test(text)) {
        if (isBisaya) return `${greetingPrefix}Aron makakuha ug item onsite, pakibisita ang campus Administrator Office o pakigsulti sa admin pinaagi sa support chat sa OyFound.`;
        if (isTagalog) return `${greetingPrefix}Para mag-claim ng item onsite, bisitahin ang campus Administrator Office o makipag-ugnayan sa admin gamit ang support chat ng OyFound.`;
        return `${greetingPrefix}To claim an item onsite, please visit the campus Administrator Office or coordinate directly with an administrator through OyFound's support chat for location details.`;
    }

    if (/communicate|contact|talk|speak|chat|message|pakig-chat|makipag-usap|pakigsulti/i.test(text)) {
        if (isBisaya) return `${greetingPrefix}Makahimo ka sa pakig-storya sa mga administrator gamit ang support chat sa Messages panel.`;
        if (isTagalog) return `${greetingPrefix}Maaari kang makipag-usap sa mga administrator gamit ang support chat ng Messages panel.`;
        return `${greetingPrefix}You can communicate directly with administrators using OyFound's support chat feature in the Messages panel.`;
    }

    if (/status|verify|pending|approved|check|tan-awon|tingnan|status.*claim/i.test(text)) {
        if (isBisaya) return `${greetingPrefix}Pwede nimo tan-awon ug i-verify ang status sa imong claim sa Messages section sa OyFound. Mag-update kini automatic kon ma-review na sa admin.`;
        if (isTagalog) return `${greetingPrefix}Maaari mong tingnan at i-verify ang status ng iyong claim sa Messages section ng OyFound. Kusang mag-uupdate ito kapag na-review na ng admin.`;
        return `${greetingPrefix}You can check and verify your claim status under the Messages section in OyFound. It updates automatically once reviewed by an administrator.`;
    }

    if (/claim|get my item|receive|kuhaon|kunin/i.test(text)) {
        if (isBisaya) return `${greetingPrefix}Aron mag-claim ug item, i-browse ang listings sa Home page, i-click ang 'Claim Item', ug e-check ang claim status sa Messages.`;
        if (isTagalog) return `${greetingPrefix}Para mag-claim ng item, i-browse ang listings sa Home page, i-click ang 'Claim Item', at i-check ang claim status sa Messages.`;
        return `${greetingPrefix}To claim an item, browse the listings posted by administrators on the Home page, click 'Claim Item', and check your claim status in Messages.`;
    }

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

// Gemini AI Call with Idiom Comprehension Rules
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

BEHAVIOR & IDIOM INSTRUCTIONS:
1. IDIOM & SLANG COMPREHENSION: You are an expert in understanding idioms, figurative expressions, figurative language, and colloquial slang in English, Tagalog, and Bisaya (Cebuano). If a user uses phrases like "ningas-kugon", "balat-sibuyas", "bugnaw ug ulo", "piece of cake", or local colloquial expressions, interpret them contextually and respond naturally with empathy, helpfulness, and wit.
2. ANSWER ALL GENERAL QUESTIONS: Answer general knowledge queries, programming, science, math, or casual chat accurately.
3. PROOF VERIFICATION & PICKUP:
   - What proof to bring: "Please bring a valid school ID and any supporting proof mentioned during your chat verification with the administrator (e.g., a photo of the item, purchase receipt, or matching description/distinctive marks)."
   - Review timeline: Admin reviews take 24 to 48 hours during office hours.
4. CLAIM SYSTEM RULES:
   - Duplicate claims: OyFound uses 'Claim in Progress' lock. If someone already clicked 'Claim Item', others must wait until admin reviews it.
   - Found an item: Turn items over to the campus Administrator Office so an admin can list them.
   - Student posting: Students cannot post items directly; only administrators can create listings.
5. LANGUAGE & TONE MATCHING: Always respond in the EXACT SAME language, dialect, or tone used by the user (English, Tagalog, Bisaya, or Taglish). Keep answers concise and friendly for a chat widget.
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
        if (window.innerWidth <= 576) return;
        if (e.target.closest('button')) return;

        setIsDragging(true);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialX: position.x,
            initialY: position.y,
            moved: false
        };
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging || window.innerWidth <= 576) return;
            const deltaX = e.clientX - dragRef.current.startX;
            const deltaY = e.clientY - dragRef.current.startY;

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
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
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
                    onClick={handleToggleOpen}
                    className="oybot-toggle-btn"
                    title="Click or drag to open OyBot"
                    style={{ 
                        cursor: window.innerWidth > 576 ? (isDragging ? 'grabbing' : 'grab') : 'pointer', 
                        userSelect: 'none' 
                    }}
                >
                    <img src={oybotIcon} alt="OyBot Logo" className="oybot-toggle-icon" />
                </button>
            )}

            {isOpen && (
                <div className="oybot-modal">
                    <div 
                        className="oybot-header"
                        onMouseDown={handleMouseDown}
                        style={{ 
                            cursor: window.innerWidth > 576 ? (isDragging ? 'grabbing' : 'grab') : 'default', 
                            userSelect: 'none' 
                        }}
                    >
                        <div className="oybot-header-info">
                            <div className="oybot-avatar-icon">
                                <img src={oybotIcon} alt="OyBot" className="oybot-header-icon" />
                            </div>
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
                            placeholder="Ask any question or type idioms (e.g. balat-sibuyas)..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            className="oybot-input"
                        />
                        <button type="submit" className="oybot-send-btn" disabled={isThinking} title="Send Message">
                            <svg 
                                className="oybot-send-svg" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            >
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default Oybot;