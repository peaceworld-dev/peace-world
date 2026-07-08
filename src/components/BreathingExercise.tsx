import { useState, useEffect, useRef } from "react";
import { Wind, Play, Square, RefreshCw } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

type BreathingTechnique = "box" | "relax" | "equal";

interface StepDef {
  duration: number;
  action: "inhale" | "hold" | "exhale";
}

const STEP_DEFS: Record<BreathingTechnique, StepDef[]> = {
  equal: [
    { duration: 5, action: "inhale" },
    { duration: 5, action: "exhale" },
  ],
  box: [
    { duration: 4, action: "inhale" },
    { duration: 4, action: "hold" },
    { duration: 4, action: "exhale" },
    { duration: 4, action: "hold" },
  ],
  relax: [
    { duration: 4, action: "inhale" },
    { duration: 7, action: "hold" },
    { duration: 8, action: "exhale" },
  ],
};

export default function BreathingExercise() {
  const { t } = useLanguage();
  const [technique, setTechnique] = useState<BreathingTechnique>("equal");
  const [isActive, setIsActive] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(STEP_DEFS.equal[0].duration);
  const [cycleCount, setCycleCount] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const techniqueKeys: BreathingTechnique[] = ["equal", "box", "relax"];
  const steps = STEP_DEFS[technique];
  const currentStep = steps[currentStepIdx];
  const translatedSteps: { name: string; instruction: string }[] = t(`breathing.techniques.${technique}.steps`);
  const currentStepText = translatedSteps[currentStepIdx];

  useEffect(() => {
    setIsActive(false);
    setCurrentStepIdx(0);
    setTimeLeft(STEP_DEFS[technique][0].duration);
    setCycleCount(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [technique]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            const nextIdx = (currentStepIdx + 1) % steps.length;
            setCurrentStepIdx(nextIdx);
            if (nextIdx === 0) {
              setCycleCount((c) => c + 1);
            }
            return steps[nextIdx].duration;
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

  const toggleExercise = () => setIsActive(!isActive);
  const resetExercise = () => {
    setIsActive(false);
    setCurrentStepIdx(0);
    setTimeLeft(steps[0].duration);
    setCycleCount(0);
  };

  const getCircleScale = () => {
    if (!isActive) return 1.0;
    const stepDuration = currentStep.duration;
    const elapsed = stepDuration - timeLeft;
    const progress = elapsed / stepDuration;

    if (currentStep.action === "inhale") return 1.0 + progress * 0.8;
    if (currentStep.action === "exhale") return 1.8 - progress * 0.8;
    if (currentStep.action === "hold") {
      // First hold in a technique is "full", following one (if any) is "empty"
      const holdIndexes = steps.map((s, i) => (s.action === "hold" ? i : -1)).filter((i) => i >= 0);
      return currentStepIdx === holdIndexes[0] ? 1.8 : 1.0;
    }
    return 1.0;
  };

  return (
    <div id="breathing-panel" className="bg-white border border-neutral-900 rounded-lg p-6 shadow-sm font-mono text-neutral-900 transition-all flex flex-col gap-6 items-center overflow-hidden">
      <div className="flex-1 w-full">
        <div className="flex items-center gap-2 mb-2">
          <Wind className="w-5 h-5 text-neutral-900" />
          <h3 className="text-sm font-bold tracking-wider uppercase">{t("breathing.title")}</h3>
        </div>

        <p className="text-xs text-neutral-500 mb-4">{t("breathing.description")}</p>

        <div className="space-y-1.5 mb-6">
          {techniqueKeys.map((techId) => (
            <button
              id={`tech-btn-${techId}`}
              key={techId}
              onClick={() => setTechnique(techId)}
              className={`w-full text-left p-2.5 rounded border transition-all flex justify-between items-center ${
                technique === techId ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white hover:border-neutral-400 text-neutral-700"
              }`}
            >
              <div>
                <p className="text-xs font-bold">{t(`breathing.techniques.${techId}.name`)}</p>
                <p className="text-[10px] opacity-75 mt-0.5 line-clamp-1">{t(`breathing.techniques.${techId}.description`)}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-breathing"
            onClick={toggleExercise}
            className={`flex-1 py-2 rounded text-xs border border-neutral-900 transition duration-200 flex items-center justify-center gap-1.5 active:translate-y-[1px] ${
              isActive ? "bg-white text-neutral-900 hover:bg-neutral-50" : "bg-neutral-900 text-white hover:bg-neutral-800"
            }`}
          >
            {isActive ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>{t("breathing.pause")}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t("breathing.start")}</span>
              </>
            )}
          </button>

          <button
            id="btn-reset-breathing"
            onClick={resetExercise}
            className="p-2 border border-neutral-200 rounded hover:border-neutral-900 text-neutral-500 hover:text-neutral-900 transition duration-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {cycleCount > 0 && (
          <div className="mt-4 text-center">
            <span className="text-[10px] bg-neutral-100 px-2 py-1 rounded text-neutral-600">
              {t("breathing.cyclesCompleted")} <strong className="text-neutral-900">{cycleCount}</strong>
            </span>
          </div>
        )}
      </div>

      <div className="w-full max-w-full h-64 border border-neutral-100 bg-neutral-50 rounded flex flex-col items-center justify-center relative overflow-hidden shrink-0 box-border">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-24 h-24 rounded-full bg-neutral-100 border border-neutral-950/10 flex items-center justify-center transition-transform duration-1000 ease-linear"
            style={{ transform: `scale(${getCircleScale()})` }}
          />
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-white border border-neutral-900 flex flex-col items-center justify-center shadow-md z-10">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
              {isActive ? currentStepText?.name : t("breathing.ready")}
            </span>
            <span className="text-2xl font-bold tracking-tight text-neutral-900 mt-0.5">{isActive ? timeLeft : "0"}s</span>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 text-center z-10">
          <p className="text-[10px] text-neutral-700 font-medium h-8 flex items-center justify-center px-2">
            {isActive ? currentStepText?.instruction : t("breathing.clickToStart")}
          </p>
        </div>
      </div>
    </div>
  );
}
