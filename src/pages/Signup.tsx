import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUserAlt, FaGoogle, FaFacebook, FaEye, FaEyeSlash, FaRocket, FaBrain, FaGraduationCap, FaStar, FaShieldAlt, FaUsers } from 'react-icons/fa';
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
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.8,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Particle animation component
  const Particle = ({ delay = 0, size = 4, color = "bg-emerald-400" }) => (
    <motion.div
      className={`absolute ${color} rounded-full opacity-20`}
      style={{ width: size, height: size }}
      animate={{
        x: [0, 120, -60, 0],
        y: [0, -120, 60, 0],
        opacity: [0.2, 0.8, 0.2],
      }}
      transition={{
        duration: 10 + Math.random() * 4,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut"
      }}
    />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 flex relative overflow-hidden">
      {/* Advanced Background Effects */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <motion.div 
          className="absolute w-96 h-96 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 rounded-full blur-3xl" 
          style={{ top: '15%', left: '5%' }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.7, 0.3],
            x: [0, 60, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute w-80 h-80 bg-gradient-to-r from-blue-500/25 to-cyan-500/25 rounded-full blur-3xl" 
          style={{ top: '50%', left: '10%' }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.25, 0.6, 0.25],
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3
          }}
        />
        <motion.div 
          className="absolute w-72 h-72 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" 
          style={{ top: '25%', right: '10%' }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.5, 0.2],
            x: [0, 40, 0],
            y: [0, -60, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 6
          }}
        />

        {/* Floating particles */}
        {Array.from({ length: 25 }).map((_, i) => (
          <Particle 
            key={i} 
            delay={i * 0.4} 
            size={Math.random() * 8 + 3}
            color={['bg-emerald-400', 'bg-teal-400', 'bg-cyan-400', 'bg-blue-400', 'bg-purple-400'][Math.floor(Math.random() * 5)]}
          />
        ))}

        {/* Geometric patterns */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }} />

        {/* Hexagonal pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `repeating-linear-gradient(
            30deg,
            transparent,
            transparent 50px,
            rgba(255,255,255,0.1) 50px,
            rgba(255,255,255,0.1) 51px
          )`
        }} />
      </div>

      <motion.div 
        className="flex w-full relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Left Side - Branding & Info */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative">
          {/* Logo and Brand */}
          <motion.div 
            className="text-center mb-12"
            variants={itemVariants}
          >
            <motion.div
              className="inline-block mb-6"
              variants={floatingVariants}
              animate="animate"
            >
              <span className="text-6xl font-bold bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
                EduSmart
              </span>
            </motion.div>
            <motion.p 
              className="text-xl text-gray-300 mb-8 max-w-md"
              variants={itemVariants}
            >
              Join thousands of learners transforming their future with AI-powered education
            </motion.p>
          </motion.div>

          {/* Feature highlights */}
          <motion.div 
            className="space-y-6 max-w-md"
            variants={itemVariants}
          >
            {[
              { icon: FaUsers, title: "Join 50K+ Students", desc: "Learn with a global community" },
              { icon: FaShieldAlt, title: "Secure & Private", desc: "Your data is protected" },
              { icon: FaBrain, title: "AI-Powered Paths", desc: "Personalized learning journey" },
              { icon: FaRocket, title: "Fast Track Success", desc: "Accelerate your career" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-center space-x-4 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.05, 
                  backgroundColor: "rgba(255,255,255,0.1)",
                  transition: { duration: 0.2 }
                }}
              >
                <div className="p-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl">
                  <IconComponent icon={feature.icon} className="text-2xl text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Floating decorative elements */}
          <motion.div
            className="absolute top-16 right-16 w-24 h-24 border-2 border-emerald-400/30 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute bottom-28 left-12 w-18 h-18 border-2 border-teal-400/30 rounded-lg"
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute top-1/3 left-6 w-14 h-14 bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 rounded-full blur-sm"
            animate={{ 
              scale: [1, 1.6, 1],
              opacity: [0.2, 0.7, 0.2]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-1/4 right-8 w-10 h-10 bg-gradient-to-r from-teal-400/25 to-blue-400/25 rounded-full blur-sm"
            animate={{ 
              scale: [1, 1.4, 1],
              opacity: [0.25, 0.6, 0.25]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </div>

        {/* Right Side - Signup Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <motion.div 
            className="w-full max-w-md"
            variants={itemVariants}
          >
            {/* Mobile Logo */}
            <motion.div 
              className="text-center mb-8 lg:hidden"
              variants={itemVariants}
            >
              <Link to="/" className="inline-block">
                <span className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
                  EduSmart
                </span>
              </Link>
            </motion.div>

            <motion.div 
              className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden relative"
              variants={itemVariants}
              whileHover={{ 
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                borderColor: "rgba(255,255,255,0.3)"
              }}
            >
              {/* Holographic effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
              
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 backdrop-blur-sm p-8 border-b border-white/10 relative">
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
                
                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-8 h-8 border border-emerald-400/30 rounded-full animate-pulse" />
                <div className="absolute bottom-4 left-4 w-6 h-6 bg-teal-400/20 rounded-full animate-bounce" />
              </div>
              
              <div className="p-8">
                {/* Social signup buttons */}
                <motion.div 
                  className="grid grid-cols-2 gap-4 mb-6"
                  variants={itemVariants}
                >
                  <motion.button
                    onClick={() => handleSocialSignup('Google')}
                    className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-3 rounded-xl hover:bg-white/20 transition-all duration-300 relative overflow-hidden group"
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ y: 0, scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <IconComponent icon={FaGoogle} className="text-red-400 relative z-10" />
                    <span className="font-medium relative z-10">Google</span>
                  </motion.button>
                  <motion.button
                    onClick={() => handleSocialSignup('Facebook')}
                    className="flex items-center justify-center gap-2 bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 text-white px-4 py-3 rounded-xl hover:bg-blue-600/30 transition-all duration-300 relative overflow-hidden group"
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ y: 0, scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <IconComponent icon={FaFacebook} className="text-blue-400 relative z-10" />
                    <span className="font-medium relative z-10">Facebook</span>
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
                    <div className="relative group">
                      <IconComponent icon={FaUserAlt} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-400 transition-colors" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-400 transition-all duration-300 ${
                          errors.name ? 'border-red-500/50' : 'border-white/20 hover:border-white/30 focus:border-emerald-500/50'
                        }`}
                        placeholder={t('auth.signup.namePlaceholder')}
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                    {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                  </motion.div>

                  <motion.div className="mb-4" variants={itemVariants}>
                    <label htmlFor="email" className="block text-gray-200 text-sm font-medium mb-2">
                      {t('auth.signup.emailLabel')}
                    </label>
                    <div className="relative group">
                      <IconComponent icon={FaEnvelope} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-400 transition-colors" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-400 transition-all duration-300 ${
                          errors.email ? 'border-red-500/50' : 'border-white/20 hover:border-white/30 focus:border-emerald-500/50'
                        }`}
                        placeholder={t('auth.signup.emailPlaceholder')}
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                    {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                  </motion.div>
                  
                  <motion.div className="mb-4" variants={itemVariants}>
                    <label htmlFor="password" className="block text-gray-200 text-sm font-medium mb-2">
                      {t('auth.signup.passwordLabel')}
                    </label>
                    <div className="relative group">
                      <IconComponent icon={FaLock} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-400 transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-400 transition-all duration-300 ${
                          errors.password ? 'border-red-500/50' : 'border-white/20 hover:border-white/30 focus:border-emerald-500/50'
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
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                    {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
                  </motion.div>

                  <motion.div className="mb-4" variants={itemVariants}>
                    <label htmlFor="confirmPassword" className="block text-gray-200 text-sm font-medium mb-2">
                      {t('auth.signup.confirmPasswordLabel')}
                    </label>
                    <div className="relative group">
                      <IconComponent icon={FaLock} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-400 transition-colors" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-400 transition-all duration-300 ${
                          errors.confirmPassword ? 'border-red-500/50' : 'border-white/20 hover:border-white/30 focus:border-emerald-500/50'
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
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                    {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
                  </motion.div>
                  
                  <motion.div className="mb-6" variants={itemVariants}>
                    <label className="flex items-start group cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        className="mr-3 mt-1 text-emerald-500 bg-white/10 border-white/20 rounded focus:ring-emerald-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                        {t('auth.signup.agreeToTerms')} {' '}
                        <Link to="/terms" className="text-emerald-400 hover:text-emerald-300 transition-colors relative group">
                          {t('auth.signup.termsAndConditions')}
                          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all duration-300"></span>
                        </Link>
                        {' '} and {' '}
                        <Link to="/privacy" className="text-emerald-400 hover:text-emerald-300 transition-colors relative group">
                          {t('auth.signup.privacyPolicy')}
                          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all duration-300"></span>
                        </Link>
                      </span>
                    </label>
                    {errors.terms && <p className="text-red-400 text-sm mt-1">{errors.terms}</p>}
                  </motion.div>
                  
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl relative overflow-hidden group"
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
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
                    </div>
                  </motion.button>
                </form>
                
                <motion.div className="text-center mt-6" variants={itemVariants}>
                  <span className="text-gray-300">{t('auth.signup.haveAccount')} </span>
                  <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors relative group">
                    {t('auth.signup.signIn')}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup; 