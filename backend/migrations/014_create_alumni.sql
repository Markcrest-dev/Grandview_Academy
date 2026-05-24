CREATE TABLE IF NOT EXISTS alumni_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  graduation_year INTEGER NOT NULL,
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  user_id INTEGER, -- Links to users table if approved
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
