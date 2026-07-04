import React, { useState, useEffect, useRef } from "react";
import { 
  Home, 
  Compass, 
  Moon, 
  Wind, 
  Sparkles, 
  MessageSquare, 
  Send, 
  HelpCircle, 
  Coffee, 
  Sun, 
  CheckCircle2, 
  ChevronRight,
  RefreshCw,
  Heart,
  Clock,
  User,
  Info
} from "lucide-react";
import AudioPlayer from "./components/AudioPlayer";
import BreathingExercise from "./components/BreathingExercise";
import Journal from "./components/Journal";
import SafetyNotice from "./components/SafetyNotice";
import { Room, RoomId, ChatMessage } from "./types";

const ROOMS: Room[] = [
  {
    id: "hall",
    name: "Hall de Entrada",
    subtitle: "O Portal da Transição",
    description: "Um espaço limpo e acolhedor para desarmar os pensamentos, tirar o peso do dia e cruzar a fronteira em direção ao silêncio interior.",
    ambientSound: "wind",
    baseInstruction: "Imagine-se deixando seus sapatos e todas as suas preocupações externas na porta. Você está entrando no seu verdadeiro lar espiritual."
  },
  {
    id: "living",
    name: "Sala de Estar Zen",
    subtitle: "O Centro do Descanso e Calor",
    description: "Aconchegante, iluminada por uma chama suave. Aqui você pode sentar-se confortavelmente, segurar uma xícara de chá imaginária e deixar o mundo girar sozinho.",
    ambientSound: "rain",
    baseInstruction: "Sinta a solidez do assento abaixo de você. Perceba como a gravidade te apoia com amor. Não há nada a resolver neste exato momento."
  },
  {
    id: "bedroom",
    name: "Quarto Lunar",
    subtitle: "O Santuário do Sono e dos Sonhos",
    description: "Sob uma luz suave de luar, este espaço convida a mente ao descanso total e o corpo a se dissolver na mais pura sensação de segurança.",
    ambientSound: "night",
    baseInstruction: "Suavize o maxilar. Solte os ombros. Deixe que a escuridão suave te abrace e te guie para um sono reparador."
  },
  {
    id: "garden",
    name: "Jardim de Outono",
    subtitle: "A Harmonia com a Impermanência",
    description: "O vento sopra suavemente por entre as árvores, enquanto folhas secas caem no chão. Um local para meditar sobre o fluxo constante e natural da vida.",
    ambientSound: "waves",
    baseInstruction: "Observe as folhas caindo sem resistência. A natureza nos ensina que há beleza e sabedoria em deixar ir o que já cumpriu seu papel."
  },
  {
    id: "temple",
    name: "Templo do Silêncio",
    subtitle: "O Centro da Consciência Pura",
    description: "Um refúgio sagrado sem ornamentos ou distrações. Apenas você, a quietude divina e a profundidade insondável do momento presente.",
    ambientSound: "silence",
    baseInstruction: "Volte a sua atenção 100% para o som sutil do seu próprio respirar. Você é o oceano estável por trás de qualquer onda passageira."
  }
];

