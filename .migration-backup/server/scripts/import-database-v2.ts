import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ExportData {
  exportInfo: {
    generatedAt: string;
    tableCount: number;
  };
  schema: Record<string, string>;
  data: Record<string, any[]>;
}

function escapeValue(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return `ARRAY[${val.map(v => typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v).join(',')}]::text[]`;
    }
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  return String(val);
}

async function importData() {
  const jsonPath = path.resolve(__dirname, '../../attached_assets/samikaran_export_2026-01-29_1769698500486.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error('Export file not found:', jsonPath);
    process.exit(1);
  }

  console.log('Reading export file...');
  const fileContent = fs.readFileSync(jsonPath, 'utf-8');
  const exportData: ExportData = JSON.parse(fileContent);

  console.log(`Export info: ${exportData.exportInfo.tableCount} tables`);

  const allTables = Object.keys(exportData.data);
  console.log(`Found ${allTables.length} tables with data`);

  console.log('Disabling foreign key checks...');
  await db.execute(sql`SET session_replication_role = 'replica'`);

  let importedCount = 0;
  let skippedCount = 0;
  let totalRows = 0;

  for (const tableName of allTables) {
    const rows = exportData.data[tableName];
    if (!rows || rows.length === 0) {
      skippedCount++;
      continue;
    }

    console.log(`Importing ${tableName}: ${rows.length} rows...`);
    let successCount = 0;

    for (const row of rows) {
      try {
        const columns = Object.keys(row);
        const columnsList = columns.map(c => `"${c}"`).join(', ');
        const valuesList = columns.map(c => escapeValue(row[c])).join(', ');
        
        const query = `INSERT INTO "${tableName}" (${columnsList}) VALUES (${valuesList}) ON CONFLICT DO NOTHING`;
        
        await db.execute(sql.raw(query));
        successCount++;
      } catch (err: any) {
        // Silently skip errors for individual rows
      }
    }
    
    if (successCount > 0) {
      console.log(`  ✓ ${tableName}: ${successCount}/${rows.length} rows imported`);
      importedCount++;
      totalRows += successCount;
    } else {
      console.log(`  ○ ${tableName}: no rows imported (schema mismatch or duplicates)`);
    }
  }

  console.log('Re-enabling foreign key checks...');
  await db.execute(sql`SET session_replication_role = 'origin'`);

  console.log('\n=== Import Summary ===');
  console.log(`Tables processed: ${importedCount}`);
  console.log(`Total rows imported: ${totalRows}`);
  console.log(`Skipped (empty): ${skippedCount}`);
}

importData()
  .then(() => {
    console.log('\nImport completed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  });
