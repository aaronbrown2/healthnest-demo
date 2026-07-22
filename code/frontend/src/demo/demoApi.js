import { DEMO_MODE } from "./demoMode";
import {
  demoAppointments,
  demoAvailability,
  demoContacts,
  demoLabResults,
  demoNotifications,
  demoPatients,
  demoProviders,
  demoUnsignedEncounters,
  demoUsers,
  demoVisitDetails,
  demoVisitOverviews,
  threadFor,
} from "./demoData";

let appointments = [...demoAppointments];
let unsignedEncounters = [...demoUnsignedEncounters];
let conversations = [
  {
    id: "pulse-demo-1",
    title: "Recent labs and next steps",
    created_at: "2026-07-16T18:45:00Z",
    updated_at: "2026-07-16T18:45:00Z",
  },
];
let providerConversations = [
  {
    id: "dfa-demo-1",
    title: "Pre-visit priorities",
    created_at: "2026-07-21T13:30:00Z",
    updated_at: "2026-07-21T13:30:00Z",
  },
];

export function installDemoApi() {
  if (!DEMO_MODE || window.__healthnestDemoApiInstalled) return;
  window.__healthnestDemoApiInstalled = true;

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const handled = handleDemoRequest(input, init);
    if (handled) return handled;
    return realFetch(input, init);
  };
}

