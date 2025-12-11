import React, { useState } from 'react';
import { Upload, FileText, Film, Loader2, ArrowRight } from 'lucide-react';
import { analyzeMedia } from '../../services/geminiService';
import ReactMarkdown from 'react-markdown';

const AnalyzeTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const text = await analyzeMedia(file, prompt || "Analyze this file in detail.");
      setResult(text);
    } catch (e: any) {
      setResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
         <div>
            <h2 className="text-2xl font-bold mb-2">Note Scanner</h2>
            <p className="text-gray-400">Upload images or videos of your notes, textbooks, or lectures.</p>
         </div>
         
         <div className="glass p-6 rounded-2xl space-y-4">
            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:bg-white/5 transition relative">
               <input 
                 type="file" 
                 onChange={(e) => setFile(e.target.files?.[0] || null)}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                 accept="image/*,video/*"
               />
               <Upload size={32} className="mx-auto text-primary mb-2" />
               <p className="text-sm text-gray-300">
                  {file ? file.name : "Drop notes or video here"}
               </p>
            </div>

            <textarea
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
               placeholder="What should I look for? (e.g., 'Summarize the key points', 'Extract dates')"
               className="w-full bg-black/20 border border-white/10 rounded-xl p-4 h-24 focus:outline-none focus:border-primary/50 resize-none"
            />
            
            <button 
               onClick={handleAnalyze}
               disabled={!file || loading}
               className="w-full bg-primary hover:bg-primary/90 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
               {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
               Analyze
            </button>
         </div>
      </div>

      <div className="bg-surface/50 border border-white/10 rounded-2xl p-6 overflow-y-auto">
         {result ? (
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
         ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
               <FileText size={48} className="opacity-20" />
               <p>Analysis results will appear here</p>
            </div>
         )}
      </div>
    </div>
  );
};

export default AnalyzeTool;
