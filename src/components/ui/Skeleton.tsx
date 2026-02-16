import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'rectangular' | 'text';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'shimmer' | 'wave';
  dark?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'default',
  width,
  height,
  animation = 'shimmer',
  dark = false
}) => {
  const baseClasses = dark ? 'bg-white/5' : 'bg-gray-200 dark:bg-white/5';
  
  const variantClasses = {
    default: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    text: 'rounded h-4'
  };

  const animationClasses = {
    pulse: 'animate-skeleton-pulse',
    shimmer: dark ? 'animate-skeleton-shimmer-dark' : 'animate-skeleton-shimmer dark:animate-skeleton-shimmer-dark',
    wave: dark ? 'animate-skeleton-shimmer-dark' : 'animate-skeleton-shimmer dark:animate-skeleton-shimmer-dark'
  };

  const style = {
    width: width,
    height: height
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// University Card Skeleton for Database page
export const UniversityCardSkeleton: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  if (isMobile) {
      return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 h-full flex flex-col">
      <div className="h-24 bg-gray-200 animate-skeleton-shimmer flex justify-center items-center relative">
        <div className="h-16 w-16 bg-gray-300 animate-skeleton-shimmer rounded-lg"></div>
        <div className="absolute top-2 right-2 h-6 w-6 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
        <div className="absolute top-2 left-2 h-5 w-8 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
      </div>
        
        <div className="p-3 flex flex-col flex-grow">
          <div className="h-4 bg-gray-300 animate-skeleton-shimmer rounded mb-2"></div>
          <div className="h-3 bg-gray-300 animate-skeleton-shimmer rounded w-3/4 mb-2"></div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            <div className="h-5 w-16 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
            <div className="h-5 w-20 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
            <div className="h-5 w-12 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
          </div>
          
          <div className="text-xs mb-4 space-y-1">
            <div className="flex justify-between">
              <div className="h-3 w-12 bg-gray-300 animate-skeleton-shimmer rounded"></div>
              <div className="h-3 w-16 bg-gray-300 animate-skeleton-shimmer rounded"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-3 w-8 bg-gray-300 animate-skeleton-shimmer rounded"></div>
              <div className="h-3 w-14 bg-gray-300 animate-skeleton-shimmer rounded"></div>
            </div>
          </div>
          
          <div className="space-y-2 mt-auto">
            <div className="h-8 bg-gray-300 animate-skeleton-shimmer rounded-lg"></div>
            <div className="h-8 bg-gray-300 animate-skeleton-shimmer rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 h-full flex flex-col">
      <div className="h-36 bg-gray-200 animate-skeleton-shimmer flex justify-center items-center relative">
        <div className="h-24 w-24 bg-gray-300 animate-skeleton-shimmer rounded-lg"></div>
        <div className="absolute top-2 right-2 h-8 w-8 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
        <div className="absolute top-2 left-2 h-6 w-12 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="h-5 bg-gray-300 animate-skeleton-shimmer rounded mb-2"></div>
        <div className="h-4 bg-gray-300 animate-skeleton-shimmer rounded w-3/4 mb-2"></div>
        
        <div className="flex flex-wrap gap-1 mb-3">
          <div className="h-6 w-20 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
          <div className="h-6 w-24 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
          <div className="h-6 w-16 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
        </div>
        
        <div className="text-xs mb-4 space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-16 bg-gray-300 animate-skeleton-shimmer rounded"></div>
            <div className="h-3 w-20 bg-gray-300 animate-skeleton-shimmer rounded"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-3 w-12 bg-gray-300 animate-skeleton-shimmer rounded"></div>
            <div className="h-3 w-18 bg-gray-300 animate-skeleton-shimmer rounded"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-3 w-20 bg-gray-300 animate-skeleton-shimmer rounded"></div>
            <div className="h-3 w-14 bg-gray-300 animate-skeleton-shimmer rounded"></div>
          </div>
        </div>
        
        <div className="space-y-2 mt-auto">
          <div className="h-10 bg-gray-300 animate-skeleton-shimmer rounded-lg"></div>
          <div className="h-10 bg-gray-300 animate-skeleton-shimmer rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

// University List Item Skeleton
export const UniversityListSkeleton: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  if (isMobile) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex p-3">
          <div className="flex-shrink-0 mr-3">
            <div className="bg-gray-300 animate-skeleton-shimmer rounded-lg h-12 w-12"></div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <div className="h-4 bg-gray-300 animate-skeleton-shimmer rounded w-2/3"></div>
              <div className="h-4 w-8 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
            </div>
            
            <div className="h-3 bg-gray-300 animate-skeleton-shimmer rounded w-1/2 mb-2"></div>
            
            <div className="space-y-1 mb-2">
              <div className="h-3 bg-gray-300 animate-skeleton-shimmer rounded w-full"></div>
              <div className="h-3 bg-gray-300 animate-skeleton-shimmer rounded w-3/4"></div>
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <div className="h-6 w-12 bg-gray-300 animate-skeleton-shimmer rounded"></div>
              <div className="h-6 w-16 bg-gray-300 animate-skeleton-shimmer rounded"></div>
              <div className="h-6 w-12 bg-gray-300 animate-skeleton-shimmer rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex p-4 gap-4">
        <div className="w-24 flex justify-center">
          <div className="bg-gray-300 animate-skeleton-shimmer rounded-lg h-20 w-20"></div>
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <div className="h-5 bg-gray-300 animate-skeleton-shimmer rounded w-1/3"></div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-16 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
              <div className="h-4 w-24 bg-gray-300 animate-skeleton-shimmer rounded"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
            <div className="h-3 bg-gray-300 animate-skeleton-shimmer rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 animate-skeleton-shimmer rounded w-2/3"></div>
            <div className="h-3 bg-gray-300 animate-skeleton-shimmer rounded w-4/5"></div>
            <div className="h-3 bg-gray-300 animate-skeleton-shimmer rounded w-1/2"></div>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            <div className="h-6 w-16 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
            <div className="h-6 w-20 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
            <div className="h-6 w-18 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-8 w-24 bg-gray-300 animate-skeleton-shimmer rounded-lg"></div>
            <div className="h-8 w-32 bg-gray-300 animate-skeleton-shimmer rounded-lg"></div>
            <div className="h-8 w-28 bg-gray-300 animate-skeleton-shimmer rounded-lg"></div>
            <div className="h-4 w-20 bg-gray-300 animate-skeleton-shimmer rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Course Card Skeleton
export const CourseCardSkeleton: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 h-full flex flex-col ${isMobile ? 'h-64' : 'h-80'}`}>
      <div className={`${isMobile ? 'h-32' : 'h-48'} bg-gray-200 animate-skeleton-shimmer relative`}>
        <div className="absolute top-2 right-2 h-6 w-16 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
        <div className="absolute bottom-2 left-2 h-4 w-12 bg-gray-300 animate-skeleton-shimmer rounded"></div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className={`${isMobile ? 'h-4' : 'h-5'} bg-gray-300 animate-skeleton-shimmer rounded mb-2`}></div>
        <div className={`${isMobile ? 'h-3' : 'h-4'} bg-gray-300 animate-skeleton-shimmer rounded w-3/4 mb-3`}></div>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
          <div className="h-3 bg-gray-300 animate-skeleton-shimmer rounded w-20"></div>
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <div className="h-4 bg-gray-300 animate-skeleton-shimmer rounded w-16"></div>
          <div className="h-4 bg-gray-300 animate-skeleton-shimmer rounded w-12"></div>
        </div>
        
        <div className="mt-auto">
          <div className={`${isMobile ? 'h-8' : 'h-10'} bg-gray-300 animate-skeleton-shimmer rounded-lg`}></div>
        </div>
      </div>
    </div>
  );
};

// Resource Card Skeleton
export const ResourceCardSkeleton: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 h-full flex flex-col ${isMobile ? 'h-56' : 'h-72'}`}>
      <div className={`${isMobile ? 'h-28' : 'h-40'} bg-gray-200 animate-skeleton-shimmer relative`}>
        <div className="absolute top-2 right-2 h-6 w-6 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
        <div className="absolute bottom-2 left-2 h-4 w-16 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className={`${isMobile ? 'h-4' : 'h-5'} bg-gray-300 animate-skeleton-shimmer rounded mb-2`}></div>
        <div className={`${isMobile ? 'h-3' : 'h-4'} bg-gray-300 animate-skeleton-shimmer rounded w-4/5 mb-3`}></div>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-4 bg-gray-300 animate-skeleton-shimmer rounded"></div>
          <div className="h-3 bg-gray-300 animate-skeleton-shimmer rounded w-24"></div>
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <div className="h-3 bg-gray-300 animate-skeleton-shimmer rounded w-20"></div>
          <div className="h-3 bg-gray-300 animate-skeleton-shimmer rounded w-16"></div>
        </div>
        
        <div className="mt-auto">
          <div className={`${isMobile ? 'h-8' : 'h-10'} bg-gray-300 animate-skeleton-shimmer rounded-lg`}></div>
        </div>
      </div>
    </div>
  );
};

