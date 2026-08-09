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

    // 處理搜尋
    if (query) {
        titleObj.textContent = `搜尋結果：${query}`;
        filterObj.style.display = 'none';
        displayWorks = displayWorks.filter(w => 
            w.title.includes(query) || 
            w.summary.includes(query) || 
            w.tags.some(t => t.includes(query))
        );
    } else {
        // 產生分類按鈕
        const categories = ["全部", ...new Set(siteData.works.map(w => w.category))];
        filterObj.innerHTML = categories.map(cat => 
            `<button class="cat-btn ${cat === '全部' ? 'active' : ''}" onclick="filterWorks('${cat}', this)">${cat}</button>`
        ).join('');
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
