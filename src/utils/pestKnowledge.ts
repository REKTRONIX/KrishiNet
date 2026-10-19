import { PestClassificationDetail, CropType } from "../types";

export interface PestRule {
  pestType: "BOLLWORM" | "APHIDS" | "WHITEFLY" | "STEM_BORER";
  label: string;
  scientificName: string;
  hindiName: string;
  marathiName: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  preferredCrops: CropType[];
  economicThresholdDescription: string;
  organicRemedy: string;
  chemicalRemedy: string;
}

export const INDIAN_PEST_PROFILES: Record<"BOLLWORM" | "APHIDS" | "WHITEFLY" | "STEM_BORER", PestRule> = {
  BOLLWORM: {
    pestType: "BOLLWORM",
    label: "American / Pink Bollworm (इल्ली / बोंडअळी)",
    scientificName: "Helicoverpa armigera / Pectinophora gossypiella",
    hindiName: "अमेरिकन / गुलाबी बोंड इल्ली",
    marathiName: "गुलाबी बोंडअळी",
    color: "#f43f5e", // rose-500
    badgeBg: "bg-rose-950/80",
    borderColor: "border-rose-700",
    preferredCrops: ["Bt Cotton (Bollgard II)", "Polyhouse Tomato (Arka Rakshak)"],
    economicThresholdDescription: "ETL: 1 larva/meter row or >5% damaged squares/bolls",
    organicRemedy: "Pheromone traps @ 5/acre + Neem oil (Azadirachtin 10,000 ppm) @ 2ml/L",
    chemicalRemedy: "Emamectin benzoate 5% SG @ 4g/10L or Chlorantraniliprole 18.5% SC @ 3ml/10L",
  },
  APHIDS: {
    pestType: "APHIDS",
    label: "Cotton / Green Peach Aphids (माहू / मावा)",
    scientificName: "Aphis gossypii / Myzus persicae",
    hindiName: "माहू / चेपा कीट",
    marathiName: "मावा कीड",
    color: "#fb923c", // orange-400
    badgeBg: "bg-orange-950/80",
    borderColor: "border-orange-700",
    preferredCrops: ["Bt Cotton (Bollgard II)", "Wheat (HD-2967)", "Polyhouse Tomato (Arka Rakshak)"],
    economicThresholdDescription: "ETL: >15% infested plants or dense curling on underleaf surface",
    organicRemedy: "Yellow sticky traps @ 8/acre + Spray Verticillium lecanii @ 5g/L water",
    chemicalRemedy: "Thiamethoxam 25% WG @ 2g/10L or Imidacloprid 17.8% SL @ 3ml/10L",
  },
  WHITEFLY: {
    pestType: "WHITEFLY",
    label: "Silverleaf Whitefly (सफेद मक्खी / पांढरी माशी)",
    scientificName: "Bemisia tabaci",
    hindiName: "सफेद मक्खी कीट",
    marathiName: "पांढरी माशी",
    color: "#e879f9", // fuchsia-400
    badgeBg: "bg-fuchsia-950/80",
    borderColor: "border-fuchsia-700",
    preferredCrops: ["Bt Cotton (Bollgard II)", "Polyhouse Tomato (Arka Rakshak)"],
    economicThresholdDescription: "ETL: 6-8 adults/leaf; high vector risk for Leaf Curl Virus (CLCuD)",
    organicRemedy: "Yellow sticky traps @ 12/acre + Spray Beauveria bassiana @ 5g/L",
    chemicalRemedy: "Diafenthiuron 50% WP @ 12g/10L or Pyriproxyfen 10% EC @ 10ml/10L",
  },
  STEM_BORER: {
    pestType: "STEM_BORER",
    label: "Yellow Stem Borer / Top Borer (तना छेदक / खोडकीड)",
    scientificName: "Scirpophaga incertulas",
    hindiName: "पीला तना छेदक",
    marathiName: "खोडकीड (डेड हार्ट)",
    color: "#c084fc", // purple-400
    badgeBg: "bg-purple-950/80",
    borderColor: "border-purple-700",
    preferredCrops: ["Basmati Rice (PB-1121)", "Sugarcane (Co-0238)"],
    economicThresholdDescription: "ETL: 5% dead hearts at vegetative stage or 1 egg mass/m²",
    organicRemedy: "Trichogramma japonicum egg parasitoid cards @ 20,000/acre at weekly intervals",
    chemicalRemedy: "Cartap hydrochloride 4% G @ 7.5 kg/acre or Fipronil 0.3% G @ 10 kg/acre",
  },
};
