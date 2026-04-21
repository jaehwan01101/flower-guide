/* global THEMES, FILTERS, QUICK_SEARCHES, SUGGESTIONS, FLOWERS */

const state = {
  theme: "all",
  query: "",
  sort: "match",
  colors: new Set(),
  recipients: new Set(),
  budgets: new Set(),
  saved: new Set()
};

const $ = (selector) => document.querySelector(selector);

document.addEventListener("DOMContentLoaded", () => {
  restoreSaved();
  renderClock();
  renderQuickSearches();
  renderThemeTabs();
  renderFilters();
  renderResults();
  renderCombos();
  bindEvents();
  setInterval(renderClock, 60000);
});

function bindEvents() {
  $("#logoBtn")?.addEventListener("click", resetAll);
  $("#searchBtn")?.addEventListener("click", () => {
    state.query = $("#searchInput").value.trim();
    hideSuggestions();
    renderResults();
  });
  $("#searchInput")?.addEventListener("input", handleSearchInput);
  $("#searchInput")?.addEventListener("focus", handleSearchInput);
  $("#searchInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      state.query = event.currentTarget.value.trim();
      hideSuggestions();
      renderResults();
    }
    if (event.key === "Escape") hideSuggestions();
  });
  $("#clearSearchBtn")?.addEventListener("click", () => {
    state.query = "";
    $("#searchInput").value = "";
    hideSuggestions();
    renderResults();
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".search-shell") && !event.target.closest("#suggestionBox")) {
      hideSuggestions();
    }
  });
  $("#resetBtn")?.addEventListener("click", resetFilters);
  $("#popularAllBtn")?.addEventListener("click", () => {
    state.theme = "all";
    state.sort = "popular";
    renderThemeTabs();
    renderFilters();
    renderResults();
    scrollToResults();
  });
  $("#mobileFilterBtn")?.addEventListener("click", () => {
    $("#filters")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#detailCloseBtn")?.addEventListener("click", closeDetail);
  $("#detailOverlay")?.addEventListener("click", (event) => {
    if (event.target.id === "detailOverlay") closeDetail();
  });
  $("#openSavedBtn")?.addEventListener("click", openSaved);
  $("#closeSavedBtn")?.addEventListener("click", closeSaved);
  $(".saved-backdrop")?.addEventListener("click", closeSaved);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDetail();
      closeSaved();
    }
  });
}

function renderClock() {
  const now = new Date();
  const dateLabel = now.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  const timeLabel = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  const season = getCurrentSeason(now.getMonth() + 1);
  const stamp = $("#seasonStamp");
  const clock = $("#liveClock");
  if (stamp) stamp.textContent = `${season} color / ${dateLabel}`;
  if (clock) clock.textContent = timeLabel;
}

function getCurrentSeason(month) {
  if ([3, 4, 5].includes(month)) return "SPRING";
  if ([6, 7, 8].includes(month)) return "SUMMER";
  if ([9, 10, 11].includes(month)) return "AUTUMN";
  return "WINTER";
}

function renderQuickSearches() {
  const wrapper = $("#quickSearches");
  if (!wrapper) return;
  wrapper.innerHTML = QUICK_SEARCHES.map((item) => `
    <button class="quick-chip" data-query="${escapeAttr(item)}">${item}</button>
  `).join("");
  wrapper.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.query = button.dataset.query;
      $("#searchInput").value = state.query;
      hideSuggestions();
      renderResults();
      scrollToResults();
    });
  });
}

function renderThemeTabs() {
  const wrapper = $("#themeTabs");
  if (!wrapper) return;
  wrapper.innerHTML = THEMES.map((theme) => `
    <button class="theme-tab ${state.theme === theme.id ? "active" : ""}" data-theme="${theme.id}">
      <span class="material-symbols-outlined text-[17px]">${theme.icon}</span>
      <span>${theme.label}</span>
    </button>
  `).join("");
  wrapper.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.theme = button.dataset.theme;
      renderThemeTabs();
      renderResults();
      scrollToResults();
    });
  });
}

