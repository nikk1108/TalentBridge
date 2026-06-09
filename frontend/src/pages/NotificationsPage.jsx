import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Inbox, Check, CheckSquare } from 'lucide-react';
import api from '../services/api';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const updated = await api.markNotificationsAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      alert(err.message || 'Failed to update notifications');
    }
  };

  if (loading) {
    return <div className="text-xs font-mono text-[#888] animate-pulse">Checking alerts queue...</div>;
  }

  if (error) {
    return (
      <div className="p-3 bg-red-950/20 border border-red-500/20 rounded text-red-400 text-xs font-mono">
        Error: {error}
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex flex-col gap-4 max-w-4xl relative">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#2e2e2e]/50 pb-3 flex-shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-white">Notifications</h1>
          <p className="text-[11px] text-[#666]">System updates and workflow alerts</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#222] border border-[#2e2e2e] hover:bg-emerald-600/10 hover:border-emerald-500/40 hover:text-emerald-400 text-xs font-medium rounded text-[#a1a1aa] transition-all"
          >
            <CheckSquare size={13} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="p-10 text-center border border-dashed border-[#2a2a2a] rounded bg-[#161616] max-w-xl mx-auto my-6 w-full">
          <BellOff size={24} className="text-[#444] mx-auto mb-2" />
          <h3 className="text-xs font-semibold text-white mb-1">All caught up</h3>
          <p className="text-[10px] text-[#666]">No alerts in your notification queue.</p>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded overflow-hidden flex flex-col divide-y divide-[#2a2a2a]/40">
          {notifications.map((item) => (
            <div
              key={item._id}
              className={`p-4 flex gap-3.5 items-start transition-colors ${
                item.read ? 'bg-transparent' : 'bg-amber-600/5'
              }`}
            >
              <div className="mt-0.5">
                <Bell size={13} className={item.read ? 'text-[#555]' : 'text-amber-500'} />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <p className={`text-xs leading-relaxed ${item.read ? 'text-[#a1a1aa]' : 'text-white font-medium'}`}>
                  {item.text}
                </p>
                <span className="text-[9px] text-[#555] font-mono">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>
              {!item.read && (
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
