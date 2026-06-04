import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login as loginAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Role based dashboard mapping
  const roleRedirects = {
    admin: '/admin/dashboard',
    tech_lead: '/techlead/dashboard',
    hr: '/hr/dashboard',
    employee: '/employee/dashboard',
  };

  // If already logged in
  if (user) {
    return <Navigate to={roleRedirects[user.role] || '/'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const { data } = await loginAPI(form);

      // Save auth
      login(data.token, data.user);

      // Optional localStorage backup
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success(`Welcome ${data.user.name || 'User'}!`);

      // Role based redirect
      if (data.user.role === 'tech_lead') {
        navigate('/techlead/dashboard');
      } else if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (data.user.role === 'hr') {
        navigate('/hr/dashboard');
      } else {
        navigate('/employee/dashboard');
      }

    } catch (err) {
      console.log(err);

      setError(
        err.response?.data?.message ||
        'Login failed. Please check your credentials.'
      );

      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">EP</span>
          </div>

          <h1 className="text-2xl font-bold text-white">
            Employee Portal
          </h1>

          <p className="text-slate-400 text-sm mt-1">
            Sign in to your account
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>

              <input
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>

              <input
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <p className="text-xs text-slate-400 mt-1">
                Your password was sent to your email when the account was created.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}

              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Role Info */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 mb-2">
              Roles in this system
            </p>

            <div className="space-y-1 text-xs text-slate-500">
              <p>🟣 <strong>Admin</strong> — adds employees, TLs, HR via manual/bulk upload</p>
              <p>🔵 <strong>Tech Lead</strong> — manages projects, reviews team leaves</p>
              <p>🌹 <strong>HR</strong> — final leave approvals, views all employees</p>
              <p>🟢 <strong>Employee</strong> — logs work, applies for leave</p>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Passwords are emailed when accounts are created. You can change it after login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}