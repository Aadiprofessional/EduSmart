import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const courseCategories = [
  'All Courses',
  'Computer Science',
  'Business',
  'Data Science',
  'Design',
  'Engineering'
];

const courseData = [
  {
    id: 1,
    title: 'Introduction to AI',
    category: 'Computer Science',
    instructor: 'Dr. Smith',
    rating: 4.8,
    students: 1245,
    price: 49.99,
    image: 'https://via.placeholder.com/300x200'
  },
  {
    id: 2,
    title: 'Business Management',
    category: 'Business',
    instructor: 'Prof. Johnson',
    rating: 4.6,
    students: 980,
    price: 39.99,
    image: 'https://via.placeholder.com/300x200'
  },
  {
    id: 3,
    title: 'Data Visualization',
    category: 'Data Science',
    instructor: 'Sarah Williams',
    rating: 4.9,
    students: 1560,
    price: 59.99,
    image: 'https://via.placeholder.com/300x200'
  },
  {
    id: 4,
    title: 'UX/UI Design Principles',
    category: 'Design',
    instructor: 'Mike Robertson',
    rating: 4.7,
    students: 1100,
    price: 44.99,
    image: 'https://via.placeholder.com/300x200'
  },
  {
    id: 5,
    title: 'Mechanical Engineering Basics',
    category: 'Engineering',
    instructor: 'Dr. Chen',
    rating: 4.5,
    students: 875,
    price: 54.99,
    image: 'https://via.placeholder.com/300x200'
  },
  {
    id: 6,
    title: 'Web Development Bootcamp',
    category: 'Computer Science',
    instructor: 'Jessica Lee',
    rating: 4.8,
    students: 2200,
    price: 79.99,
    image: 'https://via.placeholder.com/300x200'
  }
];

const Courses: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All Courses');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCourses = courseData.filter((course) => {
    const matchesCategory = activeCategory === 'All Courses' || course.category === activeCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="bg-primary text-white py-16">
          <div className="container mx-auto">
            <h1 className="text-4xl font-bold mb-4">Explore Our Courses</h1>
            <p className="text-xl">Discover a wide range of courses to help you achieve your goals</p>
          </div>
        </div>
        
        <section className="py-10">
          <div className="container mx-auto">
            <div className="mb-8">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
                  {courseCategories.map((category) => (
                    <button
                      key={category}
                      className={`px-4 py-2 rounded-full ${
                        activeCategory === category
                          ? 'bg-secondary text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      onClick={() => setActiveCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <div className="w-full md:w-auto">
                  <input
                    type="text"
                    placeholder="Search courses..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <img src={course.image} alt={course.title} className="w-full h-48 object-cover" />
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-primary">{course.title}</h3>
                      <span className="bg-secondary-light text-white text-sm px-2 py-1 rounded">
                        ${course.price}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">Instructor: {course.instructor}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="text-gray-700">{course.rating}</span>
                        <span className="text-gray-500 text-sm ml-2">({course.students} students)</span>
                      </div>
                      <button className="text-secondary hover:text-secondary-light">
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Courses; 