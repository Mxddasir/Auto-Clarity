const router = require('express').Router();
const { lookupReg, decodeVin } = require('../controllers/vehicle');

router.get('/reg/:plate', lookupReg);
router.get('/vin/:vin',   decodeVin);

module.exports = router;