import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaGoogle, FaFacebook, FaEye, FaEyeSlash, FaRocket, FaBrain, FaGraduationCap, FaStar, FaUsers, FaTrophy, FaBook, FaLightbulb } from 'react-icons/fa';
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
      setAuthError(`${provider} ${t('auth.login.socialLoginError')}`);
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
  const Particle = ({ delay = 0, size = 4, color = "bg-blue-400" }) => (
    <motion.div
      className={`absolute ${color} rounded-full opacity-20`}
      style={{ width: size, height: size }}
      animate={{
        x: [0, 100, -50, 0],
        y: [0, -100, 50, 0],
        opacity: [0.2, 0.8, 0.2],
      }}
      transition={{
        duration: 8 + Math.random() * 4,
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
          <linearGradient id="flowGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="flowGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0,100 Q200,50 400,100 T800,100 Q1000,50 1200,100"
          stroke="url(#flowGradient1)"
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
          stroke="url(#flowGradient2)"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex relative overflow-hidden">
      {/* Advanced Background Effects */}
      <div className="absolute inset-0">
        {/* Enhanced Interactive Animated gradient orbs */}
        <InteractiveOrb 
          size="w-96 h-96" 
          color="bg-gradient-to-r from-cyan-500/30 to-blue-500/30" 
          position={{ top: '10%', left: '10%' }}
          animationDelay={0}
        />
        <InteractiveOrb 
          size="w-80 h-80" 
          color="bg-gradient-to-r from-purple-500/20 to-pink-500/20" 
          position={{ top: '60%', left: '5%' }}
          animationDelay={2}
        />
        <InteractiveOrb 
          size="w-72 h-72" 
          color="bg-gradient-to-r from-emerald-500/25 to-teal-500/25" 
          position={{ top: '30%', right: '15%' }}
          animationDelay={4}
        />

        {/* Additional Desktop-only Orbs */}
        <div className="hidden lg:block">
          <InteractiveOrb 
            size="w-64 h-64" 
            color="bg-gradient-to-r from-yellow-500/15 to-orange-500/15" 
            position={{ bottom: '20%', right: '25%' }}
            animationDelay={6}
          />
          <InteractiveOrb 
            size="w-56 h-56" 
            color="bg-gradient-to-r from-indigo-500/20 to-purple-500/20" 
            position={{ top: '70%', right: '5%' }}
            animationDelay={8}
          />
        </div>

        {/* Flowing Lines Animation */}
        <FlowingLines />

        {/* Enhanced floating particles with more variety */}
        {Array.from({ length: 25 }).map((_, i) => (
          <Particle 
            key={i} 
            delay={i * 0.4} 
            size={Math.random() * 8 + 2}
            color={['bg-blue-400', 'bg-purple-400', 'bg-cyan-400', 'bg-emerald-400', 'bg-pink-400', 'bg-yellow-400'][Math.floor(Math.random() * 6)]}
          />
        ))}

        {/* Enhanced geometric grid pattern with animation */}
        <motion.div 
          className="absolute inset-0 opacity-[0.03]" 
          animate={{
            backgroundPosition: ['0px 0px', '80px 80px'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
          }} 
        />

        {/* Animated diagonal lines */}
        <motion.div 
          className="absolute inset-0 opacity-[0.05]" 
          animate={{
            backgroundPosition: ['0px 0px', '200px 200px'],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 100px,
            rgba(255,255,255,0.1) 100px,
            rgba(255,255,255,0.1) 101px
          )`
          }} 
        />

        {/* Desktop-only Advanced Geometric Patterns */}
        <div className="hidden lg:block">
          <motion.div
            className="absolute top-20 right-20 w-32 h-32 border border-cyan-400/20 rounded-full"
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1],
              borderColor: ['rgba(6, 182, 212, 0.2)', 'rgba(6, 182, 212, 0.5)', 'rgba(6, 182, 212, 0.2)']
            }}
            transition={{ 
              rotate: { duration: 30, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              borderColor: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
          />
          <motion.div
            className="absolute bottom-32 left-20 w-24 h-24 border-2 border-purple-400/30"
            animate={{ 
              rotate: -360,
              borderRadius: ['0%', '50%', '0%'],
              borderColor: ['rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0.6)', 'rgba(139, 92, 246, 0.3)']
            }}
            transition={{ 
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              borderRadius: { duration: 5, repeat: Infinity, ease: "easeInOut" },
              borderColor: { duration: 4, repeat: Infinity, ease: "easeInOut" }
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
              <span className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                MatrixEdu
              </span>
            </motion.div>
            <motion.p 
              className="text-xl text-gray-300 mb-8 max-w-md"
              variants={itemVariants}
            >
              Unlock your potential with AI-powered learning experiences
            </motion.p>
          </motion.div>

          {/* Feature highlights */}
          <motion.div 
            className="space-y-6 max-w-md"
            variants={itemVariants}
          >
            {[
              { icon: FaBrain, title: t('auth.login.features.aiPoweredLearning.title'), desc: t('auth.login.features.aiPoweredLearning.description') },
              { icon: FaRocket, title: t('auth.login.features.fastProgress.title'), desc: t('auth.login.features.fastProgress.description') },
              { icon: FaGraduationCap, title: t('auth.login.features.expertContent.title'), desc: t('auth.login.features.expertContent.description') },
              { icon: FaStar, title: t('auth.login.features.premiumQuality.title'), desc: t('auth.login.features.premiumQuality.description') }
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
                <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
                  <IconComponent icon={feature.icon} className="text-2xl text-blue-400" />
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
            className="absolute top-20 right-20 w-20 h-20 border-2 border-blue-400/30 rounded-full animate-pulse"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute bottom-32 left-16 w-16 h-16 border-2 border-purple-400/30 rounded-lg"
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute top-1/2 left-8 w-12 h-12 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-sm"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.6, 0.2]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Right Side - Login Form */}
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
                <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  MatrixEdu
                </span>
              </Link>
              {/* Mobile tagline */}
              <motion.p 
                className="text-blue-200 text-sm mt-2 max-w-xs mx-auto"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                Your AI-powered learning companion
              </motion.p>
            </motion.div>

            {/* Mobile Features Preview (Above Form) */}
            <motion.div 
              className="lg:hidden mb-6 grid grid-cols-2 gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {[
                { icon: FaUsers, text: t('auth.login.mobileFeatures.students'), color: "text-blue-400" },
                { icon: FaTrophy, text: t('auth.login.mobileFeatures.topRated'), color: "text-yellow-400" },
                { icon: FaBook, text: t('auth.login.mobileFeatures.courses'), color: "text-emerald-400" },
                { icon: FaLightbulb, text: t('auth.login.mobileFeatures.aiTutoring'), color: "text-purple-400" }
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

            {/* Login Form - Desktop version without magnetic effect */}
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
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm p-4 sm:p-6 lg:p-8 border-b border-white/10 relative">
                <motion.h1 
                  className="text-xl sm:text-2xl lg:text-3xl font-bold text-white text-center"
                  variants={itemVariants}
                >
                  {t('auth.login.welcomeBackToMatrixEdu')}
                </motion.h1>
                <motion.p 
                  className="text-blue-200 text-center mt-1 sm:mt-2 text-sm sm:text-base"
                  variants={itemVariants}
                >
                  {t('auth.login.continueJourney')}
                </motion.p>
                
                {/* Decorative elements */}
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 border border-blue-400/30 rounded-full animate-pulse" />
                <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 w-4 h-4 sm:w-6 sm:h-6 bg-purple-400/20 rounded-full animate-bounce" />
              </div>
              
              <div className="p-4 sm:p-6 lg:p-8">
                {/* Social login buttons */}
                <motion.div 
                  className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6"
                  variants={itemVariants}
                >
                  <motion.button
                    onClick={() => handleSocialLogin('Google')}
                    className="flex items-center justify-center gap-1 sm:gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:bg-white/20 transition-all duration-300 relative overflow-hidden group text-sm sm:text-base"
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ y: 0, scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <IconComponent icon={FaGoogle} className="text-red-400 relative z-10 text-sm sm:text-base" />
                    <span className="font-medium relative z-10">Google</span>
                  </motion.button>
                  <motion.button
                    onClick={() => handleSocialLogin('Facebook')}
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
                  <span className="px-3 sm:px-4 text-gray-300 text-xs sm:text-sm font-medium">{t('auth.login.orSignInWith')}</span>
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
                    <label htmlFor="email" className="block text-gray-200 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                      {t('auth.login.emailLabel')}
                    </label>
                    <div className="relative group">
                      <IconComponent icon={FaEnvelope} className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors text-sm" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white/10 backdrop-blur-sm border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 transition-all duration-300 text-sm sm:text-base ${
                          errors.email ? 'border-red-500/50' : 'border-white/20 hover:border-white/30 focus:border-blue-500/50'
                        }`}
                        placeholder={t('auth.login.emailPlaceholder')}
                      />
                      <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                  </motion.div>
                  
                  <motion.div className="mb-3 sm:mb-4" variants={itemVariants}>
                    <label htmlFor="password" className="block text-gray-200 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                      {t('auth.login.passwordLabel')}
                    </label>
                    <div className="relative group">
                      <IconComponent icon={FaLock} className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors text-sm" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full pl-9 sm:pl-12 pr-9 sm:pr-12 py-2.5 sm:py-3 bg-white/10 backdrop-blur-sm border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 transition-all duration-300 text-sm sm:text-base ${
                          errors.password ? 'border-red-500/50' : 'border-white/20 hover:border-white/30 focus:border-blue-500/50'
                        }`}
                        placeholder={t('auth.login.passwordPlaceholder')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                      >
                        <IconComponent icon={showPassword ? FaEyeSlash : FaEye} className="text-sm" />
                      </button>
                      <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                    {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                  </motion.div>
                  
                  <motion.div className="flex items-center justify-between mb-4 sm:mb-6" variants={itemVariants}>
                    <label className="flex items-center group cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="mr-2 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-xs sm:text-sm text-gray-300 group-hover:text-white transition-colors">{t('auth.login.rememberMe')}</span>
                    </label>
                    <Link to="/forgot-password" className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 transition-colors relative group">
                      {t('auth.login.forgotPassword')}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
                    </Link>
                  </motion.div>
                  
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl relative overflow-hidden group text-sm sm:text-base"
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <motion.div
                            className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          {t('common.loading')}
                        </div>
                      ) : (
                        t('auth.login.signInButton')
                      )}
                    </div>
                  </motion.button>
                </form>
                
                <motion.div className="text-center mt-4 sm:mt-6" variants={itemVariants}>
                  <span className="text-gray-300 text-xs sm:text-sm">{t('auth.login.noAccount')} </span>
                  <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors relative group text-xs sm:text-sm">
                    {t('auth.login.signUpLink')}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
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
                  <span className="text-xs">{t('auth.login.trustIndicators.secure')}</span>
                </div>
                <div className="w-px h-4 bg-gray-600"></div>
                <div className="flex items-center space-x-1">
                  <IconComponent icon={FaUsers} className="text-xs text-blue-400" />
                  <span className="text-xs">{t('auth.login.trustIndicators.users')}</span>
                </div>
                <div className="w-px h-4 bg-gray-600"></div>
                <div className="flex items-center space-x-1">
                  <IconComponent icon={FaTrophy} className="text-xs text-yellow-400" />
                  <span className="text-xs">{t('auth.login.trustIndicators.topRated')}</span>
                </div>
              </motion.div>

              {/* Quick benefits */}
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                <p className="text-gray-400 text-xs mb-2">{t('auth.login.joinMatrixEduAndGet')}</p>
                <div className="flex justify-center space-x-4 text-xs">
                  <span className="text-blue-300">{t('auth.login.benefits.aiTutoring')}</span>
                  <span className="text-purple-300">{t('auth.login.benefits.progressTracking')}</span>
                  <span className="text-emerald-300">{t('auth.login.benefits.expertContent')}</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login; 