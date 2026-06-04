// src/pages/employee/Notifications.js
import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import {
  sendNotification,
  markNotificationRead,
  deleteNotification,
  getEmployeeList,
  getNotifications
} from '../../services/api';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Textarea,
  Select,
  Spinner,
  PageHeader,
  EmptyState
} from '../../components/common/UI';
import {
  Bell,
  Send,
  Inbox,
  Clock,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  User,
  Users,
  Building,
  Globe,
  Archive,
  Megaphone,
  CheckCircle,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const Notifications = () => {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loading: inboxLoading,
    fetchNotifications: fetchInbox,
    fetchUnreadCount
  } = useSocket();

  const isPrivileged = ['admin', 'tech_lead', 'hr'].includes(user?.role);

  // Tabs: 'inbox' | 'send' | 'sent'
  const [activeTab, setActiveTab] = useState('inbox');
  const [inboxFilter, setInboxFilter] = useState('all');

  // Send Form State
  const [recipientType, setRecipientType] = useState('all');
  const [recipientId, setRecipientId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [notifType, setNotifType] = useState('general');
  const [sending, setSending] = useState(false);
  
  // Lists
  const [employees, setEmployees] = useState([]);
  const [sentNotifications, setSentNotifications] = useState([]);
  const [sentLoading, setSentLoading] = useState(false);

  // Fetch employees list if privileged (to send single notifications)
  useEffect(() => {
    if (isPrivileged) {
      getEmployeeList()
        .then((res) => {
          if (res.data?.success) {
            setEmployees(res.data.employees);
          }
        })
        .catch((err) => console.error('Failed to fetch employee list', err));
    }
  }, [isPrivileged]);

  // Fetch sent history when switching to 'sent' tab
  const fetchSentHistory = async () => {
    setSentLoading(true);
    try {
      const res = await getNotifications({ sent: true });
      if (res.data?.success) {
        setSentNotifications(res.data.notifications);
      }
    } catch (err) {
      toast.error('Failed to load sent notifications');
    } finally {
      setSentLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sent') {
      fetchSentHistory();
    } else if (activeTab === 'inbox') {
      fetchInbox();
    }
  }, [activeTab]);

  // Handle Mark Read
  const handleMarkRead = async (id) => {
    try {
      const res = await markNotificationRead(id);
      if (res.data?.success) {
        toast.success('Marked as read');
        fetchInbox();
        fetchUnreadCount();
      }
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    try {
      const res = await deleteNotification(id);
      if (res.data?.success) {
        toast.success('Notification deleted');
        fetchInbox();
        fetchUnreadCount();
      }
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  // Handle Send Form Submission
  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in title and message');
      return;
    }
    if (recipientType === 'single' && !recipientId) {
      toast.error('Please select a recipient employee');
      return;
    }
    if (recipientType === 'department' && !recipientId) {
      toast.error('Please specify a department');
      return;
    }

    setSending(true);
    try {
      const res = await sendNotification({
        recipientType,
        recipientId,
        title: title.trim(),
        message: message.trim(),
        priority,
        type: notifType
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Notification broadcasted successfully!');
        // Reset form
        setTitle('');
        setMessage('');
        setRecipientId('');
        setRecipientType('all');
        setPriority('medium');
        setNotifType('general');
        // Switch to history
        setActiveTab('sent');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  // Inbox Filter Logic
  const filteredInbox = notifications.filter((n) => {
    if (inboxFilter === 'unread') return !n.isRead;
    if (inboxFilter === 'read') return n.isRead;
    return true;
  });

  const getPriorityStyle = (pri) => {
    switch (pri) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-150';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-150';
      case 'low':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-150';
    }
  };

  const getSenderRoleLabel = (role) => {
    if (role === 'admin') return 'Admin';
    if (role === 'tech_lead') return 'Tech Lead';
    if (role === 'hr') return 'HR Manager';
    return role;
  };

  const formatTimeElapsed = (dateString) => {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Notification Center"
        subtitle="Manage your inbox and stay up-to-date with company announcements"
        action={
          isPrivileged && (
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab('inbox')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'inbox'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Inbox size={16} /> Inbox
                {unreadCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('send')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'send'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Megaphone size={16} /> Send Announcement
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'sent'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Archive size={16} /> Sent History
              </button>
            </div>
          )
        }
      />

      {/* Main Inbox Tab */}
      {activeTab === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Sidebar Filter for Inbox */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader title="Filter Inbox" />
              <CardBody className="p-3">
                <div className="space-y-1">
                  <button
                    onClick={() => setInboxFilter('all')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      inboxFilter === 'all'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>All Messages</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {notifications.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setInboxFilter('unread')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      inboxFilter === 'unread'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Unread</span>
                    {unreadCount > 0 ? (
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                        {unreadCount}
                      </span>
                    ) : (
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        0
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setInboxFilter('read')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      inboxFilter === 'read'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Read</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {notifications.filter((n) => n.isRead).length}
                    </span>
                  </button>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Inbox List */}
          <div className="lg:col-span-3 space-y-4">
            {inboxLoading ? (
              <Card className="flex items-center justify-center p-12">
                <Spinner />
              </Card>
            ) : filteredInbox.length === 0 ? (
              <Card className="p-12">
                <EmptyState
                  icon={Bell}
                  title="Your Inbox is Empty"
                  description="You are fully up to date! Check back later for announcements."
                />
              </Card>
            ) : (
              <div className="space-y-3.5">
                {filteredInbox.map((item) => (
                  <div
                    key={item._id}
                    className={`relative p-5 bg-white rounded-xl border transition-all duration-200 group flex items-start gap-4 ${
                      item.isRead
                        ? 'border-slate-200 hover:border-slate-300 opacity-90'
                        : 'border-blue-200 bg-blue-50/10 hover:border-blue-300 shadow-sm'
                    }`}
                  >
                    {/* Unread blue dot indicator */}
                    {!item.isRead && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-600"></span>
                    )}

                    {/* Left Icon (Based on priority/type) */}
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        item.priority === 'high'
                          ? 'bg-red-50 text-red-600'
                          : item.priority === 'medium'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      {item.priority === 'high' ? (
                        <AlertTriangle size={20} className="animate-pulse" />
                      ) : (
                        <Bell size={20} />
                      )}
                    </div>

                    {/* Middle: Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-800 text-sm md:text-base leading-tight">
                          {item.title}
                        </h4>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getPriorityStyle(
                            item.priority
                          )}`}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center gap-3 mt-3 text-xs text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <User size={13} className="text-slate-400" />
                          By {item.senderName} ({getSenderRoleLabel(item.senderRole)})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={13} />
                          {formatTimeElapsed(item.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex gap-2 shrink-0 self-center">
                      {!item.isRead && (
                        <button
                          onClick={() => handleMarkRead(item._id)}
                          title="Mark as Read"
                          className="p-2 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item._id)}
                        title="Delete"
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send Announcement Form Tab */}
      {activeTab === 'send' && isPrivileged && (
        <Card className="max-w-2xl mx-auto shadow-md">
          <CardHeader
            title="Create & Broadcast Announcement"
            subtitle="Send notifications instantly via real-time WebSocket connection to target audience"
          />
          <form onSubmit={handleSend}>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Recipient Type"
                  value={recipientType}
                  onChange={(e) => {
                    setRecipientType(e.target.value);
                    setRecipientId('');
                  }}
                >
                  <option value="all">All Employees</option>
                  <option value="single">Single Employee</option>
                  <option value="department">Department</option>
                  {user.role === 'tech_lead' && <option value="team">My Project Team</option>}
                  {user.role === 'admin' && <option value="team">All Project Teams</option>}
                </Select>

                {recipientType === 'single' && (
                  <Select
                    label="Select Employee"
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map((emp) => (
                      <option key={emp.user?._id} value={emp.user?._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeId} - {emp.designation})
                      </option>
                    ))}
                  </Select>
                )}

                {recipientType === 'department' && (
                  <Select
                    label="Select Department"
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Department --</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="HR">Human Resources</option>
                    <option value="Marketing">Marketing</option>
                    <option value="QA">Quality Assurance</option>
                    <option value="Operations">Operations</option>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Priority Level"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority (Triggers Pulse Alert)</option>
                </Select>

                <Select
                  label="Message Category"
                  value={notifType}
                  onChange={(e) => setNotifType(e.target.value)}
                >
                  <option value="general">General Broadcast</option>
                  <option value="announcement">Announcement</option>
                  <option value="alert">Alert / Notice</option>
                  <option value="system">System Notification</option>
                </Select>
              </div>

              <Input
                label="Notification Title"
                placeholder="Enter a brief, descriptive title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <Textarea
                label="Notification Message"
                placeholder="Type your message detail here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setActiveTab('inbox');
                    setTitle('');
                    setMessage('');
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={sending} className="flex items-center gap-1.5">
                  <Send size={15} /> Send Notification
                </Button>
              </div>
            </CardBody>
          </form>
        </Card>
      )}

      {/* Sent History Tab */}
      {activeTab === 'sent' && isPrivileged && (
        <div className="space-y-4">
          {sentLoading ? (
            <Card className="flex items-center justify-center p-12">
              <Spinner />
            </Card>
          ) : sentNotifications.length === 0 ? (
            <Card className="p-12">
              <EmptyState
                icon={Megaphone}
                title="No Broadcasts Found"
                description="You haven't sent any notifications or announcements yet."
              />
            </Card>
          ) : (
            <div className="space-y-3.5">
              {sentNotifications.map((item) => (
                <div
                  key={item._id}
                  className="p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-200 flex items-start gap-4"
                >
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      item.priority === 'high'
                        ? 'bg-red-50 text-red-600'
                        : item.priority === 'medium'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    <Send size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-800 text-sm md:text-base leading-tight">
                        {item.title}
                      </h4>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getPriorityStyle(
                          item.priority
                        )}`}
                      >
                        {item.priority}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {new Date(item.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
