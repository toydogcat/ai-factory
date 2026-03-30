/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Mic, 
  Square, 
  Upload, 
  FileText, 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Cpu,
  Zap,
  Activity,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

// --- Utilities ---
const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

const convertToSRT = (segments: TranscriptionSegment[]): string => {
  return segments.map((s, i) => {
    const start = formatTime(s.start).replace('.', ',');
    const end = formatTime(s.end).replace('.', ',');
    return `${i + 1}\n${start} --> ${end}\n${s.text}\n`;
  }).join('\n');
};

const convertToTXT = (segments: TranscriptionSegment[]): string => {
  return segments.map(s => `[${formatTime(s.start).split('.')[0]}] ${s.text}`).join('\n');
};

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        setAudioBlob(blob);
        setFileName('RECORDING_VOICE_DATA.mp3');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError('ACCESS_DENIED: Microphone permission required.');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/') || file.name.endsWith('.mp3')) {
        setAudioBlob(file);
        setFileName(file.name.toUpperCase());
        setSegments([]);
        setError(null);
      } else {
        setError('INVALID_FORMAT: Please upload an audio file (MP3).');
      }
    }
  };

  const processAudio = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              inlineData: {
                mimeType: audioBlob.type || "audio/mp3",
                data: base64Data,
              },
            },
            {
              text: "Transcribe this audio to text with precise timestamps. Output MUST be a JSON array of objects, each with 'start' (number, seconds), 'end' (number, seconds), and 'text' (string). Ensure the language is detected automatically.",
            }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  start: { type: Type.NUMBER },
                  end: { type: Type.NUMBER },
                  text: { type: Type.STRING },
                },
                required: ["start", "end", "text"],
              },
            },
          },
        });

        const result = JSON.parse(response.text);
        setSegments(result);
        setIsProcessing(false);
      };
    } catch (err) {
      setError('CORE_PROCESS_FAILURE: AI transcription failed.');
      setIsProcessing(false);
      console.error(err);
    }
  };

  const downloadFile = (content: string, ext: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TRANSCRIPT_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] font-mono selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('./noise.svg')] opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Header */}
      <header className="relative max-w-5xl mx-auto pt-16 px-6">
        {/* Permission Banner */}
        <AnimatePresence>
          {location.protocol !== 'https:' && location.hostname !== 'localhost' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-xs flex flex-col gap-2"
            >
              <div className="flex items-center gap-2 font-black">
                <AlertCircle size={16} /> SECURITY_WARNING: INSECURE_ORIGIN_DETECTED
              </div>
              <p>Browsers block microphone access on non-HTTPS sites. Please use an HTTPS URL (e.g., https://...ngrok-free.app) to enable speech features.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-50 animate-pulse" />
            <div className="relative w-12 h-12 bg-black border border-cyan-500/50 rounded-lg flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Cpu size={28} />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-2">
              VOICE<span className="text-cyan-400">CORE</span>
              <span className="text-xs font-normal bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded border border-cyan-500/20 tracking-widest ml-2">V3.0</span>
            </h1>
            <p className="text-stone-500 text-sm uppercase tracking-[0.2em] mt-1">Neural Audio Transcription Interface</p>
          </div>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto py-12 px-6 grid gap-8">
        {/* Input Terminal */}
        <section className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="bg-white/5 px-6 py-3 border-bottom border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
              <div className="w-2 h-2 rounded-full bg-green-500/50" />
              <span className="ml-4 text-[10px] text-stone-500 tracking-widest uppercase">Input_Module.exe</span>
            </div>
            <Terminal size={14} className="text-stone-500" />
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Recording Node */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                <div className="relative flex flex-col items-center justify-center p-10 bg-black/60 rounded-2xl border border-white/5">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-500 border ${isRecording ? 'border-red-500 bg-red-500/10 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400'}`}>
                    {isRecording ? <Activity className="animate-pulse" size={32} /> : <Mic size={32} />}
                  </div>
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-full py-3 rounded-lg font-bold tracking-widest transition-all ${isRecording ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-cyan-500 text-black hover:bg-cyan-400'}`}
                  >
                    {isRecording ? 'TERMINATE_REC' : 'INITIALIZE_REC'}
                  </button>
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-stone-500">
                    <Zap size={10} /> <span>REAL_TIME_CAPTURE_ACTIVE</span>
                  </div>
                </div>
              </div>

              {/* Upload Node */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                <div className="relative flex flex-col items-center justify-center p-10 bg-black/60 rounded-2xl border border-white/5 cursor-pointer">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="audio/*"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-20 h-20 rounded-full border border-purple-500/30 bg-purple-500/5 text-purple-400 flex items-center justify-center mb-6 group-hover:border-purple-400 transition-all">
                    <Upload size={32} />
                  </div>
                  <button className="w-full py-3 bg-white/10 text-white rounded-lg font-bold tracking-widest hover:bg-white/20 transition-all border border-white/10">
                    IMPORT_DATA
                  </button>
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-stone-500">
                    <FileText size={10} /> <span>SUPPORTED: MP3, WAV, M4A</span>
                  </div>
                </div>
              </div>
            </div>

            {fileName && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mt-8 p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 rounded flex items-center justify-center text-cyan-400">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] text-cyan-500/60 uppercase tracking-widest">Selected_Buffer</div>
                    <div className="font-bold text-white truncate max-w-[200px] md:max-w-md">{fileName}</div>
                  </div>
                </div>
                <button
                  disabled={isProcessing}
                  onClick={processAudio}
                  className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-3 bg-cyan-500 text-black rounded-lg font-black hover:bg-cyan-400 disabled:opacity-30 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                  {isProcessing ? 'PROCESSING...' : 'EXECUTE_TRANSCRIPTION'}
                </button>
              </motion.div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg flex items-center gap-3 text-xs">
                <AlertCircle size={16} /> {error}
              </div>
            )}
          </div>
        </section>

        {/* Results Terminal */}
        <AnimatePresence>
          {segments.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="bg-white/5 px-6 py-3 border-bottom border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-cyan-400" />
                  <span className="text-[10px] text-stone-500 tracking-widest uppercase">Output_Stream.log</span>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => downloadFile(convertToTXT(segments), 'txt')}
                    className="text-[10px] text-stone-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                  >
                    <Download size={12} /> EXPORT_TXT
                  </button>
                  <button
                    onClick={() => downloadFile(convertToSRT(segments), 'srt')}
                    className="text-[10px] text-stone-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                  >
                    <Download size={12} /> EXPORT_SRT
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_40px]">
                {segments.map((segment, idx) => (
                  <div key={idx} className="relative group">
                    <div className="flex items-start gap-6">
                      <div className="flex flex-col items-end pt-1">
                        <span className="text-[10px] font-bold text-cyan-500/40 group-hover:text-cyan-400 transition-colors">
                          {formatTime(segment.start).split('.')[0]}
                        </span>
                        <div className="w-px h-8 bg-white/5 my-1" />
                        <span className="text-[10px] font-bold text-purple-500/40 group-hover:text-purple-400 transition-colors">
                          {formatTime(segment.end).split('.')[0]}
                        </span>
                      </div>
                      <div className="flex-1 p-4 rounded-xl bg-white/5 border border-white/5 group-hover:border-cyan-500/20 group-hover:bg-white/10 transition-all">
                        <p className="text-stone-300 leading-relaxed text-sm">{segment.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative max-w-5xl mx-auto py-16 px-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-[10px] text-stone-600 tracking-[0.3em] uppercase">
          System_Status: <span className="text-green-500/60">Operational</span>
        </div>
        <div className="text-[10px] text-stone-600 tracking-[0.3em] uppercase">
          Powered_By: <span className="text-white/40">Gemini_Neural_Engine</span>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6,182,212,0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6,182,212,0.4);
        }
      `}</style>
    </div>
  );
}
