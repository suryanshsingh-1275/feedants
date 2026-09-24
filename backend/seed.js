// Populates the DB with one organizer + one competition matching the
// provided design, so the app has something to show immediately.
require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Competition = require('./models/Competition');

const seed = async () => {
  await connectDB();
  await User.deleteMany({});
  await Competition.deleteMany({});

  const organizer = await User.create({
    name: 'Feedants Admin',
    email: 'organizer@feedants.com',
    password: 'password123',
    role: 'organizer'
  });

  await User.create({
    name: 'Demo Participant',
    email: 'participant@feedants.com',
    password: 'password123',
    role: 'participant'
  });

  await Competition.create({
    title: 'Feedants Classical Dance',
    tags: ['Dance', 'Multi-Win'],
    organizer: organizer._id,
    judge: {
      name: 'Manju Dubey',
      title: 'Professional Kathak Dancer',
      experience: '12+ Years of Experience',
      photoUrl: '',
      videoUrl: ''
    },
    prizePool: 1500,
    entryFee: 99,
    totalSpots: 20,
    bookedSpots: 1,
    registerBefore: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    submissionStart: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    submissionEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    resultDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    aboutText:
      'This is an online classical dance competition open for all age groups. Participate from anywhere and showcase your talent. Express your passion through traditional dance.',
    judgingParams: 'Technique, expression, rhythm and overall presentation will be judged by our panel.',
    rulesEligibility:
      'Open to all age groups. Only contributions from paid, registered participants will be considered for judging.',
    rewards: [
      { position: '1st Winner', amount: 550 },
      { position: '2nd Winner', amount: 300 },
      { position: '3rd Winner', amount: 240 },
      { position: '4th Winner', amount: 200 },
      { position: '5th Winner', amount: 130 },
      { position: '6th Winner', amount: 80 }
    ],
    previousWinners: [
      { name: 'Riya Shah', position: '1st Winner' },
      { name: 'Aarav Mehta', position: '1st Winner' },
      { name: 'Neha Verma', position: '2nd Winner' },
      { name: 'Ishita Chopra', position: '3rd Winner' }
    ]
  });

  console.log('Seed complete.');
  console.log('Organizer login  -> organizer@feedants.com / password123');
  console.log('Participant login -> participant@feedants.com / password123');
  process.exit();
};

seed();
