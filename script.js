/* ========= Shared Helpers ========= */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function setThemeFromStorage() {
  const saved = localStorage.getItem("theme"); // 'dark' | 'light' | null
  const root = document.documentElement;
  if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}
function toggleTheme() {
  const root = document.documentElement;
  root.classList.toggle("dark");
  localStorage.setItem("theme", root.classList.contains("dark") ? "dark" : "light");
}
function bindThemeToggle() {
  const btn = $("#themeToggle");
  if (btn) btn.addEventListener("click", toggleTheme);
}

/* ========= Page Router by data-page ========= */
document.addEventListener("DOMContentLoaded", () => {
  setThemeFromStorage();
  bindThemeToggle();

  const page = document.body.getAttribute("data-page");
  if (page === "landing") initLanding();
  if (page === "auth") initAuth();
  if (page === "dashboard") initDashboard();
});

/* ========= Landing ========= */
function initLanding() {
  // nothing special—pure UI
}

/* ========= Auth (ReqRes) ========= */
function initAuth() {
  // Tabs
  const tabs = $$("[data-auth-tab]");
  const panes = $$(".auth-pane");
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.getAttribute("data-auth-tab");
      panes.forEach(p => p.classList.toggle("hidden", p.getAttribute("data-pane") !== target));
      location.hash = target;
    });
  });
  // Open pane by hash if present
  const hash = location.hash.replace("#", "") || "login";
  const openBtn = $(`[data-auth-tab="${hash}"]`);
  if (openBtn) openBtn.click();

  // Login
  const loginForm = $("#loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("#loginEmail").value.trim();
      const password = $("#loginPassword").value.trim();
      $("#loginBtn").disabled = true;
      $("#loginBtn").textContent = "Signing in...";
      $("#loginMsg").textContent = "";
      try {
        const res = await fetch("https://reqres.in/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");
        localStorage.setItem("token", data.token);
        localStorage.setItem("email", email);
        location.href = "dashboard.html";
      } catch (err) {
        $("#loginMsg").textContent = err.message;
      } finally {
        $("#loginBtn").disabled = false;
        $("#loginBtn").textContent = "Sign In";
      }
    });
  }

  // Sign up
  const signupForm = $("#signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("#signupEmail").value.trim();
      const password = $("#signupPassword").value.trim();
      $("#signupBtn").disabled = true;
      $("#signupBtn").textContent = "Creating...";
      $("#signupMsg").textContent = "";
      try {
        const res = await fetch("https://reqres.in/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");
        // treat as logged-in
        localStorage.setItem("token", data.token);
        localStorage.setItem("email", email);
        location.href = "dashboard.html";
      } catch (err) {
        $("#signupMsg").textContent = err.message;
      } finally {
        $("#signupBtn").disabled = false;
        $("#signupBtn").textContent = "Sign Up";
      }
    });
  }

  // Forgot (mock)
  const forgotForm = $("#forgotForm");
  if (forgotForm) {
    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("#forgotEmail").value.trim();
      $("#forgotBtn").disabled = true;
      $("#forgotBtn").textContent = "Sending...";
      $("#forgotMsg").textContent = "";
      try {
        // Mock success using JSONPlaceholder
        await fetch("https://jsonplaceholder.typicode.com/posts", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({ email, message: "reset-link" })
        });
        $("#forgotMsg").textContent = "If that email exists, a reset link has been sent.";
      } catch {
        $("#forgotMsg").textContent = "Something went wrong. Try again.";
      } finally {
        $("#forgotBtn").disabled = false;
        $("#forgotBtn").textContent = "Send Reset Link";
      }
    });
  }
}

/* ========= Dashboard ========= */
function requireAuthOrRedirect() {
  const token = localStorage.getItem("token");
  if (!token) location.href = "auth.html#login";
}
function initDashboard() {
  requireAuthOrRedirect();

  // UI wiring
  const email = localStorage.getItem("email") || "";
  const emailLabel = $("#userEmailLabel");
  if (emailLabel) emailLabel.textContent = email;

  $("#logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    location.href = "auth.html#login";
  });

  // Sidebar tabs
  const sideBtns = $$("[data-dash-tab]");
  const panes = $$(".dash-pane");
  sideBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sideBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.getAttribute("data-dash-tab");
      panes.forEach(p => p.classList.toggle("hidden", p.getAttribute("data-pane") !== target));
      if (target === "courses") loadCourses();
      if (target === "assignments") loadTodos();
      if (target === "profile") loadProfile();
    });
  });
  // Default open
  sideBtns[0]?.click();

  // Mobile sidebar toggle
  $("#sidebarToggle")?.addEventListener("click", () => {
    $("#sidebar")?.classList.toggle("hidden");
  });

  // Reload buttons
  $("#reloadCourses")?.addEventListener("click", loadCourses);
  $("#reloadTodos")?.addEventListener("click", loadTodos);
}