function renderFilters() {
  renderSortControls();
  renderChipControls("colorControls", FILTERS.colors, "colors", true);
  renderChipControls("recipientControls", FILTERS.recipients, "recipients");
  renderChipControls("budgetControls", FILTERS.budgets, "budgets");
  renderActiveFilters();
}

function renderSortControls() {
  const wrapper = $("#sortControls");
  if (!wrapper) return;
  wrapper.innerHTML = FILTERS.sort.map((sort) => `
    <button class="${state.sort === sort.id ? "active" : ""}" data-sort="${sort.id}">${sort.label}</button>
  `).join("");
  wrapper.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.sort = button.dataset.sort;
      renderFilters();
      renderResults();
    });
  });
}

function renderChipControls(targetId, items, key, hasSwatch = false) {
  const wrapper = $(`#${targetId}`);
  if (!wrapper) return;
  wrapper.innerHTML = items.map((item) => `
    <button class="filter-chip ${state[key].has(item.id) ? "active" : ""}" data-value="${item.id}">
      ${hasSwatch ? `<span class="swatch" style="background:${item.hex}"></span>` : ""}
      ${item.label}
    </button>
  `).join("");
  wrapper.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const set = state[key];
      if (set.has(button.dataset.value)) set.delete(button.dataset.value);
      else set.add(button.dataset.value);
      renderFilters();
      renderResults();
    });
  });
}

function renderActiveFilters() {
  const active = [];
  const theme = THEMES.find((item) => item.id === state.theme);
  if (state.theme !== "all" && theme) active.push({ label: theme.label, type: "theme", value: state.theme });
  state.colors.forEach((value) => active.push({ label: getFilterLabel("colors", value), type: "colors", value }));
  state.recipients.forEach((value) => active.push({ label: getFilterLabel("recipients", value), type: "recipients", value }));
  state.budgets.forEach((value) => active.push({ label: getFilterLabel("budgets", value), type: "budgets", value }));

  const wrapper = $("#activeFilters");
  const reset = $("#resetBtn");
  if (!wrapper || !reset) return;
  wrapper.innerHTML = active.map((item) => `
    <button class="active-chip" data-type="${item.type}" data-value="${item.value}">
      ${item.label}
      <span class="material-symbols-outlined text-[14px]">close</span>
    </button>
  `).join("");
  wrapper.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.type;
      const value = button.dataset.value;
      if (type === "theme") state.theme = "all";
      else state[type].delete(value);
      renderThemeTabs();
      renderFilters();
      renderResults();
    });
  });
  reset.classList.toggle("hidden", active.length === 0 && state.query === "" && state.sort === "match");
}

function getFilterLabel(key, value) {
  const found = FILTERS[key].find((item) => item.id === value);
  return found ? found.label : value;
}

function handleSearchInput(event) {
  const value = event.currentTarget.value.trim();
  state.query = value;
  $("#clearSearchBtn")?.classList.toggle("hidden", value.length === 0);
  renderSuggestions(value);
  renderResults();
}

function renderSuggestions(query) {
  const box = $("#suggestionBox");
  if (!box) return;
  const normalized = normalize(query);
  const suggestions = SUGGESTIONS.filter((item) => {
    if (!normalized) return true;
    return normalize(item).includes(normalized);
  }).slice(0, 5);

  if (!suggestions.length) {
    hideSuggestions();
    return;
  }

  box.innerHTML = suggestions.map((item) => `
    <button data-query="${escapeAttr(item)}">
      <span class="material-symbols-outlined text-[17px]">auto_awesome</span>
      ${item}
    </button>
  `).join("");
  box.classList.remove("hidden");
  box.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.query = button.dataset.query;
      $("#searchInput").value = state.query;
      $("#clearSearchBtn")?.classList.remove("hidden");
      hideSuggestions();
      renderResults();
      scrollToResults();
    });
  });
}

function hideSuggestions() {
  $("#suggestionBox")?.classList.add("hidden");
}

