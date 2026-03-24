// ══════════════════════════════════════════════════════════════
//  NihongoTamil — Application Logic
//  Developed by NANTHAN 🇮🇳
//  தமிழ் மக்களுக்காக ❤️
// ══════════════════════════════════════════════════════════════

// ── State ─────────────────────────────────────────────────────
let S = JSON.parse(localStorage.getItem('nt5') || 'null') || {
  xp:0, streak:0, learned:[], quizH:{}, jlpt:'N5', lang:'ta', kS:{r:0,t:0}
};
let animeCache = null, topicAnimeMap = {};
let curPage = 'home', curSub = 'vocab', curKana = 'hira';
let curVerbIdx = 0, curGramFilter = 'all', curKanjiFilter = 'N5';
let quizSt = null, selQType = 'vocab', selSet = 0, curArt = null;
let _hkqScore = {r:0,t:0}, _phraseIdx = Math.floor(Date.now()/86400000);
let profData = JSON.parse(localStorage.getItem('nt5_prof') || 'null');
let _dictFilter = 'all', _searchIdx = null, _detailSpeak = '';

function saveS() { localStorage.setItem('nt5', JSON.stringify(S)); }

// ── Utils ──────────────────────────────────────────────────────
function showToast(m, d=2600) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = m;
  document.getElementById('toastCont').appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity .4s'; setTimeout(()=>t.remove(),400); }, d);
}
function speak(txt) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(txt);
  u.lang='ja-JP'; u.rate=.85;
  window.speechSynthesis.speak(u);
}
function stopSpeak() { window.speechSynthesis && window.speechSynthesis.cancel(); }
function updXp() {
  document.getElementById('xpDisp').textContent = S.xp;
  const sv = document.getElementById('sv-xp'); if(sv) sv.textContent = S.xp;
  const sw = document.getElementById('sv-w'); if(sw) sw.textContent = S.learned.length;
  const ss = document.getElementById('sv-str'); if(ss) ss.textContent = S.streak;
}
function addXp(n) { S.xp += n; saveS(); updXp(); showToast('🪙 +'+n+' XP!'); }
function markLearned(jp) {
  if (!S.learned.includes(jp)) {
    S.learned.push(jp); saveS(); addXp(15);
    showToast(`✓ "${jp}" கற்றேன்! +15 XP`);
    logActivity('📚', `"${jp}" கற்றேன்`);
  }
  renderHome();
}

// ── Word Popup ─────────────────────────────────────────────────
function closeWpop() { document.getElementById('wpop').classList.remove('on'); }
function showWpop(jp, rom, ta) {
  const el = document.getElementById('wpop');
  document.getElementById('wpJp').textContent = jp;
  document.getElementById('wpRom').textContent = rom;
  document.getElementById('wpTa').textContent = ta;
  window._wpopJp = jp;
  // Position near center bottom
  el.style.left = '50%'; el.style.bottom = 'calc(var(--nh) + 10px)';
  el.classList.add('on');
  speak(jp);
}
function speakWpop() { if(window._wpopJp) speak(window._wpopJp); }
document.addEventListener('click', e => {
  if (!e.target.closest('#wpop') && !e.target.closest('.tap-w') && !e.target.closest('.wi') && !e.target.closest('.kc'))
    closeWpop();
});

// ── Language ────────────────────────────────────────────────────
const UI = {
  ta:{hd:'தமிழ் வழியில் ஜப்பானியம்',start:'▶ கற்கத் தொடங்கு'},
  en:{hd:'Japanese through Tamil',start:'▶ Start Learning'},
  ja:{hd:'タミル語で日本語を学ぶ',start:'▶ 学習を始める'}
};
function setLang(l) {
  S.lang = l; saveS();
  document.querySelectorAll('.lopt').forEach(o=>o.classList.toggle('on',o.dataset.lang===l));
  const u = UI[l]||UI.ta;
  const sub=document.getElementById('hdr-sub'); if(sub) sub.textContent=u.hd;
  const btn=document.getElementById('btn-start'); if(btn) btn.textContent=u.start;
}

// ── JLPT ────────────────────────────────────────────────────────
document.getElementById('jbar').addEventListener('click', e => {
  const p = e.target.closest('.jp-pill'); if(!p) return;
  document.querySelectorAll('.jp-pill').forEach(x=>x.classList.remove('on'));
  p.classList.add('on');
  S.jlpt = p.dataset.l; saveS();
  if(curPage==='home') renderHome();
  if(curPage==='learn') renderLearn();
  if(curPage==='read') renderArtList();
  if(curPage==='quiz') renderQuizMenu();
});

// ── Navigation ──────────────────────────────────────────────────
function switchPage(p) {
  curPage = p;
  document.querySelectorAll('.pg').forEach(x=>x.classList.remove('on'));
  document.querySelectorAll('.nb').forEach(x=>x.classList.remove('on'));
  document.getElementById('pg-'+p)?.classList.add('on');
  document.querySelector(`.nb[data-p="${p}"]`)?.classList.add('on');
  closeWpop();
  if(p==='home') renderHome();
  else if(p==='kana') renderKanaPage();
  else if(p==='quiz') renderQuizMenu();
  else if(p==='read') renderArtList();
  else if(p==='learn') renderLearn();
  // long-press removed
}

// ── HOME ────────────────────────────────────────────────────────
const DAILY_PHRASES=[
["おはようございます。","ohayou gozaimasu","காலை வணக்கம்","Good morning"],
["いただきます。","itadakimasu","சாப்பிடுகிறேன்","Before eating"],
["ごちそうさまでした。","gochisousama deshita","நன்றி சாப்பிட்டேன்","After eating"],
["よろしくお願いします。","yoroshiku onegaishimasu","தயவுசெய்து","Please / Thank you"],
["お疲れ様でした。","otsukaresama deshita","உழைத்தீர்கள்","After work"],
["すみません、どこですか？","sumimasen, doko desu ka?","மன்னிக்கவும், எங்கே?","Excuse me, where is...?"],
["いくらですか？","ikura desu ka?","என்ன விலை?","How much?"],
["もう一度お願いします。","mou ichido onegaishimasu","மீண்டும் சொல்லுங்கள்","Please repeat"],
["わかりません。","wakarimasen","புரியவில்லை","I don't understand"],
["日本語を勉強しています。","nihongo wo benkyou shite imasu","ஜப்பானியம் படிக்கிறேன்","I am studying Japanese"],
["写真を撮ってもいいですか？","shashin wo totte mo ii desu ka?","புகைப்படம் எடுக்கலாமா?","May I take a photo?"],
["電車はどこですか？","densha wa doko desu ka?","ரயில் எங்கே?","Where is the train?"],
["お手洗いはどこですか？","otearai wa doko desu ka?","கழிவறை எங்கே?","Where is the restroom?"],
["少し話せます。","sukoshi hanasemasu","கொஞ்சம் பேசலாம்","I can speak a little"],
["ありがとうございます！","arigatou gozaimasu!","நன்றி!","Thank you!"],
];

function renderHome() {
  const w = WOTD[Math.floor(Date.now()/86400000)%WOTD.length];
  document.getElementById('wotd-jp').textContent = w.jp;
  document.getElementById('wotd-rom').textContent = w.rom;
  document.getElementById('wotd-ta').textContent = w.ta;
  document.getElementById('wotd-ex').textContent = w.ex;
  document.getElementById('wotd-ext').textContent = w.ext;
  // Progress
  const allW = getAllWords();
  const lvV = allW.filter(v=>v.jlpt===S.jlpt);
  const lvL = S.learned.filter(w=>lvV.find(v=>v.jp===w)).length;
  const pct = lvV.length ? Math.round(lvL/lvV.length*100) : 0;
  const pl = document.getElementById('prog-lvl'); if(pl) pl.textContent = S.jlpt+' முன்னேற்றம்';
  const pf = document.getElementById('prog-fill'); if(pf) pf.style.width = pct+'%';
  const pc = document.getElementById('prog-cnt'); if(pc) pc.textContent = lvL+'/'+lvV.length+' ('+pct+'%)';
  const qvl = document.getElementById('qv-level'); if(qvl) qvl.textContent = S.jlpt;
  updXp();
  renderTopicGrid();
  renderJlptOverview();
  renderDailyPhrase();
  renderQuickVocab();
  renderGramPreview();
  renderHomeKanaQuiz();
  renderDailyGoalBar();
  const _pc=document.querySelector('#pg-home .pc');
  if(_pc)showMotivBanner(_pc);
  renderJourneyCta();
}

function getAllWords() {
  const out = [];
  const seen = new Set();
  // From VOCAB_EXT
  if (typeof VOCAB_EXT !== 'undefined') {
    VOCAB_EXT.forEach(w => {
      const [jp,kana,rom,ta,jlpt,type,exjp,exta] = w;
      if (!seen.has(jp)) { seen.add(jp); out.push({jp,kana,rom,ta,jlpt,wtype:type,exjp,exta,topic:'சொல்வளம்'}); }
    });
  }
  TOPICS.forEach(t => t.words.forEach(w => {
    const [jp,kana,rom,ta,jlpt,type,exjp,exta] = w;
    if (!seen.has(jp)) { seen.add(jp); out.push({jp,kana,rom,ta,jlpt,wtype:type,exjp,exta,topic:t.ta}); }
  }));
  return out;
}

function renderJlptOverview() {
  const el = document.getElementById('jlpt-overview'); if(!el) return;
  const allW = getAllWords();
  const cols = {N5:'var(--teal)',N4:'var(--ind)',N3:'var(--gold)',N2:'var(--red)',N1:'var(--vio)'};
  el.innerHTML = ['N5','N4','N3','N2','N1'].map(lvl => {
    const wc = allW.filter(v=>v.jlpt===lvl).length;
    const kc = KANJI.filter(k=>k[5]===lvl).length;
    const lrn = S.learned.filter(w=>allW.find(v=>v.jp===w&&v.jlpt===lvl)).length;
    const pct = wc ? Math.round(lrn/wc*100) : 0;
    const active = S.jlpt===lvl;
    return `<div class="jlpt-row ${active?'active':''}" onclick="document.querySelector('.jp-pill[data-l=${lvl}]')?.click()">
      <span class="bdg ${lvl.toLowerCase()}" style="width:30px;text-align:center;">${lvl}</span>
      <div style="flex:1;"><div style="height:4px;background:var(--bg3);border-radius:2px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:${cols[lvl]};border-radius:2px;transition:width 1s ease;"></div>
      </div></div>
      <span style="font-family:var(--FM);font-size:9px;color:var(--tx3);min-width:72px;text-align:right;">${lrn}/${wc}·${kc}漢</span>
    </div>`;
  }).join('');
}

function renderDailyPhrase() {
  const el = document.getElementById('daily-phrase'); if(!el) return;
  const p = DAILY_PHRASES[_phraseIdx % DAILY_PHRASES.length];
  el.innerHTML = `<div class="phrase-jp" onclick="speak('${p[0].replace(/'/g,"\\'")}')">🔊 ${p[0]}</div>
    <div class="phrase-rom">${p[1]}</div>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span class="phrase-ta">${p[2]}</span>
      <span style="font-size:10px;color:rgba(255,255,255,.6);">${p[3]}</span>
    </div>`;
  window._curPhrase = p[0];
}
function speakPhrase() { if(window._curPhrase) speak(window._curPhrase); }
function nextPhrase() { _phraseIdx = (_phraseIdx+1) % DAILY_PHRASES.length; renderDailyPhrase(); }

