/**
 * Run PR Pillar Schema Repair SQL
 *
 * This script uses pg directly to run the repair SQL.
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runRepairSQL() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!');

    // Get SQL file from command line arg or default
    const sqlFile = process.argv[2] || 'PR_PILLAR_SCHEMA_REPAIR.sql';
    const sqlPath = path.join(__dirname, '../supabase', sqlFile);
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('Running repair SQL...');
    const result = await client.query(sql);
    console.log('Repair SQL completed!');
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runRepairSQL();
