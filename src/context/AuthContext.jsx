import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate session from localStorage on app load
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);

          // Verify session token with backend on reload to ensure it hasn't expired
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            const resData = await response.json();
            if (resData.success) {
              setUser(resData.data);
              localStorage.setItem('user', JSON.stringify(resData.data));
            }
          } else {
            // Re-auth failed (e.g. token expired) -> clear session
            clearSession();
          }
        } catch (err) {
          console.error('Session hydration failed:', err);
          clearSession();
        }
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  /**
   * Universal Login Handler
   * Reaches the appropriate backend mapping depending on role.
   */
  const login = async (identifier, password, role) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, role }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        return { 
          success: false, 
          message: resData.message || 'Login failed. Please check your credentials.' 
        };
      }

      // Handle 2FA redirect requirement
      if (resData.data?.requires2FA) {
        return {
          success: true,
          requires2FA: true,
          tempToken: resData.data.tempToken,
        };
      }

      const { token: sessionToken, user: userProfile } = resData.data;

      localStorage.setItem('token', sessionToken);
      localStorage.setItem('user', JSON.stringify(userProfile));

      setToken(sessionToken);
      setUser(userProfile);

      return { success: true, user: userProfile };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: 'An unexpected connection error occurred.' };
    }
  };

  /**
   * Verify TOTP Code
   * Completes the login flow for 2FA-protected admin sessions.
   */
  const verify2FA = async (tempToken, code) => {
    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        return { 
          success: false, 
          message: resData.message || 'Verification failed. Incorrect 2FA code.' 
        };
      }

      const { token: sessionToken, user: userProfile } = resData.data;

      localStorage.setItem('token', sessionToken);
      localStorage.setItem('user', JSON.stringify(userProfile));

      setToken(sessionToken);
      setUser(userProfile);

      return { success: true, user: userProfile };
    } catch (err) {
      console.error('2FA verification error:', err);
      return { success: false, message: 'Connection error during MFA verification.' };
    }
  };

  /**
   * Logout Handler
   */
  const logout = () => {
    clearSession();
  };

  /**
   * Change Active Session Password
   */
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        return { success: false, message: resData.message || 'Failed to change password.' };
      }

      // Update user state since they have updated their credentials
      const updatedUser = { ...user, mustChangePassword: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true, message: resData.message };
    } catch (err) {
      console.error('Change password error:', err);
      return { success: false, message: 'Connection error during password change.' };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    verify2FA,
    logout,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
