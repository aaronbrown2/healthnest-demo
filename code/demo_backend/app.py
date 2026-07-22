import json
import sqlite3
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "healthnest_demo.sqlite"
MIGRATIONS_DIR = BASE_DIR / "migrations"

PATIENT_USER_ID = "patient-user-maya"
PROVIDER_USER_ID = "provider-user-chen"
PATIENT_ID = "patient-maya"
PROVIDER_ID = "provider-chen"

app = FastAPI(title="HealthNest Portfolio Demo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    migrate()


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def migrate() -> None:
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
              version TEXT PRIMARY KEY,
              applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        for path in sorted(MIGRATIONS_DIR.glob("*.sql")):
            version = path.name
            exists = conn.execute(
                "SELECT 1 FROM schema_migrations WHERE version = ?", (version,)
            ).fetchone()
            if exists:
                continue
            conn.executescript(path.read_text())
            conn.execute("INSERT INTO schema_migrations (version) VALUES (?)", (version,))


def current_role(authorization: str | None = Header(default=None)) -> str:
    token = (authorization or "").lower()
    return "provider" if "provider" in token else "patient"


def current_user_id(role: str) -> str:
    return PROVIDER_USER_ID if role == "provider" else PATIENT_USER_ID


def rowdict(row: sqlite3.Row | None) -> dict | None:
    return dict(row) if row else None


def provider_summary(row: sqlite3.Row | dict) -> dict:
    data = dict(row)
    return {
        "id": data["id"],
        "user_id": data["user_id"],
        "title": data["title"],
        "first_name": data["first_name"],
        "last_name": data["last_name"],
        "specialty": data["specialty"],
    }


def patient_summary(row: sqlite3.Row | dict) -> dict:
    data = dict(row)
    return {
        "id": data["id"],
        "user_id": data.get("user_id"),
        "first_name": data["first_name"],
        "preferred_name": data.get("preferred_name"),
        "last_name": data["last_name"],
        "mrn": data.get("mrn"),
        "date_of_birth": data.get("date_of_birth"),
    }


def availability_out(row: sqlite3.Row) -> dict:
    slot = dict(row)
    provider = None
    if "provider_user_id" in slot.keys():
        provider = {
            "id": slot["provider_id"],
            "user_id": slot["provider_user_id"],
            "title": slot["title"],
            "first_name": slot["first_name"],
            "last_name": slot["last_name"],
            "specialty": slot["specialty"],
        }
    return {
        "id": slot["id"],
        "provider_id": slot["provider_id"],
        "available_date": slot["available_date"],
        "available_time": slot["available_time"],
        "is_booked": bool(slot["is_booked"]),
        "blocked": bool(slot["blocked"]),
        **({"providers": provider} if provider else {}),
    }


def appointment_out(row: sqlite3.Row) -> dict:
    data = dict(row)
    return {
        "id": data["id"],
        "patient_id": data["patient_id"],
        "provider_id": data["provider_id"],
        "availability_id": data["availability_id"],
        "status": data["status"],
        "notes": data["notes"],
        "providers": {
            "id": data["provider_id"],
            "user_id": data["provider_user_id"],
            "title": data["title"],
            "first_name": data["provider_first_name"],
            "last_name": data["provider_last_name"],
            "specialty": data["specialty"],
        },
        "provider_availability": {
            "id": data["availability_id"],
            "available_date": data["available_date"],
            "available_time": data["available_time"],
        },
    }


def appointment_query(where: str = "", params: tuple = ()) -> list[dict]:
    sql = f"""
      SELECT a.*, av.available_date, av.available_time,
             pr.user_id AS provider_user_id, pr.title,
             pr.first_name AS provider_first_name, pr.last_name AS provider_last_name,
             pr.specialty
      FROM appointments a
      JOIN provider_availability av ON av.id = a.availability_id
      JOIN providers pr ON pr.id = a.provider_id
      {where}
      ORDER BY av.available_date, av.available_time
    """
    with connect() as conn:
        return [appointment_out(row) for row in conn.execute(sql, params)]


@app.get("/")
def root():
    return {"message": "HealthNest demo backend running"}


@app.get("/config")
def public_config():
    return {"supabase_url": "https://demo.invalid", "supabase_anon_key": "demo"}


@app.post("/auth/signin")
@app.post("/auth/signup")
async def demo_auth(request: Request):
    payload = await request.json()
    return auth_response(payload.get("role") or payload.get("metadata", {}).get("role") or "patient")


@app.post("/auth/refresh")
async def refresh_auth(request: Request):
    payload = await request.json()
    token = payload.get("refresh_token", "")
    return auth_response("provider" if "provider" in token else "patient")


@app.get("/auth/me")
def me(authorization: str | None = Header(default=None)):
    return auth_response(current_role(authorization))["user"]


@app.post("/auth/signout", status_code=204)
def signout():
    return None


def auth_response(role: str) -> dict:
    user_id = current_user_id(role)
    with connect() as conn:
        user = rowdict(conn.execute("SELECT * FROM demo_users WHERE id = ?", (user_id,)).fetchone())
    metadata = {
        "role": user["role"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
    }
    if user["specialty"]:
        metadata["specialty"] = user["specialty"]
    return {
        "session": {
            "access_token": f"demo-{role}-token",
            "refresh_token": f"demo-{role}-refresh",
            "user": {"id": user["id"], "email": user["email"], "user_metadata": metadata},
        },
        "user": {"id": user["id"], "email": user["email"], "user_metadata": metadata},
    }


@app.get("/providers/")
def list_providers():
    with connect() as conn:
        rows = conn.execute("SELECT * FROM providers ORDER BY last_name").fetchall()
    return [provider_summary(row) for row in rows]


@app.get("/providers/care-team")
def care_team():
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT pr.* FROM providers pr
            JOIN care_team ct ON ct.provider_id = pr.id
            WHERE ct.patient_id = ? AND ct.active = 1
            ORDER BY pr.last_name
            """,
            (PATIENT_ID,),
        ).fetchall()
    return [provider_summary(row) for row in rows]


@app.get("/appointments/availability")
def patient_availability():
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT av.*, pr.user_id AS provider_user_id, pr.title, pr.first_name, pr.last_name, pr.specialty
            FROM provider_availability av
            JOIN providers pr ON pr.id = av.provider_id
            WHERE av.is_booked = 0 AND av.blocked = 0
            ORDER BY av.available_date, av.available_time
            """
        ).fetchall()
    return [availability_out(row) for row in rows]


@app.get("/appointments/")
def patient_appointments():
    return appointment_query("WHERE a.patient_id = ?", (PATIENT_ID,))


@app.post("/appointments/", status_code=201)
async def create_patient_appointment(request: Request):
    payload = await request.json()
    provider_id = payload["provider_id"]
    slot_id = payload["availability_id"]
    with connect() as conn:
        slot = conn.execute(
            "SELECT * FROM provider_availability WHERE id = ?", (slot_id,)
        ).fetchone()
        if not slot or slot["provider_id"] != provider_id or slot["is_booked"] or slot["blocked"]:
            raise HTTPException(status_code=409, detail="Slot is no longer available.")
        appt_id = f"appt-{uuid.uuid4().hex[:8]}"
        conn.execute(
            "INSERT INTO appointments (id, patient_id, provider_id, availability_id, status, notes) VALUES (?, ?, ?, ?, 'scheduled', ?)",
            (appt_id, PATIENT_ID, provider_id, slot_id, payload.get("notes")),
        )
        conn.execute("UPDATE provider_availability SET is_booked = 1 WHERE id = ?", (slot_id,))
    return appointment_query("WHERE a.id = ?", (appt_id,))[0]


@app.post("/appointments/{appointment_id}/cancel", status_code=204)
def cancel_patient_appointment(appointment_id: str):
    cancel_appointment(appointment_id)
    return None


@app.post("/appointments/{appointment_id}/reschedule")
async def reschedule_appointment(appointment_id: str, request: Request):
    payload = await request.json()
    new_slot_id = payload["availability_id"]
    with connect() as conn:
        appt = conn.execute("SELECT * FROM appointments WHERE id = ?", (appointment_id,)).fetchone()
        slot = conn.execute("SELECT * FROM provider_availability WHERE id = ?", (new_slot_id,)).fetchone()
        if not appt or not slot or slot["is_booked"] or slot["blocked"]:
            raise HTTPException(status_code=409, detail="Slot is no longer available.")
        conn.execute("UPDATE provider_availability SET is_booked = 0 WHERE id = ?", (appt["availability_id"],))
        conn.execute("UPDATE provider_availability SET is_booked = 1 WHERE id = ?", (new_slot_id,))
        conn.execute(
            "UPDATE appointments SET availability_id = ?, provider_id = ?, status = 'scheduled' WHERE id = ?",
            (new_slot_id, slot["provider_id"], appointment_id),
        )
    return appointment_query("WHERE a.id = ?", (appointment_id,))[0]


def cancel_appointment(appointment_id: str) -> None:
    with connect() as conn:
        appt = conn.execute("SELECT * FROM appointments WHERE id = ?", (appointment_id,)).fetchone()
        if not appt:
            raise HTTPException(status_code=404, detail="Appointment not found.")
        conn.execute("UPDATE appointments SET status = 'cancelled' WHERE id = ?", (appointment_id,))
        conn.execute("UPDATE provider_availability SET is_booked = 0 WHERE id = ?", (appt["availability_id"],))


@app.get("/schedule/availability")
def schedule_availability():
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM provider_availability WHERE provider_id = ? ORDER BY available_date, available_time",
            (PROVIDER_ID,),
        ).fetchall()
    return [availability_out(row) for row in rows]


