// src/pages/employee/Profile.js
import React, { useEffect, useState, useRef } from 'react';
import { getProfile, updateProfile, uploadProfileImage, changeProfilePassword } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Card, CardHeader, CardBody, Button, Input, Textarea, Modal, PageHeader, Spinner, Select
} from '../../components/common/UI';
import {
  User, Phone, MapPin, Briefcase, Award, Shield, Calendar, AlignLeft, AlertCircle, Plus, X, Lock, Camera, Check, AlertTriangle,
  Linkedin, Github, Globe, Heart, GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Profile fields state
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');

  // New fields state
  const [workMode, setWorkMode] = useState('Remote');
  const [bloodGroup, setBloodGroup] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [qualification, setQualification] = useState('');
  const [certifications, setCertifications] = useState([]);
  const [newCertification, setNewCertification] = useState('');

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  // File Upload State
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const fetchUserProfile = async () => {
    try {
      const res = await getProfile();
      if (res.data?.success) {
        const prof = res.data.profile;
        setProfile(prof);
        setPhone(prof.phone || '');
        setAddress(prof.address || '');
        setEmergencyContact(prof.emergencyContact || '');
        setBio(prof.bio || '');
        setSkills(prof.skills || []);
        setWorkMode(prof.workMode || 'Remote');
        setBloodGroup(prof.bloodGroup || '');
        setLinkedin(prof.linkedin || '');
        setGithub(prof.github || '');
        setQualification(prof.qualification || '');
        setCertifications(prof.certifications || []);
      }
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();

    // Phone format validation (10 to 15 digits, optional +)
    const phoneRegex = /^\+?[0-9\s-]{10,15}$/;
    if (phone && !phoneRegex.test(phone.trim())) {
      toast.error('Invalid phone number');
      return;
    }

    // URL format validation for LinkedIn / GitHub if provided
    const urlRegex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
    if (linkedin.trim() && !urlRegex.test(linkedin.trim())) {
      toast.error('Invalid LinkedIn URL format');
      return;
    }
    if (github.trim() && !urlRegex.test(github.trim())) {
      toast.error('Invalid GitHub URL format');
      return;
    }

    try {
      const res = await updateProfile({
        phone: phone.trim(),
        address: address.trim(),
        emergencyContact: emergencyContact.trim(),
        bio: bio.trim(),
        skills,
        workMode,
        bloodGroup,
        linkedin: linkedin.trim(),
        github: github.trim(),
        qualification: qualification.trim(),
        certifications,
      });

      if (res.data?.success) {
        setProfile(res.data.profile);
        setIsEditing(false);
        toast.success('Profile updated successfully');

        // Sync local auth user object if needed
        if (user) {
          const updatedUser = { ...user };
          if (updatedUser.profile) {
            updatedUser.profile.contactNumber = phone;
          }
          login(localStorage.getItem('token'), updatedUser);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setEmergencyContact(profile.emergencyContact || '');
      setBio(profile.bio || '');
      setSkills(profile.skills || []);
      setWorkMode(profile.workMode || 'Remote');
      setBloodGroup(profile.bloodGroup || '');
      setLinkedin(profile.linkedin || '');
      setGithub(profile.github || '');
      setQualification(profile.qualification || '');
      setCertifications(profile.certifications || []);
      setNewCertification('');
      setNewSkill('');
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (skills.includes(newSkill.trim())) {
      toast.error('Skill already exists');
      return;
    }
    setSkills([...skills, newSkill.trim()]);
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleAddCertification = (e) => {
    e.preventDefault();
    if (!newCertification.trim()) return;
    if (certifications.includes(newCertification.trim())) {
      toast.error('Certification already exists');
      return;
    }
    setCertifications([...certifications, newCertification.trim()]);
    setNewCertification('');
  };

  const handleRemoveCertification = (certToRemove) => {
    setCertifications(certifications.filter(c => c !== certToRemove));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type: JPG, PNG only
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG and PNG images are allowed.');
      return;
    }

    // Validate size: 5MB max
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Profile image size exceeds limit (Max 5MB)');
      return;
    }

    const formData = new FormData();
    formData.append('profileImage', file);

    setUploading(true);
    try {
      const res = await uploadProfileImage(formData);
      if (res.data?.success) {
        setProfile(res.data.profile);
        toast.success('Profile picture updated!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  // Password Requirements Checker
  const checkReq = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Check strict requirements
    if (Object.values(checkReq).some(v => !v)) {
      toast.error('Password does not meet requirements');
      return;
    }

    setPwdSubmitting(true);
    try {
      const res = await changeProfilePassword({ currentPassword, newPassword });
      if (res.data?.success) {
        toast.success('Password changed successfully');
        setIsPasswordModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwdSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  // Format image URL
  const avatarUrl = profile?.profileImage
    ? (profile.profileImage.startsWith('http') ? profile.profileImage : `http://localhost:5000${profile.profileImage}`)
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal details, profile picture, and security settings"
        action={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Lock size={15} /> Change Password
            </Button>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            ) : (
              <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & System Details */}
        <div className="space-y-6">
          <Card className="text-center overflow-hidden">
            <CardBody className="pt-8 pb-6 flex flex-col items-center">
              {/* Profile Image with Upload Button */}
              <div className="relative group w-32 h-32 rounded-full ring-4 ring-slate-100 shadow-inner flex items-center justify-center bg-slate-50 overflow-hidden mb-4">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={60} className="text-slate-300" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                    <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold cursor-pointer"
                  disabled={uploading}
                >
                  <Camera size={18} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />
              </div>

              <h2 className="text-xl font-bold text-slate-800">{profile?.name}</h2>
              <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide bg-slate-100 px-2.5 py-0.5 rounded-full inline-block">
                ID: {profile?.employeeId}
              </p>

              {/* Social Links Row */}
              <div className="flex justify-center gap-3 mt-4">
                {profile?.linkedin ? (
                  <a
                    href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors shadow-sm"
                    title="LinkedIn Profile"
                  >
                    <Linkedin size={18} />
                  </a>
                ) : (
                  <div className="p-2.5 rounded-full bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100" title="LinkedIn not configured">
                    <Linkedin size={18} />
                  </div>
                )}

                {profile?.github ? (
                  <a
                    href={profile.github.startsWith('http') ? profile.github : `https://${profile.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
                    title="GitHub Profile"
                  >
                    <Github size={18} />
                  </a>
                ) : (
                  <div className="p-2.5 rounded-full bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100" title="GitHub not configured">
                    <Github size={18} />
                  </div>
                )}
              </div>

              <div className="w-full border-t border-slate-100 my-6"></div>

              {/* Read Only System Metadata */}
              <div className="w-full space-y-4 text-left text-sm">
                <div className="flex items-center gap-3 text-slate-600">
                  <Shield size={16} className="text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Role</p>
                    <p className="font-semibold text-slate-700 capitalize">{user?.role?.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Briefcase size={16} className="text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Designation / Dept</p>
                    <p className="font-semibold text-slate-700">{profile?.designation} ({profile?.department})</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar size={16} className="text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Joining Date</p>
                    <p className="font-semibold text-slate-700">
                      {profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'long', day: 'numeric'
                      }) : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Globe size={16} className="text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Work Mode</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mt-0.5 ${
                      profile?.workMode === 'On-site' ? 'bg-amber-100 text-amber-800' :
                      profile?.workMode === 'Hybrid' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {profile?.workMode || 'Remote'}
                    </span>
                  </div>
                </div>
                {profile?.bloodGroup && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Heart size={16} className="text-rose-500 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Blood Group</p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-100 mt-0.5">
                        {profile?.bloodGroup}
                      </span>
                    </div>
                  </div>
                )}
                {profile?.qualification && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <GraduationCap size={16} className="text-purple-500 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Highest Qualification</p>
                      <p className="font-semibold text-slate-700 mt-0.5">{profile?.qualification}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Editable Details Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="space-y-6">
            <Card>
              <CardHeader title="Personal & Contact Details" subtitle="Manage your contact and basic background information" />
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Official Email (Read-Only)"
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200"
                  />
                  <Input
                    label="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter phone number"
                    className={!isEditing ? 'bg-slate-50 text-slate-600 border-slate-200' : ''}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Emergency Contact"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Name & Contact number"
                    className={!isEditing ? 'bg-slate-50 text-slate-600 border-slate-200' : ''}
                  />
                  <Input
                    label="Home Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter full address"
                    className={!isEditing ? 'bg-slate-50 text-slate-600 border-slate-200' : ''}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Blood Group"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-slate-50 text-slate-600 border-slate-200' : ''}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </Select>
                  <Input
                    label="Highest Qualification"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g. Bachelor of Technology in CS"
                    className={!isEditing ? 'bg-slate-50 text-slate-600 border-slate-200' : ''}
                  />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Professional & Social Profiles" subtitle="Configure your work setup and online presence" />
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    label="Work Mode"
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-slate-50 text-slate-600 border-slate-200' : ''}
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </Select>
                  <Input
                    label="LinkedIn URL"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://linkedin.com/in/username"
                    className={!isEditing ? 'bg-slate-50 text-slate-600 border-slate-200' : ''}
                  />
                  <Input
                    label="GitHub URL"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://github.com/username"
                    className={!isEditing ? 'bg-slate-50 text-slate-600 border-slate-200' : ''}
                  />
                </div>

                <Textarea
                  label="Bio / About Me"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                  className={!isEditing ? 'bg-slate-50 text-slate-600 border-slate-200' : ''}
                  rows={4}
                />
              </CardBody>
            </Card>

            {/* Skills Card */}
            <Card>
              <CardHeader title="Skills & Core Expertise" subtitle="Add or remove tags matching your skills" />
              <CardBody className="space-y-4">
                {isEditing && (
                  <div className="flex gap-2 max-w-md">
                    <Input
                      placeholder="Add a skill (e.g., React, Node)"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill(e);
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddSkill} className="self-end shrink-0">
                      <Plus size={16} /> Add
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  {skills.length === 0 ? (
                    <p className="text-slate-400 text-sm">No skills added yet.</p>
                  ) : (
                    skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold"
                      >
                        {skill}
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="p-0.5 rounded-full hover:bg-blue-150 transition-colors text-blue-500 hover:text-blue-800"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </span>
                    ))
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Certifications Card */}
            <Card>
              <CardHeader title="Certifications & Achievements" subtitle="Add credentials, licenses, or key course completions" />
              <CardBody className="space-y-4">
                {isEditing && (
                  <div className="flex gap-2 max-w-md">
                    <Input
                      placeholder="Add a certification (e.g., AWS Solutions Architect)"
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCertification(e);
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddCertification} className="self-end shrink-0">
                      <Plus size={16} /> Add
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  {certifications.length === 0 ? (
                    <p className="text-slate-400 text-sm">No certifications added yet.</p>
                  ) : (
                    certifications.map((cert, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100"
                      >
                        <Award size={12} className="text-emerald-600 shrink-0" />
                        {cert}
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCertification(cert)}
                            className="p-0.5 rounded-full hover:bg-emerald-150 transition-colors text-emerald-500 hover:text-emerald-800"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </span>
                    ))
                  )}
                </div>
              </CardBody>
            </Card>

            {isEditing && (
              <div className="flex justify-end gap-3">
                <Button variant="secondary" type="button" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }}
        title="Change Account Password"
        size="md"
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          {/* Real-time Validation Checker Panel */}
          {newPassword && (
            <Card className="bg-slate-50 border-slate-100">
              <CardBody className="p-3.5 space-y-2">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Password Checklist</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center gap-1.5 font-medium ${checkReq.length ? 'text-green-600' : 'text-slate-400'}`}>
                    {checkReq.length ? <Check size={14} className="stroke-[3]" /> : <X size={14} />}
                    <span>Min 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 font-medium ${checkReq.upper ? 'text-green-600' : 'text-slate-400'}`}>
                    {checkReq.upper ? <Check size={14} className="stroke-[3]" /> : <X size={14} />}
                    <span>Uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 font-medium ${checkReq.lower ? 'text-green-600' : 'text-slate-400'}`}>
                    {checkReq.lower ? <Check size={14} className="stroke-[3]" /> : <X size={14} />}
                    <span>Lowercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 font-medium ${checkReq.number ? 'text-green-600' : 'text-slate-400'}`}>
                    {checkReq.number ? <Check size={14} className="stroke-[3]" /> : <X size={14} />}
                    <span>Number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 font-medium ${checkReq.special ? 'text-green-600' : 'text-slate-400'}`}>
                    {checkReq.special ? <Check size={14} className="stroke-[3]" /> : <X size={14} />}
                    <span>Special character</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setIsPasswordModalOpen(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={pwdSubmitting}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;
