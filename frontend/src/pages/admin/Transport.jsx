import { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Truck, Users, MapPin, Wrench, Plus, Edit2, Trash2, X, Calendar, Navigation, Clock, Phone, Mail, 
  Route, ChevronRight, UserCheck, Search, Filter, Download, Printer, Fuel, History, DollarSign,
  AlertTriangle, Bell, CheckCircle, XCircle, MessageSquare, FileText, BarChart3, TrendingUp,
  RefreshCw, Eye, Send, CreditCard, UserPlus, Settings
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

const API = `${API_BASE_URL}/transport.php`;

export default function Transport() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [tracking, setTracking] = useState([]);
  const [students, setStudents] = useState([]);
  const [routeStudents, setRouteStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vehicles');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('vehicle');
  const [editingItem, setEditingItem] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [assignmentDate, setAssignmentDate] = useState(new Date().toISOString().split('T')[0]);

  // Enhanced state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fuelRecords, setFuelRecords] = useState([]);
  const [tripHistory, setTripHistory] = useState([]);
  const [pickupTracking, setPickupTracking] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [transportFees, setTransportFees] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [vehicleForm, setVehicleForm] = useState({ vehicle_number: '', vehicle_type: 'bus', make: '', model: '', year: '', capacity: '', registration_number: '', insurance_expiry: '', fitness_certificate_expiry: '', fuel_type: 'diesel', status: 'active', notes: '' });
  const [driverForm, setDriverForm] = useState({ driver_name: '', phone: '', email: '', license_number: '', license_expiry: '', address: '', emergency_contact_name: '', emergency_contact_phone: '', hire_date: '', salary: '', status: 'active' });
  const [routeForm, setRouteForm] = useState({ route_name: '', route_code: '', start_location: '', end_location: '', total_distance: '', estimated_duration: '', fare_amount: '', status: 'active', description: '' });
  const [assignmentForm, setAssignmentForm] = useState({ vehicle_id: '', driver_id: '', route_id: '', assignment_date: '', shift: 'both', start_time: '06:30', end_time: '17:00', status: 'scheduled' });
  const [maintenanceForm, setMaintenanceForm] = useState({ vehicle_id: '', maintenance_type: 'routine', description: '', maintenance_date: '', cost: '', service_provider: '', next_service_date: '', status: 'scheduled' });
  const [fuelForm, setFuelForm] = useState({ vehicle_id: '', fuel_date: '', liters: '', cost_per_liter: '', total_cost: '', odometer_reading: '', fuel_station: '', notes: '' });
  const [feeForm, setFeeForm] = useState({ student_id: '', route_id: '', amount: '', term: '', status: 'pending' });

  useEffect(() => { 
    Promise.all([fetchVehicles(), fetchDrivers(), fetchRoutes(), fetchStudents()])
      .then(() => {
        checkExpiryAlerts();
        setLoading(false);
      }); 
  }, []);
  
  useEffect(() => { 
    if (activeTab === 'assignments') fetchAssignments(); 
    if (activeTab === 'maintenance') fetchMaintenance(); 
    if (activeTab === 'tracking') fetchTracking(); 
    if (activeTab === 'fuel') fetchFuelRecords();
    if (activeTab === 'history') fetchTripHistory();
    if (activeTab === 'pickup') fetchPickupTracking();
    if (activeTab === 'fees') fetchTransportFees();
    if (activeTab === 'expenses') fetchExpenses();
  }, [activeTab, assignmentDate, dateFrom, dateTo]);

  const fetchVehicles = async () => { try { const r = await axios.get(`${API}?resource=vehicles`); setVehicles(r.data.vehicles || []); } catch (e) { console.error(e); } };
  const fetchDrivers = async () => { try { const r = await axios.get(`${API}?resource=drivers`); setDrivers(r.data.drivers || []); } catch (e) { console.error(e); } };
  const fetchRoutes = async () => { try { const r = await axios.get(`${API}?resource=routes`); setRoutes(r.data.routes || []); } catch (e) { console.error(e); } };
  const fetchAssignments = async () => { try { const r = await axios.get(`${API}?resource=assignments&action=by_date&date=${assignmentDate}`); setAssignments(r.data.assignments || []); } catch (e) { console.error(e); } };
  const fetchMaintenance = async () => { try { const r = await axios.get(`${API}?resource=maintenance&action=upcoming`); setMaintenance(r.data.maintenance || []); } catch (e) { console.error(e); } };
  const fetchTracking = async () => { try { const r = await axios.get(`${API}?resource=tracking&action=live`); setTracking(r.data.vehicles || []); } catch (e) { console.error(e); } };
  const fetchStudents = async () => { try { const r = await axios.get(`${API_BASE_URL}/students.php`); setStudents(r.data.students || []); } catch (e) { console.error(e); } };
  const fetchRouteStudents = async (id) => { try { const r = await axios.get(`${API}?resource=student_transport&action=by_route&route_id=${id}`); setRouteStudents(r.data.students || []); } catch (e) { console.error(e); } };
  
  // New fetch functions
  const fetchFuelRecords = async () => { 
    try { 
      let url = `${API}?resource=fuel`;
      if (dateFrom) url += `&date_from=${dateFrom}`;
      if (dateTo) url += `&date_to=${dateTo}`;
      const r = await axios.get(url); 
      setFuelRecords(r.data.fuel_records || []); 
    } catch (e) { console.error(e); } 
  };
  
  const fetchTripHistory = async () => { 
    try { 
      let url = `${API}?resource=trip_history`;
      if (dateFrom) url += `&date_from=${dateFrom}`;
      if (dateTo) url += `&date_to=${dateTo}`;
      const r = await axios.get(url); 
      setTripHistory(r.data.trips || []); 
    } catch (e) { console.error(e); } 
  };
  
  const fetchPickupTracking = async () => { 
    try { 
      const r = await axios.get(`${API}?resource=pickup_tracking&date=${assignmentDate}`); 
      setPickupTracking(r.data.tracking || []); 
    } catch (e) { console.error(e); } 
  };
  
  const fetchTransportFees = async () => { 
    try { 
      const r = await axios.get(`${API}?resource=transport_fees`); 
      setTransportFees(r.data.fees || []); 
    } catch (e) { console.error(e); } 
  };
  
  const fetchExpenses = async () => { 
    try { 
      let url = `${API}?resource=expenses`;
      if (dateFrom) url += `&date_from=${dateFrom}`;
      if (dateTo) url += `&date_to=${dateTo}`;
      const r = await axios.get(url); 
      setExpenses(r.data.expenses || []); 
    } catch (e) { console.error(e); } 
  };

  const checkExpiryAlerts = () => {
    const alerts = [];
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    vehicles.forEach(v => {
      if (v.insurance_expiry && new Date(v.insurance_expiry) <= thirtyDaysFromNow) {
        alerts.push({ type: 'insurance', vehicle: v.vehicle_number, expiry: v.insurance_expiry, severity: new Date(v.insurance_expiry) <= today ? 'expired' : 'warning' });
      }
      if (v.fitness_certificate_expiry && new Date(v.fitness_certificate_expiry) <= thirtyDaysFromNow) {
        alerts.push({ type: 'fitness', vehicle: v.vehicle_number, expiry: v.fitness_certificate_expiry, severity: new Date(v.fitness_certificate_expiry) <= today ? 'expired' : 'warning' });
      }
    });
    
    drivers.forEach(d => {
      if (d.license_expiry && new Date(d.license_expiry) <= thirtyDaysFromNow) {
        alerts.push({ type: 'license', driver: d.driver_name, expiry: d.license_expiry, severity: new Date(d.license_expiry) <= today ? 'expired' : 'warning' });
      }
    });
    
    setExpiryAlerts(alerts);
  };

  useEffect(() => { if (vehicles.length > 0 || drivers.length > 0) checkExpiryAlerts(); }, [vehicles, drivers]);

  const handleSaveVehicle = async (e) => { e.preventDefault(); try { if (editingItem?.id) await axios.put(`${API}?resource=vehicles&id=${editingItem.id}`, vehicleForm); else await axios.post(`${API}?resource=vehicles`, vehicleForm); alert('Saved!'); fetchVehicles(); closeModal(); } catch (e) { alert('Failed'); } };
  const handleDeleteVehicle = async (id) => { if (!confirm('Delete?')) return; try { await axios.delete(`${API}?resource=vehicles&id=${id}`); fetchVehicles(); } catch (e) { alert('Failed'); } };
  const handleSaveDriver = async (e) => { e.preventDefault(); try { if (editingItem?.id) await axios.put(`${API}?resource=drivers&id=${editingItem.id}`, driverForm); else await axios.post(`${API}?resource=drivers`, driverForm); alert('Saved!'); fetchDrivers(); closeModal(); } catch (e) { alert('Failed'); } };
  const handleSaveRoute = async (e) => { e.preventDefault(); try { if (editingItem?.id) await axios.put(`${API}?resource=routes&id=${editingItem.id}`, routeForm); else await axios.post(`${API}?resource=routes`, routeForm); alert('Saved!'); fetchRoutes(); closeModal(); } catch (e) { alert('Failed'); } };
  const handleSaveAssignment = async (e) => { e.preventDefault(); try { await axios.post(`${API}?resource=assignments`, assignmentForm); alert('Saved!'); fetchAssignments(); closeModal(); } catch (e) { alert('Failed'); } };
  const handleSaveMaintenance = async (e) => { e.preventDefault(); try { await axios.post(`${API}?resource=maintenance`, maintenanceForm); alert('Saved!'); fetchMaintenance(); closeModal(); } catch (e) { alert('Failed'); } };
  
  const handleSaveFuel = async (e) => { 
    e.preventDefault(); 
    try { 
      await axios.post(`${API}?resource=fuel`, fuelForm); 
      alert('Fuel record saved!'); 
      fetchFuelRecords(); 
      closeModal(); 
    } catch (e) { alert('Failed'); } 
  };
  
  const handleSaveFee = async (e) => { 
    e.preventDefault(); 
    try { 
      await axios.post(`${API}?resource=transport_fees`, feeForm); 
      alert('Fee saved!'); 
      fetchTransportFees(); 
      setShowFeeModal(false); 
    } catch (e) { alert('Failed'); } 
  };
  
  const handlePickupStatus = async (studentId, status) => {
    try {
      await axios.post(`${API}?resource=pickup_tracking`, { 
        student_id: studentId, 
        date: assignmentDate, 
        status,
        timestamp: new Date().toISOString()
      });
      fetchPickupTracking();
    } catch (e) { alert('Failed'); }
  };
  
  const sendParentNotification = async (studentId, message) => {
    try {
      await axios.post(`${API}?resource=notifications`, { student_id: studentId, message, type: 'transport' });
      alert('Notification sent!');
    } catch (e) { alert('Failed to send notification'); }
  };

  const openModal = (type, item = null) => {
    setModalType(type); setEditingItem(item);
    if (type === 'vehicle') setVehicleForm(item || { vehicle_number: '', vehicle_type: 'bus', make: '', model: '', year: '', capacity: '', registration_number: '', insurance_expiry: '', fitness_certificate_expiry: '', fuel_type: 'diesel', status: 'active', notes: '' });
    else if (type === 'driver') setDriverForm(item || { driver_name: '', phone: '', email: '', license_number: '', license_expiry: '', address: '', emergency_contact_name: '', emergency_contact_phone: '', hire_date: '', salary: '', status: 'active' });
    else if (type === 'route') setRouteForm(item || { route_name: '', route_code: '', start_location: '', end_location: '', total_distance: '', estimated_duration: '', fare_amount: '', status: 'active', description: '' });
    else if (type === 'assignment') setAssignmentForm({ vehicle_id: '', driver_id: '', route_id: '', assignment_date: assignmentDate, shift: 'both', start_time: '06:30', end_time: '17:00', status: 'scheduled' });
    else if (type === 'maintenance') setMaintenanceForm({ vehicle_id: '', maintenance_type: 'routine', description: '', maintenance_date: '', cost: '', service_provider: '', next_service_date: '', status: 'scheduled' });
    else if (type === 'fuel') setFuelForm({ vehicle_id: '', fuel_date: new Date().toISOString().split('T')[0], liters: '', cost_per_liter: '', total_cost: '', odometer_reading: '', fuel_station: '', notes: '' });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingItem(null); };
  const getStatusBadge = (s) => ({ active: 'bg-green-100 text-green-800', maintenance: 'bg-orange-100 text-orange-800', inactive: 'bg-gray-100 text-gray-800', on_leave: 'bg-yellow-100 text-yellow-800', suspended: 'bg-red-100 text-red-800', scheduled: 'bg-blue-100 text-blue-800', completed: 'bg-green-100 text-green-800', in_progress: 'bg-purple-100 text-purple-800', moving: 'bg-green-100 text-green-800', stopped: 'bg-yellow-100 text-yellow-800', picked_up: 'bg-green-100 text-green-800', dropped_off: 'bg-blue-100 text-blue-800', absent: 'bg-red-100 text-red-800', pending: 'bg-yellow-100 text-yellow-800', paid: 'bg-green-100 text-green-800' }[s] || 'bg-gray-100 text-gray-800');

  // Filter functions
  const filteredVehicles = vehicles.filter(v => 
    (v.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     v.make?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!statusFilter || v.status === statusFilter)
  );
  
  const filteredDrivers = drivers.filter(d => 
    (d.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     d.phone?.includes(searchTerm)) &&
    (!statusFilter || d.status === statusFilter)
  );
  
  const filteredRoutes = routes.filter(r => 
    (r.route_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     r.route_code?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!statusFilter || r.status === statusFilter)
  );

  // Export functions
  const exportToPDF = (type) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Transport ${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    
    if (type === 'vehicles') {
      autoTable(doc, {
        startY: 35,
        head: [['Vehicle #', 'Type', 'Make/Model', 'Capacity', 'Status']],
        body: filteredVehicles.map(v => [v.vehicle_number, v.vehicle_type, `${v.make} ${v.model}`, v.capacity, v.status])
      });
    } else if (type === 'drivers') {
      autoTable(doc, {
        startY: 35,
        head: [['Name', 'Phone', 'License', 'Expiry', 'Status']],
        body: filteredDrivers.map(d => [d.driver_name, d.phone, d.license_number, d.license_expiry, d.status])
      });
    } else if (type === 'routes') {
      autoTable(doc, {
        startY: 35,
        head: [['Route', 'Code', 'From', 'To', 'Fare']],
        body: filteredRoutes.map(r => [r.route_name, r.route_code, r.start_location, r.end_location, `GHS ${r.fare_amount}`])
      });
    } else if (type === 'fuel') {
      autoTable(doc, {
        startY: 35,
        head: [['Date', 'Vehicle', 'Liters', 'Cost/L', 'Total', 'Odometer']],
        body: fuelRecords.map(f => [f.fuel_date, f.vehicle_number, f.liters, f.cost_per_liter, `GHS ${f.total_cost}`, f.odometer_reading])
      });
    } else if (type === 'expenses') {
      autoTable(doc, {
        startY: 35,
        head: [['Category', 'Description', 'Amount', 'Date']],
        body: expenses.map(e => [e.category, e.description, `GHS ${e.amount}`, e.expense_date])
      });
    }
    
    doc.save(`transport_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  const exportToCSV = (type) => {
    let csvContent = '';
    let filename = '';
    
    if (type === 'vehicles') {
      csvContent = 'Vehicle Number,Type,Make,Model,Capacity,Status\n' + 
        filteredVehicles.map(v => `${v.vehicle_number},${v.vehicle_type},${v.make},${v.model},${v.capacity},${v.status}`).join('\n');
      filename = 'vehicles';
    } else if (type === 'fuel') {
      csvContent = 'Date,Vehicle,Liters,Cost/Liter,Total,Odometer\n' + 
        fuelRecords.map(f => `${f.fuel_date},${f.vehicle_number},${f.liters},${f.cost_per_liter},${f.total_cost},${f.odometer_reading}`).join('\n');
      filename = 'fuel_records';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };
  
  const printReport = () => {
    window.print();
  };

  // Calculate stats
  const totalFuelCost = fuelRecords.reduce((sum, f) => sum + parseFloat(f.total_cost || 0), 0);
  const totalMaintenanceCost = maintenance.reduce((sum, m) => sum + parseFloat(m.cost || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const pendingFees = transportFees.filter(f => f.status === 'pending').reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);
  const collectedFees = transportFees.filter(f => f.status === 'paid').reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="text-blue-600" size={32} />Transport Management
          </h1>
          <p className="text-gray-600 mt-1">Manage vehicles, drivers, routes, fuel, and tracking</p>
          {expiryAlerts.length > 0 && (
            <button onClick={() => setShowAlertModal(true)} className="mt-2 flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200">
              <AlertTriangle size={16} /> {expiryAlerts.length} Expiry Alert{expiryAlerts.length > 1 ? 's' : ''}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={printReport} className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <Printer size={16} /> Print
          </button>
          <button onClick={() => exportToPDF(activeTab)} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download size={16} /> Export PDF
          </button>
          <button onClick={() => exportToCSV(activeTab)} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <FileText size={16} /> CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-gray-600 text-xs">Vehicles</p>
          <p className="text-2xl font-bold text-blue-600">{vehicles.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-gray-600 text-xs">Drivers</p>
          <p className="text-2xl font-bold text-green-600">{drivers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <p className="text-gray-600 text-xs">Routes</p>
          <p className="text-2xl font-bold text-purple-600">{routes.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <p className="text-gray-600 text-xs">In Maintenance</p>
          <p className="text-2xl font-bold text-orange-600">{vehicles.filter(v => v.status === 'maintenance').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-cyan-500">
          <p className="text-gray-600 text-xs">Today's Trips</p>
          <p className="text-2xl font-bold text-cyan-600">{assignments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <p className="text-gray-600 text-xs">Fuel Cost</p>
          <p className="text-xl font-bold text-yellow-600">GHS {totalFuelCost.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-gray-600 text-xs">Pending Fees</p>
          <p className="text-xl font-bold text-red-600">GHS {pendingFees.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-emerald-500">
          <p className="text-gray-600 text-xs">Collected</p>
          <p className="text-xl font-bold text-emerald-600">GHS {collectedFees.toLocaleString()}</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search vehicles, drivers, routes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
            <option value="on_leave">On Leave</option>
          </select>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-500" />
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border rounded px-3 py-2 text-sm" />
            <span className="text-gray-400">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border rounded px-3 py-2 text-sm" />
          </div>
          <button onClick={() => { setSearchTerm(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); }} className="text-sm text-gray-500 hover:text-gray-700">
            Clear
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b overflow-x-auto">
          <div className="flex">
            {[
              { id: 'vehicles', label: 'Vehicles', icon: Truck }, 
              { id: 'drivers', label: 'Drivers', icon: UserCheck }, 
              { id: 'routes', label: 'Routes', icon: Route }, 
              { id: 'assignments', label: 'Assignments', icon: Calendar }, 
              { id: 'fuel', label: 'Fuel', icon: Fuel },
              { id: 'maintenance', label: 'Maintenance', icon: Wrench }, 
              { id: 'tracking', label: 'Tracking', icon: Navigation },
              { id: 'pickup', label: 'Pickup/Drop', icon: UserCheck },
              { id: 'history', label: 'History', icon: History },
              { id: 'fees', label: 'Fees', icon: CreditCard },
              { id: 'expenses', label: 'Expenses', icon: DollarSign }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 text-sm ${activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'vehicles' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Fleet Vehicles ({filteredVehicles.length})</h3>
                <button onClick={() => openModal('vehicle')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Add Vehicle</button>
              </div>
              {filteredVehicles.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Truck size={48} className="mx-auto mb-4 text-gray-300" /><p>No vehicles found</p></div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVehicles.map(v => (
                  <div key={v.id} className="border rounded-lg p-4 hover:shadow-lg">
                    <div className="flex justify-between items-start mb-3"><div className="flex items-center gap-2"><Truck className="text-blue-600" size={24} /><div><h4 className="font-semibold">{v.vehicle_number}</h4><p className="text-xs text-gray-500 capitalize">{v.vehicle_type}</p></div></div><span className={`px-2 py-1 rounded text-xs ${getStatusBadge(v.status)}`}>{v.status}</span></div>
                    <div className="space-y-1 text-sm text-gray-600">{v.make && <p>{v.make} {v.model} {v.year}</p>}<p>Capacity: {v.capacity} seats</p>{v.insurance_expiry && <p>Insurance: {v.insurance_expiry}</p>}</div>
                    <div className="flex gap-2 mt-3"><button onClick={() => openModal('vehicle', v)} className="flex-1 px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200 flex items-center justify-center gap-1"><Edit2 size={14} /> Edit</button><button onClick={() => handleDeleteVehicle(v.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"><Trash2 size={14} /></button></div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {activeTab === 'drivers' && (
            <div>
              <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold">Drivers</h3><button onClick={() => openModal('driver')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Add Driver</button></div>
              <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">License</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
                <tbody className="divide-y">{drivers.map(d => (<tr key={d.id} className="hover:bg-gray-50"><td className="px-4 py-3"><p className="font-medium">{d.driver_name}</p></td><td className="px-4 py-3"><p className="flex items-center gap-1 text-sm"><Phone size={14} /> {d.phone}</p></td><td className="px-4 py-3"><p className="text-sm">{d.license_number}</p><p className="text-xs text-gray-500">Exp: {d.license_expiry}</p></td><td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${getStatusBadge(d.status)}`}>{d.status}</span></td><td className="px-4 py-3"><button onClick={() => openModal('driver', d)} className="p-1 hover:bg-gray-100 rounded"><Edit2 size={16} /></button></td></tr>))}</tbody>
              </table></div>
            </div>
          )}

          {activeTab === 'routes' && (
            <div>
              <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold">Transport Routes</h3><button onClick={() => openModal('route')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Add Route</button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routes.map(r => (
                  <div key={r.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3"><div><h4 className="font-semibold flex items-center gap-2"><Route className="text-purple-600" size={20} />{r.route_name}</h4><p className="text-xs text-gray-500">{r.route_code}</p></div><span className={`px-2 py-1 rounded text-xs ${getStatusBadge(r.status)}`}>{r.status}</span></div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2"><MapPin size={16} className="text-green-600" /><span>{r.start_location}</span><ChevronRight size={16} /><span>{r.end_location}</span></div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">{r.total_distance && <span>{r.total_distance} km</span>}<span className="font-semibold text-green-600">GHS {r.fare_amount}</span><span>{r.student_count || 0} students</span></div>
                    <div className="flex gap-2"><button onClick={() => { setSelectedRoute(r); fetchRouteStudents(r.id); }} className="flex-1 px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200">View Students</button><button onClick={() => openModal('route', r)} className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"><Edit2 size={14} /></button></div>
                  </div>
                ))}
              </div>
              {selectedRoute && (<div className="mt-6 border rounded-lg p-4 bg-gray-50"><div className="flex justify-between items-center mb-4"><h4 className="font-semibold">Students on {selectedRoute.route_name}</h4><button onClick={() => setSelectedRoute(null)} className="px-3 py-1 bg-gray-200 rounded text-sm">Close</button></div>{routeStudents.length === 0 ? <p className="text-gray-500 text-center py-4">No students assigned</p> : <div className="overflow-x-auto"><table className="w-full"><thead className="bg-white"><tr><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Student</th><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Class</th><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Stop</th></tr></thead><tbody className="divide-y">{routeStudents.map(s => (<tr key={s.id}><td className="px-3 py-2 font-medium">{s.student_name}</td><td className="px-3 py-2 text-sm">{s.class_name}</td><td className="px-3 py-2 text-sm">{s.stop_name}</td></tr>))}</tbody></table></div>}</div>)}
            </div>
          )}

          {activeTab === 'assignments' && (
            <div>
              <div className="flex justify-between items-center mb-4"><div className="flex items-center gap-4"><h3 className="text-xl font-semibold">Daily Assignments</h3><input type="date" value={assignmentDate} onChange={(e) => setAssignmentDate(e.target.value)} className="border rounded-lg px-3 py-1" /></div><button onClick={() => openModal('assignment')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> New Assignment</button></div>
              {assignments.length === 0 ? <div className="text-center py-12 text-gray-500"><Calendar size={48} className="mx-auto mb-4 text-gray-300" /><p>No assignments for {assignmentDate}</p></div> : <div className="space-y-3">{assignments.map(a => (<div key={a.id} className="border rounded-lg p-4 flex justify-between items-center"><div className="flex items-center gap-4"><div className="bg-blue-100 p-3 rounded-lg"><Truck className="text-blue-600" size={24} /></div><div><p className="font-semibold">{a.vehicle_number} - {a.route_name}</p><p className="text-sm text-gray-600">Driver: {a.driver_name}</p><p className="text-sm text-gray-500">{a.shift} shift | {a.start_time?.substring(0,5)} - {a.end_time?.substring(0,5)}</p></div></div><span className={`px-3 py-1 rounded text-sm ${getStatusBadge(a.status)}`}>{a.status}</span></div>))}</div>}
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div>
              <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold">Vehicle Maintenance</h3><button onClick={() => openModal('maintenance')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Schedule Maintenance</button></div>
              {maintenance.length === 0 ? <div className="text-center py-12 text-gray-500"><Wrench size={48} className="mx-auto mb-4 text-gray-300" /><p>No upcoming maintenance</p></div> : <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th></tr></thead><tbody className="divide-y">{maintenance.map(m => (<tr key={m.id} className="hover:bg-gray-50"><td className="px-4 py-3 font-medium">{m.vehicle_number}</td><td className="px-4 py-3 capitalize">{m.maintenance_type}</td><td className="px-4 py-3 text-sm">{m.description}</td><td className="px-4 py-3">{m.maintenance_date}</td><td className="px-4 py-3">{m.cost ? `GHS ${m.cost}` : '-'}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${getStatusBadge(m.status)}`}>{m.status}</span></td></tr>))}</tbody></table></div>}
            </div>
          )}

          {activeTab === 'tracking' && (
            <div>
              <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold">Live Vehicle Tracking</h3><button onClick={fetchTracking} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"><RefreshCw size={18} /> Refresh</button></div>
              {tracking.length === 0 ? <div className="text-center py-12 text-gray-500"><Navigation size={48} className="mx-auto mb-4 text-gray-300" /><p>No active tracking data</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{tracking.map(t => (<div key={t.id} className="border rounded-lg p-4"><div className="flex justify-between items-start mb-3"><div className="flex items-center gap-2"><div className={`p-2 rounded-full ${t.status === 'moving' ? 'bg-green-100' : 'bg-yellow-100'}`}><Truck className={t.status === 'moving' ? 'text-green-600' : 'text-yellow-600'} size={20} /></div><div><p className="font-semibold">{t.vehicle_number}</p><p className="text-xs text-gray-500">{t.vehicle_type}</p></div></div><span className={`px-2 py-1 rounded text-xs ${getStatusBadge(t.status)}`}>{t.status}</span></div>{t.route_name && <p className="text-sm text-gray-600 mb-1">Route: {t.route_name}</p>}{t.driver_name && <p className="text-sm text-gray-600 mb-1">Driver: {t.driver_name}</p>}{t.speed && <p className="text-sm text-gray-600">Speed: {t.speed} km/h</p>}{t.latitude && <p className="text-xs text-gray-500 mt-2">📍 {t.latitude}, {t.longitude}</p>}</div>))}</div>}
            </div>
          )}

          {/* FUEL TAB */}
          {activeTab === 'fuel' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Fuel Management</h3>
                <button onClick={() => openModal('fuel')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Add Fuel Record</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-yellow-600 text-sm">Total Fuel Cost</p>
                  <p className="text-2xl font-bold text-yellow-700">GHS {totalFuelCost.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-blue-600 text-sm">Total Liters</p>
                  <p className="text-2xl font-bold text-blue-700">{fuelRecords.reduce((sum, f) => sum + parseFloat(f.liters || 0), 0).toLocaleString()} L</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-green-600 text-sm">Avg Cost/Liter</p>
                  <p className="text-2xl font-bold text-green-700">GHS {fuelRecords.length > 0 ? (fuelRecords.reduce((sum, f) => sum + parseFloat(f.cost_per_liter || 0), 0) / fuelRecords.length).toFixed(2) : '0.00'}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-purple-600 text-sm">Records</p>
                  <p className="text-2xl font-bold text-purple-700">{fuelRecords.length}</p>
                </div>
              </div>
              {fuelRecords.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Fuel size={48} className="mx-auto mb-4 text-gray-300" /><p>No fuel records found</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liters</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost/L</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Odometer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Station</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {fuelRecords.map(f => (
                        <tr key={f.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{f.fuel_date}</td>
                          <td className="px-4 py-3 font-medium">{f.vehicle_number}</td>
                          <td className="px-4 py-3">{f.liters} L</td>
                          <td className="px-4 py-3">GHS {f.cost_per_liter}</td>
                          <td className="px-4 py-3 font-semibold text-green-600">GHS {f.total_cost}</td>
                          <td className="px-4 py-3">{f.odometer_reading} km</td>
                          <td className="px-4 py-3 text-sm">{f.fuel_station || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PICKUP/DROP TAB */}
          {activeTab === 'pickup' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-semibold">Student Pickup/Drop Tracking</h3>
                  <input type="date" value={assignmentDate} onChange={(e) => setAssignmentDate(e.target.value)} className="border rounded-lg px-3 py-1" />
                </div>
                <button onClick={fetchPickupTracking} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"><RefreshCw size={18} /> Refresh</button>
              </div>
              {pickupTracking.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><UserCheck size={48} className="mx-auto mb-4 text-gray-300" /><p>No pickup tracking data for {assignmentDate}</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stop</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Morning</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Afternoon</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {pickupTracking.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{p.student_name}</td>
                          <td className="px-4 py-3">{p.route_name}</td>
                          <td className="px-4 py-3 text-sm">{p.stop_name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(p.morning_status || 'pending')}`}>
                              {p.morning_status || 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(p.afternoon_status || 'pending')}`}>
                              {p.afternoon_status || 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => handlePickupStatus(p.student_id, 'picked_up')} className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200" title="Mark Picked Up"><CheckCircle size={16} /></button>
                              <button onClick={() => handlePickupStatus(p.student_id, 'dropped_off')} className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200" title="Mark Dropped Off"><CheckCircle size={16} /></button>
                              <button onClick={() => handlePickupStatus(p.student_id, 'absent')} className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200" title="Mark Absent"><XCircle size={16} /></button>
                              <button onClick={() => sendParentNotification(p.student_id, `Your child ${p.student_name} has been picked up.`)} className="p-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200" title="Notify Parent"><Send size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Trip History</h3>
                <button onClick={() => exportToPDF('history')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"><Download size={18} /> Export</button>
              </div>
              {tripHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><History size={48} className="mx-auto mb-4 text-gray-300" /><p>No trip history found</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {tripHistory.map(t => (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{t.trip_date}</td>
                          <td className="px-4 py-3 font-medium">{t.vehicle_number}</td>
                          <td className="px-4 py-3">{t.driver_name}</td>
                          <td className="px-4 py-3">{t.route_name}</td>
                          <td className="px-4 py-3 text-sm">{t.start_time?.substring(0,5)}</td>
                          <td className="px-4 py-3 text-sm">{t.end_time?.substring(0,5)}</td>
                          <td className="px-4 py-3">{t.students_count || 0}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${getStatusBadge(t.status)}`}>{t.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* FEES TAB */}
          {activeTab === 'fees' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Transport Fees</h3>
                <button onClick={() => setShowFeeModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Add Fee</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-green-600 text-sm">Collected</p>
                  <p className="text-2xl font-bold text-green-700">GHS {collectedFees.toLocaleString()}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-yellow-600 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-yellow-700">GHS {pendingFees.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-blue-600 text-sm">Total Students</p>
                  <p className="text-2xl font-bold text-blue-700">{transportFees.length}</p>
                </div>
              </div>
              {transportFees.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><CreditCard size={48} className="mx-auto mb-4 text-gray-300" /><p>No transport fees found</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {transportFees.map(f => (
                        <tr key={f.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{f.student_name}</td>
                          <td className="px-4 py-3">{f.route_name}</td>
                          <td className="px-4 py-3">{f.term}</td>
                          <td className="px-4 py-3 font-semibold">GHS {f.amount}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${getStatusBadge(f.status)}`}>{f.status}</span></td>
                          <td className="px-4 py-3">
                            {f.status === 'pending' && (
                              <button onClick={async () => { await axios.put(`${API}?resource=transport_fees&id=${f.id}`, { status: 'paid' }); fetchTransportFees(); }} className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200">Mark Paid</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* EXPENSES TAB */}
          {activeTab === 'expenses' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Transport Expenses</h3>
                <button onClick={() => setShowExpenseModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Add Expense</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-red-600 text-sm">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-700">GHS {totalExpenses.toLocaleString()}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-yellow-600 text-sm">Fuel</p>
                  <p className="text-2xl font-bold text-yellow-700">GHS {totalFuelCost.toLocaleString()}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="text-orange-600 text-sm">Maintenance</p>
                  <p className="text-2xl font-bold text-orange-700">GHS {totalMaintenanceCost.toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-purple-600 text-sm">Other</p>
                  <p className="text-2xl font-bold text-purple-700">GHS {(totalExpenses - totalFuelCost - totalMaintenanceCost).toLocaleString()}</p>
                </div>
              </div>
              {expenses.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><DollarSign size={48} className="mx-auto mb-4 text-gray-300" /><p>No expenses found</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {expenses.map(e => (
                        <tr key={e.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{e.expense_date}</td>
                          <td className="px-4 py-3 capitalize">{e.category}</td>
                          <td className="px-4 py-3">{e.description}</td>
                          <td className="px-4 py-3">{e.vehicle_number || '-'}</td>
                          <td className="px-4 py-3 font-semibold text-red-600">GHS {e.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white flex justify-between items-center"><h2 className="text-xl font-bold">{modalType === 'vehicle' && (editingItem ? 'Edit Vehicle' : 'Add Vehicle')}{modalType === 'driver' && (editingItem ? 'Edit Driver' : 'Add Driver')}{modalType === 'route' && (editingItem ? 'Edit Route' : 'Add Route')}{modalType === 'assignment' && 'New Assignment'}{modalType === 'maintenance' && 'Schedule Maintenance'}</h2><button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button></div>
            <div className="p-6">
              {modalType === 'vehicle' && (<form onSubmit={handleSaveVehicle} className="space-y-4"><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Vehicle Number *</label><input type="text" value={vehicleForm.vehicle_number} onChange={(e) => setVehicleForm({...vehicleForm, vehicle_number: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div><div><label className="block text-sm font-medium mb-1">Type</label><select value={vehicleForm.vehicle_type} onChange={(e) => setVehicleForm({...vehicleForm, vehicle_type: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="bus">Bus</option><option value="van">Van</option><option value="minibus">Minibus</option><option value="car">Car</option></select></div></div><div className="grid grid-cols-3 gap-4"><div><label className="block text-sm font-medium mb-1">Make</label><input type="text" value={vehicleForm.make} onChange={(e) => setVehicleForm({...vehicleForm, make: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div><div><label className="block text-sm font-medium mb-1">Model</label><input type="text" value={vehicleForm.model} onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div><div><label className="block text-sm font-medium mb-1">Year</label><input type="number" value={vehicleForm.year} onChange={(e) => setVehicleForm({...vehicleForm, year: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Capacity *</label><input type="number" value={vehicleForm.capacity} onChange={(e) => setVehicleForm({...vehicleForm, capacity: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div><div><label className="block text-sm font-medium mb-1">Fuel</label><select value={vehicleForm.fuel_type} onChange={(e) => setVehicleForm({...vehicleForm, fuel_type: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="diesel">Diesel</option><option value="petrol">Petrol</option><option value="electric">Electric</option></select></div></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Insurance Expiry</label><input type="date" value={vehicleForm.insurance_expiry} onChange={(e) => setVehicleForm({...vehicleForm, insurance_expiry: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div><div><label className="block text-sm font-medium mb-1">Fitness Expiry</label><input type="date" value={vehicleForm.fitness_certificate_expiry} onChange={(e) => setVehicleForm({...vehicleForm, fitness_certificate_expiry: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div></div><div><label className="block text-sm font-medium mb-1">Status</label><select value={vehicleForm.status} onChange={(e) => setVehicleForm({...vehicleForm, status: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="active">Active</option><option value="maintenance">Maintenance</option><option value="inactive">Inactive</option></select></div><div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save</button></div></form>)}
              {modalType === 'driver' && (<form onSubmit={handleSaveDriver} className="space-y-4"><div><label className="block text-sm font-medium mb-1">Name *</label><input type="text" value={driverForm.driver_name} onChange={(e) => setDriverForm({...driverForm, driver_name: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Phone *</label><input type="text" value={driverForm.phone} onChange={(e) => setDriverForm({...driverForm, phone: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div><div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={driverForm.email} onChange={(e) => setDriverForm({...driverForm, email: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">License *</label><input type="text" value={driverForm.license_number} onChange={(e) => setDriverForm({...driverForm, license_number: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div><div><label className="block text-sm font-medium mb-1">License Expiry *</label><input type="date" value={driverForm.license_expiry} onChange={(e) => setDriverForm({...driverForm, license_expiry: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div></div><div><label className="block text-sm font-medium mb-1">Address</label><textarea value={driverForm.address} onChange={(e) => setDriverForm({...driverForm, address: e.target.value})} className="w-full border rounded-lg px-3 py-2" rows={2} /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Emergency Contact</label><input type="text" value={driverForm.emergency_contact_name} onChange={(e) => setDriverForm({...driverForm, emergency_contact_name: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div><div><label className="block text-sm font-medium mb-1">Emergency Phone</label><input type="text" value={driverForm.emergency_contact_phone} onChange={(e) => setDriverForm({...driverForm, emergency_contact_phone: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div></div><div><label className="block text-sm font-medium mb-1">Status</label><select value={driverForm.status} onChange={(e) => setDriverForm({...driverForm, status: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="active">Active</option><option value="on_leave">On Leave</option><option value="suspended">Suspended</option><option value="inactive">Inactive</option></select></div><div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save</button></div></form>)}
              {modalType === 'route' && (<form onSubmit={handleSaveRoute} className="space-y-4"><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Route Name *</label><input type="text" value={routeForm.route_name} onChange={(e) => setRouteForm({...routeForm, route_name: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div><div><label className="block text-sm font-medium mb-1">Route Code *</label><input type="text" value={routeForm.route_code} onChange={(e) => setRouteForm({...routeForm, route_code: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Start Location *</label><input type="text" value={routeForm.start_location} onChange={(e) => setRouteForm({...routeForm, start_location: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div><div><label className="block text-sm font-medium mb-1">End Location *</label><input type="text" value={routeForm.end_location} onChange={(e) => setRouteForm({...routeForm, end_location: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div></div><div className="grid grid-cols-3 gap-4"><div><label className="block text-sm font-medium mb-1">Distance (km)</label><input type="number" step="0.1" value={routeForm.total_distance} onChange={(e) => setRouteForm({...routeForm, total_distance: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div><div><label className="block text-sm font-medium mb-1">Duration (mins)</label><input type="number" value={routeForm.estimated_duration} onChange={(e) => setRouteForm({...routeForm, estimated_duration: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div><div><label className="block text-sm font-medium mb-1">Fare (GHS) *</label><input type="number" step="0.01" value={routeForm.fare_amount} onChange={(e) => setRouteForm({...routeForm, fare_amount: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div></div><div><label className="block text-sm font-medium mb-1">Status</label><select value={routeForm.status} onChange={(e) => setRouteForm({...routeForm, status: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="active">Active</option><option value="inactive">Inactive</option></select></div><div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save</button></div></form>)}
              {modalType === 'assignment' && (<form onSubmit={handleSaveAssignment} className="space-y-4"><div><label className="block text-sm font-medium mb-1">Vehicle *</label><select value={assignmentForm.vehicle_id} onChange={(e) => setAssignmentForm({...assignmentForm, vehicle_id: e.target.value})} className="w-full border rounded-lg px-3 py-2" required><option value="">Select</option>{vehicles.filter(v => v.status === 'active').map(v => <option key={v.id} value={v.id}>{v.vehicle_number} ({v.capacity} seats)</option>)}</select></div><div><label className="block text-sm font-medium mb-1">Driver *</label><select value={assignmentForm.driver_id} onChange={(e) => setAssignmentForm({...assignmentForm, driver_id: e.target.value})} className="w-full border rounded-lg px-3 py-2" required><option value="">Select</option>{drivers.filter(d => d.status === 'active').map(d => <option key={d.id} value={d.id}>{d.driver_name}</option>)}</select></div><div><label className="block text-sm font-medium mb-1">Route *</label><select value={assignmentForm.route_id} onChange={(e) => setAssignmentForm({...assignmentForm, route_id: e.target.value})} className="w-full border rounded-lg px-3 py-2" required><option value="">Select</option>{routes.filter(r => r.status === 'active').map(r => <option key={r.id} value={r.id}>{r.route_name}</option>)}</select></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Date *</label><input type="date" value={assignmentForm.assignment_date} onChange={(e) => setAssignmentForm({...assignmentForm, assignment_date: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div><div><label className="block text-sm font-medium mb-1">Shift</label><select value={assignmentForm.shift} onChange={(e) => setAssignmentForm({...assignmentForm, shift: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="both">Both</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option></select></div></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Start Time</label><input type="time" value={assignmentForm.start_time} onChange={(e) => setAssignmentForm({...assignmentForm, start_time: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div><div><label className="block text-sm font-medium mb-1">End Time</label><input type="time" value={assignmentForm.end_time} onChange={(e) => setAssignmentForm({...assignmentForm, end_time: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div></div><div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Create</button></div></form>)}
              {modalType === 'maintenance' && (<form onSubmit={handleSaveMaintenance} className="space-y-4"><div><label className="block text-sm font-medium mb-1">Vehicle *</label><select value={maintenanceForm.vehicle_id} onChange={(e) => setMaintenanceForm({...maintenanceForm, vehicle_id: e.target.value})} className="w-full border rounded-lg px-3 py-2" required><option value="">Select</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}</select></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Type</label><select value={maintenanceForm.maintenance_type} onChange={(e) => setMaintenanceForm({...maintenanceForm, maintenance_type: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="routine">Routine</option><option value="repair">Repair</option><option value="inspection">Inspection</option><option value="emergency">Emergency</option></select></div><div><label className="block text-sm font-medium mb-1">Date *</label><input type="date" value={maintenanceForm.maintenance_date} onChange={(e) => setMaintenanceForm({...maintenanceForm, maintenance_date: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div></div><div><label className="block text-sm font-medium mb-1">Description *</label><textarea value={maintenanceForm.description} onChange={(e) => setMaintenanceForm({...maintenanceForm, description: e.target.value})} className="w-full border rounded-lg px-3 py-2" rows={2} required /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Cost (GHS)</label><input type="number" step="0.01" value={maintenanceForm.cost} onChange={(e) => setMaintenanceForm({...maintenanceForm, cost: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div><div><label className="block text-sm font-medium mb-1">Service Provider</label><input type="text" value={maintenanceForm.service_provider} onChange={(e) => setMaintenanceForm({...maintenanceForm, service_provider: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div></div><div><label className="block text-sm font-medium mb-1">Next Service Date</label><input type="date" value={maintenanceForm.next_service_date} onChange={(e) => setMaintenanceForm({...maintenanceForm, next_service_date: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div><button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Save</button></form>)}
              {modalType === 'fuel' && (<form onSubmit={handleSaveFuel} className="space-y-4"><div><label className="block text-sm font-medium mb-1">Vehicle *</label><select value={fuelForm.vehicle_id} onChange={(e) => setFuelForm({...fuelForm, vehicle_id: e.target.value})} className="w-full border rounded-lg px-3 py-2" required><option value="">Select</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}</select></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Date *</label><input type="date" value={fuelForm.fuel_date} onChange={(e) => setFuelForm({...fuelForm, fuel_date: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div><div><label className="block text-sm font-medium mb-1">Liters *</label><input type="number" step="0.01" value={fuelForm.liters} onChange={(e) => setFuelForm({...fuelForm, liters: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Cost/Liter *</label><input type="number" step="0.01" value={fuelForm.cost_per_liter} onChange={(e) => setFuelForm({...fuelForm, cost_per_liter: e.target.value, total_cost: (parseFloat(e.target.value) * parseFloat(fuelForm.liters || 0)).toFixed(2)})} className="w-full border rounded-lg px-3 py-2" required /></div><div><label className="block text-sm font-medium mb-1">Total Cost</label><input type="number" step="0.01" value={fuelForm.total_cost} onChange={(e) => setFuelForm({...fuelForm, total_cost: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-gray-50" readOnly /></div></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Odometer</label><input type="number" value={fuelForm.odometer_reading} onChange={(e) => setFuelForm({...fuelForm, odometer_reading: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div><div><label className="block text-sm font-medium mb-1">Fuel Station</label><input type="text" value={fuelForm.fuel_station} onChange={(e) => setFuelForm({...fuelForm, fuel_station: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div></div><div><label className="block text-sm font-medium mb-1">Notes</label><textarea value={fuelForm.notes} onChange={(e) => setFuelForm({...fuelForm, notes: e.target.value})} className="w-full border rounded-lg px-3 py-2" rows={2} /></div><button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Save Fuel Record</button></form>)}
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2"><AlertTriangle className="text-red-600" /> Expiry Alerts</h2>
              <button onClick={() => setShowAlertModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-3">
              {expiryAlerts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No alerts</p>
              ) : (
                expiryAlerts.map((alert, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border ${alert.severity === 'expired' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={alert.severity === 'expired' ? 'text-red-600' : 'text-yellow-600'} size={20} />
                      <div>
                        <p className="font-medium capitalize">{alert.type} {alert.severity === 'expired' ? 'Expired' : 'Expiring Soon'}</p>
                        <p className="text-sm text-gray-600">{alert.vehicle || alert.driver} - Expires: {alert.expiry}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fee Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Add Transport Fee</h2>
              <button onClick={() => setShowFeeModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveFee} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Student *</label>
                <select value={feeForm.student_id} onChange={(e) => setFeeForm({...feeForm, student_id: e.target.value})} className="w-full border rounded-lg px-3 py-2" required>
                  <option value="">Select Student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Route *</label>
                <select value={feeForm.route_id} onChange={(e) => setFeeForm({...feeForm, route_id: e.target.value})} className="w-full border rounded-lg px-3 py-2" required>
                  <option value="">Select Route</option>
                  {routes.map(r => <option key={r.id} value={r.id}>{r.route_name} - GHS {r.fare_amount}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount *</label>
                  <input type="number" step="0.01" value={feeForm.amount} onChange={(e) => setFeeForm({...feeForm, amount: e.target.value})} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Term *</label>
                  <input type="text" value={feeForm.term} onChange={(e) => setFeeForm({...feeForm, term: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="e.g. Term 1" required />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Save Fee</button>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Add Expense</h2>
              <button onClick={() => setShowExpenseModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={async (e) => { e.preventDefault(); const formData = new FormData(e.target); try { await axios.post(`${API}?resource=expenses`, Object.fromEntries(formData)); alert('Expense saved!'); fetchExpenses(); setShowExpenseModal(false); } catch (err) { alert('Failed'); } }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select name="category" className="w-full border rounded-lg px-3 py-2" required>
                  <option value="">Select</option>
                  <option value="fuel">Fuel</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="insurance">Insurance</option>
                  <option value="salary">Driver Salary</option>
                  <option value="toll">Toll/Parking</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vehicle</label>
                <select name="vehicle_id" className="w-full border rounded-lg px-3 py-2">
                  <option value="">Select (Optional)</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea name="description" className="w-full border rounded-lg px-3 py-2" rows={2} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount *</label>
                  <input type="number" step="0.01" name="amount" className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input type="date" name="expense_date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full border rounded-lg px-3 py-2" required />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Save Expense</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
