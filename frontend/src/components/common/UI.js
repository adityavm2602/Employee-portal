// src/components/common/UI.js — Reusable UI primitives

import React from 'react';

// ─── Card ─────────────────────────────────────
export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between p-6 border-b border-slate-100">
    <div>
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

// ─── Badge ────────────────────────────────────
const badgeColors = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  accepted: 'bg-green-100 text-green-700',
  hold: 'bg-blue-100 text-blue-700',
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  probation: 'bg-amber-100 text-amber-700',
  permanent: 'bg-emerald-100 text-emerald-700',
  active: 'bg-blue-100 text-blue-700',
  default: 'bg-slate-100 text-slate-700',
};

export const Badge = ({ status, label }) => {
  const color = badgeColors[status?.toLowerCase()] || badgeColors.default;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${color}`}>
      {label || status}
    </span>
  );
};

// ─── Button ───────────────────────────────────
const btnVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700 bg-white',
};

export const Button = ({
  children, variant = 'primary', size = 'md',
  disabled, loading, onClick, type = 'button', className = '',
}) => {
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${btnVariants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
};

// ─── Input ────────────────────────────────────
export const Input = ({ label, error, className = '', ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
    <input
      className={`w-full px-3 py-2 border rounded-lg text-sm text-slate-800
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        ${error ? 'border-red-400' : 'border-slate-300'}
        ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

// ─── Select ───────────────────────────────────
export const Select = ({ label, error, children, className = '', ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
    <select
      className={`w-full px-3 py-2 border rounded-lg text-sm text-slate-800 bg-white
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        ${error ? 'border-red-400' : 'border-slate-300'} ${className}`}
      {...props}
    >
      {children}
    </select>
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

// ─── Textarea ─────────────────────────────────
export const Textarea = ({ label, error, className = '', ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
    <textarea
      rows={3}
      className={`w-full px-3 py-2 border rounded-lg text-sm text-slate-800
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none
        ${error ? 'border-red-400' : 'border-slate-300'} ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

// ─── StatCard ─────────────────────────────────
export const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </CardBody>
    </Card>
  );
};

// ─── Modal ────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ─── Empty State ──────────────────────────────
export const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && <Icon size={40} className="text-slate-300 mb-3" />}
    <p className="text-slate-500 font-medium">{title}</p>
    {description && <p className="text-slate-400 text-sm mt-1">{description}</p>}
  </div>
);

// ─── Loading Spinner ──────────────────────────
export const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex justify-center items-center p-8">
      <div className={`${sizes[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`} />
    </div>
  );
};

// ─── Page Header ──────────────────────────────
export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
      {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);
