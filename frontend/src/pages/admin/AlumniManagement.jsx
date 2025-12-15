import { useState, useEffect } from 'react';
import {
  Users, GraduationCap, Calendar, DollarSign, Award, Briefcase,
  MapPin, Link2, Search, Plus, Filter, RefreshCw, Eye, Edit,
  Check, X, Mail, Phone, Globe, Heart, Target, TrendingUp
} from 'lucide-react';
import { API_BASE_URL } from '../../config';
import axios from 'axios';
import StatCard, { DataCard, EmptyState } from '../../components/shared/StatCard';

const API = `${API_BASE_URL}/alumni.php`;

export default function AlumniManagement() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [alumni, setAlumni] = useState([]);
  const [events, setEvents] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [filters, setFilters] = useState({ year: '', industry: '', status: 'active' });
  const [showModal, setShowModal] = useState(null);
  const [selectedAlumni, setSelectedAlumni] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'alumni') fetchAlumni();
    if (activeTab === 'events') fetchEvents();
    if (activeTab === 'donations') { fetchCampaigns(); fetchDonations(); }
    if (activeTab === 'statistics') fetchStatistics();
  }, [activeTab, filters]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}?action=dashboard`);
      setDashboard(res.data.dashboard);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlumni = async () => {
    try {
      const params = new URLSearchParams({ action: 'list', ...filters });
      const res = await axios.get(`${API}?${params}`);
      setAlumni(res.data.alumni || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API}?action=events&status=published`);
      setEvents(res.data.events || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get(`${API}?action=campaigns&status=active`);
      setCampaigns(res.data.campaigns || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDonations = async () => {
    try {
      const res = await axios.get(`${API}?action=donation_stats`);
      setDonations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStatistics = async () => {
    try {
      const res = await axios.get(`${API}?action=statistics`);
      setStatistics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const verifyAlumni = async (alumniId, status) => {
    try {
      await axios.post(`${API}?action=verify`, { alumni_id: alumniId, status });
      fetchAlumni();
      fetchDashboard();
    } catch (err) {
      alert('Failed to verify alumni');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount || 0);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'alumni', label: 'Alumni Directory', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'donations', label: 'Donations', icon: Heart },
    { id: 'statistics', label: 'Statistics', icon: Target }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alumni Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Connect with graduates, manage events & donations</p>
        </div>
        <button onClick={fetchDashboard} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Alumni" value={dashboard?.total_alumni || 0} color="blue" loading={loading} />
            <StatCard icon={Check} label="Verified" value={dashboard?.verified_alumni || 0} color="green" loading={loading} />
            <StatCard icon={GraduationCap} label="Active Mentors" value={dashboard?.active_mentors || 0} color="purple" loading={loading} />
            <StatCard icon={DollarSign} label="Total Donations" value={formatCurrency(dashboard?.total_donations)} color="yellow" loading={loading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Verifications */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Pending Verifications</h3>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                  {dashboard.pending_verification}
                </span>
              </div>
              <div className="space-y-3">
                {dashboard.recent_registrations?.slice(0, 5).map((reg, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{reg.first_name} {reg.last_name}</p>
                      <p className="text-sm text-gray-500">Class of {reg.graduation_year}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => verifyAlumni(reg.id, true)} className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => verifyAlumni(reg.id, false)} className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Upcoming Events</h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {dashboard.upcoming_events}
                </span>
              </div>
              <button onClick={() => setActiveTab('events')} className="w-full py-3 text-blue-600 hover:bg-blue-50 rounded-lg text-sm">
                View All Events
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alumni Directory Tab */}
      {activeTab === 'alumni' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search alumni..." className="pl-9 pr-4 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 w-64" />
              </div>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">All Years</option>
                {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Add Alumni
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alumni.map((alum, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {alum.first_name?.[0]}{alum.last_name?.[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{alum.first_name} {alum.last_name}</h4>
                      {alum.is_verified && <Check className="w-4 h-4 text-green-500" />}
                    </div>
                    <p className="text-sm text-gray-500">Class of {alum.graduation_year}</p>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2 text-sm">
                  {alum.current_occupation && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Briefcase className="w-4 h-4" />
                      <span>{alum.current_occupation}</span>
                    </div>
                  )}
                  {alum.current_company && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Globe className="w-4 h-4" />
                      <span>{alum.current_company}</span>
                    </div>
                  )}
                  {(alum.location_city || alum.location_country) && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{[alum.location_city, alum.location_country].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  {alum.is_mentor && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Mentor</span>
                  )}
                  {alum.industry && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{alum.industry}</span>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t dark:border-gray-700 flex gap-2">
                  <button className="flex-1 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg">View Profile</button>
                  <button className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Contact</button>
                </div>
              </div>
            ))}
            {alumni.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">No alumni found</div>
            )}
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowModal('event')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Create Event
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Calendar className="w-12 h-12 text-white/80" />
                </div>
                <div className="p-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    event.event_type === 'reunion' ? 'bg-purple-100 text-purple-700' :
                    event.event_type === 'networking' ? 'bg-blue-100 text-blue-700' :
                    event.event_type === 'fundraiser' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{event.event_type}</span>
                  
                  <h4 className="font-semibold text-gray-900 dark:text-white mt-2">{event.title}</h4>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                  
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.event_date).toLocaleDateString()}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.is_virtual && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Globe className="w-4 h-4" />
                        <span>Virtual Event</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">{event.registered_count || 0} registered</span>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">No events scheduled</div>
            )}
          </div>
        </div>
      )}

      {/* Donations Tab */}
      {activeTab === 'donations' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {donations.totals && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Total Raised</h3>
                <p className="text-3xl font-bold">{formatCurrency(donations.totals.total_amount)}</p>
                <p className="text-sm text-green-100 mt-1">{donations.totals.total_donations} donations</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Unique Donors</h3>
                <p className="text-3xl font-bold">{donations.totals.unique_donors}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Active Campaigns</h3>
                <p className="text-3xl font-bold">{campaigns.length}</p>
              </div>
            </div>
          )}

          {/* Campaigns */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Active Campaigns</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" /> New Campaign
              </button>
            </div>
            <div className="space-y-4">
              {campaigns.map((campaign, i) => (
                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{campaign.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      campaign.campaign_type === 'scholarship' ? 'bg-purple-100 text-purple-700' :
                      campaign.campaign_type === 'infrastructure' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{campaign.campaign_type}</span>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium">
                        {formatCurrency(campaign.raised_amount)} / {formatCurrency(campaign.goal_amount)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${Math.min(100, (campaign.raised_amount / campaign.goal_amount) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round((campaign.raised_amount / campaign.goal_amount) * 100)}% of goal
                    </p>
                  </div>
                </div>
              ))}
              {campaigns.length === 0 && (
                <p className="text-center py-4 text-gray-500">No active campaigns</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && statistics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Year */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Alumni by Graduation Year</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {statistics.by_year?.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-gray-600 dark:text-gray-400">{item.graduation_year}</span>
                  <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, (item.count / 50) * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 text-sm font-medium text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By Industry */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Alumni by Industry</h3>
            <div className="space-y-2">
              {statistics.by_industry?.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-32 text-sm text-gray-600 dark:text-gray-400 truncate">{item.industry}</span>
                  <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${Math.min(100, (item.count / 30) * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 text-sm font-medium text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By Location */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Alumni by Location</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statistics.by_location?.map((item, i) => (
                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.count}</p>
                  <p className="text-sm text-gray-500">{item.location_country}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
