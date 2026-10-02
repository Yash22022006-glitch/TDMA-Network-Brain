import React, { useState } from 'react';
import { PRESET_LIST, TopologyPreset } from '../utils/presets';
import { Upload, ChevronDown, Check, RefreshCw, Radio } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  currentPresetId: string;
  onSelectPreset: (preset: TopologyPreset) => void;
  onUploadJson: (content: string) => void;
  onGenerateSchedule: () => void;
  isValid: boolean;
  radioRange: number;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  currentPresetId,
  onSelectPreset,
  onUploadJson,
  onGenerateSchedule,
  isValid,
  radioRange
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        const text = event.target?.result as string;
        if (text) {
          onUploadJson(text);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <header className="h-18 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {title}
        </h2>
        <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
      </div>

      <div className="flex items-center space-x-3">
        {/* Status Pill */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>System Ready</span>
        </div>

        {/* Preset Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
          >
            <span>Load Example</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Preset Topologies
              </div>
              {PRESET_LIST.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onSelectPreset(preset);
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-start justify-between group"
                >
                  <div>
                    <div className="font-semibold text-slate-800 group-hover:text-blue-600">
                      {preset.name}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {preset.description}
                    </div>
                  </div>
                  {currentPresetId === preset.id && (
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Load JSON File */}
        <label className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 cursor-pointer transition shadow-xs">
          <Upload className="w-3.5 h-3.5" />
          <span>Load JSON</span>
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>

        {/* Quick Re-optimize */}
        <button
          onClick={onGenerateSchedule}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition shadow-xs"
          title="Recalculate Schedule"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Optimize</span>
        </button>
      </div>
    </header>
  );
};
