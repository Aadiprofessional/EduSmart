import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaGraduationCap, FaMapMarkerAlt, FaBook, FaSave, FaEdit, FaCheck, FaTimes, FaGlobe, FaDollarSign, FaCalendarAlt, FaChartLine } from 'react-icons/fa';
import { HiOutlineAcademicCap } from 'react-icons/hi';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import { fadeIn, staggerContainer } from '../utils/animations';
import { useAuth } from '../utils/AuthContext';
import { supabase } from '../utils/supabase';

interface UserProfile {
  id?: string;
  user_id: string;
  
  // Basic Information
  full_name: string;
  email: string;
  phone: string;
  
  // Personal Information
  date_of_birth: string;
  nationality: string;
  current_location: string;
  preferred_study_location: string;
  
  // Academic Information
  current_education_level: string;
  current_institution: string;
  current_gpa: number;
  gpa_scale: string;
  graduation_year: string;
  field_of_study: string;
  preferred_field: string;
  
  // Test Scores
  sat_score: number;
  act_score: number;
  gre_score: number;
  gmat_score: number;
  toefl_score: number;
  ielts_score: number;
  duolingo_score: number;
  
  // Preferences
  preferred_degree_level: string;
  budget_range: string;
  preferred_university_size: string;
  preferred_campus_type: string;
  preferred_program_type: string;
  
  // Experience and Activities
  extracurricular_activities: string[];
  career_goals: string;
  work_experience: string;
  research_experience: string;
  publications: string;
  awards: string;
  languages: string[];
  
  // Additional Information
  financial_aid_needed: boolean;
  scholarship_interests: string;
  
  // Profile Management
  profile_completion_percentage: number;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
    current_gpa: 0,
    gpa_scale: '4.0',
    graduation_year: '',
    field_of_study: '',
    preferred_field: '',
    sat_score: 0,
    act_score: 0,
    gre_score: 0,
    gmat_score: 0,
    toefl_score: 0,
    ielts_score: 0,
    duolingo_score: 0,
    preferred_degree_level: '',
    budget_range: '',
    preferred_university_size: '',
    preferred_campus_type: '',
    preferred_program_type: '',
    extracurricular_activities: [],
    career_goals: '',
    work_experience: '',
    research_experience: '',
    publications: '',
    awards: '',
    languages: [],
    financial_aid_needed: false,
    scholarship_interests: '',
    profile_completion_percentage: 5,
  });

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
      return value !== null && value !== undefined && value !== '' && value !== 0;
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

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create a new one
        const newProfile = {
          user_id: user.id,
          full_name: user.user_metadata?.name || '',
          email: user.email || '',
          profile_completion_percentage: 5,
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
        } else if (createdProfile) {
          // Ensure array fields are properly initialized
          const processedProfile = {
            ...profile,
            ...createdProfile,
            extracurricular_activities: createdProfile.extracurricular_activities 
              ? (typeof createdProfile.extracurricular_activities === 'string' 
                  ? createdProfile.extracurricular_activities.split(',').map((item: string) => item.trim()).filter((item: string) => item)
                  : createdProfile.extracurricular_activities)
              : [],
            languages: createdProfile.languages 
              ? (typeof createdProfile.languages === 'string' 
                  ? createdProfile.languages.split(',').map((item: string) => item.trim()).filter((item: string) => item)
                  : createdProfile.languages)
              : []
          };
          setProfile(processedProfile);
        }
      } else if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        // Process the data to ensure array fields are properly handled
        const processedProfile = {
          ...profile,
          ...data,
          extracurricular_activities: data.extracurricular_activities 
            ? (typeof data.extracurricular_activities === 'string' 
                ? data.extracurricular_activities.split(',').map((item: string) => item.trim()).filter((item: string) => item)
                : data.extracurricular_activities)
            : [],
          languages: data.languages 
            ? (typeof data.languages === 'string' 
                ? data.languages.split(',').map((item: string) => item.trim()).filter((item: string) => item)
                : data.languages)
            : []
        };
        setProfile(processedProfile);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const profileData = {
        ...profile,
        user_id: user.id,
        updated_at: new Date().toISOString(),
        // Convert arrays to comma-separated strings for database storage
        extracurricular_activities: Array.isArray(profile.extracurricular_activities) 
          ? profile.extracurricular_activities.join(', ') 
          : profile.extracurricular_activities,
        languages: Array.isArray(profile.languages) 
          ? profile.languages.join(', ') 
          : profile.languages
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error saving profile:', error);
        alert('Error saving profile. Please try again.');
      } else {
        // Process the returned data to ensure array fields are properly handled
        const processedData = {
          ...data,
          extracurricular_activities: data.extracurricular_activities 
            ? (typeof data.extracurricular_activities === 'string' 
                ? data.extracurricular_activities.split(',').map((item: string) => item.trim()).filter((item: string) => item)
                : data.extracurricular_activities)
            : [],
          languages: data.languages 
            ? (typeof data.languages === 'string' 
                ? data.languages.split(',').map((item: string) => item.trim()).filter((item: string) => item)
                : data.languages)
            : []
        };
        setProfile(processedData);
        setIsEditing(false);
        alert('Profile saved successfully!');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: string, value: string) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setProfile(prev => ({
      ...prev,
      [field]: array
    }));
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
                    <h2 className="text-2xl font-bold text-gray-800">Academic Profile</h2>
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
                      <motion.button
                        onClick={() => setIsEditing(true)}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <IconComponent icon={FaEdit} className="mr-2" />
                        Edit Profile
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>

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
                          value={profile.career_goals}
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
                          value={profile.extracurricular_activities.join(', ')}
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
                          value={profile.languages.join(', ')}
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
                          value={profile.work_experience}
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
                          value={profile.research_experience}
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
                          value={profile.publications}
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
                          value={profile.awards}
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