const router = require('express').Router();
const { findMechanics } = require('../controllers/mechanic');

router.get('/nearby', findMechanics);

module.exports = router;
