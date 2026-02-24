import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import { Clock, Calendar, BookOpen } from 'lucide-react';

export default function StudentTimetable() {
  const { user } = useAuthStore();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [
    { id: 1, time: '8:00 - 8:45' },
    { id: 2, time: '8:45 - 9:30' },
    { id: 3, time: '9:30 - 10:15' },
    { id: 4, time: '10:30 - 11:15' },
    { id: 5, time: '11:15 - 12:00' },
    { id: 6, time: '12:00 - 12:45' },
    { id: 7, time: '1:30 - 2:15' },
    { id: 8, time: '2:15 - 3:00' },
  ];

  useEffect(() => {
    if (user?.id) fetchTimetable();
  }, [user?.id]);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const studentId = user.student_id || user.id;
      const response = await axios.get(`${API_BASE_URL}/timetable.php?student_id=${studentId}`);
      setTimetable(response.data.timetable || []);
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSlot = (day, periodId) => {
    return timetable.find(t => t.day === day && t.period === periodId);
  };

  const getSubjectColor = (subject) => {
    const colors = {
      'Mathematics': 'bg-blue-100 text-blue-700 border-blue-200',
      'English': 'bg-green-100 text-green-700 border-green-200',
      'Science': 'bg-purple-100 text-purple-700 border-purple-200',
      'Social Studies': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'ICT': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      'French': 'bg-pink-100 text-pink-700 border-pink-200',
      'Physical Education': 'bg-orange-100 text-orange-700 border-orange-200',
    };
    return colors[subject] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="text-blue-600" /> My Timetable
          </h1>
          <p className="text-gray-600">Your weekly class schedule</p>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 w-24">
                <Clock size={16} className="inline mr-1" /> Time
              </th>
              {days.map(day => (
                <th 
                  key={day} 
                  className={`px-4 py-3 text-center text-sm font-medium ${
                    day === today ? 'bg-blue-50 text-blue-700' : 'text-gray-500'
                  }`}
                >
                  {day}
                  {day === today && <span className="ml-1 text-xs">(Today)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period, idx) => (
              <tr key={period.id} className={idx === 3 || idx === 6 ? 'border-t-4 border-gray-200' : ''}>
                <td className="px-4 py-2 text-sm text-gray-500 font-medium border-r">
                  {period.time}
                </td>
                {days.map(day => {
                  const slot = getSlot(day, period.id);
                  return (
                    <td key={day} className={`px-2 py-2 ${day === today ? 'bg-blue-50/30' : ''}`}>
                      {slot ? (
                        <div className={`p-2 rounded-lg border ${getSubjectColor(slot.subject_name)}`}>
                          <p className="font-medium text-sm">{slot.subject_name}</p>
                          <p className="text-xs opacity-75">{slot.teacher_name}</p>
                          {slot.room && <p className="text-xs opacity-75">Room: {slot.room}</p>}
                        </div>
                      ) : (
                        <div className="p-2 text-center text-gray-400 text-sm">-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Today's Classes */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="text-blue-600" size={20} /> Today's Classes
        </h2>
        <div className="space-y-3">
          {timetable.filter(t => t.day === today).length === 0 ? (
            <p className="text-gray-500 text-center py-4">No classes scheduled for today</p>
          ) : (
            timetable
              .filter(t => t.day === today)
              .sort((a, b) => a.period - b.period)
              .map((slot, idx) => (
                <div key={idx} className={`flex items-center gap-4 p-3 rounded-lg border ${getSubjectColor(slot.subject_name)}`}>
                  <div className="text-sm font-medium w-24">
                    {periods.find(p => p.id === slot.period)?.time}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{slot.subject_name}</p>
                    <p className="text-sm opacity-75">{slot.teacher_name}</p>
                  </div>
                  {slot.room && (
                    <div className="text-sm">Room: {slot.room}</div>
                  )}
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
