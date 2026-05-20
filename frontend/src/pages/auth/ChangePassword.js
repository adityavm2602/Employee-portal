// src/pages/auth/ChangePassword.js — Available to ALL roles from sidebar
import React, { useState } from 'react';
import { changePassword } from '../../services/api';
import { Card, CardHeader, CardBody, Button, PageHeader } from '../../components/common/UI';
import { KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ChangePassword = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password strength checker
  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-green-500'];
  const strength = getStrength(form.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      return toast.error('New passwords do not match.');
    }
    if (form.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters.');
    }
    if (form.newPassword === form.currentPassword) {
      return toast.error('New password must be different from current password.');
    }

    setLoading(true);
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      // Mark that this user has changed their default password (hides the dashboard banner)
      if (user?.id) localStorage.setItem(`pwd_changed_${user.id}`, 'true');
      toast.success('Password changed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({ label, field, value }) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <input
          type={show[field] ? 'text' : 'password'}
          value={value}
          onChange={e => { setForm({ ...form, [field === 'current' ? 'currentPassword' : field === 'new' ? 'newPassword' : 'confirmPassword']: e.target.value }); setSuccess(false); }}
          placeholder={`Enter ${label.toLowerCase()}`}
          required
          className="w-full px-4 py-2.5 pr-11 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button type="button" onClick={() => setShow(s => ({ ...s, [field]: !s[field] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {show[field] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg">
      <PageHeader title="Change Password" subtitle="Update your account password" />

      <Card>
        <CardHeader
          title="Set New Password"
          subtitle="Your temporary password is your Employee ID — please change it now"
        />
        <CardBody>
          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg mb-5">
              <CheckCircle className="text-green-600 shrink-0" size={20} />
              <div>
                <p className="font-semibold text-green-800 text-sm">Password updated successfully!</p>
                <p className="text-green-600 text-xs mt-0.5">Use your new password on your next login.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <PasswordInput label="Current Password" field="current" value={form.currentPassword} />

            <div className="border-t border-slate-100 pt-5 space-y-4">
              <PasswordInput label="New Password" field="new" value={form.newPassword} />

              {/* Strength meter */}
              {form.newPassword && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${
                    strength <= 1 ? 'text-red-500' : strength === 2 ? 'text-amber-500' : strength === 3 ? 'text-blue-500' : 'text-green-600'
                  }`}>
                    {strengthLabel[strength]} password
                  </p>
                </div>
              )}

              <PasswordInput label="Confirm New Password" field="confirm" value={form.confirmPassword} />

              {/* Match indicator */}
              {form.confirmPassword && (
                <p className={`text-xs font-medium ${form.newPassword === form.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                  {form.newPassword === form.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            {/* Requirements */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-xs font-semibold text-slate-500 mb-2">Password requirements:</p>
              <ul className="space-y-1">
                {[
                  [form.newPassword.length >= 8, 'At least 8 characters'],
                  [/[A-Z]/.test(form.newPassword), 'One uppercase letter'],
                  [/[0-9]/.test(form.newPassword), 'One number'],
                  [/[^A-Za-z0-9]/.test(form.newPassword), 'One special character'],
                ].map(([met, text]) => (
                  <li key={text} className={`text-xs flex items-center gap-2 ${met ? 'text-green-600' : 'text-slate-400'}`}>
                    <span>{met ? '✓' : '○'}</span> {text}
                  </li>
                ))}
              </ul>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              <KeyRound size={16} /> Update Password
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default ChangePassword;
