import { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Calendar, CheckCircle, X, Search, Download, Printer,
  Copy, ChevronUp, ChevronDown, CalendarDays, Clock, Archive, RotateCcw,
  CalendarPlus, Eye, AlertCircle, PartyPopper, BookOpen
} from 'lucide-react';
import { termsAPI } from '../../services/api';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function Terms() {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [formData, setFormData] = useState({
    term_name: '',
    term_code: '',
    academic_year: '2024/2025',
    term_number: 1,
    start_date: '',
    end_date: '',
    status: 'upcoming',
    description: ''
  });

  // Enhanced state
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('start_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [viewMode, setViewMode] = useState('table'); // table, calendar
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [termEvents, setTermEvents] = useState([]);
  const [eventForm, setEventForm] = useState({ event_name: '', event_date: '', event_type: 'holiday', description: '' });

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const response = await termsAPI.getAll();
      setTerms(response.data.terms || []);
    } catch (error) {
      console.error('Error fetching terms:', error);
      alert('Failed to load terms');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTerm(null);
    setFormData({
      term_name: '',
      term_code: '',
      academic_year: '2024/2025',
      term_number: 1,
      start_date: '',
      end_date: '',
      status: 'upcoming',
      description: ''
    });
    setShowModal(true);
  };

  const handleEdit = (term) => {
    setEditingTerm(term);
    setFormData({
      term_name: term.term_name,
      term_code: term.term_code,
      academic_year: term.academic_year,
      term_number: term.term_number,
      start_date: term.start_date,
      end_date: term.end_date,
      status: term.status,
      description: term.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this term?')) {
      try {
        await termsAPI.delete(id);
        fetchTerms();
        alert('Term deleted successfully!');
      } catch (error) {
        console.error('Error deleting term:', error);
        alert('Failed to delete term');
      }
    }
  };

  const handleActivate = async (id) => {
    if (window.confirm('Activate this term? This will deactivate all other terms.')) {
      try {
        await termsAPI.activate(id);
        fetchTerms();
        alert('Term activated successfully!');
      } catch (error) {
        console.error('Error activating term:', error);
        alert('Failed to activate term');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTerm) {
        await termsAPI.update(editingTerm.id, formData);
        alert('Term updated successfully!');
      } else {
        await termsAPI.create(formData);
        alert('Term created successfully!');
      }
      setShowModal(false);
      fetchTerms();
    } catch (error) {
      console.error('Error saving term:', error);
      alert('Failed to save term: ' + (error.response?.data?.error || error.message));
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      upcoming: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
      archived: 'bg-yellow-100 text-yellow-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  // Calculate term duration
  const getTermDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    return { weeks, days, totalDays: diffDays };
  };

  // Calculate term progress
  const getTermProgress = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    if (today < start) return 0;
    if (today > end) return 100;
    
    const total = end - start;
    const elapsed = today - start;
    return Math.round((elapsed / total) * 100);
  };

  // Sort handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Archive term
  const handleArchive = async (term) => {
    const newStatus = term.status === 'archived' ? 'completed' : 'archived';
    const action = newStatus === 'archived' ? 'archive' : 'restore';
    
    if (window.confirm(`Are you sure you want to ${action} this term?`)) {
      try {
        await termsAPI.update(term.id, { ...term, status: newStatus });
        fetchTerms();
        alert(`Term ${action}d successfully!`);
      } catch (error) {
        alert(`Failed to ${action} term`);
      }
    }
  };

  // Copy term to next year
  const handleCopyTerm = async () => {
    if (!selectedTerm) return;
    
    const currentYear = selectedTerm.academic_year;
    const [startYear, endYear] = currentYear.split('/').map(Number);
    const newYear = `${startYear + 1}/${endYear + 1}`;
    
    // Shift dates by 1 year
    const newStartDate = new Date(selectedTerm.start_date);
    newStartDate.setFullYear(newStartDate.getFullYear() + 1);
    const newEndDate = new Date(selectedTerm.end_date);
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    
    try {
      await termsAPI.create({
        term_name: selectedTerm.term_name,
        term_code: `${selectedTerm.term_code.split('-')[0]}-${endYear + 1}`,
        academic_year: newYear,
        term_number: selectedTerm.term_number,
        start_date: newStartDate.toISOString().split('T')[0],
        end_date: newEndDate.toISOString().split('T')[0],
        status: 'upcoming',
        description: selectedTerm.description
      });
      setShowCopyModal(false);
      fetchTerms();
      alert('Term copied successfully!');
    } catch (error) {
      alert('Failed to copy term');
    }
  };

  // Export functions
  const handleExport = (format) => {
    const data = filteredTerms.map(t => ({
      'Term Name': t.term_name,
      'Code': t.term_code,
      'Academic Year': t.academic_year,
      'Term Number': t.term_number,
      'Start Date': t.start_date,
      'End Date': t.end_date,
      'Duration': `${getTermDuration(t.start_date, t.end_date).weeks} weeks`,
      'Status': t.status,
      'Active': t.is_active ? 'Yes' : 'No'
    }));

    if (format === 'csv') {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'academic_terms.csv';
      a.click();
    } else if (format === 'print') {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html><head><title>Academic Terms</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #2563eb; color: white; }
          h1 { color: #1f2937; }
          .active { color: green; font-weight: bold; }
        </style></head><body>
        <h1>Academic Terms</h1>
        <table>
          <thead><tr>${Object.keys(data[0]).map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${data.map(row => `<tr>${Object.values(row).map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
        </body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Manage term events
  const handleManageEvents = async (term) => {
    setSelectedTerm(term);
    try {
      const response = await axios.get(`${API_BASE_URL}/term_events.php?term_id=${term.id}`);
      setTermEvents(response.data.events || []);
    } catch (error) {
      setTermEvents([]);
    }
    setEventForm({ event_name: '', event_date: '', event_type: 'holiday', description: '' });
    setShowEventsModal(true);
  };

  const handleAddEvent = async () => {
    if (!eventForm.event_name || !eventForm.event_date) {
      alert('Event name and date are required');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/term_events.php`, {
        term_id: selectedTerm.id,
        ...eventForm
      });
      const response = await axios.get(`${API_BASE_URL}/term_events.php?term_id=${selectedTerm.id}`);
      setTermEvents(response.data.events || []);
      setEventForm({ event_name: '', event_date: '', event_type: 'holiday', description: '' });
      alert('Event added!');
    } catch (error) {
      alert('Failed to add event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/term_events.php?id=${eventId}`);
      setTermEvents(termEvents.filter(e => e.id !== eventId));
    } catch (error) {
      alert('Failed to delete event');
    }
  };

  // Auto-update status based on dates
  const getAutoStatus = (term) => {
    const today = new Date();
    const start = new Date(term.start_date);
    const end = new Date(term.end_date);
    
    if (term.status === 'archived') return 'archived';
    if (today < start) return 'upcoming';
    if (today >= start && today <= end) return 'active';
    return 'completed';
  };

  // Filter and sort terms
  const filteredTerms = terms
    .filter(t => {
      const matchesSearch = !searchTerm ||
        t.term_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.term_code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = !yearFilter || t.academic_year === yearFilter;
      const matchesStatus = !statusFilter || t.status === statusFilter || getAutoStatus(t) === statusFilter;
      return matchesSearch && matchesYear && matchesStatus;
    })
    .sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (sortField === 'start_date' || sortField === 'end_date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  // Get unique academic years
  const academicYears = [...new Set(terms.map(t => t.academic_year))].sort().reverse();

  // Get active term
  const activeTerm = terms.find(t => t.is_active == 1);

  const stats = [
    { label: 'Total Terms', value: terms.length, color: 'bg-blue-500', icon: Calendar },
    { label: 'Active Term', value: activeTerm?.term_name || 'None', color: 'bg-green-500', icon: CheckCircle },
    { label: 'Upcoming', value: terms.filter(t => getAutoStatus(t) === 'upcoming').length, color: 'bg-purple-500', icon: Clock },
    { label: 'Academic Years', value: academicYears.length, color: 'bg-orange-500', icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Terms</h1>
          <p className="text-gray-600 mt-1">Manage academic terms and sessions</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Term
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Term Progress */}
      {activeTerm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Current Term: {activeTerm.term_name}</h3>
              <p className="text-sm text-gray-500">{activeTerm.academic_year} • {new Date(activeTerm.start_date).toLocaleDateString()} - {new Date(activeTerm.end_date).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{getTermProgress(activeTerm.start_date, activeTerm.end_date)}%</p>
              <p className="text-sm text-gray-500">Complete</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500" 
              style={{ width: `${getTermProgress(activeTerm.start_date, activeTerm.end_date)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{getTermDuration(activeTerm.start_date, activeTerm.end_date).weeks} weeks, {getTermDuration(activeTerm.start_date, activeTerm.end_date).days} days total</span>
            <span>{Math.ceil((new Date(activeTerm.end_date) - new Date()) / (1000 * 60 * 60 * 24))} days remaining</span>
          </div>
        </div>
      )}

      {/* Search, Filter, and Actions */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="input w-auto">
            <option value="">All Years</option>
            {academicYears.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
            <option value="">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => setViewMode(viewMode === 'table' ? 'calendar' : 'table')} className="btn bg-gray-100 text-gray-700 hover:bg-gray-200">
              {viewMode === 'table' ? <CalendarDays className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button onClick={() => handleExport('csv')} className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={() => handleExport('print')} className="btn bg-gray-600 text-white hover:bg-gray-700 flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Term Calendar</h3>
          <div className="space-y-3">
            {filteredTerms.map(term => {
              const duration = getTermDuration(term.start_date, term.end_date);
              const progress = getTermProgress(term.start_date, term.end_date);
              return (
                <div key={term.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${term.is_active == 1 ? 'bg-green-500' : getAutoStatus(term) === 'upcoming' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                      <span className="font-medium">{term.term_name}</span>
                      <span className="text-sm text-gray-500">({term.academic_year})</span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(getAutoStatus(term))}`}>
                      {getAutoStatus(term)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span><Calendar className="w-4 h-4 inline mr-1" />{new Date(term.start_date).toLocaleDateString()} - {new Date(term.end_date).toLocaleDateString()}</span>
                    <span><Clock className="w-4 h-4 inline mr-1" />{duration.weeks}w {duration.days}d</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${term.is_active == 1 ? 'bg-green-500' : 'bg-blue-400'}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Terms Table */}
      {viewMode === 'table' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('term_name')}>
                    Term Name {sortField === 'term_name' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('academic_year')}>
                    Year {sortField === 'academic_year' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('start_date')}>
                    Duration {sortField === 'start_date' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                ) : filteredTerms.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">No terms found</td></tr>
                ) : (
                  filteredTerms.map((term) => {
                    const duration = getTermDuration(term.start_date, term.end_date);
                    const progress = getTermProgress(term.start_date, term.end_date);
                    return (
                      <tr key={term.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{term.term_name}</span>
                            {term.is_active == 1 && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Current</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-gray-600">{term.term_code}</td>
                        <td className="px-4 py-3 text-gray-600">{term.academic_year}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div>{new Date(term.start_date).toLocaleDateString()} - {new Date(term.end_date).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-400">{duration.weeks}w {duration.days}d ({duration.totalDays} days)</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div className={`h-2 rounded-full ${progress === 100 ? 'bg-gray-400' : 'bg-blue-500'}`} style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-xs text-gray-500">{progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(getAutoStatus(term))}`}>
                            {getAutoStatus(term)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {!term.is_active && term.status !== 'archived' && (
                              <button onClick={() => handleActivate(term.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Activate">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => handleManageEvents(term)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Events/Holidays">
                              <CalendarPlus className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedTerm(term); setShowCopyModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Copy to Next Year">
                              <Copy className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEdit(term)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                            {term.status !== 'archived' ? (
                              <button onClick={() => handleArchive(term)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" title="Archive">
                                <Archive className="w-4 h-4" />
                              </button>
                            ) : (
                              <button onClick={() => handleArchive(term)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Restore">
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => handleDelete(term.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTerm ? 'Edit Term' : 'Add New Term'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Term Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.term_name}
                    onChange={(e) => setFormData({ ...formData, term_name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Term Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.term_code}
                    onChange={(e) => setFormData({ ...formData, term_code: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label>
                  <input
                    type="text"
                    required
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    className="input"
                    placeholder="2024/2025"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Term Number *</label>
                  <select
                    required
                    value={formData.term_number}
                    onChange={(e) => setFormData({ ...formData, term_number: e.target.value })}
                    className="input"
                  >
                    <option value="1">Term 1</option>
                    <option value="2">Term 2</option>
                    <option value="3">Term 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows="3"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTerm ? 'Update Term' : 'Add Term'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy Term Modal */}
      {showCopyModal && selectedTerm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Copy Term to Next Year</h2>
              <button onClick={() => setShowCopyModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Source:</strong> {selectedTerm.term_name} ({selectedTerm.academic_year})
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>New Year:</strong> {(() => {
                    const [start, end] = selectedTerm.academic_year.split('/').map(Number);
                    return `${start + 1}/${end + 1}`;
                  })()}
                </p>
              </div>
              <p className="text-sm text-gray-600">
                This will create a new term with the same name and duration, shifted to the next academic year.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowCopyModal(false)} className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 flex-1">
                  Cancel
                </button>
                <button onClick={handleCopyTerm} className="btn btn-primary flex-1 flex items-center justify-center gap-2">
                  <Copy className="w-4 h-4" /> Copy Term
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Events/Holidays Modal */}
      {showEventsModal && selectedTerm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Term Events & Holidays</h2>
                <p className="text-sm text-gray-500">{selectedTerm.term_name} ({selectedTerm.academic_year})</p>
              </div>
              <button onClick={() => setShowEventsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Add Event Form */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Add New Event</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Event name"
                    value={eventForm.event_name}
                    onChange={(e) => setEventForm({ ...eventForm, event_name: e.target.value })}
                    className="input"
                  />
                  <input
                    type="date"
                    value={eventForm.event_date}
                    onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                    className="input"
                    min={selectedTerm.start_date}
                    max={selectedTerm.end_date}
                  />
                  <select
                    value={eventForm.event_type}
                    onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                    className="input"
                  >
                    <option value="holiday">Holiday</option>
                    <option value="exam">Exam Period</option>
                    <option value="break">Break</option>
                    <option value="event">School Event</option>
                    <option value="deadline">Deadline</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    className="input"
                  />
                </div>
                <button onClick={handleAddEvent} className="btn btn-primary mt-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Event
                </button>
              </div>

              {/* Events List */}
              <div className="space-y-2">
                {termEvents.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No events added yet</p>
                ) : (
                  termEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          event.event_type === 'holiday' ? 'bg-red-100 text-red-600' :
                          event.event_type === 'exam' ? 'bg-purple-100 text-purple-600' :
                          event.event_type === 'break' ? 'bg-green-100 text-green-600' :
                          event.event_type === 'deadline' ? 'bg-orange-100 text-orange-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {event.event_type === 'holiday' ? <PartyPopper className="w-4 h-4" /> :
                           event.event_type === 'exam' ? <BookOpen className="w-4 h-4" /> :
                           <Calendar className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{event.event_name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(event.event_date).toLocaleDateString()} • 
                            <span className="capitalize ml-1">{event.event_type}</span>
                          </p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteEvent(event.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200">
              <button onClick={() => setShowEventsModal(false)} className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 w-full">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
