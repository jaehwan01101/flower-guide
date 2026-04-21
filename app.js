/* ══════════════════════════════════════════
   꽃말 사전 — app.js
   Editorial redesign (Tailwind + Material Symbols)
══════════════════════════════════════════ */

/* global FLOWERS, THEMES, getCurrentSeason, getSeasonMonths, isInSeason, getSeasonScore */

// ── 상태 ──────────────────────────────────
const state = {
  view: "home",
  selectedTheme: null,
  searchQuery: "",
  sortBy: "popularity",
  colorFilter: [],
  isArtificial: false,
  selectedFlower: null,
};

// ── 테마별 그라디언트 ──────────────────────
const THEME_GRAD = {
  success:      ["#FEF9C3", "#FDE68A"],
  love:         ["#FCE7F3", "#FBCFE8"],
  comfort:      ["#EDE9FE", "#C4B5FD"],
  gratitude:    ["#D1FAE5", "#A7F3D0"],
  health:       ["#D1FAE5", "#6EE7B7"],
  friendship:   ["#DBEAFE", "#93C5FD"],
  celebration:  ["#FFEDD5", "#FED7AA"],
  memorial:     ["#F3F4F6", "#D1D5DB"],
};

function getFlowerGrad(flower) {
  const tid = flower.themes[0] || "success";
  const g = THEME_GRAD[tid] || ["#F0EAE7", "#E8DEDD"];
  return `linear-gradient(135deg, ${g[0]}, ${g[1]})`;
}

// ── 색상 → CSS ──────────────────────────
const COLOR_HEX = {
  빨강: "#EF4444", 핑크: "#F472B6", 주황: "#FB923C",
  노랑: "#FACC15", 흰색: "#D1D5DB", 보라: "#A78BFA",
  파랑: "#60A5FA", 초록: "#4ADE80",
};

// ══════════════════════════════════════════
//  초기화
// ══════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  initSeason();
  renderSidebar();
  renderMobilePills();
  renderThemeGrid();
  renderSeasonalFlowers();
  renderPopularFlowers();
  bindEvents();
});

// ── 시즌 초기화 ───────────────────────────
function initSeason() {
  const s = getCurrentSeason();
  const msg = state.isArtificial
    ? "조화 모드 — 계절 무관하게 인기순 🎨"
    : `지금은 ${s} — 제철 꽃을 먼저 추천해드려요 🌿`;
  const el = document.getElementById("heroBadge");
  if (el) el.innerHTML = `<span class="material-symbols-outlined mr-1.5 align-middle" style="font-size:16px">wb_sunny</span>${msg}`;

  const sub = document.getElementById("seasonSubtext");
  if (sub) sub.textContent = state.isArtificial
    ? "조화는 계절 제한 없이 언제든 구입 가능합니다"
    : `${s}에 피어나는 꽃들을 만나보세요`;

  const st = document.getElementById("sidebarSeasonText");
  if (st) st.textContent = state.isArtificial ? "조화 모드 활성화 🎨" : `${s} — ${getSeasonMonths(s).map(m=>m+'월').join(', ')}`;
}

// ══════════════════════════════════════════
//  사이드바 & 모바일 필
// ══════════════════════════════════════════
function renderSidebar() {
  const nav = document.getElementById("sidebarNav");
  if (!nav) return;
  nav.innerHTML = THEMES.map(t => `
    <button class="sidebar-link" data-theme="${t.id}" onclick="goTheme('${t.id}')">
      <span style="font-size:18px">${t.icon}</span>
      <div class="leading-tight">
        <div class="text-sm font-semibold">${t.label}</div>
      </div>
    </button>
  `).join("");
}