// Blog Card Skeleton
export const BlogCardSkeleton: React.FC<{ isMobile?: boolean; dark?: boolean }> = ({ isMobile = false, dark = false }) => {
  const baseBg = dark ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-gray-100';
  const shimmerBase = dark ? 'bg-white/5' : 'bg-gray-200';
  const shimmerHighlight = dark ? 'bg-white/10' : 'bg-gray-300';

  return (
    <div className={`${baseBg} rounded-xl shadow-lg overflow-hidden border h-full flex flex-col ${isMobile ? 'h-64' : 'h-80'}`}>
      <div className={`${isMobile ? 'h-32' : 'h-48'} ${shimmerBase} animate-skeleton-shimmer relative`}>
        <div className={`absolute top-2 right-2 h-6 w-16 ${shimmerHighlight} animate-skeleton-shimmer rounded-full`}></div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className={`${isMobile ? 'h-4' : 'h-5'} ${shimmerHighlight} animate-skeleton-shimmer rounded mb-2`}></div>
        <div className={`${isMobile ? 'h-3' : 'h-4'} ${shimmerHighlight} animate-skeleton-shimmer rounded w-4/5 mb-3`}></div>
        
        <div className="flex items-center gap-2 mb-3">
          <div className={`h-6 w-6 ${shimmerHighlight} animate-skeleton-shimmer rounded-full`}></div>
          <div className={`h-3 ${shimmerHighlight} animate-skeleton-shimmer rounded w-20`}></div>
          <div className={`h-3 ${shimmerHighlight} animate-skeleton-shimmer rounded w-16`}></div>
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <div className={`h-3 ${shimmerHighlight} animate-skeleton-shimmer rounded w-24`}></div>
          <div className={`h-3 ${shimmerHighlight} animate-skeleton-shimmer rounded w-16`}></div>
        </div>
        
        <div className="mt-auto">
          <div className={`${isMobile ? 'h-8' : 'h-10'} ${shimmerHighlight} animate-skeleton-shimmer rounded-lg`}></div>
        </div>
      </div>
    </div>
  );
};

