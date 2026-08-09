const list = document.getElementById("worksList");
const filters = document.getElementById("filterButtons");
const search = document.getElementById("searchInput");

let activeCategory = new URLSearchParams(location.search).get("category") || "全部";

const categories = [
"全部",
...new Set(WORKS.map(work => work.category))
];

/* =========================
建立分類按鈕
========================= */

function renderFilters() {
filters.innerHTML = categories
.map(category => `       <button
        type="button"
        class="filter ${category === activeCategory ? "active" : ""}"
        data-category="${escapeHTML(category)}"       >
        ${escapeHTML(category)}       </button>
    `)
.join("");
}

/* =========================
正規化搜尋文字
解決：

* 前後空白
* 多餘空白
* 英文大小寫
  ========================= */

function normalizeText(value) {
return String(value || "")
.trim()
.toLocaleLowerCase("zh-Hant")
.replace(/\s+/g, " ");
}

/* =========================
建立每部作品完整搜尋內容

搜尋範圍：
✓ 作品名稱
✓ 作品分類
✓ 作品標籤
✓ 作品簡介
✓ 章節名稱
✓ 章節摘要
========================= */

function createSearchText(work) {
const chapterText = work.chapters
.map(chapter => [
chapter.title,
chapter.summary,
chapter.date
].join(" "))
.join(" ");

return normalizeText([
work.title,
work.category,
work.status,
work.description,
...(work.tags || []),
chapterText
].join(" "));
}

/* =========================
搜尋
========================= */

function searchWorks(keyword) {
const query = normalizeText(keyword);

return WORKS.filter(work => {

```
/* 分類篩選 */
const categoryMatch =
  activeCategory === "全部" ||
  work.category === activeCategory;

if (!categoryMatch) {
  return false;
}

/* 沒有搜尋文字 */
if (!query) {
  return true;
}

/*
  支援多個關鍵字：

  例如：
  「電競 孤獨」

  會要求兩個關鍵字
  都存在於作品資料中。
*/

const keywords = query
  .split(" ")
  .filter(Boolean);

const searchText = createSearchText(work);

return keywords.every(keyword =>
  searchText.includes(keyword)
);
```

});
}

/* =========================
顯示搜尋結果
========================= */

function renderWorks() {

const keyword = search.value;

const results = searchWorks(keyword);

const query = normalizeText(keyword);

/*
顯示搜尋結果數量
*/

const resultText = document.getElementById("searchResultCount");

if (resultText) {

```
if (query) {
  resultText.textContent =
    `找到 ${results.length} 部相關作品`;
} else {
  resultText.textContent =
    `共 ${results.length} 部作品`;
}
```

}

/*
沒有結果
*/

if (results.length === 0) {

```
list.innerHTML = `
  <div class="empty search-empty">
    <div class="empty-icon">⌕</div>

    <strong>沒有找到相關作品</strong>

    <p>
      試試其他關鍵字，或清除目前的分類篩選。
    </p>

    <button
      type="button"
      class="button"
      id="clearSearch"
    >
      清除搜尋
    </button>
  </div>
`;

document
  .getElementById("clearSearch")
  ?.addEventListener("click", clearSearch);

return;
```

}

/*
顯示作品
*/

list.innerHTML = results
.map(work => {

```
  const latestChapter =
    work.chapters && work.chapters.length
      ? work.chapters[work.chapters.length - 1]
      : null;

  return `
    <article class="work-card">

      <div>

        <div class="meta">

          <span>
            ${escapeHTML(work.category)}
          </span>

          ${(work.tags || [])
            .map(tag => `
              <span class="tag">
                #${escapeHTML(tag)}
              </span>
            `)
            .join("")}

        </div>

        <h2>
          ${highlightText(
            work.title,
            keyword
          )}
        </h2>

        <p class="desc">
          ${highlightText(
            work.description,
            keyword
          )}
        </p>

        ${
          latestChapter
            ? `
              <p class="latest-info">
                最新章節：
                <strong>
                  ${escapeHTML(latestChapter.title)}
                </strong>
                <span>
                  · ${escapeHTML(latestChapter.date)}
                </span>
              </p>
            `
            : ""
        }

        <a
          class="text-link"
          href="work.html?id=${encodeURIComponent(work.id)}"
        >
          查看章節 →
        </a>

      </div>

      <div class="work-side">

        <span class="status">
          ${escapeHTML(work.status)}
        </span>

      </div>

    </article>
  `;
})
.join("");
```

}

/* =========================
搜尋框事件
========================= */

search.addEventListener("input", () => {
renderWorks();
});

/* =========================
Enter 搜尋
========================= */

search.addEventListener("keydown", event => {

if (event.key === "Enter") {
event.preventDefault();
renderWorks();
}

});

/* =========================
分類按鈕事件
========================= */

filters.addEventListener("click", event => {

const button =
event.target.closest(".filter");

if (!button) {
return;
}

activeCategory =
button.dataset.category;

/*
更新 URL

```
例如：

works.html?category=連載
```

*/

const url = new URL(
window.location.href
);

if (activeCategory === "全部") {
url.searchParams.delete("category");
} else {
url.searchParams.set(
"category",
activeCategory
);
}

/*
不重新整理頁面
*/

window.history.replaceState(
{},
"",
url
);

/*
更新按鈕樣式
*/

document
.querySelectorAll(".filter")
.forEach(button => {

```
  button.classList.toggle(
    "active",
    button.dataset.category === activeCategory
  );

});
```

renderWorks();
});

/* =========================
清除搜尋
========================= */

function clearSearch() {

search.value = "";

activeCategory = "全部";

const url = new URL(
window.location.href
);

url.searchParams.delete("category");

window.history.replaceState(
{},
"",
url
);

document
.querySelectorAll(".filter")
.forEach(button => {

```
  button.classList.toggle(
    "active",
    button.dataset.category === "全部"
  );

});
```

renderWorks();
}

/* =========================
HTML 安全處理
========================= */

function escapeHTML(value) {

return String(value || "")
.replace(/&/g, "&")
.replace(/</g, "<")
.replace(/>/g, ">")
.replace(/"/g, """)
.replace(/'/g, "'");
}

/* =========================
搜尋結果關鍵字標示
========================= */

function highlightText(text, keyword) {

const safeText =
escapeHTML(text);

const keywords =
normalizeText(keyword)
.split(" ")
.filter(Boolean);

if (!keywords.length) {
return safeText;
}

let result = safeText;

keywords.forEach(word => {

```
const escapedWord =
  word.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

const regex =
  new RegExp(
    `(${escapedWord})`,
    "gi"
  );

result =
  result.replace(
    regex,
    "<mark>$1</mark>"
  );
```

});

return result;
}

/* =========================
初始化
========================= */

renderFilters();
renderWorks();
