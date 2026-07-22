CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES providers(id),
  available_date TEXT NOT NULL,
  available_time TEXT NOT NULL,
  is_booked INTEGER NOT NULL DEFAULT 0,
  blocked INTEGER NOT NULL DEFAULT 0,
  UNIQUE (provider_id, available_date, available_time)
);

CREATE TABLE IF NOT EXISTS availability_rules (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES providers(id),
  weekday INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  effective_from TEXT NOT NULL,
  effective_until TEXT,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  provider_id TEXT NOT NULL REFERENCES providers(id),
  availability_id TEXT NOT NULL REFERENCES provider_availability(id),
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL REFERENCES demo_users(id),
  recipient_id TEXT NOT NULL REFERENCES demo_users(id),
  body TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TEXT
);

CREATE TABLE IF NOT EXISTS lab_results (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  lab_name TEXT NOT NULL,
  status TEXT NOT NULL,
  collected_at TEXT,
  resulted_at TEXT,
  released_at TEXT
);

CREATE TABLE IF NOT EXISTS lab_result_entries (
  id TEXT PRIMARY KEY,
  lab_result_id TEXT NOT NULL REFERENCES lab_results(id) ON DELETE CASCADE,
  component_name TEXT NOT NULL,
  loinc_code TEXT,
  value TEXT,
  unit TEXT,
  reference_range TEXT,
  abnormal_flag TEXT NOT NULL DEFAULT 'normal'
);