function renderQuickVocab() {
  const el = document.getElementById('quick-vocab-grid'); if(!el) return;
  const allW = getAllWords().filter(v=>v.jlpt===S.jlpt);
  const items = [...allW].sort(()=>Math.random()-.5).slice(0,8);
  el.innerHTML = items.map(w => buildWordCard(w)).join('');
}
function refreshQuickVocab() { renderQuickVocab(); }

function renderGramPreview() {
  const el = document.getElementById('gram-preview'); if(!el) return;
  const items = GRAMMAR.filter(g=>g.jlpt==='N5').slice(0,3);
  el.innerHTML = items.map(g => `<div style="background:var(--cardgl);backdrop-filter:blur(10px);border:1px solid var(--glbr);border-radius:12px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all var(--tr);" onclick="switchPage('learn');setTimeout(()=>{document.querySelector('.stab[data-s=grammar]')?.click()},200)">
    <div style="font-family:var(--FJ);font-size:26px;font-weight:900;color:${g.col};width:36px;text-align:center;">${g.sym}</div>
    <div style="flex:1;"><div style="font-size:12.5px;font-weight:700;font-family:var(--FM);color:var(--tx);">${g.name}</div>
    <div style="font-size:10px;color:var(--tx3);font-family:var(--FT);margin-top:2px;">${g.fn}</div></div>
    <span class="bdg n5">N5</span>
  </div>`).join('');
}

function renderHomeKanaQuiz() {
  const el = document.getElementById('hkq-opts'); if(!el) return;
  const all = KANA_ROWS.flatMap(r=>r.cells.filter(c=>c[0]&&'aeioukasakitanahama'.includes(c[0].replace(/[^a-z]/g,'').slice(0,2))));
  if(!all.length) return;
  const q = all[Math.floor(Math.random()*all.length)];
  const kana = q[1];
  const hchar = document.getElementById('hkq-char');
  const hhint = document.getElementById('hkq-hint');
  if(hchar) { hchar.textContent = kana; hchar.onclick = ()=>speak(kana); }
  if(hhint) hhint.textContent = 'இந்த ஹிராகனா-க்கு ஒலி என்ன?';
  const wrongs = all.filter(x=>x[0]!==q[0]).sort(()=>Math.random()-.5).slice(0,3);
  el.innerHTML = [q,...wrongs].sort(()=>Math.random()-.5).map(o =>
    `<button class="hkq-btn" onclick="checkHkq(this,'${o[0]}','${q[0]}')">${o[0]}</button>`
  ).join('');
  const sc = document.getElementById('hkq-score');
  if(sc) sc.textContent = _hkqScore.t ? `மதிப்பெண்: ${_hkqScore.r}/${_hkqScore.t}` : '';
}
function checkHkq(btn, chosen, correct) {
  document.querySelectorAll('.hkq-btn').forEach(b => {
    b.disabled = true;
    if(b.textContent===correct) b.classList.add('ok');
  });
  if(chosen===correct) { _hkqScore.r++; addXp(3); btn.classList.add('ok'); }
  else { btn.classList.add('ng'); }
  _hkqScore.t++;
  setTimeout(renderHomeKanaQuiz, 1300);
}

function openWotdDetail() {
  const w = WOTD[Math.floor(Date.now()/86400000)%WOTD.length];
  const found = getAllWords().find(v=>v.jp===w.jp);
  if(found) openWordDetail(found); else speak(w.jp);
}
function speakWotd() { const jp = document.getElementById('wotd-jp')?.textContent; if(jp) speak(jp); }

