import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import { FaGlobe, FaTrash, FaChevronDown, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';
import { useLanguage } from '../utils/LanguageContext';
import { subscriptionAPI } from '../utils/subscriptionAPI';
import { Header } from '../components/layout';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, session, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<0 | 1 | 2>(0);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const languageOptions = [
    { code: 'en' as const, label: t('languageSelector.english') },
    { code: 'zh-CN' as const, label: t('languageSelector.simplifiedChinese') },
    { code: 'zh-TW' as const, label: t('languageSelector.traditionalChinese') },
  ];

  const currentLangLabel = languageOptions.find(l => l.code === language)?.label || language;

  const handleDeleteAccount = async () => {
    if (deleteConfirmStep === 0) {
      setDeleteConfirmStep(1);
      return;
    }
    if (deleteConfirmStep === 1) {
      setDeleteConfirmStep(2);
      return;
    }
    setIsDeletingAccount(true);
    try {
      const result = await subscriptionAPI.deleteAccount(session);
      if (result.success) {
        await signOut();
      } else {
        alert(result.error || 'Failed to delete account. Please try again.');
        setDeleteConfirmStep(0);
      }
    } catch {
      alert('Failed to delete account. Please try again.');
      setDeleteConfirmStep(0);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-white">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-8"
        >
          <AiOutlineArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Manage your account and preferences</p>

        <div className="space-y-4">
          {/* Language Section */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl p-6">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <FaGlobe className="text-indigo-500" size={16} />
              Language
            </h2>

            <div className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-xl text-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
              >
                <span className="font-medium">{currentLangLabel}</span>
                <FaChevronDown
                  size={12}
                  className={`text-gray-400 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {isLangDropdownOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden mt-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg"
                  >
                    {languageOptions.map(opt => (
                      <button
                        key={opt.code}
                        onClick={() => { setLanguage(opt.code); setIsLangDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                          language === opt.code
                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 font-semibold'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        {language === opt.code && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                        )}
                        {language !== opt.code && <span className="w-2 h-2 flex-shrink-0" />}
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-red-200 dark:border-red-500/20 rounded-2xl p-6">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-red-600 dark:text-red-400">
              <FaExclamationTriangle size={16} />
              Danger Zone
            </h2>

            {deleteConfirmStep === 0 && (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Delete Account</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Permanently delete your account and all associated data. This cannot be undone.
                  </p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors font-medium flex-shrink-0"
                >
                  <FaTrash size={12} />
                  Delete
                </button>
              </div>
            )}

            {deleteConfirmStep === 1 && (
              <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-4 border border-red-200 dark:border-red-500/20">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold mb-2 text-sm">
                  <FaExclamationTriangle size={14} />
                  <span>Delete your account?</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  All your data, study sets, and history will be permanently deleted. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteConfirmStep(0)}
                    className="flex-1 py-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-semibold"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {deleteConfirmStep === 2 && (
              <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-4 border border-red-200 dark:border-red-500/20">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold mb-2 text-sm">
                  <FaExclamationTriangle size={14} />
                  <span>Final confirmation</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Are you absolutely sure? This action is irreversible.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteConfirmStep(0)}
                    className="flex-1 py-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                    className="flex-1 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-semibold disabled:opacity-60"
                  >
                    {isDeletingAccount ? 'Deleting...' : 'Delete Forever'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