function handleDemoRequest(input, init) {
  const url = normalizeUrl(input);
  const path = normalizePath(url.pathname);
  const method = (init.method || "GET").toUpperCase();
  const role = currentRole();

  if (path === "/config") {
    return json({ supabase_url: "https://demo.supabase.co", supabase_anon_key: "demo" });
  }

  if (path.startsWith("/auth/")) {
    return json({
      session: {
        access_token: `demo-${role}-token`,
        refresh_token: `demo-${role}-refresh`,
        user: demoUsers[role],
      },
      user: demoUsers[role],
    });
  }

  if (path === "/appointments/" || path === "/appointments") {
    if (method === "POST") {
      const body = readBody(init);
      const slot = demoAvailability.find((s) => s.id === body.availability_id) || demoAvailability[0];
      const created = {
        id: `appt-demo-${appointments.length + 1}`,
        patient_id: "patient-maya",
        provider_id: slot.provider_id,
        status: "scheduled",
        notes: body.notes || "Booked from the public demo.",
        provider_availability: {
          id: slot.id,
          available_date: slot.available_date,
          available_time: slot.available_time,
        },
        providers: slot.providers,
      };
      appointments = [created, ...appointments];
      return json(created, 201);
    }
    return json(appointments);
  }

  if (path === "/appointments/availability") return json(demoAvailability);
  if (path.includes("/appointments/") && path.endsWith("/cancel")) return empty();
  if (path.includes("/appointments/") && path.endsWith("/reschedule")) return json({ ok: true });
  if (path.includes("/appointments/") && path.endsWith("/edit_notes")) return json({ ok: true });

  if (path === "/providers/" || path === "/providers") return json(demoProviders);
  if (path === "/providers/care-team") return json(demoProviders.slice(0, 3));
  if (path === "/providers/visit-overviews") return json(demoVisitOverviews);
  if (path.startsWith("/providers/visit-overview/")) {
    return json(demoVisitDetails[path.split("/").at(-1)] || demoVisitDetails["visit-7001"]);
  }
  if (path.startsWith("/providers/patient-overview/")) {
    const patient = demoPatients.find((p) => p.id === path.split("/").at(-1)) || demoPatients[0];
    return json(makePatientOverview(patient));
  }
  if (path === "/providers/unsigned-encounters") return json(unsignedEncounters);
  if (path.includes("/providers/unsigned-encounters/") && path.endsWith("/sign")) {
    const id = path.split("/").at(-2);
    unsignedEncounters = unsignedEncounters.filter((e) => e.id !== id);
    return empty();
  }
  if (path === "/providers/encounter-notes") {
    const body = readBody(init);
    if (!body.signed) {
      unsignedEncounters = [
        {
          id: `enc-demo-${unsignedEncounters.length + 1}`,
          patient_name: "Maya Rivera",
          encounter_type: body.encounterType || "Visit Note",
          summary: body.summary,
          created_at: new Date().toISOString(),
          urgent: false,
        },
        ...unsignedEncounters,
      ];
    }
    return json({ id: "note-demo", ...body });
  }

  if (path === "/patients") {
    const q = url.searchParams.get("q")?.toLowerCase();
    const rows = q
      ? demoPatients.filter((p) => `${p.first_name} ${p.last_name} ${p.mrn}`.toLowerCase().includes(q))
      : demoPatients;
    return json(rows);
  }
  if (path.startsWith("/patients/")) {
    return json(demoPatients.find((p) => p.id === path.split("/").at(-1)) || demoPatients[0]);
  }

  if (path === "/lab-results") {
    const patientId = url.searchParams.get("patient_id");
    const rows = patientId ? demoLabResults.filter((r) => r.patient_id === patientId) : demoLabResults;
    return json(rows);
  }
  if (path.startsWith("/lab-results/") && path.endsWith("/file")) {
    return json({ url: "data:text/plain,HealthNest demo lab result file" });
  }
  if (path.startsWith("/lab-results/")) {
    const id = path.split("/")[2];
    if (method === "PATCH" || path.endsWith("/release") || path.endsWith("/archive")) return json({ ok: true });
    return json(demoLabResults.find((r) => r.id === id) || demoLabResults[0]);
  }

  if (path === "/messages/contacts") return json(demoContacts[role]);
  if (path === "/messages/unread") return json(role === "patient" ? { "provider-user-hart": 1 } : { "patient-user-maya": 1 });
  if (path === "/messages/inbox") return json([]);
  if (path.startsWith("/messages/thread/")) {
    const contactId = path.split("/")[3];
    if (path.endsWith("/read")) return empty();
    return json(threadFor(contactId, role));
  }
  if (path === "/messages/" || path === "/messages") {
    const body = readBody(init);
    const sender = role === "provider" ? "provider-user-chen" : "patient-user-maya";
    return json({
      id: `msg-demo-${Date.now()}`,
      sender_id: sender,
      recipient_id: body.recipient_id,
      body: body.body,
      sent_at: new Date().toISOString(),
      read_at: null,
    }, 201);
  }

  if (path === "/notifications/") return json(demoNotifications);

  if (path.startsWith("/schedule/")) return handleSchedule(path, method, init);

  if (path === "/ai/conversations") return method === "POST" ? createConversation(false) : json(conversations);
  if (path === "/ai/provider/conversations") {
    return method === "POST" ? createConversation(true) : json(providerConversations);
  }
  if (path.match(/^\/ai\/conversations\/[^/]+$/)) return json(patientConversation(path.split("/").at(-1)));
  if (path.match(/^\/ai\/provider\/conversations\/[^/]+$/)) return json(providerConversation(path.split("/").at(-1)));
  if (path.includes("/conversations/") && path.endsWith("/messages")) {
    return stream(role === "provider" ? providerAssistantReply() : patientAssistantReply());
  }

  return null;
}

function handleSchedule(path, method, init) {
  if (path === "/schedule/availability") return json(demoAvailability);
  if (path === "/schedule/rules") return json([]);
  if (path === "/schedule/patients") return json(demoPatients);
  if (path === "/schedule/appointments") {
    if (method === "POST") return json({ id: `sched-demo-${Date.now()}`, ...readBody(init) }, 201);
    return json(
      appointments.map((a) => ({
        id: a.id,
        status: a.status,
        notes: a.notes,
        patient_id: a.patient_id,
        patient_user_id: demoPatients.find((p) => p.id === a.patient_id)?.user_id,
        patient_name: demoPatients.find((p) => p.id === a.patient_id)?.preferred_name || "Patient",
        available_date: a.provider_availability.available_date,
        available_time: a.provider_availability.available_time,
        provider_availability: a.provider_availability,
      })),
    );
  }
  return empty();
}

