import {
  Activity,
  CalendarClock,
  FlaskConical,
  MessageSquareText,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";
import "./DemoGate.css";

const patientHighlights = [
  "Unified home dashboard with appointments, care team, messages, and lab results",
  "Pulse AI assistant grounded in the patient's demo chart",
  "One-click appointment booking and care-team messaging",
];

const providerHighlights = [
  "Provider dashboard with schedule, patient lookup, and unsigned encounters",
  "AI pre-visit summaries built from records, labs, and prior notes",
  "Lab review queue with release workflow and chart context",
];

export default function DemoGate({ onStart }) {
  return (
    <main className="demo-root">
      <section className="demo-hero">
        <div className="demo-brand">
          <span className="demo-brand-mark">
            <Activity size={20} />
          </span>
          <span>HealthNest Demo</span>
        </div>

        <div className="demo-copy">
          <p className="demo-kicker">Portfolio demo</p>
          <h1>Explore a unified care dashboard without credentials.</h1>
          <p className="demo-subtitle">
            This public demo uses curated, fictional healthcare data so the
            patient and provider workflows can be evaluated safely without a
            backend, real accounts, or protected health information.
          </p>
        </div>

        <div className="demo-paths" aria-label="Choose a demo role">
          <RoleCard
            icon={<UserRound size={22} />}
            title="Patient Experience"
            subtitle="Maya Rivera"
            body="Review upcoming care, lab results, messages, and Pulse AI guidance."
            highlights={patientHighlights}
            action="Enter patient demo"
            onClick={() => onStart("patient")}
          />
          <RoleCard
            icon={<Stethoscope size={22} />}
            title="Provider Experience"
            subtitle="Dr. Elena Chen"
            body="Triage visits, open charts, review labs, and test provider AI workflows."
            highlights={providerHighlights}
            action="Enter provider demo"
            onClick={() => onStart("provider")}
          />
        </div>
      </section>

      <section className="demo-proof" aria-label="Demo feature preview">
        <Feature icon={<CalendarClock size={18} />} label="Scheduling" value="Multi-provider booking" />
        <Feature icon={<FlaskConical size={18} />} label="Records" value="Released and pending labs" />
        <Feature icon={<MessageSquareText size={18} />} label="Messaging" value="Care-team threads" />
        <Feature icon={<Sparkles size={18} />} label="AI" value="Patient and provider assistants" />
      </section>
    </main>
  );
}

function RoleCard({ icon, title, subtitle, body, highlights, action, onClick }) {
  return (
    <article className="demo-role-card">
      <div className="demo-role-icon">{icon}</div>
      <div>
        <p className="demo-role-subtitle">{subtitle}</p>
        <h2>{title}</h2>
        <p className="demo-role-body">{body}</p>
      </div>
      <ul className="demo-role-list">
        {highlights.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <button type="button" className="demo-role-button" onClick={onClick}>
        {action}
      </button>
    </article>
  );
}

function Feature({ icon, label, value }) {
  return (
    <div className="demo-feature">
      <div className="demo-feature-icon">{icon}</div>
      <div>
        <p>{label}</p>
        <span>{value}</span>
      </div>
    </div>
  );
}
