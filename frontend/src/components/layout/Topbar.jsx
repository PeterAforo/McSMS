import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Search, Bell, Mail, ChevronDown, User, Settings, LogOut, MessageSquare, Calendar, Award, FileText, X, Loader2, Mic, HelpCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';
import ThemeToggle from '../shared/ThemeToggle';
import { VoiceSearchButton } from '../shared/VoiceSearch';
import { VoiceCommandButton } from '../shared/VoiceCommands';

export default function Topbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const notificationRef = useRef(null);
  const messageRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);
  
  // Fetch notifications and messages on mount
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      fetchMessages();
    }
  }, [user?.id]);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (messageRef.current && !messageRef.current.contains(event.target)) {
        setShowMessages(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await axios.get(`${API_BASE_URL}/notifications.php?user_id=${user.id}&limit=10`);
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Use empty array - no fake data
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoadingMessages(true);
      
      // Get parent ID if user is a parent (for proper message filtering)
      let parentId = null;
      if (user?.user_type === 'parent') {
        try {
          const parentRes = await axios.get(`${API_BASE_URL}/parents.php?user_id=${user.id}`);
          const parents = parentRes.data.parents || [];
          if (parents.length > 0) {
            parentId = parents[0].id;
          }
        } catch (e) {}
      }
      
      const response = await axios.get(`${API_BASE_URL}/messages.php?user_id=${user.id}&limit=10`);
      const allMessages = response.data.messages || [];
      
      // Filter to only show received messages (inbox) in the topbar
      const userId = String(user.id);
      const parentIdStr = parentId ? String(parentId) : null;
      
      const inboxMessages = allMessages.filter(m => {
        const recipientId = String(m.recipient_id);
        return recipientId === userId || (parentIdStr && recipientId === parentIdStr);
      }).slice(0, 5);
      
      setMessages(inboxMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Fallback to empty
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const markNotificationRead = async (notificationId) => {
    console.log('Marking notification as read:', notificationId);
    try {
      const response = await axios.put(`${API_BASE_URL}/notifications.php?id=${notificationId}`, { is_read: true });
      console.log('Mark as read response:', response.data);
      // Use == for loose comparison to handle string/number mismatch
      setNotifications(prev => prev.map(n => String(n.id) === String(notificationId) ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };
  
  // Handle both boolean and string "0"/"1" values for is_read
  const isUnread = (item) => !item.is_read && item.is_read !== 1 && item.is_read !== '1';
  const unreadNotifications = notifications.filter(isUnread).length;
  const unreadMessages = messages.filter(isUnread).length;
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearching(true);
      setShowSearchResults(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/search.php?q=${encodeURIComponent(searchQuery)}&user_type=${user?.user_type}`);
        setSearchResults(response.data.results || []);
      } catch (error) {
        console.error('Search error:', error);
        // Provide some basic local search results
        setSearchResults([
          { type: 'page', title: 'Dashboard', path: `${getRolePath()}/dashboard`, icon: 'dashboard' },
          { type: 'page', title: 'Settings', path: `${getRolePath()}/settings`, icon: 'settings' },
        ].filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase())));
      } finally {
        setSearching(false);
      }
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.length >= 2) {
      // Debounced search
      const timer = setTimeout(() => handleSearch({ preventDefault: () => {} }), 300);
      return () => clearTimeout(timer);
    } else {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  };

  const navigateToResult = (result) => {
    setShowSearchResults(false);
    setSearchQuery('');
    if (result.path) {
      navigate(result.path);
    } else if (result.type === 'student') {
      navigate(`/admin/students/${result.id}`);
    } else if (result.type === 'teacher') {
      navigate(`/admin/teachers/${result.id}`);
    }
  };
  
  const getNotificationColor = (type) => {
    const colors = {
      info: 'bg-blue-100 text-blue-600',
      success: 'bg-green-100 text-green-600',
      warning: 'bg-orange-100 text-orange-600',
      error: 'bg-red-100 text-red-600'
    };
    return colors[type] || colors.info;
  };
  
  const getRolePath = () => {
    if (user?.user_type === 'admin') return '/admin';
    if (user?.user_type === 'teacher') return '/teacher';
    if (user?.user_type === 'parent') return '/parent';
    return '/admin'; // Default to admin
  };

  const hasMessagesPage = () => {
    // Only teacher and parent have messages pages
    return user?.user_type === 'teacher' || user?.user_type === 'parent';
  };

  // Format time ago
  const timeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between">
      {/* Search */}
      <div className="flex-1 max-w-xl relative" ref={searchRef}>
        <form onSubmit={handleSearch} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Search students, staff, pages..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <VoiceSearchButton onResult={(text) => {
            setSearchQuery(text);
            handleSearch({ preventDefault: () => {} });
          }} />
        </form>
        
        {/* Search Results Dropdown */}
        {showSearchResults && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
            {searching ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => navigateToResult(result)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      result.type === 'student' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                      result.type === 'teacher' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                      result.type === 'page' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{result.title || result.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{result.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                No results found for "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Voice Commands */}
        <VoiceCommandButton variant="navbar" />

        {/* Help Center */}
        <Link 
          to={`/${user?.user_type || 'admin'}/help`}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Help Center"
        >
          <HelpCircle className="w-5 h-5" />
        </Link>

        {/* Theme Toggle */}
        <ThemeToggle variant="simple" />

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {unreadNotifications}
              </span>
            )}
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{unreadNotifications} unread</p>
                </div>
                {unreadNotifications > 0 && (
                  <button 
                    onClick={() => notifications.forEach(n => !n.is_read && markNotificationRead(n.id))}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loadingNotifications ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      onClick={() => {
                        markNotificationRead(notification.id);
                        setShowNotifications(false);
                        // Navigate based on notification type/link
                        if (notification.link) {
                          navigate(notification.link);
                        } else {
                          navigate(`${getRolePath()}/notifications`);
                        }
                      }}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 cursor-pointer ${isUnread(notification) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                          <Bell className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{notification.title}</p>
                            {isUnread(notification) && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{timeAgo(notification.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                <button 
                  onClick={() => {
                    setShowNotifications(false);
                    navigate(`${getRolePath()}/notifications`);
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="relative" ref={messageRef}>
          <button 
            onClick={() => setShowMessages(!showMessages)}
            className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Mail className="w-5 h-5" />
            {unreadMessages > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {unreadMessages}
              </span>
            )}
          </button>
          
          {/* Messages Dropdown */}
          {showMessages && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Messages</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{unreadMessages} unread messages</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loadingMessages ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No messages yet</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div 
                      key={message.id} 
                      onClick={() => {
                        setShowMessages(false);
                        navigate(`${getRolePath()}/messages`);
                      }}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 cursor-pointer ${
                        isUnread(message) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-sm">
                            {(message.sender_name || message.from || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{message.sender_name || message.from}</p>
                            {isUnread(message) && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">{message.subject || message.message}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{timeAgo(message.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                <button 
                  onClick={() => {
                    setShowMessages(false);
                    navigate(`${getRolePath()}/messages`);
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  View All Messages
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.first_name && user?.last_name 
                  ? `${user.first_name} ${user.last_name}` 
                  : user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.user_type || 'User'}</p>
            </div>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                {user?.profile_picture ? (
                  <img 
                    src={user.profile_picture.startsWith('http') ? user.profile_picture : `${API_BASE_URL.replace('/backend/api', '')}${user.profile_picture}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span className={`text-white text-sm font-semibold ${user?.profile_picture ? 'hidden' : 'flex'}`}>
                  {user?.first_name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {user?.first_name && user?.last_name 
                    ? `${user.first_name} ${user.last_name}` 
                    : user?.name || 'User'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email || 'user@school.com'}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 capitalize">{user?.user_type || 'User'} Account</p>
              </div>
              
              <div className="py-2">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate(`${getRolePath()}/profile`);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                >
                  <User className="w-4 h-4" />
                  My Profile
                </button>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate(`${getRolePath()}/settings`);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate(`${getRolePath()}/messages`);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate(`${getRolePath()}/notifications`);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                >
                  <Bell className="w-4 h-4" />
                  Notifications
                </button>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
