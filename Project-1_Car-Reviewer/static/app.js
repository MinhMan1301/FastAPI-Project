/* =====================================================================
   app.js - runs in the BROWSER. It talks to FastAPI with fetch().

   Structure
     1. State & helpers
     2. API layer      one function per FastAPI endpoint (main.py)
     3. Rendering      draw cards and the detail dialog
     4. Actions        load / view / edit / save / delete
     5. Event wiring
     6. Boot

   Button -> endpoint map
     list of cars   GET    /cars?number=N   get_cars()
     View           GET    /cars/{id}       get_car_by_id()
     Add (form)     POST   /cars            add_car()
     Edit -> Update PUT    /cars/{id}       update_car()   (Edit prefills via GET)
     Delete         DELETE /cars/{id}       delete_car()
   ===================================================================== */

/* ---------- 1. State & helpers ---------- */
const $ = (s) => document.querySelector(s);
const state = { cars: [], editingId: null, warnedAboutIds: false };

// Escape text from the API before putting it into HTML (prevents XSS).
const esc = (t) => String(t).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const money = (n) => "$" + Number(n).toLocaleString("en-US");

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 3000);
}

/* ---------- 2. API layer ---------- */

// One place for fetch + error handling. Throws Error(message) on 4xx/5xx,
// using FastAPI's {"detail": ...} so the toast shows the real reason.
async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      // 422 validation errors come as a list: [{loc: [...], msg: "..."}]
      detail = Array.isArray(j.detail)
        ? j.detail.map((d) => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join("; ")
        : j.detail || detail;
    } catch { /* body was not JSON */ }
    throw new Error(detail);
  }
  return res.json().catch(() => null); // some routes return an empty body
}

const api = {
  list:   (n)        => request("GET",    `/cars?number=${n}`),
  get:    (id)       => request("GET",    `/cars/${id}`),
  // add_car has 2 body params, so FastAPI wants them keyed by name
  create: (car)      => request("POST",   "/cars", { body_cars: [car], min_id: 0 }),
  // update_car has 1 body param (Car), so the car is sent as-is
  update: (id, car)  => request("PUT",    `/cars/${id}`, car),
  remove: (id)       => request("DELETE", `/cars/${id}`),
};

/* ---------- 3. Rendering ---------- */

function render() {
  const q = $("#search").value.trim().toLowerCase();
  const list = state.cars.filter((c) => `${c.make} ${c.model}`.toLowerCase().includes(q));
  $("#empty").hidden = list.length > 0;

  $("#grid").innerHTML = list.map((c) => `
    <article class="car">
      <div>
        <h3>${esc(c.make)} ${esc(c.model)}</h3>
        <span class="year">${esc(c.year)} · Engine ${esc(c.engine || "V4")}</span>
      </div>
      <div class="price">${money(c.price)}</div>
      <div class="tags">
        ${c.autonomous ? '<span class="tag auto">Autonomous</span>' : ""}
        ${(c.sold || []).map((s) => `<span class="tag">${esc(s)}</span>`).join("")}
      </div>
      ${c.id === null ? "" : `
      <div class="car-actions">
        <button class="ghost" data-act="view" data-id="${c.id}">View</button>
        <button class="ghost" data-act="edit" data-id="${c.id}">Edit</button>
        <button class="ghost danger" data-act="delete" data-id="${c.id}">Delete</button>
      </div>`}
    </article>`).join("");
}

function renderDetail(id, c) {
  const row = (k, v) => `<dt>${k}</dt><dd>${v}</dd>`;
  $("#modal-body").innerHTML = `
    <h3 id="modal-title">${esc(c.make)} ${esc(c.model)}</h3>
    <dl>
      ${row("ID", esc(id))}
      ${row("Year", esc(c.year))}
      ${row("Price", money(c.price))}
      ${row("Engine", esc(c.engine || "V4"))}
      ${row("Autonomous", c.autonomous ? "Yes" : "No")}
      ${row("Sold in", (c.sold || []).map(esc).join(", ") || "Not sold yet")}
    </dl>`;
}

/* ---------- Form helpers (add and edit share one form) ---------- */