// ── TOPIC GRID ──────────────────────────────────────────────────
function buildWordCard(w) {
  const jp = (w.jp||'').replace(/'/g,"\\'"), ta=(w.ta||'').replace(/'/g,"\\'"),
        rom=(w.rom||'').replace(/'/g,"\\'"), kana=(w.kana||w.rom||'').replace(/'/g,"\\'");
  return `<div class="wi" onclick="openWordDetail(${JSON.stringify(w).replace(/"/g,'&quot;')})">
    <div class="wi-top">
      <div class="wi-jp">${w.jp}</div>
      <span class="wi-sound" onclick="event.stopPropagation();speak('${jp}')">🔊</span>
    </div>
    <div class="wi-ta">${w.ta}</div>
    <div class="wi-rom">${w.kana||w.rom}</div>
    <span class="bdg ${(w.jlpt||'').toLowerCase()}" style="margin-top:4px;display:inline-block;">${w.jlpt}</span>
  </div>`;
}

const TOPIC_GRADS={food:'linear-gradient(135deg,#B91C1C,#7C0A0A)',school:'linear-gradient(135deg,#3730A3,#1e1b6e)',family:'linear-gradient(135deg,#0D6B47,#074d32)',nature:'linear-gradient(135deg,#166534,#14532d)',transport:'linear-gradient(135deg,#1D4ED8,#1e3a8a)',body:'linear-gradient(135deg,#B91C1C,#9f1239)',time:'linear-gradient(135deg,#6D28D9,#4c1d95)',emotions:'linear-gradient(135deg,#92600A,#7c3a0a)',colors:'linear-gradient(135deg,#BE185D,#9d174d)',shopping:'linear-gradient(135deg,#B91C1C,#b45309)',work:'linear-gradient(135deg,#1D4ED8,#1e3a8a)',culture:'linear-gradient(135deg,#B91C1C,#7c3aed)'};

function renderTopicGrid() {
  const el = document.getElementById('topicGrid'); if(!el) return;
  el.innerHTML = TOPICS.map(t => {
    const img = topicAnimeMap[t.id]||'';
    const grad = TOPIC_GRADS[t.id]||'linear-gradient(135deg,#B91C1C,#3730A3)';
    return `<div class="topic-card" onclick="openTopic('${t.id}')" style="background:${grad};">
      ${img?`<img class="tc-img" src="${img}" loading="lazy" onerror="this.style.display='none'" />`:''}
      <div class="tc-overlay" style="${img?'':'opacity:.3'}"></div>
      <div class="tc-body">
        <span class="tc-icon">${t.icon}</span>
        <div class="tc-jp">${t.jp}</div>
        <div class="tc-ta">${t.ta}</div>
        <div class="tc-cnt">${t.words.length} வார்த்தைகள்</div>
      </div>
    </div>`;
  }).join('');
}

function openTopic(id) {
  const topic = TOPICS.find(t=>t.id===id); if(!topic) return;
  const img = topicAnimeMap[id]||'';
  const grad = TOPIC_GRADS[id]||'linear-gradient(135deg,#B91C1C,#3730A3)';
  document.getElementById('topicGrid').style.display='none';
  document.getElementById('lbl-topics').closest('.sh').style.display='none';
  const view = document.getElementById('topicView');
  view.style.display = 'block';
  view.innerHTML = `<div class="tv-back" onclick="closeTopic()">← தலைப்புகள்</div>
    <div style="position:relative;height:120px;border-radius:var(--r3);overflow:hidden;margin-bottom:13px;background:${grad};">
      ${img?`<img src="${img}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(.5);" onerror="this.style.display='none'">`:''}
      <div style="position:absolute;inset:0;background:linear-gradient(to right,rgba(0,0,0,.7),transparent);display:flex;align-items:center;padding:14px;">
        <div><div style="font-family:var(--FJ);font-size:26px;font-weight:900;color:#fff;">${topic.jp}</div>
        <div style="font-family:var(--FT);font-size:13px;color:rgba(255,255,255,.7);">${topic.ta} · ${topic.words.length} வார்த்தைகள்</div></div>
      </div>
    </div>
    <div class="word-grid">${topic.words.map(w=>buildWordCard({jp:w[0],kana:w[1],rom:w[2],ta:w[3],jlpt:w[4],wtype:w[5],exjp:w[6],exta:w[7],topic:topic.ta})).join('')}</div>`;
}
function closeTopic() {
  document.getElementById('topicView').style.display='none';
  document.getElementById('topicGrid').style.display='grid';
  document.getElementById('lbl-topics').closest('.sh').style.display='flex';
}

// ── KANA ────────────────────────────────────────────────────────
function renderKanaPage() { buildKanaGrid('hira'); buildKanaGrid('kata'); buildCombo(); startKanaQuiz(); }
function buildKanaGrid(type) {
  const idx = type==='hira'?1:2;
  const info = type==='hira'
    ?'<b>ஹிராகனா (平仮名)</b> — ஜப்பானிய உள்நாட்டு வார்த்தைகளுக்கு. 46 அடிப்படை எழுத்துக்கள். ஒவ்வொன்றும் ஒரு ஒலி. தமிழ் ஒலிகளுடன் ஒப்பிட்டு கற்கவும்!'
    :'<b>கட்டகனா (片仮名)</b> — வெளிநாட்டு வார்த்தைகளுக்கு. Pizza→ピザ, Coffee→コーヒー, India→インド. கோணமான வடிவம்.';
  let h = `<div class="kana-info-box">${info}</div>`;
  for (const row of KANA_ROWS) {
    h += `<div class="krow-lbl">${row.row}</div><div class="kgrid">`;
    for (const c of row.cells) {
      if (!c[0]) { h += '<div></div>'; continue; }
      h += `<div class="kc" onclick="showKanaDetail('${c[idx]}','${c[0]}','${c[3]}')">
        <span class="kc-k">${c[idx]}</span><span class="kc-r">${c[0]}</span><span class="kc-t">${c[3]}</span></div>`;
    }
    h += '</div>';
  }
  document.getElementById('kana-'+type).innerHTML = h;
}
function showKanaDetail(kana, rom, ta) { speak(kana); showWpop(kana, rom, ta); }
function buildCombo() {
  let h = `<div class="kana-info-box">இணை எழுத்துக்கள் (Combination Sounds) — き+ゃ=きゃ (kya). சிறிய ゃゅょ சேர்த்து புதிய ஒலி. 33 இணை ஒலிகள்!</div>
  <div class="combo-box"><div class="combo-title">ஹிராகனா இணை</div><div class="combo-grid">
  ${KANA_COMBOS.map(c=>`<div class="kc" onclick="showKanaDetail('${c[1]}','${c[0]}','')"><span class="kc-k" style="font-size:13px;">${c[1]}</span><span class="kc-r">${c[0]}</span></div>`).join('')}
  </div></div>
  <div class="combo-box"><div class="combo-title">கட்டகனா இணை</div><div class="combo-grid">
  ${KANA_COMBOS.map(c=>`<div class="kc" onclick="showKanaDetail('${c[2]}','${c[0]}','')"><span class="kc-k" style="font-size:13px;">${c[2]}</span><span class="kc-r">${c[0]}</span></div>`).join('')}
  </div></div>`;
  document.getElementById('kana-combo').innerHTML = h;
}
function startKanaQuiz() {
  const all = KANA_ROWS.flatMap(r=>r.cells.filter(c=>c[0]));
  const q = all[Math.floor(Math.random()*all.length)];
  const type = Math.random()>.5 ? 'hira':'kata';
  const kana = q[type==='hira'?1:2];
  document.getElementById('kq-big').textContent = kana;
  document.getElementById('kq-hint').textContent = `இந்த ${type==='hira'?'ஹிராகனா':'கட்டகனா'}-க்கு ஒலி?`;
  const wrongs = all.filter(c=>c[0]!==q[0]).sort(()=>Math.random()-.5).slice(0,3);
  document.getElementById('kq-opts').innerHTML = [q,...wrongs].sort(()=>Math.random()-.5)
    .map(o=>`<button class="kqo" onclick="checkKanaQ(this,'${o[0]}','${q[0]}')">${o[0]}</button>`).join('');
}
function checkKanaQ(btn, chosen, correct) {
  document.querySelectorAll('.kqo').forEach(b=>{b.disabled=true;if(b.textContent===correct)b.classList.add('ok');});
  if(chosen===correct){S.kS.r++;addXp(5);btn.classList.add('ok');showToast('✓ சரியான பதில்!');}
  else{btn.classList.add('ng');showToast('✗ '+correct);}
  S.kS.t++; document.getElementById('kq-score').textContent=`மதிப்பெண்: ${S.kS.r}/${S.kS.t}`;
  saveS(); setTimeout(startKanaQuiz,1400);
}
document.getElementById('ktabs').addEventListener('click', e => {
  const b = e.target.closest('.ktab'); if(!b) return;
  curKana = b.dataset.k;
  document.querySelectorAll('.ktab').forEach(x=>x.classList.toggle('on',x.dataset.k===curKana));
  ['hira','kata','combo','kquiz'].forEach(k=>{ document.getElementById('kana-'+k).style.display=k===curKana?'':'none'; });
});

// ── QUIZ ────────────────────────────────────────────────────────
const QUIZ_TYPES=[
  {id:'vocab',icon:'📚',name:'சொல்வளம்',desc:'JP → தமிழ்'},
  {id:'kana',icon:'あ',name:'கனா',desc:'கனா → Romaji'},
  {id:'kanji',icon:'漢',name:'கன்ஜி',desc:'கன்ஜி → பொருள்'},
  {id:'grammar',icon:'📖',name:'இலக்கணம்',desc:'வடிவம் அடையாளம்'},
  {id:'reverse',icon:'🔄',name:'தலைகீழ்',desc:'தமிழ் → JP'},
];
function renderQuizMenu() {
  document.getElementById('qt-grid').innerHTML = QUIZ_TYPES.map(t=>
    `<div class="qtc ${t.id===selQType?'on':''}" onclick="selQT('${t.id}')">
      <div class="qtc-i">${t.icon}</div><div class="qtc-n">${t.name}</div><div class="qtc-d">${t.desc}</div>
    </div>`).join('');
  const sets = buildSets();
  document.getElementById('set-list').innerHTML = sets.map((s,i)=>{
    const h=S.quizH[s.id];
    return `<div class="set-card ${i===selSet?'on':''}" onclick="selS(${i})">
      <div class="set-num" style="background:${i===selSet?'var(--ind)':'var(--bg3)'};color:${i===selSet?'#fff':'var(--tx2)'};">${s.num}</div>
      <div style="flex:1;"><div style="font-weight:700;font-size:12.5px;font-family:var(--FT);color:var(--tx);">${s.name}</div>
      <div style="font-size:10px;color:var(--tx3);">${s.items?.length||0} கேள்விகள்</div></div>
      <div style="font-family:var(--FM);font-size:11px;color:${h?'var(--teal)':'var(--tx3)'};">${h?h.s+'/'+h.t:'—'}</div>
    </div>`;
  }).join('');
}
function buildSets() {
  const allW = getAllWords();
  if(selQType==='vocab') return[
    {id:'v1',num:'①',name:`${S.jlpt} அனைத்தும்`,items:allW.filter(v=>v.jlpt===S.jlpt).map(v=>({...v,ans:v.ta}))},
    {id:'v2',num:'②',name:'உணவு (食べ物)',items:(TOPICS.find(t=>t.id==='food')?.words||[]).map(w=>({jp:w[0],kana:w[1],rom:w[2],ta:w[3],jlpt:w[4],ans:w[3]}))},
    {id:'v3',num:'③',name:'குடும்பம் (家族)',items:(TOPICS.find(t=>t.id==='family')?.words||[]).map(w=>({jp:w[0],kana:w[1],rom:w[2],ta:w[3],jlpt:w[4],ans:w[3]}))},
    {id:'v4',num:'④',name:'இயற்கை (自然)',items:(TOPICS.find(t=>t.id==='nature')?.words||[]).map(w=>({jp:w[0],kana:w[1],rom:w[2],ta:w[3],jlpt:w[4],ans:w[3]}))},
    {id:'v5',num:'⑤',name:'கலப்பு அனைத்தும்',items:[...allW].sort(()=>Math.random()-.5).slice(0,25).map(v=>({...v,ans:v.ta}))},
    {id:'v6',num:'⑥',name:'N5 வினைச்சொற்கள்',items:allW.filter(v=>v.jlpt==='N5'&&v.wtype==='Verb').map(v=>({...v,ans:v.ta}))},
  ];
  if(selQType==='kana') return[
    {id:'k1',num:'①',name:'ஹிராகனா அடிப்படை',items:KANA_ROWS.slice(0,8).flatMap(r=>r.cells.filter(c=>c[0])).map(c=>({jp:c[1],rom:c[0],ta:c[3],ans:c[0]}))},
    {id:'k2',num:'②',name:'கட்டகனா அடிப்படை',items:KANA_ROWS.slice(0,8).flatMap(r=>r.cells.filter(c=>c[0])).map(c=>({jp:c[2],rom:c[0],ta:c[3],ans:c[0]}))},
    {id:'k3',num:'③',name:'Dakuten voiced',items:KANA_ROWS.slice(11).flatMap(r=>r.cells.filter(c=>c[0])).map(c=>({jp:c[1],rom:c[0],ta:c[3],ans:c[0]}))},
    {id:'k4',num:'④',name:'கலப்பு கனா',items:KANA_ROWS.flatMap(r=>r.cells.filter(c=>c[0])).sort(()=>Math.random()-.5).slice(0,30).map(c=>({jp:c[1],rom:c[0],ta:c[3],ans:c[0]}))},
  ];
  if(selQType==='kanji') return[
    {id:'kj1',num:'①',name:'N5 கன்ஜி → தமிழ்',items:KANJI.filter(k=>k[5]==='N5').map(k=>({jp:k[0],rom:k[1],ta:k[4],ans:k[4]}))},
    {id:'kj2',num:'②',name:'N4 கன்ஜி → தமிழ்',items:KANJI.filter(k=>k[5]==='N4').map(k=>({jp:k[0],rom:k[1],ta:k[4],ans:k[4]}))},
    {id:'kj3',num:'③',name:'கன்ஜி → English',items:KANJI.map(k=>({jp:k[0],rom:k[1],ta:k[3],ans:k[3]}))},
    {id:'kj4',num:'④',name:'கலப்பு N5+N4',items:[...KANJI].filter(k=>['N5','N4'].includes(k[5])).sort(()=>Math.random()-.5).slice(0,20).map(k=>({jp:k[0],rom:k[1],ta:k[4],ans:k[4]}))},
  ];
  if(selQType==='grammar') return[
    {id:'g1',num:'①',name:'N5 இலக்கணம்',items:GRAMMAR.filter(g=>g.jlpt==='N5').map(g=>({jp:g.sym,rom:g.name,ta:g.maps[0]?.d||g.fn,ans:g.maps[0]?.d||g.fn,hint:g.fn}))},
    {id:'g2',num:'②',name:'N4 இலக்கணம்',items:GRAMMAR.filter(g=>g.jlpt==='N4').map(g=>({jp:g.sym,rom:g.name,ta:g.maps[0]?.d||g.fn,ans:g.maps[0]?.d||g.fn,hint:g.fn}))},
    {id:'g3',num:'③',name:'N3–N1 இலக்கணம்',items:GRAMMAR.filter(g=>['N3','N2','N1'].includes(g.jlpt)).map(g=>({jp:g.sym,rom:g.name,ta:g.maps[0]?.d||g.fn,ans:g.maps[0]?.d||g.fn,hint:g.fn}))},
  ];
  if(selQType==='reverse') return[
    {id:'r1',num:'①',name:`தலைகீழ் ${S.jlpt}`,items:getAllWords().filter(v=>v.jlpt===S.jlpt).slice(0,30).map(v=>({jp:v.ta,rom:v.rom,ta:v.jp,ans:v.jp,hint:v.rom}))},
    {id:'r2',num:'②',name:'தலைகீழ் N5 வினைச்சொல்',items:getAllWords().filter(v=>v.jlpt==='N5'&&v.wtype==='Verb').map(v=>({jp:v.ta,rom:v.rom,ta:v.jp,ans:v.jp,hint:v.rom}))},
  ];
  return [];
}
function selQT(t){selQType=t;selSet=0;renderQuizMenu();}
function selS(i){selSet=i;renderQuizMenu();}
function startQuiz(){
  const sets=buildSets();if(!sets[selSet])return;
  const raw=sets[selSet].items||[];
  if(raw.length<4){showToast('கேள்விகள் போதாது!');return;}
  const words=[...raw].sort(()=>Math.random()-.5).slice(0,Math.min(10,raw.length));
  quizSt={words,idx:0,score:0,setId:sets[selSet].id,total:words.length};
  document.getElementById('quiz-menu').style.display='none';
  document.getElementById('quiz-res').style.display='none';
  document.getElementById('quiz-active').style.display='block';
  showQ();
}
function showQ(){
  const qs=quizSt;if(qs.idx>=qs.total){finishQuiz();return;}
  const w=qs.words[qs.idx];
  const jp=w.jp||'?',ans=w.ans||w.ta||'?',hint=w.hint||w.rom||'';
  document.getElementById('qpfill').style.width=(qs.idx/qs.total*100)+'%';
  document.getElementById('q-num').textContent=`கேள்வி ${qs.idx+1} / ${qs.total}`;
  const big=document.getElementById('q-big');
  big.textContent=jp;big.title='🔊';big.style.cursor='pointer';big.onclick=()=>speak(jp);
  const isJP=/[\u3040-\u30FF\u4E00-\u9FFF]/.test(jp);
  big.style.fontFamily=isJP?'var(--FJ)':'var(--FM)';
  big.style.fontSize=isJP&&jp.length===1?'64px':isJP?'42px':'26px';
  document.getElementById('q-hint').textContent=[hint,'🔊 தொட்டால் ஒலி'].filter(Boolean).join(' · ');
  if(isJP) setTimeout(()=>speak(jp),200);
  const pool=qs.words;
  const wrongs=pool.filter(x=>(x.ans||x.ta)!==ans).sort(()=>Math.random()-.5).slice(0,3);
  const opts=[{ans,ta:ans},...wrongs.map(x=>({ans:x.ans||x.ta,ta:x.ans||x.ta}))].sort(()=>Math.random()-.5);
  document.getElementById('q-opts').innerHTML=opts.map(o=>{
    const safe=(o.ta||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    const aas=ans.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return `<button class="qo" onclick="checkQ(this,'${safe}','${aas}')">${o.ta}</button>`;
  }).join('');
}
function checkQ(btn,chosen,correct){
  document.querySelectorAll('.qo').forEach(b=>{b.disabled=true;if(b.textContent.trim()===correct.trim())b.classList.add('ok');});
  if(chosen.trim()===correct.trim()){quizSt.score++;btn.classList.add('ok');showToast('✓ சரியான பதில்!');}
  else{btn.classList.add('ng');showToast('✗ '+correct);}
  setTimeout(()=>{quizSt.idx++;showQ();},1300);
}
function finishQuiz(){
  const qs=quizSt;
  document.getElementById('quiz-active').style.display='none';
  document.getElementById('quiz-res').style.display='block';
  const pct=Math.round(qs.score/qs.total*100);
  const[em,msg]=pct>=90?['🎉','சிறப்பு! 素晴らしい！']:pct>=70?['😊','நன்றாக செய்தீர்கள்!']:pct>=50?['🙂','தொடர்ந்து முயற்சி!']:['😅','மீண்டும் முயற்சி!'];
  document.getElementById('qr-em').textContent=em;
  document.getElementById('qr-sc').textContent=`${qs.score}/${qs.total}`;
  document.getElementById('qr-msg').textContent=getQuizMotiv(qs.score,qs.total);
  const xp=qs.score*10;
  document.getElementById('qr-xp').textContent=`🪙 +${xp} XP`;
  S.quizH[qs.setId]={s:qs.score,t:qs.total};S.streak=Math.max(1,(S.streak||0)+1);
  addXp(xp);logActivity('📝',`தேர்வு ${qs.score}/${qs.total}`);saveS();renderHome();
}
function endQuiz(){
  document.getElementById('quiz-active').style.display='none';document.getElementById('quiz-res').style.display='none';
  document.getElementById('quiz-menu').style.display='block';quizSt=null;renderQuizMenu();
}

// ── READ ────────────────────────────────────────────────────────
function artImg(i){
  if(!animeCache||!animeCache.length)return'';
  const ART_IDX=[3,0,5,1,4,2,6,7,8,9,10,11];
  const a=animeCache[ART_IDX[i%ART_IDX.length]%animeCache.length];
  return a&&a.images&&(a.images.jpg.image_url||a.images.jpg.small_image_url)||'';
}
function renderArtList(){
  document.getElementById('art-list').innerHTML=`
  <div style="background:linear-gradient(135deg,#3730A3,#6D28D9);border-radius:var(--r3);padding:16px;margin-bottom:11px;color:#fff;text-align:center;box-shadow:0 6px 24px rgba(55,48,163,.3);">
    <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;opacity:.7;font-family:var(--FT);">வாசிப்பு பயிற்சி</div>
    <div style="font-family:var(--FD);font-size:21px;font-weight:700;margin:4px 0;">${ARTICLES.length} கட்டுரைகள்</div>
    <div style="font-size:11px;opacity:.8;font-family:var(--FT);">வார்த்தையை தொட்டால் அர்த்தம் · 🔊 ஒலி</div>
  </div>`+
  ARTICLES.map((a,i)=>{
    const img=artImg(i);
    return `<div class="art-card">
      ${img?`<div style="position:relative;height:110px;overflow:hidden;">
        <img src="${img}" style="width:100%;height:100%;object-fit:cover;filter:brightness(.5);" loading="lazy" onerror="this.style.display='none'"/>
        <div style="position:absolute;inset:0;background:linear-gradient(160deg,transparent,rgba(0,0,0,.7));"></div>
        <div style="position:absolute;bottom:9px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:flex-end;">
          <div><div style="font-family:var(--FJ);font-size:16px;font-weight:700;color:#fff;">${a.title}</div>
          <div style="font-family:var(--FT);font-size:10px;color:rgba(255,255,255,.7);">${a.cat}</div></div>
          <span class="bdg ${a.lvl.toLowerCase()}">${a.lvl}</span>
        </div></div>`:
      `<div class="art-top"><span class="art-cat">${a.cat}</span><span class="bdg ${a.lvl.toLowerCase()}">${a.lvl}</span></div>`}
      <div class="art-body" style="${img?'padding-top:10px;':''}">
        ${!img?`<div class="art-title">${a.title}</div>`:''}
        <div class="art-prev">${a.prev}</div>
        <div class="art-meta">⏱ ~${a.mins} நிமிடம் · ${a.vocab?.length||0} சொற்கள்</div>
        <div style="display:flex;gap:7px;margin-top:9px;">
          <button class="btn btn-i" style="flex:1;font-size:11px;padding:9px;" onclick="openArt(${a.id})">படி → 読む</button>
          <button class="btn btn-g" style="padding:9px 12px;" onclick="speak('${a.title.replace(/'/g,"\\'")}')">🔊</button>
        </div>
      </div>
    </div>`;
  }).join('');
}
function openArt(id){
  curArt=ARTICLES.find(a=>a.id===id);if(!curArt)return;
  document.getElementById('art-list').style.display='none';
  document.getElementById('art-view').style.display='block';
  document.getElementById('av-ttl').textContent=curArt.title;
  let html=curArt.full;
  for(const v of(curArt.vocab||[])){
    const re=new RegExp(v.jp.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g');
    html=html.replace(re,`<span class="tap-w" onclick="showWpopAudio('${v.jp.replace(/'/g,"\\'")}','${v.rom}','${v.ta.replace(/'/g,"\\'")}');">${v.jp}</span>`);
  }
  document.getElementById('av-txt').innerHTML=html;
  document.getElementById('av-ta-block').classList.remove('on');document.getElementById('av-ta-block').style.display='';
  document.getElementById('av-trans-btn').style.display='block';
  document.getElementById('av-voc').innerHTML=`<div class="voc-h">முக்கிய சொல்வளம்</div>`+
    (curArt.vocab||[]).map(v=>`<div class="voc-i" onclick="showWpopAudio('${v.jp.replace(/'/g,"\\'")}','${v.rom}','${v.ta.replace(/'/g,"\\'")}')">
      <span class="voc-jp">${v.jp}</span><span class="voc-rom">${v.rom}</span>
      <span class="voc-ta">${v.ta}</span><span style="font-size:12px;opacity:.4;margin-left:4px;">🔊</span>
    </div>`).join('');
}
function showWpopAudio(jp,rom,ta){showWpop(jp,rom,ta);}
function closeArt(){document.getElementById('art-list').style.display='block';document.getElementById('art-view').style.display='none';curArt=null;}
function translateArt(){
  const btn=document.getElementById('av-trans-btn');
  if(curArt?.ta){document.getElementById('av-ta-txt').textContent=curArt.ta;const b=document.getElementById('av-ta-block');b.style.display='block';setTimeout(()=>b.classList.add('on'),10);btn.style.display='none';}
  else showToast('இந்த கட்டுரைக்கு தமிழ் மொழிபெயர்ப்பு இல்லை');
}
function speakFull(){if(curArt)speak(curArt.full);}

// ── LEARN ────────────────────────────────────────────────────────
function renderLearn(){renderVocabGrid();renderVerbPills();renderVerbTable();renderGramFilters();renderGramCards();renderKanjiFilters();renderKanjiGrid();}
document.getElementById('learn-tabs').addEventListener('click',e=>{
  const b=e.target.closest('.stab');if(!b)return;
  curSub=b.dataset.s;
  document.querySelectorAll('.stab').forEach(x=>x.classList.toggle('on',x.dataset.s===curSub));
  ['vocab','verbs','grammar','kanji','anime'].forEach(k=>{document.getElementById('sub-'+k).style.display=k===curSub?'':'none';});
  if(curSub==='anime'&&!animeCache?.length)fetchAnime();
});
let vocabTypeF='all';
function renderVocabGrid(){
  const allW=getAllWords();
  const types=['all',...new Set(allW.map(v=>v.wtype).filter(Boolean))];
  document.getElementById('type-filters').innerHTML=types.map(t=>
    `<button class="btn btn-g" style="font-size:10px;padding:5px 10px;${vocabTypeF===t?'background:var(--red);color:#fff;border-color:var(--red);':''}" onclick="filterVocab('${t}')">${t==='all'?'அனைத்தும்':t}</button>`).join('');
  const items=vocabTypeF==='all'?allW.filter(v=>v.jlpt===S.jlpt):allW.filter(v=>v.jlpt===S.jlpt&&v.wtype===vocabTypeF);
  document.getElementById('vocab-grid').innerHTML=items.map(w=>buildWordCard(w)).join('');
}
function filterVocab(t){vocabTypeF=t;renderVocabGrid();}
function renderVerbPills(){document.getElementById('verb-pills').innerHTML=VERBS.map((v,i)=>`<div class="vp ${i===curVerbIdx?'on':''}" onclick="selVerb(${i})">${v.jp}</div>`).join('');}
function selVerb(i){curVerbIdx=i;renderVerbPills();renderVerbTable();}
function renderVerbTable(){
  document.getElementById('vtb').innerHTML=VERBS.map((v,vi)=>`<tr class="${vi===curVerbIdx?'hl':''}">
    <td><div class="vt-jp">${v.jp}</div><div class="vt-rom" style="color:var(--gold);">${v.type}</div><div class="vt-ta">${v.ta}</div></td>
    ${v.forms.map(f=>`<td><span class="vt-jp" onclick="speak('${f[0].replace(/'/g,"\\'")}')" style="cursor:pointer;">${f[0]}</span><span class="vt-rom">${f[1]}</span><span class="vt-ta">${f[2]}</span></td>`).join('')}
  </tr>`).join('');
}
function renderGramFilters(){
  document.getElementById('gram-filters').innerHTML=['all','N5','N4','N3','N2','N1'].map(l=>
    `<button class="btn btn-g" style="font-size:10px;padding:5px 10px;${curGramFilter===l?'background:var(--red);color:#fff;border-color:var(--red);':''}" onclick="filterGram('${l}')">${l==='all'?'அனைத்தும்':l}</button>`).join('');
}
function filterGram(l){curGramFilter=l;renderGramFilters();renderGramCards();}
function renderGramCards(){
  const items=curGramFilter==='all'?GRAMMAR:GRAMMAR.filter(g=>g.jlpt===curGramFilter);
  const ac=animeCache||[];
  document.getElementById('gram-cards').innerHTML=items.map((g,i)=>{
    const anime=ac[i%Math.max(ac.length,1)];
    const imgUrl=anime?.images?.jpg?.image_url||'';
    return `<div class="gcard">
      <div class="gc-hd">
        ${imgUrl?`<img class="gc-anime" src="${imgUrl}" alt="" loading="lazy" onerror="this.style.display='none'"/>`:`<div class="gc-anime-ph">📖</div>`}
        <div class="gc-sym" style="color:${g.col}">${g.sym}</div>
        <div><div class="gc-n">${g.name}</div><div class="gc-fn">${g.fn} · <span class="bdg ${g.jlpt.toLowerCase()}">${g.jlpt}</span></div></div>
      </div>
      <div class="gc-body">
        <div class="gc-desc">${g.desc}</div>
        ${g.maps.map(m=>`<div class="gc-map"><div class="gc-ts">${m.s}</div><div style="color:var(--tx3);padding:0 5px;">→</div><div class="gc-td">${m.d}</div></div>`).join('')}
        <div class="gc-exs">${g.exs.map(e=>`<div class="gc-ex" onclick="speak('${e.jp.replace(/'/g,"\\'")}')"><div class="gc-jp">🔊 ${e.jp}</div><div class="gc-rom">${e.rom}</div><div class="gc-ta">${e.ta}</div></div>`).join('')}</div>
      </div>
    </div>`;
  }).join('');
}
function renderKanjiFilters(){
  document.getElementById('kanji-filters').innerHTML=['N5','N4','N3','N2','N1','அனைத்தும்'].map(l=>
    `<button class="btn btn-g" style="font-size:10px;padding:5px 10px;${curKanjiFilter===l?'background:var(--red);color:#fff;border-color:var(--red);':''}" onclick="filterKanji('${l}')">${l}</button>`).join('');
}
function filterKanji(l){curKanjiFilter=l;renderKanjiFilters();renderKanjiGrid();}
function renderKanjiGrid(){
  const items=curKanjiFilter==='அனைத்தும்'?KANJI:KANJI.filter(k=>k[5]===curKanjiFilter);
  document.getElementById('kanji-grid').innerHTML=items.map(k=>
    `<div class="kji ${S.learned.includes(k[0])?'lrn':''}" title="${k[3]} — ${k[4]} 🔊" onclick='openKanjiModal(${JSON.stringify(k).replace(/'/g,"&#39;")})'>
      <div class="kj-k">${k[0]}</div><div class="kj-en">${k[3]}</div><div class="kj-ta">${k[4]}</div>
    </div>`).join('');
}
function openKanjiModal(k){
  const[kj,on,kun,en,ta,jlpt,str,exs]=k;
  document.getElementById('kjModal').innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="font-family:var(--FJ);font-size:60px;font-weight:900;cursor:pointer;animation:pg-in .3s ease;" onclick="speak('${kj}')">${kj}</div>
        <div><div style="font-size:19px;font-weight:700;color:var(--tx);">${en}</div>
        <div style="font-family:var(--FT);font-size:14px;color:var(--teal);margin-top:2px;">${ta}</div>
        <div style="display:flex;gap:5px;margin-top:7px;flex-wrap:wrap;">
          <span class="bdg ${jlpt.toLowerCase()}">${jlpt} · ${str} strokes</span>
          ${S.learned.includes(kj)?'<span class="bdg" style="background:var(--tbg);color:var(--teal);border:1px solid var(--tbd);">✓ கற்றேன்</span>':''}
        </div></div>
      </div>
      <div style="cursor:pointer;font-size:19px;color:var(--tx3);padding:4px;" onclick="document.getElementById('kjOv').classList.remove('on')">✕</div>
    </div>
    <div class="kjm-row">
      <div class="kjm-col"><div class="kjm-col-l">音読み ON</div><div class="kjm-col-v">${on||'—'}</div></div>
      <div class="kjm-col"><div class="kjm-col-l">訓読み KUN</div><div class="kjm-col-v">${kun||'—'}</div></div>
      <div class="kjm-col"><div class="kjm-col-l">English</div><div class="kjm-col-v">${en}</div></div>
      <div class="kjm-col"><div class="kjm-col-l">தமிழ்</div><div class="kjm-col-v" style="font-family:var(--FT);">${ta}</div></div>
    </div>
    <div class="kjm-exs">
      <div class="kjm-col-l" style="margin-bottom:7px;font-weight:700;">சொல் உதாரணங்கள்</div>
      ${(exs||[]).map(e=>`<div class="kjm-ex">
        <div style="font-family:var(--FJ);font-size:20px;font-weight:700;min-width:60px;cursor:pointer;" onclick="speak('${e[0].replace(/'/g,"\\'")}')">🔊${e[0]}</div>
        <div style="font-family:var(--FM);font-size:9px;color:var(--tx3);flex:1;">${e[1]}</div>
        <div class="kjm-ex-ta">${e[2]}</div>
      </div>`).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:13px;flex-wrap:wrap;">
      <button class="btn btn-r" onclick="speak('${kj}')">🔊 ஒலி</button>
      ${!S.learned.includes(kj)?`<button class="btn btn-t" onclick="markLearned('${kj}');renderKanjiGrid();document.getElementById('kjOv').classList.remove('on')">+ கற்றேன் (+15 XP)</button>`:
      `<button class="btn btn-g">✓ கற்றாகிவிட்டது</button>`}
    </div>`;
  document.getElementById('kjOv').classList.add('on');
  speak(kj);
}
async function fetchAnime(){
  const btn=document.getElementById('anime-fetch-btn'),list=document.getElementById('anime-list');
  if(animeCache?.length){renderAnimeList(animeCache,list);btn.style.display='none';return;}
  btn.innerHTML='<span class="spin">⟳</span> ஏற்றுகிறோம்...';btn.disabled=true;
  try{
    const timeout=new Promise((_,r)=>setTimeout(()=>r('timeout'),4000));
    const req=fetch('https://api.jikan.moe/v4/top/anime?type=tv&filter=bypopularity&limit=16');
    const res=await Promise.race([req,timeout]);
    const data=await res.json();
    animeCache=data.data||[];renderAnimeList(animeCache,list);btn.style.display='none';
    const tids=['food','school','family','nature','transport','body','time','emotions','colors','shopping','work','culture'];
    tids.forEach((tid,i)=>{if(animeCache[i])topicAnimeMap[tid]=animeCache[i].images?.jpg?.image_url||animeCache[i].images?.jpg?.small_image_url||'';});
    renderTopicGrid();renderGramCards();
  }catch{btn.innerHTML='🎌 மீண்டும் முயற்சி';btn.disabled=false;list.innerHTML='<div style="padding:10px;font-family:var(--FT);font-size:12px;color:var(--tx3);">API error. இணைப்பை சரிபார்க்கவும்.</div>';}
}
const ANIME_TIPS=['N5 பேச்சு மொழி கற்க','இயல்பான உரையாடல்','உணர்வு வெளிப்பாடு','ஜப்பானிய கலாச்சாரம்','வட்டார மொழி','நவீன அன்றாட வாழ்க்கை','Action சொல்வளம்','நட்பு வெளிப்பாடு','Keigo மரியாதை மொழி','திருவிழா பாரம்பரியம்','Onomatopoeia','வரலாற்று சொல்வளம்','பள்ளி உரையாடல்','குடும்ப உறவு','சமையல் உணவு மொழி','அன்பு உணர்வு'];
function renderAnimeList(list,el){
  el.innerHTML=list.map((a,i)=>`<div class="anime-card" onclick="window.open('https://myanimelist.net/anime/${a.mal_id}','_blank')">
    <img class="anime-img" src="${a.images?.jpg?.image_url||a.images?.jpg?.small_image_url||''}" alt="" loading="lazy" onerror="this.style.display='none'"/>
    <div class="anime-body">
      <div class="a-jp">${a.title||''}</div><div class="a-en">${a.title_english||''}</div>
      <div class="a-score">⭐ ${a.score||'N/A'} · ${a.episodes||'?'} eps</div>
      <div class="a-tip">📚 ${ANIME_TIPS[i%ANIME_TIPS.length]}</div>
    </div>
  </div>`).join('');
}

