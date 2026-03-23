// ══════════════════════════════════════════════════════════════
//  NihongoTamil — UI Enhancements v5.1
//  Onboarding modal, Hero banner upgrade, Tooltips, Journey CTA
//  Developed by NANTHAN 🇮🇳
// ══════════════════════════════════════════════════════════════

/* ── Onboarding Modal ─────────────────────────────────────── */
function buildOnboardingModal() {
  if (document.getElementById('onboardOv')) return;

  const steps = [
    {
      icon: 'あ',
      title: 'கனா கற்றல் (Kana)',
      desc: 'ஹிராகனா & கட்டகனா — ஜப்பானிய எழுத்துக்கள் முதலில் கற்கவும். கீழே "கனா" tab-ஐ tap செய்யவும்.'
    },
    {
      icon: '🎯',
      title: 'தேர்வு (Quiz)',
      desc: 'N5 வார்த்தைகள், கன்ஜி, இலக்கணம் எல்லாம் quiz மூலம் practice செய்யலாம்.'
    },
    {
      icon: '👆',
      title: 'Long-press Secret!',
      desc: 'எந்த ஜப்பானிய வார்த்தையையும் 700ms தொட்டுப் பிடிக்கவும் — அர்த்தம் உடனே தெரியும்!'
    }
  ];

  const html = `
  <div id="onboardOv">
    <div class="onboard-box">
      <div class="ob-banner">
        <span class="ob-kanji">語</span>
        <div class="ob-title">NihongoTamil</div>
        <div class="ob-sub">日本語 × தமிழ் · புதிய பயணம் தொடங்குகிறது!</div>
      </div>

      <div class="ob-steps">
        ${steps.map((s, i) => `
        <div class="ob-step">
          <div class="ob-step-num">${i + 1}</div>
          <div style="font-size:22px;flex-shrink:0;width:32px;text-align:center;font-family:var(--FJ);">${s.icon}</div>
          <div class="ob-step-body">
            <div class="ob-step-title">${s.title}</div>
            <div class="ob-step-desc">${s.desc}</div>
          </div>
        </div>`).join('')}
      </div>

      <div class="ob-footer">
        <div class="ob-dots">
          <div class="ob-dot on"></div>
          <div class="ob-dot"></div>
          <div class="ob-dot"></div>
        </div>
        <button class="btn btn-r btn-w" onclick="closeOnboarding(true)" style="font-size:14px;padding:13px;">
          🌸 N5 பயணம் தொடங்கு!
        </button>
        <div class="ob-skip" onclick="closeOnboarding(false)">
          இப்போது வேண்டாம் — நேரடியாக தொடங்கு
        </div>
      </div>
    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', html);
}

function openOnboarding() {
  buildOnboardingModal();
  const el = document.getElementById('onboardOv');
  if (el) el.classList.add('on');
}

function closeOnboarding(startJourney) {
  const el = document.getElementById('onboardOv');
  if (el) {
    el.style.opacity = '0';
    el.style.transition = 'opacity .3s';
    setTimeout(() => el.remove(), 300);
  }
  localStorage.setItem('nt5_onboard', '1');
  if (startJourney && typeof switchPage === 'function') {
    switchPage('kana');
  }
}

/* ── Hero Banner replacement ─────────────────────────────── */
function upgradeHeroBanner() {
  const orig = document.querySelector('.focus-hero');
  if (!orig) return;

  // Inject hero-banner class & richer structure while keeping inner content
  const focusFl   = orig.querySelector('.focus-fl');
  const focusJp   = orig.querySelector('#fh-jp');
  const focusTa   = orig.querySelector('#fh-ta');
  const btnRow    = orig.querySelector('div[style*="display:flex"]');

  if (!focusFl || !focusJp) return;

  orig.classList.add('hero-banner');
  orig.classList.remove('focus-hero');

  // Rebuild the inner CTA row with hero styling
  if (btnRow) {
    btnRow.classList.add('hero-cta-row');
    btnRow.removeAttribute('style');

    // Find original buttons
    const btnStart = btnRow.querySelector('#btn-start');
    const btnDict  = btnRow.querySelector('button:not(#btn-start)');

    if (btnDict) {
      btnDict.removeAttribute('style');
      btnDict.classList.add('btn-dict');
    }
  }

  // Add Mt. Fuji decorative bar
  const fujiBar = document.createElement('div');
  fujiBar.className = 'hero-fuji-bar';
  orig.appendChild(fujiBar);
}

/* ── Journey CTA (first-time users only) ─────────────────── */
function injectJourneyCTA() {
  if (S.learned.length > 0 || S.xp > 0) return; // Skip for returning users

  const homeContent = document.querySelector('#pg-home .pc');
  if (!homeContent) return;
  if (document.getElementById('journeyCta')) return;

  const cta = document.createElement('div');
  cta.id = 'journeyCta';
  cta.className = 'journey-cta show';
  cta.innerHTML = `
    <div class="jc-title">🌸 N5 Japanese பயணம்!</div>
    <div class="jc-sub">தமிழ் வழியில் ஜப்பானியம் கற்கத் தொடங்குங்கள்</div>
    <div class="jc-stats">
      <div class="jc-stat">506 வார்த்தைகள்</div>
      <div class="jc-stat">284 கன்ஜி</div>
      <div class="jc-stat">42 Grammar</div>
    </div>
    <button class="jc-btn" onclick="closeJourneyCta(); switchPage('quiz');">
      ▶ இப்போதே தொடங்கு!
    </button>
  `;

  // Insert after the hero banner (first child)
  homeContent.insertBefore(cta, homeContent.children[1]);
}

function closeJourneyCta() {
  const el = document.getElementById('journeyCta');
  if (el) { el.style.display = 'none'; }
}

/* ── Tooltip data-tip attribute helpers ──────────────────── */
function addTooltips() {
  const map = [
    ['#dictBtn',     '📖 அகராதி (506+ வார்த்தைகள்)'],
    ['#profBtn',     '👤 சுயவிவரம் & progress'],
    ['#settingsBtn', '⚙️ அமைப்புகள்'],
    ['.xpb',         '🪙 நீங்கள் சம்பாதித்த XP'],
    ['.wotd-audio',  '🔊 ஒலி கேளுங்கள்'],
  ];
  map.forEach(([sel, tip]) => {
    const el = document.querySelector(sel);
    if (el && !el.hasAttribute('data-tip')) el.setAttribute('data-tip', tip);
  });
}

/* ── Long-press discovery hint (shown once) ──────────────── */
function injectLongPressHint() {
  if (localStorage.getItem('nt5_lphint')) return;

  // Find a good place — before the WOTD section
  const wotd = document.querySelector('.wotd');
  if (!wotd) return;
  if (document.getElementById('lpHint')) return;

  const hint = document.createElement('div');
  hint.id = 'lpHint';
  hint.className = 'longpress-hint';
  hint.innerHTML = `
    <span class="lph-icon">👆</span>
    <div>
      <strong style="color:var(--fuji);font-family:var(--FT);">Pro tip:</strong>
      <span style="font-family:var(--FT)"> எந்த ஜப்பானிய வார்த்தையையும் </span>
      <strong style="font-family:var(--FT)">700ms</strong>
      <span style="font-family:var(--FT)"> தொட்டுப் பிடிக்கவும் — அர்த்தம் popup ஆகும்!</span>
    </div>
    <button onclick="dismissLpHint()" style="background:none;border:none;color:var(--tx3);font-size:14px;cursor:pointer;flex-shrink:0;padding:2px 6px;">✕</button>
  `;

  wotd.parentNode.insertBefore(hint, wotd);
  localStorage.setItem('nt5_lphint', '1');
}

function dismissLpHint() {
  const el = document.getElementById('lpHint');
  if (el) { el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(()=>el.remove(),300); }
}

/* ── "?" help button in header ───────────────────────────── */
function addHelpButton() {
  const hdrR = document.querySelector('.hdr-r');
  if (!hdrR || document.getElementById('hdrHelp')) return;

  const btn = document.createElement('div');
  btn.id = 'hdrHelp';
  btn.className = 'hdr-help';
  btn.textContent = '?';
  btn.title = 'Help';
  btn.setAttribute('data-tip', 'இந்த app-ஐ எப்படி பயன்படுத்துவது');
  btn.addEventListener('click', openOnboarding);

  // Insert before the first child of hdr-r
  hdrR.insertBefore(btn, hdrR.firstChild);
}

/* ── Anime section hint ──────────────────────────────────── */
function injectAnimeHint() {
  if (localStorage.getItem('nt5_animehint')) return;
  const learnTab = document.querySelector('.stab[data-s="anime"]');
  if (!learnTab) return;

  const tag = document.createElement('div');
  tag.className = 'anime-hint-tag';
  tag.innerHTML = `🎌 <span style="font-family:var(--FT);">Anime section-ல் real Japanese shows & tips இருக்கு!</span>`;
  learnTab.parentNode.insertAdjacentElement('afterend', tag);
  localStorage.setItem('nt5_animehint', '1');
}

/* ── Sakura loading petals ────────────────────────────────── */
function addSakuraToLoader() {
  const rain = document.getElementById('kanjiRain');
  if (!rain) return;
  const sakura = ['🌸','🌸','🌸','🌺'];
  for (let i = 0; i < 6; i++) {
    const p = document.createElement('div');
    p.className = 'ld-sakura-float';
    p.textContent = sakura[Math.floor(Math.random() * sakura.length)];
    p.style.left = (10 + Math.random() * 80) + '%';
    p.style.top  = '-40px';
    p.style.animationDuration = (3 + Math.random() * 3) + 's';
    p.style.animationDelay   = (Math.random() * 3) + 's';
    p.style.fontSize = (14 + Math.random() * 14) + 'px';
    rain.appendChild(p);
  }
}

/* ── Image caching (service worker hint, if available) ──── */
function prefetchCriticalAssets() {
  // Cache WOTD audio by pre-triggering synthesis once silently
  if (window.speechSynthesis) {
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0; u.lang = 'ja-JP';
    window.speechSynthesis.speak(u);
    window.speechSynthesis.cancel();
  }
}

/* ── Init ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {

  // Enhance hero banner
  upgradeHeroBanner();

  // Add header help button
  addHelpButton();

  // Add tooltips to key elements
  addTooltips();

  // Add sakura to loader
  addSakuraToLoader();

  // Prefetch TTS engine
  prefetchCriticalAssets();

  // First-time onboarding (after 600ms delay for smooth load)
  const isFirstVisit = !localStorage.getItem('nt5_onboard') && !localStorage.getItem('nt5');
  if (isFirstVisit) {
    setTimeout(openOnboarding, 900);
  }

  // Show Journey CTA for brand-new users
  const checkJourneyCta = () => {
    if (typeof S !== 'undefined') {
      injectJourneyCTA();
    } else {
      setTimeout(checkJourneyCta, 200);
    }
  };
  setTimeout(checkJourneyCta, 300);

  // Long-press hint on home page — show after 2s on first visit
  if (!localStorage.getItem('nt5_lphint')) {
    setTimeout(injectLongPressHint, 2000);
  }

  // Inject anime hint when Learn page is first visited
  document.querySelectorAll('.nb[data-p="learn"]').forEach(btn => {
    btn.addEventListener('click', () => setTimeout(injectAnimeHint, 600));
  });
});

// Re-add tooltips after page switches (since content re-renders)
const _origSwitchPage = typeof switchPage !== 'undefined' ? switchPage : null;
// Piggyback on existing switchPage by polling (safe approach)
setInterval(() => { addTooltips(); }, 2000);
