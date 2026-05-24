import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination, validateRequired } from '../utils/validators.js';
import { requireAuth } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';

const router = Router();
const DB_PATH = path.resolve(process.cwd(), 'src/data/ptm_schedules.json');

// Helper to read DB
function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { meetings: [] };
    }
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return { meetings: [] };
  }
}

// Helper to write DB
function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing PTM DB:', err);
    return false;
  }
}

/**
 * GET /api/messages/conversations
 * List the current user's conversations with last message preview.
 */
router.get('/conversations', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit, offset } = parsePagination(req.query);

    // Get conversations where user is participant_1 or participant_2
    const { data: convos, error, count } = await supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact' })
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .range(offset, offset + limit - 1)
      .order('last_message_at', { ascending: false });

    if (error) return sendError(res, { message: error.message, statusCode: 500 });

    // Enrich with partner info and last message
    const enriched = await Promise.all((convos || []).map(async (c) => {
      const partnerId = c.participant_1 === userId ? c.participant_2 : c.participant_1;

      const { data: partner } = await supabaseAdmin
        .from('users')
        .select('id, email, role')
        .eq('id', partnerId)
        .maybeSingle();

      // Try to get a display name from student/staff/parent profiles
      let partnerName = partner?.email || 'Unknown';
      if (partner) {
        const { data: stu } = await supabaseAdmin.from('students').select('first_name,last_name').eq('user_id', partnerId).maybeSingle();
        if (stu) { partnerName = `${stu.first_name} ${stu.last_name}`; }
        else {
          const { data: stf } = await supabaseAdmin.from('staff').select('first_name,last_name').eq('user_id', partnerId).maybeSingle();
          if (stf) { partnerName = `${stf.first_name} ${stf.last_name}`; }
          else {
            const { data: par } = await supabaseAdmin.from('parents').select('first_name,last_name').eq('user_id', partnerId).maybeSingle();
            if (par) partnerName = `${par.first_name} ${par.last_name}`;
          }
        }
      }

      // Last message
      const { data: lastMsg } = await supabaseAdmin
        .from('messages')
        .select('body, sender_id, created_at')
        .eq('conversation_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Unread count
      const { count: unread } = await supabaseAdmin
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', c.id)
        .eq('is_read', false)
        .neq('sender_id', userId);

      return {
        ...c,
        partner: { id: partnerId, name: partnerName, email: partner?.email, role: partner?.role },
        lastMessage: lastMsg || null,
        unreadCount: unread || 0,
      };
    }));

    sendSuccess(res, { data: enriched, message: 'Conversations fetched.', pagination: { page, limit, total: count || 0 } });
  } catch (err) { next(err); }
});

/**
 * GET /api/messages/conversations/:id
 * Get messages in a conversation (paginated, newest first).
 */
router.get('/conversations/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { page, limit, offset } = parsePagination(req.query);

    // Verify user is a participant
    const { data: convo } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', id)
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .maybeSingle();

    if (!convo) return sendError(res, { message: 'Conversation not found.', statusCode: 404 });

    const { data: msgs, error, count } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', id)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) return sendError(res, { message: error.message, statusCode: 500 });

    // Mark unread messages from partner as read
    await supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', id)
      .neq('sender_id', userId)
      .eq('is_read', false);

    sendSuccess(res, { data: msgs, message: 'Messages fetched.', pagination: { page, limit, total: count || 0 } });
  } catch (err) { next(err); }
});

/**
 * POST /api/messages/conversations
 * Start or find an existing conversation with a recipient.
 */
