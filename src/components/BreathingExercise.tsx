import { useState, useEffect, useRef } from "react";
import { Wind, Play, Square, Settings, RefreshCw } from "lucide-react";

type BreathingTechnique = "box" | "relax" | "equal";

interface CycleStep {
  name: string;
  duration: number; // in seconds
  action: "inhale" | "hold" | "exhale" | "rest";
  instruction: string;
}

const TECHNIQUES: Record<BreathingTechnique, {
  name: string;
  description: string;
  steps: CycleStep[];
}> = {
  equal: {
    name: "Respiração Equilibrada (Coerência)",
    description: "Excelente para acalmar o sistema nervoso de forma rápida e estável.",
    steps: [
      { name: "Inspirar", duration: 5, action: "inhale", instruction: "Puxe o ar suavemente pelo nariz..." },
      { name: "Expirar", duration: 5, action: "exhale", instruction: "Solte o ar de forma lenta e constante..." }
    ]
  },
  box: {
    name: "Respiração Quadrada (Box Breathing)",
    description: "Usada para acalmar a ansiedade de pico e trazer foco mental absoluto.",
    steps: [
      { name: "Inspirar", duration: 4, action: "inhale", instruction: "Inale expandindo o abdômen..." },
      { name: "Reter Cheio", duration: 4, action: "hold", instruction: "Segure o ar com os pulmões cheios..." },
      { name: "Expirar", duration: 4, action: "exhale", instruction: "Exile soltando todas as tensões..." },
      { name: "Reter Vazio", duration: 4, action: "hold", instruction: "Aguarde sem ar antes de iniciar novamente..." }
    ]
  },
  relax: {
    name: "Técnica 4-7-8 (Relaxamento Profundo)",
    description: "Um tranquilizante natural para o sistema nervoso. Ideal para induzir o sono.",
    steps: [
      { name: "Inspirar", duration: 4, action: "inhale", instruction: "Inale silenciosamente pelo nariz..." },
      { name: "Reter Cheio", duration: 7, action: "hold", instruction: "Mantenha o ar suspenso com calma..." },
      { name: "Expirar", duration: 8, action: "exhale", instruction: "Exile ruidosamente pela boca, esvaziando..." }
    ]
  }
};

