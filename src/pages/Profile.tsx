import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaGraduationCap, FaMapMarkerAlt, FaBook, FaSave, FaEdit, FaCheck, FaTimes, FaGlobe, FaDollarSign, FaCalendarAlt, FaChartLine, FaSync } from 'react-icons/fa';
import { HiOutlineAcademicCap } from 'react-icons/hi';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import { fadeIn, staggerContainer } from '../utils/animations';
import { useAuth } from '../utils/AuthContext';
import { userProfileAPI, UserProfile } from '../utils/userProfileAPI';

const Profile: React.FC = () => {
  const { user, session } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    user_id: user?.id || '',
    full_name: '',
    email: user?.email || '',
    phone: '',
    date_of_birth: '',
    nationality: '',
    current_location: '',
    preferred_study_location: '',
    current_education_level: '',
    current_institution: '',
    current_gpa: '0',
    gpa_scale: '4.0',
    graduation_year: '',
    field_of_study: '',
    preferred_field: '',
    preferred_degree_level: '',
    budget_range: '',
    preferred_university_size: '',
    preferred_campus_type: '',
    preferred_program_type: '',
    career_goals: '',
    work_experience: '',
    research_experience: '',
    publications: '',
    awards: '',
    extracurricular_activities: [],
    languages: [],
    profile_completion_percentage: 5,
  });

  // Auto-save functionality for non-critical fields
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  // Define required fields for profile completion
  const requiredFields = [
    'full_name',
    'current_education_level', 
    'current_institution',
    'current_gpa',
    'graduation_year',
    'field_of_study',
    'preferred_field',
    'preferred_degree_level',
    'budget_range',
    'preferred_study_location'
  ];

  // Calculate profile completion percentage
  const calculateCompletionPercentage = (profileData: UserProfile) => {
    const totalFields = requiredFields.length;
    const completedFields = requiredFields.filter(field => {
      const value = profileData[field as keyof UserProfile];
      return value !== null && value !== undefined && value !== '' && value !== '0';
    }).length;
    
    return Math.round((completedFields / totalFields) * 100);
  };

  // Update profile completion when profile changes
  useEffect(() => {
    if (profile.user_id) {
      const completionPercentage = calculateCompletionPercentage(profile);
      if (completionPercentage !== profile.profile_completion_percentage) {
        setProfile(prev => ({
          ...prev,
          profile_completion_percentage: completionPercentage
        }));
      }
    }
  }, [profile.full_name, profile.current_education_level, profile.current_institution, profile.current_gpa, profile.graduation_year, profile.field_of_study, profile.preferred_field, profile.preferred_degree_level, profile.budget_range, profile.preferred_study_location]);

  // Helper function to render required asterisk
  const RequiredAsterisk = () => <span className="text-red-500 ml-1">*</span>;

  // Helper function to check if field is required
  const isRequired = (fieldName: string) => requiredFields.includes(fieldName);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  useEffect(() => {
    if (user && !isInitialized) {
      setIsInitialized(true);
      fetchProfile();
    }
  }, [user, isInitialized]);

  const sanitizeProfileData = (data: UserProfile) => {
    const sanitized: Partial<UserProfile> = { ...data };
    
    // Handle date fields - convert empty strings to null for database
    if (sanitized.date_of_birth === '') {
      sanitized.date_of_birth = undefined; // Remove empty date
    }
    
    // Handle numeric fields - convert empty strings to null
    const numericFields: (keyof UserProfile)[] = ['current_gpa', 'sat_score', 'act_score', 'gre_score', 'gmat_score', 'toefl_score', 'ielts_score', 'duolingo_score'];
    numericFields.forEach(field => {
      const value = sanitized[field];
      if (value === '' || value === '0' || value === 0) {
        sanitized[field] = undefined; // Remove empty numeric fields
      }
    });
    
    // Ensure arrays are properly formatted
    if (!Array.isArray(sanitized.extracurricular_activities)) {
      sanitized.extracurricular_activities = [];
    }
    if (!Array.isArray(sanitized.languages)) {
      sanitized.languages = [];
    }
    
    // Remove undefined fields
    const cleanedData: Partial<UserProfile> = {};
    Object.entries(sanitized).forEach(([key, value]) => {
      if (value !== undefined) {
        (cleanedData as any)[key] = value;
      }
    });
    
    return cleanedData;
  };

  const fetchProfile = async () => {
    if (!user || loading) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await userProfileAPI.getUserProfile(session);
      
      if (result.success && result.profile) {
        // Profile exists, use it
        const processedProfile = {
          ...profile,
          ...result.profile,
          user_id: user.id,
          email: user.email || result.profile.email || '',
          extracurricular_activities: result.profile.extracurricular_activities || [],
          languages: result.profile.languages || [],
        };
        
        setProfile(processedProfile);
        setSuccessMessage('Profile loaded successfully!');
      } else {
        // Profile doesn't exist, set default profile
        const newProfile = {
          ...profile,
          user_id: user.id,
          full_name: user.user_metadata?.name || '',
          email: user.email || '',
          extracurricular_activities: [],
          languages: [],
          profile_completion_percentage: 5,
        };
        
        setProfile(newProfile);
        setSuccessMessage('Welcome! Please complete your profile to get started.');
      }
    } catch (error) {
      console.error('Network error fetching profile:', error);
      setError('Network error while loading profile');
      // Set default profile with user info
      setProfile(prev => ({
        ...prev,
        user_id: user.id,
        full_name: user.user_metadata?.name || '',
        email: user.email || '',
        extracurricular_activities: [],
        languages: [],
      }));
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileCompletion = async () => {
    if (!user) return;
    
    try {
      const result = await userProfileAPI.getProfileCompletion(session);
      if (result.success && typeof result.completion_percentage === 'number') {
        setProfile(prev => ({
          ...prev,
          profile_completion_percentage: result.completion_percentage
        }));
      }
    } catch (error) {
      console.error('Error fetching profile completion:', error);
    }
  };

  const refreshProfile = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    setError(null);
    try {
      await fetchProfile();
      await fetchProfileCompletion();
      setSuccessMessage('Profile refreshed successfully!');
    } catch (error) {
      setError('Failed to refresh profile');
    } finally {
      setRefreshing(false);
    }
  };

  const saveProfile = async () => {
    if (!user || saving) return;
    
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const sanitizedData = sanitizeProfileData(profile);
      const result = await userProfileAPI.createOrUpdateProfile(sanitizedData, session);
      
      if (result.success) {
        setSuccessMessage('Profile saved successfully!');
        setIsEditing(false);
        // Refresh the profile to get the latest data including completion percentage
        setTimeout(() => {
          fetchProfile();
          fetchProfileCompletion();
        }, 500);
      } else {
        setError(result.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Network error while saving profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleInputChangeWithAutoSave = (field: string, value: any) => {
    handleInputChange(field, value);
    
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // Set new timeout for auto-save (only for non-critical fields)
    const nonCriticalFields = ['career_goals', 'work_experience', 'phone', 'current_location'];
    if (nonCriticalFields.includes(field)) {
      const timeout = setTimeout(() => {
        updateSpecificFields({ [field]: value });
      }, 2000); // Auto-save after 2 seconds of inactivity
      
      setAutoSaveTimeout(timeout);
    }
  };

  const handleArrayChange = (field: string, value: string) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
    handleInputChange(field, arrayValue);
  };

  const updateSpecificFields = async (fields: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      const sanitizedFields = sanitizeProfileData({ ...profile, ...fields });
      const result = await userProfileAPI.updateProfileFields(sanitizedFields, session);
      
      if (result.success) {
        // Update local state with the response
        if (result.profile) {
          setProfile(prev => ({ ...prev, ...result.profile }));
        }
        // Don't show success message for auto-save to avoid spam
      } else {
        console.error('Auto-save failed:', result.error);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  const deleteProfile = async () => {
    if (!user) return;
    
    const confirmed = window.confirm('Are you sure you want to delete your profile? This action cannot be undone.');
    if (!confirmed) return;
    
    setError(null);
    setSuccessMessage(null);
    
    try {
      const result = await userProfileAPI.deleteProfile(session);
      
      if (result.success) {
        setSuccessMessage('Profile deleted successfully!');
        // Reset to default profile
        const defaultProfile = {
          user_id: user.id,
          full_name: user.user_metadata?.name || '',
          email: user.email || '',
          phone: '',
          date_of_birth: '',
          nationality: '',
          current_location: '',
          preferred_study_location: '',
          current_education_level: '',
          current_institution: '',
          current_gpa: '0',
          gpa_scale: '4.0',
          graduation_year: '',
          field_of_study: '',
          preferred_field: '',
          preferred_degree_level: '',
          budget_range: '',
          preferred_university_size: '',
          preferred_campus_type: '',
          preferred_program_type: '',
          career_goals: '',
          work_experience: '',
          research_experience: '',
          publications: '',
          awards: '',
          extracurricular_activities: [],
          languages: [],
          profile_completion_percentage: 5,
        };
        setProfile(defaultProfile);
        setIsEditing(false);
      } else {
        setError(result.error || 'Failed to delete profile');
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      setError('Network error while deleting profile');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <motion.section 
          className="bg-gradient-to-r from-primary to-primary-dark text-white py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center"
              variants={fadeIn("up", 0.3)}
              initial="hidden"
              animate="show"
            >
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Your Academic <span className="text-secondary">Profile</span>
              </h1>
              <p className="text-xl text-gray-100 max-w-2xl mx-auto">
                Build your comprehensive academic profile to get personalized university recommendations and AI-powered insights.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Profile Form */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
              variants={fadeIn("up", 0.3)}
              initial="hidden"
              animate="show"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <IconComponent icon={FaUser} className="text-primary mr-3 text-2xl" />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Academic Profile</h2>
                      <div className="flex items-center mt-2">
                        <span className="text-sm text-gray-600 mr-3">
                          Profile Completion: {profile.profile_completion_percentage || 0}%
                        </span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${profile.profile_completion_percentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {isEditing ? (
                      <>
                        <motion.button
                          onClick={saveProfile}
                          disabled={saving}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <IconComponent icon={saving ? FaChartLine : FaCheck} className="mr-2" />
                          {saving ? 'Saving...' : 'Save'}
                        </motion.button>
                        <motion.button
                          onClick={() => setIsEditing(false)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <IconComponent icon={FaTimes} className="mr-2" />
                          Cancel
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <motion.button
                          onClick={refreshProfile}
                          disabled={refreshing}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <IconComponent icon={FaSync} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                          {refreshing ? 'Refreshing...' : 'Refresh'}
                        </motion.button>
                        <motion.button
                          onClick={() => setIsEditing(true)}
                          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <IconComponent icon={FaEdit} className="mr-2" />
                          Edit Profile
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Error and Success Messages */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <IconComponent icon={FaTimes} className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                    <div className="ml-auto pl-3">
                      <button
                        onClick={() => setError(null)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <IconComponent icon={FaTimes} className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 mx-6 mt-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <IconComponent icon={FaCheck} className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">{successMessage}</p>
                    </div>
                    <div className="ml-auto pl-3">
                      <button
                        onClick={() => setSuccessMessage(null)}
                        className="text-green-400 hover:text-green-600"
                      >
                        <IconComponent icon={FaTimes} className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Content */}
              <div className="p-6">
                <motion.div
                  variants={staggerContainer(0.1, 0)}
                  initial="hidden"
                  animate="show"
                  className="space-y-8"
                >
                  {/* Personal Information */}
                  <motion.div variants={fadeIn("up", 0)} className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <IconComponent icon={FaUser} className="mr-2 text-primary" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name{isRequired('full_name') && <RequiredAsterisk />}
                        </label>
                        <input
                          type="text"
                          value={profile.full_name}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={profile.email}
                          disabled={true}
                          className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                        <input
                          type="date"
                          value={profile.date_of_birth}
                          onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                        <select
                          value={profile.nationality}
                          onChange={(e) => handleInputChange('nationality', e.target.value)}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                        >
                          <option value="">Select nationality</option>
                          <option value="US">United States</option>
                          <option value="UK">United Kingdom</option>
                          <option value="CA">Canada</option>
                          <option value="AU">Australia</option>
                          <option value="IN">India</option>
                          <option value="CN">China</option>
                          <option value="JP">Japan</option>
                          <option value="KR">South Korea</option>
                          <option value="DE">Germany</option>
                          <option value="FR">France</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Location</label>
                        <input
                          type="text"
                          value={profile.current_location}
                          onChange={(e) => handleInputChange('current_location', e.target.value)}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="City, Country"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Academic Information */}
                  <motion.div variants={fadeIn("up", 0)} className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <IconComponent icon={FaGraduationCap} className="mr-2 text-primary" />
                      Academic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Education Level{isRequired('current_education_level') && <RequiredAsterisk />}
                        </label>
                        <select
                          value={profile.current_education_level}
                          onChange={(e) => handleInputChange('current_education_level', e.target.value)}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                        >
                          <option value="">Select level</option>
                          <option value="High School">High School</option>
                          <option value="Undergraduate">Undergraduate</option>
                          <option value="Graduate">Graduate</option>
                          <option value="Postgraduate">Postgraduate</option>
                          <option value="PhD">PhD</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Institution{isRequired('current_institution') && <RequiredAsterisk />}
                        </label>
                        <input
                          type="text"
                          value={profile.current_institution}
                          onChange={(e) => handleInputChange('current_institution', e.target.value)}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="Name of your current school/university"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current GPA{isRequired('current_gpa') && <RequiredAsterisk />}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="4"
                            value={profile.current_gpa || ''}
                            onChange={(e) => handleInputChange('current_gpa', parseFloat(e.target.value) || 0)}
                            disabled={!isEditing}
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                            placeholder="3.75"
                          />
                          <select
                            value={profile.gpa_scale}
                            onChange={(e) => handleInputChange('gpa_scale', e.target.value)}
                            disabled={!isEditing}
                            className="w-20 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          >
                            <option value="4.0">4.0</option>
                            <option value="5.0">5.0</option>
                            <option value="10.0">10.0</option>
                            <option value="100">100</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expected Graduation Year{isRequired('graduation_year') && <RequiredAsterisk />}
                        </label>
                        <input
                          type="number"
                          min="2024"
                          max="2030"
                          value={profile.graduation_year}
                          onChange={(e) => handleInputChange('graduation_year', e.target.value)}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="2025"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Field of Study{isRequired('field_of_study') && <RequiredAsterisk />}
                        </label>
                        <input
                          type="text"
                          value={profile.field_of_study}
                          onChange={(e) => handleInputChange('field_of_study', e.target.value)}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="Computer Science, Engineering, etc."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preferred Field for Higher Studies{isRequired('preferred_field') && <RequiredAsterisk />}
                        </label>
                        <input
                          type="text"
                          value={profile.preferred_field}
                          onChange={(e) => handleInputChange('preferred_field', e.target.value)}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="AI, Data Science, Business, etc."
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Test Scores */}
                  <motion.div variants={fadeIn("up", 0)} className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <IconComponent icon={HiOutlineAcademicCap} className="mr-2 text-primary" />
                      Test Scores
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">SAT Score</label>
                        <input
                          type="number"
                          min="400"
                          max="1600"
                          value={profile.sat_score || ''}
                          onChange={(e) => handleInputChange('sat_score', parseInt(e.target.value) || 0)}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="1500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ACT Score</label>
                        <input
                          type="number"
                          min="1"
                          max="36"
                          value={profile.act_score || ''}
                          onChange={(e) => handleInputChange('act_score', parseInt(e.target.value) || 0)}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="34"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">GRE Score</label>
                        <input
                          type="number"
                          min="260"
                          max="340"
                          value={profile.gre_score || ''}
                          onChange={(e) => handleInputChange('gre_score', parseInt(e.target.value) || 0)}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="320"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">GMAT Score</label>
                        <input
                          type="number"
                          min="200"
                          max="800"
                          value={profile.gmat_score || ''}
                          onChange={(e) => handleInputChange('gmat_score', parseInt(e.target.value) || 0)}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="720"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">TOEFL Score</label>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={profile.toefl_score || ''}
                          onChange={(e) => handleInputChange('toefl_score', parseInt(e.target.value) || 0)}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">IELTS Score</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="9"
                          value={profile.ielts_score || ''}
                          onChange={(e) => handleInputChange('ielts_score', parseFloat(e.target.value) || 0)}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="7.5"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Preferences */}
                  <motion.div variants={fadeIn("up", 0)} className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <IconComponent icon={FaMapMarkerAlt} className="mr-2 text-primary" />
                      Study Preferences
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preferred Study Location{isRequired('preferred_study_location') && <RequiredAsterisk />}
                        </label>
                        <input
                          type="text"
                          value={profile.preferred_study_location}
                          onChange={(e) => handleInputChange('preferred_study_location', e.target.value)}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="USA, UK, Canada, etc."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preferred Degree Level{isRequired('preferred_degree_level') && <RequiredAsterisk />}
                        </label>
                        <select
                          value={profile.preferred_degree_level}
                          onChange={(e) => handleInputChange('preferred_degree_level', e.target.value)}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                        >
                          <option value="">Select degree level</option>
                          <option value="Bachelor's">Bachelor's</option>
                          <option value="Master's">Master's</option>
                          <option value="PhD">PhD</option>
                          <option value="Professional">Professional Degree</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Budget Range (Annual){isRequired('budget_range') && <RequiredAsterisk />}
                        </label>
                        <select
                          value={profile.budget_range}
                          onChange={(e) => handleInputChange('budget_range', e.target.value)}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                        >
                          <option value="">Select budget range</option>
                          <option value="Under $20,000">Under $20,000</option>
                          <option value="$20,000 - $40,000">$20,000 - $40,000</option>
                          <option value="$40,000 - $60,000">$40,000 - $60,000</option>
                          <option value="$60,000 - $80,000">$60,000 - $80,000</option>
                          <option value="Above $80,000">Above $80,000</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred University Size</label>
                        <select
                          value={profile.preferred_university_size}
                          onChange={(e) => handleInputChange('preferred_university_size', e.target.value)}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                        >
                          <option value="">Select size preference</option>
                          <option value="Small (Under 5,000)">Small (Under 5,000)</option>
                          <option value="Medium (5,000-15,000)">Medium (5,000-15,000)</option>
                          <option value="Large (15,000-30,000)">Large (15,000-30,000)</option>
                          <option value="Very Large (30,000+)">Very Large (30,000+)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Campus Type</label>
                        <select
                          value={profile.preferred_campus_type}
                          onChange={(e) => handleInputChange('preferred_campus_type', e.target.value)}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                        >
                          <option value="">Select campus type</option>
                          <option value="Urban">Urban</option>
                          <option value="Suburban">Suburban</option>
                          <option value="Rural">Rural</option>
                          <option value="No Preference">No Preference</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Career Goals</label>
                        <textarea
                          value={profile.career_goals || ''}
                          onChange={(e) => handleInputChange('career_goals', e.target.value)}
                          disabled={!isEditing}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="Describe your career aspirations..."
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Additional Information */}
                  <motion.div variants={fadeIn("up", 0)} className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <IconComponent icon={FaBook} className="mr-2 text-primary" />
                      Additional Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Extracurricular Activities</label>
                        <textarea
                          value={(profile.extracurricular_activities || []).join(', ')}
                          onChange={(e) => handleArrayChange('extracurricular_activities', e.target.value)}
                          disabled={!isEditing}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="Sports, clubs, volunteer work (separate with commas)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                        <textarea
                          value={(profile.languages || []).join(', ')}
                          onChange={(e) => handleArrayChange('languages', e.target.value)}
                          disabled={!isEditing}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="English, Spanish, French (separate with commas)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Work Experience</label>
                        <textarea
                          value={profile.work_experience || ''}
                          onChange={(e) => handleInputChange('work_experience', e.target.value)}
                          disabled={!isEditing}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="Describe your work experience..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Research Experience</label>
                        <textarea
                          value={profile.research_experience || ''}
                          onChange={(e) => handleInputChange('research_experience', e.target.value)}
                          disabled={!isEditing}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="Describe your research experience..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Publications</label>
                        <textarea
                          value={profile.publications || ''}
                          onChange={(e) => handleInputChange('publications', e.target.value)}
                          disabled={!isEditing}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="List your publications..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Awards & Achievements</label>
                        <textarea
                          value={profile.awards || ''}
                          onChange={(e) => handleInputChange('awards', e.target.value)}
                          disabled={!isEditing}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                          placeholder="List your awards and achievements..."
                        />
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Profile; 