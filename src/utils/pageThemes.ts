export interface PageTheme {
  name: string;
  gradient: string;
  footerBg: string;
  footerAccent: string;
  footerSecondary: string;
  animationClass: string;
}

export const pageThemes: Record<string, PageTheme> = {
  '/': {
    name: 'Home',
    gradient: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600',
    footerBg: 'bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900',
    footerAccent: 'bg-emerald-800',
    footerSecondary: 'bg-orange-500',
    animationClass: 'animate-gradient-x'
  },
  '/database': {
    name: 'Database',
    gradient: 'bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-700',
    footerBg: 'bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900',
    footerAccent: 'bg-purple-800',
    footerSecondary: 'bg-pink-500',
    animationClass: 'animate-gradient-xy'
  },
  '/case-studies': {
    name: 'Success Stories',
    gradient: 'bg-gradient-to-br from-blue-400 via-teal-500 to-cyan-600',
    footerBg: 'bg-gradient-to-br from-blue-900 via-teal-900 to-cyan-900',
    footerAccent: 'bg-blue-800',
    footerSecondary: 'bg-orange-500',
    animationClass: 'animate-gradient-radial'
  },
  '/ai-courses': {
    name: 'AI Courses',
    gradient: 'bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700',
    footerBg: 'bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900',
    footerAccent: 'bg-violet-800',
    footerSecondary: 'bg-yellow-500',
    animationClass: 'animate-gradient-wave'
  },
  '/ai-study': {
    name: 'AI Study',
    gradient: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600',
    footerBg: 'bg-gradient-to-br from-cyan-900 via-blue-900 to-indigo-900',
    footerAccent: 'bg-cyan-800',
    footerSecondary: 'bg-green-500',
    animationClass: 'animate-gradient-pulse'
  },
  '/resources': {
    name: 'Resources',
    gradient: 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-600',
    footerBg: 'bg-gradient-to-br from-amber-900 via-orange-900 to-red-900',
    footerAccent: 'bg-amber-800',
    footerSecondary: 'bg-blue-500',
    animationClass: 'animate-gradient-diagonal'
  },
  '/blog': {
    name: 'Blog',
    gradient: 'bg-gradient-to-br from-fuchsia-400 via-purple-500 to-violet-600',
    footerBg: 'bg-gradient-to-br from-fuchsia-900 via-purple-900 to-violet-900',
    footerAccent: 'bg-fuchsia-800',
    footerSecondary: 'bg-cyan-500',
    animationClass: 'animate-gradient-x'
  },
  '/courses': {
    name: 'Courses',
    gradient: 'bg-gradient-to-br from-lime-400 via-green-500 to-emerald-600',
    footerBg: 'bg-gradient-to-br from-lime-900 via-green-900 to-emerald-900',
    footerAccent: 'bg-lime-800',
    footerSecondary: 'bg-purple-500',
    animationClass: 'animate-gradient-bounce'
  },
  '/scholarships': {
    name: 'Scholarships',
    gradient: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600',
    footerBg: 'bg-gradient-to-br from-yellow-900 via-amber-900 to-orange-900',
    footerAccent: 'bg-yellow-800',
    footerSecondary: 'bg-red-500',
    animationClass: 'animate-gradient-float'
  },
  '/application-tracker': {
    name: 'Application Tracker',
    gradient: 'bg-gradient-to-br from-slate-400 via-gray-500 to-zinc-600',
    footerBg: 'bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900',
    footerAccent: 'bg-slate-800',
    footerSecondary: 'bg-blue-500',
    animationClass: 'animate-gradient-slide'
  },
  '/profile': {
    name: 'Profile',
    gradient: 'bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-600',
    footerBg: 'bg-gradient-to-br from-teal-900 via-cyan-900 to-blue-900',
    footerAccent: 'bg-teal-800',
    footerSecondary: 'bg-orange-500',
    animationClass: 'animate-gradient-flow'
  }
};

export const getPageTheme = (pathname: string): PageTheme => {
  // Check for exact matches first
  if (pageThemes[pathname]) {
    return pageThemes[pathname];
  }
  
  // Check for partial matches
  for (const [path, theme] of Object.entries(pageThemes)) {
    if (pathname.startsWith(path) && path !== '/') {
      return theme;
    }
  }
  
  // Default to home theme
  return pageThemes['/'];
};

export const getFooterTheme = (pathname: string) => {
  const theme = getPageTheme(pathname);
  return {
    bg: theme.footerBg,
    accent: theme.footerAccent,
    secondary: theme.footerSecondary
  };
}; 