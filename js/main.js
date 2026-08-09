// ==========================================
// 網站核心邏輯 (不需要修改這裡)
// ==========================================

// 1. 初始化深色模式
function initTheme() {
    const themeBtn = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme');
    
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeBtn.textContent = '☀️';
    }

    themeBtn.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeBtn.textContent = '🌙';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeBtn.textContent = '☀️';
        }
    });
}

// 2. 初始化搜尋功能
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if(searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const keyword = e.target.value.trim();
                if(keyword) {
                    window.location.href = `works.html?q=${encodeURIComponent(keyword)}`;
                }
            }
        });
    }
}

// 3. 首頁渲染
function initHome() {
    initTheme();
    initSearch();
    
    // 渲染推薦作品 (取第一筆連載)
    const featuredWork = siteData.works.find(w => w.status === '連載中');
    const featuredContainer = document.getElementById('featured-container');
    if(featuredWork && featuredContainer) {
        featuredContainer.innerHTML = `
            <a href="work.html?id=${featuredWork.id}" class="work-row">
                <div>
                    <span class="tag status">${featuredWork.status}</span>
                    <span class="tag">${featuredWork.category}</span>
                </div>
                <h3 class="card-title">${featuredWork.title}</h3>
                <p class="card-desc">${featuredWork.summary}</p>
            </a>
        `;
    }

    // 渲染最新文章 (前 6 篇)
    const latestContainer = document.getElementById('latest-articles');
    if (latestContainer) {
        // 依日期排序
        const sortedArticles = [...siteData.articles].sort((a, b) => new Date(b.date) - new Date(a.date));
        const topArticles = sortedArticles.slice(0, 6);

        latestContainer.innerHTML = topArticles.map(article => {
            const work = siteData.works.find(w => w.id === article.workId);
            return `
                <a href="article.html?id=${article.id}" class="card">
                    <div class="card-meta">
                        <span>🗓️ ${article.date}</span>
                        <span>📚 ${work ? work.title : '未分類'}</span>
                    </div>
                    <h3 class="card-title">${article.chapter}${article.title}</h3>
                    <p class="card-desc">${article.content.replace(/\n/g, ' ').substring(0, 50)}...</p>
                    <span class="card-btn">Read More →</span>
                </a>
            `;
        }).join('');
    }
}

// 4. 作品列表頁渲染
function initWorks() {
    initTheme();
    initSearch();
    
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    
    const container = document.getElementById('works-container');
    const titleObj = document.getElementById('works-page-title');
    const filterObj = document.getElementById('categories-filter');
    
    let displayWorks = siteData.works;

function initSearch() {
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    
    if (!input || !results) return;

    // 檢查資料庫是否存在，避免報錯
    if (typeof database === 'undefined') {
        console.error('找不到資料庫，請確認 database.js 是否正確載入');
        return;
    }

    let isComposing = false; // 用來記錄是否正在使用中文輸入法選字

    // 中文輸入法：開始選字
    input.addEventListener('compositionstart', () => {
        isComposing = true;
    });

    // 中文輸入法：選字完成
    input.addEventListener('compositionend', (e) => {
        isComposing = false;
        performSearch(e.target.value);
    });

    // 一般輸入觸發
    input.addEventListener('input', (e) => {
        if (isComposing) return; // 如果正在選字，先不觸發搜尋，等選完再搜
        performSearch(e.target.value);
    });

    // 支援按下 Enter 鍵直接進入第一個搜尋結果
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const firstResult = results.querySelector('a.search-item');
            if (firstResult) {
                window.location.href = firstResult.href;
            }
        }
    });

    // 當點擊回搜尋框時，如果有先前的字就再次顯示結果
    input.addEventListener('focus', (e) => {
        if (e.target.value.trim() && results.innerHTML !== '') {
            results.style.display = 'block';
        }
    });

    // 點擊畫面其他地方時，隱藏搜尋結果
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-search')) {
            results.style.display = 'none';
        }
    });

    // --- 執行搜尋的核心邏輯 ---
    function performSearch(rawQuery) {
        const query = rawQuery.trim().toLowerCase();
        
        if (!query) {
            results.style.display = 'none';
            return;
        }

        // 搜尋作品 (加入防呆：確保 w.title 和 w.tags 存在才比對，避免報錯)
        const matchedWorks = (database.works || []).filter(w => {
            const matchTitle = w.title && w.title.toLowerCase().includes(query);
            const matchTags = w.tags && w.tags.some(t => t.toLowerCase().includes(query));
            return matchTitle || matchTags;
        });
        
        // 搜尋文章 (加入防呆：確保 a.title 和 a.content 存在才比對)
        const matchedArticles = (database.articles || []).filter(a => {
            const matchTitle = a.title && a.title.toLowerCase().includes(query);
            const matchContent = a.content && a.content.toLowerCase().includes(query);
            return matchTitle || matchContent;
        });

        let html = '';
        
        // 產生作品的 HTML
        matchedWorks.forEach(w => {
            html += `<a href="work.html?id=${w.id}" class="search-item">📖 [作品] ${w.title}</a>`;
        });
        
        // 產生文章的 HTML
        matchedArticles.forEach(a => {
            const work = (database.works || []).find(w => w.id === a.workId);
            const workTitle = work && work.title ? work.title + ' - ' : '';
            html += `<a href="article.html?id=${a.id}" class="search-item">📄 [文章] ${workTitle}${a.title}</a>`;
        });

        // 如果都找不到結果
        if (!html) {
            html = '<div class="search-item" style="color: var(--text-sec); cursor: default;">找不到相符的結果...</div>';
        }
        
        results.innerHTML = html;
        results.style.display = 'block';
    }
}
    renderWorksList(displayWorks, container);
}