@app.post("/schedule/availability", status_code=201)
async def add_availability(request: Request):
    payload = await request.json()
    created = []
    dates = expand_dates(payload["start_date"], payload.get("end_date"), payload.get("weekdays") or [])
    times = expand_times(payload["start_time"], payload["end_time"])
    with connect() as conn:
        for day in dates:
            for time in times:
                slot_id = f"slot-{PROVIDER_ID}-{day}-{time.replace(':', '')}"
                conn.execute(
                    """
                    INSERT OR IGNORE INTO provider_availability
                    (id, provider_id, available_date, available_time, is_booked, blocked)
                    VALUES (?, ?, ?, ?, 0, 0)
                    """,
                    (slot_id, PROVIDER_ID, day, time),
                )
                row = conn.execute("SELECT * FROM provider_availability WHERE id = ?", (slot_id,)).fetchone()
                created.append(availability_out(row))
    return created


@app.post("/schedule/slot")
async def set_slot(request: Request):
    payload = await request.json()
    slot_id = f"slot-{PROVIDER_ID}-{payload['date']}-{payload['time'].replace(':', '')}"
    blocked = 1 if payload["state"] == "blocked" else 0
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO provider_availability (id, provider_id, available_date, available_time, is_booked, blocked)
            VALUES (?, ?, ?, ?, 0, ?)
            ON CONFLICT(provider_id, available_date, available_time)
            DO UPDATE SET blocked = excluded.blocked
            """,
            (slot_id, PROVIDER_ID, payload["date"], payload["time"], blocked),
        )
        row = conn.execute("SELECT * FROM provider_availability WHERE id = ?", (slot_id,)).fetchone()
    return availability_out(row)


@app.get("/schedule/rules")
def get_rules():
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM availability_rules WHERE provider_id = ? AND active = 1 ORDER BY weekday, start_time",
            (PROVIDER_ID,),
        ).fetchall()
    return [dict(row) | {"active": bool(row["active"])} for row in rows]


@app.post("/schedule/rules", status_code=201)
async def add_rule(request: Request):
    payload = await request.json()
    rules = []
    with connect() as conn:
        for weekday in payload["weekdays"]:
            rule_id = f"rule-{uuid.uuid4().hex[:8]}"
            effective_from = payload.get("effective_from") or date.today().isoformat()
            effective_until = payload.get("effective_until")
            conn.execute(
                """
                INSERT INTO availability_rules
                (id, provider_id, weekday, start_time, end_time, effective_from, effective_until, active)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
                """,
                (
                    rule_id,
                    PROVIDER_ID,
                    weekday,
                    payload["start_time"],
                    payload["end_time"],
                    effective_from,
                    effective_until,
                ),
            )
            slot_until = effective_until or (date.fromisoformat(effective_from) + timedelta(days=45)).isoformat()
            for day in expand_dates(effective_from, slot_until, [weekday]):
                for time in expand_times(payload["start_time"], payload["end_time"]):
                    slot_id = f"slot-{PROVIDER_ID}-{day}-{time.replace(':', '')}"
                    conn.execute(
                        """
                        INSERT OR IGNORE INTO provider_availability
                        (id, provider_id, available_date, available_time, is_booked, blocked)
                        VALUES (?, ?, ?, ?, 0, 0)
                        """,
                        (slot_id, PROVIDER_ID, day, time),
                    )
            rules.append(dict(conn.execute("SELECT * FROM availability_rules WHERE id = ?", (rule_id,)).fetchone()))
    return rules[0] if len(rules) == 1 else rules


@app.delete("/schedule/rules/{rule_id}", status_code=204)
def delete_rule(rule_id: str):
    with connect() as conn:
        conn.execute("UPDATE availability_rules SET active = 0 WHERE id = ?", (rule_id,))
    return None


@app.get("/schedule/patients")
def schedule_patients():
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT p.* FROM patients p
            JOIN care_team ct ON ct.patient_id = p.id
            WHERE ct.provider_id = ? AND ct.active = 1
            ORDER BY p.last_name
            """,
            (PROVIDER_ID,),
        ).fetchall()
    return [patient_summary(row) for row in rows]


