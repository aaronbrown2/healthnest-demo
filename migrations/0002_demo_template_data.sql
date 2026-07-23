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

INSERT OR IGNORE INTO provider_availability (session_id, id, provider_id, available_date, available_time, is_booked, blocked) VALUES
  ('template', 'slot-chen-20260728-0900', 'provider-chen', '2026-07-28', '09:00', 1, 0),
  ('template', 'slot-chen-20260728-1330', 'provider-chen', '2026-07-28', '13:30', 0, 0),
  ('template', 'slot-chen-20260729-1030', 'provider-chen', '2026-07-29', '10:30', 0, 0),
  ('template', 'slot-chen-20260804-1015', 'provider-chen', '2026-08-04', '10:15', 0, 0),
  ('template', 'slot-hart-20260806-1400', 'provider-hart', '2026-08-06', '14:00', 1, 0),
  ('template', 'slot-owens-20260618-1030', 'provider-owens', '2026-06-18', '10:30', 1, 0),
  ('template', 'slot-owens-20260803-0845', 'provider-owens', '2026-08-03', '08:45', 0, 0);

INSERT OR IGNORE INTO availability_rules (session_id, id, provider_id, weekday, start_time, end_time, effective_from, active) VALUES
  ('template', 'rule-chen-mon-morning', 'provider-chen', 0, '09:00', '12:00', '2026-07-22', 1),
  ('template', 'rule-chen-wed-afternoon', 'provider-chen', 2, '13:00', '16:00', '2026-07-22', 1);

INSERT OR IGNORE INTO appointments (session_id, id, patient_id, provider_id, availability_id, status, notes) VALUES
  ('template', 'appt-1001', 'patient-maya', 'provider-chen', 'slot-chen-20260728-0900', 'scheduled', 'Follow up on blood pressure plan and review recent lab work.'),
  ('template', 'appt-1002', 'patient-maya', 'provider-hart', 'slot-hart-20260806-1400', 'scheduled', 'Cardiology consult for intermittent palpitations.'),
  ('template', 'appt-0996', 'patient-maya', 'provider-owens', 'slot-owens-20260618-1030', 'completed', 'A1C follow up and medication review.');

INSERT OR IGNORE INTO messages (session_id, id, sender_id, recipient_id, body, sent_at, read_at) VALUES
  ('template', 'msg-1', 'provider-user-chen', 'patient-user-maya', 'Your glucose was a little elevated. Nothing urgent, but let us review it together next week.', '2026-07-16T19:15:00', NULL),
  ('template', 'msg-2', 'patient-user-maya', 'provider-user-chen', 'Thanks, Dr. Chen. Should I keep logging morning readings?', '2026-07-16T20:05:00', '2026-07-16T20:10:00'),
  ('template', 'msg-3', 'provider-user-chen', 'patient-user-maya', 'Yes, three readings before the visit would be perfect.', '2026-07-16T20:20:00', NULL),
  ('template', 'msg-4', 'provider-user-hart', 'patient-user-maya', 'Please bring your home blood pressure log to the cardiology visit.', '2026-07-18T15:30:00', NULL);

INSERT OR IGNORE INTO lab_results (session_id, id, patient_id, lab_name, status, collected_at, resulted_at, released_at) VALUES
  ('template', 'lab-cmp-2026', 'patient-maya', 'Comprehensive Metabolic Panel', 'released', '2026-07-15T09:18:00', '2026-07-16T14:40:00', '2026-07-16T18:10:00'),
  ('template', 'lab-lipid-2026', 'patient-maya', 'Lipid Panel', 'released', '2026-07-01T13:05:00', '2026-07-02T15:15:00', '2026-07-02T19:30:00'),
  ('template', 'lab-cbc-2026', 'patient-jordan', 'Complete Blood Count', 'uploaded', '2026-07-21T08:20:00', '2026-07-21T16:15:00', NULL);

