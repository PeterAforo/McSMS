import { useState, useEffect } from 'react';
import { 
  Grid, Users, Plus, Edit, Trash2, X, Save, Shuffle, Download,
  Printer, ChevronRight, Loader2, User, Settings, RotateCcw
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function SeatingChart() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [charts, setCharts] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedChart, setSelectedChart] = useState(null);
  const [chartData, setChartData] = useState(null);
  
  const [showChartModal, setShowChartModal] = useState(false);
  const [editingChart, setEditingChart] = useState(null);
  const [draggedStudent, setDraggedStudent] = useState(null);

  const [chartForm, setChartForm] = useState({
    name: 'Default Layout',
    layout_type: 'grid',
    rows: 5,
    columns: 6,
    room_name: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchCharts();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedChart) {
      fetchChartData();
    }
  }, [selectedChart]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const teacherRes = await axios.get(`${API_BASE_URL}/teachers.php?user_id=${user?.id}`);
      const teachers = teacherRes.data.teachers || [];
      
      if (teachers.length > 0) {
        setTeacherId(teachers[0].id);
        
        const classesRes = await axios.get(`${API_BASE_URL}/teacher_subjects.php?teacher_id=${teachers[0].id}`);
        
        // Use teacher_classes from API response
        const teacherClasses = classesRes.data.teacher_classes || [];
        const uniqueClasses = teacherClasses.map(tc => ({
          id: tc.class_id,
          class_name: tc.class_name
        }));
        
        setClasses(uniqueClasses);
        if (uniqueClasses.length > 0) {
          setSelectedClass(uniqueClasses[0].id);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCharts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/seating_chart.php?class_id=${selectedClass}`);
      setCharts(response.data.charts || []);
      
      // Auto-select first chart or active chart
      const activeChart = response.data.charts?.find(c => c.is_active) || response.data.charts?.[0];
      if (activeChart) {
        setSelectedChart(activeChart.id);
      } else {
        setSelectedChart(null);
        setChartData(null);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/seating_chart.php?id=${selectedChart}`);
      setChartData(response.data.chart);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCreateChart = () => {
    setEditingChart(null);
    setChartForm({
      name: 'Default Layout',
      layout_type: 'grid',
      rows: 5,
      columns: 6,
      room_name: ''
    });
    setShowChartModal(true);
  };

  const handleSaveChart = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        action: 'create_chart',
        class_id: selectedClass,
        teacher_id: teacherId,
        ...chartForm
      };

      if (editingChart) {
        await axios.put(`${API_BASE_URL}/seating_chart.php?id=${editingChart.id}`, chartForm);
      } else {
        await axios.post(`${API_BASE_URL}/seating_chart.php`, payload);
      }

      setShowChartModal(false);
      fetchCharts();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save chart');
    }
  };

  const handleDeleteChart = async (id) => {
    if (window.confirm('Delete this seating chart?')) {
      try {
        await axios.delete(`${API_BASE_URL}/seating_chart.php?id=${id}`);
        fetchCharts();
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const handleDragStart = (student) => {
    setDraggedStudent(student);
  };

  const handleDrop = async (row, col) => {
    if (!draggedStudent || !selectedChart) return;

    try {
      await axios.post(`${API_BASE_URL}/seating_chart.php`, {
        action: 'assign_seat',
        chart_id: selectedChart,
        student_id: draggedStudent.id,
        row_num: row,
        col_num: col
      });

      setDraggedStudent(null);
      fetchChartData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      await axios.post(`${API_BASE_URL}/seating_chart.php`, {
        action: 'remove_assignment',
        chart_id: selectedChart,
        student_id: studentId
      });
      fetchChartData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAutoAssign = async () => {
    if (!selectedChart) return;
    try {
      await axios.post(`${API_BASE_URL}/seating_chart.php`, {
        action: 'auto_assign',
        chart_id: selectedChart
      });
      fetchChartData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleShuffle = async () => {
    if (!selectedChart) return;
    if (!window.confirm('Shuffle all seats? This will randomly rearrange all students.')) return;
    
    try {
      await axios.post(`${API_BASE_URL}/seating_chart.php`, {
        action: 'shuffle',
        chart_id: selectedChart
      });
      fetchChartData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStudentAtSeat = (row, col) => {
    return chartData?.assignments?.find(a => a.row_num == row && a.col_num == col);
  };

  const renderGrid = () => {
    if (!chartData) return null;

    const rows = [];
    for (let r = 1; r <= chartData.rows; r++) {
      const cols = [];
      for (let c = 1; c <= chartData.columns; c++) {
        const student = getStudentAtSeat(r, c);
        cols.push(
          <div
            key={`${r}-${c}`}
            className={`w-20 h-20 border-2 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              student 
                ? 'bg-blue-50 border-blue-300 hover:bg-blue-100' 
                : 'bg-gray-50 border-dashed border-gray-300 hover:bg-gray-100 hover:border-gray-400'
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(r, c)}
          >
            {student ? (
              <div className="relative group w-full h-full flex flex-col items-center justify-center p-1">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mb-1">
                  {student.first_name?.[0]}{student.last_name?.[0]}
                </div>
                <p className="text-xs font-medium text-gray-900 truncate w-full px-1">
                  {student.first_name}
                </p>
                <button
                  onClick={() => handleRemoveStudent(student.student_id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="text-gray-400">
                <User className="w-6 h-6 mx-auto" />
                <p className="text-xs">{r}-{c}</p>
              </div>
            )}
          </div>
        );
      }
      rows.push(
        <div key={r} className="flex gap-2 justify-center">
          {cols}
        </div>
      );
    }
    return rows;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seating Chart</h1>
          <p className="text-gray-600">Arrange student seating in your classroom</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="input w-auto"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.class_name}</option>
            ))}
          </select>
          <button onClick={handleCreateChart} className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" /> New Chart
          </button>
        </div>
      </div>

      {/* Chart Selector */}
      {charts.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {charts.map(chart => (
            <button
              key={chart.id}
              onClick={() => setSelectedChart(chart.id)}
              className={`px-4 py-2 rounded-lg border whitespace-nowrap transition-colors ${
                selectedChart === chart.id 
                  ? 'bg-blue-100 border-blue-500 text-blue-700' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">{chart.name}</span>
              <span className="text-xs text-gray-500 ml-2">
                {chart.assigned_count}/{chart.total_students} assigned
              </span>
            </button>
          ))}
        </div>
      )}

      {chartData ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Unassigned Students */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" /> Unassigned Students
            </h3>
            <p className="text-xs text-gray-500 mb-3">Drag students to seats</p>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {chartData.unassigned_students?.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">All students assigned!</p>
              ) : (
                chartData.unassigned_students?.map(student => (
                  <div
                    key={student.id}
                    draggable
                    onDragStart={() => handleDragStart(student)}
                    className="p-2 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 flex items-center gap-2"
                  >
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold">
                      {student.first_name?.[0]}{student.last_name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{student.first_name} {student.last_name}</p>
                      <p className="text-xs text-gray-500">{student.admission_number}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t space-y-2">
              <button
                onClick={handleAutoAssign}
                className="w-full btn bg-green-100 text-green-700 hover:bg-green-200 btn-sm"
              >
                <Grid className="w-4 h-4 mr-2" /> Auto Assign
              </button>
              <button
                onClick={handleShuffle}
                className="w-full btn bg-orange-100 text-orange-700 hover:bg-orange-200 btn-sm"
              >
                <Shuffle className="w-4 h-4 mr-2" /> Shuffle All
              </button>
            </div>
          </div>

          {/* Seating Grid */}
          <div className="lg:col-span-3 card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{chartData.name}</h3>
                <p className="text-sm text-gray-500">
                  {chartData.room_name || 'Classroom'} • {chartData.rows} rows × {chartData.columns} columns
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="btn bg-gray-100 hover:bg-gray-200 btn-sm">
                  <Printer className="w-4 h-4 mr-1" /> Print
                </button>
                <button 
                  onClick={() => handleDeleteChart(selectedChart)}
                  className="btn bg-red-100 text-red-700 hover:bg-red-200 btn-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Teacher's Desk */}
            <div className="mb-6 flex justify-center">
              <div className="px-8 py-2 bg-gray-800 text-white rounded-lg text-sm">
                Teacher's Desk
              </div>
            </div>

            {/* Grid */}
            <div className="space-y-2 overflow-x-auto pb-4">
              {renderGrid()}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-50 border-2 border-blue-300 rounded"></div>
                <span>Assigned</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded"></div>
                <span>Empty</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Grid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Seating Chart</h3>
          <p className="text-gray-500 mb-4">Create a seating chart for this class</p>
          <button onClick={handleCreateChart} className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" /> Create Chart
          </button>
        </div>
      )}

      {/* Chart Modal */}
      {showChartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editingChart ? 'Edit Chart' : 'New Seating Chart'}</h2>
              <button onClick={() => setShowChartModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveChart} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Chart Name</label>
                <input
                  type="text"
                  value={chartForm.name}
                  onChange={(e) => setChartForm({...chartForm, name: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Room Name</label>
                <input
                  type="text"
                  value={chartForm.room_name}
                  onChange={(e) => setChartForm({...chartForm, room_name: e.target.value})}
                  className="input"
                  placeholder="e.g., Room 101"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rows</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={chartForm.rows}
                    onChange={(e) => setChartForm({...chartForm, rows: parseInt(e.target.value)})}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Columns</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={chartForm.columns}
                    onChange={(e) => setChartForm({...chartForm, columns: parseInt(e.target.value)})}
                    className="input"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowChartModal(false)} className="btn bg-gray-200">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Chart</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
