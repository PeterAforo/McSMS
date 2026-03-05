import { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, X, Search, Users, Percent, DollarSign, 
  Calendar, CheckCircle, XCircle, UserPlus, Settings, Tag
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function StudentDiscounts() {
  const [discounts, setDiscounts] = useState([]);
  const [students, setStudents] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discounts');
  
  // Modal states
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showSiblingModal, setShowSiblingModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  
  // Form states
  const [discountForm, setDiscountForm] = useState({
    student_id: '',
    discount_name: '',
    discount_type: 'percentage',
    discount_value: '',
    applies_to: 'tuition',
    duration: 'permanent',
    start_date: '',
    end_date: '',
    max_discount_amount: '',
    reason: ''
  });

  const [ruleForm, setRuleForm] = useState({
    rule_name: '',
    rule_type: 'sibling',
    condition_type: 'sibling_count',
    condition_value: '',
    discount_type: 'percentage',
    discount_value: '',
    applies_to: 'tuition',
    priority: 0
  });

  const [siblingForm, setSiblingForm] = useState({
    student_ids: [],
    group_name: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [siblingGroups, setSiblingGroups] = useState([]);

  useEffect(() => {
    fetchDiscounts();
    fetchStudents();
    fetchRules();
    fetchSiblingGroups();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/student_discounts.php`);
      setDiscounts(response.data.discounts || []);
    } catch (error) {
      console.error('Error fetching discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/students.php`);
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchRules = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/student_discounts.php?action=rules`);
      setRules(response.data.rules || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
    }
  };

  const fetchSiblingGroups = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/student_discounts.php?action=siblings`);
      setSiblingGroups(response.data.groups || []);
    } catch (error) {
      console.error('Error fetching sibling groups:', error);
    }
  };

  // Discount handlers
  const handleAddDiscount = () => {
    setEditingDiscount(null);
    setDiscountForm({
      student_id: '',
      discount_name: '',
      discount_type: 'percentage',
      discount_value: '',
      applies_to: 'tuition',
      duration: 'permanent',
      start_date: '',
      end_date: '',
      max_discount_amount: '',
      reason: ''
    });
    setShowDiscountModal(true);
  };

  const handleEditDiscount = (discount) => {
    setEditingDiscount(discount);
    setDiscountForm({
      student_id: discount.student_id,
      discount_name: discount.discount_name,
      discount_type: discount.discount_type,
      discount_value: discount.discount_value,
      applies_to: discount.applies_to,
      duration: discount.duration,
      start_date: discount.start_date || '',
      end_date: discount.end_date || '',
      max_discount_amount: discount.max_discount_amount || '',
      reason: discount.reason || ''
    });
    setShowDiscountModal(true);
  };

  const handleSaveDiscount = async () => {
    if (!discountForm.student_id || !discountForm.discount_name || !discountForm.discount_value) {
      alert('Please fill in required fields');
      return;
    }
    try {
      if (editingDiscount) {
        await axios.put(`${API_BASE_URL}/student_discounts.php?id=${editingDiscount.id}`, discountForm);
      } else {
        await axios.post(`${API_BASE_URL}/student_discounts.php`, discountForm);
      }
      fetchDiscounts();
      setShowDiscountModal(false);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save discount');
    }
  };

  const handleDeleteDiscount = async (id) => {
    if (!confirm('Delete this discount?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/student_discounts.php?id=${id}`);
      fetchDiscounts();
    } catch (error) {
      alert('Failed to delete discount');
    }
  };

  const handleToggleDiscount = async (discount) => {
    try {
      await axios.put(`${API_BASE_URL}/student_discounts.php?id=${discount.id}`, {
        ...discount,
        is_active: discount.is_active == 1 ? 0 : 1
      });
      fetchDiscounts();
    } catch (error) {
      alert('Failed to update discount');
    }
  };

  // Rule handlers
  const handleAddRule = () => {
    setEditingRule(null);
    setRuleForm({
      rule_name: '',
      rule_type: 'sibling',
      condition_type: 'sibling_count',
      condition_value: '',
      discount_type: 'percentage',
      discount_value: '',
      applies_to: 'tuition',
      priority: 0
    });
    setShowRuleModal(true);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setRuleForm({
      rule_name: rule.rule_name,
      rule_type: rule.rule_type,
      condition_type: rule.condition_type || '',
      condition_value: rule.condition_value || '',
      discount_type: rule.discount_type,
      discount_value: rule.discount_value,
      applies_to: rule.applies_to,
      priority: rule.priority || 0
    });
    setShowRuleModal(true);
  };

  const handleSaveRule = async () => {
    if (!ruleForm.rule_name || !ruleForm.discount_value) {
      alert('Please fill in required fields');
      return;
    }
    try {
      if (editingRule) {
        await axios.put(`${API_BASE_URL}/student_discounts.php?action=rule&id=${editingRule.id}`, ruleForm);
      } else {
        await axios.post(`${API_BASE_URL}/student_discounts.php?action=create_rule`, ruleForm);
      }
      fetchRules();
      setShowRuleModal(false);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save rule');
    }
  };

  const handleDeleteRule = async (id) => {
    if (!confirm('Delete this discount rule?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/student_discounts.php?action=rule&id=${id}`);
      fetchRules();
    } catch (error) {
      alert('Failed to delete rule');
    }
  };

  // Sibling handlers
  const handleLinkSiblings = () => {
    setSiblingForm({ student_ids: [], group_name: '' });
    setShowSiblingModal(true);
  };

  const handleSaveSiblings = async () => {
    if (siblingForm.student_ids.length < 2) {
      alert('Select at least 2 students to link as siblings');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/student_discounts.php?action=add_sibling`, {
        student_ids: siblingForm.student_ids,
        group_name: siblingForm.group_name
      });
      fetchSiblingGroups();
      fetchDiscounts(); // Refresh to show auto-applied discounts
      setShowSiblingModal(false);
      alert('Siblings linked! Discounts will be auto-applied based on rules.');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to link siblings');
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSiblingForm(prev => ({
      ...prev,
      student_ids: prev.student_ids.includes(studentId)
        ? prev.student_ids.filter(id => id !== studentId)
        : [...prev.student_ids, studentId]
    }));
  };

  const filteredDiscounts = (discounts || []).filter(d => 
    d.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.discount_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Active Discounts', value: discounts.filter(d => d.is_active == 1).length, color: 'bg-green-500', icon: CheckCircle },
    { label: 'Total Students', value: [...new Set(discounts.map(d => d.student_id))].length, color: 'bg-blue-500', icon: Users },
    { label: 'Sibling Groups', value: siblingGroups.length, color: 'bg-purple-500', icon: UserPlus },
    { label: 'Discount Rules', value: rules.filter(r => r.is_active == 1).length, color: 'bg-orange-500', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Discounts</h1>
          <p className="text-gray-600">Manage one-time and permanent discounts for students</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleLinkSiblings} className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Link Siblings
          </button>
          <button onClick={handleAddDiscount} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Discount
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          {['discounts', 'rules', 'siblings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 border-b-2 font-medium capitalize ${
                activeTab === tab 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Discounts Tab */}
      {activeTab === 'discounts' && (
        <div className="card">
          <div className="p-4 border-b flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search discounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applies To</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                ) : filteredDiscounts.length === 0 ? (
                  <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No discounts found</td></tr>
                ) : (
                  filteredDiscounts.map(discount => (
                    <tr key={discount.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{discount.student_name}</p>
                          <p className="text-xs text-gray-500">{discount.class_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-blue-600" />
                          <span>{discount.discount_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">
                          {discount.discount_type === 'percentage' 
                            ? `${discount.discount_value}%` 
                            : `$${discount.discount_value}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs capitalize">{discount.applies_to}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs capitalize ${
                          discount.duration === 'permanent' ? 'bg-green-100 text-green-700' :
                          discount.duration === 'one_time' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {discount.duration.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => handleToggleDiscount(discount)}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            discount.is_active == 1 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {discount.is_active == 1 ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEditDiscount(discount)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteDiscount(discount.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
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
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="card">
          <div className="p-4 border-b flex justify-between items-center">
            <div>
              <h3 className="font-medium">Automatic Discount Rules</h3>
              <p className="text-sm text-gray-500">Rules are auto-applied when conditions are met (e.g., sibling discounts)</p>
            </div>
            <button onClick={handleAddRule} className="btn btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Rule
            </button>
          </div>
          <div className="divide-y">
            {rules.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No discount rules configured</div>
            ) : (
              rules.map(rule => (
                <div key={rule.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      rule.rule_type === 'sibling' ? 'bg-purple-100' :
                      rule.rule_type === 'scholarship' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      {rule.discount_type === 'percentage' 
                        ? <Percent className={`w-5 h-5 ${rule.rule_type === 'sibling' ? 'text-purple-600' : 'text-blue-600'}`} />
                        : <DollarSign className={`w-5 h-5 ${rule.rule_type === 'sibling' ? 'text-purple-600' : 'text-blue-600'}`} />
                      }
                    </div>
                    <div>
                      <p className="font-medium">{rule.rule_name}</p>
                      <p className="text-sm text-gray-500">
                        {rule.rule_type === 'sibling' && rule.condition_value && `Child #${rule.condition_value}+`}
                        {' • '}
                        {rule.discount_type === 'percentage' ? `${rule.discount_value}%` : `$${rule.discount_value}`} off {rule.applies_to}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${rule.is_active == 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {rule.is_active == 1 ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => handleEditRule(rule)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteRule(rule.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Siblings Tab */}
      {activeTab === 'siblings' && (
        <div className="card">
          <div className="p-4 border-b flex justify-between items-center">
            <div>
              <h3 className="font-medium">Sibling Groups</h3>
              <p className="text-sm text-gray-500">Students linked as siblings for automatic discount application</p>
            </div>
            <button onClick={handleLinkSiblings} className="btn btn-primary flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Link Siblings
            </button>
          </div>
          <div className="divide-y">
            {siblingGroups.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No sibling groups created</div>
            ) : (
              siblingGroups.map(group => (
                <div key={group.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">{group.group_name || `Family Group #${group.id}`}</p>
                        <p className="text-sm text-gray-500">{group.member_count} siblings</p>
                      </div>
                    </div>
                  </div>
                  {group.members && (
                    <div className="mt-2 ml-13 text-sm text-gray-600">
                      {group.members}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editingDiscount ? 'Edit' : 'Add'} Discount</h2>
              <button onClick={() => setShowDiscountModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <select
                  value={discountForm.student_id}
                  onChange={(e) => setDiscountForm({...discountForm, student_id: e.target.value})}
                  className="input w-full"
                  disabled={editingDiscount}
                >
                  <option value="">Select Student</option>
                  {(students || []).map(s => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Name *</label>
                <input
                  type="text"
                  value={discountForm.discount_name}
                  onChange={(e) => setDiscountForm({...discountForm, discount_name: e.target.value})}
                  className="input w-full"
                  placeholder="e.g., Sibling Discount, Scholarship"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={discountForm.discount_type}
                    onChange={(e) => setDiscountForm({...discountForm, discount_type: e.target.value})}
                    className="input w-full"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
                  <input
                    type="number"
                    value={discountForm.discount_value}
                    onChange={(e) => setDiscountForm({...discountForm, discount_value: e.target.value})}
                    className="input w-full"
                    placeholder={discountForm.discount_type === 'percentage' ? '10' : '100'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Applies To</label>
                  <select
                    value={discountForm.applies_to}
                    onChange={(e) => setDiscountForm({...discountForm, applies_to: e.target.value})}
                    className="input w-full"
                  >
                    <option value="tuition">Tuition Only</option>
                    <option value="all_fees">All Fees</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <select
                    value={discountForm.duration}
                    onChange={(e) => setDiscountForm({...discountForm, duration: e.target.value})}
                    className="input w-full"
                  >
                    <option value="permanent">Permanent (Forever)</option>
                    <option value="one_time">One-Time</option>
                    <option value="term">Current Term</option>
                    <option value="academic_year">Academic Year</option>
                  </select>
                </div>
              </div>

              {discountForm.discount_type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount Amount (Optional)</label>
                  <input
                    type="number"
                    value={discountForm.max_discount_amount}
                    onChange={(e) => setDiscountForm({...discountForm, max_discount_amount: e.target.value})}
                    className="input w-full"
                    placeholder="Cap the discount at this amount"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason/Notes</label>
                <textarea
                  value={discountForm.reason}
                  onChange={(e) => setDiscountForm({...discountForm, reason: e.target.value})}
                  className="input w-full"
                  rows={2}
                  placeholder="Reason for this discount"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button onClick={() => setShowDiscountModal(false)} className="btn bg-gray-200 hover:bg-gray-300">Cancel</button>
                <button onClick={handleSaveDiscount} className="btn btn-primary">
                  {editingDiscount ? 'Update' : 'Create'} Discount
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editingRule ? 'Edit' : 'Add'} Discount Rule</h2>
              <button onClick={() => setShowRuleModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name *</label>
                <input
                  type="text"
                  value={ruleForm.rule_name}
                  onChange={(e) => setRuleForm({...ruleForm, rule_name: e.target.value})}
                  className="input w-full"
                  placeholder="e.g., Second Child Discount"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rule Type</label>
                  <select
                    value={ruleForm.rule_type}
                    onChange={(e) => setRuleForm({...ruleForm, rule_type: e.target.value})}
                    className="input w-full"
                  >
                    <option value="sibling">Sibling Discount</option>
                    <option value="staff_child">Staff Child</option>
                    <option value="scholarship">Scholarship</option>
                    <option value="early_payment">Early Payment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {ruleForm.rule_type === 'sibling' ? 'Child Number (2=2nd, 3=3rd, etc.)' : 'Condition Value'}
                  </label>
                  <input
                    type="text"
                    value={ruleForm.condition_value}
                    onChange={(e) => setRuleForm({...ruleForm, condition_value: e.target.value})}
                    className="input w-full"
                    placeholder={ruleForm.rule_type === 'sibling' ? '2' : ''}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select
                    value={ruleForm.discount_type}
                    onChange={(e) => setRuleForm({...ruleForm, discount_type: e.target.value})}
                    className="input w-full"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    value={ruleForm.discount_value}
                    onChange={(e) => setRuleForm({...ruleForm, discount_value: e.target.value})}
                    className="input w-full"
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button onClick={() => setShowRuleModal(false)} className="btn bg-gray-200 hover:bg-gray-300">Cancel</button>
                <button onClick={handleSaveRule} className="btn btn-primary">
                  {editingRule ? 'Update' : 'Create'} Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Siblings Modal */}
      {showSiblingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Link Siblings</h2>
              <button onClick={() => setShowSiblingModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Family Name (Optional)</label>
                <input
                  type="text"
                  value={siblingForm.group_name}
                  onChange={(e) => setSiblingForm({...siblingForm, group_name: e.target.value})}
                  className="input w-full"
                  placeholder="e.g., Smith Family"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Students ({siblingForm.student_ids.length} selected)
                </label>
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {(students || []).map(student => (
                    <div
                      key={student.id}
                      onClick={() => toggleStudentSelection(student.id)}
                      className={`p-3 border-b cursor-pointer flex items-center justify-between ${
                        siblingForm.student_ids.includes(student.id) ? 'bg-purple-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{student.first_name} {student.last_name}</p>
                        <p className="text-xs text-gray-500">{student.student_id} • {student.class_name}</p>
                      </div>
                      {siblingForm.student_ids.includes(student.id) && (
                        <CheckCircle className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                <strong>Note:</strong> When siblings are linked, discount rules will be automatically applied based on birth order.
                The first child gets no discount, 2nd child gets the "Second Child Discount", etc.
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button onClick={() => setShowSiblingModal(false)} className="btn bg-gray-200 hover:bg-gray-300">Cancel</button>
                <button 
                  onClick={handleSaveSiblings} 
                  className="btn btn-primary"
                  disabled={siblingForm.student_ids.length < 2}
                >
                  Link {siblingForm.student_ids.length} Students as Siblings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
