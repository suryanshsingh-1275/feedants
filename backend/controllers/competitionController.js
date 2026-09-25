const Competition = require('../models/Competition');
const Registration = require('../models/Registration');

const getLifecycleStatus = (comp, now) => {
  if (now < comp.registerBefore) return 'registration-open';
  if (now < comp.submissionStart) return 'registration-closed';
  if (now < comp.submissionEnd) return 'submission-open';
  if (now < comp.resultDate) return 'submission-closed';
  return 'results-announced';
};

exports.createCompetition = async (req, res) => {
  try {
    const comp = await Competition.create({ ...req.body, organizer: req.user._id });
    res.status(201).json(comp);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.listCompetitions = async (req, res) => {
  const now = new Date();
  const comps = await Competition.find().sort({ createdAt: -1 });

  const data = comps.map((c) => ({
    id: c._id,
    title: c.title,
    tags: c.tags,
    prizePool: c.prizePool,
    entryFee: c.entryFee,
    totalSpots: c.totalSpots,
    spotsLeft: c.totalSpots - c.bookedSpots,
    status: getLifecycleStatus(c, now)
  }));

  res.json(data);
};

exports.getCompetitionDetails = async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id);
    if (!comp) return res.status(404).json({ message: 'Competition not found' });

    const now = new Date();
    const status = getLifecycleStatus(comp, now);
    const spotsLeft = comp.totalSpots - comp.bookedSpots;

    // req.user is only set if a valid token was sent (optionalAuth), so this
    // works for logged-out viewers too — they just get isRegistered: false.
    let registration = null;
    if (req.user) {
      registration = await Registration.findOne({ competition: comp._id, user: req.user._id });
    }

    const canRegister = status === 'registration-open' && spotsLeft > 0 && !registration;
    const canSubmit = status === 'submission-open' && !!registration && !registration.submissionUrl;

    res.json({
      id: comp._id,
      title: comp.title,
      tags: comp.tags,
      judge: comp.judge,
      prizePool: comp.prizePool,
      entryFee: comp.entryFee,
      totalSpots: comp.totalSpots,
      bookedSpots: comp.bookedSpots,
      spotsLeft,
      registerBefore: comp.registerBefore,
      submissionStart: comp.submissionStart,
      submissionEnd: comp.submissionEnd,
      resultDate: comp.resultDate,
      aboutText: comp.aboutText,
      judgingParams: comp.judgingParams,
      rulesEligibility: comp.rulesEligibility,
      rewards: comp.rewards,
      previousWinners: comp.previousWinners,
      status,
      registrationClosesInMs: Math.max(new Date(comp.registerBefore) - now, 0),
      isRegistered: !!registration,
      hasSubmitted: !!(registration && registration.submissionUrl),
      canRegister,
      canSubmit
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