router.post('/conversations', requireAuth, async (req, res, next) => {
  try {
    const errs = validateRequired(req.body, ['recipient_id']);
    if (errs) return sendError(res, { message: 'recipient_id is required.', statusCode: 400 });

    const userId = req.user.id;
    const { recipient_id } = req.body;

    if (userId === recipient_id) return sendError(res, { message: 'Cannot message yourself.', statusCode: 400 });

    // Normalize ordering for unique constraint
    const p1 = userId < recipient_id ? userId : recipient_id;
    const p2 = userId < recipient_id ? recipient_id : userId;

    // Check existing
    const { data: existing } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('participant_1', p1)
      .eq('participant_2', p2)
      .maybeSingle();

    if (existing) {
      return sendSuccess(res, { data: existing, message: 'Conversation found.' });
    }

    const { data: created, error } = await supabaseAdmin
      .from('conversations')
      .insert({ participant_1: p1, participant_2: p2 })
      .select()
      .single();

    if (error) return sendError(res, { message: error.message, statusCode: 500 });
    sendSuccess(res, { data: created, message: 'Conversation created.', statusCode: 201 });
  } catch (err) { next(err); }
});

/**
 * POST /api/messages/send
 * Send a message in a conversation.
 */
router.post('/send', requireAuth, async (req, res, next) => {
  try {
    const errs = validateRequired(req.body, ['conversation_id', 'body']);
    if (errs) return sendError(res, { message: 'conversation_id and body required.', statusCode: 400 });

    const userId = req.user.id;
    const { conversation_id, body } = req.body;

    // Verify user is a participant
    const { data: convo } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversation_id)
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .maybeSingle();

    if (!convo) return sendError(res, { message: 'Conversation not found.', statusCode: 404 });

    const { data: msg, error } = await supabaseAdmin
      .from('messages')
      .insert({ conversation_id, sender_id: userId, body })
      .select()
      .single();

    if (error) return sendError(res, { message: error.message, statusCode: 500 });

    // Update conversation last_message_at
    await supabaseAdmin.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversation_id);

    // Notify the recipient
    const recipientId = convo.participant_1 === userId ? convo.participant_2 : convo.participant_1;
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: recipientId, title: 'New Message', body: body.substring(0, 100),
        type: 'message', reference_id: conversation_id,
      });
    } catch (e) {}

    sendSuccess(res, { data: msg, message: 'Message sent.', statusCode: 201 });
  } catch (err) { next(err); }
});

/**
 * GET /api/messages/unread-count
 * Total unread messages for the current user across all conversations.
 */
