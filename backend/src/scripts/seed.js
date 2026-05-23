import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../config/database.js';

async function seed() {
  console.log('🚀 Starting Grandview Academy SMS database seeding...');

  try {
    // 1. Clean up existing test users/profiles if they exist to allow re-runs
    console.log('🧹 Cleaning up existing test records...');
    const testEmails = [
      'admin@grandview.edu',
      'teacher@grandview.edu',
      'student@grandview.edu',
      'parent@grandview.edu'
    ];

    // Find and delete users with these emails
    const { data: existingUsers } = await supabaseAdmin
      .from('users')
      .select('id')
      .in('email', testEmails);

    if (existingUsers && existingUsers.length > 0) {
      const ids = existingUsers.map(u => u.id);
      
      // Delete child profiles first due to foreign keys
      await supabaseAdmin.from('parent_student').delete().filter('parent_id', 'in', `(${ids.join(',')})`);
      await supabaseAdmin.from('students').delete().in('user_id', ids);
      await supabaseAdmin.from('staff').delete().in('user_id', ids);
      await supabaseAdmin.from('parents').delete().in('user_id', ids);
      await supabaseAdmin.from('users').delete().in('id', ids);
      console.log('Cleared existing test user records.');
    }

    // Also clear existing test academic configuration
    await supabaseAdmin.from('classes').delete().eq('name', 'JSS 1A');
    await supabaseAdmin.from('terms').delete().eq('name', 'First Term');
    await supabaseAdmin.from('academic_years').delete().eq('name', '2026/2027');
    console.log('Cleared existing test academic configurations.');

    // 2. Generate hashed passwords
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('AdminPassword123', salt);
    const teacherHash = await bcrypt.hash('TeacherPassword123', salt);
    const studentHash = await bcrypt.hash('StudentPassword123', salt);
    const parentHash = await bcrypt.hash('ParentPassword123', salt);

    console.log('🔐 Hashed default passwords successfully.');

    // 3. Create Users
    console.log('👤 Creating user records...');
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .insert([
        { email: 'admin@grandview.edu', password_hash: adminHash, role: 'admin', must_change_password: false },
        { email: 'teacher@grandview.edu', password_hash: teacherHash, role: 'teaching_staff', must_change_password: false },
        { email: 'student@grandview.edu', password_hash: studentHash, role: 'student', must_change_password: false },
        { email: 'parent@grandview.edu', password_hash: parentHash, role: 'parent', must_change_password: false }
      ])
      .select();

    if (userError || !users) {
      throw new Error(`User creation failed: ${userError?.message}`);
    }

    const adminUser = users.find(u => u.email === 'admin@grandview.edu');
    const teacherUser = users.find(u => u.email === 'teacher@grandview.edu');
    const studentUser = users.find(u => u.email === 'student@grandview.edu');
    const parentUser = users.find(u => u.email === 'parent@grandview.edu');

    console.log('Created Users.');

    // 4. Create Academic Sessions & Structures
    console.log('📅 Creating academic year and term configurations...');
    const { data: year, error: yearError } = await supabaseAdmin
      .from('academic_years')
      .insert({
        name: '2026/2027',
        start_date: '2026-09-01',
        end_date: '2027-07-31',
        is_current: true
      })
      .select()
      .single();

    if (yearError || !year) {
      throw new Error(`Academic year creation failed: ${yearError?.message}`);
    }

    const { data: term, error: termError } = await supabaseAdmin
      .from('terms')
      .insert({
        academic_year_id: year.id,
        name: 'First Term',
        start_date: '2026-09-01',
        end_date: '2026-12-15',
        is_current: true
      })
      .select()
      .single();

    if (termError || !term) {
      throw new Error(`Term creation failed: ${termError?.message}`);
    }

    console.log('Created Academic Sessions.');

    // 5. Create Staff Profiles
    console.log('👩‍🏫 Creating teacher profile...');
    const { data: teacherProfile, error: staffError } = await supabaseAdmin
      .from('staff')
      .insert({
        user_id: teacherUser.id,
        staff_id_number: 'GAS/2020/045',
        first_name: 'Elizabeth',
        last_name: 'Adeola',
        gender: 'female',
        phone: '+2348011223344',
        department: 'Science',
        designation: 'Class Teacher',
        staff_type: 'teaching',
        qualification: 'B.Sc. Ed in Mathematics',
        date_joined: '2020-01-15'
      })
      .select()
      .single();

    if (staffError || !teacherProfile) {
      throw new Error(`Staff profile creation failed: ${staffError?.message}`);
    }

    console.log('Created Teacher Profile.');

    // 6. Create Classes
    console.log('🏫 Creating classes...');
    const { data: cohort, error: classError } = await supabaseAdmin
      .from('classes')
      .insert({
        name: 'JSS 1A',
        level: 'secondary',
        academic_year_id: year.id,
        class_teacher_id: teacherProfile.id
      })
      .select()
      .single();

    if (classError || !cohort) {
      throw new Error(`Class creation failed: ${classError?.message}`);
    }

    console.log('Created Class "JSS 1A".');

    // 7. Create Student Profiles
    console.log('🎒 Creating student profile...');
    const { data: studentProfile, error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        user_id: studentUser.id,
        admission_number: 'GA/2024/001',
        first_name: 'Chidi',
        last_name: 'Okafor',
        date_of_birth: '2012-05-14',
        gender: 'male',
        level: 'secondary',
        current_class_id: cohort.id,
        admission_date: '2024-09-01'
      })
      .select()
      .single();

    if (studentError || !studentProfile) {
      throw new Error(`Student profile creation failed: ${studentError?.message}`);
    }

    console.log('Created Student Profile.');

    // 8. Create Parent Profiles
    console.log('👪 Creating parent profile...');
    const { data: parentProfile, error: parentError } = await supabaseAdmin
      .from('parents')
      .insert({
        user_id: parentUser.id,
        parent_id_number: 'GAP/2026/089',
        first_name: 'Samuel',
        last_name: 'Okafor',
        phone: '+2348031234567',
        relationship: 'father',
        address: '12 Grandview Estate, Lekki, Lagos'
      })
      .select()
      .single();

    if (parentError || !parentProfile) {
      throw new Error(`Parent profile creation failed: ${parentError?.message}`);
    }

    console.log('Created Parent Profile.');

    // 9. Link Parent & Student
    console.log('🔗 Mapping parent-student relationship...');
    const { error: linkError } = await supabaseAdmin
      .from('parent_student')
      .insert({
        parent_id: parentProfile.id,
        student_id: studentProfile.id
      });

    if (linkError) {
      throw new Error(`Parent-student linking failed: ${linkError.message}`);
    }

    console.log('Mapped parent to student.');
    console.log('✅ Database seeded successfully with core auth configurations! 🎉');

  } catch (err) {
    console.error('❌ Seeding process encountered a fatal error:');
    console.error(err.message || err);
    process.exit(1);
  }
}

seed();
