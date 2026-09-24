const express = require('express');
const router = express.Router();
const {
  createCompetition,
  listCompetitions,
  getCompetitionDetails
} = require('../controllers/competitionController');
const { protect, optionalAuth, requireRole } = require('../middleware/auth');

router.post('/', protect, requireRole('organizer'), createCompetition);
router.get('/', listCompetitions);
router.get('/:id', optionalAuth, getCompetitionDetails);

module.exports = router;
