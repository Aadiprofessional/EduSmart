import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FaBolt, FaBars, FaTimes, FaSun, FaMoon } from 'react-icons/fa';
import { useAuth } from '../../utils/AuthContext';
import { useSubscription } from '../../utils/SubscriptionContext';
import { supabase } from '../../utils/supabase';
import coinIcon from '../../assets/assets_coin.png';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { subscriptionStatus, loading: subLoading } = useSubscription();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [coins, setCoins] = useState<number>(0);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Initialize theme
  useEffect(() => {
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    if (!user) {
      setCoins(0);
      return;
    }

    // Initial fetch
    const fetchCoins = async () => {
      try {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('current_coins')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setCoins(data.current_coins || 0);
        }
      } catch (err) {
        console.error('Error fetching coins:', err);
      }
    };

    fetchCoins();

    // Real-time subscription
    const channel = supabase
      .channel(`user_coins_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newRecord = payload.new as { current_coins: number | null };
          setCoins(newRecord.current_coins ?? 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToFeatures = () => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById('features-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById('features-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none' : 'bg-transparent border-transparent'}`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
             <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">MatrixEdu</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
              <Link to="/about" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white transition-colors">Careers <span className="text-[10px] bg-green-500/20 text-green-600 dark:text-green-500 px-1.5 py-0.5 rounded ml-1">Hiring</span></Link>
              <Link to="/blog" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white transition-colors">Blog</Link>
              <Link to="/pricing" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white transition-colors">Pricing</Link>
              <button onClick={scrollToFeatures} className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white transition-colors">Features</button>
          </div>

          {/* Auth Buttons & Theme Toggle */}
          <div className="hidden md:flex items-center gap-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                aria-label="Toggle Dark Mode"
              >
                {isDarkMode ? <FaSun size={16} /> : <FaMoon size={16} className="text-indigo-600" />}
              </button>

              {user && !subLoading && (
                subscriptionStatus?.hasActiveSubscription ? (
                  <div className="flex items-center px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-600 dark:text-yellow-400 hidden md:flex backdrop-blur-sm">
                    <img src={coinIcon} alt="Coins" className="w-4 h-4 mr-1.5" />
                    <span className="font-bold text-sm">{coins}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('/pricing')}
                    className="px-5 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <FaBolt className="text-yellow-300" />
                    Upgrade
                  </button>
                )
              )}
              {user ? (
                 <button 
                   onClick={() => navigate('/dashboard')}
                   className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium text-sm transition-colors"
                 >
                   Dashboard
                 </button>
              ) : (
                <>
                  <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-700 dark:text-white hover:text-indigo-600 dark:hover:text-gray-300 transition-colors">Login</button>
                  {/* Only show Dashboard if logged in, otherwise regular signup logic or hidden */}
                </>
              )}
          </div>

          {/* Mobile Menu Button & Theme Toggle (Mobile) */}
          <div className="flex items-center gap-3 md:hidden">
            {user && !subLoading && subscriptionStatus?.hasActiveSubscription && (
                <div className="flex items-center px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-600 dark:text-yellow-400 backdrop-blur-sm">
                    <img src={coinIcon} alt="Coins" className="w-3.5 h-3.5 mr-1" />
                    <span className="font-bold text-xs">{coins}</span>
                </div>
            )}
            <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                aria-label="Toggle Dark Mode"
            >
                {isDarkMode ? <FaSun size={16} /> : <FaMoon size={16} className="text-indigo-600" />}
            </button>
            <button 
              className="text-gray-700 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
          {isMobileMenuOpen && (
              <motion.div
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
                 className="md:hidden bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/5 overflow-hidden"
              >
                  <div className="px-4 py-6 space-y-4 flex flex-col">
                      <Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white">Careers</Link>
                      <Link to="/blog" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white">Blog</Link>
                      <Link to="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white">Pricing</Link>
                      <button onClick={scrollToFeatures} className="text-left text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white">Features</button>
                      <div className="pt-4 border-t border-gray-200 dark:border-white/5 flex flex-col gap-3">
                           {user ? (
                              <button 
                                onClick={() => navigate('/dashboard')}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                              >
                                Dashboard
                              </button>
                           ) : (
                              <button onClick={() => navigate('/login')} className="w-full py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-xl font-bold">Login</button>
                           )}
                      </div>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </nav>
  );
};

export default Header;
