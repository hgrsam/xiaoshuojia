/* ===================================================
   小说家 APP - 主逻辑文件 (Part 1: 核心数据 + 路由 + 仪表盘)
   =================================================== */

// ========== 全局状态 ==========
const App = {
  currentPage: 'dashboard',
  currentNovel: null,
  currentChapter: null,
  focusMode: false,
  aiPanelOpen: false,
  theme: 'dark',
  eyeCareMode: false,
  autoSaveTimer: null,
};

// ========== 本地数据库 (localStorage) ==========
const DB = {
  get(key, def = null) {
    try {
      const v = localStorage.getItem('novelist_' + key);
      return v ? JSON.parse(v) : def;
    } catch { return def; }
  },
  set(key, val) {
    try { localStorage.setItem('novelist_' + key, JSON.stringify(val)); } catch {}
  },
  getNovels() { return this.get('novels', []); },
  setNovels(arr) { this.set('novels', arr); },
  getSettings() {
    return this.get('settings', {
      theme: 'dark', fontSize: 16, fontFamily: 'serif',
      lineHeight: 2, autoSave: true, focusMode: false,
      dailyGoal: 2000, bgMusic: false
    });
  },
  setSettings(s) { this.set('settings', s); },
  getChapters(novelId) { return this.get('chapters_' + novelId, []); },
  setChapters(novelId, arr) { this.set('chapters_' + novelId, arr); },
  getCharacters(novelId) { return this.get('chars_' + novelId, []); },
  setCharacters(novelId, arr) { this.set('chars_' + novelId, arr); },
  getOutline(novelId) { return this.get('outline_' + novelId, []); },
  setOutline(novelId, arr) { this.set('outline_' + novelId, arr); },
  getTodayWords() { return this.get('today_words_' + todayKey(), 0); },
  addTodayWords(n) {
    const cur = this.getTodayWords();
    this.set('today_words_' + todayKey(), cur + n);
  },
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}${d.getMonth()+1}${d.getDate()}`;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}

// ========== 初始化示例数据 ==========
function initDemoData() {
  if (DB.getNovels().length > 0) return;
  const novels = [
    {
      id: 'demo1', title: '星际流浪者', type: 'long', genre: 'scifi',
      desc: '人类文明末日，最后一艘飞船承载着万人命运穿越星际，寻找新的家园。',
      wordTarget: 200000, icon: '🚀', coverClass: 'cover-scifi',
      created: Date.now() - 86400000 * 30, updated: Date.now() - 3600000,
      status: 'writing'
    },
    {
      id: 'demo2', title: '京城探案录', type: 'medium', genre: 'mystery',
      desc: '清末民初，神探陆文昭穿梭于京城迷雾，破解一桩桩离奇案件。',
      wordTarget: 80000, icon: '🔍', coverClass: 'cover-mystery',
      created: Date.now() - 86400000 * 15, updated: Date.now() - 86400000,
      status: 'writing'
    },
    {
      id: 'demo3', title: '花朝月夕', type: 'short', genre: 'romance',
      desc: '一段跨越时空的爱恋，在花朝节相遇，在月夕时别离。',
      wordTarget: 20000, icon: '🌸', coverClass: 'cover-romance',
      created: Date.now() - 86400000 * 5, updated: Date.now() - 7200000,
      status: 'finished'
    },
  ];
  DB.setNovels(novels);

  // 示例章节
  const chapters1 = [
    { id: 'c1', novelId: 'demo1', title: '第一章 末日前夕', content: '2387年，地球表面温度持续攀升。人类的最后希望，是那艘正在建造中的星际飞船——"诺亚"号。\n\n林远站在发射台上，望着蔚蓝色的地球，心中百感交集。作为飞船的首席工程师，他清楚地知道，这不仅是一次航行，更是整个人类文明的延续。\n\n"准备好了吗？"身后传来熟悉的声音。\n\n林远转过身，看到了穿着联合政府制服的苏晴。她是这次任务的指挥官，也是他多年的老友。', order: 1, words: 450 },
    { id: 'c2', novelId: 'demo1', title: '第二章 启航', content: '发射倒计时开始。整个地球都在注视着这一刻——人类最后的希望即将飞向星空。\n\n"T减十秒……"\n\n控制室内，所有人屏住呼吸。林远的手指悬在控制台上方，等待着最后的指令。\n\n"……五，四，三，二，一——"\n\n轰鸣声震天，蓝色的离子火焰将飞船托起，冲破云层，向着无尽的星海驶去。', order: 2, words: 380 },
    { id: 'c3', novelId: 'demo1', title: '第三章 星际迷途', content: '飞船进入深空已经一年零七个月。', order: 3, words: 50 },
  ];
  DB.setChapters('demo1', chapters1);

  const chapters2 = [
    { id: 'cc1', novelId: 'demo2', title: '第一章 尸身无头', content: '光绪三十年秋，京城连降大雨。\n\n朝阳门外的一处废弃宅院里，发现了一具无头男尸。陆文昭接到消息赶来，蹲下身仔细检查。\n\n"死亡时间约在昨夜子时，手掌茧子分布显示死者是个车夫，但衣物却是绸缎……"他喃喃自语，脑中已开始快速运转。', order: 1, words: 320 },
    { id: 'cc2', novelId: 'demo2', title: '第二章 线索', content: '经过三天调查，陆文昭终于找到了第一条线索。', order: 2, words: 40 },
  ];
  DB.setChapters('demo2', chapters2);

  const chapters3 = [
    { id: 'ccc1', novelId: 'demo3', title: '序章 花朝', content: '农历二月十五，花朝节。\n\n漫天飞舞的花瓣中，沈画第一次见到了那个少年。他站在桃花树下，白衣如雪，眼神清澈如山间溪流。\n\n那一刻，她以为自己遇到了神仙。', order: 1, words: 110 },
    { id: 'ccc2', novelId: 'demo3', title: '第一章 重逢', content: '三年后，沈画再次见到了那个人。', order: 2, words: 35 },
  ];
  DB.setChapters('demo3', chapters3);

  // 示例人物
  DB.setCharacters('demo1', [
    { id: 'char1', novelId: 'demo1', name: '林远', role: '主角', age: '32岁', gender: '男', icon: '👨‍🚀', tags: ['工程师','理性','孤独'], desc: '飞船首席工程师，冷静理智，内心深处渴望归属。' },
    { id: 'char2', novelId: 'demo1', name: '苏晴', role: '女主', age: '30岁', gender: '女', icon: '👩‍✈️', tags: ['指挥官','坚毅','温柔'], desc: '任务指挥官，表面强硬，内心细腻。' },
    { id: 'char3', novelId: 'demo1', name: '叶明', role: '配角', age: '25岁', gender: '男', icon: '👦', tags: ['年轻','热血','冲动'], desc: '最年轻的船员，充满活力。' },
  ]);
}

// ========== 路由 ==========
const pageTitles = {
  dashboard: '我的书房', write: '写作中心', library: '我的书库',
  script: '小说转剧本', comic: '小说转漫剧', outline: '大纲工具',
  characters: '人物管理', settings: '设置', stats: '写作统计',
  aicreate: 'AI一键创作'
};

function navigate(page, params = {}) {
  App.currentPage = page;
  document.getElementById('pageTitle').textContent = pageTitles[page] || page;

  // 更新导航激活状态
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // 移动端关闭侧边栏
  if (window.innerWidth <= 900) {
    document.getElementById('sidebar').classList.remove('open');
  }

  // 渲染页面
  const content = document.getElementById('content');
  content.className = 'content fade-in';

  switch(page) {
    case 'dashboard':  renderDashboard(content); break;
    case 'write':      renderWritePage(content, params); break;
    case 'library':    renderLibrary(content); break;
    case 'script':     renderScript(content, params); break;
    case 'comic':      renderComic(content, params); break;
    case 'outline':    renderOutline(content, params); break;
    case 'characters': renderCharacters(content, params); break;
    case 'settings':   renderSettings(content); break;
    case 'stats':     renderStatsReport(content); break;
    case 'aicreate':  renderAICreate(content); break;
    default:           renderDashboard(content);
  }

  updateSidebarStats();
}

// ========== 侧边栏 ==========
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ========== 护眼模式 ==========
function toggleEyeCareMode() {
  App.eyeCareMode = !App.eyeCareMode;
  document.body.classList.toggle('eye-care', App.eyeCareMode);
  const settings = DB.getSettings();
  settings.eyeCareMode = App.eyeCareMode;
  DB.setSettings(settings);
  updateEyeCareBtn();
  toast(App.eyeCareMode ? '护眼模式已开启' : '护眼模式已关闭', 'success');
}

function updateEyeCareBtn() {
  const btn = document.getElementById('eyeCareBtn');
  if (btn) {
    btn.textContent = App.eyeCareMode ? '👁️' : '🔆';
    btn.classList.toggle('active', App.eyeCareMode);
  }
}

// ========== 写作统计 ==========
function renderStatsReport(el) {
  const novels = DB.getNovels();
  const settings = DB.getSettings();
  
  // 计算统计数据
  let totalWords = 0, totalChapters = 0;
  const novelStats = novels.map(n => {
    const chapters = DB.getChapters(n.id);
    const words = chapters.reduce((s, c) => s + (c.words || 0), 0);
    totalWords += words;
    totalChapters += chapters.length;
    return { ...n, words, chapters: chapters.length };
  });
  
  // 7天写作数据
  const weekData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}${d.getMonth()+1}${d.getDate()}`;
    const words = DB.get('today_words_' + key, 0);
    weekData.push({
      day: ['日','一','二','三','四','五','六'][d.getDay()],
      words: words
    });
  }
  
  // 计算写作速度（字/小时）
  const avgSpeed = totalChapters > 0 ? Math.round(totalWords / (totalChapters * 2)) : 0;
  
  // 类型分布
  const typeStats = { short: 0, medium: 0, long: 0 };
  novelStats.forEach(n => { typeStats[n.type] = (typeStats[n.type] || 0) + n.words; });
  
  el.innerHTML = `
    <div class="section-header">
      <div class="section-title">📊 写作统计报告</div>
      <button class="btn btn-secondary" onclick="navigate('dashboard')">← 返回</button>
    </div>
    
    <!-- 概览卡片 -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-card-icon">📝</div>
        <div class="stat-card-num">${formatNum(totalWords)}</div>
        <div class="stat-card-label">累计字数</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon">📚</div>
        <div class="stat-card-num">${novels.length}</div>
        <div class="stat-card-label">作品数量</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon">📄</div>
        <div class="stat-card-num">${totalChapters}</div>
        <div class="stat-card-label">章节总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon">⚡</div>
        <div class="stat-card-num">${avgSpeed}</div>
        <div class="stat-card-label">均章字数</div>
      </div>
    </div>
    
    <!-- 7日写作趋势 -->
    <div class="card" style="margin-top:24px">
      <div class="card-title">📈 近7日写作趋势</div>
      <div class="week-chart" id="weekChart">
        ${weekData.map((d, i) => {
          const max = Math.max(...weekData.map(w => w.words), 1);
          const height = Math.max(10, (d.words / max) * 100);
          return `<div class="chart-bar"><div class="bar" style="height:${height}%"></div><div class="bar-label">${d.day}</div><div class="bar-value">${d.words > 0 ? formatNum(d.words) : '-'}</div></div>`;
        }).join('')}
      </div>
    </div>
    
    <!-- 类型分布 -->
    <div class="card" style="margin-top:24px">
      <div class="card-title">📚 作品类型分布</div>
      <div class="type-distribution">
        ${Object.entries(typeStats).map(([type, words]) => {
          const pct = totalWords > 0 ? Math.round(words / totalWords * 100) : 0;
          const labels = { short: '短篇', medium: '中篇', long: '长篇' };
          const colors = { short: '#10b981', medium: '#f59e0b', long: '#6c63ff' };
          return `
            <div class="dist-item">
              <div class="dist-label"><span class="badge badge-${type}">${labels[type]}</span></div>
              <div class="dist-bar"><div class="dist-fill" style="width:${pct}%;background:${colors[type]}"></div></div>
              <div class="dist-value">${formatNum(words)}字 (${pct}%)</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    
    <!-- 作品详情 -->
    <div class="card" style="margin-top:24px">
      <div class="card-title">📖 作品详情</div>
      <div class="novel-stats-list">
        ${novelStats.map(n => {
          const pct = Math.min(100, Math.round(n.words / (n.wordTarget || 1) * 100));
          return `
            <div class="novel-stat-item">
              <div class="novel-stat-header">
                <span class="novel-stat-icon">${n.icon || '📖'}</span>
                <span class="novel-stat-title">${n.title}</span>
                <span class="badge badge-${n.type}">${n.type === 'short' ? '短篇' : n.type === 'medium' ? '中篇' : '长篇'}</span>
              </div>
              <div class="novel-stat-body">
                <div class="novel-stat-words">${formatNum(n.words)} / ${formatNum(n.wordTarget)} 字</div>
                <div class="progress-bar" style="margin:8px 0"><div class="progress-fill" style="width:${pct}%"></div></div>
                <div class="novel-stat-meta">${n.chapters}章 · ${pct}%完成</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    
    <!-- 导出报告 -->
    <div style="margin-top:24px;display:flex;gap:12px">
      <button class="btn btn-primary" onclick="exportStatsReport()">📊 导出统计报告</button>
      <button class="btn btn-secondary" onclick="exportNovelToDocx()">📄 导出Word文档</button>
      <button class="btn btn-secondary" onclick="exportToPDF()">📑 导出PDF</button>
    </div>
  `;
}

function exportStatsReport() {
  const novels = DB.getNovels();
  let report = `# 小说家 - 写作统计报告\n\n生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
  
  let totalWords = 0;
  novels.forEach(n => {
    const chapters = DB.getChapters(n.id);
    const words = chapters.reduce((s, c) => s + (c.words || 0), 0);
    totalWords += words;
    report += `## 《${n.title}》\n`;
    report += `- 类型: ${n.type === 'short' ? '短篇' : n.type === 'medium' ? '中篇' : '长篇'}\n`;
    report += `- 字数: ${words} / ${n.wordTarget}\n`;
    report += `- 章节: ${chapters.length}\n`;
    report += `- 完成度: ${Math.min(100, Math.round(words / (n.wordTarget || 1) * 100))}%\n\n`;
  });
  
  report += `## 总计\n`;
  report += `- 总作品数: ${novels.length}\n`;
  report += `- 总字数: ${totalWords}\n`;
  
  const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '写作统计报告_' + new Date().toLocaleDateString('zh-CN') + '.md';
  a.click();
  URL.revokeObjectURL(url);
  toast('统计报告已导出', 'success');
}

// ========== 章节拖拽排序 ==========
let draggedChapterId = null;

function initChapterDragSort() {
  const list = document.getElementById('chapterList');
  if (!list) return;
  
  list.querySelectorAll('.chapter-item').forEach(item => {
    item.setAttribute('draggable', 'true');
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
  });
}

function handleDragStart(e) {
  draggedChapterId = e.target.dataset.chapterId;
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.chapter-item').forEach(item => item.classList.remove('drag-over'));
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const item = e.target.closest('.chapter-item');
  if (item && item.dataset.chapterId !== draggedChapterId) {
    item.classList.add('drag-over');
  }
}

function handleDrop(e) {
  e.preventDefault();
  const targetItem = e.target.closest('.chapter-item');
  if (!targetItem || !draggedChapterId) return;
  
  const targetId = targetItem.dataset.chapterId;
  if (targetId === draggedChapterId) return;
  
  const nid = App.currentNovel?.id;
  if (!nid) return;
  
  const chapters = DB.getChapters(nid);
  const draggedIdx = chapters.findIndex(c => c.id === draggedChapterId);
  const targetIdx = chapters.findIndex(c => c.id === targetId);
  
  if (draggedIdx < 0 || targetIdx < 0) return;
  
  // 移动章节
  const [dragged] = chapters.splice(draggedIdx, 1);
  chapters.splice(targetIdx, 0, dragged);
  
  // 更新顺序
  chapters.forEach((c, i) => c.order = i + 1);
  DB.setChapters(nid, chapters);
  
  // 重新渲染
  renderWritePage(document.getElementById('content'), { novelId: nid });
  toast('章节顺序已调整', 'success');
}

