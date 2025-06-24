import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUserAlt, FaGoogle, FaFacebook, FaEye, FaEyeSlash, FaRocket, FaBrain, FaGraduationCap, FaStar, FaShieldAlt, FaUsers, FaCertificate, FaClock, FaGlobe, FaChartLine } from 'react-icons/fa';
import IconComponent from '../components/ui/IconComponent';
import { useAuth } from '../utils/AuthContext';
import { useLanguage } from '../utils/LanguageContext';
import { motion } from 'framer-motion';
import { useNotification } from '../utils/NotificationContext';

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
  const { showSuccess } = useNotification();

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
          showSuccess(t('auth.signup.accountCreated'));
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
      setAuthError(`${provider} ${t('auth.signup.socialSignupError')}`);
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

  // Flowing Lines Animation Component
  const FlowingLines = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="flowGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="flowGradient4" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0" />
            <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0,100 Q200,50 400,100 T800,100 Q1000,50 1200,100"
          stroke="url(#flowGradient3)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 1 }
          }}
        />
        <motion.path
          d="M0,300 Q300,200 600,300 T1200,300"
          stroke="url(#flowGradient4)"
          strokeWidth="1.5"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 },
            opacity: { duration: 1, delay: 0.5 }
          }}
        />
      </svg>
    </div>
  );

  // Enhanced Background Orbs with Interaction
  const InteractiveOrb = ({ 
    size, 
    color, 
    position, 
    animationDelay = 0 
  }: { 
    size: string, 
    color: string, 
    position: { top?: string, bottom?: string, left?: string, right?: string },
    animationDelay?: number 
  }) => (
    <motion.div
      className={`absolute ${size} ${color} rounded-full blur-3xl`}
      style={position}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.3, 0.7, 0.3],
        x: [0, 30, -20, 0],
        y: [0, -20, 30, 0],
      }}
      transition={{
        duration: 12 + Math.random() * 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay: animationDelay
      }}
      whileHover={{
        scale: 1.5,
        opacity: 0.8,
        transition: { duration: 0.3 }
      }}
    />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 flex relative overflow-hidden">
      {/* Advanced Background Effects */}
      <div className="absolute inset-0">
        {/* Enhanced Interactive Animated gradient orbs */}
        <InteractiveOrb 
          size="w-96 h-96" 
          color="bg-gradient-to-r from-emerald-500/30 to-teal-500/30" 
          position={{ top: '15%', left: '5%' }}
          animationDelay={0}
        />
        <InteractiveOrb 
          size="w-80 h-80" 
          color="bg-gradient-to-r from-blue-500/25 to-cyan-500/25" 
          position={{ top: '50%', left: '10%' }}
          animationDelay={3}
        />
        <InteractiveOrb 
          size="w-72 h-72" 
          color="bg-gradient-to-r from-purple-500/20 to-pink-500/20" 
          position={{ top: '25%', right: '10%' }}
          animationDelay={6}
        />

        {/* Additional Desktop-only Orbs */}
        <div className="hidden lg:block">
          <InteractiveOrb 
            size="w-64 h-64" 
            color="bg-gradient-to-r from-cyan-500/15 to-blue-500/15" 
            position={{ bottom: '15%', right: '20%' }}
            animationDelay={2}
          />
          <InteractiveOrb 
            size="w-56 h-56" 
            color="bg-gradient-to-r from-teal-500/20 to-emerald-500/20" 
            position={{ top: '65%', right: '8%' }}
            animationDelay={4}
          />
        </div>

        {/* Flowing Lines Animation */}
        <FlowingLines />

        {/* Enhanced floating particles with more variety */}
        {Array.from({ length: 30 }).map((_, i) => (
          <Particle 
            key={i} 
            delay={i * 0.3} 
            size={Math.random() * 10 + 3}
            color={['bg-emerald-400', 'bg-teal-400', 'bg-cyan-400', 'bg-blue-400', 'bg-purple-400', 'bg-pink-400'][Math.floor(Math.random() * 6)]}
          />
        ))}

        {/* Enhanced geometric patterns with animation */}
        <motion.div 
          className="absolute inset-0 opacity-[0.04]" 
          animate={{ 
            backgroundPosition: ['0px 0px', '100px 100px'],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px'
          }} 
        />

        {/* Animated hexagonal pattern */}
        <motion.div 
          className="absolute inset-0 opacity-[0.02]" 
          animate={{
            backgroundPosition: ['0px 0px', '150px 150px'],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            backgroundImage: `repeating-linear-gradient(
              30deg,
              transparent,
              transparent 50px,
              rgba(255,255,255,0.1) 50px,
              rgba(255,255,255,0.1) 51px
            )`
          }} 
        />

        {/* Desktop-only Advanced Geometric Patterns */}
        <div className="hidden lg:block">
          <motion.div
            className="absolute top-16 right-16 w-24 h-24 border border-emerald-400/30 rounded-full"
            animate={{ 
              rotate: 360,
              scale: [1, 1.3, 1],
              borderColor: ['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.6)', 'rgba(16, 185, 129, 0.3)']
            }}
            transition={{ 
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
              borderColor: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
          />
          <motion.div
            className="absolute bottom-28 left-12 w-18 h-18 border-2 border-teal-400/30"
            animate={{ 
              rotate: -360,
              borderRadius: ['0%', '50%', '0%'],
              borderColor: ['rgba(20, 184, 166, 0.3)', 'rgba(20, 184, 166, 0.6)', 'rgba(20, 184, 166, 0.3)']
            }}
            transition={{ 
              rotate: { duration: 30, repeat: Infinity, ease: "linear" },
              borderRadius: { duration: 6, repeat: Infinity, ease: "easeInOut" },
              borderColor: { duration: 5, repeat: Infinity, ease: "easeInOut" }
            }}
          />
        </div>
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
                MatrixEdu
              </span>
            </motion.div>
            <motion.p 
              className="text-xl text-gray-300 mb-8 max-w-md"
              variants={itemVariants}
            >
              {t('auth.signup.joinThousandsLearners')}
            </motion.p>
          </motion.div>

          {/* Feature highlights */}
          <motion.div 
            className="space-y-6 max-w-md"
            variants={itemVariants}
          >
            {[
              { icon: FaUsers, title: t('auth.signup.features.joinStudents.title'), desc: t('auth.signup.features.joinStudents.description') },
              { icon: FaShieldAlt, title: t('auth.signup.features.securePrivate.title'), desc: t('auth.signup.features.securePrivate.description') },
              { icon: FaBrain, title: t('auth.signup.features.aiPoweredPaths.title'), desc: t('auth.signup.features.aiPoweredPaths.description') },
              { icon: FaRocket, title: t('auth.signup.features.fastTrackSuccess.title'), desc: t('auth.signup.features.fastTrackSuccess.description') }
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
        <div className="w-full lg:w-1/2 flex items-center justify-center p-3 sm:p-6 lg:p-12">
          <motion.div 
            className="w-full max-w-sm sm:max-w-md"
            variants={itemVariants}
          >
            {/* Mobile Logo */}
            <motion.div 
              className="text-center mb-6 sm:mb-8 lg:hidden"
              variants={itemVariants}
            >
              <Link to="/" className="inline-block">
                <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
                  MatrixEdu
                </span>
              </Link>
              {/* Mobile tagline */}
              <motion.p 
                className="text-emerald-200 text-sm mt-2 max-w-xs mx-auto"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {t('auth.signup.transformFuture')}
              </motion.p>
            </motion.div>

            {/* Mobile Benefits Preview (Above Form) */}
            <motion.div 
              className="lg:hidden mb-6 grid grid-cols-2 gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {[
                { icon: FaCertificate, text: t('auth.signup.mobileFeatures.freeCertificate'), color: "text-emerald-400" },
                { icon: FaClock, text: t('auth.signup.mobileFeatures.lifetimeAccess'), color: "text-blue-400" },
                { icon: FaGlobe, text: t('auth.signup.mobileFeatures.globalCommunity'), color: "text-purple-400" },
                { icon: FaChartLine, text: t('auth.signup.mobileFeatures.trackProgress'), color: "text-yellow-400" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-lg p-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <IconComponent icon={item.icon} className={`text-sm ${item.color}`} />
                  <span className="text-white text-xs font-medium">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Signup Form - Without magnetic effect */}
            <motion.div 
              className="bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl overflow-hidden relative"
              variants={itemVariants}
              whileHover={{ 
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                borderColor: "rgba(255,255,255,0.3)"
              }}
            >
              {/* Holographic effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
              
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 backdrop-blur-sm p-4 sm:p-6 lg:p-8 border-b border-white/10 relative">
                <motion.h1 
                  className="text-xl sm:text-2xl lg:text-3xl font-bold text-white text-center"
                  variants={itemVariants}
                >
                  {t('auth.signup.joinMatrixEduToday')}
                </motion.h1>
                <motion.p 
                  className="text-emerald-200 text-center mt-1 sm:mt-2 text-sm sm:text-base"
                  variants={itemVariants}
                >
                  {t('auth.signup.startAiJourney')}
                </motion.p>
                
                {/* Decorative elements */}
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 border border-emerald-400/30 rounded-full animate-pulse" />
                <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 w-4 h-4 sm:w-6 sm:h-6 bg-teal-400/20 rounded-full animate-bounce" />
              </div>
              
              <div className="p-4 sm:p-6 lg:p-8">
                {/* Social signup buttons */}
                <motion.div 
                  className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6"
                  variants={itemVariants}
                >
                  <motion.button
                    onClick={() => handleSocialSignup('Google')}
                    className="flex items-center justify-center gap-1 sm:gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:bg-white/20 transition-all duration-300 relative overflow-hidden group text-sm sm:text-base"
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ y: 0, scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <IconComponent icon={FaGoogle} className="text-red-400 relative z-10 text-sm sm:text-base" />
                    <span className="font-medium relative z-10">Google</span>
                  </motion.button>
                  <motion.button
                    onClick={() => handleSocialSignup('Facebook')}
                    className="flex items-center justify-center gap-1 sm:gap-2 bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 text-white px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:bg-blue-600/30 transition-all duration-300 relative overflow-hidden group text-sm sm:text-base"
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ y: 0, scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <IconComponent icon={FaFacebook} className="text-blue-400 relative z-10 text-sm sm:text-base" />
                    <span className="font-medium relative z-10">Facebook</span>
                  </motion.button>
                </motion.div>
                
                <motion.div 
                  className="flex items-center justify-center mb-4 sm:mb-6"
                  variants={itemVariants}
                >
                  <div className="border-t border-white/20 flex-grow"></div>
                  <span className="px-3 sm:px-4 text-gray-300 text-xs sm:text-sm font-medium">{t('auth.signup.orSignUpWith')}</span>
                  <div className="border-t border-white/20 flex-grow"></div>
                </motion.div>

                {/* Auth error display */}
                {authError && (
                  <motion.div 
                    className="bg-red-500/10 border border-red-500/30 text-red-300 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl mb-3 sm:mb-4 backdrop-blur-sm text-sm"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {authError}
                  </motion.div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <motion.div className="mb-3 sm:mb-4" variants={itemVariants}>
                    <label htmlFor="name" className="block text-gray-200 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                      {t('auth.signup.nameLabel')}
                    </label>
                    <div className="relative group">
                      <IconComponent icon={FaUserAlt} className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-400 transition-colors text-sm" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white/10 backdrop-blur-sm border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-400 transition-all duration-300 text-sm sm:text-base ${
                          errors.name ? 'border-red-500/50' : 'border-white/20 hover:border-white/30 focus:border-emerald-500/50'
                        }`}
                        placeholder={t('auth.signup.namePlaceholder')}
                      />
                      <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                  </motion.div>

                  <motion.div className="mb-3 sm:mb-4" variants={itemVariants}>
                    <label htmlFor="email" className="block text-gray-200 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                      {t('auth.signup.emailLabel')}
                    </label>
                    <div className="relative group">
                      <IconComponent icon={FaEnvelope} className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-400 transition-colors text-sm" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white/10 backdrop-blur-sm border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-400 transition-all duration-300 text-sm sm:text-base ${
                          errors.email ? 'border-red-500/50' : 'border-white/20 hover:border-white/30 focus:border-emerald-500/50'
                        }`}
                        placeholder={t('auth.signup.emailPlaceholder')}
                      />
                      <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                  </motion.div>
                  
                  <motion.div className="mb-3 sm:mb-4" variants={itemVariants}>
                    <label htmlFor="password" className="block text-gray-200 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                      {t('auth.signup.passwordLabel')}
                    </label>
                    <div className="relative group">
                      <IconComponent icon={FaLock} className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-400 transition-colors text-sm" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full pl-9 sm:pl-12 pr-9 sm:pr-12 py-2.5 sm:py-3 bg-white/10 backdrop-blur-sm border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-400 transition-all duration-300 text-sm sm:text-base ${
                          errors.password ? 'border-red-500/50' : 'border-white/20 hover:border-white/30 focus:border-emerald-500/50'
                        }`}
                        placeholder={t('auth.signup.passwordPlaceholder')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                      >
                        <IconComponent icon={showPassword ? FaEyeSlash : FaEye} className="text-sm" />
                      </button>
                      <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                    {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                  </motion.div>

                  <motion.div className="mb-3 sm:mb-4" variants={itemVariants}>
                    <label htmlFor="confirmPassword" className="block text-gray-200 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                      {t('auth.signup.confirmPasswordLabel')}
                    </label>
                    <div className="relative group">
                      <IconComponent icon={FaLock} className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-400 transition-colors text-sm" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full pl-9 sm:pl-12 pr-9 sm:pr-12 py-2.5 sm:py-3 bg-white/10 backdrop-blur-sm border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-400 transition-all duration-300 text-sm sm:text-base ${
                          errors.confirmPassword ? 'border-red-500/50' : 'border-white/20 hover:border-white/30 focus:border-emerald-500/50'
                        }`}
                        placeholder={t('auth.signup.confirmPasswordPlaceholder')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                      >
                        <IconComponent icon={showConfirmPassword ? FaEyeSlash : FaEye} className="text-sm" />
                      </button>
                      <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                    {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                  </motion.div>
                  
                  <motion.div className="mb-4 sm:mb-6" variants={itemVariants}>
                    <label className="flex items-start group cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        className="mr-2 sm:mr-3 mt-1 text-emerald-500 bg-white/10 border-white/20 rounded focus:ring-emerald-500 focus:ring-2"
                      />
                      <span className="text-xs sm:text-sm text-gray-300 group-hover:text-white transition-colors">
                        {t('auth.signup.agreeToThe')}{' '}
                        <Link to="/terms" className="text-emerald-400 hover:text-emerald-300 transition-colors relative group">
                          {t('auth.signup.termsAndConditions')}
                          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all duration-300"></span>
                        </Link>
                        {' '}{t('auth.signup.and')}{' '}
                        <Link to="/privacy" className="text-emerald-400 hover:text-emerald-300 transition-colors relative group">
                          {t('auth.signup.privacyPolicy')}
                          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all duration-300"></span>
                        </Link>
                      </span>
                    </label>
                    {errors.terms && <p className="text-red-400 text-xs mt-1">{errors.terms}</p>}
                  </motion.div>
                  
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl relative overflow-hidden group text-sm sm:text-base"
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <motion.div
                            className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          {t('auth.signup.creatingAccount')}
                        </div>
                      ) : (
                        t('auth.signup.signUpButton')
                      )}
                    </div>
                  </motion.button>
                </form>
                
                <motion.div className="text-center mt-4 sm:mt-6" variants={itemVariants}>
                  <span className="text-gray-300 text-xs sm:text-sm">{t('auth.signup.haveAccount')} </span>
                  <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors relative group text-xs sm:text-sm">
                    {t('auth.signup.signInLink')}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* Mobile Bottom Elements */}
            <div className="lg:hidden mt-6 space-y-4">
              {/* Trust indicators */}
              <motion.div 
                className="flex justify-center items-center space-x-4 text-gray-400"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs">{t('auth.signup.trustIndicators.sslSecure')}</span>
                </div>
                <div className="w-px h-4 bg-gray-600"></div>
                <div className="flex items-center space-x-1">
                  <IconComponent icon={FaUsers} className="text-xs text-emerald-400" />
                  <span className="text-xs">{t('auth.signup.trustIndicators.members')}</span>
                </div>
                <div className="w-px h-4 bg-gray-600"></div>
                <div className="flex items-center space-x-1">
                  <IconComponent icon={FaCertificate} className="text-xs text-yellow-400" />
                  <span className="text-xs">{t('auth.signup.trustIndicators.certified')}</span>
                </div>
              </motion.div>

              {/* Join benefits */}
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                <p className="text-gray-400 text-xs mb-2">{t('auth.signup.joinBenefits.title')}</p>
                <div className="flex justify-center space-x-4 text-xs">
                  <span className="text-emerald-300">{t('auth.signup.joinBenefits.freeCourses')}</span>
                  <span className="text-blue-300">{t('auth.signup.joinBenefits.aiMentoring')}</span>
                  <span className="text-purple-300">{t('auth.signup.joinBenefits.certificates')}</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup; 