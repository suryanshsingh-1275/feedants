const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    competition: { type: mongoose.Schema.Types.ObjectId, ref: 'Competition', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registeredAt: { type: Date, default: Date.now },
    submissionUrl: { type: String, default: null },
    submittedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// One registration per user per competition, enforced at the DB level.
registrationSchema.index({ competition: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
