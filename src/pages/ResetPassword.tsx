import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaLock, FaMagic, FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';
import { useLanguage } from '../utils/LanguageContext';
import { motion } from 'framer-motion';
import { useNotification } from '../utils/NotificationContext';
import LogoWithText from '../components/ui/LogoWithText';
import { supabase } from '../utils/supabase';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { showSuccess } = useNotification();
  const [checkingSession, setCheckingSession] = useState(true);

  // Particle animation configuration
  const particles = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
  }));

  useEffect(() => {
    // Check if we have a session (user is authenticated via the link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Also check if there's a hash with access_token which implies a recovery link
      // that Supabase client will process
      const hasHash = window.location.hash && window.location.hash.includes('access_token');
      
      if (!session && !hasHash) {
        // If no session and no hash, redirect to login
        // But give it a moment as AuthContext might be initializing
        setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (!retrySession) {
                navigate('/login');
            }
            setCheckingSession(false);
        }, 1000);
      } else {
        setCheckingSession(false);
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    if (!password) {
      setAuthError(t('auth.updatePassword.passwordRequired'));
      return;
    }

    if (password.length < 6) {
        setAuthError(t('auth.updatePassword.passwordMinLength'));
        return;
    }
    
    if (password !== confirmPassword) {
      setAuthError(t('auth.updatePassword.passwordsNotMatch'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { success, error } = await updatePassword(password);
      
      if (success) {
        showSuccess(t('auth.updatePassword.successMessage'));
        navigate('/login');
      } else {
        setAuthError(error || t('auth.updatePassword.errorMessage'));
      }
    } catch (error) {
      setAuthError(t('auth.updatePassword.errorMessage'));
    } finally {
      setIsSubmitting(false);
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

  if (checkingSession) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
  }

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

      {/* Black Hole Background */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[400px] perspective-1000 opacity-60 pointer-events-none z-0">
          <div className="absolute left-1/2 bottom-[-100px] -translate-x-1/2 w-[600px] h-[300px] md:w-[800px] md:h-[400px]">
              <div className="absolute inset-0 rounded-[100%] bg-purple-600/20 blur-[80px] animate-pulse"></div>
              <div className="absolute inset-x-10 bottom-0 h-[200px] rounded-[100%] bg-indigo-500/30 blur-[60px]"></div>
              <div className="absolute left-1/2 bottom-[-150px] -translate-x-1/2 w-[120%] h-[300px] rounded-[50%] border-t-2 border-white/50 bg-gradient-to-b from-purple-500/10 to-transparent shadow-[0_-10px_40px_rgba(168,85,247,0.4)] box-shadow-[0_0_50px_rgba(139,92,246,0.5)]"></div>
              <div className="absolute left-1/2 bottom-[-152px] -translate-x-1/2 w-[120%] h-[300px] rounded-[50%] border-t-[4px] border-purple-300 blur-[2px] opacity-70"></div>
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
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-purple-200 backdrop-blur-md mb-6">
                  <FaMagic className="text-purple-400" />
                  Study smarter using AI
                </div>
                <div className="flex justify-center">
                  <LogoWithText
                    size={40}
                    maxTextWidth={200}
                    titleClassName="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 leading-tight"
                    subtitleClassName="text-[11px] text-gray-400 truncate"
                  />
                </div>
            </div>

            {/* Reset Password Form Container */}
            <motion.div 
              className="bg-[#111] rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative"
              variants={itemVariants}
            >
              <div className="relative flex items-center justify-center px-6 py-4 border-b border-white/5 bg-[#151515]">
                 <div className="absolute left-6 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                 </div>
                 <div className="text-xs text-gray-500 font-medium">{t('auth.updatePassword.title')}</div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="text-center mb-6">
                  <p className="text-gray-400 text-sm">
                    {t('auth.updatePassword.subtitle')}
                  </p>
                </div>

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
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-400 block ml-1">
                      {t('auth.updatePassword.passwordLabel')}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (authError) setAuthError(null);
                        }}
                        className="block w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 group-hover:border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 text-white placeholder-gray-600 focus:outline-none transition-all"
                        placeholder={t('auth.updatePassword.passwordPlaceholder')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-400 block ml-1">
                      {t('auth.updatePassword.confirmPasswordLabel')}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                      </div>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (authError) setAuthError(null);
                        }}
                        className="block w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 group-hover:border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 text-white placeholder-gray-600 focus:outline-none transition-all"
                        placeholder={t('auth.updatePassword.confirmPasswordPlaceholder')}
                      />
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
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <span>{t('auth.updatePassword.submitButton')}</span>
                    )}
                  </motion.button>
                </form>

                <div className="text-center mt-6">
                  <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                    <FaArrowLeft className="text-xs" />
                    {t('auth.forgotPassword.backToLogin')}
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
