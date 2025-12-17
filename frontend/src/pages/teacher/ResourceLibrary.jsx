import { useState, useEffect } from 'react';
import { 
  FolderOpen, File, FileText, Video, Link, Image, Plus, Edit, Trash2, X,
  Save, Search, Filter, Download, Share2, Upload, Folder, ChevronRight,
  Loader2, ExternalLink, Eye, Grid, List, MoreVertical
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function ResourceLibrary() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState(null);
  const [resources, setResources] = useState([]);
  const [folders, setFolders] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState(null);
  
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showShared, setShowShared] = useState(false);

  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);

  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    resource_type: 'link',
    url: '',
    subject_id: '',
    tags: '',
    is_shared: 0
  });

  const [folderForm, setFolderForm] = useState({
    name: '',
    color: '#3B82F6'
  });

  const resourceTypes = [
    { value: 'document', label: 'Document', icon: FileText, color: 'text-blue-600 bg-blue-100' },
    { value: 'video', label: 'Video', icon: Video, color: 'text-red-600 bg-red-100' },
    { value: 'link', label: 'Link', icon: Link, color: 'text-green-600 bg-green-100' },
    { value: 'image', label: 'Image', icon: Image, color: 'text-purple-600 bg-purple-100' },
    { value: 'presentation', label: 'Presentation', icon: File, color: 'text-orange-600 bg-orange-100' },
    { value: 'worksheet', label: 'Worksheet', icon: FileText, color: 'text-teal-600 bg-teal-100' }
  ];

  const folderColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (teacherId) {
      fetchResources();
    }
  }, [teacherId, selectedFolder, showShared]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const teacherRes = await axios.get(`${API_BASE_URL}/teachers.php?user_id=${user?.id}`);
      const teachers = teacherRes.data.teachers || [];
      
      if (teachers.length > 0) {
        setTeacherId(teachers[0].id);
        
        const [foldersRes, subjectsRes, statsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/resource_library.php?resource=folders&teacher_id=${teachers[0].id}`),
          axios.get(`${API_BASE_URL}/subjects.php`),
          axios.get(`${API_BASE_URL}/resource_library.php?resource=stats&teacher_id=${teachers[0].id}`)
        ]);

        setFolders(foldersRes.data.folders || []);
        setSubjects(subjectsRes.data.subjects || []);
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      let url = `${API_BASE_URL}/resource_library.php?resource=list&teacher_id=${teacherId}`;
      if (selectedFolder) url += `&folder_id=${selectedFolder}`;
      if (showShared) url += `&shared=1`;
      
      const response = await axios.get(url);
      setResources(response.data.resources || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddResource = () => {
    setEditingResource(null);
    setResourceForm({
      title: '',
      description: '',
      resource_type: 'link',
      url: '',
      subject_id: '',
      tags: '',
      is_shared: 0
    });
    setShowResourceModal(true);
  };

  const handleEditResource = (resource) => {
    setEditingResource(resource);
    setResourceForm({
      title: resource.title,
      description: resource.description || '',
      resource_type: resource.resource_type,
      url: resource.url || '',
      subject_id: resource.subject_id || '',
      tags: resource.tags || '',
      is_shared: resource.is_shared
    });
    setShowResourceModal(true);
  };

  const handleSaveResource = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        resource: 'item',
        teacher_id: teacherId,
        folder_id: selectedFolder,
        ...resourceForm
      };

      if (editingResource) {
        await axios.put(`${API_BASE_URL}/resource_library.php?id=${editingResource.id}`, payload);
      } else {
        await axios.post(`${API_BASE_URL}/resource_library.php`, payload);
      }

      setShowResourceModal(false);
      fetchResources();
      fetchInitialData();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save resource');
    }
  };

  const handleDeleteResource = async (id) => {
    if (window.confirm('Delete this resource?')) {
      try {
        await axios.delete(`${API_BASE_URL}/resource_library.php?id=${id}&resource=item`);
        fetchResources();
        fetchInitialData();
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const handleAddFolder = () => {
    setEditingFolder(null);
    setFolderForm({ name: '', color: '#3B82F6' });
    setShowFolderModal(true);
  };

  const handleSaveFolder = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        resource: 'folder',
        teacher_id: teacherId,
        ...folderForm
      };

      if (editingFolder) {
        await axios.put(`${API_BASE_URL}/resource_library.php?id=${editingFolder.id}`, payload);
      } else {
        await axios.post(`${API_BASE_URL}/resource_library.php`, payload);
      }

      setShowFolderModal(false);
      fetchInitialData();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save folder');
    }
  };

  const handleDeleteFolder = async (id) => {
    if (window.confirm('Delete this folder? Resources will be moved out.')) {
      try {
        await axios.delete(`${API_BASE_URL}/resource_library.php?id=${id}&resource=folder`);
        if (selectedFolder === id) setSelectedFolder(null);
        fetchInitialData();
        fetchResources();
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const getResourceIcon = (type) => {
    const rt = resourceTypes.find(r => r.value === type);
    return rt ? rt.icon : File;
  };

  const getResourceColor = (type) => {
    const rt = resourceTypes.find(r => r.value === type);
    return rt ? rt.color : 'text-gray-600 bg-gray-100';
  };

  const filteredResources = resources.filter(r => {
    if (searchTerm && !r.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterType && r.resource_type !== filterType) return false;
    if (filterSubject && r.subject_id != filterSubject) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resource Library</h1>
          <p className="text-gray-600">Organize and share teaching materials</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAddFolder} className="btn bg-gray-200 hover:bg-gray-300">
            <Folder className="w-4 h-4 mr-2" /> New Folder
          </button>
          <button onClick={handleAddResource} className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" /> Add Resource
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <File className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total_resources || 0}</p>
                <p className="text-xs text-gray-500">Total Resources</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total_downloads || 0}</p>
                <p className="text-xs text-gray-500">Downloads</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{folders.length}</p>
                <p className="text-xs text-gray-500">Folders</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Share2 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resources.filter(r => r.is_shared).length}</p>
                <p className="text-xs text-gray-500">Shared</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Folders */}
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Folders</h3>
          <div className="space-y-2">
            <button
              onClick={() => { setSelectedFolder(null); setShowShared(false); }}
              className={`w-full flex items-center gap-2 p-2 rounded-lg text-left ${
                !selectedFolder && !showShared ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>All Resources</span>
            </button>
            <button
              onClick={() => { setSelectedFolder(null); setShowShared(true); }}
              className={`w-full flex items-center gap-2 p-2 rounded-lg text-left ${
                showShared ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>Shared Resources</span>
            </button>
            <hr className="my-2" />
            {folders.map(folder => (
              <div key={folder.id} className="group flex items-center">
                <button
                  onClick={() => { setSelectedFolder(folder.id); setShowShared(false); }}
                  className={`flex-1 flex items-center gap-2 p-2 rounded-lg text-left ${
                    selectedFolder === folder.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <Folder className="w-4 h-4" style={{ color: folder.color }} />
                  <span className="truncate">{folder.name}</span>
                </button>
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="p-1 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filters */}
          <div className="card p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input w-auto"
              >
                <option value="">All Types</option>
                {resourceTypes.map(rt => (
                  <option key={rt.value} value={rt.value}>{rt.label}</option>
                ))}
              </select>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="input w-auto"
              >
                <option value="">All Subjects</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.subject_name}</option>
                ))}
              </select>
              <div className="flex gap-1 border rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : ''}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : ''}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Resources */}
          {filteredResources.length === 0 ? (
            <div className="card p-12 text-center">
              <File className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No resources found</p>
              <button onClick={handleAddResource} className="btn btn-primary mt-4">
                Add Your First Resource
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map(resource => {
                const IconComponent = getResourceIcon(resource.resource_type);
                return (
                  <div key={resource.id} className="card p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getResourceColor(resource.resource_type)}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{resource.title}</h4>
                        <p className="text-xs text-gray-500">{resource.subject_name || 'No subject'}</p>
                      </div>
                      {resource.is_shared == 1 && (
                        <Share2 className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    {resource.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{resource.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <span className="text-xs text-gray-400">
                        {resource.download_count || 0} downloads
                      </span>
                      <div className="flex gap-1">
                        {resource.url && (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleEditResource(resource)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteResource(resource.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card divide-y">
              {filteredResources.map(resource => {
                const IconComponent = getResourceIcon(resource.resource_type);
                return (
                  <div key={resource.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getResourceColor(resource.resource_type)}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">{resource.title}</h4>
                      <p className="text-sm text-gray-500">
                        {resource.subject_name || 'No subject'} • {resource.download_count || 0} downloads
                      </p>
                    </div>
                    {resource.is_shared == 1 && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Shared</span>
                    )}
                    <div className="flex gap-1">
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm bg-gray-100"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button onClick={() => handleEditResource(resource)} className="btn btn-sm bg-gray-100">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteResource(resource.id)} className="btn btn-sm bg-red-100 text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Resource Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editingResource ? 'Edit Resource' : 'Add Resource'}</h2>
              <button onClick={() => setShowResourceModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveResource} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={resourceForm.title}
                  onChange={(e) => setResourceForm({...resourceForm, title: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={resourceForm.resource_type}
                  onChange={(e) => setResourceForm({...resourceForm, resource_type: e.target.value})}
                  className="input"
                >
                  {resourceTypes.map(rt => (
                    <option key={rt.value} value={rt.value}>{rt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">URL</label>
                <input
                  type="url"
                  value={resourceForm.url}
                  onChange={(e) => setResourceForm({...resourceForm, url: e.target.value})}
                  className="input"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <select
                  value={resourceForm.subject_id}
                  onChange={(e) => setResourceForm({...resourceForm, subject_id: e.target.value})}
                  className="input"
                >
                  <option value="">No subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.subject_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={resourceForm.description}
                  onChange={(e) => setResourceForm({...resourceForm, description: e.target.value})}
                  className="input"
                  rows="2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  value={resourceForm.tags}
                  onChange={(e) => setResourceForm({...resourceForm, tags: e.target.value})}
                  className="input"
                  placeholder="math, fractions, grade5"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_shared"
                  checked={resourceForm.is_shared == 1}
                  onChange={(e) => setResourceForm({...resourceForm, is_shared: e.target.checked ? 1 : 0})}
                />
                <label htmlFor="is_shared" className="text-sm">Share with other teachers</label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowResourceModal(false)} className="btn bg-gray-200">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Resource</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editingFolder ? 'Edit Folder' : 'New Folder'}</h2>
              <button onClick={() => setShowFolderModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveFolder} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Folder Name *</label>
                <input
                  type="text"
                  required
                  value={folderForm.name}
                  onChange={(e) => setFolderForm({...folderForm, name: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="flex gap-2">
                  {folderColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFolderForm({...folderForm, color})}
                      className={`w-8 h-8 rounded-full border-2 ${
                        folderForm.color === color ? 'border-gray-900' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowFolderModal(false)} className="btn bg-gray-200">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Folder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