CREATE TABLE IF NOT EXISTS unsigned_encounters (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  encounter_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  urgent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  signed INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS visit_overviews (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  appointment_time TEXT NOT NULL,
  visit_type TEXT NOT NULL,
  generated_from TEXT NOT NULL,
  recent_history TEXT NOT NULL,
  active_problems TEXT NOT NULL,
  medications TEXT NOT NULL,
  labs TEXT NOT NULL,
  open_issues TEXT NOT NULL,
  missing_sections TEXT NOT NULL
);

INSERT OR IGNORE INTO demo_users (id, email, role, first_name, last_name, specialty) VALUES
  ('patient-user-maya', 'maya.rivera@example.com', 'patient', 'Maya', 'Rivera', NULL),
  ('patient-user-jordan', 'jordan.lee@example.com', 'patient', 'Jordan', 'Lee', NULL),
  ('patient-user-samira', 'samira.patel@example.com', 'patient', 'Samira', 'Patel', NULL),
  ('provider-user-chen', 'elena.chen@healthnest.demo', 'provider', 'Elena', 'Chen', 'Internal Medicine'),
  ('provider-user-hart', 'amara.hart@healthnest.demo', 'provider', 'Amara', 'Hart', 'Cardiology'),
  ('provider-user-owens', 'miles.owens@healthnest.demo', 'provider', 'Miles', 'Owens', 'Endocrinology');

INSERT OR IGNORE INTO patients (id, user_id, first_name, preferred_name, last_name, mrn, date_of_birth) VALUES
  ('patient-maya', 'patient-user-maya', 'Maya', 'Maya', 'Rivera', 'HN-20418', '1989-04-18'),
  ('patient-jordan', 'patient-user-jordan', 'Jordan', 'Jordan', 'Lee', 'HN-19877', '1976-11-02'),
  ('patient-samira', 'patient-user-samira', 'Samira', 'Samira', 'Patel', 'HN-22041', '1994-02-21');

INSERT OR IGNORE INTO providers (id, user_id, title, first_name, last_name, specialty) VALUES
  ('provider-chen', 'provider-user-chen', 'Dr.', 'Elena', 'Chen', 'Internal Medicine'),
  ('provider-hart', 'provider-user-hart', 'Dr.', 'Amara', 'Hart', 'Cardiology'),
  ('provider-owens', 'provider-user-owens', 'Dr.', 'Miles', 'Owens', 'Endocrinology');

INSERT OR IGNORE INTO care_team (patient_id, provider_id, active) VALUES
  ('patient-maya', 'provider-chen', 1),
  ('patient-maya', 'provider-hart', 1),
  ('patient-maya', 'provider-owens', 1),
  ('patient-jordan', 'provider-chen', 1),
  ('patient-samira', 'provider-chen', 1);

INSERT OR IGNORE INTO provider_availability (id, provider_id, available_date, available_time, is_booked, blocked) VALUES
  ('slot-chen-20260728-0900', 'provider-chen', '2026-07-28', '09:00', 1, 0),
  ('slot-chen-20260728-1330', 'provider-chen', '2026-07-28', '13:30', 0, 0),
  ('slot-chen-20260729-1030', 'provider-chen', '2026-07-29', '10:30', 0, 0),
  ('slot-chen-20260804-1015', 'provider-chen', '2026-08-04', '10:15', 0, 0),
  ('slot-hart-20260806-1400', 'provider-hart', '2026-08-06', '14:00', 1, 0),
  ('slot-owens-20260618-1030', 'provider-owens', '2026-06-18', '10:30', 1, 0),
  ('slot-owens-20260803-0845', 'provider-owens', '2026-08-03', '08:45', 0, 0);

INSERT OR IGNORE INTO availability_rules (id, provider_id, weekday, start_time, end_time, effective_from, active) VALUES
  ('rule-chen-mon-morning', 'provider-chen', 0, '09:00', '12:00', '2026-07-22', 1),
  ('rule-chen-wed-afternoon', 'provider-chen', 2, '13:00', '16:00', '2026-07-22', 1);

INSERT OR IGNORE INTO appointments (id, patient_id, provider_id, availability_id, status, notes) VALUES
  ('appt-1001', 'patient-maya', 'provider-chen', 'slot-chen-20260728-0900', 'scheduled', 'Follow up on blood pressure plan and review recent lab work.'),
  ('appt-1002', 'patient-maya', 'provider-hart', 'slot-hart-20260806-1400', 'scheduled', 'Cardiology consult for intermittent palpitations.'),
  ('appt-0996', 'patient-maya', 'provider-owens', 'slot-owens-20260618-1030', 'completed', 'A1C follow up and medication review.');

INSERT OR IGNORE INTO messages (id, sender_id, recipient_id, body, sent_at, read_at) VALUES
  ('msg-1', 'provider-user-chen', 'patient-user-maya', 'Your glucose was a little elevated. Nothing urgent, but let us review it together next week.', '2026-07-16T19:15:00', NULL),
  ('msg-2', 'patient-user-maya', 'provider-user-chen', 'Thanks, Dr. Chen. Should I keep logging morning readings?', '2026-07-16T20:05:00', '2026-07-16T20:10:00'),
  ('msg-3', 'provider-user-chen', 'patient-user-maya', 'Yes, three readings before the visit would be perfect.', '2026-07-16T20:20:00', NULL),
  ('msg-4', 'provider-user-hart', 'patient-user-maya', 'Please bring your home blood pressure log to the cardiology visit.', '2026-07-18T15:30:00', NULL);

INSERT OR IGNORE INTO lab_results (id, patient_id, lab_name, status, collected_at, resulted_at, released_at) VALUES
  ('lab-cmp-2026', 'patient-maya', 'Comprehensive Metabolic Panel', 'released', '2026-07-15T09:18:00', '2026-07-16T14:40:00', '2026-07-16T18:10:00'),
  ('lab-lipid-2026', 'patient-maya', 'Lipid Panel', 'released', '2026-07-01T13:05:00', '2026-07-02T15:15:00', '2026-07-02T19:30:00'),
  ('lab-cbc-2026', 'patient-jordan', 'Complete Blood Count', 'uploaded', '2026-07-21T08:20:00', '2026-07-21T16:15:00', NULL);

INSERT OR IGNORE INTO lab_result_entries (id, lab_result_id, component_name, loinc_code, value, unit, reference_range, abnormal_flag) VALUES
  ('cmp-1', 'lab-cmp-2026', 'Calcium', '17861-6', '9.4', 'mg/dL', '8.6-10.2', 'normal'),
  ('cmp-2', 'lab-cmp-2026', 'Creatinine', '2160-0', '0.92', 'mg/dL', '0.57-1.00', 'normal'),
  ('cmp-3', 'lab-cmp-2026', 'eGFR', '62238-1', '82', 'mL/min/1.73m2', '>59', 'normal'),
  ('cmp-4', 'lab-cmp-2026', 'Glucose', '2345-7', '126', 'mg/dL', '70-99', 'high'),
  ('lipid-1', 'lab-lipid-2026', 'Total Cholesterol', '2093-3', '204', 'mg/dL', '100-199', 'high'),
  ('lipid-2', 'lab-lipid-2026', 'HDL Cholesterol', '2085-9', '58', 'mg/dL', '>39', 'normal'),
  ('lipid-3', 'lab-lipid-2026', 'LDL Cholesterol', '13457-7', '124', 'mg/dL', '0-99', 'high'),
  ('cbc-1', 'lab-cbc-2026', 'WBC', '6690-2', '7.8', '10^3/uL', '3.4-10.8', 'normal'),
  ('cbc-2', 'lab-cbc-2026', 'Hemoglobin', '718-7', '11.1', 'g/dL', '13.0-17.7', 'low'),
  ('cbc-3', 'lab-cbc-2026', 'Hematocrit', '4544-3', '35.1', '%', '37.5-51.0', 'low');

INSERT OR IGNORE INTO unsigned_encounters (id, patient_id, encounter_type, summary, urgent, created_at, signed) VALUES
  ('enc-481', 'patient-jordan', 'Follow-up Visit', 'Reviewed low hemoglobin trend; ordered repeat CBC and iron studies.', 1, '2026-07-21T17:30:00', 0);

INSERT OR IGNORE INTO visit_overviews (id, patient_id, appointment_time, visit_type, generated_from, recent_history, active_problems, medications, labs, open_issues, missing_sections) VALUES
  (
    'visit-7001',
    'patient-maya',
    '9:00 AM',
    'Blood pressure follow-up',
    'Generated from HealthNest demo chart, labs, appointments, and messages.',
    '["Home BP readings trending 128-138/82-88 over the last two weeks.","CMP released July 16 with mildly elevated fasting glucose.","Patient asked whether morning glucose logs should continue before visit."]',
    '[{"name":"Essential hypertension","code":"I10","since":"2024","status":"Active"},{"name":"Prediabetes","code":"R73.03","since":"2025","status":"Monitoring"}]',
    '[{"medication":"Lisinopril","dose":"10 mg","frequency":"Daily","prescriber":"Dr. Chen"},{"medication":"Metformin","dose":"500 mg","frequency":"Twice daily","prescriber":"Dr. Owens"}]',
    '[{"test":"Glucose","result":"126 mg/dL","date":"Jul 16, 2026","status":"High"},{"test":"Creatinine","result":"0.92 mg/dL","date":"Jul 16, 2026","status":"Normal"}]',
    '[{"level":"Review","tone":"warning","text":"Discuss fasting glucose and whether A1C repeat is needed."},{"level":"Confirm","tone":"info","text":"Confirm home BP cuff technique and medication adherence."}]',
    '[]'
  ),
  (
    'visit-7002',
    'patient-jordan',
    '10:30 AM',
    'CBC follow-up',
    'Generated from HealthNest demo chart and pending lab queue.',
    '["CBC uploaded yesterday and is pending provider release.","Patient reports fatigue in secure message thread.","Prior hemoglobin was borderline low at last annual exam."]',
    '[{"name":"Fatigue","code":"R53.83","since":"2026","status":"Workup"},{"name":"Anemia, unspecified","code":"D64.9","since":"2026","status":"Suspected"}]',
    '[{"medication":"Atorvastatin","dose":"20 mg","frequency":"Nightly","prescriber":"Dr. Chen"}]',
    '[{"test":"Hemoglobin","result":"11.1 g/dL","date":"Jul 21, 2026","status":"Low"},{"test":"Hematocrit","result":"35.1%","date":"Jul 21, 2026","status":"Low"}]',
    '[{"level":"High","tone":"danger","text":"Consider iron studies and repeat CBC plan."}]',
    '["No recent ferritin result found."]'
  );
