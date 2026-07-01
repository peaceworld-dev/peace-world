import React, { useState, useEffect } from "react";
import { PenTool, Trash2, Calendar, Smile, Heart, Sunset, Coffee, BookOpen } from "lucide-react";
import { JournalNote } from "../types";

interface JournalProps {
  onAskAI: (noteContent: string) => void;
}

const MOODS = [
  { id: "ansioso", label: "Ansioso(a)", icon: Sunset, description: "A mente está agitada, buscando calmaria." },
  { id: "cansado", label: "Cansado(a)", icon: Coffee, description: "O corpo e a alma pedem repouso sagrado." },
  { id: "grato", label: "Grato(a)", icon: Heart, description: "Reconhecendo as pequenas belezas do caminho." },
  { id: "paz", label: "Em Paz", icon: Smile, description: "Sintonizado com o silêncio e o agora." }
];

export default function Journal({ onAskAI }: JournalProps) {
  const [notes, setNotes] = useState<JournalNote[]>([]);
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState("ansioso");
  const [isOpen, setIsOpen] = useState(false);

  // Load notes on mount
  useEffect(() => {
    const saved = localStorage.getItem("peace_world_journal");
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading journal notes", e);
      }
    }
  }, []);

  const saveNotes = (updated: JournalNote[]) => {
    setNotes(updated);
    localStorage.setItem("peace_world_journal", JSON.stringify(updated));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const newNote: JournalNote = {
      id: crypto.randomUUID(),
      content: content.trim(),
      mood: selectedMood,
      createdAt: new Date().toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    const updated = [newNote, ...notes];
    saveNotes(updated);
    
    // Automatically trigger AI reflection support for the user
    onAskAI(`Escrevi no meu diário de paz hoje que estou me sentindo "${selectedMood}". Aqui está o que escrevi: "${content.trim()}". Por favor, me dê um conselho doce, pacificador e me ajude a relaxar.`);
    
    setContent("");
    setIsOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Deseja mesmo apagar esta reflexão? Ela se dissipará como o vento...")) {
      const updated = notes.filter((n) => n.id !== id);
      saveNotes(updated);
    }
  };

  return (
    <div id="journal-panel" className="bg-white border border-neutral-900 rounded-lg p-6 shadow-sm font-mono text-neutral-900 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-neutral-900" />
            <h3 className="text-sm font-bold tracking-wider uppercase">Diário de Paz</h3>
          </div>
          <p className="text-xs text-neutral-500 mt-1">Esvazie a mente escrevendo e sinta o peso sumir</p>
        </div>
        <button
          id="btn-toggle-new-entry"
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1.5 bg-neutral-900 text-white rounded text-xs hover:bg-neutral-800 transition duration-200 flex items-center gap-1.5"
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>{isOpen ? "Fechar" : "Nova Reflexão"}</span>
        </button>
      </div>

      {isOpen && (
        <form id="form-new-journal" onSubmit={handleSave} className="border border-neutral-900 p-4 rounded-lg mb-6 bg-neutral-50 animate-fadeIn">
          <p className="text-xs font-bold uppercase tracking-wider mb-2 text-neutral-700">Como está o seu ser neste momento?</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-4">
            {MOODS.map((m) => {
              const MoodIcon = m.icon;
              return (
                <button
                  id={`mood-btn-${m.id}`}
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMood(m.id)}
                  className={`flex flex-col items-center p-2 rounded border text-[11px] transition-all ${
                    selectedMood === m.id
                      ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                      : "border-neutral-200 bg-white hover:border-neutral-400 text-neutral-600"
                  }`}
                  title={m.description}
                >
                  <MoodIcon className="w-4 h-4 mb-1" />
                  <span className="font-bold">{m.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-1 mb-4">
            <label className="text-[10px] text-neutral-400 uppercase font-bold">Reflexão ou Sentimento</label>
            <textarea
              id="textarea-journal-content"
              required
              rows={4}
              placeholder="Ex: Hoje o mundo lá fora pareceu rápido demais... Quero apenas respirar e sentir o silêncio da minha casa..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 border border-neutral-300 rounded text-xs focus:border-neutral-900 focus:outline-none bg-white placeholder-neutral-400 leading-relaxed text-neutral-800"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              id="btn-cancel-journal"
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 border border-neutral-200 rounded text-xs hover:border-neutral-900 text-neutral-500 hover:text-neutral-900 transition"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-journal"
              type="submit"
              className="px-4 py-1.5 bg-neutral-900 text-white rounded text-xs hover:bg-neutral-800 transition font-bold"
            >
              Dissipar no Diário
            </button>
          </div>
        </form>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-neutral-200 rounded-lg bg-neutral-50/50">
          <PenTool className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-xs text-neutral-500">Seu diário está límpido e em branco.</p>
          <p className="text-[10px] text-neutral-400 mt-1">Coloque em palavras o que você deseja liberar hoje.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {notes.map((note) => {
            const moodObj = MOODS.find((m) => m.id === note.mood) || MOODS[0];
            const MoodIcon = moodObj.icon;
            
            return (
              <div
                id={`journal-note-${note.id}`}
                key={note.id}
                onClick={() => onAskAI(`Por favor, reflita comigo sobre o que escrevi no meu diário: "${note.content}". Minha vibração é "${moodObj.label}".`)}
                className="group border border-neutral-200 hover:border-neutral-900 p-3.5 rounded-lg bg-white hover:bg-neutral-50/40 transition duration-200 cursor-pointer relative"
                title="Clique para conversar com o Guia sobre esta nota"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 bg-neutral-100 rounded text-neutral-900 group-hover:bg-neutral-200 transition">
                      <MoodIcon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[10px] uppercase font-bold text-neutral-800">
                      Sentindo-se {moodObj.label}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[9px] text-neutral-400">
                      <Calendar className="w-3 h-3" />
                      <span>{note.createdAt}</span>
                    </div>
                    <button
                      id={`btn-delete-note-${note.id}`}
                      onClick={(e) => handleDelete(note.id, e)}
                      className="p-1 text-neutral-300 hover:text-red-600 transition hover:bg-neutral-100 rounded"
                      title="Apagar da memória"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap line-clamp-3 group-hover:text-neutral-900 transition">
                  {note.content}
                </p>

                <div className="mt-2.5 flex justify-between items-center text-[9px] text-neutral-400 font-bold group-hover:text-neutral-700 transition">
                  <span>✦ Clique para receber afeto do Guia</span>
                  <span className="opacity-0 group-hover:opacity-100 transition duration-300">Pedir Reflexão →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
