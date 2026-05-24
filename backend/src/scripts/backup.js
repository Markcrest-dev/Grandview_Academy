import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabaseAdmin } from '../config/database.js';

// Setup file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupDir = path.join(__dirname, '../../backups');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Core tables to backup via REST API
// Note: In production, Supabase provides automated PostgreSQL backups (PITR) automatically.
// This script serves as an additional local snapshot utility for critical records.
const TABLES_TO_BACKUP = [
  'users',
  'students',
  'staff',
  'parents',
  'classes',
  'parent_student',
  'fee_structures',
  'fee_payments'
];

async function runBackup() {
  console.log('🛡️ Starting Grandview Academy Local Snapshot Backup...');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  const backupData = {
    metadata: {
      timestamp,
      environment: process.env.NODE_ENV || 'development'
    },
    tables: {}
  };

  try {
    for (const table of TABLES_TO_BACKUP) {
      console.log(`📥 Fetching data for table: ${table}...`);
      const { data, error } = await supabaseAdmin.from(table).select('*');
      
      if (error) {
        console.error(`❌ Error fetching ${table}:`, error.message);
        continue;
      }
      
      backupData.tables[table] = data;
      console.log(`   ✅ Exported ${data.length} rows.`);
    }

    const backupFilePath = path.join(backupDir, `backup_${timestamp}.json`);
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));
    
    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📂 Saved to: ${backupFilePath}`);
    console.log(`\nNote: For complete database dumps (including schema), use the Supabase CLI:`);
    console.log(`  supabase db dump --db-url <your-db-url> -f backup.sql`);
  } catch (err) {
    console.error('❌ Backup failed:', err);
    process.exit(1);
  }
}

runBackup();
