import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// CONFIG — your live Supabase project
// ============================================================
const SUPABASE_URL = "https://gujmmtjyinvpsqdgrrfz.supabase.co";
const SUPABASE_ANON = "sb_publishable_O1rQlZgl5AQ7nlRBFHC19Q_p5xcQ5fX";
const TEAM_ID = "00000000-0000-0000-0000-000000000001";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ============================================================
// THEME
// ============================================================
const ORANGE = "#F5A020";
const statusColor = { available: "#22c55e", unavailable: "#ef4444", maybe: ORANGE, pending: "#555" };
const statusLabel = { available: "In", unavailable: "Out", maybe: "Maybe", pending: "—" };

// ============================================================
// APP
// ============================================================
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [guestMode, setGuestMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check URL for share code -> guest mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("share")) {
      setGuestMode(true);
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadProfile(data.session.user.id);
      else setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess);
      if (sess) loadProfile(sess.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (!data) {
      const user = (await supabase.auth.getUser()).data.user;
      const { data: created } = await supabase.from("profiles").insert({
        id: userId,
        email: user?.email,
        full_name: user?.user_metadata?.full_name || user?.email?.split("@")[0],
        role: user?.user_metadata?.role || "player",
      }).select().single();
      setProfile(created);
      await supabase.from("team_members").insert({ team_id: TEAM_ID, profile_id: userId, role: created?.role || "player" });
    } else {
      setProfile(data);
    }
    setLoading(false);
  };

  return (
    <>
      <GlobalStyles />
      {loading ? <LoadingScreen /> :
        guestMode ? <MainApp role="guest" profile={null} /> :
        !session ? <AuthScreen /> :
        <MainApp role={profile?.role || "player"} profile={profile} onSignOut={() => supabase.auth.signOut()} />}
    </>
  );
}

