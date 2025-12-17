import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  Loader2, User, MapPin, Link2, Plus, MessageSquare
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function ParentMeetings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [parentId, setParentId] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchParentId();
  }, [user]);

  useEffect(() => {
    if (parentId) {
      fetchMeetings();
    }
  }, [parentId]);

  const fetchParentId = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/parents.php?user_id=${user?.id}`);
      if (response.data.parents?.length > 0) {
        setParentId(response.data.parents[0].id);
      }
    } catch (error) {
      console.error('Error fetching parent ID:', error);
    }
  };

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/parent_portal.php?resource=meetings&parent_id=${parentId}`);
      if (response.data.success) {
        setMeetings(response.data.meetings || []);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelMeeting = async (meetingId) => {
    if (!confirm('Are you sure you want to cancel this meeting request?')) return;
    
    try {
      const response = await axios.delete(`${API_BASE_URL}/parent_portal.php?resource=meeting&id=${meetingId}`);
      if (response.data.success) {
        fetchMeetings();
      }
    } catch (error) {
      console.error('Error cancelling meeting:', error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const filteredMeetings = filter === 'all' 
    ? meetings 
    : meetings.filter(m => m.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meeting Requests</h1>
            <p className="text-gray-600">Manage your parent-teacher meeting requests</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'approved', 'completed', 'rejected', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && (
              <span className="ml-1">
                ({meetings.filter(m => m.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Meetings List */}
      <div className="card">
        {filteredMeetings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No meeting requests found</p>
            <p className="text-sm mt-1">Request a meeting from your child's teacher page</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredMeetings.map((meeting) => (
              <div key={meeting.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{meeting.subject}</h4>
                        {getStatusBadge(meeting.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        With: {meeting.teacher_name} • For: {meeting.student_name}
                      </p>
                      
                      {meeting.status === 'approved' && meeting.meeting_date && (
                        <div className="mt-2 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-800 font-medium">Meeting Scheduled</p>
                          <div className="flex flex-wrap gap-4 mt-1 text-sm text-green-700">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(meeting.meeting_date).toLocaleDateString()}
                            </span>
                            {meeting.meeting_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {meeting.meeting_time}
                              </span>
                            )}
                            {meeting.meeting_location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {meeting.meeting_location}
                              </span>
                            )}
                            {meeting.meeting_link && (
                              <a 
                                href={meeting.meeting_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:underline"
                              >
                                <Link2 className="w-4 h-4" />
                                Join Online
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {meeting.preferred_date && meeting.status === 'pending' && (
                        <p className="text-xs text-gray-500 mt-2">
                          Preferred: {new Date(meeting.preferred_date).toLocaleDateString()}
                          {meeting.preferred_time && ` at ${meeting.preferred_time}`}
                        </p>
                      )}

                      {meeting.message && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                          {meeting.message}
                        </p>
                      )}

                      {meeting.teacher_notes && (
                        <p className="text-sm text-blue-700 mt-2 bg-blue-50 p-2 rounded">
                          <strong>Teacher's Note:</strong> {meeting.teacher_notes}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 mt-2">
                        Requested: {new Date(meeting.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {meeting.status === 'pending' && (
                      <button
                        onClick={() => cancelMeeting(meeting.id)}
                        className="btn btn-sm bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        Cancel
                      </button>
                    )}
                    {meeting.status === 'approved' && meeting.meeting_link && (
                      <a
                        href={meeting.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-primary"
                      >
                        Join Meeting
                      </a>
                    )}
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
