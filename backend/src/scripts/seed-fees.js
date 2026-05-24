import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve('/home/mark/Desktop/Grandview_Academy/backend/.env') });

import { supabaseAdmin } from '../config/database.js';

async function seedFees() {
  const { data: terms } = await supabaseAdmin.from('terms').select('id');
  if (!terms || terms.length === 0) return console.log('No terms found. Seed academic data first.');
  const termId = terms[0].id;

  const feeData = [
    { level: 'primary', fee_type: 'Tuition Fee (Primary)', amount: 150000, term_id: termId, is_mandatory: true },
    { level: 'primary', fee_type: 'ICT Levy', amount: 15000, term_id: termId, is_mandatory: true },
    { level: 'junior_secondary', fee_type: 'Tuition Fee (JSS)', amount: 200000, term_id: termId, is_mandatory: true },
    { level: 'junior_secondary', fee_type: 'Laboratory Fee', amount: 25000, term_id: termId, is_mandatory: true },
    { level: 'senior_secondary', fee_type: 'Tuition Fee (SSS)', amount: 250000, term_id: termId, is_mandatory: true },
    { level: 'senior_secondary', fee_type: 'Mock Exam Fee', amount: 30000, term_id: termId, is_mandatory: true }
  ];

  for (const fee of feeData) {
    await supabaseAdmin.from('fee_structures').insert(fee);
  }
  
  console.log('Seeded fee structures successfully.');
}

seedFees();
