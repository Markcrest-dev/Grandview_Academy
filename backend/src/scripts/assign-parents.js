import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve('/home/mark/Desktop/Grandview_Academy/backend/.env') });

import { supabaseAdmin } from '../config/database.js';

async function assignParents() {
  console.log('Fetching students...');
  const { data: students, error: studErr } = await supabaseAdmin.from('students').select('id, first_name, last_name');
  if (studErr) return console.error('Error fetching students:', studErr);

  console.log('Fetching parents...');
  const { data: parents, error: parErr } = await supabaseAdmin.from('parents').select('id, first_name, last_name');
  if (parErr) return console.error('Error fetching parents:', parErr);

  if (!students || students.length === 0) return console.log('No students found.');
  if (!parents || parents.length === 0) return console.log('No parents found.');

  console.log(`Found ${students.length} students and ${parents.length} parents. Assigning...`);

  // Clear existing mappings to avoid duplicates if re-running
  await supabaseAdmin.from('parent_student').delete().neq('parent_id', '00000000-0000-0000-0000-000000000000');

  // Assign students to parents round-robin
  const assignments = [];
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const parent = parents[i % parents.length];

    assignments.push({
      parent_id: parent.id,
      student_id: student.id
    });
  }

  // Insert assignments
  for (const assignment of assignments) {
    const { error: insertErr } = await supabaseAdmin
      .from('parent_student')
      .upsert(assignment, { onConflict: 'parent_id,student_id' });

    if (insertErr) {
      console.error(`Error assigning parent to student ${assignment.student_id}:`, insertErr);
    }
  }

  console.log('Done assigning students to parents.');
}

assignParents();