// AI Analysis Skeleton
export const AIAnalysisSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {/* Academic Strength Card */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 sm:p-6">
        <div className="flex items-center mb-4">
          <div className="h-6 w-6 bg-blue-300 animate-skeleton-shimmer rounded mr-2"></div>
          <div className="h-5 bg-blue-300 animate-skeleton-shimmer rounded w-32"></div>
        </div>
        <div className="h-8 bg-blue-300 animate-skeleton-shimmer rounded w-16 mb-2"></div>
        <div className="w-full bg-blue-200 animate-skeleton-shimmer rounded-full h-3 mb-2"></div>
        <div className="h-4 bg-blue-300 animate-skeleton-shimmer rounded w-3/4"></div>
      </div>

      {/* Budget Analysis Card */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 sm:p-6">
        <div className="flex items-center mb-4">
          <div className="h-6 w-6 bg-green-300 animate-skeleton-shimmer rounded mr-2"></div>
          <div className="h-5 bg-green-300 animate-skeleton-shimmer rounded w-28"></div>
        </div>
        <div className="h-6 bg-green-300 animate-skeleton-shimmer rounded w-24 mb-2"></div>
        <div className="h-4 bg-green-300 animate-skeleton-shimmer rounded w-full mb-3"></div>
        <div className="h-4 bg-green-300 animate-skeleton-shimmer rounded w-2/3"></div>
      </div>

      {/* Recommended Regions Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 sm:p-6">
        <div className="flex items-center mb-4">
          <div className="h-6 w-6 bg-indigo-300 animate-skeleton-shimmer rounded mr-2"></div>
          <div className="h-5 bg-indigo-300 animate-skeleton-shimmer rounded w-36"></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-20 bg-indigo-300 animate-skeleton-shimmer rounded-full"></div>
          <div className="h-6 w-16 bg-indigo-300 animate-skeleton-shimmer rounded-full"></div>
          <div className="h-6 w-24 bg-indigo-300 animate-skeleton-shimmer rounded-full"></div>
        </div>
      </div>

      {/* Suggestions Card */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 sm:p-6">
        <div className="flex items-center mb-4">
          <div className="h-6 w-6 bg-purple-300 animate-skeleton-shimmer rounded mr-2"></div>
          <div className="h-5 bg-purple-300 animate-skeleton-shimmer rounded w-24"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-purple-300 animate-skeleton-shimmer rounded w-full"></div>
          <div className="h-4 bg-purple-300 animate-skeleton-shimmer rounded w-4/5"></div>
          <div className="h-4 bg-purple-300 animate-skeleton-shimmer rounded w-3/4"></div>
          <div className="h-4 bg-purple-300 animate-skeleton-shimmer rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
};

// Recommendations Skeleton
export const RecommendationsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="bg-white rounded-lg p-2 mr-3">
              <div className="h-12 w-12 bg-gray-300 animate-skeleton-shimmer rounded"></div>
            </div>
            <div className="flex-1">
              <div className="h-5 bg-gray-300 animate-skeleton-shimmer rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-300 animate-skeleton-shimmer rounded w-1/2"></div>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-300 animate-skeleton-shimmer rounded w-20"></div>
              <div className="h-4 bg-gray-300 animate-skeleton-shimmer rounded w-12"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-300 animate-skeleton-shimmer rounded w-16"></div>
              <div className="h-4 bg-gray-300 animate-skeleton-shimmer rounded w-20"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-300 animate-skeleton-shimmer rounded w-18"></div>
              <div className="h-4 bg-gray-300 animate-skeleton-shimmer rounded w-8"></div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-4">
            <div className="h-5 w-16 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
            <div className="h-5 w-20 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
            <div className="h-5 w-14 bg-gray-300 animate-skeleton-shimmer rounded-full"></div>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1 h-8 bg-gray-300 animate-skeleton-shimmer rounded-lg"></div>
            <div className="h-8 w-20 bg-gray-300 animate-skeleton-shimmer rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Home Page Skeleton Components

// Hero Section Skeleton
export const HeroSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="h-16 bg-white/20 animate-skeleton-shimmer rounded-lg mb-6 mx-auto w-3/4"></div>
          <div className="h-6 bg-white/15 animate-skeleton-shimmer rounded-lg mb-4 mx-auto w-2/3"></div>
          <div className="h-6 bg-white/15 animate-skeleton-shimmer rounded-lg mb-8 mx-auto w-1/2"></div>
          <div className="flex justify-center space-x-4">
            <div className="h-12 w-32 bg-white/20 animate-skeleton-shimmer rounded-lg"></div>
            <div className="h-12 w-32 bg-white/20 animate-skeleton-shimmer rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Featured Courses Skeleton
export const FeaturedCoursesSkeleton: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="h-12 bg-white/20 animate-skeleton-shimmer rounded-lg mb-4 mx-auto w-1/2"></div>
          <div className="h-6 bg-white/15 animate-skeleton-shimmer rounded-lg mx-auto w-2/3"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="h-48 bg-white/20 animate-skeleton-shimmer rounded-lg mb-4"></div>
              <div className="h-6 bg-white/20 animate-skeleton-shimmer rounded mb-2"></div>
              <div className="h-4 bg-white/15 animate-skeleton-shimmer rounded mb-4 w-3/4"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-white/15 animate-skeleton-shimmer rounded w-16"></div>
                <div className="h-4 bg-white/15 animate-skeleton-shimmer rounded w-20"></div>
              </div>
              <div className="h-10 bg-white/20 animate-skeleton-shimmer rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Featured Resources Skeleton
export const FeaturedResourcesSkeleton: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-green-900 via-teal-900 to-blue-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="h-12 bg-white/20 animate-skeleton-shimmer rounded-lg mb-4 mx-auto w-1/2"></div>
          <div className="h-6 bg-white/15 animate-skeleton-shimmer rounded-lg mx-auto w-2/3"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="h-32 bg-white/20 animate-skeleton-shimmer rounded-lg mb-4"></div>
              <div className="h-5 bg-white/20 animate-skeleton-shimmer rounded mb-2"></div>
              <div className="h-4 bg-white/15 animate-skeleton-shimmer rounded mb-3 w-2/3"></div>
              <div className="h-8 bg-white/20 animate-skeleton-shimmer rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Featured Success Stories Skeleton
export const FeaturedSuccessStoriesSkeleton: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="h-12 bg-white/20 animate-skeleton-shimmer rounded-lg mb-4 mx-auto w-1/2"></div>
          <div className="h-6 bg-white/15 animate-skeleton-shimmer rounded-lg mx-auto w-2/3"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center mb-4">
                <div className="h-16 w-16 bg-white/20 animate-skeleton-shimmer rounded-full mr-4"></div>
                <div className="flex-1">
                  <div className="h-5 bg-white/20 animate-skeleton-shimmer rounded mb-2"></div>
                  <div className="h-4 bg-white/15 animate-skeleton-shimmer rounded w-2/3"></div>
                </div>
              </div>
              <div className="h-4 bg-white/15 animate-skeleton-shimmer rounded mb-2"></div>
              <div className="h-4 bg-white/15 animate-skeleton-shimmer rounded mb-2 w-5/6"></div>
              <div className="h-4 bg-white/15 animate-skeleton-shimmer rounded mb-4 w-3/4"></div>
              <div className="flex items-center justify-between">
                <div className="h-4 bg-white/15 animate-skeleton-shimmer rounded w-20"></div>
                <div className="h-4 bg-white/15 animate-skeleton-shimmer rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <div className="h-12 w-48 bg-white/20 animate-skeleton-shimmer rounded-full mx-auto"></div>
        </div>
      </div>
    </section>
  );
};

