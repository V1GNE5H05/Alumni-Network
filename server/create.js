require('dotenv').config();
const { MongoClient } = require('mongodb');

const USE_AZURE = process.env.USE_AZURE === 'true';
const dbName = "alumni_network";

let MONGODB_URI;
if (USE_AZURE) {
  const COSMOS_HOST = process.env.COSMOS_HOST;
  const COSMOS_PORT = process.env.COSMOS_PORT || "10255";
  const COSMOS_USERNAME = process.env.COSMOS_USERNAME;
  const COSMOS_PASSWORD = process.env.COSMOS_PASSWORD;
  const encodedPassword = encodeURIComponent(COSMOS_PASSWORD);
  MONGODB_URI = `mongodb://${COSMOS_USERNAME}:${encodedPassword}@${COSMOS_HOST}:${COSMOS_PORT}/${dbName}?ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@${COSMOS_USERNAME}@`;
} else {
  MONGODB_URI = "mongodb://localhost:27017";
}

async function addSampleData() {
  const client = new MongoClient(MONGODB_URI, {
    ssl: USE_AZURE,
    retryWrites: false,
    maxIdleTimeMS: 120000,
  });

  try {
    await client.connect();
    console.log('✅ Connected\n');
    
    const db = client.db(dbName);
    
    // Add sample funds
    console.log('💰 Adding sample funds...');
    const fundsCollection = db.collection('funds');
    
    const sampleFunds = [
      {
        title: 'Computer Lab Renovation',
        description: 'Help us upgrade the computer lab with modern equipment and software to benefit current students',
        image: '',
        goal: 500000,
        raised: 125000,
        contributors: 15,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Scholarship Fund',
        description: 'Support talented students from economically disadvantaged backgrounds',
        image: '',
        goal: 1000000,
        raised: 340000,
        contributors: 28,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Library Expansion Project',
        description: 'Help us expand our library with more books and digital resources',
        image: '',
        goal: 750000,
        raised: 220000,
        contributors: 18,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    await fundsCollection.deleteMany({}); // Clear existing
    const fundsResult = await fundsCollection.insertMany(sampleFunds);
    console.log(`✅ Added ${Object.keys(fundsResult.insertedIds).length} funds\n`);
    
    // Add sample jobs
    console.log('💼 Adding sample jobs...');
    const jobsCollection = db.collection('jobposts');
    
    const sampleJobs = [
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
        jobDescription: 'We are looking for a talented Full Stack Developer to join our growing team. You will work on cutting-edge web applications using modern technologies.',
        postedDate: new Date()
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
        jobDescription: 'Join our data science team to build ML models and analyze large datasets. Work on exciting projects involving predictive analytics.',
        postedDate: new Date()
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
        jobDescription: 'Create beautiful and responsive user interfaces using React and modern web technologies.',
        postedDate: new Date()
      }
    ];
    
    await jobsCollection.deleteMany({}); // Clear existing
    const jobsResult = await jobsCollection.insertMany(sampleJobs);
    console.log(`✅ Added ${Object.keys(jobsResult.insertedIds).length} jobs\n`);
    
    // Add sample internships
    console.log('🎓 Adding sample internships...');
    const internshipsCollection = db.collection('internships');
    
    const sampleInternships = [
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
        description: 'Join our team as a Software Development Intern and gain hands-on experience building real-world applications.',
        postedDate: new Date()
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
        description: 'Work on cutting-edge machine learning projects and research.',
        postedDate: new Date()
      }
    ];
    
    await internshipsCollection.deleteMany({}); // Clear existing
    const internshipsResult = await internshipsCollection.insertMany(sampleInternships);
    console.log(`✅ Added ${Object.keys(internshipsResult.insertedIds).length} internships\n`);
    
    console.log('🎉 All sample data added successfully!\n');
    
    // Verify
    console.log('📊 Verification:');
    console.log(`   Funds: ${await fundsCollection.countDocuments()}`);
    console.log(`   Jobs: ${await jobsCollection.countDocuments()}`);
    console.log(`   Internships: ${await internshipsCollection.countDocuments()}`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
}

addSampleData();