// ========== 写作提示词库 ==========
const WritingPrompts = {
  // 题材指南
  genres: {
    '都市甜宠': {
      name: '都市甜宠言情',
      icon: '💕',
      desc: '先婚后爱、合租心动、高糖无虐、细腻日常',
      keywords: ['甜宠', '日常', '心动', '治愈'],
      rules: [
        '背景：现代都市，贴近现实生活，有烟火气',
        '感情线：从陌生→暧昧试探→双向动心→自然相爱',
        '女主：独立清醒、性格温柔/软萌/通透',
        '男主：温柔体贴、情绪稳定、行动力强',
        '文风：清新流畅、细腻温柔、有画面感',
        '禁止：虐心、狗血误会、恶毒女配'
      ],
      scene: [
        '同居/合租细节、三餐、加班晚归',
        '生病照顾、天气变化、节日小惊喜',
        '睡前聊天、下意识关心'
      ]
    },
    '都市言情': {
      name: '都市言情小说',
      icon: '🌆',
      desc: '双向情感拉扯、成长救赎、势均力敌',
      keywords: ['言情', '都市', '成长', '救赎'],
      rules: [
        '背景：一线城市/新一线城市，真实都市场景',
        '主线：爱情线为主，副线可搭配职场线/家庭线',
        '人设：男女主性格鲜明、有反差感、有成长弧光',
        '女主：独立清醒、有自我追求',
        '男主：温柔/克制/深情/有担当',
        '结局：优先HE，传递正向爱情观'
      ],
      scene: [
        '职场、商圈、公寓、咖啡馆',
        '地铁、夜景、节日氛围',
        '冲突误会、考验、成长蜕变'
      ]
    },
    '古代言情': {
      name: '古代言情小说',
      icon: '🏯',
      desc: '古风背景、含蓄深情、礼教秩序与情感拉扯',
      keywords: ['古风', '言情', '权谋', '深情'],
      rules: [
        '背景：明确古代时期或经典架空朝代',
        '场景：宫廷、宅院、书院、市集、茶楼、园林',
        '人设：女主聪慧清醒有才情，男主谦和隐忍深情',
        '文风：清雅流畅、富有古韵与画面感',
        '情感：发乎情止乎礼，含蓄中见深情',
        '禁忌：轻浮强取、油腻轻佻'
      ],
      scene: [
        '灯会、节庆、礼制活动',
        '诗词歌赋、琴棋书画',
        '家族纷争、朝堂权谋'
      ]
    },
    '种田文': {
      name: '种田文小说',
      icon: '🌾',
      desc: '慢节奏、写实生活、细水长流',
      keywords: ['种田', '穿越', '经营', '治愈'],
      rules: [
        '基调：温暖治愈温馨为主',
        '冲突：种地难题、邻里琐事、误会',
        '双线：生计线（开荒、种菜、攒钱、盖房）+ 人情线',
        '文风：口语化接地气，多聊庄稼、吃食、邻里琐事',
        '人物：安排节俭配角，常提"省着点"',
        '爽点：细水长流型，不靠逆袭金手指开挂'
      ],
      scene: [
        '农具、节气、农活步骤',
        '家人相处、邻里往来',
        '小家和睦、柴米油盐'
      ]
    },
    '玄幻爽文': {
      name: '玄幻爽文创作',
      icon: '⚔️',
      desc: '系统流、升级打怪、扮猪吃虎、爽点密集',
      keywords: ['玄幻', '爽文', '系统', '升级'],
      rules: [
        '金手指：系统、神功、空间、重生等必须有存在感',
        '情绪曲线：压抑→转折→爆发→舒爽',
        '信息差：扮猪吃虎逻辑，拉高期待值',
        '套娃爽点：解决小麻烦引出更大麻烦',
        '章末钩子：危机降临、反转、新目标',
        '节奏：每500字至少一个小爽点'
      ],
      scene: [
        '越级反杀、揭开秘密、获得宝物',
        '当众羞辱、亲友被害、生死一线',
        '底牌翻开、实力碾压、众人震惊'
      ]
    },
    '悬疑推理': {
      name: '悬疑推理小说',
      icon: '🔍',
      desc: '层层悬念、逻辑推理、意外反转',
      keywords: ['悬疑', '推理', '破案', '反转'],
      rules: [
        '悬念：反常现象、未解之谜、关键信息部分揭露',
        '推理：从线索到结论的严密逻辑链',
        '反转：颠覆读者预期的情节逆转',
        '伏笔：隐蔽细节草蛇灰线',
        '节奏：紧张感持续升级',
        '结局：真相揭示、逻辑闭环'
      ],
      scene: [
        '案发现场、线索发现',
        '推理分析、排除嫌疑',
        '关键证据、真相大白'
      ]
    }
  },

  // 钩子设计体系
  hooks: {
    types: [
      { name: '悬念型', desc: '抛出反常现象或未解之谜', example: '月光下，那具尸体突然睁开了眼睛。' },
      { name: '危机型', desc: '新危险突然降临，主角面临致命威胁', example: '他刚松口气，背后传来一道阴恻恻的声音："你以为真杀得了我？"' },
      { name: '反转型', desc: '颠覆读者预期的情节逆转', example: '她笑着接过茶杯，却在低头时，眼底闪过一丝寒光。' },
      { name: '秘密型', desc: '关键信息部分揭露，引人探究', example: '他摊开手，掌心躺着一枚玉佩——那是他亲手埋进母亲坟墓里的陪葬品。' },
      { name: '预告型', desc: '直接预告下一章的重大事件', example: '明日午时，斩仙台上，他将亲眼看着心爱之人人头落地。' },
      { name: '选择型', desc: '主角面临艰难抉择，结果未知', example: '系统弹出提示：是否献祭十年寿命，换取此刻的力量？' },
      { name: '发现型', desc: '主角意外发现惊天秘密', example: '古籍翻到最后一页，他瞳孔骤缩——原来自己的身世，竟是一场骗局。' },
      { name: '降临型', desc: '强大人物或势力突然登场', example: '轰！一道身影从天而降，全场跪倒。那人冷冷开口："谁动了我的人？"' }
    ],
    rules: [
      '位置固定：钩子必须在本章最后100字内出现',
      '情绪高点埋钩：紧跟本章最大爽点之后',
      '钩子即下一章发动机：必须能自然引出下一章核心矛盾',
      '拒绝烂尾钩：钩子必须能在下一章得到解答或推进'
    ]
  },

  // 去AI化提示
  deAIPrompts: {
    rules: [
      '情绪表达：摒弃情绪标签化描述，通过微动作、生理细节、下意识反应传递',
      '动作描写：拒绝单一极简动作词，加入力度、节奏、目的和身体反馈',
      '环境描写：环境为人物情绪/情节服务，不单独堆砌风物',
      '人物塑造：赋予人物专属行为习惯、性格反差、思维逻辑',
      '情节推进：拒绝经典套路复刻，冲突有因果关系',
      '文字风格：简洁克制，有留白，拒绝辞藻堆砌'
    ],
    avoidWords: [
      '突然', '猛然', '缓缓', '慢慢', '似乎', '仿佛',
      '非常', '十分', '极其', '格外',
      '美丽的', '痛苦的', '绝望的', '优秀的'
    ],
    techniques: [
      '用"冰山理论"：通过动作、环境或沉默侧面烘托内心',
      '删除无意义背景说明，用感官细节（嗅觉、触觉、肌肉跳动）',
      '打破均匀叙事速度：矛盾点"慢镜头"，过渡段"跳跃式"',
      '用精准动词支撑画面感，减少形容词',
      '对话增加潜台词与语气差异化'
    ]
  },

  // 审稿检查清单
  reviewChecklist: {
    logic: [
      '世界观设定（力量体系、金钱数值、势力分布）是否自洽',
      '场景转换是否突兀',
      '人物决策是否有动机支撑',
      '伏笔是否有回收',
      '时间线、人物年龄、等级阶层是否统一'
    ],
    character: [
      '主角言行是否符合初始设定',
      '主角成长是否有跳跃式',
      '情感递进是否自然',
      '配角是否沦为工具人'
    ],
    rhythm: [
      '黄金三章：开篇钩子是否够硬',
      '冲突是否在3章内爆发',
      '节奏排布是否符合目标平台',
      '是否有连续10章以上的无效情节'
    ],
    compliance: [
      '严禁色情擦边、血腥渲染',
      '严禁敏感时政、宗教民俗',
      '严禁抄袭、侵权',
      '禁用违禁词、谐音变体'
    ]
  }
};

// ========== 增强AI助手 ==========
let aiChatHistory = [];

// 题材指南面板
function openGenreGuide() {
  const genres = Object.entries(WritingPrompts.genres);
  let html = '<div class="genre-guide-container">';
  
  genres.forEach(([key, genre]) => {
    html += `
      <div class="genre-card" onclick="toggleGenreDetail('${key}')">
        <div class="genre-header">
          <span class="genre-icon">${genre.icon}</span>
          <span class="genre-name">${genre.name}</span>
        </div>
        <div class="genre-desc">${genre.desc}</div>
        <div class="genre-keywords">${genre.keywords.map(k => `<span class="genre-tag">${k}</span>`).join('')}</div>
      </div>
    `;
  });
  
  html += '</div>';
  html += '<div id="genreDetailPanel" class="genre-detail-panel" style="display:none"></div>';
  
  showModal('📚 题材创作指南', html, '<button class="btn btn-secondary" onclick="closeModal()">关闭</button>');
}

function toggleGenreDetail(key) {
  const genre = WritingPrompts.genres[key];
  const panel = document.getElementById('genreDetailPanel');
  if (!panel) return;
  
  panel.style.display = 'block';
  panel.innerHTML = `
    <div class="detail-header">
      <span class="detail-icon">${genre.icon}</span>
      <span class="detail-title">${genre.name} 创作规范</span>
    </div>
    <div class="detail-section">
      <div class="detail-section-title">📌 核心规则</div>
      ${genre.rules.map(r => `<div class="detail-item">${r}</div>`).join('')}
    </div>
    <div class="detail-section">
      <div class="detail-section-title">🎬 常用场景</div>
      ${genre.scene.map(s => `<div class="detail-item">• ${s}</div>`).join('')}
    </div>
    <button class="btn btn-primary btn-block" style="margin-top:16px" onclick="closeModal()">我知道了</button>
  `;
}

// 钩子设计器
function openHookDesigner() {
  const hooks = WritingPrompts.hooks;
  let html = `
    <div class="hook-intro">
      <p>🎣 <strong>钩子设计体系</strong> — 让读者无法停止追更的秘密</p>
    </div>
    <div class="hook-types">
      ${hooks.types.map(h => `
        <div class="hook-type-card">
          <div class="hook-type-name">${h.name}</div>
          <div class="hook-type-desc">${h.desc}</div>
          <div class="hook-example">"${h.example}"</div>
          <button class="btn btn-secondary btn-sm" onclick="useHookExample('${h.name}', '${h.example.replace(/"/g, '\\"')}')">使用此钩子</button>
        </div>
      `).join('')}
    </div>
    <div class="hook-rules">
      <div class="detail-section-title">📋 钩子黄金法则</div>
      ${hooks.rules.map(r => `<div class="detail-item">• ${r}</div>`).join('')}
    </div>
  `;
  
  showModal('🎣 钩子设计器', html, '<button class="btn btn-secondary" onclick="closeModal()">关闭</button>');
}

function useHookExample(type, example) {
  closeModal();
  insertText(`【${type}钩子】${example}`);
  toast(`已插入${type}钩子到编辑器`, 'success');
}

// 去AI痕迹面板
function openDeAIPanel() {
  const deAI = WritingPrompts.deAIPrompts;
  let html = `
    <div class="deai-intro">
      <p>✨ <strong>去AI化写作指南</strong> — 让你的文字更像"人"写的</p>
    </div>
    <div class="deai-section">
      <div class="detail-section-title">📝 基础规范</div>
      ${deAI.rules.map(r => `<div class="detail-item">• ${r}</div>`).join('')}
    </div>
    <div class="deai-section">
      <div class="detail-section-title">🚫 规避词汇（直接删除）</div>
      <div class="word-list">
        ${deAI.avoidWords.map(w => `<span class="word-badge">${w}</span>`).join('')}
      </div>
    </div>
    <div class="deai-section">
      <div class="detail-section-title">🎯 核心技巧</div>
      ${deAI.techniques.map(t => `<div class="detail-item">• ${t}</div>`).join('')}
    </div>
    <div class="deai-example">
      <div class="detail-section-title">💡 修改示例</div>
      <div class="example-compare">
        <div class="example-bad">
          <span class="example-label">❌ AI腔</span>
          <p>他感到非常悲伤，缓缓地走进房间里，仿佛一切都失去了意义。</p>
        </div>
        <div class="example-good">
          <span class="example-label">✅ 人类腔</span>
          <p>他推开门，鞋底在地板上蹭了蹭。屋里很暗，他没开灯，就那么站着。</p>
        </div>
      </div>
    </div>
  `;
  
  showModal('✨ 去AI痕迹优化指南', html, '<button class="btn btn-secondary" onclick="closeModal()">关闭</button>');
}

// 世界观构建器
function openWorldBuilder() {
  let html = `
    <div class="world-intro">
      <p>🌍 <strong>灵感架构师</strong> — 从碎片灵感构建宏大叙事</p>
    </div>
    <div class="world-section">
      <div class="detail-section-title">🏗️ 世界观构建四维度</div>
      <div class="world-dimension">
        <div class="dimension-card">
          <div class="dimension-icon">⚙️</div>
          <div class="dimension-name">底层法则</div>
          <div class="dimension-desc">力量体系的守恒定律、代价原则与边界限制</div>
        </div>
        <div class="dimension-card">
          <div class="dimension-icon">🏛️</div>
          <div class="dimension-name">权力结构</div>
          <div class="dimension-desc">地缘政治、种族阶级、核心冲突根源</div>
        </div>
        <div class="dimension-card">
          <div class="dimension-icon">📜</div>
          <div class="dimension-name">历史厚度</div>
          <div class="dimension-desc">过去对现在的影响，未揭开的远古伏笔</div>
        </div>
        <div class="dimension-card">
          <div class="dimension-icon">🎨</div>
          <div class="dimension-name">氛围基调</div>
          <div class="dimension-desc">克苏鲁式绝望、史诗奇幻庄严、赛博朋克冷硬</div>
        </div>
      </div>
    </div>
    <div class="world-section">
      <div class="detail-section-title">👤 多维人物矩阵</div>
      <div class="detail-item">• 核心驱动力：显性目标（想要什么）与隐性需求（真正需要什么）</div>
      <div class="detail-item">• 人物关系网：对抗者、盟友、导师、背叛者的动态转换</div>
      <div class="detail-item">• 成长/堕落曲线：角色因冲突产生的不可逆性格变迁</div>
    </div>
    <div class="world-section">
      <div class="detail-section-title">📖 叙事节奏公式</div>
      <div class="pacing-formula">
        <span class="formula-item">张力</span>
        <span class="formula-arrow">→</span>
        <span class="formula-item">爆发</span>
        <span class="formula-arrow">→</span>
        <span class="formula-item">余韵</span>
        <span class="formula-arrow">→</span>
        <span class="formula-item">铺垫</span>
      </div>
    </div>
  `;
  
  showModal('🌍 世界观构建指南', html, '<button class="btn btn-secondary" onclick="closeModal()">关闭</button>');
}

// 审稿助手
function openReviewHelper() {
  const checklist = WritingPrompts.reviewChecklist;
  let html = `
    <div class="review-intro">
      <p>🔎 <strong>12年资深编辑级审稿清单</strong></p>
    </div>
    <div class="review-section">
      <div class="detail-section-title">🧠 逻辑体系检查</div>
      ${checklist.logic.map(item => `
        <div class="review-check-item">
          <span class="check-icon">☐</span>
          <span>${item}</span>
        </div>
      `).join('')}
    </div>
    <div class="review-section">
      <div class="detail-section-title">👤 人设一致性检查</div>
      ${checklist.character.map(item => `
        <div class="review-check-item">
          <span class="check-icon">☐</span>
          <span>${item}</span>
        </div>
      `).join('')}
    </div>
    <div class="review-section">
      <div class="detail-section-title">⚡ 节奏平台适配</div>
      ${checklist.rhythm.map(item => `
        <div class="review-check-item">
          <span class="check-icon">☐</span>
          <span>${item}</span>
        </div>
      `).join('')}
    </div>
    <div class="review-section">
      <div class="detail-section-title">⚠️ 合规性检查</div>
      ${checklist.compliance.map(item => `
        <div class="review-check-item">
          <span class="check-icon">☐</span>
          <span>${item}</span>
        </div>
      `).join('')}
    </div>
    <button class="btn btn-primary btn-block" style="margin-top:16px" onclick="runSelfReview()">📋 对当前章节进行自审</button>
  `;
  
  showModal('🔎 审稿助手 - 自检清单', html, '<button class="btn btn-secondary" onclick="closeModal()">关闭</button>');
}

function runSelfReview() {
  const editor = document.getElementById('writeEditor');
  if (!editor) { toast('请在写作页面使用此功能', 'warning'); return; }
  
  const text = editor.innerText || '';
  const issues = [];
  
  // 简单检查
  const deAI = WritingPrompts.deAIPrompts;
  deAI.avoidWords.forEach(word => {
    if (text.includes(word)) {
      issues.push(`发现AI常用词："${word}"`);
    }
  });
  
  // 段落长度检查
  const paras = text.split('\n').filter(p => p.trim());
  paras.forEach((p, i) => {
    if (p.length > 200) {
      issues.push(`第${i+1}段过长（${p.length}字），建议拆分`);
    }
  });
  
  closeModal();
  
  if (issues.length === 0) {
    showModal('✅ 自审通过', `
      <div style="text-align:center;padding:20px">
        <div style="font-size:48px;margin-bottom:12px">🎉</div>
        <p>恭喜！未发现明显问题。</p>
        <p style="color:var(--text3);font-size:13px">建议：使用专业审稿工具进行深度检查</p>
      </div>
    `, '<button class="btn btn-primary" onclick="closeModal()">好的</button>');
  } else {
    showModal('⚠️ 发现以下问题', `
      <div style="max-height:300px;overflow-y:auto">
        ${issues.map(issue => `
          <div class="review-issue-item">
            <span class="issue-icon">⚠️</span>
            <span>${issue}</span>
          </div>
        `).join('')}
      </div>
    `, '<button class="btn btn-primary" onclick="closeModal()">知道了</button>');
  }
}

// 写作导师主面板
function openWritingMentor() {
  let html = `
    <div class="mentor-welcome">
      <div class="mentor-avatar">🎓</div>
      <h3>欢迎使用写作导师</h3>
      <p>这里整合了18种专业写作提示词，帮助你提升创作水平</p>
    </div>
    
    <div class="mentor-grid">
      <div class="mentor-card" onclick="openGenreGuide()">
        <div class="mentor-card-icon">📚</div>
        <div class="mentor-card-title">题材创作指南</div>
        <div class="mentor-card-desc">都市甜宠、古代言情、种田文、玄幻爽文等6大题材规范</div>
      </div>
      
      <div class="mentor-card" onclick="openHookDesigner()">
        <div class="mentor-card-icon">🎣</div>
        <div class="mentor-card-title">钩子设计器</div>
        <div class="mentor-card-desc">8种钩子类型，让读者追更停不下来</div>
      </div>
      
      <div class="mentor-card" onclick="openDeAIPanel()">
        <div class="mentor-card-icon">✨</div>
        <div class="mentor-card-title">去AI痕迹优化</div>
        <div class="mentor-card-desc">消除"AI腔"，让文字更有人的温度</div>
      </div>
      
      <div class="mentor-card" onclick="openWorldBuilder()">
        <div class="mentor-card-icon">🌍</div>
        <div class="mentor-card-title">世界观构建</div>
        <div class="mentor-card-desc">灵感架构师，从碎片到宏大叙事</div>
      </div>
      
      <div class="mentor-card" onclick="openReviewHelper()">
        <div class="mentor-card-icon">🔎</div>
        <div class="mentor-card-title">审稿助手</div>
        <div class="mentor-card-desc">12年资深编辑级自检清单</div>
      </div>
      
      <div class="mentor-card" onclick="openSceneWriter()">
        <div class="mentor-card-icon">🎬</div>
        <div class="mentor-card-title">场景创作助手</div>
        <div class="mentor-card-desc">快速生成各类场景描写片段</div>
      </div>
    </div>
    
    <div class="mentor-tips">
      <div class="tips-header">💡 快速提示</div>
      <div class="tips-list">
        <div class="tips-item">• 在写作页面使用右侧AI助手获取实时建议</div>
        <div class="tips-item">• 使用"去AI痕迹"功能优化已写内容</div>
        <div class="tips-item">• 完稿后使用"审稿助手"进行自检</div>
      </div>
    </div>
  `;
  
  showModal('🎓 写作导师中心', html, '<button class="btn btn-secondary" onclick="closeModal()">关闭</button>');
}

// 场景创作助手
function openSceneWriter() {
  const scenes = [
    { type: '晨曦', icon: '🌅', prompts: ['清晨的第一缕阳光透过窗帘','露珠在叶尖闪烁','薄雾笼罩着湖面'] },
    { type: '夜幕', icon: '🌙', prompts: ['月光如水洒在石板路上','繁星点点，夜风轻拂','万家灯火渐次熄灭'] },
    { type: '雨景', icon: '🌧️', prompts: ['雨丝斜织成一道帘幕','屋檐滴水，溅起水花','雷声隐隐滚过天际'] },
    { type: '雪景', icon: '❄️', prompts: ['雪花纷纷扬扬飘落','银装素裹的世界','脚下的积雪发出咯吱声'] },
    { type: '人物情绪', icon: '💢', prompts: ['他攥紧拳头，指节泛白','她深吸一口气，强装镇定','眼眶微红，却倔强地仰起头'] },
    { type: '动作细节', icon: '🎭', prompts: ['他抬手揉了揉眉心，叹了口气','手指无意识地敲着桌面','身体微微后仰，靠在椅背上'] }
  ];
  
  let html = `
    <div class="scene-writer-intro">
      <p>🎬 <strong>场景创作助手</strong> — 一键获取灵感片段</p>
    </div>
    <div class="scene-grid">
      ${scenes.map(scene => `
        <div class="scene-card" onclick="generateSceneContent('${scene.type}')">
          <div class="scene-icon">${scene.icon}</div>
          <div class="scene-type">${scene.type}</div>
          <div class="scene-hint">点击生成</div>
        </div>
      `).join('')}
    </div>
    <div id="sceneResult" class="scene-result" style="display:none;margin-top:16px">
      <div class="scene-result-header">✨ 生成结果</div>
      <div id="sceneResultContent" class="scene-result-content"></div>
      <button class="btn btn-primary btn-sm" onclick="insertSceneToEditor()">📝 插入到编辑器</button>
    </div>
  `;
  
  showModal('🎬 场景创作助手', html, '<button class="btn btn-secondary" onclick="closeModal()">关闭</button>');
}

let currentSceneContent = '';

