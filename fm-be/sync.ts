import { connectDatabase } from './src/config/database.js';
import { syncCompanies } from './src/services/ingestion/company.ingestion.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function run() {
  await connectDatabase();
  console.log("Connected to DB, syncing...");
  const result = await syncCompanies();
  console.log("Done syncing:", result);
  mongoose.disconnect();
}
run();