function readForm() {
  const f = new FormData($("#form"));
  return {
    make: f.get("make"),
    model: f.get("model"),
    year: Number(f.get("year")),   // inputs give strings, Car.year is int
    price: Number(f.get("price")), // Car.price is float
    engine: f.get("engine") || "V4",
    autonomous: f.get("autonomous") === "on",
    sold: (f.get("sold") || "").split(",").map((s) => s.trim()).filter(Boolean),
  };
}

function fillForm(c) {
  const el = $("#form").elements;
  el.make.value = c.make;
  el.model.value = c.model;
  el.year.value = c.year;
  el.price.value = c.price;
  el.engine.value = c.engine || "";
  el.sold.value = (c.sold || []).join(", ");
  el.autonomous.checked = !!c.autonomous;
}

// null = "add" mode, a number = "edit that car" mode
function setMode(id) {
  state.editingId = id;
  const editing = id !== null;
  $("#form-title").textContent = editing ? `Edit car #${id}` : "Add a car";
  $("#submit").textContent = editing ? "Update car" : "Save car";
  $("#cancel").hidden = !editing;
  $("#form").classList.toggle("editing", editing);
}

/* ---------- 4. Actions ---------- */

async function loadCars() {
  try {
    const data = await api.list($("#limit").value);
    // Each item is { "<id>": {car} }
    state.cars = data.map((item) => {
      const [id, car] = Object.entries(item)[0];
      return { id: /^\d+$/.test(id) ? id : null, ...car };
    });
    $("#count").textContent = `${state.cars.length} cars in stock`;

    if (state.cars.some((c) => c.id === null) && !state.warnedAboutIds) {
      state.warnedAboutIds = true;
      console.warn('get_cars() returns the literal key "id". Use to_add[str(id)] = car.');
      toast("Backend needs a fix to return real ids (see main.py note).");
    }
    render();
  } catch (err) {
    $("#count").textContent = "Could not load cars";
    toast(err.message || "Could not load cars. Is the server running?");
  }
}

async function viewCar(id) {
  try {
    renderDetail(id, await api.get(id));
    $("#modal").showModal();
  } catch (err) { toast(err.message); }
}

async function startEdit(id) {
  try {
    fillForm(await api.get(id)); // prefill from the server's current data
    setMode(id);
    $("#add").scrollIntoView();
  } catch (err) { toast(err.message); }
}

function stopEdit() {
  $("#form").reset();
  setMode(null);
}

async function saveCar(event) {
  event.preventDefault();
  const car = readForm();
  const editing = state.editingId !== null;
  try {
    if (editing) await api.update(state.editingId, car);
    else await api.create(car);
    toast(editing ? "Car updated" : "Car saved");
    stopEdit();
    await loadCars();
    $("#cars").scrollIntoView();
  } catch (err) { toast(err.message); }
}

async function deleteCar(id) {
  if (!confirm(`Delete car #${id}?`)) return;
  try {
    await api.remove(id);
    if (state.editingId === String(id)) stopEdit();
    toast("Car deleted");
    await loadCars();
  } catch (err) { toast(err.message); }
}

/* ---------- 5. Event wiring ---------- */

// One listener for all card buttons (cards are re-created on every render).
$("#grid").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const { act, id } = btn.dataset;
  if (act === "view") viewCar(id);
  if (act === "edit") startEdit(id);
  if (act === "delete") deleteCar(id);
});

$("#form").addEventListener("submit", saveCar);
$("#cancel").addEventListener("click", stopEdit);
$("#modal-close").addEventListener("click", () => $("#modal").close());
$("#search").addEventListener("input", render);     // filters in the browser only
$("#limit").addEventListener("change", loadCars);   // asks the API for more/fewer cars

// Highlight the nav link of the section on screen.
const navLinks = [...document.querySelectorAll(".nav a[href^='#']")];
["home", "cars", "add"].forEach((sectionId) => {
  const section = document.getElementById(sectionId);
  if (!section) return;
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) navLinks.forEach((a) => a.classList.toggle("active", a.hash === `#${sectionId}`));
  }, { threshold: 0.4 }).observe(section);
});

/* ---------- 6. Boot ---------- */
loadCars();