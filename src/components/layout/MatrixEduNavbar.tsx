import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaBolt } from 'react-icons/fa';
import { useAuth } from '../../utils/AuthContext';
import { useSubscription } from '../../utils/SubscriptionContext';
import { supabase } from '../../utils/supabase';
import matrixLogo from '../../assets/logoround.png';
import LogoWithText from '../ui/LogoWithText';
import coinIcon from '../../assets/assets_coin.png';
import { useLanguage } from '../../utils/LanguageContext';
import LanguageSelector from '../ui/LanguageSelector';

const MatrixEduNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { subscriptionStatus, loading: subLoading } = useSubscription();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [coins, setCoins] = useState<number>(0);

  // Fetch and subscribe to coins
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

  // Determine if we should show transparent background (on home) or solid (other pages)
  // For now, consistent style as requested "in all the 4 pages show this navbar"
  // The ReflectHero had: fixed top-0 left-0 right-0 z-50 ... backdrop-blur-sm bg-[#050505]/50
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 py-3.5 md:py-4 w-full backdrop-blur-sm bg-white/80 dark:bg-[#050505]/80 border-b border-indigo-100/80 dark:border-white/5 transition-all duration-300">
        <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => navigate('/')}>
          <LogoWithText size={32} maxTextWidth={140} title="MatrixEdu" subtitle="MatrixAI Company Limited" />
        </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-8 text-sm font-medium absolute left-1/2 transform -translate-x-1/2">
          <Link to="/" className={`transition-colors hover:text-gray-900 dark:hover:text-white ${location.pathname === '/' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{t('nav.home')}</Link>
          <Link to="/about" className={`transition-colors hover:text-gray-900 dark:hover:text-white ${location.pathname === '/about' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{t('nav.about')}</Link>
          <Link to="/pricing" className={`transition-colors hover:text-gray-900 dark:hover:text-white ${location.pathname === '/pricing' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{t('nav.pricing')}</Link>
          <Link to="/blog" className={`transition-colors hover:text-gray-900 dark:hover:text-white ${location.pathname === '/blog' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{t('nav.blog')}</Link>
      </div>

      {/* Auth Buttons & Coins */}
      <div className="hidden md:flex items-center gap-4">
          <LanguageSelector />
          {user && !subLoading && (
            subscriptionStatus?.hasActiveSubscription ? (
                <button
                onClick={() => navigate('/transaction-history')}
                className="flex items-center px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-400 backdrop-blur-sm hover:bg-yellow-500/20 transition-colors cursor-pointer"
                >
                    <img src={coinIcon} alt={t('matrixEduNavbar.coinsAlt')} className="w-4 h-4 mr-1.5" />
                    <span className="font-bold text-sm">{coins}</span>
                </button>
            ) : (
                <button
                onClick={() => navigate('/pricing')}
                className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                <FaBolt className="text-yellow-300" />
                {t('matrixEduNavbar.upgrade')}
                </button>
            )
          )}

          {user ? (
              <button 
                  onClick={() => navigate('/dashboard')} 
                  className="text-sm font-medium px-4 py-2 bg-[#6366f1] hover:bg-[#5558dd] text-white rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:shadow-[0_0_20px_rgba(99,102,241,0.7)]"
              >
                  {t('nav.dashboard')}
              </button>
          ) : (
              <>
                  <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{t('nav.login')}</button>
                  <button onClick={() => navigate('/signup')} className="text-sm font-medium px-4 py-2 bg-[#6366f1] hover:bg-[#5558dd] text-white rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:shadow-[0_0_20px_rgba(99,102,241,0.7)]">
                      {t('nav.signup')}
                  </button>
              </>
          )}
      </div>

      <div className="flex items-center gap-2 md:hidden shrink-0">
         {/* Mobile Coins Display */}
         {user && !subLoading && subscriptionStatus?.hasActiveSubscription && (
            <button
                onClick={() => navigate('/transaction-history')}
                className="flex items-center px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-400 backdrop-blur-sm hover:bg-yellow-500/20 transition-colors cursor-pointer"
            >
                <img src={coinIcon} alt={t('matrixEduNavbar.coinsAlt')} className="w-3.5 h-3.5 mr-1" />
                <span className="font-bold text-xs">{coins}</span>
            </button>
         )}

        <LanguageSelector compactMobile />
         
        <button className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-1.5" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="absolute top-full left-0 right-0 bg-white dark:bg-[#050505] border-b border-indigo-100 dark:border-white/10 overflow-hidden md:hidden shadow-xl"
            >
                <div className="flex flex-col p-5 gap-4">
                    <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-lg">{t('nav.home')}</Link>
                    <Link to="/about" onClick={() => setIsMenuOpen(false)} className="text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-lg">{t('nav.about')}</Link>
                    <Link to="/pricing" onClick={() => setIsMenuOpen(false)} className="text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-lg">{t('nav.pricing')}</Link>
                    <Link to="/blog" onClick={() => setIsMenuOpen(false)} className="text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-lg">{t('nav.blog')}</Link>
                    <div className="h-px bg-indigo-100 dark:bg-white/10 my-2"></div>
                    {user ? (
                        <button 
                            onClick={() => {
                              setIsMenuOpen(false);
                              navigate('/dashboard');
                            }} 
                            className="w-full py-3 bg-[#6366f1] text-white rounded-lg font-bold"
                        >
                            {t('nav.dashboard')}
                        </button>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <button onClick={() => {
                              setIsMenuOpen(false);
                              navigate('/login');
                            }} className="w-full py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-indigo-100 dark:border-white/10 rounded-lg">{t('nav.login')}</button>
                            <button onClick={() => {
                              setIsMenuOpen(false);
                              navigate('/signup');
                            }} className="w-full py-3 bg-[#6366f1] text-white rounded-lg font-bold">{t('nav.signup')}</button>
                        </div>
                    )}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default MatrixEduNavbar;