function renderResults() {
  const results = getFilteredFlowers();
  const grid = $("#flowerGrid");
  const empty = $("#emptyState");
  const resultTitle = $("#resultTitle");
  const resultCount = $("#resultCount");
  const kicker = $("#resultKicker");
  if (!grid || !empty) return;

  grid.innerHTML = results.map(flowerCard).join("");
  grid.querySelectorAll("[data-open]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("[data-save]")) return;
      openDetail(Number(card.dataset.open));
    });
  });
  grid.querySelectorAll("[data-save]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleSaved(Number(button.dataset.save));
    });
  });

  empty.classList.toggle("hidden", results.length > 0);
  const theme = THEMES.find((item) => item.id === state.theme);
  const label = state.query
    ? `"${state.query}"에 맞는 추천`
    : theme && state.theme !== "all"
      ? `${theme.label}에 맞는 조화`
      : "상황에 맞는 조화 추천";
  if (resultTitle) resultTitle.textContent = label;
  if (resultCount) resultCount.textContent = `${results.length} RESULTS / SORT ${state.sort.toUpperCase()}`;
  if (kicker) kicker.textContent = state.theme === "all" ? "INTENT RECOMMENDATIONS" : `THEME_${state.theme.toUpperCase()}`;
  renderActiveFilters();
}

function getFilteredFlowers() {
  const queryTokens = getQueryTokens(state.query);
  let flowers = FLOWERS.map((flower) => ({
    ...flower,
    queryScore: queryTokens.length ? scoreFlowerForQuery(flower, queryTokens) : 0
  })).filter((flower) => {
    if (state.theme !== "all" && !flower.themes.includes(state.theme)) return false;
    if (state.colors.size && !flower.colors.some((color) => state.colors.has(color))) return false;
    if (state.recipients.size && !flower.recipients.some((recipient) => state.recipients.has(recipient))) return false;
    if (state.budgets.size && !state.budgets.has(flower.budget)) return false;
    return !queryTokens.length || flower.queryScore > 0;
  });

  flowers = sortFlowers(flowers, state.sort);
  if (queryTokens.length) {
    flowers.sort((a, b) => b.queryScore - a.queryScore || b.match - a.match);
  }
  return flowers;
}

function getQueryTokens(query) {
  const normalized = normalize(query);
  if (!normalized) return [];
  const synonyms = {
    합격: ["합격", "성공", "응원", "기원"],
    취업: ["취업", "성공", "응원"],
    개업: ["개업", "축하", "번창", "성공"],
    회복: ["회복", "건강", "쾌유", "위로"],
    수술: ["수술", "회복", "건강"],
    감사: ["감사", "존경", "고마움"],
    선생님: ["선생님", "스승", "존경", "감사"],
    부모님: ["부모님", "가족", "감사", "존경"],
    가족: ["가족", "건강", "감사"],
    친구: ["친구", "응원", "위로"],
    동료: ["동료", "응원", "감사"],
    거래처: ["거래처", "개업", "축하", "존경"],
    연인: ["연인", "사랑", "고백"],
    위로: ["위로", "평화", "안정"],
    추모: ["추모", "기억", "존경"],
    졸업: ["졸업", "새출발", "응원"],
    이직: ["이직", "새출발", "응원"]
  };
  const stopWords = new Set(["에게", "어울리는", "꽃말", "꽃", "선물", "앞둔", "위한", "맞는", "좋은", "사람", "지인"]);
  const directWords = normalized
    .split(/\s+/)
    .map((word) => word.replace(/(에게|한테|으로|로|을|를|이|가|은|는|의|와|과|도|만|좀|요)$/g, ""))
    .filter((word) => word.length > 1 && !stopWords.has(word));
  const matchedSynonyms = Object.entries(synonyms)
    .filter(([key]) => normalized.includes(key))
    .flatMap(([, values]) => values.map(normalize));
  const expanded = directWords.flatMap((word) => {
    const foundKey = Object.keys(synonyms).find((key) => word.includes(key) || key.includes(word));
    return foundKey ? synonyms[foundKey].map(normalize) : [word];
  });
  return [...new Set([...matchedSynonyms, ...expanded])].filter((word) => word.length > 1);
}

