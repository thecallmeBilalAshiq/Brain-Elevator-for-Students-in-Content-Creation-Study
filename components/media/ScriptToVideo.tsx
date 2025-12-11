import React, { useState } from 'react';
import { Video, Mic, Sparkles, Loader2, Play, AlertCircle, FileText, Download } from 'lucide-react';
import { generateVideo, generateSpeech } from '../../services/geminiService';

const ScriptToVideo: React.FC = () => {
  const [script, setScript] = useState('');
  const [mode, setMode] = useState<'video' | 'audio'>('video');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const handleGenerate = async () => {
    if (!script.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (mode === 'video') {
         setStatus('Initializing Google Veo (AI Video Model)...');
         // Truncate script for Veo prompt if too long, as it's a visual prompt
         const prompt = `Cinematic video representing: ${script.substring(0, 300)}`;
         
         setStatus('Generating video... This may take 1-2 minutes.');
         const uri = await generateVideo(prompt, '16:9');
         setResult(uri);
      } else {
        setStatus('Generating speech with Gemini TTS...');
        const base64 = await generateSpeech(script);
        setResult(base64);
      }
    } catch (e: any) {
      setError(e.message || "Generation failed");
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const playAudio = async (base64: string) => {
    try {
      // Gemini TTS returns raw PCM 24kHz mono audio
      const SAMPLE_RATE = 24000;
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE });
      
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Convert raw PCM (Int16) to AudioBuffer
      const int16Data = new Int16Array(bytes.buffer);
      const buffer = audioContext.createBuffer(1, int16Data.length, SAMPLE_RATE);
      const channelData = buffer.getChannelData(0);
      
      // Int16 to Float32 conversion
      for (let i = 0; i < int16Data.length; i++) {
        channelData[i] = int16Data[i] / 32768.0;
      }

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (e) {
      console.error("Audio playback error", e);
      setError("Could not play audio. Format might be incompatible.");
    }
  };

  // Helper to add WAV header to raw PCM data so it is downloadable and playable
  const createWavBlob = (base64: string, sampleRate = 24000) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const numChannels = 1;
    const byteRate = sampleRate * numChannels * 2;
    const blockAlign = numChannels * 2;
    const dataSize = bytes.byteLength;
    
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF chunk
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // 16-bit
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
    new Uint8Array(buffer, 44).set(bytes);

    return new Blob([buffer], { type: 'audio/wav' });
  };

  const downloadAudio = (base64: string) => {
     const blob = createWavBlob(base64);
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `generated_audio_${Date.now()}.wav`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-[#0B0B14] text-white p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg"><Video size={24} className="text-white" /></span>
            Script Studio
          </h1>
          <p className="text-gray-400 mt-2">Paste your scripts from the Creator Hub to generate Veo videos or lifelike voiceovers.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="glass p-1 rounded-xl flex">
              <button 
                onClick={() => setMode('video')}
                className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition ${mode === 'video' ? 'bg-[#8B5CF6] text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}
              >
                <Video size={18} /> Veo Video
              </button>
              <button 
                onClick={() => setMode('audio')}
                className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition ${mode === 'audio' ? 'bg-[#8B5CF6] text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}
              >
                <Mic size={18} /> Audio TTS
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm text-gray-400 px-1">
                <span className="flex items-center gap-1"><FileText size={14} /> Script Input</span>
                <span>{script.length} chars</span>
              </div>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder={mode === 'video' ? "Describe the scene for your video..." : "Paste your podcast or video script here..."}
                className="w-full h-48 bg-[#1E1E2E] border border-white/10 rounded-2xl p-6 focus:outline-none focus:border-[#8B5CF6] transition resize-none leading-relaxed placeholder:text-gray-600"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !script.trim()}
              className="w-full bg-gradient-to-r from-[#8B5CF6] to-pink-500 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" /> {status}
                </>
              ) : (
                <>
                  <Sparkles size={20} /> Generate {mode === 'video' ? 'Video' : 'Audio'}
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-2">
                <AlertCircle size={20} />
                {error}
              </div>
            )}
          </div>

          {/* Output Section */}
          <div className="glass rounded-2xl border border-white/10 p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden group">
            {!result && !loading && (
              <div className="text-center space-y-4 opacity-50">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  {mode === 'video' ? <Video size={40} /> : <Mic size={40} />}
                </div>
                <p>Generated content will appear here</p>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                <div className="w-16 h-16 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[#8B5CF6] font-medium animate-pulse">{status}</p>
              </div>
            )}

            {result && !loading && mode === 'video' && (
              <div className="w-full h-full flex flex-col">
                <video src={result} controls autoPlay loop className="w-full h-auto rounded-xl shadow-2xl mb-4" />
                <a 
                  href={result} 
                  download="generated_video.mp4"
                  className="mt-auto bg-white/10 hover:bg-white/20 py-2 rounded-lg text-center text-sm font-medium transition"
                >
                  Download MP4
                </a>
              </div>
            )}

            {result && !loading && mode === 'audio' && (
              <div className="w-full max-w-sm space-y-8 text-center">
                 <div className="w-32 h-32 bg-gradient-to-br from-[#8B5CF6] to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(139,92,246,0.4)] animate-pulse">
                    <Mic size={48} className="text-white" />
                 </div>
                 <div className="space-y-4">
                   <h3 className="text-xl font-bold">Audio Ready</h3>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => playAudio(result)}
                        className="flex-1 bg-white text-black px-4 py-3 rounded-full font-bold hover:scale-105 transition flex items-center justify-center gap-2"
                      >
                        <Play size={20} fill="black" /> Play
                      </button>
                      <button 
                        onClick={() => downloadAudio(result)}
                        className="flex-1 bg-white/10 text-white px-4 py-3 rounded-full font-bold hover:bg-white/20 transition flex items-center justify-center gap-2"
                      >
                        <Download size={20} /> Save .wav
                      </button>
                   </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptToVideo;