 Employee-dashboard
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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../../services/api';

import {
  Card,
  CardBody,
  Button,
  PageHeader,
} from '../../components/common/UI';

import {
  ShieldCheck,
  Eye,
  EyeOff,
  LockKeyhole,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

/* PASSWORD FIELD */
const PasswordField = ({
  label,
  field,
  value,
  placeholder,
  show,
  setShow,
  setForm,
  setSuccess,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <input
          type={show[field] ? 'text' : 'password'}
          value={value}
          onChange={(e) => {
            setForm((prev) => ({
              ...prev,
              [field]: e.target.value,
            }));

            setSuccess(false);
          }}
          placeholder={placeholder}
          required
          className="
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            pr-12
            text-sm
            shadow-sm
            transition-all
            duration-200
            focus:border-blue-500
            focus:outline-none
            focus:ring-4
            focus:ring-blue-100
          "
        />

        <button
          type="button"
          onClick={() =>
            setShow((prev) => ({
              ...prev,
              [field]: !prev[field],
            }))
          }
          className="
            absolute
            right-4
            top-1/2
            -translate-y-1/2
            text-slate-400
            hover:text-slate-600
          "
        >
          {show[field] ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>
      </div>
    </div>
  );
};

const ChangePassword = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [show, setShow] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /* PASSWORD STRENGTH */
  const getStrength = (pwd) => {
    let score = 0;

    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    return score;
  };
 main

  const strength = getStrength(form.newPassword);
  const meta     = strengthMeta[strength];

 Employee-dashboard
  /* ── Handlers ── */
  const handleChange = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword)
      return toast.error('Passwords do not match.');
    if (form.newPassword.length < 6)
      return toast.error('Password must be at least 6 characters.');
    if (form.newPassword === form.currentPassword)
      return toast.error('New password must differ from current password.');

  const strengthText = [
    'Very Weak',
    'Weak',
    'Medium',
    'Strong',
    'Very Strong',
  ];

  const strengthColors = [
    'bg-red-500',
    'bg-orange-400',
    'bg-yellow-400',
    'bg-blue-500',
    'bg-green-500',
  ];

  /* SUBMIT */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    if (form.newPassword.length < 8) {
      return toast.error(
        'Password must be at least 8 characters'
      );
    }

    if (form.currentPassword === form.newPassword) {
      return toast.error(
        'New password must be different'
      );
    }
 main

    try {
      setLoading(true);

      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      toast.success('Password updated successfully');

      if (user?.id) {
        localStorage.setItem(
          `pwd_changed_${user.id}`,
          'true'
        );
      }

      setSuccess(true);
 Employee-dashboard
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      if (user?.id) localStorage.setItem(`pwd_changed_${user.id}`, 'true');
      toast.success('Password changed! Please log in again.');
      setTimeout(() => { logout(); navigate('/login'); }, 2200);


      setForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      /* REDIRECT TO DASHBOARD */
      setTimeout(() => {

        const roleRoutes = {
          admin: '/admin/dashboard',
          tech_lead: '/techlead/dashboard',
          hr: '/hr/dashboard',
          employee: '/employee/dashboard',
        };

        navigate(roleRoutes[user?.role] || '/');

      }, 1500);

 main
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Failed to update password'
      );
    } finally {
      setLoading(false);
    }
  };

 Employee-dashboard
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

  return (
    <div className="max-w-2xl mx-auto py-6">
      <PageHeader
        title="Security Settings"
        subtitle="Change your account password securely"
      />

      <Card className="overflow-hidden border-0 shadow-2xl rounded-3xl">

        {/* TOP HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-2xl">
              <ShieldCheck size={34} />
            </div>

            <div>
              <h2 className="text-2xl font-bold">
                Password & Security
              </h2>

              <p className="text-blue-100 mt-1 text-sm">
                Keep your account secure with a strong password
              </p>
            </div>
          </div>
        </div>

        <CardBody className="p-8">

          {/* SUCCESS MESSAGE */}
          {success && (
            <div className="
              mb-6
              flex
              items-start
              gap-3
              rounded-2xl
              border
              border-green-200
              bg-green-50
              p-4
            ">
              <CheckCircle2
                className="text-green-600 mt-0.5"
                size={22}
              />

              <div>
                <h4 className="font-semibold text-green-800">
                  Password Updated Successfully
                </h4>

                <p className="text-sm text-green-600 mt-1">
                  Redirecting to dashboard...
                </p>
 main
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

 Employee-dashboard
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

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* CURRENT PASSWORD */}
            <PasswordField
              label="Current Password"
              field="currentPassword"
              value={form.currentPassword}
              placeholder="Enter current password"
              show={show}
              setShow={setShow}
              setForm={setForm}
              setSuccess={setSuccess}
            />

            {/* NEW PASSWORD */}
            <PasswordField
              label="New Password"
              field="newPassword"
              value={form.newPassword}
              placeholder="Create a strong password"
              show={show}
              setShow={setShow}
              setForm={setForm}
              setSuccess={setSuccess}
            />

            {/* PASSWORD STRENGTH */}
            {form.newPassword && (
              <div className="space-y-3">

                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`
                        h-2
                        flex-1
                        rounded-full
                        transition-all
                        duration-300
                        ${
                          i <= strength
                            ? strengthColors[strength]
                            : 'bg-slate-200'
                        }
                      `}
                    />
                  ))}
                </div>

                <div className="flex justify-between">
                  <p className="text-sm text-slate-600">
                    Password Strength
 main
                  </p>

                  <span className="font-semibold text-sm">
                    {strengthText[strength]}
                  </span>
                </div>
 Employee-dashboard

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

              </div>
            )}

            {/* CONFIRM PASSWORD */}
            <PasswordField
              label="Confirm Password"
              field="confirmPassword"
              value={form.confirmPassword}
              placeholder="Confirm new password"
              show={show}
              setShow={setShow}
              setForm={setForm}
              setSuccess={setSuccess}
            />

            {/* PASSWORD MATCH */}
            {form.confirmPassword && (
              <div
                className={`
                  flex items-center gap-2 text-sm font-medium
                  ${
                    form.newPassword === form.confirmPassword
                      ? 'text-green-600'
                      : 'text-red-500'
                  }
                `}
              >
                {form.newPassword === form.confirmPassword ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}

                {form.newPassword === form.confirmPassword
                  ? 'Passwords match'
                  : 'Passwords do not match'}
              </div>
            )}

            {/* REQUIREMENTS */}
            <div className="
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              p-5
            ">
              <div className="flex items-center gap-2 mb-4">
                <LockKeyhole
                  size={18}
                  className="text-blue-600"
                />

                <h4 className="font-semibold text-slate-700">
                  Password Requirements
                </h4>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">

                {[
                  [
                    form.newPassword.length >= 8,
                    'Minimum 8 characters',
                  ],
                  [
                    /[A-Z]/.test(form.newPassword),
                    'One uppercase letter',
                  ],
                  [
                    /[0-9]/.test(form.newPassword),
                    'One number',
                  ],
                  [
                    /[^A-Za-z0-9]/.test(form.newPassword),
                    'One special character',
                  ],
                ].map(([met, text]) => (
                  <div
                    key={text}
                    className={`
                      flex items-center gap-2 text-sm
                      ${
                        met
                          ? 'text-green-600'
                          : 'text-slate-500'
                      }
                    `}
                  >
                    <span>
                      {met ? '✓' : '○'}
                    </span>

                    {text}
                  </div>
                ))}

              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">

              <Button
                type="submit"
                loading={loading}
                className="
                  flex-1
                  rounded-xl
                  py-3
                  text-sm
                  font-semibold
                  shadow-lg
                "
                size="lg"
              >
                {loading
                  ? 'Updating Password...'
                  : 'Update Password'}
              </Button>

              <button
                type="button"
                onClick={() =>
                  setForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  })
                }
                className="
                  flex-1
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-5
                  py-3
                  font-semibold
                  hover:bg-slate-50
                  transition-all
                "
              >
                Reset Form
              </button>

            </div>

          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default ChangePassword;
 main