function scoreFlowerForQuery(flower, queryTokens) {
  const haystack = normalize([
    flower.name,
    flower.englishName,
    flower.meaning,
    flower.situation,
    flower.tags.join(" "),
    flower.themes.map(themeKeywords).join(" "),
    flower.recipients.map((recipient) => getFilterLabel("recipients", recipient)).join(" "),
    getFilterLabel("budgets", flower.budget),
    flower.combinations.join(" ")
  ].join(" "));
  return queryTokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

function themeKeywords(themeId) {
  const theme = THEMES.find((item) => item.id === themeId);
  return theme ? [theme.label, theme.description, ...(theme.keywords || [])].join(" ") : "";
}

function sortFlowers(flowers, sort) {
  const keyMap = {
    match: (flower) => flower.match,
    popular: (flower) => flower.popularity,
    available: (flower) => flower.available ? 1 : 0,
    season: (flower) => flower.seasonScore
  };
  const getter = keyMap[sort] || keyMap.match;
  return [...flowers].sort((a, b) => {
    const primary = getter(b) - getter(a);
    if (primary !== 0) return primary;
    return b.match - a.match;
  });
}

function flowerCard(flower) {
  const mainTheme = THEMES.find((theme) => theme.id === flower.themes[0]);
  const saved = state.saved.has(flower.id);
  const tags = flower.tags.slice(0, 3).map((tag) => `<span>#${tag}</span>`).join("");
  return `
    <article class="flower-card" data-open="${flower.id}">
      <div class="flower-image ${flower.available ? "" : "is-muted"}">
        <img src="${flower.image}" alt="${flower.name}" loading="lazy" onerror="this.parentElement.classList.add('image-fallback'); this.remove();" />
        <div class="flower-fallback">${flower.name.slice(0, 1)}</div>
        <span class="data-badge">MATCH_${flower.match}</span>
        <button class="save-btn ${saved ? "saved" : ""}" data-save="${flower.id}" aria-label="${flower.name} 보관">
          <span class="material-symbols-outlined text-[17px]">${saved ? "bookmark" : "bookmark_add"}</span>
        </button>
      </div>
      <div class="flower-body">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <h3>${flower.name}</h3>
            <p class="english">${flower.englishName}</p>
          </div>
          <span class="status-pill ${flower.available ? "available" : "wait"}">${flower.available ? "판매 가능" : "입고 예정"}</span>
        </div>
        <p class="meaning">${flower.meaning}</p>
        <p class="situation">${flower.situation}</p>
        <div class="flower-meta">
          <span>${mainTheme ? mainTheme.label : "추천"}</span>
          <span>${flower.bloom}</span>
          <span>${formatPrice(flower.price)}</span>
        </div>
        <div class="tag-row">${tags}</div>
      </div>
    </article>
  `;
}

function renderCombos() {
  const wrapper = $("#comboGrid");
  if (!wrapper) return;
  const items = [...FLOWERS]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 4);
  wrapper.innerHTML = items.map((flower) => `
    <button class="combo-card" data-id="${flower.id}">
      <span class="combo-code">TRENDING_${String(flower.id).padStart(2, "0")}</span>
      <strong>${flower.name} + ${flower.combinations[0]}</strong>
      <span>${flower.situation}</span>
    </button>
  `).join("");
  wrapper.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => openDetail(Number(button.dataset.id)));
  });
}

