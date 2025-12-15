import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function FieldMapper({ file, importType, onMapComplete }) {
  const [csvColumns, setCsvColumns] = useState([]);
  const [mappings, setMappings] = useState({});
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fieldDefinitions = {
    students: [
      { key: 'first_name', label: 'First Name', required: true },
      { key: 'last_name', label: 'Last Name', required: true },
      { key: 'email', label: 'Email Address', required: false },
      { key: 'phone', label: 'Phone Number', required: false },
      { key: 'date_of_birth', label: 'Date of Birth', required: true },
      { key: 'gender', label: 'Gender', required: true },
      { key: 'class', label: 'Class/Grade', required: true },
      { key: 'admission_date', label: 'Admission Date', required: false },
      { key: 'parent_name', label: 'Parent Name', required: false },
      { key: 'parent_email', label: 'Parent Email', required: false },
      { key: 'parent_phone', label: 'Parent Phone', required: false }
    ],
    teachers: [
      { key: 'first_name', label: 'First Name', required: true },
      { key: 'last_name', label: 'Last Name', required: true },
      { key: 'email', label: 'Email Address', required: true },
      { key: 'phone', label: 'Phone Number', required: true },
      { key: 'subject', label: 'Subject/Specialization', required: false },
      { key: 'qualification', label: 'Qualification', required: false },
      { key: 'hire_date', label: 'Hire Date', required: false }
    ],
    classes: [
      { key: 'name', label: 'Class Name', required: true },
      { key: 'grade_level', label: 'Grade Level', required: true },
      { key: 'capacity', label: 'Capacity', required: false },
      { key: 'class_teacher', label: 'Class Teacher', required: false }
    ],
    subjects: [
      { key: 'name', label: 'Subject Name', required: true },
      { key: 'code', label: 'Subject Code', required: false },
      { key: 'description', label: 'Description', required: false }
    ]
  };

  const requiredFields = fieldDefinitions[importType] || [];

  useEffect(() => {
    if (file) {
      parseCSV(file);
    }
  }, [file]);

  useEffect(() => {
    if (Object.keys(mappings).length > 0) {
      onMapComplete(mappings);
    }
  }, [mappings]);

  const parseCSV = async (file) => {
    setLoading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('File is empty');
      }

      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
      setCsvColumns(headers);

      // Parse preview data (first 3 rows)
      const preview = lines.slice(1, 4).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index] || '';
          return obj;
        }, {});
      });
      setPreviewData(preview);

      // Auto-map fields
      autoMapFields(headers);
    } catch (error) {
      console.error('Error parsing CSV:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoMapFields = (headers) => {
    const autoMapped = {};
    
    requiredFields.forEach(field => {
      // Try exact match first
      let match = headers.find(h => 
        h.toLowerCase() === field.key.toLowerCase()
      );

      // Try partial match
      if (!match) {
        match = headers.find(h => 
          h.toLowerCase().includes(field.key.toLowerCase()) ||
          field.key.toLowerCase().includes(h.toLowerCase())
        );
      }

      // Try label match
      if (!match) {
        match = headers.find(h => 
          h.toLowerCase().includes(field.label.toLowerCase()) ||
          field.label.toLowerCase().includes(h.toLowerCase())
        );
      }

      if (match) {
        autoMapped[field.key] = match;
      }
    });

    setMappings(autoMapped);
  };

  const handleMappingChange = (fieldKey, csvColumn) => {
    setMappings(prev => ({
      ...prev,
      [fieldKey]: csvColumn
    }));
  };

  const resetMappings = () => {
    setMappings({});
  };

  const getMappingStatus = () => {
    const requiredMapped = requiredFields
      .filter(f => f.required)
      .every(f => mappings[f.key]);
    
    const totalMapped = Object.keys(mappings).length;
    const totalFields = requiredFields.length;

    return {
      isValid: requiredMapped,
      mapped: totalMapped,
      total: totalFields,
      requiredMapped: requiredFields.filter(f => f.required && mappings[f.key]).length,
      requiredTotal: requiredFields.filter(f => f.required).length
    };
  };

  const status = getMappingStatus();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your file...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Map Your Columns
        </h3>
        <p className="text-gray-600">
          Match your CSV columns to our system fields. We've auto-detected some matches for you.
        </p>
      </div>

      {/* Status Banner */}
      <div className={`rounded-lg p-4 ${status.isValid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <div className="flex items-start gap-3">
          {status.isValid ? (
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={`font-semibold ${status.isValid ? 'text-green-900' : 'text-yellow-900'}`}>
              {status.isValid 
                ? 'All required fields are mapped!' 
                : 'Please map all required fields to continue'}
            </p>
            <p className={`text-sm mt-1 ${status.isValid ? 'text-green-700' : 'text-yellow-700'}`}>
              Mapped {status.requiredMapped} of {status.requiredTotal} required fields
              {status.mapped > status.requiredMapped && ` (${status.mapped} total)`}
            </p>
          </div>
          <button
            onClick={resetMappings}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Field Mappings */}
      <div className="space-y-3">
        {requiredFields.map(field => {
          const isMapped = !!mappings[field.key];
          
          return (
            <div
              key={field.key}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 transition ${
                isMapped ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
              }`}
            >
              {/* System Field */}
              <div className="flex-1">
                <label className="font-semibold text-gray-900 flex items-center gap-2">
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 text-sm">*</span>
                  )}
                </label>
                <p className="text-sm text-gray-500">System field</p>
              </div>

              {/* Arrow */}
              <ArrowRight className={`w-5 h-5 flex-shrink-0 ${isMapped ? 'text-green-600' : 'text-gray-400'}`} />

              {/* CSV Column Selector */}
              <div className="flex-1">
                <select
                  value={mappings[field.key] || ''}
                  onChange={(e) => handleMappingChange(field.key, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    isMapped 
                      ? 'border-green-300 focus:ring-green-500 bg-white' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">-- Select CSV Column --</option>
                  {csvColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">Your CSV column</p>
              </div>

              {/* Status Icon */}
              <div className="flex-shrink-0 w-6">
                {isMapped && (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Data */}
      {previewData.length > 0 && Object.keys(mappings).length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Preview Mapped Data:</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  {requiredFields
                    .filter(f => mappings[f.key])
                    .map(field => (
                      <th key={field.key} className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                        {field.label}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {previewData.map((row, idx) => (
                  <tr key={idx} className="bg-white">
                    {requiredFields
                      .filter(f => mappings[f.key])
                      .map(field => (
                        <td key={field.key} className="px-4 py-2 text-sm text-gray-900">
                          {row[mappings[field.key]] || '-'}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Showing first {previewData.length} rows as preview
          </p>
        </div>
      )}
    </div>
  );
}
