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
    if (request.method === "GET" && path === "/lab-results") return json(await listLabs(db, sessionId, url.searchParams, currentRole(request)));
    if (request.method === "GET" && path === "/providers/visit-overviews") return json(await visitOverviews(db, sessionId));
    if (request.method === "GET" && path === "/providers/unsigned-encounters") return json(await unsignedEncounters(db, sessionId));
    if (request.method === "POST" && path === "/providers/encounter-notes") return encounterNote(db, sessionId, request);
    if (request.method === "GET" && path === "/notifications") return json(await notifications(db, sessionId, currentRole(request)));
    if (request.method === "GET" && ["/ai/conversations", "/ai/provider/conversations"].includes(path)) return json(aiConversations());
    if (request.method === "POST" && ["/ai/conversations", "/ai/provider/conversations"].includes(path)) return json(aiConversations()[0], 201);

    const parts = path.split("/").filter(Boolean);
    if (request.method === "PATCH" && route(parts, "appointments", ":id", "edit_notes")) return editAppointmentNotes(db, sessionId, parts[1], request);
    if (request.method === "POST" && route(parts, "appointments", ":id", "cancel")) return cancelAppointment(db, sessionId, parts[1]);
    if (request.method === "POST" && route(parts, "appointments", ":id", "reschedule")) return rescheduleAppointment(db, sessionId, parts[1], request);
    if (request.method === "DELETE" && route(parts, "schedule", "availability", ":id")) return deleteAvailability(db, sessionId, parts[2]);
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
    patient_user_id: row.patient_user_id,
    patient_name: row.patient_name,
    provider_id: row.provider_id,
    availability_id: row.availability_id,
    status: row.status,
    notes: row.notes,
    available_date: row.available_date,
    available_time: row.available_time,
    providers: { id: row.provider_id, user_id: row.provider_user_id, title: row.title, first_name: row.provider_first_name, last_name: row.provider_last_name, specialty: row.specialty },
    provider_availability: { id: row.availability_id, available_date: row.available_date, available_time: row.available_time },
  };
}

async function appointmentQuery(db, sessionId, where, params = []) {
  const rows = await db.prepare(`SELECT a.*, av.available_date, av.available_time,
      pr.user_id AS provider_user_id, pr.title, pr.first_name AS provider_first_name,
      pr.last_name AS provider_last_name, pr.specialty,
      p.user_id AS patient_user_id,
      (COALESCE(p.preferred_name, p.first_name) || ' ' || p.last_name) AS patient_name
    FROM appointments a
    JOIN provider_availability av ON av.session_id = a.session_id AND av.id = a.availability_id
    JOIN providers pr ON pr.id = a.provider_id
    JOIN patients p ON p.id = a.patient_id
    WHERE a.session_id = ? AND ${where}
    ORDER BY av.available_date, av.available_time`).bind(sessionId, ...params).all();
  return rows.results.map(appointmentOut);
}

async function createPatientAppointment(db, sessionId, request) {
  const data = await body(request);
  const slot = await db.prepare("SELECT * FROM provider_availability WHERE session_id = ? AND id = ?").bind(sessionId, data.availability_id).first();
  if (!slot || slot.provider_id !== data.provider_id || slot.is_booked || slot.blocked) {
    return json({ detail: "Slot is no longer available." }, 409);
  }
  const id = `appt-${crypto.randomUUID().slice(0, 8)}`;
  await db.batch([
    db.prepare("INSERT INTO appointments (session_id, id, patient_id, provider_id, availability_id, status, notes) VALUES (?, ?, ?, ?, ?, 'scheduled', ?)").bind(sessionId, id, PATIENT_ID, slot.provider_id, slot.id, data.notes || ""),
    db.prepare("UPDATE provider_availability SET is_booked = 1 WHERE session_id = ? AND id = ?").bind(sessionId, slot.id),
  ]);
  return json((await appointmentQuery(db, sessionId, "a.id = ?", [id]))[0], 201);
}

async function editAppointmentNotes(db, sessionId, id, request) {
  const data = await body(request);
  await db.prepare("UPDATE appointments SET notes = ? WHERE session_id = ? AND id = ?").bind(data.notes || "", sessionId, id).run();
  const updated = await appointmentQuery(db, sessionId, "a.id = ?", [id]);
  if (!updated.length) return json({ detail: "Appointment not found." }, 404);
  return json(updated[0]);
}

