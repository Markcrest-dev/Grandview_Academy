import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import crypto from 'crypto';

export const applyAlumni = async (req, res) => {
  try {
    const { firstName, lastName, graduationYear, email } = req.body;

    if (!firstName || !lastName || !graduationYear || !email) {
      return sendError(res, { statusCode: 400, message: 'All fields are required' });
    }

    // Check if email already applied
    const { data: existingApp } = await supabaseAdmin
      .from('alumni_applications')
      .select('id, status')
      .eq('email', email)
      .single();

    if (existingApp) {
      return sendError(res, { statusCode: 400, message: `You have already applied. Application status: ${existingApp.status}` });
    }

    // Insert new application
    const { data, error } = await supabaseAdmin
      .from('alumni_applications')
      .insert({
        first_name: firstName,
        last_name: lastName,
        graduation_year: graduationYear,
        email: email,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return sendSuccess(res, { statusCode: 201, message: 'Application submitted successfully. It is now pending admin review.', data: data });
  } catch (error) {
    console.error('Alumni application error:', error);
    return sendError(res, { statusCode: 500, message: 'Failed to submit application' });
  }
};

export const getApplications = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = supabaseAdmin.from('alumni_applications').select('*').order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return sendSuccess(res, { statusCode: 200, message: 'Alumni applications retrieved successfully', data: data });
  } catch (error) {
    console.error('Fetch alumni applications error:', error);
    return sendError(res, { statusCode: 500, message: 'Failed to fetch applications' });
  }
};

export const approveApplication = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get application
    const { data: app, error: fetchError } = await supabaseAdmin
      .from('alumni_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !app) {
      return sendError(res, { statusCode: 404, message: 'Application not found' });
    }

    if (app.status !== 'pending') {
      return sendError(res, { statusCode: 400, message: `Application is already ${app.status}` });
    }

    // 2. Create user account
    // Generate a secure random password for the alumni
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.default.genSalt(10);
    const passwordHash = await bcrypt.default.hash(tempPassword, salt);

    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email: app.email,
        password_hash: passwordHash,
        role: 'alumni', // Make sure alumni role exists in users role constraint if using enums, else it's a string
        must_change_password: true
      })
      .select()
      .single();

    if (userError) {
      // If error is unique violation, user might already exist
      if (userError.code === '23505') {
        return sendError(res, { statusCode: 400, message: 'User with this email already exists in the system' });
      }
      throw userError;
    }

    // 3. Update application status
    const { data: updatedApp, error: updateError } = await supabaseAdmin
      .from('alumni_applications')
      .update({ 
        status: 'approved',
        user_id: newUser.id
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Here we would ideally send an email to the alumni with `tempPassword`.
    // For now, we will just return it in the response for demo purposes.

    return sendSuccess(res, { statusCode: 200, message: 'Application approved successfully', data: {
      application: updatedApp,
      credentials: {
        email: app.email,
        temporaryPassword: tempPassword
      }
    }});

  } catch (error) {
    console.error('Approve alumni application error:', error);
    return sendError(res, { statusCode: 500, message: 'Failed to approve application' });
  }
};

export const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('alumni_applications')
      .update({ status: 'rejected' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return sendError(res, { statusCode: 404, message: 'Application not found' });

    return sendSuccess(res, { statusCode: 200, message: 'Application rejected successfully', data: data });
  } catch (error) {
    console.error('Reject alumni application error:', error);
    return sendError(res, { statusCode: 500, message: 'Failed to reject application' });
  }
};
