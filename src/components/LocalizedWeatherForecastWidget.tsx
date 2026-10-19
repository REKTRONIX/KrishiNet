import React, { useState, useEffect, useCallback } from "react";
import {
  CloudRain,
  Sun,
  CloudSun,
  CloudLightning,
  Wind,
  Thermometer,
  Droplets,
  ExternalLink,
  RefreshCw,
  Search,
  Sparkles,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Info,
  MapPin,
  Waves,
} from "lucide-react";
import { LocalizedWeatherForecast, DailyForecastDay, IrrigationForecastAction } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface LocalizedWeatherForecastWidgetProps {
  location?: string;
  cropName: string;
  currentVpd?: number;
  currentEt0?: number;
  currentTemp?: number;
  currentHumidity?: number;
  onApplyIrrigationRule?: (action: IrrigationForecastAction, rationale: string) => void;
}

export const LocalizedWeatherForecastWidget: React.FC<LocalizedWeatherForecastWidgetProps> = ({
  location = "Wardha, Vidarbha Agro-Climatic Zone",
  cropName,
  currentVpd,
  currentEt0,
  currentTemp,
  currentHumidity,
  onApplyIrrigationRule,
}) => {
  const { t, language, translateCrop, translateLocation } = useLanguage();
  const [forecast, setForecast] = useState<LocalizedWeatherForecast | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [showSources, setShowSources] = useState<boolean>(false);

  const fetchForecast = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/weather-forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          crop: cropName,
          cropStage: "Flowering/Booting",
          soilType: "Black Cotton Soil (Vertisol)",
          currentVpd,
          currentEt0,
          currentTemp,
          currentHumidity,
          forceRefresh,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data: LocalizedWeatherForecast = await res.json();
      setForecast(data);
    } catch (err: any) {
      console.warn("Weather forecast notice:", err?.message || err);
      setError(err?.message || "Failed to load 7-day weather forecast");
    } finally {
      setIsLoading(false);
    }
  }, [location, cropName, currentVpd, currentEt0, currentTemp, currentHumidity]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  const getWeatherIcon = (condition: string, rainProb: number) => {
    const c = condition.toLowerCase();
    if (c.includes("thunder") || c.includes("lightning") || c.includes("storm")) {
      return <CloudLightning className="w-5 h-5 text-amber-400" />;
    }
    if (c.includes("rain") || c.includes("shower") || c.includes("drizzle") || rainProb > 50) {
      return <CloudRain className="w-5 h-5 text-blue-400" />;
    }
    if (c.includes("cloud") || c.includes("overcast")) {
      return <CloudSun className="w-5 h-5 text-stone-300" />;
    }
    if (c.includes("wind") || c.includes("breeze")) {
      return <Wind className="w-5 h-5 text-teal-300" />;
    }
    return <Sun className="w-5 h-5 text-amber-300" />;
  };

  const getActionBadge = (action: IrrigationForecastAction) => {
    switch (action) {
      case "HOLD_FOR_RAIN":
        return {
          label: "Hold: Rain Imminent",
          badgeClass: "bg-blue-950/80 text-blue-300 border-blue-700/80",
          icon: <CloudRain className="w-3 h-3 text-blue-400" />,
        };
      case "BOOST_PULSE":
        return {
          label: "Boost Pulse: Heat Spike",
          badgeClass: "bg-rose-950/80 text-rose-300 border-rose-700/80",
          icon: <Thermometer className="w-3 h-3 text-rose-400" />,
        };
      case "DEFICIT_AERATION":
        return {
          label: "Root Aeration Pause",
          badgeClass: "bg-amber-950/80 text-amber-300 border-amber-700/80",
          icon: <Waves className="w-3 h-3 text-amber-400" />,
        };
      case "REDUCE_RATE":
        return {
          label: "Reduce Drip Rate",
          badgeClass: "bg-teal-950/80 text-teal-300 border-teal-700/80",
          icon: <Droplets className="w-3 h-3 text-teal-400" />,
        };
      case "IRRIGATE_NORMAL":
      default:
        return {
          label: "Optimal Pulse Drip",
          badgeClass: "bg-emerald-950/80 text-emerald-300 border-emerald-700/80",
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
        };
    }
  };

  const selectedDay: DailyForecastDay | null =
    forecast?.days && forecast.days.length > selectedDayIndex
      ? forecast.days[selectedDayIndex]
      : null;

  return (
    <div
      id="localized-weather-widget"
      className="bg-stone-900/95 rounded-xl border border-stone-800 shadow-xl overflow-hidden mt-6 flex flex-col"
    >
      {/* Widget Header */}
      <div className="bg-stone-950 px-4 py-3 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-400">
            <Search className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-xs tracking-wider uppercase text-stone-200">
                {t.weather.title}
              </h4>
              {forecast?.isGrounded ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  {t.weather.searchGrounded}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                  {t.weather.regionalAgromet}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mt-0.5">
              <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
              <span className="truncate">{translateLocation(location)}</span>
              <span className="text-stone-600">•</span>
              <span className="text-stone-400 font-mono">{translateCrop(cropName)}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {forecast?.groundingSources && forecast.groundingSources.length > 0 && (
            <button
              onClick={() => setShowSources((prev) => !prev)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="View Google Search Grounding sources & queries"
            >
              <ExternalLink className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">
                {showSources ? t.weather.hideSources : `${t.weather.sources} (${forecast.groundingSources.length})`}
              </span>
              <span className="sm:hidden">{t.weather.sources}</span>
            </button>
          )}

          <button
            onClick={() => fetchForecast(true)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700/80 hover:bg-emerald-600 active:bg-emerald-800 text-white border border-emerald-600 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Refresh 7-day weather trend from live web search"
          >
            <RefreshCw className={`w-3 h-3 text-white ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? t.weather.fetching : t.weather.refresh}</span>
          </button>
        </div>
      </div>

      {/* Sources & Grounding Queries Drawer */}
      {showSources && forecast && (
        <div className="bg-stone-950/90 border-b border-stone-800 px-4 py-3 text-xs">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-stone-800 text-stone-400">
            <span className="font-semibold text-stone-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              Search Grounding Queries & Live Meteorological Citations
            </span>
            <span className="text-[11px] font-mono text-stone-500">
              Model: Gemini 3.8 Flash with Google Search Tool
            </span>
          </div>

          {forecast.searchQueries && forecast.searchQueries.length > 0 && (
            <div className="mb-2.5">
              <span className="text-[11px] text-stone-400 block mb-1 font-mono">Web Queries:</span>
              <div className="flex flex-wrap gap-1.5">
                {forecast.searchQueries.map((q, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-cyan-300/90 text-[11px] font-mono"
                  >
                    "{q}"
                  </span>
                ))}
              </div>
            </div>
          )}

          {forecast.groundingSources && forecast.groundingSources.length > 0 && (
            <div>
              <span className="text-[11px] text-stone-400 block mb-1 font-mono">Grounding Sources:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {forecast.groundingSources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded bg-stone-900/90 hover:bg-stone-800 border border-stone-800 hover:border-cyan-700/60 text-stone-300 hover:text-cyan-300 flex items-center justify-between text-[11px] transition-colors group"
                  >
                    <span className="truncate pr-2">{source.title}</span>
                    <ExternalLink className="w-3 h-3 text-stone-500 group-hover:text-cyan-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Body */}
      <div className="p-4 flex flex-col space-y-4">
        {/* Error Notice */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchForecast(true)}
              className="px-2 py-1 bg-rose-900/60 hover:bg-rose-900 text-white rounded text-[11px] border border-rose-700 font-medium cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Agrometeorological Model Notice (shown when fallback model is active) */}
        {forecast?.fallbackReason && (
          <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/60 text-amber-200/90 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate text-stone-300">{forecast.fallbackReason}</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-900/50 text-amber-300 border border-amber-700/50 shrink-0">
              Agromet Engine
            </span>
          </div>
        )}

        {/* 7-Day Agronomic Irrigation Advisory Banner */}
        {forecast && (
          <div className="bg-stone-950/70 p-3.5 rounded-lg border border-stone-800/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  {t.weather.agrometDirective}
                </span>
                {forecast.monsoonOrRainAlert && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1">
                    <CloudRain className="w-3 h-3 text-blue-400" />
                    {t.weather.expectedPrecipitation}: {forecast.totalExpectedRainMm}mm
                  </span>
                )}
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-800 text-stone-300 border border-stone-700">
                  {t.weather.avgEt0}: {forecast.avgDailyEt0} mm/day
                </span>
              </div>
              <p className="text-xs text-stone-200 font-medium leading-relaxed">
                {forecast.headline}
              </p>
              <p className="text-[11px] text-stone-400 leading-normal">
                {forecast.irrigationRecommendation}
              </p>
            </div>

            {/* Quick Irrigation Action Indicator */}
            {selectedDay && (
              <div className="bg-stone-900 p-2.5 rounded-lg border border-stone-800 shrink-0 w-full md:w-56 text-right flex md:flex-col justify-between items-center md:items-end">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-mono">
                  {selectedDay.dayName} Recommendation
                </span>
                <div className="mt-1">
                  {(() => {
                    const badge = getActionBadge(selectedDay.action);
                    return (
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md border ${badge.badgeClass}`}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 7-Day Visual Strip / Cards */}
        {forecast?.days && forecast.days.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-400" />
                7-Day Agrometeorological Horizon (Click day to inspect)
              </span>
              <span className="text-[11px] text-stone-500 font-mono">
                Updated: {forecast.fetchedAt ? new Date(forecast.fetchedAt).toLocaleTimeString() : "Live"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {forecast.days.map((day, idx) => {
                const isSelected = selectedDayIndex === idx;
                const badge = getActionBadge(day.action);

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                      isSelected
                        ? "bg-stone-800/95 border-emerald-500 shadow-md shadow-emerald-950/50 ring-1 ring-emerald-500/40"
                        : "bg-stone-950/60 hover:bg-stone-800/60 border-stone-800 text-stone-300"
                    }`}
                  >
                    {/* Top Day Header */}
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-bold text-stone-200">{day.dayName}</span>
                      <span className="text-[10px] text-stone-400 font-mono">{day.date}</span>
                    </div>

                    {/* Weather Icon & Condition */}
                    <div className="my-1 flex items-center gap-1.5">
                      {getWeatherIcon(day.condition, day.rainProb)}
                      <span className="text-[11px] text-stone-300 font-medium truncate">
                        {day.condition}
                      </span>
                    </div>

                    {/* Temperature Bar */}
                    <div className="flex items-center justify-between text-xs my-1 w-full font-mono">
                      <span className="text-amber-400 font-bold">{day.tempMax}°</span>
                      <span className="text-stone-500">/</span>
                      <span className="text-blue-300">{day.tempMin}°C</span>
                    </div>

                    {/* Rain & ET0 Metrics */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 mt-1 pt-1 border-t border-stone-800/80 w-full">
                      <span
                        className={`flex items-center gap-0.5 ${
                          day.rainProb >= 40 ? "text-blue-400 font-semibold" : "text-stone-400"
                        }`}
                        title={`Rain probability ${day.rainProb}% (${day.rainMm} mm)`}
                      >
                        <Droplets className="w-2.5 h-2.5" />
                        {day.rainProb}%
                      </span>
                      <span
                        className="text-stone-400"
                        title={`Reference Evapotranspiration (ET0): ${day.et0Mm} mm/day`}
                      >
                        ET₀ {day.et0Mm}
                      </span>
                    </div>

                    {/* Irrigation Action Tag */}
                    <div className="mt-2 w-full">
                      <span
                        className={`block text-[9px] font-semibold text-center py-0.5 px-1 rounded border truncate ${badge.badgeClass}`}
                        title={day.rationale}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {/* Active Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
            <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
            <span className="text-xs text-stone-400 font-mono">
              Fetching real-time 7-day weather trends via Gemini Search Grounding...
            </span>
          </div>
        ) : null}

        {/* Selected Day Inspector & Autonomous Rule Link */}
        {selectedDay && (
          <div className="p-3.5 bg-stone-950/80 rounded-lg border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-200">
                  {selectedDay.dayName} ({selectedDay.date}) Deep Agromet Insight:
                </span>
                <span className="text-stone-400 font-mono text-[11px]">
                  Relative Humidity: {selectedDay.humidity}% | Wind: {selectedDay.windSpeedKmH} km/h | Expected Rain: {selectedDay.rainMm} mm
                </span>
              </div>
              <p className="text-[11px] text-emerald-300/90 leading-relaxed font-sans">
                <strong>Irrigation Rationale:</strong> {selectedDay.rationale}
              </p>
            </div>

            {onApplyIrrigationRule && (
              <button
                onClick={() => onApplyIrrigationRule(selectedDay.action, selectedDay.rationale)}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-emerald-300 hover:text-emerald-200 border border-emerald-800/80 text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5"
                title="Synchronize irrigation scheduler with this weather day"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Apply Irrigation Rule</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
