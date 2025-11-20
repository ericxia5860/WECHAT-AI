
import React, { useState } from 'react';
import { LANGUAGES, VOICES } from '../constants';
import { Language, Scenario, Voice } from '../types';
import AddFriendForm from './AddFriendForm';
import { Globe, BookOpen, Coffee, Plane, ShoppingCart, Briefcase, User, Gauge, AudioLines, Zap, Feather, MessageCircle, Heart, Contact, Plus, Users, LayoutGrid, Star } from 'lucide-react';

// Map for dynamic icon lookup
const ICON_MAP: Record<string, React.ElementType> = {
  Coffee,
  Plane,
  ShoppingCart,
  Briefcase,
  User,
  Heart
};

const RATE_CONFIG = {
  slow: { label: 'Slow', icon: Feather },
  normal: { label: 'Normal', icon: MessageCircle },
  fast: { label: 'Fast', icon: Zap }
};

interface ControlsProps {
  scenarios: Scenario[];
  selectedLang: Language;
  onLangChange: (l: Language) => void;
  selectedScenario: Scenario;
  onScenarioChange: (s: Scenario) => void;
  onAddScenario: (s: Scenario) => void;
  onDeleteScenario: (id: string) => void;
  speechRate: 'slow' | 'normal' | 'fast';
  onSpeechRateChange: (rate: 'slow' | 'normal' | 'fast') => void;
  selectedVoice: Voice;
  onVoiceChange: (v: Voice) => void;
  disabled: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  scenarios,
  selectedLang,
  onLangChange,
  selectedScenario,
  onScenarioChange,
  onAddScenario,
  onDeleteScenario,
  speechRate,
  onSpeechRateChange,
  selectedVoice,
  onVoiceChange,
  disabled
}) => {
  const [isAddingScenario, setIsAddingScenario] = useState(false);

  const officialScenarios = scenarios.filter(s => !s.isCustom);
  const customScenarios = scenarios.filter(s => s.isCustom);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 relative h-full">
      {/* Configuration Panel */}
      <div className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4 ${disabled ? 'opacity-70 pointer-events-none' : ''}`}>
        
        {/* Language Section */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-slate-700">
            <Globe className="w-4 h-4" />
            <h3 className="text-sm font-semibold uppercase tracking-wide">Target Language</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => onLangChange(lang)}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedLang.id === lang.id
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 font-medium'
                    : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Section */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3 text-slate-700">
            <AudioLines className="w-4 h-4" />
            <h3 className="text-sm font-semibold uppercase tracking-wide">AI Voice</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {VOICES.map((voice) => (
              <button
                key={voice.id}
                onClick={() => onVoiceChange(voice)}
                className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                  selectedVoice.id === voice.id
                    ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-200'
                    : 'hover:bg-slate-50 text-slate-500'
                }`}
              >
                {voice.name}
              </button>
            ))}
          </div>
        </div>

        {/* Speech Rate Section */}
        <div className="pt-4 border-t border-slate-100 mt-auto">
          <div className="flex items-center gap-2 mb-3 text-slate-700">
            <Gauge className="w-4 h-4" />
            <h3 className="text-sm font-semibold uppercase tracking-wide">Speaking Rate</h3>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {(['slow', 'normal', 'fast'] as const).map((rate) => {
              const config = RATE_CONFIG[rate];
              const Icon = config.icon;
              return (
                <button
                  key={rate}
                  onClick={() => onSpeechRateChange(rate)}
                  className={`flex-1 py-2 text-xs font-medium rounded-md capitalize transition-all flex items-center justify-center gap-1.5 ${
                    speechRate === rate
                      ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scenario Directory */}
      <div className={`bg-white rounded-xl shadow-sm border border-slate-200 relative overflow-hidden flex flex-col ${disabled ? 'opacity-70 pointer-events-none' : ''}`}>
        
        {isAddingScenario ? (
          <AddFriendForm 
            onAdd={(s) => {
              onAddScenario(s);
              setIsAddingScenario(false);
            }} 
            onCancel={() => setIsAddingScenario(false)} 
          />
        ) : (
          <>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-800">
                <LayoutGrid className="w-4 h-4" />
                <h3 className="text-sm font-semibold uppercase tracking-wide">Scenario Directory</h3>
              </div>
              <button 
                onClick={() => setIsAddingScenario(true)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-emerald-600 hover:border-emerald-200 shadow-sm transition-all"
                title="Create Custom Scenario"
              >
                <Plus size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-4">
              {/* Official Scenarios */}
              <div>
                <div className="px-2 py-1 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Standard Scenarios
                </div>
                <div className="space-y-1">
                  {officialScenarios.map((scenario) => {
                    const Icon = ICON_MAP[scenario.icon] || BookOpen;
                    const isSelected = selectedScenario.id === scenario.id;
                    return (
                      <button
                        key={scenario.id}
                        onClick={() => onScenarioChange(scenario)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-3 group ${
                          isSelected
                            ? 'bg-emerald-50 border border-emerald-100'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className={`p-2 rounded-full shrink-0 ${isSelected ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm'}`}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className={`font-medium truncate ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>{scenario.title}</div>
                          <div className={`text-xs truncate ${isSelected ? 'text-emerald-700/70' : 'text-slate-400'}`}>{scenario.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Scenarios */}
              {customScenarios.length > 0 && (
                <div>
                  <div className="px-2 py-1 mb-1 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3" />
                    My Scenarios
                  </div>
                  <div className="space-y-1">
                    {customScenarios.map((scenario) => {
                      const isSelected = selectedScenario.id === scenario.id;
                      return (
                        <div key={scenario.id} className="relative group/item">
                          <button
                            onClick={() => onScenarioChange(scenario)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-3 group ${
                              isSelected
                                ? 'bg-emerald-50 border border-emerald-100'
                                : 'hover:bg-slate-50 border border-transparent'
                            }`}
                          >
                            <div className={`p-2 rounded-full shrink-0 ${isSelected ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm'}`}>
                                <User className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className={`font-medium truncate ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>{scenario.title}</div>
                              <div className={`text-xs truncate ${isSelected ? 'text-emerald-700/70' : 'text-slate-400'}`}>{scenario.description}</div>
                            </div>
                          </button>
                          <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteScenario(scenario.id);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"
                            title="Delete Scenario"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {customScenarios.length === 0 && (
                <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 mt-2">
                  <p className="text-xs text-slate-400 mb-2">No custom scenarios yet.</p>
                  <button 
                    onClick={() => setIsAddingScenario(true)}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Create your first one
                  </button>
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Controls;
