const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const sequelize = require('../config/database');
const Record = require('../models/Record_SQL');
const Verification = require('../models/Verification_SQL');

async function backfill(refOrCase) {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const record = await Record.findOne({ where: { referenceNumber: refOrCase } }) || await Record.findOne({ where: { caseNumber: refOrCase } });
    if (!record) {
      console.error('Record not found for', refOrCase);
      process.exit(1);
    }

    const verification = await Verification.findOne({ where: { recordId: record.id } });
    if (!verification) {
      console.error('Verification not found for record', record.id);
      process.exit(1);
    }

    const photos = verification.photos || [];
    const updates = {};
    if (!verification.selfieWithHousePath && photos.length > 0) updates.selfieWithHousePath = photos[0];
    if (!verification.candidateWithRespondentPath && photos.length > 1) updates.candidateWithRespondentPath = photos[1];

    if (Object.keys(updates).length === 0) {
      console.log('No updates necessary. Current verification:', verification.toJSON());
      process.exit(0);
    }

    await verification.update(updates);
    console.log('Updated verification:', updates);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node backfillVerification.js <REFERENCE_OR_CASENUMBER>');
  process.exit(1);
}
backfill(arg);