INSERT OR IGNORE INTO lab_result_entries (session_id, id, lab_result_id, component_name, loinc_code, value, unit, reference_range, abnormal_flag) VALUES
  ('template', 'cmp-1', 'lab-cmp-2026', 'Calcium', '17861-6', '9.4', 'mg/dL', '8.6-10.2', 'normal'),
  ('template', 'cmp-2', 'lab-cmp-2026', 'Creatinine', '2160-0', '0.92', 'mg/dL', '0.57-1.00', 'normal'),
  ('template', 'cmp-3', 'lab-cmp-2026', 'eGFR', '62238-1', '82', 'mL/min/1.73m2', '>59', 'normal'),
  ('template', 'cmp-4', 'lab-cmp-2026', 'Glucose', '2345-7', '126', 'mg/dL', '70-99', 'high'),
  ('template', 'lipid-1', 'lab-lipid-2026', 'Total Cholesterol', '2093-3', '204', 'mg/dL', '100-199', 'high'),
  ('template', 'lipid-2', 'lab-lipid-2026', 'HDL Cholesterol', '2085-9', '58', 'mg/dL', '>39', 'normal'),
  ('template', 'lipid-3', 'lab-lipid-2026', 'LDL Cholesterol', '13457-7', '124', 'mg/dL', '0-99', 'high'),
  ('template', 'cbc-1', 'lab-cbc-2026', 'WBC', '6690-2', '7.8', '10^3/uL', '3.4-10.8', 'normal'),
  ('template', 'cbc-2', 'lab-cbc-2026', 'Hemoglobin', '718-7', '11.1', 'g/dL', '13.0-17.7', 'low'),
  ('template', 'cbc-3', 'lab-cbc-2026', 'Hematocrit', '4544-3', '35.1', '%', '37.5-51.0', 'low');

INSERT OR IGNORE INTO unsigned_encounters (session_id, id, patient_id, encounter_type, summary, urgent, created_at, signed) VALUES
  ('template', 'enc-481', 'patient-jordan', 'Follow-up Visit', 'Reviewed low hemoglobin trend; ordered repeat CBC and iron studies.', 1, '2026-07-21T17:30:00', 0);

INSERT OR IGNORE INTO visit_overviews (session_id, id, patient_id, appointment_time, visit_type, generated_from, recent_history, active_problems, medications, labs, open_issues, missing_sections) VALUES
  ('template', 'visit-7001', 'patient-maya', '9:00 AM', 'Blood pressure follow-up', 'Generated from HealthNest demo chart, labs, appointments, and messages.', '["Home BP readings trending 128-138/82-88 over the last two weeks.","CMP released July 16 with mildly elevated fasting glucose.","Patient asked whether morning glucose logs should continue before visit."]', '[{"name":"Essential hypertension","code":"I10","since":"2024","status":"Active"},{"name":"Prediabetes","code":"R73.03","since":"2025","status":"Monitoring"}]', '[{"medication":"Lisinopril","dose":"10 mg","frequency":"Daily","prescriber":"Dr. Chen"},{"medication":"Metformin","dose":"500 mg","frequency":"Twice daily","prescriber":"Dr. Owens"}]', '[{"test":"Glucose","result":"126 mg/dL","date":"Jul 16, 2026","status":"High"},{"test":"Creatinine","result":"0.92 mg/dL","date":"Jul 16, 2026","status":"Normal"}]', '[{"level":"Review","tone":"warning","text":"Discuss fasting glucose and whether A1C repeat is needed."},{"level":"Confirm","tone":"info","text":"Confirm home BP cuff technique and medication adherence."}]', '[]'),
  ('template', 'visit-7002', 'patient-jordan', '10:30 AM', 'CBC follow-up', 'Generated from HealthNest demo chart and pending lab queue.', '["CBC uploaded yesterday and is pending provider release.","Patient reports fatigue in secure message thread.","Prior hemoglobin was borderline low at last annual exam."]', '[{"name":"Fatigue","code":"R53.83","since":"2026","status":"Workup"},{"name":"Anemia, unspecified","code":"D64.9","since":"2026","status":"Suspected"}]', '[{"medication":"Atorvastatin","dose":"20 mg","frequency":"Nightly","prescriber":"Dr. Chen"}]', '[{"test":"Hemoglobin","result":"11.1 g/dL","date":"Jul 21, 2026","status":"Low"},{"test":"Hematocrit","result":"35.1%","date":"Jul 21, 2026","status":"Low"}]', '[{"level":"High","tone":"danger","text":"Consider iron studies and repeat CBC plan."}]', '["No recent ferritin result found."]');
