// src/pages/auth/ChangePassword.js — Change Password + Forgot Password tabs
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword, resetToEmployeeId } from '../../services/api';
import { PageHeader } from '../../components/common/UI';
import { KeyRound, Eye, EyeOff, CheckCircle, ShieldAlert, RotateCcw, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

/* ─── Reusable password input ─────────────────────────── */
const PwdInput = ({ label, field, value, show, onToggle, onChange, placeholder }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold text-slate-700">{label}</label>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        required
        autoComplete="new-password"
        className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-sm
          bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500
          focus:border-transparent transition-all placeholder:text-slate-400"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  </div>
);

/* ─── Password strength ──────────────────────────────── */
const getStrength = (pwd) => {
  let s = 0;
  if (pwd.length >= 8)          s++;
  if (/[A-Z]/.test(pwd))        s++;
  if (/[0-9]/.test(pwd))        s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
};
const strengthMeta = [
  null,
  { label: 'Weak',   bar: 'bg-red-400',   text: 'text-red-500' },
  { label: 'Fair',   bar: 'bg-amber-400',  text: 'text-amber-500' },
  { label: 'Good',   bar: 'bg-blue-400',   text: 'text-blue-500' },
  { label: 'Strong', bar: 'bg-green-500',  text: 'text-green-600' },
];

export default function ChangePassword() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('change'); // 'change' | 'forgot'

  /* ── Change Password state ── */
  const [form, setForm]     = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow]     = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /* ── Forgot Password state ── */
  const [empId, setEmpId]         = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDone, setResetDone]       = useState(false);

  const strength = getStrength(form.newPassword);
  const meta     = strengthMeta[strength];

  /* ── Handlers ── */
  const handleChange = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword)
      return toast.error('Passwords do not match.');
    if (form.newPassword.length < 6)
      return toast.error('Password must be at least 6 characters.');
    if (form.newPassword === form.currentPassword)
      return toast.error('New password must differ from current password.');

    setLoading(true);
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      if (user?.id) localStorage.setItem(`pwd_changed_${user.id}`, 'true');
      toast.success('Password changed! Please log in again.');
      setTimeout(() => { logout(); navigate('/login'); }, 2200);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!empId.trim()) return toast.error('Enter your Employee ID.');
    setResetLoading(true);
    try {
      const { data } = await resetToEmployeeId(empId.trim().toUpperCase());
      setResetDone(true);
      toast.success('Password reset! Use your Employee ID to log in.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Check your Employee ID.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <PageHeader title="Password Settings" subtitle="Manage your account password" />

      {/* ── Tab switcher ───────────────────────────────── */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
        <button
          onClick={() => { setTab('change'); setSuccess(false); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all
            ${tab === 'change'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'}`}
        >
          <KeyRound size={15} /> Change Password
        </button>
        <button
          onClick={() => { setTab('forgot'); setResetDone(false); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all
            ${tab === 'forgot'
              ? 'bg-white text-amber-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'}`}
        >
          <ShieldAlert size={15} /> Forgot Password
        </button>
      </div>

      {/* ══════════════════════════════════════════════════
          TAB 1 — CHANGE PASSWORD
      ══════════════════════════════════════════════════ */}
      {tab === 'change' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">Set a New Password</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Enter your current password, then choose a new one.
            </p>
          </div>

          <div className="p-6">
            {/* Success state */}
            {success ? (
              <div className="flex flex-col items-center py-8 text-center gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={32} />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800">Password Changed!</p>
                  <p className="text-sm text-slate-500 mt-1">Redirecting you to login…</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleChange} className="space-y-5">
                {/* Current password */}
                <PwdInput
                  label="Current Password"
                  field="current"
                  value={form.currentPassword}
                  show={show.current}
                  onToggle={() => setShow(s => ({ ...s, current: !s.current }))}
                  onChange={e => setForm({ ...form, currentPassword: e.target.value })}
                  placeholder="Enter your current password"
                />

                <div className="border-t border-slate-100 pt-5 space-y-4">
                  {/* New password */}
                  <PwdInput
                    label="New Password"
                    field="new"
                    value={form.newPassword}
                    show={show.new}
                    onToggle={() => setShow(s => ({ ...s, new: !s.new }))}
                    onChange={e => setForm({ ...form, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />

                  {/* Strength bar */}
                  {form.newPassword && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5">
                        {[1,2,3,4].map(i => (
                          <div key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300
                              ${i <= strength ? meta?.bar : 'bg-slate-200'}`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs font-semibold ${meta?.text}`}>{meta?.label} password</p>
                    </div>
                  )}

                  {/* Confirm password */}
                  <PwdInput
                    label="Confirm New Password"
                    field="confirm"
                    value={form.confirmPassword}
                    show={show.confirm}
                    onToggle={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                  />

                  {/* Match indicator */}
                  {form.confirmPassword && (
                    <p className={`text-xs font-semibold flex items-center gap-1.5
                      ${form.newPassword === form.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                      {form.newPassword === form.confirmPassword
                        ? <><CheckCircle size={13} /> Passwords match</>
                        : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                {/* Requirements */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                    Password requirements
                  </p>
                  <ul className="space-y-1.5">
                    {[
                      [form.newPassword.length >= 8,          'At least 8 characters'],
                      [/[A-Z]/.test(form.newPassword),        'One uppercase letter'],
                      [/[0-9]/.test(form.newPassword),        'One number'],
                      [/[^A-Za-z0-9]/.test(form.newPassword), 'One special character'],
                    ].map(([met, text]) => (
                      <li key={text} className={`text-xs flex items-center gap-2 font-medium transition-colors
                        ${met ? 'text-green-600' : 'text-slate-400'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs
                          ${met ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                          {met ? '✓' : '○'}
                        </span>
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Forgot password hint */}
                <p className="text-xs text-slate-400 text-center">
                  Forgot your current password?{' '}
                  <button type="button" onClick={() => setTab('forgot')}
                    className="text-amber-600 font-semibold hover:underline">
                    Reset it here
                  </button>
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700
                    text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {loading
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <KeyRound size={16} />}
                  {loading ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB 2 — FORGOT PASSWORD
      ══════════════════════════════════════════════════ */}
      {tab === 'forgot' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">Forgot Your Password?</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Reset your password back to your Employee ID — then log in and change it.
            </p>
          </div>

          <div className="p-6">
            {resetDone ? (
              /* ── Success: reset done ── */
              <div className="flex flex-col items-center py-8 text-center gap-4">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-amber-600" size={32} />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800">Password Reset!</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Your password is now your Employee ID:
                  </p>
                  <div className="mt-3 px-6 py-2.5 bg-amber-50 border border-amber-200 rounded-xl inline-block">
                    <p className="text-lg font-mono font-bold text-amber-800 tracking-widest">
                      {empId.trim().toUpperCase()}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 mt-3">Use this to log in and set a new password.</p>
                </div>
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700
                    text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  <LogIn size={15} /> Go to Login
                </button>
              </div>
            ) : (
              /* ── Form ── */
              <form onSubmit={handleReset} className="space-y-5">
                {/* Info box */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                  <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">How this works</p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                      Enter your <strong>Employee ID</strong> (e.g. EMP001). Your password will be reset
                      to your Employee ID. Log in with it and change your password immediately.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">Your Employee ID</label>
                  <input
                    type="text"
                    value={empId}
                    onChange={e => setEmpId(e.target.value.toUpperCase())}
                    placeholder="e.g. EMP001"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm
                      bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400
                      focus:border-transparent transition-all font-mono tracking-widest placeholder:tracking-normal
                      placeholder:font-sans placeholder:text-slate-400 text-slate-800"
                  />
                  <p className="text-xs text-slate-400">
                    Your Employee ID was assigned when your account was created (e.g. EMP001, TL001)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600
                    text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {resetLoading
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <RotateCcw size={16} />}
                  {resetLoading ? 'Resetting…' : 'Reset My Password'}
                </button>

                <p className="text-xs text-slate-400 text-center">
                  Remember your password?{' '}
                  <button type="button" onClick={() => setTab('change')}
                    className="text-blue-600 font-semibold hover:underline">
                    Change it here
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
