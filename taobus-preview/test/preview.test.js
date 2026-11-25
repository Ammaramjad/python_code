const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { handle, createMemory } = require("../preview-api");

function login(data, name) {
  const session = { user: null };
  const response = handle("POST", "/api/login", { name, password: "preview" }, session, data);
  assert.equal(response.status, 200);
  return session;
}

test("dispatcher assigns a run and the assignment survives reload", () => {
  const data = createMemory();
  const session = login(data, "desk");
  const loaded = handle("GET", "/api/data", null, session, data).body;
  const day = "2026-11-26";
  const trips = loaded.data.routes[0].trips.map((trip) => ({ ...trip }));
  trips[1] = { ...trips[1], driver: "周承恩" };
  const saved = handle("POST", "/api/save", { key: "days", value: { [day]: { 0: trips } }, rev: 0 }, session, data);
  assert.equal(saved.status, 200);
  const again = handle("GET", "/api/data", null, session, data).body;
  assert.equal(again.data.days[day][0][1].driver, "周承恩");
  const stale = handle("POST", "/api/save", { key: "days", value: {}, rev: 0 }, session, data);
  assert.equal(stale.status, 409);
});

test("driver request, administrator approval, and substitute record", () => {
  const data = createMemory();
  const driver = login(data, "driver.lin");
  const created = handle("POST", "/api/requests", { date: "2026-12-02", until: "2026-12-03", reason: "預覽休假" }, driver, data);
  assert.equal(created.status, 200);
  assert.ok(created.body.some((row) => row.reason === "預覽休假" && row.status === "pending"));
  const duplicate = handle("POST", "/api/requests", { date: "2026-12-03", until: "2026-12-04", reason: "重疊" }, driver, data);
  assert.equal(duplicate.status, 409);
  const admin = login(data, "admin.chen");
  const pending = handle("GET", "/api/requests", null, admin, data).body.find((row) => row.reason === "預覽休假");
  const decision = handle("POST", "/api/requests", { id: pending.id, status: "approved" }, admin, data);
  assert.equal(decision.status, 200);
  const desk = handle("GET", "/api/data", null, admin, data).body;
  const cover = desk.data.leave.find((row) => row.requestId === pending.id);
  assert.equal(cover.driver, "林以安");
  assert.equal(cover.substitute, "");
  const covered = handle("POST", "/api/save", {
    key: "leave",
    value: desk.data.leave.map((row) => row.requestId === pending.id ? { ...row, substitute: "黃子晴" } : row),
    rev: desk.rev.leave || 0
  }, admin, data);
  assert.equal(covered.status, 200);
  const after = handle("GET", "/api/data", null, admin, data).body;
  assert.equal(after.data.leave.find((row) => row.requestId === pending.id).substitute, "黃子晴");
});

test("fare report keeps Traditional Chinese route text", () => {
  const data = createMemory();
  const driver = login(data, "driver.lin");
  const rows = handle("GET", "/api/driver-fares?day=2026-11-25", null, driver, data).body;
  assert.ok(rows.some((row) => row.label.includes("大樹林")));
  const key = rows[0].key;
  const saved = handle("POST", "/api/driver-fares", { day: "2026-11-25", key, fare: 120, passengers: 4, vehicle: "桃-101", start: "06:40", openingOdo: "10" }, driver, data);
  assert.equal(saved.status, 200);
  const again = handle("GET", "/api/driver-fares?day=2026-11-25", null, driver, data).body.find((row) => row.key === key);
  assert.equal(again.fare, 120);
  assert.match(again.label, /大樹林/);
});

test("odd runs are marked in the fictional period rules", () => {
  const data = createMemory();
  const rule = data.periods[0];
  assert.equal(rule.parity, "odd");
  const odd = [1, 3, 5].every((group) => group >= rule.first && group <= rule.last && group % 2 === 1);
  const even = [2, 4, 6].every((group) => group % 2 === 0);
  assert.equal(odd && even, true);
});

test("client keeps the leave deep link and drops the duplicate month heading", () => {
  const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
  assert.match(html, /get\('view'\)/);
  assert.match(html, /get\('metric'\)/);
  assert.equal(html.includes("dateLabel(d,'month')"), false);
  assert.equal(html.includes("dateLabel(m,'month')"), false);
  assert.equal(html.includes("shineway"), false);
  assert.match(html, /period==='month'\?'':dateLabel/);
  assert.match(html, /aria-label="'\+t\('歷史月份','History month'\)/);
});

test("unknown account is rejected and does not open the desk", () => {
  const data = createMemory();
  const session = { user: null };
  const response = handle("POST", "/api/login", { name: "nobody", password: "nope" }, session, data);
  assert.equal(response.status, 401);
  assert.equal(session.user, null);
});
