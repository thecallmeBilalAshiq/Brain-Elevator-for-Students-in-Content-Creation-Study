import React, { useState } from 'react';
import { Smartphone, Youtube, Instagram, Twitter, FileText, Layers, HelpCircle, Mic, Book, Zap, Wand2, RefreshCw, Copy, CheckCircle, Video, Image as ImageIcon, Search, LayoutGrid, List as ListIcon, X, Download, Loader2, Check, Maximize } from 'lucide-react';
import { generateContentFromNotes, generateBatchContent, generateImage } from '../../services/geminiService';
import { ContentFormat } from '../../types';

interface CreatorHubProps {
  notes: string;
}

const formats: ContentFormat[] = [
  { id: 'tiktok', title: 'TikTok Script', icon: Smartphone, gradient: 'from-pink-500 to-rose-500', category: 'Social', description: 'Viral short video script', promptTemplate: 'Create a 60-second TikTok script with visual cues.' },
  { id: 'youtube', title: 'YouTube Outline', icon: Youtube, gradient: 'from-red-500 to-orange-500', category: 'Video', description: 'Structure for long-form video', promptTemplate: 'Create a detailed YouTube video outline with timestamps.' },
  { id: 'instagram', title: 'IG Carousel', icon: Instagram, gradient: 'from-purple-500 to-pink-500', category: 'Social', description: '10-slide educational carousel', promptTemplate: 'Create text for a 10-slide Instagram carousel.' },
  { id: 'twitter', title: 'Twitter Thread', icon: Twitter, gradient: 'from-blue-400 to-cyan-400', category: 'Social', description: 'Engaging thread summary', promptTemplate: 'Create a viral Twitter thread summary.' },
  { id: 'blog', title: 'Blog Post', icon: FileText, gradient: 'from-green-500 to-emerald-500', category: 'Written', description: 'SEO-optimized article', promptTemplate: 'Write a comprehensive blog post.' },
  { id: 'flashcards', title: 'Flashcards', icon: Layers, gradient: 'from-yellow-400 to-orange-400', category: 'Study Tools', description: 'Key concepts Q&A', promptTemplate: 'Create 10 flashcards (Front/Back).' },
  { id: 'quiz', title: 'Quiz', icon: HelpCircle, gradient: 'from-orange-500 to-red-500', category: 'Study Tools', description: 'Multiple choice test', promptTemplate: 'Create a 5-question multiple choice quiz with answers.' },
  { id: 'podcast', title: 'Podcast Script', icon: Mic, gradient: 'from-indigo-500 to-purple-500', category: 'Video', description: 'Conversation script', promptTemplate: 'Write a dialogue script for a podcast.' },
  { id: 'guide', title: 'Study Guide', icon: Book, gradient: 'from-teal-400 to-blue-500', category: 'Study Tools', description: 'Structured revision notes', promptTemplate: 'Create a structured study guide.' },
  { id: 'summary', title: 'Quick Summary', icon: Zap, gradient: 'from-gray-400 to-gray-600', category: 'Written', description: 'Bullet point overview', promptTemplate: 'Provide a concise bullet-point summary.' },
];