// ── DICTIONARY ───────────────────────────────────────────────────
// JMdict inlined in data.js — no fetch
let _jmdict = (typeof JMDICT_DATA !== 'undefined') ? JMDICT_DATA : [];
function loadJMdict(){ return Promise.resolve(_jmdict); }

function buildSearchIndex(){
  if(_searchIdx) return _searchIdx;
  const idx=[];const seen=new Set();
  // Add JMdict entries first (richest data)
  if(_jmdict&&_jmdict.length){
    _jmdict.forEach(e=>{
      if(!seen.has(e.word)){
        seen.add(e.word);
        const m=e.meanings[0]||{};
        idx.push({
          type:'word', source:'jmdict',
          jp:e.word, kana:e.kana, rom:e.romaji,
          ta:m.tamil||'', en:m.english||'',
          jlpt:e.jlpt, wtype:m.pos||e.group,
          exjp:e.examples?.[0]?.jp||'',
          exta:e.examples?.[0]?.ta||'',
          conjugations:e.conjugations,
          allMeanings:e.meanings,
          allExamples:e.examples,
          topic:'JMdict'
        });
      }
    });
  }
  if(typeof VOCAB_EXT!=='undefined'){
    VOCAB_EXT.forEach(w=>{
      const[jp,kana,rom,ta,jlpt,type,exjp,exta]=w;
      if(!seen.has(jp)){seen.add(jp);idx.push({type:'word',jp,kana,rom,ta,jlpt,wtype:type,exjp,exta,topic:'சொல்வளம்'});}
    });
  }
  TOPICS.forEach(t=>t.words.forEach(w=>{
    const[jp,kana,rom,ta,jlpt,type,exjp,exta]=w;
    if(!seen.has(jp)){seen.add(jp);idx.push({type:'word',jp,kana,rom,ta,jlpt,wtype:type,exjp,exta,topic:t.ta});}
  }));
  KANJI.forEach(k=>idx.push({type:'kanji',jp:k[0],on:k[1],kun:k[2],en:k[3],ta:k[4],jlpt:k[5],str:k[6],exs:k[7]}));
  KANA_ROWS.forEach(r=>r.cells.forEach(c=>{if(c[0])idx.push({type:'kana',rom:c[0],hira:c[1],kata:c[2],ta:c[3],row:r.row});}));
  GRAMMAR.forEach(g=>idx.push({type:'grammar',jp:g.sym,name:g.name,fn:g.fn,jlpt:g.jlpt,desc:g.desc,col:g.col,maps:g.maps,exs:g.exs}));
  _searchIdx=idx; return idx;
}
function openDict(){
  _searchIdx=null;
  document.getElementById('pg-dict').style.display='block';
  document.getElementById('dict-count').textContent='ஏற்றுகிறோம்...';
  loadJMdict().then(()=>{
    const cnt=buildSearchIndex().length;
    document.getElementById('dict-count').textContent=cnt+' உள்ளீடுகள்';
    setTimeout(()=>{document.getElementById('dict-search')?.focus();doSearch('');},100);
  });
}
function closeDict(){document.getElementById('pg-dict').style.display='none';}
function setDictFilter(f,el){
  _dictFilter=f;document.querySelectorAll('.dp').forEach(p=>p.classList.remove('on'));if(el)el.classList.add('on');
  doSearch(document.getElementById('dict-search')?.value||'');
}
function doSearch(q){
  const idx=buildSearchIndex();const ql=q.trim().toLowerCase();
  let res=idx.filter(item=>{
    if(_dictFilter==='kanji'&&item.type!=='kanji')return false;
    if(_dictFilter==='word'&&item.type!=='word')return false;
    if(_dictFilter==='kana'&&item.type!=='kana')return false;
    if(_dictFilter==='grammar'&&item.type!=='grammar')return false;
    if(['N5','N4','N3','N2','N1'].includes(_dictFilter)&&item.jlpt!==_dictFilter)return false;
    if(!ql)return true;
    const s=[item.jp,item.rom,item.ta,item.kana,item.en,item.hira,item.kata,item.fn,item.name,item.desc].filter(Boolean).join(' ').toLowerCase();
    return s.includes(ql)||item.jp?.includes(q)||item.rom?.toLowerCase().startsWith(ql);
  });
  if(ql)res.sort((a,b)=>{
    const sa=a.jp===q?0:a.rom?.toLowerCase()===ql?1:a.jp?.startsWith(q)?2:3;
    const sb=b.jp===q?0:b.rom?.toLowerCase()===ql?1:b.jp?.startsWith(q)?2:3;
    return sa-sb;
  });
  renderDictResults(res.slice(0,80),ql);
}
function hlq(text,q){if(!q||!text)return text||'';return text.replace(new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'),'<span class="hl">$1</span>');}
function renderDictResults(results,q){
  const el=document.getElementById('dict-results');
  if(!results.length){el.innerHTML=`<div style="text-align:center;padding:50px 20px;color:var(--tx3);"><div style="font-size:38px;margin-bottom:10px;">🔍</div><div style="font-family:var(--FT);">"${q||''}" க்கு முடிவு இல்லை</div></div>`;return;}
  el.innerHTML=results.map(item=>{
    if(item.type==='kanji')return `<div class="dc" onclick="openKanjiDetail(${JSON.stringify(item).replace(/"/g,'&quot;')})">
      <div class="dc-top"><div class="dc-jp" style="font-size:44px;">${item.jp}</div>
        <div class="dc-r">
          <div class="dc-read"><span style="color:var(--red);font-size:9px;font-weight:700;">ON</span> ${item.on||'—'} <span style="color:var(--teal);font-size:9px;font-weight:700;margin-left:6px;">KUN</span> ${item.kun||'—'}</div>
          <div class="dc-ta">${hlq(item.ta,q)}</div><div class="dc-en">${item.en}</div>
          <div class="dc-tags"><span class="bdg ${(item.jlpt||'').toLowerCase()}">${item.jlpt}</span><span class="bdg n3" style="background:var(--gbg);color:var(--gold);border-color:var(--gbd);">${item.str} strokes</span></div>
        </div>
        <button onclick="event.stopPropagation();speak('${item.jp}');" style="background:none;border:none;font-size:16px;cursor:pointer;opacity:.55;">🔊</button>
      </div></div>`;
    if(item.type==='kana')return `<div class="dc" onclick="openKanaDetail('${item.rom}','${item.hira}','${item.kata}','${item.ta}','${item.row}')">
      <div class="dc-top">
        <div style="display:flex;gap:13px;align-items:center;min-width:82px;">
          <span style="font-family:var(--FJ);font-size:38px;font-weight:900;color:var(--tx);">${item.hira}</span>
          <span style="font-family:var(--FJ);font-size:28px;font-weight:700;color:var(--tx2);">${item.kata}</span>
        </div>
        <div class="dc-r"><div class="dc-read" style="font-size:15px;font-weight:700;color:var(--tx);">${item.rom}</div>
          <div class="dc-ta">${hlq(item.ta,q)}</div>
          <div style="font-size:10px;color:var(--tx3);margin-top:3px;">${item.row}</div>
        </div>
        <button onclick="event.stopPropagation();speak('${item.hira}');" style="background:none;border:none;font-size:16px;cursor:pointer;opacity:.55;">🔊</button>
      </div></div>`;
    if(item.type==='grammar')return `<div class="dc" onclick="openGramDetail(${JSON.stringify(item).replace(/"/g,'&quot;')})">
      <div class="dc-top">
        <div style="font-family:var(--FJ);font-size:30px;font-weight:900;color:${item.col||'var(--red)'};min-width:46px;text-align:center;">${item.jp}</div>
        <div class="dc-r"><div style="font-size:13.5px;font-weight:700;color:var(--tx);">${item.name}</div>
          <div class="dc-ta">${hlq(item.fn,q)}</div>
          <div class="dc-tags"><span class="bdg ${(item.jlpt||'').toLowerCase()}">${item.jlpt}</span></div>
        </div>
      </div>
      ${item.desc?`<div style="font-family:var(--FT);font-size:11px;color:var(--tx2);line-height:1.7;margin-top:4px;">${item.desc.slice(0,130)}...</div>`:''}</div>`;
    return `<div class="dc" onclick="openWordDetail(${JSON.stringify(item).replace(/"/g,'&quot;')})">
      <div class="dc-top">
        <div class="dc-jp">${item.jp}</div>
        <div class="dc-r">
          <div class="dc-read">${item.kana||''}${item.rom&&item.rom!==item.kana?' · '+item.rom:''}</div>
          <div class="dc-ta">${hlq(item.ta,q)}</div>
          <div class="dc-tags"><span class="bdg ${(item.jlpt||'').toLowerCase()}">${item.jlpt||''}</span>${item.wtype?`<span class="bdg n4">${item.wtype}</span>`:''}</div>
        </div>
        <button onclick="event.stopPropagation();speak('${(item.jp||'').replace(/'/g,"\\'")}');" style="background:none;border:none;font-size:16px;cursor:pointer;opacity:.55;">🔊</button>
      </div>
      ${item.exjp?`<div class="dc-ex"><div class="dc-exjp">${item.exjp}</div><div class="dc-exta">${item.exta||''}</div></div>`:''}</div>`;
  }).join('');
}
function openWordDetail(w){
  _detailSpeak=w.jp||'';
  document.getElementById('wd-header-jp').textContent=w.jp;
  const isL=S.learned.includes(w.jp);
  document.getElementById('wd-body').innerHTML=`
    <div class="kanji-hero" onclick="speak('${(w.jp||'').replace(/'/g,"\\'")}')">
      <div class="kh-char">${w.jp}</div><div class="kh-ta">${w.ta}</div>
      <div class="kh-en" style="font-family:var(--FM);font-size:12px;color:var(--tx3);">${w.rom||''} ${w.kana&&w.kana!==w.rom?'· '+w.kana:''}</div>
    </div>
    <div class="info-row">
      <div class="ir"><span class="ir-label">JLPT</span><span class="ir-val"><span class="bdg ${(w.jlpt||'').toLowerCase()}">${w.jlpt||''}</span></span></div>
      <div class="ir"><span class="ir-label">வகை</span><span class="ir-val" style="font-size:12px;">${w.wtype||'—'}</span></div>
      <div class="ir"><span class="ir-label">தலைப்பு</span><span class="ir-val" style="font-size:11px;font-family:var(--FT);">${w.topic||'—'}</span></div>
    </div>
    <div class="sec-title">தமிழில் பொருள்</div>
    <div style="background:linear-gradient(135deg,var(--tbg),var(--cardgl));border:1px solid var(--tbd);border-radius:14px;padding:15px;">
      <div style="font-family:var(--FT);font-size:23px;font-weight:700;color:var(--teal);">${w.ta}</div>
      ${w.kana?`<div style="font-family:var(--FM);font-size:12px;color:var(--tx3);margin-top:4px;">கனா: ${w.kana}</div>`:''}
      ${w.rom?`<div style="font-family:var(--FM);font-size:12px;color:var(--tx3);">Romaji: ${w.rom}</div>`:''}
    </div>
    ${w.exjp?`<div class="sec-title">உதாரண வாக்கியம்</div>
    <div class="ex-card" onclick="speak('${(w.exjp||'').replace(/'/g,"\\'")}')">
      <div class="ex-jp">🔊 ${w.exjp}</div><div class="ex-ta">${w.exta||''}</div>
    </div>`:''}
    <div class="sec-title">இலக்கணக் குறிப்பு</div>
    <div style="background:var(--bg3);border-radius:12px;padding:13px;font-family:var(--FT);font-size:12px;color:var(--tx2);line-height:1.8;">${gramNote(w.wtype)}</div>
    ${w.conjugations?`<div class="sec-title">வினைச்சொல் வடிவங்கள்</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
      ${Object.entries(w.conjugations).map(([k,v])=>`<div style="background:var(--ibg);border:1px solid var(--ibd);border-radius:9px;padding:7px 10px;"><div style="font-size:8px;font-weight:700;color:var(--tx3);text-transform:uppercase;font-family:var(--FM);margin-bottom:2px;">${k}</div><div style="font-family:var(--FJ);font-size:14px;font-weight:700;cursor:pointer;color:var(--tx);" onclick="speak('${v}')">${v}</div></div>`).join('')}
    </div>`:w.wtype&&w.wtype.includes('verb')?`<div class="sec-title">வினைச்சொல் வடிவங்கள்</div><div style="background:var(--bg3);border-radius:12px;padding:13px;font-family:var(--FT);font-size:12px;color:var(--tx2);">Learn → Verbs பகுதியில் முழு conjugation காணவும்.</div>`:''}
    ${w.allExamples&&w.allExamples.length>1?`<div class="sec-title">மேலும் உதாரணங்கள்</div>
    ${w.allExamples.slice(1,4).map(e=>`<div class="ex-card" onclick="speak('${(e.jp||'').replace(/'/g,"\'")}')"><div class="ex-jp">🔊 ${e.jp}</div><div class="ex-ta">${e.ta}</div></div>`).join('')}`:''}
    ${w.allMeanings&&w.allMeanings.length>1?`<div class="sec-title">மற்ற பொருட்கள்</div>
    <div style="background:var(--bg3);border-radius:12px;padding:11px;font-family:var(--FT);font-size:12px;color:var(--tx2);line-height:1.9;">
      ${w.allMeanings.map((m,i)=>`<div style="padding:3px 0;">${i+1}. ${m.tamil||''} <span style="color:var(--tx3);font-size:10px;">(${m.english||''})</span></div>`).join('')}
    </div>`:''}
    ${!isL?`<button class="btn btn-t btn-w" style="margin-top:15px;" onclick="markLearned('${(w.jp||'').replace(/'/g,"\\'")}');closeWordDetail();">✓ கற்றேன் (+15 XP)</button>`:
    `<div style="text-align:center;padding:13px;font-family:var(--FT);font-size:12px;color:var(--teal);">✓ ஏற்கனவே கற்றீர்கள்</div>`}`;
  speak(w.jp||'');
  document.getElementById('pg-worddetail').style.display='block';
}
function gramNote(t){
  const n={'verb':'வினைச்சொல் (Verb). て-வடிவம், ます-வடிவம் உண்டு. Learn → Verbs-ல் conjugation காணவும்.','noun':'பெயர்ச்சொல் (Noun). は, が, を particles-உடன் பயன்படும்.','adj-i':'い-adjective. Noun-முன் நேரடியாக வரும். எதிர்மறை: -くない.','adj-na':'な-adjective. Noun-முன் な சேர்க்கவும்.','expr':'வழக்கு வாக்கியம். இப்படியே மனப்பாடம்.'};
  return n[(t||'').toLowerCase()]||'Learn → Grammar பகுதியில் விரிவான விதிகள் காணவும்.';
}
function openKanjiDetail(k){
  const jp=k.jp,on=k.on,kun=k.kun,en=k.en,ta=k.ta,jlpt=k.jlpt,str=k.str,exs=k.exs||[];
  _detailSpeak=jp;
  document.getElementById('wd-header-jp').textContent=jp+'  '+ta;
  const isL=S.learned.includes(jp);
  document.getElementById('wd-body').innerHTML=`
    <div class="kanji-hero" onclick="speak('${jp}')"><div class="kh-char">${jp}</div><div class="kh-ta">${ta}</div><div class="kh-en">${en} · ${str} strokes</div></div>
    <div class="reading-grid">
      <div class="rg-card"><div class="rg-label">音読み ON-YOMI</div><div class="rg-val">${on||'—'}</div><div class="rg-ta" style="color:var(--red);font-size:9px;">சீன-ஜப்பான் ஒலி</div></div>
      <div class="rg-card"><div class="rg-label">訓読み KUN-YOMI</div><div class="rg-val">${kun||'—'}</div><div class="rg-ta" style="color:var(--teal);font-size:9px;">பூர்வீக ஜப்பான் ஒலி</div></div>
    </div>
    <div class="info-row">
      <div class="ir"><span class="ir-label">JLPT</span><span class="ir-val"><span class="bdg ${(jlpt||'').toLowerCase()}">${jlpt}</span></span></div>
      <div class="ir"><span class="ir-label">கோடுகள்</span><span class="ir-val">${str}</span></div>
      <div class="ir"><span class="ir-label">தமிழ்</span><span class="ir-val" style="font-family:var(--FT);font-size:12px;">${ta}</span></div>
    </div>
    <div class="sec-title">ON-YOMI பற்றி</div>
    <div style="background:linear-gradient(135deg,var(--rbg),var(--cardgl));border:1px solid var(--rbd);border-radius:12px;padding:13px;font-family:var(--FT);font-size:12px;color:var(--tx2);line-height:1.8;">
      <b>${on||'—'}</b> சீன மொழியில் இருந்து வந்த ஒலி. கூட்டு சொற்களில் பயன்படும்.
      ${exs[0]?`உதாரணம்: <b style="font-family:var(--FJ);font-size:14px;">${exs[0][0]}</b> (${exs[0][2]})`:''}
    </div>
    ${kun?`<div class="sec-title">KUN-YOMI பற்றி</div>
    <div style="background:linear-gradient(135deg,var(--tbg),var(--cardgl));border:1px solid var(--tbd);border-radius:12px;padding:13px;font-family:var(--FT);font-size:12px;color:var(--tx2);line-height:1.8;">
      <b>${kun}</b> பூர்வீக ஜப்பானிய ஒலி. தனித்த சொற்களில் பயன்படும்.
      ${exs[1]?`உதாரணம்: <b style="font-family:var(--FJ);font-size:14px;">${exs[1][0]}</b> (${exs[1][2]})`:''}
    </div>`:''}
    ${exs.length?`<div class="sec-title">வார்த்தை உதாரணங்கள்</div>
    ${exs.map(e=>`<div class="ex-card" onclick="speak('${e[0].replace(/'/g,"\\'")}')">
      <div class="ex-jp" style="font-family:var(--FJ);font-size:18px;font-weight:700;">🔊 ${e[0]} <span style="font-family:var(--FM);font-size:9px;color:var(--tx3);">${e[1]}</span></div>
      <div class="ex-ta">${e[2]}</div></div>`).join('')}`:''}
    ${!isL?`<button class="btn btn-t btn-w" style="margin-top:15px;" onclick="markLearned('${jp}');closeWordDetail();">+ கற்றேன் (+15 XP)</button>`:''}`;
  speak(jp);
  document.getElementById('pg-worddetail').style.display='block';
}
function openKanaDetail(rom,hira,kata,ta,row){
  _detailSpeak=hira;
  document.getElementById('wd-header-jp').textContent=hira+' '+kata;
  const rowData=KANA_ROWS.find(r=>r.row===row);
  document.getElementById('wd-body').innerHTML=`
    <div class="kanji-hero" onclick="speak('${hira}')">
      <div style="display:flex;gap:24px;justify-content:center;align-items:flex-end;margin-bottom:8px;">
        <div style="text-align:center;"><div style="font-family:var(--FJ);font-size:74px;font-weight:900;line-height:1;color:var(--tx);">${hira}</div><div style="font-size:10px;color:var(--tx3);margin-top:4px;">ஹிராகனா</div></div>
        <div style="text-align:center;"><div style="font-family:var(--FJ);font-size:58px;font-weight:700;line-height:1;opacity:.8;color:var(--tx);">${kata}</div><div style="font-size:10px;color:var(--tx3);margin-top:4px;">கட்டகனா</div></div>
      </div>
      <div class="kh-ta">${ta}</div><div class="kh-en" style="font-family:var(--FM);font-size:17px;font-weight:700;letter-spacing:2px;">${rom.toUpperCase()}</div>
    </div>
    <div class="info-row">
      <div class="ir"><span class="ir-label">ஒலிப்பு</span><span class="ir-val" style="font-family:var(--FM);">${rom}</span></div>
      <div class="ir"><span class="ir-label">தமிழ்</span><span class="ir-val" style="font-family:var(--FT);">${ta}</span></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:13px;">
      <div style="background:linear-gradient(135deg,var(--ibg),var(--cardgl));border:1px solid var(--ibd);border-radius:12px;padding:13px;text-align:center;cursor:pointer;" onclick="speak('${hira}')">
        <div style="font-family:var(--FJ);font-size:44px;font-weight:900;color:var(--tx);">🔊 ${hira}</div>
        <div style="font-family:var(--FT);font-size:10px;color:var(--tx2);margin-top:4px;">ஜப்பானிய வார்த்தைகளுக்கு</div>
      </div>
      <div style="background:linear-gradient(135deg,var(--gbg),var(--cardgl));border:1px solid var(--gbd);border-radius:12px;padding:13px;text-align:center;cursor:pointer;" onclick="speak('${kata}')">
        <div style="font-family:var(--FJ);font-size:44px;font-weight:700;color:var(--tx);">🔊 ${kata}</div>
        <div style="font-family:var(--FT);font-size:10px;color:var(--tx2);margin-top:4px;">வெளிநாட்டு வார்த்தைகளுக்கு</div>
      </div>
    </div>
    ${rowData?`<div class="sec-title">அதே வரிசையில்</div>
    <div class="kana-detail-grid">${rowData.cells.map(c=>c[0]?`<div class="kd-cell" onclick="openKanaDetail('${c[0]}','${c[1]}','${c[2]}','${c[3]}','${row.replace(/'/g,"\\'")}')"><span style="font-family:var(--FJ);font-size:21px;font-weight:700;display:block;color:var(--tx);">${c[1]}</span><span style="font-family:var(--FM);font-size:9px;color:var(--tx3);display:block;">${c[0]}</span><span style="font-family:var(--FT);font-size:7.5px;color:var(--teal);display:block;">${c[3]}</span></div>`:'<div></div>').join('')}</div>`:''}`;
  speak(hira);
  document.getElementById('pg-worddetail').style.display='block';
}
function openGramDetail(g){
  _detailSpeak=g.jp||'';
  document.getElementById('wd-header-jp').textContent=g.jp+'  '+g.fn;
  document.getElementById('wd-body').innerHTML=`
    <div class="kanji-hero" style="background:linear-gradient(135deg,var(--ibg),var(--vbg));">
      <div style="font-family:var(--FJ);font-size:54px;font-weight:900;color:${g.col||'var(--ind)'};">${g.jp}</div>
      <div style="font-family:var(--FD);font-size:17px;font-weight:700;margin-top:7px;color:var(--tx);">${g.name}</div>
      <div style="font-family:var(--FT);font-size:12px;color:var(--tx2);">${g.fn}</div>
      <span class="bdg ${(g.jlpt||'').toLowerCase()}" style="margin-top:9px;display:inline-block;">${g.jlpt}</span>
    </div>
    <div class="sec-title">தமிழில் விளக்கம்</div>
    <div style="background:var(--bg3);border-radius:12px;padding:15px;font-family:var(--FT);font-size:13px;color:var(--tx2);line-height:1.9;">${g.desc||''}</div>
    ${g.maps?.length?`<div class="sec-title">தமிழ் சமகாரம்</div>
    ${g.maps.map(m=>`<div style="display:flex;align-items:center;gap:9px;padding:10px 13px;background:linear-gradient(135deg,var(--rbg),var(--cardgl));border:1px solid var(--rbd);border-radius:12px;margin-bottom:7px;">
      <span style="font-family:var(--FT);font-size:14px;font-weight:700;color:var(--red);min-width:62px;">${m.s}</span>
      <span style="color:var(--tx3);">→</span>
      <span style="font-family:var(--FT);font-size:12px;color:var(--tx2);">${m.d}</span>
    </div>`).join('')}`:''}
    <div class="sec-title">உதாரண வாக்கியங்கள்</div>
    ${(g.exs||[]).map(e=>`<div class="ex-card" onclick="speak('${(e.jp||'').replace(/'/g,"\\'")}')">
      <div class="ex-jp">🔊 ${e.jp}</div><div style="font-family:var(--FM);font-size:8.5px;color:var(--tx3);margin:2px 0;">${e.rom}</div><div class="ex-ta">${e.ta}</div>
    </div>`).join('')}`;
  document.getElementById('pg-worddetail').style.display='block';
}
function closeWordDetail(){document.getElementById('pg-worddetail').style.display='none';}
function speakDetailWord(){if(_detailSpeak)speak(_detailSpeak);}



