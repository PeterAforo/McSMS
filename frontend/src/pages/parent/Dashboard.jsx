import { useState, useEffect } from 'react';
import { Plus, Users, Clock, CheckCircle, XCircle, FileText, Calendar } from 'lucide-react';
import { applicationsAPI, studentsAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function ParentDashboard() {
  const [applications, setApplications] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch applications submitted by this parent
      const appsResponse = await applicationsAPI.getAll({ parent_id: user.id });
      setApplications(appsResponse.data.applications || []);
      
      // Fetch approved children (students linked to this parent)
      const studentsResponse = await studentsAPI.getAll({ parent_id: user.id });
      setChildren(studentsResponse.data.students || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { 
      label: 'My Children', 
      value: children.length, 
      icon: Users, 
      color: 'bg-blue-500',
      description: 'Enrolled students'
    },
    { 
      label: 'Pending Applications', 
      value: applications.filter(a => a.status === 'pending').length, 
      icon: Clock, 
      color: 'bg-orange-500',
      description: 'Awaiting review'
    },
    { 
      label: 'Approved', 
      value: applications.filter(a => a.status === 'approved').length, 
      icon: CheckCircle, 
      color: 'bg-green-500',
      description: 'Applications accepted'
    },
    { 
      label: 'Rejected', 
      value: applications.filter(a => a.status === 'rejected').length, 
      icon: XCircle, 
      color: 'bg-red-500',
      description: 'Applications declined'
    },
  ];

  const calculateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}!</h1>
        <p className="text-blue-100">Manage your children's education and applications</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center justify-between mb-3">
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <p className="text-gray-900 font-medium">{stat.label}</p>
            <p className="text-sm text-gray-600">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Apply for Admission</h2>
              <p className="text-gray-600">Submit a new application for your child</p>
            </div>
            <button
              onClick={() => navigate('/parent/apply')}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Apply
            </button>
          </div>
        </div>
        
        <div className="card p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Term Enrollment</h2>
              <p className="text-gray-600">Enroll your child for the new term</p>
            </div>
            <button
              onClick={() => navigate('/parent/enroll')}
              className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Enroll
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Children */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              My Children
            </h2>
          </div>
          <div className="p-6">
            {loading ? (
              <p className="text-gray-500 text-center py-8">Loading...</p>
            ) : children.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No enrolled children yet</p>
                <p className="text-sm text-gray-400 mt-1">Submit an application to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => navigate(`/parent/child/${child.id}`)}
                    className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {child.first_name?.charAt(0)}{child.last_name?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {child.first_name} {child.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {calculateAge(child.date_of_birth)} years • {child.student_id}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Active
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Application Status */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              Application Status
            </h2>
          </div>
          <div className="p-6">
            {loading ? (
              <p className="text-gray-500 text-center py-8">Loading...</p>
            ) : applications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No applications submitted</p>
                <button
                  onClick={() => navigate('/parent/apply')}
                  className="btn btn-primary mt-4"
                >
                  Submit First Application
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {app.first_name} {app.last_name}
                        </p>
                        <p className="text-sm text-gray-600 font-mono">{app.application_number}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        app.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        app.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      Applied: {new Date(app.application_date).toLocaleDateString()}
                    </div>
                    {app.status === 'approved' && (
                      <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Application approved! Student enrolled.
                      </p>
                    )}
                    {app.status === 'rejected' && app.rejection_reason && (
                      <p className="text-sm text-red-600 mt-2">
                        Reason: {app.rejection_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 hover:shadow-lg transition-shadow">
          <FileText className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Application Process</h3>
          <p className="text-sm text-gray-600">
            Submit applications online and track their status in real-time
          </p>
        </div>
        <div className="card p-6 hover:shadow-lg transition-shadow">
          <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Quick Approval</h3>
          <p className="text-sm text-gray-600">
            Applications are reviewed within 2-3 business days
          </p>
        </div>
        <div className="card p-6 hover:shadow-lg transition-shadow">
          <Users className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Stay Updated</h3>
          <p className="text-sm text-gray-600">
            Get notifications when your application status changes
          </p>
        </div>
      </div>
    </div>
  );
}
