const router = require('express').Router();
const { searchVideos } = require('../controllers/youtube');

router.get('/search', searchVideos);

module.exports = router;
