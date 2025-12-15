import { useState, useEffect } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Users, 
  Calendar, Clock, Plus, Settings, Monitor, MessageSquare,
  Link, Copy, ExternalLink, Play, Pause, Square, 
  ChevronRight, Search, Filter, MoreVertical, Trash2,
  Edit, Eye, Download, RefreshCw, CheckCircle, XCircle
} from 'lucide-react';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

const API = `${API_BASE_URL}/video_conferencing.php`;

export default function VideoConferencing() {
  const [activeTab, setActiveTab] = useState('meetings');
  const [meetings, setMeetings] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class_id: '',
    subject_id: '',
    platform: 'jitsi',
    start_time: '',
    duration_minutes: 60,
    waiting_room: true,
    record_meeting: false
  });

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    fetchMeetings();
    fetchClassrooms();
    fetchAnalytics();
    fetchClasses();
    fetchSubjects();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}?action=meetings`);
      setMeetings(response.data.meetings || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassrooms = async () => {
    try {
      const response = await axios.get(`${API}?action=classrooms`);
      setClassrooms(response.data.classrooms || []);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    }
  };

  const fetchRecordings = async () => {
    try {
      const response = await axios.get(`${API}?action=recordings`);
      setRecordings(response.data.recordings || []);
    } catch (error) {
      console.error('Error fetching recordings:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}?action=analytics&period=30`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/classes.php`);
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/subjects.php`);
      setSubjects(response.data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleCreateMeeting = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}?action=create_meeting`, {
        ...formData,
        host_id: 1, // Would come from auth
        host_type: 'teacher'
      });
      
      if (response.data.success) {
        alert(`Meeting created!\nURL: ${response.data.meeting_url}\nPassword: ${response.data.password}`);
        setShowCreateModal(false);
        fetchMeetings();
        setFormData({
          title: '',
          description: '',
          class_id: '',
          subject_id: '',
          platform: 'jitsi',
          start_time: '',
          duration_minutes: 60,
          waiting_room: true,
          record_meeting: false
        });
      }
    } catch (error) {
      alert('Error creating meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = (meeting) => {
    window.open(meeting.meeting_url, '_blank');
  };

  const handleEndMeeting = async (meetingId) => {
    if (!confirm('Are you sure you want to end this meeting?')) return;
    
    try {
      await axios.post(`${API}?action=end_meeting`, { meeting_id: meetingId });
      fetchMeetings();
    } catch (error) {
      alert('Error ending meeting');
    }
  };

  const handleCancelMeeting = async (meetingId) => {
    if (!confirm('Are you sure you want to cancel this meeting?')) return;
    
    try {
      await axios.delete(`${API}?action=meetings&id=${meetingId}`);
      fetchMeetings();
    } catch (error) {
      alert('Error cancelling meeting');
    }
  };

  const copyMeetingLink = (url) => {
    navigator.clipboard.writeText(url);
    alert('Meeting link copied to clipboard!');
  };

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      live: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 animate-pulse',
      ended: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
      cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };
    return styles[status] || styles.scheduled;
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'zoom': return '🎥';
      case 'google_meet': return '📹';
      case 'jitsi': return '🖥️';
      default: return '📺';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Video Conferencing</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage virtual classes and meetings</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            New Meeting
          </button>
        </div>
      </div>

      {/* Stats */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Video className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.summary?.total_meetings || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Meetings</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.summary?.completed_meetings || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.participation?.unique_participants || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Participants</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(analytics.summary?.avg_duration || 0)} min
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg Duration</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
        {['meetings', 'classrooms', 'recordings'].map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab === 'recordings') fetchRecordings();
            }}
            className={`px-4 py-2 font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'meetings' && (
        <div className="space-y-4">
          {/* Live Meetings */}
          {meetings.filter(m => m.status === 'live').length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Live Now
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meetings.filter(m => m.status === 'live').map(meeting => (
                  <div key={meeting.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{meeting.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {meeting.class_name} • {meeting.host_name}
                        </p>
                      </div>
                      <span className="text-2xl">{getPlatformIcon(meeting.platform)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleJoinMeeting(meeting)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Video className="w-4 h-4" />
                        Join
                      </button>
                      <button
                        onClick={() => handleEndMeeting(meeting.id)}
                        className="px-3 py-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200"
                      >
                        <PhoneOff className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Meetings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">All Meetings</h3>
              <button onClick={fetchMeetings} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Meeting</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Class</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Platform</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date & Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {meetings.map(meeting => (
                    <tr key={meeting.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{meeting.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{meeting.host_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {meeting.class_name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          {getPlatformIcon(meeting.platform)}
                          <span className="text-sm capitalize">{meeting.platform?.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {new Date(meeting.start_time).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(meeting.status)}`}>
                          {meeting.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {meeting.status === 'scheduled' && (
                            <>
                              <button
                                onClick={() => handleJoinMeeting(meeting)}
                                className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                                title="Start Meeting"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => copyMeetingLink(meeting.meeting_url)}
                                className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                                title="Copy Link"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancelMeeting(meeting.id)}
                                className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                title="Cancel"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {meeting.status === 'live' && (
                            <>
                              <button
                                onClick={() => handleJoinMeeting(meeting)}
                                className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                                title="Join"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEndMeeting(meeting.id)}
                                className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                title="End Meeting"
                              >
                                <Square className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {meeting.status === 'ended' && (
                            <button
                              onClick={() => setSelectedMeeting(meeting)}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {meetings.length === 0 && (
                <div className="text-center py-12">
                  <Video className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No meetings found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'classrooms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map(classroom => (
            <div key={classroom.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Monitor className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  classroom.is_active 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {classroom.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{classroom.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {classroom.class_name} • {classroom.teacher_name}
              </p>
              {classroom.subject_name && (
                <p className="text-sm text-gray-400 dark:text-gray-500">{classroom.subject_name}</p>
              )}
              
              <div className="flex flex-wrap gap-2 mt-3">
                {classroom.features?.whiteboard && (
                  <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">Whiteboard</span>
                )}
                {classroom.features?.screen_share && (
                  <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">Screen Share</span>
                )}
                {classroom.features?.chat && (
                  <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">Chat</span>
                )}
              </div>
              
              <button
                onClick={() => window.open(classroom.room_url, '_blank')}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Video className="w-4 h-4" />
                Enter Classroom
              </button>
            </div>
          ))}
          
          {classrooms.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Monitor className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No virtual classrooms created yet</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'recordings' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Recording</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {recordings.map(recording => (
                  <tr key={recording.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{recording.meeting_title}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 capitalize">
                      {recording.recording_type}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {Math.floor(recording.duration_seconds / 60)} min
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {recording.file_size ? `${(recording.file_size / 1024 / 1024).toFixed(1)} MB` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {new Date(recording.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded">
                          <Play className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {recordings.length === 0 && (
              <div className="text-center py-12">
                <Video className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No recordings available</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Meeting</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Math Class - Chapter 5"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                  placeholder="Meeting description..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class</label>
                  <select
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select class...</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.class_name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                  <select
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select subject...</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.subject_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Platform</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'jitsi', name: 'Jitsi (Free)', icon: '🖥️' },
                    { id: 'zoom', name: 'Zoom', icon: '🎥' },
                    { id: 'google_meet', name: 'Google Meet', icon: '📹' }
                  ].map(platform => (
                    <button
                      key={platform.id}
                      onClick={() => setFormData({ ...formData, platform: platform.id })}
                      className={`p-3 border rounded-lg text-center transition-colors ${
                        formData.platform === platform.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-2xl">{platform.icon}</span>
                      <p className="text-xs mt-1">{platform.name}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
                  <select
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.waiting_room}
                    onChange={(e) => setFormData({ ...formData, waiting_room: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Waiting Room</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.record_meeting}
                    onChange={(e) => setFormData({ ...formData, record_meeting: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Record Meeting</span>
                </label>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMeeting}
                disabled={!formData.title || !formData.start_time || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Meeting'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
