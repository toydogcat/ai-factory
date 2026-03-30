import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Maximize2, RotateCcw, ChevronLeft } from 'lucide-react';
import { useStore } from '../store/useStore';

const ProjectViewer = () => {
  const activeProject = useStore((state) => state.activeProject);
  const closeProject = useStore((state) => state.closeProject);

  if (!activeProject) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[60] bg-[#020205] flex flex-col"
    >
      {/* Premium Glass Header */}
      <div className="h-16 border-b border-white/5 backdrop-blur-xl bg-[#020205]/80 flex items-center justify-between px-6 shrink-0 shadow-2xl relative z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={closeProject}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-red-500/20 group-hover:text-red-400 transition-all">
              <ChevronLeft size={20} />
            </div>
            <span className="text-sm font-bold tracking-tight">Return to Factory</span>
          </button>
          
          <div className="w-px h-6 bg-white/10 mx-2" />
          
          <div className="flex flex-col">
            <h2 className="text-sm font-black text-white leading-tight uppercase tracking-widest">{activeProject.name}</h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Live Session Secure</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.open(activeProject.url, '_blank')}
            className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-blue-600/20 hover:text-blue-400 transition-all border border-white/5"
            title="Open in New Tab"
          >
            <ExternalLink size={18} />
          </button>
          <button 
            onClick={() => document.getElementById('project-frame')?.contentWindow?.location.reload()}
            className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-purple-600/20 hover:text-purple-400 transition-all border border-white/5"
            title="Reload Instance"
          >
            <RotateCcw size={18} />
          </button>
          <div className="w-px h-6 bg-white/10 mx-2" />
          <button 
            onClick={closeProject}
            className="p-2.5 rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all border border-red-500/20"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Embedded Terminal/Iframe View */}
      <div className="flex-1 relative bg-black">
        <iframe
          id="project-frame"
          src={`${activeProject.url}${activeProject.url.includes('?') ? '&' : '?'}cache_bust=${Date.now()}`}
          className="w-full h-full border-none"
          title={activeProject.name}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
        
        {/* Subtle Overlay Glows */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#020205] to-transparent pointer-events-none opacity-50" />
      </div>
    </motion.div>
  );
};

export default ProjectViewer;