const CreatorHub: React.FC<CreatorHubProps> = ({ notes }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState<ContentFormat | null>(null);
  const [generatedContent, setGeneratedContent] = useState<{[key: string]: string}>({});
  const [generatedImages, setGeneratedImages] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});
  const [imageLoading, setImageLoading] = useState<{[key: string]: boolean}>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [batchLoading, setBatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Custom Generation States
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Fallback notes if empty for demo purposes
  const notesToUse = notes && notes.trim().length > 0 ? notes : "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar.";

  const handleGenerate = async (format: ContentFormat) => {
    setLoading(prev => ({ ...prev, [format.id]: true }));
    setError(null);
    try {
      const content = await generateContentFromNotes(notesToUse, format.title, format.promptTemplate);
      setGeneratedContent(prev => ({ ...prev, [format.id]: content }));
    } catch (e: any) {
      console.error(e);
      setError(`Failed to generate: ${e.message}`);
    } finally {
      setLoading(prev => ({ ...prev, [format.id]: false }));
    }
  };

  const handleGenerateImage = async (format: ContentFormat, e: React.MouseEvent) => {
    e.stopPropagation();
    setImageLoading(prev => ({ ...prev, [format.id]: true }));
    setError(null);
    try {
      const prompt = `
        Create a high-quality, professional image suitable for a ${format.title}.
        
        CONTEXT:
        ${format.description}
        
        TOPIC SOURCE MATERIAL:
        ${notesToUse.substring(0, 300)}
        
        REQUIREMENTS:
        - Style: ${format.category === 'Social' ? 'Vibrant, eye-catching, trending style' : format.category === 'Study Tools' ? 'Clean, educational, diagrammatic' : 'Cinematic, professional editorial style'}
        - No text overlay if possible, or minimal text.
        - High resolution detail.
      `;

      // Determine aspect ratio based on format type
      const isVertical = ['tiktok', 'instagram', 'smartphone'].includes(format.id) || format.title.toLowerCase().includes('tiktok') || format.title.toLowerCase().includes('instagram');
      const aspectRatio = isVertical ? '9:16' : '16:9';
      
      const url = await generateImage(prompt, "1K", aspectRatio);
      setGeneratedImages(prev => ({ ...prev, [format.id]: url }));
    } catch (err: any) {
      setError(err.message || "Failed to generate image");
    } finally {
      setImageLoading(prev => ({ ...prev, [format.id]: false }));
    }
  };

  const handleBatchGenerate = async () => {
    setBatchLoading(true);
    setError(null);
    // Set all individual loading states
    const allLoading = formats.reduce((acc, f) => ({ ...acc, [f.id]: true }), {});
    setLoading(allLoading);

    try {
      const result = await generateBatchContent("Study Notes", notesToUse);
      const formatsData = result.formats || {};
      
      const newContent: {[key: string]: string} = {};

      // Parse and format each type
      if (formatsData.tiktok) {
        newContent['tiktok'] = `HOOK: ${formatsData.tiktok.hook}\n\nSCRIPT:\n${formatsData.tiktok.script}\n\nHASHTAGS: ${formatsData.tiktok.hashtags?.join(' ')}`;
      }
      if (formatsData.youtube) {
        newContent['youtube'] = `TITLE: ${formatsData.youtube.title}\n\nTHUMBNAIL: ${formatsData.youtube.thumbnail_idea}\n\nOUTLINE:\n${formatsData.youtube.outline}`;
      }
      if (formatsData.instagram) {
        newContent['instagram'] = `CAPTION: ${formatsData.instagram.caption}\n\nSLIDES:\n${formatsData.instagram.slides?.map((s: string, i: number) => `Slide ${i+1}: ${s}`).join('\n')}`;
      }
      if (formatsData.twitter) {
        newContent['twitter'] = formatsData.twitter.thread?.map((t: string, i: number) => `${i+1}/ ${t}`).join('\n\n') || '';
      }
      if (formatsData.flashcards) {
        newContent['flashcards'] = formatsData.flashcards.cards?.map((c: any) => `Q: ${c.front}\nA: ${c.back}`).join('\n\n--- \n\n') || '';
      }
      if (formatsData.quiz) {
        newContent['quiz'] = formatsData.quiz.questions?.map((q: any, i: number) => `${i+1}. ${q.q}\n   A) ${q.options?.A || ''}\n   B) ${q.options?.B || ''}\n   C) ${q.options?.C || ''}\n   Answer: ${q.answer}`).join('\n\n') || '';
      }
      if (formatsData.blog) {
        newContent['blog'] = `TITLE: ${formatsData.blog.title}\n\nINTRO: ${formatsData.blog.intro}\n\nOUTLINE:\n${formatsData.blog.outline}`;
      }
      if (formatsData.podcast) {
        newContent['podcast'] = `TITLE: ${formatsData.podcast.title}\n\nSCRIPT:\n${formatsData.podcast.script}`;
      }
      if (formatsData.guide) {
        newContent['guide'] = `SUMMARY: ${formatsData.guide.summary}\n\nKEY CONCEPTS:\n${formatsData.guide.key_concepts?.map((k: string) => `• ${k}`).join('\n')}`;
      }
      if (formatsData.summary) {
        newContent['summary'] = formatsData.summary.bullet_points?.map((p: string) => `• ${p}`).join('\n') || '';
      }

      setGeneratedContent(prev => ({ ...prev, ...newContent }));

    } catch (e: any) {
      console.error("Batch generation failed", e);
      setError("Batch generation failed. Please try again.");
    } finally {
      setBatchLoading(false);
      setLoading({});
    }
  };

  const openPreview = (format: ContentFormat) => {
    setSelectedFormat(format);
    setEditedContent(generatedContent[format.id] || '');
    setEditMode(false);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!selectedFormat) return;
    const blob = new Blob([editedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFormat.title.replace(/\s+/g, '_')}_Generated.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredFormats = activeCategory === 'All' 
    ? formats 
    : formats.filter(f => f.category === activeCategory);

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] overflow-y-auto">
      {/* Top Section */}
      <div className="bg-white border-b border-gray-200 p-8">
         <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
               <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                     <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                        <Wand2 size={24} />
                     </div>
                     Creator Hub
                  </h1>
                  <p className="text-gray-500">Your study notes transformed into 10 content formats.</p>
               </div>
               
               <div className="flex items-center gap-4">
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                     <input placeholder="Search content..." className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:border-purple-500 text-gray-700" />
                  </div>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                     <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}><LayoutGrid size={18} /></button>
                     <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}><ListIcon size={18} /></button>
                  </div>
               </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
               {['All', 'Video', 'Social', 'Study Tools', 'Written'].map(cat => (
                  <button
                     key={cat}
                     onClick={() => setActiveCategory(cat)}
                     className={`px-5 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                        activeCategory === cat 
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                     }`}
                  >
                     {cat}
                  </button>
               ))}
            </div>

            {error && (
               <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
               </div>
            )}
            
            {!notes || notes.trim() === "" ? (
               <div className="mt-4 p-3 bg-blue-50 text-blue-600 rounded-lg text-sm flex items-center gap-2">
                  <span className="font-bold">Note:</span> Using default example notes because your Study Lab is empty.
               </div>
            ) : null}
         </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto p-8 w-full flex-1">
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1'}`}>
           {filteredFormats.map(format => {
              const Icon = format.icon;
              const hasContent = !!generatedContent[format.id];
              const hasImage = !!generatedImages[format.id];
              const isLoading = loading[format.id];
              const isImgLoading = imageLoading[format.id];

              return (
                 <div key={format.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                    <div className={`h-1.5 bg-gradient-to-r ${format.gradient}`} />
                    <div className="p-5 flex-1 flex flex-col">
                       <div className="flex items-start justify-between mb-4">
                          <div className={`p-2.5 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition`}>
                             <Icon className="text-gray-700" size={20} />
                          </div>
                          <div className="flex gap-1">
                             {hasContent && (
                                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                                   <FileText size={10} /> Text
                                </span>
                             )}
                             {hasImage && (
                                <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1">
                                   <ImageIcon size={10} /> Img
                                </span>
                             )}
                             {(isLoading || isImgLoading) && (
                                <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full animate-pulse">
                                   {isLoading ? 'Writing...' : 'Drawing...'}
                                </span>
                             )}
                          </div>
                       </div>
                       
                       <h3 className="font-bold text-gray-900 mb-1">{format.title}</h3>
                       <p className="text-gray-500 text-xs line-clamp-2 mb-4 h-8">{format.description}</p>
                       
                       {/* Preview Area - Image takes precedence if available */}
                       {hasImage ? (
                          <div className="mb-4 rounded-lg overflow-hidden h-32 relative group/image bg-gray-100 border border-gray-200">
                             <img src={generatedImages[format.id]} alt="Generated" className="w-full h-full object-cover" />
                             <button 
                               className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur rounded-full text-white opacity-0 group-hover/image:opacity-100 transition hover:bg-black/80" 
                               onClick={(e) => { e.stopPropagation(); window.open(generatedImages[format.id], '_blank'); }}
                             >
                                <Maximize size={12} />
                             </button>
                          </div>
                       ) : hasContent ? (
                          <div className="mb-4 bg-gray-50 rounded border border-gray-100 p-2 text-[10px] text-gray-400 font-mono h-32 overflow-hidden relative">
                             {generatedContent[format.id]}
                             <div className="absolute inset-0 bg-gradient-to-t from-gray-50 to-transparent" />
                          </div>
                       ) : (
                          <div className="mb-4 bg-gray-50/50 rounded border border-gray-100/50 h-32 flex flex-col items-center justify-center text-gray-300 text-xs gap-2 group/empty">
                             <span>No content</span>
                             <button 
                                onClick={(e) => handleGenerateImage(format, e)}
                                className="text-purple-500 hover:text-purple-700 font-medium flex items-center gap-1 opacity-0 group-hover/empty:opacity-100 transition bg-white/80 px-2 py-1 rounded shadow-sm hover:shadow"
                             >
                                <ImageIcon size={12} /> Create Visual
                             </button>
                          </div>
                       )}

                       <div className="mt-auto flex gap-2">
                          <button 
                             onClick={() => openPreview(format)}
                             disabled={!hasContent && !hasImage}
                             className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                             View
                          </button>
                          <button 
                             onClick={() => handleGenerate(format)}
                             disabled={isLoading}
                             title="Generate Text"
                             className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition disabled:opacity-50"
                          >
                             <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                          </button>
                          <button 
                             onClick={(e) => handleGenerateImage(format, e)}
                             disabled={isImgLoading}
                             title="Generate Image"
                             className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition disabled:opacity-50"
                          >
                             <ImageIcon size={14} className={isImgLoading ? 'animate-spin' : ''} />
                          </button>
                       </div>
                    </div>
                 </div>
              );
           })}
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
         onClick={handleBatchGenerate}
         disabled={batchLoading}
         className="fixed bottom-8 right-8 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-2xl shadow-purple-500/40 transition-transform hover:scale-110 flex items-center gap-2 group z-30 disabled:opacity-70 disabled:scale-100"
      >
         {batchLoading ? <Loader2 className="animate-spin" /> : <Wand2 size={24} />}
         <span className={`max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold whitespace-nowrap ${batchLoading ? 'max-w-xs' : ''}`}>
             {batchLoading ? 'Generating All...' : 'Generate All Text'}
         </span>
      </button>

      {/* Preview Modal */}
      {selectedFormat && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedFormat(null)} />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative z-10 overflow-hidden animate-fade-in">
               
               {/* Modal Header */}
               <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                  <div className="flex items-center gap-4">
                     <div className={`p-3 rounded-xl bg-gradient-to-r ${selectedFormat.gradient} shadow-lg text-white`}>
                        <selectedFormat.icon size={24} />
                     </div>
                     <div>
                        <h2 className="text-xl font-bold text-gray-900">{selectedFormat.title}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                           <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">{selectedFormat.category}</span>
                           <span>• AI Generated</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button onClick={() => setSelectedFormat(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
                        <X size={24} />
                     </button>
                  </div>
               </div>

               {/* Modal Content */}
               <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                  <div className="max-w-4xl mx-auto space-y-6">
                     {/* Show Image if available in modal */}
                     {generatedImages[selectedFormat.id] && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
                           <div className="relative group rounded-lg overflow-hidden bg-gray-100">
                              <img src={generatedImages[selectedFormat.id]} alt="Generated Visual" className="w-full h-auto max-h-[400px] object-contain mx-auto" />
                              <a 
                                href={generatedImages[selectedFormat.id]} 
                                download={`generated_${selectedFormat.id}.png`}
                                className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition opacity-0 group-hover:opacity-100 flex items-center gap-2"
                              >
                                 <Download size={16} /> Save Image
                              </a>
                           </div>
                        </div>
                     )}

                     <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 min-h-[400px]">
                        {editMode ? (
                           <textarea 
                              className="w-full h-full min-h-[400px] resize-none focus:outline-none font-mono text-sm text-gray-700 leading-relaxed p-4"
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                           />
                        ) : generatedContent[selectedFormat.id] ? (
                           <div className="prose prose-sm max-w-none prose-purple font-mono whitespace-pre-wrap text-gray-700">
                              {editedContent}
                           </div>
                        ) : (
                           <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                              <FileText size={48} className="mb-4 opacity-20" />
                              <p>No text content generated yet.</p>
                              <button 
                                onClick={() => { setSelectedFormat(null); handleGenerate(selectedFormat); }}
                                className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
                              >
                                Generate Now
                              </button>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               {/* Modal Footer */}
               <div className="p-4 bg-white border-t border-gray-100 flex justify-between items-center">
                  <div className="flex gap-4 text-xs font-medium text-gray-500">
                     <span>{editedContent ? editedContent.split(/\s+/).length : 0} words</span>
                     <span>~{editedContent ? Math.ceil(editedContent.split(/\s+/).length / 150) : 0} min read</span>
                  </div>
                  <div className="flex gap-3">
                     <button 
                        onClick={() => setEditMode(!editMode)}
                        disabled={!generatedContent[selectedFormat.id]}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition border border-gray-200 disabled:opacity-50"
                     >
                        {editMode ? 'Cancel' : 'Edit Text'}
                     </button>
                     {editMode && (
                        <button 
                           onClick={() => {
                              setGeneratedContent(p => ({...p, [selectedFormat.id]: editedContent}));
                              setEditMode(false);
                           }}
                           className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
                        >
                           Save Changes
                        </button>
                     )}
                     {!editMode && generatedContent[selectedFormat.id] && (
                        <>
                           <button 
                              onClick={handleDownload}
                              className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition border border-gray-200 flex items-center gap-2"
                           >
                              <Download size={16} /> Export Text
                           </button>
                           <button 
                              onClick={handleCopy}
                              className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition shadow-lg flex items-center gap-2 ${copied ? 'bg-green-500 hover:bg-green-600 shadow-green-200' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'}`}
                           >
                              {copied ? <Check size={16} /> : <Copy size={16} />}
                              {copied ? 'Copied' : 'Copy Text'}
                           </button>
                        </>
                     )}
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default CreatorHub;