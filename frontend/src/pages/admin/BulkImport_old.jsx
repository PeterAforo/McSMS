import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import FileUploader from '../../components/import/FileUploader';
import FieldMapper from '../../components/import/FieldMapper';
import axios from 'axios';

export default function BulkImport() {
  const [step, setStep] = useState(1);
  const [importType, setImportType] = useState('students');
  const [file, setFile] = useState(null);
  const [mappings, setMappings] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const importTypes = [
    { value: 'students', label: 'Students', icon: '👨‍🎓', description: 'Import student records with parent information' },
    { value: 'teachers', label: 'Teachers', icon: '👨‍🏫', description: 'Import teacher profiles and qualifications' },
    { value: 'classes', label: 'Classes', icon: '🏫', description: 'Import class/grade structure' },
    { value: 'subjects', label: 'Subjects', icon: '📚', description: 'Import subject catalog' }
  ];

  const handleDownloadTemplate = () => {
    window.open(
      `https://eea.mcaforo.com/backend/api/import.php?action=download_template&type=${importType}`,
      '_blank'
    );
  };

  const handleFileUpload = (uploadedFile) => {
    setFile(uploadedFile);
    if (uploadedFile) {
      setStep(2);
    }
  };

  const handleMapComplete = (completedMappings) => {
    setMappings(completedMappings);
  };

  const handleImport = async () => {
    if (!file || Object.keys(mappings).length === 0) {
      alert('Please upload a file and map the fields');
      return;
    }

    setImporting(true);
    setStep(3);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', importType);
      formData.append('mappings', JSON.stringify(mappings));
      formData.append('user_id', 1); // TODO: Get from auth context

      const response = await axios.post(
        'https://eea.mcaforo.com/backend/api/import.php?action=import',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setImportResult(response.data);
      } else {
        throw new Error(response.data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        error: error.message || 'Import failed'
      });
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFile(null);
    setMappings({});
    setImportResult(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bulk Data Import</h1>
        <p className="text-gray-600 mt-2">
          Import your existing data from CSV or Excel files
        </p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Select Type & Upload' },
            { num: 2, label: 'Map Fields' },
            { num: 3, label: 'Import Data' }
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div className={`
                flex items-center gap-3
                ${step >= s.num ? 'text-blue-600' : 'text-gray-400'}
              `}>
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${step > s.num ? 'bg-green-500 text-white' : 
                    step === s.num ? 'bg-blue-600 text-white' : 
                    'bg-gray-200 text-gray-600'}
                `}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className="font-medium">{s.label}</span>
              </div>
              {idx < 2 && (
                <div className={`
                  w-24 h-1 mx-4
                  ${step > s.num ? 'bg-green-500' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        {/* Step 1: Select Type & Upload */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Select Import Type
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {importTypes.map(type => (
                  <div
                    key={type.value}
                    onClick={() => setImportType(type.value)}
                    className={`
                      p-6 rounded-lg border-2 cursor-pointer transition
                      ${importType === type.value 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'}
                    `}
                  >
                    <div className="text-4xl mb-3">{type.icon}</div>
                    <h4 className="font-semibold text-gray-900 mb-1">{type.label}</h4>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <FileUploader
                importType={importType}
                onUpload={handleFileUpload}
                onDownloadTemplate={handleDownloadTemplate}
              />
            </div>
          </div>
        )}

        {/* Step 2: Map Fields */}
        {step === 2 && file && (
          <div>
            <FieldMapper
              file={file}
              importType={importType}
              onMapComplete={handleMapComplete}
            />
          </div>
        )}

        {/* Step 3: Import Progress/Result */}
        {step === 3 && (
          <div className="text-center py-12">
            {importing ? (
              <>
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Importing Data...
                </h3>
                <p className="text-gray-600">
                  Please wait while we process your file
                </p>
              </>
            ) : importResult ? (
              importResult.success ? (
                <>
                  <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Import Successful!
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto mb-6">
                    <div className="space-y-2 text-left">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Total Rows:</span>
                        <span className="font-semibold">{importResult.total_rows}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Successfully Imported:</span>
                        <span className="font-semibold text-green-700">{importResult.imported}</span>
                      </div>
                      {importResult.failed > 0 && (
                        <div className="flex justify-between">
                          <span className="text-red-700">Failed:</span>
                          <span className="font-semibold text-red-700">{importResult.failed}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto mb-6">
                      <p className="text-sm font-semibold text-yellow-900 mb-2">
                        Some rows had errors:
                      </p>
                      <div className="text-left text-xs text-yellow-800 space-y-1 max-h-40 overflow-y-auto">
                        {importResult.errors.slice(0, 5).map((err, idx) => (
                          <div key={idx}>
                            Row {err.row}: {err.error}
                          </div>
                        ))}
                        {importResult.errors.length > 5 && (
                          <div className="text-yellow-600">
                            ...and {importResult.errors.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handleReset}
                    className="btn btn-primary"
                  >
                    Import More Data
                  </button>
                </>
              ) : (
                <>
                  <AlertCircle className="w-20 h-20 text-red-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Import Failed
                  </h3>
                  <p className="text-red-600 mb-6">
                    {importResult.error || 'An error occurred during import'}
                  </p>
                  <button
                    onClick={handleReset}
                    className="btn btn-secondary"
                  >
                    Try Again
                  </button>
                </>
              )
            ) : null}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {step < 3 && (
        <div className="flex justify-between">
          <button
            onClick={() => step === 2 ? setStep(1) : null}
            disabled={step === 1}
            className="btn btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={() => step === 2 ? handleImport() : null}
            disabled={step === 1 || (step === 2 && Object.keys(mappings).length === 0)}
            className="btn btn-primary"
          >
            {step === 2 ? 'Start Import' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}
