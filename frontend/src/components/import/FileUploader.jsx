import { useState } from 'react';
import { Upload, FileText, Download, CheckCircle, AlertCircle, X } from 'lucide-react';

export default function FileUploader({ onUpload, importType, onDownloadTemplate }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    setError('');
    
    // Validate file type
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload a CSV or Excel file.');
      return;
    }
    
    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }
    
    setFile(selectedFile);
    onUpload(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
    setError('');
    onUpload(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getImportTypeLabel = () => {
    const labels = {
      students: 'Students',
      teachers: 'Teachers',
      parents: 'Parents',
      classes: 'Classes',
      subjects: 'Subjects',
      fees: 'Fee Structure'
    };
    return labels[importType] || 'Data';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Upload {getImportTypeLabel()} Data
        </h3>
        <p className="text-gray-600">
          Upload a CSV or Excel file with your {getImportTypeLabel().toLowerCase()} data.
        </p>
      </div>

      {/* Download Template Section */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-2">
              Need a template?
            </h4>
            <p className="text-sm text-blue-700 mb-4">
              Download our CSV template with the correct format and sample data to get started quickly.
            </p>
            <button
              onClick={onDownloadTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Download className="w-4 h-4" />
              Download {getImportTypeLabel()} Template
            </button>
          </div>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-all
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
          ${file ? 'bg-green-50 border-green-500' : ''}
          ${error ? 'bg-red-50 border-red-500' : ''}
        `}
      >
        {!file && !error && (
          <>
            <Upload className={`w-16 h-16 mx-auto mb-4 ${dragActive ? 'text-blue-600' : 'text-gray-400'}`} />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {dragActive ? 'Drop your file here' : 'Drag & drop your file here'}
            </h4>
            <p className="text-gray-600 mb-4">or</p>
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer font-medium">
              <Upload className="w-5 h-5" />
              Browse Files
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleChange}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-500 mt-4">
              Supported formats: CSV, XLS, XLSX (Max 10MB)
            </p>
          </>
        )}

        {file && !error && (
          <div className="space-y-4">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
            <div>
              <h4 className="text-lg font-semibold text-green-900 mb-2">
                File Uploaded Successfully!
              </h4>
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-green-200">
                <FileText className="w-5 h-5 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={removeFile}
                  className="p-1 hover:bg-gray-100 rounded transition"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Choose a different file
            </button>
          </div>
        )}

        {error && (
          <div className="space-y-4">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto" />
            <div>
              <h4 className="text-lg font-semibold text-red-900 mb-2">
                Upload Failed
              </h4>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={() => setError('')}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* File Requirements */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h5 className="font-semibold text-gray-900 mb-3">File Requirements:</h5>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>First row must contain column headers</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Use the template format for best results</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Remove any empty rows at the end</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Ensure dates are in YYYY-MM-DD format</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Maximum file size: 10MB</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
