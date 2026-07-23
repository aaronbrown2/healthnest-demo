const TEMPLATE_SESSION_ID = "template";
const PATIENT_USER_ID = "patient-user-maya";
const PROVIDER_USER_ID = "provider-user-chen";
const PATIENT_ID = "patient-maya";
const PROVIDER_ID = "provider-chen";

const mutableTables = [
  "provider_availability",
  "availability_rules",
  "appointments",
  "messages",
  "lab_results",
  "lab_result_entries",
  "unsigned_encounters",
  "visit_overviews",
];

export async function onRequest(context) {
  try {
    const request = context.request;
    const path = normalizePath(context.params.path);
    const url = new URL(request.url);
    const db = context.env.DB;
    const sessionId = demoSessionId(request);

    await ensureSession(db, sessionId);
    await cleanupOldSessions(db);

    if (request.method === "OPTIONS") return empty();
    if (request.method === "GET" && path === "/config") return json({ supabase_url: "https://demo.invalid", supabase_anon_key: "demo" });
    if (request.method === "POST" && ["/auth/signin", "/auth/signup"].includes(path)) return demoAuth(request);
    if (request.method === "POST" && path === "/auth/refresh") return refreshAuth(request);
    if (request.method === "GET" && path === "/auth/me") return json(authResponse(currentRole(request)).user);
    if (request.method === "POST" && path === "/auth/signout") return empty();
    if (request.method === "GET" && path === "/providers") return json(await listProviders(db));
    if (request.method === "GET" && path === "/providers/care-team") return json(await careTeam(db));
    if (request.method === "GET" && path === "/appointments/availability") return json(await patientAvailability(db, sessionId));
    if (request.method === "GET" && path === "/appointments") return json(await appointmentQuery(db, sessionId, "a.patient_id = ?", [PATIENT_ID]));
    if (request.method === "POST" && path === "/appointments") return createPatientAppointment(db, sessionId, request);
    if (request.method === "GET" && path === "/schedule/availability") return json(await scheduleAvailability(db, sessionId));
    if (request.method === "POST" && path === "/schedule/availability") return addAvailability(db, sessionId, request);
    if (request.method === "POST" && path === "/schedule/slot") return setSlot(db, sessionId, request);
    if (request.method === "GET" && path === "/schedule/rules") return json(await scheduleRules(db, sessionId));
    if (request.method === "POST" && path === "/schedule/rules") return addRule(db, sessionId, request);
    if (request.method === "GET" && path === "/schedule/patients") return json(await schedulePatients(db));
    if (request.method === "GET" && path === "/schedule/appointments") return json(await appointmentQuery(db, sessionId, "a.provider_id = ?", [PROVIDER_ID]));
    if (request.method === "POST" && path === "/schedule/appointments") return providerCreateAppointment(db, sessionId, request);
    if (request.method === "GET" && path === "/patients") return json(await searchPatients(db, url.searchParams));
    if (request.method === "GET" && path === "/messages/contacts") return json(await contacts(db, sessionId, currentRole(request)));
    if (request.method === "GET" && path === "/messages/unread") return json(await unread(db, sessionId, currentRole(request)));
    if (request.method === "GET" && path === "/messages/inbox") return json([]);
    if (request.method === "POST" && path === "/messages") return sendMessage(db, sessionId, request);
    if (request.method === "GET" && path === "/lab-results") return json(await listLabs(db, sessionId, url.searchParams));
    if (request.method === "GET" && path === "/providers/visit-overviews") return json(await visitOverviews(db, sessionId));
    if (request.method === "GET" && path === "/providers/unsigned-encounters") return json(await unsignedEncounters(db, sessionId));
    if (request.method === "POST" && path === "/providers/encounter-notes") return encounterNote(db, sessionId, request);
    if (request.method === "GET" && path === "/notifications") return json(notifications());
    if (request.method === "GET" && ["/ai/conversations", "/ai/provider/conversations"].includes(path)) return json(aiConversations());
    if (request.method === "POST" && ["/ai/conversations", "/ai/provider/conversations"].includes(path)) return json(aiConversations()[0], 201);

    const parts = path.split("/").filter(Boolean);
    if (request.method === "POST" && route(parts, "appointments", ":id", "cancel")) return cancelAppointment(db, sessionId, parts[1]);
    if (request.method === "POST" && route(parts, "appointments", ":id", "reschedule")) return rescheduleAppointment(db, sessionId, parts[1], request);
    if (request.method === "DELETE" && route(parts, "schedule", "rules", ":id")) return deleteRule(db, sessionId, parts[2]);
    if (request.method === "POST" && route(parts, "schedule", "appointments", ":id", "cancel")) return cancelAppointment(db, sessionId, parts[2]);
    if (request.method === "GET" && route(parts, "patients", ":id")) return json(await patientById(db, parts[1]));
    if (request.method === "GET" && route(parts, "messages", "thread", ":id")) return json(await messageThread(db, sessionId, parts[2], currentRole(request)));
    if (request.method === "PATCH" && route(parts, "messages", "thread", ":id", "read")) return markThreadRead(db, sessionId, parts[2], currentRole(request));
    if (request.method === "GET" && route(parts, "lab-results", ":id")) return json(await labById(db, sessionId, parts[1]));
    if (request.method === "GET" && route(parts, "lab-results", ":id", "file")) return json({ url: null, message: "Files are disabled in this public demo." });
    if (request.method === "POST" && route(parts, "lab-results", ":id", "release")) return updateLabStatus(db, sessionId, parts[1], "released");
    if (request.method === "POST" && route(parts, "lab-results", ":id", "archive")) return updateLabStatus(db, sessionId, parts[1], "archived");
    if (request.method === "PATCH" && route(parts, "lab-results", ":id")) return patchLab(db, sessionId, parts[1], request);
    if (request.method === "GET" && route(parts, "providers", "visit-overview", ":id")) return json(await visitOverviewDetail(db, sessionId, parts[2]));
    if (request.method === "GET" && route(parts, "providers", "patient-overview", ":id")) return json(await patientOverview(db, sessionId, parts[2]));
    if (request.method === "PATCH" && route(parts, "providers", "unsigned-encounters", ":id", "sign")) return signEncounter(db, sessionId, parts[2]);
    if (request.method === "GET" && (route(parts, "ai", "conversations", ":id") || route(parts, "ai", "provider", "conversations", ":id"))) return json(aiConversation(parts.at(-1)));
    if (request.method === "POST" && (route(parts, "ai", "conversations", ":id", "messages") || route(parts, "ai", "provider", "conversations", ":id", "messages"))) return aiMessage();

    return json({ detail: "Not found" }, 404);
  } catch (error) {
    return json({ detail: error.message || "Demo API error" }, error.status || 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

function empty(status = 204) {
  return new Response(null, { status, headers: { "Cache-Control": "no-store" } });
}

function normalizePath(value) {
  const segments = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split("/")
      : [];
  const path = `/${segments.filter(Boolean).join("/")}`;
  return path !== "/" && path.endsWith("/") ? path.slice(0, -1) : path;
}

function route(parts, ...shape) {
  return parts.length === shape.length && shape.every((part, index) => part.startsWith(":") || part === parts[index]);
}

function demoSessionId(request) {
  const value = request.headers.get("X-Demo-Session-Id");
  return /^[a-zA-Z0-9_-]{16,80}$/.test(value || "") ? value : "anonymous-demo-session";
}

async function ensureSession(db, sessionId) {
  await db.prepare("INSERT OR IGNORE INTO demo_sessions (id, created_at, last_seen_at) VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)").bind(sessionId).run();
  await db.prepare("UPDATE demo_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?").bind(sessionId).run();
  const count = await db.prepare("SELECT COUNT(*) AS count FROM appointments WHERE session_id = ?").bind(sessionId).first();
  if (count.count) return;
  for (const table of mutableTables) await cloneTemplateTable(db, table, sessionId);
}

async function cloneTemplateTable(db, table, sessionId) {
  const info = await db.prepare(`PRAGMA table_info(${table})`).all();
  const columns = info.results.map((column) => column.name);
  const selected = columns.map((column) => column === "session_id" ? "? AS session_id" : column).join(", ");
  await db.prepare(`INSERT OR IGNORE INTO ${table} (${columns.join(", ")}) SELECT ${selected} FROM ${table} WHERE session_id = ?`).bind(sessionId, TEMPLATE_SESSION_ID).run();
}

async function cleanupOldSessions(db) {
  const rows = await db.prepare("SELECT id FROM demo_sessions WHERE id != ? AND last_seen_at < datetime('now', '-7 days') LIMIT 10").bind(TEMPLATE_SESSION_ID).all();
  for (const row of rows.results || []) {
    for (const table of mutableTables) await db.prepare(`DELETE FROM ${table} WHERE session_id = ?`).bind(row.id).run();
    await db.prepare("DELETE FROM demo_sessions WHERE id = ?").bind(row.id).run();
  }
}

function currentRole(request) {
  return (request.headers.get("Authorization") || "").toLowerCase().includes("provider") ? "provider" : "patient";
}

function currentUserId(role) {
  return role === "provider" ? PROVIDER_USER_ID : PATIENT_USER_ID;
}

async function body(request) {
  return request.json().catch(() => ({}));
}

async function demoAuth(request) {
  const data = await body(request);
  return json(authResponse(data.role || data.metadata?.role || "patient"));
}

async function refreshAuth(request) {
  const data = await body(request);
  return json(authResponse(String(data.refresh_token || "").includes("provider") ? "provider" : "patient"));
}

function authResponse(role) {
  const provider = role === "provider";
  const user = {
    id: provider ? PROVIDER_USER_ID : PATIENT_USER_ID,
    email: provider ? "elena.chen@healthnest.demo" : "maya.rivera@example.com",
    user_metadata: provider
      ? { role: "provider", first_name: "Elena", last_name: "Chen", specialty: "Internal Medicine" }
      : { role: "patient", first_name: "Maya", last_name: "Rivera" },
  };
  return { session: { access_token: `demo-${role}-token`, refresh_token: `demo-${role}-refresh`, user }, user };
}

function providerSummary(row) {
  return { id: row.id, user_id: row.user_id, title: row.title, first_name: row.first_name, last_name: row.last_name, specialty: row.specialty };
}

function patientSummary(row) {
  return { id: row.id, user_id: row.user_id, first_name: row.first_name, preferred_name: row.preferred_name, last_name: row.last_name, mrn: row.mrn, date_of_birth: row.date_of_birth };
}

async function listProviders(db) {
  const rows = await db.prepare("SELECT * FROM providers ORDER BY last_name").all();
  return rows.results.map(providerSummary);
}

async function careTeam(db) {
  const rows = await db.prepare("SELECT pr.* FROM care_team ct JOIN providers pr ON pr.id = ct.provider_id WHERE ct.patient_id = ? AND ct.active = 1 ORDER BY pr.last_name").bind(PATIENT_ID).all();
  return rows.results.map(providerSummary);
}

function availabilityOut(row) {
  const value = { id: row.id, provider_id: row.provider_id, available_date: row.available_date, available_time: row.available_time, is_booked: Boolean(row.is_booked), blocked: Boolean(row.blocked) };
  if (row.provider_user_id) value.providers = { id: row.provider_id, user_id: row.provider_user_id, title: row.title, first_name: row.first_name, last_name: row.last_name, specialty: row.specialty };
  return value;
}

async function patientAvailability(db, sessionId) {
  const rows = await db.prepare("SELECT av.*, pr.user_id AS provider_user_id, pr.title, pr.first_name, pr.last_name, pr.specialty FROM provider_availability av JOIN providers pr ON pr.id = av.provider_id WHERE av.session_id = ? AND av.is_booked = 0 AND av.blocked = 0 ORDER BY av.available_date, av.available_time").bind(sessionId).all();
  return rows.results.map(availabilityOut);
}

function appointmentOut(row) {
  return {
    id: row.id,
    patient_id: row.patient_id,
    provider_id: row.provider_id,
    availability_id: row.availability_id,
    status: row.status,
    notes: row.notes,
    providers: { id: row.provider_id, user_id: row.provider_user_id, title: row.title, first_name: row.provider_first_name, last_name: row.provider_last_name, specialty: row.specialty },
    provider_availability: { id: row.availability_id, available_date: row.available_date, available_time: row.available_time },
  };
}

async function appointmentQuery(db, sessionId, where, params = []) {
  const rows = await db.prepare(`SELECT a.*, av.available_date, av.available_time, pr.user_id AS provider_user_id, pr.title, pr.first_name AS provider_first_name, pr.last_name AS provider_last_name, pr.specialty FROM appointments a JOIN provider_availability av ON av.session_id = a.session_id AND av.id = a.availability_id JOIN providers pr ON pr.id = a.provider_id WHERE a.session_id = ? AND ${where} ORDER BY av.available_date, av.available_time`).bind(sessionId, ...params).all();
  return rows.results.map(appointmentOut);
}

async function createPatientAppointment(db, sessionId, request) {
  const data = await body(request);
  const slot = await db.prepare("SELECT * FROM provider_availability WHERE session_id = ? AND id = ?").bind(sessionId, data.availability_id).first();
  if (!slot || slot.is_booked || slot.blocked) return json({ detail: "Slot is unavailable." }, 400);
  const id = `appt-${crypto.randomUUID().slice(0, 8)}`;
  await db.batch([
    db.prepare("INSERT INTO appointments (session_id, id, patient_id, provider_id, availability_id, status, notes) VALUES (?, ?, ?, ?, ?, 'scheduled', ?)").bind(sessionId, id, PATIENT_ID, slot.provider_id, slot.id, data.notes || ""),
    db.prepare("UPDATE provider_availability SET is_booked = 1 WHERE session_id = ? AND id = ?").bind(sessionId, slot.id),
  ]);
  return json((await appointmentQuery(db, sessionId, "a.id = ?", [id]))[0], 201);
}

async function cancelAppointment(db, sessionId, id) {
  const appointment = await db.prepare("SELECT availability_id FROM appointments WHERE session_id = ? AND id = ?").bind(sessionId, id).first();
  if (appointment) await db.batch([
    db.prepare("UPDATE appointments SET status = 'cancelled' WHERE session_id = ? AND id = ?").bind(sessionId, id),
    db.prepare("UPDATE provider_availability SET is_booked = 0 WHERE session_id = ? AND id = ?").bind(sessionId, appointment.availability_id),
  ]);
  return empty();
}

async function rescheduleAppointment(db, sessionId, id, request) {
  const data = await body(request);
  await cancelAppointment(db, sessionId, id);
  return createPatientAppointment(db, sessionId, new Request("https://demo.local", { method: "POST", body: JSON.stringify(data) }));
}

async function scheduleAvailability(db, sessionId) {
  const rows = await db.prepare("SELECT * FROM provider_availability WHERE session_id = ? AND provider_id = ? ORDER BY available_date, available_time").bind(sessionId, PROVIDER_ID).all();
  return rows.results.map(availabilityOut);
}

async function addAvailability(db, sessionId, request) {
  const data = await body(request);
  const dates = expandDates(data.start_date || data.available_date || data.date, data.end_date, data.weekdays || []);
  const times = data.start_time && data.end_time ? expandTimes(data.start_time, data.end_time) : [data.available_time || data.start_time];
  const created = [];
  for (const date of dates) {
    for (const time of times) {
      const id = `slot-${crypto.randomUUID().slice(0, 8)}`;
      await db.prepare("INSERT OR IGNORE INTO provider_availability (session_id, id, provider_id, available_date, available_time, is_booked, blocked) VALUES (?, ?, ?, ?, ?, 0, 0)").bind(sessionId, id, PROVIDER_ID, date, time).run();
      created.push({ id, provider_id: PROVIDER_ID, available_date: date, available_time: time, is_booked: false, blocked: false });
    }
  }
  return json(created.length === 1 ? created[0] : created, 201);
}

async function setSlot(db, sessionId, request) {
  const data = await body(request);
  const availableDate = data.available_date || data.date;
  const availableTime = data.available_time || data.time;
  const blocked = data.blocked ?? data.state === "blocked";
  const id = data.id || `slot-${PROVIDER_ID}-${availableDate}-${String(availableTime || "").replace(":", "")}`;
  await db.prepare("INSERT OR REPLACE INTO provider_availability (session_id, id, provider_id, available_date, available_time, is_booked, blocked) VALUES (?, ?, ?, ?, ?, 0, ?)").bind(sessionId, id, PROVIDER_ID, availableDate, availableTime, blocked ? 1 : 0).run();
  return json({ id, provider_id: PROVIDER_ID, available_date: availableDate, available_time: availableTime, is_booked: false, blocked: Boolean(blocked) });
}

async function scheduleRules(db, sessionId) {
  const rows = await db.prepare("SELECT * FROM availability_rules WHERE session_id = ? AND provider_id = ? AND active = 1 ORDER BY weekday, start_time").bind(sessionId, PROVIDER_ID).all();
  return rows.results;
}

async function addRule(db, sessionId, request) {
  const data = await body(request);
  const weekdays = data.weekdays?.length ? data.weekdays : [data.weekday];
  const effectiveFrom = data.effective_from || new Date().toISOString().slice(0, 10);
  const effectiveUntil = data.effective_until || addDays(effectiveFrom, 45);
  const rules = [];
  for (const weekday of weekdays) {
    const id = `rule-${crypto.randomUUID().slice(0, 8)}`;
    await db.prepare("INSERT INTO availability_rules (session_id, id, provider_id, weekday, start_time, end_time, effective_from, effective_until, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)").bind(sessionId, id, PROVIDER_ID, weekday, data.start_time, data.end_time, effectiveFrom, data.effective_until || null).run();
    await addAvailability(db, sessionId, new Request("https://demo.local", { method: "POST", body: JSON.stringify({ start_date: effectiveFrom, end_date: effectiveUntil, weekdays: [weekday], start_time: data.start_time, end_time: data.end_time }) }));
    rules.push({ id, provider_id: PROVIDER_ID, weekday, start_time: data.start_time, end_time: data.end_time, effective_from: effectiveFrom, effective_until: data.effective_until || null, active: 1 });
  }
  return json(rules.length === 1 ? rules[0] : rules, 201);
}

async function deleteRule(db, sessionId, id) {
  await db.prepare("UPDATE availability_rules SET active = 0 WHERE session_id = ? AND id = ?").bind(sessionId, id).run();
  return empty();
}

async function schedulePatients(db) {
  const rows = await db.prepare("SELECT DISTINCT p.* FROM care_team ct JOIN patients p ON p.id = ct.patient_id WHERE ct.provider_id = ? AND ct.active = 1 ORDER BY p.last_name").bind(PROVIDER_ID).all();
  return rows.results.map(patientSummary);
}

async function providerCreateAppointment(db, sessionId, request) {
  const data = await body(request);
  const slotId = `slot-${crypto.randomUUID().slice(0, 8)}`;
  const apptId = `appt-${crypto.randomUUID().slice(0, 8)}`;
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO provider_availability (session_id, id, provider_id, available_date, available_time, is_booked, blocked) VALUES (?, ?, ?, ?, ?, 1, 0)").bind(sessionId, slotId, PROVIDER_ID, data.available_date, data.available_time),
    db.prepare("INSERT INTO appointments (session_id, id, patient_id, provider_id, availability_id, status, notes) VALUES (?, ?, ?, ?, ?, 'scheduled', ?)").bind(sessionId, apptId, data.patient_id || PATIENT_ID, PROVIDER_ID, slotId, data.notes || ""),
  ]);
  return json((await appointmentQuery(db, sessionId, "a.id = ?", [apptId]))[0], 201);
}

async function searchPatients(db, params) {
  const q = `%${(params.get("q") || "").toLowerCase()}%`;
  const rows = await db.prepare("SELECT * FROM patients WHERE lower(first_name || ' ' || last_name || ' ' || mrn) LIKE ? ORDER BY last_name LIMIT ?").bind(q, Number(params.get("limit") || 20)).all();
  return rows.results.map(patientSummary);
}

async function patientById(db, id) {
  const row = await db.prepare("SELECT * FROM patients WHERE id = ?").bind(id).first();
  if (!row) throw Object.assign(new Error("Patient not found."), { status: 404 });
  return patientSummary(row);
}

async function contacts(db, sessionId, role) {
  const me = currentUserId(role);
  const rows = await db.prepare("SELECT du.*, MAX(m.sent_at) AS last_message_at, SUM(CASE WHEN m.recipient_id = ? AND m.read_at IS NULL THEN 1 ELSE 0 END) AS unread_count FROM messages m JOIN demo_users du ON du.id = CASE WHEN m.sender_id = ? THEN m.recipient_id ELSE m.sender_id END WHERE m.session_id = ? AND (m.sender_id = ? OR m.recipient_id = ?) GROUP BY du.id ORDER BY last_message_at DESC").bind(me, me, sessionId, me, me).all();
  return rows.results.map((row) => ({ id: row.id, user_id: row.id, name: `${row.first_name} ${row.last_name}`, role: row.role, specialty: row.specialty, unread_count: row.unread_count || 0, last_message_at: row.last_message_at }));
}

async function messageThread(db, sessionId, contactId, role) {
  const me = currentUserId(role);
  const rows = await db.prepare("SELECT * FROM messages WHERE session_id = ? AND ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)) ORDER BY sent_at").bind(sessionId, me, contactId, contactId, me).all();
  return rows.results;
}

async function markThreadRead(db, sessionId, contactId, role) {
  await db.prepare("UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE session_id = ? AND sender_id = ? AND recipient_id = ? AND read_at IS NULL").bind(sessionId, contactId, currentUserId(role)).run();
  return empty();
}

async function unread(db, sessionId, role) {
  const row = await db.prepare("SELECT COUNT(*) AS total FROM messages WHERE session_id = ? AND recipient_id = ? AND read_at IS NULL").bind(sessionId, currentUserId(role)).first();
  return { total: row.total || 0 };
}

async function sendMessage(db, sessionId, request) {
  const data = await body(request);
  const id = `msg-${crypto.randomUUID().slice(0, 8)}`;
  await db.prepare("INSERT INTO messages (session_id, id, sender_id, recipient_id, body) VALUES (?, ?, ?, ?, ?)").bind(sessionId, id, currentUserId(currentRole(request)), data.recipient_id, data.body || "").run();
  return json(await db.prepare("SELECT * FROM messages WHERE session_id = ? AND id = ?").bind(sessionId, id).first(), 201);
}

async function listLabs(db, sessionId, params) {
  const rows = await db.prepare("SELECT * FROM lab_results WHERE session_id = ? AND patient_id = ? ORDER BY COALESCE(resulted_at, collected_at) DESC LIMIT ? OFFSET ?").bind(sessionId, params.get("patient_id") || PATIENT_ID, Number(params.get("limit") || 50), Number(params.get("offset") || 0)).all();
  return rows.results;
}

async function labById(db, sessionId, id) {
  const lab = await db.prepare("SELECT * FROM lab_results WHERE session_id = ? AND id = ?").bind(sessionId, id).first();
  if (!lab) throw Object.assign(new Error("Lab result not found."), { status: 404 });
  const entries = await db.prepare("SELECT * FROM lab_result_entries WHERE session_id = ? AND lab_result_id = ?").bind(sessionId, id).all();
  return { ...lab, entries: entries.results };
}

async function updateLabStatus(db, sessionId, id, status) {
  await db.prepare("UPDATE lab_results SET status = ?, released_at = COALESCE(released_at, CURRENT_TIMESTAMP) WHERE session_id = ? AND id = ?").bind(status, sessionId, id).run();
  return json(await labById(db, sessionId, id));
}

async function patchLab(db, sessionId, id, request) {
  const data = await body(request);
  await db.prepare("UPDATE lab_results SET status = COALESCE(?, status), released_at = COALESCE(?, released_at) WHERE session_id = ? AND id = ?").bind(data.status || null, data.released_at || null, sessionId, id).run();
  return json(await labById(db, sessionId, id));
}

async function visitOverviews(db, sessionId) {
  const rows = await db.prepare("SELECT vo.*, p.first_name, p.preferred_name, p.last_name FROM visit_overviews vo JOIN patients p ON p.id = vo.patient_id WHERE vo.session_id = ? ORDER BY vo.appointment_time").bind(sessionId).all();
  return rows.results.map((row) => ({ id: row.id, appointmentId: row.id, appointmentTime: row.appointment_time, visitType: row.visit_type, patientName: `${row.preferred_name || row.first_name} ${row.last_name}`, patientId: row.patient_id }));
}

async function visitOverviewDetail(db, sessionId, id) {
  const row = await db.prepare("SELECT vo.*, p.first_name, p.preferred_name, p.last_name, p.mrn, p.date_of_birth FROM visit_overviews vo JOIN patients p ON p.id = vo.patient_id WHERE vo.session_id = ? AND vo.id = ?").bind(sessionId, id).first();
  if (!row) throw Object.assign(new Error("Visit overview not found."), { status: 404 });
  return visitDetail(row);
}

async function patientOverview(db, sessionId, patientId) {
  const row = await db.prepare("SELECT vo.*, p.first_name, p.preferred_name, p.last_name, p.mrn, p.date_of_birth FROM visit_overviews vo JOIN patients p ON p.id = vo.patient_id WHERE vo.session_id = ? AND vo.patient_id = ? LIMIT 1").bind(sessionId, patientId).first();
  return row ? visitDetail(row) : { patient: await patientById(db, patientId), appointment: null, sections: {} };
}

function visitDetail(row) {
  return {
    id: row.id,
    patient: { id: row.patient_id, first_name: row.first_name, preferred_name: row.preferred_name, last_name: row.last_name, mrn: row.mrn, date_of_birth: row.date_of_birth },
    appointment: { id: row.id, time: row.appointment_time, visitType: row.visit_type },
    generatedFrom: row.generated_from,
    sections: {
      recentHistory: JSON.parse(row.recent_history),
      activeProblems: JSON.parse(row.active_problems),
      medications: JSON.parse(row.medications),
      labs: JSON.parse(row.labs),
      openIssues: JSON.parse(row.open_issues),
      missingSections: JSON.parse(row.missing_sections),
    },
  };
}

async function unsignedEncounters(db, sessionId) {
  const rows = await db.prepare("SELECT ue.*, p.first_name, p.preferred_name, p.last_name FROM unsigned_encounters ue JOIN patients p ON p.id = ue.patient_id WHERE ue.session_id = ? AND ue.signed = 0 ORDER BY ue.created_at DESC").bind(sessionId).all();
  return rows.results.map((row) => ({ id: row.id, patient_name: `${row.preferred_name || row.first_name} ${row.last_name}`, encounter_type: row.encounter_type, summary: row.summary, urgent: Boolean(row.urgent), created_at: row.created_at }));
}

async function signEncounter(db, sessionId, id) {
  await db.prepare("UPDATE unsigned_encounters SET signed = 1 WHERE session_id = ? AND id = ?").bind(sessionId, id).run();
  return empty();
}

async function encounterNote(db, sessionId, request) {
  const data = await body(request);
  if (!data.signed) await db.prepare("INSERT INTO unsigned_encounters (session_id, id, patient_id, encounter_type, summary, urgent) VALUES (?, ?, ?, ?, ?, 0)").bind(sessionId, `enc-${crypto.randomUUID().slice(0, 8)}`, data.patientId || PATIENT_ID, data.encounterType || "Visit Note", data.summary || "").run();
  return json({ ok: true });
}

function notifications() {
  return [{ id: "notif-lab", type: "lab_result", title: "New lab result released", body: "Comprehensive Metabolic Panel is ready to review.", created_at: "2026-07-16T18:15:00", read_at: null, data: { lab_result_id: "lab-cmp-2026" } }];
}

function aiConversations() {
  return [{ id: "ai-disabled-demo", title: "AI disabled in public demo", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }];
}

function aiConversation(id) {
  return { id, title: "AI disabled in public demo", messages: [{ id: "ai-disabled-message", role: "assistant", content: "AI functionality is disabled in this public demo. The production design connects Pulse to HealthNest chart context, appointments, labs, and care-team data before answering.", skill_outputs: [], citations: [], created_at: new Date().toISOString() }] };
}

function aiMessage() {
  const text = "AI functionality is disabled in this public demo. In production, Pulse uses HealthNest clinical context before answering.";
  return new Response(`event: delta\ndata: ${JSON.stringify({ text })}\n\nevent: done\ndata: {}\n\n`, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store" } });
}

function expandDates(start, end, weekdays) {
  if (!start) return [];
  if (!weekdays?.length) return [start];
  const dates = [];
  const wanted = new Set(weekdays.map(Number));
  const cursor = new Date(`${start}T12:00:00`);
  const stop = new Date(`${end || start}T12:00:00`);
  while (cursor <= stop) {
    const mondayBased = (cursor.getDay() + 6) % 7;
    if (wanted.has(mondayBased)) dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function expandTimes(start, end) {
  const times = [];
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const cursor = new Date(2000, 0, 1, startHour, startMinute);
  const stop = new Date(2000, 0, 1, endHour, endMinute);
  while (cursor < stop) {
    times.push(cursor.toTimeString().slice(0, 5));
    cursor.setMinutes(cursor.getMinutes() + 30);
  }
  return times;
}
