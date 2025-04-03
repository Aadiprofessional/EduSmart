import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const About: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="bg-primary text-white py-16">
          <div className="container mx-auto">
            <h1 className="text-4xl font-bold mb-4">About EduSmart</h1>
            <p className="text-xl">We're transforming the educational experience through AI-powered solutions</p>
          </div>
        </div>
        
        <section className="py-16">
          <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-primary mb-6">Our Mission</h2>
              <p className="text-gray-700 mb-4">
                At EduSmart, our mission is to make quality education accessible to everyone through cutting-edge 
                technology and personalized learning experiences.
              </p>
              <p className="text-gray-700 mb-4">
                We believe that every student deserves an educational journey tailored to their unique needs and learning style.
                Our AI-powered platform adapts to individual students, providing recommendations, resources, and guidance
                that help them achieve their academic goals.
              </p>
              <p className="text-gray-700">
                Through innovative technology and a dedication to educational excellence, we're building a brighter future 
                where learning knows no boundaries.
              </p>
            </div>
            <div className="bg-gray-200 rounded-lg"></div>
          </div>
        </section>
        
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-primary mb-12 text-center">Our Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((member) => (
                <div key={member} className="bg-white p-6 rounded-lg shadow-md text-center">
                  <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold text-primary">Team Member {member}</h3>
                  <p className="text-gray-600 mb-2">Position Title</p>
                  <p className="text-gray-500 text-sm">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <section className="py-16">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold text-primary mb-8">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6">
                <div className="bg-secondary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">1</span>
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2">Innovation</h3>
                <p className="text-gray-600">
                  We're constantly pushing the boundaries of what's possible in education technology.
                </p>
              </div>
              <div className="p-6">
                <div className="bg-secondary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">2</span>
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2">Accessibility</h3>
                <p className="text-gray-600">
                  We believe quality education should be available to everyone, regardless of background.
                </p>
              </div>
              <div className="p-6">
                <div className="bg-secondary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">3</span>
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2">Excellence</h3>
                <p className="text-gray-600">
                  We hold ourselves to the highest standards in everything we do.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About; 