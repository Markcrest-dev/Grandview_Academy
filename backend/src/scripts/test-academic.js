import { supabaseAdmin } from '../config/database.js';

async function runAcademicVerification() {
  console.log('================================================================');
  console.log('🎓 GRANDVIEW ACADEMY — ACADEMIC OPERATIONS INTEGRITY CHECK');
  console.log('================================================================\n');

  try {
    // 1. Verify Class & Student Roster queries
    console.log('🔍 Testing 1: Retrieving Active Classes & Allocated Student Profiles...');
    const { data: classes, error: classErr } = await supabaseAdmin
      .from('classes')
      .select('id, name, level, class_teacher_id')
      .limit(5);

    if (classErr) throw classErr;
    console.log(`✅ Classes verified: found ${classes.length} class units.`);
    
    if (classes.length > 0) {
      const classId = classes[0].id;
      const { data: students, error: studErr } = await supabaseAdmin
        .from('students')
        .select('id, first_name, last_name, admission_number')
        .eq('current_class_id', classId)
        .limit(5);

      if (studErr) throw studErr;
      console.log(`   └─ Successfully mapped ${students.length} students under Class: "${classes[0].name}".`);
    }

    // 2. Verify Attendance Tracking records
    console.log('\n🔍 Testing 2: Querying Daily Attendance Logs...');
    const { data: attendance, error: attErr } = await supabaseAdmin
      .from('attendance')
      .select('id, student_id, status, date, class_id')
      .limit(5);

    if (attErr) throw attErr;
    console.log(`✅ Attendance logs verified: retrieved ${attendance.length} record entries.`);

    // 3. Verify Gradebook Academic Scores
    console.log('\n🔍 Testing 3: Verifying Term Performance Gradebooks...');
    const { data: grades, error: gradeErr } = await supabaseAdmin
      .from('grades')
      .select('id, student_id, subject_id, score, assessment_type, term_id')
      .limit(5);

    if (gradeErr) throw gradeErr;
    console.log(`✅ Gradebook metrics verified: found ${grades.length} scored continuous assessments.`);

    // 4. Verify Schedule coordinate slots (Timetable)
    console.log('\n🔍 Testing 4: Checking Lecture Timetable Slots...');
    const { data: timetable, error: timeErr } = await supabaseAdmin
      .from('timetable_slots')
      .select('id, class_id, subject_id, day_of_week, start_time, end_time')
      .limit(5);

    if (timeErr) throw timeErr;
    console.log(`✅ Timetable slot matrices verified: found ${timetable.length} active slots.`);

    // 5. Verify Announcements
    console.log('\n🔍 Testing 5: Retrieving Announcements...');
    const { data: announcements, error: annErr } = await supabaseAdmin
      .from('announcements')
      .select('id, title, target_audience, created_at')
      .limit(3);

    if (annErr) throw annErr;
    console.log(`✅ Announcements verified: retrieved ${announcements.length} target announcements.`);

    console.log('\n================================================================');
    console.log('🎉 SUCCESS: All Academic Operations and Database Schemas Verified!');
    console.log('================================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ ERROR: Academic operational verification failed!');
    console.error(err.message || err);
    process.exit(1);
  }
}

runAcademicVerification();
