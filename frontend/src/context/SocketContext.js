// src/context/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getUnreadCount, getNotifications } from '../services/api';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Play pleasant chime using Web Audio API
  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const audioCtx = new AudioContext();
      
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc1.type = 'sine';
      osc2.type = 'sine';
      
      // Pleasant chords: G5 and B5
      osc1.frequency.setValueAtTime(783.99, audioCtx.currentTime); // G5
      osc2.frequency.setValueAtTime(987.77, audioCtx.currentTime); // B5
      
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc1.start();
      osc2.start();
      
      osc1.stop(audioCtx.currentTime + 0.5);
      osc2.stop(audioCtx.currentTime + 0.5);
    } catch (err) {
      console.warn('Web Audio chime playback failed:', err);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const res = await getUnreadCount();
      if (res.data?.success) {
        setUnreadCount(res.data.count);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const fetchNotifications = async (sentMode = false) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getNotifications(sentMode ? { sent: true } : {});
      if (res.data?.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Connect to backend server
    const socketUrl = process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    setSocket(newSocket);

    // Handshake
    newSocket.emit('join', user.id);

    // Initial API counts
    fetchUnreadCount();
    fetchNotifications();

    // Listen for new notifications
    newSocket.on('notification', (data) => {
      // Trigger count update
      setUnreadCount((prev) => prev + 1);
      
      // Append to the list in real-time
      setNotifications((prev) => [data, ...prev]);

      // Sound and visual toast
      playChime();
      toast((t) => (
        <div className="flex flex-col gap-1 cursor-pointer" onClick={() => toast.dismiss(t.id)}>
          <div className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
            {data.title}
          </div>
          <div className="text-xs text-slate-500 line-clamp-2 pl-3.5">{data.message}</div>
          <span className="text-[10px] text-slate-400 pl-3.5 uppercase font-medium mt-1">
            From {data.senderName} ({data.senderRole.replace('_', ' ')})
          </span>
        </div>
      ), {
        duration: 5000,
        position: 'bottom-right',
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        unreadCount,
        setUnreadCount,
        notifications,
        setNotifications,
        loading,
        fetchUnreadCount,
        fetchNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
