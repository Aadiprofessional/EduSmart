import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa';
import IconComponent from '../ui/IconComponent';

const Footer: React.FC = () => {
  return (
    <footer className="bg-teal-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">About Us</h3>
            <p className="text-gray-300 mb-4">
              EduSmart is an AI-powered educational platform helping students find their dream university and educational path with personalized guidance and resources.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-orange-500">
                <IconComponent icon={FaFacebook} size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-orange-500">
                <IconComponent icon={FaTwitter} size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-orange-500">
                <IconComponent icon={FaInstagram} size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-orange-500">
                <IconComponent icon={FaLinkedin} size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-orange-500">
                <IconComponent icon={FaYoutube} size={20} />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-orange-500">Home</Link>
              </li>
              <li>
                <Link to="/database" className="text-gray-300 hover:text-orange-500">University Database</Link>
              </li>
              <li>
                <Link to="/case-studies" className="text-gray-300 hover:text-orange-500">Success Stories</Link>
              </li>
              <li>
                <Link to="/ai-courses" className="text-gray-300 hover:text-orange-500">AI Courses</Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-300 hover:text-orange-500">Blog</Link>
              </li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h3 className="text-xl font-bold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/scholarship-finder" className="text-gray-300 hover:text-orange-500">Scholarship Finder</Link>
              </li>
              <li>
                <Link to="/application-tracker" className="text-gray-300 hover:text-orange-500">Application Tracker</Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-orange-500">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-orange-500">Terms of Service</Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-300 hover:text-orange-500">FAQ</Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-gray-300">
              <li>123 Education Street</li>
              <li>New York, NY 10001</li>
              <li>Phone: (123) 456-7890</li>
              <li>Email: info@edusmart.com</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="text-gray-300">© 2025 EduSmart. All rights reserved.</span>
          </div>
          <div className="flex space-x-6">
            <Link to="/privacy" className="text-gray-300 hover:text-orange-500 text-sm">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-300 hover:text-orange-500 text-sm">
              Terms of Service
            </Link>
            <Link to="/cookies" className="text-gray-300 hover:text-orange-500 text-sm">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;