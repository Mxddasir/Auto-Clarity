const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getHistory = async (req, res) => {
  const diagnostics = await prisma.diagnostic.findMany({
    where:   { userId: req.user.id },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ diagnostics });
};

exports.saveSession = async (req, res) => {
  try {
    const {
      obdCode, codeTitle, vehicleReg, vehicleVin,
      vehicleInfo, sessionData, diagnosis, severity
    } = req.body;

    const record = await prisma.diagnostic.create({
      data: {
        userId: req.user.id,
        obdCode, codeTitle: codeTitle || 'Unknown',
        vehicleReg, vehicleVin, vehicleInfo,
        sessionData, diagnosis,
        severity: severity || 'unknown'
      }
    });
    res.status(201).json({ record });
  } catch {
    res.status(500).json({ error: 'Failed to save' });
  }
};

exports.deleteEntry = async (req, res) => {
  const record = await prisma.diagnostic.findUnique({ where: { id: req.params.id } });
  if (!record || record.userId !== req.user.id)
    return res.status(404).json({ error: 'Not found' });
  await prisma.diagnostic.delete({ where: { id: req.params.id } });
  res.json({ success: true });
};
