import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { Image, Upload, Trash2, X, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react';

const PAGE_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'login', label: 'Login' },
  { value: 'register', label: 'Register' },
  { value: 'forgot_password', label: 'Forgot Password' },
];

export default function GalleryManagement() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState('any');
  const [previewImage, setPreviewImage] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const fileInputRef = useRef(null);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/gallery.php?action=list`);
      if (response.data?.success) {
        setImages(response.data.images || []);
      } else {
        showMessage(response.data?.error || 'Failed to load images', 'error');
      }
    } catch (err) {
      showMessage(err.response?.data?.error || err.message || 'Failed to load images', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showMessage('Please select an image to upload', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('page_assignment', selectedAssignment);

    try {
      setUploading(true);
      const response = await axios.post(`${API_BASE_URL}/gallery.php?action=upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.success) {
        setImages((prev) => [response.data.image, ...prev]);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        showMessage('Image uploaded successfully');
      } else {
        showMessage(response.data?.error || 'Upload failed', 'error');
      }
    } catch (err) {
      showMessage(err.response?.data?.error || err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleAssignChange = async (id, value) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, page_assignment: value } : img))
    );

    const formData = new FormData();
    formData.append('image_id', id);
    formData.append('page_assignment', value);

    try {
      const response = await axios.post(`${API_BASE_URL}/gallery.php?action=assign`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!response.data?.success) {
        showMessage(response.data?.error || 'Failed to update assignment', 'error');
      }
    } catch (err) {
      showMessage(err.response?.data?.error || err.message || 'Failed to update assignment', 'error');
      fetchImages();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }
    setDeleteId(id);

    const formData = new FormData();
    formData.append('image_id', id);

    try {
      const response = await axios.post(`${API_BASE_URL}/gallery.php?action=delete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data?.success) {
        setImages((prev) => prev.filter((img) => img.id !== id));
        showMessage('Image deleted successfully');
      } else {
        showMessage(response.data?.error || 'Delete failed', 'error');
      }
    } catch (err) {
      showMessage(err.response?.data?.error || err.message || 'Delete failed', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const getAssignmentBadge = (value) => {
    const option = PAGE_OPTIONS.find((opt) => opt.value === value);
    return option?.label || value;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Image className="w-7 h-7 text-blue-600" />
          Gallery Management
        </h1>
        <p className="text-gray-600 mt-1">
          Upload and manage background images for the authentication pages.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {message.type === 'error' ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600" />
          Upload New Image
        </h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image File (jpg, png, gif, webp - max 5MB)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600">Selected: {selectedFile.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Page Assignment
              </label>
              <select
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {PAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Image
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Image Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Gallery Images</h2>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Image className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No gallery images found. Upload one above to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {images.map((image) => (
              <div
                key={image.id}
                className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-[4/3] group cursor-pointer" onClick={() => setPreviewImage(image)}>
                  <img
                    src={image.url}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-600 text-white">
                    {getAssignmentBadge(image.page_assignment)}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-900 truncate" title={image.filename}>
                    {image.filename}
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Page Assignment
                    </label>
                    <select
                      value={image.page_assignment}
                      onChange={(e) => handleAssignChange(image.id, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {PAGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleDelete(image.id)}
                    disabled={deleteId === image.id}
                    className="w-full inline-flex items-center justify-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {deleteId === image.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative">
              <img
                src={previewImage.url}
                alt={previewImage.filename}
                className="w-full h-64 sm:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white px-6">
                  <p className="text-lg font-semibold">{previewImage.filename}</p>
                  <p className="text-sm text-gray-200 mt-1">
                    Assignment: {getAssignmentBadge(previewImage.page_assignment)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