@app.get("/schedule/appointments")
def provider_appointments():
    rows = appointment_query("WHERE a.provider_id = ?", (PROVIDER_ID,))
    with connect() as conn:
        patients = {row["id"]: row for row in conn.execute("SELECT * FROM patients")}
    out = []
    for appt in rows:
        patient = patients[appt["patient_id"]]
        out.append(
            {
                "id": appt["id"],
                "patient_id": appt["patient_id"],
                "patient_user_id": patient["user_id"],
                "patient_name": f"{patient['preferred_name'] or patient['first_name']} {patient['last_name']}",
                "availability_id": appt["availability_id"],
                "status": appt["status"],
                "notes": appt["notes"],
                "available_date": appt["provider_availability"]["available_date"],
                "available_time": appt["provider_availability"]["available_time"],
            }
        )
    return out


@app.post("/schedule/appointments", status_code=201)
async def provider_create_appointment(request: Request):
    payload = await request.json()
    slot_id = f"slot-{PROVIDER_ID}-{payload['date']}-{payload['time'].replace(':', '')}"
    with connect() as conn:
        conn.execute(
            """
            INSERT OR IGNORE INTO provider_availability
            (id, provider_id, available_date, available_time, is_booked, blocked)
            VALUES (?, ?, ?, ?, 0, 0)
            """,
            (slot_id, PROVIDER_ID, payload["date"], payload["time"]),
        )
        appt_id = f"appt-{uuid.uuid4().hex[:8]}"
        conn.execute(
            "INSERT INTO appointments (id, patient_id, provider_id, availability_id, status, notes) VALUES (?, ?, ?, ?, 'scheduled', ?)",
            (appt_id, payload["patient_id"], PROVIDER_ID, slot_id, payload.get("notes")),
        )
        conn.execute("UPDATE provider_availability SET is_booked = 1 WHERE id = ?", (slot_id,))
    return provider_appointments()


