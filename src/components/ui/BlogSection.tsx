import React from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaUser } from 'react-icons/fa';
import IconComponent from './IconComponent';

const BlogSection: React.FC = () => {
  const blogPosts = [
    {
      id: 1,
      title: 'How AI Is Revolutionizing University Selection Process',
      excerpt: 'Discover how artificial intelligence algorithms are helping students find their perfect university match with unprecedented accuracy.',
      author: 'Dr. James Wilson',
      date: 'May 15, 2025',
      category: 'AI Technology',
      image: 'https://via.placeholder.com/400x250'
    },
    {
      id: 2,
      title: '5 Success Stories: From Rejection to Top University Admission',
      excerpt: 'Read inspiring case studies of students who overcame initial rejections and secured spots at prestigious universities worldwide.',
      author: 'Emily Parker',
      date: 'May 10, 2025',
      category: 'Success Stories',
      image: 'https://via.placeholder.com/400x250'
    },
    {
      id: 3,
      title: 'International Scholarship Guide: Hidden Opportunities for 2025',
      excerpt: 'Uncover lesser-known scholarship programs and funding sources for international students planning to study abroad.',
      author: 'Michael Thompson',
      date: 'May 5, 2025',
      category: 'Scholarships',
      image: 'https://via.placeholder.com/400x250'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-bold text-teal-800">Read Our Blog</h2>
          <Link 
            to="/blog" 
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            View All
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
              <img 
                src={post.image} 
                alt={post.title} 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center text-gray-500 text-sm mb-2">
                  <span className="bg-orange-100 text-orange-500 px-2 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection; 