function renderMobilePills() {
  const c = document.getElementById("mobilePills");
  if (!c) return;
  c.innerHTML = `
    <button class="pill-home flex-none flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-primary text-white whitespace-nowrap" onclick="goHome()">
      <span class="material-symbols-outlined" style="font-size:14px">home</span> 홈
    </button>
  ` + THEMES.map(t => `
    <button class="flex-none px-4 py-1.5 rounded-full text-xs font-bold border border-outline-variant/40 text-on-surface-variant bg-surface-container-lowest whitespace-nowrap hover:border-primary/40 hover:text-primary transition-all" onclick="goTheme('${t.id}')">
      ${t.icon} ${t.label}
    </button>
  `).join("");
}

// ══════════════════════════════════════════
//  홈 — 테마 그리드
// ══════════════════════════════════════════
function renderThemeGrid() {
  const c = document.getElementById("themeGrid");
  if (!c) return;
  c.innerHTML = THEMES.map(t => `
    <button onclick="goTheme('${t.id}')"
      class="group text-left p-5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest hover:border-[${t.color}]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div class="flex items-center gap-3 mb-3">
        <span class="text-3xl group-hover:scale-110 transition-transform duration-300">${t.icon}</span>
        <h3 class="font-headline font-bold text-sm" style="color:${t.color}">${t.label}</h3>
      </div>
      <p class="text-xs text-on-surface-variant leading-relaxed line-clamp-2">${t.description}</p>
    </button>
  `).join("");
}

// ══════════════════════════════════════════
//  홈 — 제철 가로 스크롤
// ══════════════════════════════════════════
function renderSeasonalFlowers() {
  const c = document.getElementById("seasonalScroll");
  if (!c) return;

  const flowers = state.isArtificial
    ? [...FLOWERS].sort((a, b) => b.artificialPopularity - a.artificialPopularity).slice(0, 10)
    : FLOWERS.filter(f => isInSeason(f))
        .sort((a, b) => b.artificialPopularity - a.artificialPopularity)
        .slice(0, 10);

  if (!flowers.length) {
    c.innerHTML = `<div class="flex-none w-64 h-64 rounded-2xl bg-surface-container-low flex items-center justify-center text-on-surface-variant text-sm">제철 꽃이 없습니다</div>`;
    return;
  }

  c.innerHTML = flowers.map(f => {
    const tid = f.themes[0] || "success";
    const t = THEMES.find(th => th.id === tid);
    const grad = getFlowerGrad(f);
    const inS = isInSeason(f) && !state.isArtificial;
    return `
      <div class="flex-none w-60 cursor-pointer group" onclick="openModal(${f.id})">
        <div class="w-full aspect-[3/4] rounded-2xl overflow-hidden mb-4 shadow-md relative flex items-center justify-center"
             style="background:${grad}">
          <span class="flower-emoji text-8xl select-none">${f.emoji}</span>
          ${inS ? `<span class="absolute top-3 left-3 px-2.5 py-1 bg-green-500/90 text-white text-[10px] font-black uppercase rounded-full tracking-wide backdrop-blur-sm">✓ 제철</span>` : ""}
          ${state.isArtificial ? `<span class="absolute top-3 left-3 px-2.5 py-1 bg-secondary/90 text-white text-[10px] font-black uppercase rounded-full tracking-wide">조화 인기</span>` : ""}
        </div>
        <span class="text-[10px] font-black tracking-widest uppercase" style="color:${t ? t.color : '#C8625A'}">${t ? t.icon + " " + t.label : ""}</span>
        <h3 class="font-headline text-lg font-bold mt-0.5 group-hover:text-primary transition-colors">${f.name}</h3>
        <p class="text-on-surface-variant text-xs mt-0.5 line-clamp-1">${f.meaning}</p>
      </div>
    `;
  }).join("");
}

// ══════════════════════════════════════════
//  홈 — 인기 TOP 8
// ══════════════════════════════════════════
function renderPopularFlowers() {
  const c = document.getElementById("popularGrid");
  const lbl = document.getElementById("popModeLabel");
  if (!c) return;

  const flowers = [...FLOWERS]
    .sort((a, b) => b.artificialPopularity - a.artificialPopularity)
    .slice(0, 8);

  if (lbl) lbl.textContent = state.isArtificial ? "조화 인기순" : "전체 인기순";
  c.innerHTML = flowers.map(f => flowerCardHTML(f, true)).join("");
}

