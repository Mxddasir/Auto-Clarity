const router = require('express').Router();
const auth   = require('../middleware/auth');
const {
  getCode, startSession, answerQuestion, listCodes
} = require('../controllers/obd');

router.get('/code/:code',        getCode);
router.get('/codes',             listCodes);
router.post('/session/start', auth, startSession);
router.post('/session/answer', auth, answerQuestion);

module.exports = router;
