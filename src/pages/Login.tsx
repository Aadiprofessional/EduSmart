import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaGoogle, FaFacebook, FaEye, FaEyeSlash, FaRocket, FaBrain, FaGraduationCap, FaStar } from 'react-icons/fa';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex relative overflow-hidden">
      {/* Advanced Background Effects */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <motion.div 
          className="absolute w-96 h-96 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full blur-3xl" 
          style={{ top: '10%', left: '10%' }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" 
          style={{ top: '60%', left: '5%' }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div 
          className="absolute w-72 h-72 bg-gradient-to-r from-emerald-500/25 to-teal-500/25 rounded-full blur-3xl" 
          style={{ top: '30%', right: '15%' }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.25, 0.7, 0.25],
            x: [0, 30, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
        />

        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <Particle 
            key={i} 
            delay={i * 0.5} 
            size={Math.random() * 6 + 2}
            color={['bg-blue-400', 'bg-purple-400', 'bg-cyan-400', 'bg-emerald-400'][Math.floor(Math.random() * 4)]}
          />
        ))}

        {/* Geometric grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }} />

        {/* Diagonal lines */}
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 100px,
            rgba(255,255,255,0.1) 100px,
            rgba(255,255,255,0.1) 101px
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
              <span className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                EduSmart
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
              { icon: FaBrain, title: "AI-Powered Learning", desc: "Personalized study paths" },
              { icon: FaRocket, title: "Fast Progress", desc: "Accelerate your growth" },
              { icon: FaGraduationCap, title: "Expert Content", desc: "Learn from the best" },
              { icon: FaStar, title: "Premium Quality", desc: "Top-tier education" }
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
                <span className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
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
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm p-8 border-b border-white/10 relative">
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
                
                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-8 h-8 border border-blue-400/30 rounded-full animate-pulse" />
                <div className="absolute bottom-4 left-4 w-6 h-6 bg-purple-400/20 rounded-full animate-bounce" />
              </div>
              
              <div className="p-8">
                {/* Social login buttons */}
                <motion.div 
                  className="grid grid-cols-2 gap-4 mb-6"
                  variants={itemVariants}
                >
                  <motion.button
                    onClick={() => handleSocialLogin('Google')}
                    className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-3 rounded-xl hover:bg-white/20 transition-all duration-300 relative overflow-hidden group"
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ y: 0, scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <IconComponent icon={FaGoogle} className="text-red-400 relative z-10" />
                    <span className="font-medium relative z-10">Google</span>
                  </motion.button>
                  <motion.button
                    onClick={() => handleSocialLogin('Facebook')}
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
                    <div className="relative group">
                      <IconComponent icon={FaEnvelope} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 transition-all duration-300 ${
                          errors.email ? 'border-red-500/50' : 'border-white/20 hover:border-white/30 focus:border-blue-500/50'
                        }`}
                        placeholder={t('auth.login.emailPlaceholder')}
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                    {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                  </motion.div>
                  
                  <motion.div className="mb-4" variants={itemVariants}>
                    <label htmlFor="password" className="block text-gray-200 text-sm font-medium mb-2">
                      {t('auth.login.passwordLabel')}
                    </label>
                    <div className="relative group">
                      <IconComponent icon={FaLock} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 transition-all duration-300 ${
                          errors.password ? 'border-red-500/50' : 'border-white/20 hover:border-white/30 focus:border-blue-500/50'
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
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                    {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
                  </motion.div>
                  
                  <motion.div className="flex items-center justify-between mb-6" variants={itemVariants}>
                    <label className="flex items-center group cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="mr-2 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{t('auth.login.rememberMe')}</span>
                    </label>
                    <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition-colors relative group">
                      {t('auth.login.forgotPassword')}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
                    </Link>
                  </motion.div>
                  
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl relative overflow-hidden group"
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                        t('auth.login.signInButton')
                      )}
                    </div>
                  </motion.button>
                </form>
                
                <motion.div className="text-center mt-6" variants={itemVariants}>
                  <span className="text-gray-300">{t('auth.login.noAccount')} </span>
                  <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors relative group">
                    {t('auth.login.createAccount')}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
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

export default Login; 