function createConversation(provider) {
  const row = {
    id: `${provider ? "dfa" : "pulse"}-demo-${Date.now()}`,
    title: provider ? "Provider demo chat" : "Patient demo chat",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (provider) providerConversations = [row, ...providerConversations];
  else conversations = [row, ...conversations];
  return json(row, 201);
}

function patientConversation(id) {
  return {
    id,
    title: "Recent labs and next steps",
    messages: [
      {
        id: "pulse-msg-1",
        role: "assistant",
        content:
          "Your latest metabolic panel shows one mildly elevated glucose value. In the demo workflow, I would suggest bringing your morning readings to Dr. Chen and asking whether an A1C repeat is useful.",
        skill_outputs: [],
        citations: [{ label: "Comprehensive Metabolic Panel", source: "lab-cmp-2026" }],
        created_at: "2026-07-16T18:45:00Z",
      },
    ],
  };
}

function providerConversation(id) {
  return {
    id,
    title: "Pre-visit priorities",
    messages: [
      {
        id: "dfa-msg-1",
        role: "assistant",
        content:
          "Maya Rivera's visit priority is BP follow-up plus review of elevated glucose. Jordan Lee needs attention for low hemoglobin before release of the CBC.",
        skill_outputs: [],
        citations: [{ label: "AI Pre-Visit Summaries", source: "visit-overviews" }],
        created_at: "2026-07-21T13:30:00Z",
      },
    ],
  };
}

function patientAssistantReply() {
  return "I found your upcoming primary care visit, released lab results, and care-team messages. For the demo, the key next step is to review the elevated glucose value with Dr. Chen and keep three morning readings before July 28.";
}

function providerAssistantReply() {
  return "For today's demo panel, prioritize Jordan Lee's low hemoglobin result, then Maya Rivera's BP and glucose follow-up. I would open Jordan's chart first and prepare an iron-studies plan.";
}

function makePatientOverview(patient) {
  return {
    patient: {
      id: patient.id,
      name: `${patient.preferred_name} ${patient.last_name}`,
      initials: `${patient.first_name[0]}${patient.last_name[0]}`,
      mrn: patient.mrn,
      dateOfBirth: "Apr 18, 1989",
    },
    appointment: { time: "9:00 AM", visitType: "Full Chart" },
    recentHistory: ["Demo chart opened from provider search.", "Care team, labs, and messages are unified in this view."],
    activeProblems: [{ name: "Essential hypertension", code: "I10", since: "2024", status: "Active" }],
    medications: [{ medication: "Lisinopril", dose: "10 mg", frequency: "Daily", prescriber: "Dr. Chen" }],
    labs: [{ test: "Glucose", result: "126 mg/dL", date: "Jul 16, 2026", status: "High" }],
    openIssues: [{ level: "Review", tone: "info", text: "Confirm current symptoms and medication adherence." }],
    missingSections: [],
    generatedFrom: "Generated from HealthNest demo patient overview.",
  };
}

function normalizeUrl(input) {
  const raw = typeof input === "string" ? input : input.url;
  return new URL(raw, window.location.origin);
}

function normalizePath(pathname) {
  return pathname.replace(/^\/undefined/, "").replace(/\/+$/, "") || "/";
}

function currentRole() {
  return localStorage.getItem("healthnest.demoRole") === "provider" ? "provider" : "patient";
}

function readBody(init) {
  try {
    return init.body && typeof init.body === "string" ? JSON.parse(init.body) : {};
  } catch {
    return {};
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function empty() {
  return new Response(null, { status: 204 });
}

function stream(text) {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      const chunks = text.match(/.{1,24}(\s|$)/g) || [text];
      chunks.forEach((chunk, index) => {
        setTimeout(() => {
          controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: chunk })}\n\n`));
          if (index === chunks.length - 1) {
            controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
            controller.close();
          }
        }, index * 20);
      });
    },
  });
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}
