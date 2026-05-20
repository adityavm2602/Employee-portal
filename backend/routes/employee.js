// routes/employee.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { getProfile, applyForProject, getMyApplications } = require('../controllers/employeeController');

router.use(protect);
router.get('/profile', getProfile);
router.get('/applications', getMyApplications);
router.post('/apply/:projectId', authorize('employee'), applyForProject);

module.exports = router;
