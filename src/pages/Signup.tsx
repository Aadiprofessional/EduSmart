import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUserAlt, FaGoogle, FaFacebook, FaEye, FaEyeSlash } from 'react-icons/fa';
import IconComponent from '../components/ui/IconComponent';
import { useAuth } from '../utils/AuthContext';
import { useLanguage } from '../utils/LanguageContext';
import { motion } from 'framer-motion';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, signInWithFacebook } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    
    // Clear auth error when user changes input
    if (authError) {
      setAuthError(null);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = t('auth.signup.nameRequired');
    }
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = t('auth.signup.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.signup.emailInvalid');
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = t('auth.signup.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('auth.signup.passwordMinLength');
    }
    
    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.signup.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.signup.passwordsNotMatch');
    }
    
    // Validate terms agreement
    if (!agreeToTerms) {
      newErrors.terms = t('auth.signup.agreeToTermsRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        const { success, error } = await signUp(formData.email, formData.password, formData.name);
        
        if (success) {
          // Show success message and redirect to login
          alert(t('auth.signup.accountCreated'));
          navigate('/login');
        } else {
          setAuthError(error || t('auth.signup.signUpError'));
        }
      } catch (error) {
        setAuthError(t('auth.signup.signUpError'));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSocialSignup = async (provider: string) => {
    try {
      if (provider === 'Google') {
        await signInWithGoogle();
      } else if (provider === 'Facebook') {
        await signInWithFacebook();
      }
    } catch (error) {
      console.error(`Error with ${provider} signup:`, error);
      setAuthError(`${provider} signup failed. Please try again.`);
    }
  };
  
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" 
          style={{ top: '5%', right: '15%' }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div 
          className="absolute w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" 
          style={{ top: '50%', left: '10%' }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 3
          }}
        />
        <motion.div 
          className="absolute w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" 
          style={{ bottom: '10%', right: '25%' }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 13,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 6
          }}
        />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link to="/" className="inline-block">
            <span className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              EduSmart
            </span>
          </Link>
        </motion.div>

        <motion.div 
          className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 backdrop-blur-sm p-8 border-b border-white/10">
            <motion.h1 
              className="text-3xl font-bold text-white text-center"
              variants={itemVariants}
            >
              {t('auth.signup.createAccount')}
            </motion.h1>
            <motion.p 
              className="text-emerald-200 text-center mt-2"
              variants={itemVariants}
            >
              {t('auth.signup.joinEduSmart')}
            </motion.p>
          </div>
          
          <div className="p-8">
            {/* Social signup buttons */}
            <motion.div 
              className="grid grid-cols-2 gap-4 mb-6"
              variants={itemVariants}
            >
              <motion.button
                onClick={() => handleSocialSignup('Google')}
                className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-3 rounded-xl hover:bg-white/20 transition-all duration-300"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ y: 0, scale: 0.98 }}
              >
                <IconComponent icon={FaGoogle} className="text-red-400" />
                <span className="font-medium">Google</span>
              </motion.button>
              <motion.button
                onClick={() => handleSocialSignup('Facebook')}
                className="flex items-center justify-center gap-2 bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 text-white px-4 py-3 rounded-xl hover:bg-blue-600/30 transition-all duration-300"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ y: 0, scale: 0.98 }}
              >
                <IconComponent icon={FaFacebook} className="text-blue-400" />
                <span className="font-medium">Facebook</span>
              </motion.button>
            </motion.div>
            
            <motion.div 
              className="flex items-center justify-center mb-6"
              variants={itemVariants}
            >
              <div className="border-t border-white/20 flex-grow"></div>
              <span className="px-4 text-gray-300 text-sm font-medium">{t('auth.signup.orSignUpWith')}</span>
              <div className="border-t border-white/20 flex-grow"></div>
            </motion.div>

            {/* Auth error display */}
            {authError && (
              <motion.div 
                className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-4 backdrop-blur-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {authError}
              </motion.div>
            )}
            
            <form onSubmit={handleSubmit}>
              <motion.div className="mb-4" variants={itemVariants}>
                <label htmlFor="name" className="block text-gray-200 text-sm font-medium mb-2">
                  {t('auth.signup.nameLabel')}
                </label>
                <div className="relative">
                  <IconComponent icon={FaUserAlt} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-400 transition-all duration-300 ${
                      errors.name ? 'border-red-500/50' : 'border-white/20 hover:border-white/30'
                    }`}
                    placeholder={t('auth.signup.namePlaceholder')}
                  />
                </div>
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </motion.div>

              <motion.div className="mb-4" variants={itemVariants}>
                <label htmlFor="email" className="block text-gray-200 text-sm font-medium mb-2">
                  {t('auth.signup.emailLabel')}
                </label>
                <div className="relative">
                  <IconComponent icon={FaEnvelope} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-400 transition-all duration-300 ${
                      errors.email ? 'border-red-500/50' : 'border-white/20 hover:border-white/30'
                    }`}
                    placeholder={t('auth.signup.emailPlaceholder')}
                  />
                </div>
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </motion.div>
              
              <motion.div className="mb-4" variants={itemVariants}>
                <label htmlFor="password" className="block text-gray-200 text-sm font-medium mb-2">
                  {t('auth.signup.passwordLabel')}
                </label>
                <div className="relative">
                  <IconComponent icon={FaLock} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-400 transition-all duration-300 ${
                      errors.password ? 'border-red-500/50' : 'border-white/20 hover:border-white/30'
                    }`}
                    placeholder={t('auth.signup.passwordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    <IconComponent icon={showPassword ? FaEyeSlash : FaEye} />
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
              </motion.div>

              <motion.div className="mb-4" variants={itemVariants}>
                <label htmlFor="confirmPassword" className="block text-gray-200 text-sm font-medium mb-2">
                  {t('auth.signup.confirmPasswordLabel')}
                </label>
                <div className="relative">
                  <IconComponent icon={FaLock} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-400 transition-all duration-300 ${
                      errors.confirmPassword ? 'border-red-500/50' : 'border-white/20 hover:border-white/30'
                    }`}
                    placeholder={t('auth.signup.confirmPasswordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    <IconComponent icon={showConfirmPassword ? FaEyeSlash : FaEye} />
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
              </motion.div>
              
              <motion.div className="mb-6" variants={itemVariants}>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="mr-3 mt-1 text-emerald-500 bg-white/10 border-white/20 rounded focus:ring-emerald-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-300">
                    {t('auth.signup.agreeToTerms')} {' '}
                    <Link to="/terms" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                      {t('auth.signup.termsAndConditions')}
                    </Link>
                    {' '} and {' '}
                    <Link to="/privacy" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                      {t('auth.signup.privacyPolicy')}
                    </Link>
                  </span>
                </label>
                {errors.terms && <p className="text-red-400 text-sm mt-1">{errors.terms}</p>}
              </motion.div>
              
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    {t('common.loading')}
                  </div>
                ) : (
                  t('auth.signup.signUpButton')
                )}
              </motion.button>
            </form>
            
            <motion.div className="text-center mt-6" variants={itemVariants}>
              <span className="text-gray-300">{t('auth.signup.haveAccount')} </span>
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                {t('auth.signup.signIn')}
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup; 