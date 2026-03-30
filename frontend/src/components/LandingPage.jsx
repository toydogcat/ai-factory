import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, Sparkles, Brain, LayoutDashboard, ArrowRight, Github, Monitor } from 'lucide-react';

const LandingPage = () => {
  const fetchStudioProjects = useStore((state) => state.fetchStudioProjects);
  const studioProjects = useStore((state) => state.studioProjects);
  const user = useStore((state) => state.user);
  const token = useStore((state) => state.token);
  const points = useStore((state) => state.points);
  const launchProject = useStore((state) => state.launchProject);
  const fetchUserInfo = useStore((state) => state.fetchUserInfo);
  const setActiveProject = useStore((state) => state.setActiveProject);

  useEffect(() => {
    fetchStudioProjects();
    if (token) fetchUserInfo();
  }, [fetchStudioProjects, fetchUserInfo, token]);

  const FEATURED_PROJECT = {
    name: 'Tarot Master Class',
    description: 'Professional Tarot reading with advanced memory. Synced with Global AI-Factory account.',
    url: 'https://ai-factory-tarot.web.app/',
    is_featured: true,
    is_public: true,
    tags: ['Recommendation', 'Expert', 'Synced']
  };

  const showcaseProjects = [
    { 
      name: 'VoiceCore Lite', 
      description: 'Zero-cost browser-based transcription. Secure, fast, and entirely local.', 
      url: '/studio/ai-web-stt/', 
      is_public: true,
      tags: ['New', 'Free', 'Local'] 
    },
    { 
      name: 'Kitty-Help', 
      description: 'Specialized AI assistant for domestic automation and task management.', 
      url: 'https://kitty-help.web.app/', 
      is_public: true,
      tags: ['Private', 'Stable'] 
    },
    { 
      name: 'EOA2: Classic Heritage', 
      description: 'Relive the 1994 masterpiece "Era of Angels 2". Fully playable in-browser via JS-DOS.', 
      url: '/studio/retro-eoa2/', 
      is_public: true,
      tags: ['Retro', 'Free', 'Classic'] 
    },
    ...studioProjects
  ].filter((p, index, self) => 
    index === self.findIndex((t) => (t.name === p.name))
  );

  const RETRO_HERITAGE = [
    {
      name: "Era of Angels II (1994)",
      year: "1994",
      developer: "Softstar",
      genre: "Tactical RPG",
      description: "The definitive strategy masterpiece of the 90s. Reimagined for the web.",
      url: "/studio/retro-eoa2/",
    }
  ];

  const handleLaunch = async (project) => {
    if (project.is_public || project.is_featured) {
      setActiveProject(project);
      return;
    }

    if (!token) {
      // Redirect to login if private
      window.location.href = '/login';
      return;
    }

    // Attempt to launch and deduct points
    try {
      if (confirm(`This project costs 10 points to launch. You have ${points} points. Continue?`)) {
        const accessUrl = await launchProject(project.name);
        setActiveProject({ ...project, url: accessUrl });
      }
    } catch (err) {
      alert(err.message || 'Points deduction failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#020205] text-white selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center bg-[#020205]/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">AI-Factory</span>
        </div>
        <div className="flex items-center gap-6">
          {user && (
            <div className="hidden md:flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full">
              <Sparkles size={14} className="text-yellow-400" />
              <span className="text-xs font-bold text-yellow-500">{points} PTS</span>
            </div>
          )}
          <Link to="/dashboard" className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          {user ? (
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {user}
            </div>
          ) : (
            <Link to="/login" className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-5 py-2 rounded-full text-sm font-bold transition-all">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 md:px-12 relative">
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[60%] h-[40%] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full mb-8"
          >
            <Sparkles className="text-blue-400 w-4 h-4" />
            <span className="text-blue-400 text-sm font-bold uppercase tracking-wider">Universal Island Orchestration</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tighter leading-tight"
          >
            The Ultimate <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">AI Service Foundry</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Deploy, manage, and scale specialized AI instances globally with zero-touch routing and seamless multi-tenant orchestration.
          </motion.p>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-12 px-6 md:px-12 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
            
            <div className="flex flex-col md:flex-row items-center gap-12 relative">
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-bold uppercase mb-6 tracking-widest">
                  Neural Masterpiece
                </div>
                <h2 className="text-4xl font-black mb-4 tracking-tighter">{FEATURED_PROJECT.name}</h2>
                <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                  {FEATURED_PROJECT.description}
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <button 
                    onClick={() => handleLaunch(FEATURED_PROJECT)}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105"
                  >
                    Visit Project
                  </button>
                  <div className="flex gap-2">
                    {FEATURED_PROJECT.tags.map(tag => (
                      <span key={tag} className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-xs text-slate-400 font-medium">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/3 aspect-[4/3] bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center relative group-hover:border-purple-500/30 transition-colors">
                <Brain className="w-20 h-20 text-purple-400 opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent rounded-3xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Showcase */}
      <section className="py-20 px-6 md:px-12 bg-white/1 flex flex-col items-center">
        <div className="max-w-6xl w-full">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-3xl font-bold mb-4">Enterprise Showcase</h2>
              <p className="text-slate-500">Curated AI services ready for immediate deployment.</p>
            </div>
            <div className="text-xs uppercase tracking-[0.2em] font-black text-slate-600 border-b-2 border-slate-800 pb-1">
              AI-Studio Collections
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showcaseProjects.map((project, idx) => (
              <motion.div
                key={project.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-blue-600/20 rounded-3xl blur-xl group-hover:bg-blue-600/40 transition-all opacity-0 group-hover:opacity-100" />
                <div className="relative h-full backdrop-blur-md bg-white/5 border border-white/10 p-8 rounded-3xl hover:border-white/20 transition-all flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Sparkles className="text-white w-6 h-6" />
                    </div>
                    <div className="flex gap-2">
                       {project.tags?.map(tag => (
                         <span key={tag} className="text-[10px] font-black px-2 py-0.5 bg-white/10 rounded-full text-slate-400 uppercase tracking-tighter">{tag}</span>
                       ))}
                       {project.is_public ? (
                         <span className="text-[10px] font-black px-2 py-0.5 bg-green-900/30 text-green-400 rounded-full uppercase tracking-tighter">Public</span>
                       ) : (
                         <span className="text-[10px] font-black px-2 py-0.5 bg-purple-900/30 text-purple-400 rounded-full uppercase tracking-tighter">10 PTS</span>
                       )}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3">{project.name}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-grow">
                    {project.description || 'Highly optimized AI agent specialized for your custom domains.'}
                  </p>
                  
                  <button 
                    onClick={() => handleLaunch(project)}
                    className="flex items-center justify-between w-full group/btn text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Launch Agent
                    <ArrowRight size={18} className="transform group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      {/* Retro Heritage Section */}
      <section className="py-24 bg-gradient-to-b from-black to-[#05050a] relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-16">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-0.5 bg-orange-500" />
                <span className="text-orange-500 font-black text-[10px] uppercase tracking-[0.3em]">Nostalgia Protocol</span>
              </div>
              <h2 className="text-5xl font-black text-white tracking-tighter">Retro Heritage</h2>
            </div>
            <p className="text-slate-500 font-medium max-w-md text-right text-sm md:text-base">
              Preserving the digital artifacts of the golden age. Re-optimized for modern neural browsers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {RETRO_HERITAGE.map((game, idx) => (
              <motion.div 
                key={game.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative bg-[#0d0d14] rounded-3xl overflow-hidden border border-white/5 hover:border-orange-500/30 transition-all flex flex-col"
              >
                <div className="aspect-[4/5] bg-slate-900 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden flex-grow">
                   <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <div className="w-20 h-20 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 mb-6 group-hover:scale-110 transition-transform duration-500">
                     <Monitor size={40} />
                   </div>
                   <span className="text-orange-500 text-[10px] font-black tracking-widest uppercase mb-2">{game.year} • {game.developer}</span>
                   <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{game.name}</h3>
                   <p className="text-slate-500 text-sm leading-relaxed">{game.description}</p>
                </div>
                
                <div className="p-6 border-t border-white/5 flex items-center justify-between bg-black/40">
                   <span className="text-[10px] font-black px-2 py-0.5 bg-orange-900/30 text-orange-400 rounded-full uppercase tracking-tighter">Verified Emulator</span>
                   <button 
                     onClick={() => handleLaunch(game)}
                     className="bg-orange-500 hover:bg-orange-400 text-black px-6 py-2 rounded-xl text-xs font-black transition-all shadow-lg shadow-orange-500/20"
                   >
                     PLAY CLASSIC
                   </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/5 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-600 text-sm font-medium">
            © 2026 AI-Factory Orchestrator. Built for the future of AI.
          </p>
          <div className="flex gap-8 text-slate-500 text-sm">
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
            <a href="#" className="hover:text-white transition-colors">System Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
