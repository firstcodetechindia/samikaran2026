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
    includeSchema: boolean;
    schemaOnly: boolean;
    exportType: string;
  };
  schema: Record<string, string>;
  data: Record<string, any[]>;
}

const TABLES_ORDER = [
  'users',
  'regions',
  'countries',
  'states',
  'cities',
  'schools',
  'classes',
  'exam_subjects',
  'exams',
  'student_registrations',
  'questions',
  'attempts',
  'attempt_questions',
  'answers',
  'certificates',
  'certificate_templates',
  'invoices',
  'payments',
  'coupons',
  'coupon_usages',
  'pricing_tiers',
  'exam_pricing',
  'blog_categories',
  'blog_tags',
  'blog_posts',
  'blog_post_tags',
  'cms_pages',
  'cms_page_sections',
  'cms_form_submissions',
  'announcements',
  'calendar_events',
  'notifications',
  'chatbot_agents',
  'chatbot_sessions',
  'chatbot_messages',
  'chatbot_flows',
  'chatbot_flow_nodes',
  'chatbot_settings',
  'chatbot_blocked_domains',
  'human_agents',
  'chat_assignments',
  'agent_sessions',
  'agent_flows',
  'agent_voice_settings',
  'agent_performance_metrics',
  'ai_handover_logs',
  'ai_providers',
  'chat_quality_reviews',
  'audio_messages',
  'abuse_reports',
  'proctoring_logs',
  'proctoring_sessions',
  'proctoring_alerts',
  'proctoring_config',
  'violation_types',
  'face_registration_logs',
  'exam_rules',
  'exam_rule_assignments',
  'qa_test_suites',
  'qa_test_cases',
  'qa_test_runs',
  'qa_test_results',
  'qa_bugs',
  'qa_release_candidates',
  'qa_release_evaluations',
  'system_settings',
  'social_links',
  'seo_redirects',
  'consent_versions',
  'consent_records',
  'partners',
  'partner_types',
  'partner_commissions',
  'payout_requests',
  'permissions',
  'roles',
  'role_permissions',
  'user_roles',
  'audit_logs',
  'api_health_checks',
  'audit_alert_configs',
  'audit_alert_history',
  'audit_schedule_configs',
];

async function importData() {
  const jsonPath = path.resolve(__dirname, '../../attached_assets/samikaran_export_2026-01-29_1769698500486.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error('Export file not found:', jsonPath);
    process.exit(1);
  }

  console.log('Reading export file...');
  const fileContent = fs.readFileSync(jsonPath, 'utf-8');
  const exportData: ExportData = JSON.parse(fileContent);

  console.log(`Export info: ${exportData.exportInfo.tableCount} tables, generated at ${exportData.exportInfo.generatedAt}`);

  const allTables = Object.keys(exportData.data);
  console.log(`Found ${allTables.length} tables with data`);

  let importedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const tableName of TABLES_ORDER) {
    if (!exportData.data[tableName]) {
      continue;
    }

    const rows = exportData.data[tableName];
    if (!rows || rows.length === 0) {
      skippedCount++;
      continue;
    }

    console.log(`Importing ${tableName}: ${rows.length} rows...`);

    try {
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        
        const columnsList = columns.map(c => `"${c}"`).join(', ');
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        
        const query = `INSERT INTO "${tableName}" (${columnsList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
        
        try {
          await db.execute(sql.raw(query.replace(/\$(\d+)/g, (_, n) => {
            const val = values[parseInt(n) - 1];
            if (val === null) return 'NULL';
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            return String(val);
          })));
        } catch (rowErr: any) {
          console.error(`  Error inserting row in ${tableName}:`, rowErr.message?.slice(0, 100));
        }
      }
      importedCount++;
      console.log(`  ✓ ${tableName} imported successfully`);
    } catch (err: any) {
      console.error(`  ✗ Error importing ${tableName}:`, err.message);
      errorCount++;
    }
  }

  for (const tableName of allTables) {
    if (TABLES_ORDER.includes(tableName)) continue;
    
    const rows = exportData.data[tableName];
    if (!rows || rows.length === 0) {
      skippedCount++;
      continue;
    }

    console.log(`Importing ${tableName}: ${rows.length} rows...`);

    try {
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        
        const columnsList = columns.map(c => `"${c}"`).join(', ');
        
        const query = `INSERT INTO "${tableName}" (${columnsList}) VALUES (${columns.map((_, i) => {
          const val = values[i];
          if (val === null) return 'NULL';
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          return String(val);
        }).join(', ')}) ON CONFLICT DO NOTHING`;
        
        try {
          await db.execute(sql.raw(query));
        } catch (rowErr: any) {
          console.error(`  Error inserting row in ${tableName}:`, rowErr.message?.slice(0, 100));
        }
      }
      importedCount++;
      console.log(`  ✓ ${tableName} imported successfully`);
    } catch (err: any) {
      console.error(`  ✗ Error importing ${tableName}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`Imported: ${importedCount} tables`);
  console.log(`Skipped (empty): ${skippedCount} tables`);
  console.log(`Errors: ${errorCount} tables`);
}

importData()
  .then(() => {
    console.log('Import completed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  });
