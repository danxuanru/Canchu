/* eslint-disable semi */
const express = require('express');
const multer = require('multer');
const { authenticateToken } = require('../utils/authorization');
const { signIn, signUp, getProfile, updatePicture, updateProfile, userSearch } = require('../controllers/users');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    // const name = path.extname(file.originalname);
    // cb(null, `${name}`);
    cb(null, `${file.fieldname}-${Date.now()}`);
  }
});

const upload = multer({ storage }); // create a instance

router.post('/signup', signUp);
router.post('/signin', signIn);
router.get('/:id/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/picture', authenticateToken, upload.single('picture'), updatePicture);
router.get('/search', authenticateToken, userSearch);

module.exports = router;