// Featured Scholarships Skeleton
export const FeaturedScholarshipsSkeleton: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-yellow-900 via-indigo-900 to-red-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="h-12 bg-white/20 animate-skeleton-shimmer rounded-lg mb-4 mx-auto w-1/2"></div>
          <div className="h-6 bg-white/15 animate-skeleton-shimmer rounded-lg mx-auto w-2/3"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="h-6 bg-white/20 animate-skeleton-shimmer rounded mb-2"></div>
              <div className="h-4 bg-white/15 animate-skeleton-shimmer rounded mb-3 w-3/4"></div>
              <div className="h-8 bg-white/20 animate-skeleton-shimmer rounded mb-4 w-24"></div>
              <div className="h-4 bg-white/15 animate-skeleton-shimmer rounded mb-2"></div>
              <div className="h-4 bg-white/15 animate-skeleton-shimmer rounded mb-4 w-5/6"></div>
              <div className="h-10 bg-white/20 animate-skeleton-shimmer rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Our Impact Section Skeleton
export const OurImpactSkeleton: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="h-12 bg-white/20 animate-skeleton-shimmer rounded-lg mb-4 mx-auto w-1/3"></div>
          <div className="h-6 bg-white/15 animate-skeleton-shimmer rounded-lg mx-auto w-2/3"></div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="text-center">
              <div className="h-16 bg-white/20 animate-skeleton-shimmer rounded-lg mb-4 mx-auto w-24"></div>
              <div className="h-5 bg-white/15 animate-skeleton-shimmer rounded mx-auto w-32"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Case Studies Page Skeleton