function generateSceneContent(type) {
  const scenes = {
    '晨曦': ['清晨，第一缕阳光穿透薄薄的纱帘，在地板上投下斑驳的光影。\n\n鸟鸣声从窗外传来，清脆悦耳。露珠在草叶上滚动，晶莹剔透。\n\n街道上渐渐有了人声，早点摊的蒸汽袅袅升起，弥漫着豆浆和油条的香气。', 
             '天边泛起鱼肚白，晨雾如轻纱般笼罩着湖面。\n\n远处的山峦在雾气中若隐若现，像一幅泼墨山水画。\n\n一阵凉风拂过，带来青草和泥土的清新气息。'],
    '夜幕': ['夜幕降临，月光如水银般倾泻在青石板路上。\n\n两侧的店铺陆续亮起灯笼，橘红色的光芒摇曳生姿。\n\n远处的酒肆传来丝竹声，伴随着阵阵笑语，透着人间烟火气。',
             '繁星点点，月华如练。\n\n夜风轻拂过湖面，荡起层层涟漪，将月光碎成银屑。\n\n深夜的街道空无一人，只有偶尔传来的更夫梆子声。'],
    '雨景': ['细雨如丝，斜斜地织在天地间。\n\n青石板上积起浅浅的水洼，雨滴落下，溅起一圈圈涟漪。\n\n行人撑着油纸伞匆匆走过，裙摆沾湿了边角。',
             '雨势渐大，噼里啪啦地打在屋檐上。\n\n狂风卷着雨幕，天地间一片迷蒙。\n\n街边的摊贩手忙脚乱地收拾货物，雨水顺着遮雨棚哗哗流淌。'],
    '雪景': ['鹅毛大雪纷纷扬扬，将天地染成一片银白。\n\n屋顶上积起厚厚的雪层，树枝被压得微微弯曲。\n\n脚下咯吱作响，每一步都留下深深的脚印。',
             '雪后初霁，阳光洒在积雪上，折射出刺眼的白光。\n\n屋檐下垂着晶莹的冰凌，在阳光下闪烁着七彩光芒。\n\n远处的孩子们在雪地里打雪仗，欢笑声回荡在空气中。'],
    '人物情绪': ['他猛地站起身，椅子向后滑出，发出刺耳的摩擦声。\n\n攥紧的拳头微微颤抖，骨节泛白。\n\n深吸一口气，又缓缓吐出，努力压下翻涌的情绪。',
                 '她愣住了，眼眶渐渐泛红。\n\n嘴唇动了动，想说什么，却一个字也吐不出来。\n\n低下头，睫毛轻轻颤动，遮住了眼底的水光。'],
    '动作细节': ['他下意识地摸了摸后颈，那里有一道浅浅的疤痕。\n\n手指微微粗糙，是常年握剑留下的茧子。\n\n这个习惯性的小动作，是他紧张时才会有的表现。',
                 '她抬起手，理了理鬓边的碎发，动作轻柔而熟练。\n\n手指白皙纤长，指尖涂着淡淡的蔻丹。\n\n衣袖滑落，露出一截皓腕，上面戴着一串碧玉珠子。']
  };
  
  const contents = scenes[type] || scenes['晨曦'];
  currentSceneContent = contents[Math.floor(Math.random() * contents.length)];
  
  const resultDiv = document.getElementById('sceneResult');
  const contentDiv = document.getElementById('sceneResultContent');
  if (resultDiv && contentDiv) {
    resultDiv.style.display = 'block';
    contentDiv.innerHTML = `<p style="white-space:pre-wrap;line-height:1.8">${currentSceneContent}</p>`;
  }
}

function insertSceneToEditor() {
  if (currentSceneContent) {
    closeModal();
    insertText(currentSceneContent);
    toast('场景已插入到编辑器', 'success');
  }
}

function renderEnhancedAI() {
  const el = document.getElementById('aiSuggestions');
  if (!el) return;
  
  const settings = DB.getSettings();
  const hasAPI = !!settings.aiApiKey;
  const apiStatus = hasAPI ? '<span style="color:#10b981">已配置</span>' : '<span style="color:#f59e0b">未配置</span>';
  
  el.innerHTML = `
    <div class="ai-category-title">🤖 AI写作 ${apiStatus}</div>
    <div class="ai-suggest-item ai-primary-btn" onclick="aiContinueWrite()">✍️ AI续写（当前章节）</div>
    <div class="ai-suggest-item ai-primary-btn" onclick="aiGenerateChapter()">📄 AI生成新章节</div>
    <div class="ai-suggest-item" onclick="openAIChat()">💭 AI写作咨询</div>
    ${!hasAPI ? '<div class="ai-suggest-item" onclick="navigate(\'settings\');showSettingsSection(\'ai\')" style="background:var(--bg3);color:var(--warning)">⚠️ 点击配置API</div>' : ''}
    
    <div class="ai-category-title">📚 题材指南</div>
    <div class="ai-suggest-item" onclick="openGenreGuide()">💕 题材创作规范</div>
    <div class="ai-suggest-item" onclick="openHookDesigner()">🎣 钩子设计器</div>
    <div class="ai-suggest-item" onclick="openDeAIPanel()">✨ 去AI痕迹</div>
    
    <div class="ai-category-title">🔮 续写建议（离线）</div>
    <div class="ai-suggest-item" onclick="requestAIRecommend('情节')">💡 情节发展</div>
    <div class="ai-suggest-item" onclick="requestAIRecommend('高潮')">⚡ 高潮设计</div>
    <div class="ai-suggest-item" onclick="requestAIRecommend('转折')">🔄 意外转折</div>
    
    <div class="ai-category-title">👤 人物塑造</div>
    <div class="ai-suggest-item" onclick="requestAIRecommend('人物')">💬 对话设计</div>
    <div class="ai-suggest-item" onclick="requestAIRecommend('心理')">🧠 心理描写</div>
    <div class="ai-suggest-item" onclick="requestAIRecommend('动作')">🎭 动作细节</div>
    
    <div class="ai-category-title">🌍 场景描写</div>
    <div class="ai-suggest-item" onclick="requestAIRecommend('场景')">🏞️ 环境氛围</div>
    <div class="ai-suggest-item" onclick="requestAIRecommend('感官')">👁️ 五感描写</div>
    <div class="ai-suggest-item" onclick="requestAIRecommend('对话')">💬 对白灵感</div>
    
    <div class="ai-category-title">📝 写作助手</div>
    <div class="ai-suggest-item" onclick="analyzeWriting()">📊 文风分析</div>
    <div class="ai-suggest-item" onclick="suggestSynonyms()">🔍 用词优化</div>
    <div class="ai-suggest-item" onclick="openWorldBuilder()">🌍 世界观构建</div>
    <div class="ai-suggest-item" onclick="openReviewHelper()">🔎 审稿助手</div>
  `;
}

function requestAIRecommend(type) {
  const suggestions = {
    情节: [
      '主角在危机时刻发现了关键线索，剧情出现重大转折……',
      '突然的反转让所有人措手不及，故事进入新的阶段……',
      '平静的日常被一声巨响打破，危机悄然降临……',
      '角色之间的秘密对话揭示了隐藏的阴谋……',
      '一个意外的电话打破了主人公的计划……'
    ],
    高潮: [
      '所有线索汇聚一处，真相终于浮出水面……',
      '生死存亡的关键时刻，主角做出了改变一切的选择……',
      '多年来的恩怨情仇在这一刻彻底爆发……',
      '看似不可能的胜利出现了转机……',
      '高潮对决中，每个人都必须做出自己的选择……'
    ],
    转折: [
      '最信任的人竟是幕后黑手……',
      '失散多年的亲人意外重逢，身份却已改变……',
      '看似完美的计划出现了致命的漏洞……',
      '一个被忽略的细节改变了整个局势……',
      '时间回溯到了一切开始之前……'
    ],
    人物: [
      '"这不可能……"他喃喃道，眼中满是震惊。',
      '"你真的想好了吗？"她轻声问，语气中带着担忧。',
      '"我发誓，绝不后悔。"他坚定地说。',
      '他没有回答，只是默默地看着她离开的背影。',
      '"等等——"话还没说完，门已经关上了。'
    ],
    心理: [
      '她的心跳加速，一种不祥的预感涌上心头……',
      '无数个夜晚，他都在重复着同样的噩梦……',
      '她努力保持着平静，但内心早已波涛汹涌……',
      '那种熟悉的恐惧感再次袭来，让他无法呼吸……',
      '期待与不安交织，她不知道该如何面对……'
    ],
    动作: [
      '他缓缓站起身，目光扫过在场的每一个人。',
      '她下意识地后退一步，手不自觉地握紧了……',
      '他抬起头，嘴角浮现出一丝意味深长的微笑。',
      '她轻叹一声，转身走向窗边，望着远处的灯火。',
      '他没有说话，只是静静地坐在那里，等待着……'
    ],
    场景: [
      '月光洒在古老的石板路上，空气清冷而寂静……',
      '城市的霓虹灯在雨幕中晕染开来，如梦似幻……',
      '荒野中，风卷起漫天的黄沙，遮蔽了远方的视线……',
      '清晨的雾气笼罩着整个村庄，一切都显得那么不真实……',
      '夕阳的余晖将天空染成金红色，海面上波光粼粼……'
    ],
    感官: [
      '空气中弥漫着淡淡的桂花香，让人想起远方的故乡……',
      '远处传来悠扬的钟声，回荡在寂静的山谷中……',
      '手心的触感温热而真实，让她确信这不是梦……',
      '苦涩的药味充斥着鼻腔，让她的眉头紧皱……',
      '舌尖传来阵阵刺痛，提醒着她这一切的真实……'
    ],
    对话: [
      '"我们的时间不多了。"他压低声音说道。',
      '"你以为我会相信你吗？"她冷笑一声。',
      '"等等，我还有话要说——"门却已经重重关上。',
      '"你变了。"他看着她，眼神中带着一丝陌生。',
      '"没关系，我相信你。"她微笑着说。'
    ]
  };
  
  const items = suggestions[type] || suggestions['情节'];
  const el = document.getElementById('aiSuggestions');
  if (el) {
    el.innerHTML = `
      <div class="ai-category-title">💡 ${type}建议</div>
      ${items.map(s => `<div class="ai-suggest-item" onclick="insertText('${s.replace(/'/g,"\\'")}')">✨ ${s}</div>`).join('')}
      <div class="ai-suggest-item" onclick="renderEnhancedAI()">← 返回</div>
    `;
  }
}

function openAIChat() {
  const settings = DB.getSettings();
  if (!settings.aiApiKey) {
    showModal('⚠️ 需要配置API Key', `
      <div style="text-align:center;padding:20px">
        <div style="font-size:48px;margin-bottom:16px">🔑</div>
        <p style="margin-bottom:16px">AI写作功能需要配置API Key</p>
        <p style="font-size:13px;color:var(--text3);margin-bottom:20px">免费额度获取：<br>1. 访问 <a href="https://cloud.siliconflow.cn" target="_blank" style="color:var(--primary)">cloud.siliconflow.cn</a><br>2. 注册并创建API Key<br>3. 粘贴到设置中</p>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="closeModal()">稍后</button>
      <button class="btn btn-primary" onclick="closeModal();navigate('settings');setTimeout(()=>showSettingsSection('ai'),100)">去配置</button>
    `);
    return;
  }
  
  aiChatMessages = []; // 重置对话历史
  showModal('💭 AI写作助手', `
    <div class="ai-chat-container">
      <div class="ai-chat-messages" id="aiChatMessages">
        <div class="ai-msg ai">你好！我是你的AI写作助手，可以帮你：<br>• 续写和创作建议<br>• 人物设定咨询<br>• 情节发展构思<br>• 文风技巧指导</div>
      </div>
      <div class="ai-chat-input">
        <input class="form-input" id="aiChatInput" placeholder="输入你的问题..." onkeypress="if(event.key==='Enter')executeAIMessage()">
        <button class="btn btn-primary" onclick="executeAIMessage()">发送</button>
      </div>
    </div>
  `);
}

async function executeAIMessage() {
  const input = document.getElementById('aiChatInput');
  const messages = document.getElementById('aiChatMessages');
  const text = input.value.trim();
  if (!text) return;
  
  // 添加用户消息
  messages.innerHTML += `<div class="ai-msg user">${text}</div>`;
  messages.innerHTML += `<div class="ai-msg ai" style="color:var(--text3)"><span class="loading-spinner"></span> AI思考中...</div>`;
  messages.scrollTop = messages.scrollHeight;
  input.value = '';
  
  try {
    await aiChat(text);
  } catch (e) {
    const loadingEl = messages.querySelector('.ai-msg.ai:last-child');
    if (loadingEl) {
      loadingEl.innerHTML = `<span style="color:var(--danger)">❌ ${e.message}</span>`;
    }
  }
}

function analyzeWriting() {
  const editor = document.getElementById('writeEditor');
  if (!editor) return;
  
  const text = editor.innerText || '';
  const words = countWords(text);
  const paras = text.split(/\n\n+/).filter(p => p.trim()).length;
  const sentences = text.split(/[。！？.!?]/).filter(s => s.trim()).length;
  
  // 简单分析
  let style = '叙事平稳';
  if (text.includes('突然') || text.includes('猛然')) style = '节奏紧凑';
  if (text.includes('缓缓') || text.includes('慢慢')) style = '舒缓细腻';
  if (text.includes('似乎') || text.includes('仿佛')) style = '意境悠远';
  
  showModal('📊 文风分析报告', `
    <div class="writing-analysis">
      <div class="analysis-item"><span class="analysis-label">总字数</span><span class="analysis-value">${formatNum(words)}</span></div>
      <div class="analysis-item"><span class="analysis-label">段落数</span><span class="analysis-value">${paras}</span></div>
      <div class="analysis-item"><span class="analysis-label">句子数</span><span class="analysis-value">${sentences}</span></div>
      <div class="analysis-item"><span class="analysis-label">均句字数</span><span class="analysis-value">${sentences > 0 ? Math.round(words/sentences) : 0}</span></div>
      <div class="analysis-item"><span class="analysis-label">文风特点</span><span class="analysis-value">${style}</span></div>
    </div>
    <div style="margin-top:16px;font-size:13px;color:var(--text2)">
      <p><strong>💡 写作建议：</strong></p>
      <ul style="margin-top:8px;padding-left:20px">
        <li>注意段落长度的变化，避免视觉疲劳</li>
        <li>对话与叙述穿插，让节奏更生动</li>
        <li>关键场景可适当增加细节描写</li>
      </ul>
    </div>
  `);
}

function suggestSynonyms() {
  showModal('🔍 用词优化', `
    <div class="form-group">
      <label class="form-label">输入需要优化的词语</label>
      <input class="form-input" id="synonymInput" placeholder="如：突然、非常、开始">
    </div>
    <button class="btn btn-primary" onclick="findSynonyms()">查找近义词</button>
    <div id="synonymResults" style="margin-top:16px"></div>
  `);
}

function findSynonyms() {
  const word = document.getElementById('synonymInput').value.trim();
  if (!word) return;
  
  const synonyms = {
    '突然': ['顷刻间','霎时','猝然','猛然','陡然'],
    '非常': ['格外','尤为','十分','极其','特别'],
    '开始': ['拉开序幕','启幕','开启','拉开帷幕'],
    '看着': ['凝望','注视','凝视','眺望','瞅着'],
    '说道': ['答道','回应道','表示','坦言','称'],
    '觉得': ['感到','体会','感知','发觉','领悟']
  };
  
  const results = synonyms[word] || ['优秀','出色','精妙','独到','不凡'];
  
  document.getElementById('synonymResults').innerHTML = `
    <div class="form-label">"${word}" 的近义词：</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
      ${results.map(r => `<span class="badge badge-long" style="cursor:pointer" onclick="insertText('${r}')">${r}</span>`).join('')}
    </div>
  `;
}

// ========== 导出Word/PDF ==========
function exportNovelToDocx() {
  const novels = DB.getNovels();
  if (novels.length === 0) { toast('没有可导出的作品', 'warning'); return; }
  
  if (novels.length === 1) {
    exportSingleNovelToDocx(novels[0].id);
    return;
  }
  
  showModal('📄 选择作品导出', `
    <div style="max-height:300px;overflow-y:auto">
      ${novels.map(n => `
        <div class="novel-export-item" onclick="exportSingleNovelToDocx('${n.id}')">
          <span>${n.icon || '📖'} ${n.title}</span>
          <span style="color:var(--text3)">${formatNum(DB.getChapters(n.id).reduce((s,c)=>s+(c.words||0),0))}字</span>
        </div>
      `).join('')}
    </div>
  `);
}

function exportSingleNovelToDocx(novelId) {
  closeModal();
  const novel = DB.getNovels().find(n => n.id === novelId);
  const chapters = DB.getChapters(novelId);
  if (!novel) return;
  
  // 生成HTML格式（可用于转换为Word）
  let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${novel.title}</title>
<style>
body { font-family: 'SimSun', serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
h1 { text-align: center; font-size: 28px; margin-bottom: 40px; }
h2 { font-size: 20px; margin-top: 40px; text-align: center; }
p { font-size: 16px; line-height: 2; text-indent: 2em; margin: 16px 0; }
.info { text-align: center; color: #666; margin-bottom: 60px; }
</style>
</head>
<body>
<h1>${novel.title}</h1>
<p class="info">${novel.type === 'short' ? '短篇' : novel.type === 'medium' ? '中篇' : '长篇'} · ${novel.genre || ''}</p>
${chapters.map(ch => `
<h2>${ch.title}</h2>
${(ch.content || '').split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('\n')}
`).join('')}
</body>
</html>`;
  
  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = novel.title + '.doc';
  a.click();
  URL.revokeObjectURL(url);
  toast('Word文档已导出', 'success');
}

function exportToPDF() {
  const novels = DB.getNovels();
  if (novels.length === 0) { toast('没有可导出的作品', 'warning'); return; }
  
  showModal('📑 选择作品导出PDF', `
    <div style="max-height:300px;overflow-y:auto">
      ${novels.map(n => `
        <div class="novel-export-item" onclick="generatePDF('${n.id}')">
          <span>${n.icon || '📖'} ${n.title}</span>
          <span style="color:var(--text3)">${formatNum(DB.getChapters(n.id).reduce((s,c)=>s+(c.words||0),0))}字</span>
        </div>
      `).join('')}
    </div>
  `);
}

