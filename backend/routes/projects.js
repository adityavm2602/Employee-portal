// routes/projects.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const {
  createProject, getAllProjects, getProjectById, updateProject, deleteProject,
  getApplications, updateApplicationStatus, getMyTeam,
} = require('../controllers/projectController');

router.use(protect);

router.get('/', getAllProjects);
router.get('/my-team', authorize('tech_lead', 'admin'), getMyTeam);
router.get('/:id', getProjectById);
router.post('/', authorize('tech_lead', 'admin'), createProject);
router.put('/:id', authorize('tech_lead', 'admin'), updateProject);
router.delete('/:id', authorize('tech_lead', 'admin'), deleteProject);
router.get('/:id/applications', authorize('tech_lead', 'admin'), getApplications);
router.patch('/:projectId/applications/:appId', authorize('tech_lead', 'admin'), updateApplicationStatus);

module.exports = router;
