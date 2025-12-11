import React, { useState } from 'react';
import NoteEditor from './NoteEditor';
import AIAssistant from './AIAssistant';
import { Play, Pause, RotateCcw, Clock, BookOpen, Settings, ChevronUp, Sparkles } from 'lucide-react';

interface StudyLabProps {
  notes: string;
  setNotes: (n: string) => void;
  onTransform: () => void;
}

const StudyLab: React.FC<StudyLabProps> = ({ notes, setNotes, onTransform }) => {
  const [topic, setTopic] = useState('Photosynthesis');
  
  // Pomodoro State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  
  // Mobile State
  const [isAiExpanded, setIsAiExpanded] = useState(false);

  React.useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#0F0F1A]">
      {/* Top Bar */}
      <header className="h-16 border-b border-white/5 flex items-center px-4 md:px-6 justify-between bg-[#0F0F1A] shrink-0 z-20">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white">
               <BookOpen size={20} className="text-[#8B5CF6]" />
               <span className="font-bold hidden md:inline">Study Lab</span>
            </div>
            <div className="h-4 w-px bg-white/10 hidden md:block" />
            <div className="relative group">
               <input 
                 value={topic}
                 onChange={(e) => setTopic(e.target.value)}
                 className="bg-[#1E1E2E] border border-white/10 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:border-[#8B5CF6]/50 w-48 md:w-64 text-white font-medium transition-all focus:w-72"
               />
               <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none group-focus-within:hidden">Edit</span>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <button 
               onClick={onTransform}
               className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-4 md:px-6 py-2 rounded-lg font-medium text-sm transition shadow-[0_0_15px_rgba(139,92,246,0.3)] flex items-center gap-2"
            >
               <span className="hidden md:inline">Transform to Content</span>
               <span className="md:hidden">Transform</span>
            </button>
            <button className="p-2 text-gray-400 hover:text-white transition">
               <Settings size={20} />
            </button>
         </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden relative">
         {/* Left: Notes (65%) */}
         <div className="w-full md:w-[65%] h-full overflow-hidden flex flex-col">
            <NoteEditor notes={notes} setNotes={setNotes} />
         </div>
         
         {/* Right: AI Assistant (35%) - Hidden on mobile unless expanded */}
         <div className={`
            fixed inset-0 z-40 bg-[#0F0F1A] transition-transform duration-300 md:relative md:inset-auto md:w-[35%] md:translate-y-0 md:flex md:flex-col border-l border-white/5
            ${isAiExpanded ? 'translate-y-16' : 'translate-y-full md:translate-y-0'}
         `}>
            {isAiExpanded && (
               <button 
                  onClick={() => setIsAiExpanded(false)}
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-[#1E1E2E] px-6 py-1 rounded-t-xl border-t border-x border-white/10 text-gray-400 md:hidden"
               >
                  <ChevronUp className="rotate-180" size={20} />
               </button>
            )}
            <AIAssistant initialContext={notes} isMobileExpanded={isAiExpanded} />
         </div>
      </div>

      {/* Mobile Bottom Bar Trigger for AI */}
      <div className="md:hidden absolute bottom-[80px] left-0 right-0 flex justify-center z-30 pointer-events-none">
         {!isAiExpanded && (
            <button 
               onClick={() => setIsAiExpanded(true)}
               className="pointer-events-auto bg-[#1E1E2E] shadow-2xl border border-white/10 px-6 py-3 rounded-full flex items-center gap-2 text-[#8B5CF6] font-bold backdrop-blur-md"
            >
               <Sparkles size={18} />
               Ask AI Assistant
            </button>
         )}
      </div>

      {/* Floating Widgets */}
      <div className="fixed bottom-24 md:bottom-8 right-4 md:right-[37%] z-30">
         <div className="bg-[#1E1E2E]/90 backdrop-blur-md border border-white/10 rounded-full p-2 pl-5 flex items-center gap-4 shadow-2xl transition-all hover:scale-105">
             <div className="flex items-center gap-3">
                 <div className="relative">
                    <Clock size={18} className="text-[#8B5CF6]" />
                    {timerActive && <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>}
                 </div>
                 <span className="font-mono font-bold text-xl text-white tracking-widest">{formatTime(timeLeft)}</span>
             </div>
             <div className="h-6 w-px bg-white/10" />
             <div className="flex gap-1">
                <button 
                  onClick={() => setTimerActive(!timerActive)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 text-white transition flex items-center justify-center"
                >
                   {timerActive ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                </button>
                <button 
                  onClick={() => { setTimerActive(false); setTimeLeft(25*60); }}
                  className="w-8 h-8 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition flex items-center justify-center"
                >
                   <RotateCcw size={14} />
                </button>
             </div>
         </div>
         <div className="text-center mt-2 text-[10px] text-gray-500 font-medium uppercase tracking-wider bg-black/50 rounded-full py-0.5 px-2 w-fit mx-auto backdrop-blur">
            Session 2 of 4
         </div>
      </div>
    </div>
  );
};

export default StudyLab;