function generatePDF(novelId) {
  closeModal();
  const novel = DB.getNovels().find(n => n.id === novelId);
  const chapters = DB.getChapters(novelId);
  if (!novel) return;
  
  // 生成打印友好的HTML
  let content = `
<h1 style="text-align:center;font-size:24px;margin-bottom:10px">${novel.title}</h1>
<p style="text-align:center;color:#666;font-size:14px">${novel.type === 'short' ? '短篇' : novel.type === 'medium' ? '中篇' : '长篇'} · 字数：${chapters.reduce((s,c)=>s+(c.words||0),0)}</p>
<hr style="margin:30px 0">
${chapters.map(ch => `
<div style="page-break-after:always;margin:20px 0">
<h2 style="font-size:18px;text-align:center;margin:30px 0 20px">${ch.title}</h2>
${(ch.content || '').split('\n').map(line => line.trim() ? `<p style="font-size:14px;line-height:2;text-indent:2em;margin:10px 0">${line}</p>` : '<br>').join('')}
</div>
`).join('')}`;
  
  // 打开新窗口进行打印
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
<title>${novel.title}</title>
<style>
body { font-family: 'SimSun', serif; max-width: 700px; margin: 0 auto; padding: 20px; }
h1 { font-size: 24px; }
h2 { font-size: 18px; }
p { font-size: 14px; line-height: 1.8; }
@media print { body { padding: 0; } }
</style>
</head>
<body>${content}</body>
</html>`);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
    toast('打印对话框已打开，请选择"保存为PDF"', 'success');
  }, 500);
}

// ========== 统计更新 ==========
function updateSidebarStats() {
  const novels = DB.getNovels();
  const totalWords = novels.reduce((sum, n) => {
    const chapters = DB.getChapters(n.id);
    return sum + chapters.reduce((s, c) => s + (c.words || 0), 0);
  }, 0);
  document.getElementById('totalWords').textContent = formatNum(totalWords);
  document.getElementById('totalNovels').textContent = novels.length;
}

function formatNum(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
  return n.toString();
}

function countWords(text) {
  return text ? text.replace(/\s/g, '').length : 0;
}

// ========== 仪表盘 ==========
function renderDashboard(el) {
  const novels = DB.getNovels();
  const settings = DB.getSettings();
  const todayWords = DB.getTodayWords();
  const totalWords = novels.reduce((sum, n) => {
    return sum + DB.getChapters(n.id).reduce((s, c) => s + (c.words || 0), 0);
  }, 0);
  const finishedCount = novels.filter(n => n.status === 'finished').length;
  const dailyPct = Math.min(100, Math.round(todayWords / settings.dailyGoal * 100));

  el.innerHTML = `
    <div class="dashboard-grid">
      <div class="stat-card">
        <div class="stat-card-icon">📝</div>
        <div class="stat-card-num">${formatNum(totalWords)}</div>
        <div class="stat-card-label">累计字数</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon">📚</div>
        <div class="stat-card-num">${novels.length}</div>
        <div class="stat-card-label">作品总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon">✅</div>
        <div class="stat-card-num">${finishedCount}</div>
        <div class="stat-card-label">已完成</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon">🔥</div>
        <div class="stat-card-num">${formatNum(todayWords)}</div>
        <div class="stat-card-label">今日字数</div>
      </div>
    </div>

    <!-- 今日目标 -->
    <div class="card" style="margin-bottom:24px">
      <div class="card-title">🎯 今日写作目标</div>
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:10px">
        <div style="flex:1">
          <div class="progress-bar">
            <div class="progress-fill" style="width:${dailyPct}%"></div>
          </div>
        </div>
        <span style="font-size:13px;color:var(--text2);white-space:nowrap">${todayWords} / ${settings.dailyGoal} 字</span>
        <span style="font-size:13px;font-weight:600;color:var(--primary-light)">${dailyPct}%</span>
      </div>
      <div style="font-size:12px;color:var(--text3)">
        ${dailyPct >= 100 ? '🎉 今日目标已完成！坚持就是胜利～' : `还需写 ${settings.dailyGoal - todayWords} 字即可完成今日目标`}
      </div>
    </div>

    <!-- 最近作品 -->
    <div class="section-header">
      <div class="section-title">📖 最近创作</div>
      <button class="btn btn-secondary btn-sm" onclick="navigate('library')">查看全部</button>
    </div>
    <div class="novels-grid">
      ${novels.slice(0,5).map(n => novelCardHTML(n)).join('')}
      <div class="new-novel-card" onclick="showNewNovelModal()">
        <div class="icon">✚</div>
        <div>新建作品</div>
      </div>
    </div>

    <!-- 快捷工具 -->
    <div class="section-header" style="margin-top:28px">
      <div class="section-title">⚡ 快捷工具</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px">
      ${[
        {icon:'🎬',label:'小说转剧本',page:'script'},
        {icon:'🎨',label:'小说转漫剧',page:'comic'},
        {icon:'🗺️',label:'大纲规划',page:'outline'},
        {icon:'👤',label:'人物管理',page:'characters'},
      ].map(t => `
        <div class="card" style="text-align:center;cursor:pointer;padding:20px 10px" onclick="navigate('${t.page}')">
          <div style="font-size:32px;margin-bottom:8px">${t.icon}</div>
          <div style="font-size:13px;color:var(--text2)">${t.label}</div>
        </div>
      `).join('')}
    </div>

    <!-- 增强功能入口 -->
    <div class="section-header" style="margin-top:28px">
      <div class="section-title">✨ 增强功能</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">
      <div class="card" style="cursor:pointer" onclick="navigate('stats')">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="font-size:28px">📊</div>
          <div>
            <div style="font-size:14px;font-weight:600">写作统计报告</div>
            <div style="font-size:12px;color:var(--text3)">查看详细数据分析</div>
          </div>
        </div>
      </div>
      <div class="card" style="cursor:pointer" onclick="toggleEyeCareMode()">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="font-size:28px">👁️</div>
          <div>
            <div style="font-size:14px;font-weight:600">${App.eyeCareMode ? '护眼模式(已开启)' : '护眼模式'}</div>
            <div style="font-size:12px;color:var(--text3)">暖色调保护眼睛</div>
          </div>
        </div>
      </div>
      <div class="card" style="cursor:pointer" onclick="exportNovelToDocx()">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="font-size:28px">📄</div>
          <div>
            <div style="font-size:14px;font-weight:600">导出Word/PDF</div>
            <div style="font-size:12px;color:var(--text3)">导出作品文档</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function novelCardHTML(novel) {
  const chapters = DB.getChapters(novel.id);
  const words = chapters.reduce((s, c) => s + (c.words || 0), 0);
  const target = novel.wordTarget || 1;
  const pct = Math.min(100, Math.round(words / target * 100));
  const typeBadge = { short: 'badge-short', medium: 'badge-medium', long: 'badge-long' }[novel.type] || 'badge-long';
  const typeLabel = { short: '短篇', medium: '中篇', long: '长篇' }[novel.type] || '长篇';
  return `
    <div class="novel-card" onclick="navigate('write',{novelId:'${novel.id}'})">
      <div class="novel-cover ${novel.coverClass || 'novel-cover-default'}">
        <span>${novel.icon || '📖'}</span>
      </div>
      <div class="novel-info">
        <div class="novel-title">${novel.title}</div>
        <div class="novel-meta">
          <span class="badge ${typeBadge}">${typeLabel}</span>
          <span class="novel-words">${formatNum(words)}字</span>
        </div>
        <div class="novel-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width:${pct}%"></div>
          </div>
        </div>
        <div style="font-size:11px;color:var(--text3)">${pct}% · ${chapters.length}章</div>
        <div class="novel-actions">
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();navigate('write',{novelId:'${novel.id}'})">✍️ 写作</button>
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();showNovelMenu('${novel.id}')">···</button>
        </div>
      </div>
    </div>
  `;
}

function showNovelMenu(novelId) {
  const novels = DB.getNovels();
  const novel = novels.find(n => n.id === novelId);
  if (!novel) return;
  const words = DB.getChapters(novelId).reduce((s, c) => s + (c.words || 0), 0);
  showModal('作品操作', `
    <div style="margin-bottom:16px">
      <div style="font-size:16px;font-weight:600;margin-bottom:4px">${novel.title}</div>
      <div style="font-size:13px;color:var(--text3)">共 ${formatNum(words)} 字 · ${DB.getChapters(novelId).length} 章节</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="btn btn-primary btn-block" onclick="closeModal();navigate('write',{novelId:'${novelId}'})">✍️ 继续写作</button>
      <button class="btn btn-secondary btn-block" onclick="closeModal();navigate('script',{novelId:'${novelId}'})">🎬 转换为剧本</button>
      <button class="btn btn-secondary btn-block" onclick="closeModal();navigate('comic',{novelId:'${novelId}'})">🎨 转换为漫剧</button>
      <button class="btn btn-secondary btn-block" onclick="closeModal();navigate('outline',{novelId:'${novelId}'})">🗺️ 查看大纲</button>
      <button class="btn btn-secondary btn-block" onclick="closeModal();navigate('characters',{novelId:'${novelId}'})">👤 人物管理</button>
      <hr class="divider">
      <button class="btn btn-secondary btn-block" onclick="closeModal();exportNovel('${novelId}')">📤 导出TXT</button>
      <button class="btn btn-danger btn-block" onclick="closeModal();confirmDeleteNovel('${novelId}')">🗑️ 删除作品</button>
    </div>
  `);
}

function renderWritePage(el, params) {
  const novelId = params.novelId;
  const novels = DB.getNovels();
  const novel = novels.find(n => n.id === novelId);

  if (!novelId || !novel) {
    el.innerHTML = `
      <div class="section-header"><div class="section-title">✍️ 开始创作</div></div>
      <div class="novels-grid">
        ${novels.map(n => novelCardHTML(n)).join('')}
        <div class="new-novel-card" onclick="showNewNovelModal()"><div class="icon">✚</div><div>新建作品</div></div>
      </div>
    `;
    return;
  }

  App.currentNovel = novel;
  const chapters = DB.getChapters(novelId);
  const settings = DB.getSettings();
  let curChapter = App.currentChapter && App.currentChapter.novelId === novelId ? App.currentChapter : (chapters[0] || null);
  App.currentChapter = curChapter;

  el.innerHTML = `
    <div class="write-layout">
      <div class="write-sidebar">
        <div class="write-sidebar-header">
          <div style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${novel.title}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px">${chapters.length}章 · 拖拽排序</div>
        </div>
        <div class="chapter-list" id="chapterList">
          ${chapters.map((ch, i) => `<div class="chapter-item ${curChapter && ch.id === curChapter.id ? 'active' : ''}" data-chapter-id="${ch.id}" onclick="selectChapter('${ch.id}')"><span class="chapter-num">${ch.order}</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ch.title}</span><span style="font-size:11px;color:var(--text3)">${formatNum(ch.words||0)}</span></div>`).join('')}
        </div>
        <div class="add-chapter-btn" onclick="addChapter()">✛ 添加章节</div>
        <div style="padding:8px;border-top:1px solid var(--border)">
          <button class="btn btn-secondary btn-sm btn-block" onclick="showNovelInfo()">📋 作品信息</button>
          <button class="btn btn-secondary btn-sm btn-block" style="margin-top:6px" onclick="navigate('outline',{novelId:'${novelId}'})">🗺️ 大纲</button>
          <button class="btn btn-secondary btn-sm btn-block" style="margin-top:6px" onclick="exportNovel('${novelId}')">📤 导出</button>
        </div>
      </div>
      <div class="write-main">
        <div class="write-toolbar">
          ${['📋','B','I','S'].map((ic,i) => `<button class="toolbar-btn" title="${ic}" onclick="insertFormat('${['title','bold','italic','strike'][i]}')">${ic}</button>`).join('')}
          <div class="divider-v"></div>
          ${['「','」','『','』','——','……'].map(s => `<button class="toolbar-btn" title="${s}" onclick="insertSymbol('${s}')">${s}</button>`).join('')}
          <div class="divider-v"></div>
          <button class="toolbar-btn" title="撤销" onclick="execCmd('undo')">↩</button>
          <button class="toolbar-btn" title="重做" onclick="execCmd('redo')">↪</button>
          <div style="flex:1"></div>
          <button class="toolbar-btn ${App.focusMode?'active':''}" title="专注模式" onclick="toggleFocusMode()">🧘</button>
          <button class="toolbar-btn" title="字数统计" onclick="analyzeWriting()">📊</button>
        </div>
        <div class="word-count-bar">
          <span class="wc-item">📖 <span id="wcChapter">${curChapter ? curChapter.title : '无章节'}</span></span>
          <span class="wc-item">✏️ <span class="wc-highlight" id="wcCurWords">${curChapter ? formatNum(curChapter.words||0) : '0'}</span> 字</span>
          <span class="wc-item">🎯 <span class="wc-highlight">${formatNum(novel.wordTarget||0)}</span></span>
          <span class="wc-item" style="margin-left:auto">💾 <span id="saveStatus">已保存</span></span>
        </div>
        <div class="write-area" id="writeArea">
          ${curChapter ? `
            <input class="chapter-title-input" id="chapterTitleInput" value="${curChapter.title}" placeholder="章节标题..." oninput="onChapterTitleChange()">
            <div class="write-editor" id="writeEditor" contenteditable="true" style="font-size:${settings.fontSize}px;line-height:${settings.lineHeight}" placeholder="开始你的创作……">${curChapter.content||''}</div>
          ` : `<div class="empty-state"><div class="empty-icon">✍️</div><div class="empty-title">还没有章节</div><div class="empty-desc">点击左侧「添加章节」开始创作</div></div>`}
        </div>
      </div>
      <div class="write-right">
        <div class="write-right-title">💡 AI写作助手</div>
        <div id="aiSuggestions">
          ${renderEnhancedAI() || ''}
          <div class="ai-category-title">🔮 续写建议</div>
          <div class="ai-suggest-item" onclick="requestAIRecommend('情节')">💡 情节发展</div>
          <div class="ai-suggest-item" onclick="requestAIRecommend('高潮')">⚡ 高潮设计</div>
          <div class="ai-suggest-item" onclick="requestAIRecommend('转折')">🔄 意外转折</div>
          
          <div class="ai-category-title">👤 人物塑造</div>
          <div class="ai-suggest-item" onclick="requestAIRecommend('人物')">💬 对话设计</div>
          <div class="ai-suggest-item" onclick="requestAIRecommend('心理')">🧠 心理描写</div>
          <div class="ai-suggest-item" onclick="requestAIRecommend('动作')">🎭 动作细节</div>
          
          <div class="ai-category-title">🌍 场景描写</div>
          <div class="ai-suggest-item" onclick="requestAIRecommend('场景')">🏞️ 环境氛围</div>
          <div class="ai-suggest-item" onclick="requestAIRecommend('感官')">👁️ 五感描写</div>
          <div class="ai-suggest-item" onclick="requestAIRecommend('对话')">💬 对白灵感</div>
          
          <div class="ai-category-title">📝 写作助手</div>
          <div class="ai-suggest-item" onclick="openAIChat()">💭 AI对话助手</div>
          <div class="ai-suggest-item" onclick="analyzeWriting()">📊 文风分析</div>
          <div class="ai-suggest-item" onclick="suggestSynonyms()">🔍 用词优化</div>
        </div>
        <div class="write-right-title">📖 章节导航</div>
        ${chapters.map(ch => `<div class="chapter-item" onclick="selectChapter('${ch.id}')" style="${curChapter&&ch.id===curChapter.id?'background:rgba(108,99,255,0.15);color:var(--primary-light)':''}"><span class="chapter-num">${ch.order}</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px">${ch.title}</span></div>`).join('')}
      </div>
    </div>
    <button class="focus-exit" onclick="toggleFocusMode()">🧘 退出专注 ⌨️Esc</button>
  `;

  const editor = document.getElementById('writeEditor');
  if (editor) {
    editor.addEventListener('input', onEditorInput);
    editor.addEventListener('keydown', onEditorKeydown);
  }
  clearInterval(App.autoSaveTimer);
  if (settings.autoSave) App.autoSaveTimer = setInterval(autoSave, 15000);
  
  // 初始化章节拖拽排序
  setTimeout(initChapterDragSort, 100);
  
  updateWordCount();
}

function execCmd(cmd) { try { document.execCommand(cmd, false, null); } catch {} }
function insertFormat(action) {
  const editor = document.getElementById('writeEditor');
  if (!editor) return;
  if (action === 'bold') execCmd('bold');
  else if (action === 'italic') execCmd('italic');
  else if (action === 'strike') execCmd('strikeThrough');
  else if (action === 'title') {
    const sel = window.getSelection();
    if (sel.rangeCount && sel.toString()) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode('【' + sel.toString() + '】'));
    }
  }
  editor.focus();
}
function insertSymbol(s) {
  const editor = document.getElementById('writeEditor');
  if (!editor) return;
  editor.focus();
  try { document.execCommand('insertText', false, s); } catch { editor.innerText += s; }
}
function onEditorKeydown(e) {
  if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveCurrentChapter(); toast('已保存', 'success'); }
  if (e.key === 'Tab') { e.preventDefault(); insertSymbol('　　'); }
}
function onEditorInput() {
  updateWordCount();
  const el = document.getElementById('saveStatus');
  if (el) el.textContent = '● 未保存';
}
function onChapterTitleChange() {
  const el = document.getElementById('saveStatus');
  if (el) el.textContent = '● 未保存';
}
function updateWordCount() {
  const editor = document.getElementById('writeEditor');
  const novel = App.currentNovel;
  if (!editor || !novel) return;
  const words = countWords(editor.innerText || '');
  const total = DB.getChapters(novel.id).reduce((s, c) => s + (c.id === App.currentChapter?.id ? words : (c.words||0)), 0);
  const pct = Math.min(100, Math.round(total / (novel.wordTarget||1) * 100));
  const we = document.getElementById('wcCurWords');
  const pe = document.getElementById('wcPercent');
  if (we) we.textContent = formatNum(words);
  if (pe) pe.textContent = pct + '%';
}
function selectChapter(chapterId) {
  if (App.currentChapter) saveCurrentChapter(false);
  const nid = App.currentNovel?.id;
  if (!nid) return;
  const chapters = DB.getChapters(nid);
  App.currentChapter = chapters.find(c => c.id === chapterId);
  document.getElementById('wcChapter').textContent = App.currentChapter?.title || '';
  document.getElementById('wcCurWords').textContent = formatNum(App.currentChapter?.words||0);
  document.querySelectorAll('#chapterList .chapter-item').forEach(el => el.classList.toggle('active', el.getAttribute('onclick')?.includes(chapterId)));
  const editor = document.getElementById('writeEditor');
  const titleInput = document.getElementById('chapterTitleInput');
  if (editor && titleInput && App.currentChapter) {
    titleInput.value = App.currentChapter.title;
    editor.innerHTML = App.currentChapter.content || '';
    editor.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(editor);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    updateWordCount();
  }
}
function addChapter() {
  const nid = App.currentNovel?.id;
  if (!nid) return;
  const chapters = DB.getChapters(nid);
  const newCh = { id: genId(), novelId: nid, title: `第${chapters.length+1}章`, content: '', order: chapters.length+1, words: 0, created: Date.now() };
  chapters.push(newCh);
  DB.setChapters(nid, chapters);
  App.currentChapter = newCh;
  renderWritePage(document.getElementById('content'), { novelId: nid });
  toast('章节已创建', 'success');
  setTimeout(() => { const inp = document.getElementById('chapterTitleInput'); if (inp) { inp.focus(); inp.select(); } }, 100);
}
function saveCurrentChapter(showToast) {
  showToast = showToast !== false;
  const ch = App.currentChapter;
  if (!ch) return;
  const editor = document.getElementById('writeEditor');
  const titleInput = document.getElementById('chapterTitleInput');
  if (!editor && !titleInput) return;
  const nid = ch.novelId;
  const chapters = DB.getChapters(nid);
  const idx = chapters.findIndex(c => c.id === ch.id);
  if (idx >= 0) {
    const content = editor ? editor.innerHTML : '';
    const title = titleInput ? titleInput.value : '';
    const words = editor ? countWords(editor.innerText) : 0;
    chapters[idx].content = content;
    chapters[idx].title = title || chapters[idx].title;
    chapters[idx].words = words;
    chapters[idx].updated = Date.now();
    DB.setChapters(nid, chapters);
    App.currentChapter = chapters[idx];
    const se = document.getElementById('saveStatus');
    if (se) se.textContent = '✓ 已保存';
    updateWordCount();
    updateSidebarStats();
    if (showToast) toast('已保存', 'success');
  }
}
function autoSave() {
  const se = document.getElementById('saveStatus');
  if (se && se.textContent.includes('未保存')) saveCurrentChapter(false);
  // 更新每日写作统计
  const editor = document.getElementById('writeEditor');
  if (editor) {
    const words = countWords(editor.innerText || '');
    if (words > 0) DB.addTodayWords(1); // 简化版本，实际应该记录增量
  }
}
function toggleFocusMode() {
  App.focusMode = !App.focusMode;
  document.getElementById('app').classList.toggle('focus-mode', App.focusMode);
  if (App.focusMode) document.getElementById('writeEditor')?.focus();
}
function showNovelInfo() {
  const novel = App.currentNovel;
  if (!novel) return;
  const chs = DB.getChapters(novel.id);
  const total = chs.reduce((s,c) => s+(c.words||0), 0);
  showModal('📋 作品信息', `
    <div class="form-group"><label class="form-label">作品名称</label><input class="form-input" id="infoTitle" value="${novel.title}" onclick="this.select()"></div>
    <div class="form-group"><label class="form-label">类型</label><div style="display:flex;gap:8px">
      ${['short','medium','long'].map(t => `<button class="btn ${novel.type===t?'btn-primary':'btn-secondary'} btn-sm" onclick="changeNovelType('${t}')">${t==='short'?'短篇':t==='medium'?'中篇':'长篇'}</button>`).join('')}
    </div></div>
    <div class="form-group"><label class="form-label">简介</label><textarea class="form-textarea" id="infoDesc">${novel.desc||''}</textarea></div>
    <div class="form-group"><label class="form-label">字数目标</label><input class="form-input" type="number" id="infoTarget" value="${novel.wordTarget||100000}"></div>
    <div class="form-group"><label class="form-label">当前字数: ${formatNum(total)}</label><div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100,Math.round(total/(novel.wordTarget||1)*100))}%"></div></div></div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-primary" onclick="saveNovelInfo()">💾 保存</button>
      <button class="btn btn-secondary" onclick="closeModal()">取消</button>
    </div>
  `);
}
function saveNovelInfo() {
  const novel = App.currentNovel;
  if (!novel) return;
  const novels = DB.getNovels();
  const idx = novels.findIndex(n => n.id === novel.id);
  if (idx >= 0) {
    novels[idx].title = document.getElementById('infoTitle').value;
    novels[idx].desc = document.getElementById('infoDesc').value;
    novels[idx].wordTarget = parseInt(document.getElementById('infoTarget').value) || 100000;
    novels[idx].updated = Date.now();
    DB.setNovels(novels);
    App.currentNovel = novels[idx];
  }
  closeModal();
  toast('已保存', 'success');
  navigate('write', { novelId: novel.id });
}
function changeNovelType(type) {
  const novel = App.currentNovel;
  if (!novel) return;
  const novels = DB.getNovels();
  const idx = novels.findIndex(n => n.id === novel.id);
  if (idx >= 0) { novels[idx].type = type; DB.setNovels(novels); App.currentNovel = novels[idx]; }
  showNovelInfo();
}
function requestAIRecommend(type) {
  const map = {
    情节: ['主角在危机时刻发现了关键线索……','突然的反转让所有人措手不及……','平静的日常被一声巨响打破……'],
    人物: ['角色的内心独白揭示了深层动机……','配角的出现改变了主角的判断……','角色的秘密身份被逐渐揭开……'],
    场景: ['月光洒在古老的石板路上，空气清冷……','城市的霓虹灯在雨幕中晕染开来……','荒野中，风卷起漫天的黄沙……'],
    对话: ['"这不可能……"他喃喃道。','"你真的想好了吗？"她轻声问。','"我发誓，绝不后悔。"他坚定地说。'],
  };
  const items = map[type] || map['情节'];
  const el = document.getElementById('aiSuggestions');
  if (el) el.innerHTML = `<div class="ai-suggest-item" onclick="requestAIRecommend('${type}')">🔮 再来一个</div>` + items.map(s => `<div class="ai-suggest-item" onclick="insertText('${s.replace(/'/g,"\\'")}')">💡 ${s}</div>`).join('');
}
function insertText(text) {
  const editor = document.getElementById('writeEditor');
  if (!editor) return;
  editor.focus();
  try { document.execCommand('insertHTML', false, text + '<br><br>'); } catch {}
  updateWordCount();
}

