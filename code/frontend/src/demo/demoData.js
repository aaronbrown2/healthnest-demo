export const demoUsers = {
  patient: {
    id: "patient-user-maya",
    email: "maya.rivera@example.com",
    user_metadata: {
      role: "patient",
      first_name: "Maya",
      last_name: "Rivera",
    },
  },
  provider: {
    id: "provider-user-chen",
    email: "elena.chen@healthnest.demo",
    user_metadata: {
      role: "provider",
      first_name: "Elena",
      last_name: "Chen",
      specialty: "Internal Medicine",
    },
  },
};

export const demoPatients = [
  {
    id: "patient-maya",
    user_id: "patient-user-maya",
    first_name: "Maya",
    preferred_name: "Maya",
    last_name: "Rivera",
    mrn: "HN-20418",
    date_of_birth: "1989-04-18",
  },
  {
    id: "patient-jordan",
    user_id: "patient-user-jordan",
    first_name: "Jordan",
    preferred_name: "Jordan",
    last_name: "Lee",
    mrn: "HN-19877",
    date_of_birth: "1976-11-02",
  },
  {
    id: "patient-sam",
    user_id: "patient-user-sam",
    first_name: "Samira",
    preferred_name: "Samira",
    last_name: "Patel",
    mrn: "HN-22041",
    date_of_birth: "1994-02-21",
  },
];

export const demoProviders = [
  {
    id: "provider-chen",
    user_id: "provider-user-chen",
    title: "Dr.",
    first_name: "Elena",
    last_name: "Chen",
    specialty: "Internal Medicine",
  },
  {
    id: "provider-hart",
    user_id: "provider-user-hart",
    title: "Dr.",
    first_name: "Amara",
    last_name: "Hart",
    specialty: "Cardiology",
  },
  {
    id: "provider-owens",
    user_id: "provider-user-owens",
    title: "Dr.",
    first_name: "Miles",
    last_name: "Owens",
    specialty: "Endocrinology",
  },
  {
    id: "provider-kim",
    user_id: "provider-user-kim",
    title: "Dr.",
    first_name: "Nina",
    last_name: "Kim",
    specialty: "Dermatology",
  },
];

export const demoAvailability = [
  ["slot-chen-1", "provider-chen", "2026-07-28", "09:00:00"],
  ["slot-chen-2", "provider-chen", "2026-07-28", "13:30:00"],
  ["slot-chen-3", "provider-chen", "2026-08-04", "10:15:00"],
  ["slot-hart-1", "provider-hart", "2026-07-30", "11:00:00"],
  ["slot-hart-2", "provider-hart", "2026-08-06", "14:00:00"],
  ["slot-owens-1", "provider-owens", "2026-08-03", "08:45:00"],
  ["slot-kim-1", "provider-kim", "2026-08-05", "15:15:00"],
].map(([id, provider_id, available_date, available_time]) => ({
  id,
  provider_id,
  available_date,
  available_time,
  providers: demoProviders.find((p) => p.id === provider_id),
}));

export const demoAppointments = [
  {
    id: "appt-1001",
    patient_id: "patient-maya",
    provider_id: "provider-chen",
    status: "scheduled",
    notes: "Follow up on blood pressure plan and review recent lab work.",
    provider_availability: {
      id: "slot-chen-booked",
      available_date: "2026-07-28",
      available_time: "09:00:00",
    },
    providers: demoProviders[0],
  },
  {
    id: "appt-1002",
    patient_id: "patient-maya",
    provider_id: "provider-hart",
    status: "scheduled",
    notes: "Cardiology consult for intermittent palpitations.",
    provider_availability: {
      id: "slot-hart-booked",
      available_date: "2026-08-06",
      available_time: "14:00:00",
    },
    providers: demoProviders[1],
  },
  {
    id: "appt-0996",
    patient_id: "patient-maya",
    provider_id: "provider-owens",
    status: "completed",
    notes: "A1C follow up and medication review.",
    provider_availability: {
      id: "slot-owens-past",
      available_date: "2026-06-18",
      available_time: "10:30:00",
    },
    providers: demoProviders[2],
  },
];

