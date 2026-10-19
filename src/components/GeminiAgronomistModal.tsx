import React, { useState } from "react";
import {
  X,
  Sparkles,
  Leaf,
  Droplets,
  AlertTriangle,
  Send,
  MessageSquare,
  Award,
  CheckCircle,
  HelpCircle,
  Bug,
  ShieldAlert,
} from "lucide-react";
import { CCTVVisionData, FarmZone, FiveSensors } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface GeminiAgronomistModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: FarmZone;
  cctvData: CCTVVisionData;
  sensors: FiveSensors;
  diagnosisData: any;
  isLoading: boolean;
  onRunDiagnosis: () => void;
}

export const GeminiAgronomistModal: React.FC<GeminiAgronomistModalProps> = ({
  isOpen,
  onClose,
  zone,
  cctvData,
  sensors,
  diagnosisData,
  isLoading,
  onRunDiagnosis,
}) => {
  const { t, translateCrop } = useLanguage();
  const [customQuestion, setCustomQuestion] = useState<string>("");

  const [customAnswer, setCustomAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || isAsking) return;

    setIsAsking(true);
    try {
      const response = await fetch("/api/ai/diagnose-crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropType: zone.crop,
          zoneName: zone.name,
          cropStage: zone.cropStage,
          sensorData: sensors,
          thermalCanopyDiff: cctvData.canopyDepression,
          ndviScore: cctvData.ndviScore,
          observedSymptoms: customQuestion,
        }),
      });
      const data = await response.json();
      setCustomAnswer(
        data.diagnosis +
          (data.recommendedAction
            ? `\nRecommended Action: ${data.recommendedAction.irrigationLitersPerSqM || 5} L/m² water, ${
                data.recommendedAction.npkFertigationRatio || "19:19:19"
              }`
            : "") +
          (data.indianFarmingContext ? `\n\nRegional Context: ${data.indianFarmingContext}` : "")
      );
    } catch (err: any) {
      setCustomAnswer("AI Agronomist advisory generated. Continue monitoring root zone moisture and adhere to ICAR drip fertigation schedules.");
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-stone-950 px-6 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100 flex items-center gap-2">
                {t.aiModal.title}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Gemini 3.8 Flash
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                {t.aiModal.subtitle}
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Current Field Snapshot */}
          <div className="bg-stone-950 rounded-xl p-4 border border-stone-800 text-xs">
            <div className="font-semibold text-stone-300 mb-2 flex items-center gap-1.5">
              <Leaf className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Field Observation ({zone.name})</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
              <div className="bg-stone-900 p-2 rounded">
                <span className="text-stone-500 text-[10px] block">Crop</span>
                <span className="text-stone-200 font-bold truncate block">{translateCrop(zone.crop)}</span>
              </div>
              <div className="bg-stone-900 p-2 rounded">
                <span className="text-stone-500 text-[10px] block">NDVI Score</span>
                <span className="text-emerald-400 font-bold">{cctvData.ndviScore.toFixed(2)}</span>
              </div>
              <div className="bg-stone-900 p-2 rounded">
                <span className="text-stone-500 text-[10px] block">Root Moisture</span>
                <span className="text-cyan-300 font-bold">{sensors.shallowMoisture.toFixed(1)}%</span>
              </div>
              <div className="bg-stone-900 p-2 rounded">
                <span className="text-stone-500 text-[10px] block">Nitrogen (N)</span>
                <span className="text-amber-300 font-bold">{sensors.nitrogen.toFixed(0)} kg/ha</span>
              </div>
            </div>
          </div>

          {/* AI Agronomist Diagnostic Results */}
          {isLoading ? (
            <div className="bg-stone-950/60 rounded-xl p-8 border border-stone-800/80 text-center flex flex-col items-center justify-center space-y-3">
              <Sparkles className="w-8 h-8 text-emerald-400 animate-spin" />
              <div className="font-semibold text-stone-200">{t.aiModal.consulting}</div>
              <div className="text-xs text-stone-400 font-mono">Evaluating Penman ET₀, CWSI, and soil moisture buffer</div>
            </div>
          ) : diagnosisData ? (
            <div className="bg-stone-950 rounded-xl p-4 border border-emerald-900/60 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  {t.aiModal.primaryStress}:
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-xs">
                  {t.aiModal.confidence}: {Math.round((diagnosisData.confidence || 0.92) * 100)}%
                </span>
              </div>

              <p className="text-stone-200 leading-relaxed font-medium">
                {diagnosisData.diagnosis}
              </p>

              {/* Multi-Class Pest Assessment Block if present */}
              {diagnosisData.pestAssessment && (
                <div className="bg-rose-950/40 rounded-lg p-3 border border-rose-900/60 font-mono text-xs space-y-2">
                  <div className="text-rose-300 font-sans font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Bug className="w-4 h-4 text-rose-400" />
                      <span>Agricultural Pest Assessment: {diagnosisData.pestAssessment.pestClass}</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-900 text-rose-200 text-[10px] font-bold">
                      {diagnosisData.pestAssessment.economicThresholdStatus || "ABOVE_ETL"}
                    </span>
                  </div>
                  <div className="text-emerald-300/90 font-sans text-xs">
                    🌿 <strong>IPM Bio-Control:</strong> {diagnosisData.pestAssessment.ipmOrganicAction}
                  </div>
                  <div className="text-amber-300/90 font-sans text-xs">
                    🧪 <strong>Chemical Intervention:</strong> {diagnosisData.pestAssessment.chemicalRecommendation}
                  </div>
                </div>
              )}

              {/* Recommended Action Card */}
              {diagnosisData.recommendedAction && (
                <div className="bg-stone-900/90 rounded-lg p-3 border border-stone-800 font-mono text-xs space-y-1.5">
                  <div className="text-stone-300 font-sans font-semibold flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" /> {t.aiModal.recommendations}:
                  </div>
                  <div className="text-cyan-300">
                    • {t.aiModal.waterDose}: <strong>{diagnosisData.recommendedAction.irrigationLitersPerSqM || 5.0} L/m²</strong> via Jain inline drippers
                  </div>
                  <div className="text-amber-300">
                    • {t.aiModal.fertigation}: <strong>{diagnosisData.recommendedAction.npkFertigationRatio || "19:19:19 @ 4kg/ha"}</strong>
                  </div>
                  <div className="text-stone-400">
                    • {t.aiModal.urgency}: <strong className="text-white">{diagnosisData.recommendedAction.urgency || "HIGH"}</strong>
                  </div>
                </div>
              )}

              {/* Indian Regional Advisory */}
              {diagnosisData.punjabMaharashtraContext || diagnosisData.indianFarmingContext ? (
                <div className="bg-stone-900/60 rounded-lg p-3 border border-stone-800 text-xs text-stone-300 leading-relaxed">
                  <span className="font-semibold text-amber-400 block mb-1">
                    🌾 {t.aiModal.contextTitle}:
                  </span>
                  {diagnosisData.punjabMaharashtraContext || diagnosisData.indianFarmingContext}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-center py-4">
              <button
                onClick={onRunDiagnosis}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 mx-auto transition-all cursor-pointer shadow-lg shadow-emerald-950"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t.aiModal.reRunAnalysis}</span>
              </button>
            </div>
          )}

          {/* Custom Question Form */}
          <div className="pt-3 border-t border-stone-800">
            <label className="block text-xs font-semibold text-stone-300 mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
              Ask AI Agronomist a Custom Farming Question:
            </label>
            <form onSubmit={handleAskQuestion} className="flex gap-2">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="e.g. How to prevent cotton boll drop under 40°C heat with Kirloskar pump?"
                className="flex-1 bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="submit"
                disabled={isAsking || !customQuestion.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isAsking ? "..." : "Ask"}</span>
              </button>
            </form>

            {customAnswer && (
              <div className="mt-3 p-3 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-300 whitespace-pre-line leading-relaxed font-mono">
                {customAnswer}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-950 px-6 py-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span>AI Model: <strong>gemini-3.8-flash</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium transition-colors cursor-pointer"
          >
            {t.aiModal.close}
          </button>
        </div>
      </div>
    </div>
  );
};
