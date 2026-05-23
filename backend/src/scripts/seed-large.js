import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ══════════════════════════════════════════════════════════════
// NIGERIAN NAME POOLS
// ══════════════════════════════════════════════════════════════
const maleFirstNames = [
  'Adebayo','Babatunde','Chukwuemeka','Damilola','Emeka','Femi','Gbenga',
  'Hakeem','Ikechukwu','Jide','Kelechi','Lanre','Musa','Nnamdi','Obinna',
  'Pelumi','Rotimi','Segun','Tunde','Ugochukwu','Wale','Yinka','Chinonso',
  'Kolade','Tobi','Olumide','Ayodele','Ebuka','Kunle','Abiodun','Olamide',
  'Chinedu','Oluwatobi','Chibueze','Tochukwu','Folarin','Arinze','Kayode'
];

const femaleFirstNames = [
  'Adaeze','Blessing','Chioma','Eniola','Folake','Grace','Halima',
  'Ifeoma','Jumoke','Kemi','Lola','Mojisola','Nneka','Oluwabukola',
  'Peace','Remi','Sade','Titilayo','Uchenna','Victoria','Wuraola',
  'Yetunde','Zainab','Chidinma','Funmilayo','Ngozi','Aisha','Bukola',
  'Temitope','Ronke','Amina','Favour','Adaobi','Bimpe','Titi','Aishat'
];

const middleNames = [
  'Chinedu','Oluwaseun','Ngozi','Amara','Ifeanyi','Adaora','Chibuzo',
  'Folarin','Arinze','Olayinka','Amarachi','Oluwatosin','Nkechi','Chidi',
  'Ogechi','Obianuju','Chiamaka','Olusegun','Adewale','Nkemdilim'
];

const lastNames = [
  'Okafor','Adeyemi','Nwosu','Balogun','Ogunlade','Eze','Igwe','Abubakar',
  'Okonkwo','Adeniyi','Oluwole','Chukwu','Okoro','Osagie','Adekunle',
  'Bakare','Yusuf','Obi','Oni','Adeleke','Afolabi','Udoh','Ibrahim',
  'Garba','Idris','Ojo','Fashola','Obembe','Akindele','Nwachukwu',
  'Uche','Amadi','Ogbonna','Ezechi','Bassey','Ogunyemi','Lawal',
  'Anyanwu','Ibe','Opara'
];

const departments = ['Mathematics','English','Science','Social Studies','Yoruba','Igbo','Hausa','Computer Science','Economics','Fine Arts','Physical Education','Biology','Chemistry','Physics','Literature'];
const ntDepartments = ['Administration','Bursary','Library','Medical','Transport','Security','ICT','Maintenance','Catering','Registry','Human Resources','Procurement','Student Affairs','Examination Office','General Services'];
const ntDesignations = ['Officer','Manager','Coordinator','Assistant','Supervisor','Clerk','Technician','Nurse','Librarian','Driver','Cook','Security Guard','Accountant','Registrar','Secretary'];
const qualifications = ['B.Ed','M.Ed','B.Sc. Ed','PGDE','NCE','B.A. Ed','M.Sc','Ph.D','HND','OND'];
const addresses = [
  '12 Grandview Estate, Lekki, Lagos','45 Adeola Odeku St, Victoria Island, Lagos',
  '8 Awolowo Road, Ikoyi, Lagos','23 Herbert Macaulay Way, Yaba, Lagos',
  '67 Ahmadu Bello Way, Kaduna','15 Azikiwe Road, Enugu',
  '34 Sapele Road, Benin City','90 Aba Road, Port Harcourt',
  '11 Ibrahim Taiwo Road, Kano','56 Owerri Road, Owerri',
  '78 Broad Street, Lagos Island','3 Onitsha Road, Awka',
  '29 Samonda, Ibadan','44 Ring Road, Ibadan',
  '61 Trans Amadi, Port Harcourt'
];

// ══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════════
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function getPhone() { return '+234' + (Math.random() > 0.5 ? '80' : '90') + Math.floor(10000000 + Math.random() * 90000000); }

// Unique password per user: Grand{FirstInitial}{LastInitial}{3-digit-number}!
function makePassword(fn, ln, idx) {
  const num = String(100 + idx).padStart(3, '0');
  const specials = ['!','@','#','$','%'];
  return `Grand${fn[0]}${ln[0]}${num}${specials[idx % specials.length]}`;
}

