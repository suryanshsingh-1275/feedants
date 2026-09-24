const express = require('express');
const router = express.Router();
const { register, submit, listRegistrations } = require('../controllers/registrationController');
const { protect, requireRole } = require('../middleware/auth');

router.post('/:id/register', protect, requireRole('participant'), register);
router.post('/:id/submit', protect, requireRole('participant'), submit);
router.get('/:id/registrations', protect, requireRole('organizer'), listRegistrations);

module.exports = router;
