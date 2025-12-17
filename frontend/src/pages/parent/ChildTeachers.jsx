import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Mail, Phone, MessageSquare, Calendar,
  Loader2, User, BookOpen, Send
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function ChildTeachers() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [messageForm, setMessageForm] = useState({ subject: '', message: '' });
  const [meetingForm, setMeetingForm] = useState({ 
    subject: '', 
    message: '', 
    preferred_date: '', 
    preferred_time: '' 
  });
  const [parentId, setParentId] = useState(null);

  useEffect(() => {
    fetchParentId();
  }, [user]);

  useEffect(() => {
    if (parentId && childId) {
      fetchChildDetails();
    }
  }, [parentId, childId]);

  useEffect(() => {
    if (child?.student_id) {
      fetchTeachers();
    }
  }, [child]);

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

  const fetchChildDetails = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/parent_portal.php?resource=child_details&child_id=${childId}`);
      if (response.data.success) {
        setChild(response.data.child);
      }
    } catch (error) {
      console.error('Error fetching child details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/parent_portal.php?resource=teachers&student_id=${child.student_id}`
      );
      if (response.data.success) {
        setTeachers(response.data.teachers || []);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleSendMessage = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/parent_portal.php?resource=send_message`, {
        parent_id: parentId,
        teacher_id: selectedTeacher.id,
        subject: messageForm.subject,
        message: messageForm.message
      });
      
      if (response.data.success) {
        alert('Message sent successfully!');
        setShowMessageModal(false);
        setMessageForm({ subject: '', message: '' });
      } else {
        alert(response.data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const handleRequestMeeting = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/parent_portal.php?resource=request_meeting`, {
        parent_id: parentId,
        teacher_id: selectedTeacher.id,
        student_id: child.student_id,
        subject: meetingForm.subject,
        message: meetingForm.message,
        preferred_date: meetingForm.preferred_date,
        preferred_time: meetingForm.preferred_time
      });
      
      if (response.data.success) {
        alert('Meeting request sent successfully!');
        setShowMeetingModal(false);
        setMeetingForm({ subject: '', message: '', preferred_date: '', preferred_time: '' });
      } else {
        alert(response.data.error || 'Failed to request meeting');
      }
    } catch (error) {
      console.error('Error requesting meeting:', error);
      alert('Failed to request meeting');
    }
  };

  const openMessageModal = (teacher) => {
    setSelectedTeacher(teacher);
    setShowMessageModal(true);
  };

  const openMeetingModal = (teacher) => {
    setSelectedTeacher(teacher);
    setShowMeetingModal(true);
  };

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
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <p className="text-gray-600">{child?.full_name} • {child?.class_name}</p>
        </div>
      </div>

      {/* Class Teacher */}
      {child?.class_teacher_name && (
        <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">Class Teacher</span>
              <h3 className="text-xl font-bold text-gray-900">{child.class_teacher_name}</h3>
              <p className="text-gray-600">{child.class_name}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openMessageModal({ id: child.class_teacher_id, name: child.class_teacher_name })}
                className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </button>
              <button
                onClick={() => openMeetingModal({ id: child.class_teacher_id, name: child.class_teacher_name })}
                className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Request Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subject Teachers */}
      <div className="card">
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Subject Teachers
          </h3>
        </div>

        {teachers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No teachers found</p>
          </div>
        ) : (
          <div className="divide-y">
            {teachers.map((teacher) => (
              <div key={`${teacher.id}-${teacher.role}`} className="p-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    {teacher.profile_picture ? (
                      <img 
                        src={teacher.profile_picture} 
                        alt={teacher.name} 
                        className="w-12 h-12 object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{teacher.name}</h4>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      {teacher.role}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      {teacher.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {teacher.email}
                        </span>
                      )}
                      {teacher.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {teacher.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openMessageModal(teacher)}
                      className="btn btn-sm bg-gray-100 hover:bg-gray-200 flex items-center gap-1"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </button>
                    <button
                      onClick={() => openMeetingModal(teacher)}
                      className="btn btn-sm bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center gap-1"
                    >
                      <Calendar className="w-4 h-4" />
                      Meeting
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Send Message to {selectedTeacher?.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                  className="input w-full"
                  placeholder="Enter subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                  className="input w-full h-32"
                  placeholder="Type your message..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowMessageModal(false)}
                className="btn bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!messageForm.subject || !messageForm.message}
                className="btn btn-primary flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Request Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Request Meeting with {selectedTeacher?.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject/Reason</label>
                <input
                  type="text"
                  value={meetingForm.subject}
                  onChange={(e) => setMeetingForm({ ...meetingForm, subject: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Discuss academic progress"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={meetingForm.preferred_date}
                    onChange={(e) => setMeetingForm({ ...meetingForm, preferred_date: e.target.value })}
                    className="input w-full"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                  <input
                    type="time"
                    value={meetingForm.preferred_time}
                    onChange={(e) => setMeetingForm({ ...meetingForm, preferred_time: e.target.value })}
                    className="input w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={meetingForm.message}
                  onChange={(e) => setMeetingForm({ ...meetingForm, message: e.target.value })}
                  className="input w-full h-24"
                  placeholder="Any additional information..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowMeetingModal(false)}
                className="btn bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestMeeting}
                disabled={!meetingForm.subject}
                className="btn btn-primary flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Request Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