export const demoLabResults = [
  {
    id: "lab-cmp-2026",
    patient_id: "patient-maya",
    lab_name: "Comprehensive Metabolic Panel",
    status: "released",
    collected_at: "2026-07-15T09:18:00Z",
    resulted_at: "2026-07-16T14:40:00Z",
    released_at: "2026-07-16T18:10:00Z",
    entries_count: 7,
    flagged_count: 1,
    entries: [
      ["Calcium", "17861-6", "9.4", "mg/dL", "8.6-10.2", "normal"],
      ["Creatinine", "2160-0", "0.92", "mg/dL", "0.57-1.00", "normal"],
      ["eGFR", "62238-1", "82", "mL/min/1.73m2", ">59", "normal"],
      ["Glucose", "2345-7", "126", "mg/dL", "70-99", "high"],
      ["Potassium", "2823-3", "4.2", "mmol/L", "3.5-5.2", "normal"],
      ["Sodium", "2951-2", "139", "mmol/L", "134-144", "normal"],
      ["ALT", "1742-6", "22", "IU/L", "0-32", "normal"],
    ],
  },
  {
    id: "lab-lipid-2026",
    patient_id: "patient-maya",
    lab_name: "Lipid Panel",
    status: "released",
    collected_at: "2026-07-01T13:05:00Z",
    resulted_at: "2026-07-02T15:15:00Z",
    released_at: "2026-07-02T19:30:00Z",
    entries_count: 4,
    flagged_count: 1,
    entries: [
      ["Total Cholesterol", "2093-3", "204", "mg/dL", "100-199", "high"],
      ["HDL Cholesterol", "2085-9", "58", "mg/dL", ">39", "normal"],
      ["LDL Cholesterol", "13457-7", "124", "mg/dL", "0-99", "high"],
      ["Triglycerides", "2571-8", "112", "mg/dL", "0-149", "normal"],
    ],
  },
  {
    id: "lab-cbc-2026",
    patient_id: "patient-jordan",
    lab_name: "Complete Blood Count",
    status: "uploaded",
    collected_at: "2026-07-21T08:20:00Z",
    resulted_at: "2026-07-21T16:15:00Z",
    released_at: null,
    entries_count: 5,
    flagged_count: 1,
    entries: [
      ["WBC", "6690-2", "7.8", "10^3/uL", "3.4-10.8", "normal"],
      ["Hemoglobin", "718-7", "11.1", "g/dL", "13.0-17.7", "low"],
      ["Platelets", "777-3", "255", "10^3/uL", "150-450", "normal"],
      ["MCV", "787-2", "82", "fL", "79-97", "normal"],
      ["Hematocrit", "4544-3", "35.1", "%", "37.5-51.0", "low"],
    ],
  },
].map((result) => ({
  ...result,
  entries: result.entries.map(
    ([component_name, loinc_code, value, unit, reference_range, abnormal_flag], index) => ({
      id: `${result.id}-entry-${index + 1}`,
      component_name,
      loinc_code,
      value,
      unit,
      reference_range,
      abnormal_flag,
    }),
  ),
}));

export const demoContacts = {
  patient: demoProviders.slice(0, 3).map((p) => ({
    user_id: p.user_id,
    name: `${p.title} ${p.first_name} ${p.last_name}`,
    specialty: p.specialty,
  })),
  provider: demoPatients.map((p) => ({
    user_id: p.user_id,
    name: `${p.preferred_name} ${p.last_name}`,
    specialty: p.mrn,
  })),
};

export const demoThreads = {
  "provider-user-chen": [
    ["msg-1", "provider-user-chen", "patient-user-maya", "Your glucose was a little elevated. Nothing urgent, but let us review it together next week.", "2026-07-16T19:15:00Z"],
    ["msg-2", "patient-user-maya", "provider-user-chen", "Thanks, Dr. Chen. Should I keep logging morning readings?", "2026-07-16T20:05:00Z"],
    ["msg-3", "provider-user-chen", "patient-user-maya", "Yes, three readings before the visit would be perfect.", "2026-07-16T20:20:00Z"],
  ],
  "provider-user-hart": [
    ["msg-4", "provider-user-hart", "patient-user-maya", "I reviewed the referral. Please bring your home blood pressure log.", "2026-07-18T15:30:00Z"],
  ],
  "patient-user-maya": [
    ["msg-5", "patient-user-maya", "provider-user-chen", "I uploaded my latest readings before our appointment.", "2026-07-21T12:10:00Z"],
  ],
};

export function threadFor(contactId, role = "patient") {
  const rows = demoThreads[contactId] || [];
  if (rows.length) return rows.map(toMessage);
  const myId = role === "provider" ? "provider-user-chen" : "patient-user-maya";
  return [
    toMessage([
      `msg-empty-${contactId}`,
      contactId,
      myId,
      "This demo conversation is ready for a new message.",
      "2026-07-21T14:00:00Z",
    ]),
  ];
}

function toMessage([id, sender_id, recipient_id, body, sent_at]) {
  return { id, sender_id, recipient_id, body, sent_at, read_at: null };
}

