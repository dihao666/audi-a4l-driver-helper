const root = document.querySelector("#glossaryRoot");
const input = document.querySelector("#glossaryQuery");
const categoryChips = document.querySelector("#categoryChips");
const summary = document.querySelector("#glossarySummary");

let categories = [];
let activeCategory = "all";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function matchesTerm(term, query) {
  if (!query) return true;
  const haystack = normalize([
    term.term,
    term.plain,
    term.where,
    term.example,
    ...(term.aliases || []),
    ...(term.related || []).flatMap((item) => [item.label, item.query]),
  ].join(" "));
  return normalize(query).split(/\s+/).filter(Boolean).every((part) => haystack.includes(part));
}

function termId(term) {
  return encodeURIComponent(term.term).replace(/%/g, "");
}

function isExactMatch(term, query) {
  const normalized = normalize(query);
  if (!normalized) return false;
  return normalize(term.term) === normalized || (term.aliases || []).some((alias) => normalize(alias) === normalized);
}

function matchRank(term, query) {
  const normalized = normalize(query);
  if (!normalized) return 0;
  if (normalize(term.term) === normalized) return 3;
  if ((term.aliases || []).some((alias) => normalize(alias) === normalized)) return 2;
  return matchesTerm(term, query) ? 1 : 0;
}

function renderRelated(term) {
  if (!term.related?.length) return "";
  return `
    <div class="term-related">
      <b>相关教程</b>
      <div>
        ${term.related.map((item) => `<a href="./index.html?query=${encodeURIComponent(item.query)}">${item.label}</a>`).join("")}
      </div>
    </div>
  `;
}

function getVisibleCategories() {
  const query = input.value;
  return categories
    .filter((category) => activeCategory === "all" || category.id === activeCategory)
    .map((category) => {
      const terms = category.terms
        .filter((term) => matchesTerm(term, query))
        .sort((a, b) => matchRank(b, query) - matchRank(a, query));
      return { ...category, terms };
    })
    .filter((category) => category.terms.length)
    .sort((a, b) => {
      const aHasExact = a.terms.some((term) => isExactMatch(term, query));
      const bHasExact = b.terms.some((term) => isExactMatch(term, query));
      return Number(bHasExact) - Number(aHasExact);
    });
}

function renderChips() {
  const chips = [
    { id: "all", title: "全部" },
    ...categories.map((category) => ({ id: category.id, title: category.title })),
  ];
  categoryChips.innerHTML = chips
    .map((chip) => `<button class="chip ${chip.id === activeCategory ? "active" : ""}" type="button" data-category="${chip.id}">${chip.title}</button>`)
    .join("");
}

function render() {
  const query = input.value;
  const visible = getVisibleCategories();
  const total = visible.reduce((sum, category) => sum + category.terms.length, 0);
  summary.textContent = query
    ? `找到 ${total} 个相关词。精确匹配会排在最前面，其他是包含这个词的相关解释。`
    : `共 ${total} 个基础词，按车内位置、操作动作、系统功能和状态提示分类。`;

  const html = visible
    .map((category) => {
      return `
        <section class="term-section">
          <h2>${category.title}</h2>
          <div class="term-grid">
            ${category.terms.map((term) => `
              <article class="term-card ${isExactMatch(term, query) ? "exact" : ""}" id="${termId(term)}">
                <div>
                  <strong>${term.term}</strong>
                  ${isExactMatch(term, query) ? `<em>精确匹配</em>` : ""}
                  <span>${(term.aliases || []).join(" / ")}</span>
                </div>
                <p>${term.plain}</p>
                <dl>
                  <dt>在哪儿</dt>
                  <dd>${term.where}</dd>
                  <dt>例子</dt>
                  <dd>${term.example}</dd>
                </dl>
                ${renderRelated(term)}
              </article>
            `).join("")}
          </div>
        </section>
      `;
    })
    .join("");

  root.innerHTML = html || `<div class="empty"><p>暂时没找到这个词。可以换个说法，比如“刹车”“中控”“仪表”。</p></div>`;
}

async function init() {
  const response = await fetch("./data/glossary_terms.json?v=related-lessons-2");
  const payload = await response.json();
  categories = payload.categories;
  const params = new URLSearchParams(window.location.search);
  const term = params.get("term");
  if (term) input.value = term;
  renderChips();
  render();
}

input.addEventListener("input", render);
categoryChips.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  renderChips();
  render();
});

init().catch((error) => {
  root.innerHTML = `<div class="empty"><p>词典加载失败：${error.message}</p></div>`;
});
