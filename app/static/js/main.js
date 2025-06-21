let selectedProviders = [];
let allProviders = [];
let sortOrder = [];

function toggleTheme() {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
}

function setStatusIcon(id, success) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = success
    ? '<svg class="text-green-500 h-5 w-5 inline" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 5.707 8.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" clip-rule="evenodd" /></svg>'
    : '<svg class="text-red-500 h-5 w-5 inline" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-2.828-5.172a1 1 0 011.414 0L10 12.586l1.414-1.414a1 1 0 111.414 1.414L11.414 14l1.414 1.414a1 1 0 01-1.414 1.414L10 15.414l-1.414 1.414a1 1 0 01-1.414-1.414L8.586 14l-1.414-1.414a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>';
}

function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.className = `fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded shadow-lg z-50 transition-all duration-300 ease-in-out text-white ${isError ? "bg-red-600" : "bg-green-600"}`;
  toast.classList.add("toast-enter");
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("toast-enter-active"), 50);
  setTimeout(() => toast.remove(), 3000);
}

function toggleProvider(name) {
  const idx = selectedProviders.indexOf(name);
  if (idx > -1) selectedProviders.splice(idx, 1);
  else selectedProviders.push(name);
  updateSelectedList();
  updateSelectedCount();
}

function selectAllProviders() {
  selectedProviders = allProviders.map(p => p.name);
  renderProviders();
}

function clearAllProviders() {
  selectedProviders = [];
  renderProviders();
}

function updateSelectedCount() {
  document.getElementById("selected-count").textContent = `${selectedProviders.length} selected`;
}

function updateSelectedList() {
  const list = document.getElementById("selectedList");
  list.innerHTML = "";
  selectedProviders.forEach(name => {
    const li = document.createElement("li");
    li.textContent = name;
    li.className = "bg-theme-800 text-white px-2 py-1 rounded text-xs";
    list.appendChild(li);
  });
}

function renderProviders(filter = "") {
  const container = document.getElementById("providerCheckboxes");
  container.innerHTML = "";

  let providersToShow = allProviders.filter(p => p.name && p.name.toLowerCase().includes(filter.toLowerCase()));
  if (sortOrder.length) {
    providersToShow.sort((a, b) => sortOrder.indexOf(a.name) - sortOrder.indexOf(b.name));
  } else {
    providersToShow.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }

  providersToShow.forEach(provider => {
    if (!provider.name || !provider.logo) return;

    const card = document.createElement("div");
    card.className = "relative text-center border rounded-lg p-2 bg-white dark:bg-gray-800 cursor-pointer hover:ring-2 hover:ring-theme-500 transition-all duration-150";
    card.onclick = () => {
      const checkbox = card.querySelector("input");
      checkbox.checked = !checkbox.checked;
      toggleProvider(checkbox.value);
    };

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = provider.name;
    input.className = "absolute top-1 left-1";
    input.checked = selectedProviders.includes(provider.name);
    input.onclick = e => e.stopPropagation();
    input.onchange = () => toggleProvider(provider.name);

    const img = document.createElement("img");
    img.src = provider.logo.includes("http") ? provider.logo : `https://image.tmdb.org/t/p/original${provider.logo}`;
    img.alt = provider.name;
    img.className = "mx-auto h-12";

    const label = document.createElement("div");
    label.textContent = provider.name;
    label.className = "text-xs mt-2";

    card.appendChild(input);
    card.appendChild(img);
    card.appendChild(label);
    container.appendChild(card);
  });

  Sortable.create(container, {
    animation: 150,
    onEnd: () => {
      sortOrder = Array.from(container.children).map(div => div.querySelector("input").value);
      localStorage.setItem("sortOrder", JSON.stringify(sortOrder));
    }
  });
}

function filterProviders() {
  const filter = document.getElementById("providerSearch");
  if (filter) renderProviders(filter.value);
}

