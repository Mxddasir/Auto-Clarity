const router = require('express').Router();
const auth   = require('../middleware/auth');
const { getHistory, saveSession, deleteEntry } = require('../controllers/history');

router.get('/',     auth, getHistory);
router.post('/',    auth, saveSession);
router.delete('/:id', auth, deleteEntry);

module.exports = router;
