import { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, GraduationCap, Search, ArrowUp, ArrowDown,
  Check, X, AlertTriangle, Loader2, RefreshCw
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function EducationLevels() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formData, setFormData] = useState({
    level_code: '',
    level_name: '',
    description: '',
    display_order: 0,
    is_active: 1
  });

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/education_levels.php`);
      setLevels(response.data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLevel) {
        await axios.put(`${API_BASE_URL}/education_levels.php?id=${editingLevel.id}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/education_levels.php`, formData);
      }
      setShowModal(false);
      resetForm();
      fetchLevels();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving level');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this education level?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/education_levels.php?id=${id}`);
      fetchLevels();
    } catch (error) {
      alert(error.response?.data?.error || 'Error deleting level');
    }
  };

  const handleToggleActive = async (level) => {
    try {
      await axios.put(`${API_BASE_URL}/education_levels.php?id=${level.id}`, {
        is_active: level.is_active ? 0 : 1
      });
      fetchLevels();
    } catch (error) {
      alert(error.response?.data?.error || 'Error updating level');
    }
  };

  const handleReorder = async (level, direction) => {
    const currentIndex = levels.findIndex(l => l.id === level.id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= levels.length) return;
    
    const otherLevel = levels[newIndex];
    
    try {
      // Swap display orders
      await axios.put(`${API_BASE_URL}/education_levels.php?id=${level.id}`, {
        display_order: otherLevel.display_order
      });
      await axios.put(`${API_BASE_URL}/education_levels.php?id=${otherLevel.id}`, {
        display_order: level.display_order
      });
      fetchLevels();
    } catch (error) {
      console.error('Error reordering:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      level_code: '',
      level_name: '',
      description: '',
      display_order: levels.length + 1,
      is_active: 1
    });
    setEditingLevel(null);
  };

  const openEditModal = (level) => {
    setEditingLevel(level);
    setFormData({
      level_code: level.level_code,
      level_name: level.level_name,
      description: level.description || '',
      display_order: level.display_order,
      is_active: level.is_active
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setFormData(prev => ({ ...prev, display_order: levels.length + 1 }));
    setShowModal(true);
  };

  const filteredLevels = levels.filter(level => {
    const matchesSearch = level.level_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         level.level_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || 
                         (statusFilter === 'active' && level.is_active) ||
                         (statusFilter === 'inactive' && !level.is_active);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Education Levels</h1>
          <p className="text-gray-600 dark:text-gray-400">Configure education levels for your school (e.g., Creche, Primary, JHS)</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Level
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search levels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={fetchLevels} className="btn bg-gray-200 dark:bg-gray-700">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Levels Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-gray-500">Loading levels...</p>
          </div>
        ) : filteredLevels.length === 0 ? (
          <div className="p-8 text-center">
            <GraduationCap className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No education levels found</p>
            <button onClick={openAddModal} className="btn btn-primary mt-4">
              Add First Level
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {filteredLevels.map((level, index) => (
                <tr key={level.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 w-6">{level.display_order}</span>
                      <div className="flex flex-col">
                        <button
                          onClick={() => handleReorder(level, 'up')}
                          disabled={index === 0}
                          className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleReorder(level, 'down')}
                          disabled={index === filteredLevels.length - 1}
                          className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                      {level.level_code}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {level.level_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {level.description || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(level)}
                      className={`px-2 py-1 text-xs rounded-full ${
                        level.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {level.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(level)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(level.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info Card */}
      <div className="card p-4 mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-300">About Education Levels</h4>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              Education levels are used throughout the system for organizing classes, fee structures, subjects, and reports.
              The <strong>level code</strong> is used internally and should not be changed once classes are assigned to it.
              You can deactivate levels instead of deleting them to preserve historical data.
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingLevel ? 'Edit Education Level' : 'Add Education Level'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Level Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.level_code}
                  onChange={(e) => setFormData({ ...formData, level_code: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="input"
                  placeholder="e.g., primary, jhs, shs"
                  disabled={editingLevel}
                />
                {editingLevel && (
                  <p className="text-xs text-gray-500 mt-1">Code cannot be changed after creation</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Level Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.level_name}
                  onChange={(e) => setFormData({ ...formData, level_name: e.target.value })}
                  className="input"
                  placeholder="e.g., Primary School, Junior High School"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    className="input"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: parseInt(e.target.value) })}
                    className="input"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t dark:border-gray-700">
                <button type="button" onClick={() => setShowModal(false)} className="btn bg-gray-200 dark:bg-gray-700">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingLevel ? 'Update' : 'Create'} Level
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
