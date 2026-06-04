// routes/employee.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { getProfile, applyForProject, getMyApplications, getAllEmployeesList } = require('../controllers/employeeController');

router.use(protect);
router.get('/profile', getProfile);
router.get('/applications', getMyApplications);
router.get('/list', authorize('admin', 'tech_lead', 'hr'), getAllEmployeesList);
router.post('/apply/:projectId', authorize('employee'), applyForProject);

module.exports = router;
