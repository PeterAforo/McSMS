import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar, Clock, Users, BookOpen, AlertCircle, Plus, Edit2, Trash2, 
  ChevronRight, Settings, RefreshCw, Check, X, Building, UserCheck,
  Copy, Eye, Archive, Play, Search, Filter
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

const API_BASE = `${API_BASE_URL}/timetable.php`;

export default function Timetable() {
  // Core state
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [entries, setEntries] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [substitutions, setSubstitutions] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  
  // Reference data
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [terms, setTerms] = useState([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState('timetable');
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [viewMode, setViewMode] = useState('class'); // 'class' or 'teacher'
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('entry');
  const [editingItem, setEditingItem] = useState(null);
  
  // Forms
  const [entryForm, setEntryForm] = useState({
    class_id: '', subject_id: '', teacher_id: '', day_of_week: 'Monday',
    time_slot_id: '', room_number: '', notes: ''
  });
  const [templateForm, setTemplateForm] = useState({
    template_name: '', description: '', academic_year: new Date().getFullYear().toString(), term_id: '', status: 'draft'
  });
  const [slotForm, setSlotForm] = useState({
    slot_name: '', start_time: '08:00', end_time: '08:45', slot_order: 1, is_break: false, status: 'active'
  });
  const [roomForm, setRoomForm] = useState({
    room_number: '', room_name: '', room_type: 'classroom', capacity: '', facilities: '', status: 'available'
  });
  const [substitutionForm, setSubstitutionForm] = useState({
    timetable_entry_id: '', original_teacher_id: '', substitute_teacher_id: '', substitution_date: '', reason: ''
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    Promise.all([
      fetchTemplates(), fetchTimeSlots(), fetchRooms(), fetchClasses(), 
      fetchSubjects(), fetchTeachers(), fetchTerms()
    ]).then(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      fetchEntries();
      fetchConflicts();
    }
  }, [selectedTemplate, selectedClass, selectedTeacher, viewMode]);

  // Fetch functions
  const fetchTemplates = async () => {
    try {
      const res = await axios.get(`${API_BASE}?resource=templates`);
      setTemplates(res.data.templates || []);
      if (res.data.templates?.length > 0 && !selectedTemplate) {
        setSelectedTemplate(res.data.templates[0].id);
      }
    } catch (e) { console.error(e); }
  };

  const fetchEntries = async () => {
    try {
      let url = `${API_BASE}?resource=entries&action=by_template&template_id=${selectedTemplate}`;
      if (viewMode === 'class' && selectedClass) url += `&class_id=${selectedClass}`;
      if (viewMode === 'teacher' && selectedTeacher) {
        url = `${API_BASE}?resource=entries&action=by_teacher&teacher_id=${selectedTeacher}&template_id=${selectedTemplate}`;
      }
      const res = await axios.get(url);
      setEntries(res.data.entries || []);
    } catch (e) { console.error(e); }
  };

  const fetchTimeSlots = async () => {
    try {
      const res = await axios.get(`${API_BASE}?resource=time_slots`);
      setTimeSlots(res.data.time_slots || []);
    } catch (e) { console.error(e); }
  };

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${API_BASE}?resource=rooms`);
      setRooms(res.data.rooms || []);
    } catch (e) { console.error(e); }
  };

  const fetchSubstitutions = async (date = new Date().toISOString().split('T')[0]) => {
    try {
      const res = await axios.get(`${API_BASE}?resource=substitutions&date=${date}`);
      setSubstitutions(res.data.substitutions || []);
    } catch (e) { console.error(e); }
  };

  const fetchConflicts = async () => {
    try {
      const res = await axios.get(`${API_BASE}?resource=conflicts&template_id=${selectedTemplate}`);
      setConflicts(res.data.conflicts || []);
    } catch (e) { console.error(e); }
  };

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/classes.php`);
      setClasses(res.data.classes || []);
    } catch (e) { console.error(e); }
  };

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/subjects.php`);
      setSubjects(res.data.subjects || []);
    } catch (e) { console.error(e); }
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/teachers.php`);
      setTeachers(res.data.teachers || []);
    } catch (e) { console.error(e); }
  };

  const fetchTerms = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/terms.php`);
      setTerms(res.data.terms || []);
    } catch (e) { console.error(e); }
  };

  // Entry handlers
  const handleSaveEntry = async (e) => {
    e.preventDefault();
    try {
      if (editingItem?.id) {
        await axios.put(`${API_BASE}?resource=entries&id=${editingItem.id}`, entryForm);
      } else {
        await axios.post(`${API_BASE}?resource=entries`, { ...entryForm, template_id: selectedTemplate });
      }
      alert('✅ Entry saved!');
      fetchEntries();
      fetchConflicts();
      closeModal();
    } catch (err) {
      if (err.response?.data?.conflicts) {
        alert('⚠️ Conflicts:\n' + err.response.data.conflicts.map(c => c.message).join('\n'));
      } else { alert('Failed to save'); }
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await axios.delete(`${API_BASE}?resource=entries&id=${id}`);
      fetchEntries();
    } catch (e) { alert('Failed'); }
  };

  // Template handlers
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      if (editingItem?.id) {
        await axios.put(`${API_BASE}?resource=templates&id=${editingItem.id}`, templateForm);
      } else {
        await axios.post(`${API_BASE}?resource=templates`, templateForm);
      }
      alert('✅ Template saved!');
      fetchTemplates();
      closeModal();
    } catch (e) { alert('Failed'); }
  };

  const handleActivateTemplate = async (id, termId) => {
    try {
      await axios.put(`${API_BASE}?resource=templates&id=${id}&action=activate`, { term_id: termId });
      alert('✅ Template activated!');
      fetchTemplates();
    } catch (e) { alert('Failed'); }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Delete template and all entries?')) return;
    try {
      await axios.delete(`${API_BASE}?resource=templates&id=${id}`);
      fetchTemplates();
      if (selectedTemplate === id) setSelectedTemplate(null);
    } catch (e) { alert('Failed'); }
  };

  // Time slot handlers
  const handleSaveSlot = async (e) => {
    e.preventDefault();
    try {
      if (editingItem?.id) {
        await axios.put(`${API_BASE}?resource=time_slots&id=${editingItem.id}`, slotForm);
      } else {
        await axios.post(`${API_BASE}?resource=time_slots`, slotForm);
      }
      alert('✅ Time slot saved!');
      fetchTimeSlots();
      closeModal();
    } catch (e) { alert('Failed'); }
  };

  const handleDeleteSlot = async (id) => {
    if (!confirm('Delete time slot?')) return;
    try {
      await axios.delete(`${API_BASE}?resource=time_slots&id=${id}`);
      fetchTimeSlots();
    } catch (e) { alert('Failed'); }
  };

  // Room handlers
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    try {
      if (editingItem?.id) {
        await axios.put(`${API_BASE}?resource=rooms&id=${editingItem.id}`, roomForm);
      } else {
        await axios.post(`${API_BASE}?resource=rooms`, roomForm);
      }
      alert('✅ Room saved!');
      fetchRooms();
      closeModal();
    } catch (e) { alert('Failed'); }
  };

  const handleDeleteRoom = async (id) => {
    if (!confirm('Delete room?')) return;
    try {
      await axios.delete(`${API_BASE}?resource=rooms&id=${id}`);
      fetchRooms();
    } catch (e) { alert('Failed'); }
  };

  // Substitution handlers
  const handleSaveSubstitution = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}?resource=substitutions`, substitutionForm);
      alert('✅ Substitution created!');
      fetchSubstitutions(substitutionForm.substitution_date);
      closeModal();
    } catch (e) { alert('Failed'); }
  };

  const handleApproveSubstitution = async (id, approve) => {
    try {
      await axios.put(`${API_BASE}?resource=substitutions&id=${id}&action=${approve ? 'approve' : 'reject'}`, { approved_by: 1 });
      fetchSubstitutions();
    } catch (e) { alert('Failed'); }
  };

  // Modal helpers
  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    if (type === 'entry') {
      setEntryForm(item ? { ...item } : { class_id: selectedClass || '', subject_id: '', teacher_id: '', day_of_week: 'Monday', time_slot_id: '', room_number: '', notes: '' });
    } else if (type === 'template') {
      setTemplateForm(item ? { ...item } : { template_name: '', description: '', academic_year: new Date().getFullYear().toString(), term_id: '', status: 'draft' });
    } else if (type === 'slot') {
      setSlotForm(item ? { ...item, is_break: !!item.is_break } : { slot_name: '', start_time: '08:00', end_time: '08:45', slot_order: timeSlots.length + 1, is_break: false, status: 'active' });
    } else if (type === 'room') {
      setRoomForm(item ? { ...item } : { room_number: '', room_name: '', room_type: 'classroom', capacity: '', facilities: '', status: 'available' });
    } else if (type === 'substitution') {
      setSubstitutionForm({ timetable_entry_id: '', original_teacher_id: '', substitute_teacher_id: '', substitution_date: new Date().toISOString().split('T')[0], reason: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingItem(null); };

  const getEntryForSlot = (day, slotId) => entries.find(e => e.day_of_week === day && parseInt(e.time_slot_id) === parseInt(slotId));

  const getStatusBadge = (status) => {
    const styles = { draft: 'bg-gray-100 text-gray-800', active: 'bg-green-100 text-green-800', archived: 'bg-yellow-100 text-yellow-800', available: 'bg-green-100 text-green-800', maintenance: 'bg-orange-100 text-orange-800', unavailable: 'bg-red-100 text-red-800', pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800' };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="w-8 h-8 text-indigo-600" />
          Timetable Management
        </h1>
        <p className="text-gray-600 mt-1">Manage schedules, time slots, rooms, and substitutions</p>
      </div>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800">Scheduling Conflicts</h3>
            <p className="text-sm text-red-600">{conflicts.length} conflict(s) detected</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b overflow-x-auto">
          <div className="flex">
            {[
              { id: 'timetable', label: 'Timetable', icon: Calendar },
              { id: 'templates', label: 'Templates', icon: Copy },
              { id: 'slots', label: 'Time Slots', icon: Clock },
              { id: 'rooms', label: 'Rooms', icon: Building },
              { id: 'substitutions', label: 'Substitutions', icon: UserCheck },
              { id: 'conflicts', label: `Conflicts (${conflicts.length})`, icon: AlertCircle }
            ].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === 'substitutions') fetchSubstitutions(); }}
                className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}>
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* TIMETABLE TAB */}
          {activeTab === 'timetable' && (
            <div>
              {/* Controls */}
              <div className="flex flex-wrap gap-4 mb-6">
                <select value={selectedTemplate || ''} onChange={(e) => setSelectedTemplate(e.target.value)} className="px-4 py-2 border rounded-lg">
                  <option value="">Select Template</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.template_name} ({t.status})</option>)}
                </select>
                
                <div className="flex border rounded-lg overflow-hidden">
                  <button onClick={() => setViewMode('class')} className={`px-4 py-2 ${viewMode === 'class' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>By Class</button>
                  <button onClick={() => setViewMode('teacher')} className={`px-4 py-2 ${viewMode === 'teacher' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>By Teacher</button>
                </div>

                {viewMode === 'class' ? (
                  <select value={selectedClass || ''} onChange={(e) => setSelectedClass(e.target.value || null)} className="px-4 py-2 border rounded-lg">
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                  </select>
                ) : (
                  <select value={selectedTeacher || ''} onChange={(e) => setSelectedTeacher(e.target.value || null)} className="px-4 py-2 border rounded-lg">
                    <option value="">Select Teacher</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                  </select>
                )}

                <button onClick={() => openModal('entry')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700">
                  <Plus size={18} /> Add Entry
                </button>
              </div>

              {/* Grid */}
              {selectedTemplate ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-32">Time</th>
                        {weekDays.map(day => <th key={day} className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{day}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {timeSlots.map(slot => (
                        <tr key={slot.id} className={slot.is_break ? 'bg-amber-50' : ''}>
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium text-gray-900">{slot.slot_name}</div>
                            <div className="text-xs text-gray-500">{slot.start_time?.substring(0,5)} - {slot.end_time?.substring(0,5)}</div>
                          </td>
                          {weekDays.map(day => {
                            const entry = getEntryForSlot(day, slot.id);
                            return (
                              <td key={day} className="px-2 py-2 text-center">
                                {slot.is_break ? (
                                  <div className="text-sm text-amber-600 italic font-medium">Break</div>
                                ) : entry ? (
                                  <div className="bg-indigo-50 border border-indigo-200 rounded p-2 text-left relative group">
                                    <div className="text-sm font-medium text-indigo-900">{entry.subject_name}</div>
                                    <div className="text-xs text-indigo-600">{entry.teacher_name || 'No teacher'}</div>
                                    {viewMode === 'teacher' && <div className="text-xs text-gray-600">{entry.class_name}</div>}
                                    {entry.room_number && <div className="text-xs text-gray-500">📍 {entry.room_number}</div>}
                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1">
                                      <button onClick={() => openModal('entry', entry)} className="p-1 bg-white rounded shadow hover:bg-gray-100"><Edit2 className="w-3 h-3" /></button>
                                      <button onClick={() => handleDeleteEntry(entry.id)} className="p-1 bg-white rounded shadow hover:bg-red-50"><Trash2 className="w-3 h-3 text-red-500" /></button>
                                    </div>
                                  </div>
                                ) : (
                                  <button onClick={() => { setEntryForm({ ...entryForm, day_of_week: day, time_slot_id: slot.id, class_id: selectedClass || '' }); openModal('entry'); }}
                                    className="w-full h-full min-h-[60px] border-2 border-dashed border-gray-300 rounded hover:border-indigo-400 hover:bg-indigo-50">
                                    <Plus className="w-4 h-4 text-gray-400 mx-auto" />
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">Select a template to view timetable</div>
              )}
            </div>
          )}

          {/* TEMPLATES TAB */}
          {activeTab === 'templates' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Timetable Templates</h3>
                <button onClick={() => openModal('template')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700">
                  <Plus size={18} /> New Template
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(t => (
                  <div key={t.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{t.template_name}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(t.status)}`}>{t.status}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{t.description || 'No description'}</p>
                    <p className="text-xs text-gray-500 mb-3">Year: {t.academic_year} | Term: {t.term_name || 'N/A'} | Entries: {t.entries_count || 0}</p>
                    <div className="flex gap-2">
                      {t.status !== 'active' && (
                        <button onClick={() => handleActivateTemplate(t.id, t.term_id)} className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 flex items-center gap-1">
                          <Play size={14} /> Activate
                        </button>
                      )}
                      <button onClick={() => openModal('template', t)} className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"><Edit2 size={14} /></button>
                      <button onClick={() => handleDeleteTemplate(t.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TIME SLOTS TAB */}
          {activeTab === 'slots' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Time Slots / Periods</h3>
                <button onClick={() => openModal('slot')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700">
                  <Plus size={18} /> Add Slot
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {timeSlots.map(s => (
                      <tr key={s.id} className={s.is_break ? 'bg-amber-50' : ''}>
                        <td className="px-4 py-3">{s.slot_order}</td>
                        <td className="px-4 py-3 font-medium">{s.slot_name}</td>
                        <td className="px-4 py-3">{s.start_time?.substring(0,5)}</td>
                        <td className="px-4 py-3">{s.end_time?.substring(0,5)}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${s.is_break ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{s.is_break ? 'Break' : 'Period'}</span></td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${getStatusBadge(s.status)}`}>{s.status}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => openModal('slot', s)} className="p-1 hover:bg-gray-100 rounded"><Edit2 size={16} /></button>
                            <button onClick={() => handleDeleteSlot(s.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 size={16} className="text-red-500" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ROOMS TAB */}
          {activeTab === 'rooms' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Rooms & Venues</h3>
                <button onClick={() => openModal('room')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700">
                  <Plus size={18} /> Add Room
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map(r => (
                  <div key={r.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Building className="text-indigo-600" size={20} />
                        <h4 className="font-semibold">{r.room_number}</h4>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(r.status)}`}>{r.status}</span>
                    </div>
                    <p className="text-sm text-gray-600">{r.room_name || 'Unnamed'}</p>
                    <p className="text-xs text-gray-500 mt-1">Type: {r.room_type} | Capacity: {r.capacity || 'N/A'}</p>
                    {r.facilities && <p className="text-xs text-gray-500 mt-1">Facilities: {r.facilities}</p>}
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => openModal('room', r)} className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"><Edit2 size={14} /></button>
                      <button onClick={() => handleDeleteRoom(r.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUBSTITUTIONS TAB */}
          {activeTab === 'substitutions' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Teacher Substitutions</h3>
                <button onClick={() => openModal('substitution')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700">
                  <Plus size={18} /> New Substitution
                </button>
              </div>
              {substitutions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No substitutions for today</div>
              ) : (
                <div className="space-y-3">
                  {substitutions.map(s => (
                    <div key={s.id} className="border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{s.class_name} - {s.subject_name}</p>
                        <p className="text-sm text-gray-600">{s.slot_name} ({s.start_time?.substring(0,5)} - {s.end_time?.substring(0,5)})</p>
                        <p className="text-sm"><span className="text-red-600">{s.original_teacher}</span> → <span className="text-green-600">{s.substitute_teacher}</span></p>
                        {s.reason && <p className="text-xs text-gray-500 mt-1">Reason: {s.reason}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(s.status)}`}>{s.status}</span>
                        {s.status === 'pending' && (
                          <>
                            <button onClick={() => handleApproveSubstitution(s.id, true)} className="p-2 bg-green-100 rounded hover:bg-green-200"><Check size={16} className="text-green-600" /></button>
                            <button onClick={() => handleApproveSubstitution(s.id, false)} className="p-2 bg-red-100 rounded hover:bg-red-200"><X size={16} className="text-red-600" /></button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONFLICTS TAB */}
          {activeTab === 'conflicts' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Scheduling Conflicts</h3>
              {conflicts.length === 0 ? (
                <div className="text-center py-12 text-green-600"><Check size={48} className="mx-auto mb-2" />No conflicts detected!</div>
              ) : (
                <div className="space-y-3">
                  {conflicts.map(c => (
                    <div key={c.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="text-red-600 mt-0.5" size={20} />
                        <div>
                          <p className="font-medium text-red-800">{c.conflict_type.replace(/_/g, ' ').toUpperCase()}</p>
                          <p className="text-sm text-red-600">{c.day_of_week} - {c.slot_name}</p>
                          <p className="text-sm text-gray-600">Resource: {c.conflict_resource}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {modalType === 'entry' && (editingItem ? 'Edit Entry' : 'Add Entry')}
                {modalType === 'template' && (editingItem ? 'Edit Template' : 'New Template')}
                {modalType === 'slot' && (editingItem ? 'Edit Time Slot' : 'Add Time Slot')}
                {modalType === 'room' && (editingItem ? 'Edit Room' : 'Add Room')}
                {modalType === 'substitution' && 'New Substitution'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6">
              {/* Entry Form */}
              {modalType === 'entry' && (
                <form onSubmit={handleSaveEntry} className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Class *</label><select value={entryForm.class_id} onChange={(e) => setEntryForm({ ...entryForm, class_id: e.target.value })} className="w-full border rounded-lg px-3 py-2" required><option value="">Select</option>{classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Subject *</label><select value={entryForm.subject_id} onChange={(e) => setEntryForm({ ...entryForm, subject_id: e.target.value })} className="w-full border rounded-lg px-3 py-2" required><option value="">Select</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Teacher</label><select value={entryForm.teacher_id} onChange={(e) => setEntryForm({ ...entryForm, teacher_id: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="">Select</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}</select></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Day *</label><select value={entryForm.day_of_week} onChange={(e) => setEntryForm({ ...entryForm, day_of_week: e.target.value })} className="w-full border rounded-lg px-3 py-2" required>{days.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                    <div><label className="block text-sm font-medium mb-1">Time Slot *</label><select value={entryForm.time_slot_id} onChange={(e) => setEntryForm({ ...entryForm, time_slot_id: e.target.value })} className="w-full border rounded-lg px-3 py-2" required><option value="">Select</option>{timeSlots.filter(ts => !ts.is_break).map(ts => <option key={ts.id} value={ts.id}>{ts.slot_name}</option>)}</select></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Room</label><select value={entryForm.room_number} onChange={(e) => setEntryForm({ ...entryForm, room_number: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="">Select</option>{rooms.filter(r => r.status === 'available').map(r => <option key={r.id} value={r.room_number}>{r.room_number} - {r.room_name}</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Notes</label><textarea value={entryForm.notes} onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} /></div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Save</button></div>
                </form>
              )}

              {/* Template Form */}
              {modalType === 'template' && (
                <form onSubmit={handleSaveTemplate} className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Template Name *</label><input type="text" value={templateForm.template_name} onChange={(e) => setTemplateForm({ ...templateForm, template_name: e.target.value })} className="w-full border rounded-lg px-3 py-2" required /></div>
                  <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Academic Year</label><input type="text" value={templateForm.academic_year} onChange={(e) => setTemplateForm({ ...templateForm, academic_year: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm font-medium mb-1">Term</label><select value={templateForm.term_id} onChange={(e) => setTemplateForm({ ...templateForm, term_id: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="">Select</option>{terms.map(t => <option key={t.id} value={t.id}>{t.term_name}</option>)}</select></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Status</label><select value={templateForm.status} onChange={(e) => setTemplateForm({ ...templateForm, status: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select></div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Save</button></div>
                </form>
              )}

              {/* Time Slot Form */}
              {modalType === 'slot' && (
                <form onSubmit={handleSaveSlot} className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Slot Name *</label><input type="text" value={slotForm.slot_name} onChange={(e) => setSlotForm({ ...slotForm, slot_name: e.target.value })} className="w-full border rounded-lg px-3 py-2" required placeholder="e.g., Period 1" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Start Time *</label><input type="time" value={slotForm.start_time} onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })} className="w-full border rounded-lg px-3 py-2" required /></div>
                    <div><label className="block text-sm font-medium mb-1">End Time *</label><input type="time" value={slotForm.end_time} onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })} className="w-full border rounded-lg px-3 py-2" required /></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Order</label><input type="number" value={slotForm.slot_order} onChange={(e) => setSlotForm({ ...slotForm, slot_order: e.target.value })} className="w-full border rounded-lg px-3 py-2" min="1" /></div>
                  <div className="flex items-center gap-2"><input type="checkbox" id="is_break" checked={slotForm.is_break} onChange={(e) => setSlotForm({ ...slotForm, is_break: e.target.checked })} className="rounded" /><label htmlFor="is_break" className="text-sm">This is a break period</label></div>
                  <div><label className="block text-sm font-medium mb-1">Status</label><select value={slotForm.status} onChange={(e) => setSlotForm({ ...slotForm, status: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Save</button></div>
                </form>
              )}

              {/* Room Form */}
              {modalType === 'room' && (
                <form onSubmit={handleSaveRoom} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Room Number *</label><input type="text" value={roomForm.room_number} onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })} className="w-full border rounded-lg px-3 py-2" required placeholder="e.g., R101" /></div>
                    <div><label className="block text-sm font-medium mb-1">Capacity</label><input type="number" value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Room Name</label><input type="text" value={roomForm.room_name} onChange={(e) => setRoomForm({ ...roomForm, room_name: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="e.g., Science Lab 1" /></div>
                  <div><label className="block text-sm font-medium mb-1">Room Type</label><select value={roomForm.room_type} onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="classroom">Classroom</option><option value="lab">Lab</option><option value="library">Library</option><option value="hall">Hall</option><option value="sports">Sports</option><option value="other">Other</option></select></div>
                  <div><label className="block text-sm font-medium mb-1">Facilities</label><input type="text" value={roomForm.facilities} onChange={(e) => setRoomForm({ ...roomForm, facilities: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="e.g., Projector, AC, Whiteboard" /></div>
                  <div><label className="block text-sm font-medium mb-1">Status</label><select value={roomForm.status} onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="available">Available</option><option value="maintenance">Maintenance</option><option value="unavailable">Unavailable</option></select></div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Save</button></div>
                </form>
              )}

              {/* Substitution Form */}
              {modalType === 'substitution' && (
                <form onSubmit={handleSaveSubstitution} className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Date *</label><input type="date" value={substitutionForm.substitution_date} onChange={(e) => setSubstitutionForm({ ...substitutionForm, substitution_date: e.target.value })} className="w-full border rounded-lg px-3 py-2" required /></div>
                  <div><label className="block text-sm font-medium mb-1">Timetable Entry *</label><select value={substitutionForm.timetable_entry_id} onChange={(e) => { const entry = entries.find(en => en.id == e.target.value); setSubstitutionForm({ ...substitutionForm, timetable_entry_id: e.target.value, original_teacher_id: entry?.teacher_id || '' }); }} className="w-full border rounded-lg px-3 py-2" required><option value="">Select</option>{entries.filter(e => e.teacher_id).map(e => <option key={e.id} value={e.id}>{e.day_of_week} - {e.slot_name} - {e.class_name} ({e.subject_name})</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Original Teacher</label><select value={substitutionForm.original_teacher_id} onChange={(e) => setSubstitutionForm({ ...substitutionForm, original_teacher_id: e.target.value })} className="w-full border rounded-lg px-3 py-2" disabled><option value="">Auto-filled</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Substitute Teacher *</label><select value={substitutionForm.substitute_teacher_id} onChange={(e) => setSubstitutionForm({ ...substitutionForm, substitute_teacher_id: e.target.value })} className="w-full border rounded-lg px-3 py-2" required><option value="">Select</option>{teachers.filter(t => t.id != substitutionForm.original_teacher_id).map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Reason</label><textarea value={substitutionForm.reason} onChange={(e) => setSubstitutionForm({ ...substitutionForm, reason: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} placeholder="e.g., Sick leave, Training" /></div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Create</button></div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