export default function BreathingExercise() {
  const [technique, setTechnique] = useState<BreathingTechnique>("equal");
  const [isActive, setIsActive] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TECHNIQUES.equal.steps[0].duration);
  const [cycleCount, setCycleCount] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentTechnique = TECHNIQUES[technique];
  const currentStep = currentTechnique.steps[currentStepIdx];

  // Handle technique change
  useEffect(() => {
    setIsActive(false);
    setCurrentStepIdx(0);
    setTimeLeft(TECHNIQUES[technique].steps[0].duration);
    setCycleCount(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [technique]);

  // Main breathing cycle effect
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Transition to next step
            const nextIdx = (currentStepIdx + 1) % currentTechnique.steps.length;
            setCurrentStepIdx(nextIdx);
            
            // If we returned to the first step, increment cycle count
            if (nextIdx === 0) {
              setCycleCount((c) => c + 1);
            }
            
            return currentTechnique.steps[nextIdx].duration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, currentStepIdx, technique]);

  const toggleExercise = () => {
    setIsActive(!isActive);
  };

  const resetExercise = () => {
    setIsActive(false);
    setCurrentStepIdx(0);
    setTimeLeft(currentTechnique.steps[0].duration);
    setCycleCount(0);
  };

  // Determine scaling of the circle based on breathing step and time left
  const getCircleScale = () => {
    if (!isActive) return 1.0;
    
    const stepDuration = currentStep.duration;
    const elapsed = stepDuration - timeLeft;
    const progress = elapsed / stepDuration;

    if (currentStep.action === "inhale") {
      // Scale up from 1.0 to 1.8
      return 1.0 + (progress * 0.8);
    } else if (currentStep.action === "exhale") {
      // Scale down from 1.8 to 1.0
      return 1.8 - (progress * 0.8);
    } else if (currentStep.action === "hold") {
      // Keep static (either fully expanded 1.8 or contracted 1.0 depending on context)
      // Usually Reter Cheio is fully expanded (1.8), Reter Vazio is contracted (1.0)
      return currentStep.name.includes("Cheio") ? 1.8 : 1.0;
    }
    return 1.0;
  };

  return (
    <div id="breathing-panel" className="bg-white border border-neutral-900 rounded-lg p-6 shadow-sm font-mono text-neutral-900 transition-all flex flex-col md:flex-row gap-6 items-center">
      <div className="flex-1 w-full">
        <div className="flex items-center gap-2 mb-2">
          <Wind className="w-5 h-5 text-neutral-900" />
          <h3 className="text-sm font-bold tracking-wider uppercase">Fase de Respiração</h3>
        </div>
        
        <p className="text-xs text-neutral-500 mb-4">
          Conecte-se com o seu corpo e acalme seus batimentos cardíacos através da respiração consciente.
        </p>

        <div className="space-y-1.5 mb-6">
          {(Object.keys(TECHNIQUES) as BreathingTechnique[]).map((techId) => (
            <button
              id={`tech-btn-${techId}`}
              key={techId}
              onClick={() => setTechnique(techId)}
              className={`w-full text-left p-2.5 rounded border transition-all flex justify-between items-center ${
                technique === techId
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white hover:border-neutral-400 text-neutral-700"
              }`}
            >
              <div>
                <p className="text-xs font-bold">{TECHNIQUES[techId].name}</p>
                <p className="text-[10px] opacity-75 mt-0.5 line-clamp-1">{TECHNIQUES[techId].description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-breathing"
            onClick={toggleExercise}
            className={`flex-1 py-2 rounded text-xs border border-neutral-900 transition duration-200 flex items-center justify-center gap-1.5 active:translate-y-[1px] ${
              isActive 
                ? "bg-white text-neutral-900 hover:bg-neutral-50"
                : "bg-neutral-900 text-white hover:bg-neutral-800"
            }`}
          >
            {isActive ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Começar</span>
              </>
            )}
          </button>
          
          <button
            id="btn-reset-breathing"
            onClick={resetExercise}
            className="p-2 border border-neutral-200 rounded hover:border-neutral-900 text-neutral-500 hover:text-neutral-900 transition duration-200"
            title="Reiniciar contagem"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {cycleCount > 0 && (
          <div className="mt-4 text-center">
            <span className="text-[10px] bg-neutral-100 px-2 py-1 rounded text-neutral-600">
              Ciclos Concluídos: <strong className="text-neutral-900">{cycleCount}</strong>
            </span>
          </div>
        )}
      </div>

      <div className="w-full md:w-64 h-64 border border-neutral-100 bg-neutral-50 rounded flex flex-col items-center justify-center relative overflow-hidden shrink-0">
        {/* Animated breathing circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-24 h-24 rounded-full bg-neutral-100 border border-neutral-950/10 flex items-center justify-center transition-transform duration-1000 ease-linear"
            style={{ 
              transform: `scale(${getCircleScale()})`,
            }}
          />
        </div>

        {/* Core solid breathing label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-white border border-neutral-900 flex flex-col items-center justify-center shadow-md z-10">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
              {isActive ? currentStep.name : "Pronto"}
            </span>
            <span className="text-2xl font-bold tracking-tight text-neutral-900 mt-0.5">
              {isActive ? timeLeft : "0"}s
            </span>
          </div>
        </div>

        {/* Interactive action instructions */}
        <div className="absolute bottom-4 left-4 right-4 text-center z-10">
          <p className="text-[10px] text-neutral-700 font-medium h-8 flex items-center justify-center px-2">
            {isActive ? currentStep.instruction : "Clique em Começar para sintonizar a respiração"}
          </p>
        </div>
      </div>
    </div>
  );
}
