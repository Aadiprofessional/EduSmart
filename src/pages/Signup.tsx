import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUserAlt, FaGoogle, FaApple, FaEye, FaEyeSlash, FaMagic } from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';
import { useLanguage } from '../utils/LanguageContext';
import { motion } from 'framer-motion';
import LogoWithText from '../components/ui/LogoWithText';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, signInWithApple } = useAuth();
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

  // Particle animation configuration
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
          navigate('/login', {
            state: {
              email: formData.email,
              password: formData.password,
              requireEmailConfirmation: true
            }
          });
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
      setAuthError(null);
      
      // Store current page in session storage for redirect after auth
      sessionStorage.setItem('returnTo', '/');
      
      if (provider === 'Google') {
        await signInWithGoogle();
        // OAuth flow initiated, user will be redirected to Google
        console.log('Google OAuth flow initiated from signup');
      } else if (provider === 'Apple') {
        await signInWithApple();
        // OAuth flow initiated, user will be redirected to Apple
        console.log('Apple OAuth flow initiated from signup');
      }
    } catch (error: any) {
      console.error(`Error with ${provider} signup:`, error);
      setAuthError(`Failed to sign up with ${provider}. Please try again.`);
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
      
      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
            animate={{
              y: [0, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "linear",
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
                  <div className="flex justify-center">
                    <LogoWithText
                      size={40}
                      maxTextWidth={200}
                      titleClassName="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 group-hover:to-white/80 transition-all leading-tight"
                      subtitleClassName="text-[11px] text-gray-400 truncate"
                    />
                  </div>
                </Link>
            </div>

            {/* Signup Form Container */}
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
                 <div className="text-xs text-gray-500 font-medium">{t('auth.signup.title')}</div>
              </div>

              <div className="p-6 sm:p-8">
                {authError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center"
                    >
                      {authError}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name Input */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-400 block ml-1">
                      {t('auth.signup.nameLabel')}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUserAlt className="text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`block w-full pl-10 pr-3 py-2.5 bg-white/5 border ${errors.name ? 'border-red-500/50' : 'border-white/10 group-hover:border-white/20'} rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 text-white placeholder-gray-600 focus:outline-none transition-all`}
                        placeholder={t('auth.signup.namePlaceholder')}
                      />
                    </div>
                    {errors.name && <p className="mt-1 text-xs text-red-400 pl-1">{errors.name}</p>}
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-400 block ml-1">
                      {t('auth.signup.emailLabel')}
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
                        placeholder={t('auth.signup.emailPlaceholder')}
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-red-400 pl-1">{errors.email}</p>}
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-400 block ml-1">
                      {t('auth.signup.passwordLabel')}
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
                        placeholder={t('auth.signup.passwordPlaceholder')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-400 pl-1">{errors.password}</p>}
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-400 block ml-1">
                      {t('auth.signup.confirmPasswordLabel')}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`block w-full pl-10 pr-10 py-2.5 bg-white/5 border ${errors.confirmPassword ? 'border-red-500/50' : 'border-white/10 group-hover:border-white/20'} rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 text-white placeholder-gray-600 focus:outline-none transition-all`}
                        placeholder={t('auth.signup.confirmPasswordPlaceholder')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-xs text-red-400 pl-1">{errors.confirmPassword}</p>}
                  </div>

                  {/* Terms Checkbox */}
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="terms"
                        name="terms"
                        type="checkbox"
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="terms" className="text-gray-400">
                        {t('auth.signup.agreeToThe')}{' '}
                        <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">{t('auth.signup.termsAndConditions')}</a>
                        {' '}{t('auth.signup.and')}{' '}
                        <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">{t('auth.signup.privacyPolicy')}</a>
                      </label>
                      {errors.terms && <p className="mt-1 text-xs text-red-400">{errors.terms}</p>}
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 relative overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{t('auth.signup.creatingAccount')}</span>
                      </div>
                    ) : (
                      <span>{t('auth.signup.signUpButton')}</span>
                    )}
                  </motion.button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#111] text-gray-500">{t('auth.signup.orSignUpWith')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                  <motion.button
                    onClick={() => handleSocialSignup('Google')}
                    className="flex items-center justify-center px-4 py-2.5 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all duration-200 gap-2 text-sm font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaGoogle className="text-white" />
                    <span>Google</span>
                  </motion.button>
                  <motion.button
                    onClick={() => handleSocialSignup('Apple')}
                    className="flex items-center justify-center px-4 py-2.5 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all duration-200 gap-2 text-sm font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaApple className="text-white text-lg" />
                    <span>Apple</span>
                  </motion.button>
                </div>

                <div className="text-center mt-6">
                  <p className="text-sm text-gray-400">
                    {t('auth.signup.haveAccount')}{' '}
                    <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                      {t('auth.signup.signInLink')}
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

export default Signup;