@app.post("/schedule/appointments/{appointment_id}/cancel", status_code=204)
def provider_cancel(appointment_id: str):
    cancel_appointment(appointment_id)
    return None


@app.get("/patients")
def search_patients(q: str = "", limit: int = 20):
    term = f"%{q.lower()}%"
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT * FROM patients
            WHERE lower(first_name || ' ' || last_name || ' ' || mrn) LIKE ?
            ORDER BY last_name LIMIT ?
            """,
            (term, limit),
        ).fetchall()
    return [patient_summary(row) for row in rows]


@app.get("/patients/{patient_id}")
def get_patient(patient_id: str):
    with connect() as conn:
        row = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Patient not found.")
    return patient_summary(row)


@app.get("/messages/contacts")
def contacts(authorization: str | None = Header(default=None)):
    role = current_role(authorization)
    with connect() as conn:
        if role == "provider":
            rows = conn.execute(
                """
                SELECT p.* FROM patients p
                JOIN care_team ct ON ct.patient_id = p.id
                WHERE ct.provider_id = ? AND ct.active = 1
                ORDER BY p.last_name
                """,
                (PROVIDER_ID,),
            ).fetchall()
            return [
                {"user_id": row["user_id"], "name": f"{row['preferred_name'] or row['first_name']} {row['last_name']}", "specialty": row["mrn"]}
                for row in rows
            ]
        rows = conn.execute(
            """
            SELECT pr.* FROM providers pr
            JOIN care_team ct ON ct.provider_id = pr.id
            WHERE ct.patient_id = ? AND ct.active = 1
            ORDER BY pr.last_name
            """,
            (PATIENT_ID,),
        ).fetchall()
    return [
        {"user_id": row["user_id"], "name": f"{row['title']} {row['first_name']} {row['last_name']}", "specialty": row["specialty"]}
        for row in rows
    ]


@app.get("/messages/thread/{contact_id}")
def thread(contact_id: str, authorization: str | None = Header(default=None)):
    role = current_role(authorization)
    me = current_user_id(role)
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT * FROM messages
            WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
            ORDER BY sent_at
            """,
            (me, contact_id, contact_id, me),
        ).fetchall()
    return [dict(row) for row in rows]


