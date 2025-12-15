import { Link } from 'react-router-dom';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldX className="w-10 h-10 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
