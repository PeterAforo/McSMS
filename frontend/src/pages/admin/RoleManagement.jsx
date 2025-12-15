import { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2, X, Check, Users } from 'lucide-react';
import axios from 'axios';

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);

  const [formData, setFormData] = useState({
    role_name: '',
    display_name: '',
    description: '',
    is_system_role: false
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://eea.mcaforo.com/backend/api/roles.php');
      setRoles(response.data.roles || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      alert('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await axios.get('https://eea.mcaforo.com/backend/api/permissions.php');
      setPermissions(response.data.permissions || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const fetchRolePermissions = async (roleId) => {
    try {
      const response = await axios.get(`https://eea.mcaforo.com/backend/api/roles.php?id=${roleId}&include_permissions=true`);
      setRolePermissions(response.data.permissions || []);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
    }
  };

  const handleAdd = () => {
    setEditingRole(null);
    setFormData({
      role_name: '',
      display_name: '',
      description: '',
      is_system_role: false
    });
    setShowModal(true);
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      role_name: role.role_name,
      display_name: role.display_name || '',
      description: role.description || '',
      is_system_role: role.is_system_role || false
    });
    setShowModal(true);
  };

  const handleManagePermissions = async (role) => {
    setSelectedRole(role);
    await fetchRolePermissions(role.id);
    setShowPermissionsModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await axios.put(`https://eea.mcaforo.com/backend/api/roles.php?id=${editingRole.id}`, formData);
        alert('Role updated successfully!');
      } else {
        await axios.post('https://eea.mcaforo.com/backend/api/roles.php', formData);
        alert('Role created successfully!');
      }
      setShowModal(false);
      fetchRoles();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await axios.delete(`https://eea.mcaforo.com/backend/api/roles.php?id=${id}`);
      alert('Role deleted successfully!');
      fetchRoles();
    } catch (error) {
      alert('Error deleting role: ' + error.message);
    }
  };

  const handleTogglePermission = async (permissionId) => {
    const hasPermission = rolePermissions.some(p => p.id === permissionId);
    
    try {
      if (hasPermission) {
        await axios.delete(`https://eea.mcaforo.com/backend/api/role_permissions.php?role_id=${selectedRole.id}&permission_id=${permissionId}`);
      } else {
        await axios.post('https://eea.mcaforo.com/backend/api/role_permissions.php', {
          role_id: selectedRole.id,
          permission_id: permissionId
        });
      }
      await fetchRolePermissions(selectedRole.id);
    } catch (error) {
      alert('Error updating permission: ' + error.message);
    }
  };

  const categoryColors = {
    leadership: 'bg-purple-100 text-purple-700',
    academic: 'bg-blue-100 text-blue-700',
    administrative: 'bg-green-100 text-green-700',
    finance: 'bg-orange-100 text-orange-700',
    student_services: 'bg-teal-100 text-teal-700',
    support: 'bg-pink-100 text-pink-700'
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    const module = permission.module || 'other';
    if (!acc[module]) acc[module] = [];
    acc[module].push(permission);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600 mt-1">Manage system roles and permissions</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Role
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Roles</p>
              <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">System Roles</p>
              <p className="text-2xl font-bold text-gray-900">
                {roles.filter(r => r.is_system_role).length}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Permissions</p>
              <p className="text-2xl font-bold text-gray-900">{permissions.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Custom Roles</p>
              <p className="text-2xl font-bold text-gray-900">{roles.filter(r => !r.is_system_role).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Display Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading roles...</td>
              </tr>
            ) : roles.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No roles found</td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{role.role_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{role.display_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{role.description || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${role.is_system_role ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {role.is_system_role ? 'System' : 'Custom'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleManagePermissions(role)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                        title="Manage Permissions"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(role)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit Role"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(role.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Role Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editingRole ? 'Edit Role' : 'Add New Role'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Role Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.role_name}
                    onChange={(e) => setFormData({ ...formData, role_name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className="input"
                    placeholder="e.g., class_teacher"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Display Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    className="input"
                    placeholder="e.g., Class Teacher"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows="3"
                  />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_system_role}
                      onChange={(e) => setFormData({ ...formData, is_system_role: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">System Role (cannot be deleted by users)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn bg-gray-200">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Permissions Modal */}
      {showPermissionsModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Manage Permissions: {selectedRole.role_name}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {rolePermissions.length} of {permissions.length} permissions assigned
                </p>
              </div>
              <button onClick={() => setShowPermissionsModal(false)}><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {Object.entries(groupedPermissions).map(([module, perms]) => (
                <div key={module} className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 capitalize">{module} Module</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {perms.map((permission) => {
                      const isAssigned = rolePermissions.some(p => p.id === permission.id);
                      return (
                        <label
                          key={permission.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            isAssigned
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={() => handleTogglePermission(permission.id)}
                            className="rounded"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{permission.display_name}</p>
                            <p className="text-xs text-gray-500">{permission.permission_name}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t flex justify-end">
              <button onClick={() => setShowPermissionsModal(false)} className="btn btn-primary">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