export const demoNotifications = [
  {
    id: "notif-lab",
    type: "lab_result",
    title: "New lab result released",
    body: "Comprehensive Metabolic Panel is ready to review.",
    created_at: "2026-07-16T18:15:00Z",
    read_at: null,
    data: { lab_result_id: "lab-cmp-2026" },
  },
  {
    id: "notif-appt",
    type: "appointment",
    title: "Appointment reminder",
    body: "Primary care follow-up on July 28 at 9:00 AM.",
    created_at: "2026-07-21T13:00:00Z",
    read_at: null,
    data: { appointment_id: "appt-1001" },
  },
];

export const demoVisitOverviews = [
  {
    id: "visit-7001",
    time: "9:00 AM",
    name: "Maya Rivera",
    initials: "MR",
    type: "Blood pressure follow-up",
  },
  {
    id: "visit-7002",
    time: "10:30 AM",
    name: "Jordan Lee",
    initials: "JL",
    type: "CBC follow-up",
  },
  {
    id: "visit-7003",
    time: "1:15 PM",
    name: "Samira Patel",
    initials: "SP",
    type: "Medication check",
  },
];

export const demoVisitDetails = {
  "visit-7001": {
    generatedFrom: "Generated from HealthNest demo chart, labs, appointments, and messages.",
    patient: {
      id: "patient-maya",
      name: "Maya Rivera",
      initials: "MR",
      mrn: "HN-20418",
      dateOfBirth: "Apr 18, 1989",
    },
    appointment: {
      time: "9:00 AM",
      visitType: "Blood pressure follow-up",
    },
    recentHistory: [
      "Home BP readings trending 128-138/82-88 over the last two weeks.",
      "CMP released July 16 with mildly elevated fasting glucose.",
      "Patient asked whether morning glucose logs should continue before visit.",
    ],
    activeProblems: [
      { name: "Essential hypertension", code: "I10", since: "2024", status: "Active" },
      { name: "Prediabetes", code: "R73.03", since: "2025", status: "Monitoring" },
    ],
    medications: [
      { medication: "Lisinopril", dose: "10 mg", frequency: "Daily", prescriber: "Dr. Chen" },
      { medication: "Metformin", dose: "500 mg", frequency: "Twice daily", prescriber: "Dr. Owens" },
      { medication: "Vitamin D3", dose: "2000 IU", frequency: "Daily", prescriber: "Dr. Chen" },
    ],
    labs: [
      { test: "Glucose", result: "126 mg/dL", date: "Jul 16, 2026", status: "High" },
      { test: "Creatinine", result: "0.92 mg/dL", date: "Jul 16, 2026", status: "Normal" },
      { test: "LDL", result: "124 mg/dL", date: "Jul 2, 2026", status: "High" },
    ],
    openIssues: [
      { level: "Review", tone: "warning", text: "Discuss fasting glucose and whether A1C repeat is needed." },
      { level: "Confirm", tone: "info", text: "Confirm home BP cuff technique and medication adherence." },
    ],
    missingSections: [],
  },
  "visit-7002": {
    generatedFrom: "Generated from HealthNest demo chart and pending lab queue.",
    patient: {
      id: "patient-jordan",
      name: "Jordan Lee",
      initials: "JL",
      mrn: "HN-19877",
      dateOfBirth: "Nov 2, 1976",
    },
    appointment: {
      time: "10:30 AM",
      visitType: "CBC follow-up",
    },
    recentHistory: [
      "CBC uploaded yesterday and is pending provider release.",
      "Patient reports fatigue in secure message thread.",
      "Prior hemoglobin was borderline low at last annual exam.",
    ],
    activeProblems: [
      { name: "Fatigue", code: "R53.83", since: "2026", status: "Workup" },
      { name: "Anemia, unspecified", code: "D64.9", since: "2026", status: "Suspected" },
    ],
    medications: [
      { medication: "Atorvastatin", dose: "20 mg", frequency: "Nightly", prescriber: "Dr. Chen" },
    ],
    labs: [
      { test: "Hemoglobin", result: "11.1 g/dL", date: "Jul 21, 2026", status: "Low" },
      { test: "Hematocrit", result: "35.1%", date: "Jul 21, 2026", status: "Low" },
    ],
    openIssues: [
      { level: "High", tone: "danger", text: "Consider iron studies and repeat CBC plan." },
    ],
    missingSections: ["No recent ferritin result found."],
  },
};

export const demoUnsignedEncounters = [
  {
    id: "enc-481",
    patient_name: "Jordan Lee",
    encounter_type: "Follow-up Visit",
    summary: "Reviewed low hemoglobin trend; ordered repeat CBC and iron studies.",
    created_at: "2026-07-21T17:30:00Z",
    urgent: true,
  },
];
