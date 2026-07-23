// AI-USAGE SUMMARY
// Tools: Claude Code (Opus 4.8)
// Overall AI Contribution: ~90%
// AI-Assisted Areas: The notification bell (#SCRUM-76) — fetches the aggregated
//   feed (new messages / appointments / labs), shows an unread badge, and opens
//   a dropdown of recent notifications. "Seen" state is tracked in localStorage
//   so the badge clears when the user opens the bell; clicking an item navigates
//   to the relevant page. Polls every 30s and closes on outside-click / Escape.
// Human Contributions: UX of the bell + which events surface; verification.
// Notes: Validated via `npm run build`, jest, and manual testing.
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, MessageSquare, Calendar, Activity } from "lucide-react";
import { notificationsApi } from "../lib/notificationsApi";
import { authApi } from "../lib/authApi";
import { useMessages } from "../messages/MessagesProvider";
import "./NotificationBell.css";

const SEEN_KEY = "healthnest.notificationsSeenAt";
const READ_IDS_KEY = "healthnest.notificationReadIds";
const MAX_STORED_READ_IDS = 100;
const POLL_MS = 30000;

const ICONS = {
  message: MessageSquare,
  appointment: Calendar,
  lab: Activity,
};

function readSeenAt(key) {
  const v = Number(localStorage.getItem(key) ?? localStorage.getItem(SEEN_KEY));
  return Number.isFinite(v) ? v : 0;
}

function readStoredIds(key) {
  try {
    const raw = localStorage.getItem(key) ?? localStorage.getItem(READ_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter(Boolean) : []);
  } catch {
    return new Set();
  }
}

function writeStoredIds(key, ids) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify([...ids].slice(-MAX_STORED_READ_IDS)),
    );
  } catch {
    /* localStorage is best-effort UI state for notification dots. */
  }
}

function pruneStoredIds(ids, notifications) {
  const currentIds = new Set(notifications.map((n) => n.id).filter(Boolean));
  return new Set(
    [...ids]
      .filter((id) => currentIds.has(id))
      .slice(-MAX_STORED_READ_IDS),
  );
}

function sameSet(a, b) {
  return a.size === b.size && [...a].every((id) => b.has(id));
}

function timestampMs(value) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  const text = String(value);
  const sqliteUtc =
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(text);
  const normalized = sqliteUtc ? `${text.replace(" ", "T")}Z` : text;
  const ms = new Date(normalized).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function relativeTime(iso) {
  if (!iso) return "";
  const then = timestampMs(iso);
  if (!then) return "";
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function NotificationBell() {
  const userId = authApi.getSession?.()?.user?.id || "anonymous";
  const seenStorageKey = `${SEEN_KEY}.${userId}`;
  const readStorageKey = `${READ_IDS_KEY}.${userId}`;
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState(() => readSeenAt(seenStorageKey));
  const [readIds, setReadIds] = useState(() => readStoredIds(readStorageKey));
  const wrapRef = useRef(null);
  // Monotonic nonce so repeat clicks on the same nav target still re-trigger the
  // destination view (e.g. opening labs twice while already on the dashboard).
  const navSeqRef = useRef(0);
  const { openThread, openDrawer, unreadByContact } = useMessages();

  const load = useCallback(() => {
    notificationsApi
      .getNotifications()
      .then((data) => {
        const nextItems = Array.isArray(data) ? data : [];
        setItems(nextItems);
        setReadIds((current) => {
          const pruned = pruneStoredIds(current, nextItems);
          if (!sameSet(current, pruned)) writeStoredIds(readStorageKey, pruned);
          return sameSet(current, pruned) ? current : pruned;
        });
      })
      .catch(() => {});
  }, [readStorageKey]);

  useEffect(() => {
    setSeenAt(readSeenAt(seenStorageKey));
    setReadIds(readStoredIds(readStorageKey));
  }, [seenStorageKey, readStorageKey]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  // Close on outside-click / Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const newCount = items.filter(
    (n) => timestampMs(n.created_at) > seenAt,
  ).length;
  const visibleNewCount = open ? 0 : newCount;

  const isUnhandled = (n) => {
    if (!n.id || readIds.has(n.id)) return false;
    if (n.contact_id) return (unreadByContact?.[n.contact_id] || 0) > 0;
    return true;
  };

  const markHandled = useCallback((n) => {
    if (!n?.id) return;
    setReadIds((current) => {
      if (current.has(n.id)) return current;
      const next = new Set([...current, n.id].slice(-MAX_STORED_READ_IDS));
      writeStoredIds(readStorageKey, next);
      return next;
    });
  }, [readStorageKey]);

  const toggle = () => {
    setOpen((wasOpen) => {
      const next = !wasOpen;
      if (next) {
        // Mark everything seen the moment the panel opens.
        const newestItemAt = items.reduce(
          (max, item) => Math.max(max, timestampMs(item.created_at)),
          0,
        );
        const now = Math.max(Date.now(), newestItemAt);
        localStorage.setItem(seenStorageKey, String(now));
        setSeenAt(now);
      }
      return next;
    });
  };

  const onItem = (n) => {
    markHandled(n);
    setOpen(false);
    if (n.contact_id) {
      // Open that conversation in the global messaging drawer.
      openThread?.(n.contact_id);
      openDrawer?.();
    } else if (n.nav) {
      // Let App route this (it can set pageData, e.g. the labs view).
      navSeqRef.current += 1;
      const navData = {
        ...(n.data || {}),
        ...(n.data?.lab_result_id ? { labResultId: n.data.lab_result_id } : {}),
        ...(n.labResultId ? { labResultId: n.labResultId } : {}),
        _nav: navSeqRef.current,
      };
      window.dispatchEvent(
        new CustomEvent("hn:navigate", {
          detail: { page: n.nav, data: navData },
        }),
      );
    }
  };

  return (
    <div className="nb-wrap" ref={wrapRef}>
      <button
        type="button"
        className="topnav-icon-btn"
        aria-label={visibleNewCount > 0 ? `Notifications (${visibleNewCount} new)` : "Notifications"}
        aria-expanded={open}
        onClick={toggle}
      >
        <Bell size={20} />
        {visibleNewCount > 0 && <span className="nb-badge">{visibleNewCount > 9 ? "9+" : visibleNewCount}</span>}
      </button>

      {open && (
        <div className="nb-panel">
          <div className="nb-panel-head">Notifications</div>
          {items.length === 0 ? (
            <p className="nb-empty">You're all caught up.</p>
          ) : (
            <ul className="nb-list">
              {items.map((n) => {
                const Icon = ICONS[n.type] || Bell;
                const unhandled = isUnhandled(n);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={`nb-item${unhandled ? " unread" : ""}`}
                      onClick={() => onItem(n)}
                    >
                      <span className={`nb-item-icon nb-item-icon--${n.type}`}>
                        <Icon size={15} />
                      </span>
                      <span className="nb-item-text">
                        <span className="nb-item-title">{n.title}</span>
                        {n.body && <span className="nb-item-body">{n.body}</span>}
                        <span className="nb-item-time">
                          {relativeTime(n.created_at)}
                        </span>
                      </span>
                      {unhandled && (
                        <span
                          className="nb-item-dot"
                          aria-label="Unread notification"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