async function loadProviderList() {
  try {
    const res = await fetch("/static/providers.json");
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    const json = await res.json();
    if (!Array.isArray(json)) throw new Error("Provider data is not an array");
    allProviders = json;
    const savedOrder = localStorage.getItem("sortOrder");
    if (savedOrder) sortOrder = JSON.parse(savedOrder);
    renderProviders();
  } catch (err) {
    console.error("Failed to load provider list:", err);
    allProviders = [];
  }
}

async function loadConfig() {
  try {
    const res = await fetch("/config");
    const data = await res.json();
    document.getElementById("tmdb").value = data.TMDB_API_KEY || "";
    document.getElementById("overseerrUrl").value = data.OVERSEERR_URL || "";
    document.getElementById("overseerrKey").value = data.OVERSEERR_API_KEY || "";
    document.getElementById("discord").value = data.DISCORD_WEBHOOK_URL || "";
    selectedProviders = data.PROVIDERS || [];
    renderProviders();
  } catch (err) {
    console.error("Failed to load config:", err);
  }
}

async function saveConfig() {
  const cfg = {
    TMDB_API_KEY: document.getElementById("tmdb").value,
    OVERSEERR_URL: document.getElementById("overseerrUrl").value,
    OVERSEERR_API_KEY: document.getElementById("overseerrKey").value,
    DISCORD_WEBHOOK_URL: document.getElementById("discord").value,
    PROVIDERS: selectedProviders
  };

  try {
    const res = await fetch("/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg)
    });
    const data = await res.json();
    showToast(data.message || "Configuration saved.");
  } catch (err) {
    console.error("Failed to save config:", err);
    showToast("Failed to save configuration.", true);
  }
}

async function testTMDB() {
  const key = document.getElementById("tmdb").value;
  try {
    const res = await fetch(`/config/test/tmdb?key=${encodeURIComponent(key)}`);
    const json = await res.json();
    setStatusIcon("tmdb-status", json.success);
    showToast(json.message || (json.success ? "TMDB test passed" : "TMDB test failed"), !json.success);
  } catch (err) {
    console.error("TMDB test failed", err);
    setStatusIcon("tmdb-status", false);
    showToast("TMDB test error", true);
  }
}

async function testOverseerr() {
  const url = document.getElementById("overseerrUrl").value;
  const key = document.getElementById("overseerrKey").value;
  try {
    const res = await fetch(`/config/test/overseerr?url=${encodeURIComponent(url)}&key=${encodeURIComponent(key)}`);
    const json = await res.json();
    setStatusIcon("overseerr-status", json.success);
    showToast(json.message || (json.success ? "Overseerr test passed" : "Overseerr test failed"), !json.success);
  } catch (err) {
    console.error("Overseerr test failed", err);
    setStatusIcon("overseerr-status", false);
    showToast("Overseerr test error", true);
  }
}

async function testDiscord() {
  const webhook = document.getElementById("discord").value;
  try {
    const res = await fetch(`/config/test/discord?url=${encodeURIComponent(webhook)}`);
    const json = await res.json();
    setStatusIcon("discord-status", json.success);
    showToast(json.message || (json.success ? "Discord test passed" : "Discord test failed"), !json.success);
  } catch (err) {
    console.error("Discord test failed", err);
    setStatusIcon("discord-status", false);
    showToast("Discord test error", true);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  loadProviderList();
  loadConfig();
  document.getElementById("providerSearch")?.addEventListener("input", filterProviders);

  const tmdbBtn = document.querySelector("button[onclick='testTMDB()']");
  const overseerrBtn = document.querySelector("button[onclick='testOverseerr()']");
  const discordBtn = document.querySelector("button[onclick='testDiscord()']");

  if (tmdbBtn) tmdbBtn.addEventListener("click", testTMDB);
  if (overseerrBtn) overseerrBtn.addEventListener("click", testOverseerr);
  if (discordBtn) discordBtn.addEventListener("click", testDiscord);

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") document.documentElement.classList.add("dark");
});
