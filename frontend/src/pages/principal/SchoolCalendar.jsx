import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { Calendar, Plus, Clock, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SchoolCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const response = await axios.get(`${API_BASE_URL}/events.php?year=${year}&month=${month}`);
      setEvents(response.data.events || []);
    } catch (error) {
      // Use sample events if API fails
      setEvents([
        { id: 1, title: 'Staff Meeting', date: `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-05`, type: 'meeting', time: '09:00' },
        { id: 2, title: 'Parent-Teacher Conference', date: `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-15`, type: 'event', time: '14:00' },
        { id: 3, title: 'Mid-Term Exams Begin', date: `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-20`, type: 'exam', time: '08:00' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.date === dateStr);
      days.push({ day: i, date: dateStr, events: dayEvents });
    }
    
    return days;
  };

  const changeMonth = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const getEventColor = (type) => {
    switch(type) {
      case 'meeting': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'exam': return 'bg-red-100 text-red-700 border-red-200';
      case 'holiday': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-purple-100 text-purple-700 border-purple-200';
    }
  };

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="text-indigo-600" /> School Calendar
          </h1>
          <p className="text-gray-600">Academic events and schedules</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-semibold">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map((item, idx) => (
              <div
                key={idx}
                className={`min-h-[80px] p-1 border rounded-lg ${
                  item ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                }`}
              >
                {item && (
                  <>
                    <span className={`text-sm font-medium ${
                      item.date === new Date().toISOString().split('T')[0] 
                        ? 'bg-indigo-600 text-white px-2 py-0.5 rounded-full' 
                        : 'text-gray-700'
                    }`}>
                      {item.day}
                    </span>
                    <div className="mt-1 space-y-1">
                      {item.events.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded truncate ${getEventColor(event.type)}`}
                        >
                          {event.title}
                        </div>
                      ))}
                      {item.events.length > 2 && (
                        <span className="text-xs text-gray-500">+{item.events.length - 2} more</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="text-indigo-600" size={20} /> Upcoming Events
          </h2>
          <div className="space-y-4">
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No upcoming events</p>
            ) : (
              upcomingEvents.map(event => (
                <div key={event.id} className={`p-3 rounded-lg border ${getEventColor(event.type)}`}>
                  <p className="font-medium">{event.title}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm opacity-75">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    {event.time && (
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> {event.time}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
