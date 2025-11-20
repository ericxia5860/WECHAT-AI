
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LiveClient } from './services/LiveClient';
import { LANGUAGES, SCENARIOS, VOICES } from './constants';
import { ConnectionState, Language, Scenario, Voice, ChatMessage, Session } from './types';
import Controls from './components/Controls';
import AudioVisualizer from './components/AudioVisualizer';
import Transcript from './components/Transcript';
import HistoryList from './components/HistoryList';
import { Mic, MicOff, Sparkles, AlertCircle, History, ArrowLeft, X } from 'lucide-react';

const STORAGE_KEY = 'lingua_live_history';
const CUSTOM_SCENARIOS_KEY = 'lingua_live_custom_scenarios';

const App: React.FC = () => {
  const [connected, setConnected] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [selectedLang, setSelectedLang] = useState<Language>(LANGUAGES[0]);
  
  // Custom Scenarios State
  const [customScenarios, setCustomScenarios] = useState<Scenario[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(CUSTOM_SCENARIOS_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch (error) {
        console.error('Failed to load custom scenarios:', error);
        return [];
      }
    }
    return [];
  });

  // Save custom scenarios whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_SCENARIOS_KEY, JSON.stringify(customScenarios));
    } catch (error) {
      console.error('Failed to save custom scenarios:', error);
    }
  }, [customScenarios]);

  const allScenarios = [...SCENARIOS, ...customScenarios];
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);
  
  const [selectedVoice, setSelectedVoice] = useState<Voice>(VOICES[4]); // Default to Zephyr
  const [speechRate, setSpeechRate] = useState<'slow' | 'normal' | 'fast'>('normal');
  
  const [audioInputLevel, setAudioInputLevel] = useState(0);
  const [audioOutputLevel, setAudioOutputLevel] = useState(0);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // History State - Initialize from LocalStorage
  const [history, setHistory] = useState<Session[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch (error) {
        console.error('Failed to load history from storage:', error);
        return [];
      }
    }
    return [];
  });

  const [isHistoryView, setIsHistoryView] = useState(false);
  const [selectedHistorySession, setSelectedHistorySession] = useState<Session | null>(null);

  const liveClientRef = useRef<LiveClient | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  // Persist history to LocalStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save history to storage:', error);
    }
  }, [history]);

  // Initialize LiveClient
  useEffect(() => {
    liveClientRef.current = new LiveClient({
      onStateChange: (state) => setConnected(state),
      onAudioLevel: (level, source) => {
        if (source === 'input') setAudioInputLevel(level);
        else setAudioOutputLevel(level);
      },
      onTranscript: (text, role, isFinal) => {
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          // If the last message was from the same role and wasn't final, update it
          if (lastMsg && lastMsg.role === role && !lastMsg.isFinal) {
             const updated = [...prev];
             updated[updated.length - 1] = {
                 ...lastMsg,
                 text: lastMsg.text + text, 
                 isFinal: isFinal
             };
             return updated;
          } else {
              return [...prev, {
                  id: Date.now().toString(),
                  role,
                  text,
                  timestamp: Date.now(),
                  isFinal
              }];
          }
        });
      },
      onError: (err) => setError(err)
    });

    return () => {
      liveClientRef.current?.disconnect();
    };
  }, []);

  const handleAddScenario = (newScenario: Scenario) => {
    setCustomScenarios(prev => [...prev, newScenario]);
    setSelectedScenario(newScenario);
  };

  const handleDeleteScenario = (id: string) => {
    setCustomScenarios(prev => prev.filter(s => s.id !== id));
    if (selectedScenario.id === id) {
      setSelectedScenario(SCENARIOS[0]);
    }
  };

  const handleConnect = useCallback(async () => {
    setError(null);
    // Prepare UI for new session
    setIsHistoryView(false);
    setSelectedHistorySession(null);
    setMessages([]); 
    currentSessionIdRef.current = Date.now().toString();

    if (!liveClientRef.current) return;
    
    let rateInstruction = '';
    switch (speechRate) {
      case 'slow':
        rateInstruction = 'Speaking Rate: SLOW. You MUST speak slowly, enunciate every word clearly, and leave pauses between sentences. This is for a beginner learner.';
        break;
      case 'fast':
        rateInstruction = 'Speaking Rate: FAST. Speak quickly, fluidly, and naturally, like a native speaker in a hurry. Use contractions.';
        break;
      case 'normal':
      default:
        rateInstruction = 'Speaking Rate: NORMAL. Speak at a natural, friendly conversational pace.';
        break;
    }

    const instructions = `
      Target Language: ${selectedLang.name}. 
      Roleplay Scenario: ${selectedScenario.systemPrompt}
      ${rateInstruction}
      NOTE: If the user makes a mistake, gently correct them in ${selectedLang.name}, then continue the roleplay.
    `;

    await liveClientRef.current.connect({
      systemInstruction: instructions,
      voiceName: selectedVoice.name
    });
  }, [selectedLang, selectedScenario, speechRate, selectedVoice]);

  const handleDisconnect = useCallback(async () => {
    if (!liveClientRef.current) return;
    await liveClientRef.current.disconnect();
    // Saving is handled in the useEffect below to ensure we capture the final state
  }, []);

  // Save session when disconnecting
  useEffect(() => {
    if (connected === ConnectionState.DISCONNECTED && messages.length > 0 && currentSessionIdRef.current) {
      const newSession: Session = {
        id: currentSessionIdRef.current,
        timestamp: Date.now(),
        language: selectedLang,
        scenario: selectedScenario,
        messages: [...messages]
      };
      
      setHistory(prev => [newSession, ...prev]);
      currentSessionIdRef.current = null; // Prevent double saving
    }
  }, [connected, messages, selectedLang, selectedScenario]);

  const isBusy = connected === ConnectionState.CONNECTING || connected === ConnectionState.CONNECTED;

  const getErrorHelp = (err: string) => {
    const errLower = err.toLowerCase();
    if (errLower.includes('microphone') || errLower.includes('permission')) {
       return (
         <ul className="list-disc pl-4 mt-2 space-y-1 text-xs opacity-90">
           <li>Check your browser address bar for a "lock" or "microphone" icon.</li>
           <li>Click it and ensure "Microphone" is set to "Allow".</li>
           <li>Refresh the page and try again.</li>
         </ul>
       );
    }
    if (errLower.includes('network') || errLower.includes('connection')) {
       return (
         <ul className="list-disc pl-4 mt-2 space-y-1 text-xs opacity-90">
           <li>Check your internet connection.</li>
           <li>Disable any active VPNs or proxies that might block WebSocket/WebTransport.</li>
           <li>Check if your firewall allows connections to Google's servers.</li>
         </ul>
       );
    }
    if (errLower.includes('401') || errLower.includes('403') || errLower.includes('api key')) {
       return (
         <div className="mt-2 text-xs opacity-90">
           Double-check your API key configuration. Ensure it is valid and has access to the Generative Language API.
         </div>
       );
    }
    if (errLower.includes('503') || errLower.includes('overloaded')) {
       return (
         <div className="mt-2 text-xs opacity-90">
           The AI model is currently experiencing high traffic. Please wait 10-20 seconds and try again.
         </div>
       );
    }
    return <div className="mt-2 text-xs opacity-90">Please check the browser developer console for technical details.</div>;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      
      {/* Header */}
      <div className="text-center mb-8 max-w-2xl">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg text-white">
            <Sparkles size={24} />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
            LinguaLive
          </h1>
        </div>
        <p className="text-slate-600">
          Select a language, voice, and scenario, then start talking to practice your conversational skills with Gemini AI.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden border border-white/50 flex flex-col md:flex-row h-[85vh] md:h-[750px]">
        
        {/* Left Panel: Controls & Visuals */}
        <div className="w-full md:w-1/3 bg-slate-50/50 border-r border-slate-100 p-6 flex flex-col overflow-y-auto">
          
          <Controls 
            scenarios={allScenarios}
            selectedLang={selectedLang}
            onLangChange={setSelectedLang}
            selectedScenario={selectedScenario}
            onScenarioChange={setSelectedScenario}
            onAddScenario={handleAddScenario}
            onDeleteScenario={handleDeleteScenario}
            speechRate={speechRate}
            onSpeechRateChange={setSpeechRate}
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
            disabled={isBusy}
          />

          <div className="flex-1 flex flex-col justify-end gap-6 mt-auto">
            {error && (
               <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl flex flex-col gap-2 border border-red-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-600"/>
                    <div className="flex-1">
                       <h4 className="font-semibold text-red-800">Connection Error</h4>
                       <p className="mt-1 font-medium text-xs">{error}</p>
                       
                       <div className="mt-3 pt-3 border-t border-red-200/50">
                         <span className="text-xs font-bold uppercase tracking-wider text-red-600/80">Troubleshooting</span>
                         {getErrorHelp(error)}
                       </div>
                    </div>
                 </div>
               </div>
            )}

            <AudioVisualizer 
              inputLevel={audioInputLevel} 
              outputLevel={audioOutputLevel}
              isConnected={connected === ConnectionState.CONNECTED}
            />

            <div className="flex justify-center pb-2">
              {connected === ConnectionState.DISCONNECTED || connected === ConnectionState.ERROR || connected === ConnectionState.CONNECTING ? (
                <button
                  onClick={handleConnect}
                  disabled={connected === ConnectionState.CONNECTING}
                  className="group relative flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-full font-semibold shadow-lg hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connected === ConnectionState.CONNECTING ? (
                    <>Connecting...</>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>Start Conversation</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleDisconnect}
                  className="group flex items-center gap-3 px-8 py-4 bg-red-50 text-red-600 border border-red-100 rounded-full font-semibold shadow-sm hover:bg-red-100 hover:border-red-200 transition-all"
                >
                  <MicOff className="w-5 h-5" />
                  <span>End Session</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Transcript & History */}
        <div className="w-full md:w-2/3 bg-white relative flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-0 z-10 h-16">
             <div className="flex items-center gap-2">
                {isHistoryView && selectedHistorySession ? (
                  <button 
                    onClick={() => setSelectedHistorySession(null)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
                  >
                    <ArrowLeft size={18} />
                  </button>
                ) : null}
                
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isHistoryView 
                    ? (selectedHistorySession ? 'Session Replay' : 'History')
                    : 'Live Transcript'
                  }
                </span>
             </div>

             <div className="flex items-center gap-3">
               {connected === ConnectionState.CONNECTED ? (
                 <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   Live
                 </span>
               ) : (
                 <button 
                   onClick={() => {
                     setIsHistoryView(!isHistoryView);
                     setSelectedHistorySession(null);
                   }}
                   className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium ${
                     isHistoryView 
                       ? 'bg-slate-100 text-slate-900' 
                       : 'text-slate-500 hover:bg-slate-50'
                   }`}
                   title="View History"
                 >
                   {isHistoryView ? <X size={16}/> : <History size={16} />}
                   {isHistoryView ? 'Close History' : 'History'}
                 </button>
               )}
             </div>
          </div>

          <div className="flex-1 overflow-hidden relative h-full bg-white">
            {isHistoryView ? (
              selectedHistorySession ? (
                <Transcript messages={selectedHistorySession.messages} />
              ) : (
                <HistoryList 
                  sessions={history} 
                  onSelectSession={(session) => setSelectedHistorySession(session)} 
                />
              )
            ) : (
              <Transcript messages={messages} />
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-xs text-slate-400 text-center">
         Powered by Google Gemini 2.5 Flash Native Audio
      </div>
    </div>
  );
};

export default App;
