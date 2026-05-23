import { supabaseAdmin } from '../config/database.js';

async function seed() {
  console.log('🌱 Seeding Grandview Academy learning materials...');

  try {
    // 1. Fetch a class and subject to link to
    const { data: classes, error: classErr } = await supabaseAdmin
      .from('classes')
      .select('id, name')
      .limit(1);

    if (classErr) {
      console.error('Failed to fetch classes:', classErr.message);
      return;
    }

    const classId = classes && classes.length > 0 ? classes[0].id : null;
    const className = classes && classes.length > 0 ? classes[0].name : 'General Cohort';
    console.log(`🔗 Found target class: ${className} (${classId})`);

    const { data: subjects, error: subjErr } = await supabaseAdmin
      .from('subjects')
      .select('id, name')
      .limit(1);

    const subjectId = subjects && subjects.length > 0 ? subjects[0].id : null;
    const subjectName = subjects && subjects.length > 0 ? subjects[0].name : 'General Study';
    console.log(`🔗 Found target subject: ${subjectName} (${subjectId})`);

    // 2. Clear old materials to avoid duplicate pollution
    const { error: deleteErr } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('related_to', 'class');

    if (deleteErr) {
      console.warn('Note: clearing old documents had warning:', deleteErr.message);
    }

    // 3. Define professional academic resources
    const mockDocs = [
      {
        title: 'Grandview Academy Student Handbook & Code of Conduct',
        file_url: 'https://res.cloudinary.com/demo/image/upload/v1570979139/sample.pdf',
        file_type: 'application/pdf',
        related_to: 'class',
        related_id: classId,
      },
      {
        title: `Advanced Mathematics Course Syllabus — ${className}`,
        file_url: 'https://res.cloudinary.com/demo/image/upload/v1570979139/sample.pdf',
        file_type: 'application/pdf',
        related_to: 'class',
        related_id: classId,
      },
      {
        title: `Introductory Chemistry Lecture Notes — Unit 1`,
        file_url: 'https://res.cloudinary.com/demo/image/upload/v1570979139/sample.pdf',
        file_type: 'application/pdf',
        related_to: 'class',
        related_id: classId,
      },
      {
        title: 'High School English Literature Reading Worksheet',
        file_url: 'https://res.cloudinary.com/demo/image/upload/v1570979139/sample.pdf',
        file_type: 'application/pdf',
        related_to: 'class',
        related_id: classId,
      }
    ];

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('documents')
      .insert(mockDocs)
      .select();

    if (insertErr) {
      console.error('❌ Failed to insert learning materials:', insertErr.message);
    } else {
      console.log(`✅ Successfully seeded ${inserted.length} institutional learning materials!`);
    }

  } catch (err) {
    console.error('❌ Unexpected error seeding materials:', err);
  }
}

seed();