function openDetail(id) {
  const flower = FLOWERS.find((item) => item.id === id);
  if (!flower) return;
  const themeTags = flower.themes.map((themeId) => {
    const theme = THEMES.find((item) => item.id === themeId);
    return theme ? `<span>${theme.label}</span>` : "";
  }).join("");
  const combos = flower.combinations.map((combo) => `<span>${combo}</span>`).join("");

  $("#detailContent").innerHTML = `
    <div class="detail-hero">
      <img src="${flower.image}" alt="${flower.name}" onerror="this.remove();" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent"></div>
      <span class="absolute left-5 top-5 bg-archive-ink px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white">MATCH_${flower.match}</span>
      <div class="absolute bottom-5 left-5 right-5 text-white">
        <p class="font-mono text-[10px] uppercase tracking-[0.2em] opacity-80">${flower.englishName}</p>
        <h2 id="detailTitle" class="mt-1 font-serifkr text-3xl font-bold">${flower.name}</h2>
      </div>
    </div>
    <div class="space-y-5 p-5">
      <div class="meaning-panel">
        <p>핵심 꽃말</p>
        <strong>${flower.meaning}</strong>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <div class="detail-metric"><span>판매</span><strong>${flower.available ? "가능" : "입고 예정"}</strong></div>
        <div class="detail-metric"><span>개화</span><strong>${flower.bloom}</strong></div>
        <div class="detail-metric"><span>예산</span><strong>${formatPrice(flower.price)}</strong></div>
      </div>
      <section>
        <h3 class="detail-heading">이 상황에 어울리는 이유</h3>
        <p class="detail-copy">${flower.reason}</p>
      </section>
      <section>
        <h3 class="detail-heading">추천 상황</h3>
        <p class="detail-copy">${flower.situation}</p>
      </section>
      <section>
        <h3 class="detail-heading">함께 조합하면 좋은 꽃</h3>
        <div class="detail-tags">${combos}</div>
      </section>
      <section>
        <h3 class="detail-heading">관련 테마</h3>
        <div class="detail-tags">${themeTags}</div>
      </section>
    </div>
  `;
  $("#detailOverlay").classList.add("open");
  $("#detailOverlay").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeDetail() {
  $("#detailOverlay")?.classList.remove("open");
  $("#detailOverlay")?.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function toggleSaved(id) {
  if (state.saved.has(id)) state.saved.delete(id);
  else state.saved.add(id);
  persistSaved();
  renderResults();
  updateSavedCount();
}

function restoreSaved() {
  try {
    const raw = localStorage.getItem("meaningBloomSaved");
    if (raw) state.saved = new Set(JSON.parse(raw));
  } catch {
    state.saved = new Set();
  }
  updateSavedCount();
}

function persistSaved() {
  localStorage.setItem("meaningBloomSaved", JSON.stringify([...state.saved]));
}

function updateSavedCount() {
  const count = $("#savedCount");
  if (count) count.textContent = String(state.saved.size);
}

function openSaved() {
  renderSavedList();
  $("#savedDrawer")?.classList.add("open");
  $("#savedDrawer")?.setAttribute("aria-hidden", "false");
}

function closeSaved() {
  $("#savedDrawer")?.classList.remove("open");
  $("#savedDrawer")?.setAttribute("aria-hidden", "true");
}

function renderSavedList() {
  const wrapper = $("#savedList");
  if (!wrapper) return;
  const savedFlowers = FLOWERS.filter((flower) => state.saved.has(flower.id));
  wrapper.innerHTML = savedFlowers.length
    ? savedFlowers.map((flower) => `
      <button class="saved-item" data-id="${flower.id}">
        <img src="${flower.image}" alt="" />
        <span>
          <strong>${flower.name}</strong>
          <small>${flower.meaning}</small>
        </span>
      </button>
    `).join("")
    : `<p class="border border-dashed border-archive-line px-4 py-8 text-center text-sm text-archive-mute">아직 보관한 꽃이 없습니다.</p>`;
  wrapper.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      closeSaved();
      openDetail(Number(button.dataset.id));
    });
  });
}

function resetFilters() {
  state.theme = "all";
  state.sort = "match";
  state.colors.clear();
  state.recipients.clear();
  state.budgets.clear();
  state.query = "";
  const input = $("#searchInput");
  if (input) input.value = "";
  $("#clearSearchBtn")?.classList.add("hidden");
  renderThemeTabs();
  renderFilters();
  renderResults();
}

function resetAll() {
  resetFilters();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollToResults() {
  $("#recommendations")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function escapeAttr(value) {
  return String(value).replace(/"/g, "&quot;");
}

function formatPrice(price) {
  return `${Math.round(price / 10000)}만원대`;
}
