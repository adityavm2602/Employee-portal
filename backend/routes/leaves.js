// routes/leaves.js
const express = require('express');
const router  = express.Router();
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const {
  applyLeave, getMyLeaves, getTeamLeaves,
  getHRLeaves, getAllLeaves, techLeadReview, hrReview, getTechLeads
} = require('../controllers/leaveController');

router.use(protect);

// Get all tech leads (for dropdown when applying leave)
router.get('/tech-leads', authorize('employee', 'tech_lead', 'admin'), getTechLeads);

// Employee AND TechLead can apply and view their own leaves
router.post('/',              authorize('employee', 'tech_lead'),        applyLeave);
router.get('/my',             authorize('employee', 'tech_lead'),        getMyLeaves);

// TL sees team leaves
router.get('/team',           authorize('tech_lead', 'admin'),           getTeamLeaves);

// HR and admin
router.get('/hr',             authorize('hr', 'admin'),                  getHRLeaves);
router.get('/all',            authorize('admin'),                        getAllLeaves);

// Review endpoints
router.patch('/:id/tl-review', authorize('tech_lead', 'admin'),         techLeadReview);
router.patch('/:id/hr-review', authorize('hr', 'admin'),                hrReview);

module.exports = router;
