let selectedProviders = [];
let allProviders = [];
let sortOrder = [];

function toggleTheme() {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
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
      sortOrder = Array.from(container.children).map(div => {
        return div.querySelector("input").value;
      });
      localStorage.setItem("sortOrder", JSON.stringify(sortOrder));
    }
  });
}

function filterProviders() {
  const filter = document.getElementById("providerSearch").value;
  renderProviders(filter);
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
    allProviders = [];  // fallback to empty to prevent .filter error
  }
}


function loadConfig() {
  fetch("/config")
    .then(res => res.json())
    .then(data => {
      document.getElementById("tmdb").value = data.TMDB_API_KEY || "";
      document.getElementById("overseerrUrl").value = data.OVERSEERR_URL || "";
      document.getElementById("overseerrKey").value = data.OVERSEERR_API_KEY || "";
      document.getElementById("discord").value = data.DISCORD_WEBHOOK_URL || "";
      selectedProviders = data.PROVIDERS || [];
      renderProviders();
    })
    .catch(err => console.error("Failed to load config:", err));
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

function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.className = `fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded shadow-lg z-50 transition-all duration-300 ease-in-out text-white ${isError ? "bg-red-600" : "bg-green-600"}`;
  toast.classList.add("toast-enter");
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("toast-enter-active"), 50);
  setTimeout(() => toast.remove(), 3000);
}

window.addEventListener("DOMContentLoaded", () => {
  loadProviderList();
  loadConfig();

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") document.documentElement.classList.add("dark");
});
