import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { Users, Search, Plus, Edit, Trash2, Mail, Phone, Calendar, Briefcase } from 'lucide-react';

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const [teachersRes, usersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/teachers.php`),
        axios.get(`${API_BASE_URL}/users.php`)
      ]);
      
      const teachers = (teachersRes.data.teachers || []).map(t => ({ ...t, role: 'Teacher' }));
      const staff = (usersRes.data.users || [])
        .filter(u => ['admin', 'hr', 'finance'].includes(u.user_type))
        .map(u => ({ ...u, role: u.user_type, first_name: u.name?.split(' ')[0], last_name: u.name?.split(' ').slice(1).join(' ') }));
      
      setEmployees([...teachers, ...staff]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(e => {
    const name = `${e.first_name || ''} ${e.last_name || ''}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || e.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-purple-600" /> Employee Management
          </h1>
          <p className="text-gray-600">Manage all staff members</p>
        </div>
        <button
          onClick={() => { setEditingEmployee(null); setShowModal(true); }}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <Plus size={18} /> Add Employee
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employees..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map(emp => (
          <div key={emp.id} className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">
                    {emp.first_name?.[0]}{emp.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{emp.first_name} {emp.last_name}</p>
                  <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                    {emp.role}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              {emp.email && (
                <p className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" /> {emp.email}
                </p>
              )}
              {emp.phone && (
                <p className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" /> {emp.phone}
                </p>
              )}
              {emp.department && (
                <p className="flex items-center gap-2">
                  <Briefcase size={14} className="text-gray-400" /> {emp.department}
                </p>
              )}
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t">
              <button className="flex-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">
                View Profile
              </button>
              <button className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg">
                <Edit size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