async function cancelAppointment(db, sessionId, id) {
  const appointment = await db.prepare("SELECT availability_id FROM appointments WHERE session_id = ? AND id = ?").bind(sessionId, id).first();
  if (!appointment) return json({ detail: "Appointment not found." }, 404);
  await db.batch([
    db.prepare("DELETE FROM appointments WHERE session_id = ? AND id = ?").bind(sessionId, id),
    db.prepare("UPDATE provider_availability SET is_booked = 0 WHERE session_id = ? AND id = ?").bind(sessionId, appointment.availability_id),
  ]);
  return empty();
}

async function rescheduleAppointment(db, sessionId, id, request) {
  const data = await body(request);
  const appointment = await db.prepare("SELECT * FROM appointments WHERE session_id = ? AND id = ?").bind(sessionId, id).first();
  const slot = await db.prepare("SELECT * FROM provider_availability WHERE session_id = ? AND id = ?").bind(sessionId, data.availability_id).first();
  if (!appointment || !slot || slot.blocked) {
    return json({ detail: "Slot is no longer available." }, 409);
  }
  if (slot.provider_id !== appointment.provider_id) {
    return json({ detail: "Cannot reschedule to a different provider." }, 400);
  }
  if (slot.id === appointment.availability_id) {
    const [current] = await appointmentQuery(db, sessionId, "a.id = ?", [id]);
    return json(current);
  }
  if (slot.is_booked) return json({ detail: "Slot is no longer available." }, 409);
  await db.batch([
    db.prepare("UPDATE provider_availability SET is_booked = 0 WHERE session_id = ? AND id = ?").bind(sessionId, appointment.availability_id),
    db.prepare("UPDATE provider_availability SET is_booked = 1 WHERE session_id = ? AND id = ?").bind(sessionId, slot.id),
    db.prepare("UPDATE appointments SET availability_id = ?, provider_id = ?, status = 'scheduled' WHERE session_id = ? AND id = ?").bind(slot.id, slot.provider_id, sessionId, id),
  ]);
  return json((await appointmentQuery(db, sessionId, "a.id = ?", [id]))[0]);
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

async function deleteAvailability(db, sessionId, id) {
  await db.prepare("DELETE FROM provider_availability WHERE session_id = ? AND id = ? AND is_booked = 0").bind(sessionId, id).run();
  return empty();
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
  const availableDate = data.available_date || data.date;
  const availableTime = data.available_time || data.time;
  const slotId = `slot-${PROVIDER_ID}-${availableDate}-${String(availableTime || "").replace(":", "")}`;
  const apptId = `appt-${crypto.randomUUID().slice(0, 8)}`;
  const patientId = data.patient_id || PATIENT_ID;
  const relationship = await db.prepare("SELECT 1 FROM care_team WHERE patient_id = ? AND provider_id = ? AND active = 1").bind(patientId, PROVIDER_ID).first();
  if (!relationship) return json({ detail: "Patient is not on your care team." }, 403);
  const existingSlot = await db.prepare("SELECT * FROM provider_availability WHERE session_id = ? AND id = ?").bind(sessionId, slotId).first();
  if (existingSlot?.is_booked) {
    const live = await db.prepare("SELECT id FROM appointments WHERE session_id = ? AND availability_id = ? AND status != 'cancelled' LIMIT 1").bind(sessionId, slotId).first();
    if (live) return json({ detail: "That time is already booked." }, 409);
  }
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO provider_availability (session_id, id, provider_id, available_date, available_time, is_booked, blocked) VALUES (?, ?, ?, ?, ?, 1, 0)").bind(sessionId, slotId, PROVIDER_ID, availableDate, availableTime),
    db.prepare("UPDATE provider_availability SET is_booked = 1, blocked = 0 WHERE session_id = ? AND id = ?").bind(sessionId, slotId),
    db.prepare("INSERT INTO appointments (session_id, id, patient_id, provider_id, availability_id, status, notes) VALUES (?, ?, ?, ?, ?, 'scheduled', ?)").bind(sessionId, apptId, patientId, PROVIDER_ID, slotId, data.notes || ""),
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
  const rows = role === "provider"
    ? await db.prepare(`SELECT du.id, du.role, du.first_name, du.last_name, p.mrn AS specialty,
          MAX(m.sent_at) AS last_message_at,
          SUM(CASE WHEN m.recipient_id = ? AND m.read_at IS NULL THEN 1 ELSE 0 END) AS unread_count
        FROM care_team ct
        JOIN patients p ON p.id = ct.patient_id
        JOIN demo_users du ON du.id = p.user_id
        LEFT JOIN messages m ON m.session_id = ? AND ((m.sender_id = ? AND m.recipient_id = du.id) OR (m.sender_id = du.id AND m.recipient_id = ?))
        WHERE ct.provider_id = ? AND ct.active = 1
        GROUP BY du.id, du.role, du.first_name, du.last_name, p.mrn
        ORDER BY COALESCE(last_message_at, ''), du.last_name`).bind(me, sessionId, me, me, PROVIDER_ID).all()
    : await db.prepare(`SELECT du.id, du.role, du.first_name, du.last_name, pr.title, pr.specialty,
          MAX(m.sent_at) AS last_message_at,
          SUM(CASE WHEN m.recipient_id = ? AND m.read_at IS NULL THEN 1 ELSE 0 END) AS unread_count
        FROM care_team ct
        JOIN providers pr ON pr.id = ct.provider_id
        JOIN demo_users du ON du.id = pr.user_id
        LEFT JOIN messages m ON m.session_id = ? AND ((m.sender_id = ? AND m.recipient_id = du.id) OR (m.sender_id = du.id AND m.recipient_id = ?))
        WHERE ct.patient_id = ? AND ct.active = 1
        GROUP BY du.id, du.role, du.first_name, du.last_name, pr.title, pr.specialty
        ORDER BY COALESCE(last_message_at, ''), du.last_name`).bind(me, sessionId, me, me, PATIENT_ID).all();
  return rows.results
    .map((row) => ({
      id: row.id,
      user_id: row.id,
      name: role === "provider"
        ? `${row.first_name} ${row.last_name}`
        : [row.title, row.first_name, row.last_name].filter(Boolean).join(" "),
      role: row.role,
      specialty: row.specialty,
      unread_count: row.unread_count || 0,
      last_message_at: row.last_message_at,
    }))
    .sort((a, b) => (b.unread_count > 0) - (a.unread_count > 0) || String(b.last_message_at || "").localeCompare(String(a.last_message_at || "")) || a.name.localeCompare(b.name));
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
  const rows = await db.prepare("SELECT sender_id, COUNT(*) AS count FROM messages WHERE session_id = ? AND recipient_id = ? AND read_at IS NULL GROUP BY sender_id").bind(sessionId, currentUserId(role)).all();
  return Object.fromEntries((rows.results || []).map((row) => [row.sender_id, row.count || 0]));
}

async function sendMessage(db, sessionId, request) {
  const data = await body(request);
  const senderId = currentUserId(currentRole(request));
  if (!data.recipient_id || senderId === data.recipient_id) return json({ detail: "You cannot message yourself." }, 400);
  const relationship = await usersShareActiveRelationship(db, senderId, data.recipient_id);
  if (!relationship) return json({ detail: "You can only message members of your care team." }, 403);
  const id = `msg-${crypto.randomUUID().slice(0, 8)}`;
  await db.prepare("INSERT INTO messages (session_id, id, sender_id, recipient_id, body) VALUES (?, ?, ?, ?, ?)").bind(sessionId, id, senderId, data.recipient_id, data.body || "").run();
  return json(await db.prepare("SELECT * FROM messages WHERE session_id = ? AND id = ?").bind(sessionId, id).first(), 201);
}

async function usersShareActiveRelationship(db, userA, userB) {
  const row = await db.prepare(`SELECT 1
    FROM care_team ct
    JOIN patients p ON p.id = ct.patient_id
    JOIN providers pr ON pr.id = ct.provider_id
    WHERE ct.active = 1
      AND ((p.user_id = ? AND pr.user_id = ?) OR (p.user_id = ? AND pr.user_id = ?))
    LIMIT 1`).bind(userA, userB, userB, userA).first();
  return Boolean(row);
}

async function listLabs(db, sessionId, params, role) {
  const limit = Math.max(1, Math.min(Number(params.get("limit") || 50), 100));
  const offset = Math.max(0, Number(params.get("offset") || 0));
  const statusFilter = params.get("status_filter");
  const patientId = params.get("patient_id");
  const where = ["lr.session_id = ?"];
  const values = [sessionId];
  if (role === "patient") {
    where.push("lr.patient_id = ?");
    values.push(PATIENT_ID);
    where.push("lr.status = 'released'");
  } else if (patientId) {
    where.push("lr.patient_id = ?");
    values.push(patientId);
  } else {
    where.push("lr.patient_id IN (SELECT patient_id FROM care_team WHERE provider_id = ? AND active = 1)");
    values.push(PROVIDER_ID);
  }
  if (role === "provider" && statusFilter) {
    where.push("lr.status = ?");
    values.push(statusFilter);
  }
  const rows = await db.prepare(`SELECT lr.*,
      COUNT(e.id) AS entries_count,
      SUM(CASE WHEN e.abnormal_flag != 'normal' THEN 1 ELSE 0 END) AS flagged_count
    FROM lab_results lr
    LEFT JOIN lab_result_entries e ON e.session_id = lr.session_id AND e.lab_result_id = lr.id
    WHERE ${where.join(" AND ")}
    GROUP BY lr.id
    ORDER BY COALESCE(lr.resulted_at, lr.collected_at) DESC
    LIMIT ? OFFSET ?`).bind(...values, limit, offset).all();
  return rows.results;
}

async function labById(db, sessionId, id) {
  const lab = await db.prepare("SELECT * FROM lab_results WHERE session_id = ? AND id = ?").bind(sessionId, id).first();
  if (!lab) throw Object.assign(new Error("Lab result not found."), { status: 404 });
  const entries = await db.prepare("SELECT * FROM lab_result_entries WHERE session_id = ? AND lab_result_id = ?").bind(sessionId, id).all();
  const entryRows = entries.results || [];
  return {
    ...lab,
    entries: entryRows,
    entries_count: entryRows.length,
    flagged_count: entryRows.filter((entry) => entry.abnormal_flag && entry.abnormal_flag !== "normal").length,
  };
}

async function updateLabStatus(db, sessionId, id, status) {
  if (status === "released") {
    await db.prepare("UPDATE lab_results SET status = 'released', released_at = COALESCE(released_at, CURRENT_TIMESTAMP) WHERE session_id = ? AND id = ?").bind(sessionId, id).run();
  } else {
    await db.prepare("UPDATE lab_results SET status = ? WHERE session_id = ? AND id = ?").bind(status, sessionId, id).run();
  }
  return json(await labById(db, sessionId, id));
}

async function patchLab(db, sessionId, id, request) {
  const data = await body(request);
  const current = await labById(db, sessionId, id);
  const status = data.transition_to_reviewed && current.status === "uploaded"
    ? "reviewed"
    : data.status || current.status;
  await db.prepare(`UPDATE lab_results
    SET lab_name = COALESCE(?, lab_name),
        collected_at = COALESCE(?, collected_at),
        resulted_at = COALESCE(?, resulted_at),
        status = ?,
        released_at = COALESCE(?, released_at)
    WHERE session_id = ? AND id = ?`).bind(data.lab_name || null, data.collected_at || null, data.resulted_at || null, status, data.released_at || null, sessionId, id).run();
  for (const entry of data.entries || []) {
    await db.prepare(`UPDATE lab_result_entries
      SET component_name = COALESCE(?, component_name),
          loinc_code = COALESCE(?, loinc_code),
          value = COALESCE(?, value),
          unit = COALESCE(?, unit),
          reference_range = COALESCE(?, reference_range),
          abnormal_flag = COALESCE(?, abnormal_flag)
      WHERE session_id = ? AND lab_result_id = ? AND id = ?`)
      .bind(entry.component_name || null, entry.loinc_code || null, entry.value ?? null, entry.unit || null, entry.reference_range || null, entry.abnormal_flag || null, sessionId, id, entry.id)
      .run();
  }
  return json(await labById(db, sessionId, id));
}

async function visitOverviews(db, sessionId) {
  const rows = await db.prepare("SELECT vo.*, p.first_name, p.preferred_name, p.last_name FROM visit_overviews vo JOIN patients p ON p.id = vo.patient_id WHERE vo.session_id = ? ORDER BY vo.appointment_time").bind(sessionId).all();
  return rows.results.map((row) => {
    const name = `${row.preferred_name || row.first_name} ${row.last_name}`;
    return {
      id: row.id,
      time: row.appointment_time,
      type: row.visit_type,
      name,
      initials: `${row.first_name?.[0] || ""}${row.last_name?.[0] || ""}`,
      appointmentId: row.id,
      appointmentTime: row.appointment_time,
      visitType: row.visit_type,
      patientName: name,
      patientId: row.patient_id,
    };
  });
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
  const patient = {
    id: row.patient_id,
    name: `${row.preferred_name || row.first_name} ${row.last_name}`,
    initials: `${row.first_name?.[0] || ""}${row.last_name?.[0] || ""}`,
    mrn: row.mrn,
    dateOfBirth: row.date_of_birth,
    first_name: row.first_name,
    preferred_name: row.preferred_name,
    last_name: row.last_name,
    date_of_birth: row.date_of_birth,
  };
  const appointment = { id: row.id, time: row.appointment_time, visitType: row.visit_type };
  const recentHistory = JSON.parse(row.recent_history);
  const activeProblems = JSON.parse(row.active_problems);
  const medications = JSON.parse(row.medications);
  const labs = JSON.parse(row.labs);
  const openIssues = JSON.parse(row.open_issues);
  const missingSections = JSON.parse(row.missing_sections);
  return {
    id: row.id,
    patient,
    appointment,
    generatedFrom: row.generated_from,
    recentHistory,
    activeProblems,
    medications,
    labs,
    openIssues,
    missingSections,
    sections: {
      recentHistory,
      activeProblems,
      medications,
      labs,
      openIssues,
      missingSections,
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

async function notifications(db, sessionId, role) {
  const me = currentUserId(role);
  const items = [];
  const messages = await db.prepare(`SELECT m.*, du.first_name, du.last_name
    FROM messages m
    JOIN demo_users du ON du.id = m.sender_id
    WHERE m.session_id = ? AND m.recipient_id = ?
    ORDER BY m.sent_at DESC
    LIMIT 10`).bind(sessionId, me).all();
  for (const message of messages.results || []) {
    items.push({
      id: `msg-${message.id}`,
      type: "message",
      title: `New message from ${message.first_name} ${message.last_name}`,
      body: (message.body || "").slice(0, 90),
      created_at: message.sent_at,
      read_at: message.read_at,
      contact_id: message.sender_id,
    });
  }

  if (role === "patient") {
    const appointments = await db.prepare(`SELECT a.*, pr.title, pr.first_name, pr.last_name
      FROM appointments a
      JOIN providers pr ON pr.id = a.provider_id
      WHERE a.session_id = ? AND a.patient_id = ? AND a.status != 'cancelled'
      ORDER BY a.created_at DESC
      LIMIT 10`).bind(sessionId, PATIENT_ID).all();
    for (const appointment of appointments.results || []) {
      items.push({
        id: `appt-${appointment.id}`,
        type: "appointment",
        title: `Appointment booked with ${[appointment.title, appointment.first_name, appointment.last_name].filter(Boolean).join(" ")}`,
        body: "",
        created_at: appointment.created_at,
        nav: "appointments",
      });
    }
    const labs = await db.prepare("SELECT * FROM lab_results WHERE session_id = ? AND patient_id = ? AND status = 'released' AND released_at IS NOT NULL ORDER BY released_at DESC LIMIT 10").bind(sessionId, PATIENT_ID).all();
    for (const lab of labs.results || []) {
      items.push({
        id: `lab-${lab.id}`,
        type: "lab",
        title: `New lab result: ${lab.lab_name || "Lab result"}`,
        body: "",
        created_at: lab.released_at,
        nav: "labs",
        data: { lab_result_id: lab.id },
        labResultId: lab.id,
      });
    }
  } else {
    const appointments = await db.prepare(`SELECT a.*, p.first_name, p.preferred_name, p.last_name
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      WHERE a.session_id = ? AND a.provider_id = ? AND a.status != 'cancelled'
      ORDER BY a.created_at DESC
      LIMIT 10`).bind(sessionId, PROVIDER_ID).all();
    for (const appointment of appointments.results || []) {
      items.push({
        id: `appt-${appointment.id}`,
        type: "appointment",
        title: `New appointment with ${appointment.preferred_name || appointment.first_name} ${appointment.last_name}`,
        body: "",
        created_at: appointment.created_at,
        nav: "schedule",
      });
    }
  }

  return items
    .filter((item) => item.created_at)
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 30);
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
