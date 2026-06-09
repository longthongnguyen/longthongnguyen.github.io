// ── i18n ──────────────────────────────────────────────────────────────────
var LANG = {
  vi: {
    browse: 'Duyệt',
    heroTitle: 'Fshare Folder Explorer',
    heroSub: 'Duyệt và lấy liên kết thư mục Fshare trực quan.',
    heroHint: 'Hoặc truy cập trực tiếp: <code>https://fshare.annnekkk.com/LINKCODE</code>',
    navPlaceholder: 'Nhập URL thư mục Fshare hoặc link code...',
    home: 'Trang chủ',
    sortLabel: 'Sắp xếp:',
    sortOpts: ['Loại + Tên', 'Tên A-Z', 'Tên Z-A', 'Kích thước (lớn trước)', 'Kích thước (nhỏ trước)'],
    thName: 'Tên mục', thSize: 'Kích thước', thDate: 'Ngày cập nhật', thAction: 'Hành động',
    folder: 'Folder', folderRow: 'Thư mục',
    copyLink: 'Copy link', copied: 'Đã copy!',
    loading: 'Đang tải...',
    empty: 'Thư mục trống.',
    statsText: function(f,fi,s){ return f+' thư mục, '+fi+' tệp'+(s?' — '+s:''); },
    pgInfo: function(p,t){ return 'Trang '+p+' / '+t; },
    pgPrev: '← Trước', pgNext: 'Tiếp →',
    errInvalid: 'URL hoặc link code không hợp lệ.',
    errConn: 'Lỗi kết nối: ',
    errApi: 'Lỗi ',
    fsharePrefix: 'Fshare://',
    themeDark: '☀️ Sáng', themeLight: '🌙 Tối',
    langBtn: '🇬🇧 EN',
  },
  en: {
    browse: 'Browse',
    heroTitle: 'Fshare Folder Explorer',
    heroSub: 'Browse and get Fshare folder links visually.',
    heroHint: 'Or access directly: <code>https://fshare.annnekkk.com/LINKCODE</code>',
    navPlaceholder: 'Enter Fshare folder URL or link code...',
    home: 'Home',
    sortLabel: 'Sort:',
    sortOpts: ['Type + Name', 'Name A-Z', 'Name Z-A', 'Size (largest first)', 'Size (smallest first)'],
    thName: 'Name', thSize: 'Size', thDate: 'Last Modified', thAction: 'Action',
    folder: 'Folder', folderRow: 'Folder',
    copyLink: 'Copy link', copied: 'Copied!',
    loading: 'Loading...',
    empty: 'This folder is empty.',
    statsText: function(f,fi,s){ return f+' folder'+(f!==1?'s':'')+', '+fi+' file'+(fi!==1?'s':'')+(s?' — '+s:''); },
    pgInfo: function(p,t){ return 'Page '+p+' of '+t; },
    pgPrev: '← Prev', pgNext: 'Next →',
    errInvalid: 'Invalid URL or link code.',
    errConn: 'Connection error: ',
    errApi: 'Error ',
    fsharePrefix: 'Fshare://',
    themeDark: '☀️ Light', themeLight: '🌙 Dark',
    langBtn: '🇻🇳 VI',
  }
};

var currentLang = localStorage.getItem('lang') || 'vi';
var currentTheme = localStorage.getItem('theme') || 'dark';
var navStack = [];
var currentPage = 1;
var totalPages = 1;
var PAGE_SIZE = 50;

function t() { return LANG[currentLang]; }

// ── Theme ─────────────────────────────────────────────────────────────────
function applyTheme() {
  if (currentTheme === 'light') {
    document.body.classList.add('light');
  } else {
    document.body.classList.remove('light');
  }
  var btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = currentTheme === 'dark' ? t().themeDark : t().themeLight;
}
function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', currentTheme);
  applyTheme();
}

