import React, { useState } from 'react';
import { Image, Video, Mic, Sparkles, Loader2, Play, Pause, Wand2 } from 'lucide-react';
import { generateImage, generateVideo, generateSpeech, editImage, transcribeAudio } from '../../services/geminiService';

interface MediaGeneratorProps {
  mode: 'image' | 'video' | 'audio';
}

const MediaGenerator: React.FC<MediaGeneratorProps> = ({ mode }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // Image Config
  const [imgSize, setImgSize] = useState<"1K" | "2K" | "4K">("1K");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [editMode, setEditMode] = useState(false);
  const [fileToEdit, setFileToEdit] = useState<File | null>(null);

  // Audio Config
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setStatusMessage('');

    try {
      if (mode === 'image') {
        if (editMode && fileToEdit) {
           setStatusMessage('Editing image...');
           const reader = new FileReader();
           reader.readAsDataURL(fileToEdit);
           reader.onloadend = async () => {
             try {
                const base64 = (reader.result as string).split(',')[1];
                const url = await editImage(prompt, base64, fileToEdit.type);
                setResult(url);
                setLoading(false);
             } catch (e: any) {
               setError(e.message);
               setLoading(false);
             }
           }
        } else {
           setStatusMessage('Generating image...');
           const url = await generateImage(prompt, imgSize, aspectRatio);
           setResult(url);
           setLoading(false);
        }
      } else if (mode === 'video') {
         setStatusMessage('Initializing Veo video generation...');
         // Check if using image input for Veo
         if (fileToEdit) {
            const reader = new FileReader();
            reader.readAsDataURL(fileToEdit);
            reader.onloadend = async () => {
              try {
                const base64 = (reader.result as string).split(',')[1];
                setStatusMessage('Generating video (this may take 1-2 mins)...');
                const url = await generateVideo(prompt, aspectRatio as any, { data: base64, mimeType: fileToEdit.type });
                setResult(url);
                setLoading(false);
              } catch (e: any) {
                setError(e.message);
                setLoading(false);
              }
            }
         } else {
            setStatusMessage('Generating video (this may take 1-2 mins)...');
            const url = await generateVideo(prompt, aspectRatio as any);
            setResult(url);
            setLoading(false);
         }
      } else if (mode === 'audio') {
        if (isTranscribing && fileToEdit) {
            setStatusMessage('Transcribing audio...');
            const reader = new FileReader();
            reader.readAsDataURL(fileToEdit);
            reader.onloadend = async () => {
              try {
                const base64 = (reader.result as string).split(',')[1];
                const text = await transcribeAudio(base64, fileToEdit.type);
                setResult(text); // For audio, result is text when transcribing
                setLoading(false);
              } catch(e: any) {
                setError(e.message);
                setLoading(false);
              }
            }
        } else {
            setStatusMessage('Generating speech...');
            const base64 = await generateSpeech(prompt);
            setResult(base64); // raw base64 for audio playback
            setLoading(false);
        }
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const decodeAndPlay = async (base64: string) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBuffer = await audioContext.decodeAudioData(bytes.buffer.slice(0)); // copy buffer
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 h-full">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">
            {mode === 'image' && 'Visual Studio'}
            {mode === 'video' && 'Motion Lab'}
            {mode === 'audio' && 'Audio Notes'}
          </h2>
          <p className="text-gray-400">
             {mode === 'image' && 'Generate high-res 4K images or edit existing photos.'}
             {mode === 'video' && 'Create cinematic videos with Veo.'}
             {mode === 'audio' && 'Convert text to life-like speech or transcribe lectures.'}
          </p>
        </div>

        <div className="glass p-6 rounded-2xl space-y-4">
          {/* Controls based on mode */}
          {mode === 'image' && (
             <div className="flex gap-4 mb-4">
               <button onClick={() => setEditMode(false)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${!editMode ? 'bg-primary text-white' : 'bg-white/5'}`}>Generate</button>
               <button onClick={() => setEditMode(true)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${editMode ? 'bg-primary text-white' : 'bg-white/5'}`}>Edit</button>
             </div>
          )}
          {mode === 'audio' && (
             <div className="flex gap-4 mb-4">
               <button onClick={() => setIsTranscribing(false)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${!isTranscribing ? 'bg-primary text-white' : 'bg-white/5'}`}>Text to Speech</button>
               <button onClick={() => setIsTranscribing(true)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${isTranscribing ? 'bg-primary text-white' : 'bg-white/5'}`}>Transcribe</button>
             </div>
          )}

          {/* File Input for Edit/Video/Transcribe */}
          {(editMode || (mode === 'video' && fileToEdit !== null) || mode === 'video' || isTranscribing) && (
             <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-primary/50 transition">
               <input 
                 type="file" 
                 accept={mode === 'audio' ? "audio/*" : "image/*"}
                 onChange={(e) => setFileToEdit(e.target.files?.[0] || null)}
                 className="hidden" 
                 id="file-upload" 
               />
               <label htmlFor="file-upload" className="cursor-pointer">
                  {fileToEdit ? (
                    <div className="text-green-400 font-medium truncate">{fileToEdit.name}</div>
                  ) : (
                    <div className="text-gray-400 text-sm">
                       {mode === 'video' ? "Optional: Upload start image" : "Upload file here"}
                    </div>
                  )}
               </label>
             </div>
          )}

          {/* Prompt */}
          {!isTranscribing && (
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={mode === 'video' ? "Describe the video motion..." : "Describe what you want to create..."}
              className="w-full bg-black/20 border border-white/10 rounded-xl p-4 h-32 focus:outline-none focus:border-primary/50 resize-none placeholder:text-gray-500"
            />
          )}

          {/* Configs */}
          {mode !== 'audio' && (
            <div className="grid grid-cols-2 gap-4">
              {mode === 'image' && !editMode && (
                <div>
                   <label className="text-xs text-gray-500 mb-1 block">Size</label>
                   <select value={imgSize} onChange={(e) => setImgSize(e.target.value as any)} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm">
                     <option value="1K">1K (Standard)</option>
                     <option value="2K">2K (High Res)</option>
                     <option value="4K">4K (Ultra)</option>
                   </select>
                </div>
              )}
              <div>
                 <label className="text-xs text-gray-500 mb-1 block">Aspect Ratio</label>
                 <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm">
                   <option value="16:9">16:9 (Landscape)</option>
                   <option value="9:16">9:16 (Portrait)</option>
                   <option value="1:1">1:1 (Square)</option>
                   <option value="4:3">4:3 (Classic)</option>
                 </select>
              </div>
            </div>
          )}

          <button
            onClick={handleAction}
            disabled={loading || (!prompt && !isTranscribing)}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
            {loading ? 'Generating...' : 'Create Magic'}
          </button>
          
          {error && <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">{error}</div>}
        </div>
      </div>

      {/* Preview Area */}
      <div className="bg-black/40 rounded-3xl border border-white/5 p-8 flex items-center justify-center min-h-[400px]">
        {!result && !loading && (
           <div className="text-center text-gray-500">
              <Wand2 size={48} className="mx-auto mb-4 opacity-50" />
              <p>Your creation will appear here</p>
           </div>
        )}
        
        {loading && (
           <div className="text-center">
             <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-gray-400 animate-pulse">{statusMessage}</p>
           </div>
        )}

        {result && !loading && mode === 'image' && (
           <img src={result} alt="Generated" className="max-w-full h-auto rounded-xl shadow-2xl" />
        )}
        
        {result && !loading && mode === 'video' && (
           <video src={result} controls autoPlay loop className="max-w-full h-auto rounded-xl shadow-2xl" />
        )}

        {result && !loading && mode === 'audio' && (
           <div className="text-center w-full">
              {isTranscribing ? (
                 <div className="text-left bg-white/5 p-6 rounded-xl border border-white/10 max-h-96 overflow-y-auto whitespace-pre-wrap">
                    {result}
                 </div>
              ) : (
                <div className="space-y-6">
                    <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
                       <Mic size={40} />
                    </div>
                    <button 
                      onClick={() => decodeAndPlay(result)} 
                      className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition flex items-center gap-2 mx-auto"
                    >
                      <Play size={20} fill="black" /> Play Audio
                    </button>
                </div>
              )}
           </div>
        )}
      </div>
    </div>
  );
};

export default MediaGenerator;