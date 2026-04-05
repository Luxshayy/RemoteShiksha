const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Store file in memory temporarily before sending to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

module.exports = { cloudinary, upload };