// ── Language ──────────────────────────────────────────────────────────────
function applyLang() {
  var s = t();
  var el;
  el = document.getElementById('navBtn');      if (el) el.textContent = s.browse;
  el = document.getElementById('navInput');    if (el) el.placeholder = s.navPlaceholder;
  el = document.getElementById('heroBtn');     if (el) el.textContent = s.browse;
  el = document.getElementById('heroTitle');   if (el) el.textContent = s.heroTitle;
  el = document.getElementById('heroSub');     if (el) el.textContent = s.heroSub;
  el = document.getElementById('heroHint');    if (el) el.innerHTML = s.heroHint;
  el = document.getElementById('sortLabel');   if (el) el.textContent = s.sortLabel;
  el = document.getElementById('thName');      if (el) el.textContent = s.thName;
  el = document.getElementById('thSize');      if (el) el.textContent = s.thSize;
  el = document.getElementById('thDate');      if (el) el.textContent = s.thDate;
  el = document.getElementById('thAction');    if (el) el.textContent = s.thAction;
  el = document.getElementById('langBtn');     if (el) el.textContent = s.langBtn;

  // Disable onchange while updating option text to prevent spurious reloads
  var sel = document.getElementById('sortSelect');
  var opts = ['sortOpt1','sortOpt2','sortOpt3','sortOpt4','sortOpt5'];
  if (sel) sel.onchange = null;
  for (var i = 0; i < opts.length; i++) {
    el = document.getElementById(opts[i]);
    if (el) el.textContent = s.sortOpts[i];
  }
  if (sel) sel.onchange = reloadCurrentFolder;

  applyTheme();
  renderBreadcrumb();
}
function toggleLang() {
  currentLang = currentLang === 'vi' ? 'en' : 'vi';
  localStorage.setItem('lang', currentLang);
  applyLang();
}

// ── URL parsing ───────────────────────────────────────────────────────────
function extractLinkcode(s) {
  s = (s || '').trim();
  var m = s.match(/fshare\.vn\/folder\/([A-Za-z0-9]{4,})/i);
  if (m) return m[1];
  m = s.match(/fshare\.vn(?:%2F)+folder(?:%2F)+([A-Za-z0-9]{4,})/i);
  if (m) return m[1];
  if (/^[A-Za-z0-9]{4,}$/.test(s)) return s;
  return null;
}

function goFromHero() {
  var lc = extractLinkcode(document.getElementById('heroInput').value);
  if (!lc) { document.getElementById('homeError').textContent = t().errInvalid; return; }
  history.pushState({}, '', '/' + lc);
  startFolder(lc);
}
function goFromNav() {
  var lc = extractLinkcode(document.getElementById('navInput').value);
  if (!lc) return;
  history.pushState({}, '', '/' + lc);
  startFolder(lc);
}
function startFolder(lc) {
  navStack = [{linkcode: lc, name: lc}];
  currentPage = 1;
  showFolderView();
  loadFolder(lc);
}

