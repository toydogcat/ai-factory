import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { 
  Play, 
  Square, 
  Plus, 
  RefreshCw, 
  Settings, 
  LayoutDashboard, 
  Activity, 
  Database,
  Cpu,
  Monitor,
  ExternalLink,
  Users,
  Search,
  ChevronRight,
  LogOut,
  AppWindow,
  Briefcase,
  Bell,
  Power,
  X,
  Container,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Menu,
  Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './store/useStore';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SocialPanel from './components/SocialPanel';
import ProjectViewer from './components/ProjectViewer';

// --- Protected Route Wrapper ---
const ProtectedRoute = ({ children }) => {
  const user = useStore((state) => state.user);
  const token = useStore((state) => state.token);
  const activeProject = useStore((state) => state.activeProject);
  const setActiveProject = useStore((state) => state.setActiveProject);
  const fetchUserInfo = useStore((state) => state.fetchUserInfo);
  const fetchInstances = useStore((state) => state.fetchInstances);

  useEffect(() => {
    if (token && !user) {
      fetchUserInfo();
    }
  }, [token, user, fetchUserInfo]);

  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// --- Main App Entry ---
const App = () => {
  const activeProject = useStore((state) => state.activeProject);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AnimatePresence>
        {activeProject && <ProjectViewer />}
      </AnimatePresence>
    </BrowserRouter>
  );
};

// --- Dashboard Layout ---
const DashboardLayout = () => {
  const { 
    user, userRole, points, token, logout, 
    fetchInstances, instances, mentors, fetchMentors, 
    fetchStudioProjects, studioProjects,
    fetchSystemStats, systemStats,
    fetchTunnelUrl, tunnelUrl,
    initSocket, notifications, fetchNotifications,
    createInstance, loading, setActiveProject
  } = useStore();

  const [activeTab, setActiveTab] = useState('instances');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (token) {
      fetchInstances();
      fetchMentors();
      fetchStudioProjects();
      fetchSystemStats();
      fetchTunnelUrl();
      initSocket();
      fetchNotifications();
    }
    const interval = setInterval(() => {
      fetchInstances();
      fetchSystemStats();
      fetchTunnelUrl();
    }, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'instances', label: 'AI Instances', icon: Container, adminOnly: true },
    { id: 'studio', label: 'AI-Studio', icon: Briefcase },
    { id: 'users', label: 'Mentors & Roles', icon: Users },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ].filter(item => !item.adminOnly || userRole === 'admin');

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200 flex font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`
        fixed md:sticky top-0 h-screen w-72 bg-[#0d0d14]/80 backdrop-blur-xl border-r border-white/5 
        flex flex-col z-50 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white leading-none">AI-Factory</h1>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Control v1.0</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group ${
                activeTab === item.id 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-blue-400' : 'group-hover:text-slate-300'} />
              <span className="font-semibold text-sm">{item.label}</span>
              {activeTab === item.id && (
                <motion.div layoutId="active" className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 flex items-center justify-center text-[10px] font-black uppercase shadow-lg shadow-pink-500/20">
                {user?.mentor_id?.slice(0, 2) || 'AD'}
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-white truncate">{user || 'Administrator'}</p>
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-md border border-blue-500/20 font-black">{points} P</span>
                </div>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">{userRole || 'System'}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-colors"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 md:p-12">
        <header className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white"
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h2>
              <p className="text-slate-500 font-medium text-sm md:text-base">Monitoring and orchestrating your digital foundry.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {tunnelUrl && (
               <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-2 animate-pulse transition-all">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Tunnel Active</span>
               </div>
             )}
            <button 
              onClick={() => setIsSocialOpen(true)}
              className="bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-white/10 transition-colors relative group"
              title="Social & Notifications"
            >
              <Bell size={20} className="text-slate-400 group-hover:text-white transition-colors" />
              {(notifications.pending_friends_count + notifications.unread_messages_count) > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-blue-600 rounded-full border-2 border-[#0a0a0f] text-[10px] font-black flex items-center justify-center text-white px-1">
                  {notifications.pending_friends_count + notifications.unread_messages_count}
                </div>
              )}
            </button>
          </div>
        </header>

        <div className="space-y-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Total Instances" value={instances.length} change="+2 Today" green />
              <StatCard label="CPU Usage" value={`${systemStats.cpu_usage}%`} change="Steady" />
              <StatCard label="Memory" value={`${systemStats.memory_usage}%`} change="Optimal" />
              <StatCard label="Disk Cap" value={`${systemStats.disk_usage}%`} change="Clean" green />
            </div>
          )}

          {activeTab === 'instances' && (
            <InstanceList 
              instances={instances} 
              loading={loading} 
              tunnelUrl={tunnelUrl} 
              onNew={() => setIsModalOpen(true)} 
            />
          )}

          {activeTab === 'studio' && (
             <section className="glass-card p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">AI-Studio Projects</h3>
                    <p className="text-slate-500">Scaned from /github/ai-studio. These are your refined productions.</p>
                  </div>
                  <button onClick={fetchStudioProjects} className="p-2 hover:rotate-180 transition-transform duration-500 text-slate-500 hover:text-white">
                    <RefreshCw size={24} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {studioProjects.length === 0 ? (
                      <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                         <p className="text-slate-500 font-medium">No verified projects found in ai-studio directory.</p>
                      </div>
                   ) : (
                     studioProjects.map(project => (
                        <div key={project.name} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400">
                                 <AppWindow size={24} />
                              </div>
                              <div>
                                 <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{project.name}</h4>
                                 <p className="text-xs text-slate-500 mt-0.5">{project.url}</p>
                              </div>
                           </div>
                            <button 
                               onClick={() => setActiveProject(project)}
                               className="bg-white/10 hover:bg-white text-white hover:text-black p-2 rounded-lg transition-all"
                            >
                               <ExternalLink size={18} />
                            </button>
                        </div>
                     ))
                   )}
                </div>
             </section>
          )}

          {activeTab === 'users' && (
            <MentorsTable mentors={mentors} instances={instances} />
          )}

          {activeTab === 'settings' && (
            <SettingsPanel points={points} user={user} />
          )}
        </div>
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <NewInstanceModal 
            onClose={() => setIsModalOpen(false)} 
            onSubmit={async (data) => {
              try {
                await createInstance(data);
                setIsModalOpen(false);
              } catch (e) {
                // Error handled in store
              }
            }} 
          />
        )}
      </AnimatePresence>
      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsPanel points={points} user={user} />
      )}

      <SocialPanel 
        isOpen={isSocialOpen} 
        onClose={() => setIsSocialOpen(false)} 
      />
    </div>
  );
};

// --- Helper Components ---

const StatCard = ({ label, value, change, green = false }) => (
  <motion.div whileHover={{ y: -5 }} className="glass-card p-6 border border-white/5 hover:border-white/10 transition-all">
    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">{label}</p>
    <div className="flex items-end justify-between gap-4">
      <h4 className="text-4xl font-extrabold text-white tracking-tighter">{value}</h4>
      <div className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${
        green ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-white/5'
      }`}>
        {change}
      </div>
    </div>
  </motion.div>
);

