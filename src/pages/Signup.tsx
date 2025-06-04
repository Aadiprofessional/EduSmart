import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUserAlt, FaGoogle, FaFacebook, FaEye, FaEyeSlash } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
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
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow py-12 bg-gray-50 relative overflow-hidden">
        {/* Background decoration */}
        <motion.div 
          className="absolute w-96 h-96 bg-teal-600 rounded-full opacity-5" 
          style={{ filter: 'blur(80px)', top: '-10%', right: '5%' }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div 
          className="absolute w-64 h-64 bg-orange-500 rounded-full opacity-5" 
          style={{ filter: 'blur(60px)', bottom: '-5%', left: '10%' }}
          animate={{
            scale: [1, 1.1, 1],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="bg-gradient-to-r from-teal-700 to-teal-900 py-6 px-8">
              <motion.h1 
                className="text-2xl font-bold text-white text-center"
                variants={itemVariants}
              >
                {t('auth.signup.createAccount')}
              </motion.h1>
              <motion.p 
                className="text-teal-100 text-center mt-2"
                variants={itemVariants}
              >
                {t('auth.signup.joinEduSmart')}
              </motion.p>
            </div>
            
            <div className="py-8 px-8">
              {/* Social signup buttons */}
              <motion.div 
                className="grid grid-cols-2 gap-4 mb-6"
                variants={itemVariants}
              >
                <motion.button
                  onClick={() => handleSocialSignup('Google')}
                  className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  whileHover={{ y: -2, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                  whileTap={{ y: 0 }}
                >
                  <IconComponent icon={FaGoogle} className="text-red-500" />
                  <span>Google</span>
                </motion.button>
                <motion.button
                  onClick={() => handleSocialSignup('Facebook')}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  whileHover={{ y: -2, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                  whileTap={{ y: 0 }}
                >
                  <IconComponent icon={FaFacebook} />
                  <span>Facebook</span>
                </motion.button>
              </motion.div>
              
              <motion.div 
                className="flex items-center justify-center mb-6"
                variants={itemVariants}
              >
                <div className="border-t border-gray-300 flex-grow"></div>
                <span className="px-4 text-gray-500 text-sm">{t('auth.signup.orSignUpWith')}</span>
                <div className="border-t border-gray-300 flex-grow"></div>
              </motion.div>

              {/* Auth error display */}
              {authError && (
                <motion.div 
                  className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {authError}
                </motion.div>
              )}
              
              <form onSubmit={handleSubmit}>
                <motion.div className="mb-4" variants={itemVariants}>
                  <label htmlFor="name" className="block text-gray-700 text-sm font-medium mb-2">
                    {t('auth.signup.nameLabel')}
                  </label>
                  <div className="relative">
                    <IconComponent icon={FaUserAlt} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('auth.signup.namePlaceholder')}
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </motion.div>

                <motion.div className="mb-4" variants={itemVariants}>
                  <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                    {t('auth.signup.emailLabel')}
                  </label>
                  <div className="relative">
                    <IconComponent icon={FaEnvelope} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('auth.signup.emailPlaceholder')}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </motion.div>
                
                <motion.div className="mb-4" variants={itemVariants}>
                  <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                    {t('auth.signup.passwordLabel')}
                  </label>
                  <div className="relative">
                    <IconComponent icon={FaLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('auth.signup.passwordPlaceholder')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <IconComponent icon={showPassword ? FaEyeSlash : FaEye} />
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </motion.div>

                <motion.div className="mb-4" variants={itemVariants}>
                  <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-2">
                    {t('auth.signup.confirmPasswordLabel')}
                  </label>
                  <div className="relative">
                    <IconComponent icon={FaLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('auth.signup.confirmPasswordPlaceholder')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <IconComponent icon={showConfirmPassword ? FaEyeSlash : FaEye} />
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </motion.div>
                
                <motion.div className="mb-6" variants={itemVariants}>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      className="mr-2 mt-1 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700">
                      {t('auth.signup.agreeToTerms')} {' '}
                      <Link to="/terms" className="text-teal-600 hover:text-teal-800">
                        {t('auth.signup.termsAndConditions')}
                      </Link>
                      {' '} and {' '}
                      <Link to="/privacy" className="text-teal-600 hover:text-teal-800">
                        {t('auth.signup.privacyPolicy')}
                      </Link>
                    </span>
                  </label>
                  {errors.terms && <p className="text-red-500 text-sm mt-1">{errors.terms}</p>}
                </motion.div>
                
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? t('common.loading') : t('auth.signup.signUpButton')}
                </motion.button>
              </form>
              
              <motion.div className="text-center mt-6" variants={itemVariants}>
                <span className="text-gray-600">{t('auth.signup.haveAccount')} </span>
                <Link to="/login" className="text-teal-600 hover:text-teal-800 font-medium">
                  {t('auth.signup.signIn')}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Signup; 