import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Zap, 
  Server, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  RefreshCw,
  Download,
  Eye,
  Trash2,
  BarChart3,
  Activity,
  HardDrive,
  Cpu,
  Calendar,
  DollarSign
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [systemResources, setSystemResources] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, queueRes, jobsRes, usersRes, resourcesRes] = await Promise.all([
        fetch('/api/training/stats', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }}),
        fetch('/api/training/queue', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }}),
        fetch('/api/training/jobs', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }}),
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }}),
        fetch('/api/admin/resources', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }})
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (queueRes.ok) setQueue(await queueRes.json());
      if (jobsRes.ok) setJobs((await jobsRes.json()).jobs || []);
      if (usersRes.ok) setUsers((await usersRes.json()).users || []);
      if (resourcesRes.ok) setSystemResources(await resourcesRes.json());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelJob = async (jobId) => {
    if (!confirm('Are you sure you want to cancel this job?')) return;
    
    try {
      const response = await fetch(`/api/training/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'yellow',
      'training': 'blue',
      'completed': 'green',
      'failed': 'red',
      'cancelled': 'gray'
    };
    return colors[status] || 'gray';
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime) return 'N/A';
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = (end - start) / (1000 * 60); // minutes
    
    if (duration < 60) return `${Math.round(duration)}m`;
    return `${Math.round(duration / 60)}h ${Math.round(duration % 60)}m`;
  };

  const StatsCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          <span className="text-sm text-green-600">{trend}</span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor training jobs, users, and system resources</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Jobs"
          value={stats?.status_distribution ? Object.values(stats.status_distribution).reduce((a, b) => a + b, 0) : 0}
          subtitle={`${stats?.recent_jobs_count || 0} this week`}
          icon={BarChart3}
          color="blue"
        />
        
        <StatsCard
          title="Active Users"
          value={users.filter(u => u.is_active).length}
          subtitle={`${users.length} total users`}
          icon={Users}
          color="green"
        />
        
        <StatsCard
          title="Queue Length"
          value={queue?.queue_length || 0}
          subtitle={`${queue?.running_jobs || 0} running`}
          icon={Clock}
          color="orange"
        />
        
        <StatsCard
          title="GPU Hours"
          value={`${stats?.total_gpu_hours || 0}h`}
          subtitle={`~${((stats?.total_gpu_hours || 0) * 2.5).toFixed(0)} cost`}
          icon={Zap}
          color="purple"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'jobs', label: 'Training Jobs', icon: Zap },
            { id: 'queue', label: 'Queue Management', icon: Clock },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'resources', label: 'System Resources', icon: Server }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Status Distribution Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Job Status Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {stats?.status_distribution && Object.entries(stats.status_distribution).map(([status, count]) => {
                const color = getStatusColor(status);
                return (
                  <div key={status} className="text-center">
                    <div className={`w-16 h-16 mx-auto rounded-full bg-${color}-100 flex items-center justify-center mb-2`}>
                      <span className={`text-xl font-bold text-${color}-600`}>{count}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{status.replace('_', ' ')}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Training Jobs</h3>
            <div className="space-y-3">
              {jobs.slice(0, 5).map(job => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full bg-${getStatusColor(job.status)}-500`}></div>
                    <div>
                      <p className="font-medium">Product #{job.product_id}</p>
                      <p className="text-sm text-gray-500">User #{job.user_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium capitalize">{job.status}</p>
                    <p className="text-xs text-gray-500">{formatDuration(job.created_at, job.completed_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'jobs' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">All Training Jobs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobs.map(job => (
                  <tr key={job.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      {job.job_id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      Product #{job.product_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      User #{job.user_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor(job.status)}-100 text-${getStatusColor(job.status)}-800 capitalize`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {job.status === 'training' ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${job.progress || 0}%` }}
                            ></div>
                          </div>
                          <span>{job.progress || 0}%</span>
                        </div>
                      ) : (
                        <span>{job.progress || 0}%</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatDuration(job.started_at, job.completed_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <Eye className="w-4 h-4" />
                      </button>
                      {(job.status === 'training' || job.status === 'pending') && (
                        <button
                          onClick={() => cancelJob(job.job_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'queue' && (
        <div className="space-y-6">
          {/* Queue Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Queue Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{queue?.queue_length || 0}</div>
                <div className="text-sm text-gray-600">Jobs in Queue</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{queue?.running_jobs || 0}</div>
                <div className="text-sm text-gray-600">Running Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{queue?.estimated_wait_time || 'N/A'}</div>
                <div className="text-sm text-gray-600">Est. Wait Time</div>
              </div>
            </div>
          </div>

          {/* Node Status */}
          {queue?.nodes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Compute Nodes</h3>
              <div className="space-y-4">
                {Object.entries(queue.nodes).map(([nodeId, node]) => (
                  <div key={nodeId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{nodeId}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${node.healthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {node.healthy ? 'Healthy' : 'Unhealthy'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">VRAM:</span>
                        <span className="ml-1 font-medium">{node.available_vram}GB available</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Jobs:</span>
                        <span className="ml-1 font-medium">{node.current_jobs}/{node.max_concurrent}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Utilization:</span>
                        <span className="ml-1 font-medium">{Math.round((node.current_jobs / node.max_concurrent) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'users' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">User Management</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Training Jobs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                        {user.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {jobs.filter(job => job.user_id === user.id).length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">Edit</button>
                      <button className="text-red-600 hover:text-red-800">Disable</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'resources' && systemResources && (
        <div className="space-y-6">
          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="GPU Memory"
              value={`${systemResources.gpu_memory_used}GB`}
              subtitle={`of ${systemResources.gpu_memory_total}GB`}
              icon={Zap}
              color="blue"
            />
            <StatsCard
              title="CPU Usage"
              value={`${systemResources.cpu_usage}%`}
              subtitle={`${systemResources.cpu_cores} cores`}
              icon={Cpu}
              color="green"
            />
            <StatsCard
              title="RAM Usage"
              value={`${systemResources.ram_used}GB`}
              subtitle={`of ${systemResources.ram_total}GB`}
              icon={HardDrive}
              color="orange"
            />
            <StatsCard
              title="Uptime"
              value={systemResources.uptime}
              subtitle="System uptime"
              icon={Activity}
              color="purple"
            />
          </div>

          {/* Detailed Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Resource Utilization</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>GPU Memory</span>
                  <span>{Math.round((systemResources.gpu_memory_used / systemResources.gpu_memory_total) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(systemResources.gpu_memory_used / systemResources.gpu_memory_total) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>CPU Usage</span>
                  <span>{systemResources.cpu_usage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${systemResources.cpu_usage}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>RAM Usage</span>
                  <span>{Math.round((systemResources.ram_used / systemResources.ram_total) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${(systemResources.ram_used / systemResources.ram_total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;