import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Home, ListTree, Route as RouteIcon, BookmarkCheck, Compass, Settings,
  Lock, Clock, MapPin, Footprints, ChevronRight, X, Play, Pause,
  Sparkles, Utensils, ShoppingBag, Camera, Bed, TicketCheck, Users,
  AlertTriangle, CheckCircle2, Bell, Sun, Moon, Gauge, ArrowRight,
} from "lucide-react";

/* ============================================================================
   TYPE SHAPES (documented as plain JS objects here; a real Next.js build
   would express these as TypeScript interfaces — see notes at bottom).

   Itinerary   { trip, group, activities[], freeTimeSlots[] }
   Trip        { title, date, park, timezone }
   Group       { size, splitRecommended, meetingLocation, meetingTime, note }
   Activity    { id, title, subtitle, category, area, location,
                 start, end, walkToNext, queueType,
                 isReservation, priority, optional, mealRecommendation,
                 reminderMinutesBefore, description, notes, tips[],
                 requirements[], nearby[] }
   FreeTimeSlot{ afterId, start, end, suggestions[] }
   Suggestion  { type, title, description }
   ============================================================================ */

// ---------------------------------------------------------------------------
// SAMPLE DATA — stands in for whatever an AI/backend would generate.
// The entire UI below is driven by this object; nothing is hardcoded.
// ---------------------------------------------------------------------------
const ITINERARY = {
  trip: { title: "Universal Studios Japan", date: "Fri, 17 July", park: "USJ", timezone: "JST" },
  group: {
    size: 4,
    splitRecommended: true,
    meetingLocation: "Hollywood Dream — The Ride, exit gate",
    meetingTime: 20 * 60 + 20,
    note: "One rider takes the Single Rider line for the leftover trio ride while the rest grab a bench nearby — regroup here.",
  },
  activities: [
    {
      id: "a1", title: "Harry Potter and the Forbidden Journey", subtitle: "Dark ride · Wizarding World",
      category: "ride", area: "Wizarding World of Harry Potter", location: "Hogwarts Castle",
      start: 8 * 60 + 35, end: 9 * 60 + 5, walkToNext: 2, queueType: "Express Pass",
      isReservation: false, priority: "flexible", optional: false,
      description: "A motion-simulator flight through Hogwarts — Quidditch, dragons, and the Forbidden Forest in one seamless ride.",
      notes: "Redeem first thing — the standby line for this one grows fastest of any non-SNW attraction.",
      tips: ["Loose items go in the pouches provided, not lockers.", "Sit toward the middle row for the smoothest motion."],
      requirements: ["132cm+ to ride alone, 122cm with an adult"],
      nearby: ["Ollivanders", "Owl Post"],
    },
    {
      id: "a2", title: "Butterbeer", subtitle: "Snack stop · Hogsmeade",
      category: "dining", area: "Wizarding World of Harry Potter", location: "Hog's Head cart",
      start: 9 * 60 + 45, end: 10 * 60 + 5, walkToNext: 3, queueType: "Regular",
      isReservation: false, priority: "flexible", optional: false, mealRecommendation: true,
      description: "Frozen or regular — the signature butterscotch drink of the wizarding world.",
      notes: "Cart lines run 15–20 min by late morning; this window is the shortest wait.",
      tips: ["Frozen version holds up better in July heat."], requirements: [], nearby: ["Honeydukes"],
    },
    {
      id: "a3", title: "Flight of the Hippogriff", subtitle: "Family coaster · Hogsmeade",
      category: "ride", area: "Wizarding World of Harry Potter", location: "Hagrid's hut",
      start: 10 * 60 + 30, end: 11 * 60, walkToNext: 15, queueType: "Express Pass",
      isReservation: true, priority: "fixed", optional: false, reminderMinutesBefore: 30,
      description: "A gentle outdoor coaster looping past Hagrid's hut — the fixed reservation anchoring your morning.",
      notes: "Fixed Express Pass window — cannot be moved.",
      tips: ["Arrive 5 minutes early; the gate scans your reservation, not just your pass."],
      requirements: [], nearby: ["Hagrid's Hut photo op"],
    },
    {
      id: "a4", title: "JAWS", subtitle: "Boat ride · Amity Village",
      category: "ride", area: "Amity Village", location: "Amity Boat Tours",
      start: 11 * 60 + 20, end: 11 * 60 + 55, walkToNext: 10, queueType: "Regular",
      isReservation: false, priority: "flexible", optional: false,
      description: "A narrated boat cruise interrupted by a very large shark. A USJ classic with no single-rider line.",
      notes: "No single-rider option exists for this ride — morning is genuinely its best window.",
      tips: ["Front-left seats get the wettest — good in July heat."], requirements: [], nearby: ["WaterWorld arena"],
    },
    {
      id: "a5", title: "The Flying Dinosaur", subtitle: "Coaster · Jurassic Park", 
      category: "ride", area: "Jurassic Park", location: "Jurassic Park entrance",
      start: 12 * 60 + 5, end: 12 * 60 + 35, walkToNext: 3, queueType: "Express Pass",
      isReservation: false, priority: "flexible", optional: false,
      description: "Face-down, feet-dangling flight over Jurassic Park — USJ's most intense coaster.",
      notes: "Queue is already 60+ minutes by this hour — Express saves the most time of the whole day right here.",
      tips: ["Lockers are required for everything loose, including phones on a strap."],
      requirements: ["132cm+ solo, 132cm with an adult, under 198cm"], nearby: [],
    },
    {
      id: "a6", title: "Lunch", subtitle: "Quick-service · Jurassic Park / San Francisco",
      category: "dining", area: "Jurassic Park", location: "Jurassic Park counter service",
      start: 13 * 60 + 5, end: 13 * 60 + 40, walkToNext: 15, queueType: "Regular",
      isReservation: false, priority: "flexible", optional: false, mealRecommendation: true,
      description: "A relaxed lunch positioned to land after the worst of the noon rush.",
      notes: "Eating here keeps you positioned for the walk back to Super Nintendo World.",
      tips: [], requirements: [], nearby: ["San Francisco waterfront seating"],
    },
    {
      id: "a7", title: "Mario Kart: Koopa's Challenge", subtitle: "AR ride · Bowser's Castle",
      category: "ride", area: "Super Nintendo World", location: "Bowser's Castle",
      start: 14 * 60, end: 14 * 60 + 30, walkToNext: 2, queueType: "Express Pass",
      isReservation: true, priority: "fixed", optional: false, reminderMinutesBefore: 30,
      description: "AR-headset kart racing through Bowser's Castle alongside Mario, Luigi, and friends.",
      notes: "Fixed Express Pass window — the anchor of your Super Nintendo World block.",
      tips: ["Staff will help fit the AR headset — flag if it feels loose."], requirements: [], nearby: [],
    },
    {
      id: "a8", title: "Yoshi's Adventure", subtitle: "Family ride · Super Mario Land",
      category: "ride", area: "Super Nintendo World", location: "Super Mario Land",
      start: 14 * 60 + 30, end: 15 * 60, walkToNext: 2, queueType: "Express Pass",
      isReservation: true, priority: "fixed", optional: false, reminderMinutesBefore: 15,
      description: "A gentle egg-tossing dark ride through the Mushroom Kingdom.",
      notes: "Fixed slot, immediately next door to Mario Kart — minimal walk.",
      tips: [], requirements: [], nearby: [],
    },
    {
      id: "a9", title: "Mine Cart Madness", subtitle: "Coaster · Donkey Kong Country",
      category: "ride", area: "Super Nintendo World", location: "Donkey Kong Country",
      start: 15 * 60, end: 15 * 60 + 30, walkToNext: 20, queueType: "Express Pass",
      isReservation: true, priority: "fixed", optional: false, reminderMinutesBefore: 15,
      description: "A barrel-blasting mine cart coaster through Donkey Kong's jungle.",
      notes: "The most intense of the three SNW rides — saved for last in the block while everyone's still fresh.",
      tips: [], requirements: [], nearby: [],
    },
    {
      id: "a10", title: "Despicable Me: Minion Mayhem", subtitle: "Optional · Minion Park",
      category: "ride", area: "Minion Park", location: "Minion Park",
      start: 16 * 60 + 35, end: 16 * 60 + 55, walkToNext: 3, queueType: "Regular",
      isReservation: false, priority: "flexible", optional: true,
      description: "A 3D simulator ride through Gru's lab with the Minions.",
      notes: "Skip this one if the standby line runs over 20 minutes — it isn't worth eating into your fixed 17:00 slot.",
      tips: [], requirements: [], nearby: ["Minion Park store"],
    },
    {
      id: "a11", title: "Illumination's Villain-Con Minion Blast", subtitle: "Interactive dark ride · Minion Park",
      category: "ride", area: "Minion Park", location: "Minion Park",
      start: 17 * 60, end: 17 * 60 + 30, walkToNext: 30, queueType: "Express Pass",
      isReservation: true, priority: "fixed", optional: false, reminderMinutesBefore: 30,
      description: "A shooting-gallery dark ride where you and your group blast targets as rival villains.",
      notes: "Fixed Express Pass window closing out your afternoon.",
      tips: ["Higher score if you aim for moving targets, not stationary ones."], requirements: [], nearby: [],
    },
    {
      id: "a12", title: "Dinner", subtitle: "Sit-down or quick-service · New York",
      category: "dining", area: "New York", location: "New York dining strip",
      start: 18 * 60 + 10, end: 19 * 60, walkToNext: 20, queueType: "Regular",
      isReservation: false, priority: "flexible", optional: false, mealRecommendation: true,
      description: "New York's restaurants thin out noticeably after 6pm while other areas are still busy.",
      notes: "Book ahead on the app if you'd rather have a table-service option.",
      tips: [], requirements: [], nearby: [],
    },
    {
      id: "a13", title: "Hollywood Dream — The Ride", subtitle: "Coaster · Hollywood", 
      category: "ride", area: "Hollywood", location: "Hollywood Area",
      start: 19 * 60 + 20, end: 19 * 60 + 50, walkToNext: 0, queueType: "Single Rider",
      isReservation: false, priority: "flexible", optional: false,
      description: "USJ's signature hyper coaster through the Hollywood hills, ridden forward and, on Backdrop, backward.",
      notes: "Evening is the best window — daytime waits run 60+ minutes but thin substantially after dinner.",
      tips: ["Single Rider is fair game here since it isn't Express-covered — the group can regroup right after."],
      requirements: [], nearby: [],
    },
  ],
  freeTimeSlots: [
    {
      afterId: "a9", start: 15 * 60 + 30, end: 16 * 60 + 5,
      suggestions: [
        { type: "food", title: "Kinopio's Café", description: "Grab Nintendo-themed snacks before the lines reform." },
        { type: "shopping", title: "1-Up Factory", description: "Nintendo World's flagship souvenir shop." },
        { type: "photo", title: "Warp Pipe & Peach's Castle", description: "The best photo light of the whole SNW block." },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmt = (mins) => {
  const h = Math.floor(mins / 60), m = Math.round(mins % 60);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
};
const fmtDur = (mins) => (mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`);

const CATEGORY_META = {
  ride: { icon: TicketCheck, label: "Ride" },
  dining: { icon: Utensils, label: "Dining" },
  show: { icon: Sparkles, label: "Show" },
  shopping: { icon: ShoppingBag, label: "Shopping" },
  photo: { icon: Camera, label: "Photo" },
  rest: { icon: Bed, label: "Rest" },
};

function getStatus(activity, currentTime, completed) {
  if (completed.has(activity.id)) return "completed";
  if (currentTime >= activity.start && currentTime < activity.end) return "current";
  if (currentTime < activity.start) return "upcoming";
  return "missed"; // ended, never marked complete
}

function computeScheduleStatus(activities, currentTime, completed) {
  const expected = activities.filter((a) => !a.optional && a.end <= currentTime).length;
  const actual = activities.filter((a) => !a.optional && completed.has(a.id)).length;
  if (actual >= expected) return actual === expected ? "on-time" : "early";
  return "behind";
}

function findCurrentAndNext(activities, currentTime) {
  const sorted = [...activities].sort((a, b) => a.start - b.start);
  const current = sorted.find((a) => currentTime >= a.start && currentTime < a.end) || null;
  const next = sorted.find((a) => a.start > currentTime) || null;
  return { current, next };
}

function computeNotifications(activities, currentTime, completed) {
  const notifs = [];
  const { current, next } = findCurrentAndNext(activities, currentTime);

  activities.forEach((a) => {
    if (a.isReservation && a.reminderMinutesBefore && !completed.has(a.id)) {
      const until = a.start - currentTime;
      if (until > 0 && until <= a.reminderMinutesBefore) {
        notifs.push({ id: `res-${a.id}`, tone: "gold", icon: Lock, text: `Reservation soon: ${a.title} in ${until} min` });
      }
    }
    if (a.mealRecommendation && !completed.has(a.id)) {
      const until = a.start - currentTime;
      if (until > 0 && until <= 30) {
        notifs.push({ id: `meal-${a.id}`, tone: "teal", icon: Utensils, text: `${a.title} coming up — good time to start heading over` });
      }
    }
  });

  if (current && next && current.walkToNext) {
    const leaveBy = current.end - current.walkToNext;
    if (currentTime >= leaveBy && currentTime < current.end) {
      notifs.push({ id: `leave-${current.id}`, tone: "coral", icon: Footprints, text: `Time to leave for ${next.title} (${current.walkToNext} min walk)` });
    }
  }

  const status = computeScheduleStatus(activities, currentTime, completed);
  if (status === "behind") {
    notifs.push({ id: "behind", tone: "danger", icon: AlertTriangle, text: "Running behind schedule — consider skipping an optional stop" });
  }
  return notifs;
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
const Glass = ({ className = "", children, style, ...rest }) => (
  <div className={`glass ${className}`} style={style} {...rest}>{children}</div>
);

const StatusPill = ({ status }) => {
  const map = {
    completed: { label: "Completed", cls: "pill-completed" },
    current: { label: "Happening currentTime", cls: "pill-current" },
    upcoming: { label: "Upcoming", cls: "pill-upcoming" },
    missed: { label: "Missed", cls: "pill-missed" },
  };
  const m = map[status] || map.upcoming;
  return <span className={`pill ${m.cls}`}>{m.label}</span>;
};

const Countdown = ({ minutes }) => {
  const h = Math.floor(Math.max(minutes, 0) / 60);
  const m = Math.max(minutes, 0) % 60;
  return (
    <span className="countdown">
      {h > 0 && <span>{String(h).padStart(2, "0")}<i>h</i></span>}
      <span>{String(m).padStart(2, "0")}<i>m</i></span>
    </span>
  );
};

// ---------------------------------------------------------------------------
// Activity Card (Timeline)
// ---------------------------------------------------------------------------
function ActivityCard({ activity, currentTime, completed, onToggleComplete, onOpen, isLast }) {
  const status = getStatus(activity, currentTime, completed);
  const meta = CATEGORY_META[activity.category] || CATEGORY_META.ride;
  const Icon = meta.icon;
  const isReservation = activity.isReservation;

  return (
    <div className={`timeline-row ${status === "completed" ? "row-fade" : ""}`}>
      <div className="timeline-rail">
        <div className={`node ${status}`}>{isReservation ? <Lock size={12} /> : <Icon size={12} />}</div>
        {!isLast && <div className={`rail-line ${status === "completed" ? "rail-done" : ""}`} />}
      </div>

      <Glass
        className={`activity-card ${status === "current" ? "card-current" : ""} ${isReservation ? "card-reservation" : ""} ${activity.optional ? "card-optional" : ""}`}
        onClick={() => onOpen(activity)}
      >
        {isReservation && status !== "completed" && (
          <div className="reminder-banner">
            <Lock size={11} /> Fixed reservation — cannot be moved
          </div>
        )}
        <div className="card-top">
          <div className="card-time">{fmt(activity.start)} – {fmt(activity.end)}</div>
          <StatusPill status={status} />
        </div>
        <div className="card-title-row">
          <h4>{activity.title}</h4>
          {isReservation && <span className="badge-priority"><Lock size={10} /> Priority</span>}
          {activity.optional && <span className="badge-optional">Optional</span>}
        </div>
        <p className="card-subtitle">{activity.subtitle}</p>
        <div className="card-meta-row">
          <span><MapPin size={12} /> {activity.area}</span>
          <span><Clock size={12} /> {fmtDur(activity.end - activity.start)}</span>
          <span className="queue-tag">{activity.queueType}</span>
        </div>
        {status === "current" && (
          <div className="live-row">
            <Gauge size={13} /> Ends in <Countdown minutes={activity.end - currentTime} />
          </div>
        )}
        {status === "upcoming" && isReservation && (
          <div className="live-row gold">
            <Lock size={13} /> Starts in <Countdown minutes={activity.start - currentTime} />
          </div>
        )}
        <button
          className={`complete-btn ${completed.has(activity.id) ? "done" : ""}`}
          onClick={(e) => { e.stopPropagation(); onToggleComplete(activity.id); }}
        >
          <CheckCircle2 size={14} /> {completed.has(activity.id) ? "Marked done" : "Mark done"}
        </button>
      </Glass>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Free time recommendation card
// ---------------------------------------------------------------------------
function FreeTimeCard({ slot }) {
  const iconFor = { food: Utensils, shopping: ShoppingBag, photo: Camera, rest: Bed };
  return (
    <div className="timeline-row">
      <div className="timeline-rail">
        <div className="node freetime"><Sparkles size={12} /></div>
        <div className="rail-line" />
      </div>
      <Glass className="activity-card freetime-card">
        <div className="card-top">
          <div className="card-time">{fmt(slot.start)} – {fmt(slot.end)} · Free time</div>
        </div>
        <h4 className="freetime-heading">You've got {fmtDur(slot.end - slot.start)} to spare</h4>
        <div className="suggestion-grid">
          {slot.suggestions.map((s, i) => {
            const SIcon = iconFor[s.type] || Sparkles;
            return (
              <div className="suggestion-chip" key={i}>
                <SIcon size={14} />
                <div>
                  <div className="suggestion-title">{s.title}</div>
                  <div className="suggestion-desc">{s.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Glass>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Home / Dashboard
// ---------------------------------------------------------------------------
function Dashboard({ activities, currentTime, completed, group, onOpen, notifications }) {
  const { current, next } = findCurrentAndNext(activities, currentTime);
  const status = computeScheduleStatus(activities, currentTime, completed);
  const total = activities.length;
  const done = activities.filter((a) => completed.has(a.id)).length;
  const pct = Math.round((done / total) * 100);

  const dayStart = activities[0].start, dayEnd = activities[activities.length - 1].end;
  const dayPct = Math.min(100, Math.max(0, Math.round(((currentTime - dayStart) / (dayEnd - dayStart)) * 100)));
  const phase = currentTime < 12 * 60 ? "Morning" : currentTime < 17 * 60 ? "Afternoon" : "Evening";

  const statusMeta = {
    "on-time": { label: "On time", cls: "status-good" },
    early: { label: "Ahead of schedule", cls: "status-good" },
    behind: { label: "Behind schedule", cls: "status-bad" },
  }[status];

  return (
    <div className="screen">
      <div className="dash-header">
        <div>
          <div className="eyebrow">{ITINERARY.trip.date} · {ITINERARY.trip.timezone}</div>
          <h1>{ITINERARY.trip.title}</h1>
        </div>
        <div className="clock-chip"><Clock size={13} /> {fmt(currentTime)}</div>
      </div>

      {notifications.length > 0 && (
        <div className="notif-stack">
          {notifications.slice(0, 2).map((n) => (
            <div key={n.id} className={`notif notif-${n.tone}`}>
              <n.icon size={15} /> <span>{n.text}</span>
            </div>
          ))}
        </div>
      )}

      <Glass className="boarding-pass">
        <div className="bp-row">
          <div className="bp-col">
            <div className="bp-label">Where you are</div>
            <div className="bp-value">{current ? current.area : "In transit"}</div>
          </div>
          <div className="bp-divider" />
          <div className="bp-col">
            <div className="bp-label">Status</div>
            <div className={`bp-value ${statusMeta.cls}`}>{statusMeta.label}</div>
          </div>
        </div>
        <div className="bp-perforation" />
        <div className="bp-row">
          <div className="bp-col">
            <div className="bp-label">currentTime</div>
            <div className="bp-activity">{current ? current.title : "Free time"}</div>
            {current && <div className="bp-sub">Ends in <Countdown minutes={current.end - currentTime} /></div>}
          </div>
          <ArrowRight size={16} className="bp-arrow" />
          <div className="bp-col">
            <div className="bp-label">Next</div>
            <div className="bp-activity">{next ? next.title : "Day complete"}</div>
            {next && (
              <div className="bp-sub">
                <Footprints size={12} /> {next.walkToNext ?? "—"}m walk · starts <Countdown minutes={next.start - currentTime} />
              </div>
            )}
          </div>
        </div>
      </Glass>

      <div className="progress-grid">
        <Glass className="progress-card">
          <div className="progress-label">Today's progress</div>
          <div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: `${dayPct}%` }} /></div>
          <div className="progress-footer"><span>{phase}</span><span>{dayPct}%</span></div>
        </Glass>
        <Glass className="progress-card">
          <div className="progress-label">Activities done</div>
          <div className="progress-bar-track"><div className="progress-bar-fill fill-teal" style={{ width: `${pct}%` }} /></div>
          <div className="progress-footer"><span>{done} / {total}</span><span>{pct}%</span></div>
        </Glass>
      </div>

      {group && (
        <Glass className="group-card">
          <div className="group-top"><Users size={16} /> Group of {group.size}</div>
          {group.splitRecommended && (
            <div className="group-note">
              <Sparkles size={13} /> {group.note}
              <div className="group-meta">Meet at <b>{group.meetingLocation}</b> · {fmt(group.meetingTime)}</div>
            </div>
          )}
        </Glass>
      )}

      {next && (
        <Glass className="uphext-card" onClick={() => onOpen(next)}>
          <div className="upnext-label">Tap for details on your next stop</div>
          <div className="upnext-title">{next.title} <ChevronRight size={16} /></div>
        </Glass>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline screen
// ---------------------------------------------------------------------------
function TimelineScreen({ activities, freeTimeSlots, currentTime, completed, onToggleComplete, onOpen }) {
  const items = [];
  activities.forEach((a) => {
    items.push({ kind: "activity", data: a, sortKey: a.start });
    const slot = freeTimeSlots.find((f) => f.afterId === a.id);
    if (slot) items.push({ kind: "freetime", data: slot, sortKey: slot.start + 0.5 });
  });
  items.sort((a, b) => a.sortKey - b.sortKey);

  return (
    <div className="screen">
      <h2 className="screen-title">Timeline</h2>
      <div className="timeline">
        {items.map((item, i) =>
          item.kind === "activity" ? (
            <ActivityCard
              key={item.data.id}
              activity={item.data}
              currentTime={currentTime}
              completed={completed}
              onToggleComplete={onToggleComplete}
              onOpen={onOpen}
              isLast={i === items.length - 1}
            />
          ) : (
            <FreeTimeCard key={`ft-${i}`} slot={item.data} />
          )
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Route screen — connected nodes, works for any number of stops
// ---------------------------------------------------------------------------
function RouteScreen({ activities, currentTime, completed }) {
  // collapse consecutive duplicate areas into route nodes
  const nodes = [];
  activities.forEach((a) => {
    if (nodes.length === 0 || nodes[nodes.length - 1].area !== a.area) {
      nodes.push({ area: a.area, activities: [a] });
    } else {
      nodes[nodes.length - 1].activities.push(a);
    }
  });

  const completedNodeCount = nodes.filter((n) => n.activities.every((a) => completed.has(a.id))).length;
  const activeIndex = nodes.findIndex((n) => n.activities.some((a) => currentTime >= a.start && currentTime < a.end));

  return (
    <div className="screen">
      <h2 className="screen-title">Route</h2>
      <p className="screen-sub">{nodes.length} stops today · works the same whether you have 3 or 30</p>
      <div className="route-wrap">
        <div className="route-line-track">
          <div
            className="route-line-fill"
            style={{ height: `${(Math.max(completedNodeCount, activeIndex >= 0 ? activeIndex : 0) / (nodes.length - 1 || 1)) * 100}%` }}
          />
        </div>
        <div className="route-nodes">
          {nodes.map((n, i) => {
            const isDone = n.activities.every((a) => completed.has(a.id));
            const isActive = i === activeIndex;
            return (
              <div className={`route-node ${isDone ? "done" : ""} ${isActive ? "active" : ""}`} key={i}>
                <div className="route-dot">{isDone ? <CheckCircle2 size={14} /> : i + 1}</div>
                <div className="route-info">
                  <div className="route-area">{n.area}</div>
                  <div className="route-acts">{n.activities.map((a) => a.title).join(" · ")}</div>
                  <div className="route-time">{fmt(n.activities[0].start)} – {fmt(n.activities[n.activities.length - 1].end)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reservations screen
// ---------------------------------------------------------------------------
function ReservationsScreen({ activities, currentTime, completed, onOpen }) {
  const reservations = activities.filter((a) => a.isReservation);
  return (
    <div className="screen">
      <h2 className="screen-title">Reservations</h2>
      <p className="screen-sub">{reservations.length} fixed Express Pass windows today — these can't move</p>
      <div className="res-list">
        {reservations.map((r) => {
          const status = getStatus(r, currentTime, completed);
          return (
            <Glass key={r.id} className={`res-card ${status === "current" ? "card-current" : ""}`} onClick={() => onOpen(r)}>
              <div className="res-lock"><Lock size={16} /></div>
              <div className="res-body">
                <div className="res-time">{fmt(r.start)} – {fmt(r.end)}</div>
                <div className="res-title">{r.title}</div>
                <div className="res-area"><MapPin size={11} /> {r.area}</div>
              </div>
              <div className="res-right">
                <StatusPill status={status} />
                {status === "upcoming" && <Countdown minutes={r.start - currentTime} />}
              </div>
            </Glass>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Explore screen — recommendations from data
// ---------------------------------------------------------------------------
function ExploreScreen({ freeTimeSlots, activities }) {
  const optional = activities.filter((a) => a.optional);
  return (
    <div className="screen">
      <h2 className="screen-title">Explore</h2>
      <p className="screen-sub">Recommendations pulled from your itinerary's free-time data</p>
      {freeTimeSlots.map((slot, i) => (
        <Glass key={i} className="explore-block">
          <div className="explore-time">{fmt(slot.start)} – {fmt(slot.end)}</div>
          <div className="suggestion-grid">
            {slot.suggestions.map((s, j) => (
              <div className="suggestion-chip" key={j}>
                <Sparkles size={14} />
                <div><div className="suggestion-title">{s.title}</div><div className="suggestion-desc">{s.description}</div></div>
              </div>
            ))}
          </div>
        </Glass>
      ))}
      {optional.length > 0 && (
        <Glass className="explore-block">
          <div className="explore-time">Optional if time allows</div>
          <div className="suggestion-grid">
            {optional.map((a) => (
              <div className="suggestion-chip" key={a.id}>
                <TicketCheck size={14} />
                <div><div className="suggestion-title">{a.title}</div><div className="suggestion-desc">{a.notes}</div></div>
              </div>
            ))}
          </div>
        </Glass>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings screen — includes the demo clock control
// ---------------------------------------------------------------------------
function SettingsScreen({
  clockMode,
  setClockMode,
  now,
  setNow,
  playing,
  setPlaying,
  theme,
  setTheme,
  dayStart,
  dayEnd,
  speed,
  setSpeed,
}) {
  return (
    <div className="screen">
      <h2 className="screen-title">Settings</h2>

      {/* Appearance */}
      <Glass className="settings-card">
        <div className="settings-row">
          <span>Appearance</span>
          <button
            className="theme-toggle"
            onClick={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
          >
            {theme === "dark" ? (
              <Moon size={14} />
            ) : (
              <Sun size={14} />
            )}
            {theme === "dark" ? "Dark" : "Light"}
          </button>
        </div>
      </Glass>

      {/* Clock Mode */}
      <Glass className="settings-card">
        <div className="settings-row">
          <span>Clock Mode</span>

          <select
            value={clockMode}
            onChange={(e) => setClockMode(e.target.value)}
            className="theme-toggle"
          >
            <option value="live">
              🇯🇵 Live Japan Time
            </option>

            <option value="demo">
              🎮 Demo Mode
            </option>
          </select>
        </div>
      </Glass>

      {/* Demo Clock */}
      {clockMode === "demo" && (
        <Glass className="settings-card">
          <div className="settings-row">
            <span>Demo Clock</span>

            <button
              className="theme-toggle"
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
              {playing ? "Pause" : "Auto-advance"}
            </button>
          </div>

          <div className="demo-time">
            {fmt(now)}
          </div>

          <input
            type="range"
            min={dayStart}
            max={dayEnd}
            value={now}
            onChange={(e) => setNow(Number(e.target.value))}
            className="demo-slider"
          />

          <div
            className="settings-row"
            style={{ marginTop: 12 }}
          >
            <span>Playback speed</span>

            <div className="speed-toggle">
              {[1, 4, 12].map((s) => (
                <button
                  key={s}
                  className={
                    speed === s
                      ? "speed-btn active"
                      : "speed-btn"
                  }
                  onClick={() => setSpeed(s)}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>

          <p className="settings-hint">
            Drag the slider or enable auto-advance to
            simulate the itinerary.
          </p>
        </Glass>
      )}

      {/* Live Clock */}
      {clockMode === "live" && (
        <Glass className="settings-card">
          <div className="settings-row">
            <span>Live Japan Time</span>
            <span className="muted">🇯🇵 JST</span>
          </div>

          <div className="demo-time">
            {fmt(now)}
          </div>

          <p className="settings-hint">
            Automatically synchronized with the current
            time in Japan.
          </p>
        </Glass>
      )}

      {/* Trip Info */}
      <Glass className="settings-card">
        <div className="settings-row">
          <span>Trip</span>
          <span className="muted">
            {ITINERARY.trip.title}
          </span>
        </div>

        <div className="settings-row">
          <span>Group size</span>
          <span className="muted">
            {ITINERARY.group.size} guests
          </span>
        </div>

        <div className="settings-row">
          <span>Timezone</span>
          <span className="muted">
            {ITINERARY.trip.timezone}
          </span>
        </div>
      </Glass>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail Modal
// ---------------------------------------------------------------------------
function DetailModal({ activity, onClose }) {
  if (!activity) return null;
  const meta = CATEGORY_META[activity.category] || CATEGORY_META.ride;
  const Icon = meta.icon;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-hero"><Icon size={30} /></div>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <div className="modal-body">
          {activity.isReservation && <div className="badge-priority modal-badge"><Lock size={11} /> Fixed reservation</div>}
          <h3>{activity.title}</h3>
          <p className="modal-subtitle">{activity.subtitle}</p>
          <div className="modal-meta-grid">
            <div><Clock size={13} /> {fmt(activity.start)} – {fmt(activity.end)}</div>
            <div><MapPin size={13} /> {activity.area}</div>
            <div><TicketCheck size={13} /> {activity.queueType}</div>
            <div><Footprints size={13} /> {activity.walkToNext ?? "—"} min to next</div>
          </div>
          <p className="modal-desc">{activity.description}</p>
          {activity.notes && <div className="modal-note"><Bell size={13} /> {activity.notes}</div>}
          {activity.tips?.length > 0 && (
            <div className="modal-section"><h5>Tips</h5><ul>{activity.tips.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
          )}
          {activity.requirements?.length > 0 && (
            <div className="modal-section"><h5>Requirements</h5><ul>{activity.requirements.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
          )}
          {activity.nearby?.length > 0 && (
            <div className="modal-section"><h5>Nearby</h5><div className="nearby-chips">{activity.nearby.map((t, i) => <span key={i}>{t}</span>)}</div></div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bottom Navigation
// ---------------------------------------------------------------------------
function BottomNav({ tab, setTab }) {
  const items = [
    { id: "home", label: "Home", icon: Home },
    { id: "timeline", label: "Timeline", icon: ListTree },
    { id: "route", label: "Route", icon: RouteIcon },
    { id: "reservations", label: "Saved", icon: BookmarkCheck },
    { id: "explore", label: "Explore", icon: Compass },
    { id: "settings", label: "Settings", icon: Settings },
  ];
  return (
    <div className="bottom-nav">
      {items.map((it) => (
        <button key={it.id} className={`nav-btn ${tab === it.id ? "active" : ""}`} onClick={() => setTab(it.id)}>
          <it.icon size={19} />
          <span>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root App
// ---------------------------------------------------------------------------
export default function ItineraryCompanion() {
  const activities = ITINERARY.activities;
  const dayStart = activities[0].start - 30;
  const dayEnd = activities[activities.length - 1].end + 15;

const [clockMode, setClockMode] = useState("live"); // "live" | "demo"

const [currentTime, setNow] = useState(0);

const [demoNow, setDemoNow] = useState(
  activities[2].start - 10
);

const [playing, setPlaying] = useState(false);
const [speed, setSpeed] = useState(4);
  const [tab, setTab] = useState("home");
  const [completed, setCompleted] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [theme, setTheme] = useState("dark");
  const rafRef = useRef(null);

useEffect(() => {
  if (clockMode !== "live") return;

  const updateJapanClock = () => {
    const japan = new Date(
      new Date().toLocaleString("en-US", {
        timeZone: "Asia/Tokyo",
      })
    );

    setNow(
      japan.getHours() * 60 +
      japan.getMinutes()
    );
  };

  updateJapanClock();

  const id = setInterval(updateJapanClock, 1000);

  return () => clearInterval(id);

}, [clockMode]);

useEffect(() => {

  if (clockMode !== "demo") return;

  if (!playing) return;

  const id = setInterval(() => {

    setDemoNow((n) =>
      n + speed >= dayEnd
        ? dayStart
        : n + speed
    );

  },700);

  return () => clearInterval(id);

}, [clockMode, playing, speed, dayEnd, dayStart]);

const currentTime =
  clockMode === "live"
    ? currentTime
    : demoNow;

  const notifications = useMemo(() => computeNotifications(activities, currentTime, completed), [currentTime, completed]);

  const toggleComplete = (id) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="app-root" data-theme={theme}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

        .app-root {
          --bg: #0A0D13; --bg-grad-a: #0D1220; --bg-grad-b: #120A16;
          --surface: rgba(255,255,255,0.055); --surface-strong: rgba(255,255,255,0.09);
          --border: rgba(255,255,255,0.10); --border-strong: rgba(255,255,255,0.18);
          --text: #F3F1EC; --text-dim: rgba(243,241,236,0.62); --text-faint: rgba(243,241,236,0.38);
          --coral: #FF6B4A; --coral-soft: rgba(255,107,74,0.16);
          --teal: #2FD4C0; --teal-soft: rgba(47,212,192,0.14);
          --gold: #F2B441; --gold-soft: rgba(242,180,65,0.14);
          --danger: #FF5C6C; --danger-soft: rgba(255,92,108,0.14);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: radial-gradient(circle at 15% 0%, var(--bg-grad-a), var(--bg) 45%), radial-gradient(circle at 90% 100%, var(--bg-grad-b), var(--bg) 55%);
          color: var(--text);
          max-width: 430px; margin: 0 auto; min-height: 100vh;
          position: relative; padding-bottom: 86px;
          -webkit-font-smoothing: antialiased;
        }
        .app-root[data-theme="light"] {
          --bg: #F5F3EE; --bg-grad-a: #FBF9F4; --bg-grad-b: #F0ECE4;
          --surface: rgba(20,20,25,0.045); --surface-strong: rgba(20,20,25,0.07);
          --border: rgba(20,20,25,0.09); --border-strong: rgba(20,20,25,0.16);
          --text: #16181D; --text-dim: rgba(22,24,29,0.62); --text-faint: rgba(22,24,29,0.4);
        }
        .app-root * { box-sizing: border-box; }
        h1,h2,h3,h4,h5 { font-family: 'Space Grotesk', 'Inter', sans-serif; margin: 0; letter-spacing: -0.01em; }
        .screen { padding: 18px 16px 8px; animation: fadeIn .35s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .screen-title { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
        .screen-sub { color: var(--text-dim); font-size: 12.5px; margin: 0 0 14px; }

        .glass {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.18);
        }

        /* ---- Dashboard ---- */
        .dash-header { display:flex; justify-content:space-between; align-items:flex-start; padding: 18px 16px 6px; }
        .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--text-faint); margin-bottom: 3px; }
        .dash-header h1 { font-size: 24px; }
        .clock-chip { display:flex; align-items:center; gap:6px; background: var(--surface-strong); border:1px solid var(--border); padding: 7px 11px; border-radius: 999px; font-family:'IBM Plex Mono',monospace; font-size: 12.5px; font-weight:600; }

        .notif-stack { display:flex; flex-direction:column; gap:8px; padding: 4px 16px 12px; }
        .notif { display:flex; align-items:center; gap:8px; padding: 10px 12px; border-radius: 14px; font-size: 12.5px; font-weight: 500; border:1px solid var(--border); animation: slideIn .3s ease; }
        @keyframes slideIn { from { opacity:0; transform: translateX(-8px); } to { opacity:1; transform:none; } }
        .notif-gold { background: var(--gold-soft); color: var(--gold); border-color: rgba(242,180,65,0.3); }
        .notif-teal { background: var(--teal-soft); color: var(--teal); border-color: rgba(47,212,192,0.3); }
        .notif-coral { background: var(--coral-soft); color: var(--coral); border-color: rgba(255,107,74,0.3); }
        .notif-danger { background: var(--danger-soft); color: var(--danger); border-color: rgba(255,92,108,0.3); }

        .boarding-pass { margin: 8px 16px 14px; padding: 18px; position: relative; }
        .bp-row { display:flex; align-items:center; gap: 12px; }
        .bp-col { flex:1; min-width:0; }
        .bp-label { font-size: 10.5px; text-transform:uppercase; letter-spacing:.07em; color: var(--text-faint); margin-bottom:3px; }
        .bp-value { font-weight: 700; font-size: 14.5px; }
        .status-good { color: var(--teal); }
        .status-bad { color: var(--danger); }
        .bp-divider { width:1px; align-self:stretch; background: var(--border); }
        .bp-perforation { height:1px; margin: 14px -18px; background: repeating-linear-gradient(90deg, var(--border) 0 6px, transparent 6px 12px); }
        .bp-activity { font-weight: 700; font-size: 15.5px; font-family:'Space Grotesk',sans-serif; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .bp-sub { font-size: 11.5px; color: var(--text-dim); margin-top: 3px; display:flex; align-items:center; gap:4px; }
        .bp-arrow { color: var(--text-faint); flex-shrink:0; }

        .countdown { font-family:'IBM Plex Mono',monospace; font-weight:600; font-size:12.5px; letter-spacing: .02em; }
        .countdown i { font-style:normal; font-size:10px; opacity:.6; margin-right:4px; }

        .progress-grid { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 0 16px 14px; }
        .progress-card { padding: 13px; }
        .progress-label { font-size:11.5px; color: var(--text-dim); margin-bottom:8px; }
        .progress-bar-track { height:6px; border-radius:999px; background: var(--surface-strong); overflow:hidden; }
        .progress-bar-fill { height:100%; background: linear-gradient(90deg, var(--coral), var(--gold)); border-radius:999px; transition: width .5s ease; }
        .fill-teal { background: linear-gradient(90deg, var(--teal), #6EE7DD); }
        .progress-footer { display:flex; justify-content:space-between; font-size:11px; color: var(--text-faint); margin-top:6px; font-family:'IBM Plex Mono',monospace; }

        .group-card { margin: 0 16px 14px; padding: 14px; }
        .group-top { display:flex; align-items:center; gap:7px; font-weight:700; font-size:13.5px; margin-bottom:8px; }
        .group-note { font-size:12px; color: var(--text-dim); display:flex; gap:6px; align-items:flex-start; line-height:1.5; }
        .group-meta { margin-top:6px; font-size:11.5px; color: var(--text-faint); }
        .group-meta b { color: var(--text); }

        .uphext-card { margin: 0 16px 16px; padding: 14px 16px; cursor:pointer; transition: transform .15s ease; }
        .uphext-card:active { transform: scale(0.98); }
        .upnext-label { font-size:11px; color: var(--text-faint); margin-bottom:4px; }
        .upnext-title { display:flex; align-items:center; justify-content:space-between; font-weight:700; font-size:14.5px; font-family:'Space Grotesk',sans-serif; }

        /* ---- Timeline ---- */
        .timeline { display:flex; flex-direction:column; }
        .timeline-row { display:flex; gap:12px; }
        .timeline-rail { display:flex; flex-direction:column; align-items:center; width: 26px; flex-shrink:0; }
        .node { width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; background: var(--surface-strong); border:2px solid var(--border-strong); color: var(--text-dim); flex-shrink:0; }
        .node.current { background: var(--coral); border-color: var(--coral); color:#1a0d08; box-shadow: 0 0 0 5px var(--coral-soft); animation: pulse 2s infinite; }
        .node.completed { background: var(--teal); border-color: var(--teal); color:#062421; }
        .node.freetime { background: var(--gold); border-color: var(--gold); color:#2b1c02; }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 5px var(--coral-soft); } 50% { box-shadow: 0 0 0 9px transparent; } }
        .rail-line { width:2px; flex:1; min-height: 24px; background: var(--border); margin: 2px 0; }
        .rail-done { background: var(--teal); }

        .activity-card { flex:1; padding: 13px 14px; margin-bottom: 14px; cursor:pointer; transition: transform .15s ease, border-color .2s; }
        .activity-card:active { transform: scale(0.98); }
        .card-current { border-color: rgba(255,107,74,0.5); box-shadow: 0 0 0 1px rgba(255,107,74,0.25), 0 8px 28px rgba(0,0,0,0.2); }
        .card-reservation { border-image: none; border-color: rgba(242,180,65,0.35); }
        .card-optional { opacity: 0.82; border-style: dashed; }
        .row-fade .activity-card { opacity: 0.45; }
        .row-fade .card-title-row h4 { text-decoration: line-through; text-decoration-color: var(--text-faint); }

        .reminder-banner { display:flex; align-items:center; gap:6px; background: var(--gold-soft); color: var(--gold); font-size:11px; font-weight:600; padding: 5px 9px; border-radius: 8px; margin-bottom:9px; width: fit-content; }
        .card-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
        .card-time { font-family:'IBM Plex Mono',monospace; font-size:11.5px; color: var(--text-dim); }
        .pill { font-size: 10px; font-weight:700; padding: 3px 9px; border-radius:999px; text-transform:uppercase; letter-spacing:.04em; }
        .pill-completed { background: var(--teal-soft); color: var(--teal); }
        .pill-current { background: var(--coral-soft); color: var(--coral); }
        .pill-upcoming { background: var(--surface-strong); color: var(--text-dim); }
        .pill-missed { background: var(--danger-soft); color: var(--danger); }
        .card-title-row { display:flex; align-items:center; gap:7px; flex-wrap:wrap; }
        .card-title-row h4 { font-size:15.5px; font-weight:700; }
        .badge-priority { display:flex; align-items:center; gap:3px; background: var(--gold-soft); color: var(--gold); font-size:9.5px; font-weight:700; padding:2px 7px; border-radius:999px; text-transform:uppercase; }
        .badge-optional { background: var(--surface-strong); color: var(--text-faint); font-size:9.5px; font-weight:700; padding:2px 7px; border-radius:999px; text-transform:uppercase; }
        .card-subtitle { font-size:12.5px; color: var(--text-dim); margin: 3px 0 8px; }
        .card-meta-row { display:flex; gap:12px; flex-wrap:wrap; font-size:11.5px; color: var(--text-dim); }
        .card-meta-row span { display:flex; align-items:center; gap:4px; }
        .queue-tag { background: var(--surface-strong); padding:2px 8px; border-radius:999px; font-weight:600; }
        .live-row { display:flex; align-items:center; gap:6px; margin-top:10px; font-size:12px; font-weight:600; color: var(--coral); }
        .live-row.gold { color: var(--gold); }
        .complete-btn { display:flex; align-items:center; gap:6px; margin-top:11px; background: var(--surface-strong); border:1px solid var(--border); color: var(--text-dim); font-size:11.5px; font-weight:600; padding:7px 11px; border-radius:10px; cursor:pointer; transition: all .15s; }
        .complete-btn.done { background: var(--teal-soft); color: var(--teal); border-color: rgba(47,212,192,0.35); }
        .complete-btn:hover { border-color: var(--border-strong); }

        .freetime-card { border-style: dashed; border-color: rgba(242,180,65,0.35); }
        .freetime-heading { font-size:15px; margin-bottom:10px; }
        .suggestion-grid { display:flex; flex-direction:column; gap:8px; }
        .suggestion-chip { display:flex; gap:9px; align-items:flex-start; background: var(--surface-strong); padding:9px 10px; border-radius:12px; }
        .suggestion-title { font-size:12.5px; font-weight:700; }
        .suggestion-desc { font-size:11.5px; color: var(--text-dim); margin-top:1px; }

        /* ---- Route ---- */
        .route-wrap { position:relative; padding-left: 8px; }
        .route-line-track { position:absolute; left: 23px; top: 14px; bottom: 14px; width:3px; background: var(--surface-strong); border-radius:99px; }
        .route-line-fill { width:100%; background: linear-gradient(180deg, var(--teal), var(--coral)); border-radius:99px; transition: height .6s ease; }
        .route-nodes { display:flex; flex-direction:column; gap: 22px; position:relative; }
        .route-node { display:flex; gap:14px; align-items:flex-start; }
        .route-dot { width:30px; height:30px; border-radius:50%; background: var(--surface-strong); border:2px solid var(--border-strong); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12.5px; z-index:1; flex-shrink:0; }
        .route-node.done .route-dot { background: var(--teal); border-color: var(--teal); color:#062421; }
        .route-node.active .route-dot { background: var(--coral); border-color: var(--coral); color:#1a0d08; animation: pulse 2s infinite; }
        .route-area { font-weight:700; font-size:14.5px; font-family:'Space Grotesk',sans-serif; }
        .route-acts { font-size:12px; color: var(--text-dim); margin-top:2px; }
        .route-time { font-size:11px; color: var(--text-faint); margin-top:3px; font-family:'IBM Plex Mono',monospace; }

        /* ---- Reservations ---- */
        .res-list { display:flex; flex-direction:column; gap:10px; }
        .res-card { display:flex; align-items:center; gap:12px; padding:13px 14px; cursor:pointer; border-color: rgba(242,180,65,0.25); }
        .res-lock { width:34px; height:34px; border-radius:10px; background: var(--gold-soft); color: var(--gold); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .res-body { flex:1; min-width:0; }
        .res-time { font-family:'IBM Plex Mono',monospace; font-size:11px; color: var(--text-dim); }
        .res-title { font-weight:700; font-size:14px; margin:2px 0; }
        .res-area { font-size:11.5px; color: var(--text-dim); display:flex; align-items:center; gap:4px; }
        .res-right { display:flex; flex-direction:column; align-items:flex-end; gap:5px; }

        /* ---- Explore ---- */
        .explore-block { padding:14px; margin-bottom:12px; }
        .explore-time { font-weight:700; font-size:13px; margin-bottom:10px; color: var(--gold); }

        /* ---- Settings ---- */
        .settings-card { padding:15px; margin-bottom:12px; }
        .settings-row { display:flex; justify-content:space-between; align-items:center; font-size:13.5px; font-weight:600; }
        .muted { color: var(--text-dim); font-weight:500; }
        .theme-toggle { display:flex; align-items:center; gap:6px; background: var(--surface-strong); border:1px solid var(--border); padding:7px 12px; border-radius:999px; font-size:12px; font-weight:600; color: var(--text); cursor:pointer; }
        .demo-time { font-family:'IBM Plex Mono',monospace; font-size:22px; font-weight:600; text-align:center; margin: 14px 0 8px; }
        .demo-slider { width:100%; accent-color: var(--coral); }
        .settings-hint { font-size:11.5px; color: var(--text-faint); line-height:1.5; margin-top:10px; }
        .speed-toggle { display:flex; gap:6px; }
        .speed-btn { background: var(--surface-strong); border:1px solid var(--border); color: var(--text-dim); font-size:11.5px; font-weight:700; padding:5px 10px; border-radius:8px; cursor:pointer; }
        .speed-btn.active { background: var(--coral); border-color: var(--coral); color:#1a0d08; }

        /* ---- Modal ---- */
        .modal-overlay { position:fixed; inset:0; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); display:flex; align-items:flex-end; z-index:50; animation: fadeIn .2s ease; max-width:430px; margin:0 auto; }
        .modal-sheet { background: var(--bg); border: 1px solid var(--border-strong); border-bottom:none; border-radius: 24px 24px 0 0; width:100%; max-height: 82vh; overflow-y:auto; position:relative; animation: slideUp .3s cubic-bezier(.2,.8,.2,1); }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .modal-handle { width:40px; height:4px; background: var(--border-strong); border-radius:99px; margin: 10px auto 0; }
        .modal-hero { height:90px; margin: 14px 16px 0; border-radius:16px; background: linear-gradient(135deg, var(--coral-soft), var(--teal-soft)); display:flex; align-items:center; justify-content:center; color: var(--coral); }
        .modal-close { position:absolute; top:14px; right:16px; width:32px; height:32px; border-radius:50%; background: var(--surface-strong); border:1px solid var(--border); color: var(--text); display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .modal-body { padding: 16px 18px 28px; }
        .modal-badge { margin-bottom:10px; }
        .modal-subtitle { color: var(--text-dim); font-size:13px; margin: 2px 0 14px; }
        .modal-meta-grid { display:grid; grid-template-columns: 1fr 1fr; gap:9px; margin-bottom:14px; }
        .modal-meta-grid div { display:flex; align-items:center; gap:6px; font-size:12px; color: var(--text-dim); background: var(--surface-strong); padding:8px 10px; border-radius:10px; }
        .modal-desc { font-size:13.5px; line-height:1.6; color: var(--text); margin-bottom:12px; }
        .modal-note { display:flex; gap:8px; background: var(--gold-soft); color: var(--gold); font-size:12.5px; padding:10px 12px; border-radius:12px; margin-bottom:14px; line-height:1.5; }
        .modal-section { margin-bottom:14px; }
        .modal-section h5 { font-size:12px; text-transform:uppercase; letter-spacing:.05em; color: var(--text-faint); margin-bottom:7px; }
        .modal-section ul { margin:0; padding-left:18px; font-size:13px; line-height:1.6; color: var(--text-dim); }
        .nearby-chips { display:flex; flex-wrap:wrap; gap:7px; }
        .nearby-chips span { background: var(--surface-strong); padding:5px 10px; border-radius:999px; font-size:11.5px; }

        /* ---- Bottom nav ---- */
        .bottom-nav { position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:430px; display:flex; justify-content:space-around; padding: 8px 4px calc(10px + env(safe-area-inset-bottom)); background: rgba(10,13,19,0.72); backdrop-filter: blur(20px); border-top:1px solid var(--border); z-index:40; }
        .app-root[data-theme="light"] .bottom-nav { background: rgba(245,243,238,0.78); }
        .nav-btn { display:flex; flex-direction:column; align-items:center; gap:3px; background:none; border:none; color: var(--text-faint); font-size:9.5px; font-weight:600; padding:6px 8px; cursor:pointer; min-width: 52px; }
        .nav-btn.active { color: var(--coral); }
      `}</style>

      {tab === "home" && (
        <Dashboard activities={activities} currentTime={currentTime} completed={completed} group={ITINERARY.group} onOpen={setSelected} notifications={notifications} />
      )}
      {tab === "timeline" && (
        <TimelineScreen activities={activities} freeTimeSlots={ITINERARY.freeTimeSlots} currentTime={currentTime} completed={completed} onToggleComplete={toggleComplete} onOpen={setSelected} />
      )}
      {tab === "route" && <RouteScreen activities={activities} currentTime={currentTime} completed={completed} />}
      {tab === "reservations" && <ReservationsScreen activities={activities} currentTime={currentTime} completed={completed} onOpen={setSelected} />}
      {tab === "explore" && <ExploreScreen freeTimeSlots={ITINERARY.freeTimeSlots} activities={activities} />}
      {tab === "settings" && (
        <SettingsScreen currentTime={currentTime} setNow={setNow} playing={playing} setPlaying={setPlaying} theme={theme} setTheme={setTheme} dayStart={dayStart} dayEnd={dayEnd} speed={speed} setSpeed={setSpeed} />
      )}

      <BottomNav tab={tab} setTab={setTab} />
      <DetailModal activity={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
