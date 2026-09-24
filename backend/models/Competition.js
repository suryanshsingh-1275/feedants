const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema(
  {
    position: String,
    amount: Number
  },
  { _id: false }
);

const winnerSchema = new mongoose.Schema(
  {
    name: String,
    position: String,
    photoUrl: String,
    videoUrl: String
  },
  { _id: false }
);

const competitionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    tags: [String],
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    judge: {
      name: String,
      title: String,
      experience: String,
      photoUrl: String,
      videoUrl: String
    },

    prizePool: { type: Number, required: true },
    entryFee: { type: Number, required: true },

    totalSpots: { type: Number, required: true },
    // Counter incremented atomically on each successful registration.
    bookedSpots: { type: Number, default: 0 },

    registerBefore: { type: Date, required: true },
    submissionStart: { type: Date, required: true },
    submissionEnd: { type: Date, required: true },
    resultDate: { type: Date, required: true },

    aboutText: String,
    judgingParams: String,
    rulesEligibility: String,

    rewards: [rewardSchema],
    previousWinners: [winnerSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Competition', competitionSchema);
