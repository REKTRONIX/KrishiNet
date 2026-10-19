import React, { useState, useRef, useEffect } from 'react';
import { Languages, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n/translations';

interface LanguageSwitcherProps {
  variant?: 'segmented' | 'dropdown';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'segmented',
  className = '',
}) => {
  const { language, setLanguage, languageOptions } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = languageOptions.find((o) => o.code === language) || languageOptions[0];

  if (variant === 'dropdown') {
    return (
      <div id="language-switcher-dropdown" ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 hover:border-emerald-500/50 shadow-sm transition-all cursor-pointer"
          title="Switch Language / भाषा बदलें / भाषा बदला"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <Languages className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium">{currentOption.nativeName}</span>
          <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-stone-900 border border-stone-700/80 shadow-2xl z-50 py-1.5 focus:outline-none backdrop-blur-md bg-stone-900/95">
            <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-stone-400 border-b border-stone-800">
              Select Language / भाषा निवडा
            </div>
            {languageOptions.map((opt) => {
              const isSelected = opt.code === language;
              return (
                <button
                  key={opt.code}
                  onClick={() => {
                    setLanguage(opt.code as Language);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/80 text-emerald-300 font-semibold border-l-2 border-emerald-500'
                      : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-stone-100 font-medium">{opt.nativeName} ({opt.label})</span>
                    <span className="text-[10px] text-stone-400">{opt.region}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Segmented Pill Variant (Fast 1-click toggling)
  return (
    <div
      id="language-switcher-segmented"
      className={`inline-flex items-center p-0.5 rounded-lg bg-stone-800/90 border border-stone-700/80 shadow-sm ${className}`}
      role="group"
      aria-label="Language Selector"
    >
      <span className="px-2 text-stone-400 flex items-center gap-1 text-[11px] font-medium select-none" title="Regional Agricultural Terminology">
        <Languages className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="hidden xl:inline">Lang:</span>
      </span>

      <div className="flex items-center space-x-0.5">
        {languageOptions.map((opt) => {
          const isSelected = opt.code === language;
          return (
            <button
              key={opt.code}
              id={`lang-btn-${opt.code}`}
              onClick={() => setLanguage(opt.code as Language)}
              title={`${opt.nativeName} (${opt.label}) — ${opt.region}`}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/50'
              }`}
            >
              <span>{opt.nativeName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
