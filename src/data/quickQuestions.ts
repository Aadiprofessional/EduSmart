export interface QuickQuestion {
  id: string;
  text: string;
  category: string;
  requiresAuth?: boolean;
  requiresPro?: boolean;
  followUpQuestions?: QuickQuestion[];
  response?: string;
  actionPath?: string;
  icon?: string;
}

export const quickQuestionsData: QuickQuestion[] = [
  // Welcome & Getting Started
  {
    id: 'welcome',
    text: "What is MatrixEdu?",
    category: "about",
    icon: "🚀",
    response: "MatrixEdu is your AI-powered educational companion! We help students learn smarter, find perfect universities, and achieve academic success through cutting-edge AI technology.",
    followUpQuestions: [
      {
        id: 'features',
        text: "What features do you offer?",
        category: "features",
        icon: "⚡",
        response: "We offer AI Tutoring, University Database with 10,000+ institutions, Application Tracking, Content Writing, Document Analysis, Citation Generation, Interactive Courses, and Personalized Learning Paths!",
        followUpQuestions: [
          {
            id: 'ai-features',
            text: "Tell me about AI features",
            category: "ai",
            icon: "🤖",
            requiresPro: true,
            response: "Our AI features include: Smart Tutoring with step-by-step explanations, Essay Writing assistance, Homework Analysis, Citation Generation, Personalized Learning Paths, and 24/7 AI support."
          },
          {
            id: 'university-features',
            text: "University search features",
            category: "universities",
            icon: "🎓",
            requiresAuth: true,
            response: "Search 10,000+ universities worldwide, track applications, check requirements, compare programs, get AI-powered recommendations, and access exclusive insights."
          },
          {
            id: 'course-features',
            text: "Course and learning features",
            category: "courses",
            icon: "📚",
            requiresAuth: true,
            response: "Access interactive courses, video lectures, practice quizzes, progress tracking, certificates, and AI-powered study recommendations."
          }
        ]
      },
      {
        id: 'pricing',
        text: "How much does it cost?",
        category: "pricing",
        icon: "💰",
        response: "We offer flexible pricing: Free tier with basic features, Student Pro at $9.99/month, and Premium at $19.99/month for unlimited AI access and premium tools.",
        actionPath: "/subscription",
        followUpQuestions: [
          {
            id: 'free-features',
            text: "What's included in free?",
            category: "free",
            icon: "🆓",
            response: "Free tier includes: Basic university search, limited AI responses (5/day), course previews, and community access."
          },
          {
            id: 'pro-comparison',
            text: "Compare all plans",
            category: "comparison",
            icon: "📊",
            response: "Free: Basic features | Student Pro: Unlimited AI, essay help, premium courses | Premium: Everything + priority support, advanced analytics",
            actionPath: "/subscription"
          }
        ]
      },
      {
        id: 'getting-started',
        text: "How do I get started?",
        category: "help",
        icon: "🎯",
        response: "Getting started is easy! Create your account, complete your profile, explore our features, and begin your AI-powered learning journey with personalized recommendations.",
        followUpQuestions: [
          {
            id: 'signup-help',
            text: "Help me create an account",
            category: "signup",
            icon: "✨",
            response: "I'll guide you to create your MatrixEdu account. You'll get access to courses, university database, and basic AI features instantly!",
            actionPath: "/signup"
          },
          {
            id: 'first-steps',
            text: "What should I do first?",
            category: "guide",
            icon: "📋",
            response: "Start by: 1) Complete your profile, 2) Take our learning assessment, 3) Explore courses or search universities, 4) Try our AI assistant!"
          },
          {
            id: 'profile-setup',
            text: "Help me set up my profile",
            category: "profile-setup",
            icon: "👤",
            requiresAuth: true,
            response: "I'll help you create a comprehensive profile including academic interests, goals, and preferences for better AI recommendations.",
            actionPath: "/profile"
          }
        ]
      }
    ]
  },

  // Learning & AI Tutoring
  {
    id: 'learning',
    text: "Help me with studying",
    category: "aitutor",
    icon: "📚",
    requiresAuth: true,
    response: "I'm your AI study companion! I can help with homework, create study materials, explain concepts, provide tutoring, generate practice tests, and create personalized learning plans.",
    followUpQuestions: [
      {
        id: 'homework-help',
        text: "I need homework help",
        category: "homework",
        icon: "📝",
        requiresPro: true,
        response: "Upload your homework and I'll provide detailed analysis, step-by-step solutions, corrections, and explanations to help you understand better.",
        actionPath: "/ai-study",
        followUpQuestions: [
          {
            id: 'math-homework',
            text: "Math homework help",
            category: "math-help",
            icon: "🔢",
            requiresPro: true,
            response: "I can solve math problems step-by-step, explain concepts, and help with algebra, calculus, geometry, statistics, and more."
          },
          {
            id: 'writing-homework',
            text: "Writing assignments",
            category: "writing-help",
            icon: "✍️",
            requiresPro: true,
            response: "I'll help with essays, research papers, creative writing, grammar checking, and improving your writing style."
          },
          {
            id: 'science-homework',
            text: "Science homework help",
            category: "science-help",
            icon: "🔬",
            requiresPro: true,
            response: "Get help with physics, chemistry, biology, earth science, and lab reports with detailed explanations."
          }
        ]
      },
      {
        id: 'study-materials',
        text: "Create study materials",
        category: "flashcards",
        icon: "🗂️",
        requiresPro: true,
        response: "I can create flashcards, summaries, mind maps, practice questions, and study guides tailored to your learning needs and style.",
        followUpQuestions: [
          {
            id: 'flashcards',
            text: "Generate flashcards",
            category: "flashcards",
            icon: "🃏",
            requiresPro: true,
            response: "I'll create interactive flashcards for any topic with spaced repetition algorithms for optimal learning retention."
          },
          {
            id: 'practice-questions',
            text: "Create practice questions",
            category: "quiz",
            icon: "❓",
            requiresPro: true,
            response: "I'll generate practice questions with detailed explanations, multiple choice, short answer, and essay questions."
          },
          {
            id: 'study-guides',
            text: "Generate study guides",
            category: "study-guides",
            icon: "📖",
            requiresPro: true,
            response: "I'll create comprehensive study guides with key concepts, summaries, and important points organized for easy review."
          },
          {
            id: 'mind-maps',
            text: "Create mind maps",
            category: "mind-maps",
            icon: "🧠",
            requiresPro: true,
            response: "I'll design visual mind maps to help you understand complex topics and see connections between concepts."
          }
        ]
      },
      {
        id: 'explain-concepts',
        text: "Explain difficult concepts",
        category: "explanation",
        icon: "💡",
        requiresPro: true,
        response: "I can break down complex topics into simple, easy-to-understand explanations with examples, analogies, and visual aids.",
        followUpQuestions: [
          {
            id: 'math-concepts',
            text: "Math concepts explanation",
            category: "math",
            icon: "🔢",
            requiresPro: true,
            response: "I can explain mathematical concepts from basic arithmetic to advanced calculus with step-by-step reasoning."
          },
          {
            id: 'science-concepts',
            text: "Science concepts explanation",
            category: "science",
            icon: "🔬",
            requiresPro: true,
            response: "I'll explain scientific concepts with real-world examples, experiments, and visual analogies across all sciences."
          },
          {
            id: 'history-concepts',
            text: "History and social studies",
            category: "history",
            icon: "🏛️",
            requiresPro: true,
            response: "I'll help you understand historical events, social concepts, and their connections with engaging narratives."
          },
          {
            id: 'language-concepts',
            text: "Language and literature",
            category: "language",
            icon: "📝",
            requiresPro: true,
            response: "I can help with grammar, literature analysis, writing techniques, and language learning concepts."
          }
        ]
      },
      {
        id: 'test-prep',
        text: "Test preparation help",
        category: "test-prep",
        icon: "🎯",
        requiresPro: true,
        response: "I'll help you prepare for exams with practice tests, study schedules, test-taking strategies, and personalized review sessions.",
        followUpQuestions: [
          {
            id: 'sat-prep',
            text: "SAT preparation",
            category: "sat",
            icon: "📊",
            requiresPro: true,
            response: "Comprehensive SAT prep with practice questions, test strategies, and personalized study plans for all sections."
          },
          {
            id: 'ap-prep',
            text: "AP exam preparation",
            category: "ap",
            icon: "🏆",
            requiresPro: true,
            response: "Specialized AP exam prep with subject-specific practice, FRQ help, and scoring strategies."
          }
        ]
      }
    ]
  },

  // University & Applications
  {
    id: 'universities',
    text: "Find universities for me",
    category: "universities",
    icon: "🏛️",
    requiresAuth: true,
    response: "I'll help you discover the perfect universities! Search our database of 10,000+ institutions by location, program, ranking, or let our AI recommend based on your profile.",
    followUpQuestions: [
      {
        id: 'search-universities',
        text: "Search by preferences",
        category: "search",
        icon: "🔍",
        requiresAuth: true,
        response: "Tell me your preferred location, field of study, budget, and other criteria. I'll find matching universities with detailed information.",
        actionPath: "/database",
        followUpQuestions: [
          {
            id: 'location-search',
            text: "Search by location",
            category: "location",
            icon: "🌍",
            requiresAuth: true,
            response: "Find universities in specific countries, states, or cities with local insights and cultural information."
          },
          {
            id: 'program-search',
            text: "Search by program",
            category: "program",
            icon: "🎓",
            requiresAuth: true,
            response: "Discover universities with strong programs in your field of interest with ranking and specialization details."
          },
          {
            id: 'budget-search',
            text: "Search by budget",
            category: "budget",
            icon: "💰",
            requiresAuth: true,
            response: "Find universities that fit your budget with tuition information, scholarships, and financial aid options."
          }
        ]
      },
      {
        id: 'university-rankings',
        text: "Show me top universities",
        category: "rankings",
        icon: "🏆",
        requiresAuth: true,
        response: "I can show you top-ranked universities by field, country, or overall rankings with detailed comparison data.",
        followUpQuestions: [
          {
            id: 'us-universities',
            text: "Top US universities",
            category: "us-unis",
            icon: "🇺🇸",
            requiresAuth: true,
            response: "Explore the best universities in the United States across Ivy League, public, and specialized institutions."
          },
          {
            id: 'uk-universities',
            text: "Top UK universities",
            category: "uk-unis",
            icon: "🇬🇧",
            requiresAuth: true,
            response: "Discover top UK universities including Oxford, Cambridge, and other prestigious Russell Group institutions."
          },
          {
            id: 'canadian-universities',
            text: "Top Canadian universities",
            category: "canada-unis",
            icon: "🇨🇦",
            requiresAuth: true,
            response: "Find excellent Canadian universities known for quality education and international student support."
          },
          {
            id: 'global-rankings',
            text: "Global university rankings",
            category: "global",
            icon: "🌐",
            requiresAuth: true,
            response: "Compare universities worldwide using QS, Times Higher Education, and other international ranking systems."
          }
        ]
      },
      {
        id: 'application-help',
        text: "Help with applications",
        category: "applications",
        icon: "📋",
        requiresAuth: true,
        response: "I'll guide you through the entire application process, track deadlines, help with requirements, and optimize your applications.",
        followUpQuestions: [
          {
            id: 'track-applications',
            text: "Track my applications",
            category: "tracking",
            icon: "📊",
            requiresAuth: true,
            response: "Keep track of all your university applications, deadlines, requirements, and status updates in one organized dashboard.",
            actionPath: "/database"
          },
          {
            id: 'application-essays',
            text: "Help with application essays",
            category: "essays",
            icon: "✍️",
            requiresPro: true,
            response: "I'll help you write compelling personal statements, supplemental essays, and application essays that showcase your unique story.",
            actionPath: "/ai-study"
          },
          {
            id: 'recommendation-letters',
            text: "Recommendation letter guidance",
            category: "recommendations",
            icon: "📝",
            requiresAuth: true,
            response: "Get advice on requesting recommendation letters, choosing recommenders, and providing them with helpful information."
          },
          {
            id: 'interview-prep',
            text: "Interview preparation",
            category: "interviews",
            icon: "🎤",
            requiresPro: true,
            response: "Practice common interview questions, learn techniques, and build confidence for college admission interviews."
          }
        ]
      },
      {
        id: 'scholarships',
        text: "Find scholarships",
        category: "scholarships",
        icon: "💎",
        requiresAuth: true,
        response: "Discover scholarship opportunities based on your profile, academic achievements, and financial needs.",
        followUpQuestions: [
          {
            id: 'merit-scholarships',
            text: "Merit-based scholarships",
            category: "merit",
            icon: "🏅",
            requiresAuth: true,
            response: "Find scholarships based on academic excellence, test scores, and achievements."
          },
          {
            id: 'need-scholarships',
            text: "Need-based aid",
            category: "need-based",
            icon: "🤝",
            requiresAuth: true,
            response: "Explore financial aid options and need-based scholarships to make education affordable."
          }
        ]
      }
    ]
  },

  // Content Creation
  {
    id: 'content-creation',
    text: "Help me write content",
    category: "contentwriter",
    icon: "✍️",
    requiresAuth: true,
    requiresPro: true,
    response: "I'm your AI writing assistant! I can help with essays, research papers, creative writing, academic content, citations, and editing.",
    followUpQuestions: [
      {
        id: 'essay-writing',
        text: "Write an essay",
        category: "essay",
        icon: "📄",
        requiresPro: true,
        response: "I'll help you write high-quality essays with proper structure, compelling arguments, evidence, and perfect citations.",
        actionPath: "/ai-study",
        followUpQuestions: [
          {
            id: 'argumentative-essay',
            text: "Argumentative essay",
            category: "argumentative",
            icon: "⚖️",
            requiresPro: true,
            response: "I'll help you craft compelling argumentative essays with strong thesis statements, evidence, and logical reasoning."
          },
          {
            id: 'research-paper',
            text: "Research paper",
            category: "research",
            icon: "🔬",
            requiresPro: true,
            response: "I'll assist with research papers including topic selection, outline creation, source integration, and academic formatting."
          },
          {
            id: 'narrative-essay',
            text: "Narrative essay",
            category: "narrative",
            icon: "📚",
            requiresPro: true,
            response: "Create engaging narrative essays with compelling storytelling, character development, and meaningful themes."
          },
          {
            id: 'analytical-essay',
            text: "Analytical essay",
            category: "analytical",
            icon: "🔍",
            requiresPro: true,
            response: "Write thorough analytical essays with deep analysis, critical thinking, and well-supported interpretations."
          }
        ]
      },
      {
        id: 'citations',
        text: "Generate citations",
        category: "citations",
        icon: "📚",
        requiresPro: true,
        response: "I'll create properly formatted citations in APA, MLA, Chicago, Harvard, or any other academic style you need.",
        followUpQuestions: [
          {
            id: 'apa-citations',
            text: "APA style citations",
            category: "apa",
            icon: "📖",
            requiresPro: true,
            response: "I'll generate perfect APA style citations for books, journal articles, websites, and all other source types."
          },
          {
            id: 'mla-citations',
            text: "MLA style citations",
            category: "mla",
            icon: "📑",
            requiresPro: true,
            response: "I'll create MLA format citations with proper formatting, punctuation, and Works Cited page structure."
          },
          {
            id: 'chicago-citations',
            text: "Chicago style citations",
            category: "chicago",
            icon: "🏛️",
            requiresPro: true,
            response: "Generate Chicago/Turabian style citations with footnotes, endnotes, and bibliography formatting."
          }
        ]
      },
      {
        id: 'creative-writing',
        text: "Creative writing help",
        category: "creative",
        icon: "🎨",
        requiresPro: true,
        response: "I'll help with creative writing including stories, poems, scripts, and character development with inspiration and techniques.",
        followUpQuestions: [
          {
            id: 'story-writing',
            text: "Write a story",
            category: "story",
            icon: "📖",
            requiresPro: true,
            response: "Create engaging stories with plot development, character arcs, dialogue, and compelling narratives."
          },
          {
            id: 'poetry-writing',
            text: "Write poetry",
            category: "poetry",
            icon: "🌹",
            requiresPro: true,
            response: "Craft beautiful poetry with various forms, meters, rhyme schemes, and emotional expression."
          }
        ]
      },
      {
        id: 'editing-proofreading',
        text: "Edit and proofread",
        category: "editing",
        icon: "✏️",
        requiresPro: true,
        response: "I'll review your writing for grammar, style, clarity, structure, and provide suggestions for improvement.",
        followUpQuestions: [
          {
            id: 'grammar-check',
            text: "Grammar and spelling",
            category: "grammar",
            icon: "✅",
            requiresPro: true,
            response: "Comprehensive grammar and spelling check with explanations for corrections and style improvements."
          },
          {
            id: 'style-improvement',
            text: "Style and clarity",
            category: "style",
            icon: "💫",
            requiresPro: true,
            response: "Enhance your writing style, improve clarity, eliminate redundancy, and strengthen your voice."
          }
        ]
      }
    ]
  },

  // Account & Profile
  {
    id: 'account',
    text: "Account & Profile",
    category: "account",
    icon: "👤",
    response: "Manage your MatrixEdu account, update preferences, customize your learning experience, and access your dashboard.",
    followUpQuestions: [
      {
        id: 'login-help',
        text: "I need to log in",
        category: "login",
        icon: "🔑",
        response: "I'll help you sign in to your MatrixEdu account to access all features and your personalized dashboard.",
        actionPath: "/login"
      },
      {
        id: 'create-account',
        text: "Create new account",
        category: "signup",
        icon: "✨",
        response: "Join MatrixEdu today! Create your account and start your AI-powered learning journey with personalized recommendations.",
        actionPath: "/signup",
        followUpQuestions: [
          {
            id: 'student-account',
            text: "I'm a student",
            category: "student",
            icon: "🎓",
            response: "Perfect! Student accounts get access to courses, university database, AI tutoring, and special student pricing."
          },
          {
            id: 'educator-account',
            text: "I'm an educator",
            category: "educator",
            icon: "👨‍🏫",
            response: "Educator accounts have special features for creating content, managing student progress, and accessing teaching resources."
          },
          {
            id: 'parent-account',
            text: "I'm a parent",
            category: "parent",
            icon: "👨‍👩‍👧‍👦",
            response: "Parent accounts allow you to monitor your child's progress and access family-friendly educational resources."
          }
        ]
      },
      {
        id: 'profile-settings',
        text: "Update my profile",
        category: "profile",
        icon: "⚙️",
        requiresAuth: true,
        response: "Customize your profile with academic interests, learning goals, preferences, and personal information for better AI recommendations.",
        actionPath: "/profile",
        followUpQuestions: [
          {
            id: 'learning-preferences',
            text: "Set learning preferences",
            category: "preferences",
            icon: "🎯",
            requiresAuth: true,
            response: "Customize how you learn best with visual, auditory, or kinesthetic preferences and study schedule settings."
          },
          {
            id: 'notification-settings',
            text: "Notification settings",
            category: "notifications",
            icon: "🔔",
            requiresAuth: true,
            response: "Manage your notification preferences for study reminders, course updates, and important announcements."
          }
        ]
      },
      {
        id: 'dashboard-help',
        text: "Navigate my dashboard",
        category: "dashboard",
        icon: "📊",
        requiresAuth: true,
        response: "I'll help you navigate your personalized dashboard with progress tracking, recommendations, and quick access to features.",
        actionPath: "/dashboard"
      }
    ]
  },

  // Subscription & Pricing
  {
    id: 'subscription',
    text: "Upgrade to Pro",
    category: "upgrade",
    icon: "👑",
    response: "Unlock Premium Features! Get unlimited AI responses, advanced tools, priority support, and exclusive content with MatrixEdu Pro.",
    followUpQuestions: [
      {
        id: 'pro-features',
        text: "What's included in Pro?",
        category: "pro-features",
        icon: "⭐",
        response: "Pro includes: Unlimited AI responses, advanced tutoring, essay writing, citation generator, priority support, exclusive courses, and analytics dashboard!",
        actionPath: "/subscription"
      },
      {
        id: 'pricing-plans',
        text: "Show me pricing plans",
        category: "pricing",
        icon: "💳",
        response: "Choose from our flexible pricing: Free (basic features), Student Pro ($9.99/month), Premium ($19.99/month), and Family plans available.",
        actionPath: "/subscription",
        followUpQuestions: [
          {
            id: 'student-discount',
            text: "Student discounts available?",
            category: "discount",
            icon: "🎓",
            response: "Yes! We offer 50% student discounts. Verify your student status with SheerID for exclusive pricing."
          },
          {
            id: 'free-trial',
            text: "Free trial available?",
            category: "trial",
            icon: "🆓",
            response: "Try Pro features free for 14 days! No commitment required, cancel anytime during the trial period."
          },
          {
            id: 'family-plans',
            text: "Family subscription options",
            category: "family",
            icon: "👨‍👩‍👧‍👦",
            response: "Family plans available for up to 6 members with shared resources and parental controls at discounted rates."
          }
        ]
      },
      {
        id: 'upgrade-now',
        text: "Upgrade my account",
        category: "upgrade-now",
        icon: "🚀",
        response: "Ready to upgrade? I'll guide you through the simple upgrade process with secure payment and instant access.",
        actionPath: "/subscription"
      },
      {
        id: 'billing-help',
        text: "Billing and payments",
        category: "billing",
        icon: "💰",
        requiresAuth: true,
        response: "Manage your subscription, update payment methods, view billing history, and handle payment issues.",
        followUpQuestions: [
          {
            id: 'payment-methods',
            text: "Update payment method",
            category: "payment",
            icon: "💳",
            requiresAuth: true,
            response: "Securely update your payment information including credit cards, PayPal, and other payment options."
          },
          {
            id: 'cancel-subscription',
            text: "Cancel subscription",
            category: "cancel",
            icon: "❌",
            requiresAuth: true,
            response: "I can help you cancel your subscription. You'll retain access until the end of your billing period."
          }
        ]
      }
    ]
  },

  // Courses & Learning Materials
  {
    id: 'courses',
    text: "Browse courses",
    category: "courses",
    icon: "📖",
    requiresAuth: true,
    response: "Explore our comprehensive course library with AI-powered learning paths, interactive content, and personalized recommendations.",
    followUpQuestions: [
      {
        id: 'popular-courses',
        text: "Show popular courses",
        category: "popular",
        icon: "🔥",
        requiresAuth: true,
        response: "Here are the most popular courses chosen by students: Programming, Data Science, Mathematics, Language Learning, and Business.",
        actionPath: "/courses"
      },
      {
        id: 'course-categories',
        text: "Browse by category",
        category: "categories",
        icon: "📚",
        requiresAuth: true,
        response: "Explore courses by subject: STEM, Humanities, Languages, Business, Arts, Test Prep, and Professional Development!",
        followUpQuestions: [
          {
            id: 'programming-courses',
            text: "Programming courses",
            category: "programming",
            icon: "💻",
            requiresAuth: true,
            response: "Learn coding with our interactive programming courses: Python, JavaScript, Java, C++, Web Development, and more!"
          },
          {
            id: 'language-courses',
            text: "Language learning",
            category: "languages",
            icon: "🌍",
            requiresAuth: true,
            response: "Master new languages with AI-powered conversation practice: Spanish, French, German, Mandarin, and 20+ more languages."
          },
          {
            id: 'math-courses',
            text: "Mathematics courses",
            category: "mathematics",
            icon: "🔢",
            requiresAuth: true,
            response: "Strengthen your math skills from basic arithmetic to advanced calculus, statistics, and discrete mathematics."
          },
          {
            id: 'science-courses',
            text: "Science courses",
            category: "science",
            icon: "🔬",
            requiresAuth: true,
            response: "Explore physics, chemistry, biology, earth science, and environmental science with interactive labs and simulations."
          }
        ]
      },
      {
        id: 'my-courses',
        text: "My enrolled courses",
        category: "my-courses",
        icon: "📋",
        requiresAuth: true,
        response: "View your enrolled courses, track progress, access certificates, and continue learning where you left off.",
        actionPath: "/dashboard"
      },
      {
        id: 'course-recommendations',
        text: "Get course recommendations",
        category: "recommendations",
        icon: "🎯",
        requiresAuth: true,
        response: "Get AI-powered course recommendations based on your interests, goals, and learning history.",
        followUpQuestions: [
          {
            id: 'career-based',
            text: "Courses for my career",
            category: "career",
            icon: "💼",
            requiresAuth: true,
            response: "Find courses aligned with your career goals and industry requirements for professional development."
          },
          {
            id: 'skill-based',
            text: "Courses to build skills",
            category: "skills",
            icon: "🛠️",
            requiresAuth: true,
            response: "Discover courses to develop specific skills like critical thinking, communication, leadership, and technical abilities."
          }
        ]
      }
    ]
  },

  // Technical Support
  {
    id: 'support',
    text: "I need help",
    category: "support",
    icon: "🆘",
    response: "I'm here to help! What specific issue are you experiencing? I can assist with technical problems, account issues, or feature guidance.",
    followUpQuestions: [
      {
        id: 'technical-issues',
        text: "Technical problems",
        category: "technical",
        icon: "🔧",
        response: "Let me help you resolve any technical issues you're experiencing with the platform, features, or performance.",
        followUpQuestions: [
          {
            id: 'login-problems',
            text: "Can't log in",
            category: "login-issue",
            icon: "🔐",
            response: "I'll help you troubleshoot login issues. Try resetting your password, clearing browser cache, or checking your email for verification."
          },
          {
            id: 'payment-issues',
            text: "Payment problems",
            category: "payment",
            icon: "💳",
            response: "For payment issues, check your payment method, contact your bank, or reach out to our support team for immediate assistance."
          },
          {
            id: 'loading-issues',
            text: "Pages not loading",
            category: "loading",
            icon: "⏳",
            response: "Try refreshing the page, clearing your browser cache, checking your internet connection, or trying a different browser."
          },
          {
            id: 'mobile-issues',
            text: "Mobile app problems",
            category: "mobile",
            icon: "📱",
            response: "For mobile app issues, try updating the app, restarting your device, or reinstalling the application."
          }
        ]
      },
      {
        id: 'feature-questions',
        text: "How to use features",
        category: "how-to",
        icon: "❓",
        response: "I'll guide you through using any MatrixEdu feature. What would you like to learn about?",
        followUpQuestions: [
          {
            id: 'ai-tutor-guide',
            text: "How to use AI Tutor",
            category: "ai-guide",
            icon: "🤖",
            requiresPro: true,
            response: "The AI Tutor can help with homework, explanations, and personalized learning. Upload documents, ask questions, and get detailed responses!"
          },
          {
            id: 'university-search-guide',
            text: "How to search universities",
            category: "search-guide",
            icon: "🔍",
            requiresAuth: true,
            response: "Use filters for location, program, ranking, and budget. Save favorites, compare options, and track applications easily."
          },
          {
            id: 'course-navigation',
            text: "How to navigate courses",
            category: "course-guide",
            icon: "📚",
            requiresAuth: true,
            response: "Access course materials, track progress, take quizzes, and earn certificates. Use the dashboard to manage all your courses."
          }
        ]
      },
      {
        id: 'contact-support',
        text: "Contact human support",
        category: "contact",
        icon: "👥",
        response: "Need to speak with our support team? I can connect you with human agents for complex issues or account-specific problems.",
        followUpQuestions: [
          {
            id: 'live-chat',
            text: "Start live chat",
            category: "chat",
            icon: "💬",
            response: "Connect with our support team via live chat for immediate assistance with your questions."
          },
          {
            id: 'email-support',
            text: "Email support",
            category: "email",
            icon: "📧",
            response: "Send us an email at support@matrixedu.com for detailed assistance. We respond within 24 hours."
          }
        ]
      }
    ]
  },

  // Course-specific AI Assistant questions
  {
    id: 'explain-concept',
    text: "Explain this concept to me",
    category: "concept-explanation",
    icon: "💡",
    response: "I can break down complex concepts into simple, easy-to-understand explanations. What specific topic would you like me to explain?",
    followUpQuestions: [
      {
        id: 'step-by-step',
        text: "Give me step-by-step explanation",
        category: "detailed",
        icon: "📝",
        response: "I'll provide a detailed, step-by-step breakdown of the concept with examples and practice problems."
      },
      {
        id: 'visual-explanation',
        text: "Explain with examples",
        category: "examples",
        icon: "🎯",
        response: "I'll use real-world examples and analogies to make the concept clearer and more relatable."
      },
      {
        id: 'practice-problems',
        text: "Give me practice problems",
        category: "practice",
        icon: "🔢",
        response: "I'll create practice problems to help you apply and reinforce your understanding of this concept."
      }
    ]
  },

  {
    id: 'lecture-summary',
    text: "Summarize this lecture",
    category: "lecture-help",
    icon: "📋",
    response: "I can provide a comprehensive summary of the lecture content, highlighting key points and important concepts.",
    followUpQuestions: [
      {
        id: 'key-points',
        text: "What are the key points?",
        category: "key-points",
        icon: "⭐",
        response: "Here are the most important takeaways and key concepts from this lecture that you should remember."
      },
      {
        id: 'study-notes',
        text: "Create study notes",
        category: "notes",
        icon: "📝",
        response: "I'll organize the lecture content into structured study notes for easy review and memorization."
      },
      {
        id: 'quiz-questions',
        text: "Create quiz questions",
        category: "quiz",
        icon: "❓",
        response: "I'll generate quiz questions based on this lecture to help you test your understanding."
      }
    ]
  },

  {
    id: 'homework-check',
    text: "Check my understanding",
    category: "understanding",
    icon: "✅",
    response: "I can help verify your understanding through questions, explanations, and guided practice.",
    followUpQuestions: [
      {
        id: 'concept-check',
        text: "Test my knowledge",
        category: "test",
        icon: "🎯",
        response: "I'll ask you questions to assess your understanding and identify areas that need more practice."
      },
      {
        id: 'common-mistakes',
        text: "What are common mistakes?",
        category: "mistakes",
        icon: "⚠️",
        response: "I'll highlight common misconceptions and mistakes students make with this topic."
      }
    ]
  }
];

