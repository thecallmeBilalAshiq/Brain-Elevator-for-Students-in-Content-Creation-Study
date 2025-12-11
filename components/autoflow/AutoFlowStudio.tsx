
import React, { useState, useRef, useEffect } from 'react';
import { Play, Save, Plus, X, GitBranch, FileText, Upload, Mic, Smartphone, Youtube, Layers, Settings, Sparkles, Loader2, Zap, Trash2, CheckCircle, Clock, Move, ZoomIn, ZoomOut, Maximize, Eye, Copy, Download, StopCircle, Check } from 'lucide-react';
import { suggestWorkflows, generateContentFromNotes, transcribeAudio } from '../../services/geminiService';

// --- Types ---
interface NodeData {
  id: string;
  type: 'input' | 'process' | 'output';
  label: string;
  icon: any;
  x: number;
  y: number;
  status: 'idle' | 'running' | 'completed' | 'error';
  config?: any;
  outputData?: string; // Holds the generated result
}

interface Connection {
  id: string;
  from: string;
  to: string;
}

interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

// --- Mock Data ---
const MOCK_OUTPUTS: Record<string, string> = {
  'TikTok Script': `**Title: 3 Mind-Blowing Facts About Photosynthesis**

(0:00) **Visual:** Split screen, person looking shocked vs timelapse of plant growing.
**Audio:** "Stop scrolling! Did you know plants are basically eating sunlight?"

(0:15) **Visual:** Diagram of leaf cell, zooming into chloroplast.
**Audio:** "It's called photosynthesis, and it happens in these tiny green factories called chloroplasts."

(0:30) **Visual:** Text overlay: CO2 + H2O + Light -> Sugar + O2.
**Audio:** "They take carbon dioxide and water, mix it with light, and boom—sugar for them, oxygen for us!"

(0:50) **Visual:** Person taking a deep breath in a forest.
**Audio:** "So next time you breathe, thank a plant. Follow for more bio hacks!"`,

  'YouTube Outline': `**Video Title: Photosynthesis Explained in 5 Minutes**

**1. Introduction (0:00 - 1:00)**
- Hook: Why is the sky blue but plants are green?
- Definition of Photosynthesis.

**2. The Light-Dependent Reactions (1:00 - 2:30)**
- Location: Thylakoid membranes.
- Inputs: Light, H2O.
- Outputs: ATP, NADPH, O2.

**3. The Calvin Cycle (2:30 - 4:00)**
- Location: Stroma.
- Inputs: ATP, NADPH, CO2.
- Outputs: Glucose (Sugar).

**4. Importance to Life (4:00 - 4:45)**
- Oxygen production.
- Base of the food chain.

**5. Summary & Quiz (4:45 - 5:30)**
- Recap key points.
- CTA: Subscribe for more science visuals.`,

  'Flashcards': `**Front:** What is the primary pigment used in photosynthesis?
**Back:** Chlorophyll

---

**Front:** Where do light-dependent reactions take place?
**Back:** Thylakoid membranes

---

**Front:** What are the main inputs of the Calvin Cycle?
**Back:** ATP, NADPH, and Carbon Dioxide (CO2)

---

**Front:** What is the byproduct of photosynthesis that is essential for humans?
**Back:** Oxygen (O2)`,

  'Default': `**Generation Complete**

Analysis finished successfully.
- Concepts extracted: 12
- Key themes identified: 3
- Confidence score: 98%

Ready for next processing step.`
};

