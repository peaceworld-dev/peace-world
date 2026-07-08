import { useState, useEffect, ReactNode } from "react";
import { HeartHandshake, Compass, X } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

const STORAGE_KEY = "peace_world_entry_accepted";

interface SafetyNoticeProps {
  children: ReactNode;
}

export default function SafetyNotice({ children }: SafetyNoticeProps) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<"pending" | "accepted" | "declined">("pending");
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  useEffect(() => {
    const alreadyAccepted = localStorage.getItem(STORAGE_KEY);
    if (alreadyAccepted) {
      setStatus("accepted");
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setStatus("accepted");
  };

  const handleDecline = () => {
    setStatus("declined");
  };

  if (status === "pending") {
    return (
      <div className="fixed inset-0 z-[100] bg-neutral-950 flex items-center justify-center p-4 font-mono overflow-y-auto">
        <div className="max-w-md w-full text-white py-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-full border border-white flex items-center justify-center animate-spin [animation-duration:12s]">
              <span className="w-4 h-[1px] bg-white block"></span>
            </div>
          </div>

          <h1 className="text-center text-lg font-bold tracking-widest uppercase mb-2">{t("safety.welcomeTitle")}</h1>
          <p className="text-center text-xs text-neutral-400 mb-8 tracking-wider">{t("safety.welcomeSubtitle")}</p>

          <div className="text-xs text-neutral-300 leading-relaxed space-y-4 mb-8 bg-neutral-900/50 border border-neutral-800 rounded-lg p-5">
            <p>{t("safety.para1")}</p>
            <p>{t("safety.para2")}</p>
            <p className="text-neutral-400">{t("safety.para3")}</p>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              id="btn-accept-entry"
              onClick={handleAccept}
              className="w-full py-3 bg-white text-neutral-950 rounded text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition"
            >
              {t("safety.acceptBtn")}
            </button>
            <button
              id="btn-decline-entry"
              onClick={handleDecline}
              className="w-full py-3 bg-transparent border border-neutral-800 text-neutral-400 rounded text-xs uppercase tracking-wider hover:border-neutral-600 hover:text-neutral-200 transition"
            >
              {t("safety.declineBtn")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "declined") {
    return (
      <div className="fixed inset-0 z-[100] bg-neutral-950 flex items-center justify-center p-4 font-mono">
        <div className="max-w-sm w-full text-center text-white">
          <Compass className="w-8 h-8 mx-auto mb-4 text-neutral-500" />
          <p className="text-sm text-neutral-300 leading-relaxed mb-6">{t("safety.declineMessage")}</p>
          <button
            id="btn-reconsider-entry"
            onClick={() => setStatus("pending")}
            className="text-xs text-neutral-500 hover:text-white underline underline-offset-4 transition"
          >
            {t("safety.reconsider")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}

      <div className="border-t border-neutral-900 bg-neutral-950 px-4 py-3">
        <button
          id="btn-open-safety-info"
          onClick={() => setShowInfoPanel(true)}
          className="max-w-2xl mx-auto flex items-center justify-center gap-1.5 text-[10px] text-neutral-500 hover:text-neutral-300 transition w-full"
        >
          <HeartHandshake className="w-3 h-3 shrink-0" />
          <span>{t("safety.footerNote")}</span>
        </button>
      </div>

      {showInfoPanel && (
        <div className="fixed inset-0 z-[100] bg-neutral-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-neutral-900 rounded-lg max-w-md w-full p-6 shadow-2xl border border-neutral-800 font-mono relative">
            <button
              id="btn-close-safety-info"
              onClick={() => setShowInfoPanel(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <HeartHandshake className="w-5 h-5 text-neutral-900 shrink-0" />
              <h2 className="text-sm font-bold uppercase tracking-wider">{t("safety.modalTitle")}</h2>
            </div>

            <div className="text-xs text-neutral-700 leading-relaxed space-y-3">
              <p>{t("safety.modalPara1")}</p>
              <p>{t("safety.modalPara2")}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
