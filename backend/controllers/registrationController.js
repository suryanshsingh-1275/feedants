const Competition = require('../models/Competition');
const Registration = require('../models/Registration');

// This is the one endpoint where "thousands of concurrent users" actually matters:
// many people can hit /register on the same competition in the same millisecond
// when only 1 spot is left. We must never let bookedSpots exceed totalSpots.
//
// Approach: a single atomic findOneAndUpdate that only succeeds if the
// competition still has room AND registration is still open, incrementing
// bookedSpots in the same operation. MongoDB guarantees this check-and-increment
// is atomic per document, so two simultaneous requests can't both "see" the
// last spot free — only one findOneAndUpdate call wins it.
exports.register = async (req, res) => {
  const { id } = req.params;

  try {
    const alreadyRegistered = await Registration.findOne({ competition: id, user: req.user._id });
    if (alreadyRegistered) {
      return res.status(409).json({ message: 'You are already registered for this competition' });
    }

    const now = new Date();

    const comp = await Competition.findOneAndUpdate(
      {
        _id: id,
        registerBefore: { $gt: now },
        $expr: { $lt: ['$bookedSpots', '$totalSpots'] }
      },
      { $inc: { bookedSpots: 1 } },
      { new: true }
    );

    if (!comp) {
      const existing = await Competition.findById(id);
      if (!existing) return res.status(404).json({ message: 'Competition not found' });
      if (existing.registerBefore <= now) return res.status(400).json({ message: 'Registration is closed' });
      return res.status(400).json({ message: 'No spots left' });
    }

    try {
      const registration = await Registration.create({ competition: id, user: req.user._id });
      return res.status(201).json({ message: 'Registered successfully', registration });
    } catch (dupErr) {
      // Extremely rare race: the unique index on (competition, user) caught a
      // duplicate that our earlier findOne missed. Release the spot we just
      // reserved so the counter stays accurate, then report the real error.
      await Competition.findByIdAndUpdate(id, { $inc: { bookedSpots: -1 } });
      if (dupErr.code === 11000) {
        return res.status(409).json({ message: 'You are already registered for this competition' });
      }
      throw dupErr;
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.submit = async (req, res) => {
  const { id } = req.params;
  const { submissionUrl } = req.body;

  if (!submissionUrl) return res.status(400).json({ message: 'submissionUrl is required' });

  try {
    const comp = await Competition.findById(id);
    if (!comp) return res.status(404).json({ message: 'Competition not found' });

    const now = new Date();
    if (now < comp.submissionStart) return res.status(400).json({ message: 'Submissions have not opened yet' });
    if (now > comp.submissionEnd) return res.status(400).json({ message: 'Submission window has closed' });

    const registration = await Registration.findOne({ competition: id, user: req.user._id });
    if (!registration) return res.status(403).json({ message: 'You must register before submitting' });

    registration.submissionUrl = submissionUrl;
    registration.submittedAt = now;
    await registration.save();

    res.json({ message: 'Submission received', registration });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Organizer-only: see who registered/submitted, for judging.
exports.listRegistrations = async (req, res) => {
  const { id } = req.params;

  try {
    const comp = await Competition.findById(id);
    if (!comp) return res.status(404).json({ message: 'Competition not found' });
    if (String(comp.organizer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the organizer of this competition can view registrations' });
    }

    const registrations = await Registration.find({ competition: id }).populate('user', 'name email');
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
