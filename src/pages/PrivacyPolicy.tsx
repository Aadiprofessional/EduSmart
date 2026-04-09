import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaDatabase, FaLock, FaShieldAlt, FaTrashAlt, FaUserShield } from 'react-icons/fa';
import MatrixEduNavbar from '../components/layout/MatrixEduNavbar';
import IconComponent from '../components/ui/IconComponent';

const PrivacyPolicy: React.FC = () => {
  const sections = [
    {
      id: 'overview',
      title: 'Privacy Overview',
      icon: FaUserShield,
      content: `MatrixEdu is committed to protecting your personal information. This Privacy Policy explains what information we collect, how we use it, how we store it, and how you can request deletion.

This page is public and does not require login.`
    },
    {
      id: 'google-user-data',
      title: 'Google User Data',
      icon: FaShieldAlt,
      content: `MatrixEdu uses Google OAuth for account authentication. We access:
• Email address
• Basic profile information (name, profile picture)

We use this data only for:
• User authentication
• Account identification
• Core product functionality

MatrixEdu does not sell, share, or transfer Google user data to third parties.

MatrixEdu follows Google Limited Use requirements and uses Google user data only for the purposes disclosed in this policy.`
    },
    {
      id: 'data-collected',
      title: 'Data We Collect',
      icon: FaDatabase,
      content: `We collect:
• Account data (email, profile information)
• Product usage data (feature activity, logs, learning interactions)
• Device and technical data (browser, operating system, IP)
• Support data (messages sent to support)

We collect only what is necessary to operate and improve MatrixEdu.`
    },
    {
      id: 'security-storage',
      title: 'Storage and Security',
      icon: FaLock,
      content: `MatrixEdu uses Supabase and related cloud infrastructure to store and process data securely.

We apply standard protections such as encrypted transmission, access controls, and monitoring to reduce unauthorized access risks.`
    },
    {
      id: 'deletion',
      title: 'Data Deletion',
      icon: FaTrashAlt,
      content: `You can request account and data deletion by contacting:
support@matrixaiglobal.com

Please send the request from your registered email address. We process deletion requests according to applicable legal and security requirements.`
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
                <IconComponent icon={FaUserShield} />
                MatrixEdu Privacy
              </div>
              <h1 className="mt-6 text-4xl md:text-6xl font-permanent-marker text-gray-900 dark:text-white">Privacy Policy</h1>
              <p className="mt-5 text-lg text-gray-600 dark:text-gray-400">
                MatrixEdu respects your privacy and explains in clear language how data is used.
              </p>
              <div className="mt-8 rounded-2xl bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/10 p-5 md:p-6 text-left">
                <p className="text-gray-700 dark:text-gray-300"><span className="font-bold text-gray-900 dark:text-white">Last Updated:</span> April 8, 2022</p>
                <p className="text-gray-700 dark:text-gray-300 mt-2"><span className="font-bold text-gray-900 dark:text-white">Contact:</span> support@matrixaiglobal.com</p>
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
          <p className="text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} MatrixEdu. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link to="/terms" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
