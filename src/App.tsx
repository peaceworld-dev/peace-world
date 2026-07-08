import React, { useState, useEffect, useRef } from "react";
import { 
  Home, 
  Sparkles, 
  MessageSquare, 
  Send, 
  ChevronRight,
  RefreshCw,
  Clock,
  User,
  Info,
  Globe
} from "lucide-react";
import AudioPlayer from "./components/AudioPlayer";
import BreathingExercise from "./components/BreathingExercise";
import Journal from "./components/Journal";
import SafetyNotice from "./components/SafetyNotice";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";
import { Room, RoomId, ChatMessage } from "./types";

const ROOM_IDS: RoomId[] = ["hall", "living", "bedroom", "garden", "temple"];
const AMBIENT_SOUNDS: Record<RoomId, string> = {
  hall: "wind",
  living: "rain",
  bedroom: "night",
  garden: "waves",
  temple: "silence",
};

function LanguageSwitcher() {
  const { language, setLanguage, languages } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        id="btn-language-switcher"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 border border-neutral-800 px-2.5 py-1 rounded-full text-[10px] text-neutral-300 hover:border-neutral-600 transition uppercase tracking-widest bg-neutral-900/40"
      >
        <Globe className="w-3 h-3" />
        <span>{languages.find((l) => l.code === language)?.flag}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden z-50 min-w-[140px] shadow-xl">
            {languages.map((lang) => (
              <button
                id={`lang-option-${lang.code}`}
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition ${
                  language === lang.code ? "bg-white text-neutral-950 font-bold" : "text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AppContent() {
  const { t, language } = useLanguage();

  const ROOMS: Room[] = ROOM_IDS.map((id) => ({
    id,
    name: t(`rooms.${id}.name`),
    subtitle: t(`rooms.${id}.subtitle`),
    description: t(`rooms.${id}.description`),
    ambientSound: AMBIENT_SOUNDS[id],
    baseInstruction: t(`rooms.${id}.instruction`),
  }));

  const [activeRoomId, setActiveRoomId] = useState<RoomId>("hall");
  const activeRoom = ROOMS.find((r) => r.id === activeRoomId) || ROOMS[0];
  const [quote, setQuote] = useState("");
  const [quoteSource, setQuoteSource] = useState("");
  const [quoteLoading, setQuoteLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "model", text: t("chat.welcome"), timestamp: new Date() },
  ]);
  const [inputText, setInputText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [localTime, setLocalTime] = useState("");

  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchQuote(activeRoomId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId, language]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLocalTime(now.toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [language]);

  const fetchQuote = async (roomId: RoomId) => {
    setQuoteLoading(true);
    try {
      const res = await fetch(`/api/peace/quote?room=${roomId}&lang=${language}`);
      const data = await res.json();
      setQuote(data.quote);
      setQuoteSource(data.source);
    } catch (e) {
      console.error("Erro ao carregar frase de paz:", e);
      setQuote(t("footer.quote"));
      setQuoteSource("");
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const textToSend = customMsg || inputText;
    if (!textToSend.trim() || chatLoading) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text: textToSend.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setChatLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }));
      const response = await fetch("/api/peace/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend.trim(), history, lang: language }),
      });
      const data = await response.json();
      const modelMsg: ChatMessage = { id: crypto.randomUUID(), role: "model", text: data.response || t("chat.errorMsg"), timestamp: new Date() };
      setMessages((prev) => [...prev, modelMsg]);
    } catch (error) {
      console.error("Erro ao enviar mensagem para o Guia:", error);
      const errorMsg: ChatMessage = { id: crypto.randomUUID(), role: "model", text: t("chat.errorMsg"), timestamp: new Date() };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleJournalAskAI = (promptText: string) => {
    handleSendMessage(undefined, promptText);
    document.getElementById("chat-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const howTo: string[] = t("sidebar.howTo");
  const suggestions: string[] = t("chat.suggestions");

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-mono flex flex-col selection:bg-white selection:text-neutral-950 antialiased">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] z-0" />

      <header className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur sticky top-0 z-50 px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-white flex items-center justify-center animate-spin [animation-duration:12s] shrink-0">
            <span className="w-3 h-[1px] bg-white block"></span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-widest text-white uppercase">{t("header.title")}</h1>
            <p className="text-[10px] text-neutral-400 tracking-wider">{t("header.subtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-neutral-400 text-xs">
            <Clock className="w-3.5 h-3.5 animate-pulse text-white" />
            <span className="font-bold tracking-widest bg-neutral-900 px-2 py-1 rounded text-white border border-neutral-800">{localTime || "00:00:00"}</span>
            <span className="text-[9px] uppercase hidden sm:inline">{t("header.timePresent")}</span>
          </div>

          <div className="hidden md:flex items-center gap-2 border border-neutral-800 px-3 py-1 rounded-full text-[10px] text-neutral-400 uppercase tracking-widest bg-neutral-900/40">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
            <span>{t("header.refuge")}</span>
          </div>

          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">

        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-neutral-900/40 border border-neutral-900 p-5 rounded-lg flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <span className="text-xs font-bold tracking-widest uppercase text-neutral-400">{t("sidebar.roomsTitle")}</span>
              <span className="text-[10px] bg-white text-neutral-950 px-1.5 py-0.5 rounded font-bold uppercase">{t("sidebar.badge")}</span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed mb-1">{t("sidebar.description")}</p>

            <nav className="space-y-1.5">
              {ROOMS.map((room) => {
                const isActive = room.id === activeRoomId;
                return (
                  <button
                    id={`room-nav-btn-${room.id}`}
                    key={room.id}
                    onClick={() => setActiveRoomId(room.id as RoomId)}
                    className={`w-full text-left px-3 py-3 rounded-lg border transition-all duration-300 flex items-center justify-between group ${
                      isActive ? "bg-white text-neutral-950 border-white font-bold translate-x-1" : "bg-transparent text-neutral-400 border-neutral-900 hover:border-neutral-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive ? "bg-neutral-950" : "bg-neutral-800 group-hover:bg-neutral-400"}`} />
                      <div className="leading-none">
                        <p className="text-xs uppercase tracking-wider">{room.name}</p>
                        <p className={`text-[9px] mt-0.5 ${isActive ? "text-neutral-600" : "text-neutral-500 group-hover:text-neutral-400"}`}>{room.subtitle}</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isActive ? "translate-x-0" : "opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"}`} />
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="bg-neutral-900/20 border border-neutral-900/60 p-5 rounded-lg font-mono">
            <div className="flex items-center gap-2 text-neutral-300 mb-2">
              <Info className="w-4 h-4 text-white shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider">{t("sidebar.howToTitle")}</h4>
            </div>
            <ul className="text-[11px] text-neutral-400 space-y-2 leading-relaxed">
              {howTo.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-white shrink-0">✦</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="lg:col-span-5 flex flex-col gap-6">

          <div className="bg-white text-neutral-950 border border-white rounded-lg p-6 shadow-xl relative overflow-hidden flex flex-col min-h-[260px] justify-between transition-all duration-500">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Home className="w-32 h-32 text-neutral-900 stroke-[0.5]" />
            </div>

            <div className="z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] tracking-widest uppercase bg-neutral-950 text-white px-2 py-0.5 rounded font-bold">{t("activeRoom.badge")}</span>
                <span className="text-[10px] text-neutral-500 font-bold uppercase">{activeRoom.subtitle}</span>
              </div>

              <h2 className="text-xl font-bold tracking-wide uppercase text-neutral-900 mb-2 mt-1">{activeRoom.name}</h2>
              <p className="text-xs text-neutral-600 leading-relaxed mb-4">{activeRoom.description}</p>

              <div className="border-t border-neutral-200 pt-4 mb-4">
                <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-2">{t("activeRoom.instructionLabel")}</p>
                <p className="text-xs text-neutral-700 italic bg-neutral-50 p-2.5 rounded border border-neutral-100 leading-relaxed">&ldquo;{activeRoom.baseInstruction}&rdquo;</p>
              </div>
            </div>

            <div className="z-10 mt-auto bg-neutral-950 text-white p-4 rounded border border-neutral-900">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-white" />
                  {t("activeRoom.quoteLabel")}
                </span>
                <button
                  id="btn-refresh-quote"
                  onClick={() => fetchQuote(activeRoom.id as RoomId)}
                  disabled={quoteLoading}
                  className="text-neutral-400 hover:text-white transition duration-200"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${quoteLoading ? "animate-spin" : ""}`} />
                </button>
              </div>

              {quoteLoading ? (
                <div className="py-2 flex items-center gap-2 text-[11px] text-neutral-400">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                  <span>{t("activeRoom.quoteLoading")}</span>
                </div>
              ) : (
                <>
                  <p className="text-xs leading-relaxed italic text-neutral-100 font-serif">&ldquo;{quote}&rdquo;</p>
                  <p className="text-[9px] text-neutral-500 text-right mt-2 font-bold uppercase tracking-widest">— {quoteSource}</p>
                </>
              )}
            </div>
          </div>

          <div id="chat-section" className="bg-neutral-900/40 border border-neutral-900 rounded-lg p-5 flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-white" />
                <span className="text-xs font-bold tracking-widest uppercase text-white">{t("chat.title")}</span>
              </div>
              <span className="text-[10px] text-neutral-400">{t("chat.presence")}</span>
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 flex flex-col">
              {messages.map((m) => (
                <div id={`chat-msg-${m.id}`} key={m.id} className={`flex flex-col max-w-[85%] ${m.role === "user" ? "self-end items-end" : "self-start items-start"}`}>
                  <div className="flex items-center gap-1.5 mb-1 text-[9px] text-neutral-500 font-bold uppercase">
                    {m.role === "user" ? (
                      <>
                        <span>{t("chat.you")}</span>
                        <User className="w-2.5 h-2.5" />
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{t("chat.guide")}</span>
                      </>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg text-xs leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-white text-neutral-950 font-bold rounded-tr-none" : "bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-tl-none"}`}>
                    {m.text}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="self-start flex flex-col items-start max-w-[80%]">
                  <div className="flex items-center gap-1.5 mb-1 text-[9px] text-neutral-500 font-bold uppercase">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{t("chat.thinking")}</span>
                  </div>
                  <div className="p-3 bg-neutral-900/50 text-neutral-400 border border-neutral-800/60 rounded-lg rounded-tl-none text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 shrink-0 max-w-full">
              {suggestions.map((suggestion, idx) => (
                <button
                  id={`chat-suggestion-${idx}`}
                  key={idx}
                  onClick={() => handleSendMessage(undefined, suggestion)}
                  className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded text-[10px] shrink-0 transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form id="form-chat-input" onSubmit={handleSendMessage} className="flex gap-2 shrink-0">
              <input
                id="input-chat-message"
                type="text"
                placeholder={t("chat.placeholder")}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs focus:border-white focus:outline-none text-white placeholder-neutral-500"
              />
              <button id="btn-send-chat" type="submit" className="bg-white text-neutral-950 px-3 py-2 rounded hover:bg-neutral-200 transition duration-200 active:scale-95">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </section>

        <section className="lg:col-span-3 flex flex-col gap-6">
          <AudioPlayer activeSound={activeRoom.ambientSound} />
          <BreathingExercise />
          <Journal onAskAI={handleJournalAskAI} />
        </section>

      </main>

      <footer className="border-t border-neutral-950 bg-neutral-950 py-8 px-4 text-center mt-auto">
        <div className="max-w-2xl mx-auto space-y-3">
          <p className="text-xs text-neutral-400 font-serif italic">&ldquo;{t("footer.quote")}&rdquo;</p>
          <div className="flex justify-center items-center gap-3 text-[10px] text-neutral-600 uppercase tracking-widest font-mono">
            <span>{t("footer.copyright")}</span>
            <span>•</span>
            <span>{t("footer.aesthetic")}</span>
            <span>•</span>
            <span>{t("footer.tuning")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <SafetyNotice>
        <AppContent />
      </SafetyNotice>
    </LanguageProvider>
  );
}
