require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes     = require('./routes/auth');
const obdRoutes      = require('./routes/obd');
const vehicleRoutes  = require('./routes/vehicle');
const mechanicRoutes = require('./routes/mechanic');
const historyRoutes  = require('./routes/history');
const youtubeRoutes  = require('./routes/youtube');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

app.use('/api/auth',     authRoutes);
app.use('/api/obd',      obdRoutes);
app.use('/api/vehicle',  vehicleRoutes);
app.use('/api/mechanic', mechanicRoutes);
app.use('/api/history',  historyRoutes);
app.use('/api/youtube',  youtubeRoutes);

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', app: 'Auto Clarity API' })
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`\x1b[33mAuto Clarity API running on port ${PORT}\x1b[0m`)
);
