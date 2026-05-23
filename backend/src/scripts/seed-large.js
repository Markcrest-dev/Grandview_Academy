import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to create randomized data
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzales', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPhone() {
  return '+23480' + Math.floor(10000000 + Math.random() * 90000000);
}

function generatePassword() {
  return 'Password123!';
}

async function seedLarge() {
  console.log('🚀 Starting large data seed...');
  let loginsMdContent = '# Grandview Academy Dummy Logins\n\n';

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    // 1. Get or create academic structures
    console.log('📅 Getting academic year and terms...');
    let { data: year } = await supabaseAdmin.from('academic_years').select('*').eq('is_current', true).single();
    if (!year) {
      const { data: newYear, error: err } = await supabaseAdmin.from('academic_years').insert({ name: '2026/2027', start_date: '2026-09-01', end_date: '2027-07-31', is_current: true }).select().single();
      if (err) throw err;
      year = newYear;
    }

    // 2. Generate Staff (15 Teaching, 20 Non-Teaching)
    console.log('👩‍🏫 Creating 15 Teaching Staff...');
    loginsMdContent += '## Teaching Staff\n| Name | Email | Password | Role |\n|---|---|---|---|\n';
    
    for (let i = 0; i < 15; i++) {
      const fn = getRandomItem(firstNames);
      const ln = getRandomItem(lastNames);
      const email = `teacher${i + 1}@grandview.edu`;
      
      const { data: user, error: uErr } = await supabaseAdmin.from('users')
        .insert({ email, password_hash: passwordHash, role: 'teaching_staff', must_change_password: false }).select().single();
      if (uErr) continue;

      const genderType = Math.random() > 0.5 ? 'men' : 'women';
      const profileUrl = `https://randomuser.me/api/portraits/${genderType}/${i % 90}.jpg`;

      await supabaseAdmin.from('staff').insert({
        user_id: user.id,
        staff_id_number: `GAS/T/${2020 + i}/${Math.floor(Math.random()*1000)}`,
        first_name: fn,
        last_name: ln,
        gender: genderType === 'men' ? 'male' : 'female',
        phone: getRandomPhone(),
        department: 'Academics',
        designation: 'Teacher',
        staff_type: 'teaching',
        qualification: 'B.Ed',
        date_joined: '2020-01-15'
      });
      loginsMdContent += `| ${fn} ${ln} | ${email} | Password123! | Teaching Staff |\n`;
    }

    console.log('👩‍🔧 Creating 20 Non-Teaching Staff...');
    loginsMdContent += '\n## Non-Teaching Staff\n| Name | Email | Password | Role |\n|---|---|---|---|\n';
    
    for (let i = 0; i < 20; i++) {
      const fn = getRandomItem(firstNames);
      const ln = getRandomItem(lastNames);
      const email = `staff${i + 1}@grandview.edu`;
      
      const { data: user, error: uErr } = await supabaseAdmin.from('users')
        .insert({ email, password_hash: passwordHash, role: 'non_teaching_staff', must_change_password: false }).select().single();
      if (uErr) continue;

      const genderType = Math.random() > 0.5 ? 'men' : 'women';
      const profileUrl = `https://randomuser.me/api/portraits/${genderType}/${i % 90}.jpg`;

      await supabaseAdmin.from('staff').insert({
        user_id: user.id,
        staff_id_number: `GAS/NT/${2020 + i}/${Math.floor(Math.random()*1000)}`,
        first_name: fn,
        last_name: ln,
        gender: genderType === 'men' ? 'male' : 'female',
        phone: getRandomPhone(),
        department: 'Administration',
        designation: 'Officer',
        staff_type: 'non_teaching',
        date_joined: '2021-01-15'
      });
      loginsMdContent += `| ${fn} ${ln} | ${email} | Password123! | Non-Teaching Staff |\n`;
    }

    // 3. Classes & Students (Primary, Secondary, University)
    console.log('🎒 Creating Students...');
    const levels = ['primary', 'secondary', 'university'];
    const students = [];
    loginsMdContent += '\n## Students\n| Name | Email | Password | Level | Admission Number |\n|---|---|---|---|---|\n';

    for (const level of levels) {
      // Create a class for this level
      const { data: cohort } = await supabaseAdmin.from('classes').insert({
        name: `Year 1 ${level}`,
        level: level,
        academic_year_id: year.id
      }).select().single();

      // Create 40 students per level
      for (let i = 0; i < 40; i++) {
        const fn = getRandomItem(firstNames);
        const ln = getRandomItem(lastNames);
        const email = `student_${level}_${i + 1}@grandview.edu`;

        const { data: user, error: uErr } = await supabaseAdmin.from('users')
          .insert({ email, password_hash: passwordHash, role: 'student', must_change_password: false }).select().single();
        if (uErr) continue;

        const adminNum = `GA/${level.substring(0,3)}/2026/${Math.floor(Math.random()*9000)+1000}`;

        const genderType = Math.random() > 0.5 ? 'men' : 'women';
        const profileUrl = `https://randomuser.me/api/portraits/${genderType}/${i % 90}.jpg`;

        const { data: studentProfile } = await supabaseAdmin.from('students').insert({
          user_id: user.id,
          admission_number: adminNum,
          first_name: fn,
          last_name: ln,
          date_of_birth: '2010-05-14',
          gender: genderType === 'men' ? 'male' : 'female',
          level: level,
          current_class_id: cohort ? cohort.id : null,
          admission_date: '2026-09-01'
        }).select().single();
        
        if (studentProfile) {
          students.push(studentProfile);
          loginsMdContent += `| ${fn} ${ln} | ${email} | Password123! | ${level} | ${adminNum} |\n`;
        }
      }
    }

    // 4. Parents (50 parents)
    console.log('👪 Creating 50 Parents...');
    loginsMdContent += '\n## Parents\n| Name | Email | Password | Parent ID |\n|---|---|---|---|\n';
    
    for (let i = 0; i < 50; i++) {
      const fn = getRandomItem(firstNames);
      const ln = getRandomItem(lastNames);
      const email = `parent${i + 1}@grandview.edu`;

      const { data: user, error: uErr } = await supabaseAdmin.from('users')
        .insert({ email, password_hash: passwordHash, role: 'parent', must_change_password: false }).select().single();
      if (uErr) continue;

      const parentIdNum = `GAP/2026/${Math.floor(Math.random()*9000)+1000}`;

      const genderType = Math.random() > 0.5 ? 'men' : 'women';
      const profileUrl = `https://randomuser.me/api/portraits/${genderType}/${i % 90}.jpg`;

      const { data: parentProfile } = await supabaseAdmin.from('parents').insert({
        user_id: user.id,
        parent_id_number: parentIdNum,
        first_name: fn,
        last_name: ln,
        phone: getRandomPhone(),
        relationship: genderType === 'men' ? 'father' : 'mother',
        address: '12 Grandview Estate, Lekki, Lagos'
      }).select().single();

      if (parentProfile) {
        loginsMdContent += `| ${fn} ${ln} | ${email} | Password123! | ${parentIdNum} |\n`;
        
        // Link to random 1-3 students
        const numChildren = Math.floor(Math.random() * 3) + 1;
        for (let c = 0; c < numChildren; c++) {
          const randomStudent = getRandomItem(students);
          await supabaseAdmin.from('parent_student').insert({
            parent_id: parentProfile.id,
            student_id: randomStudent.id
          });
        }
      }
    }

    // Write MD file
    const mdPath = path.join(__dirname, '../../../../logins.md');
    fs.writeFileSync(mdPath, loginsMdContent);
    console.log(`✅ Dummy data generated successfully! Logins saved to ${mdPath}`);

  } catch (err) {
    console.error('❌ Seeding failed:', err);
  }
}

seedLarge();
