import React from 'react';
import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Code, Highlighter, Check, Type } from 'lucide-react';

interface NoteEditorProps {
  notes: string;
  setNotes: (n: string) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ notes, setNotes }) => {
  const insertFormat = (format: string) => {
    // Simple text insertion for demo
    setNotes(notes + format);
  };

  const wordCount = notes.trim().split(/\s+/).filter(w => w.length > 0).length;
  const charCount = notes.length;

  return (
    <div className="flex flex-col h-full bg-[#13131F] relative">
      {/* Toolbar */}
      <div className="h-12 border-b border-white/5 flex items-center px-4 gap-1 bg-[#13131F] overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-2">
           <button title="Bold" className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition" onClick={() => insertFormat('**bold** ')}><Bold size={16} /></button>
           <button title="Italic" className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition" onClick={() => insertFormat('*italic* ')}><Italic size={16} /></button>
           <button title="Code" className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition" onClick={() => insertFormat('`code` ')}><Code size={16} /></button>
           <button title="Highlight" className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition" onClick={() => insertFormat('==highlight== ')}><Highlighter size={16} /></button>
        </div>
        
        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-2">
           <button title="H1" className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition" onClick={() => insertFormat('# ')}><Heading1 size={16} /></button>
           <button title="H2" className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition" onClick={() => insertFormat('## ')}><Heading2 size={16} /></button>
           <button title="H3" className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition" onClick={() => insertFormat('### ')}><Heading3 size={16} /></button>
        </div>

        <div className="flex items-center gap-1">
           <button title="Bullet List" className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition" onClick={() => insertFormat('- ')}><List size={16} /></button>
           <button title="Numbered List" className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition" onClick={() => insertFormat('1. ')}><ListOrdered size={16} /></button>
        </div>
        
        <div className="flex-1" />
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative group">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Start typing your notes..."
          className="w-full h-full bg-transparent p-8 focus:outline-none text-gray-200 resize-none font-mono leading-relaxed text-base placeholder:text-gray-600"
          spellCheck={false}
        />
      </div>

      {/* Footer */}
      <div className="h-10 border-t border-white/5 flex items-center px-6 text-xs text-gray-500 justify-between bg-[#0F0F1A]">
         <div className="flex gap-4">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
         </div>
         <span className="text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Saved
         </span>
      </div>
    </div>
  );
};

export default NoteEditor;