// ── PROFILE ──────────────────────────────────────────────────────
const AVATARS=['🐼','🦊','🐯','🐻','🦁','🐸','🐧','🐨','🦄','🐙','🎌','🌸'];
function openProfOverlay(){
  document.getElementById('profOv').classList.add('on');
  profData?showProfMain():showProfLogin();
}
function closeProfOverlay(){document.getElementById('profOv').classList.remove('on');}
document.getElementById('profOv')?.addEventListener('click',e=>{if(e.target===document.getElementById('profOv'))closeProfOverlay();});
function showProfLogin(){
  document.getElementById('prof-login-view').style.display='block';
  document.getElementById('prof-main-view').style.display='none';
  window._selAv=AVATARS[0];
  document.getElementById('avatarRow').innerHTML=AVATARS.map(a=>
    `<div class="pa ${a===window._selAv?'on':''}" onclick="selAv(this,'${a}')">${a}</div>`).join('');
}
function selAv(el,av){window._selAv=av;document.querySelectorAll('.pa').forEach(p=>p.classList.remove('on'));el.classList.add('on');}
function createProfile(){
  const name=document.getElementById('profNameInp').value.trim()||'கற்பவர்';
  profData={name,avatar:window._selAv||'🐼',createdAt:Date.now(),activities:[]};
  localStorage.setItem('nt5_prof',JSON.stringify(profData));
  updateProfBtn();showProfMain();
}
function deleteProfile(){if(!confirm('சுயவிவரத்தை நீக்கவா?'))return;profData=null;localStorage.removeItem('nt5_prof');updateProfBtn();showProfLogin();}
function updateProfBtn(){const b=document.getElementById('profBtn');if(b)b.textContent=profData?profData.avatar:'👤';}
function showProfMain(){
  document.getElementById('prof-login-view').style.display='none';
  document.getElementById('prof-main-view').style.display='block';
  if(!profData)return;
  document.getElementById('profAv').textContent=profData.avatar;
  document.getElementById('profName').textContent=profData.name;
  document.getElementById('profLvl').textContent=`JLPT ${S.jlpt} · ${S.learned.length} வார்த்தைகள்`;
  document.getElementById('ps-xp').textContent=S.xp;
  document.getElementById('ps-w').textContent=S.learned.length;
  document.getElementById('ps-str').innerHTML=`<span class="fire">🔥</span>${S.streak}`;
  renderActLog();renderHeatmap();
}
function logActivity(icon,text){
  if(!profData)return;
  profData.activities=profData.activities||[];
  profData.activities.unshift({icon,text,ts:Date.now()});
  if(profData.activities.length>50)profData.activities=profData.activities.slice(0,50);
  localStorage.setItem('nt5_prof',JSON.stringify(profData));
}
function renderActLog(){
  const acts=(profData?.activities||[]).slice(0,12);
  document.getElementById('actLog').innerHTML=acts.length?acts.map(a=>{
    const d=new Date(a.ts),time=d.getHours()+':'+String(d.getMinutes()).padStart(2,'0');
    return `<div class="act-item"><span class="act-ic">${a.icon}</span><span>${a.text}</span><span class="act-time">${time}</span></div>`;
  }).join(''):'<div style="padding:10px;text-align:center;font-size:11px;color:var(--tx3);font-family:var(--FT);">இன்னும் செயல்கள் பதிவு இல்லை</div>';
}
function renderHeatmap(){
  const hm=document.getElementById('heatmap');if(!hm)return;
  const acts=profData?.activities||[],now=Date.now();
  hm.innerHTML=Array.from({length:28},(_,i)=>{
    const ds=now-((27-i)*86400000),de=ds+86400000;
    const cnt=acts.filter(a=>a.ts>=ds&&a.ts<de).length;
    const lvl=cnt===0?0:cnt<=2?1:cnt<=5?2:cnt<=9?3:4;
    return `<div class="hm-cell l${lvl}" title="${cnt} செயல்கள்"></div>`;
  }).join('');
}