@app.patch("/messages/thread/{contact_id}/read", status_code=204)
def mark_read(contact_id: str, authorization: str | None = Header(default=None)):
    role = current_role(authorization)
    me = current_user_id(role)
    with connect() as conn:
        conn.execute(
            "UPDATE messages SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE sender_id = ? AND recipient_id = ?",
            (contact_id, me),
        )
    return None


@app.get("/messages/unread")
def unread(authorization: str | None = Header(default=None)):
    role = current_role(authorization)
    me = current_user_id(role)
    with connect() as conn:
        rows = conn.execute(
            "SELECT sender_id, COUNT(*) AS count FROM messages WHERE recipient_id = ? AND read_at IS NULL GROUP BY sender_id",
            (me,),
        ).fetchall()
    return {row["sender_id"]: row["count"] for row in rows}


@app.get("/messages/inbox")
def inbox():
    return []


@app.post("/messages/", status_code=201)
async def send_message(request: Request, authorization: str | None = Header(default=None)):
    role = current_role(authorization)
    payload = await request.json()
    me = current_user_id(role)
    msg_id = f"msg-{uuid.uuid4().hex[:8]}"
    now = datetime.now().isoformat(timespec="seconds")
    with connect() as conn:
        conn.execute(
            "INSERT INTO messages (id, sender_id, recipient_id, body, sent_at) VALUES (?, ?, ?, ?, ?)",
            (msg_id, me, payload["recipient_id"], payload["body"], now),
        )
        row = conn.execute("SELECT * FROM messages WHERE id = ?", (msg_id,)).fetchone()
    return dict(row)


