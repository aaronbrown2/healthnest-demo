CREATE TABLE IF NOT EXISTS demo_sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS demo_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('patient', 'provider')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  specialty TEXT
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES demo_users(id),
  first_name TEXT NOT NULL,
  preferred_name TEXT,
  last_name TEXT NOT NULL,
  mrn TEXT NOT NULL UNIQUE,
  date_of_birth TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES demo_users(id),
  title TEXT NOT NULL DEFAULT 'Dr.',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  specialty TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS care_team (
  patient_id TEXT NOT NULL REFERENCES patients(id),
  provider_id TEXT NOT NULL REFERENCES providers(id),
  active INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (patient_id, provider_id)
);

CREATE TABLE IF NOT EXISTS provider_availability (
  session_id TEXT NOT NULL,
  id TEXT NOT NULL,
  provider_id TEXT NOT NULL REFERENCES providers(id),
  available_date TEXT NOT NULL,
  available_time TEXT NOT NULL,
  is_booked INTEGER NOT NULL DEFAULT 0,
  blocked INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (session_id, id),
  UNIQUE (session_id, provider_id, available_date, available_time)
);

CREATE TABLE IF NOT EXISTS availability_rules (
  session_id TEXT NOT NULL,
  id TEXT NOT NULL,
  provider_id TEXT NOT NULL REFERENCES providers(id),
  weekday INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  effective_from TEXT NOT NULL,
  effective_until TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (session_id, id)
);

CREATE TABLE IF NOT EXISTS appointments (
  session_id TEXT NOT NULL,
  id TEXT NOT NULL,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  provider_id TEXT NOT NULL REFERENCES providers(id),
  availability_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (session_id, id)
);

CREATE TABLE IF NOT EXISTS messages (
  session_id TEXT NOT NULL,
  id TEXT NOT NULL,
  sender_id TEXT NOT NULL REFERENCES demo_users(id),
  recipient_id TEXT NOT NULL REFERENCES demo_users(id),
  body TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TEXT,
  PRIMARY KEY (session_id, id)
);

CREATE TABLE IF NOT EXISTS lab_results (
  session_id TEXT NOT NULL,
  id TEXT NOT NULL,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  lab_name TEXT NOT NULL,
  status TEXT NOT NULL,
  collected_at TEXT,
  resulted_at TEXT,
  released_at TEXT,
  PRIMARY KEY (session_id, id)
);

CREATE TABLE IF NOT EXISTS lab_result_entries (
  session_id TEXT NOT NULL,
  id TEXT NOT NULL,
  lab_result_id TEXT NOT NULL,
  component_name TEXT NOT NULL,
  loinc_code TEXT,
  value TEXT,
  unit TEXT,
  reference_range TEXT,
  abnormal_flag TEXT NOT NULL DEFAULT 'normal',
  PRIMARY KEY (session_id, id)
);

CREATE TABLE IF NOT EXISTS unsigned_encounters (
  session_id TEXT NOT NULL,
  id TEXT NOT NULL,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  encounter_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  urgent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  signed INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (session_id, id)
);

CREATE TABLE IF NOT EXISTS visit_overviews (
  session_id TEXT NOT NULL,
  id TEXT NOT NULL,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  appointment_time TEXT NOT NULL,
  visit_type TEXT NOT NULL,
  generated_from TEXT NOT NULL,
  recent_history TEXT NOT NULL,
  active_problems TEXT NOT NULL,
  medications TEXT NOT NULL,
  labs TEXT NOT NULL,
  open_issues TEXT NOT NULL,
  missing_sections TEXT NOT NULL,
  PRIMARY KEY (session_id, id)
);