// ── SETTINGS ─────────────────────────────────────────────────────
document.getElementById('settingsBtn')?.addEventListener('click',()=>{
  document.getElementById('sov').classList.add('on');
  document.getElementById('ss-w').textContent=S.learned.length;
  document.getElementById('ss-q').textContent=Object.keys(S.quizH).length;
  document.getElementById('ss-x').textContent=S.xp;
  document.querySelectorAll('.lopt').forEach(o=>o.classList.toggle('on',o.dataset.lang===S.lang));
});
function closeSett(){document.getElementById('sov').classList.remove('on');}
document.getElementById('sov')?.addEventListener('click',e=>{if(e.target===document.getElementById('sov'))closeSett();});
function resetProg(){if(!confirm('முன்னேற்றத்தை மீட்டமைக்கவா?'))return;S={xp:0,streak:0,learned:[],quizH:{},jlpt:S.jlpt,lang:S.lang,kS:{r:0,t:0}};saveS();updXp();renderHome();showToast('மீட்டமைக்கப்பட்டது');closeSett();}

// ── LOADING ───────────────────────────────────────────────────────
const LD_MSGS=['அனிமே படங்களை ஏற்றுகிறோம்...','Jikan API இல் இருந்து...','கன்ஜி கற்றல் தயார்...','இலக்கண பாடங்கள்...','சொல்வளம் ஏற்றுகிறோம்...','ஜப்பானிய பயணம் தொடங்குகிறது! 🎌'];
async function loadApp(){
  const st=document.getElementById('ldStatus');let mi=0;
  const iv=setInterval(()=>{if(st)st.textContent=LD_MSGS[mi%LD_MSGS.length];mi++;},500);
  try{
    const to=new Promise((_,r)=>setTimeout(()=>r('timeout'),3500));
    const rq=fetch('https://api.jikan.moe/v4/top/anime?type=tv&filter=bypopularity&limit=20');
    const res=await Promise.race([rq,to]);
    const data=await res.json();
    animeCache=data.data||[];
    const tids=['food','school','family','nature','transport','body','time','emotions','colors','shopping','work','culture'];
    tids.forEach((tid,i)=>{if(animeCache[i])topicAnimeMap[tid]=animeCache[i].images?.jpg?.image_url||animeCache[i].images?.jpg?.small_image_url||'';});
  }catch{animeCache=[];}
  clearInterval(iv);
  if(st)st.textContent='தயார்! さあ、始めよう！ 🎌';
  await new Promise(r=>setTimeout(r,300));
  const loader=document.getElementById('loader');
  if(loader){loader.style.display='none';loader.style.visibility='hidden';loader.style.zIndex='-1';}
  try{
    setLang(S.lang||'ta');
    document.querySelectorAll('.jp-pill').forEach(p=>p.classList.toggle('on',p.dataset.l===S.jlpt));
    updateProfBtn();renderHome();renderKanaPage();
  }catch(e){console.error('Init error:',e);try{renderHome();}catch{}}
}


