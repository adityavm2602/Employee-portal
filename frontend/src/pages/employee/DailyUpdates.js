// src/pages/employee/DailyUpdates.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  getProfile,
  getTodayDailyWorkLog,
  updateDailyWorkLog,
  getDailyWorkLogHistory
} from '../../services/api';
import {
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  Input,
  Textarea,
  Spinner,
  PageHeader,
  EmptyState,
  Modal
} from '../../components/common/UI';
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Save,
  Send,
  Bell,
  Eye,
  History
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const DailyUpdates = () => {
  const { user } = useAuth();
  const isAdminUser = user?.role === 'admin';

  // Active Tab
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname === '/time-tracking' ? 'time-tracking' : 'updates';

  // Redirect admin users to admin dashboard views
  useEffect(() => {
    if (isAdminUser) {
      if (location.pathname === '/daily-updates') {
        navigate('/admin/daily-updates', { replace: true });
      } else if (location.pathname === '/time-tracking') {
        navigate('/admin/time-tracking', { replace: true });
      }
    }
  }, [isAdminUser, location.pathname, navigate]);

  // State
  const [profile, setProfile] = useState(null);
  const [worklog, setWorklog] = useState(null);
  const [firstHalf, setFirstHalf] = useState('');
  const [secondHalf, setSecondHalf] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Draft change tracking for auto-save
  const lastSavedFirstHalf = useRef('');
  const lastSavedSecondHalf = useRef('');

  // History State
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchDate, setSearchDate] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [inputDate, setInputDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal State
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check EOD Lock
  const isEODLocked = useCallback(() => {
    if (!worklog || !worklog.date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const logDate = new Date(worklog.date);
    logDate.setHours(0, 0, 0, 0);
    return today.getTime() !== logDate.getTime();
  }, [worklog]);

  const isEditable = worklog && !worklog.isFinalSubmitted && !isEODLocked();

  // Load Profile & Today's WorkLog (Employees only)
  const loadInitialData = useCallback(async () => {
    if (isAdminUser) {
      setLoading(false);
      return;
    }
    try {
      const [profileRes, worklogRes] = await Promise.all([
        getProfile(),
        getTodayDailyWorkLog()
      ]);

      const emp = profileRes.data.profile;
      setProfile(emp);

      const log = worklogRes.data.worklog;
      if (log) {
        setWorklog(log);
        setFirstHalf(log.firstHalfUpdate || '');
        setSecondHalf(log.secondHalfUpdate || '');
        lastSavedFirstHalf.current = log.firstHalfUpdate || '';
        lastSavedSecondHalf.current = log.secondHalfUpdate || '';
      }
    } catch (err) {
      toast.error('Failed to load today\'s daily work log');
    } finally {
      setLoading(false);
    }
  }, [isAdminUser]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Fetch History List
  const fetchHistory = useCallback(async (page = 1, dateFilter = '', statusFilter = '') => {
    setHistoryLoading(true);
    try {
      const params = { page, limit: 10 };
      if (dateFilter) params.date = dateFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await getDailyWorkLogHistory(params);
      setHistory(res.data.logs);
      setTotalPages(res.data.pagination.pages || 1);
      setCurrentPage(res.data.pagination.currentPage || 1);
      setTotalItems(res.data.pagination.total || 0);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(currentPage, searchDate, searchStatus);
  }, [currentPage, searchDate, searchStatus, fetchHistory]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchDate(inputDate);
  };

  const handleResetSearch = () => {
    setInputDate('');
    setSearchDate('');
    setSearchStatus('');
    setCurrentPage(1);
  };

  // Save Draft logic (can be silent for auto-save)
  const saveDraft = useCallback(async (isSilent = false) => {
    if (!isEditable) return;

    // Check if anything actually changed
    if (
      firstHalf.trim() === lastSavedFirstHalf.current.trim() &&
      secondHalf.trim() === lastSavedSecondHalf.current.trim()
    ) {
      return; // No changes to save
    }

    if (!isSilent) setSaving(true);
    try {
      const res = await updateDailyWorkLog(worklog._id, {
        firstHalfUpdate: firstHalf,
        secondHalfUpdate: secondHalf,
        isFinalSubmitted: false
      });
      if (res.data.success) {
        setWorklog(res.data.worklog);
        lastSavedFirstHalf.current = firstHalf;
        lastSavedSecondHalf.current = secondHalf;
        if (!isSilent) toast.success('Draft saved successfully');
      }
    } catch (err) {
      if (!isSilent) {
        const errMsg = err.response?.data?.message || 'Failed to save draft';
        toast.error(errMsg);
      }
    } finally {
      if (!isSilent) setSaving(false);
    }
  }, [worklog, firstHalf, secondHalf, isEditable]);

  // Submit Final logic
  const submitFinal = async () => {
    if (!isEditable) return;

    // Validate rules
    if (!firstHalf.trim()) {
      toast.error('First Half Update required');
      return;
    }
    if (!secondHalf.trim()) {
      toast.error('Second Half Update required');
      return;
    }

    setSaving(true);
    try {
      const res = await updateDailyWorkLog(worklog._id, {
        firstHalfUpdate: firstHalf,
        secondHalfUpdate: secondHalf,
        isFinalSubmitted: true
      });
      if (res.data.success) {
        setWorklog(res.data.worklog);
        lastSavedFirstHalf.current = firstHalf;
        lastSavedSecondHalf.current = secondHalf;
        toast.success('Daily updates submitted successfully');
        // Refresh history
        fetchHistory(1, searchDate, searchStatus);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to submit update';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save logic (runs every 2 minutes)
  useEffect(() => {
    if (!isEditable) return;
    const interval = setInterval(() => {
      saveDraft(true);
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [saveDraft, isEditable]);

  // 5:30 PM reminder logic
  useEffect(() => {
    if (isAdminUser || (worklog && worklog.isFinalSubmitted)) return;

    // Check reminder interval every 30 seconds
    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();

      // Fire reminder if it's past 5:30 PM (17:30)
      if (currentHours > 17 || (currentHours === 17 && currentMinutes >= 30)) {
        toast('Please submit your EOD update', {
          icon: '⏰',
          duration: 6000,
          id: 'eod-reminder' // Avoid duplicate toast display
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [worklog, isAdminUser]);

  // Format Helper
  const formatTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Submitted': return 'green';
      case 'In Progress': return 'blue';
      default: return 'pending';
    }
  };

  if (loading) {
    return <Spinner size="lg" />;
  }

  // Progress Bar Completion Calculations
  const firstHalfComplete = firstHalf.trim().length > 0;
  const secondHalfComplete = secondHalf.trim().length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <PageHeader
        title={activeTab === 'updates' ? "Daily Work Updates" : "Time Tracking & History"}
        subtitle={activeTab === 'updates' ? "Record your daily work updates before end of day (EOD)" : "Track active work hours and view your log history"}
      />



      {/* Tab 1 content: Today's update */}
      {!isAdminUser && activeTab === 'updates' && worklog && (
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Card 1: Today's Status Details */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="h-full flex flex-col justify-between">
                <CardHeader title="Today's Submission Status" subtitle={formatDate(worklog.date)} />
                <CardBody className="space-y-6 flex-1">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm font-medium text-slate-500">Current Status</span>
                      <Badge status={getStatusBadgeColor(worklog.status)} label={worklog.status} />
                    </div>
                  </div>

                  {/* Progress Indicators */}
                  <div className="space-y-4 pt-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Submission Progress</span>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-600">First Half Completion</span>
                        <span className={firstHalfComplete ? "text-green-600" : "text-slate-400"}>
                          {firstHalfComplete ? "Completed" : "Pending"}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all duration-500 ${firstHalfComplete ? 'w-full bg-green-500' : 'w-0'}`} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-600">Second Half Completion</span>
                        <span className={secondHalfComplete ? "text-green-600" : "text-slate-400"}>
                          {secondHalfComplete ? "Completed" : "Pending"}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all duration-500 ${secondHalfComplete ? 'w-full bg-green-500' : 'w-0'}`} />
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Card 2: Form Input Details */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader
                  title="Daily Work Update Form"
                  action={
                    <div className="flex items-center gap-2">
                      {worklog.isFinalSubmitted && (
                        <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg flex items-center gap-1">
                          <CheckCircle size={14} /> Submitted
                        </span>
                      )}
                      {isEODLocked() && (
                        <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg flex items-center gap-1">
                          <AlertCircle size={14} /> EOD Locked
                        </span>
                      )}
                    </div>
                  }
                />
                <CardBody className="space-y-6">
                  {/* Employee Info Prefilled Rows */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Employee Name"
                      value={profile ? profile.name : ''}
                      disabled
                    />
                    <Input
                      label="Employee ID"
                      value={profile ? profile.employeeId : ''}
                      disabled
                    />
                    <Input
                      label="Date"
                      value={worklog.date ? new Date(worklog.date).toLocaleDateString() : ''}
                      disabled
                    />
                  </div>

                  {/* Form Inputs */}
                  <div className="space-y-4">
                    <Textarea
                      label="First Half Work Update"
                      value={firstHalf}
                      onChange={(e) => setFirstHalf(e.target.value)}
                      placeholder="Enter tasks completed during first half"
                      disabled={!isEditable}
                      rows={4}
                    />
                    <Textarea
                      label="Second Half Work Update"
                      value={secondHalf}
                      onChange={(e) => setSecondHalf(e.target.value)}
                      placeholder="Enter tasks completed during second half"
                      disabled={!isEditable}
                      rows={4}
                    />
                  </div>

                  {/* Lock Alert Banners */}
                  {worklog.isFinalSubmitted && (
                    <div className="p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg flex items-start gap-3">
                      <AlertCircle className="shrink-0 mt-0.5" size={18} />
                      <div>
                        <p className="font-semibold text-sm">Editing Disabled</p>
                        <p className="text-xs mt-0.5">You have already submitted today's update. Editing is disabled after final submission.</p>
                      </div>
                    </div>
                  )}

                  {isEODLocked() && !worklog.isFinalSubmitted && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
                      <AlertCircle className="shrink-0 mt-0.5" size={18} />
                      <div>
                        <p className="font-semibold text-sm">Editing Disabled</p>
                        <p className="text-xs mt-0.5">Editing disabled after EOD. You can only update today's logs.</p>
                      </div>
                    </div>
                  )}

                  {/* Form Buttons */}
                  {isEditable && (
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                      <Button
                        variant="outline"
                        onClick={() => saveDraft(false)}
                        disabled={saving}
                        loading={saving}
                      >
                        <Save size={16} /> Save Draft
                      </Button>
                      <Button
                        variant="primary"
                        onClick={submitFinal}
                        disabled={saving}
                        loading={saving}
                      >
                        <Send size={16} /> Submit Final Update
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>

          {/* History log section specifically for Daily Work Updates */}
          <Card>
            <CardHeader title="Daily Work Updates History" subtitle="View all your past first-half and second-half text updates" />
            <CardBody className="space-y-6">
              {/* Filters Form */}
              <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="w-full sm:w-auto">
                  <Input
                    label="Filter by Date"
                    type="date"
                    value={inputDate}
                    onChange={(e) => setInputDate(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchStatus}
                    onChange={(e) => setSearchStatus(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Submitted">Submitted</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                  <Button type="submit" variant="primary">
                    <Search size={16} /> Filter
                  </Button>
                  <Button variant="outline" onClick={handleResetSearch}>
                    Reset
                  </Button>
                </div>
              </form>

              {/* History Table */}
              {historyLoading ? (
                <Spinner />
              ) : history.length === 0 ? (
                <EmptyState icon={FileText} title="No updates found" description="No daily updates match your search filters." />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full border-collapse text-left text-sm text-slate-500">
                    <thead className="bg-slate-50 text-slate-700 font-medium">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">First Half Update</th>
                        <th className="px-6 py-4">Second Half Update</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 border-t border-slate-100">
                      {history.map((log) => (
                        <tr key={log._id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-medium text-slate-900">{new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td className="px-6 py-4">
                            <Badge status={getStatusBadgeColor(log.status)} label={log.status} />
                          </td>
                          <td className="px-6 py-4 truncate max-w-[200px]">{log.firstHalfUpdate || <span className="text-slate-300">No update</span>}</td>
                          <td className="px-6 py-4 truncate max-w-[200px]">{log.secondHalfUpdate || <span className="text-slate-300">No update</span>}</td>
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

              {/* Pagination Controls */}
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
        </div>
      )}

      {/* Tab 2 content: Time Tracking (Also default & only tab for Admins) */}
      {(isAdminUser || activeTab === 'time-tracking') && (
        <div className="space-y-6 pt-2">
          {/* Today's time tracking metrics for employee only */}
          {!isAdminUser && worklog && (
            <Card>
              <CardHeader title="Today's Time Tracking Metrics" subtitle={formatDate(worklog.date)} />
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Login Time</span>
                    <p className="text-xl font-bold text-slate-800 mt-2">{formatTime(worklog.loginTime)}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Submission Time</span>
                    <p className="text-xl font-bold text-slate-800 mt-2">{worklog.isFinalSubmitted ? formatTime(worklog.submittedAt) : 'Not Submitted'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Active Work Duration</span>
                    <p className="text-xl font-bold text-blue-600 mt-2 flex items-center gap-1.5">
                      <Clock size={18} className="text-blue-500" />
                      {worklog.totalWorkDuration || '0h 0m'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Total Session Duration</span>
                    <p className="text-xl font-bold text-slate-700 mt-2 flex items-center gap-1.5">
                      <Clock size={18} className="text-slate-400" />
                      {worklog.sessionDuration || '0h 0m'}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Work Log & Tracking History" subtitle="View all past work log updates and automatic tracking durations" />
            <CardBody className="space-y-6">
            {/* Filters Form */}
            <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="w-full sm:w-auto">
                <Input
                  label="Filter by Date"
                  type="date"
                  value={inputDate}
                  onChange={(e) => setInputDate(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-auto">
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchStatus}
                  onChange={(e) => setSearchStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Submitted">Submitted</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <Button type="submit" variant="primary">
                  <Search size={16} /> Filter
                </Button>
                <Button variant="outline" onClick={handleResetSearch}>
                  Reset
                </Button>
              </div>
            </form>

            {/* History Table */}
            {historyLoading ? (
              <Spinner />
            ) : history.length === 0 ? (
              <EmptyState icon={FileText} title="No logs found" description="No daily work logs match your search filters." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full border-collapse text-left text-sm text-slate-500">
                  <thead className="bg-slate-50 text-slate-700 font-medium">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Login Time</th>
                      <th className="px-6 py-4">First Draft Saved</th>
                      <th className="px-6 py-4">Submitted At</th>
                      <th className="px-6 py-4">Work Duration (Active)</th>
                      <th className="px-6 py-4">Session Duration (Total)</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Late Submission</th>
                      <th className="px-6 py-4">First Half Update</th>
                      <th className="px-6 py-4">Second Half Update</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 border-t border-slate-100">
                    {history.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-medium text-slate-900">{new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td className="px-6 py-4">{formatTime(log.loginTime)}</td>
                        <td className="px-6 py-4">{formatTime(log.firstDraftTime)}</td>
                        <td className="px-6 py-4">{formatTime(log.submittedAt)}</td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{log.totalWorkDuration || '0h 0m'}</td>
                        <td className="px-6 py-4 text-xs text-slate-400">{log.sessionDuration || '0h 0m'}</td>
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

            {/* Pagination Controls */}
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
        </div>
      )}

      {/* View Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLog(null);
        }}
        title="Work Log Detail View"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase">Log Date</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{new Date(selectedLog.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase">Status</p>
                <div className="mt-1">
                  <Badge status={getStatusBadgeColor(selectedLog.status)} label={selectedLog.status} />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase">Active Work Duration</p>
                <p className="text-sm font-bold text-blue-600 mt-0.5">{selectedLog.totalWorkDuration || '0h 0m'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase">Total Session Duration</p>
                <p className="text-sm font-semibold text-slate-500 mt-0.5">{selectedLog.sessionDuration || '0h 0m'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-slate-100 rounded-lg">
                <p className="text-xs text-slate-400 font-medium uppercase">Login Time</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{formatTime(selectedLog.loginTime)}</p>
              </div>
              <div className="p-3 border border-slate-100 rounded-lg">
                <p className="text-xs text-slate-400 font-medium uppercase">First Draft Saved</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{formatTime(selectedLog.firstDraftTime)}</p>
              </div>
              <div className="p-3 border border-slate-100 rounded-lg">
                <p className="text-xs text-slate-400 font-medium uppercase">Last Edited At</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{formatTime(selectedLog.lastEditedTime)}</p>
              </div>
              <div className="p-3 border border-slate-100 rounded-lg">
                <p className="text-xs text-slate-400 font-medium uppercase">Final Submission</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{formatTime(selectedLog.submittedAt)}</p>
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

            {selectedLog.isLateSubmission && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-medium rounded-lg flex items-center gap-2">
                <AlertCircle size={16} /> Submitted late after the 5:30 PM threshold.
              </div>
            )}

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

export default DailyUpdates;
