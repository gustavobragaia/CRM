import { supabase } from './client';

// Sign up with email and password
export async function signUp(email: string, password: string, metadata?: Record<string, unknown>) {
  // First, check if a user with this email already exists
  try {
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email);

    if (!checkError && existingUsers && existingUsers.length > 0) {
      console.warn('A user with this email already exists in the users table');
      throw new Error('A user with this email already exists.');
    }
  } catch (error) {
    console.error('Error checking for existing user:', error);
    throw error;
  }

  // Sign up the user with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });

  if (error) {
    console.error('Error during auth.signUp:', error);
    throw error;
  }

  // If user was created successfully, add their details to the users table
  if (data.user) {
    try {
      const userInfo = {
        id: data.user.id,
        email: email,
        name: metadata?.name || email.split('@')[0],
        user_type: metadata?.user_type || 'user',
        created_at: new Date().toISOString(),
        clinic_id: metadata?.clinic_id || null
      };

      // Insert user record
      const { error: insertError } = await supabase
        .from('users')
        .insert(userInfo);

      if (insertError) {
        console.error('Error inserting user details:', insertError);
        throw new Error(`Failed to create user record: ${insertError.message}`);
      }
    } catch (error) {
      console.error('Unexpected error during user creation:', error);
      throw error;
    }
  }

  return data;
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  return true;
}

// Reset password
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    throw error;
  }

  return true;
}

// Update password
export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw error;
  }

  return true;
}

// Get current user
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user;
}

// Get session
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

// Check if user is authenticated
export async function isAuthenticated() {
  const session = await getSession();
  return !!session;
}
