export type Language = 'en' | 'zh-CN' | 'zh-TW';

export interface Translations {
  // Header Navigation
  nav: {
    home: string;
    database: string;
    successStories: string;
    aiCourses: string;
    aiStudy: string;
    resources: string;
    blog: string;
    login: string;
    signup: string;
    signOut: string;
    profile: string;
    applicationTracker: string;
    more: string;
  };
  
  // Auth Pages
  auth: {
    login: {
      title: string;
      subtitle: string;
      welcomeBack: string;
      signInToAccount: string;
      emailLabel: string;
      passwordLabel: string;
      emailPlaceholder: string;
      passwordPlaceholder: string;
      rememberMe: string;
      forgotPassword: string;
      signInButton: string;
      orSignInWith: string;
      noAccount: string;
      createAccount: string;
      emailRequired: string;
      emailInvalid: string;
      passwordRequired: string;
      signInError: string;
    };
    signup: {
      title: string;
      subtitle: string;
      createAccount: string;
      joinMatrixEdu: string;
      nameLabel: string;
      emailLabel: string;
      passwordLabel: string;
      confirmPasswordLabel: string;
      namePlaceholder: string;
      emailPlaceholder: string;
      passwordPlaceholder: string;
      confirmPasswordPlaceholder: string;
      agreeToTerms: string;
      termsAndConditions: string;
      privacyPolicy: string;
      signUpButton: string;
      orSignUpWith: string;
      haveAccount: string;
      signIn: string;
      nameRequired: string;
      emailRequired: string;
      emailInvalid: string;
      passwordRequired: string;
      passwordMinLength: string;
      confirmPasswordRequired: string;
      passwordsNotMatch: string;
      agreeToTermsRequired: string;
      signUpError: string;
      accountCreated: string;
    };
  };
  
  // Hero Section
  hero: {
    title: string;
    subtitle: string;
    exploreButton: string;
    learnMoreButton: string;
    imageAlt: string;
  };
  
  // About Section
  about: {
    title: string;
    subtitle: string;
    description: string;
    features: {
      aiPowered: {
        title: string;
        description: string;
      };
      comprehensive: {
        title: string;
        description: string;
      };
      personalized: {
        title: string;
        description: string;
      };
    };
  };
  
  // Graduate Programs
  graduatePrograms: {
    title: string;
    subtitle: string;
    programs: {
      masters: {
        title: string;
        description: string;
      };
      phd: {
        title: string;
        description: string;
      };
      professional: {
        title: string;
        description: string;
      };
    };
    viewAllButton: string;
  };
  
  // Best Features
  bestFeatures: {
    title: string;
    features: {
      aiRecommendations: {
        title: string;
        description: string;
      };
      comprehensiveDatabase: {
        title: string;
        description: string;
      };
      successStories: {
        title: string;
        description: string;
      };
      expertGuidance: {
        title: string;
        description: string;
      };
    };
  };
  
  // Upcoming Events
  upcomingEvents: {
    title: string;
    subtitle: string;
    viewAllButton: string;
    registerButton: string;
  };
  
  // Scholarship Programs
  scholarshipPrograms: {
    title: string;
    subtitle: string;
    exploreButton: string;
    applyButton: string;
  };
  
  // Contact Form
  contactForm: {
    title: string;
    subtitle: string;
    nameLabel: string;
    emailLabel: string;
    messageLabel: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    messagePlaceholder: string;
    submitButton: string;
    successMessage: string;
    errorMessage: string;
  };
  
  // Client Feedback
  clientFeedback: {
    title: string;
    subtitle: string;
  };
  