export default function App() {
  const [activeRoomId, setActiveRoomId] = useState<RoomId>("hall");
  const [activeRoom, setActiveRoom] = useState<Room>(ROOMS[0]);
  const [quote, setQuote] = useState("");
  const [quoteSource, setQuoteSource] = useState("");
  const [quoteLoading, setQuoteLoading] = useState(false);
  
  // Companion Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      text: "Seja muito bem-vindo(a) à Peace World. Eu sou o seu Guia da Casa.\n\nSinto muito orgulho por você ter reservado este momento para cuidar de si e respirar. Sinta-se em casa. Gostaria de conversar sobre como foi seu dia ou quer apenas meditar em silêncio?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [localTime, setLocalTime] = useState("");

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync Room selection
  useEffect(() => {
    const room = ROOMS.find((r) => r.id === activeRoomId) || ROOMS[0];
    setActiveRoom(room);
    fetchQuote(room.id);
  }, [activeRoomId]);

  // Scroll to bottom of chat - FIXED: only scrolls inside the chat box, never the whole page
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Refresh clock time
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLocalTime(now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch unique peace quote from API (Gemini or Fallback)
  const fetchQuote = async (roomId: RoomId) => {
    setQuoteLoading(true);
    try {
      const res = await fetch(`/api/peace/quote?room=${roomId}`);
      const data = await res.json();
      setQuote(data.quote);
      setQuoteSource(data.source);
    } catch (e) {
      console.error("Erro ao carregar frase de paz:", e);
      setQuote("A paz começa quando você escolhe não permitir que outra pessoa ou evento controle suas emoções.");
      setQuoteSource("Sabedoria Interior");
    } finally {
      setQuoteLoading(false);
    }
  };

  // Chat message submission
  const handleSendMessage = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const textToSend = customMsg || inputText;
    if (!textToSend.trim() || chatLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: textToSend.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setChatLoading(true);

    try {
      // Map message history to schema expected by server
      const history = messages.map((m) => ({
        role: m.role,
        text: m.text
      }));

      const response = await fetch("/api/peace/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend.trim(), history })
      });

      const data = await response.json();
      
      const modelMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "model",
        text: data.response || "Respire fundo. Sinto sua presença, mas minhas palavras silenciaram por um breve instante.",
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (error) {
      console.error("Erro ao enviar mensagem para o Guia:", error);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "model",
        text: "Sinto muito, meu canal de comunicação oscilou. Respire fundo e sinta o silêncio ao seu redor enquanto eu me restabeleço.",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  // Triggered when user clicks a journal entry to get feedback
  const handleJournalAskAI = (promptText: string) => {
    handleSendMessage(undefined, promptText);
    // Smooth scroll to chat section on mobile
    document.getElementById("chat-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <SafetyNotice>
    <div className="min-h-screen bg-neutral-950 text-white font-mono flex flex-col selection:bg-white selection:text-neutral-950 antialiased">
      {/* Visual background lines / starry dust minimalist feeling */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] z-0" />

      {/* Top Navbar */}
      <header className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur sticky top-0 z-50 px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-white flex items-center justify-center animate-spin [animation-duration:12s] shrink-0">
            <span className="w-3 h-[1px] bg-white block"></span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-widest text-white uppercase">Peace World</h1>
            <p className="text-[10px] text-neutral-400 tracking-wider">s i n t a - s e &nbsp; e m &nbsp; c a s a</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-neutral-400 text-xs">
            <Clock className="w-3.5 h-3.5 animate-pulse text-white" />
            <span className="font-bold tracking-widest bg-neutral-900 px-2 py-1 rounded text-white border border-neutral-800">{localTime || "00:00:00"}</span>
            <span className="text-[9px] uppercase hidden sm:inline">Tempo Presente</span>
          </div>
          
          <div className="hidden md:flex items-center gap-2 border border-neutral-800 px-3 py-1 rounded-full text-[10px] text-neutral-400 uppercase tracking-widest bg-neutral-900/40">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
            <span>Refúgio Seguro</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        
        {/* Left Column: House Nav (Rooms) & Interactive Visual Display (4 cols) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-neutral-900/40 border border-neutral-900 p-5 rounded-lg flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <span className="text-xs font-bold tracking-widest uppercase text-neutral-400">Cômodos do Ser</span>
              <span className="text-[10px] bg-white text-neutral-950 px-1.5 py-0.5 rounded font-bold uppercase">Zen</span>
            </div>
            
            <p className="text-xs text-neutral-400 leading-relaxed mb-1">
              Cada fase ou cômodo representa uma frequência mental. Escolha onde sua consciência deseja repousar agora:
            </p>

            <nav className="space-y-1.5">
              {ROOMS.map((room) => {
                const isActive = room.id === activeRoomId;
                return (
                  <button
                    id={`room-nav-btn-${room.id}`}
                    key={room.id}
                    onClick={() => setActiveRoomId(room.id)}
                    className={`w-full text-left px-3 py-3 rounded-lg border transition-all duration-300 flex items-center justify-between group ${
                      isActive 
                        ? "bg-white text-neutral-950 border-white font-bold translate-x-1" 
                        : "bg-transparent text-neutral-400 border-neutral-900 hover:border-neutral-800 hover:text-white"
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

          {/* Quick Guidance Box */}
          <div className="bg-neutral-900/20 border border-neutral-900/60 p-5 rounded-lg font-mono">
            <div className="flex items-center gap-2 text-neutral-300 mb-2">
              <Info className="w-4 h-4 text-white shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Como aproveitar?</h4>
            </div>
            <ul className="text-[11px] text-neutral-400 space-y-2 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-white shrink-0">✦</span>
                <span>Altere os cômodos para sintonizar diferentes vibrações e sons sintetizados.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-white shrink-0">✦</span>
                <span>Escreva suas dores no diário; ele ajudará você a esvaziar a bagagem.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-white shrink-0">✦</span>
                <span>Sincronize sua respiração com o círculo pulsante de forma profunda.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-white shrink-0">✦</span>
                <span>Converse com o Guia de Paz quando sentir necessidade de escuta acolhedora.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Center Column: Interactive Visual Room & Companion Chat (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Active Room Visual Canvas & Quote */}
          <div className="bg-white text-neutral-950 border border-white rounded-lg p-6 shadow-xl relative overflow-hidden flex flex-col min-h-[260px] justify-between transition-all duration-500">
            {/* Ambient minimalist visual frame */}
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Home className="w-32 h-32 text-neutral-900 stroke-[0.5]" />
            </div>

            <div className="z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] tracking-widest uppercase bg-neutral-950 text-white px-2 py-0.5 rounded font-bold">
                  Santuário Ativo
                </span>
                <span className="text-[10px] text-neutral-500 font-bold uppercase">
                  {activeRoom.subtitle}
                </span>
              </div>

              <h2 className="text-xl font-bold tracking-wide uppercase text-neutral-900 mb-2 mt-1">
                {activeRoom.name}
              </h2>
              
              <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                {activeRoom.description}
              </p>

              <div className="border-t border-neutral-200 pt-4 mb-4">
                <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-2">Instrução para a Alma:</p>
                <p className="text-xs text-neutral-700 italic bg-neutral-50 p-2.5 rounded border border-neutral-100 leading-relaxed">
                  &ldquo;{activeRoom.baseInstruction}&rdquo;
                </p>
              </div>
            </div>

            {/* Dynamic Quote Box */}
            <div className="z-10 mt-auto bg-neutral-950 text-white p-4 rounded border border-neutral-900">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-white" />
                  Intuição de Paz
                </span>
                <button
                  id="btn-refresh-quote"
                  onClick={() => fetchQuote(activeRoom.id)}
                  disabled={quoteLoading}
                  className="text-neutral-400 hover:text-white transition duration-200"
                  title="Buscar nova reflexão para este cômodo"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${quoteLoading ? "animate-spin" : ""}`} />
                </button>
              </div>

              {quoteLoading ? (
                <div className="py-2 flex items-center gap-2 text-[11px] text-neutral-400">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                  <span>Sintonizando sabedoria sob medida...</span>
                </div>
              ) : (
                <>
                  <p className="text-xs leading-relaxed italic text-neutral-100 font-serif">
                    &ldquo;{quote}&rdquo;
                  </p>
                  <p className="text-[9px] text-neutral-500 text-right mt-2 font-bold uppercase tracking-widest">
                    — {quoteSource}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Peace Companion Chat ("O Guia da Casa") */}
          <div id="chat-section" className="bg-neutral-900/40 border border-neutral-900 rounded-lg p-5 flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-white" />
                <span className="text-xs font-bold tracking-widest uppercase text-white">Diálogo com o Guia</span>
              </div>
              <span className="text-[10px] text-neutral-400">Presença Inteligente</span>
            </div>

            {/* Messages container - FIXED: added ref here so scroll stays contained */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 flex flex-col">
              {messages.map((m) => (
                <div
                  id={`chat-msg-${m.id}`}
                  key={m.id}
                  className={`flex flex-col max-w-[85%] ${
                    m.role === "user" ? "self-end items-end" : "self-start items-start"
                  }`}
                >
                  <div className={`flex items-center gap-1.5 mb-1 text-[9px] text-neutral-500 font-bold uppercase`}>
                    {m.role === "user" ? (
                      <>
                        <span>Você</span>
                        <User className="w-2.5 h-2.5" />
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Guia da Casa</span>
                      </>
                    )}
                  </div>
                  <div
                    className={`p-3 rounded-lg text-xs leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-white text-neutral-950 font-bold rounded-tr-none"
                        : "bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-tl-none"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              
              {chatLoading && (
                <div className="self-start flex flex-col items-start max-w-[80%]">
                  <div className="flex items-center gap-1.5 mb-1 text-[9px] text-neutral-500 font-bold uppercase">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>O Guia está refletindo...</span>
                  </div>
                  <div className="p-3 bg-neutral-900/50 text-neutral-400 border border-neutral-800/60 rounded-lg rounded-tl-none text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick replies for conversational comfort */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 shrink-0 max-w-full">
              {[
                "Estou me sentindo ansioso hoje",
                "Gostaria de uma meditação rápida",
                "Como posso me sentir em casa?",
                "Me ajude a dormir"
              ].map((suggestion, idx) => (
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

            {/* Chat Input form */}
            <form id="form-chat-input" onSubmit={handleSendMessage} className="flex gap-2 shrink-0">
              <input
                id="input-chat-message"
                type="text"
                placeholder="Pergunte ao Guia, esvazie seu coração..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs focus:border-white focus:outline-none text-white placeholder-neutral-500"
              />
              <button
                id="btn-send-chat"
                type="submit"
                className="bg-white text-neutral-950 px-3 py-2 rounded hover:bg-neutral-200 transition duration-200 active:scale-95"
                title="Enviar mensagem"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </section>

        {/* Right Column: Audio synthesizer + Breathing exercise + Journal (3 cols) */}
        <section className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Audio Synthesizer Controls */}
          <AudioPlayer activeSound={activeRoom.ambientSound} />

          {/* Interactive Breathing Tool */}
          <BreathingExercise />

          {/* Inner Peace Journal */}
          <Journal onAskAI={handleJournalAskAI} />

        </section>

      </main>

      {/* Footer / Minimalist Status */}
      <footer className="border-t border-neutral-950 bg-neutral-950 py-8 px-4 text-center mt-auto">
        <div className="max-w-2xl mx-auto space-y-3">
          <p className="text-xs text-neutral-400 font-serif italic">
            &ldquo;A paz não é a ausência de tempestades, mas a calmaria dentro de si.&rdquo;
          </p>
          <div className="flex justify-center items-center gap-3 text-[10px] text-neutral-600 uppercase tracking-widest font-mono">
            <span>Peace World © 2026</span>
            <span>•</span>
            <span>Estética B&W Minimalista</span>
            <span>•</span>
            <span>Sintonia do Agora</span>
          </div>
        </div>
      </footer>
    </div>
    </SafetyNotice>
  );
}
