import React from "react";
import {
  X,
  AlertTriangle,
  Sun,
  CloudRain,
  Zap,
  Sliders,
  FlaskConical,
  RotateCcw,
  CheckCircle,
  Bug,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface StressSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScenario: (scenarioType: string) => void;
}

export const StressSimulatorModal: React.FC<StressSimulatorModalProps> = ({
  isOpen,
  onClose,
  onApplyScenario,
}) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const scenarios = [
    {
      id: "PEST_BOLLWORM_OUTBREAK",
      title: "Pest Attack: Pink Bollworm (गुलाबी बोंडअळी)",
      icon: Bug,
      color: "text-rose-400 bg-rose-950/60 border-rose-800",
      description: "Injects acute Pink Bollworm infestation on squares/bolls with square damage and economic threshold (ETL) breach.",
    },
    {
      id: "PEST_APHIDS_INFESTATION",
      title: "Pest Attack: Cotton Aphids & Jassids (माहू / मावा)",
      icon: Bug,
      color: "text-orange-400 bg-orange-950/60 border-orange-800",
      description: "Simulates severe sap-sucking aphid colony clustering under foliage with leaf curling and honeydew mold risk.",
    },
    {
      id: "HEATWAVE_DRY_SPELL",
      title: t.stressModal.heatWave,
      icon: Sun,
      color: "text-amber-400 bg-amber-950/60 border-amber-800",
      description: t.stressModal.heatWaveDesc,
    },
    {
      id: "RURAL_SINGLE_PHASING",
      title: t.stressModal.voltageSag,
      icon: Zap,
      color: "text-rose-400 bg-rose-950/60 border-rose-800",
      description: t.stressModal.voltageSagDesc,
    },
    {
      id: "SUDDEN_CLOUDBURST",
      title: t.stressModal.monsoonSurge,
      icon: CloudRain,
      color: "text-cyan-400 bg-cyan-950/60 border-cyan-800",
      description: t.stressModal.monsoonSurgeDesc,
    },
    {
      id: "SENSOR_ELECTROMAGNETIC_NOISE",
      title: t.stressModal.sensorNoise,
      icon: Sliders,
      color: "text-purple-400 bg-purple-950/60 border-purple-800",
      description: t.stressModal.sensorNoiseDesc,
    },
    {
      id: "NITROGEN_DEFICIENCY",
      title: t.stressModal.canalClosure,
      icon: FlaskConical,
      color: "text-yellow-400 bg-yellow-950/60 border-yellow-800",
      description: t.stressModal.canalClosureDesc,
    },
    {
      id: "RESTORE_OPTIMAL",
      title: t.stressModal.restoreOptimal,
      icon: RotateCcw,
      color: "text-emerald-400 bg-emerald-950/60 border-emerald-800",
      description: t.stressModal.restoreOptimalDesc,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-950 px-6 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-rose-950 text-rose-300 border border-rose-800 shadow-md">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                {t.stressModal.title}
              </h2>
              <p className="text-xs text-stone-400">
                {t.stressModal.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body list */}
        <div className="p-6 overflow-y-auto space-y-3">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            return (
              <button
                key={sc.id}
                onClick={() => {
                  onApplyScenario(sc.id);
                  onClose();
                }}
                className="w-full text-left p-3.5 rounded-xl bg-stone-950/70 hover:bg-stone-950 border border-stone-800 hover:border-stone-700 transition-all cursor-pointer flex items-start space-x-3 group"
              >
                <div className={`p-2.5 rounded-lg border ${sc.color} shrink-0 mt-0.5`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-stone-200 group-hover:text-emerald-400 transition-colors">
                    {sc.title}
                  </div>
                  <div className="text-xs text-stone-400 mt-1 leading-relaxed">
                    {sc.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-stone-950 px-6 py-3 border-t border-stone-800 flex items-center justify-end text-xs">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium transition-colors cursor-pointer"
          >
            {t.stressModal.close}
          </button>
        </div>
      </div>
    </div>
  );
};
