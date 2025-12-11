import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Radio, MessageSquare, User, Bot } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

// Audio helpers
const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
};

const base64ToUint8Array = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

interface TranscriptItem {
  role: 'user' | 'model';
  text: string;
}

const LiveTutor: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [liveText, setLiveText] = useState<{role: 'user' | 'model', text: string} | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Refs for audio handling to avoid closures in event listeners
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);

  // Refs for accumulation
  const currentInputRef = useRef('');
  const currentOutputRef = useRef('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, liveText]);

  const stop = () => {
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (inputSourceRef.current) {
        inputSourceRef.current.disconnect();
        inputSourceRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    if (outputContextRef.current) {
        outputContextRef.current.close();
        outputContextRef.current = null;
    }
    if (sessionRef.current) {
        sessionRef.current.close(); 
        sessionRef.current = null;
    }
    setConnected(false);
    setLiveText(null);
  };

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Setup Audio Contexts
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      
      // Reset State
      setTranscripts([]);
      currentInputRef.current = '';
      currentOutputRef.current = '';
      
      // Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: 'You are an enthusiastic study tutor. Help the student prepare for exams. Keep responses concise and encouraging.',
        },
        callbacks: {
           onopen: () => {
             console.log("Session Opened");
             setConnected(true);

             // Setup Input Stream
             const ctx = audioContextRef.current!;
             const source = ctx.createMediaStreamSource(stream);
             const processor = ctx.createScriptProcessor(4096, 1, 1);
             
             processor.onaudioprocess = (e) => {
               if (isMuted) return; // Simple mute
               const inputData = e.inputBuffer.getChannelData(0);
               
               // Create PCM Blob (16-bit)
               const buffer = new ArrayBuffer(inputData.length * 2);
               const view = new DataView(buffer);
               floatTo16BitPCM(view, 0, inputData);
               
               // Encode to base64
               let binary = '';
               const bytes = new Uint8Array(buffer);
               for (let i = 0; i < bytes.byteLength; i++) {
                   binary += String.fromCharCode(bytes[i]);
               }
               const base64Data = btoa(binary);

               sessionPromise.then(session => {
                  session.sendRealtimeInput({
                      media: {
                          mimeType: 'audio/pcm;rate=16000',
                          data: base64Data
                      }
                  });
               });
             };

             source.connect(processor);
             processor.connect(ctx.destination);
             
             inputSourceRef.current = source;
             processorRef.current = processor;
           },
           onmessage: async (msg: LiveServerMessage) => {
              // Handle Transcription
              if (msg.serverContent?.outputTranscription) {
                 const text = msg.serverContent.outputTranscription.text;
                 currentOutputRef.current += text;
                 setLiveText({ role: 'model', text: currentOutputRef.current });
              } else if (msg.serverContent?.inputTranscription) {
                 const text = msg.serverContent.inputTranscription.text;
                 currentInputRef.current += text;
                 setLiveText({ role: 'user', text: currentInputRef.current });
              }

              if (msg.serverContent?.turnComplete) {
                 const input = currentInputRef.current;
                 const output = currentOutputRef.current;
                 
                 if (input) setTranscripts(p => [...p, { role: 'user', text: input }]);
                 if (output) setTranscripts(p => [...p, { role: 'model', text: output }]);
                 
                 currentInputRef.current = '';
                 currentOutputRef.current = '';
                 setLiveText(null);
              }

              // Handle Audio
              const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (base64Audio && outputContextRef.current) {
                  const ctx = outputContextRef.current;
                  const bytes = base64ToUint8Array(base64Audio);
                  
                  // Simple PCM to Float32 conversion for playback
                  const int16 = new Int16Array(bytes.buffer);
                  const float32 = new Float32Array(int16.length);
                  for(let i=0; i<int16.length; i++) {
                      float32[i] = int16[i] / 32768.0;
                  }
                  
                  const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
                  audioBuffer.copyToChannel(float32, 0);
                  
                  const source = ctx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(ctx.destination);
                  
                  const startTime = Math.max(ctx.currentTime, nextStartTimeRef.current);
                  source.start(startTime);
                  nextStartTimeRef.current = startTime + audioBuffer.duration;
              }
           },
           onclose: () => {
             console.log("Session Closed");
             setConnected(false);
           },
           onerror: (err) => {
             console.error("Session Error", err);
             setConnected(false);
           }
        }
      });
      
      sessionRef.current = await sessionPromise;

    } catch (e) {
      console.error(e);
      setConnected(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl space-y-8 z-10">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Live Tutor Session</h2>
            <p className="text-gray-400">
              Practice your oral exams or discuss complex topics in real-time.
            </p>
          </div>

          <div className="relative">
            {/* Visualizer Circle */}
            <div className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-500 ${connected ? 'bg-primary/20 shadow-[0_0_50px_rgba(139,92,246,0.5)]' : 'bg-white/5'}`}>
                {connected ? (
                    <div className="animate-pulse">
                        <Volume2 size={80} className="text-primary" />
                    </div>
                ) : (
                    <Radio size={80} className="text-gray-600" />
                )}
            </div>
          </div>

          <div className="flex gap-4">
            {!connected ? (
                <button 
                  onClick={startSession}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2"
                >
                    <Mic size={20} /> Start Session
                </button>
            ) : (
                <>
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                      {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                  <button 
                    onClick={stop}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-8 py-3 rounded-full font-bold transition"
                  >
                      End Session
                  </button>
                </>
            )}
          </div>
      </div>

      {/* Captions Overlay - Fixed position to avoid blocking buttons */}
      {connected && (
        <div className="fixed bottom-4 right-4 w-[calc(100vw-2rem)] md:w-96 bg-black/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 flex flex-col max-h-[300px] overflow-hidden z-50 shadow-2xl">
           <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
              <MessageSquare size={14} /> Live Captions
           </div>
           
           <div ref={scrollRef} className="overflow-y-auto space-y-4 pr-2">
              {transcripts.length === 0 && !liveText && (
                 <div className="text-center text-gray-500 italic py-4">Conversation will appear here...</div>
              )}
              
              {transcripts.map((t, i) => (
                <div key={i} className={`flex gap-3 ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   {t.role === 'model' && <Bot size={16} className="text-primary mt-1 shrink-0" />}
                   <div className={`p-3 rounded-2xl text-sm ${t.role === 'user' ? 'bg-white/10 text-white rounded-br-none' : 'bg-primary/20 text-gray-100 rounded-bl-none'}`}>
                      {t.text}
                   </div>
                   {t.role === 'user' && <User size={16} className="text-gray-400 mt-1 shrink-0" />}
                </div>
              ))}
              
              {/* Real-time typing bubble */}
              {liveText && (
                 <div className={`flex gap-3 ${liveText.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {liveText.role === 'model' && <Bot size={16} className="text-primary mt-1 shrink-0" />}
                    <div className={`p-3 rounded-2xl text-sm opacity-80 ${liveText.role === 'user' ? 'bg-white/10 text-white rounded-br-none' : 'bg-primary/20 text-gray-100 rounded-bl-none'}`}>
                        {liveText.text}<span className="inline-block w-1.5 h-3 ml-1 bg-current animate-pulse align-middle">|</span>
                    </div>
                    {liveText.role === 'user' && <User size={16} className="text-gray-400 mt-1 shrink-0" />}
                 </div>
              )}
           </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
      <video ref={videoRef} className="hidden" autoPlay muted playsInline />
    </div>
  );
};

export default LiveTutor;