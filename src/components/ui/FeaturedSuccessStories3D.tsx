import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Torus, Text, Float, OrbitControls } from '@react-three/drei';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FaTrophy, FaGraduationCap, FaMapMarkerAlt, FaCalendarAlt, FaDollarSign, FaStar } from 'react-icons/fa';
import IconComponent from './IconComponent';
import * as THREE from 'three';

interface SuccessStory {
  id: string;
  title: string;
  studentName: string;
  studentImage: string;
  university: string;
  country: string;
  program: string;
  scholarshipAmount: number;
  year: number;
  outcome: string;
  featured: boolean;
}

// 3D Success Ring Component
const SuccessRing3D: React.FC<{ story: SuccessStory; position: [number, number, number] }> = ({ story, position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.3;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.8} floatIntensity={1}>
      <Torus
        ref={meshRef}
        args={[1, 0.3, 16, 100]}
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={hovered ? '#FFD700' : '#F59E0B'}
          metalness={0.9}
          roughness={0.1}
          emissive={hovered ? '#FFD700' : '#F59E0B'}
          emissiveIntensity={hovered ? 0.3 : 0.1}
        />
      </Torus>
      <Text
        position={[position[0], position[1] + 2, position[2]]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
      >
        {story.studentName}
      </Text>
    </Float>
  );
};

// Sample success stories data
const sampleStories: SuccessStory[] = [
  {
    id: '1',
    title: 'From Dreams to MIT Reality',
    studentName: 'Sarah Chen',
    studentImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
    university: 'Massachusetts Institute of Technology',
    country: 'United States',
    program: 'Computer Science',
    scholarshipAmount: 75000,
    year: 2024,
    outcome: 'Full Scholarship',
    featured: true
  },
  {
    id: '2',
    title: 'Engineering Excellence at Oxford',
    studentName: 'Ahmed Hassan',
    studentImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    university: 'University of Oxford',
    country: 'United Kingdom',
    program: 'Engineering Science',
    scholarshipAmount: 60000,
    year: 2024,
    outcome: 'Rhodes Scholarship',
    featured: true
  },
  {
    id: '3',
    title: 'Medical Dreams Come True',
    studentName: 'Maria Rodriguez',
    studentImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
    university: 'Harvard Medical School',
    country: 'United States',
    program: 'Medicine',
    scholarshipAmount: 85000,
    year: 2023,
    outcome: 'Merit Scholarship',
    featured: true
  }
];

const FeaturedSuccessStories3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [75, -75]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section ref={containerRef} className="py-20 bg-gradient-to-br from-amber-900 via-orange-900 to-red-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-60 right-10 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
      </div>

      <motion.div 
        className="container mx-auto px-4 relative z-10"
        style={{ y, opacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Success Stories
          </h2>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            Inspiring journeys of students who achieved their dreams with our guidance
          </p>
        </motion.div>

        {/* 3D Scene */}
        <div className="h-96 mb-16">
          <Canvas 
            camera={{ position: [0, 0, 8], fov: 75 }}
            gl={{ antialias: true, alpha: true }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={1.2} />
            <pointLight position={[-10, -10, -10]} color="#FFD700" intensity={0.8} />
            <pointLight position={[10, -10, -10]} color="#F59E0B" intensity={0.6} />
            
            {sampleStories.map((story, index) => (
              <SuccessRing3D
                key={story.id}
                story={story}
                position={[(index - 1) * 3, 0, 0]}
              />
            ))}
            
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
          </Canvas>
        </div>

        {/* Success Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sampleStories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -15,
                scale: 1.03,
                rotateY: 8
              }}
              className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:border-yellow-400/50 transition-all duration-500"
            >
              {/* Student Image */}
              <div className="relative overflow-hidden h-64">
                <img
                  src={story.studentImage}
                  alt={story.studentName}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                
                {/* Featured Badge */}
                {story.featured && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <IconComponent icon={FaTrophy} className="text-xs" />
                    Featured
                  </div>
                )}

                {/* Scholarship Amount */}
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <IconComponent icon={FaDollarSign} className="text-xs" />
                  {story.scholarshipAmount.toLocaleString()}
                </div>

                {/* Student Name Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {story.studentName}
                  </h3>
                  <p className="text-yellow-300 font-medium">
                    {story.outcome}
                  </p>
                </div>

                {/* Hover Trophy Icon */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  whileHover={{ scale: 1.2, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="bg-yellow-500/20 backdrop-blur-sm rounded-full p-4 border border-yellow-400/50">
                    <IconComponent icon={FaTrophy} className="text-yellow-400 text-3xl" />
                  </div>
                </motion.div>
              </div>

              {/* Story Content */}
              <div className="p-6">
                <h4 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-300 transition-colors">
                  {story.title}
                </h4>

                {/* University Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <IconComponent icon={FaGraduationCap} className="text-yellow-400" />
                    <span className="text-sm">{story.university}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <IconComponent icon={FaMapMarkerAlt} className="text-orange-400" />
                    <span className="text-sm">{story.country}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <IconComponent icon={FaCalendarAlt} className="text-red-400" />
                    <span className="text-sm">{story.program} • {story.year}</span>
                  </div>
                </div>

                {/* Success Metrics */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      ${(story.scholarshipAmount / 1000).toFixed(0)}K
                    </div>
                    <div className="text-xs text-gray-400">Scholarship</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400 flex items-center justify-center gap-1">
                      <IconComponent icon={FaStar} />
                      5.0
                    </div>
                    <div className="text-xs text-gray-400">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {story.year}
                    </div>
                    <div className="text-xs text-gray-400">Year</div>
                  </div>
                </div>

                {/* Read More Button */}
                <motion.button
                  className="w-full mt-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg hover:shadow-yellow-500/25 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Read Full Story
                </motion.button>
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-orange-500/0 to-red-500/0 group-hover:from-yellow-500/10 group-hover:via-orange-500/10 group-hover:to-red-500/10 transition-all duration-500 pointer-events-none"></div>
            </motion.div>
          ))}
        </div>

        {/* View All Stories Button */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.button
            className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(245, 158, 11, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            <IconComponent icon={FaTrophy} className="inline mr-2" />
            View All Success Stories
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default FeaturedSuccessStories3D; 