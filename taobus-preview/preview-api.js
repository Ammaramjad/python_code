/* Isolated TaoBus preview store. No production host, mail, or scheduled jobs. */
(function (factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") api.install(window);
})(function () {
  const PERMS = ["schedule", "routes", "drivers", "leave", "reports", "ops", "users"];
  const DATA_KEY = "taobus-preview-data-v1";
  const SESSION_KEY = "taobus-preview-session";

  function seed() {
    const tripsA = [
      { group: 1, lane: 1, time: "06:40", driver: "林以安", plate: "桃-101" },
      { group: 2, lane: 1, time: "07:10", driver: "", plate: "桃-208" },
      { group: 3, lane: 1, time: "07:40", driver: "林以安", plate: "桃-101" },
      { group: 4, lane: 1, time: "08:20", driver: "", plate: "" },
      { group: 5, lane: 2, time: "09:00", driver: "黃子晴", plate: "桃-315" },
      { group: 6, lane: 2, time: "09:40", driver: "周承恩", plate: "桃-208" }
    ];
    const tripsB = [
      { group: 1, lane: 1, time: "07:00", driver: "陳柏宇", plate: "桃-208" },
      { group: 2, lane: 1, time: "08:00", driver: "陳柏宇", plate: "桃-208" },
      { group: 3, lane: 1, time: "12:10", driver: "", plate: "桃-101" },
      { group: 4, lane: 2, time: "13:00", driver: "黃子晴", plate: "桃-315" }
    ];
    return {
      rev: {},
      routes: [
        { name: "L115 大樹林", en: "L115 Dashi", trips: tripsA },
        { name: "L206 八德", en: "L206 Bade", trips: tripsB },
        { name: "L000 備用線", en: "L000 Spare", trips: [] }
      ],
      drivers: [
        { name: "林以安", number: "D-01", phone: "0900-000-001", type: "主要", types: ["主要"], slots: [{ runs: "L115 1–6" }], category: "A" },
        { name: "陳柏宇", number: "D-02", phone: "0900-000-002", type: "主要", types: ["主要"], slots: [], category: "A" },
        { name: "黃子晴", number: "D-03", phone: "0900-000-003", type: "代班", types: ["代班"], slots: [], category: "B" },
        { name: "周承恩", number: "D-04", phone: "0900-000-004", type: "支援", types: ["支援"], slots: [], category: "B" }
      ],
      leave: [
        { driver: "林以安", date: "2026-11-18", until: "2026-11-18", start: "06:00", end: "12:00", substitute: "黃子晴", note: "已安排上午代班", requestId: "lv-covered" },
        { driver: "陳柏宇", date: "2026-11-25", until: "2026-11-25", start: "07:00", end: "15:00", substitute: "", note: "待指派代班", requestId: "lv-open" }
      ],
      leaveRequests: [{ name: "周承恩", days: [3, 12, 27] }],
      requests: [
        { id: "lv-covered", driver: "林以安", date: "2026-11-18", until: "2026-11-18", reason: "家庭事務", status: "approved" },
        { id: "lv-open", driver: "陳柏宇", date: "2026-11-25", until: "2026-11-25", reason: "身體不適", status: "approved" },
        { id: "lv-pending", driver: "周承恩", date: "2026-11-27", until: "2026-11-28", reason: "進修", status: "pending" },
        { id: "lv-declined", driver: "黃子晴", date: "2026-11-02", until: "2026-11-02", reason: "私人行程（範例已拒絕）", status: "declined" }
      ],
      periods: [
        { route: 0, lane: 1, first: 1, last: 6, parity: "odd", driver: "陳柏宇", start: "2026-11-01", end: "2026-11-30", openOnly: true }
      ],
      shifts: [
        { date: "2026-11-25", route: 0, lane: 1, start: "06:00", end: "10:00", driver: "林以安", source: "原表", type: "" }
      ],
      tripLogs: [],
      vehicles: [{ id: "桃-101" }, { id: "桃-208" }, { id: "桃-315" }],
      days: {},
      notices: [],
      dateColors: {},
      sheets: [],
      fleetKm: [],
      reportExamples: [],
      interfaceLabels: [],
      interfaceLanguages: [],
      driverCategoryLabels: {},
      accountRoles: [],
      fares: {
        "2026-11-25": {
          "0-1-1-06:40": { fare: 860, passengers: 18, vehicle: "桃-101", start: "06:42", openingOdo: "12040.5" }
        }
      },
      users: [
        { name: "desk", role: "super", driver: "", permissions: PERMS.slice() },
        { name: "admin.chen", role: "admin", driver: "", permissions: PERMS.slice() },
        { name: "driver.lin", role: "driver", driver: "林以安", permissions: [] }
      ]
    };
  }

  function createMemory(initial) {
    return structuredClone(initial || seed());
  }

  function storage(win) {
    const read = () => {
      try {
        const raw = win.localStorage.getItem(DATA_KEY);
        if (!raw) return seed();
        const parsed = JSON.parse(raw);
        return parsed && parsed.routes ? parsed : seed();
      } catch {
        return seed();
      }
    };
    return {
      load: read,
      save(data) {
        win.localStorage.setItem(DATA_KEY, JSON.stringify(data));
      }
    };
  }

  function json(status, body) {
    return { status, body };
  }

  function overlaps(a, b) {
    return a.driver === b.driver && a.date <= (b.until || b.date) && b.date <= (a.until || a.date) && a.status !== "declined" && b.status !== "declined";
  }

  function handle(method, path, body, session, data) {
    const url = new URL(path, "http://preview.local");
    const route = url.pathname.replace(/\/$/, "") || "/";
    const user = session.user || null;

    if (route === "/api/login" && method === "POST") {
      const name = String(body?.name || "").trim();
      const password = String(body?.password || "");
      const found = data.users.find((row) => row.name === name);
      if (!found || password.length < 1) return json(401, { error: "unauthorized" });
      session.user = { name: found.name, role: found.role, driver: found.driver || "", permissions: found.permissions || [] };
      return json(200, { ok: true });
    }
    if (route === "/api/logout" && method === "POST") {
      session.user = null;
      return json(200, { ok: true });
    }
    if (route === "/api/me" && method === "GET") {
      return json(200, { languages: data.interfaceLanguages || [], ready: true, user: session.user, labels: data.interfaceLabels || [] });
    }
    if (!user) return json(401, { error: "unauthorized" });

    if (route === "/api/data" && method === "GET") {
      const { users, requests, fares, ...rest } = data;
      return json(200, { data: rest, rev: data.rev || {} });
    }
    if (route === "/api/save" && method === "POST") {
      const key = body?.key;
      if (!key || key === "users" || key === "requests" || key === "fares") return json(400, { error: "bad key" });
      const current = data.rev?.[key] || 0;
      if ((body.rev || 0) !== current) return json(409, { error: "conflict" });
      data[key] = body.value;
      data.rev = { ...(data.rev || {}), [key]: current + 1 };
      return json(200, { ok: true, rev: data.rev[key] });
    }
    if (route === "/api/users" && method === "GET") {
      return json(200, data.users.map(({ name, role, driver, permissions }) => ({ name, role, driver, permissions })));
    }
    if (route === "/api/users" && method === "POST") {
      const name = String(body?.name || "").trim();
      if (name.length < 2) return json(400, { error: "name" });
      const next = {
        name,
        role: body.role || "admin",
        driver: body.driver || "",
        permissions: Array.isArray(body.permissions) ? body.permissions : []
      };
      const index = data.users.findIndex((row) => row.name === name);
      if (index < 0) data.users.push(next);
      else data.users[index] = next;
      return json(200, data.users.map(({ name: n, role, driver, permissions }) => ({ name: n, role, driver, permissions })));
    }
    if (route === "/api/requests" && method === "GET") {
      const rows = user.role === "driver" ? data.requests.filter((row) => row.driver === user.driver) : data.requests;
      return json(200, rows);
    }
    if (route === "/api/requests" && method === "POST") {
      if (body?.id && body?.status) {
        const row = data.requests.find((item) => item.id === body.id);
        if (!row) return json(404, { error: "missing" });
        if (!["approved", "declined"].includes(body.status)) return json(400, { error: "status" });
        row.status = body.status;
        if (body.status === "approved" && !data.leave.some((item) => item.requestId === row.id)) {
          data.leave.push({
            requestId: row.id,
            driver: row.driver,
            date: row.date,
            until: row.until,
            start: "00:00",
            end: "24:00",
            substitute: "",
            note: row.reason
          });
          data.rev = { ...(data.rev || {}), leave: (data.rev?.leave || 0) + 1 };
        }
        return json(200, { ok: true });
      }
      const date = String(body?.date || "");
      const until = String(body?.until || "");
      const reason = String(body?.reason || "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{4}-\d{2}-\d{2}$/.test(until) || until < date || !reason) {
        return json(400, { error: "invalid" });
      }
      const draft = { driver: user.driver, date, until, status: "pending" };
      if (data.requests.some((row) => overlaps(row, draft))) return json(409, { error: "Duplicate leave request" });
      data.requests.push({ ...draft, id: "lv-" + Date.now().toString(36), reason });
      return json(200, data.requests.filter((row) => row.driver === user.driver));
    }
    if (route === "/api/driver-fares" && method === "GET") {
      const day = url.searchParams.get("day") || "";
      return json(200, fareRows(data, user, day));
    }
    if (route === "/api/driver-fares" && method === "POST") {
      const day = String(body?.day || "");
      const key = String(body?.key || "");
      if (!day || !key) return json(400, { error: "invalid" });
      data.fares = data.fares || {};
      data.fares[day] = data.fares[day] || {};
      data.fares[day][key] = {
        fare: Number(body.fare),
        passengers: Number(body.passengers),
        vehicle: body.vehicle || "",
        start: body.start || "",
        openingOdo: body.openingOdo || ""
      };
      return json(200, { ok: true });
    }
    if (route === "/api/my-next-shift" && method === "GET") {
      const rows = fareRows(data, user, "2026-11-25");
      const next = rows[0];
      return json(200, next ? { date: "2026-11-25", time: next.time, route: next.label, group: next.group } : null);
    }
    if (route === "/api/schedule-vehicles" && method === "GET") {
      return json(200, data.vehicles.map((item) => item.id));
    }
    if (route === "/api/live-fleet" && method === "GET") {
      return json(200, {
        fetchedAt: new Date().toISOString(),
        vehicles: [
          { plate: "桃-101", status: "上線", latitude: 24.993, longitude: 121.301, updated: "預覽" },
          { plate: "桃-208", status: "離線", latitude: 25.01, longitude: 121.28, updated: "預覽" }
        ],
        assignments: [
          { plate: "桃-101", driver: "林以安", route: "L115 大樹林", english: "L115 Dashi" },
          { plate: "桃-208", driver: "陳柏宇", route: "L206 八德", english: "L206 Bade" }
        ]
      });
    }
    if (route === "/api/fleet-camera") {
      return { status: 200, body: null, png: true };
    }
    return json(404, { error: "not found" });
  }

  function fareRows(data, user, day) {
    const saved = (data.fares && data.fares[day]) || {};
    const rows = [];
    data.routes.forEach((route, routeIndex) => {
      (route.trips || []).forEach((trip) => {
        if (trip.driver !== user.driver) return;
        const key = [routeIndex, trip.lane, trip.group, trip.time].join("-");
        rows.push({
          key,
          route: String(routeIndex),
          lane: String(trip.lane),
          group: trip.group,
          time: trip.time,
          label: route.name,
          vehicles: data.vehicles.map((item) => item.id),
          ...(saved[key] || {})
        });
      });
    });
    return rows.sort((a, b) => a.time.localeCompare(b.time));
  }

  function install(win) {
    if (win.__taobusPreview) return;
    win.__taobusPreview = true;
    const box = storage(win);
    const session = {
      get user() {
        try { return JSON.parse(win.sessionStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
      },
      set user(value) {
        if (!value) win.sessionStorage.removeItem(SESSION_KEY);
        else win.sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
      }
    };
    const original = win.fetch.bind(win);
    win.fetch = async (input, init = {}) => {
      const raw = typeof input === "string" ? input : input.url;
      const url = new URL(raw, win.location.href);
      if (url.origin !== win.location.origin || !url.pathname.startsWith("/api/")) return original(input, init);
      const data = box.load();
      let body = null;
      if (init.body) {
        try { body = JSON.parse(init.body); } catch { body = null; }
      }
      const result = handle((init.method || "GET").toUpperCase(), url.pathname + url.search, body, session, data);
      box.save(data);
      if (result.png) {
        const bytes = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));
        return new Response(bytes, { status: 200, headers: { "Content-Type": "image/png" } });
      }
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      });
    };
  }

  return { install, handle, createMemory, seed };
});
