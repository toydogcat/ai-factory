import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Download, 
  Settings, 
  Activity, 
  Cpu, 
  Zap, 
  Terminal,
  Volume2,
  Trash2,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Speech Recognition Types ---
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("UPGRADE_REQUIRED: Your browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-TW'; // Default to Traditional Chinese

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setTranscript(prev => prev + final);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        setError("ACCESS_DENIED: Microphone permission required.");
      } else {
        setError(`STT_FAILURE: ${event.error.toUpperCase()}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setError(null);
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start:", err);
      }
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  const downloadTranscript = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VOICECORE_LITE_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] font-mono selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('./noise.svg')] opacity-10 mix-blend-overlay" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Header */}
      <header className="relative max-w-5xl mx-auto pt-16 px-6">
        {/* Permission Banner */}
        <AnimatePresence>
          {(!window.isSecureContext) && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mb-8 p-4 bg-orange-500/20 border border-orange-500/50 rounded-xl text-orange-200 text-xs flex flex-col gap-2"
            >
              <div className="flex items-center gap-2 font-black">
                <Activity size={16} /> PORTAL_WARNING: SECURE_CONTEXT_REQUIRED
              </div>
              <p>The browser prevents neural interface activation on insecure connections. Please ensure you are using <b>HTTPS</b>.</p>
              <button 
                onClick={() => navigator.mediaDevices.getUserMedia({ audio: true }).catch(err => console.log(err))}
                className="mt-2 w-fit px-4 py-2 bg-orange-500 text-black font-black rounded uppercase text-[10px]"
              >
                Force_Request_Permission
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 animate-pulse" />
            <div className="relative w-12 h-12 bg-black border border-blue-500/50 rounded-lg flex items-center justify-center text-blue-400">
              <Volume2 size={28} />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-2 uppercase">
              VOICE<span className="text-blue-400">CORE</span>
              <span className="text-[10px] font-normal bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 tracking-[0.3em] ml-2">LITE_V1.0</span>
            </h1>
            <p className="text-stone-500 text-sm uppercase tracking-[0.2em] mt-1 italic">Real-Time Edge Transcription Interface</p>
          </div>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto py-12 px-6 grid gap-8">
        {/* Recording Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Latency', value: 'Edge_Local', icon: <Zap size={12} className="text-yellow-500" /> },
            { label: 'Cloud_Cost', value: '0_PTS', icon: <Circle size={12} className="text-green-500" /> },
            { label: 'Buffer', value: transcript.length + ' Chars', icon: <Terminal size={12} className="text-blue-500" /> },
            { label: 'Status', value: isListening ? 'SYNC_ACTIVE' : 'IDLE', icon: <Activity size={12} className={isListening ? 'text-cyan-400 animate-pulse' : 'text-stone-600'} /> }
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[10px] text-stone-500 tracking-widest uppercase">
                {stat.icon} {stat.label}
              </div>
              <div className="text-sm font-bold text-white tracking-widest">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Console Terminal */}
        <section className="bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)]">
          <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 mr-4">
                <div className="w-3 h-3 rounded-full bg-stone-800" />
                <div className="w-3 h-3 rounded-full bg-stone-800" />
                <div className="w-3 h-3 rounded-full bg-stone-800" />
              </div>
              <span className="text-[10px] text-stone-500 tracking-[0.4em] uppercase font-black">Live_Transcription</span>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={clearTranscript}
                className="text-[10px] text-stone-600 hover:text-red-400 transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={12} /> CLEAR_BUFFER
              </button>
              <button 
                onClick={downloadTranscript}
                disabled={!transcript}
                className="text-[10px] text-stone-600 hover:text-blue-400 transition-colors flex items-center gap-1.5 disabled:opacity-20"
              >
                <Download size={12} /> SAVE_RAW
              </button>
            </div>
          </div>

          <div className="p-8 h-[500px] overflow-y-auto custom-scrollbar relative">
            <div className="space-y-4 text-lg leading-relaxed font-medium">
              <span className="text-white">{transcript}</span>
              <span className="text-blue-400/60 transition-all duration-300">{interimTranscript}</span>
              {isListening && !transcript && !interimTranscript && (
                <span className="text-stone-700 animate-pulse italic">Waiting for neural input...</span>
              )}
              {!isListening && !transcript && (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-30">
                  <Volume2 size={48} className="mb-4 text-stone-500" />
                  <p className="text-stone-400 tracking-widest font-black text-xs uppercase">Terminal_Inactive. Initiate_Rec to start.</p>
                </div>
              )}
            </div>
            
            {/* Listening Indicator */}
            {isListening && (
              <div className="absolute bottom-8 right-8 flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full">
                <div className="relative">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                  <div className="absolute inset-0 w-2 h-2 bg-blue-400 rounded-full blur-[2px]" />
                </div>
                <span className="text-[10px] text-blue-400 tracking-[0.3em] font-black underline decoration-blue-500/50">LISTENING_ACTIVE</span>
              </div>
            )}
          </div>
        </section>

        {/* Controls */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          <button
            onClick={toggleListening}
            className={`group relative flex-1 w-full h-24 rounded-2xl border transition-all duration-500 overflow-hidden ${isListening ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'border-blue-500/30 hover:border-blue-400/50 shadow-[0_0_30px_rgba(59,130,246,0.1)]'}`}
          >
            <div className={`absolute inset-0 transition-opacity duration-500 ${isListening ? 'bg-red-500/5' : 'bg-blue-500/5'}`} />
            <div className="relative flex items-center justify-center gap-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500 text-black group-hover:scale-110'}`}>
                {isListening ? <Square size={24} /> : <Mic size={24} />}
              </div>
              <div className="text-left">
                <div className="text-[10px] text-stone-500 tracking-widest uppercase font-black">{isListening ? 'Terminate_Stream' : 'Neural_Gateway'}</div>
                <div className={`text-2xl font-black tracking-tight ${isListening ? 'text-red-500' : 'group-hover:text-blue-400'} transition-colors`}>
                  {isListening ? 'STOP_RECORDING' : 'INITIATE_TRANSCRIBE'}
                </div>
              </div>
            </div>
          </button>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 text-xs"
          >
            <Cpu size={16} /> {error}
          </motion.div>
        )}
      </main>

      <footer className="relative max-w-5xl mx-auto py-16 px-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-[10px] text-stone-600 tracking-[0.3em] uppercase">
          Engine: <span className="text-blue-500/60">Web_Speech_Native</span>
        </div>
        <div className="text-[10px] text-stone-600 tracking-[0.3em] uppercase text-center">
          Privacy_Secure: <span className="text-green-500/60">End_To_End_Client_Side</span>
        </div>
        <div className="text-[10px] text-stone-600 tracking-[0.3em] uppercase">
          Build: <span className="text-white/20">VOICECORE_LT_V1</span>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.01);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59,130,246,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59,130,246,0.3);
        }
      `}</style>
    </div>
  );
}
