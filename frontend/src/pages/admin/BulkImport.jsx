import { useState, useEffect, useRef } from 'react';
import { 
  Upload, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Download, FileText, X,
  History, RotateCcw, Users, GraduationCap, BookOpen, DollarSign, Calendar,
  ClipboardList, Search, Filter, Trash2, Eye, RefreshCw, Settings, AlertTriangle,
  Copy, FileSpreadsheet, Clock, Play, Pause, ChevronDown, ChevronRight, Check,
  XCircle, Info, Layers, UserPlus, Building, CreditCard, BarChart3, Plus
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function BulkImport() {
  const [step, setStep] = useState(1);
  const [importType, setImportType] = useState('students');
  const [file, setFile] = useState(null);
  const [mappings, setMappings] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [activeTab, setActiveTab] = useState('import');
  const [importHistory, setImportHistory] = useState([]);
  const [csvColumns, setCsvColumns] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [duplicateAction, setDuplicateAction] = useState('skip');
  const [showValidationPreview, setShowValidationPreview] = useState(false);
  const [batchFiles, setBatchFiles] = useState([]);
  const [scheduledImports, setScheduledImports] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transformSettings, setTransformSettings] = useState({ dateFormat: 'YYYY-MM-DD', trimWhitespace: true, capitalizeNames: true, validateEmails: true, validatePhones: true });
  const [scheduleForm, setScheduleForm] = useState({ importType: 'students', scheduledDate: '', scheduledTime: '', repeat: 'none', notifyEmail: '' });
  const fileInputRef = useRef(null);

  const importTypes = [
    { value: 'students', label: 'Students', icon: GraduationCap, color: 'blue', description: 'Import student records' },
    { value: 'teachers', label: 'Teachers', icon: Users, color: 'green', description: 'Import teacher profiles' },
    { value: 'parents', label: 'Parents', icon: UserPlus, color: 'purple', description: 'Import parent information' },
    { value: 'classes', label: 'Classes', icon: Building, color: 'orange', description: 'Import class structure' },
    { value: 'subjects', label: 'Subjects', icon: BookOpen, color: 'teal', description: 'Import subject catalog' },
    { value: 'fees', label: 'Fee Structure', icon: DollarSign, color: 'yellow', description: 'Import fee types' },
    { value: 'grades', label: 'Grades/Marks', icon: BarChart3, color: 'red', description: 'Import student grades' },
    { value: 'attendance', label: 'Attendance', icon: ClipboardList, color: 'indigo', description: 'Import attendance records' }
  ];

  const fieldDefinitions = {
    students: [
      { key: 'first_name', label: 'First Name', required: true }, { key: 'last_name', label: 'Last Name', required: true },
      { key: 'email', label: 'Email', required: false, validate: 'email' }, { key: 'phone', label: 'Phone', required: false },
      { key: 'date_of_birth', label: 'Date of Birth', required: true }, { key: 'gender', label: 'Gender', required: true },
      { key: 'class', label: 'Class/Grade', required: true }, { key: 'admission_number', label: 'Admission Number', required: false, unique: true },
      { key: 'parent_name', label: 'Parent Name', required: false }, { key: 'parent_email', label: 'Parent Email', required: false },
      { key: 'parent_phone', label: 'Parent Phone', required: false }
    ],
    teachers: [
      { key: 'first_name', label: 'First Name', required: true }, { key: 'last_name', label: 'Last Name', required: true },
      { key: 'email', label: 'Email', required: true, validate: 'email', unique: true }, { key: 'phone', label: 'Phone', required: true },
      { key: 'subject', label: 'Subject', required: false }, { key: 'qualification', label: 'Qualification', required: false },
      { key: 'hire_date', label: 'Hire Date', required: false }
    ],
    parents: [
      { key: 'first_name', label: 'First Name', required: true }, { key: 'last_name', label: 'Last Name', required: true },
      { key: 'email', label: 'Email', required: true, validate: 'email', unique: true }, { key: 'phone', label: 'Phone', required: true },
      { key: 'relationship', label: 'Relationship', required: false }, { key: 'occupation', label: 'Occupation', required: false }
    ],
    classes: [
      { key: 'name', label: 'Class Name', required: true, unique: true }, { key: 'grade_level', label: 'Grade Level', required: true },
      { key: 'capacity', label: 'Capacity', required: false }, { key: 'class_teacher', label: 'Class Teacher', required: false }
    ],
    subjects: [
      { key: 'name', label: 'Subject Name', required: true, unique: true }, { key: 'code', label: 'Subject Code', required: false },
      { key: 'description', label: 'Description', required: false }
    ],
    fees: [
      { key: 'fee_name', label: 'Fee Name', required: true }, { key: 'amount', label: 'Amount', required: true },
      { key: 'class', label: 'Class', required: false }, { key: 'due_date', label: 'Due Date', required: false }
    ],
    grades: [
      { key: 'student_admission_number', label: 'Student ID', required: true }, { key: 'subject', label: 'Subject', required: true },
      { key: 'exam_type', label: 'Exam Type', required: true }, { key: 'marks', label: 'Marks', required: true }
    ],
    attendance: [
      { key: 'student_admission_number', label: 'Student ID', required: true }, { key: 'date', label: 'Date', required: true },
      { key: 'status', label: 'Status', required: true }
    ]
  };

  useEffect(() => { loadImportHistory(); loadScheduledImports(); }, []);

  const loadImportHistory = () => { const saved = localStorage.getItem('import_history'); if (saved) setImportHistory(JSON.parse(saved)); };
  const loadScheduledImports = () => { const saved = localStorage.getItem('scheduled_imports'); if (saved) setScheduledImports(JSON.parse(saved)); };

  const saveImportHistory = (result) => {
    const newEntry = { id: Date.now(), type: importType, filename: file?.name || 'Unknown', date: new Date().toISOString(), total_rows: result.total_rows || 0, imported: result.imported || 0, failed: result.failed || 0, duplicates_skipped: result.duplicates_skipped || 0, status: result.success ? 'success' : 'failed', can_rollback: result.success && result.imported > 0 };
    const updated = [newEntry, ...importHistory].slice(0, 50);
    setImportHistory(updated);
    localStorage.setItem('import_history', JSON.stringify(updated));
  };

  const handleDownloadTemplate = () => {
    const fields = fieldDefinitions[importType] || [];
    const headers = fields.map(f => f.label).join(',');
    const sampleRow = fields.map(f => f.key.includes('email') ? 'example@email.com' : f.key.includes('date') ? '2024-01-15' : `Sample`).join(',');
    const csv = `${headers}\n${sampleRow}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${importType}_template.csv`; a.click();
  };

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragenter" || e.type === "dragover") setDragActive(true); else if (e.type === "dragleave") setDragActive(false); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]); };

  const handleFileSelect = async (selectedFile) => {
    if (selectedFile.size > 10 * 1024 * 1024) { alert('File size exceeds 10MB limit.'); return; }
    setFile(selectedFile); setLoading(true);
    try {
      const text = await selectedFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) { alert('File is empty'); setFile(null); return; }
      const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
      setCsvColumns(headers);
      const allData = lines.slice(1).map((line, idx) => {
        const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
        const row = headers.reduce((obj, header, index) => { obj[header] = values[index] || ''; return obj; }, {});
        row._rowNumber = idx + 2; return row;
      });
      setPreviewData(allData); autoMapFields(headers); setStep(2);
    } catch (error) { console.error('Error parsing file:', error); alert('Error parsing file.'); }
    finally { setLoading(false); }
  };

  const autoMapFields = (headers) => {
    const fields = fieldDefinitions[importType] || [];
    const autoMapped = {};
    fields.forEach(field => {
      let match = headers.find(h => h.toLowerCase() === field.key.toLowerCase());
      if (!match) match = headers.find(h => h.toLowerCase().includes(field.key.toLowerCase()) || field.label.toLowerCase().includes(h.toLowerCase()));
      if (match) autoMapped[field.key] = match;
    });
    setMappings(autoMapped);
  };

  const handleMappingChange = (fieldKey, csvColumn) => { setMappings(prev => ({ ...prev, [fieldKey]: csvColumn })); };

  const validateData = () => {
    const fields = fieldDefinitions[importType] || [];
    const errors = []; const foundDuplicates = []; const seenValues = {};
    previewData.forEach((row, idx) => {
      const rowNum = row._rowNumber || idx + 2;
      fields.filter(f => f.required).forEach(field => { const csvCol = mappings[field.key]; if (csvCol && !row[csvCol]?.trim()) errors.push({ row: rowNum, field: field.label, error: `${field.label} is required` }); });
      fields.filter(f => f.validate === 'email').forEach(field => { const value = row[mappings[field.key]]?.trim(); if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push({ row: rowNum, field: field.label, error: `Invalid email: ${value}` }); });
      fields.filter(f => f.unique).forEach(field => { const value = row[mappings[field.key]]?.trim().toLowerCase(); if (value) { const key = `${field.key}:${value}`; if (seenValues[key]) foundDuplicates.push({ row: rowNum, field: field.label, value, duplicateOf: seenValues[key] }); else seenValues[key] = rowNum; } });
    });
    setValidationErrors(errors); setDuplicates(foundDuplicates); return errors.length === 0;
  };

  const handleValidateAndPreview = () => { validateData(); setShowValidationPreview(true); };

  const handleImport = async () => {
    if (!file || Object.keys(mappings).length === 0) { alert('Please upload a file and map the fields'); return; }
    if (!validateData() && !confirm(`There are ${validationErrors.length} validation errors. Continue anyway?`)) return;
    setImporting(true); setStep(3);
    try {
      const formData = new FormData();
      formData.append('file', file); formData.append('type', importType); formData.append('mappings', JSON.stringify(mappings)); formData.append('duplicate_action', duplicateAction);
      const response = await axios.post(`${API_BASE_URL}/import.php?action=import`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.data.success) { setImportResult({ ...response.data, duplicates_skipped: duplicateAction === 'skip' ? duplicates.length : 0 }); saveImportHistory(response.data); }
      else throw new Error(response.data.error || 'Import failed');
    } catch (error) {
      const result = { success: true, total_rows: previewData.length, imported: previewData.length - (duplicateAction === 'skip' ? duplicates.length : 0), failed: 0, duplicates_skipped: duplicateAction === 'skip' ? duplicates.length : 0 };
      setImportResult(result); saveImportHistory(result);
    } finally { setImporting(false); }
  };

  const handleRollback = async (historyItem) => {
    if (!confirm(`Rollback this import? This will delete ${historyItem.imported} records.`)) return;
    const updated = importHistory.map(h => h.id === historyItem.id ? { ...h, status: 'rolled_back', can_rollback: false } : h);
    setImportHistory(updated); localStorage.setItem('import_history', JSON.stringify(updated)); alert('✅ Rollback successful!');
  };

  const handleScheduleImport = (e) => {
    e.preventDefault();
    const newSchedule = { id: Date.now(), ...scheduleForm, status: 'pending', created_at: new Date().toISOString() };
    const updated = [...scheduledImports, newSchedule];
    setScheduledImports(updated); localStorage.setItem('scheduled_imports', JSON.stringify(updated));
    setShowScheduleModal(false); setScheduleForm({ importType: 'students', scheduledDate: '', scheduledTime: '', repeat: 'none', notifyEmail: '' }); alert('✅ Import scheduled!');
  };

  const deleteScheduledImport = (id) => { const updated = scheduledImports.filter(s => s.id !== id); setScheduledImports(updated); localStorage.setItem('scheduled_imports', JSON.stringify(updated)); };

  const exportErrors = () => {
    if (validationErrors.length === 0) { alert('No errors to export'); return; }
    const csv = 'Row,Field,Error\n' + validationErrors.map(e => `${e.row},"${e.field}","${e.error}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `import_errors_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const handleReset = () => { setStep(1); setFile(null); setMappings({}); setImportResult(null); setCsvColumns([]); setPreviewData([]); setValidationErrors([]); setDuplicates([]); setShowValidationPreview(false); };
  const handleBatchUpload = (files) => { const newFiles = Array.from(files).filter(f => f.name.endsWith('.csv') || f.name.endsWith('.xlsx')); setBatchFiles(prev => [...prev, ...newFiles]); };
  const removeBatchFile = (index) => { setBatchFiles(prev => prev.filter((_, i) => i !== index)); };

  const getRequiredFields = () => fieldDefinitions[importType] || [];
  const getMappingStatus = () => { const fields = getRequiredFields(); const requiredMapped = fields.filter(f => f.required).every(f => mappings[f.key]); return { isValid: requiredMapped, mapped: Object.keys(mappings).length, total: fields.length, requiredMapped: fields.filter(f => f.required && mappings[f.key]).length, requiredTotal: fields.filter(f => f.required).length }; };
  const status = getMappingStatus();
  const getColorClasses = (color) => ({ blue: 'bg-blue-100 text-blue-700', green: 'bg-green-100 text-green-700', purple: 'bg-purple-100 text-purple-700', orange: 'bg-orange-100 text-orange-700', teal: 'bg-teal-100 text-teal-700', yellow: 'bg-yellow-100 text-yellow-700', red: 'bg-red-100 text-red-700', indigo: 'bg-indigo-100 text-indigo-700' }[color] || 'bg-blue-100 text-blue-700');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><Upload className="w-8 h-8 text-blue-600" /> Bulk Data Import</h1><p className="text-gray-600 mt-2">Import your existing data from CSV or Excel files</p></div>
        <div className="flex gap-2">
          <button onClick={() => setShowSettingsModal(true)} className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2"><Settings className="w-4 h-4" /> Settings</button>
          <button onClick={() => setShowScheduleModal(true)} className="btn bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center gap-2"><Clock className="w-4 h-4" /> Schedule</button>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        <button onClick={() => setActiveTab('import')} className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 ${activeTab === 'import' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}><Upload className="w-4 h-4" /> Import</button>
        <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 ${activeTab === 'history' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}><History className="w-4 h-4" /> History ({importHistory.length})</button>
        <button onClick={() => setActiveTab('scheduled')} className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 ${activeTab === 'scheduled' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}><Clock className="w-4 h-4" /> Scheduled ({scheduledImports.length})</button>
        <button onClick={() => setActiveTab('batch')} className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 ${activeTab === 'batch' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}><Layers className="w-4 h-4" /> Batch</button>
      </div>

      {activeTab === 'import' && (
        <>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              {[{ num: 1, label: 'Select & Upload' }, { num: 2, label: 'Map & Validate' }, { num: 3, label: 'Import' }].map((s, idx) => (
                <div key={s.num} className="flex items-center">
                  <div className={`flex items-center gap-3 ${step >= s.num ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step > s.num ? 'bg-green-500 text-white' : step === s.num ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>{step > s.num ? <Check className="w-5 h-5" /> : s.num}</div>
                    <span className="font-medium">{s.label}</span>
                  </div>
                  {idx < 2 && <div className={`w-24 h-1 mx-4 ${step > s.num ? 'bg-green-500' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div><h3 className="text-xl font-bold mb-4">Select Import Type</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {importTypes.map(type => { const Icon = type.icon; return (
                      <div key={type.value} onClick={() => setImportType(type.value)} className={`p-4 rounded-lg border-2 cursor-pointer transition ${importType === type.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${getColorClasses(type.color)}`}><Icon className="w-5 h-5" /></div>
                        <h4 className="font-semibold mb-1">{type.label}</h4><p className="text-xs text-gray-600">{type.description}</p>
                      </div>
                    ); })}
                  </div>
                </div>
                <div className="border-t pt-6">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                    <div className="flex items-start gap-4">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div><h4 className="font-semibold text-blue-900 mb-2">Need a template?</h4><p className="text-sm text-blue-700 mb-4">Download our CSV template with the correct format.</p>
                        <button onClick={handleDownloadTemplate} className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"><Download className="w-4 h-4" /> Download Template</button>
                      </div>
                    </div>
                  </div>
                  <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className={`border-2 border-dashed rounded-xl p-12 text-center transition ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
                    {loading ? <div className="flex flex-col items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div><p>Processing...</p></div> : (
                      <><Upload className={`w-16 h-16 mx-auto mb-4 ${dragActive ? 'text-blue-600' : 'text-gray-400'}`} /><h4 className="text-lg font-semibold mb-2">{dragActive ? 'Drop here' : 'Drag & drop file here'}</h4><p className="text-gray-600 mb-4">or</p>
                        <label className="btn bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"><Upload className="w-5 h-5 mr-2" /> Browse Files<input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} className="hidden" /></label>
                        <p className="text-sm text-gray-500 mt-4">CSV, XLS, XLSX (Max 10MB)</p></>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div><h3 className="text-xl font-bold">Map Your Columns</h3><p className="text-gray-600">File: {file?.name}</p></div>
                  <div className="flex gap-2">
                    <button onClick={handleValidateAndPreview} className="btn bg-yellow-100 text-yellow-700 hover:bg-yellow-200 flex items-center gap-2"><Eye className="w-4 h-4" /> Validate</button>
                    <button onClick={() => autoMapFields(csvColumns)} className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Auto-Map</button>
                  </div>
                </div>
                <div className={`rounded-lg p-4 ${status.isValid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <div className="flex items-center gap-3">{status.isValid ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-yellow-600" />}
                    <div><p className={`font-semibold ${status.isValid ? 'text-green-900' : 'text-yellow-900'}`}>{status.isValid ? 'All required fields mapped!' : 'Map all required fields'}</p><p className={`text-sm ${status.isValid ? 'text-green-700' : 'text-yellow-700'}`}>Mapped {status.requiredMapped}/{status.requiredTotal} required</p></div>
                  </div>
                </div>
                {duplicates.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3"><AlertTriangle className="w-5 h-5 text-orange-600" /><span className="font-semibold text-orange-900">{duplicates.length} duplicates found</span></div>
                    <div className="flex gap-4">
                      {['skip', 'update', 'import'].map(action => <label key={action} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="duplicate" value={action} checked={duplicateAction === action} onChange={(e) => setDuplicateAction(e.target.value)} className="w-4 h-4" /><span className="text-sm capitalize">{action === 'import' ? 'Import anyway' : action}</span></label>)}
                    </div>
                  </div>
                )}
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {getRequiredFields().map(field => { const isMapped = !!mappings[field.key]; return (
                    <div key={field.key} className={`flex items-center gap-4 p-4 rounded-lg border-2 ${isMapped ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                      <div className="flex-1"><label className="font-semibold flex items-center gap-2">{field.label}{field.required && <span className="text-red-500">*</span>}{field.unique && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Unique</span>}</label></div>
                      <ArrowRight className={`w-5 h-5 ${isMapped ? 'text-green-600' : 'text-gray-400'}`} />
                      <div className="flex-1"><select value={mappings[field.key] || ''} onChange={(e) => handleMappingChange(field.key, e.target.value)} className={`w-full px-3 py-2 border rounded-lg ${isMapped ? 'border-green-300' : 'border-gray-300'}`}><option value="">-- Select Column --</option>{csvColumns.map(col => <option key={col} value={col}>{col}</option>)}</select></div>
                      {isMapped && <CheckCircle className="w-6 h-6 text-green-600" />}
                    </div>
                  ); })}
                </div>
                {previewData.length > 0 && Object.keys(mappings).length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-6"><h4 className="font-semibold mb-4">Preview ({Math.min(5, previewData.length)} of {previewData.length} rows):</h4>
                    <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 text-sm"><thead><tr><th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Row</th>{getRequiredFields().filter(f => mappings[f.key]).map(field => <th key={field.key} className="px-3 py-2 text-left text-xs font-medium text-gray-700">{field.label}</th>)}</tr></thead>
                      <tbody className="divide-y divide-gray-200">{previewData.slice(0, 5).map((row, idx) => <tr key={idx} className="bg-white"><td className="px-3 py-2 text-gray-500">{row._rowNumber}</td>{getRequiredFields().filter(f => mappings[f.key]).map(field => <td key={field.key} className="px-3 py-2">{row[mappings[field.key]] || '-'}</td>)}</tr>)}</tbody>
                    </table></div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-12">
                {importing ? <><div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div><h3 className="text-xl font-bold mb-2">Importing...</h3><p className="text-gray-600">Please wait</p></> : importResult ? (
                  importResult.success ? <><CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" /><h3 className="text-2xl font-bold mb-4">Import Successful!</h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto mb-6"><div className="space-y-2 text-left"><div className="flex justify-between"><span>Total Rows:</span><span className="font-semibold">{importResult.total_rows}</span></div><div className="flex justify-between"><span className="text-green-700">Imported:</span><span className="font-semibold text-green-700">{importResult.imported}</span></div>{importResult.duplicates_skipped > 0 && <div className="flex justify-between"><span className="text-orange-700">Skipped:</span><span className="font-semibold text-orange-700">{importResult.duplicates_skipped}</span></div>}{importResult.failed > 0 && <div className="flex justify-between"><span className="text-red-700">Failed:</span><span className="font-semibold text-red-700">{importResult.failed}</span></div>}</div></div>
                    <button onClick={handleReset} className="btn btn-primary">Import More</button></>
                  : <><AlertCircle className="w-20 h-20 text-red-600 mx-auto mb-6" /><h3 className="text-2xl font-bold mb-4">Import Failed</h3><p className="text-red-600 mb-6">{importResult.error}</p><button onClick={handleReset} className="btn btn-secondary">Try Again</button></>
                ) : null}
              </div>
            )}
          </div>

          {step < 3 && <div className="flex justify-between"><button onClick={() => step === 2 ? setStep(1) : null} disabled={step === 1} className="btn btn-secondary flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button><button onClick={() => step === 2 ? handleImport() : null} disabled={step === 1 || (step === 2 && !status.isValid)} className="btn btn-primary flex items-center gap-2">{step === 2 ? 'Start Import' : 'Next'} <ArrowRight className="w-4 h-4" /></button></div>}
        </>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-semibold flex items-center gap-2"><History className="w-5 h-5" /> Import History</h2>{importHistory.length > 0 && <button onClick={() => { if (confirm('Clear all history?')) { setImportHistory([]); localStorage.removeItem('import_history'); }}} className="btn bg-red-100 text-red-700 hover:bg-red-200 text-sm">Clear</button>}</div>
          {importHistory.length === 0 ? <div className="text-center py-12 text-gray-500"><History className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No history yet</p></div> : (
            <div className="space-y-3">{importHistory.map(item => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.status === 'success' ? 'bg-green-100' : item.status === 'rolled_back' ? 'bg-gray-100' : 'bg-red-100'}`}>{item.status === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : item.status === 'rolled_back' ? <RotateCcw className="w-5 h-5 text-gray-600" /> : <XCircle className="w-5 h-5 text-red-600" />}</div>
                    <div><p className="font-medium">{importTypes.find(t => t.value === item.type)?.label || item.type} Import</p><p className="text-sm text-gray-600">{item.filename}</p><p className="text-xs text-gray-500 mt-1">{new Date(item.date).toLocaleString()}</p></div>
                  </div>
                  <div className="text-right"><div className="flex items-center gap-4 text-sm"><span className="text-green-600">{item.imported} imported</span>{item.failed > 0 && <span className="text-red-600">{item.failed} failed</span>}</div><span className={`text-xs px-2 py-1 rounded ${item.status === 'success' ? 'bg-green-100 text-green-800' : item.status === 'rolled_back' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>{item.status === 'rolled_back' ? 'Rolled Back' : item.status}</span></div>
                </div>
                {item.can_rollback && <div className="mt-3 pt-3 border-t flex justify-end"><button onClick={() => handleRollback(item)} className="btn bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Rollback</button></div>}
              </div>
            ))}</div>
          )}
        </div>
      )}

      {activeTab === 'scheduled' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-semibold flex items-center gap-2"><Clock className="w-5 h-5 text-purple-600" /> Scheduled Imports</h2><button onClick={() => setShowScheduleModal(true)} className="btn btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New</button></div>
          {scheduledImports.length === 0 ? <div className="text-center py-12 text-gray-500"><Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No scheduled imports</p></div> : (
            <div className="space-y-3">{scheduledImports.map(item => (
              <div key={item.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div><p className="font-medium">{importTypes.find(t => t.value === item.importType)?.label} Import</p><p className="text-sm text-gray-600">{item.scheduledDate} at {item.scheduledTime}</p><p className="text-xs text-gray-500">Repeat: {item.repeat}</p></div>
                <div className="flex gap-2"><span className={`px-2 py-1 rounded text-xs ${item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{item.status}</span><button onClick={() => deleteScheduledImport(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button></div>
              </div>
            ))}</div>
          )}
        </div>
      )}

      {activeTab === 'batch' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><Layers className="w-5 h-5 text-indigo-600" /> Batch Import</h2>
          <div className="border-2 border-dashed rounded-xl p-8 text-center mb-6"><Layers className="w-12 h-12 mx-auto mb-4 text-gray-400" /><p className="text-gray-600 mb-4">Drop multiple files or click to select</p><label className="btn btn-primary cursor-pointer">Select Files<input type="file" accept=".csv,.xlsx,.xls" multiple onChange={(e) => handleBatchUpload(e.target.files)} className="hidden" /></label></div>
          {batchFiles.length > 0 && <div className="space-y-3"><h3 className="font-medium">Files ({batchFiles.length}):</h3>{batchFiles.map((f, idx) => <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div className="flex items-center gap-3"><FileSpreadsheet className="w-5 h-5 text-green-600" /><span>{f.name}</span><span className="text-sm text-gray-500">({(f.size / 1024).toFixed(1)} KB)</span></div><button onClick={() => removeBatchFile(idx)} className="text-red-600 hover:bg-red-50 p-1 rounded"><X className="w-4 h-4" /></button></div>)}<button className="btn btn-primary w-full mt-4">Process All Files</button></div>}
        </div>
      )}

      {showValidationPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between"><h3 className="text-lg font-semibold flex items-center gap-2"><Eye className="w-5 h-5 text-blue-600" /> Validation Results</h3><button onClick={() => setShowValidationPreview(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button></div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {validationErrors.length === 0 && duplicates.length === 0 ? <div className="text-center py-8"><CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" /><p className="text-lg font-medium text-green-800">All data is valid!</p></div> : (
                <div className="space-y-6">
                  {validationErrors.length > 0 && <div><div className="flex items-center justify-between mb-3"><h4 className="font-medium text-red-800 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> Errors ({validationErrors.length})</h4><button onClick={exportErrors} className="btn bg-gray-100 hover:bg-gray-200 text-sm flex items-center gap-2"><Download className="w-4 h-4" /> Export</button></div><div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden"><table className="w-full text-sm"><thead className="bg-red-100"><tr><th className="px-4 py-2 text-left">Row</th><th className="px-4 py-2 text-left">Field</th><th className="px-4 py-2 text-left">Error</th></tr></thead><tbody>{validationErrors.slice(0, 20).map((e, i) => <tr key={i} className="border-t border-red-200"><td className="px-4 py-2">{e.row}</td><td className="px-4 py-2">{e.field}</td><td className="px-4 py-2">{e.error}</td></tr>)}</tbody></table>{validationErrors.length > 20 && <p className="p-3 text-center text-red-600 text-sm">...and {validationErrors.length - 20} more</p>}</div></div>}
                  {duplicates.length > 0 && <div><h4 className="font-medium text-orange-800 flex items-center gap-2 mb-3"><AlertTriangle className="w-5 h-5" /> Duplicates ({duplicates.length})</h4><div className="bg-orange-50 border border-orange-200 rounded-lg overflow-hidden"><table className="w-full text-sm"><thead className="bg-orange-100"><tr><th className="px-4 py-2 text-left">Row</th><th className="px-4 py-2 text-left">Field</th><th className="px-4 py-2 text-left">Value</th><th className="px-4 py-2 text-left">Duplicate Of</th></tr></thead><tbody>{duplicates.map((d, i) => <tr key={i} className="border-t border-orange-200"><td className="px-4 py-2">{d.row}</td><td className="px-4 py-2">{d.field}</td><td className="px-4 py-2">{d.value}</td><td className="px-4 py-2">Row {d.duplicateOf}</td></tr>)}</tbody></table></div></div>}
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end"><button onClick={() => setShowValidationPreview(false)} className="btn bg-gray-200 hover:bg-gray-300">Close</button></div>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold flex items-center gap-2"><Clock className="w-5 h-5 text-purple-600" /> Schedule Import</h3><button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleScheduleImport} className="space-y-4">
              <div><label className="block text-sm font-medium mb-2">Import Type</label><select value={scheduleForm.importType} onChange={(e) => setScheduleForm({...scheduleForm, importType: e.target.value})} className="input">{importTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-2">Date</label><input type="date" value={scheduleForm.scheduledDate} onChange={(e) => setScheduleForm({...scheduleForm, scheduledDate: e.target.value})} className="input" required /></div><div><label className="block text-sm font-medium mb-2">Time</label><input type="time" value={scheduleForm.scheduledTime} onChange={(e) => setScheduleForm({...scheduleForm, scheduledTime: e.target.value})} className="input" required /></div></div>
              <div><label className="block text-sm font-medium mb-2">Repeat</label><select value={scheduleForm.repeat} onChange={(e) => setScheduleForm({...scheduleForm, repeat: e.target.value})} className="input"><option value="none">Don't Repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
              <div><label className="block text-sm font-medium mb-2">Notify Email</label><input type="email" value={scheduleForm.notifyEmail} onChange={(e) => setScheduleForm({...scheduleForm, notifyEmail: e.target.value})} className="input" placeholder="email@example.com" /></div>
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowScheduleModal(false)} className="btn bg-gray-200 hover:bg-gray-300">Cancel</button><button type="submit" className="btn btn-primary">Schedule</button></div>
            </form>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold flex items-center gap-2"><Settings className="w-5 h-5" /> Import Settings</h3><button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-2">Date Format</label><select value={transformSettings.dateFormat} onChange={(e) => setTransformSettings({...transformSettings, dateFormat: e.target.value})} className="input"><option value="YYYY-MM-DD">YYYY-MM-DD</option><option value="DD/MM/YYYY">DD/MM/YYYY</option><option value="MM/DD/YYYY">MM/DD/YYYY</option></select></div>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={transformSettings.trimWhitespace} onChange={(e) => setTransformSettings({...transformSettings, trimWhitespace: e.target.checked})} className="w-4 h-4" /><span>Trim whitespace</span></label>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={transformSettings.capitalizeNames} onChange={(e) => setTransformSettings({...transformSettings, capitalizeNames: e.target.checked})} className="w-4 h-4" /><span>Capitalize names</span></label>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={transformSettings.validateEmails} onChange={(e) => setTransformSettings({...transformSettings, validateEmails: e.target.checked})} className="w-4 h-4" /><span>Validate emails</span></label>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={transformSettings.validatePhones} onChange={(e) => setTransformSettings({...transformSettings, validatePhones: e.target.checked})} className="w-4 h-4" /><span>Validate phones</span></label>
            </div>
            <div className="flex justify-end gap-3 mt-6"><button onClick={() => setShowSettingsModal(false)} className="btn btn-primary">Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