// ── Motivational messages ────────────────────────────────────
const MOTIV_MSGS = [
  {icon:'🌸', text:'すばらしい！ நீங்கள் அற்புதம்!', sub:'இன்று நன்றாக படித்தீர்கள்!'},
  {icon:'🎌', text:'がんばって！ தொடர்ந்து முயல்க!', sub:'ஜப்பான் கனவு நெருங்குகிறது!'},
  {icon:'⭐', text:'すごい！ மிகவும் நன்று!', sub:'உங்கள் முயற்சி பலிக்கிறது!'},
  {icon:'🔥', text:'நாள் தொடர் தொடர்க!', sub:'தினமும் கற்பதே வெற்றியின் ரகசியம்.'},
  {icon:'🏆', text:'おめでとう！ வாழ்த்துக்கள்!', sub:'இலக்கை நோக்கி தொடர்ந்து செல்லுங்கள்!'},
  {icon:'💪', text:'できる！ உங்களால் முடியும்!', sub:'ஒவ்வொரு வார்த்தையும் ஒரு படி!'},
  {icon:'🌟', text:'日本語が上手！', sub:'தமிழ் வழியில் ஜப்பானியம் — உங்கள் பயணம்!'},
];
function getMotivMsg(){const idx=(Math.floor(Date.now()/86400000)+(S?.learned?.length||0))%MOTIV_MSGS.length;return MOTIV_MSGS[idx];}
function showMotivBanner(container){
  document.getElementById('motivBanner')?.remove();
  if(!S||S.xp<15)return;
  const m=getMotivMsg();
  const el=document.createElement('div');el.id='motivBanner';el.className='motiv-banner';
  el.innerHTML=`<div class="motiv-icon">${m.icon}</div><div><div class="motiv-text">${m.text}</div><div class="motiv-sub">${m.sub}</div></div>`;
  if(container?.firstChild)container.insertBefore(el,container.firstChild);
}
function getQuizMotiv(score,total){
  const p=total>0?score/total:0;
  if(p===1)return'🌟 完璧！ முழு மதிப்பெண்! நீங்கள் மேதாவி!';
  if(p>=.8)return'🎌 すごい！ மிகவும் நன்று!';
  if(p>=.6)return'💪 がんばった！ நல்ல முயற்சி!';
  if(p>=.4)return'🌸 もう一度！ மீண்டும் try செய்யுங்கள்!';
  return'🔥 練習が大切！ பயிற்சியே வெற்றி!';
}

