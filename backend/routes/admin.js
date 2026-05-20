// routes/admin.js
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const {
  getDashboard, addEmployee, bulkUploadEmployees,
  getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee, sendBirthdayEmails,
} = require('../controllers/adminController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5*1024*1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel'];
    ok.includes(file.mimetype) ? cb(null,true) : cb(new Error('Only .xlsx files allowed'),false);
  },
});

router.use(protect, authorize('admin'));

router.get('/dashboard',                       getDashboard);
router.get('/employees',                       getAllEmployees);
router.post('/employees',                      addEmployee);
router.post('/employees/bulk-upload', upload.single('file'), bulkUploadEmployees);
router.get('/employees/:id',                   getEmployeeById);
router.put('/employees/:id',                   updateEmployee);
router.delete('/employees/:id',                deleteEmployee);
router.post('/employees/:id/birthday-wish',    sendBirthdayEmails);

module.exports = router;