  // Course Search
  courseSearch: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    searchButton: string;
    filterByCountry: string;
    filterByField: string;
    allCountries: string;
    allFields: string;
  };
  
  // Admission Info
  admissionInfo: {
    title: string;
    subtitle: string;
    requirements: {
      title: string;
      items: string[];
    };
    timeline: {
      title: string;
      items: {
        research: string;
        applications: string;
        interviews: string;
        decisions: string;
      };
    };
    learnMoreButton: string;
  };
  
  // Blog Section
  blogSection: {
    title: string;
    subtitle: string;
    readMoreButton: string;
    viewAllButton: string;
    readOurBlog: string;
    viewAll: string;
    author: string;
    date: string;
    category: string;
  };
  
  // NotFound Page
  notFound: {
    title: string;
    subtitle: string;
    description: string;
    returnHome: string;
  };
  
  // Newsletter
  newsletter: {
    title: string;
    subtitle: string;
    emailPlaceholder: string;
    subscribeButton: string;
    successMessage: string;
    errorMessage: string;
  };
  
  // Footer
  footer: {
    description: string;
    quickLinks: {
      title: string;
      about: string;
      courses: string;
      scholarships: string;
      blog: string;
      contact: string;
    };
    programs: {
      title: string;
      undergraduate: string;
      graduate: string;
      doctoral: string;
      professional: string;
    };
    support: {
      title: string;
      helpCenter: string;
      contactUs: string;
      faq: string;
      privacy: string;
      terms: string;
    };
    followUs: string;
    copyright: string;
  };
  
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    edit: string;
    delete: string;
    back: string;
    next: string;
    previous: string;
    close: string;
    open: string;
    search: string;
    filter: string;
    sort: string;
    viewMore: string;
    viewLess: string;
    readMore: string;
    showMore: string;
    showLess: string;
  };
  
  // Language Selector
  languageSelector: {
    title: string;
    english: string;
    simplifiedChinese: string;
    traditionalChinese: string;
  };

  // Database Page
  database: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filterButton: string;
    compareButton: string;
    viewDetails: string;
    addToCompare: string;
    removeFromCompare: string;
    noResults: string;
    loading: string;
    error: string;
    advancedFilters: string;
    sortBy: string;
    qsRanking: string;
    acceptanceRate: string;
    tuitionFee: string;
    studentPopulation: string;
    country: string;
    region: string;
    type: string;
    resetFilters: string;
    applyFilters: string;
    compareUniversities: string;
    getRecommendations: string;
    aiAnalysis: string;
    university: string;
    ranking: string;
    location: string;
    website: string;
    contact: string;
    established: string;
    programs: string;
    facilities: string;
    admissionRequirements: string;
    applicationDeadlines: string;
    scholarships: string;
    campusLife: string;
    research: string;
    alumni: string;
    advancedSearch: string;
    allCountries: string;
    allRegions: string;
    allMajors: string;
    allFields: string;
    reset: string;
    explorePrograms: string;
    topUniversities: string;
    fieldOfStudy: string;
    rankingType: string;
    qsRankingRange: string;
    admissionDifficulty: string;
    campusType: string;
    acceptanceRateFilter: string;
    showOnlyOpenApplications: string;
    rankingYear: string;
    highlyCompetitive: string;
    moderatelyCompetitive: string;
    lessCompetitive: string;
    urban: string;
    suburban: string;
    rural: string;
    small: string;
    medium: string;
    large: string;
    highlySelective: string;
    moderatelySelective: string;
    lessSelective: string;
    undergrad: string;
    graduate: string;
    campusSize: string;
    accreditation: string;
    applicationFee: string;
    fallDeadline: string;
    springDeadline: string;
    facultyCount: string;
    minGPA: string;
    testScores: string;
    languageRequirements: string;
    contactForDetails: string;
    contactUniversity: string;
    nA: string;
    rank: string;
    apply: string;
    visitWebsite: string;
    email: string;
    phone: string;
    address: string;
    remove: string;
    aiRecommended: string;
    fall: string;
    spring: string;
  };

  // Scholarships Page
  scholarships: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filterByCountry: string;
    filterByUniversity: string;
    amount: string;
    deadline: string;
    eligibility: string;
    applyNow: string;
    saveScholarship: string;
    viewDetails: string;
    noResults: string;
    loading: string;
    error: string;
  };
  
  // Blog Page
  blog: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    categories: string;
    allCategories: string;
    readMore: string;
    author: string;
    publishedOn: string;
    readTime: string;
    tags: string;
    relatedPosts: string;
    noResults: string;
    loading: string;
    error: string;
    featuredArticles: string;
    trendingTopics: string;
    recentPosts: string;
    popularPosts: string;
    searchResults: string;
    noArticlesFound: string;
    backToBlog: string;
    shareArticle: string;
    comments: string;
    leaveComment: string;
  };
  
  // Application Tracker Page
  applicationTracker: {
    title: string;
    subtitle: string;
    addApplication: string;
    editApplication: string;
    deleteApplication: string;
    confirmDelete: string;
    university: string;
    program: string;
    country: string;
    deadline: string;
    status: string;
    notes: string;
    tasks: string;
    addTask: string;
    newTask: string;
    requiredFields: string;
    filterStatus: string;
    sortBy: string;
    sortOrder: string;
    ascending: string;
    descending: string;
    allStatuses: string;
    planning: string;
    inProgress: string;
    submitted: string;
    interview: string;
    accepted: string;
    rejected: string;
    waitlisted: string;
    universityPlaceholder: string;
    programPlaceholder: string;
    countryPlaceholder: string;
    notesPlaceholder: string;
    taskPlaceholder: string;
    overview: string;
    totalApplications: string;
    submittedCount: string;
    acceptedCount: string;
    pending: string;
    noApplicationsFound: string;
    noApplicationsYet: string;
    noMatchingFilter: string;
    showAllApplications: string;
    addNewApplication: string;
    saveChanges: string;
  };
  
  // Case Studies Page
  caseStudies: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filterBy: string;
    lowGPA: string;
    international: string;
    scholarship: string;
    allStories: string;
    background: string;
    results: string;
    strategy: string;
    testimonial: string;
    gpa: string;
    testScores: string;
    extracurriculars: string;
    challenges: string;
    universitiesApplied: string;
    acceptedTo: string;
    scholarshipReceived: string;
    admitted: string;
    notAdmitted: string;
    readFullStory: string;
    successStories: string;
    lowGPAStories: string;
    internationalStories: string;
    scholarshipStories: string;
  };
  
  // ChatBot Page
  chatBot: {
    title: string;
    subtitle: string;
    backToHome: string;
    chatTitle: string;
    chatSubtitle: string;
    messagePlaceholder: string;
    sendButton: string;
    you: string;
    aiAssistant: string;
    welcomeMessage: string;
    helpMessage: string;
  };
  
  // Courses Page
  courses: {
    title: string;
    subtitle: string;
    allCourses: string;
    filterByCategory: string;
    searchPlaceholder: string;
    instructor: string;
    students: string;
    rating: string;
    price: string;
    enrollNow: string;
    viewDetails: string;
    noCoursesFound: string;
    categories: {
      all: string;
      computerScience: string;
      business: string;
      dataScience: string;
      design: string;
      engineering: string;
    };
  };
  
  // AI Study Page
  aiStudy: {
    title: string;
    subtitle: string;
    notesTaker: string;
    aiTutor: string;
    mistakeChecker: string;
    studyPlanner: string;
    flashcards: string;
    contentWriter: string;
    citationGenerator: string;
    progressTracker: string;
    uploadHomework: string;
    history: string;
    addAttachment: string;
    sendMessage: string;
    studyPlannerCalendar: string;
    addTask: string;
    addNewStudyTask: string;
    taskDescription: string;
    whatDoYouNeedToStudy: string;
    taskName: string;
    subject: string;
    egMathScienceHistory: string;
    dueDate: string;
    date: string;
    priority: string;
    lowPriority: string;
    mediumPriority: string;
    highPriority: string;
    high: string;
    medium: string;
    low: string;
    estimatedHours: string;
    addToStudyPlan: string;
    addTaskButton: string;
    cancel: string;
    yourStudySchedule: string;
    studyTasksWillAppearHere: string;
    noTasks: string;
    noTasksDescription: string;
    completedTasks: string;
    pendingTasks: string;
    totalHours: string;
    aiTutorDescription: string;
    checkMistakes: string;
    checkMistakesDescription: string;
    contentWriterDescription: string;
    homeworkHelper: string;
    homeworkHelperDescription: string;
    smartStudyRecommendations: string;
    basedOnYourUpcomingTasks: string;
    startWithMathematicsHomework: string;
    block2HourFocusSessions: string;
    useTheAiStudyAssistant: string;
    studyTimer: string;
    taskManager: string;
    taskPlaceholder: string;
    completed: string;
    pending: string;
    createFlashcard: string;
    frontText: string;
    backText: string;
    nextCard: string;
    previousCard: string;
    markMastered: string;
    showAnswer: string;
    studyMode: string;
    reviewMode: string;
    startTimer: string;
    stopTimer: string;
    resetTimer: string;
    pomodoroTimer: string;
    breakTime: string;
    focusTime: string;
    generateCitation: string;
    checkGrammar: string;
    improveWriting: string;
    askTutor: string;
    getHelp: string;
    saveNotes: string;
    exportNotes: string;
    typeMessage: string;
    newTask: string;
    addNewTask: string;
    question: string;
    answer: string;
    addFlashcard: string;
    mastered: string;
    notMastered: string;
    showAnswerButton: string;
    previousButton: string;
    nextButton: string;
    markAsMastered: string;
    viewCalendar: string;
    taskCompleted: string;
    taskPending: string;
    noTasksYet: string;
    noFlashcardsYet: string;
    createFirstFlashcard: string;
    addFirstTask: string;
    instant_homework_help: string;
    try_now: string;
    ai_content_writer: string;
    start_writing: string;
    ask_ai_tutor: string;
    ai_tutor_chat: string;
    chat_now: string;
    // New translations for hardcoded text
    checkMistakesTitle: string;
    citationGeneratorTitle: string;
    flashcardsTitle: string;
    studyCards: string;
    cardOf: string;
    masteredLabel: string;
    showAnswerBtn: string;
    markAsMasteredBtn: string;
    unmarkBtn: string;
    hideAnswerBtn: string;
    previousBtn: string;
    nextBtn: string;
    noFlashcardsMessage: string;
    createFirstFlashcardMessage: string;
    createFlashcardsTitle: string;
    generateFromNotes: string;
    orCreateManually: string;
    questionLabel: string;
    answerLabel: string;
    questionPlaceholder: string;
    answerPlaceholder: string;
    addFlashcardBtn: string;
    studySessions: string;
    thisMonth: string;
    problemsSolved: string;
    total: string;
    accuracyRate: string;
    average: string;
    recentActivity: string;
    completedMathHomework: string;
    hoursAgo: string;
    usedAiTutorPhysics: string;
    createdFlashcards: string;
    dayAgo: string;
    instantHomeworkHelp: string;
    tryNow: string;
    aiContentWriter: string;
    startWriting: string;
    aiTutorChat: string;
    chatNow: string;
    // Additional translations for hardcoded text
    instantHomeworkHelpTitle: string;
    instantHomeworkHelpDesc: string;
    tryNowBtn: string;
    aiContentWriterTitle: string;
    aiContentWriterDesc: string;
    startWritingBtn: string;
    aiTutorChatTitle: string;
    aiTutorChatDesc: string;
    chatNowBtn: string;
  };
  
  // AI Courses Page
  aiCourses: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filterByType: string;
    filterByLevel: string;
    filterByProvider: string;
    allTypes: string;
    allLevels: string;
    allProviders: string;
    university: string;
    certification: string;
    tutorial: string;
    beginner: string;
    intermediate: string;
    advanced: string;
    duration: string;
    rating: string;
    students: string;
    instructor: string;
    prerequisites: string;
    skills: string;
    price: string;
    free: string;
    paid: string;
    enrollNow: string;
    viewDetails: string;
    addToWishlist: string;
    removeFromWishlist: string;
    featuredCourses: string;
    popularCourses: string;
    newCourses: string;
    topRated: string;
    noCoursesFound: string;
    courseDetails: string;
    syllabus: string;
    reviews: string;
    relatedCourses: string;
    startLearning: string;
    continueWatching: string;
    completed: string;
    inProgress: string;
    notStarted: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      home: 'Home',
      database: 'Database',
      successStories: 'Success Stories',
      aiCourses: 'Courses',
      aiStudy: 'AI Study',
      resources: 'Resources',
      blog: 'Blog',
      login: 'Login',
      signup: 'Sign Up',
      signOut: 'Sign out',
      profile: 'Your Profile',
      applicationTracker: 'Application Tracker',
      more: 'More',
    },
    auth: {
      login: {
        title: 'Welcome Back',
        subtitle: 'Access your personalized learning dashboard',
        welcomeBack: 'Welcome back!',
        signInToAccount: 'Sign in to your MatrixEdu account',
        emailLabel: 'Email',
        passwordLabel: 'Password',
        emailPlaceholder: 'Enter your email',
        passwordPlaceholder: 'Enter your password',
        rememberMe: 'Remember me',
        forgotPassword: 'Forgot password?',
        signInButton: 'Sign In',
        orSignInWith: 'Or sign in with',
        noAccount: 'Don\'t have an account?',
        createAccount: 'Create account',
        emailRequired: 'Email is required',
        emailInvalid: 'Email is invalid',
        passwordRequired: 'Password is required',
        signInError: 'Failed to sign in. Please check your credentials.',
      },
      signup: {
        title: 'Create Account',
        subtitle: 'Join thousands of students on their learning journey',
        createAccount: 'Create your account',
        joinMatrixEdu: 'Join MatrixEdu to access all features and resources',
        nameLabel: 'Full Name',
        emailLabel: 'Email',
        passwordLabel: 'Password',
        confirmPasswordLabel: 'Confirm Password',
        namePlaceholder: 'Enter your full name',
        emailPlaceholder: 'Enter your email',
        passwordPlaceholder: 'Enter your password',
        confirmPasswordPlaceholder: 'Confirm your password',
        agreeToTerms: 'I agree to the',
        termsAndConditions: 'Terms and Conditions',
        privacyPolicy: 'Privacy Policy',
        signUpButton: 'Create Account',
        orSignUpWith: 'Or sign up with',
        haveAccount: 'Already have an account?',
        signIn: 'Sign in',
        nameRequired: 'Full name is required',
        emailRequired: 'Email is required',
        emailInvalid: 'Email is invalid',
        passwordRequired: 'Password is required',
        passwordMinLength: 'Password must be at least 8 characters',
        confirmPasswordRequired: 'Please confirm your password',
        passwordsNotMatch: 'Passwords do not match',
        agreeToTermsRequired: 'You must agree to the terms and conditions',
        signUpError: 'An error occurred during sign up',
        accountCreated: 'Account created successfully! Please check your email to confirm your account.',
      },
    },
    hero: {
      title: 'MatrixEdu - AI-Powered Education Platform',
      subtitle: 'MatrixEdu leverages AI to provide personalized, expert-level tutoring, making quality education accessible for all students and fostering efficient learning and confident growth. We also offer comprehensive study abroad support, including AI-driven university matching, customized application strategies, essay optimization, and visa guidance to boost admission success. Through advanced technology, MatrixEdu ensures fairer, more efficient access to global educational resources, empowering every student to achieve their academic goals.',
      exploreButton: 'Explore',
      learnMoreButton: 'Learn More',
      imageAlt: 'University education illustration',
    },
    about: {
      title: 'About MatrixEdu',
      subtitle: 'Your AI-Powered Education Companion',
      description: 'MatrixEdu revolutionizes the way students discover and apply to universities worldwide. Our AI-driven platform provides personalized recommendations, comprehensive university databases, and expert guidance to help you make informed decisions about your educational future.',
      features: {
        aiPowered: {
          title: 'AI-Powered Recommendations',
          description: 'Get personalized university suggestions based on your academic profile, interests, and career goals.',
        },
        comprehensive: {
          title: 'Comprehensive Database',
          description: 'Access detailed information about thousands of universities and programs worldwide.',
        },
        personalized: {
          title: 'Personalized Guidance',
          description: 'Receive tailored advice and support throughout your application journey.',
        },
      },
    },
    graduatePrograms: {
      title: 'Graduate Programs',
      subtitle: 'Advance Your Career with World-Class Education',
      programs: {
        masters: {
          title: 'Master\'s Programs',
          description: 'Specialized programs designed to deepen your expertise in your chosen field.',
        },
        phd: {
          title: 'PhD Programs',
          description: 'Research-focused programs for those seeking to contribute to knowledge in their field.',
        },
        professional: {
          title: 'Professional Programs',
          description: 'Career-oriented programs designed for working professionals.',
        },
      },
      viewAllButton: 'View All Programs',
    },
    bestFeatures: {
      title: 'Why Choose MatrixEdu?',
      features: {
        aiRecommendations: {
          title: 'AI Recommendations',
          description: 'Smart matching based on your profile',
        },
        comprehensiveDatabase: {
          title: 'Comprehensive Database',
          description: 'Thousands of universities worldwide',
        },
        successStories: {
          title: 'Success Stories',
          description: 'Learn from real student experiences',
        },
        expertGuidance: {
          title: 'Expert Guidance',
          description: 'Professional counseling and support',
        },
      },
    },
    upcomingEvents: {
      title: 'Upcoming Events',
      subtitle: 'Join our educational events and webinars',
      viewAllButton: 'View All Events',
      registerButton: 'Register',
    },
    scholarshipPrograms: {
      title: 'Scholarship Programs',
      subtitle: 'Find funding opportunities for your education',
      exploreButton: 'Explore Scholarships',
      applyButton: 'Apply Now',
    },
    contactForm: {
      title: 'Get in Touch',
      subtitle: 'Have questions? We\'re here to help!',
      nameLabel: 'Name',
      emailLabel: 'Email',
      messageLabel: 'Message',
      namePlaceholder: 'Your full name',
      emailPlaceholder: 'your.email@example.com',
      messagePlaceholder: 'Tell us how we can help you...',
      submitButton: 'Send Message',
      successMessage: 'Message sent successfully!',
      errorMessage: 'Failed to send message. Please try again.',
    },
    clientFeedback: {
      title: 'What Our Students Say',
      subtitle: 'Real stories from students who found their dream universities',
    },
    courseSearch: {
      title: 'Find Your Perfect Course',
      subtitle: 'Search through thousands of courses and programs',
      searchPlaceholder: 'Search courses, universities, or programs...',
      searchButton: 'Search',
      filterByCountry: 'Filter by Country',
      filterByField: 'Filter by Field',
      allCountries: 'All Countries',
      allFields: 'All Fields',
    },
    admissionInfo: {
      title: 'Admission Requirements',
      subtitle: 'Everything you need to know about the application process',
      requirements: {
        title: 'General Requirements',
        items: [
          'Academic transcripts',
          'Standardized test scores',
          'Letters of recommendation',
          'Personal statement',
          'English proficiency test',
        ],
      },
      timeline: {
        title: 'Application Timeline',
        items: {
          research: 'Research & Planning (12-18 months before)',
          applications: 'Submit Applications (6-12 months before)',
          interviews: 'Interviews & Tests (3-6 months before)',
          decisions: 'Admission Decisions (1-3 months before)',
        },
      },
      learnMoreButton: 'Learn More',
    },
    blogSection: {
      title: 'Latest from Our Blog',
      subtitle: 'Stay updated with the latest education trends and tips',
      readMoreButton: 'Read More',
      viewAllButton: 'View All Posts',
      readOurBlog: 'Read Our Blog',
      viewAll: 'View All',
      author: 'Author',
      date: 'Date',
      category: 'Category',
    },
    notFound: {
      title: '404',
      subtitle: 'Page Not Found',
      description: 'Sorry, the page you are looking for does not exist or has been moved.',
      returnHome: 'Return to Home',
    },
    newsletter: {
      title: 'Stay Updated',
      subtitle: 'Subscribe to our newsletter for the latest updates and tips',
      emailPlaceholder: 'Enter your email address',
      subscribeButton: 'Subscribe',
      successMessage: 'Successfully subscribed to newsletter!',
      errorMessage: 'Failed to subscribe. Please try again.',
    },
    footer: {
      description: 'MatrixEdu is your AI-powered companion for discovering and applying to universities worldwide. We make higher education accessible and achievable for everyone.',
      quickLinks: {
        title: 'Quick Links',
        about: 'About Us',
        courses: 'Courses',
        scholarships: 'Scholarships',
        blog: 'Blog',
        contact: 'Contact',
      },
      programs: {
        title: 'Programs',
        undergraduate: 'Undergraduate',
        graduate: 'Graduate',
        doctoral: 'Doctoral',
        professional: 'Professional',
      },
      support: {
        title: 'Support',
        helpCenter: 'Help Center',
        contactUs: 'Contact Us',
        faq: 'FAQ',
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
      },
      followUs: 'Follow Us',
      copyright: '© 2024 MatrixEdu. All rights reserved.',
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
      open: 'Open',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      viewMore: 'View More',
      viewLess: 'View Less',
      readMore: 'Read More',
      showMore: 'Show More',
      showLess: 'Show Less',
    },
    languageSelector: {
      title: 'Language',
      english: 'English',
      simplifiedChinese: 'Simplified Chinese',
      traditionalChinese: 'Traditional Chinese',
    },
    database: {
      title: 'Database',
      subtitle: 'Search and compare universities',
      searchPlaceholder: 'Search universities...',
      filterButton: 'Filter',
      compareButton: 'Compare',
      viewDetails: 'View Details',
      addToCompare: 'Add to Compare',
      removeFromCompare: 'Remove from Compare',
      noResults: 'No results found',
      loading: 'Loading...',
      error: 'An error occurred',
      advancedFilters: 'Advanced Filters',
      sortBy: 'Sort By',
      qsRanking: 'QS Ranking',
      acceptanceRate: 'Acceptance Rate',
      tuitionFee: 'Tuition Fee',
      studentPopulation: 'Student Population',
      country: 'Country',
      region: 'Region',
      type: 'Type',
      resetFilters: 'Reset Filters',
      applyFilters: 'Apply Filters',
      compareUniversities: 'Compare Universities',
      getRecommendations: 'Get Recommendations',
      aiAnalysis: 'AI Analysis',
      university: 'University',
      ranking: 'Ranking',
      location: 'Location',
      website: 'Website',
      contact: 'Contact',
      established: 'Established',
      programs: 'Programs',
      facilities: 'Facilities',
      admissionRequirements: 'Admission Requirements',
      applicationDeadlines: 'Application Deadlines',
      scholarships: 'Scholarships',
      campusLife: 'Campus Life',
      research: 'Research',
      alumni: 'Alumni',
      advancedSearch: 'Advanced Search',
      allCountries: 'All Countries',
      allRegions: 'All Regions',
      allMajors: 'All Majors',
      allFields: 'All Fields',
      reset: 'Reset',
      explorePrograms: 'Explore Programs',
      topUniversities: 'Top Universities',
      fieldOfStudy: 'Field of Study',
      rankingType: 'Ranking Type',
      qsRankingRange: 'QS Ranking Range',
      admissionDifficulty: 'Admission Difficulty',
      campusType: 'Campus Type',
      acceptanceRateFilter: 'Acceptance Rate Filter',
      showOnlyOpenApplications: 'Show Only Open Applications',
      rankingYear: 'Ranking Year',
      highlyCompetitive: 'Highly Competitive',
      moderatelyCompetitive: 'Moderately Competitive',
      lessCompetitive: 'Less Competitive',
      urban: 'Urban',
      suburban: 'Suburban',
      rural: 'Rural',
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
      highlySelective: 'Highly Selective',
      moderatelySelective: 'Moderately Selective',
      lessSelective: 'Less Selective',
      undergrad: 'Undergrad',
      graduate: 'Graduate',
      campusSize: 'Campus Size',
      accreditation: 'Accreditation',
      applicationFee: 'Application Fee',
      fallDeadline: 'Fall Deadline',
      springDeadline: 'Spring Deadline',
      facultyCount: 'Faculty Count',
      minGPA: 'Min GPA',
      testScores: 'Test Scores',
      languageRequirements: 'Language Requirements',
      contactForDetails: 'Contact for Details',
      contactUniversity: 'Contact University',
      nA: 'N/A',
      rank: 'Rank',
      apply: 'Apply',
      visitWebsite: 'Visit Website',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      remove: 'Remove',
      aiRecommended: 'AI Recommended',
      fall: 'Fall',
      spring: 'Spring',
    },
    scholarships: {
      title: 'Scholarships',
      subtitle: 'Find the perfect scholarship for you',
      searchPlaceholder: 'Search scholarships...',
      filterByCountry: 'Filter by Country',
      filterByUniversity: 'Filter by University',
      amount: 'Amount',
      deadline: 'Deadline',
      eligibility: 'Eligibility',
      applyNow: 'Apply Now',
      saveScholarship: 'Save Scholarship',
      viewDetails: 'View Details',
      noResults: 'No results found',
      loading: 'Loading...',
      error: 'An error occurred',
    },
    blog: {
      title: 'Blog',
      subtitle: 'Read the latest articles and insights',
      searchPlaceholder: 'Search articles...',
      categories: 'Categories',
      allCategories: 'All Categories',
      readMore: 'Read More',
      author: 'Author',
      publishedOn: 'Published On',
      readTime: 'Read Time',
      tags: 'Tags',
      relatedPosts: 'Related Posts',
      noResults: 'No results found',
      loading: 'Loading...',
      error: 'An error occurred',
      featuredArticles: 'Featured Articles',
      trendingTopics: 'Trending Topics',
      recentPosts: 'Recent Posts',
      popularPosts: 'Popular Posts',
      searchResults: 'Search Results',
      noArticlesFound: 'No articles found',
      backToBlog: 'Back to Blog',
      shareArticle: 'Share Article',
      comments: 'Comments',
      leaveComment: 'Leave a Comment',
    },
    applicationTracker: {
      title: 'Application Tracker',
      subtitle: 'Manage your applications efficiently',
      addApplication: 'Add Application',
      editApplication: 'Edit Application',
      deleteApplication: 'Delete Application',
      confirmDelete: 'Are you sure you want to delete this application?',
      university: 'University',
      program: 'Program',
      country: 'Country',
      deadline: 'Deadline',
      status: 'Status',
      notes: 'Notes',
      tasks: 'Tasks',
      addTask: 'Add Task',
      newTask: 'New Task',
      requiredFields: 'Required Fields',
      filterStatus: 'Filter by Status',
      sortBy: 'Sort By',
      sortOrder: 'Sort Order',
      ascending: 'Ascending',
      descending: 'Descending',
      allStatuses: 'All Statuses',
      planning: 'Planning',
      inProgress: 'In Progress',
      submitted: 'Submitted',
      interview: 'Interview',
      accepted: 'Accepted',
      rejected: 'Rejected',
      waitlisted: 'Waitlisted',
      universityPlaceholder: 'Select university',
      programPlaceholder: 'Select program',
      countryPlaceholder: 'Select country',
      notesPlaceholder: 'Enter notes',
      taskPlaceholder: 'Enter task description',
      overview: 'Application Overview',
      totalApplications: 'Total Applications',
      submittedCount: 'Submitted',
      acceptedCount: 'Accepted',
      pending: 'Pending',
      noApplicationsFound: 'No applications found',
      noApplicationsYet: 'No applications yet',
      noMatchingFilter: 'No matching applications',
      showAllApplications: 'Show all applications',
      addNewApplication: 'Add new application',
      saveChanges: 'Save changes',
    },
    caseStudies: {
      title: 'Case Studies',
      subtitle: 'Real-world examples of successful applications',
      searchPlaceholder: 'Search case studies...',
      filterBy: 'Filter by',
      lowGPA: 'Low GPA',
      international: 'International',
      scholarship: 'Scholarship',
      allStories: 'All Stories',
      background: 'Background',
      results: 'Results',
      strategy: 'Strategy',
      testimonial: 'Testimonial',
      gpa: 'GPA',
      testScores: 'Test Scores',
      extracurriculars: 'Extracurriculars',
      challenges: 'Challenges',
      universitiesApplied: 'Universities Applied',
      acceptedTo: 'Accepted To',
      scholarshipReceived: 'Scholarship Received',
      admitted: 'Admitted',
      notAdmitted: 'Not Admitted',
      readFullStory: 'Read Full Story',
      successStories: 'Success Stories',
      lowGPAStories: 'Low GPA Stories',
      internationalStories: 'International Stories',
      scholarshipStories: 'Scholarship Stories',
    },
    chatBot: {
      title: 'MatrixEdu ChatBot',
      subtitle: 'Get instant answers to your questions',
      backToHome: 'Back to Home',
      chatTitle: 'Chat with MatrixEdu',
      chatSubtitle: 'Ask me anything about education and universities',
      messagePlaceholder: 'Type your message here...',
      sendButton: 'Send',
      you: 'You',
      aiAssistant: 'MatrixEdu',
      welcomeMessage: 'Hello! I\'m MatrixEdu, your AI-powered educational assistant. How can I help you today?',
      helpMessage: 'You can ask me about universities, courses, scholarships, or any other educational topics.',
    },
    courses: {
      title: 'Courses',
      subtitle: 'Explore a wide range of educational courses',
      allCourses: 'All Courses',
      filterByCategory: 'Filter by Category',
      searchPlaceholder: 'Search for courses...',
      instructor: 'Instructor',
      students: 'Students',
      rating: 'Rating',
      price: 'Price',
      enrollNow: 'Enroll Now',
      viewDetails: 'View Details',
      noCoursesFound: 'No courses found',
      categories: {
        all: 'All',
        computerScience: 'Computer Science',
        business: 'Business',
        dataScience: 'Data Science',
        design: 'Design',
        engineering: 'Engineering',
      },
    },
    aiStudy: {
      title: 'AI Study Assistant',
      subtitle: 'Enhance your learning with AI-powered tools',
      notesTaker: 'Notes Taker',
      aiTutor: 'AI Tutor',
      mistakeChecker: 'Mistake Checker',
      studyPlanner: 'Study Planner',
      flashcards: 'Flashcards',
      contentWriter: 'Content Writer',
      citationGenerator: 'Citation Generator',
      progressTracker: 'Progress Tracker',
      uploadHomework: 'Upload Homework',
      history: 'History',
      addAttachment: 'Add Attachment',
      sendMessage: 'Send Message',
      studyPlannerCalendar: 'Study Planner & Calendar',
      addTask: 'Add Task',
      addNewStudyTask: 'Add New Study Task',
      taskDescription: 'Task Description',
      whatDoYouNeedToStudy: 'What do you need to study?',
      taskName: 'Task Name',
      subject: 'Subject',
      egMathScienceHistory: 'e.g. Math, Science, History',
      dueDate: 'Due Date',
      date: 'Date',
      priority: 'Priority',
      lowPriority: 'Low Priority',
      mediumPriority: 'Medium Priority',
      highPriority: 'High Priority',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      estimatedHours: 'Estimated Hours',
      addToStudyPlan: 'Add to Study Plan',
      addTaskButton: 'Add Task',
      cancel: 'Cancel',
      yourStudySchedule: 'Your Study Schedule',
      studyTasksWillAppearHere: 'Study tasks will appear here',
      noTasks: 'No tasks scheduled',
      noTasksDescription: 'Add your first study task to get started!',
      completedTasks: 'Completed Tasks',
      pendingTasks: 'Pending Tasks',
      totalHours: 'Total Hours',
      aiTutorDescription: 'Get instant help with your studies',
      checkMistakes: 'Check Mistakes',
      checkMistakesDescription: 'Upload your work to identify errors',
      contentWriterDescription: 'Generate study materials and essays',
      homeworkHelper: 'Homework Helper',
      homeworkHelperDescription: 'Get step-by-step solutions',
      smartStudyRecommendations: 'Smart Study Recommendations',
      basedOnYourUpcomingTasks: 'Based on your upcoming tasks',
      startWithMathematicsHomework: 'Start with Mathematics homework',
      block2HourFocusSessions: 'Block 2-hour focus sessions',
      useTheAiStudyAssistant: 'Use the AI Study Assistant',
      studyTimer: 'Study Timer',
      taskManager: 'Task Manager',
      taskPlaceholder: 'Enter task description...',
      completed: 'Completed',
      pending: 'Pending',
      createFlashcard: 'Create Flashcard',
      frontText: 'Front Text',
      backText: 'Back Text',
      nextCard: 'Next Card',
      previousCard: 'Previous Card',
      markMastered: 'Mark Mastered',
      showAnswer: 'Show Answer',
      studyMode: 'Study Mode',
      reviewMode: 'Review Mode',
      startTimer: 'Start Timer',
      stopTimer: 'Stop Timer',
      resetTimer: 'Reset Timer',
      pomodoroTimer: 'Pomodoro Timer',
      breakTime: 'Break Time',
      focusTime: 'Focus Time',
      generateCitation: 'Generate Citation',
      checkGrammar: 'Check Grammar',
      improveWriting: 'Improve Writing',
      askTutor: 'Ask Tutor',
      getHelp: 'Get Help',
      saveNotes: 'Save Notes',
      exportNotes: 'Export Notes',
      typeMessage: 'Type your message...',
      newTask: 'New Task',
      addNewTask: 'Add New Task',
      question: 'Question',
      answer: 'Answer',
      addFlashcard: 'Add Flashcard',
      mastered: 'Mastered',
      notMastered: 'Not Mastered',
      showAnswerButton: 'Show Answer',
      previousButton: 'Previous',
      nextButton: 'Next',
      markAsMastered: 'Mark as Mastered',
      viewCalendar: 'View Calendar',
      taskCompleted: 'Task Completed',
      taskPending: 'Task Pending',
      noTasksYet: 'No tasks yet',
      noFlashcardsYet: 'No flashcards yet',
      createFirstFlashcard: 'Create your first flashcard',
      addFirstTask: 'Add your first task',
      instant_homework_help: 'Instant Homework Help',
      try_now: 'Try Now',
      ai_content_writer: 'AI Content Writer',
      start_writing: 'Start Writing',
      ask_ai_tutor: 'Ask AI Tutor',
      ai_tutor_chat: 'AI Tutor Chat',
      chat_now: 'Chat Now',
      checkMistakesTitle: 'Check Mistakes',
      citationGeneratorTitle: 'Citation Generator',
      flashcardsTitle: 'Flashcards',
      studyCards: 'Study Cards',
      cardOf: 'of',
      masteredLabel: 'Mastered',
      showAnswerBtn: 'Show Answer',
      markAsMasteredBtn: 'Mark as Mastered',
      unmarkBtn: 'Unmark',
      hideAnswerBtn: 'Hide Answer',
      previousBtn: 'Previous',
      nextBtn: 'Next',
      noFlashcardsMessage: 'No flashcards yet',
      createFirstFlashcardMessage: 'Create your first flashcard',
      createFlashcardsTitle: 'Create Flashcards',
      generateFromNotes: 'Generate from notes',
      orCreateManually: 'or create manually',
      questionLabel: 'Question',
      answerLabel: 'Answer',
      questionPlaceholder: 'Enter your question',
      answerPlaceholder: 'Enter your answer',
      addFlashcardBtn: 'Add Flashcard',
      studySessions: 'Study Sessions',
      thisMonth: 'This Month',
      problemsSolved: 'Problems Solved',
      total: 'Total',
      accuracyRate: 'Accuracy Rate',
      average: 'Average',
      recentActivity: 'Recent Activity',
      completedMathHomework: 'Completed Math Homework',
      hoursAgo: 'hours ago',
      usedAiTutorPhysics: 'Used AI Tutor Physics',
      createdFlashcards: 'Created Flashcards',
      dayAgo: 'day ago',
      instantHomeworkHelp: 'Instant Homework Help',
      tryNow: 'Try Now',
      aiContentWriter: 'AI Content Writer',
      startWriting: 'Start Writing',
      aiTutorChat: 'AI Tutor Chat',
      chatNow: 'Chat Now',
      instantHomeworkHelpTitle: '即時作業幫助',
      instantHomeworkHelpDesc: '通過我們的AI驅動系統立即獲得作業問題的幫助。',
      tryNowBtn: '立即嘗試',
      aiContentWriterTitle: 'AI內容寫作',
      aiContentWriterDesc: '在AI幫助下為論文、報告和作業生成高質量內容。',
      startWritingBtn: '開始寫作',
      aiTutorChatTitle: 'AI導師聊天',
      aiTutorChatDesc: '與我們的智能AI導師聊天，獲得個性化學習支持和解釋。',
      chatNowBtn: '立即聊天',
    },
    aiCourses: {
      title: 'AI課程',
      subtitle: '您的AI課程助手',
      searchPlaceholder: '搜索AI課程...',
      filterByType: '按類型篩選',
      filterByLevel: '按級別篩選',
      filterByProvider: '按提供者篩選',
      allTypes: '所有類型',
      allLevels: '所有級別',
      allProviders: '所有提供者',
      university: '大學',
      certification: '認證',
      tutorial: '教程',
      beginner: '初學者',
      intermediate: '中級',
      advanced: '高級',
      duration: '持續時間',
      rating: '評分',
      students: '學生',
      instructor: '講師',
      prerequisites: '先決條件',
      skills: '技能',
      price: '價格',
      free: '免費',
      paid: '付費',
      enrollNow: '立即報名',
      viewDetails: '查看詳情',
      addToWishlist: '添加到願望清單',
      removeFromWishlist: '從願望清單中移除',
      featuredCourses: '精選課程',
      popularCourses: '熱門課程',
      newCourses: '新課程',
      topRated: '評分最高',
      noCoursesFound: '沒有找到課程',
      courseDetails: '課程詳情',
      syllabus: '課程大綱',
      reviews: '評論',
      relatedCourses: '相關課程',
      startLearning: '開始學習',
      continueWatching: '繼續觀看',
      completed: '已完成',
      inProgress: '進行中',
      notStarted: '未開始',
    },
  },
  'zh-CN': {
    nav: {
      home: '首页',
      database: '数据库',
      successStories: '成功案例',
      aiCourses: 'AI课程',
      aiStudy: 'AI学习',
      resources: '资源',
      blog: '博客',
      login: '登录',
      signup: '注册',
      signOut: '退出登录',
      profile: '个人资料',
      applicationTracker: '申请跟踪',
      more: '更多',
    },
    auth: {
      login: {
        title: '登录',
        subtitle: '登录您的账户',
        welcomeBack: '欢迎回来',
        signInToAccount: '登录您的MatrixEdu账户',
        emailLabel: '邮箱',
        passwordLabel: '密码',
        emailPlaceholder: '请输入您的邮箱',
        passwordPlaceholder: '请输入您的密码',
        rememberMe: '记住我',
        forgotPassword: '忘记密码？',
        signInButton: '登录',
        orSignInWith: '或使用以下方式登录',
        noAccount: '还没有账户？',
        createAccount: '创建账户',
        emailRequired: '邮箱为必填项',
        emailInvalid: '邮箱格式无效',
        passwordRequired: '密码为必填项',
        signInError: '登录时发生错误',
      },
      signup: {
        title: '注册',
        subtitle: '创建您的账户',
        createAccount: '创建账户',
        joinMatrixEdu: '加入MatrixEdu，访问所有功能和资源',
        nameLabel: '全名',
        emailLabel: '邮箱',
        passwordLabel: '密码',
        confirmPasswordLabel: '确认密码',
        namePlaceholder: '请输入您的全名',
        emailPlaceholder: '请输入您的邮箱',
        passwordPlaceholder: '请输入您的密码',
        confirmPasswordPlaceholder: '请确认您的密码',
        agreeToTerms: '我同意',
        termsAndConditions: '条款和条件',
        privacyPolicy: '隐私政策',
        signUpButton: '注册',
        orSignUpWith: '或使用以下方式注册',
        haveAccount: '已有账户？',
        signIn: '登录',
        nameRequired: '姓名为必填项',
        emailRequired: '邮箱为必填项',
        emailInvalid: '邮箱格式无效',
        passwordRequired: '密码为必填项',
        passwordMinLength: '密码至少需要8个字符',
        confirmPasswordRequired: '请确认您的密码',
        passwordsNotMatch: '密码不匹配',
        agreeToTermsRequired: '您必须同意条款和条件',
        signUpError: '注册时发生错误',
        accountCreated: '账户创建成功！请检查您的邮箱以确认账户。',
      },
    },
    hero: {
      title: 'MatrixEdu - AI智能教育平台',
      subtitle: 'MatrixEdu 致力于用AI技术弥合教育资源鸿沟，打造智能学习平台，为不同阶层的学生提供个性化、名师级的辅导体验。通过精准诊断、智能总结，我们让优质教育资源触手可及，助力每位学生高效学习、自信成长，实现教育公平与卓越。我們也提供全面的留學支持，包括人工智慧驅動的大學配對、客製化申請策略、文書優化和簽證指導，助力學生成功入學。MatrixEdu 憑藉著先進的技術，確保更公平、更有效率地取得全球教育資源，賦予每位學生實現學術目標。',
      exploreButton: '探索',
      learnMoreButton: '了解更多',
      imageAlt: '大學教育插圖',
    },
    about: {
      title: '关于MatrixEdu',
      subtitle: '您的AI智能教育伙伴',
      description: 'MatrixEdu革命性地改变了学生发现和申请全球大学的方式。我们的AI驱动平台提供个性化推荐、全面的大学数据库和专家指导，帮助您对教育未来做出明智决策。',
      features: {
        aiPowered: {
          title: 'AI智能推荐',
          description: '基于您的学术档案、兴趣和职业目标获得个性化大学建议。',
        },
        comprehensive: {
          title: '全面数据库',
          description: '访问全球数千所大学和项目的详细信息。',
        },
        personalized: {
          title: '个性化指导',
          description: '在整个申请过程中获得量身定制的建议和支持。',
        },
      },
    },
    graduatePrograms: {
      title: '研究生项目',
      subtitle: '通过世界级教育推进您的职业生涯',
      programs: {
        masters: {
          title: '硕士项目',
          description: '专门设计用于深化您在所选领域专业知识的项目。',
        },
        phd: {
          title: '博士项目',
          description: '面向那些寻求为其领域知识做出贡献的研究型项目。',
        },
        professional: {
          title: '专业项目',
          description: '为在职专业人士设计的职业导向项目。',
        },
      },
      viewAllButton: '查看所有项目',
    },
    bestFeatures: {
      title: '为什么选择MatrixEdu？',
      features: {
        aiRecommendations: {
          title: 'AI推荐',
          description: '基于您的档案进行智能匹配',
        },
        comprehensiveDatabase: {
          title: '全面数据库',
          description: '全球数千所大学',
        },
        successStories: {
          title: '成功案例',
          description: '从真实学生经历中学习',
        },
        expertGuidance: {
          title: '专家指导',
          description: '专业咨询和支持',
        },
      },
    },
    upcomingEvents: {
      title: '即将举行的活动',
      subtitle: '参加我们的教育活动和网络研讨会',
      viewAllButton: '查看所有活动',
      registerButton: '注册',
    },
    scholarshipPrograms: {
      title: '奖学金项目',
      subtitle: '为您的教育寻找资助机会',
      exploreButton: '探索奖学金',
      applyButton: '立即申请',
    },
    contactForm: {
      title: '联系我们',
      subtitle: '有问题吗？我们在这里帮助您！',
      nameLabel: '姓名',
      emailLabel: '邮箱',
      messageLabel: '消息',
      namePlaceholder: '您的全名',
      emailPlaceholder: 'your.email@example.com',
      messagePlaceholder: '告诉我们如何帮助您...',
      submitButton: '发送消息',
      successMessage: '消息发送成功！',
      errorMessage: '发送消息失败。请重试。',
    },
    clientFeedback: {
      title: '学生评价',
      subtitle: '找到理想大学的学生真实故事',
    },
    courseSearch: {
      title: '找到您的完美课程',
      subtitle: '搜索数千个课程和项目',
      searchPlaceholder: '搜索课程、大学或项目...',
      searchButton: '搜索',
      filterByCountry: '按国家筛选',
      filterByField: '按领域筛选',
      allCountries: '所有国家',
      allFields: '所有领域',
    },
    admissionInfo: {
      title: '入学要求',
      subtitle: '关于申请流程您需要了解的一切',
      requirements: {
        title: '一般要求',
        items: [
          '学术成绩单',
          '标准化考试成绩',
          '推荐信',
          '个人陈述',
          '英语水平测试',
        ],
      },
      timeline: {
        title: '申请时间表',
        items: {
          research: '研究与规划（提前12-18个月）',
          applications: '提交申请（提前6-12个月）',
          interviews: '面试与测试（提前3-6个月）',
          decisions: '录取决定（提前1-3个月）',
        },
      },
      learnMoreButton: '了解更多',
    },
    blogSection: {
      title: '博客最新文章',
      subtitle: '了解最新的教育趋势和技巧',
      readMoreButton: '阅读更多',
      viewAllButton: '查看所有文章',
      readOurBlog: '阅读我们的博客',
      viewAll: '查看全部',
      author: '作者',
      date: '日期',
      category: '分类',
    },
    notFound: {
      title: '404',
      subtitle: '页面未找到',
      description: '抱歉，您查找的页面不存在或已被移动。',
      returnHome: '返回首页',
    },
    newsletter: {
      title: '保持更新',
      subtitle: '订阅我们的新闻通讯获取最新更新和技巧',
      emailPlaceholder: '输入您的邮箱地址',
      subscribeButton: '订阅',
      successMessage: '成功订阅新闻通讯！',
      errorMessage: '订阅失败。请重试。',
    },
    footer: {
      description: 'MatrixEdu是您发现和申请全球大学的AI智能伙伴。我们让高等教育对每個人都變得可及和可實現。',
      quickLinks: {
        title: '快速链接',
        about: '关于我们',
        courses: '课程',
        scholarships: '奖学金',
        blog: '博客',
        contact: '联系',
      },
      programs: {
        title: '项目',
        undergraduate: '本科',
        graduate: '研究生',
        doctoral: '博士',
        professional: '专业',
      },
      support: {
        title: '支持',
        helpCenter: '帮助中心',
        contactUs: '联系我们',
        faq: '常见问题',
        privacy: '隐私政策',
        terms: '服务条款',
      },
      followUs: '关注我们',
      copyright: '© 2024 MatrixEdu. 保留所有权利。',
    },
    common: {
      loading: '加载中...',
      error: '错误',
      success: '成功',
      cancel: '取消',
      confirm: '确认',
      save: '保存',
      edit: '编辑',
      delete: '删除',
      back: '返回',
      next: '下一步',
      previous: '上一步',
      close: '关闭',
      open: '打开',
      search: '搜索',
      filter: '筛选',
      sort: '排序',
      viewMore: '查看更多',
      viewLess: '查看更少',
      readMore: '阅读更多',
      showMore: '显示更多',
      showLess: '显示更少',
    },
    languageSelector: {
      title: '语言',
      english: '英语',
      simplifiedChinese: '简体中文',
      traditionalChinese: '繁体中文',
    },
    database: {
      title: '数据库',
      subtitle: '搜索和比较大学',
      searchPlaceholder: '搜索大学...',
      filterButton: '筛选',
      compareButton: '比较',
      viewDetails: '查看详情',
      addToCompare: '添加到比较',
      removeFromCompare: '从比较中移除',
      noResults: '没有找到结果',
      loading: '加载中...',
      error: '发生错误',
      advancedFilters: '高级筛选',
      sortBy: '排序依据',
      qsRanking: 'QS排名',
      acceptanceRate: '录取率',
      tuitionFee: '学费',
      studentPopulation: '学生人数',
      country: '国家',
      region: '地区',
      type: '类型',
      resetFilters: '重置筛选器',
      applyFilters: '应用筛选器',
      compareUniversities: '比较大学',
      getRecommendations: '获取推荐',
      aiAnalysis: 'AI分析',
      university: '大学',
      ranking: '排名',
      location: '位置',
      website: '网站',
      contact: '联系',
      established: '成立时间',
      programs: '项目',
      facilities: '设施',
      admissionRequirements: '入学要求',
      applicationDeadlines: '申请截止日期',
      scholarships: '奖学金',
      campusLife: '校园生活',
      research: '研究',
      alumni: '校友',
      advancedSearch: '高级搜索',
      allCountries: '所有国家',
      allRegions: '所有地区',
      allMajors: '所有专业',
      allFields: '所有领域',
      reset: '重置',
      explorePrograms: '探索项目',
      topUniversities: '顶尖大学',
      fieldOfStudy: '研究领域',
      rankingType: '排名类型',
      qsRankingRange: 'QS排名范围',
      admissionDifficulty: '录取难度',
      campusType: '校园类型',
      acceptanceRateFilter: '录取率筛选',
      showOnlyOpenApplications: '只显示开放申请',
      rankingYear: '排名年份',
      highlyCompetitive: '高度竞争',
      moderatelyCompetitive: '中度竞争',
      lessCompetitive: '低度竞争',
      urban: '城市',
      suburban: '郊区',
      rural: '农村',
      small: '小规模',
      medium: '中等规模',
      large: '大规模',
      highlySelective: '高度选择性',
      moderatelySelective: '中度选择性',
      lessSelective: '低度选择性',
      undergrad: '本科',
      graduate: '研究生',
      campusSize: '校园规模',
      accreditation: '认证',
      applicationFee: '申请费用',
      fallDeadline: '秋季截止日期',
      springDeadline: '春季截止日期',
      facultyCount: '教师人数',
      minGPA: '最低GPA',
      testScores: '测试成绩',
      languageRequirements: '语言要求',
      contactForDetails: '联系获取详情',
      contactUniversity: '联系大学',
      nA: 'N/A',
      rank: '排名',
      apply: '申请',
      visitWebsite: '访问网站',
      email: '电子邮件',
      phone: '电话',
      address: '地址',
      remove: '移除',
      aiRecommended: 'AI推荐',
      fall: '秋季',
      spring: '春季',
    },
    scholarships: {
      title: '奖学金',
      subtitle: '找到适合您的奖学金',
      searchPlaceholder: '搜索奖学金...',
      filterByCountry: '按国家筛选',
      filterByUniversity: '按大学筛选',
      amount: '金额',
      deadline: '截止日期',
      eligibility: '资格',
      applyNow: '立即申请',
      saveScholarship: '保存奖学金',
      viewDetails: '查看详情',
      noResults: '没有找到结果',
      loading: '加载中...',
      error: '发生错误',
    },
    blog: {
      title: '博客',
      subtitle: '阅读最新的文章和见解',
      searchPlaceholder: '搜索文章...',
      categories: '分类',
      allCategories: '所有分类',
      readMore: '阅读更多',
      author: '作者',
      publishedOn: '发布于',
      readTime: '阅读时间',
      tags: '标签',
      relatedPosts: '相关文章',
      noResults: '没有找到结果',
      loading: '加载中...',
      error: '发生错误',
      featuredArticles: '精选文章',
      trendingTopics: '热门话题',
      recentPosts: '最新文章',
      popularPosts: '热门文章',
      searchResults: '搜索结果',
      noArticlesFound: '没有找到文章',
      backToBlog: '返回博客',
      shareArticle: '分享文章',
      comments: '评论',
      leaveComment: '留下评论',
    },
    applicationTracker: {
      title: '申请跟踪',
      subtitle: '高效管理您的申请',
      addApplication: '添加申请',
      editApplication: '编辑申请',
      deleteApplication: '删除申请',
      confirmDelete: '您确定要删除这个申请吗？',
      university: '大学',
      program: '项目',
      country: '国家',
      deadline: '截止日期',
      status: '状态',
      notes: '备注',
      tasks: '任务',
      addTask: '添加任务',
      newTask: '新任务',
      requiredFields: '必填项',
      filterStatus: '按状态筛选',
      sortBy: '排序依据',
      sortOrder: '排序顺序',
      ascending: '升序',
      descending: '降序',
      allStatuses: '所有状态',
      planning: '规划中',
      inProgress: '进行中',
      submitted: '已提交',
      interview: '面试',
      accepted: '已接受',
      rejected: '已拒绝',
      waitlisted: '等待名单中',
      universityPlaceholder: '选择大学',
      programPlaceholder: '选择项目',
      countryPlaceholder: '选择国家',
      notesPlaceholder: '输入备注',
      taskPlaceholder: '输入任务描述',
      overview: '申请概览',
      totalApplications: '总申请数',
      submittedCount: '已提交',
      acceptedCount: '已接受',
      pending: '待处理',
      noApplicationsFound: '没有找到申请',
      noApplicationsYet: '还没有申请',
      noMatchingFilter: '没有匹配的申请',
      showAllApplications: '显示所有申请',
      addNewApplication: '添加新申请',
      saveChanges: '保存更改',
    },
    caseStudies: {
      title: '案例研究',
      subtitle: '真实世界中的成功案例',
      searchPlaceholder: '搜索案例研究...',
      filterBy: '按',
      lowGPA: '低GPA',
      international: '国际',
      scholarship: '奖学金',
      allStories: '所有故事',
      background: '背景',
      results: '结果',
      strategy: '策略',
      testimonial: '证言',
      gpa: 'GPA',
      testScores: '测试成绩',
      extracurriculars: '课外活动',
      challenges: '挑战',
      universitiesApplied: '申请的大学',
      acceptedTo: '被接受至',
      scholarshipReceived: '获得的奖学金',
      admitted: '已录取',
      notAdmitted: '未被录取',
      readFullStory: '阅读完整故事',
      successStories: '成功故事',
      lowGPAStories: '低GPA故事',
      internationalStories: '国际故事',
      scholarshipStories: '奖学金故事',
    },
    chatBot: {
      title: 'MatrixEdu聊天机器人',
      subtitle: '您的AI教育助手',
      backToHome: '返回首页',
      chatTitle: '与MatrixEdu聊天',
      chatSubtitle: '询问您教育旅程中的任何问题',
      messagePlaceholder: '输入您的消息...',
      sendButton: '发送',
      you: '你',
      aiAssistant: 'MatrixEdu',
      welcomeMessage: '你好！我是MatrixEdu，您的AI教育助手。今天我能为您做些什麽？',
      helpMessage: '我在此幫助您解決教育旅程中的任何問題。請隨時向我提問！',
    },
    courses: {
      title: '課程',
      subtitle: '探索各種教育課程',
      allCourses: '所有課程',
      filterByCategory: '按類別篩選',
      searchPlaceholder: '搜索課程...',
      instructor: '講師',
      students: '學生',
      rating: '評分',
      price: '價格',
      enrollNow: '立即報名',
      viewDetails: '查看詳情',
      noCoursesFound: '沒有找到課程',
      categories: {
        all: '所有',
        computerScience: '計算機科學',
        business: '商業',
        dataScience: '數據科學',
        design: '設計',
        engineering: '工程',
      },
    },
    aiStudy: {
      title: 'AI學習助手',
      subtitle: '您的智能學習夥伴，由先進AI技術驅動',
      notesTaker: '筆記記錄',
      aiTutor: 'AI導師',
      mistakeChecker: '錯誤檢查',
      studyPlanner: '學習計劃',
      flashcards: '閃卡',
      contentWriter: '內容寫作',
      citationGenerator: '引用生成',
      progressTracker: '進度跟蹤',
      uploadHomework: '上傳作業',
      history: '歷史記錄',
      addAttachment: '添加附件',
      sendMessage: '發送消息',
      studyPlannerCalendar: '學習計劃與日曆',
      addTask: '添加任務',
      addNewStudyTask: '添加新學習任務',
      taskDescription: '任務描述',
      whatDoYouNeedToStudy: '您需要學習什麽？',
      taskName: '任務名稱',
      subject: '科目',
      egMathScienceHistory: '例如：數學、科學、歷史',
      dueDate: '截止日期',
      date: '日期',
      priority: '優先級',
      lowPriority: '低優先級',
      mediumPriority: '中優先級',
      highPriority: '高優先級',
      high: '高',
      medium: '中',
      low: '低',
      estimatedHours: '預計小時數',
      addToStudyPlan: '添加到學習計劃',
      addTaskButton: '添加任務',
      cancel: '取消',
      yourStudySchedule: '您的學習計劃',
      studyTasksWillAppearHere: '添加任務後，學習任務將顯示在這裡',
      noTasks: '沒有任務',
      noTasksDescription: '添加您的第一個學習任務開始吧！',
      completedTasks: '已完成任務',
      pendingTasks: '待完成任務',
      totalHours: '總小時數',
      aiTutorDescription: '獲得學習的即時幫助',
      checkMistakes: '檢查錯誤',
      checkMistakesDescription: '上傳您的作業以識別錯誤',
      contentWriterDescription: '生成學習材料和論文',
      homeworkHelper: '作業助手',
      homeworkHelperDescription: '獲得逐步解決方案',
      smartStudyRecommendations: '智能學習建議',
      basedOnYourUpcomingTasks: '基於您即將到來的任務和學習模式，這裡是個性化建議',
      startWithMathematicsHomework: '首先從數學作業開始，因為它的截止日期最早',
      block2HourFocusSessions: '安排2小時專注學習時間，中間休息15分鐘以提高記憶效果',
      useTheAiStudyAssistant: '對於困難概念，使用AI學習助手',
      studyTimer: '學習計時器',
      taskManager: '任務管理',
      taskPlaceholder: '輸入任務描述',
      completed: '已完成',
      pending: '待完成',
      createFlashcard: '創建閃卡',
      frontText: '正面文本',
      backText: '背面文本',
      nextCard: '下一張',
      previousCard: '上一張',
      markMastered: '標記為掌握',
      showAnswer: '顯示答案',
      studyMode: '學習模式',
      reviewMode: '複習模式',
      startTimer: '開始計時',
      stopTimer: '停止計時',
      resetTimer: '重置計時',
      pomodoroTimer: '番茄計時器',
      breakTime: '休息時間',
      focusTime: '專注時間',
      generateCitation: '生成引用',
      checkGrammar: '檢查語法',
      improveWriting: '改進寫作',
      askTutor: '詢問導師',
      getHelp: '獲取幫助',
      saveNotes: '保存筆記',
      exportNotes: '導出筆記',
      typeMessage: '輸入消息',
      newTask: '新任務',
      addNewTask: '添加新任務',
      question: '問題',
      answer: '答案',
      addFlashcard: '添加閃卡',
      mastered: '已掌握',
      notMastered: '未掌握',
      showAnswerButton: '顯示答案',
      previousButton: '上一個',
      nextButton: '下一個',
      markAsMastered: '標記為掌握',
      viewCalendar: '查看日曆',
      taskCompleted: '任務已完成',
      taskPending: '任務待完成',
      noTasksYet: '還沒有任務',
      noFlashcardsYet: '還沒有閃卡',
      createFirstFlashcard: '創建第一張閃卡',
      addFirstTask: '添加第一個任務',
      instant_homework_help: '即時作業幫助',
      try_now: '立即嘗試',
      ai_content_writer: 'AI內容寫作',
      start_writing: '開始寫作',
      ask_ai_tutor: '詢問AI導師',
      ai_tutor_chat: 'AI導師聊天',
      chat_now: '立即聊天',
      checkMistakesTitle: '檢查錯誤',
      citationGeneratorTitle: '引用生成',
      flashcardsTitle: '閃卡',
      studyCards: '學習卡片',
      cardOf: '的',
      masteredLabel: '已掌握',
      showAnswerBtn: '顯示答案',
      markAsMasteredBtn: '標記為掌握',
      unmarkBtn: '取消標記',
      hideAnswerBtn: '隱藏答案',
      previousBtn: '上一張',
      nextBtn: '下一張',
      noFlashcardsMessage: '還沒有閃卡',
      createFirstFlashcardMessage: '創建第一張閃卡',
      createFlashcardsTitle: '創建閃卡',
      generateFromNotes: '從筆記生成',
      orCreateManually: '或手動創建',
      questionLabel: '問題',
      answerLabel: '答案',
      questionPlaceholder: '輸入問題',
      answerPlaceholder: '輸入答案',
      addFlashcardBtn: '添加閃卡',
      studySessions: '學習會話',
      thisMonth: '本月',
      problemsSolved: '已解決問題',
      total: '總數',
      accuracyRate: '準確率',
      average: '平均',
      recentActivity: '最近活動',
      completedMathHomework: '已完成數學作業',
      hoursAgo: '小時前',
      usedAiTutorPhysics: '使用了AI導師物理',
      createdFlashcards: '創建了閃卡',
      dayAgo: '天前',
      instantHomeworkHelp: '即時作業幫助',
      tryNow: '立即嘗試',
      aiContentWriter: 'AI內容寫作',
      startWriting: '開始寫作',
      aiTutorChat: 'AI導師聊天',
      chatNow: '立即聊天',
      instantHomeworkHelpTitle: '即時作業幫助',
      instantHomeworkHelpDesc: '通過我們的AI驅動系統立即獲得作業問題的幫助。',
      tryNowBtn: '立即嘗試',
      aiContentWriterTitle: 'AI內容寫作',
      aiContentWriterDesc: '在AI幫助下為論文、報告和作業生成高質量內容。',
      startWritingBtn: '開始寫作',
      aiTutorChatTitle: 'AI導師聊天',
      aiTutorChatDesc: '與我們的智能AI導師聊天，獲得個性化學習支持和解釋。',
      chatNowBtn: '立即聊天',
    },
    aiCourses: {
      title: 'AI課程',
      subtitle: '您的AI課程助手',
      searchPlaceholder: '搜索AI課程...',
      filterByType: '按類型篩選',
      filterByLevel: '按級別篩選',
      filterByProvider: '按提供者篩選',
      allTypes: '所有類型',
      allLevels: '所有級別',
      allProviders: '所有提供者',
      university: '大學',
      certification: '認證',
      tutorial: '教程',
      beginner: '初學者',
      intermediate: '中級',
      advanced: '高級',
      duration: '持續時間',
      rating: '評分',
      students: '學生',
      instructor: '講師',
      prerequisites: '先決條件',
      skills: '技能',
      price: '價格',
      free: '免費',
      paid: '付費',
      enrollNow: '立即報名',
      viewDetails: '查看詳情',
      addToWishlist: '添加到願望清單',
      removeFromWishlist: '從願望清單中移除',
      featuredCourses: '精選課程',
      popularCourses: '熱門課程',
      newCourses: '新課程',
      topRated: '評分最高',
      noCoursesFound: '沒有找到課程',
      courseDetails: '課程詳情',
      syllabus: '課程大綱',
      reviews: '評論',
      relatedCourses: '相關課程',
      startLearning: '開始學習',
      continueWatching: '繼續觀看',
      completed: '已完成',
      inProgress: '進行中',
      notStarted: '未開始',
    },
  },
  'zh-TW': {
    nav: {
      home: '首頁',
      database: '資料庫',
      successStories: '成功案例',
      aiCourses: 'AI課程',
      aiStudy: 'AI學習',
      resources: '資源',
      blog: '部落格',
      login: '登入',
      signup: '註冊',
      signOut: '登出',
      profile: '個人資料',
      applicationTracker: '申請追蹤',
      more: '更多',
    },
    auth: {
      login: {
        title: '登入',
        subtitle: '登入您的帳戶',
        welcomeBack: '歡迎回來',
        signInToAccount: '登入您的MatrixEdu帳戶',
        emailLabel: '電子郵件',
        passwordLabel: '密碼',
        emailPlaceholder: '請輸入您的電子郵件',
        passwordPlaceholder: '請輸入您的密碼',
        rememberMe: '記住我',
        forgotPassword: '忘記密碼？',
        signInButton: '登入',
        orSignInWith: '或使用以下方式登入',
        noAccount: '還沒有帳戶？',
        createAccount: '建立帳戶',
        emailRequired: '電子郵件為必填項',
        emailInvalid: '電子郵件格式無效',
        passwordRequired: '密碼為必填項',
        signInError: '登入時發生錯誤',
      },
      signup: {
        title: '註冊',
        subtitle: '建立您的帳戶',
        createAccount: '建立帳戶',
        joinMatrixEdu: '加入MatrixEdu，存取所有功能和資源',
        nameLabel: '全名',
        emailLabel: '電子郵件',
        passwordLabel: '密碼',
        confirmPasswordLabel: '確認密碼',
        namePlaceholder: '請輸入您的全名',
        emailPlaceholder: '請輸入您的電子郵件',
        passwordPlaceholder: '請輸入您的密碼',
        confirmPasswordPlaceholder: '請確認您的密碼',
        agreeToTerms: '我同意',
        termsAndConditions: '條款和條件',
        privacyPolicy: '隱私政策',
        signUpButton: '註冊',
        orSignUpWith: '或使用以下方式註冊',
        haveAccount: '已有帳戶？',
        signIn: '登入',
        nameRequired: '姓名為必填項',
        emailRequired: '電子郵件為必填項',
        emailInvalid: '電子郵件格式無效',
        passwordRequired: '密碼為必填項',
        passwordMinLength: '密碼至少需要8個字符',
        confirmPasswordRequired: '請確認您的密碼',
        passwordsNotMatch: '密碼不匹配',
        agreeToTermsRequired: '您必須同意條款和條件',
        signUpError: '註冊時發生錯誤',
        accountCreated: '帳戶建立成功！請檢查您的電子郵件以確認帳戶。',
      },
    },
    hero: {
      title: 'MatrixEdu - AI智能教育平台',
      subtitle: '探索頂尖大學、個人化推薦和真實成功案例——全部由AI驅動，簡化您的高等教育之旅。',
      exploreButton: '探索',
      learnMoreButton: '了解更多',
      imageAlt: '大學教育插圖',
    },
    about: {
      title: '關於MatrixEdu',
      subtitle: '您的AI智慧教育夥伴',
      description: 'MatrixEdu革命性地改變了學生發現和申請全球大學的方式。我們的AI驅動平台提供個人化推薦、全面的大學資料庫和專家指導，幫助您對教育未來做出明智決策。',
      features: {
        aiPowered: {
          title: 'AI智慧推薦',
          description: '基於您的學術檔案、興趣和職業目標獲得個人化大學建議。',
        },
        comprehensive: {
          title: '全面資料庫',
          description: '存取全球數千所大學和項目的詳細資訊。',
        },
        personalized: {
          title: '個人化指導',
          description: '在整個申請過程中獲得量身定制的建議和支援。',
        },
      },
    },
    graduatePrograms: {
      title: '研究所項目',
      subtitle: '透過世界級教育推進您的職業生涯',
      programs: {
        masters: {
          title: '碩士項目',
          description: '專門設計用於深化您在所選領域專業知識的項目。',
        },
        phd: {
          title: '博士項目',
          description: '面向那些尋求為其領域知識做出貢獻的研究型項目。',
        },
        professional: {
          title: '專業項目',
          description: '為在職專業人士設計的職業導向項目。',
        },
      },
      viewAllButton: '查看所有項目',
    },
    bestFeatures: {
      title: '為什麽選擇MatrixEdu？',
      features: {
        aiRecommendations: {
          title: 'AI推薦',
          description: '基於您的檔案進行智慧匹配',
        },
        comprehensiveDatabase: {
          title: '全面資料庫',
          description: '全球數千所大學',
        },
        successStories: {
          title: '成功案例',
          description: '從真實學生經歷中學習',
        },
        expertGuidance: {
          title: '專家指導',
          description: '專業諮詢和支援',
        },
      },
    },
    upcomingEvents: {
      title: '即將舉行的活動',
      subtitle: '參加我們的教育活動和網路研討會',
      viewAllButton: '查看所有活動',
      registerButton: '註冊',
    },
    scholarshipPrograms: {
      title: '獎學金項目',
      subtitle: '為您的教育尋找資助機會',
      exploreButton: '探索獎學金',
      applyButton: '立即申請',
    },
    contactForm: {
      title: '聯絡我們',
      subtitle: '有問題嗎？我們在這裡幫助您！',
      nameLabel: '姓名',
      emailLabel: '電子郵件',
      messageLabel: '訊息',
      namePlaceholder: '您的全名',
      emailPlaceholder: 'your.email@example.com',
      messagePlaceholder: '告訴我們如何幫助您...',
      submitButton: '發送訊息',
      successMessage: '訊息發送成功！',
      errorMessage: '發送訊息失敗。請重試。',
    },
    clientFeedback: {
      title: '學生評價',
      subtitle: '找到理想大學的學生真實故事',
    },
    courseSearch: {
      title: '找到您的完美課程',
      subtitle: '搜尋數千個課程和項目',
      searchPlaceholder: '搜尋課程、大學或項目...',
      searchButton: '搜尋',
      filterByCountry: '按國家篩選',
      filterByField: '按領域篩選',
      allCountries: '所有國家',
      allFields: '所有領域',
    },
    admissionInfo: {
      title: '入學要求',
      subtitle: '關於申請流程您需要了解的一切',
      requirements: {
        title: '一般要求',
        items: [
          '學術成績單',
          '標準化考試成績',
          '推薦信',
          '個人陳述',
          '英語水平測試',
        ],
      },
      timeline: {
        title: '申請時間表',
        items: {
          research: '研究與規劃（提前12-18個月）',
          applications: '提交申請（提前6-12個月）',
          interviews: '面試與測試（提前3-6個月）',
          decisions: '錄取決定（提前1-3個月）',
        },
      },
      learnMoreButton: '了解更多',
    },
    blogSection: {
      title: '部落格最新文章',
      subtitle: '了解最新的教育趨勢和技巧',
      readMoreButton: '閱讀更多',
      viewAllButton: '查看所有文章',
      readOurBlog: '閱讀我們的部落格',
      viewAll: '查看全部',
      author: '作者',
      date: '日期',
      category: '分類',
    },
    notFound: {
      title: '404',
      subtitle: '頁面未找到',
      description: '抱歉，您要查找的頁面不存在或已移動。',
      returnHome: '返回首頁',
    },
    newsletter: {
      title: '保持更新',
      subtitle: '訂閱我們的電子報獲取最新更新和技巧',
      emailPlaceholder: '輸入您的電子郵件地址',
      subscribeButton: '訂閱',
      successMessage: '成功訂閱電子報！',
      errorMessage: '訂閱失敗。請重試。',
    },
    footer: {
      description: 'MatrixEdu是您發現和申請全球大學的AI智慧夥伴。我們讓高等教育對每個人都變得可及和可實現。',
      quickLinks: {
        title: '快速連結',
        about: '關於我們',
        courses: '課程',
        scholarships: '獎學金',
        blog: '部落格',
        contact: '聯絡',
      },
      programs: {
        title: '項目',
        undergraduate: '大學部',
        graduate: '研究所',
        doctoral: '博士',
        professional: '專業',
      },
      support: {
        title: '支援',
        helpCenter: '幫助中心',
        contactUs: '聯絡我們',
        faq: '常見問題',
        privacy: '隱私政策',
        terms: '服務條款',
      },
      followUs: '關注我們',
      copyright: '© 2024 MatrixEdu. 保留所有權利。',
    },
    common: {
      loading: '載入中...',
      error: '錯誤',
      success: '成功',
      cancel: '取消',
      confirm: '確認',
      save: '儲存',
      edit: '編輯',
      delete: '刪除',
      back: '返回',
      next: '下一步',
      previous: '上一步',
      close: '關閉',
      open: '開啟',
      search: '搜尋',
      filter: '篩選',
      sort: '排序',
      viewMore: '查看更多',
      viewLess: '查看更少',
      readMore: '閱讀更多',
      showMore: '顯示更多',
      showLess: '顯示更少',
    },
    languageSelector: {
      title: '語言',
      english: '英語',
      simplifiedChinese: '簡體中文',
      traditionalChinese: '繁體中文',
    },
    database: {
      title: '資料庫',
      subtitle: '搜索和比較大學',
      searchPlaceholder: '搜索大學...',
      filterButton: '篩選',
      compareButton: '比較',
      viewDetails: '查看詳情',
      addToCompare: '添加到比較',
      removeFromCompare: '從比較中移除',
      noResults: '沒有找到結果',
      loading: '加載中...',
      error: '發生錯誤',
      advancedFilters: '進階篩選',
      sortBy: '排序依據',
      qsRanking: 'QS排名',
      acceptanceRate: '錄取率',
      tuitionFee: '學費',
      studentPopulation: '學生人數',
      country: '國家',
      region: '地區',
      type: '類型',
      resetFilters: '重置篩選器',
      applyFilters: '應用篩選器',
      compareUniversities: '比較大學',
      getRecommendations: '獲取推薦',
      aiAnalysis: 'AI分析',
      university: '大學',
      ranking: '排名',
      location: '位置',
      website: '網站',
      contact: '聯絡',
      established: '成立時間',
      programs: '項目',
      facilities: '設施',
      admissionRequirements: '入學要求',
      applicationDeadlines: '申請截止日期',
      scholarships: '獎學金',
      campusLife: '校園生活',
      research: '研究',
      alumni: '校友',
      advancedSearch: '高級搜索',
      allCountries: '所有國家',
      allRegions: '所有地區',
      allMajors: '所有專業',
      allFields: '所有領域',
      reset: '重置',
      explorePrograms: '探索項目',
      topUniversities: '頂尖大學',
      fieldOfStudy: '研究領域',
      rankingType: '排名類型',
      qsRankingRange: 'QS排名範圍',
      admissionDifficulty: '錄取難度',
      campusType: '校園類型',
      acceptanceRateFilter: '錄取率篩選',
      showOnlyOpenApplications: '只顯示開放申請',
      rankingYear: '排名年份',
      highlyCompetitive: '高度競爭',
      moderatelyCompetitive: '中度競爭',
      lessCompetitive: '低度競爭',
      urban: '城市',
      suburban: '郊區',
      rural: '農村',
      small: '小規模',
      medium: '中等規模',
      large: '大規模',
      highlySelective: '高度選擇性',
      moderatelySelective: '中度選擇性',
      lessSelective: '低度選擇性',
      undergrad: '本科',
      graduate: '研究生',
      campusSize: '校園規模',
      accreditation: '認證',
      applicationFee: '申請費用',
      fallDeadline: '秋季截止日期',
      springDeadline: '春季截止日期',
      facultyCount: '教師人數',
      minGPA: '最低GPA',
      testScores: '測試成績',
      languageRequirements: '語言要求',
      contactForDetails: '聯絡獲取詳情',
      contactUniversity: '聯絡大學',
      nA: 'N/A',
      rank: '排名',
      apply: '申請',
      visitWebsite: '訪問網站',
      email: '電子郵件',
      phone: '電話',
      address: '地址',
      remove: '移除',
      aiRecommended: 'AI推薦',
      fall: '秋季',
      spring: '春季',
    },
    scholarships: {
      title: '獎學金',
      subtitle: '找到適合您的獎學金',
      searchPlaceholder: '搜索獎學金...',
      filterByCountry: '按國家篩選',
      filterByUniversity: '按大學篩選',
      amount: '金額',
      deadline: '截止日期',
      eligibility: '資格',
      applyNow: '立即申請',
      saveScholarship: '保存獎學金',
      viewDetails: '查看詳情',
      noResults: '沒有找到結果',
      loading: '加載中...',
      error: '發生錯誤',
    },
    blog: {
      title: '部落格',
      subtitle: '閱讀最新的文章和見解',
      searchPlaceholder: '搜索文章...',
      categories: '分類',
      allCategories: '所有分類',
      readMore: '閱讀更多',
      author: '作者',
      publishedOn: '發布於',
      readTime: '閱讀時間',
      tags: '標籤',
      relatedPosts: '相關文章',
      noResults: '沒有找到結果',
      loading: '加載中...',
      error: '發生錯誤',
      featuredArticles: '精選文章',
      trendingTopics: '熱門話題',
      recentPosts: '最新文章',
      popularPosts: '熱門文章',
      searchResults: '搜索結果',
      noArticlesFound: '沒有找到文章',
      backToBlog: '返回部落格',
      shareArticle: '分享文章',
      comments: '評論',
      leaveComment: '留下評論',
    },
    applicationTracker: {
      title: '申請跟踪',
      subtitle: '高效管理您的申請',
      addApplication: '添加申請',
      editApplication: '編輯申請',
      deleteApplication: '刪除申請',
      confirmDelete: '您確定要刪除這個申請嗎？',
      university: '大學',
      program: '項目',
      country: '國家',
      deadline: '截止日期',
      status: '狀態',
      notes: '備注',
      tasks: '任務',
      addTask: '添加任務',
      newTask: '新任務',
      requiredFields: '必填項',
      filterStatus: '按狀態篩選',
      sortBy: '排序依據',
      sortOrder: '排序順序',
      ascending: '升序',
      descending: '降序',
      allStatuses: '所有狀態',
      planning: '規劃中',
      inProgress: '進行中',
      submitted: '已提交',
      interview: '面試',
      accepted: '已接受',
      rejected: '已拒絕',
      waitlisted: '等待名單中',
      universityPlaceholder: '選擇大學',
      programPlaceholder: '選擇項目',
      countryPlaceholder: '選擇國家',
      notesPlaceholder: '輸入備注',
      taskPlaceholder: '輸入任務描述',
      overview: '申請概覽',
      totalApplications: '總申請數',
      submittedCount: '已提交',
      acceptedCount: '已接受',
      pending: '待處理',
      noApplicationsFound: '沒有找到申請',
      noApplicationsYet: '還沒有申請',
      noMatchingFilter: '沒有匹配的申請',
      showAllApplications: '顯示所有申請',
      addNewApplication: '添加新申請',
      saveChanges: '保存更改',
    },
    caseStudies: {
      title: '案例研究',
      subtitle: '真實世界中的成功案例',
      searchPlaceholder: '搜索案例研究...',
      filterBy: '按',
      lowGPA: '低GPA',
      international: '國際',
      scholarship: '獎學金',
      allStories: '所有故事',
      background: '背景',
      results: '結果',
      strategy: '策略',
      testimonial: '證言',
      gpa: 'GPA',
      testScores: '測試成績',
      extracurriculars: '課外活動',
      challenges: '挑戰',
      universitiesApplied: '申請的學校',
      acceptedTo: '被接受至',
      scholarshipReceived: '獲得的獎學金',
      admitted: '已錄取',
      notAdmitted: '未被錄取',
      readFullStory: '閱讀完整故事',
      successStories: '成功故事',
      lowGPAStories: '低GPA故事',
      internationalStories: '國際故事',
      scholarshipStories: '獎學金故事',
    },
    chatBot: {
      title: 'MatrixEdu聊天機器人',
      subtitle: '您的AI教育助手',
      backToHome: '返回首頁',
      chatTitle: '與MatrixEdu聊天',
      chatSubtitle: '詢問您教育旅程中的任何問題',
      messagePlaceholder: '輸入您的消息...',
      sendButton: '發送',
      you: '你',
      aiAssistant: 'MatrixEdu',
      welcomeMessage: '你好！我是MatrixEdu，您的AI教育助手。今天我能為您做些什麽？',
      helpMessage: '我在此幫助您解決教育旅程中的任何問題。請隨時向我提問！',
    },
    courses: {
      title: '課程',
      subtitle: '探索各種教育課程',
      allCourses: '所有課程',
      filterByCategory: '按類別篩選',
      searchPlaceholder: '搜索課程...',
      instructor: '講師',
      students: '學生',
      rating: '評分',
      price: '價格',
      enrollNow: '立即報名',
      viewDetails: '查看詳情',
      noCoursesFound: '沒有找到課程',
      categories: {
        all: '所有',
        computerScience: '計算機科學',
        business: '商業',
        dataScience: '數據科學',
        design: '設計',
        engineering: '工程',
      },
    },
    aiStudy: {
      title: 'AI學習助手',
      subtitle: '您的智能學習夥伴，由先進AI技術驅動',
      notesTaker: '筆記記錄',
      aiTutor: 'AI導師',
      mistakeChecker: '錯誤檢查',
      studyPlanner: '學習計劃',
      flashcards: '閃卡',
      contentWriter: '內容寫作',
      citationGenerator: '引用生成',
      progressTracker: '進度跟蹤',
      uploadHomework: '上傳作業',
      history: '歷史記錄',
      addAttachment: '添加附件',
      sendMessage: '發送消息',
      studyPlannerCalendar: '學習計劃與日曆',
      addTask: '添加任務',
      addNewStudyTask: '添加新學習任務',
      taskDescription: '任務描述',
      whatDoYouNeedToStudy: '您需要學習什麽？',
      taskName: '任務名稱',
      subject: '科目',
      egMathScienceHistory: '例如：數學、科學、歷史',
      dueDate: '截止日期',
      date: '日期',
      priority: '優先級',
      lowPriority: '低優先級',
      mediumPriority: '中優先級',
      highPriority: '高優先級',
      high: '高',
      medium: '中',
      low: '低',
      estimatedHours: '預計小時數',
      addToStudyPlan: '添加到學習計劃',
      addTaskButton: '添加任務',
      cancel: '取消',
      yourStudySchedule: '您的學習計劃',
      studyTasksWillAppearHere: '添加任務後，學習任務將顯示在這裡',
      noTasks: '沒有任務',
      noTasksDescription: '添加您的第一個學習任務開始吧！',
      completedTasks: '已完成任務',
      pendingTasks: '待完成任務',
      totalHours: '總小時數',
      aiTutorDescription: '獲得學習的即時幫助',
      checkMistakes: '檢查錯誤',
      checkMistakesDescription: '上傳您的作業以識別錯誤',
      contentWriterDescription: '生成學習材料和論文',
      homeworkHelper: '作業助手',
      homeworkHelperDescription: '獲得逐步解決方案',
      smartStudyRecommendations: '智能學習建議',
      basedOnYourUpcomingTasks: '基於您即將到來的任務和學習模式，這裡是個性化建議',
      startWithMathematicsHomework: '首先從數學作業開始，因為它的截止日期最早',
      block2HourFocusSessions: '安排2小時專注學習時間，中間休息15分鐘以提高記憶效果',
      useTheAiStudyAssistant: '對於困難概念，使用AI學習助手',
      studyTimer: '學習計時器',
      taskManager: '任務管理',
      taskPlaceholder: '輸入任務描述',
      completed: '已完成',
      pending: '待完成',
      createFlashcard: '創建閃卡',
      frontText: '正面文本',
      backText: '背面文本',
      nextCard: '下一張',
      previousCard: '上一張',
      markMastered: '標記為掌握',
      showAnswer: '顯示答案',
      studyMode: '學習模式',
      reviewMode: '複習模式',
      startTimer: '開始計時',
      stopTimer: '停止計時',
      resetTimer: '重置計時',
      pomodoroTimer: '番茄計時器',
      breakTime: '休息時間',
      focusTime: '專注時間',
      generateCitation: '生成引用',
      checkGrammar: '檢查語法',
      improveWriting: '改進寫作',
      askTutor: '詢問導師',
      getHelp: '獲取幫助',
      saveNotes: '保存筆記',
      exportNotes: '導出筆記',
      typeMessage: '輸入消息',
      newTask: '新任務',
      addNewTask: '添加新任務',
      question: '問題',
      answer: '答案',
      addFlashcard: '添加閃卡',
      mastered: '已掌握',
      notMastered: '未掌握',
      showAnswerButton: '顯示答案',
      previousButton: '上一個',
      nextButton: '下一個',
      markAsMastered: '標記為掌握',
      viewCalendar: '查看日曆',
      taskCompleted: '任務已完成',
      taskPending: '任務待完成',
      noTasksYet: '還沒有任務',
      noFlashcardsYet: '還沒有閃卡',
      createFirstFlashcard: '創建第一張閃卡',
      addFirstTask: '添加第一個任務',
      instant_homework_help: '即時作業幫助',
      try_now: '立即嘗試',
      ai_content_writer: 'AI內容寫作',
      start_writing: '開始寫作',
      ask_ai_tutor: '詢問AI導師',
      ai_tutor_chat: 'AI導師聊天',
      chat_now: '立即聊天',
      checkMistakesTitle: '檢查錯誤',
      citationGeneratorTitle: '引用生成',
      flashcardsTitle: '閃卡',
      studyCards: '學習卡片',
      cardOf: '的',
      masteredLabel: '已掌握',
      showAnswerBtn: '顯示答案',
      markAsMasteredBtn: '標記為掌握',
      unmarkBtn: '取消標記',
      hideAnswerBtn: '隱藏答案',
      previousBtn: '上一張',
      nextBtn: '下一張',
      noFlashcardsMessage: '還沒有閃卡',
      createFirstFlashcardMessage: '創建第一張閃卡',
      createFlashcardsTitle: '創建閃卡',
      generateFromNotes: '從筆記生成',
      orCreateManually: '或手動創建',
      questionLabel: '問題',
      answerLabel: '答案',
      questionPlaceholder: '輸入問題',
      answerPlaceholder: '輸入答案',
      addFlashcardBtn: '添加閃卡',
      studySessions: '學習會話',
      thisMonth: '本月',
      problemsSolved: '已解決問題',
      total: '總數',
      accuracyRate: '準確率',
      average: '平均',
      recentActivity: '最近活動',
      completedMathHomework: '已完成數學作業',
      hoursAgo: '小時前',
      usedAiTutorPhysics: '使用了AI導師物理',
      createdFlashcards: '創建了閃卡',
      dayAgo: '天前',
      instantHomeworkHelp: '即時作業幫助',
      tryNow: '立即嘗試',
      aiContentWriter: 'AI內容寫作',
      startWriting: '開始寫作',
      aiTutorChat: 'AI導師聊天',
      chatNow: '立即聊天',
      instantHomeworkHelpTitle: '即時作業幫助',
      instantHomeworkHelpDesc: '通過我們的AI驅動系統立即獲得作業問題的幫助。',
      tryNowBtn: '立即嘗試',
      aiContentWriterTitle: 'AI內容寫作',
      aiContentWriterDesc: '在AI幫助下為論文、報告和作業生成高質量內容。',
      startWritingBtn: '開始寫作',
      aiTutorChatTitle: 'AI導師聊天',
      aiTutorChatDesc: '與我們的智能AI導師聊天，獲得個性化學習支持和解釋。',
      chatNowBtn: '立即聊天',
    },
    aiCourses: {
      title: 'AI課程',
      subtitle: '您的AI課程助手',
      searchPlaceholder: '搜索AI課程...',
      filterByType: '按類型篩選',
      filterByLevel: '按級別篩選',
      filterByProvider: '按提供者篩選',
      allTypes: '所有類型',
      allLevels: '所有級別',
      allProviders: '所有提供者',
      university: '大學',
      certification: '認證',
      tutorial: '教程',
      beginner: '初學者',
      intermediate: '中級',
      advanced: '高級',
      duration: '持續時間',
      rating: '評分',
      students: '學生',
      instructor: '講師',
      prerequisites: '先決條件',
      skills: '技能',
      price: '價格',
      free: '免費',
      paid: '付費',
      enrollNow: '立即報名',
      viewDetails: '查看詳情',
      addToWishlist: '添加到願望清單',
      removeFromWishlist: '從願望清單中移除',
      featuredCourses: '精選課程',
      popularCourses: '熱門課程',
      newCourses: '新課程',
      topRated: '評分最高',
      noCoursesFound: '沒有找到課程',
      courseDetails: '課程詳情',
      syllabus: '課程大綱',
      reviews: '評論',
      relatedCourses: '相關課程',
      startLearning: '開始學習',
      continueWatching: '繼續觀看',
      completed: '已完成',
      inProgress: '進行中',
      notStarted: '未開始',
    },
  },
};

export const getTranslation = (language: Language, key: string): string => {
  const keys = key.split('.');
  let value: any = translations[language];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English if key not found
      value = translations.en;
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey];
        } else {
          return key; // Return key if not found in fallback
        }
      }
      break;
    }
  }
  
  return typeof value === 'string' ? value : key;
}; 