@app.get("/lab-results")
def list_labs(patient_id: str | None = None, limit: int = 50, offset: int = 0):
    patient = patient_id or PATIENT_ID
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT lr.*, COUNT(e.id) AS entries_count,
                   SUM(CASE WHEN e.abnormal_flag != 'normal' THEN 1 ELSE 0 END) AS flagged_count
            FROM lab_results lr
            LEFT JOIN lab_result_entries e ON e.lab_result_id = lr.id
            WHERE lr.patient_id = ?
            GROUP BY lr.id
            ORDER BY COALESCE(lr.resulted_at, lr.collected_at) DESC
            LIMIT ? OFFSET ?
            """,
            (patient, limit, offset),
        ).fetchall()
    return [dict(row) for row in rows]


@app.get("/lab-results/{lab_id}")
def get_lab(lab_id: str):
    with connect() as conn:
        lab = rowdict(conn.execute("SELECT * FROM lab_results WHERE id = ?", (lab_id,)).fetchone())
        if not lab:
            raise HTTPException(status_code=404, detail="Lab result not found.")
        entries = conn.execute("SELECT * FROM lab_result_entries WHERE lab_result_id = ?", (lab_id,)).fetchall()
    lab["entries"] = [dict(row) for row in entries]
    lab["entries_count"] = len(entries)
    lab["flagged_count"] = sum(1 for row in entries if row["abnormal_flag"] != "normal")
    return lab


@app.get("/lab-results/{lab_id}/file")
def lab_file(lab_id: str):
    return {"url": f"data:text/plain,HealthNest demo lab result {lab_id}"}


@app.post("/lab-results/{lab_id}/release")
def release_lab(lab_id: str):
    with connect() as conn:
        conn.execute("UPDATE lab_results SET status = 'released', released_at = COALESCE(released_at, CURRENT_TIMESTAMP) WHERE id = ?", (lab_id,))
    return get_lab(lab_id)


@app.post("/lab-results/{lab_id}/archive")
def archive_lab(lab_id: str):
    with connect() as conn:
        conn.execute("UPDATE lab_results SET status = 'archived' WHERE id = ?", (lab_id,))
    return get_lab(lab_id)


@app.patch("/lab-results/{lab_id}")
async def patch_lab(lab_id: str, request: Request):
    return get_lab(lab_id)


@app.get("/providers/visit-overviews")
def visit_overviews():
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT vo.id, vo.appointment_time, vo.visit_type, p.first_name, p.preferred_name, p.last_name
            FROM visit_overviews vo JOIN patients p ON p.id = vo.patient_id
            ORDER BY vo.appointment_time
            """
        ).fetchall()
    return [
        {
            "id": row["id"],
            "time": row["appointment_time"],
            "type": row["visit_type"],
            "name": f"{row['preferred_name'] or row['first_name']} {row['last_name']}",
            "initials": f"{row['first_name'][0]}{row['last_name'][0]}",
        }
        for row in rows
    ]