window.addEventListener('popstate', function() {
  var lc = location.pathname.replace(/^\//, '').split('?')[0];
  if (lc) startFolder(lc); else showHome();
});

function showHome() {
  document.getElementById('homeView').style.display = 'block';
  document.getElementById('folderView').style.display = 'none';
  document.title = 'Fshare Browser';
}
function showFolderView() {
  document.getElementById('homeView').style.display = 'none';
  document.getElementById('folderView').style.display = 'block';
}

// ── Load ──────────────────────────────────────────────────────────────────
function loadFolder(linkcode, page) {
  if (page) currentPage = page;
  var sort = document.getElementById('sortSelect').value;
  setLoading(true);
  renderBreadcrumb();
  fetch('/api/folder?linkcode=' + encodeURIComponent(linkcode) + '&sort=' + encodeURIComponent(sort) + '&page=' + currentPage)
    .then(function(res) {
      return res.json().then(function(data) { return {ok: res.ok, status: res.status, data: data}; });
    })
    .then(function(r) {
      if (!r.ok) { setError(t().errApi + r.status + ': ' + (r.data.message || r.data.error || 'Unknown')); return; }
      renderFolder(r.data, linkcode);
    })
    .catch(function(e) { setError(t().errConn + e.message); })
    .finally(function() { setLoading(false); });
}

function reloadCurrentFolder() {
  if (navStack.length) { currentPage = 1; loadFolder(navStack[navStack.length - 1].linkcode); }
}

// ── Render ────────────────────────────────────────────────────────────────
function renderFolder(data, linkcode) {
  var current = (data && data.current) ? data.current : {};
  var items   = (data && Array.isArray(data.items)) ? data.items : [];
  var links   = (data && data._links) ? data._links : {};

  // Derive total pages from _links.last URL
  var lastUrl = links.last || '';
  var mLast = lastUrl.match(/[?&]page=(\d+)/);
  totalPages = mLast ? parseInt(mLast[1], 10) : (items.length < PAGE_SIZE ? currentPage : currentPage + 1);

  var entry = navStack[navStack.length - 1];
  var fname = current.name || data.name || entry.name;
  entry.name = fname;

  if (navStack.length === 1) {
    var fpath = current.path || data.path || '';
    document.getElementById('folderHeader').innerHTML =
      '<div class="folder-title"><svg width="22" height="22" viewBox="0 0 24 24" fill="#f5a623" style="flex-shrink:0"><path d="M10 4H2v16h20V6H12l-2-2z"/></svg>' + esc(fname) + '</div>' +
      (fpath ? '<div class="folder-path">' + esc(t().fsharePrefix) + ' <span>' + esc(fpath) + '</span></div>' : '');
    document.title = fname + ' — Fshare Browser';
  }
  renderBreadcrumb();

  var nFolders = 0, nFiles = 0, totalBytes = 0;
  for (var i = 0; i < items.length; i++) {
    if (isFolder(items[i])) nFolders++;
    else { nFiles++; totalBytes += items[i].size || 0; }
  }
  document.getElementById('statsBar').textContent =
    t().statsText(nFolders, nFiles, totalBytes ? fmtSize(totalBytes) : '');

  var tbody = document.getElementById('fileList');
  tbody.innerHTML = '';
  if (!items.length) {
    var empty = document.createElement('tr');
    empty.className = 'center-row';
    empty.innerHTML = '<td colspan="4">' + t().empty + '</td>';
    tbody.appendChild(empty);
    renderPagination(linkcode);
    return;
  }
  for (var j = 0; j < items.length; j++) {
    tbody.appendChild(makeRow(items[j]));
  }
  renderPagination(linkcode);
  // scroll to top of table on page change
  var tw = document.querySelector('.table-wrap');
  if (tw && currentPage > 1) tw.scrollIntoView({behavior: 'smooth', block: 'start'});
}

function isFolder(item) {
  if (item.type === 0 || item.type === '0') return true;
  if (item.mimetype === 'folder') return true;
  if (item.ftype === 'folder') return true;
  return false;
}

function makeRow(item) {
  var folder  = isFolder(item);
  var lc      = item.linkcode || item.code || '';
  var name    = item.name || item.filename || '(no name)';
  var size    = item.size || 0;
  var updated = item.modified || item.updated || item.created || '';

  var tr = document.createElement('tr');

  var nameTd = document.createElement('td');
  var cell = document.createElement('div');
  cell.className = 'name-cell';

  // icon bubble
  var iconWrap = document.createElement('div');
  iconWrap.className = 'file-icon-wrap ' + (folder ? 'is-folder' : 'is-file');
  iconWrap.innerHTML = folder
    ? '<svg class="file-icon" viewBox="0 0 24 24" fill="#f5a623"><path d="M10 4H2v16h20V6H12l-2-2z"/></svg>'
    : '<svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="#4a9eff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
  cell.appendChild(iconWrap);

  var nameEl = folder ? document.createElement('span') : document.createElement('a');
  nameEl.className = 'item-name' + (folder ? ' item-folder' : ' item-file-link');
  nameEl.textContent = name;
  if (!folder) {
    nameEl.href = 'https://www.fshare.vn/file/' + lc;
    nameEl.target = '_blank';
    nameEl.rel = 'noopener noreferrer';
  }
  cell.appendChild(nameEl);
  nameTd.appendChild(cell);

  var sizeTd = document.createElement('td');
  sizeTd.className = 'size-cell';
  sizeTd.textContent = folder ? t().folderRow : fmtSize(size);

  var dateTd = document.createElement('td');
  dateTd.className = 'date-cell';
  dateTd.textContent = fmtDate(updated);

  var actionTd = document.createElement('td');
  var btnWrap = document.createElement('div');
  btnWrap.className = 'copy-btn-wrap';
  var badge = document.createElement('span');
  badge.className = 'badge ' + (folder ? 'badge-folder' : 'badge-copy');
  badge.textContent = folder ? t().folder : t().copyLink;

  if (folder) {
    (function(_lc, _name) {
      nameEl.addEventListener('click', function() { drillInto(_lc, _name); });
      badge.addEventListener('click',  function() { drillInto(_lc, _name); });
    })(lc, name);
  } else {
    var shareUrl = 'https://www.fshare.vn/file/' + lc;
    (function(_url) {
      badge.addEventListener('click', function(e) { doCopy(_url, e.currentTarget); });
    })(shareUrl);
  }

  btnWrap.appendChild(badge);
  actionTd.appendChild(btnWrap);
  tr.appendChild(nameTd);
  tr.appendChild(sizeTd);
  tr.appendChild(dateTd);
  tr.appendChild(actionTd);
  return tr;
}

// ── Navigation ────────────────────────────────────────────────────────────
function drillInto(lc, name) {
  navStack.push({linkcode: lc, name: name});
  currentPage = 1;
  loadFolder(lc);
}
function navTo(idx) {
  navStack = navStack.slice(0, idx + 1);
  currentPage = 1;
  loadFolder(navStack[navStack.length - 1].linkcode);
}

function renderPagination(linkcode) {
  var top  = document.getElementById('paginationTop');
  var bot  = document.getElementById('paginationBot');
  var info = document.getElementById('pgInfo');

  if (totalPages <= 1) {
    if (top)  top.innerHTML  = '';
    if (bot)  bot.innerHTML  = '';
    if (info) info.textContent = '';
    return;
  }

  if (info) info.textContent = t().pgInfo(currentPage, totalPages);

  var containers = [top, bot];
  for (var c = 0; c < containers.length; c++) {
    var wrap = containers[c];
    if (!wrap) continue;
    wrap.innerHTML = '';

    // Build and append buttons directly so event listeners work reliably
    var p = currentPage, tot = totalPages;

    // Prev
    var prev = document.createElement('button');
    prev.className = 'pg-btn pg-prev';
    prev.textContent = t().pgPrev;
    if (p > 1) {
      (function(_pg){ prev.addEventListener('click', function(){ loadFolder(linkcode, _pg); }); })(p - 1);
    } else {
      prev.disabled = true;
    }
    wrap.appendChild(prev);

    // Page numbers with ellipsis
    var pages = buildPageList(p, tot);
    for (var k = 0; k < pages.length; k++) {
      if (pages[k] === '...') {
        var ell = document.createElement('span');
        ell.className = 'pg-ellipsis';
        ell.textContent = '…';
        wrap.appendChild(ell);
      } else {
        var pg = pages[k];
        var btn = document.createElement('button');
        btn.className = 'pg-btn' + (pg === p ? ' active' : '');
        btn.textContent = pg;
        if (pg !== p) {
          (function(_pg){ btn.addEventListener('click', function(){ loadFolder(linkcode, _pg); }); })(pg);
        } else {
          btn.disabled = true;
        }
        wrap.appendChild(btn);
      }
    }

    // Next
    var next = document.createElement('button');
    next.className = 'pg-btn pg-next';
    next.textContent = t().pgNext;
    if (p < tot) {
      (function(_pg){ next.addEventListener('click', function(){ loadFolder(linkcode, _pg); }); })(p + 1);
    } else {
      next.disabled = true;
    }
    wrap.appendChild(next);
  }
}

function buildPageList(p, tot) {
  var pages = [];
  pages.push(1);
  if (p - 2 > 2) pages.push('...');
  for (var i = Math.max(2, p - 2); i <= Math.min(tot - 1, p + 2); i++) pages.push(i);
  if (p + 2 < tot - 1) pages.push('...');
  if (tot > 1) pages.push(tot);
  return pages;
}
function goHome() { history.pushState({}, '', '/'); showHome(); }

function renderBreadcrumb() {
  var bc = document.getElementById('breadcrumb');
  if (!bc) return;
  bc.innerHTML = '';
  var home = document.createElement('span');
  home.className = 'bc-home';
  home.textContent = '🏠 ' + t().home;
  home.addEventListener('click', goHome);
  bc.appendChild(home);
  for (var i = 0; i < navStack.length; i++) {
    var sep = document.createElement('span');
    sep.className = 'bc-sep';
    sep.textContent = '›';
    bc.appendChild(sep);
    var el = document.createElement('span');
    if (i === navStack.length - 1) {
      el.className = 'bc-current';
      el.textContent = navStack[i].name;
    } else {
      el.className = 'bc-item';
      el.textContent = navStack[i].name;
      (function(_i) { el.addEventListener('click', function() { navTo(_i); }); })(i);
    }
    bc.appendChild(el);
  }
}

// ── UI helpers ────────────────────────────────────────────────────────────
function setLoading(on) {
  var tbody = document.getElementById('fileList');
  if (on) tbody.innerHTML = '<tr class="center-row"><td colspan="4"><span class="spinner"></span> ' + t().loading + '</td></tr>';
  var btns = document.querySelectorAll('.btn');
  for (var i = 0; i < btns.length; i++) btns[i].disabled = on;
}
function setError(msg) {
  document.getElementById('fileList').innerHTML =
    '<tr class="center-row"><td colspan="4" style="color:var(--red)">' + esc(msg) + '</td></tr>';
}
function doCopy(url, el) {
  navigator.clipboard.writeText(url).then(function() {
    var orig = el.textContent;
    el.textContent = t().copied;
    el.classList.add('badge-ok');
    setTimeout(function() { el.textContent = orig; el.classList.remove('badge-ok'); }, 1600);
  }).catch(function() {});
}

// ── Formatters ────────────────────────────────────────────────────────────
function fmtSize(b) {
  if (!b) return '-';
  var u = ['B','KB','MB','GB','TB'], i = 0;
  while (b >= 1024 && i < 4) { b /= 1024; i++; }
  return b.toFixed(i ? 1 : 0) + ' ' + u[i];
}
function fmtDate(s) {
  if (!s) return '-';
  try {
    var n = Number(s);
    var d = (!isNaN(n) && n > 1e9) ? new Date(n * 1000) : new Date(s);
    if (isNaN(d.getTime())) return String(s);
    return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+' '+
           ('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2)+'/'+d.getFullYear();
  } catch(e) { return String(s); }
}
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Boot ──────────────────────────────────────────────────────────────────
(function init() {
  applyTheme();
  applyLang();
  var lc = location.pathname.replace(/^\//, '').split('?')[0];
  if (lc) startFolder(lc); else showHome();
  document.getElementById('heroInput').addEventListener('keydown', function(e) { if (e.key === 'Enter') goFromHero(); });
  document.getElementById('navInput').addEventListener('keydown',  function(e) { if (e.key === 'Enter') goFromNav();  });
})();