// ============================================================
// GLOBAL STYLES
// ============================================================
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600;700&display=swap');
      *,*::before,*::after { box-sizing: border-box; margin:0; padding:0; }
      body, html, #root { background:#111; color:#fff; font-family:'Barlow',sans-serif; }
      ::-webkit-scrollbar { width:4px; }
      ::-webkit-scrollbar-thumb { background:${ORANGE}40; border-radius:4px; }
      .hd { font-family:'Barlow Condensed',sans-serif; font-weight:900; letter-spacing:-.3px; }
      .card { background:#1c1c1c; border-radius:12px; border:1px solid #252525; }
      .card-amber { background:#1a1200; border-radius:12px; border:1px solid ${ORANGE}40; }
      .btn { background:${ORANGE}; color:#111; border:none; border-radius:8px; padding:10px 16px; font-weight:900; font-size:13px; cursor:pointer; font-family:'Barlow Condensed',sans-serif; letter-spacing:.8px; text-transform:uppercase; transition:filter .15s; }
      .btn:hover { filter:brightness(1.1); }
      .btn:disabled { opacity:.5; cursor:not-allowed; }
      .btn-ghost { background:#252525; color:#aaa; }
      .pill { border-radius:5px; padding:3px 9px; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:1px; font-family:'Barlow Condensed',sans-serif; display:inline-block; }
      input, select, textarea { background:#1c1c1c; border:1px solid #252525; border-radius:8px; color:#fff; font-size:14px; padding:10px 14px; width:100%; outline:none; font-family:'Barlow',sans-serif; }
      input::placeholder { color:#444; }
      input:focus, select:focus, textarea:focus { border-color:${ORANGE}66; }
      .avatar { border-radius:7px; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:11px; flex-shrink:0; font-family:'Barlow Condensed',sans-serif; letter-spacing:.5px; }
      .section-label { font-size:10px; font-weight:900; color:${ORANGE}; text-transform:uppercase; letter-spacing:2.5px; margin-bottom:10px; font-family:'Barlow Condensed',sans-serif; display:flex; align-items:center; gap:8px; }
      .section-label::after { content:''; flex:1; height:1px; background:linear-gradient(to right, ${ORANGE}40, transparent); }
      .tab-btn { background:none; border:none; color:#444; font-size:9px; font-weight:700; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:3px; padding:6px 8px; transition:color .2s; font-family:'Barlow Condensed',sans-serif; text-transform:uppercase; letter-spacing:.8px; }
      .tab-btn.active { color:${ORANGE}; }
      a { color:${ORANGE}; }
    `}</style>
  );
}

function LoadingScreen() {
  return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: ORANGE }}>
    <div className="hd" style={{ fontSize: 28 }}>KICKIN' ACES</div>
  </div>;
}

// ============================================================
// AUTH SCREEN
// ============================================================
function AuthScreen() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("player");
  const [inviteCode, setInviteCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr(""); setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName, role, invite_code: inviteCode } }
        });
        if (error) throw error;
      }
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const guestView = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("share", "0def56e81d99");
    window.location.href = url.toString();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "radial-gradient(ellipse at top, #1a1000 0%, #111 50%)" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="hd" style={{ fontSize: 40, lineHeight: 1 }}>KICKIN' <span style={{ color: ORANGE }}>ACES</span></div>
          <div style={{ fontSize: 12, color: "#555", fontWeight: 600, marginTop: 4, textTransform: "uppercase", letterSpacing: 2, fontFamily: "Barlow Condensed" }}>Team Management</div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: "flex", gap: 6, background: "#0d0d0d", borderRadius: 8, padding: 4, marginBottom: 18 }}>
            {[["signin", "Sign In"], ["signup", "Sign Up"]].map(([k, l]) => (
              <button key={k} onClick={() => setMode(k)} className="hd" style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "none", cursor: "pointer", background: mode === k ? ORANGE : "transparent", color: mode === k ? "#111" : "#666", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>{l}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mode === "signup" && (
              <>
                <input placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} />
                <select value={role} onChange={e => setRole(e.target.value)}>
                  <option value="player">Player</option>
                  <option value="coach">Coach</option>
                  <option value="admin">Admin</option>
                </select>
                <input placeholder="Team invite code (optional)" value={inviteCode} onChange={e => setInviteCode(e.target.value)} />
              </>
            )}
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            {err && <div style={{ color: "#ef4444", fontSize: 12, fontFamily: "Barlow" }}>{err}</div>}
            <button className="btn" disabled={busy} onClick={submit} style={{ marginTop: 6 }}>
              {busy ? "..." : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </div>

          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #252525", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 8, fontFamily: "Barlow Condensed", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700 }}>Or view as guest</div>
            <button onClick={guestView} className="btn btn-ghost" style={{ width: "100%" }}>👁 Public Team View</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP SHELL
// ============================================================
function MainApp({ role, profile, onSignOut }) {
  const [tab, setTab] = useState("home");
  const [team, setTeam] = useState(null);

  useEffect(() => {
    supabase.from("teams").select("*").eq("id", TEAM_ID).single().then(({ data }) => setTeam(data));
  }, []);

  const canEdit = role === "admin" || role === "coach";
  const isGuest = role === "guest";

  const tabs = [
    { id: "home", icon: "⬡", label: "Home" },
    { id: "schedule", icon: "📅", label: "Schedule" },
    { id: "standings", icon: "🏆", label: "Standings" },
    { id: "roster", icon: "👥", label: "Roster" },
    ...(isGuest ? [] : [{ id: "chat", icon: "💬", label: "Chat" }]),
    { id: "store", icon: "🛒", label: "Store" },
    { id: "more", icon: "⋯", label: "More" },
  ];

  return (
    <div style={{ fontFamily: "'Barlow',sans-serif", background: "#111", minHeight: "100vh", maxWidth: 430, margin: "0 auto", color: "#fff", display: "flex", flexDirection: "column", position: "relative" }}>
      <Header team={team} role={role} profile={profile} />

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 13px 82px" }}>
        {tab === "home" && <HomeTab team={team} role={role} profile={profile} />}
        {tab === "schedule" && <ScheduleTab canEdit={canEdit} />}
        {tab === "standings" && <StandingsTab canEdit={canEdit} team={team} />}
        {tab === "roster" && <RosterTab canEdit={canEdit} profile={profile} />}
        {tab === "chat" && !isGuest && <ChatTab profile={profile} />}
        {tab === "store" && <StoreTab canEdit={canEdit} profile={profile} />}
        {tab === "more" && <MoreTab team={team} role={role} profile={profile} onSignOut={onSignOut} canEdit={canEdit} />}
      </div>

      <BottomNav tabs={tabs} tab={tab} setTab={setTab} />
    </div>
  );
}

// ============================================================
// HEADER
// ============================================================
function Header({ team, role, profile }) {
  const roleBadge = { admin: { bg: "#ef444422", color: "#ef4444" }, coach: { bg: `${ORANGE}22`, color: ORANGE }, player: { bg: "#22c55e22", color: "#22c55e" }, guest: { bg: "#55555522", color: "#888" } }[role];
  return (
    <div style={{ background: "#0d0d0d", padding: "13px 16px 11px", borderBottom: `2px solid ${ORANGE}`, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <LogoBadge />
        <div>
          <div className="hd" style={{ fontSize: 21, lineHeight: 1.05 }}>
            KICKIN' <span style={{ color: ORANGE }}>ACES</span>
          </div>
          <div style={{ fontSize: 11, color: "#555", fontFamily: "Barlow", fontWeight: 600 }}>
            {team?.sport || "Kickball"} · {team?.season || "2026 Spring"}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span className="pill" style={{ background: roleBadge.bg, color: roleBadge.color }}>{role}</span>
      </div>
    </div>
  );
}

function LogoBadge() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42">
      <rect width="42" height="42" rx="8" fill="#1a1a1a" />
      <path d="M5 10 L21 5 L37 10 L37 28 L21 38 L5 28 Z" fill="#111" stroke={ORANGE} strokeWidth="1.5" />
      <path d="M5 16 L14 13 L12 18 L21 15 L20 20 L30 17" stroke={ORANGE} strokeWidth="1.5" strokeLinecap="round" />
      <text x="10" y="28" fontFamily="Arial Black,sans-serif" fontSize="11" fontWeight="900" fill={ORANGE}>K</text>
      <text x="21" y="28" fontFamily="Arial Black,sans-serif" fontSize="11" fontWeight="900" fill="white">A</text>
    </svg>
  );
}

// ============================================================
// HOME TAB
// ============================================================
function HomeTab({ team, role, profile }) {
  const [nextEvent, setNextEvent] = useState(null);
  const [standings, setStandings] = useState([]);
  const [myRsvp, setMyRsvp] = useState(null);
  const [liveGame, setLiveGame] = useState(null);
  const isGuest = role === "guest";
  const canScore = role === "admin" || role === "coach";

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    supabase.from("events").select("*").eq("team_id", TEAM_ID).gte("event_date", today).eq("is_bye", false).order("event_date").order("event_time").limit(1).then(({ data }) => {
      if (data?.[0]) {
        setNextEvent(data[0]);
        if (profile) {
          supabase.from("rsvps").select("*").eq("event_id", data[0].id).eq("profile_id", profile.id).maybeSingle().then(({ data: r }) => setMyRsvp(r));
        }
      }
    });
    supabase.from("league_teams").select("*").eq("team_id", TEAM_ID).order("place").then(({ data }) => setStandings(data || []));
    supabase.from("live_games").select("*").eq("team_id", TEAM_ID).eq("active", true).maybeSingle().then(({ data }) => setLiveGame(data));
    const ch = supabase.channel("live-home").on("postgres_changes", { event: "*", schema: "public", table: "live_games" }, ({ new: n }) => setLiveGame(n)).subscribe();
    return () => supabase.removeChannel(ch);
  }, [profile?.id]);

  const doRsvp = async (status) => {
    if (!profile || !nextEvent) return;
    const { data } = await supabase.from("rsvps").upsert({ event_id: nextEvent.id, profile_id: profile.id, status }, { onConflict: "event_id,profile_id" }).select().single();
    setMyRsvp(data);
  };

  const toggleLive = async () => {
    if (liveGame) {
      await supabase.from("live_games").update({ active: false, ended_at: new Date().toISOString() }).eq("id", liveGame.id);
      setLiveGame(null);
    } else {
      const { data } = await supabase.from("live_games").insert({ team_id: TEAM_ID, event_id: nextEvent?.id, us_score: 0, them_score: 0, active: true }).select().single();
      setLiveGame(data);
    }
  };

  const adjustScore = async (key, delta) => {
    if (!liveGame) return;
    const next = Math.max(0, liveGame[key] + delta);
    const { data } = await supabase.from("live_games").update({ [key]: next }).eq("id", liveGame.id).select().single();
    setLiveGame(data);
  };

  const ourStanding = standings.find(s => s.name?.toLowerCase().includes("aw ready") || s.name === team?.league_team_name);
  const myWins = ourStanding?.wins || 0;
  const myLosses = ourStanding?.losses || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Next event card */}
      {nextEvent && (
        <div style={{ background: "linear-gradient(140deg,#1f1200 0%,#2a1800 60%,#181000 100%)", borderRadius: 14, padding: 18, border: `1px solid ${ORANGE}45`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -10, right: -10, fontSize: 90, opacity: .05, transform: "rotate(-20deg)" }}>⚽</div>
          <div style={{ fontSize: 10, fontWeight: 900, color: ORANGE, textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 6, fontFamily: "Barlow Condensed" }}>⚡ Next Match · {nextEvent.week_label}</div>
          <div className="hd" style={{ fontSize: 26, lineHeight: 1.05, marginBottom: 6 }}>
            {nextEvent.home_team} <span style={{ color: "#555" }}>vs</span> <span style={{ color: ORANGE }}>{nextEvent.away_team}</span>
          </div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 2 }}>📅 {formatDate(nextEvent.event_date)} · {formatTime(nextEvent.event_time)}</div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 14 }}>📍 {nextEvent.location || "TBD"}</div>
          {!isGuest && profile && (
            <div style={{ display: "flex", gap: 6 }}>
              {["available", "maybe", "unavailable"].map(s => (
                <button key={s} onClick={() => doRsvp(s)} className="btn" style={{ flex: 1, fontSize: 11, padding: "8px 4px", background: myRsvp?.status === s ? statusColor[s] : "#252525", color: myRsvp?.status === s ? "#111" : "#888" }}>
                  {statusLabel[s]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <StatCard label="Place" value={ourStanding?.place ? `#${ourStanding.place}` : "—"} color={ORANGE} />
        <StatCard label="Wins" value={myWins} color="#22c55e" />
        <StatCard label="Losses" value={myLosses} color="#ef4444" />
      </div>

      {/* Live Scoreboard */}
      <div className="card-amber" style={{ padding: 15 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: liveGame ? 14 : 0 }}>
          <div className="hd" style={{ fontSize: 16, color: ORANGE }}>⚽ Live Scoreboard</div>
          {canScore && <button onClick={toggleLive} className="btn" style={{ fontSize: 11, padding: "6px 12px", background: liveGame ? "#2a0000" : ORANGE, color: liveGame ? "#ef4444" : "#111", border: liveGame ? "1px solid #ef444430" : "none" }}>
            {liveGame ? "End Game" : "Start Game"}
          </button>}
        </div>
        {liveGame && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
            <ScoreCol label="Kickin' Aces" val={liveGame.us_score} accent onAdjust={canScore ? d => adjustScore("us_score", d) : null} />
            <div className="hd" style={{ fontSize: 36, color: "#2a2a2a" }}>:</div>
            <ScoreCol label="Opponent" val={liveGame.them_score} onAdjust={canScore ? d => adjustScore("them_score", d) : null} />
          </div>
        )}
      </div>

      {/* Standings preview */}
      {standings.length > 0 && (
        <div>
          <div className="section-label">League Standings</div>
          <div className="card" style={{ padding: "10px 14px" }}>
            {standings.slice(0, 5).map(s => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #252525", gap: 10 }}>
                <div className="hd" style={{ fontSize: 14, color: s.place === 1 ? ORANGE : "#666", minWidth: 20 }}>{s.place}</div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: "#888", fontFamily: "Barlow Condensed", fontWeight: 700 }}>{s.wins}-{s.losses}</div>
                <div style={{ fontSize: 11, color: "#555", minWidth: 50, textAlign: "right", fontFamily: "Barlow Condensed", fontWeight: 700 }}>{s.streak}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="card" style={{ padding: "13px 8px", textAlign: "center" }}>
      <div className="hd" style={{ fontSize: 27, color }}>{value}</div>
      <div style={{ fontSize: 9, color: "#444", fontWeight: 900, marginTop: 2, textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "Barlow Condensed" }}>{label}</div>
    </div>
  );
}

function ScoreCol({ label, val, accent, onAdjust }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 10, color: accent ? ORANGE : "#444", fontWeight: 900, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Barlow Condensed" }}>{label}</div>
      <div className="hd" style={{ fontSize: 54, color: accent ? ORANGE : "#888", lineHeight: 1 }}>{val}</div>
      {onAdjust && (
        <div style={{ display: "flex", gap: 6, marginTop: 10, justifyContent: "center" }}>
          <button onClick={() => onAdjust(-1)} style={{ background: "#1c1c1c", border: "1px solid #252525", color: "#fff", borderRadius: 6, padding: "5px 13px", cursor: "pointer", fontSize: 18, fontWeight: 900, fontFamily: "Barlow Condensed" }}>−</button>
          <button onClick={() => onAdjust(1)} style={{ background: accent ? ORANGE : "#1c1c1c", border: accent ? "none" : "1px solid #252525", color: accent ? "#111" : "#fff", borderRadius: 6, padding: "5px 13px", cursor: "pointer", fontSize: 18, fontWeight: 900, fontFamily: "Barlow Condensed" }}>+</button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SCHEDULE TAB
// ============================================================
function ScheduleTab({ canEdit }) {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => { load(); }, []);
  const load = () => supabase.from("events").select("*").eq("team_id", TEAM_ID).order("event_date", { nullsFirst: false }).order("event_time").then(({ data }) => setEvents(data || []));

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter(e => !e.is_bye && e.event_date && e.event_date >= today);
  const past = events.filter(e => !e.is_bye && e.event_date && e.event_date < today).reverse();
  const byes = events.filter(e => e.is_bye);
  const shown = filter === "upcoming" ? upcoming : filter === "past" ? past : [...upcoming, ...past];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[["all", "All"], ["upcoming", "Upcoming"], ["past", "Past"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className="pill" style={{ border: "none", cursor: "pointer", background: filter === k ? ORANGE : "#1c1c1c", color: filter === k ? "#111" : "#666", padding: "6px 12px", fontSize: 11 }}>{l}</button>
        ))}
      </div>

      {shown.length === 0 && <div style={{ textAlign: "center", color: "#444", padding: 30, fontSize: 13 }}>No events</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {shown.map(e => <EventRow key={e.id} event={e} />)}
      </div>

      {byes.length > 0 && filter !== "past" && (
        <>
          <div className="section-label" style={{ marginTop: 18 }}>Byes</div>
          {byes.map(e => (
            <div key={e.id} className="card" style={{ padding: 12, fontSize: 13, color: "#666" }}>
              {e.week_label} · {e.home_team} (Bye)
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function EventRow({ event }) {
  const past = event.event_date < new Date().toISOString().slice(0, 10);
  const hasScore = event.home_score != null && event.away_score != null;
  return (
    <div className="card" style={{ padding: 13, display: "flex", gap: 12, alignItems: "center", opacity: past ? .75 : 1 }}>
      <div style={{ background: past ? "#1c1c1c" : `${ORANGE}15`, border: past ? "none" : `1px solid ${ORANGE}30`, borderRadius: 9, padding: "9px 11px", textAlign: "center", minWidth: 52 }}>
        <div className="hd" style={{ fontSize: 19, color: past ? "#444" : ORANGE, lineHeight: 1 }}>{new Date(event.event_date + "T00:00:00").getDate()}</div>
        <div style={{ fontSize: 9, fontWeight: 900, color: past ? "#333" : `${ORANGE}90`, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Barlow Condensed" }}>{new Date(event.event_date + "T00:00:00").toLocaleDateString("en", { month: "short" })}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3, display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.home_team} vs {event.away_team}</span>
          <span className="pill" style={{ background: `${ORANGE}18`, color: ORANGE, fontSize: 9 }}>{event.week_label}</span>
        </div>
        <div style={{ fontSize: 11, color: "#555", fontFamily: "Barlow" }}>🕐 {formatTime(event.event_time)} · 📍 {event.location || "TBD"}</div>
      </div>
      {hasScore && (
        <div style={{ textAlign: "right" }}>
          <div className="hd" style={{ fontSize: 18, color: "#fff" }}>{event.home_score}–{event.away_score}</div>
          <div style={{ fontSize: 9, color: "#555", fontFamily: "Barlow Condensed", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Final</div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// STANDINGS TAB
// ============================================================
function StandingsTab({ canEdit, team }) {
  const [standings, setStandings] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState("");
  const [leagueUrl, setLeagueUrl] = useState(team?.league_url || "https://teamsideline.com/sites/Leander/schedule/698850/Friday-Nights");

  useEffect(() => { load(); }, []);
  useEffect(() => { if (team?.league_url) setLeagueUrl(team.league_url); }, [team]);
  const load = () => supabase.from("league_teams").select("*").eq("team_id", TEAM_ID).order("place").then(({ data }) => setStandings(data || []));

  const sync = async () => {
    setSyncing(true); setMsg("");
    try {
      const { data, error } = await supabase.functions.invoke("league-sync", { body: { team_id: TEAM_ID, league_url: leagueUrl } });
      if (error) throw error;
      setMsg(`✓ Synced ${data.events_count} events, ${data.standings_count} standings`);
      await load();
    } catch (e) { setMsg("Error: " + e.message); }
    setSyncing(false);
  };

  return (
    <div>
      {canEdit && (
        <div className="card" style={{ padding: 14, marginBottom: 14 }}>
          <div className="section-label" style={{ marginBottom: 8 }}>League Sync</div>
          <input placeholder="League URL (TeamSideline, etc)" value={leagueUrl} onChange={e => setLeagueUrl(e.target.value)} style={{ marginBottom: 8, fontSize: 11 }} />
          <button className="btn" onClick={sync} disabled={syncing} style={{ width: "100%" }}>
            {syncing ? "Syncing…" : "🔄 Pull League Data"}
          </button>
          {msg && <div style={{ fontSize: 11, color: msg.startsWith("✓") ? "#22c55e" : "#ef4444", marginTop: 8, fontFamily: "Barlow" }}>{msg}</div>}
        </div>
      )}

      <div className="section-label">Standings</div>
      <div className="card" style={{ padding: "10px 14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 32px 32px 50px 56px", gap: 8, paddingBottom: 8, borderBottom: `1px solid ${ORANGE}20`, fontSize: 9, fontWeight: 900, color: ORANGE, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "Barlow Condensed" }}>
          <div>#</div><div>Team</div><div style={{ textAlign: "center" }}>W</div><div style={{ textAlign: "center" }}>L</div><div style={{ textAlign: "center" }}>PCT</div><div style={{ textAlign: "right" }}>Streak</div>
        </div>
        {standings.map(s => (
          <div key={s.id} style={{ display: "grid", gridTemplateColumns: "28px 1fr 32px 32px 50px 56px", gap: 8, padding: "10px 0", borderBottom: "1px solid #252525", fontSize: 13, alignItems: "center" }}>
            <div className="hd" style={{ fontSize: 14, color: s.place === 1 ? ORANGE : s.place <= 3 ? "#fff" : "#666" }}>{s.place}</div>
            <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
            <div style={{ textAlign: "center", color: "#22c55e", fontFamily: "Barlow Condensed", fontWeight: 700 }}>{s.wins}</div>
            <div style={{ textAlign: "center", color: "#ef4444", fontFamily: "Barlow Condensed", fontWeight: 700 }}>{s.losses}</div>
            <div style={{ textAlign: "center", fontSize: 12, color: "#888", fontFamily: "Barlow Condensed", fontWeight: 700 }}>{s.pct}</div>
            <div style={{ textAlign: "right", fontSize: 10, color: s.streak?.startsWith("Won") ? "#22c55e" : "#ef4444", fontFamily: "Barlow Condensed", fontWeight: 700 }}>{s.streak}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ROSTER TAB
// ============================================================
function RosterTab({ canEdit, profile }) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    supabase.from("team_members").select("*, profile:profiles(*)").eq("team_id", TEAM_ID).then(({ data }) => setMembers(data || []));
  }, []);

  return (
    <div>
      <div className="section-label">Roster ({members.length})</div>
      {members.length === 0 && (
        <div className="card" style={{ padding: 20, textAlign: "center", color: "#555", fontSize: 13 }}>
          No teammates yet. Share your invite code to get players on the roster.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {members.map(m => {
          const p = m.profile;
          if (!p) return null;
          const initials = (p.full_name || p.email || "?").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
          return (
            <div key={m.id} className="card" style={{ padding: "11px 13px", display: "flex", alignItems: "center", gap: 11 }}>
              <div className="avatar" style={{ width: 40, height: 40, background: `${ORANGE}15`, color: ORANGE, border: `1px solid ${ORANGE}30` }}>{initials}</div>
              <div style={{ flex: 1 }}>
                <div className="hd" style={{ fontSize: 16 }}>{p.full_name || p.email}</div>
                <div style={{ fontSize: 12, color: "#555", fontFamily: "Barlow" }}>
                  {p.jersey_number ? `#${p.jersey_number} · ` : ""}{p.position || m.role}
                </div>
              </div>
              <span className="pill" style={{ background: `${ORANGE}20`, color: ORANGE }}>{m.role}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// CHAT TAB
// ============================================================
function ChatTab({ profile }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef();

  useEffect(() => {
    supabase.from("messages").select("*, author:profiles(full_name,email,role)").eq("team_id", TEAM_ID).order("created_at").then(({ data }) => setMessages(data || []));
    const ch = supabase.channel("chat").on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `team_id=eq.${TEAM_ID}` }, async ({ new: m }) => {
      const { data: author } = await supabase.from("profiles").select("full_name,email,role").eq("id", m.author_id).single();
      setMessages(prev => [...prev, { ...m, author }]);
    }).subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const send = async () => {
    if (!input.trim() || !profile) return;
    const content = input; setInput("");
    await supabase.from("messages").insert({ team_id: TEAM_ID, author_id: profile.id, content });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)" }}>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 10 }}>
        {messages.length === 0 && <div style={{ textAlign: "center", color: "#333", padding: 40, fontSize: 13 }}>No messages yet. Say hi!</div>}
        {messages.map(m => {
          const mine = m.author_id === profile?.id;
          const isCoach = m.author?.role === "coach" || m.author?.role === "admin";
          const name = m.author?.full_name || m.author?.email || "Unknown";
          const initials = name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
          return (
            <div key={m.id} style={{ display: "flex", gap: 9, flexDirection: mine ? "row-reverse" : "row" }}>
              <div className="avatar" style={{ width: 34, height: 34, background: isCoach ? `${ORANGE}20` : "#1c1c1c", color: isCoach ? ORANGE : "#888", border: isCoach ? `1px solid ${ORANGE}40` : "1px solid #252525" }}>{initials}</div>
              <div style={{ maxWidth: "78%" }}>
                <div style={{ fontSize: 10, color: "#333", marginBottom: 4, textAlign: mine ? "right" : "left", fontFamily: "Barlow Condensed", fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>
                  {name} · {formatRelative(m.created_at)}
                </div>
                <div style={{ background: mine ? ORANGE : "#1c1c1c", color: mine ? "#111" : "#ccc", borderRadius: mine ? "11px 11px 3px 11px" : "11px 11px 11px 3px", padding: "9px 13px", fontSize: 14, lineHeight: 1.45, border: mine ? "none" : "1px solid #252525", fontFamily: "Barlow", fontWeight: mine ? 600 : 400 }}>{m.content}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid #1c1c1c" }}>
        <input placeholder="Message the team…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
        <button onClick={send} className="btn" style={{ flexShrink: 0, padding: "10px 15px", fontSize: 15 }}>➤</button>
      </div>
    </div>
  );
}

// ============================================================
// STORE TAB
// ============================================================
function StoreTab({ canEdit, profile }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderMsg, setOrderMsg] = useState("");

  useEffect(() => {
    supabase.from("products").select("*").eq("team_id", TEAM_ID).eq("active", true).then(({ data }) => setProducts(data || []));
  }, []);

  const addToCart = (p) => {
    setCart(c => {
      const existing = c.find(i => i.product_id === p.id);
      if (existing) return c.map(i => i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...c, { product_id: p.id, name: p.name, price_cents: p.price_cents, quantity: 1 }];
    });
  };

  const updateQty = (id, delta) => setCart(c => c.map(i => i.product_id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));

  const total = cart.reduce((s, i) => s + i.price_cents * i.quantity, 0);

  const checkout = async () => {
    if (!cart.length) return;
    setCheckingOut(true); setOrderMsg("");
    try {
      const { data, error } = await supabase.functions.invoke("square-checkout", {
        body: {
          team_id: TEAM_ID,
          items: cart,
          customer_email: profile?.email,
          customer_name: profile?.full_name,
          redirect_url: window.location.href
        }
      });
      if (error) throw error;
      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data?.demo_mode) {
        setOrderMsg("✓ Order saved as pending. Square not yet configured — see More tab to add credentials.");
        setCart([]);
      } else {
        setOrderMsg("Error: " + JSON.stringify(data));
      }
    } catch (e) { setOrderMsg("Error: " + e.message); }
    setCheckingOut(false);
  };

  return (
    <div>
      <div className="section-label">Team Store</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {products.map(p => (
          <div key={p.id} className="card" style={{ padding: 14, display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 60, height: 60, background: `${ORANGE}12`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, border: `1px solid ${ORANGE}30` }}>
              {productEmoji(p.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="hd" style={{ fontSize: 15 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: "#666", fontFamily: "Barlow", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.description}</div>
              <div className="hd" style={{ fontSize: 16, color: ORANGE }}>${(p.price_cents / 100).toFixed(2)}</div>
            </div>
            <button onClick={() => addToCart(p)} className="btn" style={{ fontSize: 11, padding: "8px 12px" }}>+ Add</button>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="card-amber" style={{ padding: 14, marginBottom: 14 }}>
          <div className="section-label" style={{ marginBottom: 10 }}>Cart</div>
          {cart.map(i => (
            <div key={i.product_id} style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #2a1800", gap: 10 }}>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{i.name}</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button onClick={() => updateQty(i.product_id, -1)} style={{ background: "#1c1c1c", border: "1px solid #252525", color: "#fff", borderRadius: 5, width: 24, height: 24, cursor: "pointer", fontFamily: "Barlow Condensed", fontWeight: 900 }}>−</button>
                <span className="hd" style={{ fontSize: 14, minWidth: 18, textAlign: "center" }}>{i.quantity}</span>
                <button onClick={() => updateQty(i.product_id, 1)} style={{ background: ORANGE, border: "none", color: "#111", borderRadius: 5, width: 24, height: 24, cursor: "pointer", fontFamily: "Barlow Condensed", fontWeight: 900 }}>+</button>
              </div>
              <div className="hd" style={{ fontSize: 14, minWidth: 55, textAlign: "right" }}>${(i.price_cents * i.quantity / 100).toFixed(2)}</div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10 }}>
            <div className="hd" style={{ fontSize: 13, color: "#666", textTransform: "uppercase", letterSpacing: 1 }}>Total</div>
            <div className="hd" style={{ fontSize: 22, color: ORANGE }}>${(total / 100).toFixed(2)}</div>
          </div>
          <button onClick={checkout} disabled={checkingOut || !profile} className="btn" style={{ width: "100%", marginTop: 10, fontSize: 14 }}>
            {checkingOut ? "Processing…" : profile ? "💳 Checkout with Square" : "Sign in to checkout"}
          </button>
          {orderMsg && <div style={{ fontSize: 11, color: orderMsg.startsWith("✓") ? "#22c55e" : "#ef4444", marginTop: 8, fontFamily: "Barlow" }}>{orderMsg}</div>}
        </div>
      )}
    </div>
  );
}

function productEmoji(name) {
  const n = name.toLowerCase();
  if (n.includes("jersey")) return "👕";
  if (n.includes("hoodie")) return "🧥";
  if (n.includes("hat") || n.includes("cap")) return "🧢";
  if (n.includes("sticker")) return "🏷️";
  if (n.includes("fee") || n.includes("tournament")) return "🏆";
  return "📦";
}

// ============================================================
// MORE TAB
// ============================================================
function MoreTab({ team, role, profile, onSignOut, canEdit }) {
  const shareUrl = team?.share_code ? `${window.location.origin}${window.location.pathname}?share=${team.share_code}` : "";
  const copyShare = () => {
    navigator.clipboard.writeText(shareUrl);
    alert("Share link copied!");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card" style={{ padding: 14 }}>
        <div className="section-label" style={{ marginBottom: 10 }}>Profile</div>
        {profile ? (
          <>
            <div className="hd" style={{ fontSize: 18 }}>{profile.full_name || profile.email}</div>
            <div style={{ fontSize: 12, color: "#666", fontFamily: "Barlow" }}>{profile.email}</div>
            <div style={{ marginTop: 6 }}><span className="pill" style={{ background: `${ORANGE}22`, color: ORANGE }}>{role}</span></div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: "#888" }}>Viewing as guest</div>
        )}
      </div>

      {canEdit && team?.invite_code && (
        <div className="card" style={{ padding: 14 }}>
          <div className="section-label" style={{ marginBottom: 10 }}>Invite Players</div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 8, fontFamily: "Barlow" }}>Share this code for players/coaches to join:</div>
          <div className="hd" style={{ fontSize: 24, color: ORANGE, background: "#0d0d0d", padding: "10px 14px", borderRadius: 8, textAlign: "center", letterSpacing: 3, marginBottom: 8 }}>{team.invite_code}</div>
        </div>
      )}

      <div className="card" style={{ padding: 14 }}>
        <div className="section-label" style={{ marginBottom: 10 }}>Guest View Link</div>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 8, fontFamily: "Barlow" }}>Read-only public view (schedule, roster, standings, store):</div>
        <div style={{ fontSize: 11, color: "#888", background: "#0d0d0d", padding: 10, borderRadius: 6, wordBreak: "break-all", fontFamily: "Barlow", marginBottom: 8 }}>{shareUrl}</div>
        <button onClick={copyShare} className="btn btn-ghost" style={{ width: "100%" }}>📋 Copy Share Link</button>
      </div>

      {canEdit && (
        <div className="card" style={{ padding: 14 }}>
          <div className="section-label" style={{ marginBottom: 10 }}>Square Integration</div>
          <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5, fontFamily: "Barlow" }}>
            To enable Square checkout, set these secrets in Supabase:<br />
            <code style={{ color: ORANGE, fontSize: 11 }}>SQUARE_ACCESS_TOKEN</code><br />
            <code style={{ color: ORANGE, fontSize: 11 }}>SQUARE_LOCATION_ID</code><br />
            <code style={{ color: ORANGE, fontSize: 11 }}>SQUARE_ENV</code> (sandbox/production)
          </div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 10, fontFamily: "Barlow" }}>
            Webhook URL to configure in Square Dashboard:<br />
            <code style={{ color: "#888", fontSize: 10, wordBreak: "break-all" }}>{SUPABASE_URL}/functions/v1/square-webhook</code>
          </div>
        </div>
      )}

      {profile && onSignOut && (
        <button onClick={onSignOut} className="btn btn-ghost" style={{ width: "100%" }}>Sign Out</button>
      )}

      <div style={{ textAlign: "center", fontSize: 10, color: "#333", marginTop: 10, fontFamily: "Barlow Condensed", letterSpacing: 2, textTransform: "uppercase" }}>
        Kickin' Aces v1.0 · Powered by Supabase
      </div>
    </div>
  );
}

// ============================================================
// BOTTOM NAV
// ============================================================
function BottomNav({ tabs, tab, setTab }) {
  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#0d0d0d", borderTop: `2px solid ${ORANGE}`, display: "flex", justifyContent: "space-around", padding: "8px 0 12px", zIndex: 100 }}>
      {tabs.map(t => (
        <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
          <span style={{ fontSize: 16 }}>{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================
function formatDate(d) {
  if (!d) return "TBD";
  return new Date(d + "T00:00:00").toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
}
function formatTime(t) {
  if (!t) return "TBD";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
}
function formatRelative(ts) {
  const d = new Date(ts);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}
