export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  long_description: string | null;
  live_url: string | null;
  github_url: string | null;
  thumbnail_url: string | null;
  images: string[];
  tech_stack: string[];
  category: string;
  year: string;
  featured: boolean;
  sort_order: number;
  published: boolean;
  created_at: string;
  status_tag?: string | null;
  role?: string | null;
}

export interface AvailabilitySetting {
  enabled: boolean;
  text: string;
}

export interface HeroSetting {
  headline: string;
}

export interface SiteSettingsMap {
  availability: AvailabilitySetting;
  hero: HeroSetting;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  readingTime: string;
  sections: {
    heading: string;
    paragraphs: string[];
  }[];
}

export const siteData = {
  profile: {
    name: 'Ojas Awasthi',
    alternateName: 'Ojas',
    monogram: 'OA',
    pronouns: 'He/Him',
    location: 'Lucknow, Uttar Pradesh, India',
    city: 'Lucknow',
    region: 'Uttar Pradesh',
    country: 'India',
    linkedinHeadline:
      'Helping Brands Grow Through Digital Marketing | NISM-Certified | Investor & Published Author',
    siteHeadline:
      'Web developer & digital strategist building fast, beautiful websites that grow brands.',
    bioParagraphs: [
      'I am a commerce professional from Lucknow working across web development, digital strategy, corporate governance, and human psychology. Before starting formal university study, I built and ran The Vaxn Store solo across SEO, hosting, and promotions, growing it into thousands of sales.',
      'Running a dropshipping and thrifted menswear operation taught me to keep systems lean and efficient. Because I believe psychology plays a major role in leadership and negotiation, I wrote two books—Mastering the Art of Manipulation and The Echoes of Love—both available on Amazon and Google Play Books.',
      'I am now beginning my B.Com at the University of Lucknow while preparing for my Company Secretary (CS) exams, and I am always open to connecting with people across law, finance, digital strategy, and marketing.',
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

  education: [
    {
      institution: 'University of Lucknow',
      degree: 'B.Com (Accounting & Finance and E-commerce)',
      period: 'Aug 2026 – Present',
    },
    {
      institution: "St. Xavier's High School, India",
      degree: 'Grade 12',
      period: 'Apr 2017 – Mar 2026',
    },
  ],

  certifications: [
    {
      id: 'hp-life',
      title: 'Data Science and Analytics',
      issuer: 'HP / LIFE',
      issued: 'Issued Jul 2026',
    },
    {
      id: 'hubspot',
      title: 'Digital Marketing',
      issuer: 'HubSpot Academy',
      issued: 'Issued Apr 2026',
    },
    {
      id: 'nism',
      title: 'NISM Series XXI-A: Securities Market Foundation',
      issuer: 'National Institute of Securities Markets',
      issued: 'Issued Apr 2026',
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
      buyUrl: '',
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
            "After completing Grade 12 at St. Xavier's High School in March 2026, he began his B.Com in Accounting & Finance and E-commerce at the University of Lucknow in August 2026 while preparing for Company Secretary (CS) examinations.",
          ],
        },
      ],
    },
  ] satisfies BlogPost[],
};
