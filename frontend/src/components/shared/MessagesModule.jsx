import { useState, useEffect } from 'react';
import { 
  MessageSquare, Send, Inbox, Mail, Search, Plus, X, Star, Trash2,
  Loader2, RefreshCw, Reply, Forward, CheckCheck, Check, Clock,
  User, ChevronDown, MoreVertical
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function MessagesModule({ userType = 'parent' }) {
  const { user } = useAuthStore();
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, sent, starred
  const [recipients, setRecipients] = useState([]);
  const [sending, setSending] = useState(false);
  const [parentId, setParentId] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);

  const [composeData, setComposeData] = useState({
    recipient_id: '',
    recipient_type: userType === 'parent' ? 'teacher' : 'parent',
    subject: '',
    message: ''
  });

  const [replyData, setReplyData] = useState({
    message: ''
  });

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get parent ID if user is a parent
      let pId = null;
      if (user?.user_type === 'parent') {
        try {
          const parentRes = await axios.get(`${API_BASE_URL}/parents.php?user_id=${user.id}`);
          const parents = parentRes.data.parents || [];
          if (parents.length > 0) {
            pId = parents[0].id;
            setParentId(pId);
          }
        } catch (e) {}
      }

      // Fetch messages
      const response = await axios.get(`${API_BASE_URL}/messages.php?user_id=${user?.id}&limit=100`);
      const allMessages = response.data.messages || [];
      
      // Group messages into threads by subject and participants
      const threadMap = new Map();
      const userId = String(user?.id);
      const parentIdStr = pId ? String(pId) : null;
      
      allMessages.forEach(msg => {
        // Determine if this message involves the current user
        const senderId = String(msg.sender_id);
        const recipientId = String(msg.recipient_id);
        const isInvolved = senderId === userId || recipientId === userId || 
                          (parentIdStr && (senderId === parentIdStr || recipientId === parentIdStr));
        
        if (!isInvolved) return;
        
        // Create thread key based on participants and base subject
        const baseSubject = msg.subject?.replace(/^Re:\s*/i, '').trim() || 'No Subject';
        const participants = [msg.sender_id, msg.recipient_id].sort().join('-');
        const threadKey = `${participants}-${baseSubject}`;
        
        if (!threadMap.has(threadKey)) {
          threadMap.set(threadKey, {
            id: threadKey,
            subject: baseSubject,
            participants: [
              { id: msg.sender_id, name: msg.sender_name, type: msg.sender_type },
              { id: msg.recipient_id, name: msg.recipient_name, type: msg.recipient_type }
            ],
            messages: [],
            lastMessage: null,
            unreadCount: 0,
            starred: false
          });
        }
        
        const thread = threadMap.get(threadKey);
        const isSent = senderId === userId || (parentIdStr && senderId === parentIdStr);
        
        thread.messages.push({
          ...msg,
          isSent,
          status: msg.is_read ? 'read' : (isSent ? 'delivered' : 'unread')
        });
        
        if (!msg.is_read && !isSent) {
          thread.unreadCount++;
        }
        
        if (msg.starred) {
          thread.starred = true;
        }
      });
      
      // Sort messages within each thread and set last message
      const threadsArray = Array.from(threadMap.values()).map(thread => {
        thread.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        thread.lastMessage = thread.messages[thread.messages.length - 1];
        return thread;
      });
      
      // Sort threads by last message date
      threadsArray.sort((a, b) => 
        new Date(b.lastMessage?.created_at || 0) - new Date(a.lastMessage?.created_at || 0)
      );
      
      setThreads(threadsArray);
      
      // Fetch recipients
      await fetchRecipients();
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipients = async () => {
    try {
      if (userType === 'parent') {
        // Parents can message teachers and admin
        const response = await axios.get(`${API_BASE_URL}/messages.php?action=get_recipients&user_type=parent`);
        setRecipients(response.data.recipients || []);
      } else if (userType === 'teacher') {
        // Teachers can message parents and admin
        // Get parents from students in teacher's classes
        const teacherRes = await axios.get(`${API_BASE_URL}/teachers.php?user_id=${user?.id}`);
        const teachers = teacherRes.data.teachers || [];
        
        if (teachers.length > 0) {
          const classesRes = await axios.get(`${API_BASE_URL}/classes.php?teacher_id=${teachers[0].id}`);
          const classes = classesRes.data.classes || [];
          
          // Get parent users
          const parentsRes = await axios.get(`${API_BASE_URL}/parents.php`);
          const parentUsers = parentsRes.data.parents || [];
          
          // Get students and match to parents
          const recipientsList = [];
          for (const cls of classes) {
            try {
              const studentsRes = await axios.get(`${API_BASE_URL}/students.php?class_id=${cls.id}`);
              const students = studentsRes.data.students || [];
              
              students.forEach(s => {
                if (s.guardian_name) {
                  const matchedParent = parentUsers.find(p => 
                    (s.guardian_email && p.email === s.guardian_email) ||
                    (s.guardian_phone && p.phone === s.guardian_phone)
                  );
                  
                  if (matchedParent && !recipientsList.find(r => r.id === matchedParent.id)) {
                    recipientsList.push({
                      id: matchedParent.id,
                      name: s.guardian_name,
                      type: 'parent',
                      student: `${s.first_name} ${s.last_name}`,
                      class_name: cls.class_name
                    });
                  }
                }
              });
            } catch (e) {}
          }
          
          // Add admin users
          try {
            const adminRes = await axios.get(`${API_BASE_URL}/messages.php?action=get_recipients&user_type=teacher`);
            const admins = (adminRes.data.recipients || []).filter(r => r.type === 'admin');
            recipientsList.push(...admins);
          } catch (e) {}
          
          setRecipients(recipientsList);
        }
      } else {
        // Admin can message everyone
        const response = await axios.get(`${API_BASE_URL}/messages.php?action=get_recipients&user_type=admin`);
        setRecipients(response.data.recipients || []);
      }
    } catch (error) {
      console.error('Error fetching recipients:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const selectThread = async (thread) => {
    setSelectedThread(thread);
    
    // Mark unread messages as read
    for (const msg of thread.messages) {
      if (!msg.is_read && !msg.isSent) {
        try {
          await axios.put(`${API_BASE_URL}/messages.php?id=${msg.id}`, { is_read: true });
        } catch (e) {}
      }
    }
    
    // Update local state
    setThreads(prev => prev.map(t => 
      t.id === thread.id ? { ...t, unreadCount: 0, messages: t.messages.map(m => ({ ...m, is_read: true })) } : t
    ));
  };

  const sendMessage = async (isReply = false) => {
    const data = isReply ? replyData : composeData;
    
    if (!isReply && (!composeData.recipient_id || !composeData.subject || !composeData.message)) {
      alert('Please fill in all fields');
      return;
    }
    
    if (isReply && !replyData.message) {
      alert('Please enter a message');
      return;
    }

    try {
      setSending(true);
      
      let recipientId, recipientType, subject;
      
      if (isReply && selectedThread) {
        // Find the other participant
        const otherParticipant = selectedThread.participants.find(p => 
          String(p.id) !== String(user?.id) && String(p.id) !== String(parentId)
        );
        recipientId = otherParticipant?.id;
        recipientType = otherParticipant?.type || 'parent';
        subject = `Re: ${selectedThread.subject}`;
      } else {
        recipientId = composeData.recipient_id;
        recipientType = composeData.recipient_type;
        subject = composeData.subject;
      }
      
      const response = await axios.post(`${API_BASE_URL}/messages.php`, {
        sender_id: user?.id,
        sender_type: userType,
        recipient_id: recipientId,
        recipient_type: recipientType,
        subject: subject,
        message: isReply ? replyData.message : composeData.message
      });
      
      if (response.data.success) {
        if (isReply) {
          setReplyData({ message: '' });
        } else {
          setShowCompose(false);
          setComposeData({ recipient_id: '', recipient_type: userType === 'parent' ? 'teacher' : 'parent', subject: '', message: '' });
        }
        await fetchData();
        
        // Re-select the thread if replying
        if (isReply && selectedThread) {
          const updatedThread = threads.find(t => t.id === selectedThread.id);
          if (updatedThread) {
            setSelectedThread(updatedThread);
          }
        }
      } else {
        alert('Failed to send message: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const toggleStar = async (threadId, e) => {
    e.stopPropagation();
    setThreads(prev => prev.map(t => 
      t.id === threadId ? { ...t, starred: !t.starred } : t
    ));
  };

  const deleteThread = async (threadId) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      for (const msg of thread.messages) {
        try {
          await axios.delete(`${API_BASE_URL}/messages.php?id=${msg.id}`);
        } catch (e) {}
      }
    }
    
    setThreads(prev => prev.filter(t => t.id !== threadId));
    if (selectedThread?.id === threadId) {
      setSelectedThread(null);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatFullDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true 
    });
  };

  const getMessageStatus = (msg) => {
    if (!msg.isSent) return null;
    if (msg.is_read) return { icon: CheckCheck, color: 'text-blue-500', label: 'Read' };
    return { icon: Check, color: 'text-gray-400', label: 'Delivered' };
  };

  const filteredThreads = threads.filter(thread => {
    // Apply search filter
    const matchesSearch = !searchQuery || 
      thread.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.participants.some(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      thread.messages.some(m => m.message?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Apply tab filter
    if (filter === 'unread') return matchesSearch && thread.unreadCount > 0;
    if (filter === 'sent') return matchesSearch && thread.lastMessage?.isSent;
    if (filter === 'starred') return matchesSearch && thread.starred;
    return matchesSearch;
  });

  const stats = {
    total: threads.length,
    unread: threads.reduce((sum, t) => sum + t.unreadCount, 0),
    sent: threads.filter(t => t.lastMessage?.isSent).length,
    starred: threads.filter(t => t.starred).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="w-7 h-7" />
            Messages
          </h1>
          <p className="text-gray-600 mt-1">Communicate with parents and staff</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn bg-white border border-gray-300 hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCompose(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Compose
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setFilter('all')}
          className={`card p-4 cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Inbox className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>
        
        <div 
          onClick={() => setFilter('unread')}
          className={`card p-4 cursor-pointer transition-all ${filter === 'unread' ? 'ring-2 ring-green-500' : 'hover:shadow-md'}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.unread}</p>
              <p className="text-sm text-gray-500">Unread</p>
            </div>
          </div>
        </div>
        
        <div 
          onClick={() => setFilter('sent')}
          className={`card p-4 cursor-pointer transition-all ${filter === 'sent' ? 'ring-2 ring-purple-500' : 'hover:shadow-md'}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Send className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.sent}</p>
              <p className="text-sm text-gray-500">Sent</p>
            </div>
          </div>
        </div>
        
        <div 
          onClick={() => setFilter('starred')}
          className={`card p-4 cursor-pointer transition-all ${filter === 'starred' ? 'ring-2 ring-yellow-500' : 'hover:shadow-md'}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.starred}</p>
              <p className="text-sm text-gray-500">Starred</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="card overflow-hidden">
        {/* Search and Filters */}
        <div className="p-4 border-b flex items-center justify-between flex-wrap gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            {['all', 'unread', 'sent', 'starred'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === f 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : f === 'sent' ? 'Sent' : '★'}
              </button>
            ))}
            <button
              onClick={() => setBulkMode(!bulkMode)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                bulkMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Select
            </button>
          </div>
        </div>

        {/* Messages Layout */}
        <div className="flex" style={{ minHeight: '500px' }}>
          {/* Thread List */}
          <div className={`${selectedThread ? 'w-2/5 border-r' : 'w-full'} overflow-y-auto`} style={{ maxHeight: '600px' }}>
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                <p className="text-gray-500 mt-2">Loading messages...</p>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-12 text-center">
                <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No messages</h3>
                <p className="text-gray-500 mt-1">
                  {filter === 'all' ? 'Start a conversation by clicking Compose' : `No ${filter} messages`}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredThreads.map((thread) => {
                  const isSelected = selectedThread?.id === thread.id;
                  const lastMsg = thread.lastMessage;
                  const otherParticipant = thread.participants.find(p => 
                    String(p.id) !== String(user?.id) && String(p.id) !== String(parentId)
                  );
                  
                  return (
                    <div
                      key={thread.id}
                      onClick={() => selectThread(thread)}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : 
                        thread.unreadCount > 0 ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {bulkMode && (
                          <input
                            type="checkbox"
                            checked={selectedMessages.includes(thread.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelectedMessages(prev => 
                                prev.includes(thread.id) 
                                  ? prev.filter(id => id !== thread.id)
                                  : [...prev, thread.id]
                              );
                            }}
                            className="mt-1"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`font-medium truncate ${thread.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                              {lastMsg?.isSent ? `To: ${otherParticipant?.name || 'Unknown'}` : otherParticipant?.name || 'Unknown'}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{formatDateTime(lastMsg?.created_at)}</span>
                              <button
                                onClick={(e) => toggleStar(thread.id, e)}
                                className={`p-1 rounded hover:bg-gray-200 ${thread.starred ? 'text-yellow-500' : 'text-gray-300'}`}
                              >
                                <Star className="w-4 h-4" fill={thread.starred ? 'currentColor' : 'none'} />
                              </button>
                            </div>
                          </div>
                          <p className={`text-sm mb-1 truncate ${thread.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {thread.subject}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{lastMsg?.message}</p>
                        </div>
                        {thread.unreadCount > 0 && (
                          <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Message Detail / Thread View */}
          {selectedThread && (
            <div className="w-3/5 flex flex-col">
              {/* Thread Header */}
              <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{selectedThread.subject}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      From: {selectedThread.participants.find(p => 
                        String(p.id) !== String(user?.id) && String(p.id) !== String(parentId)
                      )?.name || 'Unknown'}
                      <span className="text-gray-300">•</span>
                      {formatFullDateTime(selectedThread.lastMessage?.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleStar(selectedThread.id, e)}
                      className={`p-2 rounded-lg hover:bg-gray-100 ${selectedThread.starred ? 'text-yellow-500' : 'text-gray-400'}`}
                    >
                      <Star className="w-5 h-5" fill={selectedThread.starred ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => deleteThread(selectedThread.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages in Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" style={{ maxHeight: '350px' }}>
                {selectedThread.messages.map((msg, index) => {
                  const status = getMessageStatus(msg);
                  
                  return (
                    <div
                      key={msg.id || index}
                      className={`flex ${msg.isSent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] ${msg.isSent ? 'order-2' : ''}`}>
                        <div className={`rounded-lg p-4 ${
                          msg.isSent 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white border shadow-sm'
                        }`}>
                          <p className={`text-sm ${msg.isSent ? 'text-white' : 'text-gray-800'}`}>
                            {msg.message}
                          </p>
                        </div>
                        <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${msg.isSent ? 'justify-end' : ''}`}>
                          <span>{formatFullDateTime(msg.created_at)}</span>
                          {status && (
                            <span className={`flex items-center gap-1 ${status.color}`}>
                              <status.icon className="w-3 h-3" />
                              {status.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <div className="p-4 border-t bg-white">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const otherParticipant = selectedThread.participants.find(p => 
                        String(p.id) !== String(user?.id) && String(p.id) !== String(parentId)
                      );
                      setComposeData({
                        recipient_id: otherParticipant?.id || '',
                        recipient_type: otherParticipant?.type || 'parent',
                        subject: `Re: ${selectedThread.subject}`,
                        message: ''
                      });
                      setShowCompose(true);
                    }}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <Reply className="w-4 h-4" />
                    Reply
                  </button>
                  <button className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2">
                    <Forward className="w-4 h-4" />
                    Forward
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                {composeData.subject.startsWith('Re:') ? 'Reply to Message' : 'New Message'}
              </h3>
              <button onClick={() => setShowCompose(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                <select
                  value={composeData.recipient_id}
                  onChange={(e) => {
                    const recipient = recipients.find(r => r.id == e.target.value);
                    setComposeData({ 
                      ...composeData, 
                      recipient_id: e.target.value,
                      recipient_type: recipient?.type || 'parent'
                    });
                  }}
                  className="input"
                  disabled={composeData.subject.startsWith('Re:')}
                >
                  <option value="">Select recipient</option>
                  {recipients.map((r, index) => (
                    <option key={`${r.type}-${r.id}-${index}`} value={r.id}>
                      {r.name} ({r.type}){r.student ? ` - Parent of ${r.student}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  className="input"
                  placeholder="Enter subject"
                  disabled={composeData.subject.startsWith('Re:')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={composeData.message}
                  onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
                  className="input"
                  rows="6"
                  placeholder="Type your message..."
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowCompose(false)}
                className="btn bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => sendMessage(false)}
                disabled={sending}
                className="btn btn-primary flex items-center gap-2"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