// Helper function to get questions by category
export const getQuestionsByCategory = (category: string): QuickQuestion[] => {
  return quickQuestionsData.filter(q => q.category === category);
};

// Helper function to get random questions
export const getRandomQuestions = (count: number = 6): QuickQuestion[] => {
  const shuffled = [...quickQuestionsData].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper function to get initial welcome questions for ChatBot (with welcome message)
export const getInitialQuestions = (): QuickQuestion[] => {
  return [
    quickQuestionsData.find(q => q.id === 'welcome')!,
    quickQuestionsData.find(q => q.id === 'learning')!,
    quickQuestionsData.find(q => q.id === 'universities')!,
    quickQuestionsData.find(q => q.id === 'content-creation')!,
    quickQuestionsData.find(q => q.id === 'account')!,
    quickQuestionsData.find(q => q.id === 'subscription')!
  ];
};

// Helper function to get questions for AI Assistant (course-focused, no welcome message)
export const getAIAssistantQuestions = (): QuickQuestion[] => {
  return [
    quickQuestionsData.find(q => q.id === 'explain-concept')!,
    quickQuestionsData.find(q => q.id === 'lecture-summary')!,
    quickQuestionsData.find(q => q.id === 'homework-check')!,
    quickQuestionsData.find(q => q.id === 'learning')!,
    quickQuestionsData.find(q => q.id === 'content-creation')!
  ].filter(Boolean);
};

// Helper function to count total questions (including nested)
export const getTotalQuestionCount = (): number => {
  const countQuestions = (questions: QuickQuestion[]): number => {
    let count = questions.length;
    questions.forEach(q => {
      if (q.followUpQuestions) {
        count += countQuestions(q.followUpQuestions);
      }
    });
    return count;
  };
  return countQuestions(quickQuestionsData);
}; 