// ========== 新建小说 ==========
function showNewNovelModal() {
  showModal('📖 新建作品', `
    <div class="form-group"><label class="form-label">作品名称</label><input class="form-input" id="newNovelTitle" placeholder="给你的作品起个名字..."></div>
    <div class="form-group"><label class="form-label">选择类型</label>
      <div class="type-selector">
        <div class="type-option selected" data-type="short" onclick="selectNovelType(this,'short')"><div class="type-icon">📄</div><div class="type-name">短篇</div><div class="type-range">8千~3万字</div></div>
        <div class="type-option" data-type="medium" onclick="selectNovelType(this,'medium')"><div class="type-icon">📗</div><div class="type-name">中篇</div><div class="type-range">3~10万字</div></div>
        <div class="type-option" data-type="long" onclick="selectNovelType(this,'long')"><div class="type-icon">📚</div><div class="type-name">长篇</div><div class="type-range">>10万字</div></div>
      </div>
    </div>
    <div class="form-group"><label class="form-label">题材类型</label><select class="form-select" id="newNovelGenre"><option value="fantasy">奇幻</option><option value="romance">言情</option><option value="mystery">悬疑</option><option value="history">历史</option><option value="scifi">科幻</option><option value="urban">都市</option><option value="xianxia">仙侠</option><option value="young">青春</option><option value="other">其他</option></select></div>
    <div class="form-group"><label class="form-label">简介（选填）</label><textarea class="form-textarea" id="newNovelDesc" placeholder="简要描述你的故事..."></textarea></div>
    <button class="btn btn-primary btn-lg btn-block" onclick="createNovel()" style="margin-top:8px">🎉 开始创作</button>
  `);
  setTimeout(() => document.getElementById('newNovelTitle')?.focus(), 100);
}
function selectNovelType(el, type) {
  document.querySelectorAll('.type-option').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
}
function createNovel() {
  const title = document.getElementById('newNovelTitle').value.trim();
  if (!title) { toast('请输入作品名称', 'error'); return; }
  const sel = document.querySelector('.type-option.selected');
  const type = sel ? sel.dataset.type : 'short';
  const genre = document.getElementById('newNovelGenre').value;
  const desc = document.getElementById('newNovelDesc').value.trim();
  const targets = { short: 20000, medium: 60000, long: 200000 };
  const icons = { fantasy:'🧙', romance:'💕', mystery:'🔍', history:'🏯', scifi:'🚀', urban:'🌃', xianxia:'⚔️', young:'🌸', other:'📖' };
  const covers = { fantasy:'cover-fantasy', romance:'cover-romance', mystery:'cover-mystery', history:'cover-history', scifi:'cover-scifi', urban:'cover-urban', xianxia:'cover-xianxia' };
  const novel = { id: genId(), title, type, genre, desc, icon: icons[genre]||'📖', coverClass: covers[genre]||'', wordTarget: targets[type], created: Date.now(), updated: Date.now(), status: 'writing' };
  const novels = DB.getNovels();
  novels.unshift(novel);
  DB.setNovels(novels);
  DB.setChapters(novel.id, [{ id: genId(), novelId: novel.id, title: '第一章', content: '', order: 1, words: 0, created: Date.now() }]);
  closeModal();
  toast('作品创建成功！开始你的创作吧~', 'success');
  navigate('write', { novelId: novel.id });
}
function confirmDeleteNovel(novelId) {
  showModal('⚠️ 确认删除', `<p style="font-size:14px;color:var(--text2);margin-bottom:16px">确定要删除这部作品吗？此操作不可恢复。</p><div style="display:flex;gap:8px"><button class="btn btn-danger" onclick="deleteNovel('${novelId}')">🗑️ 确认删除</button><button class="btn btn-secondary" onclick="closeModal()">取消</button></div>`);
}
function deleteNovel(novelId) {
  let novels = DB.getNovels();
  novels = novels.filter(n => n.id !== novelId);
  DB.setNovels(novels);
  closeModal();
  toast('作品已删除', 'warning');
  navigate('dashboard');
}

// ========== 书库 ==========
function renderLibrary(el) {
  const novels = DB.getNovels();
  const withWords = novels.map(n => ({ ...n, totalWords: DB.getChapters(n.id).reduce((s,c)=>s+(c.words||0),0), chapterCount: DB.getChapters(n.id).length }));
  const typeLabel = t => t==='short'?'短篇':t==='medium'?'中篇':'长篇';
  const typeBadge = t => 'badge-' + (t==='short'?'short':t==='medium'?'medium':'long');
  const cardHtml = withWords.map(n => `<div class="novel-card" onclick="navigate('write',{novelId:'${n.id}'})"><div class="novel-cover ${n.coverClass||'novel-cover-default'}"><span>${n.icon||'📖'}</span></div><div class="novel-info"><div class="novel-title">${n.title}</div><div class="novel-meta"><span class="badge ${typeBadge(n.type)}">${typeLabel(n.type)}</span><span class="novel-words">${formatNum(n.totalWords)}字</span></div><div class="novel-progress"><div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100,Math.round(n.totalWords/(n.wordTarget||1)*100))}%"></div></div></div><div style="font-size:11px;color:var(--text3);margin-bottom:8px">${n.chapterCount}章</div><div class="novel-actions"><button class="btn btn-primary btn-sm" onclick="event.stopPropagation();navigate('write',{novelId:'${n.id}'})">✍️</button><button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();showNovelMenu('${n.id}')">···</button></div></div></div>`).join('');
  el.innerHTML = `<div class="section-header"><div class="section-title">📚 我的书库</div><button class="btn btn-primary" onclick="showNewNovelModal()">✚ 新建作品</button></div><div class="library-filters"><button class="filter-btn active" onclick="filterLibrary(this,'all')">全部</button><button class="filter-btn" onclick="filterLibrary(this,'short')">短篇</button><button class="filter-btn" onclick="filterLibrary(this,'medium')">中篇</button><button class="filter-btn" onclick="filterLibrary(this,'long')">长篇</button><button class="filter-btn" onclick="filterLibrary(this,'writing')">写作中</button><button class="filter-btn" onclick="filterLibrary(this,'finished')">已完成</button></div><div id="libraryGrid"><div class="novels-grid">${withWords.length ? cardHtml : `<div class="new-novel-card" onclick="showNewNovelModal()" style="grid-column:1/-1;min-height:200px"><div class="icon">✚</div><div>还没有作品，创建你的第一部小说吧</div></div>`}</div></div>`;
}
function filterLibrary(btn, type) {
  document.querySelectorAll('.library-filters .filter-btn').forEach(e => e.classList.remove('active'));
  btn.classList.add('active');
  const novels = DB.getNovels();
  const filtered = type==='all' ? novels : ['short','medium','long'].includes(type) ? novels.filter(n=>n.type===type) : novels.filter(n=>n.status===type);
  const withWords = filtered.map(n => ({ ...n, totalWords: DB.getChapters(n.id).reduce((s,c)=>s+(c.words||0),0), chapterCount: DB.getChapters(n.id).length }));
  const typeLabel = t => t==='short'?'短篇':t==='medium'?'中篇':'长篇';
  const typeBadge = t => 'badge-' + (t==='short'?'short':t==='medium'?'medium':'long');
  const cardHtml = withWords.map(n => `<div class="novel-card" onclick="navigate('write',{novelId:'${n.id}'})"><div class="novel-cover ${n.coverClass||'novel-cover-default'}"><span>${n.icon||'📖'}</span></div><div class="novel-info"><div class="novel-title">${n.title}</div><div class="novel-meta"><span class="badge ${typeBadge(n.type)}">${typeLabel(n.type)}</span><span class="novel-words">${formatNum(n.totalWords)}字</span></div><div class="novel-actions"><button class="btn btn-primary btn-sm" onclick="event.stopPropagation();navigate('write',{novelId:'${n.id}'})">✍️</button><button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();showNovelMenu('${n.id}')">···</button></div></div></div>`).join('');
  document.getElementById('libraryGrid').innerHTML = `<div class="novels-grid">${cardHtml}</div>`;
}

// ========== 小说转剧本 ==========
function renderScript(el, params) {
  const novels = DB.getNovels();
  const nid = params.novelId || novels[0]?.id;
  const chapters = nid ? DB.getChapters(nid) : [];
  const fullText = chapters.map(c => c.content || '').join('\n\n');

  el.innerHTML = `
    <div class="section-header"><div class="section-title">🎬 小说转剧本</div></div>
    <div style="margin-bottom:16px"><select class="form-select" style="max-width:300px" onchange="navigate('script',{novelId:this.value})">
      ${novels.map(n => `<option value="${n.id}" ${n.id===nid?'selected':''}>${n.title}</option>`).join('')}
    </select></div>
    <div class="convert-layout">
      <div class="convert-panel">
        <div class="convert-panel-header">📖 原文内容 <span style="font-size:12px;color:var(--text3)">(${formatNum(countWords(fullText))}字)</span></div>
        <textarea class="convert-textarea" id="scriptInput" placeholder="选择作品后，小说内容将自动加载到这里。你可以编辑或粘贴新的内容...">${fullText}</textarea>
      </div>
      <div class="convert-panel">
        <div class="convert-panel-header">🎬 剧本格式</div>
        <textarea class="convert-textarea" id="scriptOutput" placeholder="转换后的剧本将显示在这里..."></textarea>
      </div>
    </div>
    <div style="display:flex;gap:12px;margin-top:16px">
      <button class="btn btn-accent btn-lg" onclick="convertToScript()">🔄 一键转换</button>
      <button class="btn btn-secondary btn-lg" onclick="previewScript()">👁️ 预览效果</button>
      <button class="btn btn-primary btn-lg" onclick="saveScript()">💾 保存剧本</button>
      <button class="btn btn-secondary" onclick="copyScript()">📋 复制</button>
    </div>
    <div class="card" style="margin-top:20px">
      <div class="card-title">📝 转换说明</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;font-size:13px;color:var(--text2)">
        <div>📌 自动识别场景描述、人物对白、动作描写</div>
        <div>📌 转换为标准剧本格式（场景/人物/台词/动作）</div>
        <div>📌 支持对话压缩与情节重构</div>
        <div>📌 可导出为标准剧本文档格式</div>
      </div>
    </div>
  `;
}

function convertToScript() {
  const input = document.getElementById('scriptInput').value;
  if (!input.trim()) { toast('请先输入或选择小说内容', 'warning'); return; }
  const output = generateScriptFromText(input);
  document.getElementById('scriptOutput').value = output;
  toast('剧本转换完成！', 'success');
}

function generateScriptFromText(text) {
  // 智能解析小说文本，转换为剧本格式
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  let sceneNum = 0;
  let script = '【剧本格式】\n\n';

  paragraphs.forEach(p => {
    const trimmed = p.trim();
    if (!trimmed) return;

    // 检测是否为对话
    const dialogueMatch = trimmed.match(/^["""](.*?)["""]|^(「|『)(.*?)(」|』)/);
    // 检测动作描写
    const actionMatch = trimmed.match(/^(她|他|它|他们|她们)([，。]|$)/);
    // 检测场景描述
    const sceneMatch = trimmed.match(/(晨|暮|夜|日|午|星|光|雨|雪|风|云|霞|雾|雷|电)/g);

    if (dialogueMatch) {
      script += `  对白：${trimmed}\n\n`;
    } else if (actionMatch && trimmed.length < 200) {
      script += `  动作：${trimmed}\n\n`;
    } else {
      sceneNum++;
      script += `【场景 ${sceneNum}】\n${trimmed}\n\n`;
    }
  });

  return script + '【剧本结束】\n';
}

function previewScript() {
  const output = document.getElementById('scriptOutput').value;
  if (!output.trim()) { toast('请先生成剧本', 'warning'); return; }
  showModal('🎬 剧本预览', `<div style="font-family:monospace;white-space:pre-wrap;font-size:13px;line-height:1.8;max-height:60vh;overflow-y:auto;color:var(--text2)">${output}</div><div style="margin-top:16px;display:flex;gap:8px"><button class="btn btn-primary" onclick="copyScript()">📋 复制剧本</button><button class="btn btn-secondary" onclick="closeModal()">关闭</button></div>`);
}
function copyScript() {
  const text = document.getElementById('scriptOutput').value;
  if (!text) { toast('剧本内容为空', 'warning'); return; }
  navigator.clipboard.writeText(text).then(() => toast('已复制到剪贴板', 'success')).catch(() => toast('复制失败', 'error'));
}
function saveScript() {
  const output = document.getElementById('scriptOutput').value;
  if (!output.trim()) { toast('剧本内容为空', 'warning'); return; }
  const nid = App.currentNovel?.id || DB.getNovels()[0]?.id;
  if (nid) {
    const novels = DB.getNovels();
    const novel = novels.find(n => n.id === nid);
    const scripts = DB.get('scripts_' + nid, []);
    scripts.push({ id: genId(), novelId: nid, title: novel?.title + ' - 剧本版', content: output, created: Date.now() });
    DB.set('scripts_' + nid, scripts);
    toast('剧本已保存', 'success');
  }
}

// ========== 小说转漫剧 ==========
function renderComic(el, params) {
  const novels = DB.getNovels();
  const nid = params.novelId || novels[0]?.id;
  const chapters = nid ? DB.getChapters(nid) : [];
  const fullText = chapters.map(c => c.content || '').join('\n\n');

  el.innerHTML = `
    <div class="section-header"><div class="section-title">🎨 小说转漫剧</div></div>
    <div style="margin-bottom:16px"><select class="form-select" style="max-width:300px" onchange="navigate('comic',{novelId:this.value})">
      ${novels.map(n => `<option value="${n.id}" ${n.id===nid?'selected':''}>${n.title}</option>`).join('')}
    </select></div>
    <div class="comic-settings">
      <div class="card"><div class="card-title">🎭 画风</div>
        <select class="form-select" id="comicStyle">
          <option value="anime">日式动漫</option><option value="manga">美式漫画</option>
          <option value="chinese">国风水墨</option><option value="pixel">像素风格</option>
        </select>
      </div>
      <div class="card"><div class="card-title">📐 分镜</div>
        <select class="form-select" id="comicLayout">
          <option value="standard">标准分镜</option><option value="cinematic">电影感分镜</option>
          <option value="action">动作连拍</option><option value="minimal">极简分镜</option>
        </select>
      </div>
      <div class="card"><div class="card-title">🖼️ 每页场景数</div>
        <select class="form-select" id="comicScenes">
          <option value="2">2个场景</option><option value="3" selected>3个场景</option>
          <option value="4">4个场景</option><option value="6">6个场景</option>
        </select>
      </div>
      <div class="card"><div class="card-title">👥 角色数量</div>
        <div style="display:flex;align-items:center;gap:8px">
          <input type="range" min="1" max="5" value="3" id="charCount" style="flex:1">
          <span id="charCountVal" style="font-size:14px;color:var(--primary-light);min-width:20px">3</span>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:20px">
      <button class="btn btn-accent btn-lg" onclick="generateComicScript()">🎬 生成漫剧脚本</button>
      <button class="btn btn-secondary btn-lg" onclick="previewComic()">👁️ 预览效果</button>
    </div>
    <div id="comicPreviewArea">
      <div class="comic-settings" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
        ${[1,2,3,4,5,6].map(i => `
          <div class="comic-panel">
            <div class="comic-panel-img" id="comicPanel${i}">🎭</div>
            <div class="comic-panel-text" id="comicText${i}">场景 ${i} — 点击「生成漫剧脚本」自动填充</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="card" style="margin-top:20px">
      <div class="card-title">📝 漫剧说明</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;font-size:13px;color:var(--text2)">
        <div>📌 提取场景描写转换为视觉分镜</div>
        <div>📌 标注人物位置和表情提示</div>
        <div>📌 生成旁白和对话框文字</div>
        <div>📌 支持多种画风和分镜格式</div>
      </div>
    </div>
  `;

  // 绑定滑块
  setTimeout(() => {
    const slider = document.getElementById('charCount');
    if (slider) slider.addEventListener('input', () => {
      document.getElementById('charCountVal').textContent = slider.value;
    });
  }, 100);
}

function generateComicScript() {
  const nid = App.currentNovel?.id || DB.getNovels()[0]?.id;
  const chapters = nid ? DB.getChapters(nid) : [];
  const fullText = chapters.map(c => c.content || '').join('\n\n');
  if (!fullText.trim()) { toast('请先选择有内容的小说作品', 'warning'); return; }

  const paragraphs = fullText.split(/\n\n+/).filter(p => p.trim().length > 10);
  const style = document.getElementById('comicStyle')?.value || 'anime';
  const layout = document.getElementById('comicLayout')?.value || 'standard';
  const scenesPerPage = parseInt(document.getElementById('comicScenes')?.value || '3');

  const styleEmoji = { anime: '🌸', manga: '💥', chinese: '🖌️', pixel: '👾' };
  const layoutDesc = { standard: '标准', cinematic: '电影感', action: '动作连拍', minimal: '极简' };

  const scenes = paragraphs.slice(0, 6).map((p, i) => {
    const sentences = p.split(/[。！？]/).filter(s => s.trim().length > 5);
    return {
      emoji: styleEmoji[style] || '🎭',
      desc: sentences.slice(0, 2).join('。') + '……',
      note: `[${layoutDesc[layout]}分镜 · ${styleEmoji[style]}] ${sentences[0]?.slice(0,30) || ''}……`,
    };
  });

  for (let i = 0; i < 6; i++) {
    const el = document.getElementById('comicPanel' + (i+1));
    const tel = document.getElementById('comicText' + (i+1));
    if (el && scenes[i]) {
      el.textContent = scenes[i].emoji;
      el.style.background = ['linear-gradient(135deg,#1e3a5f,#6c63ff)','linear-gradient(135deg,#5f1e3a,#ec4899)','linear-gradient(135deg,#1a3d1a,#16a34a)','linear-gradient(135deg,#3d2800,#b45309)','linear-gradient(135deg,#1a0020,#7c3aed)','linear-gradient(135deg,#1a1a2e,#374151)'][i];
      el.style.color = '#fff';
    }
    if (tel && scenes[i]) tel.textContent = scenes[i].note;
  }
  toast('漫剧脚本已生成！', 'success');
}

function previewComic() {
  const nid = App.currentNovel?.id || DB.getNovels()[0]?.id;
  const novel = DB.getNovels().find(n => n.id === nid);
  const chapters = nid ? DB.getChapters(nid) : [];
  const text = chapters.map(c => c.content||'').join('\n\n');
  if (!text.trim()) { toast('请先选择有内容的小说', 'warning'); return; }
  showModal('🎨 漫剧预览', `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-height:60vh;overflow-y:auto">${[1,2,3,4,5,6].map(i => `<div style="background:var(--card2);border:1px solid var(--border);border-radius:8px;overflow:hidden"><div style="height:120px;display:flex;align-items:center;justify-content:center;font-size:36px" id="prevPanel${i}">🎭</div><div style="padding:8px;font-size:11px;color:var(--text2);line-height:1.5" id="prevText${i}">场景 ${i}</div></div>`).join('')}</div><div style="margin-top:16px;display:flex;gap:8px"><button class="btn btn-primary" onclick="generateComicScript();closeModal();previewComic()">🔄 更新</button><button class="btn btn-secondary" onclick="closeModal()">关闭</button></div>`);
  setTimeout(generateComicScript, 100);
}

