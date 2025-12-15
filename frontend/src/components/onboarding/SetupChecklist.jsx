import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, Circle, ArrowRight, X, School, Calendar, 
  Users, BookOpen, Upload, Sparkles 
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function SetupChecklist({ onDismiss }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [minimized, setMinimized] = useState(false);

  const checklistItems = [
    {
      id: 'school_setup',
      title: 'School Information',
      description: 'Add logo, name, and contact details',
      icon: School,
      route: '/admin/system-config',
      field: 'school_setup_completed'
    },
    {
      id: 'academic_config',
      title: 'Academic Configuration',
      description: 'Set up academic year and terms',
      icon: Calendar,
      route: '/admin/terms',
      field: 'academic_config_completed'
    },
    {
      id: 'classes',
      title: 'Create Classes',
      description: 'Add your school classes/grades',
      icon: School,
      route: '/admin/classes',
      field: 'classes_created'
    },
    {
      id: 'subjects',
      title: 'Add Subjects',
      description: 'Define subjects taught',
      icon: BookOpen,
      route: '/admin/subjects',
      field: 'subjects_created'
    },
    {
      id: 'users',
      title: 'Add Users',
      description: 'Invite teachers and add students',
      icon: Users,
      route: '/admin/students',
      field: 'users_added'
    },
    {
      id: 'import',
      title: 'Import Data (Optional)',
      description: 'Bulk upload existing data',
      icon: Upload,
      route: '/admin/import',
      field: 'data_imported',
      optional: true
    }
  ];

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/onboarding.php?action=system_status`);
      if (response.data.success) {
        setStatus(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item) => {
    navigate(item.route);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!status || status.completion_percentage === 100) {
    return null;
  }

  if (minimized) {
    return (
      <div 
        onClick={() => setMinimized(false)}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5" />
            <div>
              <p className="font-semibold">Setup Progress: {status.completion_percentage}%</p>
              <p className="text-sm text-blue-100">
                {status.completed_steps} of {status.total_steps} completed
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6" />
            <h3 className="text-xl font-bold">Setup Your School</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMinimized(true)}
              className="p-1 hover:bg-white/20 rounded transition"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-white/20 rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span>{status.completion_percentage}% Complete</span>
            <span>{status.completed_steps} of {status.total_steps} steps</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div
              className="bg-white rounded-full h-3 transition-all duration-500"
              style={{ width: `${status.completion_percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="p-6 space-y-3">
        {checklistItems.map((item) => {
          const Icon = item.icon;
          const isCompleted = status.status[item.field];
          
          return (
            <div
              key={item.id}
              onClick={() => !isCompleted && handleItemClick(item)}
              className={`
                flex items-start gap-4 p-4 rounded-lg border-2 transition-all
                ${isCompleted 
                  ? 'bg-green-50 border-green-200' 
                  : 'border-gray-200 hover:border-blue-500 hover:shadow-md cursor-pointer'
                }
              `}
            >
              <div className={`
                flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
              `}>
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${isCompleted ? 'text-green-600' : 'text-gray-600'}`} />
                  <h4 className={`font-semibold ${isCompleted ? 'text-green-900' : 'text-gray-900'}`}>
                    {item.title}
                    {item.optional && (
                      <span className="ml-2 text-xs text-gray-500 font-normal">(Optional)</span>
                    )}
                  </h4>
                </div>
                <p className={`text-sm ${isCompleted ? 'text-green-700' : 'text-gray-600'}`}>
                  {item.description}
                </p>
              </div>

              {!isCompleted && (
                <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {status.completion_percentage === 100 && (
        <div className="bg-green-50 border-t border-green-200 p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h4 className="font-bold text-green-900 mb-2">Setup Complete! 🎉</h4>
          <p className="text-sm text-green-700 mb-4">
            Your school is ready to go. Start managing students, fees, and more!
          </p>
          <button
            onClick={onDismiss}
            className="btn btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
