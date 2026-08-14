// SVG icon set as small string templates
window.TVIcons = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z"/><circle cx="12" cy="9" r="2.5"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.4 7.1.7-5.3 4.7 1.6 7-6.3-3.7L5.7 21.3l1.6-7L2 9.6l7.1-.7L12 2.5z"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9z"/><path d="M14 7v10" stroke-dasharray="2 2"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/></svg>',
  film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 16h18M8 4v16M16 4v16"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-4.5-9.5-9.5C.8 7.6 3.7 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 3.3 0 6.2 3.6 4.5 7.5C19 16.5 12 21 12 21z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 4v12m0 0 4-4m-4 4-4-4"/><path d="M4 20h16"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8 11 8-4M8 13l8 4"/></svg>',
  filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 5h18M6 12h12M10 19h4"/></svg>',
  sort: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>',
  arrowL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5m5 5-5-5 5-5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 14 9l7 2-7 2-2 7-2-7-7-2 7-2 2-7Z"/></svg>',
  dot: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"/></svg>',
};

window.TVTheme = {
  init() {
    const saved = localStorage.getItem('tv-theme') || 'dark';
    document.documentElement.dataset.theme = saved;
  },
  toggle(t) {
    document.documentElement.dataset.theme = t;
    localStorage.setItem('tv-theme', t);
    document.querySelectorAll('[data-theme-btn]').forEach(b => {
      b.classList.toggle('on', b.dataset.themeBtn === t);
    });
  }
};

window.TVNav = function(active) {
  const I = window.TVIcons;
  return `
  <nav class="tv-nav">
    <div class="tv-nav-inner">
      <a href="index.html" class="tv-logo"><span class="tv-logo-dot"></span>TicketVerse</a>
      <div class="tv-loc">${I.pin}<span>Mumbai</span>${I.chevron}</div>
      <label class="tv-nav-search">
        ${I.search}
        <input placeholder="Search movies, events, sports, plays" />
        <span class="dim" style="font-size:11px;font-family:var(--f-mono)">⌘K</span>
      </label>
      <div class="tv-nav-links">
        <a href="home.html" class="${active==='home'?'active':''}">Home</a>
        <a href="movies.html" class="${active==='movies'?'active':''}">Movies</a>
        <a href="#" class="${active==='events'?'active':''}">Events</a>
        <a href="#" class="${active==='sports'?'active':''}">Sports</a>
        <a href="admin.html" class="${active==='admin'?'active':''}">Admin</a>
      </div>
      <div class="theme-switch only-desktop">
        <button data-theme-btn="dark" onclick="TVTheme.toggle('dark')">Dark</button>
        <button data-theme-btn="light" onclick="TVTheme.toggle('light')">Light</button>
      </div>
      <a href="profile.html" class="tv-avatar" title="Profile">AR</a>
    </div>
  </nav>`;
};

window.TVBottomNav = function(active) {
  const I = window.TVIcons;
  const item = (key, label, icon, href) =>
    `<a href="${href}"><li class="${active===key?'active':''}">${icon}<span>${label}</span></li></a>`;
  return `<nav class="tv-bottom-nav">
    <ul>
      ${item('home','Home',I.home,'home.html')}
      ${item('movies','Movies',I.film,'movies.html')}
      ${item('tickets','Tickets',I.ticket,'profile.html')}
      ${item('saved','Saved',I.heart,'#')}
      ${item('me','Me',I.user,'profile.html')}
    </ul>
  </nav>`;
};

window.TVFooter = function() {
  return `
  <footer class="tv-footer">
    <div class="container">
      <div class="tv-footer-cols">
        <div>
          <a href="index.html" class="tv-logo" style="margin-bottom:14px"><span class="tv-logo-dot"></span>TicketVerse</a>
          <p class="muted" style="max-width:340px;font-size:14px">A premium ticketing platform for movies, live events, and sports — built for the night out you'll actually remember.</p>
          <div class="row" style="margin-top:18px">
            <a class="chip" href="#">iOS</a>
            <a class="chip" href="#">Android</a>
            <a class="chip" href="#">For Business</a>
          </div>
        </div>
        <div><h4>Movies</h4><ul><li><a>Now Showing</a></li><li><a>Coming Soon</a></li><li><a>IMAX</a></li><li><a>Dolby Atmos</a></li></ul></div>
        <div><h4>Events</h4><ul><li><a>Comedy</a></li><li><a>Concerts</a></li><li><a>Workshops</a></li><li><a>Theatre</a></li></ul></div>
        <div><h4>Sports</h4><ul><li><a>IPL 2026</a></li><li><a>Football</a></li><li><a>Kabaddi</a></li><li><a>Tennis</a></li></ul></div>
        <div><h4>Company</h4><ul><li><a>About</a></li><li><a>Careers</a></li><li><a>Press</a></li><li><a>Contact</a></li></ul></div>
      </div>
      <div class="tv-footer-bottom">
        <span>© 2026 TicketVerse · Crafted for cinephiles</span>
        <span>Privacy · Terms · Cookies</span>
      </div>
    </div>
  </footer>`;
};