// ── Daily goal bar ────────────────────────────────────────────
const DAILY_GOAL=5;
function renderDailyGoalBar(){
  document.getElementById('dailyGoalBar')?.remove();
  const wotd=document.querySelector('.wotd');if(!wotd)return;
  const start=new Date();start.setHours(0,0,0,0);
  const done=(profData?.activities||[]).filter(a=>a.text?.includes('கற்றேன்')&&a.ts>=start.getTime()).length;
  const pct=Math.min(100,Math.round(done/DAILY_GOAL*100));
  const bar=document.createElement('div');bar.id='dailyGoalBar';bar.className='daily-goal-bar';
  bar.innerHTML=`<div class="dg-icon">🎯</div><div class="dg-info"><div class="dg-label">இன்றைய இலக்கு — ${done}/${DAILY_GOAL} வார்த்தைகள்</div><div class="dg-bar-wrap"><div class="dg-bar-fill" style="width:${pct}%"></div></div></div><div class="dg-pct">${pct}%</div>`;
  wotd.parentNode.insertBefore(bar,wotd);
}

// ── Welcome modal ─────────────────────────────────────────────
function buildWelcomeModal(){
  if(document.getElementById('welcomeOv'))return;
  const steps=[
    {num:1,icon:'あ',title:'கனா கற்று தொடங்குங்கள்',desc:'ஹிராகனா & கட்டகனா — கீழே "கனா" tab-ஐ tap செய்யுங்கள்.'},
    {num:2,icon:'🎯',title:'தினமும் quiz போடுங்கள்',desc:'N5 வார்த்தைகள், கன்ஜி, இலக்கணம் — quiz மூலம் XP சம்பாதியுங்கள்.'},
    {num:3,icon:'📖',title:'அகராதி பயன்படுத்துங்கள்',desc:'Header 📖 button → 506+ வார்த்தைகள் தமிழ் விளக்கத்துடன் தேடலாம்.'},
  ];
  const html=`<div id="welcomeOv"><div class="welcome-box">
    <div class="wb-banner"><span class="wb-kanji">語</span><div class="wb-title">NihongoTamil</div><div class="wb-greeting">வணக்கம்! 🇯🇵❤️ N5-ல் இருந்து ஆரம்பிப்போம்?</div></div>
    <div class="wb-steps">${steps.map(s=>`<div class="wb-step"><div class="wb-step-num">${s.num}</div><div class="wb-step-icon" style="font-family:var(--FJ);">${s.icon}</div><div><div class="wb-step-title">${s.title}</div><div class="wb-step-desc">${s.desc}</div></div></div>`).join('')}</div>
    <div class="wb-footer"><button class="wb-btn" onclick="closeWelcome(true)">🌸 தொடங்கு — N5 பயணம்!</button><div class="wb-skip" onclick="closeWelcome(false)">இப்போது வேண்டாம்</div></div>
  </div></div>`;
  document.body.insertAdjacentHTML('beforeend',html);
}
function openWelcome(){buildWelcomeModal();document.getElementById('welcomeOv')?.classList.add('on');}
function closeWelcome(go){
  const el=document.getElementById('welcomeOv');
  if(el){el.style.opacity='0';el.style.transition='opacity .3s';setTimeout(()=>el.remove(),300);}
  localStorage.setItem('nt5_welcomed','1');
  if(go&&typeof switchPage==='function')switchPage('kana');
}
function renderJourneyCta(){
  const pc=document.querySelector('#pg-home .pc');
  if(!pc||document.getElementById('journeyCta'))return;
  if((S?.xp||0)>0||(S?.learned?.length||0)>0)return;
  const cta=document.createElement('div');cta.id='journeyCta';cta.className='journey-cta show';
  cta.innerHTML=`<div class="jc-title">🌸 N5 Japanese பயணம் தொடங்கு!</div><div class="jc-sub">தமிழ் வழியில் ஜப்பானியம் கற்க வரவேற்கிறோம்</div><div class="jc-stats"><div class="jc-stat">506 வார்த்தைகள்</div><div class="jc-stat">284 கன்ஜி</div><div class="jc-stat">42 Grammar</div></div><button class="jc-btn" onclick="closeJourneyCta();switchPage('quiz');">▶ இப்போதே தொடங்கு!</button>`;
  if(pc.children[1])pc.insertBefore(cta,pc.children[1]);else pc.appendChild(cta);
}
function closeJourneyCta(){document.getElementById('journeyCta')?.remove();}


// Kanji rain
(function(){
  const chars='日月火水木金土山川人学生先校語文書読話聞食飲見行来帰時年国体手目心花桜';
  const c=document.getElementById('kanjiRain');if(!c)return;
  for(let i=0;i<22;i++){
    const s=document.createElement('span');s.className='ld-kr';
    s.textContent=chars[Math.floor(Math.random()*chars.length)];
    s.style.left=Math.random()*100+'%';
    s.style.animationDuration=(3+Math.random()*5)+'s';
    s.style.animationDelay=Math.random()*5+'s';
    s.style.fontSize=(16+Math.random()*20)+'px';
    c.appendChild(s);
  }
})();

// Multiple load triggers
window.addEventListener('load',()=>setTimeout(loadApp,200));
window.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('profOv')?.addEventListener('click',e=>{if(e.target===document.getElementById('profOv'))closeProfOverlay();});
  if(!localStorage.getItem('nt5_welcomed')){setTimeout(openWelcome,900);}
  // Failsafe: force hide loader after 7s
  setTimeout(()=>{
    const l=document.getElementById('loader');
    if(l&&l.style.display!=='none'){l.style.display='none';l.style.visibility='hidden';l.style.zIndex='-1';try{renderHome();}catch{}}
  },7000);
});