@app.get("/providers/visit-overview/{visit_id}")
def visit_overview_detail(visit_id: str):
    with connect() as conn:
        row = conn.execute(
            "SELECT vo.*, p.first_name, p.preferred_name, p.last_name, p.mrn, p.date_of_birth FROM visit_overviews vo JOIN patients p ON p.id = vo.patient_id WHERE vo.id = ?",
            (visit_id,),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Visit overview not found.")
    return visit_detail_from_row(row)


@app.get("/providers/patient-overview/{patient_id}")
def patient_overview(patient_id: str):
    with connect() as conn:
        row = conn.execute(
            "SELECT vo.*, p.first_name, p.preferred_name, p.last_name, p.mrn, p.date_of_birth FROM visit_overviews vo JOIN patients p ON p.id = vo.patient_id WHERE p.id = ? LIMIT 1",
            (patient_id,),
        ).fetchone()
    if row:
        return visit_detail_from_row(row)
    raise HTTPException(status_code=404, detail="Patient overview not found.")


def visit_detail_from_row(row: sqlite3.Row) -> dict:
    return {
        "generatedFrom": row["generated_from"],
        "patient": {
            "id": row["patient_id"],
            "name": f"{row['preferred_name'] or row['first_name']} {row['last_name']}",
            "initials": f"{row['first_name'][0]}{row['last_name'][0]}",
            "mrn": row["mrn"],
            "dateOfBirth": row["date_of_birth"],
        },
        "appointment": {"time": row["appointment_time"], "visitType": row["visit_type"]},
        "recentHistory": json.loads(row["recent_history"]),
        "activeProblems": json.loads(row["active_problems"]),
        "medications": json.loads(row["medications"]),
        "labs": json.loads(row["labs"]),
        "openIssues": json.loads(row["open_issues"]),
        "missingSections": json.loads(row["missing_sections"]),
    }


@app.get("/providers/unsigned-encounters")
def unsigned_encounters():
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT ue.*, p.first_name, p.preferred_name, p.last_name
            FROM unsigned_encounters ue JOIN patients p ON p.id = ue.patient_id
            WHERE signed = 0 ORDER BY created_at DESC
            """
        ).fetchall()
    return [
        {
            "id": row["id"],
            "patient_name": f"{row['preferred_name'] or row['first_name']} {row['last_name']}",
            "encounter_type": row["encounter_type"],
            "summary": row["summary"],
            "urgent": bool(row["urgent"]),
            "created_at": row["created_at"],
        }
        for row in rows
    ]


@app.patch("/providers/unsigned-encounters/{encounter_id}/sign", status_code=204)
def sign_encounter(encounter_id: str):
    with connect() as conn:
        conn.execute("UPDATE unsigned_encounters SET signed = 1 WHERE id = ?", (encounter_id,))
    return None


@app.post("/providers/encounter-notes")
async def encounter_note(request: Request):
    payload = await request.json()
    if not payload.get("signed"):
        with connect() as conn:
            conn.execute(
                "INSERT INTO unsigned_encounters (id, patient_id, encounter_type, summary, urgent) VALUES (?, ?, ?, ?, 0)",
                (f"enc-{uuid.uuid4().hex[:8]}", payload.get("patientId") or PATIENT_ID, payload.get("encounterType") or "Visit Note", payload.get("summary") or ""),
            )
    return {"ok": True}


@app.get("/notifications/")
def notifications():
    return [
        {
            "id": "notif-lab",
            "type": "lab_result",
            "title": "New lab result released",
            "body": "Comprehensive Metabolic Panel is ready to review.",
            "created_at": "2026-07-16T18:15:00",
            "read_at": None,
            "data": {"lab_result_id": "lab-cmp-2026"},
        }
    ]


@app.get("/ai/conversations")
@app.get("/ai/provider/conversations")
def ai_conversations():
    return [{"id": "ai-disabled-demo", "title": "AI disabled in public demo", "created_at": datetime.now().isoformat(), "updated_at": datetime.now().isoformat()}]


@app.post("/ai/conversations", status_code=201)
@app.post("/ai/provider/conversations", status_code=201)
def create_ai_conversation():
    return {"id": "ai-disabled-demo", "title": "AI disabled in public demo", "created_at": datetime.now().isoformat(), "updated_at": datetime.now().isoformat()}


@app.get("/ai/conversations/{conversation_id}")
@app.get("/ai/provider/conversations/{conversation_id}")
def ai_conversation(conversation_id: str):
    return {
        "id": conversation_id,
        "title": "AI disabled in public demo",
        "messages": [
            {
                "id": "ai-disabled-message",
                "role": "assistant",
                "content": "AI functionality is disabled in this public demo. The production design connects Pulse to HealthNest chart context, appointments, labs, and care-team data before answering.",
                "skill_outputs": [],
                "citations": [],
                "created_at": datetime.now().isoformat(),
            }
        ],
    }


@app.post("/ai/conversations/{conversation_id}/messages")
@app.post("/ai/provider/conversations/{conversation_id}/messages")
def ai_message(conversation_id: str):
    async def events():
        text = "AI functionality is disabled in this public demo. In production, Pulse uses HealthNest clinical context before answering."
        yield f"event: delta\ndata: {json.dumps({'text': text})}\n\n"
        yield "event: done\ndata: {}\n\n"
    return StreamingResponse(events(), media_type="text/event-stream")


def expand_dates(start: str, end: str | None, weekdays: list[int]) -> list[str]:
    if not weekdays:
        return [start]
    start_date = date.fromisoformat(start)
    end_date = date.fromisoformat(end or start)
    days = []
    current = start_date
    wanted = set(weekdays)
    while current <= end_date:
        if current.weekday() in wanted:
            days.append(current.isoformat())
        current += timedelta(days=1)
    return days


def expand_times(start: str, end: str) -> list[str]:
    cursor = datetime.strptime(start, "%H:%M")
    stop = datetime.strptime(end, "%H:%M")
    times = []
    while cursor < stop:
        times.append(cursor.strftime("%H:%M"))
        cursor += timedelta(minutes=30)
    return times


@app.exception_handler(Exception)
async def errors(_request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        raise exc
    return JSONResponse(status_code=500, content={"detail": str(exc)})
