import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaGoogle, FaFacebook, FaEye, FaEyeSlash } from 'react-icons/fa';
import IconComponent from '../components/ui/IconComponent';
import { motion } from 'framer-motion';
import { useAuth } from '../utils/AuthContext';
import { useLanguage } from '../utils/LanguageContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, signInWithFacebook } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
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
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = t('auth.login.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.login.emailInvalid');
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = t('auth.login.passwordRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        const { success, error } = await signIn(formData.email, formData.password);
        
        if (success) {
          navigate('/');
        } else {
          setAuthError(error || t('auth.login.signInError'));
        }
      } catch (error) {
        setAuthError(t('auth.login.signInError'));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSocialLogin = async (provider: string) => {
    try {
      if (provider === 'Google') {
        await signInWithGoogle();
      } else if (provider === 'Facebook') {
        await signInWithFacebook();
      }
    } catch (error) {
      console.error(`Error with ${provider} login:`, error);
      setAuthError(`${provider} login failed. Please try again.`);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" 
          style={{ top: '10%', left: '10%' }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div 
          className="absolute w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" 
          style={{ top: '60%', right: '20%' }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 2
          }}
        />
        <motion.div 
          className="absolute w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" 
          style={{ bottom: '20%', left: '30%' }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 4
          }}
        />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
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
            <span className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
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
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm p-8 border-b border-white/10">
            <motion.h1 
              className="text-3xl font-bold text-white text-center"
              variants={itemVariants}
            >
              {t('auth.login.welcomeBack')}
            </motion.h1>
            <motion.p 
              className="text-blue-200 text-center mt-2"
              variants={itemVariants}
            >
              {t('auth.login.signInToAccount')}
            </motion.p>
          </div>
          
          <div className="p-8">
            {/* Social login buttons */}
            <motion.div 
              className="grid grid-cols-2 gap-4 mb-6"
              variants={itemVariants}
            >
              <motion.button
                onClick={() => handleSocialLogin('Google')}
                className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-3 rounded-xl hover:bg-white/20 transition-all duration-300"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ y: 0, scale: 0.98 }}
              >
                <IconComponent icon={FaGoogle} className="text-red-400" />
                <span className="font-medium">Google</span>
              </motion.button>
              <motion.button
                onClick={() => handleSocialLogin('Facebook')}
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
              <span className="px-4 text-gray-300 text-sm font-medium">{t('auth.login.orSignInWith')}</span>
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
                <label htmlFor="email" className="block text-gray-200 text-sm font-medium mb-2">
                  {t('auth.login.emailLabel')}
                </label>
                <div className="relative">
                  <IconComponent icon={FaEnvelope} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 transition-all duration-300 ${
                      errors.email ? 'border-red-500/50' : 'border-white/20 hover:border-white/30'
                    }`}
                    placeholder={t('auth.login.emailPlaceholder')}
                  />
                </div>
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </motion.div>
              
              <motion.div className="mb-4" variants={itemVariants}>
                <label htmlFor="password" className="block text-gray-200 text-sm font-medium mb-2">
                  {t('auth.login.passwordLabel')}
                </label>
                <div className="relative">
                  <IconComponent icon={FaLock} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 transition-all duration-300 ${
                      errors.password ? 'border-red-500/50' : 'border-white/20 hover:border-white/30'
                    }`}
                    placeholder={t('auth.login.passwordPlaceholder')}
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
              
              <motion.div className="flex items-center justify-between mb-6" variants={itemVariants}>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="mr-2 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-300">{t('auth.login.rememberMe')}</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  {t('auth.login.forgotPassword')}
                </Link>
              </motion.div>
              
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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
                  t('auth.login.signInButton')
                )}
              </motion.button>
            </form>
            
            <motion.div className="text-center mt-6" variants={itemVariants}>
              <span className="text-gray-300">{t('auth.login.noAccount')} </span>
              <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                {t('auth.login.createAccount')}
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login; 