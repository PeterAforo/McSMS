import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Check, CheckCheck, Trash2, ArrowLeft, Filter, 
  Loader2, AlertCircle, Info, CheckCircle, AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, [user?.id]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/notifications.php?user_id=${user?.id}&limit=100`);
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/notifications.php?id=${id}`, { is_read: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_BASE_URL}/notifications.php?user_id=${user?.id}&action=mark_all_read`);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/notifications.php?id=${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map(id => 
        axios.delete(`${API_BASE_URL}/notifications.php?id=${id}`)
      ));
      setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
      setSelectedIds([]);
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id));
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'success': return 'bg-green-100';
      case 'warning': return 'bg-orange-100';
      case 'error': return 'bg-red-100';
      default: return 'bg-blue-100';
    }
  };

  const timeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const getRolePath = () => {
    if (user?.user_type === 'admin') return '/admin';
    if (user?.user_type === 'teacher') return '/teacher';
    if (user?.user_type === 'parent') return '/parent';
    return '/admin';
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`${getRolePath()}/dashboard`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-6 h-6" />
              Notifications
            </h1>
            <p className="text-gray-600">{unreadCount} unread notifications</p>
          </div>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
          )}
          {selectedIds.length > 0 && (
            <button
              onClick={deleteSelected}
              className="btn bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex gap-2">
            {['all', 'unread', 'read'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'unread' && unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0}
                onChange={selectAll}
                className="rounded"
              />
              Select All
            </label>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-500 mt-2">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
            <p className="text-gray-500 mt-1">
              {filter === 'unread' ? 'You have no unread notifications' : 
               filter === 'read' ? 'You have no read notifications' : 
               'You have no notifications yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(notification.id)}
                    onChange={() => toggleSelect(notification.id)}
                    className="mt-1 rounded"
                  />
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconBg(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{notification.title}</h4>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{timeAgo(notification.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