// ══════════════════════════════════════════
//  테마 화면
// ══════════════════════════════════════════
function goTheme(themeId) {
  state.view = "theme";
  state.selectedTheme = themeId;
  state.sortBy = "popularity";
  state.colorFilter = [];

  showView("themeView");

  // 사이드바 활성 상태
  document.querySelectorAll(".sidebar-link").forEach(el => {
    el.classList.remove("active");
    if (el.dataset.theme === themeId) el.classList.add("active");
    if (el.id === "sidebarHome") el.classList.remove("active");
  });

  const theme = THEMES.find(t => t.id === themeId);

  // 헤더
  const hdr = document.getElementById("themeViewHeader");
  if (hdr && theme) hdr.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
           style="background:${theme.bg || THEME_GRAD[themeId]?.[0] || '#FFF'}">
        ${theme.icon}
      </div>
      <div>
        <h2 class="font-headline font-black text-2xl tracking-tight" style="color:${theme.color}">${theme.label}</h2>
        <p class="text-xs text-on-surface-variant">${theme.description}</p>
      </div>
    </div>
  `;

  // 정렬 버튼 동기화
  document.querySelectorAll(".sort-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.sort === state.sortBy)
  );

  buildColorFilters(themeId);
  renderThemeFlowers();
}

function buildColorFilters(themeId) {
  const flowers = FLOWERS.filter(f => f.themes.includes(themeId));
  const colors = [...new Set(flowers.flatMap(f => f.colors))].sort();
  const c = document.getElementById("colorFilters");
  if (!c) return;
  if (colors.length <= 1) { c.innerHTML = ""; return; }
  c.innerHTML = colors.map(col => `
    <button class="color-filter-btn flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border border-outline-variant/40 text-on-surface-variant transition-all hover:border-primary/40 hover:text-primary"
            data-color="${col}" onclick="toggleColor('${col}')">
      <span class="w-2.5 h-2.5 rounded-full border border-black/10 inline-block"
            style="background:${COLOR_HEX[col] || '#ccc'}"></span>
      ${col}
    </button>
  `).join("");
}

function toggleColor(color) {
  const idx = state.colorFilter.indexOf(color);
  if (idx === -1) state.colorFilter.push(color);
  else state.colorFilter.splice(idx, 1);

  document.querySelectorAll(".color-filter-btn").forEach(btn => {
    const on = state.colorFilter.includes(btn.dataset.color);
    btn.classList.toggle("bg-primary-container", on);
    btn.classList.toggle("text-primary", on);
    btn.classList.toggle("border-primary/40", on);
  });
  renderThemeFlowers();
}

function renderThemeFlowers() {
  let flowers = FLOWERS.filter(f => f.themes.includes(state.selectedTheme));
  if (state.colorFilter.length)
    flowers = flowers.filter(f => f.colors.some(c => state.colorFilter.includes(c)));
  flowers = sortFlowers(flowers, state.sortBy);

  const c = document.getElementById("themeGrid2");
  if (c) c.innerHTML = flowers.map(f => flowerCardHTML(f, true)).join("");
}

// ══════════════════════════════════════════
//  정렬
// ══════════════════════════════════════════
function sortFlowers(flowers, sortBy) {
  return [...flowers].sort((a, b) => {
    if (state.isArtificial || sortBy === "popularity")
      return b.artificialPopularity - a.artificialPopularity;
    if (sortBy === "season") {
      const d = getSeasonScore(b) - getSeasonScore(a);
      return d !== 0 ? d : b.artificialPopularity - a.artificialPopularity;
    }
    if (sortBy === "name")
      return a.name.localeCompare(b.name, "ko");
    return b.artificialPopularity - a.artificialPopularity;
  });
}

// ══════════════════════════════════════════
//  검색
// ══════════════════════════════════════════
function doSearch(query) {
  query = query.trim();
  if (!query) return;
  state.view = "search";
  state.searchQuery = query;
  showView("searchView");

  const q = query.toLowerCase();
  const results = FLOWERS.filter(f => {
    const hay = [
      f.name, f.englishName, f.meaning, f.description, f.tips || "",
      ...f.colors,
      ...(f.keywords || []),
      ...f.themes.map(tid => THEMES.find(t => t.id === tid)?.label || ""),
    ].join(" ").toLowerCase();
    const themeKw = f.themes.flatMap(tid => THEMES.find(t => t.id === tid)?.keywords || []).join(" ").toLowerCase();
    const combined = hay + " " + themeKw;
    return combined.includes(q) || q.split(/\s+/).some(w => combined.includes(w));
  });

  const info = document.getElementById("searchResultInfo");
  const empty = document.getElementById("searchEmpty");
  const grid = document.getElementById("searchGrid");

  if (info) info.innerHTML = `"<strong class="text-on-surface font-bold">${query}</strong>" 검색 결과 — ${results.length}개`;

  if (results.length === 0) {
    if (grid) grid.innerHTML = "";
    if (empty) empty.classList.remove("hidden");
  } else {
    if (empty) empty.classList.add("hidden");
    const sorted = sortFlowers(results, state.isArtificial ? "popularity" : "season");
    if (grid) grid.innerHTML = sorted.map(f => flowerCardHTML(f, true)).join("");
  }
}

// ══════════════════════════════════════════
//  꽃 카드 HTML (Tailwind)
// ══════════════════════════════════════════
function flowerCardHTML(flower, showSeason = false) {
  const themes = flower.themes.slice(0, 2).map(tid => {
    const t = THEMES.find(th => th.id === tid);
    return t
      ? `<span class="px-2 py-0.5 text-[10px] font-black uppercase rounded-full tracking-wide whitespace-nowrap"
                style="background:${t.bg || '#FFF'};color:${t.color}">${t.icon} ${t.label}</span>`
      : "";
  }).join("");

  const inS = isInSeason(flower) && !state.isArtificial;
  const seasonHTML = showSeason
    ? inS
      ? `<span class="flex-none px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black rounded-full uppercase">✓ 제철</span>`
      : state.isArtificial
        ? `<span class="flex-none px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-black rounded-full">조화</span>`
        : `<span class="flex-none px-2 py-0.5 bg-surface-container text-on-surface-variant text-[10px] font-bold rounded-full">${flower.season.label}</span>`
    : "";

  return `
    <div class="flower-card group bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer"
         onclick="openModal(${flower.id})">
      <div class="flex items-center justify-center py-10 relative overflow-hidden"
           style="background:${getFlowerGrad(flower)}">
        <span class="flower-emoji text-7xl select-none">${flower.emoji}</span>
      </div>
      <div class="p-5">
        <div class="flex items-start justify-between gap-2 mb-1">
          <div class="min-w-0">
            <h3 class="font-headline font-bold text-base leading-tight truncate">${flower.name}</h3>
            <p class="text-[11px] text-on-surface-variant truncate">${flower.englishName}</p>
          </div>
          ${seasonHTML}
        </div>
        <p class="text-sm font-semibold text-primary mt-2 mb-3 line-clamp-1">${flower.meaning}</p>
        <div class="flex flex-wrap gap-1.5">${themes}</div>
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════
//  모달
// ══════════════════════════════════════════
function openModal(flowerId) {
  const flower = FLOWERS.find(f => f.id === flowerId);
  if (!flower) return;
  state.selectedFlower = flower;

  const inS = isInSeason(flower) && !state.isArtificial;
  const theme = THEMES.find(t => t.id === flower.themes[0]);
  const grad = getFlowerGrad(flower);

  const themeTagsHTML = flower.themes.map(tid => {
    const t = THEMES.find(th => th.id === tid);
    return t
      ? `<span class="px-3 py-1.5 text-xs font-bold rounded-full"
              style="background:${t.bg || '#FFF'};color:${t.color}">${t.icon} ${t.label}</span>`
      : "";
  }).join("");

  const popNum = flower.artificialPopularity;
  const filledDots = Math.round(popNum / 10);
  const dotsHTML = Array.from({length: 10}, (_, i) =>
    `<span class="inline-block w-2 h-2 rounded-full ${i < filledDots ? 'bg-primary' : 'bg-outline-variant/50'}"></span>`
  ).join("");

  const combosHTML = flower.combinations.map(c =>
    `<span class="px-3 py-1.5 bg-secondary-container text-on-secondary-container text-xs font-semibold rounded-full">🌿 ${c}</span>`
  ).join("");

  const keywordsHTML = (flower.keywords || []).map(k =>
    `<span class="px-2.5 py-1 bg-surface-container text-on-surface-variant text-[11px] font-semibold rounded-full">${k}</span>`
  ).join("");

  document.getElementById("modalContent").innerHTML = `
    <!-- Hero -->
    <div class="flex items-center justify-center py-14 relative" style="background:${grad}">
      <span class="text-[100px] select-none leading-none">${flower.emoji}</span>
      ${inS ? `<span class="absolute top-4 right-4 px-3 py-1 bg-green-500/90 text-white text-[10px] font-black uppercase rounded-full backdrop-blur-sm">✓ 지금 제철</span>` : ""}
    </div>

    <!-- Body -->
    <div class="p-7">
      <!-- Names -->
      <div class="text-center mb-6">
        <h2 class="font-headline font-black text-3xl tracking-tighter">${flower.name}</h2>
        <p class="text-sm text-on-surface-variant mt-1">${flower.englishName}</p>
      </div>

      <!-- 꽃말 -->
      <div class="border-l-4 rounded-r-xl px-5 py-4 mb-6" style="border-color:${theme?.color || '#C8625A'};background:${theme?.bg || '#FDECEA'}">
        <p class="text-[10px] font-black uppercase tracking-widest mb-1.5" style="color:${theme?.color || '#C8625A'}">꽃말</p>
        <p class="text-xl font-headline font-bold leading-snug" style="color:${theme?.color || '#C8625A'}">${flower.meaning}</p>
      </div>

      <!-- Info row -->
      <div class="grid grid-cols-2 gap-3 mb-6">
        <div class="bg-surface-container rounded-xl p-4">
          <p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">구매 시기</p>
          <p class="text-sm font-bold text-on-surface">${flower.season.label}</p>
          ${state.isArtificial
            ? `<p class="text-[11px] text-secondary mt-1">조화 — 연중 가능</p>`
            : inS
              ? `<p class="text-[11px] text-green-600 font-semibold mt-1">✓ 지금 바로 구입 추천</p>`
              : `<p class="text-[11px] text-on-surface-variant mt-1">현재 시기와 다소 다름</p>`}
        </div>
        <div class="bg-surface-container rounded-xl p-4">
          <p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">인기도</p>
          <div class="flex gap-1 flex-wrap">${dotsHTML}</div>
          <p class="text-[11px] text-on-surface-variant mt-2">${popNum}/100</p>
        </div>
      </div>

      <!-- 테마 -->
      <div class="mb-6">
        <p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-3">어울리는 상황</p>
        <div class="flex flex-wrap gap-2">${themeTagsHTML}</div>
      </div>

      <!-- 꽃 이야기 -->
      <div class="mb-6">
        <p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-3">꽃 이야기</p>
        <p class="text-sm text-on-surface-variant leading-relaxed">${flower.description}</p>
      </div>

      <!-- 선물 팁 -->
      <div class="bg-tertiary-container rounded-xl px-5 py-4 mb-6">
        <p class="text-[10px] font-black uppercase tracking-widest text-on-tertiary-container mb-2">💡 선물 팁</p>
        <p class="text-sm text-on-tertiary-container leading-relaxed">${flower.tips || ''}</p>
      </div>

      <!-- 어울리는 꽃 -->
      <div class="mb-5">
        <p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-3">함께 어울리는 꽃</p>
        <div class="flex flex-wrap gap-2">${combosHTML}</div>
      </div>

      <!-- 검색 키워드 -->
      ${keywordsHTML ? `
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">관련 키워드</p>
        <div class="flex flex-wrap gap-1.5">${keywordsHTML}</div>
      </div>` : ""}
    </div>
  `;

  document.getElementById("modalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
  document.body.style.overflow = "";
}

// ══════════════════════════════════════════
//  화면 전환
// ══════════════════════════════════════════
function showView(viewId) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(viewId)?.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goHome() {
  state.view = "home";
  state.selectedTheme = null;
  state.searchQuery = "";
  state.colorFilter = [];
  showView("homeView");

  // 사이드바 홈 활성
  document.querySelectorAll(".sidebar-link").forEach(el => el.classList.remove("active"));
  document.getElementById("sidebarHome")?.classList.add("active");

  // 검색창 초기화
  const si = document.getElementById("searchInput");
  if (si) si.value = "";
}

// ══════════════════════════════════════════
//  이벤트 바인딩
// ══════════════════════════════════════════
function bindEvents() {
  // 로고
  document.getElementById("logoBtn")?.addEventListener("click", goHome);

  // 검색
  const si = document.getElementById("searchInput");
  document.getElementById("searchBtn")?.addEventListener("click", () => si && doSearch(si.value));
  si?.addEventListener("keydown", e => { if (e.key === "Enter") doSearch(si.value); });

  // FAB — 검색창 포커스
  document.getElementById("fabSearch")?.addEventListener("click", () => {
    const inp = document.getElementById("searchInput");
    inp?.focus();
    inp?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // 뒤로가기
  document.getElementById("themeBack")?.addEventListener("click", goHome);
  document.getElementById("searchBack")?.addEventListener("click", () => {
    if (state.selectedTheme) goTheme(state.selectedTheme);
    else goHome();
  });

  // 사이드바 홈
  document.getElementById("sidebarHome")?.addEventListener("click", goHome);

  // 전체 꽃 보기
  document.getElementById("showAllBtn")?.addEventListener("click", () => {
    const grid = document.getElementById("searchGrid");
    const info = document.getElementById("searchResultInfo");
    const empty = document.getElementById("searchEmpty");
    const sorted = sortFlowers(FLOWERS, state.isArtificial ? "popularity" : "season");
    if (grid) grid.innerHTML = sorted.map(f => flowerCardHTML(f, true)).join("");
    if (info) info.innerHTML = `전체 꽃 — <strong class="text-on-surface font-bold">${FLOWERS.length}</strong>개`;
    if (empty) empty.classList.add("hidden");
  });

  // 정렬 버튼
  document.getElementById("sortGroup")?.addEventListener("click", e => {
    const btn = e.target.closest(".sort-btn");
    if (!btn) return;
    state.sortBy = btn.dataset.sort;
    document.querySelectorAll(".sort-btn").forEach(b => b.classList.toggle("active", b === btn));
    renderThemeFlowers();
  });

  // 조화 토글
  document.getElementById("artificialToggle")?.addEventListener("change", e => {
    state.isArtificial = e.target.checked;
    initSeason();
    if (state.view === "home") {
      renderSeasonalFlowers();
      renderPopularFlowers();
    } else if (state.view === "theme") {
      renderThemeFlowers();
    } else if (state.view === "search" && state.searchQuery) {
      doSearch(state.searchQuery);
    }
  });

  // 가로 스크롤 버튼
  document.getElementById("scrollLeft")?.addEventListener("click", () => {
    document.getElementById("seasonalScroll")?.scrollBy({ left: -280, behavior: "smooth" });
  });
  document.getElementById("scrollRight")?.addEventListener("click", () => {
    document.getElementById("seasonalScroll")?.scrollBy({ left: 280, behavior: "smooth" });
  });

  // 모달 닫기
  document.getElementById("modalClose")?.addEventListener("click", closeModal);
  document.getElementById("modalOverlay")?.addEventListener("click", e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
}
