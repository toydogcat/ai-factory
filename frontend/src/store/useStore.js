import axios from 'axios';
import { create } from 'zustand';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Add axios interceptor for JWT
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const useStore = create((set, get) => ({
  user: null,
  userRole: 'mentor',
  points: 0,
  token: localStorage.getItem('token') || null,
  instances: [],
  mentors: [],
  studioProjects: [],
  systemStats: { cpu_usage: 0, memory_usage: 0, disk_usage: 0 },
  tunnelUrl: null,
  loading: false,
  error: null,
  activeProject: null, // { name, url, tags }
  
  // Social State
  friends: [],
  chatMessages: {}, // { friend_id: [messages] }
  notifications: { pending_friends_count: 0, unread_messages_count: 0 },
  socket: null,
  
  login: async (mentor_id, password) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        mentor: mentor_id,
        key: password
      });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      
      // Get user info to populate points
      const meResponse = await axios.get(`${API_BASE_URL}/auth/me`);
      set({ 
        token: access_token, 
        user: meResponse.data.mentor_id,
        userRole: meResponse.data.role || 'mentor',
        points: meResponse.data.points || 0,
        loading: false 
      });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Login failed', loading: false });
      throw err;
    }
  },

  googleLogin: async (credential) => {
    set({ loading: true, error: null });
    try {
      // Backend now expects 'credential' as per standardized AI-Tarot/Kitty pattern
      const response = await axios.post(`${API_BASE_URL}/auth/google-login`, {
        credential
      });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      
      const meResponse = await axios.get(`${API_BASE_URL}/auth/me`);
      set({ 
        token: access_token, 
        user: meResponse.data.mentor_id,
        points: meResponse.data.points || 0,
        loading: false 
      });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Google login failed', loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    const { socket } = get();
    if (socket) socket.close();
    set({ token: null, user: null, userRole: 'mentor', points: 0, instances: [], socket: null, friends: [], chatMessages: {}, notifications: { pending_friends_count: 0, unread_messages_count: 0 } });
  },

  fetchUserInfo: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`);
      set({ 
        user: response.data.mentor_id, 
        userRole: response.data.role || 'mentor',
        points: response.data.points || 0 
      });
    } catch (err) {
      set({ token: null, user: null, userRole: 'mentor', points: 0 });
    }
  },

  launchProject: async (projectName) => {
    if (!projectName) {
      console.error("Project name is undefined, cannot launch.");
      set({ error: "Invalid project name" });
      return null;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/studio/launch/${projectName}`);
      // Update points after launch
      set((state) => ({ points: response.data.remaining_points }));
      return response.data.url;
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Launch failed' });
      throw err;
    }
  },

  fetchInstances: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(`${API_BASE_URL}/orchestrator/instances`);
      set({ instances: response.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchStudioProjects: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/studio/projects`);
      set({ studioProjects: response.data });
    } catch (err) {
      console.error("Failed to fetch studio projects:", err);
    }
  },

  fetchMentors: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/mentors`);
      set({ mentors: response.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },
  
  createInstance: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/orchestrator/instances`, data);
      set((state) => ({ instances: [...state.instances, response.data] }));
      return response.data;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  fetchSystemStats: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/system/stats`);
      set({ systemStats: response.data });
    } catch (err) {
      console.error("Failed to fetch system stats:", err);
    }
  },

  fetchTunnelUrl: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/system/public-tunnel`);
      set({ tunnelUrl: response.data.tunnel_url });
    } catch (err) {
      console.error("Failed to fetch tunnel URL:", err);
    }
  },

  // Social Actions
  fetchFriends: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/social/friends/list`);
      set({ friends: response.data });
    } catch (err) {
      console.error("Failed to fetch friends:", err);
    }
  },

  fetchChatHistory: async (target_id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/social/chat/history/${target_id}`);
      set((state) => ({
        chatMessages: {
          ...state.chatMessages,
          [target_id]: response.data
        }
      }));
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
    }
  },

  sendChatMessage: async (target_id, message) => {
    try {
      await axios.post(`${API_BASE_URL}/social/chat/send?receiver_id=${target_id}&message_text=${encodeURIComponent(message)}`);
      // Update local state immediately for better UX
      const msg = {
        id: Date.now(),
        sender_id: get().user,
        receiver_id: target_id,
        message: message,
        timestamp: new Date().toISOString(),
        is_read: true
      };
      set((state) => ({
        chatMessages: {
          ...state.chatMessages,
          [target_id]: [...(state.chatMessages[target_id] || []), msg]
        }
      }));
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  },

  fetchNotifications: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/social/notifications/summary`);
      set({ notifications: response.data });
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  },

  initSocket: () => {
    const { user, socket } = get();
    if (!user || socket) return;

    // Better WebSocket URL handling for Absolute vs Relative API_BASE_URL
    let wsUrl;
    if (API_BASE_URL.startsWith('http')) {
      // If absolute (Tunnels), transform protocol and keep host+path
      const base = API_BASE_URL.replace(/^http/, 'ws');
      wsUrl = `${base}/social/ws/${user}`;
    } else {
      // If relative, use current window host
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      wsUrl = `${protocol}//${host}${API_BASE_URL}/social/ws/${user}`;
    }

    console.log("Connecting to WebSocket:", wsUrl);
    const newSocket = new WebSocket(wsUrl);

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WS Message received:", data);

      if (data.type === 'chat_message') {
        const sender_id = data.sender_id;
        set((state) => ({
          chatMessages: {
            ...state.chatMessages,
            [sender_id]: [...(state.chatMessages[sender_id] || []), {
              id: Date.now(),
              sender_id: sender_id,
              receiver_id: state.user,
              message: data.message,
              timestamp: data.timestamp,
              is_read: false
            }]
          },
          notifications: {
            ...state.notifications,
            unread_messages_count: state.notifications.unread_messages_count + 1
          }
        }));
      } else if (data.type === 'friend_request' || data.type === 'friend_accepted') {
        get().fetchNotifications();
        get().fetchFriends();
      }
    };

    newSocket.onclose = () => {
      console.log("WS Closed. Retrying in 5s...");
      set({ socket: null });
      setTimeout(() => get().initSocket(), 5000);
    };

    set({ socket: newSocket });
  },

  setActiveProject: (project) => set({ activeProject: project }),
  closeProject: () => set({ activeProject: null })
}));