export const CaseStudiesSkeleton: React.FC<{ viewMode?: 'grid' | 'list'; dark?: boolean }> = ({ viewMode = 'grid', dark = false }) => {
  const baseBg = dark ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-gray-100';
  const shimmerBase = dark ? 'bg-white/5' : 'bg-gray-200';
  const shimmerHighlight = dark ? 'bg-white/10' : 'bg-gray-300';
  const textColor = dark ? 'bg-white/10' : 'bg-gray-300';

  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className={`${baseBg} rounded-xl shadow-lg p-6 border`}>
            <div className="flex items-start space-x-6">
              <div className={`h-24 w-24 ${shimmerBase} animate-skeleton-shimmer rounded-lg flex-shrink-0`}></div>
              <div className="flex-1">
                <div className={`h-6 ${textColor} animate-skeleton-shimmer rounded mb-2`}></div>
                <div className={`h-4 ${textColor} animate-skeleton-shimmer rounded w-3/4 mb-3`}></div>
                <div className={`h-4 ${textColor} animate-skeleton-shimmer rounded mb-2`}></div>
                <div className={`h-4 ${textColor} animate-skeleton-shimmer rounded w-5/6 mb-4`}></div>
                <div className="flex items-center space-x-4">
                  <div className={`h-4 ${textColor} animate-skeleton-shimmer rounded w-20`}></div>
                  <div className={`h-4 ${textColor} animate-skeleton-shimmer rounded w-24`}></div>
                  <div className={`h-4 ${textColor} animate-skeleton-shimmer rounded w-16`}></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full">
        <div className={`${baseBg} rounded-xl shadow-lg overflow-hidden border h-full flex flex-col`}>
          <div className={`h-48 ${shimmerBase} animate-skeleton-shimmer`}></div>
          <div className="p-6 flex flex-col flex-grow">
            <div className={`h-6 ${textColor} animate-skeleton-shimmer rounded mb-3`}></div>
            <div className={`h-4 ${textColor} animate-skeleton-shimmer rounded w-3/4 mb-2`}></div>
            <div className={`h-4 ${textColor} animate-skeleton-shimmer rounded mb-4`}></div>
            <div className="flex items-center justify-between mb-4">
              <div className={`h-4 ${textColor} animate-skeleton-shimmer rounded w-20`}></div>
              <div className={`h-4 ${textColor} animate-skeleton-shimmer rounded w-16`}></div>
            </div>
            <div className={`h-10 ${textColor} animate-skeleton-shimmer rounded-lg mt-auto`}></div>
          </div>
        </div>
    </div>
  );
};

export default Skeleton; 