/* ---- Courses (Fake Store API) ---- */
async function loadCourses() {
  const grid = $("#coursesGrid");
  const msg = $("#coursesMsg");
  if (!grid) return;
  grid.innerHTML = loaderGrid(6);
  msg.textContent = "Fetching courses...";
  try {
    const res = await fetch("https://fakestoreapi.com/products");
    const data = await res.json();
    grid.innerHTML = data.slice(0, 9).map(p => courseCard(p)).join("");
    msg.textContent = `Loaded ${Math.min(9, data.length)} courses.`;
    // Update KPIs (fake: enrolled = 3)
    setText("#kpiCourses", "3");
  } catch (e) {
    grid.innerHTML = "";
    msg.textContent = "Failed to load courses.";
  }
}
function courseCard(p) {
  return `
    <article class="card h-full flex flex-col">
      <img src="${p.image}" alt="${escapeHtml(p.title)}" class="w-full h-40 object-contain rounded-lg bg-white dark:bg-gray-800">
      <h3 class="mt-3 font-semibold line-clamp-2">${escapeHtml(p.title)}</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mt-1">${escapeHtml(p.description)}</p>
      <div class="mt-auto flex items-center justify-between">
        <span class="font-bold">$${p.price}</span>
        <button class="btn-primary text-sm">Enroll</button>
      </div>
    </article>
  `;
}

/* ---- Assignments (JSONPlaceholder) ---- */
async function loadTodos() {
  const list = $("#todoList");
  const msg = $("#todosMsg");
  if (!list) return;
  list.innerHTML = loaderList(6);
  msg.textContent = "Fetching assignments...";
  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/todos?_limit=12");
    const data = await res.json();
    const pending = data.filter(t => !t.completed).length;
    const done = data.filter(t => t.completed).length;
    list.innerHTML = data.map(todoItem).join("");
    msg.textContent = `Loaded ${data.length} items.`;
    setText("#kpiPending", String(pending));
    setText("#kpiDone", String(done));
  } catch (e) {
    list.innerHTML = "";
    msg.textContent = "Failed to load assignments.";
  }
}
function todoItem(t) {
  return `
    <li class="card flex items-start gap-3">
      <input type="checkbox" ${t.completed ? "checked" : ""} class="accent-indigo-600 mt-1" disabled>
      <div>
        <p class="${t.completed ? "line-through opacity-70" : ""}">${escapeHtml(t.title)}</p>
        <span class="inline-block text-xs mt-1 px-2 py-0.5 rounded-full ${t.completed ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"}">
          ${t.completed ? "Completed" : "Pending"}
        </span>
      </div>
    </li>
  `;
}

/* ---- Profile (Random User) ---- */
async function loadProfile() {
  const card = $("#profileCard");
  const msg = $("#profileMsg");
  if (!card) return;
  card.innerHTML = skeletonProfile();
  msg.textContent = "Loading profile...";
  try {
    const res = await fetch("https://randomuser.me/api/");
    const data = await res.json();
    const u = data.results[0];
    card.innerHTML = `
      <img class="w-16 h-16 rounded-full" src="${u.picture.large}" alt="Avatar">
      <div>
        <h3 class="font-semibold">${escapeHtml(u.name.first)} ${escapeHtml(u.name.last)}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">${escapeHtml(u.email)}</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">${escapeHtml(u.location.city)}, ${escapeHtml(u.location.country)}</p>
      </div>
    `;
    msg.textContent = "";
  } catch (e) {
    card.innerHTML = `<div class="text-sm opacity-80">Failed to load profile.</div>`;
    msg.textContent = "";
  }
}

/* ========= Small UI helpers ========= */
function loaderGrid(n = 6) {
  return Array.from({ length: n }).map(() => `
    <div class="card h-48 animate-pulse">
      <div class="h-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded mt-3 w-3/4"></div>
      <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded mt-2 w-2/3"></div>
    </div>
  `).join("");
}
function loaderList(n = 6) {
  return Array.from({ length: n }).map(() => `
    <li class="card animate-pulse">
      <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
      <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded mt-2 w-1/3"></div>
    </li>
  `).join("");
}
function skeletonProfile() {
  return `
    <div class="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
    <div>
      <div class="h-4 w-40 bg-gray-200 dark:bg-gray-800 rounded mb-2 animate-pulse"></div>
      <div class="h-3 w-28 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
    </div>
  `;
}
function setText(sel, text) {
  const el = $(sel);
  if (el) el.textContent = text;
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}