// ========== 大纲工具 ==========
function renderOutline(el, params) {
  const novels = DB.getNovels();
  const nid = params.novelId || novels[0]?.id;
  const novel = novels.find(n => n.id === nid);
  const chapters = nid ? DB.getChapters(nid) : [];
  const outline = DB.getOutline(nid) || [];

  const typeLabel = t => t==='short'?'短篇':t==='medium'?'中篇':'长篇';

  el.innerHTML = `
    <div class="section-header">
      <div class="section-title">🗺️ 大纲工具</div>
      <select class="form-select" style="max-width:200px" onchange="navigate('outline',{novelId:this.value})">
        ${novels.map(n => `<option value="${n.id}" ${n.id===nid?'selected':''}>${n.title}</option>`).join('')}
      </select>
    </div>
    <div class="outline-grid">
      <div class="outline-tree">
        <div style="padding:12px 16px;border-bottom:1px solid var(--border);font-size:13px;font-weight:600;color:var(--text)">
          ${novel?.title || '未选择'} · ${typeLabel(novel?.type)} · ${chapters.length}章
        </div>
        <div style="padding:12px">
          <div style="font-size:12px;color:var(--text3);margin-bottom:8px">📌 故事结构</div>
          ${[
            {icon:'🎯',label:'核心主题',desc: novel?.desc || '点击编辑'},
            {icon:'🏗️',label:'故事起点',desc: outline[0] || '故事从……开始'},
            {icon:'⚡',label:'核心冲突',desc: outline[1] || '主要矛盾和冲突点'},
            {icon:'🔄',label:'中段转折',desc: outline[2] || '故事的重大转折'},
            {icon:'🎭',label:'高潮设计',desc: outline[3] || '最激动人心的高潮'},
            {icon:'🏁',label:'结局走向',desc: outline[4] || '故事的最终结局'},
          ].map((item, i) => `<div class="outline-node" onclick="editOutlineNode(${i})"><span>${item.icon}</span><span style="margin-left:8px;flex:1;font-size:13px">${item.label}</span></div>`).join('')}
        </div>
        <div style="padding:12px;border-top:1px solid var(--border)">
          <div style="font-size:12px;color:var(--text3);margin-bottom:8px">📖 章节大纲</div>
          ${chapters.map(ch => `<div class="outline-node" onclick="editChapterOutline('${ch.id}')"><span>📄</span><span style="margin-left:8px;flex:1;font-size:13px">${ch.title}</span><span style="font-size:11px;color:var(--text3)">${ch.words||0}字</span></div>`).join('')}
          <div class="add-chapter-btn" style="margin-top:8px" onclick="navigate('write',{novelId:'${nid}'})">✛ 去写作添加章节</div>
        </div>
      </div>
      <div class="outline-detail">
        <div class="card-title">💡 故事灵感</div>
        <div id="outlineDetail">
          <div class="empty-state" style="padding:30px">
            <div class="empty-icon">🗺️</div>
            <div class="empty-title">点击左侧节点编辑大纲</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function editOutlineNode(index) {
  const titles = ['核心主题','故事起点','核心冲突','中段转折','高潮设计','结局走向'];
  const descs = ['简要描述故事的核心主题是什么','故事从什么背景和情境开始','故事的主要矛盾和冲突是什么','故事中段有哪些重要转折','最激动人心的高潮场景是什么','故事的最终走向和结局'];
  const nid = App.currentNovel?.id || DB.getNovels()[0]?.id;
  const outline = DB.getOutline(nid) || [];
  showModal(titles[index], `
    <div class="form-group"><label class="form-label">${descs[index]}</label><textarea class="form-textarea" id="outlineInput" rows="4" placeholder="输入你的想法……">${outline[index]||''}</textarea></div>
    <button class="btn btn-primary" onclick="saveOutlineNode(${index})">💾 保存</button>
  `);
}

function saveOutlineNode(index) {
  const nid = App.currentNovel?.id || DB.getNovels()[0]?.id;
  if (!nid) return;
  const outline = DB.getOutline(nid) || [];
  outline[index] = document.getElementById('outlineInput').value;
  DB.setOutline(nid, outline);
  closeModal();
  toast('大纲已保存', 'success');
  renderOutline(document.getElementById('content'), { novelId: nid });
}

function editChapterOutline(chapterId) {
  const nid = App.currentNovel?.id || DB.getNovels()[0]?.id;
  const chapters = nid ? DB.getChapters(nid) : [];
  const ch = chapters.find(c => c.id === chapterId);
  if (!ch) return;
  showModal('📄 ' + ch.title + ' - 章节大纲', `
    <div class="form-group"><label class="form-label">本章要写什么？</label><textarea class="form-textarea" id="chOutlineInput" rows="3" placeholder="本章的核心事件……"></textarea></div>
    <div class="form-group"><label class="form-label">本章字数目标</label><input class="form-input" type="number" id="chWordGoal" value="${ch.words||2000}"></div>
    <button class="btn btn-primary" onclick="saveChapterOutline('${chapterId}')">💾 保存</button>
  `);
}

function saveChapterOutline(chapterId) {
  const nid = App.currentNovel?.id || DB.getNovels()[0]?.id;
  if (!nid) return;
  const chapters = DB.getChapters(nid);
  const idx = chapters.findIndex(c => c.id === chapterId);
  if (idx >= 0) {
    chapters[idx].outline = document.getElementById('chOutlineInput').value;
    chapters[idx].wordGoal = parseInt(document.getElementById('chWordGoal').value) || 2000;
    DB.setChapters(nid, chapters);
  }
  closeModal();
  toast('章节大纲已保存', 'success');
}

// ========== 人物管理 ==========
function renderCharacters(el, params) {
  const novels = DB.getNovels();
  const nid = params.novelId || novels[0]?.id;
  const novel = novels.find(n => n.id === nid);
  const chars = nid ? DB.getCharacters(nid) : [];

  el.innerHTML = `
    <div class="section-header">
      <div class="section-title">👤 人物管理</div>
      <div style="display:flex;gap:8px">
        <select class="form-select" style="max-width:200px" onchange="navigate('characters',{novelId:this.value})">
          ${novels.map(n => `<option value="${n.id}" ${n.id===nid?'selected':''}>${n.title}</option>`).join('')}
        </select>
        <button class="btn btn-primary" onclick="showAddCharModal()">✛ 添加人物</button>
      </div>
    </div>
    <div class="chars-grid">
      ${chars.map(c => `
        <div class="char-card" onclick="editChar('${c.id}')">
          <div class="char-avatar">${c.icon||'👤'}</div>
          <div class="char-name">${c.name}</div>
          <div class="char-role">${c.role || '未设定'} · ${c.age || ''}</div>
          <div class="char-tags">${(c.tags||[]).map(t => `<span class="char-tag">${t}</span>`).join('')}</div>
        </div>
      `).join('')}
      ${chars.length === 0 ? `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">👥</div><div class="empty-title">还没有人物</div><div class="empty-desc">为你的故事创建鲜活的人物角色</div><button class="btn btn-primary" style="margin-top:12px" onclick="showAddCharModal()">✛ 添加人物</button></div>` : ''}
    </div>
  `;
}

function showAddCharModal() {
  const nid = App.currentNovel?.id || DB.getNovels()[0]?.id;
  if (!nid) { toast('请先选择一个作品', 'warning'); return; }
  showModal('👤 添加人物', `
    <div class="form-group"><label class="form-label">姓名</label><input class="form-input" id="charName" placeholder="角色姓名"></div>
    <div class="form-group"><label class="form-label">角色定位</label><select class="form-select" id="charRole"><option>主角</option><option>女主</option><option>男二</option><option>女主二</option><option>反派</option><option>配角</option><option>导师</option><option>神秘人</option></select></div>
    <div class="form-group"><label class="form-label">年龄</label><input class="form-input" id="charAge" placeholder="如：25岁"></div>
    <div class="form-group"><label class="form-label">性别</label><select class="form-select" id="charGender"><option>男</option><option>女</option><option>其他</option></select></div>
    <div class="form-group"><label class="form-label">标签（逗号分隔）</label><input class="form-input" id="charTags" placeholder="如：冷静、理性、神秘"></div>
    <div class="form-group"><label class="form-label">人物简介</label><textarea class="form-textarea" id="charDesc" placeholder="描述这个角色的性格、外貌、背景……"></textarea></div>
    <button class="btn btn-primary btn-block" onclick="addCharacter()">✨ 创建人物</button>
  `);
}

function addCharacter() {
  const nid = App.currentNovel?.id || DB.getNovels()[0]?.id;
  if (!nid) return;
  const name = document.getElementById('charName').value.trim();
  if (!name) { toast('请输入角色姓名', 'error'); return; }
  const chars = DB.getCharacters(nid);
  const newChar = {
    id: genId(), novelId: nid,
    name, role: document.getElementById('charRole').value,
    age: document.getElementById('charAge').value,
    gender: document.getElementById('charGender').value,
    tags: (document.getElementById('charTags').value || '').split(/[,，]/).filter(t => t.trim()),
    desc: document.getElementById('charDesc').value,
    icon: '👤',
  };
  chars.push(newChar);
  DB.setCharacters(nid, chars);
  closeModal();
  toast('人物创建成功！', 'success');
  renderCharacters(document.getElementById('content'), { novelId: nid });
}

function editChar(charId) {
  const nid = App.currentNovel?.id || DB.getNovels()[0]?.id;
  if (!nid) return;
  const chars = DB.getCharacters(nid);
  const c = chars.find(ch => ch.id === charId);
  if (!c) return;
  showModal('👤 编辑人物 — ' + c.name, `
    <div class="form-group"><label class="form-label">姓名</label><input class="form-input" id="eCharName" value="${c.name}"></div>
    <div class="form-group"><label class="form-label">角色定位</label><select class="form-select" id="eCharRole"><option ${c.role==='主角'?'selected':''}>主角</option><option ${c.role==='女主'?'selected':''}>女主</option><option ${c.role==='反派'?'selected':''}>反派</option><option ${c.role==='配角'?'selected':''}>配角</option></select></div>
    <div class="form-group"><label class="form-label">简介</label><textarea class="form-textarea" id="eCharDesc">${c.desc||''}</textarea></div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary" onclick="updateChar('${charId}')">💾 保存</button>
      <button class="btn btn-danger" onclick="deleteChar('${charId}')">🗑️ 删除</button>
      <button class="btn btn-secondary" onclick="closeModal()">取消</button>
    </div>
  `);
}

function updateChar(charId) {
  const nid = App.currentNovel?.id || DB.getNovels()[0]?.id;
  if (!nid) return;
  const chars = DB.getCharacters(nid);
  const idx = chars.findIndex(c => c.id === charId);
  if (idx >= 0) {
    chars[idx].name = document.getElementById('eCharName').value;
    chars[idx].role = document.getElementById('eCharRole').value;
    chars[idx].desc = document.getElementById('eCharDesc').value;
    DB.setCharacters(nid, chars);
  }
  closeModal();
  toast('已保存', 'success');
  renderCharacters(document.getElementById('content'), { novelId: nid });
}

function deleteChar(charId) {
  const nid = App.currentNovel?.id || DB.getNovels()[0]?.id;
  if (!nid) return;
  let chars = DB.getCharacters(nid);
  chars = chars.filter(c => c.id !== charId);
  DB.setCharacters(nid, chars);
  closeModal();
  toast('人物已删除', 'warning');
  renderCharacters(document.getElementById('content'), { novelId: nid });
}

// ========== 设置页 ==========
function renderSettings(el) {
  const s = DB.getSettings();
  el.innerHTML = `
    <div class="settings-layout">
      <div class="settings-nav">
        <div class="settings-nav-item active" onclick="showSettingsSection('general',this)">⚙️ 通用设置</div>
        <div class="settings-nav-item" onclick="showSettingsSection('appearance',this)">🎨 外观</div>
        <div class="settings-nav-item" onclick="showSettingsSection('writing',this)">✍️ 写作设置</div>
        <div class="settings-nav-item" onclick="showSettingsSection('ai',this)">🤖 AI写作</div>
        <div class="settings-nav-item" onclick="showSettingsSection('data',this)">💾 数据管理</div>
        <div class="settings-nav-item" onclick="showSettingsSection('about',this)">ℹ️ 关于</div>
      </div>
      <div class="settings-content" id="settingsContent">
        <!-- 通用 -->
        <div id="sec-general">
          <div class="settings-section"><div class="settings-section-title">通用</div>
            <div class="settings-row"><div><div class="settings-label">每日写作目标</div><div class="settings-desc">每天计划写多少字</div></div><input type="number" value="${s.dailyGoal||2000}" style="width:120px;text-align:center" onchange="saveSetting('dailyGoal',parseInt(this.value))"></div>
            <div class="settings-row"><div><div class="settings-label">自动保存</div><div class="settings-desc">写作时自动保存内容</div></div><div class="toggle ${s.autoSave?'on':''}" onclick="this.classList.toggle('on');saveSetting('autoSave',this.classList.contains('on'))"></div></div>
            <div class="settings-row"><div><div class="settings-label">专注模式</div><div class="settings-desc">隐藏所有干扰元素</div></div><div class="toggle ${s.focusMode?'on':''}" onclick="this.classList.toggle('on');saveSetting('focusMode',this.classList.contains('on'))"></div></div>
          </div>
        </div>
        <!-- 外观 -->
        <div id="sec-appearance" style="display:none">
          <div class="settings-section"><div class="settings-section-title">外观</div>
            <div class="settings-row"><div><div class="settings-label">主题颜色</div><div class="settings-desc">选择界面配色方案</div></div><div style="display:flex;gap:8px"><div class="theme-option active" style="background:var(--bg2)" onclick="setTheme('dark',this)"></div><div class="theme-option" style="background:#fff" onclick="setTheme('light',this)"></div></div></div>
            <div class="settings-row"><div><div class="settings-label">编辑器字号</div><div style="display:flex;align-items:center;gap:8px"><input type="range" min="14" max="22" value="${s.fontSize||16}" style="width:120px" onchange="saveSetting('fontSize',parseInt(this.value));document.getElementById('writeEditor').style.fontSize=this.value+'px'"><span style="min-width:30px">${s.fontSize||16}px</span></div></div></div>
            <div class="settings-row"><div><div class="settings-label">行间距</div><div style="display:flex;align-items:center;gap:8px"><input type="range" min="1.5" max="2.5" step="0.1" value="${s.lineHeight||2}" style="width:120px" onchange="saveSetting('lineHeight',parseFloat(this.value));document.getElementById('writeEditor').style.lineHeight=this.value"><span style="min-width:30px">${s.lineHeight||2}</span></div></div></div>
          </div>
        </div>
        <!-- 写作 -->
        <div id="sec-writing" style="display:none">
          <div class="settings-section"><div class="settings-section-title">写作工具</div>
            <div class="settings-row"><div><div class="settings-label">启用AI助手</div><div class="settings-desc">在写作界面显示AI写作建议</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
            <div class="settings-row"><div><div class="settings-label">智能大纲</div><div class="settings-desc">自动分析故事结构</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
          </div>
        </div>
        <!-- AI写作 -->
        <div id="sec-ai" style="display:none">
          <div class="settings-section"><div class="settings-section-title">🤖 AI服务配置</div>
            <div style="padding:12px;background:var(--bg3);border-radius:var(--radius-sm);margin-bottom:16px">
              <div style="font-size:12px;color:var(--text2);line-height:1.6">
                <p style="margin-bottom:8px">使用硅基流动API（<a href="https://cloud.siliconflow.cn" target="_blank" style="color:var(--primary)">前往获取</a>）提供免费额度</p>
              </div>
            </div>
            <div class="settings-section"><div class="settings-section-title">API配置</div>
              <div class="settings-row" style="flex-direction:column;align-items:flex-start;gap:8px">
                <div style="width:100%">
                  <div class="settings-label">API Key</div>
                  <input type="password" id="aiApiKeyInput" value="${s.aiApiKey||''}" placeholder="sk-xxxxxxxx" style="width:100%;margin-top:4px" onchange="saveSetting('aiApiKey',this.value)">
                </div>
              </div>
              <div class="settings-row" style="flex-direction:column;align-items:flex-start;gap:8px">
                <div style="width:100%">
                  <div class="settings-label">选择模型</div>
                  <select id="aiModelSelect" style="width:100%;margin-top:4px;padding:8px;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--bg2)" onchange="saveSetting('aiModel',this.value)">
                    <option value="deepseek-ai/DeepSeek-V3" ${(s.aiModel||'')==='deepseek-ai/DeepSeek-V3'?'selected':''}>DeepSeek V3（推荐）</option>
                    <option value="deepseek-ai/DeepSeek-R1" ${s.aiModel==='deepseek-ai/DeepSeek-R1'?'selected':''}>DeepSeek R1（推理）</option>
                    <option value="Qwen/Qwen2.5-72B-Instruct" ${s.aiModel==='Qwen/Qwen2.5-72B-Instruct'?'selected':''}>Qwen 72B</option>
                    <option value="THUDM/glm-4-9b-chat" ${s.aiModel==='THUDM/glm-4-9b-chat'?'selected':''}>GLM-4</option>
                    <option value="Pro/Qwen/Qwen2.5-7B-Instruct" ${s.aiModel==='Pro/Qwen/Qwen2.5-7B-Instruct'?'selected':''}>Qwen 7B（免费）</option>
                  </select>
                </div>
              </div>
              <div class="settings-row" style="flex-direction:column;align-items:flex-start;gap:8px">
                <div style="width:100%;display:flex;justify-content:space-between;align-items:center">
                  <div>
                    <div class="settings-label">使用本地代理</div>
                    <div class="settings-desc" style="color:${s.useAiProxy?'var(--success)':'var(--warning)'}">${s.useAiProxy?'已开启（电脑专用）':'已关闭（手机推荐）'}</div>
                  </div>
                  <label class="switch" style="margin-left:12px">
                    <input type="checkbox" id="useAiProxyToggle" ${s.useAiProxy?'checked':''} onchange="saveSetting('useAiProxy',this.checked);this.parentElement.nextSibling.textContent=this.checked?'已开启（电脑专用）':'已关闭（手机推荐）'">
                    <span class="slider"></span>
                  </label>
                </div>
                <div style="font-size:11px;color:var(--text3);margin-top:8px;padding:8px;background:var(--bg2);border-radius:var(--radius-sm);line-height:1.6">
                  💡 <b>手机用户</b>：关闭此项，直接连接API<br>
                  💻 <b>电脑用户</b>：开启此项，需要运行 proxy_server.py
                </div>
              </div>
            </div>
            <div class="settings-section"><div class="settings-section-title">生成设置</div>
              <div class="settings-row"><div><div class="settings-label">每次生成字数</div><div class="settings-desc">建议500-1000字</div></div><input type="number" id="aiMaxTokens" value="${s.aiMaxTokens||800}" style="width:80px;text-align:center" onchange="saveSetting('aiMaxTokens',parseInt(this.value))"></div>
              <div class="settings-row"><div><div class="settings-label">Temperature</div><div class="settings-desc">创意度（0-1）</div></div><input type="range" min="0.1" max="1" step="0.1" value="${s.aiTemp||0.8}" style="width:100px" onchange="saveSetting('aiTemp',parseFloat(this.value))"><span style="min-width:30px">${s.aiTemp||0.8}</span></div>
            </div>
            <button class="btn btn-primary" style="width:100%;margin-top:12px" onclick="testAIConnection()">🧪 测试连接</button>
          </div>
        </div>
        <!-- 数据 -->
        <div id="sec-data" style="display:none">
          <div class="settings-section"><div class="settings-section-title">数据管理</div>
            <div style="display:flex;flex-direction:column;gap:8px">
              <button class="btn btn-secondary" onclick="exportAllData()">📤 导出全部数据</button>
              <button class="btn btn-secondary" onclick="document.getElementById('importFile').click()">📥 导入数据</button>
              <input type="file" id="importFile" style="display:none" accept=".json" onchange="importData(this.files[0])">
              <hr class="divider">
              <button class="btn btn-danger" onclick="confirmClearData()">⚠️ 清除所有数据</button>
            </div>
          </div>
        </div>
        <!-- 关于 -->
        <div id="sec-about" style="display:none">
          <div class="settings-section"><div class="settings-section-title">关于小说家</div>
            <div style="text-align:center;padding:20px">
              <div style="font-size:48px;margin-bottom:12px">📖</div>
              <div style="font-size:22px;font-weight:700;background:linear-gradient(135deg,var(--primary-light),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px">小说家</div>
              <div style="font-size:14px;color:var(--text3);margin-bottom:16px">Novelist · 版本 1.0.0</div>
              <div style="font-size:13px;color:var(--text2);line-height:1.8;max-width:400px;margin:0 auto">
                一款专为中文小说创作者打造的写作工具。<br>支持短篇、中篇、长篇创作，<br>内置小说转剧本、转漫剧等创意功能。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function showSettingsSection(name, el) {
  document.querySelectorAll('.settings-nav-item').forEach(e => e.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('[id^="sec-"]').forEach(e => e.style.display = 'none');
  const sec = document.getElementById('sec-' + name);
  if (sec) sec.style.display = 'block';
}

function saveSetting(key, val) {
  const s = DB.getSettings();
  s[key] = val;
  DB.setSettings(s);
  if (key === 'theme') document.body.classList.toggle('theme-light', val === 'light');
  toast('已保存', 'success');
}

function setTheme(theme, el) {
  document.querySelectorAll('.theme-option').forEach(e => e.classList.remove('active'));
  el.classList.add('active');
  document.body.classList.toggle('theme-light', theme === 'light');
  saveSetting('theme', theme);
}

function exportAllData() {
  const data = { novels: DB.getNovels(), settings: DB.getSettings() };
  DB.getNovels().forEach(n => {
    data['chapters_' + n.id] = DB.getChapters(n.id);
    data['chars_' + n.id] = DB.getCharacters(n.id);
    data['outline_' + n.id] = DB.getOutline(n.id);
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '小说家备份_' + new Date().toLocaleDateString('zh-CN') + '.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('数据已导出', 'success');
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.novels) DB.setNovels(data.novels);
      if (data.settings) DB.setSettings(data.settings);
      Object.keys(data).forEach(k => {
        if (k.startsWith('chapters_') || k.startsWith('chars_') || k.startsWith('outline_')) DB.set(k, data[k]);
      });
      toast('数据导入成功！', 'success');
      navigate('dashboard');
    } catch { toast('导入失败，文件格式错误', 'error'); }
  };
  reader.readAsText(file);
}

function confirmClearData() {
  showModal('⚠️ 确认清除', `<p style="font-size:14px;color:var(--text2);margin-bottom:16px">确定要清除所有数据吗？这将删除所有作品、章节和设置，且无法恢复！</p><div style="display:flex;gap:8px"><button class="btn btn-danger" onclick="clearAllData()">⚠️ 确认清除</button><button class="btn btn-secondary" onclick="closeModal()">取消</button></div>`);
}

function clearAllData() {
  Object.keys(localStorage).filter(k => k.startsWith('novelist_')).forEach(k => localStorage.removeItem(k));
  closeModal();
  toast('所有数据已清除', 'warning');
  initDemoData();
  navigate('dashboard');
}

function exportNovel(novelId) {
  const novel = DB.getNovels().find(n => n.id === novelId);
  const chapters = DB.getChapters(novelId);
  if (!novel || !chapters.length) { toast('没有可导出的内容', 'warning'); return; }
  const text = [novel.title, '='.repeat(40), '', ...chapters.map(c => c.title + '\n' + (c.content||'').replace(/<[^>]+>/g,''))].join('\n');
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = novel.title + '.txt';
  a.click();
  URL.revokeObjectURL(url);
  toast('已导出 ' + novel.title + '.txt', 'success');
}

// ========== 模态框 & Toast ==========
function showModal(title, body, footer) {
  const modal = document.getElementById('modal');
  const overlay = document.getElementById('modalOverlay');
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = body;
  document.getElementById('modalFooter').innerHTML = footer || '<button class="btn btn-secondary" onclick="closeModal()">关闭</button>';
  overlay.classList.add('show');
  modal.classList.add('show');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
  document.getElementById('modal').classList.remove('show');
}
function toast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + (type || '');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.classList.remove('show'); }, 2500);
}

