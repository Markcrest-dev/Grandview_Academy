import { supabaseAdmin } from '../config/database.js';

async function assignTeachers() {
  console.log('Fetching classes...');
  const { data: classes, error: classesErr } = await supabaseAdmin.from('classes').select('id, name');
  if (classesErr) return console.error('Error fetching classes:', classesErr);

  console.log('Fetching teaching staff...');
  const { data: staff, error: staffErr } = await supabaseAdmin
    .from('staff')
    .select('id, first_name, last_name, users!inner(role)')
    .eq('users.role', 'teaching_staff');
  
  if (staffErr) return console.error('Error fetching staff:', staffErr);

  if (!classes || classes.length === 0) return console.log('No classes found.');
  if (!staff || staff.length === 0) return console.log('No teaching staff found.');

  console.log(`Found ${classes.length} classes and ${staff.length} teaching staff. Assigning...`);

  // Assign teachers in a round-robin fashion
  for (let i = 0; i < classes.length; i++) {
    const cls = classes[i];
    const teacher = staff[i % staff.length];

    const { error: updateErr } = await supabaseAdmin
      .from('classes')
      .update({ class_teacher_id: teacher.id })
      .eq('id', cls.id);

    if (updateErr) {
      console.error(`Error updating class ${cls.name}:`, updateErr);
    } else {
      console.log(`Assigned ${teacher.first_name} ${teacher.last_name} to ${cls.name}`);
    }
  }

  console.log('Done assigning teachers.');
}

assignTeachers();
