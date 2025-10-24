require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

// ============ CONFIGURATION ============
const USE_AZURE = process.env.USE_AZURE === 'true';
const dbName = "alumni_network";

let MONGODB_URI;
let clientOptions;

if (USE_AZURE) {
  const COSMOS_HOST = process.env.COSMOS_HOST;
  const COSMOS_PORT = process.env.COSMOS_PORT || "10255";
  const COSMOS_USERNAME = process.env.COSMOS_USERNAME;
  const COSMOS_PASSWORD = process.env.COSMOS_PASSWORD;
  
  if (!COSMOS_HOST || !COSMOS_USERNAME || !COSMOS_PASSWORD) {
    console.error("❌ Missing Azure Cosmos DB credentials in .env file");
    process.exit(1);
  }
  
  const encodedPassword = encodeURIComponent(COSMOS_PASSWORD);
  MONGODB_URI = `mongodb://${COSMOS_USERNAME}:${encodedPassword}@${COSMOS_HOST}:${COSMOS_PORT}/${dbName}?ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@${COSMOS_USERNAME}@`;
  
  clientOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    ssl: true,
    retryWrites: false,
    maxIdleTimeMS: 120000,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 360000,
  };
  
  console.log('🔧 Using Azure Cosmos DB');
  console.log('📍 Host:', COSMOS_HOST);
} else {
  MONGODB_URI = "mongodb://localhost:27017";
  clientOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };
  console.log('🔧 Using Local MongoDB');
}

// ============ SEED DATA ============