const AutoFlowStudio: React.FC = () => {
  // --- State ---
  const [nodes, setNodes] = useState<NodeData[]>([
    { id: '1', type: 'input', label: 'Study Notes', icon: FileText, x: 100, y: 250, status: 'idle', config: { source: 'Biology_Ch4.txt', content: 'Photosynthesis is the process used by plants...' } },
    { id: '2', type: 'process', label: 'Extract Concepts', icon: GitBranch, x: 450, y: 250, status: 'idle', config: { model: 'Gemini 3 Pro', depth: 50 } },
    { id: '3', type: 'output', label: 'TikTok Script', icon: Smartphone, x: 800, y: 150, status: 'idle' },
    { id: '4', type: 'output', label: 'Flashcards', icon: Layers, x: 800, y: 350, status: 'idle' },
  ]);

  const [edges, setEdges] = useState<Connection[]>([
    { id: 'e1', from: '1', to: '2' },
    { id: 'e2', from: '2', to: '3' },
    { id: 'e3', from: '2', to: '4' },
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // Viewport State for Panning/Zooming
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);

  // Connection State
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const [tempLineEnd, setTempLineEnd] = useState<{x: number, y: number} | null>(null);

  // Suggestions State
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);

  // Output Viewing State
  const [viewingNodeOutput, setViewingNodeOutput] = useState<NodeData | null>(null);
  const [copied, setCopied] = useState(false);

  // Dragging State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const lastMousePos = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // File Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // --- Helpers ---

  // Convert screen coordinates to world coordinates
  const screenToWorld = (screenX: number, screenY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (screenX - rect.left - viewport.x) / viewport.zoom,
      y: (screenY - rect.top - viewport.y) / viewport.zoom
    };
  };

  // --- Handlers ---

  const handleMouseDown = (e: React.MouseEvent) => {
    // If clicking on canvas (not handled by node), start panning
    if (e.button === 0) { // Left click
        setIsPanning(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        setSelectedNodeId(null);
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent canvas panning
    setSelectedNodeId(id);
    setDraggingId(id);
    
    const node = nodes.find(n => n.id === id);
    if (node) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      dragOffset.current = {
        x: worldPos.x - node.x,
        y: worldPos.y - node.y
      };
    }
  };

  const handlePortMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setConnectingNodeId(nodeId);
    const worldPos = screenToWorld(e.clientX, e.clientY);
    setTempLineEnd(worldPos);
  };

  const handlePortMouseUp = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (connectingNodeId && connectingNodeId !== nodeId) {
        // Create connection
        // Check if connection already exists
        const exists = edges.some(e => e.from === connectingNodeId && e.to === nodeId);
        if (!exists) {
            const newEdge: Connection = {
                id: `e-${Date.now()}`,
                from: connectingNodeId,
                to: nodeId
            };
            setEdges(prev => [...prev, newEdge]);
        }
    }
    setConnectingNodeId(null);
    setTempLineEnd(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);

    if (connectingNodeId) {
        setTempLineEnd(worldPos);
    } else if (draggingId) {
      // Dragging Node
      setNodes(prev => prev.map(n => 
        n.id === draggingId ? { ...n, x: worldPos.x - dragOffset.current.x, y: worldPos.y - dragOffset.current.y } : n
      ));
    } else if (isPanning) {
      // Panning Canvas
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setIsPanning(false);
    setConnectingNodeId(null);
    setTempLineEnd(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Zoom logic
    const zoomFactor = 0.1;
    const direction = e.deltaY > 0 ? -1 : 1;
    const newZoom = Math.min(Math.max(viewport.zoom + direction * zoomFactor, 0.2), 3);
    setViewport(prev => ({ ...prev, zoom: newZoom }));
  };

  const resetViewport = () => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  };

  const addNode = (template: { label: string, type: 'input' | 'process' | 'output', icon: any }) => {
    const centerWorld = screenToWorld(
        canvasRef.current ? canvasRef.current.getBoundingClientRect().width / 2 + canvasRef.current.getBoundingClientRect().left : 0, 
        canvasRef.current ? canvasRef.current.getBoundingClientRect().height / 2 + canvasRef.current.getBoundingClientRect().top : 0
    );

    const newNode: NodeData = {
      id: Date.now().toString(),
      type: template.type,
      label: template.label,
      icon: template.icon,
      x: centerWorld.x - 100 + (Math.random() * 50),
      y: centerWorld.y - 50 + (Math.random() * 50),
      status: 'idle',
      config: {}
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const deleteSelectedNode = () => {
    if (selectedNodeId) {
      setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
      setEdges(prev => prev.filter(e => e.from !== selectedNodeId && e.to !== selectedNodeId));
      setSelectedNodeId(null);
    }
  };

  const updateSelectedNode = (field: string, value: any) => {
    if (selectedNodeId) {
      setNodes(prev => prev.map(n => {
        if (n.id === selectedNodeId) {
          if (field === 'label') return { ...n, label: value };
          return { ...n, config: { ...n.config, [field]: value } };
        }
        return n;
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedNodeId) {
       // Read file content
       const reader = new FileReader();
       reader.onload = (ev) => {
         const content = ev.target?.result as string;
         // Update node with filename AND content
         setNodes(prev => prev.map(n => {
            if (n.id === selectedNodeId) {
                return { 
                    ...n, 
                    config: { ...n.config, source: file.name, content: content } 
                };
            }
            return n;
         }));
       };
       reader.readAsText(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const toggleRecording = async () => {
     if (isRecording) {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
     } else {
        try {
           const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
           const mediaRecorder = new MediaRecorder(stream);
           mediaRecorderRef.current = mediaRecorder;
           const chunks: BlobPart[] = [];
           
           mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
           mediaRecorder.onstop = async () => {
               const blob = new Blob(chunks, { type: 'audio/webm' });
               // Convert to base64
               const reader = new FileReader();
               reader.readAsDataURL(blob);
               reader.onloadend = async () => {
                   const base64 = (reader.result as string).split(',')[1];
                   try {
                       const text = await transcribeAudio(base64, 'audio/webm');
                       if (selectedNodeId) {
                           updateSelectedNode('content', text);
                           updateSelectedNode('source', 'Voice Recording');
                           alert("Voice transcribed successfully!");
                       }
                   } catch (e) {
                       console.error("Transcription failed", e);
                       alert("Transcription failed");
                   }
               };
               stream.getTracks().forEach(track => track.stop());
           };
           mediaRecorder.start();
           setIsRecording(true);
        } catch (e) {
            console.error("Mic access denied", e);
        }
     }
  };

  const runWorkflow = async () => {
    setIsRunning(true);
    setNodes(prev => prev.map(n => ({ ...n, status: 'idle', outputData: undefined })));
    const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

    const nodeOutputs: Record<string, string> = {};

    const processQueue = async (nodeIds: string[]) => {
       for (const id of nodeIds) {
          const currentNode = nodes.find(n => n.id === id);
          if (!currentNode) continue;

          setNodes(prev => prev.map(n => n.id === id ? { ...n, status: 'running' } : n));
          
          let output = '';
          
          if (currentNode.type === 'input') {
              // Input nodes pass their content
              output = currentNode.config?.content || "No content provided.";
              nodeOutputs[id] = output;
              await wait(500);
          } else if (currentNode.type === 'process') {
              // Process nodes take input from previous nodes
              const incomingEdge = edges.find(e => e.to === id);
              const inputContent = incomingEdge ? nodeOutputs[incomingEdge.from] : "";
              
              if (inputContent) {
                 try {
                     output = await generateContentFromNotes(inputContent, "Concepts", "Extract key concepts");
                 } catch (e) {
                     output = "Error processing content.";
                 }
              } else {
                 output = "No input data found.";
              }
              nodeOutputs[id] = output;
          } else if (currentNode.type === 'output') {
              // Output nodes format data
              const incomingEdge = edges.find(e => e.to === id);
              const inputContent = incomingEdge ? nodeOutputs[incomingEdge.from] : "";

              if (inputContent) {
                  try {
                      // Use label to determine format (e.g. "TikTok Script")
                      output = await generateContentFromNotes(inputContent, currentNode.label, `Create a ${currentNode.label}`);
                  } catch (e) {
                      output = MOCK_OUTPUTS[currentNode.label] || "Generation failed.";
                  }
              } else {
                  output = "No input to generate from.";
              }
              nodeOutputs[id] = output;
          }

          setNodes(prev => prev.map(n => {
            if (n.id === id) {
                return { ...n, status: 'completed', outputData: output };
            }
            return n;
          }));
          
          const nextIds = edges.filter(e => e.from === id).map(e => e.to);
          if (nextIds.length > 0) await processQueue(nextIds);
       }
    };
    
    // Find inputs that are roots (no incoming edges)
    const rootInputs = nodes.filter(n => n.type === 'input' && !edges.some(e => e.to === n.id)).map(n => n.id);
    
    // If user connected things weirdly, just start with any inputs
    const startNodes = rootInputs.length > 0 ? rootInputs : nodes.filter(n => n.type === 'input').map(n => n.id);
    
    await processQueue(startNodes);
    setIsRunning(false);
  };

  const handleGetSuggestions = async () => {
     setShowSuggestions(true);
     if (suggestions) return;
     setLoadingSuggestions(true);
     try {
        const profile = { subject: "Computer Science", frequency: "Daily", platforms: "Youtube, Notion, Anki", goals: "Exam Prep" };
        const notes = "Study notes about Algorithms and Data Structures...";
        const result = await suggestWorkflows(profile, notes);
        setSuggestions(result);
     } catch (e) { console.error(e); } 
     finally { setLoadingSuggestions(false); }
  };

  const handleCopy = () => {
    if (viewingNodeOutput?.outputData) {
      navigator.clipboard.writeText(viewingNodeOutput.outputData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (viewingNodeOutput?.outputData) {
        const blob = new Blob([viewingNodeOutput.outputData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${viewingNodeOutput.label}_Output.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex h-full bg-[#F8FAFC] relative overflow-hidden">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      {/* Left Sidebar - Node Library */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 z-20 select-none shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Node Library</h3>
           <button onClick={handleGetSuggestions} className="text-purple-600 hover:bg-purple-50 p-1.5 rounded transition" title="AI Suggestions"><Sparkles size={16} /></button>
        </div>
        <div className="p-4 space-y-6 overflow-y-auto flex-1">
           {/* Groups */}
           {['INPUTS', 'PROCESSES', 'OUTPUTS'].map(group => (
              <div key={group}>
                <h4 className="font-bold text-xs text-gray-900 mb-3 px-2">{group}</h4>
                <div className="space-y-2">
                   {(group === 'INPUTS' ? [
                      { l: 'Study Notes', i: FileText, t: 'input' }, { l: 'Upload File', i: Upload, t: 'input' }, { l: 'Voice Input', i: Mic, t: 'input' }
                   ] : group === 'PROCESSES' ? [
                      { l: 'Extract Concepts', i: GitBranch, t: 'process' }, { l: 'Generate Content', i: Layers, t: 'process' }
                   ] : [
                      { l: 'TikTok Script', i: Smartphone, t: 'output' }, { l: 'YouTube Outline', i: Youtube, t: 'output' }, { l: 'Flashcards', i: Layers, t: 'output' }
                   ]).map((n: any) => (
                      <div key={n.l} onClick={() => addNode({ label: n.l, type: n.t, icon: n.i })} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 cursor-pointer hover:shadow-md hover:border-blue-300 transition flex items-center gap-3 group active:scale-95">
                         <div className={`p-1.5 rounded ${group === 'INPUTS' ? 'bg-blue-50 text-blue-500' : group === 'PROCESSES' ? 'bg-purple-50 text-purple-500' : 'bg-green-50 text-green-500'}`}><n.i size={16} /></div>
                         {n.l}
                         <Plus size={14} className="ml-auto opacity-0 group-hover:opacity-100 text-gray-400" />
                      </div>
                   ))}
                </div>
              </div>
           ))}
        </div>
      </div>

      {/* Main Canvas */}
      <div 
        ref={canvasRef}
        className={`flex-1 relative overflow-hidden bg-[#F0F4F8] bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] select-none ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
        style={{ backgroundSize: `${20 * viewport.zoom}px ${20 * viewport.zoom}px`, backgroundPosition: `${viewport.x}px ${viewport.y}px` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
         {/* Top Toolbar */}
         <div className="absolute top-4 left-4 right-4 flex items-center justify-between p-3 bg-white/90 backdrop-blur border border-gray-200 rounded-xl shadow-sm z-30 pointer-events-none">
            <div className="flex items-center gap-4 px-2 pointer-events-auto">
               <div className="font-bold text-gray-800 flex items-center gap-2"><span className="text-purple-600">⚡</span> AutoFlow Studio</div>
               <div className="h-4 w-px bg-gray-200" />
               <input defaultValue="Biology Exam Prep" className="bg-transparent text-sm font-medium text-gray-600 focus:outline-none hover:text-gray-900" />
            </div>
            <div className="flex gap-2 pointer-events-auto">
               <button onClick={resetViewport} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Reset View"><Maximize size={16} /></button>
               <div className="h-6 w-px bg-gray-200 my-auto mx-1" />
               <button onClick={runWorkflow} disabled={isRunning} className="px-4 py-2 text-sm font-bold bg-green-500 text-white rounded-lg flex items-center gap-2 shadow-lg shadow-green-500/20 hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
                  {isRunning ? 'Running...' : 'Run Workflow'}
               </button>
            </div>
         </div>

         {/* Content Layer (Zoom/Pan applied here) */}
         <div 
            className="absolute inset-0 origin-top-left"
            style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}
         >
             {/* Connections */}
             <svg className="absolute top-0 left-0 overflow-visible w-[10000px] h-[10000px] pointer-events-none z-0">
                {edges.map(edge => {
                   const fromNode = nodes.find(n => n.id === edge.from);
                   const toNode = nodes.find(n => n.id === edge.to);
                   if (!fromNode || !toNode) return null;

                   const startX = fromNode.x + 256; 
                   const startY = fromNode.y + 40; 
                   const endX = toNode.x;
                   const endY = toNode.y + 40;
                   const cp1X = startX + (endX - startX) / 2;
                   const cp2X = endX - (endX - startX) / 2;

                   return (
                      <path 
                         key={edge.id}
                         d={`M ${startX} ${startY} C ${cp1X} ${startY}, ${cp2X} ${endY}, ${endX} ${endY}`}
                         fill="none" 
                         stroke={isRunning && fromNode.status === 'completed' && toNode.status === 'running' ? '#8B5CF6' : '#94A3B8'} 
                         strokeWidth="2" 
                         strokeDasharray={isRunning ? "5" : "0"}
                         className={isRunning ? "animate-[dash_1s_linear_infinite]" : ""}
                      />
                   );
                })}
                {/* Temporary Line when dragging */}
                {connectingNodeId && tempLineEnd && (() => {
                    const fromNode = nodes.find(n => n.id === connectingNodeId);
                    if (!fromNode) return null;
                    const startX = fromNode.x + 256;
                    const startY = fromNode.y + 40;
                    const endX = tempLineEnd.x;
                    const endY = tempLineEnd.y;
                    return (
                        <path 
                            d={`M ${startX} ${startY} L ${endX} ${endY}`}
                            fill="none"
                            stroke="#8B5CF6"
                            strokeWidth="2"
                            strokeDasharray="5"
                        />
                    );
                })()}
             </svg>

             {/* Nodes */}
             {nodes.map(node => {
                const Icon = node.icon;
                const isSelected = selectedNodeId === node.id;
                let styles = {
                   border: 'border-gray-200', header: 'bg-gray-500', iconBg: 'bg-gray-50', iconTxt: 'text-gray-500', ring: 'ring-gray-100'
                };
                if (node.type === 'input') styles = { border: 'group-hover:border-blue-400', header: 'bg-blue-500', iconBg: 'bg-blue-50', iconTxt: 'text-blue-500', ring: 'ring-blue-100' };
                else if (node.type === 'process') styles = { border: 'group-hover:border-purple-400', header: 'bg-purple-500', iconBg: 'bg-purple-50', iconTxt: 'text-purple-500', ring: 'ring-purple-100' };
                else if (node.type === 'output') styles = { border: 'group-hover:border-green-400', header: 'bg-green-500', iconBg: 'bg-green-50', iconTxt: 'text-green-500', ring: 'ring-green-100' };
                
                if (isSelected) styles.border = 'border-purple-500 ring-2 ring-purple-200';

                return (
                   <div 
                      key={node.id}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
                      className={`absolute left-0 top-0 w-64 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border ${styles.border} flex flex-col group transition-colors cursor-grab active:cursor-grabbing z-10`}
                   >
                      {/* Connection Ports */}
                      {/* Output Port (Right) */}
                      {node.type !== 'output' && (
                         <div 
                            onMouseDown={(e) => handlePortMouseDown(e, node.id)}
                            className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center cursor-crosshair z-20`}
                         >
                            <div className={`w-3 h-3 ${styles.header} rounded-full border-2 border-white ring-2 ${styles.ring} hover:scale-125 transition`} />
                         </div>
                      )}

                      {/* Input Port (Left) */}
                      {node.type !== 'input' && (
                         <div 
                            onMouseUp={(e) => handlePortMouseUp(e, node.id)}
                            className={`absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center cursor-crosshair z-20`}
                         >
                             <div className={`w-3 h-3 ${styles.header} rounded-full border-2 border-white ring-2 ${styles.ring} hover:scale-125 transition`} />
                         </div>
                      )}

                      <div className={`h-1.5 w-full ${styles.header} rounded-t-xl`} />
                      <div className="p-4">
                         <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 ${styles.iconBg} ${styles.iconTxt} rounded-lg`}><Icon size={18} /></div>
                            <span className="font-bold text-gray-800 truncate select-none">{node.label}</span>
                         </div>
                         {node.status === 'idle' && node.config?.source && (
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 font-mono truncate">{node.config.source}</div>
                         )}
                         {node.status === 'running' && (
                            <div className="text-xs text-purple-600 bg-purple-50 p-1.5 rounded inline-flex items-center gap-1 font-medium w-full"><Loader2 size={12} className="animate-spin" /> Processing...</div>
                         )}
                         {node.status === 'completed' && (
                            <div className="space-y-2">
                               <div className="text-xs text-green-600 bg-green-50 p-1.5 rounded inline-flex items-center gap-1 font-medium w-full"><CheckCircle size={12} /> Complete</div>
                               {(node.type === 'output' && node.outputData) && (
                                   <button 
                                     onMouseDown={(e) => { e.stopPropagation(); setViewingNodeOutput(node); }}
                                     className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-1.5 rounded font-bold flex items-center justify-center gap-1 transition"
                                   >
                                      <Eye size={12} /> View Result
                                   </button>
                               )}
                            </div>
                         )}
                      </div>
                   </div>
                );
             })}
         </div>

         {/* Bottom Status */}
         <div className="absolute bottom-0 w-full bg-white border-t border-gray-200 p-2 px-6 flex justify-between items-center text-xs text-gray-500 z-30 pointer-events-none">
            <div className="pointer-events-auto">Zoom: {Math.round(viewport.zoom * 100)}%</div>
            <div className="flex items-center gap-4 pointer-events-auto"><span>{nodes.length} nodes</span><span>{edges.length} connections</span></div>
         </div>
      </div>
      
      {/* Right Panel - Properties */}
      <div className="w-72 bg-white border-l border-gray-200 flex flex-col shrink-0 z-20 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between"><h3 className="font-bold text-gray-800">Node Settings</h3><Settings size={16} className="text-gray-400" /></div>
          {selectedNode ? (
             <div className="p-5 space-y-4">
                <div className={`p-4 rounded-xl border mb-4 flex items-center gap-3 ${selectedNode.type === 'input' ? 'bg-blue-50 border-blue-100 text-blue-700' : selectedNode.type === 'process' ? 'bg-purple-50 border-purple-100 text-purple-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                   <selectedNode.icon size={20} />
                   <div><div className="font-bold text-sm">{selectedNode.label}</div><div className="text-[10px] uppercase opacity-70">{selectedNode.type} Node</div></div>
                </div>
                
                <div className="space-y-4">
                   <label className="block"><span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Name</span><input value={selectedNode.label} onChange={(e) => updateSelectedNode('label', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 text-sm bg-white p-2 border text-gray-900" /></label>
                   {selectedNode.type === 'process' && (
                      <>
                        <label className="block"><span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Model</span><select value={selectedNode.config?.model || 'Gemini 3 Pro'} onChange={(e) => updateSelectedNode('model', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 text-sm bg-white p-2 border text-gray-900"><option>Gemini 3 Pro</option><option>Gemini 2.5 Flash</option></select></label>
                        <label className="block"><span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Depth</span><div className="mt-2 flex items-center justify-between text-xs text-gray-600"><span>Low</span><input type="range" value={selectedNode.config?.depth || 50} onChange={(e) => updateSelectedNode('depth', parseInt(e.target.value))} className="w-full mx-2 accent-purple-600" /><span>High</span></div></label>
                      </>
                   )}
                   {selectedNode.type === 'input' && (
                      <label className="block">
                         <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Source File</span>
                         <div className="mt-1 flex gap-2">
                            <input value={selectedNode.config?.source || ''} readOnly placeholder="No file selected" className="block w-full rounded-md border-gray-300 shadow-sm text-sm bg-gray-50 p-2 border text-gray-500 truncate" />
                            <button onClick={triggerFileUpload} className="p-2 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"><Upload size={14} className="text-gray-600" /></button>
                         </div>
                      </label>
                   )}
                   {selectedNode.label === 'Voice Input' && (
                       <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <label className="text-xs font-bold text-blue-700 uppercase block mb-2">Voice Recorder</label>
                          <button 
                            onClick={toggleRecording}
                            className={`w-full py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                          >
                             {isRecording ? <><StopCircle size={16} /> Stop Recording</> : <><Mic size={16} /> Start Recording</>}
                          </button>
                          {selectedNode.config?.content && (
                             <div className="mt-2 text-xs text-blue-800 bg-blue-100 p-2 rounded">
                                Audio transcribed.
                             </div>
                          )}
                       </div>
                   )}
                </div>
                <div className="mt-8 pt-4 border-t border-gray-100">
                   <button onClick={deleteSelectedNode} className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 p-2 rounded-lg transition text-sm font-medium"><Trash2 size={16} /> Delete Node</button>
                </div>
             </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center"><Settings size={24} className="opacity-50" /></div>
                <p className="text-sm">Select a node on the canvas to configure its properties.</p>
             </div>
          )}
      </div>

      {/* Result Output Modal */}
      {viewingNodeOutput && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setViewingNodeOutput(null)} />
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col relative z-20 overflow-hidden animate-fade-in">
                 <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm"><viewingNodeOutput.icon size={20} className="text-gray-700" /></div>
                        <div>
                           <h2 className="font-bold text-gray-900">{viewingNodeOutput.label}</h2>
                           <p className="text-xs text-gray-500">Output Result</p>
                        </div>
                    </div>
                    <button onClick={() => setViewingNodeOutput(null)} className="p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
                 </div>
                 <div className="p-6 overflow-y-auto bg-white flex-1">
                     <div className="prose prose-sm max-w-none font-mono text-gray-700 whitespace-pre-wrap">
                        {viewingNodeOutput.outputData}
                     </div>
                 </div>
                 <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                     <button 
                        onClick={handleCopy}
                        className={`px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition ${copied ? 'text-green-600 border-green-200 bg-green-50' : ''}`}
                     >
                        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
                     </button>
                     <button 
                        onClick={handleDownload}
                        className="px-4 py-2 bg-purple-600 rounded-lg text-sm font-semibold text-white hover:bg-purple-700 flex items-center gap-2"
                     >
                        <Download size={14} /> Download
                     </button>
                 </div>
             </div>
         </div>
      )}

      {/* Suggestions Modal */}
      {showSuggestions && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowSuggestions(false)} />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col relative z-20 overflow-hidden animate-fade-in">
               <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-purple-50">
                  <div className="flex items-center gap-3"><div className="p-2 bg-white rounded-lg shadow-sm text-purple-600"><Sparkles size={20} /></div><h2 className="text-lg font-bold text-gray-900">Recommended Workflows</h2></div>
                  <button onClick={() => setShowSuggestions(false)} className="p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
               </div>
               <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
                  {loadingSuggestions ? (
                     <div className="flex flex-col items-center justify-center h-64 gap-4"><Loader2 className="animate-spin text-purple-600" size={32} /><p className="text-gray-500 text-sm">Analyzing your study patterns...</p></div>
                  ) : suggestions ? (
                     <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           {suggestions.quick_wins?.map((win: any, i: number) => (
                              <div key={i} className="bg-green-50 border border-green-100 p-4 rounded-xl"><div className="flex items-center gap-2 mb-2 font-bold text-green-700 text-sm"><Zap size={14} fill="currentColor" /> Quick Win</div><p className="font-semibold text-gray-900 mb-1">{win.automation}</p><p className="text-xs text-gray-500">{win.weekly_benefit}</p></div>
                           ))}
                        </div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-4">Suggested Automations</h3>
                        <div className="space-y-4">
                           {suggestions.recommended_workflows?.map((wf: any, i: number) => (
                              <div key={i} className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition"><div className="flex justify-between items-start mb-2"><h4 className="font-bold text-gray-900">{wf.workflow_name}</h4><span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{wf.complexity}</span></div><p className="text-sm text-gray-600 mb-4">{wf.description}</p><div className="flex gap-2"><button className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition">Use Template</button><button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Details</button></div></div>
                           ))}
                        </div>
                     </div>
                  ) : <p className="text-center text-gray-500">No suggestions found.</p>}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default AutoFlowStudio;
