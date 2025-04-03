import React from 'react';
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


const Home: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Hero />
        <AboutSection />
        <GraduatePrograms />
        <BestFeatures />
        <UpcomingEvents />
        <ScholarshipPrograms />
        <ContactForm />
        <ClientFeedback />
        <CourseSearch />
        <AdmissionInfo />
        <BlogSection />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
};

export default Home; 