// 供點擊分類按鈕使用
window.filterWorks = function(category, btnElement) {
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    
    const container = document.getElementById('works-container');
    if (category === '全部') {
        renderWorksList(siteData.works, container);
    } else {
        const filtered = siteData.works.filter(w => w.category === category);
        renderWorksList(filtered, container);
    }
}

function renderWorksList(works, container) {
    if(works.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-sub);">找不到相關作品。</p>';
        return;
    }
    
    container.innerHTML = works.map(work => `
        <a href="work.html?id=${work.id}" class="work-row">
            <div>
                <span class="tag status">${work.status}</span>
                <span class="tag">${work.category}</span>${work.tags.map(t => `<span class="tag" style="background:var(--accent-pink)">#${t}</span>`).join(' ')}
            </div>
            <h3 class="card-title">${work.title}</h3>
            <p class="card-desc">${work.summary}</p>
            <div class="card-meta">最後更新：${work.date}</div>
        </a>
    `).join('');
}

// 5. 單一作品詳細頁渲染
function initWorkDetail() {
    initTheme();
    initSearch();
    
    const urlParams = new URLSearchParams(window.location.search);
    const workId = urlParams.get('id');
    const work = siteData.works.find(w => w.id === workId);
    
    if(!work) {
        document.getElementById('work-info').innerHTML = '<h1>找不到作品</h1>';
        return;
    }

    // 渲染作品資訊
    document.getElementById('work-info').innerHTML = `
        <h1>${work.title}</h1>
        <div>
            <span class="tag status">${work.status}</span>${work.tags.map(t => `<span class="tag" style="background:var(--accent-pink)">#${t}</span>`).join(' ')}
        </div>
        <p class="work-desc">${work.description}</p>
    `;

    // 渲染章節列表
    const chapters = siteData.articles.filter(a => a.workId === workId);
    const listContainer = document.getElementById('chapter-list');
    
    if(chapters.length === 0) {
        listContainer.innerHTML = '<p style="text-align:center; color:var(--text-sub);">作者正在努力碼字中...</p>';
    } else {
        listContainer.innerHTML = chapters.map(ch => `
            <a href="article.html?id=${ch.id}" class="chapter-item">
                <span style="font-weight:bold;">${ch.chapter} -${ch.title}</span>
                <span style="color:var(--text-sub); font-size:0.9rem;">${ch.date}</span>
            </a>
        `).join('');
    }
}

// 6. 文章閱讀頁渲染
function initArticle() {
    initTheme();
    initSearch();
    
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    const article = siteData.articles.find(a => a.id === articleId);
    
    if(!article) {
        document.getElementById('article-content').innerHTML = '<h1 style="text-align:center;">文章不存在</h1>';
        return;
    }

    const work = siteData.works.find(w => w.id === article.workId);
    document.title = `${article.title}｜${work ? work.title : '寫作基地'}`;

    // 處理正文換行 (將純文字換行轉為 <p> 標籤，達成小說閱讀感)
    const formattedContent = article.content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => `<p>${line}</p>`)
        .join('');

    document.getElementById('article-content').innerHTML = `
        <header class="article-header">
            <div class="article-meta">
                ${work ? `<a href="work.html?id=${work.id}" style="text-decoration:underline;">${work.title}</a>` : ''} 
                / ${article.date}
            </div>
            <h1>${article.chapter}${article.title}</h1>
        </header>
        <div class="article-body">
            ${formattedContent}
        </div>
    `;

    // 處理上一篇 / 下一篇邏輯
    const workArticles = siteData.articles.filter(a => a.workId === article.workId);
    const currentIndex = workArticles.findIndex(a => a.id === article.id);
    
    const prevBtn = currentIndex > 0 
        ? `<button class="nav-btn" onclick="location.href='article.html?id=${workArticles[currentIndex-1].id}'">← 上一章</button>`
        : `<button class="nav-btn" disabled>← 上一章</button>`;
        
    const nextBtn = currentIndex < workArticles.length - 1 
        ? `<button class="nav-btn" onclick="location.href='article.html?id=${workArticles[currentIndex+1].id}'">下一章 →</button>`
        : `<button class="nav-btn" disabled>下一章 →</button>`;

    document.getElementById('article-nav').innerHTML = `
        ${prevBtn}
        <button class="back-btn" onclick="location.href='work.html?id=${article.workId}'">返回目錄</button>
        ${nextBtn}
    `;
}

// 非特定頁面初始化 (如 about.html) 確保 Navbar 運作
if (!window.location.pathname.includes('.html') || window.location.pathname.includes('about.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        initSearch();
    });
}
