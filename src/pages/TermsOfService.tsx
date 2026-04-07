import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaBalanceScale, FaBookOpen, FaHandshake, FaLock, FaRobot, FaUsers } from 'react-icons/fa';
import MatrixEduNavbar from '../components/layout/MatrixEduNavbar';
import IconComponent from '../components/ui/IconComponent';

const TermsOfService: React.FC = () => {
  const sections = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      icon: FaHandshake,
      content: `By accessing or using MatrixEdu, you agree to these Terms of Service. If you do not agree, you must stop using the platform.`
    },
    {
      id: 'company',
      title: 'Company and Product',
      icon: FaBookOpen,
      content: `MatrixAi is the company that operates MatrixEdu.

MatrixEdu is a product of MatrixAi and provides AI-powered educational and productivity tools.`
    },
    {
      id: 'accounts',
      title: 'Accounts and Eligibility',
      icon: FaUsers,
      content: `You must provide accurate registration information and keep account credentials secure.

You are responsible for activity under your account.`
    },
    {
      id: 'ai-use',
      title: 'AI Usage and Academic Integrity',
      icon: FaRobot,
      content: `MatrixEdu AI tools are intended to support learning and productivity.

You must use the platform lawfully and follow your institution’s integrity policies where applicable.`
    },
    {
      id: 'privacy-security',
      title: 'Privacy and Security',
      icon: FaLock,
      content: `Data handling and user rights are described in the Privacy Policy.

MatrixAi applies reasonable safeguards to protect account and platform data.`
    },
    {
      id: 'liability',
      title: 'Disclaimers and Liability',
      icon: FaBalanceScale,
      content: `Services are provided as available. We may update, suspend, or discontinue features.

To the extent allowed by law, MatrixAi limits liability for indirect or consequential damages.`
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-gray-900 dark:text-white">
      <MatrixEduNavbar />
      <main className="pt-24 pb-16">
        <section className="relative overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-sm font-semibold">
                <IconComponent icon={FaHandshake} />
                MatrixEdu Terms
              </div>
              <h1 className="mt-6 text-4xl md:text-6xl font-permanent-marker text-gray-900 dark:text-white">Terms of Service</h1>
              <p className="mt-5 text-lg text-gray-600 dark:text-gray-400">
                Legal terms for using MatrixEdu, a product operated by MatrixAi.
              </p>
              <div className="mt-8 rounded-2xl bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/10 p-5 md:p-6 text-left">
                <p className="text-gray-700 dark:text-gray-300"><span className="font-bold text-gray-900 dark:text-white">Last Updated:</span> April 8, 2026</p>
                <p className="text-gray-700 dark:text-gray-300 mt-2"><span className="font-bold text-gray-900 dark:text-white">Company:</span> MatrixAi</p>
                <p className="text-gray-700 dark:text-gray-300 mt-2"><span className="font-bold text-gray-900 dark:text-white">Product:</span> MatrixEdu</p>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mt-12 md:mt-16">
          <div className="container mx-auto px-4 max-w-5xl space-y-6">
            {sections.map((section) => (
              <motion.article
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45 }}
                className="bg-white dark:bg-[#0f0f0f] rounded-3xl border border-gray-200 dark:border-white/10 p-6 md:p-8 shadow-sm"
              >
                <div className="flex items-start gap-4 md:gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                    <IconComponent icon={section.icon} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{section.title}</h2>
                    {section.content.split('\n\n').map((paragraph) => (
                      <p key={paragraph} className="mt-4 text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      </main>
      <div className="border-t border-gray-200 dark:border-white/10">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <p className="text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} MatrixAi. MatrixEdu is a MatrixAi product.</p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
