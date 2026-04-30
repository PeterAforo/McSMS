import { useState } from 'react';
import { Upload, FileText, Check, X, AlertTriangle, Download, ChevronRight } from 'lucide-react';

export default function EnhancedCSVImport({ onImport, onCancel }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationResults, setValidationResults] = useState({ errors: [], warnings: [], valid: true });
  const [columnMapping, setColumnMapping] = useState({});
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState({ success: 0, errors: 0 });

  const expectedHeaders = [
    'type', 'group_code', 'group_name', 'group_description',
    'item_code', 'item_name', 'item_description', 'frequency', 'is_optional',
    'class_id', 'class_name', 'term_id', 'term_name', 'level', 'amount',
    'currency', 'academic_year', 'is_taxable', 'tax_rate', 'late_fee', 'late_fee_type'
  ];

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      parseCSV(event.target.result);
    };
    reader.readAsText(uploadedFile);
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) {
      setValidationResults({ errors: ['CSV file is empty or has no data rows'], warnings: [], valid: false });
      setStep(3);
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = lines.slice(1).map(line => {
      const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = (values[i] || '').replace(/"/g, '').trim();
      });
      return obj;
    });

    validateData(data, headers);
  };

  const validateData = (data, headers) => {
    const errors = [];
    const warnings = [];

    // Check for required headers
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      warnings.push(`Missing optional columns: ${missingHeaders.join(', ')}`);
    }

    // Validate each row
    data.forEach((row, index) => {
      const rowNum = index + 2; // +1 for header, +1 for 0-index

      // Check required fields based on type
      if (row.type === 'group') {
        if (!row.group_code) errors.push(`Row ${rowNum}: Group code is required`);
        if (!row.group_name) errors.push(`Row ${rowNum}: Group name is required`);
      } else if (row.type === 'item') {
        if (!row.item_code) errors.push(`Row ${rowNum}: Item code is required`);
        if (!row.item_name) errors.push(`Row ${rowNum}: Item name is required`);
        if (!row.group_code) errors.push(`Row ${rowNum}: Group code is required for item`);
      } else if (row.type === 'rule') {
        if (!row.item_code) errors.push(`Row ${rowNum}: Item code is required for rule`);
        if (!row.amount) errors.push(`Row ${rowNum}: Amount is required for rule`);
        if (isNaN(parseFloat(row.amount))) errors.push(`Row ${rowNum}: Amount must be numeric`);
        if (!row.currency) warnings.push(`Row ${rowNum}: Currency not specified, will use GHS`);
      }

      // Validate enum values
      if (row.frequency && !['term', 'session', 'monthly', 'one-time'].includes(row.frequency)) {
        errors.push(`Row ${rowNum}: Invalid frequency "${row.frequency}"`);
      }
      if (row.late_fee_type && !['fixed', 'percentage'].includes(row.late_fee_type)) {
        errors.push(`Row ${rowNum}: Invalid late_fee_type "${row.late_fee_type}"`);
      }
    });

    setParsedData(data);
    setValidationResults({ errors, warnings, valid: errors.length === 0 });
    setColumnMapping(
      headers.reduce((acc, h, i) => ({ ...acc, [h]: expectedHeaders[i] || h }), {})
    );
    setStep(3);
  };

  const handleImport = async () => {
    setStep(4);
    setImportProgress(0);

    // Simulate import with progress
    const total = parsedData.length;
    let imported = 0;

    const importInterval = setInterval(() => {
      imported += Math.min(5, total - imported);
      setImportProgress(Math.round((imported / total) * 100));

      if (imported >= total) {
        clearInterval(importInterval);
        setImportResults({ success: imported, errors: 0 });
        setStep(5);
      }
    }, 100);
  };

  const downloadTemplate = () => {
    const template = expectedHeaders.join(',') + '\n' +
      'group,GROUP-001,Tuition Fees,Core tuition fees,,,,,,,,,,,,,,,,,,GHS,2024/2025,0,0,0,fixed\n' +
      'item,,Tuition - Creche,TUITION-CRECHE,Termly tuition for creche,term,0,,,,,,,,,GHS,2024/2025,0,0,0,fixed\n' +
      'rule,,,,,,,creche,1,Creche,1,Term 1,creche,500,GHS,2024/2025,0,0,10,fixed';

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fee_structure_template.csv';
    a.click();
  };

  const getGroupedData = () => {
    return {
      groups: parsedData.filter(r => r.type === 'group'),
      items: parsedData.filter(r => r.type === 'item'),
      rules: parsedData.filter(r => r.type === 'rule')
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Enhanced CSV Import</h3>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Upload your CSV file</p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
              Choose File
            </label>
          </div>
          <div className="flex items-center justify-between">
            <button onClick={downloadTemplate} className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
              <Download className="w-4 h-4" /> Download Template
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span>{file?.name}</span>
            <span>({parsedData.length} rows)</span>
          </div>
          <div className="bg-gray-50 rounded p-4 max-h-64 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  {Object.keys(parsedData[0] || {}).map(h => (
                    <th key={h} className="px-2 py-1 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-t">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-2 py-1">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length > 10 && (
              <p className="text-center text-gray-500 text-sm mt-2">
                Showing first 10 of {parsedData.length} rows
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Back</button>
            <button onClick={() => setStep(3)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Validate</button>
          </div>
        </div>
      )}

      {/* Step 3: Validation Results */}
      {step === 3 && (
        <div className="space-y-4">
          {validationResults.valid ? (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <Check className="w-5 h-5" />
                <span className="font-medium">Validation Passed</span>
              </div>
              <p className="text-sm text-green-600">
                Your CSV file is ready to import. {parsedData.length} rows will be processed.
              </p>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Validation Failed</span>
              </div>
              <ul className="text-sm text-red-600 space-y-1">
                {validationResults.errors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResults.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <div className="flex items-center gap-2 text-yellow-700 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Warnings</span>
              </div>
              <ul className="text-sm text-yellow-600 space-y-1">
                {validationResults.warnings.map((warning, i) => (
                  <li key={i}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResults.valid && (
            <div className="bg-gray-50 rounded p-4">
              <h4 className="font-medium mb-2">Import Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Groups:</span>
                  <span className="ml-2 font-medium">{getGroupedData().groups.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Items:</span>
                  <span className="ml-2 font-medium">{getGroupedData().items.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Rules:</span>
                  <span className="ml-2 font-medium">{getGroupedData().rules.length}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Back</button>
            {validationResults.valid && (
              <button onClick={handleImport} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Import {parsedData.length} Records
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Import Progress */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Importing fee structure...</p>
            <p className="text-2xl font-bold text-blue-600">{importProgress}%</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${importProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Step 5: Results */}
      {step === 5 && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <Check className="w-5 h-5" />
              <span className="font-medium">Import Complete</span>
            </div>
            <p className="text-sm text-green-600">
              Successfully imported {importResults.success} records.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Close</button>
            <button onClick={() => onImport(parsedData)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              View Imported Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
