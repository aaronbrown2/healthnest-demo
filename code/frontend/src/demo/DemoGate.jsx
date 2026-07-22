import {
  CalendarClock,
  Check,
  FlaskConical,
  Lock,
  MessageSquareText,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";
import "./DemoGate.css";

export default function DemoGate({ onStart }) {
  return (
    <main className="demo-root">
      <section className="demo-left">
        <div className="demo-logo"><u>HealthNest</u></div>
        <div className="demo-left-content">
          <h1 className="demo-headline">
            Coordinated care,{" "}
            <span className="demo-headline-italic">ready to demo.</span>
          </h1>
          <p className="demo-sub">
            Explore fictional patient and provider workflows backed by a local
            SQLite demo database.
          </p>
          <ul className="demo-features">
            <Feature icon={<CalendarClock size={16} />} title="Live scheduling" desc="Provider availability and patient bookings share the same database" />
            <Feature icon={<MessageSquareText size={16} />} title="Cross-role messaging" desc="Send messages between the patient and provider demo accounts" />
            <Feature icon={<FlaskConical size={16} />} title="Demo records" desc="Review seeded labs, chart summaries, and unsigned encounters" />
            <Feature icon={<Lock size={16} />} title="No real PHI" desc="All demo people, records, and messages are fictional" />
          </ul>
        </div>
      </section>

      <section className="demo-right">
        <div className="demo-form-card">
          <p className="demo-kicker">Portfolio demo</p>
          <h2 className="demo-form-title">Continue to HealthNest</h2>
          <p className="demo-form-sub">
            Choose a demo account. No password is required.
          </p>

          <div className="demo-role-selector">
            <RoleButton
              icon={<UserRound size={20} />}
              title="Patient"
              desc="Maya Rivera"
              onClick={() => onStart("patient")}
            />
            <RoleButton
              icon={<Stethoscope size={20} />}
              title="Provider"
              desc="Dr. Elena Chen"
              onClick={() => onStart("provider")}
            />
          </div>

          <div className="demo-note">
            <Sparkles size={16} />
            <span>Pulse AI returns a clear disabled message in this public demo.</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function RoleButton({ icon, title, desc, onClick }) {
  return (
    <button type="button" className="demo-role-btn" onClick={onClick}>
      <span className="demo-role-avatar">{icon}</span>
      <span className="demo-role-label">{title}</span>
      <span className="demo-role-desc">{desc}</span>
      <span className="demo-role-check"><Check size={12} strokeWidth={3} /></span>
    </button>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <li className="demo-feature-item">
      <span className="demo-feature-icon">{icon}</span>
      <div>
        <p className="demo-feature-title">{title}</p>
        <p className="demo-feature-desc">{desc}</p>
      </div>
    </li>
  );
}
