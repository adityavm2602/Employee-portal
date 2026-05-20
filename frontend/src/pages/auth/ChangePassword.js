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

  const strength = getStrength(form.newPassword);

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

    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Failed to update password'
      );
    } finally {
      setLoading(false);
    }
  };

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
              </div>
            </div>
          )}

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
                  </p>

                  <span className="font-semibold text-sm">
                    {strengthText[strength]}
                  </span>
                </div>
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