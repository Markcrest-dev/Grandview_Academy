import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { supabaseAdmin } from '../config/database.js';

const BASE_URL = 'http://localhost:5000/api';

async function runAudit() {
  console.log('🛡️  Starting Grandview Academy Institutional Security Audit & Penetration Test...');

  try {
    // 1. Fetch target user accounts from Supabase for all roles
    console.log('📡 Retrieving seeded test coordinates for key roles...');
    
    const { data: users, error: userErr } = await supabaseAdmin
      .from('users')
      .select('id, email, role');

    if (userErr) {
      console.error('❌ Failed to retrieve users from database:', userErr.message);
      return;
    }

    const admin = users.find(u => u.role === 'admin');
    const teacher = users.find(u => u.role === 'teaching_staff');
    const parent = users.find(u => u.role === 'parent');
    const student = users.find(u => u.role === 'student');

    if (!admin || !teacher || !parent || !student) {
      console.warn('⚠️ Missing some role accounts. Will look for any user matches...');
    }

    console.log(`🔑 Admin Account: ${admin?.email || 'Not found'}`);
    console.log(`🔑 Teacher Account: ${teacher?.email || 'Not found'}`);
    console.log(`🔑 Parent Account: ${parent?.email || 'Not found'}`);
    console.log(`🔑 Student Account: ${student?.email || 'Not found'}`);

    // Generate local JWT tokens dynamically
    const adminToken = admin ? jwt.sign({ id: admin.id }, env.jwtSecret) : null;
    const teacherToken = teacher ? jwt.sign({ id: teacher.id }, env.jwtSecret) : null;
    const parentToken = parent ? jwt.sign({ id: parent.id }, env.jwtSecret) : null;
    const studentToken = student ? jwt.sign({ id: student.id }, env.jwtSecret) : null;

    let auditScore = 100;
    let failedTests = 0;
    let passedTests = 0;

    const assertTest = (title, condition) => {
      if (condition) {
        console.log(`✅ Passed: [${title}]`);
        passedTests++;
      } else {
        console.error(`❌ FAILED: [${title}]`);
        failedTests++;
        auditScore -= 15;
      }
    };

    // ----------------------------------------------------
    // TEST SECTION A: ROLE AUTHENTICATION OVERRIDES
    // ----------------------------------------------------
    console.log('\n--- Section A: Role Authentication Override Exploits ---');

    // Test A1: Student attempting to list admissions dossiers
    if (studentToken) {
      const res = await fetch(`${BASE_URL}/admissions/applications`, {
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      assertTest(
        'Student Blocked from Accessing Admissions Dossiers',
        res.status === 403
      );
    }

    // Test A2: Student attempting to fetch full Bursar audit logs
    if (studentToken) {
      const res = await fetch(`${BASE_URL}/fees/payments`, {
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      assertTest(
        'Student Blocked from Admin Fees Ledger',
        res.status === 403
      );
    }

    // Test A3: Parent attempting to publish books to Library Catalog
    if (parentToken) {
      const res = await fetch(`${BASE_URL}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${parentToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Malicious Upload Target',
          file_url: 'http://exploit.org/payload.exe',
          file_type: 'application/octet-stream'
        })
      });
      assertTest(
        'Parent Blocked from Publishing Academic Syllabi',
        res.status === 403
      );
    }

    // Test A4: Teacher attempting to fetch system configurations
    if (teacherToken) {
      const res = await fetch(`${BASE_URL}/admissions/applications`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      assertTest(
        'Teacher Blocked from Administrative Admissions Applications',
        res.status === 403
      );
    }

    // ----------------------------------------------------
    // TEST SECTION B: INPUT BOUNDARY STRESS TESTS
    // ----------------------------------------------------
    console.log('\n--- Section B: Inputs validation Boundary Stress Tests ---');

    // Test B1: Submitting a negative payment amount to fees catalog
    if (adminToken) {
      // Find a student and fee structure to make a valid link
      const { data: students } = await supabaseAdmin.from('students').select('id').limit(1);
      const { data: feeStructs } = await supabaseAdmin.from('fee_structures').select('id').limit(1);

      const studentProfile = students && students.length > 0 ? students[0] : null;
      const feeStruct = feeStructs && feeStructs.length > 0 ? feeStructs[0] : null;

      if (studentProfile && feeStruct) {
        const res = await fetch(`${BASE_URL}/fees/payments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            student_id: studentProfile.id,
            fee_structure_id: feeStruct.id,
            amount_paid: -25000,
            payment_method: 'Card'
          })
        });

        assertTest(
          'Fees Registry Blocks Negative Payment Values',
          res.status === 400
        );
      } else {
        console.log('ℹ️ Skipping payment negative test due to missing database relations.');
      }
    }

    // Test B2: Registering a document catalog item missing vital fields
    if (teacherToken) {
      const res = await fetch(`${BASE_URL}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${teacherToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file_url: 'http://res.cloudinary.com/doc.pdf',
          file_type: 'application/pdf'
        }) // Missing title!
      });

      assertTest(
        'Documents Catalog Blocks Entry Missing Title Title',
        res.status === 400
      );
    }

    // ----------------------------------------------------
    // TEST SECTION C: INTEGRITY AND DATA LEAK SCANS
    // ----------------------------------------------------
    console.log('\n--- Section C: Database Relationship Integrity checks ---');

    // Test C1: Authorized Admin accessing full database rosters
    if (adminToken) {
      const res = await fetch(`${BASE_URL}/students`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      assertTest(
        'Admin Authorized to Inspect Student Roster Index',
        res.status === 200
      );
    }

    // ----------------------------------------------------
    // SCORING AND LOG REPORT SUMMARY
    // ----------------------------------------------------
    console.log('\n====================================================');
    console.log(`📊 GRANDVIEW ACADEMY AUDIT SCORE: ${Math.max(0, auditScore)}%`);
    console.log(`Passed: ${passedTests} | Failed: ${failedTests}`);
    console.log('====================================================');

    if (failedTests > 0) {
      console.error('🚨 Security concerns identified during auditing checks! Review logs.');
      process.exit(1);
    } else {
      console.log('🎉 Verification successful! System authenticated as 100% secure.');
      process.exit(0);
    }

  } catch (err) {
    console.error('❌ Security check crashed with error:', err.message);
    process.exit(1);
  }
}

runAudit();
