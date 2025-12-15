import { useState, useEffect } from 'react';
import { 
  Users, Download, Printer, Filter, Search, TrendingUp, 
  UserCheck, UserX, Calendar, MapPin, PieChart, BarChart3,
  FileText, Eye, ChevronDown, ChevronUp
} from 'lucide-react';
import axios from 'axios';

export default function StudentReports() {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [reportView, setReportView] = useState('summary');
  const [expandedSections, setExpandedSections] = useState({
    demographics: true,
    enrollment: true,
    distribution: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch students
      const studentsResponse = await axios.get('https://eea.mcaforo.com/backend/api/students.php');
      setStudents(studentsResponse.data.students || []);
      
      // Fetch classes
      const classesResponse = await axios.get('https://eea.mcaforo.com/backend/api/classes.php');
      setClasses(classesResponse.data.classes || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesClass = selectedClass === 'all' || student.class_id == selectedClass;
    const matchesStatus = selectedStatus === 'all' || student.status === selectedStatus;
    const matchesGender = selectedGender === 'all' || student.gender?.toLowerCase() === selectedGender;
    const matchesSearch = searchTerm === '' || 
      student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesClass && matchesStatus && matchesGender && matchesSearch;
  });

  // Calculate statistics
  const totalStudents = filteredStudents.length;
  const activeStudents = filteredStudents.filter(s => s.status === 'active').length;
  const inactiveStudents = filteredStudents.filter(s => s.status === 'inactive').length;
  const maleStudents = filteredStudents.filter(s => s.gender?.toLowerCase() === 'male').length;
  const femaleStudents = filteredStudents.filter(s => s.gender?.toLowerCase() === 'female').length;

  // Demographics by age
  const getAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const ageGroups = {
    '0-5': 0,
    '6-10': 0,
    '11-15': 0,
    '16+': 0
  };

  filteredStudents.forEach(student => {
    const age = getAge(student.date_of_birth);
    if (age !== null) {
      if (age <= 5) ageGroups['0-5']++;
      else if (age <= 10) ageGroups['6-10']++;
      else if (age <= 15) ageGroups['11-15']++;
      else ageGroups['16+']++;
    }
  });

  // Class distribution
  const classDistribution = {};
  filteredStudents.forEach(student => {
    const className = classes.find(c => c.id == student.class_id)?.class_name || 'Unassigned';
    classDistribution[className] = (classDistribution[className] || 0) + 1;
  });

  // Region distribution
  const regionDistribution = {};
  filteredStudents.forEach(student => {
    const region = student.region || 'Unknown';
    regionDistribution[region] = (regionDistribution[region] || 0) + 1;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Prepare CSV data
    const headers = ['Student ID', 'Name', 'Gender', 'Date of Birth', 'Class', 'Status', 'Region'];
    const rows = filteredStudents.map(s => [
      s.student_id,
      `${s.first_name} ${s.last_name}`,
      s.gender,
      s.date_of_birth,
      classes.find(c => c.id == s.class_id)?.class_name || 'N/A',
      s.status,
      s.region || 'N/A'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive student enrollment and demographics</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn bg-gray-600 hover:bg-gray-700 text-white">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button onClick={handleDownload} className="btn bg-green-600 hover:bg-green-700 text-white">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6 print:hidden">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input"
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.class_name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="input"
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search students..."
                className="input pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{activeStudents}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Male</p>
              <p className="text-2xl font-bold text-gray-900">{maleStudents}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Female</p>
              <p className="text-2xl font-bold text-gray-900">{femaleStudents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demographics Section */}
      <div className="card p-6">
        <button
          onClick={() => toggleSection('demographics')}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Demographics</h2>
          </div>
          {expandedSections.demographics ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        
        {expandedSections.demographics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gender Distribution */}
            <div>
              <h3 className="font-medium mb-3">Gender Distribution</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Male</span>
                    <span className="font-medium">{maleStudents} ({totalStudents > 0 ? ((maleStudents/totalStudents)*100).toFixed(1) : 0}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full" 
                      style={{ width: `${totalStudents > 0 ? (maleStudents/totalStudents)*100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Female</span>
                    <span className="font-medium">{femaleStudents} ({totalStudents > 0 ? ((femaleStudents/totalStudents)*100).toFixed(1) : 0}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-pink-600 h-3 rounded-full" 
                      style={{ width: `${totalStudents > 0 ? (femaleStudents/totalStudents)*100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Age Distribution */}
            <div>
              <h3 className="font-medium mb-3">Age Distribution</h3>
              <div className="space-y-3">
                {Object.entries(ageGroups).map(([range, count]) => (
                  <div key={range}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{range} years</span>
                      <span className="font-medium">{count} ({totalStudents > 0 ? ((count/totalStudents)*100).toFixed(1) : 0}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-purple-600 h-3 rounded-full" 
                        style={{ width: `${totalStudents > 0 ? (count/totalStudents)*100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Class Distribution */}
      <div className="card p-6">
        <button
          onClick={() => toggleSection('distribution')}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">Class Distribution</h2>
          </div>
          {expandedSections.distribution ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        
        {expandedSections.distribution && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Object.entries(classDistribution).map(([className, count]) => (
                  <tr key={className}>
                    <td className="px-4 py-3 font-medium">{className}</td>
                    <td className="px-4 py-3">{count}</td>
                    <td className="px-4 py-3">{totalStudents > 0 ? ((count/totalStudents)*100).toFixed(1) : 0}%</td>
                    <td className="px-4 py-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${totalStudents > 0 ? (count/totalStudents)*100 : 0}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Regional Distribution */}
      <div className="card p-6">
        <button
          onClick={() => toggleSection('enrollment')}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold">Regional Distribution</h2>
          </div>
          {expandedSections.enrollment ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        
        {expandedSections.enrollment && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(regionDistribution).map(([region, count]) => (
              <div key={region} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{region}</span>
                  <span className="text-2xl font-bold text-blue-600">{count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full" 
                    style={{ width: `${totalStudents > 0 ? (count/totalStudents)*100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {totalStudents > 0 ? ((count/totalStudents)*100).toFixed(1) : 0}% of total
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student List */}
      <div className="card p-6 print:break-before-page">
        <h2 className="text-lg font-semibold mb-4">Student List ({filteredStudents.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredStudents.slice(0, 50).map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{student.student_id}</td>
                  <td className="px-4 py-3">{student.first_name} {student.last_name}</td>
                  <td className="px-4 py-3 capitalize">{student.gender}</td>
                  <td className="px-4 py-3">
                    {classes.find(c => c.id == student.class_id)?.class_name || 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      student.status === 'active' ? 'bg-green-100 text-green-700' :
                      student.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{student.region || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStudents.length > 50 && (
            <p className="text-center text-gray-500 mt-4">
              Showing 50 of {filteredStudents.length} students. Export to CSV to see all.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
