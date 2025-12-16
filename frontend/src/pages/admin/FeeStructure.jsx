import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit, Trash2, DollarSign, X, Search, Download, Upload, Printer,
  Copy, Calculator, History, Percent, Users, Calendar, FileText, Settings,
  ChevronDown, ChevronUp, Check, AlertTriangle, RefreshCw, Eye, Tag
} from 'lucide-react';
import { feeGroupsAPI, feeItemsAPI, financeAPI, classesAPI, termsAPI } from '../../services/api';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useEducationLevels } from '../../hooks/useEducationLevels';

export default function FeeStructure() {
  const { levels: educationLevels, levelCodes: levels } = useEducationLevels();
  const [activeTab, setActiveTab] = useState('groups');
  const [feeGroups, setFeeGroups] = useState([]);
  const [feeItems, setFeeItems] = useState([]);
  const [feeRules, setFeeRules] = useState([]);
  const [installmentPlans, setInstallmentPlans] = useState([]);
  const [discountRules, setDiscountRules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  // Enhanced state
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('2024/2025');
  const [showCalculator, setShowCalculator] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [calculatedFees, setCalculatedFees] = useState([]);
  const [importData, setImportData] = useState([]);
  const [feeHistory, setFeeHistory] = useState([]);
  const fileInputRef = useRef();

  const academicYears = ['2023/2024', '2024/2025', '2025/2026'];

  const [groupForm, setGroupForm] = useState({ group_name: '', group_code: '', description: '', status: 'active' });
  const [itemForm, setItemForm] = useState({ fee_group_id: '', item_name: '', item_code: '', description: '', frequency: 'term', is_optional: 0, is_taxable: 0, tax_rate: 0, status: 'active' });
  const [ruleForm, setRuleForm] = useState({ fee_item_id: '', class_id: '', term_id: '', level: '', amount: '', currency: 'GHS', academic_year: '2024/2025', late_fee: 0, late_fee_type: 'fixed', is_active: 1 });
  const [planForm, setPlanForm] = useState({ 
    plan_name: '', 
    plan_code: '', 
    description: '', 
    installments: [{ percentage: 100, due_days: 0, label: 'Full Payment' }],
    is_default: 0,
    status: 'active' 
  });
  const [discountForm, setDiscountForm] = useState({
    name: '', code: '', type: 'percentage', value: 0, applies_to: 'all',
    fee_item_id: '', min_siblings: 0, early_payment_days: 0, status: 'active'
  });

  useEffect(() => {
    fetchData();
    fetchBaseData();
  }, [activeTab]);

  const fetchBaseData = async () => {
    try {
      const [classesRes, termsRes] = await Promise.all([
        classesAPI.getAll(),
        termsAPI.getAll()
      ]);
      setClasses(classesRes.data.classes || []);
      setTerms(termsRes.data.terms || []);
    } catch (error) {
      console.error('Error fetching base data:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'groups') {
        const response = await feeGroupsAPI.getAll();
        setFeeGroups(response.data.fee_groups || []);
      } else if (activeTab === 'items') {
        const response = await feeItemsAPI.getAll();
        setFeeItems(response.data.fee_items || []);
        const groupsResponse = await feeGroupsAPI.getAll();
        setFeeGroups(groupsResponse.data.fee_groups || []);
      } else if (activeTab === 'rules') {
        const response = await financeAPI.getFeeRules();
        setFeeRules(response.data.fee_rules || []);
        const itemsResponse = await feeItemsAPI.getAll();
        setFeeItems(itemsResponse.data.fee_items || []);
      } else if (activeTab === 'plans') {
        const response = await financeAPI.getInstallmentPlans();
        setInstallmentPlans(response.data.installment_plans || []);
      } else if (activeTab === 'discounts') {
        try {
          const response = await axios.get(`${API_BASE_URL}/finance.php?resource=discounts`);
          setDiscountRules(response.data.discounts || []);
        } catch (e) {
          setDiscountRules([]);
        }
        const itemsResponse = await feeItemsAPI.getAll();
        setFeeItems(itemsResponse.data.fee_items || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = () => {
    setModalType('group');
    setEditingItem(null);
    setGroupForm({ group_name: '', group_code: '', description: '', status: 'active' });
    setShowModal(true);
  };

  const handleAddItem = () => {
    setModalType('item');
    setEditingItem(null);
    setItemForm({ fee_group_id: '', item_name: '', item_code: '', description: '', frequency: 'term', is_optional: 0, status: 'active' });
    setShowModal(true);
  };

  const handleAddRule = () => {
    setModalType('rule');
    setEditingItem(null);
    setRuleForm({ fee_item_id: '', level: '', amount: '', academic_year: '2024/2025', is_active: 1 });
    setShowModal(true);
  };

  const handleAddPlan = () => {
    setModalType('plan');
    setEditingItem(null);
    setPlanForm({ 
      plan_name: '', 
      plan_code: '', 
      description: '', 
      installments: [{ percentage: 100, due_days: 0, label: 'Full Payment' }],
      is_default: 0,
      status: 'active' 
    });
    setShowModal(true);
  };

  const handleSubmitGroup = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await feeGroupsAPI.update(editingItem.id, groupForm);
      } else {
        await feeGroupsAPI.create(groupForm);
      }
      setShowModal(false);
      fetchData();
      alert('Fee group saved successfully!');
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSubmitItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await feeItemsAPI.update(editingItem.id, itemForm);
      } else {
        await feeItemsAPI.create(itemForm);
      }
      setShowModal(false);
      fetchData();
      alert('Fee item saved successfully!');
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSubmitRule = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting rule form:', ruleForm);
      if (editingItem) {
        await financeAPI.updateFeeRule(editingItem.id, ruleForm);
      } else {
        await financeAPI.createFeeRule(ruleForm);
      }
      setShowModal(false);
      fetchData();
      alert('Fee rule saved successfully!');
    } catch (error) {
      console.error('Error saving rule:', error);
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSubmitPlan = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...planForm,
        installments: JSON.stringify(planForm.installments)
      };
      if (editingItem) {
        await financeAPI.updateInstallmentPlan(editingItem.id, data);
      } else {
        await financeAPI.createInstallmentPlan(data);
      }
      setShowModal(false);
      fetchData();
      alert('Installment plan saved successfully!');
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      if (type === 'group') await feeGroupsAPI.delete(id);
      else if (type === 'item') await feeItemsAPI.delete(id);
      else if (type === 'rule') await financeAPI.deleteFeeRule(id);
      else if (type === 'plan') await financeAPI.deleteInstallmentPlan(id);
      else if (type === 'discount') await axios.delete(`${API_BASE_URL}/finance.php?resource=discounts&id=${id}`);
      fetchData();
      alert('Deleted successfully!');
    } catch (error) {
      alert('Error deleting: ' + error.message);
    }
  };

  const handleAddDiscount = () => {
    setModalType('discount');
    setEditingItem(null);
    setDiscountForm({ name: '', code: '', type: 'percentage', value: 0, applies_to: 'all', fee_item_id: '', min_siblings: 0, early_payment_days: 0, status: 'active' });
    setShowModal(true);
  };

  const handleSubmitDiscount = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`${API_BASE_URL}/finance.php?resource=discounts&id=${editingItem.id}`, discountForm);
      } else {
        await axios.post(`${API_BASE_URL}/finance.php?resource=discounts`, discountForm);
      }
      setShowModal(false);
      fetchData();
      alert('Discount rule saved!');
    } catch (error) {
      alert('Error saving discount');
    }
  };

  const handleDuplicateRule = (rule) => {
    setEditingItem(null);
    setRuleForm({
      ...rule,
      academic_year: yearFilter || '2024/2025',
      is_active: 1
    });
    setModalType('rule');
    setShowModal(true);
  };

  const handleCopyToYear = async (targetYear) => {
    if (!window.confirm(`Copy all fee rules to ${targetYear}?`)) return;
    try {
      await axios.post(`${API_BASE_URL}/finance.php?action=copy_rules`, {
        source_year: yearFilter,
        target_year: targetYear
      });
      alert('Fee rules copied successfully!');
      fetchData();
    } catch (error) {
      alert('Error copying rules');
    }
  };

  const handleExportFeeStructure = () => {
    const data = {
      groups: feeGroups,
      items: feeItems,
      rules: feeRules,
      plans: installmentPlans,
      discounts: discountRules,
      exported_at: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee_structure_${yearFilter.replace('/', '-')}.json`;
    a.click();
  };

  const handleExportCSV = () => {
    let csv = '';
    if (activeTab === 'rules') {
      csv = 'Fee Item,Level,Class,Term,Amount,Currency,Academic Year,Status\n';
      csv += filteredRules.map(r => 
        `"${r.item_name}","${r.level || 'All'}","${r.class_name || 'All'}","${r.term_name || 'All'}",${r.amount},${r.currency || 'GHS'},"${r.academic_year}",${r.is_active == 1 ? 'Active' : 'Inactive'}`
      ).join('\n');
    } else if (activeTab === 'items') {
      csv = 'Item Name,Code,Group,Frequency,Type,Status\n';
      csv += filteredItems.map(i => 
        `"${i.item_name}","${i.item_code}","${i.group_name}","${i.frequency}",${i.is_optional == 1 ? 'Optional' : 'Mandatory'},${i.status}`
      ).join('\n');
    } else if (activeTab === 'groups') {
      csv = 'Group Name,Code,Description,Status\n';
      csv += filteredGroups.map(g => 
        `"${g.group_name}","${g.group_code}","${g.description || ''}",${g.status}`
      ).join('\n');
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = lines.slice(1).map(line => {
        const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = (values[i] || '').replace(/"/g, '').trim();
        });
        return obj;
      });
      setImportData(data);
      setShowImportModal(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    try {
      for (const item of importData) {
        if (activeTab === 'rules') {
          const feeItem = feeItems.find(f => f.item_name === item['Fee Item']);
          if (feeItem) {
            await financeAPI.createFeeRule({
              fee_item_id: feeItem.id,
              level: item['Level'] === 'All' ? '' : item['Level']?.toLowerCase(),
              amount: parseFloat(item['Amount']) || 0,
              academic_year: item['Academic Year'] || yearFilter,
              is_active: item['Status'] === 'Active' ? 1 : 0
            });
          }
        }
      }
      setShowImportModal(false);
      setImportData([]);
      fetchData();
      alert('Import completed!');
    } catch (error) {
      alert('Error importing: ' + error.message);
    }
  };

  const handlePrintFeeStructure = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Fee Structure - ${yearFilter}</title>
      <style>
        body { font-family: Arial; padding: 30px; }
        h1 { color: #1f2937; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #2563eb; color: white; }
        .section { margin-top: 30px; }
        .total { font-weight: bold; background: #f3f4f6; }
      </style></head><body>
      <h1>Fee Structure - ${yearFilter}</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      
      <div class="section">
        <h3>Fee Rules</h3>
        <table>
          <thead><tr><th>Fee Item</th><th>Level</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            ${filteredRules.map(r => `<tr><td>${r.item_name}</td><td>${r.level || 'All'}</td><td>GHS ${parseFloat(r.amount).toFixed(2)}</td><td>${r.is_active == 1 ? 'Active' : 'Inactive'}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="section">
        <h3>Installment Plans</h3>
        <table>
          <thead><tr><th>Plan Name</th><th>Installments</th><th>Status</th></tr></thead>
          <tbody>
            ${installmentPlans.map(p => {
              const inst = typeof p.installments === 'string' ? JSON.parse(p.installments) : p.installments;
              return `<tr><td>${p.plan_name}</td><td>${inst.map(i => `${i.percentage}% - ${i.label}`).join(', ')}</td><td>${p.status}</td></tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const calculateFees = () => {
    if (!selectedClass) {
      alert('Please select a class');
      return;
    }
    const classInfo = classes.find(c => c.id == selectedClass);
    const level = classInfo?.level || '';
    
    const applicableRules = feeRules.filter(r => 
      r.is_active == 1 && 
      r.academic_year === yearFilter &&
      (!r.level || r.level === level || r.level === '') &&
      (!r.class_id || r.class_id == selectedClass) &&
      (!r.term_id || r.term_id == selectedTerm || !selectedTerm)
    );
    
    const fees = applicableRules.map(r => ({
      item_name: r.item_name,
      amount: parseFloat(r.amount),
      level: r.level || 'All',
      is_optional: feeItems.find(i => i.id == r.fee_item_id)?.is_optional == 1
    }));
    
    setCalculatedFees(fees);
    setShowCalculator(true);
  };

  const getTotalFees = (includeOptional = true) => {
    return calculatedFees
      .filter(f => includeOptional || !f.is_optional)
      .reduce((sum, f) => sum + f.amount, 0);
  };

  // Filtering
  const filteredGroups = feeGroups.filter(g => 
    (!searchTerm || g.group_name?.toLowerCase().includes(searchTerm.toLowerCase()) || g.group_code?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!statusFilter || g.status === statusFilter)
  );

  const filteredItems = feeItems.filter(i => 
    (!searchTerm || i.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) || i.item_code?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!statusFilter || i.status === statusFilter)
  );

  const filteredRules = feeRules.filter(r => 
    (!searchTerm || r.item_name?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!levelFilter || r.level === levelFilter) &&
    (!yearFilter || r.academic_year === yearFilter) &&
    (!statusFilter || (statusFilter === 'active' ? r.is_active == 1 : r.is_active == 0))
  );

  const tabs = [
    { id: 'groups', label: 'Groups', icon: Tag },
    { id: 'items', label: 'Items', icon: FileText },
    { id: 'rules', label: 'Rules', icon: DollarSign },
    { id: 'plans', label: 'Installment Plans', icon: Calendar },
    { id: 'discounts', label: 'Discounts', icon: Percent },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Structure Management</h1>
          <p className="text-gray-600 mt-1">Manage fee groups, items, pricing rules, and discounts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setSelectedClass(''); setSelectedTerm(''); setShowCalculator(true); }} className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2">
            <Calculator className="w-4 h-4" /> Fee Calculator
          </button>
          <button onClick={handleExportCSV} className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={handlePrintFeeStructure} className="btn bg-gray-600 text-white hover:bg-gray-700 flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
          <input type="file" ref={fileInputRef} accept=".csv" onChange={handleImportCSV} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
            <Upload className="w-4 h-4" /> Import
          </button>
          <button onClick={() => {
            if (activeTab === 'groups') handleAddGroup();
            else if (activeTab === 'items') handleAddItem();
            else if (activeTab === 'rules') handleAddRule();
            else if (activeTab === 'discounts') handleAddDiscount();
            else handleAddPlan();
          }} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add {activeTab === 'groups' ? 'Group' : activeTab === 'items' ? 'Item' : activeTab === 'rules' ? 'Rule' : activeTab === 'discounts' ? 'Discount' : 'Plan'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-all ${
                activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Setup Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fee Structure Setup Guide</h3>
            <p className="text-gray-600 text-sm mb-4">Follow these steps to properly configure fee structures so students can see their applicable fees during enrollment.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Step 1 */}
              <div className={`p-4 rounded-lg border-2 ${feeGroups.length > 0 ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${feeGroups.length > 0 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    {feeGroups.length > 0 ? <Check className="w-4 h-4" /> : '1'}
                  </div>
                  <span className="font-medium text-sm">Create Fee Groups</span>
                </div>
                <p className="text-xs text-gray-500">Create groups for each class/grade (e.g., "Grade 1", "Grade 2"). Each group represents a class level.</p>
                <div className="mt-2 text-xs">
                  <span className={feeGroups.length > 0 ? 'text-green-600 font-medium' : 'text-orange-600'}>
                    {feeGroups.length > 0 ? `✓ ${feeGroups.length} groups created` : '⚠ No groups yet'}
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div className={`p-4 rounded-lg border-2 ${feeItems.length > 0 ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${feeItems.length > 0 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    {feeItems.length > 0 ? <Check className="w-4 h-4" /> : '2'}
                  </div>
                  <span className="font-medium text-sm">Add Fee Items</span>
                </div>
                <p className="text-xs text-gray-500">Add fee items under each group (e.g., "Tuition", "Books", "Uniform"). Assign items to their respective groups.</p>
                <div className="mt-2 text-xs">
                  <span className={feeItems.length > 0 ? 'text-green-600 font-medium' : 'text-orange-600'}>
                    {feeItems.length > 0 ? `✓ ${feeItems.length} items created` : '⚠ No items yet'}
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className={`p-4 rounded-lg border-2 ${feeRules.length > 0 ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${feeRules.length > 0 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    {feeRules.length > 0 ? <Check className="w-4 h-4" /> : '3'}
                  </div>
                  <span className="font-medium text-sm">Set Pricing Rules</span>
                </div>
                <p className="text-xs text-gray-500">Define amounts for each fee item per class/level. Set the academic year and term for each rule.</p>
                <div className="mt-2 text-xs">
                  <span className={feeRules.length > 0 ? 'text-green-600 font-medium' : 'text-orange-600'}>
                    {feeRules.length > 0 ? `✓ ${feeRules.length} rules configured` : '⚠ No rules yet'}
                  </span>
                </div>
              </div>

              {/* Step 4 */}
              <div className={`p-4 rounded-lg border-2 ${classes.length > 0 ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${classes.length > 0 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    {classes.length > 0 ? <Check className="w-4 h-4" /> : '4'}
                  </div>
                  <span className="font-medium text-sm">Link to Classes</span>
                </div>
                <p className="text-xs text-gray-500">Ensure classes are created in Academic → Classes. Rules can target specific classes or education levels.</p>
                <div className="mt-2 text-xs">
                  <span className={classes.length > 0 ? 'text-green-600 font-medium' : 'text-orange-600'}>
                    {classes.length > 0 ? `✓ ${classes.length} classes available` : '⚠ No classes yet'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800">
                  <strong>Important:</strong> For students to see their fees during enrollment, ensure:
                  <ul className="list-disc ml-4 mt-1 space-y-1">
                    <li>Fee rules have the correct <strong>academic year</strong> selected (e.g., 2024/2025)</li>
                    <li>Rules are set to <strong>Active</strong> status</li>
                    <li>Either assign rules to specific <strong>classes</strong> OR use <strong>education levels</strong> (e.g., primary, jhs, shs)</li>
                    <li>Use the <strong>Fee Calculator</strong> button above to preview what students will see</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10 w-full" />
          </div>
          {activeTab === 'rules' && (
            <>
              <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="input w-auto">
                {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="input w-auto">
                <option value="">All Levels</option>
                {levels.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
              </select>
              <button onClick={() => handleCopyToYear(academicYears.find(y => y !== yearFilter))} className="btn bg-orange-500 text-white hover:bg-orange-600 text-sm">
                <Copy className="w-4 h-4 mr-1" /> Copy to New Year
              </button>
            </>
          )}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Fee Groups Tab */}
      {activeTab === 'groups' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredGroups.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No fee groups found</td></tr>
              ) : filteredGroups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{group.group_name}</td>
                  <td className="px-6 py-4 font-mono text-sm">{group.group_code}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{group.description || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${group.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {group.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingItem(group); setGroupForm(group); setModalType('group'); setShowModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete('group', group.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Fee Items Tab */}
      {activeTab === 'items' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredItems.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No fee items found</td></tr>
              ) : filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.item_name}</td>
                  <td className="px-6 py-4 font-mono text-sm">{item.item_code}</td>
                  <td className="px-6 py-4 text-sm">{item.group_name}</td>
                  <td className="px-6 py-4 text-sm capitalize">{item.frequency}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${item.is_optional == 1 ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {item.is_optional == 1 ? 'Optional' : 'Mandatory'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingItem(item); setItemForm(item); setModalType('item'); setShowModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete('item', item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Fee Rules Tab */}
      {activeTab === 'rules' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Item</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Late Fee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRules.length === 0 ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">No fee rules found</td></tr>
              ) : filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{rule.item_name}</td>
                  <td className="px-4 py-3 text-sm">{rule.level ? (educationLevels.find(l => l.level_code === rule.level)?.level_name || rule.level.toUpperCase()) : 'All Levels'}</td>
                  <td className="px-4 py-3 text-sm">{rule.class_name || 'All'}</td>
                  <td className="px-4 py-3 font-semibold text-green-600">GHS {parseFloat(rule.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-orange-600">{rule.late_fee ? `GHS ${rule.late_fee}` : '-'}</td>
                  <td className="px-4 py-3 text-sm">{rule.academic_year}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${rule.is_active == 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {rule.is_active == 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => { 
                        console.log('Editing rule:', rule);
                        console.log('Rule level from DB:', rule.level);
                        console.log('Available education levels:', educationLevels.map(l => l.level_code));
                        setEditingItem(rule); 
                        setRuleForm({...rule, level: rule.level || ''}); 
                        setModalType('rule'); 
                        setShowModal(true); 
                      }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDuplicateRule(rule)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Duplicate">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete('rule', rule.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Discounts Tab */}
      {activeTab === 'discounts' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applies To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {discountRules.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">No discount rules found</td></tr>
              ) : discountRules.map((discount) => (
                <tr key={discount.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{discount.name}</td>
                  <td className="px-6 py-4 font-mono text-sm">{discount.code}</td>
                  <td className="px-6 py-4 text-sm capitalize">{discount.type}</td>
                  <td className="px-6 py-4 font-semibold text-purple-600">
                    {discount.type === 'percentage' ? `${discount.value}%` : `GHS ${discount.value}`}
                  </td>
                  <td className="px-6 py-4 text-sm capitalize">{discount.applies_to}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${discount.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {discount.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingItem(discount); setDiscountForm(discount); setModalType('discount'); setShowModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete('discount', discount.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Installment Plans Tab - Keep existing */}
      {activeTab === 'plans' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Installments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Default</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {installmentPlans.map((plan) => {
                const installments = typeof plan.installments === 'string' ? JSON.parse(plan.installments) : plan.installments;
                return (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{plan.plan_name}</td>
                    <td className="px-6 py-4 font-mono text-sm">{plan.plan_code}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{plan.description || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      {installments.map((inst, idx) => (
                        <div key={idx} className="text-xs">{inst.percentage}% - {inst.label} ({inst.due_days} days)</div>
                      ))}
                    </td>
                    <td className="px-6 py-4">
                      {plan.is_default == 1 && <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Default</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{plan.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => { 
                          const parsedInstallments = typeof plan.installments === 'string' ? JSON.parse(plan.installments) : plan.installments;
                          setEditingItem(plan); setPlanForm({...plan, installments: parsedInstallments}); setModalType('plan'); setShowModal(true); 
                        }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete('plan', plan.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Fee Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Calculator className="w-5 h-5" /> Fee Calculator</h2>
              <button onClick={() => setShowCalculator(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Class *</label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="input">
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Term</label>
                <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} className="input">
                  <option value="">All Terms</option>
                  {terms.map(t => <option key={t.id} value={t.id}>{t.term_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Academic Year</label>
                <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="input">
                  {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <button onClick={calculateFees} className="btn btn-primary w-full mb-4">Calculate Fees</button>
            
            {calculatedFees.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm">Fee Item</th>
                      <th className="px-4 py-2 text-left text-sm">Type</th>
                      <th className="px-4 py-2 text-right text-sm">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {calculatedFees.map((fee, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2">{fee.item_name}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 text-xs rounded ${fee.is_optional ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {fee.is_optional ? 'Optional' : 'Mandatory'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right font-medium">GHS {fee.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td colSpan="2" className="px-4 py-2">Mandatory Total</td>
                      <td className="px-4 py-2 text-right text-green-600">GHS {getTotalFees(false).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan="2" className="px-4 py-2">Total (with Optional)</td>
                      <td className="px-4 py-2 text-right text-blue-600">GHS {getTotalFees(true).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Preview Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Import Preview ({importData.length} rows)</h2>
              <button onClick={() => { setShowImportModal(false); setImportData([]); }}><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>{Object.keys(importData[0] || {}).map(h => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {importData.slice(0, 20).map((row, idx) => (
                    <tr key={idx}>{Object.values(row).map((v, i) => <td key={i} className="px-3 py-2">{v}</td>)}</tr>
                  ))}
                </tbody>
              </table>
              {importData.length > 20 && <p className="text-sm text-gray-500 mt-2">Showing first 20 of {importData.length} rows</p>}
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
              <button onClick={() => { setShowImportModal(false); setImportData([]); }} className="btn bg-gray-200">Cancel</button>
              <button onClick={handleConfirmImport} className="btn btn-primary">Import {importData.length} Records</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">
                {editingItem ? 'Edit' : 'Add'} {modalType === 'group' ? 'Fee Group' : modalType === 'item' ? 'Fee Item' : modalType === 'rule' ? 'Fee Rule' : modalType === 'discount' ? 'Discount' : 'Installment Plan'}
              </h2>
              <button onClick={() => setShowModal(false)}><X className="w-6 h-6" /></button>
            </div>

            {modalType === 'group' && (
              <form onSubmit={handleSubmitGroup} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Group Name *</label>
                    <input type="text" required value={groupForm.group_name} onChange={(e) => setGroupForm({...groupForm, group_name: e.target.value})} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Group Code *</label>
                    <input type="text" required value={groupForm.group_code} onChange={(e) => setGroupForm({...groupForm, group_code: e.target.value})} className="input" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea value={groupForm.description} onChange={(e) => setGroupForm({...groupForm, description: e.target.value})} className="input" rows="3" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select value={groupForm.status} onChange={(e) => setGroupForm({...groupForm, status: e.target.value})} className="input">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button type="button" onClick={() => setShowModal(false)} className="btn bg-gray-200">Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            )}

            {modalType === 'item' && (
              <form onSubmit={handleSubmitItem} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Fee Group *</label>
                    <select required value={itemForm.fee_group_id} onChange={(e) => setItemForm({...itemForm, fee_group_id: e.target.value})} className="input">
                      <option value="">Select Group</option>
                      {feeGroups.map(g => <option key={g.id} value={g.id}>{g.group_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Item Code *</label>
                    <input type="text" required value={itemForm.item_code} onChange={(e) => setItemForm({...itemForm, item_code: e.target.value})} className="input" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Item Name *</label>
                    <input type="text" required value={itemForm.item_name} onChange={(e) => setItemForm({...itemForm, item_name: e.target.value})} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Frequency</label>
                    <select value={itemForm.frequency} onChange={(e) => setItemForm({...itemForm, frequency: e.target.value})} className="input">
                      <option value="term">Term</option>
                      <option value="session">Session</option>
                      <option value="monthly">Monthly</option>
                      <option value="one-time">One-time</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <select value={itemForm.is_optional} onChange={(e) => setItemForm({...itemForm, is_optional: e.target.value})} className="input">
                      <option value="0">Mandatory</option>
                      <option value="1">Optional</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button type="button" onClick={() => setShowModal(false)} className="btn bg-gray-200">Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            )}

            {modalType === 'rule' && (
              <form onSubmit={handleSubmitRule} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Fee Item *</label>
                    <select required value={ruleForm.fee_item_id} onChange={(e) => setRuleForm({...ruleForm, fee_item_id: e.target.value})} className="input">
                      <option value="">Select Item</option>
                      {feeItems.map(i => <option key={i.id} value={i.id}>{i.item_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Level</label>
                    <select value={ruleForm.level} onChange={(e) => setRuleForm({...ruleForm, level: e.target.value})} className="input">
                      <option value="">All Levels</option>
                      {educationLevels.map(l => <option key={l.id} value={l.level_code}>{l.level_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount (GHS) *</label>
                    <input type="number" step="0.01" required value={ruleForm.amount} onChange={(e) => setRuleForm({...ruleForm, amount: e.target.value})} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Academic Year</label>
                    <input type="text" value={ruleForm.academic_year} onChange={(e) => setRuleForm({...ruleForm, academic_year: e.target.value})} className="input" />
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button type="button" onClick={() => setShowModal(false)} className="btn bg-gray-200">Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            )}

            {modalType === 'plan' && (
              <form onSubmit={handleSubmitPlan} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Plan Name *</label>
                    <input type="text" required value={planForm.plan_name} onChange={(e) => setPlanForm({...planForm, plan_name: e.target.value})} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Plan Code *</label>
                    <input type="text" required value={planForm.plan_code} onChange={(e) => setPlanForm({...planForm, plan_code: e.target.value})} className="input" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea value={planForm.description} onChange={(e) => setPlanForm({...planForm, description: e.target.value})} className="input" rows="2" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Installments *</label>
                    <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
                      {planForm.installments.map((inst, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-3">
                            <label className="block text-xs mb-1">Percentage</label>
                            <input 
                              type="number" 
                              required 
                              min="1" 
                              max="100"
                              value={inst.percentage} 
                              onChange={(e) => {
                                const newInst = [...planForm.installments];
                                newInst[idx].percentage = parseInt(e.target.value) || 0;
                                setPlanForm({...planForm, installments: newInst});
                              }} 
                              className="input text-sm" 
                            />
                          </div>
                          <div className="col-span-3">
                            <label className="block text-xs mb-1">Due Days</label>
                            <input 
                              type="number" 
                              required 
                              min="0"
                              value={inst.due_days} 
                              onChange={(e) => {
                                const newInst = [...planForm.installments];
                                newInst[idx].due_days = parseInt(e.target.value) || 0;
                                setPlanForm({...planForm, installments: newInst});
                              }} 
                              className="input text-sm" 
                            />
                          </div>
                          <div className="col-span-5">
                            <label className="block text-xs mb-1">Label</label>
                            <input 
                              type="text" 
                              required 
                              value={inst.label} 
                              onChange={(e) => {
                                const newInst = [...planForm.installments];
                                newInst[idx].label = e.target.value;
                                setPlanForm({...planForm, installments: newInst});
                              }} 
                              className="input text-sm" 
                            />
                          </div>
                          <div className="col-span-1">
                            {planForm.installments.length > 1 && (
                              <button 
                                type="button"
                                onClick={() => {
                                  const newInst = planForm.installments.filter((_, i) => i !== idx);
                                  setPlanForm({...planForm, installments: newInst});
                                }}
                                className="btn bg-red-100 text-red-600 hover:bg-red-200 p-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      <button 
                        type="button"
                        onClick={() => {
                          setPlanForm({
                            ...planForm, 
                            installments: [...planForm.installments, { percentage: 0, due_days: 0, label: '' }]
                          });
                        }}
                        className="btn bg-blue-100 text-blue-600 hover:bg-blue-200 text-sm w-full"
                      >
                        <Plus className="w-4 h-4 inline mr-1" /> Add Installment
                      </button>
                      <p className="text-xs text-gray-600 mt-2">
                        Total: {planForm.installments.reduce((sum, inst) => sum + (inst.percentage || 0), 0)}% (must equal 100%)
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={planForm.is_default == 1} 
                        onChange={(e) => setPlanForm({...planForm, is_default: e.target.checked ? 1 : 0})} 
                        className="rounded"
                      />
                      <span className="text-sm font-medium">Set as Default Plan</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select value={planForm.status} onChange={(e) => setPlanForm({...planForm, status: e.target.value})} className="input">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button type="button" onClick={() => setShowModal(false)} className="btn bg-gray-200">Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Plan</button>
                </div>
              </form>
            )}

            {modalType === 'discount' && (
              <form onSubmit={handleSubmitDiscount} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Discount Name *</label>
                    <input type="text" required value={discountForm.name} onChange={(e) => setDiscountForm({...discountForm, name: e.target.value})} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Code *</label>
                    <input type="text" required value={discountForm.code} onChange={(e) => setDiscountForm({...discountForm, code: e.target.value})} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <select value={discountForm.type} onChange={(e) => setDiscountForm({...discountForm, type: e.target.value})} className="input">
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Value *</label>
                    <input type="number" step="0.01" required value={discountForm.value} onChange={(e) => setDiscountForm({...discountForm, value: e.target.value})} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Applies To</label>
                    <select value={discountForm.applies_to} onChange={(e) => setDiscountForm({...discountForm, applies_to: e.target.value})} className="input">
                      <option value="all">All Fees</option>
                      <option value="tuition">Tuition Only</option>
                      <option value="specific">Specific Item</option>
                      <option value="sibling">Sibling Discount</option>
                      <option value="early_payment">Early Payment</option>
                    </select>
                  </div>
                  {discountForm.applies_to === 'specific' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Fee Item</label>
                      <select value={discountForm.fee_item_id} onChange={(e) => setDiscountForm({...discountForm, fee_item_id: e.target.value})} className="input">
                        <option value="">Select Item</option>
                        {feeItems.map(i => <option key={i.id} value={i.id}>{i.item_name}</option>)}
                      </select>
                    </div>
                  )}
                  {discountForm.applies_to === 'sibling' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Min Siblings</label>
                      <input type="number" min="1" value={discountForm.min_siblings} onChange={(e) => setDiscountForm({...discountForm, min_siblings: e.target.value})} className="input" />
                    </div>
                  )}
                  {discountForm.applies_to === 'early_payment' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Days Before Due</label>
                      <input type="number" min="1" value={discountForm.early_payment_days} onChange={(e) => setDiscountForm({...discountForm, early_payment_days: e.target.value})} className="input" />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select value={discountForm.status} onChange={(e) => setDiscountForm({...discountForm, status: e.target.value})} className="input">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button type="button" onClick={() => setShowModal(false)} className="btn bg-gray-200">Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Discount</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