const seedData = {
  users: [
    {
      username: 'admin',
      password: 'admin',
      email: 'admin@alumni.com',
      role: 'admin'
    },
    {
      username: 'ALU001',
      password: 'ALU001',
      email: 'john.doe@alumni.com',
      studentId: null, // Will be set after student creation
    },
    {
      username: 'ALU002',
      password: 'ALU002',
      email: 'jane.smith@alumni.com',
      studentId: null,
    }
  ],
  
  students: [
    {
      alumni_id: 'ALU001',
      name: 'John Doe',
      email: 'john.doe@alumni.com',
      phone: '9876543210',
      batch: '2020',
      branch: 'Computer Science',
      current_company: 'Tech Corp',
      current_position: 'Software Engineer',
      location: 'Bangalore, Karnataka',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      linkedin: 'https://linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe',
      skills: ['JavaScript', 'Python', 'React', 'Node.js', 'MongoDB'],
      bio: 'Passionate software engineer with 3 years of experience in full-stack development',
      joining_year: '2016',
      graduation_year: '2020',
      degree: 'B.Tech',
      profile_image: '',
      achievements: ['Best Project Award 2020', 'Hackathon Winner 2019']
    },
    {
      alumni_id: 'ALU002',
      name: 'Jane Smith',
      email: 'jane.smith@alumni.com',
      phone: '9123456780',
      batch: '2019',
      branch: 'Information Technology',
      current_company: 'Data Analytics Inc',
      current_position: 'Data Scientist',
      location: 'Mumbai, Maharashtra',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      linkedin: 'https://linkedin.com/in/janesmith',
      github: 'https://github.com/janesmith',
      skills: ['Python', 'Machine Learning', 'Data Analysis', 'SQL', 'TensorFlow'],
      bio: 'Data scientist specializing in ML and AI solutions',
      joining_year: '2015',
      graduation_year: '2019',
      degree: 'B.Tech',
      profile_image: '',
      achievements: ['Research Paper Published', 'ML Competition Winner']
    },
    {
      alumni_id: 'ALU003',
      name: 'Raj Patel',
      email: 'raj.patel@alumni.com',
      phone: '9988776655',
      batch: '2021',
      branch: 'Electronics and Communication',
      current_company: 'IoT Solutions Ltd',
      current_position: 'IoT Engineer',
      location: 'Pune, Maharashtra',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      linkedin: 'https://linkedin.com/in/rajpatel',
      skills: ['IoT', 'Embedded Systems', 'C++', 'Arduino', 'Raspberry Pi'],
      bio: 'IoT enthusiast working on smart home solutions',
      joining_year: '2017',
      graduation_year: '2021',
      degree: 'B.Tech',
      profile_image: ''
    }
  ],
  
  events: [
    {
      title: 'Annual Alumni Meetup 2025',
      description: 'Join us for our annual alumni gathering! Reconnect with old friends, network with fellow alumni, and share your experiences. Special talks by distinguished alumni and networking sessions.',
      date: new Date('2025-12-15T18:00:00Z'),
      location: 'College Campus Auditorium, Main Building',
      venue: 'Main Auditorium',
      organizer: 'Alumni Association',
      organizer_email: 'events@alumni.com',
      organizer_phone: '9876543210',
      registrationLink: 'https://alumni.example.com/register/meetup2025',
      maxAttendees: 200,
      currentAttendees: 0,
      imageUrl: '/images/event-meetup.jpg',
      category: 'Networking',
      status: 'upcoming',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: 'Tech Talk: AI and Machine Learning',
      description: 'An insightful session on the latest trends in AI and Machine Learning by our distinguished alumni working at top tech companies.',
      date: new Date('2025-11-20T16:00:00Z'),
      location: 'Virtual Event (Zoom)',
      venue: 'Online',
      organizer: 'Tech Committee',
      organizer_email: 'tech@alumni.com',
      registrationLink: 'https://alumni.example.com/register/ai-talk',
      maxAttendees: 500,
      currentAttendees: 0,
      imageUrl: '/images/event-ai.jpg',
      category: 'Workshop',
      status: 'upcoming',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: 'Career Fair 2025',
      description: 'Connect with top companies looking to hire talented professionals. Job opportunities, career counseling, and networking.',
      date: new Date('2025-11-25T10:00:00Z'),
      location: 'College Sports Complex',
      venue: 'Sports Complex',
      organizer: 'Placement Cell',
      organizer_email: 'placement@alumni.com',
      registrationLink: 'https://alumni.example.com/register/career-fair',
      maxAttendees: 300,
      currentAttendees: 0,
      imageUrl: '/images/event-career.jpg',
      category: 'Career',
      status: 'upcoming',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  
  posts: [
    {
      author: 'John Doe',
      content: 'Excited to share that I\'ve joined Tech Corp as a Senior Software Engineer! Looking forward to connecting with fellow alumni and exploring new opportunities. Thanks to our amazing college for the solid foundation! 🎉',
      imageUrl: '',
      time: new Date('2025-01-10T10:30:00Z').toISOString(),
      likes: 15,
      comments: [
        { author: 'Jane Smith', text: 'Congratulations John! Well deserved!', time: new Date('2025-01-10T11:00:00Z').toISOString() },
        { author: 'Raj Patel', text: 'Amazing! All the best for your new role!', time: new Date('2025-01-10T12:00:00Z').toISOString() }
      ]
    },
    {
      author: 'Jane Smith',
      content: 'Just published my first research paper on Machine Learning applications in healthcare! Grateful for the guidance I received during my college days. Link in bio. 📚🔬',
      imageUrl: '/uploads/research-paper.jpg',
      time: new Date('2025-01-09T14:20:00Z').toISOString(),
      likes: 28,
      comments: [
        { author: 'John Doe', text: 'This is incredible Jane! Proud of you!', time: new Date('2025-01-09T15:00:00Z').toISOString() }
      ]
    },
    {
      author: 'Raj Patel',
      content: 'Had a great time at the IoT conference last week! Met some amazing people and learned about cutting-edge smart home technologies. Innovation never stops! 💡',
      imageUrl: '',
      time: new Date('2025-01-08T09:15:00Z').toISOString(),
      likes: 12,
      comments: []
    },
    {
      author: 'Admin',
      content: 'Welcome to the Alumni Portal! 🎓 Connect with fellow alumni, find job opportunities, and contribute to fundraising campaigns. Let\'s build a strong community together!',
      imageUrl: '',
      time: new Date('2025-01-05T08:00:00Z').toISOString(),
      likes: 45,
      comments: []
    }
  ],
  
  funds: [
    {
      title: 'Computer Lab Renovation Fund',
      description: 'Help us upgrade the computer lab with modern equipment, high-performance workstations, and the latest software to benefit current students. Your contribution will directly impact the learning experience of hundreds of students.',
      image: '/images/lab-renovation.jpg',
      goal: 500000,
      raised: 125000,
      contributors: 15,
      date: new Date('2025-01-05T00:00:00Z'),
      createdAt: new Date('2025-01-05T00:00:00Z'),
      updatedAt: new Date('2025-01-10T00:00:00Z'),
      category: 'Infrastructure',
      status: 'active',
      endDate: new Date('2025-12-31T23:59:59Z')
    },
    {
      title: 'Scholarship Fund for Underprivileged Students',
      description: 'Support talented students from economically disadvantaged backgrounds. Your donation will help deserving students pursue their education without financial barriers.',
      image: '/images/scholarship.jpg',
      goal: 1000000,
      raised: 340000,
      contributors: 28,
      date: new Date('2025-01-01T00:00:00Z'),
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-10T00:00:00Z'),
      category: 'Scholarship',
      status: 'active',
      endDate: new Date('2025-06-30T23:59:59Z')
    },
    {
      title: 'Library Expansion Project',
      description: 'Help us expand our library with more books, digital resources, and comfortable study spaces. Create a better learning environment for students.',
      image: '/images/library.jpg',
      goal: 750000,
      raised: 220000,
      contributors: 18,
      date: new Date('2025-01-03T00:00:00Z'),
      createdAt: new Date('2025-01-03T00:00:00Z'),
      updatedAt: new Date('2025-01-10T00:00:00Z'),
      category: 'Infrastructure',
      status: 'active',
      endDate: new Date('2025-11-30T23:59:59Z')
    }
  ],
  
  contributions: [
    {
      fundId: null, // Will be set dynamically
      amount: 50000,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@alumni.com',
      phone: '9876543210',
      street: 'MG Road',
      locality: 'Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      pincode: '560001',
      transactionMode: 'UPI',
      notes: 'Happy to contribute to my alma mater!',
      anonymous: false,
      createdAt: new Date('2025-01-08T10:00:00Z'),
      updatedAt: new Date('2025-01-08T10:00:00Z')
    },
    {
      fundId: null,
      amount: 25000,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@alumni.com',
      phone: '9123456780',
      street: 'Linking Road',
      locality: 'Bandra',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400001',
      transactionMode: 'Credit Card',
      notes: 'For the scholarship fund',
      anonymous: false,
      createdAt: new Date('2025-01-07T14:30:00Z'),
      updatedAt: new Date('2025-01-07T14:30:00Z')
    }
  ],
  
  jobposts: [
    {
      jobTitle: 'Full Stack Developer',
      company: 'Tech Innovations Inc',
      companyWebsite: 'https://techinnovations.com',
      experienceFrom: 2,
      experienceTo: 5,
      location: ['Bangalore', 'Remote'],
      contactEmail: 'hr@techinnovations.com',
      jobArea: 'Software Development',
      skills: ['React', 'Node.js', 'MongoDB', 'AWS', 'Docker'],
      salary: '₹12-18 LPA',
      applicationDeadline: '2025-02-28',
      jobDescription: 'We are looking for a talented Full Stack Developer to join our growing team. You will work on cutting-edge web applications using modern technologies. Responsibilities include designing and developing scalable web applications, collaborating with cross-functional teams, and ensuring high performance and responsiveness.',
      postedDate: new Date('2025-01-10T00:00:00Z')
    },
    {
      jobTitle: 'Data Scientist',
      company: 'Data Analytics Pro',
      companyWebsite: 'https://dataanalyticspro.com',
      experienceFrom: 1,
      experienceTo: 3,
      location: ['Mumbai', 'Pune', 'Hybrid'],
      contactEmail: 'careers@dataanalyticspro.com',
      jobArea: 'Data Science',
      skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Pandas'],
      salary: '₹10-15 LPA',
      applicationDeadline: '2025-02-20',
      jobDescription: 'Join our data science team to build ML models and analyze large datasets. Work on exciting projects involving predictive analytics, data visualization, and AI solutions. Collaborate with business teams to derive insights from data.',
      postedDate: new Date('2025-01-09T00:00:00Z')
    },
    {
      jobTitle: 'Frontend Developer',
      company: 'WebCraft Solutions',
      companyWebsite: 'https://webcraft.io',
      experienceFrom: 1,
      experienceTo: 4,
      location: ['Hyderabad', 'Remote'],
      contactEmail: 'jobs@webcraft.io',
      jobArea: 'Frontend Development',
      skills: ['React', 'TypeScript', 'HTML/CSS', 'JavaScript', 'Redux'],
      salary: '₹8-14 LPA',
      applicationDeadline: '2025-02-15',
      jobDescription: 'Create beautiful and responsive user interfaces using React and modern web technologies. Work closely with designers and backend developers to deliver exceptional user experiences.',
      postedDate: new Date('2025-01-08T00:00:00Z')
    },
    {
      jobTitle: 'DevOps Engineer',
      company: 'CloudTech Systems',
      companyWebsite: 'https://cloudtech.com',
      experienceFrom: 3,
      experienceTo: 6,
      location: ['Bangalore', 'Chennai'],
      contactEmail: 'talent@cloudtech.com',
      jobArea: 'DevOps',
      skills: ['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform'],
      salary: '₹15-22 LPA',
      applicationDeadline: '2025-03-01',
      jobDescription: 'We need an experienced DevOps engineer to manage our cloud infrastructure and CI/CD pipelines. Automate deployments, ensure system reliability, and optimize performance.',
      postedDate: new Date('2025-01-07T00:00:00Z')
    }
  ],
  
  internships: [
    {
      title: 'Software Development Intern',
      company: 'StartupXYZ',
      companyWebsite: 'https://startupxyz.com',
      duration: '3 months',
      location: ['Mumbai', 'Hybrid'],
      contactEmail: 'internships@startupxyz.com',
      jobArea: 'Web Development',
      skills: ['JavaScript', 'React', 'Git', 'HTML/CSS'],
      stipend: '₹15,000/month',
      applicationDeadline: '2025-02-15',
      description: 'Join our team as a Software Development Intern and gain hands-on experience building real-world applications. You\'ll work alongside experienced developers, contribute to live projects, and learn modern development practices. Perfect opportunity for students to kickstart their career!',
      postedDate: new Date('2025-01-10T00:00:00Z')
    },
    {
      title: 'Data Science Intern',
      company: 'AI Research Labs',
      companyWebsite: 'https://airesearchlabs.com',
      duration: '6 months',
      location: ['Bangalore', 'Remote'],
      contactEmail: 'intern@airesearchlabs.com',
      jobArea: 'Data Science',
      skills: ['Python', 'Pandas', 'NumPy', 'Machine Learning'],
      stipend: '₹20,000/month',
      applicationDeadline: '2025-02-10',
      description: 'Work on cutting-edge machine learning projects and research. Learn from industry experts, analyze large datasets, and build predictive models. Great learning opportunity for aspiring data scientists.',
      postedDate: new Date('2025-01-09T00:00:00Z')
    },
    {
      title: 'UI/UX Design Intern',
      company: 'Creative Minds Studio',
      companyWebsite: 'https://creativeminds.design',
      duration: '3 months',
      location: ['Pune', 'Remote'],
      contactEmail: 'design@creativeminds.design',
      jobArea: 'Design',
      skills: ['Figma', 'Adobe XD', 'Wireframing', 'Prototyping'],
      stipend: '₹12,000/month',
      applicationDeadline: '2025-02-20',
      description: 'Design beautiful and intuitive user interfaces for web and mobile applications. Work on real client projects and build your portfolio. Learn UX research, prototyping, and design systems.',
      postedDate: new Date('2025-01-08T00:00:00Z')
    },
    {
      title: 'Marketing Intern',
      company: 'Digital Marketing Hub',
      companyWebsite: 'https://digitalmarketinghub.com',
      duration: '4 months',
      location: ['Delhi', 'Hybrid'],
      contactEmail: 'careers@digitalmarketinghub.com',
      jobArea: 'Marketing',
      skills: ['Social Media', 'Content Writing', 'SEO', 'Analytics'],
      stipend: '₹10,000/month',
      applicationDeadline: '2025-02-25',
      description: 'Learn digital marketing strategies, manage social media campaigns, and analyze marketing metrics. Gain practical experience in SEO, content marketing, and brand management.',
      postedDate: new Date('2025-01-07T00:00:00Z')
    }
  ]
};

// ============ SEED FUNCTION ============

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI, clientOptions);

  try {
    console.log('\n🌱 Starting database seeding...\n');
    await client.connect();
    console.log(`✅ Connected to ${USE_AZURE ? 'Azure Cosmos DB' : 'Local MongoDB'}\n`);
    
    const db = client.db(dbName);

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('student').deleteMany({});
    await db.collection('events').deleteMany({});
    await db.collection('posts').deleteMany({});
    await db.collection('funds').deleteMany({});
    await db.collection('contributions').deleteMany({});
    await db.collection('jobposts').deleteMany({});
    await db.collection('internships').deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Insert students first
    console.log('👥 Adding students...');
    const studentsResult = await db.collection('student').insertMany(seedData.students);
    const studentIds = Object.values(studentsResult.insertedIds);
    console.log(`✅ Added ${studentIds.length} students`);

    // Update users with studentIds
    seedData.users[1].studentId = studentIds[0]; // John Doe
    seedData.users[2].studentId = studentIds[1]; // Jane Smith

    // Insert users
    console.log('🔐 Adding users...');
    const usersResult = await db.collection('users').insertMany(seedData.users);
    console.log(`✅ Added ${Object.keys(usersResult.insertedIds).length} users`);

    // Insert events
    console.log('📅 Adding events...');
    const eventsResult = await db.collection('events').insertMany(seedData.events);
    console.log(`✅ Added ${Object.keys(eventsResult.insertedIds).length} events`);

    // Insert posts
    console.log('📝 Adding posts...');
    const postsResult = await db.collection('posts').insertMany(seedData.posts);
    console.log(`✅ Added ${Object.keys(postsResult.insertedIds).length} posts`);

    // Insert funds
    console.log('💰 Adding fundraising campaigns...');
    const fundsResult = await db.collection('funds').insertMany(seedData.funds);
    const fundIds = Object.values(fundsResult.insertedIds);
    console.log(`✅ Added ${fundIds.length} fundraising campaigns`);

    // Update contributions with fundIds
    seedData.contributions[0].fundId = fundIds[0].toString(); // Computer Lab fund
    seedData.contributions[1].fundId = fundIds[1].toString(); // Scholarship fund

    // Insert contributions
    console.log('🎁 Adding contributions...');
    const contributionsResult = await db.collection('contributions').insertMany(seedData.contributions);
    console.log(`✅ Added ${Object.keys(contributionsResult.insertedIds).length} contributions`);

    // Insert job posts
    console.log('💼 Adding job postings...');
    const jobsResult = await db.collection('jobposts').insertMany(seedData.jobposts);
    console.log(`✅ Added ${Object.keys(jobsResult.insertedIds).length} job postings`);

    // Insert internships
    console.log('🎓 Adding internships...');
    const internshipsResult = await db.collection('internships').insertMany(seedData.internships);
    console.log(`✅ Added ${Object.keys(internshipsResult.insertedIds).length} internships`);

    console.log('\n🎉 Database seeding completed successfully!\n');
    
    console.log('📊 Summary:');
    console.log(`   - Users: ${Object.keys(usersResult.insertedIds).length}`);
    console.log(`   - Students: ${studentIds.length}`);
    console.log(`   - Events: ${Object.keys(eventsResult.insertedIds).length}`);
    console.log(`   - Posts: ${Object.keys(postsResult.insertedIds).length}`);
    console.log(`   - Funds: ${fundIds.length}`);
    console.log(`   - Contributions: ${Object.keys(contributionsResult.insertedIds).length}`);
    console.log(`   - Jobs: ${Object.keys(jobsResult.insertedIds).length}`);
    console.log(`   - Internships: ${Object.keys(internshipsResult.insertedIds).length}`);
    
    console.log('\n🔐 Login Credentials:');
    console.log('   Admin:');
    console.log('     Username: admin');
    console.log('     Password: admin');
    console.log('\n   Alumni Users:');
    console.log('     Username: ALU001 (John Doe)');
    console.log('     Password: ALU001');
    console.log('     Username: ALU002 (Jane Smith)');
    console.log('     Password: ALU002');
    
    console.log('\n⚠️  Remember to change admin password after first login!\n');

  } catch (err) {
    console.error('\n❌ Error seeding database:', err);
    process.exit(1);
  } finally {
    await client.close();
    console.log('👋 Database connection closed\n');
  }
}

// Run the seed function
seedDatabase();