import React from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaUser } from 'react-icons/fa';
import IconComponent from './IconComponent';
import { motion } from 'framer-motion';
import AnimatedSection from './AnimatedSection';

const BlogSection: React.FC = () => {
  const blogPosts = [
    {
      id: 1,
      title: 'How AI Is Revolutionizing University Selection Process',
      excerpt: 'Discover how artificial intelligence algorithms are helping students find their perfect university match with unprecedented accuracy.',
      author: 'Dr. James Wilson',
      date: 'May 15, 2025',
      category: 'AI Technology',
      image: 'https://images.unsplash.com/photo-1593642532744-d377ab507dc8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 2,
      title: '5 Success Stories: From Rejection to Top University Admission',
      excerpt: 'Read inspiring case studies of students who overcame initial rejections and secured spots at prestigious universities worldwide.',
      author: 'Emily Parker',
      date: 'May 10, 2025',
      category: 'Success Stories',
      image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 3,
      title: 'International Scholarship Guide: Hidden Opportunities for 2025',
      excerpt: 'Uncover lesser-known scholarship programs and funding sources for international students planning to study abroad.',
      author: 'Michael Thompson',
      date: 'May 5, 2025',
      category: 'Scholarships',
      image: 'https://images.unsplash.com/photo-1532649538693-f3a2ec1bf8bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <AnimatedSection direction="up">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-teal-800">Read Our Blog</h2>
            <motion.div whileHover={{ x: 5 }} whileTap={{ scale: 0.95 }}>
              <Link 
                to="/blog" 
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                View All
              </Link>
            </motion.div>
          </div>
        </AnimatedSection>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <AnimatedSection key={post.id} direction="up" delay={0.1 * index}>
              <motion.div 
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 h-full"
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="overflow-hidden">
                  <motion.img 
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.5 }}
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-6">
                  <motion.div 
                    className="flex items-center text-gray-500 text-sm mb-2"
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className="bg-orange-100 text-orange-500 px-2 py-1 rounded-full">
                      {post.category}
                    </span>
                  </motion.div>
                  <h3 className="text-xl font-semibold text-teal-700 mb-2">
                    <Link to={`/blog/${post.id}`} className="hover:text-orange-500">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex justify-between items-center text-gray-500 text-sm">
                    <div className="flex items-center">
                      <IconComponent icon={FaUser} className="mr-2 text-teal-600" />
                      {post.author}
                    </div>
                    <div className="flex items-center">
                      <IconComponent icon={FaCalendarAlt} className="mr-2 text-teal-600" />
                      {post.date}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection; 