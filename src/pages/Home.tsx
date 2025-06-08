import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/layout/Header';
import Hero from '../components/ui/Hero';
import AboutSection from '../components/ui/AboutSection';
import GraduatePrograms from '../components/ui/GraduatePrograms';
import BestFeatures from '../components/ui/BestFeatures';
import UpcomingEvents from '../components/ui/UpcomingEvents';
import ScholarshipPrograms from '../components/ui/ScholarshipPrograms';
import ContactForm from '../components/ui/ContactForm';
import ClientFeedback from '../components/ui/ClientFeedback';
import CourseSearch from '../components/ui/CourseSearch';
import AdmissionInfo from '../components/ui/AdmissionInfo';
import BlogSection from '../components/ui/BlogSection';
import Newsletter from '../components/ui/Newsletter';
import Footer from '../components/layout/Footer';
import AnimatedSection from '../components/ui/AnimatedSection';
import { useScrollReveal } from '../utils/scrollUtils';
import { useLanguage } from '../utils/LanguageContext';

const Home: React.FC = () => {
  const { t } = useLanguage();
  // Activate scroll reveal effect for elements with reveal-on-scroll class
  useScrollReveal();
  
  return (
    <div className="flex flex-col min-h-screen overflow-hidden bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 animate-gradient-x">
      <Header />
      <main className="flex-grow">
        <Hero />
        
        <AnimatedSection>
          <AboutSection />
        </AnimatedSection>
        
        <AnimatedSection direction="right" delay={0.1}>
          <GraduatePrograms />
        </AnimatedSection>
        
        <AnimatedSection direction="left" delay={0.1}>
          <BestFeatures />
        </AnimatedSection>
        
        <AnimatedSection direction="up" delay={0.2}>
          <UpcomingEvents />
        </AnimatedSection>
        
        <AnimatedSection direction="right" delay={0.1}>
          <ScholarshipPrograms />
        </AnimatedSection>
        
        <AnimatedSection direction="left" delay={0.2}>
          <ContactForm />
        </AnimatedSection>
        
        <AnimatedSection direction="up" delay={0.1}>
          <ClientFeedback />
        </AnimatedSection>
        
        <AnimatedSection direction="right" delay={0.2}>
          <CourseSearch />
        </AnimatedSection>
        
        <AnimatedSection direction="left" delay={0.1}>
          <AdmissionInfo />
        </AnimatedSection>
        
        <AnimatedSection direction="up" delay={0.2}>
          <BlogSection />
        </AnimatedSection>
        
        <AnimatedSection direction="up" delay={0.1}>
          <Newsletter />
        </AnimatedSection>
      </main>
      
      {/* Scroll to top button */}
      <motion.button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-20 right-5 z-40 bg-teal-700 hover:bg-teal-800 text-white p-3 rounded-full shadow-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </motion.button>
      
      <Footer />
    </div>
  );
};

export default Home; 