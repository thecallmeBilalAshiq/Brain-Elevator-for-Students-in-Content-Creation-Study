import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, Video, Zap, FileText, CheckCircle2, Github, Linkedin, Mail, Phone, Code, Database, Cpu } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorFollowerRef = useRef<HTMLDivElement>(null);

  // Custom Cursor Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      }
      
      // Delay for follower
      if (cursorFollowerRef.current) {
        setTimeout(() => {
          if (cursorFollowerRef.current) {
             cursorFollowerRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
          }
        }, 80);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Particle Animation Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: Particle[] = [];
    const particleCount = 80;
    const connectionDistance = 150;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.size = Math.random() * 2 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139, 92, 246, 0.5)'; // Primary color with opacity
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach((p, index) => {
        p.update();
        p.draw();

        // Connect particles
        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139, 92, 246, ${1 - distance / connectionDistance})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });
      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-primary/30 relative overflow-hidden">
      {/* Custom Cursor Elements */}
      <div 
         ref={cursorRef} 
         className="fixed w-5 h-5 bg-primary rounded-full pointer-events-none z-[9999] mix-blend-difference" 
         style={{ boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)' }}
      />
      <div 
         ref={cursorFollowerRef} 
         className="fixed w-10 h-10 border-2 border-primary rounded-full pointer-events-none z-[9998] transition-transform duration-300 ease-out opacity-60" 
      />

      {/* Background Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-40" />

      {/* Nav */}
      <nav className="fixed w-full z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="font-bold text-2xl flex items-center gap-3">
            <div className="bg-gradient-to-tr from-primary to-accent p-2 rounded-lg">
              <Sparkles className="text-white fill-white" size={20} />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">StudyVerse AI</span>
          </div>
          <button 
            onClick={onStart}
            className="group relative px-6 py-2.5 rounded-full bg-white text-gray-900 font-bold text-sm overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <span className="relative z-10">Sign In</span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-10 transition-opacity" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-primary mb-4 animate-fade-in">
             <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
             AI-Powered Learning Platform
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[1.1]">
            Study Once. <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-accent animate-gradient">
               Create Everywhere.
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Transform your study notes into TikTok scripts, YouTube videos, flashcards & more with the power of Gemini 2.5 and Veo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <button onClick={onStart} className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent text-white px-10 py-4 rounded-full font-bold text-lg shadow-[0_10px_30px_rgba(139,92,246,0.4)] transition hover:scale-110 hover:-translate-y-1 flex items-center justify-center gap-3 group">
              Start For Free 
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={onStart} className="w-full sm:w-auto px-10 py-4 rounded-full font-bold text-lg border border-white/20 hover:bg-white/5 transition flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center group-hover:scale-110 transition">
                 <Video size={14} fill="currentColor" />
              </div>
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {[
             { title: "Study Lab", icon: FileText, desc: "Smart note-taking with AI comprehension tracking using Gemini Pro.", color: "blue" },
             { title: "AutoFlow", icon: Zap, desc: "One-click automation generates 10+ formats from a single source.", color: "purple" },
             { title: "Creator Hub", icon: Video, desc: "Edit images, animate diagrams with Veo, and export viral content.", color: "pink" }
          ].map((feature, i) => (
            <div key={i} className="glass p-8 rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-300 group hover:-translate-y-2 relative overflow-hidden">
               <div className={`absolute top-0 right-0 w-32 h-32 bg-${feature.color}-500/10 rounded-full blur-3xl -z-10 transition-all group-hover:bg-${feature.color}-500/20`} />
               <div className={`w-14 h-14 bg-${feature.color}-500/20 rounded-2xl flex items-center justify-center text-${feature.color}-400 mb-6 group-hover:scale-110 group-hover:rotate-6 transition duration-300`}>
                  <feature.icon size={28} />
               </div>
               <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
               <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 px-6 relative z-10 bg-gradient-to-b from-[#0f172a] to-[#1e293b]/50">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
               <span className="text-primary font-semibold tracking-wider uppercase text-sm">Our Visionaries</span>
               <h2 className="text-4xl md:text-5xl font-bold mt-2">Meet The Team</h2>
               <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto mt-6 rounded-full" />
            </div>

            <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
               {/* Member 1: Muhammad Bilal Ashiq */}
               <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                  <div className="relative glass p-8 rounded-3xl border border-white/10 hover:border-primary/50 transition-all duration-300 h-full flex flex-col items-center text-center">
                     <div className="relative w-40 h-40 mb-6">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary to-accent rounded-full animate-spin-slow opacity-70 blur-md" />
                        <img 
                           src="https://avatars.githubusercontent.com/u/138978969" 
                           alt="Muhammad Bilal Ashiq" 
                           className="w-full h-full object-cover rounded-full border-4 border-[#0f172a] relative z-10 shadow-2xl group-hover:scale-105 transition duration-500" 
                        />
                        <div className="absolute bottom-0 right-0 z-20 bg-green-500 w-8 h-8 rounded-full border-4 border-[#0f172a] flex items-center justify-center text-[10px] font-bold">
                           <Code size={14} />
                        </div>
                     </div>
                     
                     <h3 className="text-2xl font-bold mb-1 group-hover:text-primary transition">Muhammad Bilal Ashiq</h3>
                     <p className="text-accent font-medium mb-2">CTO & Supervisor at entracloud</p>
                     
                     <div className="text-gray-400 text-sm mb-6 leading-relaxed space-y-2">
                        <p>Full Stack Developer & ML Engineer with a passion for teaching. BSCS student at FAST NUCES.</p>
                        <div className="flex flex-wrap justify-center gap-2 mt-2">
                           <span className="bg-white/10 px-2 py-1 rounded-full text-xs">Research Assistant</span>
                           <span className="bg-white/10 px-2 py-1 rounded-full text-xs">AMNESTY President</span>
                           <span className="bg-white/10 px-2 py-1 rounded-full text-xs">Web Dev</span>
                        </div>
                     </div>

                     <div className="flex gap-4 mt-auto">
                        <a href="https://github.com/thecallmeBilalAshiq" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:scale-110 transition duration-300">
                           <Github size={18} />
                        </a>
                        <a href="https://www.linkedin.com/in/bilal-ashiq/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#0077b5] hover:scale-110 transition duration-300">
                           <Linkedin size={18} />
                        </a>
                        <a href="mailto:methebilalashiq@gmail.com" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500 hover:scale-110 transition duration-300">
                           <Mail size={18} />
                        </a>
                     </div>
                  </div>
               </div>

               {/* Member 2: Qasim Hafeez */}
               <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-purple-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                  <div className="relative glass p-8 rounded-3xl border border-white/10 hover:border-accent/50 transition-all duration-300 h-full flex flex-col items-center text-center">
                     <div className="relative w-40 h-40 mb-6">
                        <div className="absolute inset-0 bg-gradient-to-tr from-accent to-purple-500 rounded-full animate-spin-slow opacity-70 blur-md" />
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 rounded-full border-4 border-[#0f172a] relative z-10 shadow-2xl flex items-center justify-center text-4xl font-bold text-gray-400 group-hover:text-white transition duration-500">
                           QH
                        </div>
                        <div className="absolute bottom-0 right-0 z-20 bg-blue-500 w-8 h-8 rounded-full border-4 border-[#0f172a] flex items-center justify-center text-[10px] font-bold">
                           <Database size={14} />
                        </div>
                     </div>
                     
                     <h3 className="text-2xl font-bold mb-1 group-hover:text-accent transition">Qasim Hafeez</h3>
                     <p className="text-purple-400 font-medium mb-4">Core Team Member</p>
                     
                     <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                        Dedicated developer contributing to the core architecture and development of the platform.
                     </p>

                     <div className="flex gap-4 mt-auto">
                        <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:scale-110 transition duration-300">
                           <Github size={18} />
                        </button>
                        <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#0077b5] hover:scale-110 transition duration-300">
                           <Linkedin size={18} />
                        </button>
                        <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500 hover:scale-110 transition duration-300">
                           <Mail size={18} />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-20 border-t border-white/5 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto text-center px-6">
           <div className="flex flex-wrap justify-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
             {['Stanford', 'MIT', 'Harvard', 'Oxford'].map(uni => (
               <span key={uni} className="text-2xl font-serif font-bold hover:text-white transition-colors cursor-default">{uni}</span>
             ))}
           </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10 space-y-8">
           <h2 className="text-4xl md:text-5xl font-bold">Ready to 10x your study efficiency?</h2>
           <p className="text-gray-400">Join thousands of students transforming their workflow today.</p>
           <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-3">
             <input type="email" placeholder="Enter your email" className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-4 focus:outline-none focus:border-primary transition text-white placeholder:text-gray-500" />
             <button onClick={onStart} className="bg-white text-black font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition shadow-[0_0_20px_rgba(255,255,255,0.2)]">Get Started</button>
           </div>
           <div className="flex items-center justify-center gap-6 text-sm text-gray-400 pt-4">
             <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> No credit card required</div>
             <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> 14-day free trial</div>
           </div>
        </div>
      </section>
      
      <footer className="py-8 border-t border-white/5 text-center text-gray-500 text-sm bg-[#0b1120]">
        © {new Date().getFullYear()} StudyVerse AI. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;