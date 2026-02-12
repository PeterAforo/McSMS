import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { 
  Calendar, Clock, MapPin, BookOpen, CheckCircle, XCircle, 
  AlertCircle, Bell, User, ChevronRight
} from 'lucide-react';

export default function ExamAppointments({ parentId, onUpdate }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (parentId) {
      fetchAppointments();
    }
  }, [parentId]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/exam_appointments.php?action=by_parent&parent_id=${parentId}`
      );
      if (response.data.success) {
        setAppointments(response.data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDate = async (appointmentId, selectedDate) => {
    try {
      await axios.post(`${API_BASE_URL}/exam_appointments.php?action=select_date`, {
        appointment_id: appointmentId,
        selected_date: selectedDate
      });
      
      alert('Date selected successfully! The school will confirm your appointment.');
      setShowDatePicker(false);
      setSelectedAppointment(null);
      fetchAppointments();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error selecting date:', error);
      alert('Failed to select date. Please try again.');
    }
  };

  const handleConfirmAppointment = async (appointmentId) => {
    try {
      await axios.post(`${API_BASE_URL}/exam_appointments.php?action=parent_confirm`, {
        appointment_id: appointmentId
      });
      
      alert('Appointment confirmed! You will receive reminders before the appointment.');
      fetchAppointments();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error confirming appointment:', error);
      alert('Failed to confirm appointment. Please try again.');
    }
  };

  const getStatusBadge = (appointment) => {
    const { status, admin_confirmed, parent_confirmed } = appointment;
    
    if (status === 'confirmed') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Confirmed</span>;
    }
    if (status === 'completed') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Completed</span>;
    }
    if (status === 'cancelled') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Cancelled</span>;
    }
    if (status === 'scheduled' && !parent_confirmed) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Awaiting Your Confirmation</span>;
    }
    if (status === 'scheduled' && parent_confirmed && !admin_confirmed) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">Awaiting School Confirmation</span>;
    }
    if (status === 'pending') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">Select a Date</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">{status}</span>;
  };

  const getAppointmentTypeLabel = (type) => {
    switch (type) {
      case 'interview': return 'Interview';
      case 'both': return 'Exam & Interview';
      default: return 'Entrance Exam';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            <Calendar className="text-purple-600" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Exam & Interview Appointments</h2>
            <p className="text-sm text-gray-500">{appointments.length} appointment(s)</p>
          </div>
        </div>
      </div>

      <div className="divide-y">
        {appointments.map((apt) => (
          <div key={apt.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <User size={16} className="text-gray-400" />
                  <span className="font-medium text-gray-800">{apt.student_name}</span>
                  {getStatusBadge(apt)}
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="flex items-center gap-2">
                    <BookOpen size={14} className="text-purple-500" />
                    <span className="font-medium">{getAppointmentTypeLabel(apt.appointment_type)}</span>
                    {apt.subjects && <span className="text-gray-400">• {apt.subjects}</span>}
                  </p>
                  
                  {apt.selected_date && (
                    <p className="flex items-center gap-2">
                      <Calendar size={14} className="text-blue-500" />
                      <span>{new Date(apt.selected_date).toLocaleDateString('en-US', { 
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                      })}</span>
                      <Clock size={14} className="text-blue-500 ml-2" />
                      <span>{new Date(apt.selected_date).toLocaleTimeString('en-US', { 
                        hour: '2-digit', minute: '2-digit' 
                      })}</span>
                    </p>
                  )}
                  
                  {apt.location && (
                    <p className="flex items-center gap-2">
                      <MapPin size={14} className="text-red-500" />
                      <span>{apt.location}{apt.room ? `, ${apt.room}` : ''}</span>
                    </p>
                  )}
                  
                  {apt.instructions && (
                    <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                      <AlertCircle size={12} className="inline mr-1" />
                      {apt.instructions}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {/* Show date selection for pending appointments */}
                {apt.status === 'pending' && apt.available_dates?.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedAppointment(apt);
                      setShowDatePicker(true);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <Calendar size={16} />
                    Select Date
                  </button>
                )}

                {/* Show confirm button for scheduled appointments */}
                {apt.status === 'scheduled' && !apt.parent_confirmed && (
                  <button
                    onClick={() => handleConfirmAppointment(apt.id)}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Confirm
                  </button>
                )}

                {/* Show confirmed status */}
                {apt.status === 'confirmed' && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <Bell size={16} />
                    <span>Reminders set</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Date Selection Modal */}
      {showDatePicker && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Select Your Preferred Date
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose one of the available dates for {selectedAppointment.student_name}'s {getAppointmentTypeLabel(selectedAppointment.appointment_type).toLowerCase()}.
            </p>

            <div className="space-y-2 mb-6">
              {selectedAppointment.available_dates?.map((dateOption, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectDate(selectedAppointment.id, dateOption.datetime)}
                  className="w-full p-4 border rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200">
                      <Calendar className="text-purple-600" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-800">
                        {new Date(dateOption.datetime).toLocaleDateString('en-US', { 
                          weekday: 'short', month: 'short', day: 'numeric' 
                        })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(dateOption.datetime).toLocaleTimeString('en-US', { 
                          hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-400 group-hover:text-purple-600" size={20} />
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setShowDatePicker(false);
                setSelectedAppointment(null);
              }}
              className="w-full py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
