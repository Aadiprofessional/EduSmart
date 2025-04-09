import React, { useState } from 'react';
import { FaGraduationCap, FaStar, FaUniversity, FaCertificate, FaRobot, FaLaptopCode, FaSearch, FaTag, FaChalkboardTeacher, FaBookmark, FaRegBookmark, FaChevronRight, FaTimes, FaUserTie, FaFilter } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import { motion } from 'framer-motion';

interface Course {
  id: number;
  title: string;
  provider: string;
  type: 'university' | 'certification' | 'tutorial';
  category: string[];
  description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  rating: number;
  ratingCount: number;
  instructors?: string[];
  prerequisites?: string[];
  skills: string[];
  price?: string;
  link: string;
  image: string;
  featured?: boolean;
  teacherId?: number; // Reference to teacher
}

interface Teacher {
  id: number;
  name: string;
  avatar: string;
  subjects: string[];
  rating: number;
  ratingCount: number;
  university: string;
  position: string;
  shortBio: string;
  longBio: string;
  experience: string;
  achievements: string[];
  contactEmail?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  courseCount: number;
  featured?: boolean;
}

const AICourses: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeLevel, setActiveLevel] = useState('all');
  const [activeType, setActiveType] = useState('all');
  const [activeSubject, setActiveSubject] = useState('all');
  const [showMode, setShowMode] = useState<'courses' | 'teachers'>('courses');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [favoriteTeachers, setFavoriteTeachers] = useState<number[]>([]);
  
  // Sample teachers data
  const teachers: Teacher[] = [
    {
      id: 1,
      name: "Dr. Andrew Ng",
      avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
      subjects: ["Machine Learning", "Deep Learning", "AI"],
      rating: 4.9,
      ratingCount: 24500,
      university: "Stanford University",
      position: "Professor of Computer Science",
      shortBio: "Leading AI researcher and educator, co-founder of Coursera",
      longBio: "Dr. Andrew Ng is a globally recognized leader in AI. He founded and led the Google Brain team, served as Chief Scientist at Baidu, and co-founded Coursera. His research focuses on machine learning and deep learning. Dr. Ng is dedicated to providing educational resources that help people around the world master AI skills.",
      experience: "20+ years in AI research and education",
      achievements: [
        "Co-founder of Coursera",
        "Former Chief Scientist at Baidu",
        "Founded Google Brain",
        "Published 100+ research papers in leading journals"
      ],
      contactEmail: "andrew.ng@example.edu",
      socialLinks: {
        linkedin: "https://linkedin.com/in/andrewng",
        twitter: "https://twitter.com/andrewng",
        website: "https://www.andrewng.org"
      },
      courseCount: 5,
      featured: true
    },
    {
      id: 2,
      name: "Dr. Fei-Fei Li",
      avatar: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
      subjects: ["Computer Vision", "AI Ethics", "Machine Learning"],
      rating: 4.8,
      ratingCount: 18700,
      university: "Stanford University",
      position: "Co-Director, Stanford Institute for Human-Centered AI",
      shortBio: "Pioneer in computer vision and AI education",
      longBio: "Dr. Fei-Fei Li is a Professor in the Computer Science Department at Stanford University and Co-Director of Stanford's Human-Centered AI Institute. Her research expertise includes computer vision, machine learning, and cognitive neuroscience. She served as the Chief Scientist of AI/ML at Google Cloud and is an advocate for diversity in technology.",
      experience: "15+ years in computer vision research",
      achievements: [
        "Created ImageNet",
        "Former VP & Chief Scientist of AI at Google Cloud",
        "Co-founded AI4ALL, a nonprofit promoting diversity in AI",
        "Named one of the most influential people in AI"
      ],
      contactEmail: "feifeili@example.edu",
      socialLinks: {
        linkedin: "https://linkedin.com/in/feifeili",
        twitter: "https://twitter.com/drfeifei"
      },
      courseCount: 3,
      featured: true
    },
    {
      id: 3,
      name: "Dr. Sebastian Thrun",
      avatar: "https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
      subjects: ["Robotics", "Self-Driving Cars", "AI"],
      rating: 4.7,
      ratingCount: 15600,
      university: "Stanford University",
      position: "Adjunct Professor",
      shortBio: "Pioneer in self-driving cars and founder of Udacity",
      longBio: "Sebastian Thrun is a scientist, educator, inventor, and entrepreneur. He is CEO of Kitty Hawk Corporation, chairman and co-founder of Udacity, and an Adjunct Professor at Stanford University. His research focuses on robotics, AI, and education. He led the development of Google's self-driving car and Google X.",
      experience: "25+ years in robotics and AI",
      achievements: [
        "Founded Udacity",
        "Led Google's self-driving car project",
        "Developed Stanley, the winning vehicle in the DARPA Grand Challenge",
        "Recipient of the Smithsonian American Ingenuity Award"
      ],
      contactEmail: "sebastian@example.edu",
      socialLinks: {
        linkedin: "https://linkedin.com/in/sebastianthrun",
        twitter: "https://twitter.com/sebastianthrun"
      },
      courseCount: 4
    },
    {
      id: 4,
      name: "Dr. Christopher Manning",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
      subjects: ["Natural Language Processing", "Deep Learning", "Linguistics"],
      rating: 4.9,
      ratingCount: 14200,
      university: "Stanford University",
      position: "Professor of Computer Science and Linguistics",
      shortBio: "Leading researcher in NLP and computational linguistics",
      longBio: "Christopher Manning is a Professor of Computer Science and Linguistics at Stanford University. His research focuses on natural language processing, computational linguistics, and deep learning approaches to language understanding. He is known for developing core NLP tools that are widely used in industry and academia.",
      experience: "20+ years in NLP research and education",
      achievements: [
        "Director of the Stanford Artificial Intelligence Laboratory",
        "Co-authored leading textbooks on NLP and information retrieval",
        "Developed the Stanford CoreNLP software",
        "Fellow of the Association for Computational Linguistics"
      ],
      contactEmail: "manning@example.edu",
      socialLinks: {
        linkedin: "https://linkedin.com/in/christophermanning"
      },
      courseCount: 2
    },
    {
      id: 5,
      name: "Dr. Emma Johnson",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
      subjects: ["Mathematics", "Data Science", "Statistics"],
      rating: 4.7,
      ratingCount: 9800,
      university: "MIT",
      position: "Associate Professor of Mathematics",
      shortBio: "Expert in statistical modeling and data science applications",
      longBio: "Dr. Emma Johnson specializes in applying advanced statistical methods to solve real-world problems. Her research bridges pure mathematics with practical applications in data science, making complex concepts accessible to students from diverse backgrounds. She leads MIT's initiative to integrate data science across all academic disciplines.",
      experience: "12+ years teaching advanced mathematics",
      achievements: [
        "President's Award for Excellence in Teaching",
        "Author of 'Statistics for Modern Data Science'",
        "Led development of MIT's cross-disciplinary data curriculum",
        "Consultant for major tech companies on statistical modeling"
      ],
      contactEmail: "emmaj@example.edu",
      socialLinks: {
        linkedin: "https://linkedin.com/in/emmajohnson",
        website: "https://www.emmajohnson-math.edu"
      },
      courseCount: 6
    },
    {
      id: 6,
      name: "Dr. Michael Chen",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
      subjects: ["Physics", "Quantum Computing", "Computational Physics"],
      rating: 4.8,
      ratingCount: 8750,
      university: "California Institute of Technology",
      position: "Professor of Theoretical Physics",
      shortBio: "Bridging quantum physics with computational methods",
      longBio: "Dr. Michael Chen's work focuses on the intersection of quantum mechanics and computational methods. He has made significant contributions to the field of quantum computing algorithms and simulation of quantum systems. His teaching methodology combines theoretical rigor with practical computational skills, preparing students for the future of physics research.",
      experience: "18+ years researching quantum computing applications",
      achievements: [
        "National Science Foundation Career Award",
        "Published groundbreaking work on quantum error correction",
        "Developer of widely-used quantum simulation software",
        "Advisor to multiple quantum computing startups"
      ],
      contactEmail: "mchen@example.edu",
      socialLinks: {
        linkedin: "https://linkedin.com/in/michaelchen",
        twitter: "https://twitter.com/dr_mchen"
      },
      courseCount: 3
    },
    {
      id: 7,
      name: "Dr. Sarah Williams",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
      subjects: ["English Literature", "Creative Writing", "Critical Theory"],
      rating: 4.9,
      ratingCount: 12300,
      university: "Oxford University",
      position: "Professor of Contemporary Literature",
      shortBio: "Award-winning author and literature professor",
      longBio: "Dr. Sarah Williams is a renowned literary scholar and author whose research focuses on contemporary fiction and poetry. Her interdisciplinary approach connects literature with societal issues, digital humanities, and creative practice. Her courses are known for fostering critical thinking and creative expression in equal measure.",
      experience: "15+ years in literary scholarship and creative writing",
      achievements: [
        "Pulitzer Prize finalist for 'The Echoing Spaces'",
        "Oxford Excellence in Teaching Award recipient",
        "Editor of the Oxford Literary Review",
        "Developed pioneering digital humanities curriculum"
      ],
      contactEmail: "swilliams@example.edu",
      socialLinks: {
        twitter: "https://twitter.com/sarahwilliamslit",
        website: "https://www.sarahwilliams-literature.com"
      },
      courseCount: 4,
      featured: true
    }
  ];
  
  // Sample courses data
  const courses: Course[] = [
    {
      id: 1,
      title: 'Master of Science in Artificial Intelligence',
      provider: 'Stanford University',
      type: 'university',
      category: ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision'],
      description: "Stanford's MS in AI program prepares students for leadership roles in AI research and development. The curriculum covers foundational AI concepts, advanced machine learning techniques, and specialized areas like NLP and computer vision.",
      duration: '2 years',
      level: 'Advanced',
      rating: 4.9,
      ratingCount: 245,
      instructors: ['Dr. Andrew Ng', 'Dr. Fei-Fei Li', 'Dr. Christopher Manning'],
      prerequisites: ['Computer Science background', 'Programming experience', 'Linear algebra and calculus'],
      skills: ['Deep Learning', 'Neural Networks', 'Natural Language Processing', 'Computer Vision', 'Reinforcement Learning'],
      price: '$60,000/year',
      link: 'https://ai.stanford.edu/',
      image: 'https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      featured: true,
      teacherId: 1
    },
    {
      id: 2,
      title: 'Deep Learning Specialization',
      provider: 'Coursera (by DeepLearning.AI)',
      type: 'certification',
      category: ['Deep Learning', 'Neural Networks', 'Computer Vision', 'NLP'],
      description: 'Learn the foundations of Deep Learning, understand how to build neural networks, and lead successful machine learning projects. The specialization covers CNN, RNN, LSTM, and other modern architectures.',
      duration: '5 months',
      level: 'Intermediate',
      rating: 4.8,
      ratingCount: 156000,
      instructors: ['Andrew Ng'],
      prerequisites: ['Basic Python programming', 'Understanding of linear algebra'],
      skills: ['TensorFlow', 'Convolutional Neural Networks', 'Recurrent Neural Networks', 'Model Optimization'],
      price: '$49/month (subscription)',
      link: 'https://www.coursera.org/specializations/deep-learning',
      image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      teacherId: 1
    },
    {
      id: 3,
      title: 'AI for Everyone',
      provider: 'Coursera (by DeepLearning.AI)',
      type: 'certification',
      category: ['AI Fundamentals', 'Business Strategy'],
      description: 'A non-technical course designed to help you understand AI technologies and how they can impact your business. Learn the skills to work with an AI team and build an AI strategy in your company.',
      duration: '4 weeks',
      level: 'Beginner',
      rating: 4.7,
      ratingCount: 45000,
      instructors: ['Andrew Ng'],
      skills: ['AI Strategy', 'Machine Learning Project Management', 'AI Ethics', 'Business Applications of AI'],
      price: '$49 (one-time purchase)',
      link: 'https://www.coursera.org/learn/ai-for-everyone',
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      teacherId: 1
    },
    {
      id: 4,
      title: 'TensorFlow Developer Professional Certificate',
      provider: 'Coursera (by Google)',
      type: 'certification',
      category: ['Machine Learning', 'Deep Learning', 'TensorFlow'],
      description: 'Prepare for the TensorFlow Developer Certificate exam while learning best practices for TensorFlow, a popular open-source framework for machine learning.',
      duration: '3 months',
      level: 'Intermediate',
      rating: 4.6,
      ratingCount: 32000,
      prerequisites: ['Basic Python programming'],
      skills: ['TensorFlow', 'Convolutional Neural Networks', 'Natural Language Processing', 'Computer Vision'],
      price: '$49/month (subscription)',
      link: 'https://www.coursera.org/professional-certificates/tensorflow-in-practice',
      image: 'https://images.unsplash.com/photo-1591696205602-2f950c417cb9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      teacherId: 3
    },
    {
      id: 5,
      title: 'Using ChatGPT for Statement of Purpose Writing',
      provider: 'EduSmart',
      type: 'tutorial',
      category: ['AI Tools', 'Writing', 'Academic Applications'],
      description: 'Learn how to effectively use ChatGPT to craft a compelling Statement of Purpose for university applications. This tutorial covers prompt engineering techniques, editing strategies, and ethical considerations.',
      duration: '2 hours',
      level: 'Beginner',
      rating: 4.8,
      ratingCount: 1200,
      skills: ['Prompt Engineering', 'Content Refinement', 'AI-assisted Writing'],
      price: 'Free',
      link: '/tutorials/chatgpt-sop',
      image: 'https://images.unsplash.com/photo-1655720828026-e53261de9a55?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      featured: true,
      teacherId: 7
    },
    {
      id: 6,
      title: 'AI for University Selection and Application',
      provider: 'EduSmart',
      type: 'tutorial',
      category: ['AI Tools', 'University Applications', 'Decision Making'],
      description: 'This hands-on tutorial demonstrates how to leverage AI tools to research universities, compare programs, and make data-driven decisions about where to apply based on your profile and preferences.',
      duration: '3 hours',
      level: 'Beginner',
      rating: 4.7,
      ratingCount: 950,
      skills: ['Data-driven Decision Making', 'University Research', 'Application Strategy'],
      price: 'Free',
      link: '/tutorials/ai-university-selection',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      teacherId: 2
    },
    {
      id: 7,
      title: 'Ph.D. in Artificial Intelligence and Machine Learning',
      provider: 'Carnegie Mellon University',
      type: 'university',
      category: ['Machine Learning', 'Deep Learning', 'Research', 'Robotics'],
      description: "CMU's renowned Ph.D. program focuses on cutting-edge AI research, with opportunities to work with leading faculty on projects spanning machine learning theory, robotics, computer vision, and more.",
      duration: '4-5 years',
      level: 'Advanced',
      rating: 4.9,
      ratingCount: 180,
      instructors: ['Dr. Tom Mitchell', 'Dr. Manuela Veloso', 'Dr. Ruslan Salakhutdinov'],
      prerequisites: ['Masters degree in related field', 'Strong research background', 'Advanced mathematics'],
      skills: ['Machine Learning Research', 'Algorithm Development', 'Academic Publishing', 'Grant Writing'],
      price: 'Fully funded (includes stipend)',
      link: 'https://www.ml.cmu.edu/academics/ph.d.-in-machine-learning.html',
      image: 'https://images.unsplash.com/photo-1597589827317-4c6d6e0a90f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      teacherId: 4
    },
    {
      id: 8,
      title: 'Introduction to Quantum Computing',
      provider: 'California Institute of Technology',
      type: 'university',
      category: ['Physics', 'Quantum Computing', 'Computer Science'],
      description: "An introductory course to quantum computing principles and applications. Explore quantum mechanics basics, quantum algorithms, and their potential impact on computing.",
      duration: '1 semester',
      level: 'Intermediate',
      rating: 4.7,
      ratingCount: 320,
      instructors: ['Dr. Michael Chen'],
      prerequisites: ['Linear algebra', 'Basic quantum mechanics', 'Programming experience'],
      skills: ['Quantum Algorithms', 'Quantum Circuit Design', 'Quantum Programming'],
      price: '$4,000',
      link: 'https://www.caltech.edu/quantum-computing',
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      teacherId: 6
    },
    {
      id: 9,
      title: 'Advanced Statistics for Data Science',
      provider: 'MIT',
      type: 'certification',
      category: ['Mathematics', 'Statistics', 'Data Science'],
      description: "Master statistical methods essential for data science. This comprehensive course covers probability theory, inference, regression, and modern statistical computing techniques.",
      duration: '4 months',
      level: 'Advanced',
      rating: 4.8,
      ratingCount: 750,
      instructors: ['Dr. Emma Johnson'],
      prerequisites: ['Calculus', 'Basic statistics', 'Programming knowledge'],
      skills: ['Statistical Modeling', 'Hypothesis Testing', 'Regression Analysis', 'Bayesian Statistics'],
      price: '$1,200',
      link: 'https://www.mit.edu/statistics-datascience',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      teacherId: 5
    },
    {
      id: 10,
      title: 'Contemporary Literature and Digital Media',
      provider: 'Oxford University',
      type: 'university',
      category: ['English Literature', 'Digital Humanities', 'Creative Writing'],
      description: "Explore the intersection of contemporary literature and digital media. Analyze how digital technologies are transforming narrative forms, readership, and literary criticism.",
      duration: '1 year',
      level: 'Advanced',
      rating: 4.9,
      ratingCount: 420,
      instructors: ['Dr. Sarah Williams'],
      prerequisites: ['Bachelor\'s degree in Literature or related field', 'Critical reading and writing skills'],
      skills: ['Literary Analysis', 'Digital Content Creation', 'Critical Theory', 'Research Methods'],
      price: '£9,500/year',
      link: 'https://www.oxford.edu/literature-digital-media',
      image: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      teacherId: 7
    }
  ];

  const categories = ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'AI Tools', 'Business Strategy', 'Research', 'Writing'];
  const subjects = ['Machine Learning', 'Deep Learning', 'Physics', 'Mathematics', 'English Literature', 'Quantum Computing', 'Natural Language Processing', 'Statistics'];
  
  // Filter courses based on search and active filters
  const filteredCourses = courses.filter(course => {
    // Search filter
    if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !course.provider.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !course.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Category filter
    if (activeCategory !== 'all' && !course.category.includes(activeCategory)) {
      return false;
    }
    
    // Level filter
    if (activeLevel !== 'all' && course.level !== activeLevel) {
      return false;
    }
    
    // Type filter
    if (activeType !== 'all' && course.type !== activeType) {
      return false;
    }
    
    return true;
  });

  // Filter teachers based on search and subject
  const filteredTeachers = teachers.filter(teacher => {
    // Search filter
    if (searchQuery && !teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !teacher.university.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !teacher.position.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !teacher.shortBio.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Subject filter
    if (activeSubject !== 'all' && !teacher.subjects.includes(activeSubject)) {
      return false;
    }
    
    return true;
  });

  // Get courses for a specific teacher
  const getTeacherCourses = (teacherId: number) => {
    return courses.filter(course => course.teacherId === teacherId);
  };

  // Toggle favorite teacher
  const toggleFavorite = (teacherId: number) => {
    if (favoriteTeachers.includes(teacherId)) {
      setFavoriteTeachers(favoriteTeachers.filter(id => id !== teacherId));
    } else {
      setFavoriteTeachers([...favoriteTeachers, teacherId]);
    }
  };

  // Helper to render star ratings
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, index) => (
      <IconComponent 
        icon={FaStar}
        key={index} 
        className={`${index < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'} ${
          index === Math.floor(rating) && rating % 1 > 0 ? 'text-yellow-200' : ''
        }`} 
      />
    ));
  };
  
  // Get appropriate icon for course type
  const getCourseTypeIcon = (type: string) => {
    switch (type) {
      case 'university':
        return <IconComponent icon={FaUniversity} className="text-teal-600" />;
      case 'certification':
        return <IconComponent icon={FaCertificate} className="text-blue-600" />;
      case 'tutorial':
        return <IconComponent icon={FaLaptopCode} className="text-orange-500" />;
      default:
        return <IconComponent icon={FaGraduationCap} className="text-gray-600" />;
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const filterButtonVariants = {
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.95
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <motion.section 
          className="bg-gradient-to-r from-teal-700 to-teal-900 text-white py-12 relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated background elements */}
          <motion.div 
            className="absolute w-96 h-96 bg-teal-600 rounded-full opacity-10" 
            style={{ filter: 'blur(80px)', top: '-10%', right: '5%' }}
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          <motion.div 
            className="absolute w-64 h-64 bg-orange-500 rounded-full opacity-10" 
            style={{ filter: 'blur(60px)', bottom: '-5%', left: '10%' }}
            animate={{
              scale: [1, 1.1, 1],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <motion.h1 
                className="text-4xl font-bold mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                AI Education Courses
              </motion.h1>
              <motion.p 
                className="text-xl mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Explore top university AI programs, online certifications, and practical tutorials to 
                master artificial intelligence and enhance your applications.
              </motion.p>
              <motion.div 
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <input
                  type="text"
                  placeholder="Search AI courses, programs and tutorials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-3 pr-12 bg-white rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <IconComponent icon={FaSearch} className="absolute right-4 top-3.5 text-gray-500" />
              </motion.div>

              {/* Display Mode Toggle */}
              <motion.div 
                className="mt-6 flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="bg-teal-800 bg-opacity-50 rounded-full p-1 flex">
                  <button
                    onClick={() => setShowMode('courses')}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                      showMode === 'courses'
                        ? 'bg-white text-teal-800'
                        : 'text-white hover:bg-teal-600 hover:bg-opacity-50'
                    }`}
                  >
                    Courses
                  </button>
                  <button
                    onClick={() => setShowMode('teachers')}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                      showMode === 'teachers'
                        ? 'bg-white text-teal-800'
                        : 'text-white hover:bg-teal-600 hover:bg-opacity-50'
                    }`}
                  >
                    <IconComponent icon={FaChalkboardTeacher} className="text-xs" />
                    Teachers
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            {/* Featured Courses */}
            {showMode === 'courses' && (
              <motion.div 
                className="mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-teal-800 mb-6">Featured Programs</h2>
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {courses.filter(course => course.featured).map(course => (
                    <motion.div 
                      key={course.id} 
                      className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 flex flex-col md:flex-row"
                      variants={itemVariants}
                      whileHover={{ 
                        y: -5,
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="md:w-1/3 overflow-hidden">
                        <motion.img 
                          src={course.image} 
                          alt={course.title}
                          className="h-full w-full object-cover" 
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <div className="md:w-2/3 p-6">
                        <div className="flex items-center gap-2 mb-2">
                          {getCourseTypeIcon(course.type)}
                          <span className="text-sm font-medium text-gray-600">{course.provider}</span>
                        </div>
                        <h3 className="text-xl font-bold text-teal-800 mb-2">{course.title}</h3>
                        <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex gap-1">
                            {renderStars(course.rating)}
                          </div>
                          <span className="text-sm text-gray-600">{course.rating} ({course.ratingCount.toLocaleString()} ratings)</span>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex gap-2">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                              {course.level}
                            </span>
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                              {course.duration}
                            </span>
                          </div>
                          <a
                            href={course.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                          >
                            Learn More
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* Featured Teachers */}
            {showMode === 'teachers' && (
              <motion.div 
                className="mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-teal-800 mb-6">Featured Teachers</h2>
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {teachers.filter(teacher => teacher.featured).map(teacher => (
                    <motion.div 
                      key={teacher.id} 
                      className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 flex flex-col"
                      variants={itemVariants}
                      whileHover={{ 
                        y: -5,
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative p-6 pt-0 flex-grow flex flex-col">
                        <div className="flex justify-center -mt-12 mb-4">
                          <motion.img 
                            src={teacher.avatar} 
                            alt={teacher.name}
                            className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover" 
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <div className="absolute top-3 right-3">
                          <button 
                            onClick={() => toggleFavorite(teacher.id)}
                            className="text-gray-400 hover:text-yellow-500 transition-colors"
                          >
                            <IconComponent 
                              icon={favoriteTeachers.includes(teacher.id) ? FaBookmark : FaRegBookmark} 
                              className={favoriteTeachers.includes(teacher.id) ? "text-yellow-500" : ""} 
                            />
                          </button>
                        </div>
                        <h3 className="text-xl font-bold text-teal-800 mb-1 text-center">{teacher.name}</h3>
                        <p className="text-gray-600 text-sm mb-2 text-center">{teacher.position}</p>
                        <p className="text-gray-600 text-sm mb-3 text-center">{teacher.university}</p>
                        
                        <div className="flex flex-wrap justify-center gap-1 mb-3">
                          {teacher.subjects.map((subject, index) => (
                            <span key={index} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                              {subject}
                            </span>
                          ))}
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4 text-center">{teacher.shortBio}</p>
                        
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <div className="flex gap-1">
                            {renderStars(teacher.rating)}
                          </div>
                          <span className="text-sm text-gray-600">{teacher.rating} ({teacher.ratingCount.toLocaleString()})</span>
                        </div>
                        
                        <div className="mt-auto flex flex-col gap-2">
                          <button
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setShowTeacherModal(true);
                            }}
                            className="bg-teal-500 hover:bg-teal-600 text-white text-center py-2 rounded-lg transition-colors"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => {
                              // Navigate to teacher's courses
                              setShowMode('courses');
                              // You would filter courses by teacher here
                            }}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-center py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            View Courses ({getTeacherCourses(teacher.id).length})
                            <IconComponent icon={FaChevronRight} className="text-xs" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
            
            {/* Filter options */}
            <div className="mb-8">
              {showMode === 'courses' && (
                <div className="flex flex-wrap gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Type</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setActiveType('all')}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          activeType === 'all'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        All Types
                      </button>
                      <button
                        onClick={() => setActiveType('university')}
                        className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                          activeType === 'university'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <IconComponent icon={FaUniversity} className="text-xs" /> University Programs
                      </button>
                      <button
                        onClick={() => setActiveType('certification')}
                        className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                          activeType === 'certification'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <IconComponent icon={FaCertificate} className="text-xs" /> Certifications
                      </button>
                      <button
                        onClick={() => setActiveType('tutorial')}
                        className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                          activeType === 'tutorial'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <IconComponent icon={FaLaptopCode} className="text-xs" /> Tutorials
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setActiveLevel('all')}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          activeLevel === 'all'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        All Levels
                      </button>
                      <button
                        onClick={() => setActiveLevel('Beginner')}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          activeLevel === 'Beginner'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Beginner
                      </button>
                      <button
                        onClick={() => setActiveLevel('Intermediate')}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          activeLevel === 'Intermediate'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Intermediate
                      </button>
                      <button
                        onClick={() => setActiveLevel('Advanced')}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          activeLevel === 'Advanced'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Advanced
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setActiveCategory('all')}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          activeCategory === 'all'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        All Categories
                      </button>
                      {categories.map(category => (
                        <button
                          key={category}
                          onClick={() => setActiveCategory(category)}
                          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                            activeCategory === category
                              ? 'bg-teal-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          <IconComponent icon={FaTag} className="text-xs" /> {category}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Teacher Filters */}
              {showMode === 'teachers' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Areas</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveSubject('all')}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        activeSubject === 'all'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      All Subjects
                    </button>
                    {subjects.map(subject => (
                      <button
                        key={subject}
                        onClick={() => setActiveSubject(subject)}
                        className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                          activeSubject === subject
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <IconComponent icon={FaGraduationCap} className="text-xs" /> {subject}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Course listing */}
            {showMode === 'courses' && filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map(course => (
                  <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 flex flex-col">
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={course.image} 
                        alt={course.title} 
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                      />
                    </div>
                    <div className="p-6 flex-grow flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        {getCourseTypeIcon(course.type)}
                        <span className="text-sm font-medium text-gray-600">{course.provider}</span>
                      </div>
                      <h3 className="text-lg font-bold text-teal-800 mb-2">{course.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{course.description}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {course.category.slice(0, 3).map((cat, index) => (
                          <span key={index} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                            {cat}
                          </span>
                        ))}
                        {course.category.length > 3 && (
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                            +{course.category.length - 3} more
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-1">
                          {renderStars(course.rating)}
                        </div>
                        <span className="text-xs text-gray-600">{course.rating}</span>
                      </div>
                      
                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <div className="flex gap-2">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {course.level}
                          </span>
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {course.duration}
                          </span>
                        </div>
                        {course.price && (
                          <span className="text-sm font-medium text-teal-700">
                            {course.price}
                          </span>
                        )}
                      </div>
                      
                      <a
                        href={course.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 bg-orange-500 hover:bg-orange-600 text-white text-center py-2 rounded-lg transition-colors"
                      >
                        View Details
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <IconComponent icon={FaRobot} className="text-5xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No courses match your criteria</h3>
                <p className="text-gray-600">Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>
        </section>

        {/* Why learn AI section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-teal-800 mb-2">Why Learn AI?</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Artificial Intelligence is transforming industries and creating new opportunities. 
                Here's why building AI skills is essential for your future.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mb-4">
                  <IconComponent icon={FaGraduationCap} className="text-xl" />
                </div>
                <h3 className="text-lg font-bold text-teal-800 mb-2">Career Opportunities</h3>
                <p className="text-gray-600">
                  AI specialists are among the highest-paid professionals in tech, with demand far exceeding supply. 
                  Companies across all industries are seeking AI talent.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-4">
                  <IconComponent icon={FaRobot} className="text-xl" />
                </div>
                <h3 className="text-lg font-bold text-teal-800 mb-2">Future-Proof Skills</h3>
                <p className="text-gray-600">
                  As AI continues to evolve, understanding these technologies will be essential for staying 
                  competitive in virtually every field, from medicine to business.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                  <IconComponent icon={FaLaptopCode} className="text-xl" />
                </div>
                <h3 className="text-lg font-bold text-teal-800 mb-2">Problem-Solving Power</h3>
                <p className="text-gray-600">
                  AI offers powerful tools to tackle complex challenges—from climate change to healthcare. Learning AI 
                  empowers you to create solutions with global impact.
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

export default AICourses; 