router.get('/unread-count', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Get all conversation IDs for the user
    const { data: convos } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`);

    if (!convos || convos.length === 0) {
      return sendSuccess(res, { data: { count: 0 }, message: 'No unread messages.' });
    }

    const { count } = await supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', convos.map(c => c.id))
      .eq('is_read', false)
      .neq('sender_id', userId);

    sendSuccess(res, { data: { count: count || 0 }, message: 'Unread count retrieved.' });
  } catch (err) { next(err); }
});

/**
 * GET /api/messages/contacts
 * Search for users that the current user can message.
 */
router.get('/contacts', requireAuth, async (req, res, next) => {
  try {
    const { search } = req.query;
    const userId = req.user.id;

    // Get all users except self
    let query = supabaseAdmin.from('users').select('id, email, role').neq('id', userId).eq('is_active', true);
    if (search) query = query.ilike('email', `%${search}%`);
    const { data: users, error } = await query.limit(20);
    if (error) return sendError(res, { message: error.message, statusCode: 500 });

    // Enrich with names
    const enriched = await Promise.all((users || []).map(async (u) => {
      let name = u.email;
      if (u.role === 'student') {
        const { data: s } = await supabaseAdmin.from('students').select('first_name,last_name').eq('user_id', u.id).maybeSingle();
        if (s) name = `${s.first_name} ${s.last_name}`;
      } else if (u.role === 'teaching_staff' || u.role === 'non_teaching_staff') {
        const { data: s } = await supabaseAdmin.from('staff').select('first_name,last_name').eq('user_id', u.id).maybeSingle();
        if (s) name = `${s.first_name} ${s.last_name}`;
      } else if (u.role === 'parent') {
        const { data: p } = await supabaseAdmin.from('parents').select('first_name,last_name').eq('user_id', u.id).maybeSingle();
        if (p) name = `${p.first_name} ${p.last_name}`;
      }
      return { id: u.id, email: u.email, role: u.role, name };
    }));

    sendSuccess(res, { data: enriched, message: 'Contacts fetched.' });
  } catch (err) { next(err); }
});

/**
 * POST /api/messages/broadcast
 * Broadcast a message to a specific cohort (mocked email + internal notification).
 */
router.post('/broadcast', requireAuth, async (req, res, next) => {
  try {
    const errs = validateRequired(req.body, ['subject', 'body', 'target_audience']);
    if (errs) return sendError(res, { message: 'Missing fields', errors: errs, statusCode: 400 });

    const { subject, body, target_audience } = req.body;
    const userId = req.user.id;
    
    // Determine audience roles based on target_audience string
    let roles = [];
    if (target_audience === 'all_parents') roles = ['parent'];
    else if (target_audience === 'all_students') roles = ['student'];
    else if (target_audience === 'all_staff') roles = ['teaching_staff', 'non_teaching_staff'];
    else if (target_audience === 'everyone') roles = ['student', 'parent', 'teaching_staff', 'non_teaching_staff'];
    else return sendError(res, { message: 'Invalid target_audience', statusCode: 400 });

    // Fetch all users in those roles
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .in('role', roles)
      .eq('is_active', true);

    if (error) return sendError(res, { message: error.message, statusCode: 500 });
    
    // Simulate sending email (Mock)
    console.log(`[BROADCAST EMAIL MOCK] Sending email to ${users.length} users in roles: ${roles.join(',')}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body.substring(0, 50)}...`);

    // Insert internal notifications in bulk
    if (users && users.length > 0) {
      const notifications = users.map(u => ({
        user_id: u.id,
        title: subject,
        body: body,
        type: 'system',
        reference_id: null
      }));
      await supabaseAdmin.from('notifications').insert(notifications);
    }

    // Log the broadcast in the announcements table as well for visibility
    await supabaseAdmin.from('announcements').insert({
      title: subject,
      content: body,
      author_id: userId,
      type: 'general',
      target_audience: 'all' // Generalize for dashboard viewing
    });

    sendSuccess(res, { 
      data: { recipients_count: users ? users.length : 0 }, 
      message: 'Broadcast dispatched successfully.' 
    });
  } catch (err) { next(err); }
});

/**
 * GET /api/messages/ptm
 * List PTM schedules for the logged in user
 */
router.get('/ptm', requireAuth, (req, res) => {
  try {
    const db = readDb();
    const userId = req.user.id;
    const isTeacher = req.user.role === 'teaching_staff';
    
    const relevantMeetings = db.meetings.filter(m => 
      isTeacher ? m.teacher_user_id === userId : m.parent_user_id === userId
    );
    
    sendSuccess(res, { data: relevantMeetings, message: 'PTM schedules fetched' });
  } catch (err) {
    sendError(res, { message: err.message, statusCode: 500 });
  }
});

/**
 * POST /api/messages/ptm
 * Schedule a parent-teacher meeting
 */
router.post('/ptm', requireAuth, (req, res) => {
  try {
    const { teacher_user_id, student_id, date, time } = req.body;
    if (!teacher_user_id || !date || !time) {
      return sendError(res, { message: 'teacher_user_id, date, and time are required', statusCode: 400 });
    }

    const db = readDb();
    const newMeeting = {
      id: Date.now().toString(),
      parent_user_id: req.user.id,
      teacher_user_id,
      student_id,
      date,
      time,
      status: 'scheduled',
      created_at: new Date().toISOString()
    };
    
    db.meetings.push(newMeeting);
    writeDb(db);

    sendSuccess(res, { data: newMeeting, message: 'Meeting scheduled successfully.' });
  } catch (err) {
    sendError(res, { message: err.message, statusCode: 500 });
  }
});

export default router;
