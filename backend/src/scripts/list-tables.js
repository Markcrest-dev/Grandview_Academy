import { supabaseAdmin } from '../config/database.js';

async function listTables() {
  console.log('Fetching database tables from Supabase...');
  try {
    const tables = ['users', 'students', 'staff', 'parents', 'parent_student', 'classes', 'subjects', 'academic_years', 'terms', 'attendance', 'grades', 'timetable_slots', 'announcements', 'admission_applications'];
    for (const t of tables) {
      const { error: err } = await supabaseAdmin.from(t).select('*').limit(1);
      console.log(`Table "${t}":`, err ? `❌ Error: ${err.message}` : '✅ Exists');
    }
  } catch (err) {
    console.error(err);
  }
}

listTables();