// ========== 键盘快捷键 ==========
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (document.getElementById('modal').classList.contains('show')) closeModal();
    if (App.focusMode) toggleFocusMode();
  }
  if (e.ctrlKey && e.key === 's' && App.currentPage === 'write') {
    e.preventDefault();
    saveCurrentChapter();
    toast('已保存', 'success');
  }
  if (e.ctrlKey && e.key === 'n') { e.preventDefault(); showNewNovelModal(); }
});

// ========== 启动 ==========
window.addEventListener('DOMContentLoaded', () => {
  initDemoData();
  
  // 初始化护眼模式
  const settings = DB.getSettings();
  if (settings.eyeCareMode) {
    App.eyeCareMode = true;
    document.body.classList.add('eye-care');
  }
  updateEyeCareBtn();
  
  navigate('dashboard');
  document.getElementById('sidebarClose').addEventListener('click', toggleSidebar);

  // 快捷键 Ctrl+1-8 切换页面
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key >= '1' && e.key <= '8') {
      e.preventDefault();
      const pages = ['dashboard','write','library','script','comic','outline','characters','stats'];
      navigate(pages[parseInt(e.key)-1]);
    }
  });
});

// PWA 注册
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// ========== AI写作核心功能 ==========

// 测试AI连接
async function testAIConnection() {
  const settings = DB.getSettings();
  const apiKey = settings.aiApiKey;
  
  if (!apiKey) {
    toast('请先填写API Key', 'warning');
    return;
  }
  
  toast('正在测试连接...', 'info');
  
  // 本地代理服务器
  const proxyUrl = settings.aiProxyUrl || 'http://localhost:8080';
  // GitHub Pages默认直连，本地运行可用代理
  const isLocal = window.location.hostname === 'localhost' || window.location.protocol === 'file:';
  const useProxy = settings.useAiProxy === true && isLocal;
  
  try {
    let response;
    
    if (useProxy) {
      // 使用代理服务器
      response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey,
          model: settings.aiModel || 'deepseek-ai/DeepSeek-V3',
          messages: [{ role: 'user', content: '你好' }],
          max_tokens: 50
        })
      });
    } else {
      // 直接调用API（可能存在跨域问题）
      response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: settings.aiModel || 'deepseek-ai/DeepSeek-V3',
          messages: [{ role: 'user', content: '你好' }],
          max_tokens: 50
        })
      });
    }
    
    if (response.ok) {
      toast('✅ 连接成功！', 'success');
    } else {
      const err = await response.json();
      toast('❌ 连接失败: ' + (err.error?.message || err.message || response.status), 'error');
    }
  } catch (e) {
    // 连接代理失败，提示启动代理服务器
    if (e.message.includes('fetch') || e.message.includes('Failed to')) {
      toast('⚠️ 需要启动代理服务器。运行: python proxy_server.py', 'warning');
    } else {
      toast('❌ 网络错误: ' + e.message, 'error');
    }
  }
}

