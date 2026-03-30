import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import axios from 'axios';
import { 
  X, 
  UserPlus, 
  MessageSquare, 
  Send, 
  Search, 
  UserCheck, 
  Clock,
  ChevronLeft,
  ChevronRight,
  Circle,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SocialPanel = ({ isOpen, onClose }) => {
  const { 
    user, 
    friends, 
    chatMessages, 
    fetchFriends, 
    fetchChatHistory, 
    sendChatMessage,
    fetchNotifications,
    notifications
  } = useStore();

  const [activeTab, setActiveTab] = useState('friends');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [friendSearch, setFriendSearch] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedFriend) {
      fetchChatHistory(selectedFriend.mentor_id);
    }
  }, [selectedFriend]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, selectedFriend]);

  const handleAddFriend = async () => {
    if (!friendSearch) return;
    try {
      await axios.post(`/api/v1/social/friends/request/${friendSearch}`);
      alert('Friend request sent!');
      setFriendSearch('');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to send request');
    }
  };

  const handleRespondFriend = async (requester_id, action) => {
    try {
      await axios.post(`/api/v1/social/friends/respond/${requester_id}/${action}`);
      fetchFriends();
      fetchNotifications();
    } catch (err) {
      alert('Failed to respond');
    }
  };

  const handleSendMessage = () => {
    if (!messageInput || !selectedFriend) return;
    sendChatMessage(selectedFriend.mentor_id, messageInput);
    setMessageInput('');
  };

  const messages = selectedFriend ? (chatMessages[selectedFriend.mentor_id] || []) : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-full max-w-md bg-[#0d0d14]/90 backdrop-blur-2xl border-l border-white/10 z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Social Network</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Neural Communication Hub</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 p-2 gap-2 bg-white/2">
              <button 
                onClick={() => setActiveTab('friends')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-sm font-bold ${
                  activeTab === 'friends' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5'
                }`}
              >
                <Users size={16} /> Friends
                {notifications.pending_friends_count > 0 && (
                  <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px]">{notifications.pending_friends_count}</span>
                )}
              </button>
              <button 
                onClick={() => {
                  setActiveTab('chat');
                  if (friends.length > 0 && !selectedFriend) setSelectedFriend(friends[0]);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-sm font-bold ${
                  activeTab === 'chat' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5'
                }`}
              >
                <MessageSquare size={16} /> Chat
                {notifications.unread_messages_count > 0 && (
                  <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px]">{notifications.unread_messages_count}</span>
                )}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === 'friends' ? (
                <div className="flex-1 flex flex-col p-6 space-y-6">
                  {/* Search / Add */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search Mentor ID..." 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-24 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                      value={friendSearch}
                      onChange={(e) => setFriendSearch(e.target.value)}
                    />
                    <button 
                      onClick={handleAddFriend}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all"
                    >
                      Add
                    </button>
                  </div>

                  {/* Friends List */}
                  <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                    {friends.length === 0 && (
                      <div className="text-center py-20 opacity-30">
                        <Users size={48} className="mx-auto mb-4" />
                        <p className="text-sm font-bold">No Neural Links Established</p>
                      </div>
                    )}
                    {friends.map(friend => (
                      <motion.div 
                        whileHover={{ x: 5 }}
                        key={friend.mentor_id} 
                        onClick={() => {
                          setSelectedFriend(friend);
                          setActiveTab('chat');
                        }}
                        className="group flex items-center justify-between p-4 bg-white/2 hover:bg-white/5 border border-white/5 rounded-2xl cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">
                              {friend.mentor_id.slice(0,2).toUpperCase()}
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0d0d14] ${friend.is_online ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                          </div>
                          <span className="font-bold text-slate-200">{friend.mentor_id}</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {selectedFriend ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* Chat Header */}
                      <div className="p-4 bg-white/2 border-b border-white/5 flex items-center gap-4">
                        <button onClick={() => setActiveTab('friends')} className="p-2 hover:bg-white/5 rounded-lg text-slate-500">
                          <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                              {selectedFriend.mentor_id.slice(0,2).toUpperCase()}
                           </div>
                           <span className="font-bold text-white text-sm">{selectedFriend.mentor_id}</span>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {messages.length === 0 && (
                          <div className="text-center py-20 opacity-20 italic text-xs">Starting connection...</div>
                        )}
                        {messages.map((msg, i) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={i} 
                            className={`flex ${msg.sender_id === user ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                              msg.sender_id === user 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/5'
                            }`}>
                              {msg.message}
                              <div className="mt-1 text-[9px] opacity-50 font-bold uppercase tracking-tighter">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Input */}
                      <div className="p-6 bg-white/2 border-t border-white/5">
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Neural Transmission..." 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          />
                          <button 
                            onClick={handleSendMessage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center justify-center text-white transition-all shadow-lg shadow-blue-600/20"
                          >
                            <Send size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-center flex-col justify-center items-center opacity-30">
                       <MessageSquare size={48} className="mb-4" />
                       <p className="font-bold">Select a neural link to begin</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SocialPanel;