const InstanceList = ({ instances, loading, tunnelUrl, onNew }) => (
  <section className="glass-card overflow-hidden">
    <div className="p-8 border-b border-white/5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-2 h-10 bg-blue-600 rounded-full" />
        <h3 className="text-2xl font-bold text-white">Live AI Runtime</h3>
      </div>
      <button 
        onClick={onNew} 
        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2 group"
      >
        <Plus size={18} className="group-hover:rotate-90 transition-transform" /> 
        Spawn New Instance
      </button>
    </div>
    
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-white/2">
          <tr className="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em]">
            <th className="px-8 py-4 font-black">Identity</th>
            <th className="px-8 py-4 font-black">Cluster Role</th>
            <th className="px-8 py-4 font-black">Status</th>
            <th className="px-8 py-4 font-black text-right">Access Point</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {instances.length === 0 && !loading && (
            <tr><td colSpan="4" className="py-20 text-center text-slate-600 font-medium">No active neural nodes detected.</td></tr>
          )}
          {instances.map((inst) => (
            <tr key={inst.name} className="hover:bg-white/[0.02] transition-colors group">
              <td className="px-8 py-6">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                      <Cpu size={18} />
                   </div>
                   <span className="font-bold text-white uppercase tracking-tight">{inst.name}</span>
                </div>
              </td>
              <td className="px-8 py-6">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{inst.image}</span>
              </td>
              <td className="px-8 py-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">{inst.status}</span>
                </div>
              </td>
              <td className="px-8 py-6 text-right">
                <a 
                  href={tunnelUrl ? `${tunnelUrl}/${inst.name}/` : `http://${inst.name}.localhost`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest group/link"
                >
                  Gateway Entry <ExternalLink size={14} className="group-hover/link:translate-x-1 transition-transform" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const MentorsTable = ({ mentors, instances }) => (
  <section className="glass-card">
    <div className="p-8 border-b border-white/5">
      <h3 className="text-2xl font-bold text-white">Active Mentors & Permissions</h3>
      <p className="text-slate-500 text-sm mt-1">Manage platform access and monitor occupancy.</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-white/2">
          <tr className="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em]">
            <th className="px-8 py-4 font-black">Mentor</th>
            <th className="px-8 py-4 font-black">Role</th>
            <th className="px-8 py-4 font-black">Points</th>
            <th className="px-8 py-4 font-black">Active Rooms</th>
            <th className="px-8 py-4 font-black text-right">Occupancy</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {mentors.map((m) => {
            const activeInstances = instances.filter(i => i.name.includes(m.mentor_id) || m.mentor_id === 'admin');
            return (
              <tr key={m.mentor_id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs">
                      {m.mentor_id.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white">{m.mentor_id}</p>
                      <p className="text-[10px] text-slate-500">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                    m.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {m.role || 'mentor'}
                  </span>
                </td>
                <td className="px-8 py-6 font-mono text-xs text-blue-400 font-bold">
                  {m.points || 0} P
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-wrap gap-2">
                    {activeInstances.length > 0 ? activeInstances.map(inst => (
                      <span key={inst.id} className="text-[10px] bg-white/5 px-2 py-1 rounded border border-white/5 text-slate-300">
                        {inst.image.includes('tarot') ? '🔮 Tarot' : '🤖 AI'}: {inst.name}
                      </span>
                    )) : <span className="text-[10px] text-slate-600 italic">None</span>}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                   <div className="inline-flex items-center gap-2">
                      <span className="text-xl font-bold text-white">{activeInstances.length > 0 ? Math.floor(Math.random() * 5) + 1 : 0}</span>
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Logged In</span>
                   </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </section>
);

const SettingsPanel = ({ points, user }) => (
  <section className="glass-card p-10 max-w-2xl mx-auto">
     <div className="text-center mb-10">
        <h3 className="text-3xl font-black text-white mb-2">System Settings</h3>
        <p className="text-slate-500 uppercase tracking-[0.2em] text-[10px] font-black">Configure your neural interface</p>
     </div>
     
     <div className="space-y-8">
        <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
           <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-white">Interface Typography</h4>
              <span className="text-blue-400 text-xs font-black">14 PX</span>
           </div>
           <input type="range" className="w-full accent-blue-600" />
        </div>

        <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
           <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-white">Neural Credits</h4>
              <div className="flex items-center gap-2">
                 <span className="text-xl font-black text-white">{points}</span>
                 <span className="text-[10px] text-blue-400 font-black uppercase">Available</span>
              </div>
           </div>
           <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full w-2/3 shadow-[0_0_20px_rgba(37,99,235,0.5)]"></div>
           </div>
        </div>

        <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-3xl flex items-center gap-4">
           <AlertCircle className="text-blue-400" />
           <p className="text-xs text-blue-400 font-medium">Settings are automatically synchronized with the central identity pool at 192.168.0.150.</p>
        </div>
     </div>
  </section>
);

export default App;
