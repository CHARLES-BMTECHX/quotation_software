const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation
} = require('../controller/quotationController');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Routes
router.post('/create', upload.single('logo'), createQuotation);
router.get('/', getQuotations);
router.get('/:id', getQuotationById);
router.put('/:id', upload.single('logo'), updateQuotation);
router.delete('/:id', deleteQuotation);

module.exports = router;