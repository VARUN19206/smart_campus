import React, { useEffect, useState } from "react";

const API = "http://localhost:5000";

const TOKEN_KEY = "campus_token";
const USER_KEY = "campus_user";

/* ─── helpers ─── */
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) || ""}`,
});

/* ─── tiny toast ─── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = (msg, type = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };
  return { toasts, push };
}

function ToastStack({ toasts }) {
  return (
    <div style={styles.toastStack}>
      {toasts.map((t) => (
        <div key={t.id} style={{ ...styles.toast, ...styles[`toast_${t.type}`] }}>
          {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"} {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ─── stat card ─── */
function StatCard({ label, value, icon, accent }) {
  return (
    <div style={{ ...styles.statCard, borderTop: `3px solid ${accent}` }}>
      <span style={{ fontSize: 28 }}>{icon}</span>
      <div>
        <div style={styles.statValue}>{value}</div>
        <div style={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}

/* ─── LOGIN ─── */
function AuthPage({ onLogin, toast }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!form.username.trim() || !form.password.trim()) {
      toast.push("Please fill all fields", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.push(data.message, "success");
        if (mode === "login") {
          localStorage.setItem(TOKEN_KEY, data.token);
          localStorage.setItem(USER_KEY, data.username);
          onLogin(data.username);
        } else {
          setMode("login");
        }
      } else {
        toast.push(data.message || "Request failed", "error");
      }
    } catch {
      toast.push("Cannot reach server", "error");
    }
    setLoading(false);
  };

  return (
    <div style={styles.authBg}>
      <div style={styles.authCard}>
        <div style={styles.authLogo}>🎓</div>
        <h1 style={styles.authTitle}>Smart Campus</h1>
        <p style={styles.authSub}>Faculty Room Allocation Portal</p>

        <div style={styles.authToggle}>
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{ ...styles.toggleBtn, ...(mode === m ? styles.toggleActive : {}) }}
            >
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <input
          style={styles.input}
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && handle()}
        />
        <button style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }} onClick={handle} disabled={loading}>
          {loading ? "Please wait…" : mode === "login" ? "Sign In →" : "Create Account →"}
        </button>
      </div>
    </div>
  );
}

/* ─── MAIN DASHBOARD ─── */
export default function App() {
  const [user, setUser] = useState(() => localStorage.getItem(USER_KEY));
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem(TOKEN_KEY));
  const toast = useToast();

  const [requests, setRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allocating, setAllocating] = useState(false);
  const [activeTab, setActiveTab] = useState("schedule");
  const [filterTime, setFilterTime] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  const [form, setForm] = useState({
    lectureName: "", className: "", students: "", time: "", duration: "60",
  });

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setLoggedIn(false);
    setUser(null);
    setResults([]);
    setRequests([]);
  };

  const getRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/requests`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setRequests(data);
      else if (res.status === 401) logout();
      else toast.push(data.message || "Failed to load", "error");
    } catch {
      toast.push("Cannot reach server", "error");
    }
    setLoading(false);
  };

  const getRooms = async () => {
    try {
      const res = await fetch(`${API}/rooms`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setRooms(data);
    } catch {}
  };

  const addRequest = async () => {
    const { lectureName, className, students, time, duration } = form;
    if (!lectureName || !className || !students || !time) {
      toast.push("Please fill all required fields", "error");
      return;
    }
    if (isNaN(students) || Number(students) <= 0) {
      toast.push("Students must be a positive number", "error");
      return;
    }
    try {
      const res = await fetch(`${API}/requests`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ lectureName, className, students: Number(students), time, duration: Number(duration) }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.push("Request added!", "success");
        setForm({ lectureName: "", className: "", students: "", time: "", duration: "60" });
        getRequests();
      } else {
        toast.push(data.message || "Failed", "error");
      }
    } catch {
      toast.push("Cannot reach server", "error");
    }
  };

  const deleteRequest = async (id) => {
    try {
      const res = await fetch(`${API}/requests/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        toast.push("Request removed", "info");
        getRequests();
      }
    } catch {
      toast.push("Cannot reach server", "error");
    }
  };

  const allocateRooms = async () => {
    if (requests.length === 0) {
      toast.push("No requests to allocate", "error");
      return;
    }
    setAllocating(true);
    try {
      const res = await fetch(`${API}/allocate`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setResults(data);
        setActiveTab("results");
        const success = data.filter((r) => r.status === "success").length;
        toast.push(`Allocated ${success}/${data.length} rooms successfully`, "success");
      } else {
        toast.push(data.message || "Allocation failed", "error");
      }
    } catch {
      toast.push("Cannot reach server", "error");
    }
    setAllocating(false);
  };

  useEffect(() => {
    if (loggedIn) {
      getRequests();
      getRooms();
    }
  }, [loggedIn]);

  if (!loggedIn) {
    return (
      <>
        <ToastStack toasts={toast.toasts} />
        <AuthPage onLogin={(u) => { setUser(u); setLoggedIn(true); }} toast={toast} />
      </>
    );
  }

  const filteredRequests = requests
    .filter((r) => !filterTime || r.lecture_time >= filterTime)
    .sort((a, b) =>
      sortOrder === "newest"
        ? b.request_id - a.request_id
        : sortOrder === "students_asc"
        ? a.students - b.students
        : b.students - a.students
    );

  const successRate = results.length
    ? Math.round((results.filter((r) => r.status === "success").length / results.length) * 100)
    : 0;

  return (
    <div style={styles.app}>
      <ToastStack toasts={toast.toasts} />

      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>🎓</div>
        <div style={styles.sidebarTitle}>Smart Campus</div>
        <div style={styles.sidebarSub}>Faculty Portal</div>

        <nav style={styles.nav}>
          {[
            { id: "schedule", icon: "📅", label: "Schedule" },
            { id: "requests", icon: "📋", label: "Requests" },
            { id: "rooms", icon: "🏫", label: "Rooms" },
            { id: "results", icon: "⚡", label: "Allocations" },
          ].map((item) => (
            <button
              key={item.id}
              style={{ ...styles.navItem, ...(activeTab === item.id ? styles.navActive : {}) }}
              onClick={() => setActiveTab(item.id)}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={styles.sidebarBottom}>
          <div style={styles.userChip}>
            <div style={styles.userAvatar}>{user?.[0]?.toUpperCase()}</div>
            <span style={{ fontSize: 13 }}>{user}</span>
          </div>
          <button style={styles.logoutBtn} onClick={logout}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={styles.main}>
        {/* TOPBAR */}
        <div style={styles.topbar}>
          <div>
            <h1 style={styles.pageTitle}>
              {activeTab === "schedule" && "Faculty Scheduling"}
              {activeTab === "requests" && "Lecture Requests"}
              {activeTab === "rooms" && "Available Rooms"}
              {activeTab === "results" && "Allocation Results"}
            </h1>
            <p style={styles.pageSub}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            style={{ ...styles.primaryBtn, minWidth: 160 }}
            onClick={allocateRooms}
            disabled={allocating || requests.length === 0}
          >
            {allocating ? "Allocating…" : "⚡ Allocate Rooms"}
          </button>
        </div>

        {/* STATS */}
        <div style={styles.statsRow}>
          <StatCard label="Pending Requests" value={requests.length} icon="📋" accent="#6366f1" />
          <StatCard label="Available Rooms" value={rooms.length || "—"} icon="🏫" accent="#10b981" />
          <StatCard label="Allocated" value={results.filter((r) => r.status === "success").length} icon="✅" accent="#f59e0b" />
          <StatCard label="Success Rate" value={results.length ? `${successRate}%` : "—"} icon="📊" accent="#ef4444" />
        </div>

        {/* TABS CONTENT */}
        {activeTab === "schedule" && (
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>New Lecture Request</h2>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Lecture Name *</label>
                <input
                  style={styles.input}
                  placeholder="e.g. Data Structures"
                  value={form.lectureName}
                  onChange={(e) => setForm({ ...form, lectureName: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Class / Section *</label>
                <input
                  style={styles.input}
                  placeholder="e.g. CS-3A"
                  value={form.className}
                  onChange={(e) => setForm({ ...form, className: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Number of Students *</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  placeholder="e.g. 60"
                  value={form.students}
                  onChange={(e) => setForm({ ...form, students: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Time *</label>
                <input
                  style={styles.input}
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Duration (mins)</label>
                <select
                  style={styles.input}
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                >
                  {[30, 45, 60, 90, 120].map((d) => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>
            </div>
            <button style={styles.primaryBtn} onClick={addRequest}>
              ➕ Add Request
            </button>
          </div>
        )}

        {activeTab === "requests" && (
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>Lecture Requests ({filteredRequests.length})</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  style={{ ...styles.input, width: 130, padding: "6px 10px" }}
                  type="time"
                  title="Filter from time"
                  value={filterTime}
                  onChange={(e) => setFilterTime(e.target.value)}
                />
                <select
                  style={{ ...styles.input, padding: "6px 10px" }}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="students_asc">Students ↑</option>
                  <option value="students_desc">Students ↓</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={styles.empty}>Loading…</div>
            ) : filteredRequests.length === 0 ? (
              <div style={styles.empty}>No requests found.</div>
            ) : (
              <div style={styles.cardGrid}>
                {filteredRequests.map((r) => (
                  <div key={r.request_id} style={styles.requestCard}>
                    <div style={styles.requestCardTop}>
                      <span style={styles.badge}>{r.class_name}</span>
                      <button style={styles.deleteBtn} onClick={() => deleteRequest(r.request_id)} title="Delete">✕</button>
                    </div>
                    <h3 style={styles.requestTitle}>{r.lecture_name}</h3>
                    <div style={styles.requestMeta}>
                      <span>👥 {r.students} students</span>
                      <span>🕐 {r.lecture_time}</span>
                      {r.duration && <span>⏱ {r.duration} min</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "rooms" && (
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>Available Rooms</h2>
            {rooms.length === 0 ? (
              <div style={styles.empty}>No rooms data loaded.</div>
            ) : (
              <div style={styles.cardGrid}>
                {rooms.map((r) => (
                  <div key={r.room_id} style={styles.roomCard}>
                    <div style={styles.roomIcon}>🏫</div>
                    <h3 style={styles.requestTitle}>{r.room_name}</h3>
                    <div style={styles.requestMeta}>
                      <span>Capacity: <strong>{r.capacity}</strong></span>
                    </div>
                    <div
                      style={{
                        ...styles.capacityBar,
                        "--pct": `${Math.min((r.capacity / 200) * 100, 100)}%`,
                      }}
                    >
                      <div style={{ width: `min(${(r.capacity / 200) * 100}%, 100%)`, height: "100%", background: "#6366f1", borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "results" && (
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>Allocation Results</h2>
            {results.length === 0 ? (
              <div style={styles.empty}>Run ⚡ Allocate Rooms to see results here.</div>
            ) : (
              <>
                <div style={styles.resultSummary}>
                  <span style={{ color: "#10b981" }}>
                    ✅ {results.filter((r) => r.status === "success").length} allocated
                  </span>
                  <span style={{ color: "#ef4444" }}>
                    ✕ {results.filter((r) => r.status !== "success").length} unallocated
                  </span>
                </div>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {["Lecture", "Class", "Students", "Time", "Room", "Status"].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} style={i % 2 === 0 ? {} : { background: "rgba(99,102,241,0.04)" }}>
                        <td style={styles.td}>{r.lectureName}</td>
                        <td style={styles.td}>{r.className}</td>
                        <td style={styles.td}>{r.students}</td>
                        <td style={styles.td}>{r.time}</td>
                        <td style={styles.td}><strong>{r.room}</strong></td>
                        <td style={styles.td}>
                          <span style={r.status === "success" ? styles.tagSuccess : styles.tagFail}>
                            {r.status === "success" ? "✓ Allocated" : "✕ No Room"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── STYLES ─── */
const C = {
  bg: "#0f0f13",
  surface: "#17171d",
  border: "#2a2a35",
  text: "#e8e8f0",
  muted: "#8888a8",
  primary: "#6366f1",
  primaryHover: "#818cf8",
};

const styles = {
  app: { display: "flex", minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', 'Segoe UI', sans-serif" },
  sidebar: { width: 220, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: "24px 0", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100 },
  sidebarLogo: { fontSize: 36, textAlign: "center", marginBottom: 4 },
  sidebarTitle: { textAlign: "center", fontWeight: 700, fontSize: 16, letterSpacing: "0.5px" },
  sidebarSub: { textAlign: "center", fontSize: 11, color: C.muted, marginBottom: 28 },
  nav: { display: "flex", flexDirection: "column", gap: 4, padding: "0 12px" },
  navItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, fontWeight: 500, textAlign: "left", transition: "all .15s" },
  navActive: { background: "rgba(99,102,241,0.15)", color: C.primaryHover },
  sidebarBottom: { marginTop: "auto", padding: "16px 16px 0" },
  userChip: { display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderTop: `1px solid ${C.border}` },
  userAvatar: { width: 30, height: 30, borderRadius: "50%", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 },
  logoutBtn: { width: "100%", padding: "8px", marginTop: 8, background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, cursor: "pointer", fontSize: 13, transition: "all .15s" },
  main: { marginLeft: 220, flex: 1, padding: "28px 32px", maxWidth: "calc(100vw - 220px)" },
  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: 700, margin: "0 0 2px", letterSpacing: "-0.3px" },
  pageSub: { fontSize: 13, color: C.muted, margin: 0 },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 },
  statCard: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 },
  statValue: { fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px" },
  statLabel: { fontSize: 12, color: C.muted, marginTop: 1 },
  panel: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px 28px" },
  panelTitle: { fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 20 },
  panelHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px 20px", marginBottom: 20 },
  formGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, color: C.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: "10px 14px", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" },
  primaryBtn: { background: C.primary, color: "#fff", border: "none", borderRadius: 9, padding: "11px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", letterSpacing: "0.2px", transition: "opacity .15s" },
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 },
  requestCard: { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" },
  requestCardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  badge: { background: "rgba(99,102,241,0.2)", color: C.primaryHover, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, letterSpacing: "0.3px" },
  deleteBtn: { background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, padding: 4 },
  requestTitle: { fontSize: 14, fontWeight: 600, margin: "0 0 8px", color: C.text },
  requestMeta: { display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: C.muted },
  roomCard: { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px", textAlign: "center" },
  roomIcon: { fontSize: 32, marginBottom: 8 },
  capacityBar: { height: 6, background: C.border, borderRadius: 4, marginTop: 10, overflow: "hidden" },
  resultSummary: { display: "flex", gap: 20, marginBottom: 16, fontSize: 14, fontWeight: 600 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "10px 12px", color: C.muted, fontWeight: 600, borderBottom: `1px solid ${C.border}`, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" },
  td: { padding: "11px 12px", borderBottom: `1px solid ${C.border}` },
  tagSuccess: { background: "rgba(16,185,129,0.15)", color: "#34d399", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 },
  tagFail: { background: "rgba(239,68,68,0.15)", color: "#f87171", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 },
  empty: { color: C.muted, fontSize: 14, textAlign: "center", padding: "40px 0" },
  /* toast */
  toastStack: { position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 },
  toast: { padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500, maxWidth: 320, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", animation: "fadeIn .2s ease" },
  toast_success: { background: "#14532d", color: "#86efac", border: "1px solid #166534" },
  toast_error: { background: "#450a0a", color: "#fca5a5", border: "1px solid #7f1d1d" },
  toast_info: { background: "#1e1b4b", color: "#a5b4fc", border: "1px solid #312e81" },
  /* auth */
  authBg: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg },
  authCard: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: "36px 40px", width: 360, display: "flex", flexDirection: "column", gap: 14 },
  authLogo: { fontSize: 44, textAlign: "center" },
  authTitle: { textAlign: "center", fontSize: 22, fontWeight: 700, margin: 0 },
  authSub: { textAlign: "center", color: C.muted, fontSize: 13, margin: "0 0 6px" },
  authToggle: { display: "flex", background: C.bg, borderRadius: 10, padding: 3, gap: 3 },
  toggleBtn: { flex: 1, padding: "8px", borderRadius: 8, border: "none", background: "none", color: C.muted, cursor: "pointer", fontSize: 13, fontWeight: 500 },
  toggleActive: { background: C.surface, color: C.text, boxShadow: "0 1px 4px rgba(0,0,0,0.4)" },
};
