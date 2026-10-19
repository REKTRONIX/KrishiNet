import { FertilizerRecipe, FertilizerRecipeId, FertilizerSchedule } from "../types";

export const FERTILIZER_RECIPES: Record<FertilizerRecipeId, FertilizerRecipe> = {
  NPK_19_19_19: {
    id: "NPK_19_19_19",
    name: "19:19:19 NPK Water Soluble",
    nRatio: 19,
    pRatio: 19,
    kRatio: 19,
    description: "Fully soluble balanced multi-nutrient complex for drip fertigation.",
    recommendedFor: "General vegetative maintenance, tillering, and balanced root uptake.",
    defaultDoseKgPerHa: 10,
    injectionDurationMin: 12,
    colorClass: "text-emerald-400 bg-emerald-950/60 border-emerald-700",
  },
  UREA_46_0_0: {
    id: "UREA_46_0_0",
    name: "Urea 46:0:0 High-N Booster",
    nRatio: 46,
    pRatio: 0,
    kRatio: 0,
    description: "Concentrated amide nitrogen for rapid foliar greening and tillering surge.",
    recommendedFor: "Nitrogen chlorosis correction and peak vegetative leaf expansion.",
    defaultDoseKgPerHa: 15,
    injectionDurationMin: 10,
    colorClass: "text-cyan-400 bg-cyan-950/60 border-cyan-700",
  },
  DAP_18_46_0: {
    id: "DAP_18_46_0",
    name: "DAP 18:46:0 Phosphorus Soluble",
    nRatio: 18,
    pRatio: 46,
    kRatio: 0,
    description: "High-grade water soluble phosphate promoting root depth and flowering.",
    recommendedFor: "Root architecture fortification and early panicle initiation.",
    defaultDoseKgPerHa: 12,
    injectionDurationMin: 15,
    colorClass: "text-amber-400 bg-amber-950/60 border-amber-700",
  },
  MOP_0_0_60: {
    id: "MOP_0_0_60",
    name: "Muriate of Potash 0:0:60",
    nRatio: 0,
    pRatio: 0,
    kRatio: 60,
    description: "Soluble potassium chloride regulating stomatal conductance and grain filling.",
    recommendedFor: "Drought hardening, lodging prevention, and grain plumpness.",
    defaultDoseKgPerHa: 10,
    injectionDurationMin: 12,
    colorClass: "text-purple-400 bg-purple-950/60 border-purple-700",
  },
  MICRONUTRIENT_ZINC_BORON: {
    id: "MICRONUTRIENT_ZINC_BORON",
    name: "Zinc-Boron Bio-NPK Chelate",
    nRatio: 10,
    pRatio: 6,
    kRatio: 8,
    description: "Zn-EDTA, Borax & microbial consortia for enzymatic synthesis.",
    recommendedFor: "Khaira disease prevention in paddy and flower abortion control.",
    defaultDoseKgPerHa: 5,
    injectionDurationMin: 8,
    colorClass: "text-teal-400 bg-teal-950/60 border-teal-700",
  },
};

export const INITIAL_FERTILIZER_SCHEDULES: FertilizerSchedule[] = [
  {
    id: "sched-npk-1",
    zoneId: "zone-1",
    recipeId: "NPK_19_19_19",
    recipeName: "19:19:19 NPK Water Soluble",
    doseKgPerHa: 10,
    injectionDurationMin: 12,
    triggerMode: "INTERVAL_STEPS",
    intervalSteps: 14,
    stepsUntilNext: 6,
    targetNutrient: "BALANCED",
    thresholdValue: 190,
    status: "ACTIVE",
    totalDosedCount: 2,
    createdTimestamp: Date.now() - 3600000,
  },
  {
    id: "sched-urea-auto",
    zoneId: "zone-1",
    recipeId: "UREA_46_0_0",
    recipeName: "Urea 46:0:0 High-N Booster",
    doseKgPerHa: 12,
    injectionDurationMin: 10,
    triggerMode: "THRESHOLD_DEFICIT",
    intervalSteps: 20,
    stepsUntilNext: 20,
    targetNutrient: "N",
    thresholdValue: 175,
    status: "ACTIVE",
    totalDosedCount: 1,
    createdTimestamp: Date.now() - 7200000,
  },
  {
    id: "sched-dap-zone3",
    zoneId: "zone-3",
    recipeId: "DAP_18_46_0",
    recipeName: "DAP 18:46:0 Phosphorus Soluble",
    doseKgPerHa: 15,
    injectionDurationMin: 15,
    triggerMode: "THRESHOLD_DEFICIT",
    intervalSteps: 16,
    stepsUntilNext: 16,
    targetNutrient: "P",
    thresholdValue: 18,
    status: "ACTIVE",
    totalDosedCount: 0,
    createdTimestamp: Date.now() - 1800000,
  },
];

/**
 * Calculates nutrient injection deltas based on recipe and dose
 */
export function calculateNutrientBoost(recipeId: FertilizerRecipeId, doseKg: number) {
  const scale = doseKg / 10; // Normalized to 10kg base
  switch (recipeId) {
    case "NPK_19_19_19":
      return { deltaN: 22 * scale, deltaP: 10 * scale, deltaK: 16 * scale, deltaEc: 0.08 * scale };
    case "UREA_46_0_0":
      return { deltaN: 38 * scale, deltaP: 0, deltaK: 0, deltaEc: 0.05 * scale };
    case "DAP_18_46_0":
      return { deltaN: 14 * scale, deltaP: 26 * scale, deltaK: 0, deltaEc: 0.09 * scale };
    case "MOP_0_0_60":
      return { deltaN: 0, deltaP: 0, deltaK: 28 * scale, deltaEc: 0.12 * scale };
    case "MICRONUTRIENT_ZINC_BORON":
      return { deltaN: 8 * scale, deltaP: 5 * scale, deltaK: 7 * scale, deltaEc: 0.04 * scale };
    default:
      return { deltaN: 15 * scale, deltaP: 5 * scale, deltaK: 10 * scale, deltaEc: 0.06 * scale };
  }
}
