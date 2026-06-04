import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAdminWorklogAnalytics, getDailyWorkLogHistory } from '../../services/api';
import {
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  Input,
  Spinner,
  PageHeader,
  EmptyState,
  Modal
} from '../../components/common/UI';
import {
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Search,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const WorkReports = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname === '/admin/time-tracking' ? 'logs' : 'analytics';

  // State for analytics data
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // State for logs list
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters State
  const [inputSearch, setInputSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal State
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch Admin Analytics
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await getAdminWorklogAnalytics();
      if (res.data.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load admin analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // Fetch Logs List based on filters & page
  const fetchLogs = useCallback(async (page = 1, search = '', date = '', status = '') => {
    setLogsLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (date) params.date = date;
      if (status) params.status = status;

      const res = await getDailyWorkLogHistory(params);
      if (res.data.success) {
        setLogs(res.data.logs);
        setTotalPages(res.data.pagination.pages || 1);
        setCurrentPage(res.data.pagination.currentPage || 1);
        setTotalItems(res.data.pagination.total || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load work logs');
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchLogs(currentPage, searchQuery, filterDate, filterStatus);
  }, [currentPage, searchQuery, filterDate, filterStatus, fetchLogs]);

  // Search Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchQuery(inputSearch);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setInputSearch('');
    setSearchQuery('');
    setFilterDate('');
    setFilterStatus('');
    setCurrentPage(1);
  };

  // CSV Exporter
  const exportToCSV = async () => {
    try {
      toast.loading('Preparing CSV...', { id: 'csv-export' });
      // Fetch all records without pagination limits
      const res = await getDailyWorkLogHistory({ page: 1, limit: 1000, search: searchQuery, date: filterDate, status: filterStatus });
      const records = res.data.logs;

      if (!records || records.length === 0) {
        toast.error('No records found to export', { id: 'csv-export' });
        return;
      }

      // Build CSV headers and content
      const headers = [
        'Employee ID',
        'Employee Name',
        'Date',
        'Login Time',
        'First Draft Saved',
        'Submitted At',
        'Working Duration',
        'Session Duration',
        'Status',
        'Late Submission',
        'First Half Update',
        'Second Half Update'
      ];

      const csvRows = [headers.join(',')];

      records.forEach((log) => {
        const row = [
          `"${log.employeeId}"`,
          `"${log.employeeName}"`,
          `"${new Date(log.date).toLocaleDateString()}"`,
          `"${log.loginTime ? new Date(log.loginTime).toLocaleTimeString() : '—'}"`,
          `"${log.firstDraftTime ? new Date(log.firstDraftTime).toLocaleTimeString() : '—'}"`,
          `"${log.submittedAt ? new Date(log.submittedAt).toLocaleTimeString() : '—'}"`,
          `"${log.totalWorkDuration || '0h 0m'}"`,
          `"${log.sessionDuration || '0h 0m'}"`,
          `"${log.status}"`,
          `"${log.isLateSubmission ? 'Yes' : 'No'}"`,
          `"${(log.firstHalfUpdate || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          `"${(log.secondHalfUpdate || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
        ];
        csvRows.push(row.join(','));
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `work_reports_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('CSV downloaded successfully!', { id: 'csv-export' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to export CSV', { id: 'csv-export' });
    }
  };

  // PDF Exporter (Print Preview layout generator)
  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow popups to view printable PDF.');
      return;
    }

    const tableRows = logs.map(log => `
      <tr>
        <td>${log.employeeId}</td>
        <td>${log.employeeName}</td>
        <td>${new Date(log.date).toLocaleDateString()}</td>
        <td>${log.loginTime ? new Date(log.loginTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}</td>
        <td>${log.submittedAt ? new Date(log.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}</td>
        <td>${log.totalWorkDuration || '0h 0m'}</td>
        <td>${log.status}</td>
        <td style="color: ${log.isLateSubmission ? 'red' : 'green'}">${log.isLateSubmission ? 'Yes' : 'No'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Daily Work updates & Time Reports</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 30px; color: #333; }
            h1 { text-align: center; color: #1e3a8a; margin-bottom: 5px; }
            p.meta { text-align: center; font-size: 14px; color: #666; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background-color: #f3f4f6; color: #374151; font-weight: bold; text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; }
            td { padding: 12px; border-bottom: 1px solid #f3f4f6; }
            tr:nth-child(even) { background-color: #fafafa; }
            .badge { padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Daily Work Updates & Time Report</h1>
          <p class="meta">Generated on ${new Date().toLocaleString()} | Filtered List</p>
          <table>
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Employee Name</th>
                <th>Date</th>
                <th>Login Time</th>
                <th>Submission Time</th>
                <th>Work Duration</th>
                <th>Status</th>
                <th>Late</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">
              Print / Save as PDF
            </button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Submitted': return 'green';
      case 'In Progress': return 'blue';
      default: return 'pending';
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <PageHeader
        title={activeTab === 'analytics' ? "Admin Daily Updates Dashboard" : "Admin Time Tracking & Logs"}
        subtitle={activeTab === 'analytics' ? "Analyze today's daily work update completions and missing updates" : "Audit employee login times, active work durations, and session logs"}
        action={
          activeTab === 'logs' && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToCSV}>
                <Download size={16} /> Export CSV
              </Button>
              <Button variant="outline" onClick={exportToPDF}>
                <Printer size={16} /> Export PDF / Print
              </Button>
            </div>
          )
        }
      />



      {/* KPI Cards Section */}
      {activeTab === 'analytics' && (
        analyticsLoading ? (
          <Spinner size="lg" />
        ) : (
          analytics && (
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="text-slate-400 p-2 bg-blue-50 text-blue-500 rounded-lg w-fit">
                <Users size={20} />
              </div>
              <div className="mt-3">
                <span className="text-xs font-semibold text-slate-400 uppercase">Total Employees</span>
                <p className="text-2xl font-bold text-slate-800 mt-1">{analytics.totalEmployees}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="text-slate-400 p-2 bg-green-50 text-green-500 rounded-lg w-fit">
                <CheckCircle size={20} />
              </div>
              <div className="mt-3">
                <span className="text-xs font-semibold text-slate-400 uppercase">Submitted Today</span>
                <p className="text-2xl font-bold text-green-600 mt-1">{analytics.submittedToday}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="text-slate-400 p-2 bg-amber-50 text-amber-500 rounded-lg w-fit">
                <Clock size={20} />
              </div>
              <div className="mt-3">
                <span className="text-xs font-semibold text-slate-400 uppercase">Pending Today</span>
                <p className="text-2xl font-bold text-amber-600 mt-1">{analytics.pendingUpdates}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="text-slate-400 p-2 bg-red-50 text-red-500 rounded-lg w-fit">
                <AlertTriangle size={20} />
              </div>
              <div className="mt-3">
                <span className="text-xs font-semibold text-slate-400 uppercase">Missing Today</span>
                <p className="text-2xl font-bold text-red-600 mt-1">{analytics.missingUpdates}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="text-slate-400 p-2 bg-purple-50 text-purple-500 rounded-lg w-fit">
                <Clock size={20} />
              </div>
              <div className="mt-3">
                <span className="text-xs font-semibold text-slate-400 uppercase">Avg Work Hour</span>
                <p className="text-xl font-bold text-slate-800 mt-1">{analytics.avgWorkDuration}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="text-slate-400 p-2 bg-red-50 text-red-600 rounded-lg w-fit">
                <AlertTriangle size={20} />
              </div>
              <div className="mt-3">
                <span className="text-xs font-semibold text-slate-400 uppercase">Late Submits</span>
                <p className="text-2xl font-bold text-red-500 mt-1">{analytics.lateSubmissions}</p>
              </div>
            </div>
          </div>
        )
      )
    )}

      {/* Analytics Charts Grid */}
      {activeTab === 'analytics' && !analyticsLoading && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: Weekly Submission Trends */}
          <Card>
            <CardHeader title="Weekly Submission Trends" subtitle="Overview of daily completions over the last 7 days" />
            <CardBody>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.weeklyTrends}>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="submitted" name="Submitted" fill="#10b981" stackId="a" />
                    <Bar dataKey="pending" name="Pending" fill="#f59e0b" stackId="a" />
                    <Bar dataKey="missing" name="Missing" fill="#ef4444" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* Chart 2: Daily Submissions Current Month */}
          <Card>
            <CardHeader title="Monthly Submission Trend" subtitle="Daily counts of final submitted logs in current month" />
            <CardBody>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.monthlyAnalytics}>
                    <defs>
                      <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="submitted" name="Submissions" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSub)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* Chart 3: Employee Productivity Comparison */}
          <Card className="lg:col-span-2">
            <CardHeader title="Employee Submission & productivity Summary" subtitle="Total submitted logs and late submissions by employee" />
            <CardBody>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.employeeOverview.slice(0, 10)}>
                    <XAxis dataKey="employeeName" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalSubmitted" name="Total Submitted Days" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lateSubmissions" name="Late Submissions" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* Missing Updates Panel */}
          <Card className="lg:col-span-2">
            <CardHeader
              title="Today's Missing Work Updates"
              subtitle={`Employees who have not yet submitted their EOD update today (${analytics.missingEmployees.length} total)`}
            />
            <CardBody>
              {analytics.missingEmployees.length === 0 ? (
                <p className="text-sm text-green-600 bg-green-50 p-4 border border-green-100 rounded-lg text-center font-medium">
                  Awesome! All employees have submitted today's work updates.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.missingEmployees.map(emp => (
                    <div key={emp.employeeId} className="p-3.5 border border-red-100 bg-red-50/30 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{emp.employeeName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{emp.employeeId} | {emp.officialEmail}</p>
                      </div>
                      <Badge status="rejected" label="Missing" />
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Admin Table Reports Log Section */}
      {activeTab === 'logs' && (
        <Card>
          <CardHeader title="All Employee Daily Logs Table" subtitle="Detailed audit view of daily log updates, login contact, and durations" />
          <CardBody className="space-y-6">
            {/* Filters Area */}
            <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-end gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex-1 min-w-[200px]">
              <Input
                label="Search Employee"
                placeholder="Search by ID or name..."
                value={inputSearch}
                onChange={(e) => setInputSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-auto">
              <Input
                label="Date Filter"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Submitted">Submitted</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              <Button type="submit" variant="primary">
                <Search size={16} /> Search
              </Button>
              <Button variant="outline" onClick={handleResetFilters}>
                Clear
              </Button>
            </div>
          </form>

          {/* Logs List Table */}
          {logsLoading ? (
            <Spinner />
          ) : logs.length === 0 ? (
            <EmptyState icon={FileText} title="No logs found" description="No daily updates found matching the filters." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-left text-sm text-slate-500">
                <thead className="bg-slate-50 text-slate-700 font-medium">
                  <tr>
                    <th className="px-6 py-4">Employee ID</th>
                    <th className="px-6 py-4">Employee Name</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Submission Time</th>
                    <th className="px-6 py-4">Working Duration</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Late Submission</th>
                    <th className="px-6 py-4">First Half Summary</th>
                    <th className="px-6 py-4">Second Half Summary</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 border-t border-slate-200">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-semibold text-slate-800">{log.employeeId}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{log.employeeName}</td>
                      <td className="px-6 py-4">{new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="px-6 py-4">{formatTime(log.submittedAt)}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">{log.totalWorkDuration || '0h 0m'}</td>
                      <td className="px-6 py-4">
                        <Badge status={getStatusBadgeColor(log.status)} label={log.status} />
                      </td>
                      <td className="px-6 py-4">
                        {log.isLateSubmission ? (
                          <span className="text-red-600 bg-red-50 border border-red-100 text-xs px-2 py-0.5 rounded-full font-semibold">Late</span>
                        ) : log.isFinalSubmitted ? (
                          <span className="text-green-600 bg-green-50 border border-green-100 text-xs px-2 py-0.5 rounded-full font-semibold">On Time</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 truncate max-w-[150px]">{log.firstHalfUpdate || <span className="text-slate-300">No update</span>}</td>
                      <td className="px-6 py-4 truncate max-w-[150px]">{log.secondHalfUpdate || <span className="text-slate-300">No update</span>}</td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log);
                            setIsModalOpen(true);
                          }}
                        >
                          <Eye size={14} /> Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-sm">
              <span className="text-slate-500">Showing page {currentPage} of {totalPages} ({totalItems} total logs)</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  <ChevronLeft size={16} /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  Next <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
          </CardBody>
        </Card>
      )}

      {/* Admin Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLog(null);
        }}
        title="Employee Work Log Audit Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-800">{selectedLog.employeeName}</p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedLog.employeeId}</p>
              </div>
              <Badge status={getStatusBadgeColor(selectedLog.status)} label={selectedLog.status} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 border border-slate-100 rounded-lg">
                <p className="text-xs text-slate-400 font-medium uppercase">Log Date</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{new Date(selectedLog.date).toLocaleDateString()}</p>
              </div>
              <div className="p-3 border border-slate-100 rounded-lg">
                <p className="text-xs text-slate-400 font-medium uppercase">Login Time</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{formatTime(selectedLog.loginTime)}</p>
              </div>
              <div className="p-3 border border-slate-100 rounded-lg">
                <p className="text-xs text-slate-400 font-medium uppercase">Active Duration</p>
                <p className="text-sm font-bold text-blue-600 mt-0.5">{selectedLog.totalWorkDuration || '0h 0m'}</p>
              </div>
              <div className="p-3 border border-slate-100 rounded-lg">
                <p className="text-xs text-slate-400 font-medium uppercase">Session Duration</p>
                <p className="text-sm font-semibold text-slate-500 mt-0.5">{selectedLog.sessionDuration || '0h 0m'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-slate-100 rounded-lg">
                <p className="text-xs text-slate-400 font-medium uppercase">First Draft Saved</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{formatTime(selectedLog.firstDraftTime)}</p>
              </div>
              <div className="p-3 border border-slate-100 rounded-lg">
                <p className="text-xs text-slate-400 font-medium uppercase">Last Edited At</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{formatTime(selectedLog.lastEditedTime)}</p>
              </div>
              <div className="p-3 border border-slate-100 rounded-lg">
                <p className="text-xs text-slate-400 font-medium uppercase">Submitted At</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{formatTime(selectedLog.submittedAt)}</p>
              </div>
              <div className="p-3 border border-slate-100 rounded-lg">
                <p className="text-xs text-slate-400 font-medium uppercase">Late Submission</p>
                <p className="text-sm font-semibold mt-0.5">
                  {selectedLog.isLateSubmission ? (
                    <span className="text-red-600 font-semibold">Yes</span>
                  ) : selectedLog.isFinalSubmitted ? (
                    <span className="text-green-600 font-semibold">No</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">First Half Work Update</p>
                <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap leading-relaxed">{selectedLog.firstHalfUpdate || 'No updates logged.'}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Second Half Work Update</p>
                <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap leading-relaxed">{selectedLog.secondHalfUpdate || 'No updates logged.'}</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => {
                setIsModalOpen(false);
                setSelectedLog(null);
              }}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WorkReports;
