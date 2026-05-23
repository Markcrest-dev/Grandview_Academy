import { supabaseAdmin } from '../config/database.js';

async function checkColumns() {
  console.log('Inspecting Supabase database schemas...');
  const tables = ['attendance', 'grades', 'timetable_slots', 'subjects'];
  try {
    for (const table of tables) {
      // Query one row to see columns
      const { data, error } = await supabaseAdmin.from(table).select('*').limit(1);
      if (error) {
        console.log(`Table "${table}" error:`, error.message);
      } else {
        const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
        console.log(`Table "${table}" sample keys:`, columns.length > 0 ? columns : 'No records yet (empty table)');
      }
    }
  } catch (err) {
    console.error(err);
  }
}

checkColumns();
