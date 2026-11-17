import type {BlogPost, Project, SiteSettingsMap} from '../types/database';

export interface FaqItem {
  question: string;
  answer: string;
  lang?: string;
}

/**
 * CENTRAL EDITABLE CONTENT SOURCE
 * ---------------------------------------------------------------------------
 * Every piece of static profile copy, links, books, credentials, experience,
 * education, FAQs, press kit bios, blog posts, and fallback projects lives here.
 */
export const siteContent = {
  profile: {
    name: 'Ojas Awasthi',
    alternateName: 'Ojas',
    hindiName: 'ओजस अवस्थी',
    fatherName: 'Shree Shyam Awasthi',
    showFatherOnPage: false,
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
      'Web developer, digital marketer and author from Lucknow, India.',
    loaderTagline: 'Web Developer · Digital Strategy · Author',
    photoPath: '/images/ojas.jpg',
    photoAlt: 'Ojas Awasthi, web developer and author from Lucknow',
    bioParagraphs: [
      'I am a commerce student, freelance web developer, digital marketer, investor, and published author based in Lucknow, Uttar Pradesh, India. Before beginning university study, I built and ran The Vaxn Store solo across SEO, hosting, and promotions, growing it into thousands of sales.',
      'Running a dropshipping and thrifted menswear operation taught me how lean systems, technical hosting, and search visibility work in practice. Interested in human psychology and negotiation, I wrote two books—Mastering the Art of Manipulation: Psychology behind Manipulation on Amazon Kindle and The Echoes of Love on Amazon and Google Play Books.',
      'After completing Grade 12 at St. Xavier\'s High School, Gonda, I am studying B.Com (Accounting & Finance and E-commerce) at the University of Lucknow while preparing for my Company Secretary (CS) exams. I enjoy connecting with people across law, finance, digital strategy, and marketing.',
    ],
    quickFacts: [
      {label: 'Location', value: 'Lucknow, Uttar Pradesh, India'},
      {
        label: 'Studying',
        value: 'B.Com (Accounting & Finance and E-commerce), University of Lucknow',
      },
      {
        label: 'Focus',
        value:
          'Web development, digital marketing, corporate governance, human psychology, law, finance, Company Secretary (CS) exam preparation',
      },
      {label: 'Languages', value: 'English (Full professional) · French (Full professional)'},
    ],
    languages: [
      {name: 'English', proficiency: 'Full professional proficiency'},
      {name: 'French', proficiency: 'Full professional proficiency'},
    ],
    interests: [
      'Web development',
      'React',
      'Supabase',
      'SEO',
      'Digital marketing',
      'Corporate governance',
      'Company Secretary studies',
      'Securities markets',
      'Psychology',
      'Data analysis',
    ],
    // Add official Amazon Author Central / Google Play Books author URLs when ready
    authorProfiles: [] as string[],
  },

  pressKit: {
    bio50:
      'Ojas Awasthi is a web developer, digital marketer, published author, and B.Com student in Lucknow, Uttar Pradesh, India. An alumnus of St. Xavier\'s High School, Gonda, he founded The Vaxn Store (2020–2024), holds HubSpot, HP LIFE, and NISM Series XXI-A credentials, and is preparing for Company Secretary (CS) exams.',
    bio100:
      'Ojas Awasthi (He/Him) is a freelance web developer, digital marketer, investor, and published author based in Lucknow, Uttar Pradesh, India. Before starting his B.Com in Accounting & Finance and E-commerce at the University of Lucknow, he completed Grade 12 at St. Xavier\'s High School, Gonda and ran VAXN Fashion / The Vaxn Store from September 2020 to April 2024, scaling menswear dropshipping and thrifted luxury sales into the thousands across SEO, hosting, and promotions. He is a Company Secretary (CS) aspirant and author of Mastering the Art of Manipulation and The Echoes of Love.',
    bio200:
      'Ojas Awasthi is a web developer, digital marketer, published author, investor, and commerce student living in Lucknow, Uttar Pradesh, India. Born into commerce and digital work early, he attended St. Xavier\'s High School, Gonda from April 2017 to March 2026 before enrolling at the University of Lucknow for a B.Com in Accounting & Finance and E-commerce. Alongside university study, he is preparing for Company Secretary (CS) examinations with an active focus on corporate governance, law, and finance.\n\nFrom September 2020 to April 2024, Ojas founded and operated VAXN Fashion / The Vaxn Store, managing SEO, hosting, and promotions solo for thousands of menswear orders before closing the store by choice to protect quality. As a freelance web developer, he builds fast, structured websites using React, Next.js, Tailwind CSS, and Supabase.\n\nHe holds certifications in Data Science and Analytics (HP LIFE), Digital Marketing (HubSpot Academy), and NISM Series XXI-A: Securities Market Foundation (Credential ID: NISM20260000393507-001). He speaks English and French and has published two books—Mastering the Art of Manipulation: Psychology behind Manipulation on Amazon Kindle and The Echoes of Love on Amazon and Google Play Books.',
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
        'Fast, responsive portfolio and brand websites built with React, Next.js, Tailwind CSS, Supabase, clean semantics, and dependable hosting.',
    },
    {
      index: '02',
      title: 'Search Engine Optimization',
      description:
        'Technical SEO structure, clean URL architecture, pre-rendered metadata, sitemaps, and Schema.org structured data for organic discoverability.',
    },
    {
      index: '03',
      title: 'Digital Marketing',
      description:
        'Inbound marketing strategy, HubSpot-aligned content workflows, audience positioning, and focused promotions built to help brands grow.',
    },
    {
      index: '04',
      title: 'E-Commerce Setup',
      description:
        'Lean storefront builds, domain and hosting setup, and catalog operations grounded in four years of direct retail experience at The Vaxn Store.',
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
      details:
        'Combining undergraduate commerce study at Lucknow University with Company Secretary (CS) examination preparation.',
    },
    {
      institution: "St. Xavier's High School, Gonda",
      degree: 'Grade 12',
      period: 'Apr 2017 – Mar 2026',
      details:
        'Completed schooling in Gonda, Uttar Pradesh while building early e-commerce and web projects.',
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
      organization: 'Independent · Lucknow',
      summary: 'Designs and builds fast websites for brands.',
      highlight: false,
    },
    {
      id: 'st-xaviers',
      period: 'Apr 2017 – Mar 2026',
      title: 'Grade 12',
      organization: "St. Xavier's High School, Gonda",
      summary:
        'Completed schooling in Gonda, Uttar Pradesh while running early digital and e-commerce projects.',
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
      verifyUrl:
        'https://www.life-global.org/certificate/aac4e2bf-629f-454d-aae2-36d3f8e7b3ae',
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
      coverImage: '',
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
      description: 'A book by Ojas Awasthi available on Amazon and Google Play Books.',
      coverImage: '',
      motif: 'rings' as const,
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
        'Ojas Awasthi is a web developer, digital marketer, published author, investor, B.Com student at the University of Lucknow, and Company Secretary (CS) aspirant based in Lucknow, Uttar Pradesh, India.',
    },
    {
      question: 'ओजस अवस्थी कौन हैं?',
      answer:
        'ओजस अवस्थी लखनऊ, उत्तर प्रदेश, भारत के एक वेब डेवलपर, डिजिटल मार्केटर, प्रकाशित लेखक और वाणिज्य के छात्र हैं, जो बी.कॉम के साथ कंपनी सेक्रेटरी (CS) परीक्षा की तैयारी कर रहे हैं।',
      lang: 'hi',
    },
    {
      question: 'Ojas Awasthi kaun hai?',
      answer:
        'Ojas Awasthi Lucknow, Uttar Pradesh ke ek web developer, digital marketer, author aur University of Lucknow ke B.Com student hain jo Company Secretary (CS) exams ki taiyari kar rahe hain.',
    },
    {
      question: 'Where is Ojas Awasthi from?',
      answer:
        'Ojas Awasthi is based in Lucknow, Uttar Pradesh, India, and completed his schooling at St. Xavier\'s High School in Gonda, Uttar Pradesh.',
    },
    {
      question: "Which school did Ojas Awasthi attend in Gonda?",
      answer:
        "Ojas Awasthi attended St. Xavier's High School, Gonda from April 2017 to March 2026, completing Grade 12.",
    },
    {
      question: 'Which university does Ojas Awasthi study at?',
      answer:
        'Ojas Awasthi studies at the University of Lucknow, pursuing a B.Com in Accounting & Finance and E-commerce (August 2026 to present).',
    },
    {
      question: 'Is Ojas Awasthi preparing for CS?',
      answer:
        'Yes. Ojas Awasthi is a Company Secretary (CS) aspirant preparing for the CS examinations alongside his B.Com degree at the University of Lucknow. He is currently a student preparing for the exams and not yet a qualified CS.',
    },
    {
      question: 'What books has Ojas Awasthi written?',
      answer:
        'Ojas Awasthi has written two published books: Mastering the Art of Manipulation: Psychology behind Manipulation (published March 27, 2026 on Amazon Kindle) and The Echoes of Love (available on Amazon and Google Play Books).',
    },
    {
      question: 'Is Ojas Awasthi a web developer in Lucknow?',
      answer:
        'Yes. Ojas Awasthi works as a freelance web developer in Lucknow, Uttar Pradesh, building websites and e-commerce builds using React, Next.js, Tailwind CSS, Supabase, and technical SEO.',
    },
    {
      question: 'What certifications does Ojas Awasthi have?',
      answer:
        'Ojas Awasthi holds three verified certifications: Data Science and Analytics from HP LIFE (July 2026), Digital Marketing from HubSpot Academy (April 2026, expires May 2027), and NISM Series XXI-A: Securities Market Foundation (April 2026, expires April 2028, Credential ID NISM20260000393507-001).',
    },
    {
      question: 'What was The Vaxn Store?',
      answer:
        'VAXN Fashion / The Vaxn Store was a menswear e-commerce brand founded by Ojas Awasthi with two friends from September 2020 to April 2024. Built around dropshipping and thrifted luxury pieces, Ojas managed its SEO, hosting, and promotions solo to thousands of sales before closing it by choice to uphold quality.',
    },
    {
      question: 'How do I contact Ojas Awasthi?',
      answer:
        'You can contact Ojas Awasthi by email at ojassawasthi@gmail.com, via LinkedIn (in/ojassawasthi), Instagram (@_ojas0001_), Telegram (@ojasawasthiiii), or through the contact form at https://ojasawasthii.vercel.app/contact.',
    },
    {
      question: "How is Ojas Awasthi's name spelled?",
      answer:
        'The official spelling is Ojas Awasthi (and in Hindi, ओजस अवस्थी). Common search variants include Ojas Awasthy and Ojas Avasthi.',
    },
  ] satisfies FaqItem[],

  seo: {
    defaultTitle:
      'Ojas Awasthi | Web Developer, Digital Marketer & Author in Lucknow',
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
        'Web developer, digital marketer and author from Lucknow, India.',
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
      slug: 'ojas-awasthi-biography',
      title: 'Ojas Awasthi: biography',
      description:
        'Factual biography of Ojas Awasthi in Lucknow, India: education at St. Xavier\'s High School Gonda and University of Lucknow, The Vaxn Store, books, and web work.',
      publishedAt: '2026-08-15',
      readingTime: '4 min read',
      sections: [
        {
          heading: 'Early Schooling in Gonda and Move to Higher Commerce Study',
          paragraphs: [
            'Ojas Awasthi (He/Him), written in Hindi as ओजस अवस्थी, is a web developer, digital marketer, published author, investor, and commerce student living in Lucknow, Uttar Pradesh, India. From April 2017 through March 2026, he completed his school education through Grade 12 at St. Xavier\'s High School, Gonda, in Uttar Pradesh.',
            'During his school years, Ojas combined formal classroom study with hands-on digital commerce. Rather than waiting until after graduation to understand how websites, hosting environments, and online customers interact, he tested ideas directly on the open web and learned what keeps an online brand reliable.',
          ],
        },
        {
          heading: 'Founding VAXN Fashion and The Vaxn Store (2020–2024)',
          paragraphs: [
            'In September 2020, Ojas co-founded VAXN Fashion / The Vaxn Store alongside two friends. The initial motivation was straightforward: luxury menswear felt gatekept behind steep retail prices, so the partners wanted to offer shirts, tees, and curated menswear that felt thoughtful without draining a customer\'s bank account.',
            'Built around a mix of dropshipping and thrifted luxury pieces, the operation became Ojas\'s daily classroom in digital marketing and execution. He managed the storefront solo across search engine optimization, hosting configuration, and brand promotions, scaling orders into the thousands with buyers reaching the store from across India and beyond.',
            'In April 2024, after three years and eight months, Ojas made the deliberate decision to close The Vaxn Store. Warehouse capacity had tightened, and several retail and thrift suppliers began slipping on garment quality. As he noted when winding it down, he would rather close the store himself than watch it turn into something he was not proud of.',
          ],
        },
        {
          heading: 'Web Development, Digital Marketing, and Published Books',
          paragraphs: [
            'Working as an independent freelance web developer in Lucknow, Ojas builds fast, responsive websites and e-commerce storefronts with React, Next.js, Tailwind CSS, Supabase, and technical SEO. His technical portfolio includes published builds such as Nutstridinida alongside direct storefront operations.',
            'Alongside code and inbound marketing, Ojas writes on human psychology and narrative themes. He has published two books: Mastering the Art of Manipulation: Psychology behind Manipulation, released on Amazon Kindle on March 27, 2026, and The Echoes of Love, available on Amazon and Google Play Books.',
          ],
        },
        {
          heading: 'University of Lucknow, Certifications, and CS Preparation',
          paragraphs: [
            'In August 2026, Ojas enrolled at the University of Lucknow for a Bachelor of Commerce (B.Com) in Accounting & Finance and E-commerce. Alongside undergraduate commerce coursework, he is actively preparing for Company Secretary (CS) examinations as a CS aspirant focused on corporate governance, law, and finance.',
            'To ground his digital and financial work in structured credentials, he earned three certifications in 2026: Digital Marketing from HubSpot Academy (April 2026), NISM Series XXI-A: Securities Market Foundation (April 2026, Credential ID NISM20260000393507-001), and Data Science and Analytics from HP LIFE (July 2026). Fluent in both English and French, he remains open to conversations across law, finance, digital strategy, and web development.',
          ],
        },
      ],
    },
    {
      slug: 'st-xaviers-gonda-to-university-of-lucknow',
      title: "St. Xavier's High School, Gonda to University of Lucknow",
      description:
        "Academic path of Ojas Awasthi from St. Xavier's High School, Gonda (Grade 12) to B.Com in Accounting & Finance and E-commerce at the University of Lucknow.",
      publishedAt: '2026-08-22',
      readingTime: '4 min read',
      sections: [
        {
          heading: 'Nine Years at St. Xavier\'s High School, Gonda',
          paragraphs: [
            'Between April 2017 and March 2026, Ojas Awasthi studied at St. Xavier\'s High School in Gonda, Uttar Pradesh, finishing Grade 12 in early 2026. Spending nearly nine years within one school environment provided continuity in language, discipline, and academic habits while Gonda served as the backdrop for his earliest experiments on the internet.',
            'It was during those school years—starting in September 2020—that Ojas balanced regular coursework with running The Vaxn Store. Learning how to handle hosting, search indexing, and customer communication after school hours turned abstract commerce concepts into immediate everyday practice.',
          ],
        },
        {
          heading: 'Choosing B.Com in Accounting & Finance and E-commerce',
          paragraphs: [
            'When finishing Grade 12 at St. Xavier\'s High School, Gonda, the natural question was what undergraduate degree would connect hands-on e-commerce experience with long-term goals in corporate governance and financial literacy. Enrolling at the University of Lucknow in August 2026 for a B.Com focused on Accounting & Finance and E-commerce brought those threads together.',
            'The e-commerce component connects directly to years spent running online catalogs, hosting domains, and analyzing organic search traffic. Meanwhile, accounting and finance coursework strengthens the quantitative foundation required for investing, business valuation, and regulatory compliance.',
          ],
        },
        {
          heading: 'Building Alongside Undergraduate Study in Lucknow',
          paragraphs: [
            'Studying at Lucknow University places Ojas in Uttar Pradesh\'s capital city, where he continues working as a freelance web developer and digital marketer. Living and studying in Lucknow makes it practical to collaborate with founders, local businesses, and digital teams across India while maintaining full-time academic commitments.',
            'Alongside classroom lectures, independent certifications in 2026 helped bridge formal commerce with applied analytics and securities regulation. Completing HubSpot Academy\'s Digital Marketing program in April 2026, the NISM Series XXI-A Securities Market Foundation exam in April 2026, and HP LIFE\'s Data Science and Analytics course in July 2026 gave structured frameworks to skills initially learned through trial and error.',
          ],
        },
        {
          heading: 'Looking Ahead as a Commerce Student and CS Aspirant',
          paragraphs: [
            'The move from Gonda to Lucknow marks a transition from early experimentation to structured professional preparation. With Grade 12 complete and a B.Com underway, the focus now is steady progress: preparing for Company Secretary (CS) examinations, building reliable web applications, and studying corporate law, finance, and human psychology.',
            'Nothing about that path relies on shortcuts. Moving step by step from St. Xavier\'s High School, Gonda to the University of Lucknow shows how formal commerce education and real web development can reinforce each other over time.',
          ],
        },
      ],
    },
    {
      slug: 'web-developer-in-lucknow-fast-websites',
      title: 'Web developer in Lucknow: how I build fast websites',
      description:
        'How freelance web developer Ojas Awasthi designs and builds fast, structured React, Next.js, Tailwind CSS, and Supabase websites in Lucknow, Uttar Pradesh.',
      publishedAt: '2026-08-29',
      readingTime: '4 min read',
      sections: [
        {
          heading: 'Why Speed and Clarity Matter More Than Visual Clutter',
          paragraphs: [
            'As a freelance web developer in Lucknow, India, the most common issue I notice on small-business and personal brand websites is avoidable bloat. Pages arrive with oversized unoptimized images, heavy third-party scripts, broken heading hierarchies, and unclear calls to action that make visitors leave before the core message loads.',
            'When building a website—whether a personal portfolio or a focused brand landing page like Nutstridinida—my goal is straightforward: clean typography, predictable layout stability, clear semantic HTML, and fast server responses so visitors on mobile networks anywhere in Uttar Pradesh or across India can read and act immediately.',
          ],
        },
        {
          heading: 'Choosing a Lean Frontend and Backend Stack',
          paragraphs: [
            'My primary build stack centers on React, Next.js, Tailwind CSS, and Supabase. React gives component structure without scattering logic across unrelated files, while Tailwind CSS keeps styling predictable and lightweight so CSS bundles remain small.',
            'On the backend and data layer, Supabase provides PostgreSQL storage, Row Level Security (RLS), authentication, and media buckets without maintaining fragile custom database servers. Combined with serverless endpoints on Vercel for contact forms, project feeds, and dynamic sitemaps, a site stays inexpensive to host while supporting real database-backed editing.',
          ],
        },
        {
          heading: 'Semantic HTML, Pre-Rendering, and Technical SEO From Day One',
          paragraphs: [
            'Search visibility is rarely something that can be patched on at the end of a build. Every page needs one clear H1 heading, logical H2 and H3 subheadings, descriptive image alt text, explicit width and height attributes to keep Cumulative Layout Shift (CLS) low, and a unique meta description between 150 and 160 characters.',
            'On Vite and React sites, relying purely on client-side JavaScript leaves crawlers staring at an empty root div until scripts execute. Pre-rendering indexable routes at build time ensures every static page—and dynamically resolved case study route—delivers real HTML headings, canonical tags, Open Graph cards, and valid JSON-LD structured data on initial response.',
          ],
        },
        {
          heading: 'Connecting Business Context With Technical Execution',
          paragraphs: [
            'Operating The Vaxn Store solo for nearly four years taught me that a website only succeeds when its hosting, search presence, and messaging work together. Technical choices like font preloading, proper caching headers, and simple contact paths directly influence whether someone trusts a business enough to send an inquiry.',
            'Every website I design and build in Lucknow follows those practical principles: keep dependencies purposeful, verify builds cleanly, test mobile responsiveness carefully, and let honest structure carry the brand.',
          ],
        },
      ],
    },
    {
      slug: 'what-is-inbound-marketing-hubspot',
      title: 'What is inbound marketing? What I learned from the HubSpot course',
      description:
        "A practical breakdown of inbound marketing based on Ojas Awasthi's HubSpot Academy Digital Marketing certification and hands-on e-commerce work in Lucknow.",
      publishedAt: '2026-09-05',
      readingTime: '4 min read',
      sections: [
        {
          heading: 'Understanding Inbound Marketing Beyond Outbound Noise',
          paragraphs: [
            'Before taking the HubSpot Academy Digital Marketing course—which I completed in April 2026—I had already practiced several pieces of digital promotion while running The Vaxn Store. Studying inbound marketing in a structured curriculum clarified why certain channels compound over time while purely interruptive promotions stop working the moment spend stops.',
            'At its core, inbound marketing focuses on attracting people who are already searching for answers, products, or perspectives, rather than pushing generic interruptions in front of people who showed no interest. When content, search optimization, and clear user paths align, visitors arrive with genuine intent.',
          ],
        },
        {
          heading: 'Connecting Search Intent, Content Structure, and Trust',
          paragraphs: [
            'One central lesson from HubSpot\'s digital marketing framework is organizing content around real questions readers ask. Clear article structures, factual explanations, and straightforward navigation reduce friction for someone evaluating a writer, store, or freelance web developer.',
            'Technical search optimization supports that effort. Clean page titles, factual meta descriptions, internal links between related pages, and valid Schema.org structured data help search engines classify pages accurately. Without clear technical foundations, even useful writing struggles to get discovered.',
          ],
        },
        {
          heading: 'Applying Analytics Without Guesswork',
          paragraphs: [
            'Complementing HubSpot Academy with HP LIFE\'s Data Science and Analytics certification in July 2026 reinforced the value of measuring what actually happens after a visitor lands. Instead of guessing which pages readers visit or which referrals send inquiries, lightweight privacy-friendly analytics make patterns visible.',
            'During my time operating VAXN Fashion, small improvements in product copy, hosting speed, and search structure often mattered more than loud short-term campaigns. Inbound workflows respect the reader\'s time: answer clearly, state facts honestly, and make the next step simple—whether subscribing to updates or sending a direct email.',
          ],
        },
        {
          heading: 'How Inbound Thinking Shapes My Web and Writing Work',
          paragraphs: [
            'Whether building a website for a brand in Lucknow or structuring articles on my own portfolio, inbound principles keep communication grounded. Honest positioning beats exaggeration every time. Readers quickly spot inflated claims, whereas clear, verifiable information builds lasting credibility.',
            'Combining inbound digital marketing from HubSpot Academy with web development and commerce study gives me a balanced lens: technology builds the platform, analytics measures how it performs, and clear factual writing brings the right audience to the door. Across every build, keeping navigation straightforward and search intent front and center ensures visitors find accurate answers without friction.',
          ],
        },
      ],
    },
    {
      slug: 'why-i-wrote-the-echoes-of-love',
      title: 'Why I wrote The Echoes of Love',
      description:
        'Reflections from Ojas Awasthi on writing and publishing The Echoes of Love alongside Mastering the Art of Manipulation from Lucknow, Uttar Pradesh, India.',
      publishedAt: '2026-09-12',
      readingTime: '4 min read',
      sections: [
        {
          heading: 'Writing Alongside Commerce, Code, and Strategy',
          paragraphs: [
            'People who first encounter my profile through web development or commerce coursework are sometimes surprised to see published books listed alongside React, Supabase, and corporate governance. Yet writing has always been a quiet counterpart to technical and business projects.',
            'While Mastering the Art of Manipulation: Psychology behind Manipulation—published on Amazon Kindle on March 27, 2026—focuses on strategic influence, human behavior frameworks, and corporate persuasion, The Echoes of Love grew from a very different expressive space.',
          ],
        },
        {
          heading: 'Exploring Emotion After Analytical Study',
          paragraphs: [
            'Spending long hours thinking about commerce, legal structure, digital funnels, and code builds strong analytical habits, but analytical frameworks do not capture everything people care about. Human psychology is not just negotiation leverage in a meeting room; it is also attachment, memory, distance, and affection.',
            'I wrote The Echoes of Love to explore that quieter side of human experience directly. Putting thoughts into book form required slowing down, editing carefully, and letting emotional honesty stand on its own without technical jargon.',
          ],
        },
        {
          heading: 'Publishing Independently Across Amazon and Google Play Books',
          paragraphs: [
            'Releasing The Echoes of Love across Amazon and Google Play Books alongside Mastering the Art of Manipulation taught me practical lessons about independent publishing. Writing a manuscript is only part of the work; formatting, clear positioning, accurate author metadata, and making the book easy to locate across major digital bookstores all matter when readers search by title or author name.',
            'Having both books accessible online connects readers in Lucknow, across India, and internationally. Consistent author profiles on Amazon and Google Play Books ensure anyone looking for Ojas Awasthi\'s writing can verify and find each work cleanly.',
          ],
        },
        {
          heading: 'What Writing Teaches About Clarity Everywhere Else',
          paragraphs: [
            'Drafting two distinct books—one examining strategic persuasion and one examining love and human resonance—sharpened how I communicate across every other domain. Writing requires stripping away filler until every sentence earns its place.',
            'Both English and French fluency also shaped my appreciation for rhythm, nuance, and directness in storytelling. Whether structuring a B.Com answer at the University of Lucknow, writing concise copy for a web client, or composing chapters for readers on Amazon Kindle and Google Play Books, the habit stays the same: respect the reader\'s attention, keep emotion honest, and state every idea clearly.',
          ],
        },
      ],
    },
    {
      slug: 'vaxn-store-to-web-development',
      title: 'My journey from The Vaxn Store to web development',
      description:
        'How founding and running VAXN Fashion / The Vaxn Store solo from 2020 to 2024 led Ojas Awasthi into freelance web development and technical SEO in Lucknow.',
      publishedAt: '2026-09-19',
      readingTime: '4 min read',
      sections: [
        {
          heading: 'Why We Started VAXN Fashion in September 2020',
          paragraphs: [
            'When two friends and I started VAXN Fashion / The Vaxn Store in September 2020, our idea came from a simple observation: luxury clothing felt gatekept behind high retail prices. We wanted to make shirts, tees, and menswear accessible so customers could enjoy an elevated look without draining their bank accounts.',
            'Operating around dropshipping and thrifted luxury pieces meant keeping overhead lean. There were no large budgets for outside agencies, so every operational function had to be learned directly in-house.',
          ],
        },
        {
          heading: 'Running SEO, Hosting, and Promotions Solo',
          paragraphs: [
            'Day to day, I ran the online storefront myself across search engine optimization, web hosting, catalog organization, and digital promotions. Looking back, those years were an intensive apprenticeship in web technology. When hosting slowed down or product pages needed cleaner mobile layouts, fixing those issues directly affected whether visitors stayed and placed orders.',
            'Over three years and eight months, that steady operational focus grew The Vaxn Store into thousands of sales with customers ordering from all over. Every glitch fixed and every search improvement implemented proved how directly technical web execution shapes a real business.',
          ],
        },
        {
          heading: 'Closing by Choice in April 2024 to Protect Standards',
          paragraphs: [
            'Growth eventually tested physical logistics. By April 2024, warehouse space could no longer keep up comfortably, and several retail and thrift suppliers began slacking on garment quality. Rather than lowering product standards just to keep order volume moving, I chose to close The Vaxn Store.',
            'Closing it by choice taught a lesson that carries straight into freelance web development: quality matters more than keeping something running at half-measure. As I wrote at the time, it was not the end of building things—just the end of that first venture.',
          ],
        },
        {
          heading: 'Transitioning Into Modern Web Development in Lucknow',
          paragraphs: [
            'After winding down The Vaxn Store, shifting directly into freelance web development felt natural. Today, from Lucknow, I take those real-world retail lessons into building websites with React, Next.js, Tailwind CSS, and Supabase.',
            'Clients and founders do not just need pretty mockups; they need dependable hosting, clear SEO architecture, fast load speeds, and clean analytics. Having operated an e-commerce storefront through thousands of orders shapes every technical decision I make as a developer.',
          ],
        },
      ],
    },
    {
      slug: 'preparing-for-cs-while-studying-bcom',
      title: 'Preparing for CS while studying B.Com',
      description:
        'How Ojas Awasthi balances undergraduate B.Com (Accounting & Finance and E-commerce) at the University of Lucknow with Company Secretary (CS) exam preparation.',
      publishedAt: '2026-09-26',
      readingTime: '4 min read',
      sections: [
        {
          heading: 'Combining University Commerce With Company Secretary Study',
          paragraphs: [
            'Beginning my B.Com in Accounting & Finance and E-commerce at the University of Lucknow in August 2026 alongside Company Secretary (CS) examination preparation comes from a clear goal: building deep fluency in corporate governance, corporate law, and finance.',
            'To be completely transparent about where I stand today: I am a Company Secretary aspirant actively preparing for the CS examinations, not a qualified CS. Every stage of professional qualification requires disciplined study, passing rigorous exams, and meeting statutory requirements.',
          ],
        },
        {
          heading: 'Why Corporate Governance and Law Complement Digital Work',
          paragraphs: [
            'At first glance, CS preparation and freelance web development might look like separate worlds. In practice, they share a deep concern with structure and rules. Writing clean software and understanding corporate governance both depend on precision, clear documentation, and knowing how complex systems operate under real constraints.',
            'Having run a consumer brand through thousands of orders at The Vaxn Store also made compliance, financial discipline, and vendor accountability concrete rather than purely theoretical. Passing the NISM Series XXI-A: Securities Market Foundation exam in April 2026 added further grounding in Indian securities markets and SEBI regulations.',
          ],
        },
        {
          heading: 'Managing Time Across Lectures, Exams, and Projects',
          paragraphs: [
            'Balancing B.Com coursework at Lucknow University, Company Secretary study blocks, and selective freelance web builds requires clear boundaries around time. Formal exam preparation takes focused daily reading and revision across accounting, commercial law, and governance.',
            'Keeping web development selective and streamlined—using repeatable React, Tailwind CSS, and Supabase patterns—allows me to build reliable sites for projects like Nutstridinida without losing focus on university and CS study.',
          ],
        },
        {
          heading: 'Long-Term Focus in Finance, Law, and Digital Strategy',
          paragraphs: [
            'Looking ahead, studying corporate governance, law, finance, and human psychology alongside modern web technology offers a practical combination. Modern businesses operate both online and within clear statutory and governance frameworks at the same time, so fluency across both sides is useful.',
            'Outside formal study, reading across investing, human behavior, and digital systems keeps learning active. My completed Grade 12 years at St. Xavier\'s High School, Gonda built early study discipline. Taking steady steps through B.Com in Accounting & Finance and E-commerce at the University of Lucknow alongside Company Secretary exam preparation keeps my foundation honest, grounded, and focused on real professional competence over shortcuts.',
          ],
        },
      ],
    },
  ] satisfies BlogPost[],
};
