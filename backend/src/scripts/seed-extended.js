import 'dotenv/config';
import { supabaseAdmin } from '../config/database.js';

// Random selection utility
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function seedExtended() {
  console.log('🚀 Starting extended dummy data seed...\n');

  try {
    // 1. Fetch Core Data References
    console.log('Fetching core references (Term, Classes, Students, Teachers, Subjects)...');
    
    // Get current term
    const { data: terms } = await supabaseAdmin.from('terms').select('*').limit(1);
    if (!terms || terms.length === 0) throw new Error('No terms found. Seed academic basic data first.');
    const termId = terms[0].id;
    const academicYearId = terms[0].academic_year_id;

    // Get classes
    const { data: classes } = await supabaseAdmin.from('classes').select('*');
    if (!classes || classes.length === 0) throw new Error('No classes found.');

    // Get students
    const { data: students } = await supabaseAdmin.from('students').select('*');
    if (!students || students.length === 0) throw new Error('No students found.');

    // Get teaching staff
    const { data: teachers } = await supabaseAdmin.from('staff').select('*').eq('staff_type', 'teaching');
    if (!teachers || teachers.length === 0) throw new Error('No teachers found.');

    // Get subjects
    let { data: subjects } = await supabaseAdmin.from('subjects').select('*');
    if (!subjects || subjects.length === 0) {
      console.log('No subjects found. Creating basic subjects...');
      const defaultSubjects = ['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'Computer Studies', 'Agricultural Science'].map(s => ({ name: s, code: s.substring(0, 3).toUpperCase(), level: 'secondary' }));
      const { data: newSubjects, error: subjErr } = await supabaseAdmin.from('subjects').insert(defaultSubjects).select('*');
      if (subjErr) console.error('Subject error:', subjErr.message);
      subjects = newSubjects;
      if (!subjects || subjects.length === 0) throw new Error('Failed to create subjects.');
    }

    console.log(`Loaded ${classes.length} classes, ${students.length} students, ${teachers.length} teachers, ${subjects.length} subjects.`);


    // ── 2. SEED TIMETABLE SLOTS ──
    console.log('📅 Seeding Timetable...');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const times = [
      { start: '08:00', end: '09:00' },
      { start: '09:00', end: '10:00' },
      { start: '10:30', end: '11:30' },
      { start: '11:30', end: '12:30' }
    ];
    
    // Clear old
    await supabaseAdmin.from('timetable_slots').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    let timetableInserts = [];
    for (const cls of classes) {
      for (const day of days) {
        for (const t of times) {
          const subject = pick(subjects);
          const teacher = pick(teachers);
          timetableInserts.push({
            class_id: cls.id,
            subject_id: subject.id,
            teacher_id: teacher.id,
            day_of_week: day,
            start_time: t.start,
            end_time: t.end,
            term_id: termId,
            room: `Room ${Math.floor(Math.random() * 20) + 100}`
          });
        }
      }
    }
    // Chunk inserts
    for (let i = 0; i < timetableInserts.length; i += 500) {
      await supabaseAdmin.from('timetable_slots').insert(timetableInserts.slice(i, i + 500));
    }
    console.log(`   ✅ Inserted ${timetableInserts.length} timetable slots.`);


    // ── 3. SEED ATTENDANCE ──
    console.log('🙋‍♂️ Seeding Attendance...');
    await supabaseAdmin.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Create attendance for the last 5 days
    let attendanceInserts = [];
    const statuses = ['Present', 'Present', 'Present', 'Present', 'Absent', 'Late'];
    for (let i = 0; i < 5; i++) {
      let d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      for (const student of students) {
        attendanceInserts.push({
          student_id: student.id,
          class_id: student.current_class_id,
          term_id: termId,
          date: dateStr,
          status: pick(statuses),
          remarks: 'Seeded record'
        });
      }
    }
    for (let i = 0; i < attendanceInserts.length; i += 500) {
      await supabaseAdmin.from('attendance').insert(attendanceInserts.slice(i, i + 500));
    }
    console.log(`   ✅ Inserted ${attendanceInserts.length} attendance records.`);


    // ── 4. SEED ASSIGNMENTS ──
    console.log('📝 Seeding Assignments...');
    await supabaseAdmin.from('assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    let assignmentInserts = [];
    for (const cls of classes) {
      for (let i = 0; i < 3; i++) {
        let d = new Date();
        d.setDate(d.getDate() + (Math.floor(Math.random() * 10) + 2)); // Due in 2-12 days
        assignmentInserts.push({
          title: `Homework ${i+1}: ${pick(['Research', 'Essay', 'Problem Set', 'Reading'])}`,
          description: 'Please complete the attached exercises and submit before the deadline.',
          subject_id: pick(subjects).id,
          class_id: cls.id,
          term_id: termId,
          created_by: pick(teachers).id,
          due_date: d.toISOString(),
          max_score: 100,
          is_active: true
        });
      }
    }
    await supabaseAdmin.from('assignments').insert(assignmentInserts);
    console.log(`   ✅ Inserted ${assignmentInserts.length} assignments.`);


    // ── 5. SEED ANNOUNCEMENTS ──
    console.log('📢 Seeding Announcements...');
    // Assuming table exists as `announcements` or `notifications`. We'll try notifications if announcements fails.
    // In migration 004, it's `notifications`.
    await supabaseAdmin.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const messages = [
      { t: 'End of Term Exams', b: 'Please be reminded that end of term examinations commence next week.' },
      { t: 'Public Holiday', b: 'The school will be closed on Friday for the national holiday.' },
      { t: 'PTA Meeting', b: 'The Parent-Teacher Association meeting is scheduled for Saturday.' },
      { t: 'Science Fair', b: 'Registration for the annual Science Fair is now open.' }
    ];
    let notificationInserts = [];
    for (const msg of messages) {
      notificationInserts.push({
        title: msg.t,
        message: msg.b,
        type: 'system',
        target_audience: 'all',
        is_global: true,
        created_at: new Date().toISOString()
      });
    }
    await supabaseAdmin.from('notifications').insert(notificationInserts);
    console.log(`   ✅ Inserted ${notificationInserts.length} announcements.`);


    // ── 6. SEED COURSE REGISTRATIONS ──
    console.log('📚 Seeding Course Registrations...');
    // If there is an `enrollments` or `course_registrations` table...
    // Let's try `student_subjects` or just skip if it throws.
    try {
      let regInserts = [];
      for (const student of students) {
        // Assign 5 random subjects to each student
        const shuffled = [...subjects].sort(() => 0.5 - Math.random());
        let selected = shuffled.slice(0, 5);
        for (const sub of selected) {
          regInserts.push({ student_id: student.id, subject_id: sub.id, term_id: termId });
        }
      }
      const { error: regErr } = await supabaseAdmin.from('student_subjects').insert(regInserts);
      if (regErr) {
        console.log(`   ℹ️ No student_subjects table or error: ${regErr.message}`);
      } else {
        console.log(`   ✅ Inserted ${regInserts.length} subject enrollments.`);
      }
    } catch(e) {}


    // ── 7. SEED FEES & INVOICES ──
    console.log('💰 Seeding Fees & Invoices...');
    const { data: structures } = await supabaseAdmin.from('fee_structures').select('*');
    if (structures && structures.length > 0) {
      // Create invoices for students
      let invoiceInserts = [];
      for (const student of students) {
        // match structure to student level
        const levelStructs = structures.filter(s => s.level === student.level || !s.level);
        if (levelStructs.length > 0) {
          const struct = levelStructs[0];
          invoiceInserts.push({
            student_id: student.id,
            term_id: termId,
            fee_structure_id: struct.id,
            amount_due: struct.amount,
            amount_paid: Math.random() > 0.5 ? struct.amount : 0, // 50% paid
            status: Math.random() > 0.5 ? 'paid' : 'pending',
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      }
      try {
        const { error: invErr } = await supabaseAdmin.from('invoices').insert(invoiceInserts);
        if (invErr) {
          console.log(`   ℹ️ Invoices skipped: ${invErr.message}`);
        } else {
          console.log(`   ✅ Inserted ${invoiceInserts.length} invoices.`);
        }
      } catch(e) {}
    } else {
      console.log('   ℹ️ No fee structures found to generate invoices.');
    }


    console.log('\n🎉 Extended data seeding complete!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Extended Seeding failed:', err);
    process.exit(1);
  }
}

seedExtended();
