import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaGoogle, FaApple, FaEye, FaEyeSlash, FaRocket, FaMagic } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useAuth } from '../utils/AuthContext';
import { useLanguage } from '../utils/LanguageContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, signInWithApple } = useAuth();
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

  // Set body background color to match the page background to prevent white background on overscroll
  React.useEffect(() => {
    // Save the original background color
    const originalBackgroundColor = document.body.style.backgroundColor;
    
    // Set the body background color to match the login page
    document.body.style.backgroundColor = '#050505';
    
    // Cleanup function to restore the original background color
    return () => {
      document.body.style.backgroundColor = originalBackgroundColor;
    };
  }, []);

  // Animation for the "black hole" particles
  const particles = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
  }));

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
      setAuthError(null);
      
      // Store current location for redirect after auth
      sessionStorage.setItem('returnTo', window.location.pathname);
      
      if (provider === 'Google') {
        console.log('Initiating Google OAuth...');
        await signInWithGoogle();
        // The redirect will happen automatically through Supabase OAuth flow
      } else if (provider === 'Apple') {
        console.log('Initiating Apple OAuth...');
        await signInWithApple();
        // The redirect will happen automatically through Supabase OAuth flow
      }
    } catch (error: any) {
      console.error(`Error with ${provider} login:`, error);
      setAuthError(`${provider} ${t('auth.login.socialLoginError')}: ${error.message || 'Please try again.'}`);
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

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-purple-500 selection:text-white">
      
      {/* Particles / Stars moving into/out of the hole */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((p) => (
              <motion.div
                  key={p.id}
                  className="absolute rounded-full bg-white"
                  style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      width: p.size,
                      height: p.size,
                      opacity: Math.random() * 0.5 + 0.2,
                  }}
                  animate={{
                      y: [0, -100],
                      opacity: [0, 1, 0],
                  }}
                  transition={{
                      duration: p.duration,
                      repeat: Infinity,
                      delay: p.delay,
                      ease: "linear"
                  }}
              />
          ))}
      </div>

      {/* Black Hole / Event Horizon Effect - Background */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[400px] perspective-1000 opacity-60 pointer-events-none z-0">
          <div className="absolute left-1/2 bottom-[-100px] -translate-x-1/2 w-[600px] h-[300px] md:w-[800px] md:h-[400px]">
              {/* Glows */}
              <div className="absolute inset-0 rounded-[100%] bg-purple-600/20 blur-[80px] animate-pulse"></div>
              <div className="absolute inset-x-10 bottom-0 h-[200px] rounded-[100%] bg-indigo-500/30 blur-[60px]"></div>
              
              {/* The Ring/Horizon */}
              <div className="absolute left-1/2 bottom-[-150px] -translate-x-1/2 w-[120%] h-[300px] rounded-[50%] border-t-2 border-white/50 bg-gradient-to-b from-purple-500/10 to-transparent shadow-[0_-10px_40px_rgba(168,85,247,0.4)] box-shadow-[0_0_50px_rgba(139,92,246,0.5)]"></div>
              
              {/* Bright Edge */}
              <div className="absolute left-1/2 bottom-[-152px] -translate-x-1/2 w-[120%] h-[300px] rounded-[50%] border-t-[4px] border-purple-300 blur-[2px] opacity-70"></div>
              
              {/* Inner Darkness */}
              <div className="absolute left-1/2 bottom-[-148px] -translate-x-1/2 w-[118%] h-[296px] rounded-[50%] bg-[#050505]"></div>
          </div>
      </div>

      <motion.div 
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* Login Form */}
        <div className="w-full flex items-center justify-center">
          <motion.div 
            className="w-full max-w-sm sm:max-w-md"
            variants={itemVariants}
          >
            {/* Logo */}
            <div className="text-center mb-8">
                <Link to="/" className="inline-block group cursor-pointer">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-purple-200 backdrop-blur-md mb-6 group-hover:bg-white/10 transition-colors">
                    <FaMagic className="text-purple-400" />
                    Study smarter using AI
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 group-hover:to-white/80 transition-all">
                    MatrixEdu
                  </h1>
                </Link>
            </div>

            {/* Login Form Container */}
            <motion.div 
              className="bg-[#111] rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative"
              variants={itemVariants}
            >
              {/* Header */}
              <div className="relative flex items-center justify-center px-6 py-4 border-b border-white/5 bg-[#151515]">
                 <div className="absolute left-6 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                 </div>
                 <div className="text-xs text-gray-500 font-medium">{t('auth.login.welcomeBackToMatrixEdu')}</div>
              </div>
              
              <div className="p-6 sm:p-8">
                {/* Social login buttons */}
                <motion.div 
                  className="grid grid-cols-2 gap-3 sm:gap-4 mb-6"
                  variants={itemVariants}
                >
                  <motion.button
                    onClick={() => handleSocialLogin('Google')}
                    className="flex items-center justify-center px-4 py-2.5 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all duration-200 gap-2 text-sm font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaGoogle className="text-white" />
                    <span>Google</span>
                  </motion.button>
                  <motion.button
                    onClick={() => handleSocialLogin('Apple')}
                    className="flex items-center justify-center px-4 py-2.5 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all duration-200 gap-2 text-sm font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaApple className="text-white text-lg" />
                    <span>Apple</span>
                  </motion.button>
                </motion.div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#111] text-gray-500">{t('auth.login.orContinueWith')}</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-400 block ml-1">
                      {t('auth.login.emailLabel')}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaEnvelope className="text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`block w-full pl-10 pr-3 py-2.5 bg-white/5 border ${errors.email ? 'border-red-500/50' : 'border-white/10 group-hover:border-white/20'} rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 text-white placeholder-gray-600 focus:outline-none transition-all`}
                        placeholder="name@example.com"
                      />
                    </div>
                    {errors.email && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs mt-1 ml-1"
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-400 block ml-1">
                      {t('auth.login.passwordLabel')}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`block w-full pl-10 pr-10 py-2.5 bg-white/5 border ${errors.password ? 'border-red-500/50' : 'border-white/10 group-hover:border-white/20'} rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 text-white placeholder-gray-600 focus:outline-none transition-all`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {errors.password && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs mt-1 ml-1"
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border ${rememberMe ? 'bg-purple-600 border-purple-600' : 'border-white/20 group-hover:border-white/40'} flex items-center justify-center transition-all`}>
                        {rememberMe && <FaRocket className="text-white text-[10px]" />}
                      </div>
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                        className="hidden"
                      />
                      <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{t('auth.login.rememberMe')}</span>
                    </label>
                    <Link 
                      to="/forgot-password" 
                      className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {t('auth.login.forgotPassword')}
                    </Link>
                  </div>

                  {authError && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      {authError}
                    </motion.div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-white/10 hover:bg-white/20 border-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      t('auth.login.signInButton')
                    )}
                  </motion.button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500">
                    {t('auth.login.noAccount')}{' '}
                    <Link to="/signup" className="font-medium text-purple-400 hover:text-purple-300 transition-colors">
                      {t('auth.login.signUpLink')}
                    </Link>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;