// 调用AI生成内容
async function callAI(messages, maxTokens = 800, temperature = 0.8) {
  const settings = DB.getSettings();
  const apiKey = settings.aiApiKey;
  
  if (!apiKey) {
    throw new Error('请先在设置中配置AI API Key');
  }
  
  // 本地代理服务器
  const proxyUrl = settings.aiProxyUrl || 'http://localhost:8080';
  // GitHub Pages默认直连，本地运行可用代理
  const isLocal = window.location.hostname === 'localhost' || window.location.protocol === 'file:';
  const useProxy = settings.useAiProxy === true && isLocal;
  
  let response;
  
  if (useProxy) {
    // 使用代理服务器
    response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: apiKey,
        model: settings.aiModel || 'deepseek-ai/DeepSeek-V3',
        messages: messages,
        max_tokens: maxTokens,
        temperature: temperature
      })
    });
  } else {
    // 直接调用API
    response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: settings.aiModel || 'deepseek-ai/DeepSeek-V3',
        messages: messages,
        max_tokens: maxTokens,
        temperature: temperature
      })
    });
  }
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || err.message || 'API请求失败');
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// AI续写当前内容
async function aiContinueWrite() {
  const settings = DB.getSettings();
  if (!settings.aiApiKey) {
    showModal('⚠️ 需要配置API Key', `
      <div style="text-align:center;padding:20px">
        <div style="font-size:48px;margin-bottom:16px">🔑</div>
        <p style="margin-bottom:16px">AI写作功能需要配置API Key</p>
        <p style="font-size:13px;color:var(--text3);margin-bottom:20px">免费额度获取：<br>1. 访问 <a href="https://cloud.siliconflow.cn" target="_blank" style="color:var(--primary)">cloud.siliconflow.cn</a><br>2. 注册并创建API Key<br>3. 粘贴到设置中</p>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="closeModal()">稍后</button>
      <button class="btn btn-primary" onclick="closeModal();navigate('settings');setTimeout(()=>showSettingsSection('ai'),100)">去配置</button>
    `);
    return;
  }
  
  const editor = document.getElementById('writeEditor');
  if (!editor) { toast('请在写作页面使用', 'warning'); return; }
  
  const content = editor.innerText.trim();
  if (!content) { toast('请先输入一些内容', 'warning'); return; }
  
  const novel = App.currentNovel;
  const chapter = App.currentChapter;
  
  // 显示加载状态
  const loadingHtml = '<div class="ai-writing-panel"><div class="ai-loading"><span class="loading-spinner"></span>AI正在创作中...</div><div id="aiGeneratedContent" style="display:none;padding:12px"></div></div>';
  showModal('✍️ AI续写中', loadingHtml, '<button class="btn btn-secondary" onclick="closeModal()">取消</button>');
  
  try {
    // 构建提示词
    const genre = WritingPrompts.genres[novel?.genre] || WritingPrompts.genres['都市言情'];
    const systemPrompt = `你是专业的小说作者，擅长中文网络小说创作。
当前写作风格：${genre.name}
创作规范：${genre.rules.join('；')}
请延续用户的写作风格和语气，保持故事连贯性，直接输出续写内容，不要加任何前缀或说明。`;
    
    // 取最后500字作为上下文
    const recentContent = content.slice(-500);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请续写以下内容，输出约${settings.aiMaxTokens || 800}字：\n\n${recentContent}` }
    ];
    
    const result = await callAI(messages, settings.aiMaxTokens || 800, settings.aiTemp || 0.8);
    
    // 显示生成结果
    document.getElementById('aiGeneratedContent').style.display = 'block';
    document.getElementById('aiGeneratedContent').innerHTML = `<div class="ai-result-preview">${result.replace(/\n/g, '<br>')}</div>`;
    
    // 更新按钮
    document.getElementById('modalFooter').innerHTML = `
      <button class="btn btn-secondary" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" onclick="applyAIGeneratedContent()">✅ 采纳这段</button>
    `;
    
    // 保存生成的内容供采纳使用
    window._aiGeneratedContent = result;
    
  } catch (e) {
    closeModal();
    toast('❌ ' + e.message, 'error');
  }
}

// 采纳AI生成的内容
function applyAIGeneratedContent() {
  if (window._aiGeneratedContent) {
    insertText(window._aiGeneratedContent);
    toast('AI续写已采纳！', 'success');
  }
  closeModal();
}

// AI生成章节
async function aiGenerateChapter() {
  const settings = DB.getSettings();
  if (!settings.aiApiKey) {
    showModal('⚠️ 需要配置API Key', `
      <div style="text-align:center;padding:20px">
        <div style="font-size:48px;margin-bottom:16px">🔑</div>
        <p style="margin-bottom:16px">AI写作功能需要配置API Key</p>
        <p style="font-size:13px;color:var(--text3);margin-bottom:20px">免费额度获取：<br>1. 访问 <a href="https://cloud.siliconflow.cn" target="_blank" style="color:var(--primary)">cloud.siliconflow.cn</a><br>2. 注册并创建API Key<br>3. 粘贴到设置中</p>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="closeModal()">稍后</button>
      <button class="btn btn-primary" onclick="closeModal();navigate('settings');setTimeout(()=>showSettingsSection('ai'),100)">去配置</button>
    `);
    return;
  }
  
  const novel = App.currentNovel;
  if (!novel) { toast('请先选择作品', 'warning'); return; }
  
  const genres = Object.keys(WritingPrompts.genres);
  let html = `
    <div class="ai-gen-panel">
      <div class="settings-row" style="flex-direction:column;align-items:flex-start;margin-bottom:16px">
        <div class="settings-label">章节标题</div>
        <input type="text" id="aiChapterTitle" placeholder="例如：第一章 相遇" style="width:100%;margin-top:4px">
      </div>
      <div class="settings-row" style="flex-direction:column;align-items:flex-start;margin-bottom:16px">
        <div class="settings-label">写作要点（可选）</div>
        <textarea id="aiChapterPrompt" placeholder="描述这个章节的主要情节，例如：男主和女主在咖啡馆相遇，男主不小心把咖啡洒到女主身上..." style="width:100%;height:80px;margin-top:4px"></textarea>
      </div>
      <div class="settings-row" style="flex-direction:column;align-items:flex-start">
        <div class="settings-label">预计字数</div>
        <select id="aiChapterLength" style="width:100%;margin-top:4px">
          <option value="500">500字（短章节）</option>
          <option value="1000" selected>1000字（标准章节）</option>
          <option value="2000">2000字（长章节）</option>
          <option value="3000">3000字（超长章节）</option>
        </select>
      </div>
    </div>
  `;
  
  showModal('🤖 AI生成章节', html, `
    <button class="btn btn-secondary" onclick="closeModal()">取消</button>
    <button class="btn btn-primary" onclick="executeAIGenerateChapter()">🚀 开始生成</button>
  `);
}

async function executeAIGenerateChapter() {
  const title = document.getElementById('aiChapterTitle').value.trim();
  const prompt = document.getElementById('aiChapterPrompt').value.trim();
  const length = parseInt(document.getElementById('aiChapterLength').value);
  
  if (!title) { toast('请输入章节标题', 'warning'); return; }
  
  const novel = App.currentNovel;
  const chapters = DB.getChapters(novel.id);
  const order = chapters.length + 1;
  
  // 显示加载
  showModal('🤖 AI创作中', `
    <div style="text-align:center;padding:30px">
      <div class="loading-spinner" style="margin:0 auto 16px"></div>
      <p>AI正在根据你的要求创作章节...</p>
      <p style="font-size:12px;color:var(--text3)">请稍候，这可能需要几秒钟</p>
    </div>
  `, '');
  
  try {
    const genre = WritingPrompts.genres[novel.genre] || WritingPrompts.genres['都市言情'];
    const systemPrompt = `你是专业的小说作者，擅长中文网络小说创作。
当前写作风格：${genre.name}
创作规范：${genre.rules.join('；')}
文风要求：${genre.desc}
常用场景：${genre.scene.join('；')}
请直接输出小说内容，不要加任何前缀或说明。`;
    
    let userPrompt = `请为小说《${novel.title}》写一个章节。

章节标题：${title}
${prompt ? '写作要点：' + prompt : ''}
`;
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    const content = await callAI(messages, length, 0.8);
    
    // 创建新章节
    const newChapter = {
      id: genId(),
      novelId: novel.id,
      title: title,
      content: content,
      order: order,
      words: countWords(content),
      created: Date.now(),
      updated: Date.now()
    };
    
    chapters.push(newChapter);
    DB.setChapters(novel.id, chapters);
    
    closeModal();
    toast('✅ 章节创建成功！', 'success');
    
    // 刷新章节列表并打开新章节
    loadChapterList(novel.id);
    setTimeout(() => {
      selectChapter(newChapter.id);
    }, 100);
    
  } catch (e) {
    closeModal();
    toast('❌ ' + e.message, 'error');
  }
}

// AI对话助手（写作咨询）
let aiChatMessages = [];

async function aiChat(message) {
  if (!message.trim()) return;
  
  const chatContainer = document.getElementById('aiChatMessages');
  if (!chatContainer) return;
  
  // 添加用户消息
  chatContainer.innerHTML += `<div class="chat-user">${message}</div>`;
  chatContainer.innerHTML += `<div class="chat-ai loading"><span class="loading-spinner"></span>思考中...</div>`;
  chatContainer.scrollTop = chatContainer.scrollHeight;
  
  aiChatMessages.push({ role: 'user', content: message });
  
  try {
    const novel = App.currentNovel;
    const genre = WritingPrompts.genres[novel?.genre] || WritingPrompts.genres['都市言情'];
    
    const systemPrompt = `你是一位经验丰富的写作导师，专注于中文网络小说创作指导。
你可以提供以下帮助：
1. 情节构思和转折设计
2. 人物性格塑造和成长弧线
3. 对话风格和心理描写
4. 场景氛围营造
5. 写作技巧和修辞建议

当前写作类型：${genre.name}
风格特点：${genre.desc}
请用专业、鼓励的语气回答，简明扼要。`;
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...aiChatMessages
    ];
    
    const response = await callAI(messages, 500, 0.7);
    
    // 移除loading，显示回复
    const loadingEl = chatContainer.querySelector('.chat-ai.loading');
    if (loadingEl) {
      loadingEl.classList.remove('loading');
      loadingEl.innerHTML = response;
    }
    
    aiChatMessages.push({ role: 'assistant', content: response });
    
  } catch (e) {
    const loadingEl = chatContainer.querySelector('.chat-ai.loading');
    if (loadingEl) {
      loadingEl.classList.remove('loading');
      loadingEl.innerHTML = `<span style="color:var(--danger)">错误: ${e.message}</span>`;
    }
  }
  
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ============================================================
// AI 一键创作向导
// 流程：输入灵感 → 生成大纲 → 生成细纲 → 逐章生成内容
// ============================================================

// 全局状态
const AICreate = {
  step: 1,          // 1=灵感 2=大纲 3=细纲 4=生成内容
  idea: '',
  volCount: 1,
  chapterPerVol: 10,
  outline: null,    // { title, genre, desc, volumes:[{title,chapters:[{title,summary}]}] }
  detailOutline: null, // 细纲，同结构但chapters含detail字段
  novelId: null,
};

function renderAICreate(el) {
  const s = DB.getSettings();
  const hasKey = !!s.aiApiKey;
  const steps = [['1','💡','输入灵感'],['2','📋','生成大纲'],['3','📝','生成细纲'],['4','✍️','生成内容']];
  el.innerHTML = `
<div class="aic-wrap">
  ${!hasKey ? `<div class="aic-key-warning">
    <span>⚠️</span>
    <span>请先 <a onclick="navigate('settings');setTimeout(()=>showSettingsSection('ai'),100)">配置 API Key</a>，才能使用 AI 功能</span>
  </div>` : ''}
  <div id="aiCreateSteps" class="aic-steps">
    ${steps.map(([n,icon,label])=>`
    <div id="aiStep${n}" class="aic-step${n==='1'?' active':''}">
      <div class="aic-step-icon">${icon}</div>
      <div class="aic-step-num">第${n}步</div>
      <div class="aic-step-label">${label}</div>
    </div>`).join('')}
  </div>
  <div id="aiCreateBody"></div>
</div>`;
  AICreate.step = 1;
  renderAICreateStep();
}

function renderAICreateStep() {
  // 更新步骤高亮
  for(let i=1;i<=4;i++){
    const el=document.getElementById('aiStep'+i);
    if(!el) continue;
    el.className = 'aic-step';
    if(i===AICreate.step) el.classList.add('active');
    else if(i<AICreate.step) el.classList.add('done');
  }
  const body = document.getElementById('aiCreateBody');
  if(!body) return;
  switch(AICreate.step){
    case 1: renderStep1(body); break;
    case 2: renderStep2(body); break;
    case 3: renderStep3(body); break;
    case 4: renderStep4(body); break;
  }
}

// 第1步：输入灵感
function renderStep1(el) {
  el.innerHTML = `
<div class="aic-card fade-in">
  <div class="aic-card-header">
    <div class="aic-card-title">
      <span class="aic-card-title-icon">💡</span>
      输入你的小说灵感
    </div>
    <div class="aic-card-subtitle">描述你的故事创意，越详细 AI 创作的效果越好</div>
  </div>
  <textarea id="aiIdeaInput" class="aic-idea-textarea"
    placeholder="例如：一个普通外卖小哥意外获得了时间暂停的能力，从此走上了一条不凡的道路。故事发生在近未来都市，主角性格乐观幽默，会遇到各种奇特任务...">${AICreate.idea}</textarea>
  
  <div class="aic-config-row">
    <div class="aic-config-item">
      <div class="aic-config-label">📚 卷数（篇）</div>
      <select id="aiVolCount" class="aic-select">
        <option value="1" ${AICreate.volCount===1?'selected':''}>1 卷（适合短篇）</option>
        <option value="2" ${AICreate.volCount===2?'selected':''}>2 卷</option>
        <option value="3" ${AICreate.volCount===3?'selected':''}>3 卷（适合中篇）</option>
        <option value="5" ${AICreate.volCount===5?'selected':''}>5 卷（适合长篇）</option>
        <option value="10" ${AICreate.volCount===10?'selected':''}>10 卷（超长篇）</option>
      </select>
    </div>
    <div class="aic-config-item">
      <div class="aic-config-label">📑 每卷章节数</div>
      <select id="aiChapterPerVol" class="aic-select">
        <option value="5" ${AICreate.chapterPerVol===5?'selected':''}>5 章</option>
        <option value="10" ${AICreate.chapterPerVol===10?'selected':''}>10 章</option>
        <option value="15" ${AICreate.chapterPerVol===15?'selected':''}>15 章</option>
        <option value="20" ${AICreate.chapterPerVol===20?'selected':''}>20 章</option>
      </select>
    </div>
  </div>
  
  <div class="aic-total-hint">
    共 <b id="aiTotalNum">${AICreate.volCount * AICreate.chapterPerVol}</b> 章
  </div>

  <button class="aic-next-btn" onclick="goStep2()">
    下一步：AI 生成大纲 →
  </button>
</div>`;

  // 动态更新总章节数
  ['aiVolCount','aiChapterPerVol'].forEach(id=>{
    document.getElementById(id)?.addEventListener('change', ()=>{
      const v = parseInt(document.getElementById('aiVolCount').value)||1;
      const c = parseInt(document.getElementById('aiChapterPerVol').value)||10;
      const el = document.getElementById('aiTotalNum');
      if(el) el.textContent = v*c;
    });
  });
}

async function goStep2() {
  const idea = document.getElementById('aiIdeaInput')?.value?.trim();
  if(!idea){ toast('请输入小说灵感', 'warning'); return; }
  AICreate.idea = idea;
  AICreate.volCount = parseInt(document.getElementById('aiVolCount')?.value)||1;
  AICreate.chapterPerVol = parseInt(document.getElementById('aiChapterPerVol')?.value)||10;
  AICreate.step = 2;
  renderAICreateStep();
  await generateOutline();
}

// 第2步：大纲生成
function renderStep2(el) {
  el.innerHTML = `
<div class="aic-card fade-in">
  <div class="aic-card-header">
    <div class="aic-card-title">
      <span class="aic-card-title-icon">📋</span>
      AI 生成大纲
    </div>
    <div class="aic-card-subtitle">${AICreate.volCount} 卷 · 每卷 ${AICreate.chapterPerVol} 章 · 共 ${AICreate.volCount * AICreate.chapterPerVol} 章</div>
  </div>
  <div id="outlineResult">
    <div class="aic-loading">
      <div class="aic-loading-spinner"></div>
      <div class="aic-loading-text">AI 正在构思大纲<span class="aic-loading-dots"></span></div>
    </div>
  </div>
  <div id="outlineActions" style="display:none" class="aic-actions">
    <button class="aic-btn-regen" onclick="generateOutline()">🔄 重新生成</button>
    <button class="aic-next-btn" style="flex:1;margin-top:0" onclick="goStep3()">下一步：生成细纲 →</button>
  </div>
</div>`;
}

async function generateOutline() {
  const body = document.getElementById('aiCreateBody');
  if(!body) return;
  renderStep2(body);

  const prompt = `请根据以下灵感，为小说创作一个完整大纲。

灵感：${AICreate.idea}

要求：
- 共 ${AICreate.volCount} 卷，每卷 ${AICreate.chapterPerVol} 章
- 输出严格的 JSON 格式，不要有多余文字

JSON格式如下：
{
  "title": "小说名称",
  "genre": "类型（如：都市、玄幻、言情等）",
  "desc": "一句话简介（30字内）",
  "volumes": [
    {
      "title": "卷名",
      "summary": "本卷剧情简介（50字内）",
      "chapters": [
        { "title": "章节名", "summary": "本章剧情概要（30字内）" }
      ]
    }
  ]
}`;

  try {
    const result = await callAI([{role:'user',content:prompt}], 3000, 0.8);
    // 提取JSON
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if(!jsonMatch) throw new Error('返回格式错误，请重试');
    const outline = JSON.parse(jsonMatch[0]);
    AICreate.outline = outline;
    
    // 显示大纲
    const resultEl = document.getElementById('outlineResult');
    if(resultEl) {
      resultEl.innerHTML = renderOutlinePreview(outline);
    }
    const actionsEl = document.getElementById('outlineActions');
    if(actionsEl) actionsEl.style.display='flex';
  } catch(e) {
    const resultEl = document.getElementById('outlineResult');
    if(resultEl) resultEl.innerHTML = `
      <div class="aic-error">
        <div class="aic-error-icon">❌</div>
        <div class="aic-error-msg">${e.message}</div>
        <button class="btn btn-secondary" style="margin-top:4px" onclick="generateOutline()">重试</button>
      </div>`;
  }
}

function renderOutlinePreview(outline) {
  return `
<div class="aic-outline-box fade-in">
  <div class="aic-outline-header">
    <div class="aic-outline-title">${outline.title||'未命名'}</div>
    <div>
      <span class="aic-outline-genre">${outline.genre||'未分类'}</span>
    </div>
    <div class="aic-outline-desc">${outline.desc||''}</div>
  </div>
  <div class="aic-outline-body">
    ${(outline.volumes||[]).map((vol,vi)=>`
    <div class="aic-vol-block">
      <div class="aic-vol-title">📚 ${vol.title}</div>
      <div class="aic-vol-summary">${vol.summary||''}</div>
      <div class="aic-ch-list">
        ${(vol.chapters||[]).map((ch,ci)=>`
        <div class="aic-ch-item">
          <span class="aic-ch-num">第${ci+1}章</span>
          <span class="aic-ch-title">${ch.title}</span>
          <span class="aic-ch-summary">${ch.summary||''}</span>
        </div>`).join('')}
      </div>
    </div>`).join('')}
  </div>
</div>`;
}

async function goStep3() {
  if(!AICreate.outline){ toast('请先生成大纲', 'warning'); return; }
  AICreate.step = 3;
  renderAICreateStep();
  await generateDetailOutline();
}

// 第3步：细纲生成
function renderStep3(el) {
  const total = (AICreate.outline?.volumes||[]).reduce((s,v)=>s+(v.chapters?.length||0), 0);
  el.innerHTML = `
<div class="aic-card fade-in">
  <div class="aic-card-header">
    <div class="aic-card-title">
      <span class="aic-card-title-icon">📝</span>
      AI 生成章节细纲
    </div>
    <div class="aic-card-subtitle">为每章生成详细写作指引，防止情节跑偏，共 ${total} 章</div>
  </div>
  <div id="detailOutlineResult">
    <div class="aic-loading">
      <div class="aic-loading-spinner"></div>
      <div class="aic-loading-text">AI 正在规划每章细节<span class="aic-loading-dots"></span></div>
    </div>
  </div>
  <div id="detailOutlineActions" style="display:none" class="aic-actions">
    <button class="aic-btn-regen" onclick="generateDetailOutline()">🔄 重新生成</button>
    <button class="aic-next-btn" style="flex:1;margin-top:0" onclick="goStep4()">下一步：生成章节内容 →</button>
  </div>
</div>`;
}

async function generateDetailOutline() {
  const body = document.getElementById('aiCreateBody');
  if(!body) return;
  renderStep3(body);

  const chapterList = [];
  (AICreate.outline?.volumes||[]).forEach((vol,vi)=>{
    (vol.chapters||[]).forEach((ch,ci)=>{
      chapterList.push(`第${vi+1}卷第${ci+1}章《${ch.title}》：${ch.summary}`);
    });
  });

  const prompt = `你是一位专业小说编辑，请为以下小说的每个章节生成详细细纲。

小说信息：
- 名称：${AICreate.outline.title}
- 类型：${AICreate.outline.genre}
- 简介：${AICreate.outline.desc}

章节列表：
${chapterList.join('\n')}

要求：
- 为每章输出详细细纲，包含：场景设定、主要事件（3-5个关键情节点）、人物行动、章节结尾钩子
- 输出严格JSON格式

JSON格式：
{
  "chapters": [
    {
      "volIndex": 0,
      "chIndex": 0,
      "detail": "详细细纲（200字内）"
    }
  ]
}`;

  try {
    const result = await callAI([{role:'user',content:prompt}], 4000, 0.7);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if(!jsonMatch) throw new Error('返回格式错误，请重试');
    const parsed = JSON.parse(jsonMatch[0]);
    
    // 将细纲合并到大纲
    AICreate.detailOutline = JSON.parse(JSON.stringify(AICreate.outline));
    (parsed.chapters||[]).forEach(item=>{
      const vol = AICreate.detailOutline.volumes[item.volIndex];
      if(vol && vol.chapters[item.chIndex]){
        vol.chapters[item.chIndex].detail = item.detail;
      }
    });

    const resultEl = document.getElementById('detailOutlineResult');
    if(resultEl) resultEl.innerHTML = renderDetailOutlinePreview(AICreate.detailOutline);
    const actionsEl = document.getElementById('detailOutlineActions');
    if(actionsEl) actionsEl.style.display='flex';
  } catch(e) {
    const resultEl = document.getElementById('detailOutlineResult');
    if(resultEl) resultEl.innerHTML = `
      <div class="aic-error">
        <div class="aic-error-icon">❌</div>
        <div class="aic-error-msg">${e.message}</div>
        <button class="btn btn-secondary" style="margin-top:4px" onclick="generateDetailOutline()">重试</button>
      </div>`;
  }
}

function renderDetailOutlinePreview(outline) {
  return `<div class="aic-detail-box fade-in">
  ${(outline.volumes||[]).map((vol,vi)=>`
    <div class="aic-detail-vol">📚 ${vol.title}</div>
    ${(vol.chapters||[]).map((ch,ci)=>`
      <div class="aic-detail-ch">
        <div class="aic-detail-ch-title">第${ci+1}章：${ch.title}</div>
        <div class="aic-detail-ch-text">${ch.detail||ch.summary||'（待生成）'}</div>
      </div>`).join('')}
  `).join('')}
</div>`;
}

async function goStep4() {
  if(!AICreate.detailOutline){ toast('请先生成细纲', 'warning'); return; }
  
  // 创建小说
  const novel = {
    id: genId(),
    title: AICreate.detailOutline.title || '新小说',
    type: 'long',
    genre: AICreate.detailOutline.genre || '',
    desc: AICreate.detailOutline.desc || '',
    wordTarget: 200000,
    icon: '🤖',
    coverClass: 'cover-scifi',
    created: Date.now(),
    updated: Date.now(),
    status: 'writing'
  };
  const novels = DB.getNovels();
  novels.unshift(novel);
  DB.setNovels(novels);
  AICreate.novelId = novel.id;
  AICreate.step = 4;
  renderAICreateStep();
}

// 第4步：逐章生成内容
function renderStep4(el) {
  const outline = AICreate.detailOutline;
  const allChapters = [];
  (outline?.volumes||[]).forEach((vol,vi)=>{
    (vol.chapters||[]).forEach((ch,ci)=>{
      allChapters.push({volIndex:vi, chIndex:ci, volTitle:vol.title, title:ch.title, summary:ch.summary, detail:ch.detail||ch.summary});
    });
  });
  
  el.innerHTML = `
<div class="aic-card fade-in">
  <div class="aic-gen-header">
    <div>
      <div class="aic-gen-title"><span>✍️</span> 逐章生成内容</div>
      <div class="aic-gen-subtitle">可单章生成，或点击「全部生成」一键完成</div>
    </div>
    <div class="aic-gen-btns">
      <button class="btn btn-secondary btn-sm" onclick="navigate('write',{novelId:'${AICreate.novelId}'})">📖 去写作页</button>
      <button class="btn btn-primary btn-sm" id="genAllBtn" onclick="generateAllChapters()">⚡ 全部生成</button>
    </div>
  </div>
  
  <div id="chaptersGenList" class="aic-ch-gen-list">
    ${allChapters.map((ch,idx)=>`
    <div id="chGen_${idx}" class="aic-ch-gen-item">
      <div class="aic-ch-gen-info">
        <div class="aic-ch-gen-name">${ch.volTitle} · 第${ch.chIndex+1}章：${ch.title}</div>
        <div class="aic-ch-gen-summary">${ch.summary||''}</div>
      </div>
      <div id="chStatus_${idx}" class="aic-ch-gen-status">⬜</div>
      <button id="chBtn_${idx}" class="aic-ch-gen-btn" onclick="generateOneChapter(${idx})">生成</button>
    </div>`).join('')}
  </div>
  
  <div id="genProgress" class="aic-progress-box">
    <div id="genProgressText" class="aic-progress-text">准备中...</div>
    <div class="aic-progress-track">
      <div id="genProgressBar" class="aic-progress-fill"></div>
    </div>
  </div>
</div>`;

  // 存储章节列表到全局
  AICreate.allChapters = allChapters;
}

async function generateOneChapter(idx) {
  const ch = AICreate.allChapters[idx];
  if(!ch) return;
  
  const btn = document.getElementById('chBtn_'+idx);
  const statusEl = document.getElementById('chStatus_'+idx);
  const itemEl = document.getElementById('chGen_'+idx);
  if(btn) { btn.disabled=true; btn.textContent='生成中...'; }
  if(statusEl) { statusEl.textContent='⏳'; }
  if(itemEl) { itemEl.className='aic-ch-gen-item running'; }

  try {
    const settings = DB.getSettings();
    const wordsPerChapter = settings.aiMaxTokens || 1000;
    
    const prompt = `请根据以下信息，创作小说《${AICreate.detailOutline.title}》的一个章节。

章节信息：
- 所在卷：${ch.volTitle}
- 章节标题：${ch.title}
- 章节概要：${ch.summary}
- 详细细纲：${ch.detail}

要求：
- 字数约 ${wordsPerChapter} 字
- 文笔流畅，情节生动，符合${AICreate.detailOutline.genre}风格
- 用正文格式输出，不要有多余的说明文字
- 结尾设置悬念或钩子，吸引读者继续阅读`;

    const content = await callAI([{role:'user',content:prompt}], wordsPerChapter+200, 0.8);
    
    // 保存章节
    const chapters = DB.getChapters(AICreate.novelId);
    const existing = chapters.find(c=>c.title===ch.title);
    if(existing){
      existing.content = content;
      existing.words = content.length;
    } else {
      chapters.push({
        id: genId(),
        novelId: AICreate.novelId,
        title: ch.title,
        content: content,
        order: chapters.length + 1,
        words: content.length
      });
    }
    DB.setChapters(AICreate.novelId, chapters);
    
    if(btn) { btn.textContent='✅ 已生成'; btn.className='aic-ch-gen-btn done-btn'; }
    if(statusEl) { statusEl.textContent='✅'; }
    if(itemEl) itemEl.className='aic-ch-gen-item done';
  } catch(e) {
    if(btn) { btn.disabled=false; btn.textContent='重试'; btn.className='aic-ch-gen-btn'; }
    if(statusEl) { statusEl.textContent='❌'; }
    if(itemEl) itemEl.className='aic-ch-gen-item failed';
    toast('生成失败：'+e.message, 'error');
  }
}

async function generateAllChapters() {
  const allBtn = document.getElementById('genAllBtn');
  const progress = document.getElementById('genProgress');
  const progressText = document.getElementById('genProgressText');
  const progressBar = document.getElementById('genProgressBar');
  
  if(allBtn) { allBtn.disabled=true; allBtn.textContent='⏳ 生成中...'; }
  if(progress) progress.style.display='block';
  
  const total = AICreate.allChapters.length;
  for(let i=0; i<total; i++){
    if(progressText) progressText.textContent = `正在生成第 ${i+1}/${total} 章：${AICreate.allChapters[i].title}`;
    if(progressBar) progressBar.style.width = Math.round((i/total)*100)+'%';
    await generateOneChapter(i);
    // 每章之间稍作等待，避免API限流
    if(i < total-1) await new Promise(r=>setTimeout(r,500));
  }
  
  if(progressText) progressText.textContent = `✅ 全部 ${total} 章生成完成！`;
  if(progressBar) progressBar.style.width='100%';
  if(allBtn) { allBtn.textContent='✅ 完成'; }
  
  toast(`🎉 ${AICreate.detailOutline.title} 创作完成！共 ${total} 章`, 'success');
}