// Email: {firstInitial}{middleInitial}.{lastname}@{subdomain}.grandview.edu.ng
const usedEmails = new Set();
function makeEmail(fn, mn, ln, subdomain) {
  const base = `${fn[0].toLowerCase()}${mn ? mn[0].toLowerCase() : ''}`;
  let candidate = `${base}.${ln.toLowerCase()}@${subdomain}.grandview.edu.ng`;
  let counter = 2;
  while (usedEmails.has(candidate)) {
    candidate = `${base}${counter}.${ln.toLowerCase()}@${subdomain}.grandview.edu.ng`;
    counter++;
  }
  usedEmails.add(candidate);
  return candidate;
}

function randomDOB(minAge, maxAge) {
  const now = new Date();
  const age = minAge + Math.floor(Math.random() * (maxAge - minAge));
  const y = now.getFullYear() - age;
  const m = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
  const d = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ══════════════════════════════════════════════════════════════
// MAIN SEED
// ══════════════════════════════════════════════════════════════
async function seedLarge() {
  console.log('🚀 Starting Grandview Academy Nigerian data seed...\n');

  try {
    // ── STEP 0: CLEANUP OLD SEEDED DATA ──
    console.log('🧹 Cleaning up previously seeded dummy records...');
    
    // Find old seeded users by email patterns
    const oldPatterns = [];
    for (let i = 1; i <= 50; i++) oldPatterns.push(`parent${i}@grandview.edu`);
    for (let i = 1; i <= 20; i++) oldPatterns.push(`staff${i}@grandview.edu`);
    for (let i = 1; i <= 15; i++) oldPatterns.push(`teacher${i}@grandview.edu`);
    for (const level of ['primary','secondary','university']) {
      for (let i = 1; i <= 40; i++) oldPatterns.push(`student_${level}_${i}@grandview.edu`);
    }

    const { data: oldUsers } = await supabaseAdmin.from('users').select('id').in('email', oldPatterns);
    if (oldUsers && oldUsers.length > 0) {
      const ids = oldUsers.map(u => u.id);
      await supabaseAdmin.from('parent_student').delete().filter('parent_id', 'in', `(${ids.join(',')})`);
      await supabaseAdmin.from('students').delete().in('user_id', ids);
      await supabaseAdmin.from('staff').delete().in('user_id', ids);
      await supabaseAdmin.from('parents').delete().in('user_id', ids);
      await supabaseAdmin.from('users').delete().in('id', ids);
      console.log(`   Removed ${oldUsers.length} old dummy users.`);
    }

    // Also clean up old-format .grandview.edu.ng emails (from previous Nigerian seed runs)
    const { data: oldNgUsers } = await supabaseAdmin.from('users').select('id,email').like('email', '%@%.grandview.edu.ng');
    if (oldNgUsers && oldNgUsers.length > 0) {
      const ids = oldNgUsers.map(u => u.id);
      await supabaseAdmin.from('parent_student').delete().filter('parent_id', 'in', `(${ids.join(',')})`);
      await supabaseAdmin.from('students').delete().in('user_id', ids);
      await supabaseAdmin.from('staff').delete().in('user_id', ids);
      await supabaseAdmin.from('parents').delete().in('user_id', ids);
      await supabaseAdmin.from('users').delete().in('id', ids);
      console.log(`   Removed ${oldNgUsers.length} old .edu.ng seeded users.`);
    }

    // Clean up old classes created by previous seed runs
    await supabaseAdmin.from('classes').delete().like('name', 'Year 1 %');
    await supabaseAdmin.from('classes').delete().like('name', 'Primary %');
    await supabaseAdmin.from('classes').delete().like('name', 'JSS %');
    await supabaseAdmin.from('classes').delete().like('name', 'SSS %');
    await supabaseAdmin.from('classes').delete().like('name', '100 Level%');
    await supabaseAdmin.from('classes').delete().like('name', '200 Level%');
    console.log('   Cleaned up old classes.\n');

    // ── STEP 1: ACADEMIC YEAR ──
    console.log('📅 Getting academic year...');
    let { data: year } = await supabaseAdmin.from('academic_years').select('*').eq('is_current', true).single();
    if (!year) {
      const { data: newYear, error: err } = await supabaseAdmin.from('academic_years').insert({
        name: '2026/2027', start_date: '2026-09-01', end_date: '2027-07-31', is_current: true
      }).select().single();
      if (err) throw err;
      year = newYear;
    }

    const salt = await bcrypt.genSalt(10);
    let passwordIdx = 0;
    const allLogins = []; // { name, email, password, role, detail }

    // ── STEP 2: TEACHING STAFF (15) ──
    console.log('👩‍🏫 Creating 15 Teaching Staff...');
    for (let i = 0; i < 15; i++) {
      const isFemale = i % 2 === 0;
      const fn = pick(isFemale ? femaleFirstNames : maleFirstNames);
      const mn = pick(middleNames);
      const ln = pick(lastNames);
      const email = makeEmail(fn, mn, ln, 'staff');
      const password = makePassword(fn, ln, passwordIdx++);
      const hash = await bcrypt.hash(password, salt);

      const { data: user, error: uErr } = await supabaseAdmin.from('users')
        .insert({ email, password_hash: hash, role: 'teaching_staff', must_change_password: false }).select().single();
      if (uErr) { console.log(`   ⚠️ Skip ${email}: ${uErr.message}`); continue; }

      const staffId = `GAS/T/${2018 + i}/${String(Math.floor(Math.random()*900)+100)}`;
      await supabaseAdmin.from('staff').insert({
        user_id: user.id,
        staff_id_number: staffId,
        first_name: fn, last_name: ln,
        gender: isFemale ? 'female' : 'male',
        phone: getPhone(),
        department: pick(departments),
        designation: 'Class Teacher',
        staff_type: 'teaching',
        qualification: pick(qualifications),
        date_joined: `${2018 + Math.floor(i/3)}-0${1 + (i%9)}-15`
      });
      allLogins.push({ name: `${fn} ${mn} ${ln}`, email, password, role: 'Teaching Staff', detail: staffId });
    }

    // ── STEP 3: NON-TEACHING STAFF (20) ──
    console.log('👩‍🔧 Creating 20 Non-Teaching Staff...');
    for (let i = 0; i < 20; i++) {
      const isFemale = i % 3 !== 0;
      const fn = pick(isFemale ? femaleFirstNames : maleFirstNames);
      const mn = pick(middleNames);
      const ln = pick(lastNames);
      const email = makeEmail(fn, mn, ln, 'staff');
      const password = makePassword(fn, ln, passwordIdx++);
      const hash = await bcrypt.hash(password, salt);

      const { data: user, error: uErr } = await supabaseAdmin.from('users')
        .insert({ email, password_hash: hash, role: 'non_teaching_staff', must_change_password: false }).select().single();
      if (uErr) { console.log(`   ⚠️ Skip ${email}: ${uErr.message}`); continue; }

      const staffId = `GAS/NT/${2019 + Math.floor(i/4)}/${String(Math.floor(Math.random()*900)+100)}`;
      const dept = ntDepartments[i % ntDepartments.length];
      const desig = ntDesignations[i % ntDesignations.length];
      await supabaseAdmin.from('staff').insert({
        user_id: user.id,
        staff_id_number: staffId,
        first_name: fn, last_name: ln,
        gender: isFemale ? 'female' : 'male',
        phone: getPhone(),
        department: dept,
        designation: desig,
        staff_type: 'non_teaching',
        date_joined: `${2019 + Math.floor(i/5)}-0${1 + (i%9)}-10`
      });
      allLogins.push({ name: `${fn} ${mn} ${ln}`, email, password, role: `Non-Teaching (${dept})`, detail: staffId });
    }

    // ── STEP 4: CLASSES & STUDENTS ──
    console.log('🎒 Creating Classes & Students...');

    // Define class structures
    const classStructures = [
      // Primary
      { name: 'Primary 1', level: 'primary', count: 8 },
      { name: 'Primary 2', level: 'primary', count: 8 },
      { name: 'Primary 3', level: 'primary', count: 7 },
      { name: 'Primary 4', level: 'primary', count: 7 },
      { name: 'Primary 5', level: 'primary', count: 6 },
      { name: 'Primary 6', level: 'primary', count: 6 },
      // Secondary
      { name: 'JSS 1', level: 'secondary', count: 7 },
      { name: 'JSS 2', level: 'secondary', count: 7 },
      { name: 'JSS 3', level: 'secondary', count: 6 },
      { name: 'SSS 1', level: 'secondary', count: 7 },
      { name: 'SSS 2', level: 'secondary', count: 7 },
      { name: 'SSS 3', level: 'secondary', count: 6 },
      // University
      { name: '100 Level', level: 'university', count: 10 },
      { name: '200 Level', level: 'university', count: 10 },
    ];

    const allStudentProfiles = [];
    let studentCounter = 0;

    for (const cls of classStructures) {
      // Create class
      const { data: cohort } = await supabaseAdmin.from('classes').insert({
        name: cls.name, level: cls.level, academic_year_id: year.id
      }).select().single();

      // Determine DOB range per level
      let minAge, maxAge;
      if (cls.level === 'primary') { minAge = 6; maxAge = 12; }
      else if (cls.level === 'secondary') { minAge = 11; maxAge = 18; }
      else { minAge = 16; maxAge = 25; }

      console.log(`   📚 ${cls.name} (${cls.level}) — ${cls.count} students`);

      for (let i = 0; i < cls.count; i++) {
        studentCounter++;
        const isFemale = studentCounter % 2 === 0;
        const fn = pick(isFemale ? femaleFirstNames : maleFirstNames);
        const mn = pick(middleNames);
        const ln = pick(lastNames);
        const email = makeEmail(fn, mn, ln, 'stu');
        const password = makePassword(fn, ln, passwordIdx++);
        const hash = await bcrypt.hash(password, salt);

        const { data: user, error: uErr } = await supabaseAdmin.from('users')
          .insert({ email, password_hash: hash, role: 'student', must_change_password: false }).select().single();
        if (uErr) { console.log(`   ⚠️ Skip ${email}: ${uErr.message}`); continue; }

        const levelCode = cls.level === 'primary' ? 'PRI' : cls.level === 'secondary' ? 'SEC' : 'UNI';
        const admNum = `GA/${levelCode}/2026/${String(studentCounter).padStart(3, '0')}`;

        const { data: studentProfile } = await supabaseAdmin.from('students').insert({
          user_id: user.id,
          admission_number: admNum,
          first_name: fn, last_name: ln,
          date_of_birth: randomDOB(minAge, maxAge),
          gender: isFemale ? 'female' : 'male',
          level: cls.level,
          current_class_id: cohort ? cohort.id : null,
          admission_date: '2026-09-01'
        }).select().single();

        if (studentProfile) {
          allStudentProfiles.push(studentProfile);
          allLogins.push({ name: `${fn} ${mn} ${ln}`, email, password, role: `Student (${cls.name})`, detail: admNum });
        }
      }
    }

    // ── STEP 5: PARENTS (50) ──
    console.log('👪 Creating 50 Parents...');
    const parentProfiles = [];

    for (let i = 0; i < 50; i++) {
      const isFemale = i % 2 === 0;
      const fn = pick(isFemale ? femaleFirstNames : maleFirstNames);
      const mn = pick(middleNames);
      const ln = pick(lastNames);
      const email = makeEmail(fn, mn, ln, 'parent');
      const password = makePassword(fn, ln, passwordIdx++);
      const hash = await bcrypt.hash(password, salt);

      const { data: user, error: uErr } = await supabaseAdmin.from('users')
        .insert({ email, password_hash: hash, role: 'parent', must_change_password: false }).select().single();
      if (uErr) { console.log(`   ⚠️ Skip ${email}: ${uErr.message}`); continue; }

      const parentIdNum = `GAP/2026/${String(i + 1).padStart(3, '0')}`;

      const { data: parentProfile } = await supabaseAdmin.from('parents').insert({
        user_id: user.id,
        parent_id_number: parentIdNum,
        first_name: fn, last_name: ln,
        phone: getPhone(),
        relationship: isFemale ? 'mother' : 'father',
        address: pick(addresses)
      }).select().single();

      if (parentProfile) {
        parentProfiles.push(parentProfile);
        allLogins.push({ name: `${fn} ${mn} ${ln}`, email, password, role: 'Parent', detail: parentIdNum });
      }
    }

    // ── STEP 6: LINK PARENTS → STUDENTS ──
    console.log('🔗 Linking parents to students...');
    // Distribute students evenly across parents so every student has at least 1 parent
    const shuffledStudents = [...allStudentProfiles].sort(() => Math.random() - 0.5);
    let parentIdx = 0;
    for (const student of shuffledStudents) {
      const parent = parentProfiles[parentIdx % parentProfiles.length];
      await supabaseAdmin.from('parent_student').insert({
        parent_id: parent.id, student_id: student.id
      });
      parentIdx++;
    }
    // Give some parents extra children
    for (let i = 0; i < 30; i++) {
      const parent = parentProfiles[Math.floor(Math.random() * parentProfiles.length)];
      const student = pick(allStudentProfiles);
      await supabaseAdmin.from('parent_student').insert({
        parent_id: parent.id, student_id: student.id
      });
    }

    // ── STEP 7: GENERATE LOGINS.MD ──
    console.log('\n📝 Generating logins.md...');

    const teachingLogins = allLogins.filter(l => l.role === 'Teaching Staff');
    const ntLogins = allLogins.filter(l => l.role.startsWith('Non-Teaching'));
    const studentLogins = allLogins.filter(l => l.role.startsWith('Student'));
    const parentLogins = allLogins.filter(l => l.role === 'Parent');

    let md = `# 🔑 Grandview Academy — All User Logins\n\n`;
    md += `> Generated: ${new Date().toISOString()}\n>\n`;
    md += `> Each user has a **unique password**. Use the email as the login identifier on the appropriate portal.\n\n---\n\n`;

    md += `## 📊 Summary\n\n| Role | Count |\n|---|---|\n`;
    md += `| Admin | 1 |\n`;
    md += `| Teaching Staff | ${teachingLogins.length} |\n`;
    md += `| Non-Teaching Staff | ${ntLogins.length} |\n`;
    md += `| Students | ${studentLogins.length} |\n`;
    md += `| Parents | ${parentLogins.length} |\n`;
    md += `| **Total** | **${1 + allLogins.length}** |\n\n---\n\n`;

    md += `## 🛡️ System Admin\n\n| Name | Email | Password |\n|---|---|---|\n`;
    md += `| System Admin | admin@grandview.edu | AdminPassword123 |\n\n---\n\n`;

    md += `## 👩‍🏫 Teaching Staff (${teachingLogins.length})\n\n`;
    md += `| # | Name | Email | Password | Staff ID |\n|---|---|---|---|---|\n`;
    teachingLogins.forEach((l, i) => { md += `| ${i+1} | ${l.name} | ${l.email} | ${l.password} | ${l.detail} |\n`; });

    md += `\n---\n\n## 👩‍🔧 Non-Teaching Staff (${ntLogins.length})\n\n`;
    md += `| # | Name | Email | Password | Department | Staff ID |\n|---|---|---|---|---|---|\n`;
    ntLogins.forEach((l, i) => { md += `| ${i+1} | ${l.name} | ${l.email} | ${l.password} | ${l.role.replace('Non-Teaching (','').replace(')','')} | ${l.detail} |\n`; });

    md += `\n---\n\n## 🎒 Students (${studentLogins.length})\n\n`;
    md += `| # | Name | Email | Password | Class | Admission No |\n|---|---|---|---|---|---|\n`;
    studentLogins.forEach((l, i) => { md += `| ${i+1} | ${l.name} | ${l.email} | ${l.password} | ${l.role.replace('Student (','').replace(')','')} | ${l.detail} |\n`; });

    md += `\n---\n\n## 👪 Parents (${parentLogins.length})\n\n`;
    md += `| # | Name | Email | Password | Parent ID |\n|---|---|---|---|---|\n`;
    parentLogins.forEach((l, i) => { md += `| ${i+1} | ${l.name} | ${l.email} | ${l.password} | ${l.detail} |\n`; });

    const mdPath = path.join(__dirname, '../../../..', 'logins.md');
    fs.writeFileSync(mdPath, md);

    console.log(`\n✅ Nigerian data seeded successfully!`);
    console.log(`   📌 ${teachingLogins.length} Teaching Staff`);
    console.log(`   📌 ${ntLogins.length} Non-Teaching Staff`);
    console.log(`   📌 ${studentLogins.length} Students across ${classStructures.length} classes`);
    console.log(`   📌 ${parentLogins.length} Parents`);
    console.log(`   📄 Logins saved → ${mdPath}\n`);

  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedLarge();
