import type {BlogPost, Project, SiteSettingsMap} from '../types/database';

/**
 * CENTRAL EDITABLE CONTENT SOURCE
 * ---------------------------------------------------------------------------
 * Every piece of static profile copy, links, books, credentials, experience,
 * education, and fallback seed projects lives in this single file.
 * Update values here to reflect changes across the entire website and JSON-LD.
 */
export const siteContent = {
  profile: {
    name: 'Ojas Awasthi',
    alternateName: 'Ojas',
    monogram: 'OA',
    pronouns: 'He/Him',
    location: 'Lucknow, Uttar Pradesh, India',
    city: 'Lucknow',
    region: 'Uttar Pradesh',
    country: 'India',
    timezone: 'Asia/Kolkata',
    roles: [
      'Web Developer',
      'Digital Marketer',
      'Published Author',
      'Investor',
      'Commerce Student (CS Aspirant)',
    ],
    linkedinHeadline:
      'Helping Brands Grow Through Digital Marketing | NISM-Certified | Investor & Published Author',
    siteHeadline:
      'Web developer & digital strategist building fast, beautiful websites that grow brands.',
    loaderTagline: 'Web Developer · Digital Strategy · Author',
    // Swap the photo by placing your portrait image at public/images/ojas.jpg.
    // Until that file exists, the Hero arch frame renders the refined "OA" monogram fallback.
    photoPath: '/images/ojas.jpg',
    photoAlt: 'Portrait of Ojas Awasthi, web developer and author in Lucknow',
    bioParagraphs: [
      'I am a commerce professional from Lucknow working across web development, digital strategy, corporate governance, and human psychology. Before starting formal university study, I built and ran The Vaxn Store solo across SEO, hosting, and promotions, growing it into thousands of sales.',
      'Running a dropshipping and thrifted menswear operation taught me to keep systems lean and efficient. Because I believe psychology plays a major role in leadership and negotiation, I wrote two books—Mastering the Art of Manipulation and The Echoes of Love—both available on Amazon and Google Play Books.',
      'I am now beginning my B.Com at the University of Lucknow while preparing for my Company Secretary (CS) exams, and I am always open to connecting with people across law, finance, digital strategy, and marketing.',
    ],
    quickFacts: [
      {label: 'Location', value: 'Lucknow, Uttar Pradesh, India'},
      {label: 'Studying', value: 'B.Com (Accounting & Finance and E-commerce), University of Lucknow'},
      {
        label: 'Focus',
        value:
          'Corporate governance, digital strategy, human psychology, law, finance, marketing, Company Secretary (CS) exam preparation',
      },
      {label: 'Languages', value: 'English (Full professional) · French (Full professional)'},
    ],
    languages: [
      {name: 'English', proficiency: 'Full professional proficiency'},
      {name: 'French', proficiency: 'Full professional proficiency'},
    ],
    interests: [
      'Corporate governance',
      'Digital strategy',
      'Human psychology',
      'Law',
      'Finance',
      'Marketing',
      'Company Secretary (CS) exam preparation',
    ],
  },

  contact: {
    email: 'ojassawasthi@gmail.com',
    socials: [
      {
        name: 'LinkedIn',
        handle: 'in/ojassawasthi',
        url: 'https://www.linkedin.com/in/ojassawasthi',
      },
      {
        name: 'Instagram',
        handle: '@_ojas0001_',
        url: 'https://www.instagram.com/_ojas0001_',
      },
      {
        name: 'Telegram',
        handle: '@ojasawasthiiii',
        url: 'https://t.me/ojasawasthiiii',
      },
      {
        name: 'Email',
        handle: 'ojassawasthi@gmail.com',
        url: 'mailto:ojassawasthi@gmail.com',
      },
    ],
  },

  stats: [
    {id: 'followers', value: 861, suffix: '', label: 'LinkedIn followers'},
    {id: 'connections', value: 500, suffix: '+', label: 'LinkedIn connections'},
    {id: 'brand_years', value: 4, suffix: '', label: 'Years running a brand'},
    {id: 'books', value: 2, suffix: '', label: 'Published books'},
    {id: 'certifications', value: 3, suffix: '', label: 'Certifications'},
  ],

  services: [
    {
      index: '01',
      title: 'Web Design & Development',
      description:
        'Fast, responsive websites structured with clean semantics, modern typography, and reliable hosting.',
    },
    {
      index: '02',
      title: 'Search Engine Optimization',
      description:
        'Technical on-page structure, metadata architecture, and structured data designed for organic discoverability.',
    },
    {
      index: '03',
      title: 'Digital Marketing',
      description:
        'Inbound strategy, audience positioning, and focused promotions built to help brands grow steadily.',
    },
    {
      index: '04',
      title: 'E-Commerce Setup',
      description:
        'Lean storefront builds, domain and hosting configuration, and catalog workflows grounded in direct retail operations.',
    },
  ],

  experience: {
    vaxn: {
      role: 'Founder',
      company: 'VAXN Fashion / The Vaxn Store',
      period: 'Sep 2020 – Apr 2024',
      duration: '3 yrs 8 mos',
      location: 'Lucknow',
      story: [
        'Started with two friends because luxury clothing felt gatekept behind high prices. The aim was shirts, tees, and menswear that delivered a refined look without draining the bank account.',
        'Built around dropshipping and thrifted luxury pieces, I ran the storefront solo across SEO, hosting, and promotions—growing it into thousands of sales with customers from everywhere.',
        'Closed by choice in April 2024 when warehouse space could not keep up and some retailers and thrift suppliers began slacking on quality: "I\'d rather close it myself than watch it turn into something I\'m not proud of."',
      ],
      closingQuote:
        "This isn't the end of me building things. Just the end of this one.",
      skills: ['Startups', 'Research', 'SEO', 'Hosting', 'Promotions'],
    },
    freelance: {
      role: 'Web Developer (Freelance)',
      description: 'Designs and builds websites.',
    },
  },

  education: [
    {
      institution: 'University of Lucknow',
      degree: 'B.Com (Accounting & Finance and E-commerce)',
      period: 'Aug 2026 – Present',
      details: 'Combining undergraduate commerce study with Company Secretary (CS) exam preparation.',
    },
    {
      institution: "St. Xavier's High School, India",
      degree: 'Grade 12',
      period: 'Apr 2017 – Mar 2026',
      details: '',
    },
  ],

  journeyTimeline: [
    {
      id: 'university',
      period: 'Aug 2026 – Present',
      title: 'B.Com (Accounting & Finance and E-commerce)',
      organization: 'University of Lucknow',
      summary:
        'Pursuing undergraduate commerce studies in Lucknow alongside Company Secretary (CS) examination preparation.',
      highlight: false,
    },
    {
      id: 'freelance',
      period: 'Ongoing',
      title: 'Web Developer (Freelance)',
      organization: 'Independent',
      summary: 'Designs and builds websites.',
      highlight: false,
    },
    {
      id: 'st-xaviers',
      period: 'Apr 2017 – Mar 2026',
      title: 'Grade 12',
      organization: "St. Xavier's High School, India",
      summary: 'Completed schooling while running early digital and e-commerce projects.',
      highlight: false,
    },
    {
      id: 'vaxn',
      period: 'Sep 2020 – Apr 2024 · 3 yrs 8 mos',
      title: 'Founder — VAXN Fashion / The Vaxn Store',
      organization: 'Lucknow',
      summary:
        'Started with two friends because luxury clothing felt gatekept behind high prices; built around dropshipping and thrifted luxury pieces, running SEO, hosting, and promotions solo to thousands of sales before closing by choice to protect quality.',
      quote: "This isn't the end of me building things. Just the end of this one.",
      skills: ['Startups', 'Research', 'SEO', 'Hosting', 'Promotions'],
      highlight: true,
    },
  ],

  certifications: [
    {
      id: 'hp-life',
      title: 'Data Science and Analytics',
      issuer: 'HP / LIFE',
      issued: 'Issued Jul 2026',
      expires: '',
      credentialId: '',
      skills: ['Data Analysis', 'Statistical Data Analysis'],
      verifyUrl: 'https://www.life-global.org/certificate/aac4e2bf-629f-454d-aae2-36d3f8e7b3ae',
    },
    {
      id: 'hubspot',
      title: 'Digital Marketing',
      issuer: 'HubSpot Academy',
      issued: 'Issued Apr 2026',
      expires: 'Expires May 2027',
      credentialId: '',
      skills: ['Digital Marketing', 'Inbound Marketing'],
      verifyUrl:
        'https://app-na2.hubspot.com/academy/achievements/5czcf8hb/en/1/ojas-awasthi/digital-marketing',
    },
    {
      id: 'nism',
      title: 'NISM Series XXI-A: Securities Market Foundation',
      issuer: 'National Institute of Securities Markets',
      issued: 'Issued Apr 2026',
      expires: 'Expires Apr 2028',
      credentialId: 'NISM20260000393507-001',
      skills: ['Investor Relations Support', 'SEBI Regulations'],
      // Add a verification URL here later to reveal the Verify button automatically.
      verifyUrl: '',
    },
  ],

  books: [
    {
      id: 'manipulation',
      title: 'Mastering the Art of Manipulation',
      subtitle: 'Psychology behind Manipulation',
      author: 'Ojas Awasthi',
      publisher: 'Amazon Kindle',
      publishedDate: 'Mar 27, 2026',
      description:
        'A comprehensive study of the mechanics of human behavior and strategic influence: how psychological frameworks can be leveraged to navigate professional challenges, build authority and master the nuances of persuasion in the corporate world.',
      coverImage: '', // Optional override image path or URL
      motif: 'axis' as const,
      links: [
        {
          label: 'Buy on Amazon Kindle',
          url: 'https://a.co/d/0c7YPkxV',
        },
      ],
      buyUrl: 'https://a.co/d/0c7YPkxV',
    },
    {
      id: 'echoes-of-love',
      title: 'The Echoes of Love',
      subtitle: '',
      author: 'Ojas Awasthi',
      publisher: 'Amazon & Google Play Books',
      publishedDate: '',
      description: 'A book by Ojas Awasthi.',
      coverImage: '', // Optional override image path or URL
      motif: 'rings' as const,
      buyUrl: '', // Set direct buy URL here later to override search links if desired
      links: [
        {
          label: 'Find on Amazon',
          url: 'https://www.amazon.in/s?k=The+Echoes+of+Love+Ojas+Awasthi',
        },
        {
          label: 'Find on Google Play Books',
          url: 'https://play.google.com/store/search?q=The%20Echoes%20of%20Love%20Ojas%20Awasthi&c=books',
        },
      ],
    },
  ],

  skillsMarquee: [
    'Web Development',
    'Next.js',
    'React',
    'Tailwind CSS',
    'Supabase',
    'SEO',
    'Digital Marketing',
    'Inbound Marketing',
    'Data Analysis',
    'Corporate Governance',
    'SEBI Regulations',
    'Investor Relations',
    'Dropshipping',
    'Startups',
    'Psychology',
  ],

  faqs: [
    {
      question: 'Who is Ojas Awasthi?',
      answer:
        'Ojas Awasthi is a web developer, digital marketer, published author, and commerce student (Company Secretary aspirant) based in Lucknow, Uttar Pradesh, India.',
    },
    {
      question: 'What does Ojas Awasthi do?',
      answer:
        'Ojas Awasthi designs and builds fast websites, works on SEO and digital marketing strategies for brands, studies B.Com at the University of Lucknow, and prepares for Company Secretary (CS) examinations. Previously, he founded and operated The Vaxn Store from September 2020 to April 2024.',
    },
    {
      question: 'Which books has Ojas Awasthi written?',
      answer:
        'Ojas Awasthi has written two books: Mastering the Art of Manipulation: Psychology behind Manipulation (published March 27, 2026 on Amazon Kindle) and The Echoes of Love (available on Amazon and Google Play Books).',
    },
  ],

  seo: {
    defaultTitle: 'Ojas Awasthi | Web Developer, Digital Marketer & Author in Lucknow',
    defaultDescription:
      'Ojas Awasthi is a web developer, digital marketer, and published author in Lucknow, India, building fast websites and practical digital growth strategies.',
    siteUrl: 'https://ojasawasthii.vercel.app',
  },

  fallbackSettings: {
    availability: {
      enabled: true,
      text: 'Available for projects',
    },
    hero: {
      headline:
        'Web developer & digital strategist building fast, beautiful websites that grow brands.',
    },
  } satisfies SiteSettingsMap,

  fallbackProjects: [
    {
      id: 'seed-nutstridinida',
      title: 'Nutstridinida',
      slug: 'nutstridinida',
      description: 'A website designed and developed by Ojas Awasthi.',
      long_description: null,
      live_url: 'https://nutstridinida.vercel.app',
      github_url: null,
      thumbnail_url: null,
      images: [],
      tech_stack: [],
      category: 'Web',
      year: '2026',
      featured: true,
      sort_order: 1,
      published: true,
      created_at: '2026-06-01T00:00:00.000Z',
      status_tag: null,
      role: null,
    },
    {
      id: 'seed-the-vaxn-store',
      title: 'The Vaxn Store',
      slug: 'the-vaxn-store',
      description:
        'Menswear e-commerce brand built around dropshipping and thrifted luxury pieces, grown solo across SEO, hosting, and promotions into thousands of sales.',
      long_description:
        'Started with two friends because luxury clothing felt gatekept behind high prices—the aim was shirts, tees, and menswear that delivered an elevated feel without draining the bank account. Built around dropshipping and thrifted luxury pieces, I ran The Vaxn Store solo across SEO, hosting, and promotions, growing it into thousands of sales with customers from everywhere. Closed by choice in April 2024 when warehouse space could not keep up and some retailers and thrift suppliers began slacking on quality: "I\'d rather close it myself than watch it turn into something I\'m not proud of."',
      live_url: null,
      github_url: null,
      thumbnail_url: null,
      images: [],
      tech_stack: ['SEO', 'Hosting', 'Dropshipping', 'Promotions', 'Research'],
      category: 'E-commerce',
      year: '2020–2024',
      featured: true,
      sort_order: 2,
      published: true,
      created_at: '2024-04-01T00:00:00.000Z',
      status_tag: 'Closed Apr 2024',
      role: 'Founder',
    },
  ] satisfies Project[],

  blogPosts: [
    {
      slug: 'who-is-ojas-awasthi',
      title: 'Who is Ojas Awasthi?',
      description:
        'An overview of Ojas Awasthi in Lucknow, India: web developer, digital marketer, founder of The Vaxn Store, NISM-certified investor, and published author.',
      publishedAt: '2026-08-15',
      readingTime: '3 min read',
      sections: [
        {
          heading: 'Background & Early Work',
          paragraphs: [
            'Ojas Awasthi is a web developer, digital marketer, published author, and commerce student based in Lucknow, Uttar Pradesh, India.',
            'Before starting undergraduate university study, he co-founded VAXN Fashion / The Vaxn Store in September 2020 alongside two friends with a straightforward goal: making shirts, tees, and menswear accessible without high luxury markups.',
            'Operating around dropshipping and thrifted luxury pieces, Ojas managed the storefront solo—handling SEO, hosting, and promotions—and scaled it to thousands of sales before choosing to close the store in April 2024 when warehouse space and supplier quality no longer matched his standards.',
          ],
        },
        {
          heading: 'Web Development & Digital Strategy',
          paragraphs: [
            'Working as a freelance web developer, Ojas designs and builds fast, structured websites for brands. His certifications include Digital Marketing from HubSpot Academy and Data Science and Analytics from HP LIFE, alongside NISM Series XXI-A: Securities Market Foundation certification.',
            'His technical and marketing focus spans React, Next.js, Tailwind CSS, Supabase, search engine optimization, inbound marketing, and lean e-commerce operations.',
          ],
        },
        {
          heading: 'Books, Education & Focus',
          paragraphs: [
            'With an ongoing interest in how human psychology shapes leadership and negotiation, Ojas has published two books available on Amazon and Google Play Books: Mastering the Art of Manipulation: Psychology behind Manipulation (March 2026) and The Echoes of Love.',
            'After completing Grade 12 at St. Xavier\'s High School in March 2026, he began his B.Com in Accounting & Finance and E-commerce at the University of Lucknow in August 2026 while preparing for Company Secretary (CS) examinations.',
          ],
        },
      ],
    },
  ] satisfies BlogPost[],
};
