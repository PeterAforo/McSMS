import { useState, useRef } from 'react';
import { Camera, Upload, X, User } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function ProfilePictureUpload({ 
  type, // 'user' or 'teacher'
  id, 
  currentPicture, 
  onUploadSuccess 
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentPicture);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload file
      uploadFile(file);
    }
  };

  const uploadFile = async (file) => {
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('profile_picture', file);
      formData.append('type', type);
      formData.append('id', id);

      const response = await axios.post(
        'https://eea.mcaforo.com/backend/api/upload_profile_picture.php',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        setPreview(response.data.url);
        alert('Profile picture uploaded successfully!');
        if (onUploadSuccess) {
          onUploadSuccess(response.data.filename, response.data.url);
        }
        setShowModal(false);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload picture: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  const getPictureUrl = (picture) => {
    if (!picture) return null;
    if (picture.startsWith('http')) return picture;
    return `${API_BASE_URL.replace('/backend/api', '')}/${picture.replace(/^\//, '')}`;
  };

  const displayPicture = getPictureUrl(preview || currentPicture);

  return (
    <>
      {/* Profile Picture Display */}
      <div className="relative inline-block">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
          {displayPicture ? (
            <img
              src={displayPicture}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
              <User className="w-12 h-12 text-white" />
            </div>
          )}
        </div>
        
        {/* Upload Button */}
        <button
          onClick={() => setShowModal(true)}
          className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-colors"
          title="Upload picture"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Upload Profile Picture
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Preview */}
              <div className="flex justify-center">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-gray-300">
                  {preview ? (
                    <img
                      src={typeof preview === 'string' && preview.startsWith('data:') ? preview : getPictureUrl(preview)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                      <User className="w-16 h-16 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full btn btn-primary flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Choose Picture
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  JPG, PNG, GIF or WEBP (Max 5MB)
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="btn bg-gray-200 hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
