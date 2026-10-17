// Builds a static design scaffold from the live app's own render functions.
// Usage: node build-scaffold.js <path to index.html> <output path>
const fs = require('fs');
const [src, outPath] = process.argv.slice(2);
const html = fs.readFileSync(src, 'utf8');
// The app self-hosts its fonts in fonts/. The scaffold lives in design/, so point one level up.
const appCss = html.match(/<style>([\s\S]*?)<\/style>/)[1].replace(/url\(fonts\//g, 'url(../fonts/');
const appJs = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// Minimal browser stubs so the app script can load in Node.
const stubs = `
const el = () => ({ innerHTML: '', textContent: '', content: '', classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
  addEventListener() {}, querySelectorAll() { return []; }, querySelector() { return el(); }, setAttribute() {}, remove() {}, appendChild() {}, dataset: {}, style: {} });
globalThis.document = { getElementById: el, querySelector: el, querySelectorAll: () => [], addEventListener() {}, documentElement: { dataset: {} }, body: el(), createElement: el };
globalThis.localStorage = { getItem() { return null; }, setItem() {} };
globalThis.window = { scrollTo() {} };
`;

const collect = `
db = sampleData(); ver++;
const T = today();
const out = { components: {}, screens: {} };
const C = out.components, S = out.screens;

C.ring = ring();
C.hormone = hormoneChart(M().L, M().day);
C.week = weekStrip();
C.faces = [1, 2, 3, 4, 5].map(m => face(m));
C.icons = Object.entries(I);
C.phases = PHASE_KEYS.map(k => [k, PHASES[k].name]);
C.goodStretch = goodStretchCard(M());

ui.tab = 'today';
const tabbar = () => vTabbar();
ui.ob.step = 0; S.welcome = vOnboard();
ui.ob.step = 2; S.onboardLength = vOnboard();
ui.tab = 'today'; S.today = vToday() + tabbar();

openFlow(T);
Object.assign(ui.flow.d, { mood: 4, feelings: ['Calm', 'Focused'], symptoms: ['Cravings'], note: 'A slow coffee before work and a short walk at lunch.' });
S.flow = STEPS.map((name, i) => { ui.flow.step = i; ui.flow.shown = i; return [name, '<div class="flow">' + vFlow() + '</div>']; });
ui.flow = null;

ui.tab = 'calendar'; S.calendar = vCalendar() + tabbar();
S.daySheet = vCalendar() + tabbar() + vDaySheet(addDays(T, -2));
ui.tab = 'journey'; S.journey = vJourney() + tabbar();
ui.tab = 'learn'; S.learn = vLearn() + tabbar();
ui.tab = 'today'; S.settings = vToday() + tabbar() + vSettings();
ui.ask = { title: 'Delete all data?', text: 'This removes every period and check-in from this device. It cannot be undone. Export a backup first if you want to keep them.', yes: 'Delete everything' };
S.ask = vToday() + tabbar() + vSettings().replace('class="backdrop"', 'class="backdrop" style="display:none"') + vAsk();
module.exports = out;
`;

const tmp = require('path').join(__dirname, '.app-render.js');
fs.writeFileSync(tmp, stubs + appJs + collect);
const { components: C, screens: S } = require(tmp);
fs.unlinkSync(tmp);
const I = Object.fromEntries(C.icons);

const frame = (label, inner, fixed) => `<figure class="frame"><div class="device${fixed ? ' fixed' : ''}">${inner}</div><figcaption>${label}</figcaption></figure>`;
const spec = (name, note, inner) => `<div class="spec"><div class="spec-head"><code>${name}</code><span>${note}</span></div><div class="spec-body">${inner}</div></div>`;

const page = `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>phase. design scaffold</title>
<style>
/* =====================================================================
   APP STYLES: copied 1:1 from index.html. Restyle these.
   Keep the class names so the result can be ported back into the app.
   ===================================================================== */
${appCss}

/* =====================================================================
   SCAFFOLD-ONLY STYLES: layout of this sheet. Not part of the app.
   ===================================================================== */
.sc{max-width:1240px;margin:0 auto;padding:32px 24px 80px}
.sc *{animation:none!important}
.sc-top{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap;margin-bottom:28px}
.sc-top h1{font-family:var(--serif);font-weight:500;font-size:44px;letter-spacing:-.02em}
.sc-top p{color:var(--ink2);max-width:640px;margin-top:8px}
.sc h2.sec-title{font-family:var(--serif);font-weight:500;font-size:30px;margin:56px 0 6px}
.sc p.sec-note{color:var(--muted);margin-bottom:20px;max-width:680px}
.sc-brief{background:var(--card);border-radius:22px;padding:20px 24px;color:var(--ink2);font-size:15px}
.sc-brief ul{margin:8px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:4px}
.swatches{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.sw{background:var(--card);border-radius:18px;overflow:hidden;font-size:12.5px}
.sw i{display:block;height:64px;border-bottom:1px solid var(--line)}
.sw div{padding:10px 12px;display:flex;flex-direction:column;gap:2px}
.sw code{font-weight:600;color:var(--ink)}
.sw span{color:var(--muted)}
.type-row{display:grid;grid-template-columns:200px 1fr;gap:16px;align-items:baseline;padding:14px 0;border-bottom:1px solid var(--line)}
.type-row code{font-size:12px;color:var(--muted)}
.specs{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:16px}
.spec{background:color-mix(in srgb,var(--ink) 3%,var(--bg));border:1px solid var(--line);border-radius:22px;overflow:hidden;min-width:0}
.spec-head{display:flex;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid var(--line);font-size:12.5px}
.spec-head code{font-weight:600}
.spec-head span{color:var(--muted);text-align:right}
.spec-body{padding:20px 16px;display:flex;flex-direction:column;gap:12px}
.row-inline{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.icons{display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:10px}
.icons div{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:11px;color:var(--muted)}
.frames{display:flex;flex-wrap:wrap;gap:28px;align-items:flex-start}
.frame{margin:0;display:flex;flex-direction:column;gap:10px}
.frame figcaption{font-size:13px;color:var(--muted);text-align:center}
.device{width:390px;position:relative;background:var(--bg);border-radius:44px;overflow:hidden;box-shadow:0 0 0 1px var(--line),0 24px 60px rgba(0,0,0,.08)}
.device.fixed{height:844px}
.device .screen{padding-top:56px;padding-bottom:110px}
.device .tabbar,.device .flow,.device .sheet,.device .backdrop,.device .toast{position:absolute}
.spec .tabbar{position:absolute}
.device .flow{min-height:0!important;height:100%}
.device .flow-top{padding-top:56px}
.device .sheet{max-height:80%}
.theme-toggle{display:flex;background:var(--chip);border-radius:18px;padding:4px}
.theme-toggle button{padding:8px 14px;border-radius:14px;font-size:14px;color:var(--ink2)}
.theme-toggle button.on{background:var(--card);color:var(--ink);font-weight:600}
@media (max-width:440px){.device{width:100%}.type-row{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="sc">

<header class="sc-top">
  <div>
    <div class="eyebrow">Design scaffold</div>
    <h1>phase.</h1>
    <p>A calm period tracker with a daily check-in and hormone-based insights. The style is inspired by the Stoic journaling app. Everything below uses the app's real CSS and markup, rendered with sample data.</p>
  </div>
  <div class="theme-toggle" role="group" aria-label="Theme">
    <button class="on" data-theme-set="light">Light</button><button data-theme-set="dark">Dark</button>
  </div>
</header>

<div class="sc-brief">
  <b>Brief for restyling</b>
  <ul>
    <li>Mobile first: screens are 390px wide. Keep touch targets at 44px or more.</li>
    <li>Keep the class names, so the new styles can be copied back into <code>index.html</code>.</li>
    <li>Every color is a token on <code>:root</code>, with dark values under <code>[data-theme=dark]</code>. Light theme is used in the day and dark in the evening.</li>
    <li>The five phase colors carry meaning (menstrual, follicular, ovulation, luteal, late luteal). They passed colorblind and contrast checks on both themes. If you change them, keep neighbours easy to tell apart.</li>
    <li>Text always uses the ink tokens. Phase colors appear only on marks: dots, ring, bars, calendar fills.</li>
    <li>Tone: calm and warm. The app leads with what is on her side in each phase, not with symptoms.</li>
  </ul>
</div>

<h2 class="sec-title">Tokens</h2>
<p class="sec-note">Swatches read the live tokens, so they switch with the theme toggle.</p>
<div class="swatches">
${[['--bg', 'Page', '#F4F3F0 / #000000'], ['--card', 'Card surface', '#FFFFFF / #1A1A19'], ['--ink', 'Primary text, primary button', '#141414 / #F2F1EE'], ['--ink2', 'Secondary text', '#4E4C48 / #C4C1BB'], ['--muted', 'Labels, captions', '#8B8984 / #85837E'], ['--line', 'Dividers, empty states', '#E6E3DD / #2A2928'], ['--chip', 'Ghost buttons, tags', '#ECEAE5 / #232322']]
  .map(([t, use, hex]) => `<div class="sw"><i style="background:var(${t})"></i><div><code>${t}</code><span>${use}</span><span>${hex}</span></div></div>`).join('')}
${C.phases.map(([k, n]) => `<div class="sw"><i style="background:var(--${k})"></i><div><code>--${k}</code><span>${n} phase</span></div></div>`).join('')}
</div>

<div class="card" style="margin-top:16px">
  <div class="type-row"><code>--serif 76 / 500</code><span class="serif" style="font-size:76px;font-weight:500;line-height:1">17</span></div>
  <div class="type-row"><code>.step h1 · serif 34</code><span class="step" style="flex:none"><h1>How are you feeling today?</h1></span></div>
  <div class="type-row"><code>.hello · serif 32</code><span class="hello">Good morning.</span></div>
  <div class="type-row"><code>.card h2 · serif 26</code><span class="serif" style="font-size:26px;font-weight:500">Lighter days are close</span></div>
  <div class="type-row"><code>blockquote · serif 23</code><span class="serif" style="font-size:23px">“Very little is needed to make a happy life.”</span></div>
  <div class="type-row"><code>body · --sans 16</code><span>Cramps usually peak on days 1 and 2.</span></div>
  <div class="type-row"><code>.lede · sans 16 ink2</code><span class="lede" style="margin:0">Estrogen climbs steadily as an egg matures.</span></div>
  <div class="type-row"><code>.fine · sans 13 muted</code><span class="fine" style="margin:0">Typical patterns, not rules.</span></div>
  <div class="type-row"><code>.eyebrow · sans 12 caps</code><span class="eyebrow">Looking ahead</span></div>
  <div class="type-row"><code>radius</code><span>Cards 28 (<code>--r</code>) · stat tiles and lists 22 · chips 22 · tags 12 · buttons are pills</span></div>
</div>

<h2 class="sec-title">Components</h2>
<p class="sec-note">Each block shows a component and its states, with the class name to style.</p>
<div class="specs">
${spec('.btn', 'primary, ghost, period, disabled, link', `
  <div class="row-inline"><button class="btn">Continue</button><button class="btn ghost">Period ended today</button></div>
  <div class="row-inline"><button class="btn period">Period started today</button><button class="btn" disabled>Disabled</button><button class="link">Start fresh</button></div>`)}
${spec('.btn.light', 'on inverted cards', `<div class="card invert"><button class="btn light">Begin check-in</button></div>`)}
${spec('.icon-btn · .streak', 'header actions', `<div class="row-inline"><button class="streak on">${I.flame}<span>7</span></button><button class="streak">${I.flame}<span>0</span></button><button class="icon-btn">${I.gear}</button></div>`)}
${spec('.chip', 'multi-select, off and on', `<div class="chips" style="margin:0"><button class="chip on">Calm</button><button class="chip">Content</button><button class="chip on">Focused</button><button class="chip">Anxious</button><button class="chip">Tired</button></div>`)}
${spec('.tag · .ev', 'read-only labels', `<div class="tags" style="margin:0"><span class="tag">Calm</span><span class="tag">Cravings · 32%</span><span class="tag">medium flow</span></div><div><span class="ev" style="margin:0">strong</span> <span class="ev">moderate</span> <span class="ev">weak</span></div>`)}
${spec('.seg', 'bleeding amount, single select', `<div class="seg" style="margin:0"><button class="none">None</button><button>Spotting</button><button class="on">Light</button><button>Medium</button><button>Heavy</button></div><div class="seg" style="margin:0"><button class="on none">None</button><button>Spotting</button><button>Light</button><button>Medium</button><button>Heavy</button></div>`)}
${spec('.pill-seg · .mini-step', 'settings controls', `<div class="row-inline"><div class="pill-seg"><button class="on">Auto</button><button>Light</button><button>Dark</button></div><div class="mini-step"><button>−</button><span>28</span><button>+</button></div></div>`)}
${spec('.faces', 'mood scale 1–5, "Good" selected', `<div class="faces" style="margin:8px 0 0">${C.faces.map((f, i) => `<button class="${i === 3 ? 'on' : ''}">${f.replace('class="face"', '')}${['Awful', 'Low', 'Okay', 'Good', 'Great'][i]}</button>`).join('')}</div>`)}
${spec('input[type=range]', 'energy slider with live label', `<div class="slider-wrap" style="margin:0"><div class="big">Good energy</div><input type="range" min="1" max="5" value="4" aria-label="Energy"><div class="ends"><span>Empty</span><span>Full</span></div></div>`)}
${spec('.stepper', 'onboarding number input', `<div class="stepper" style="margin:0"><button>−</button><div class="n">28</div><button>+</button></div><div class="stepper-unit">days</div>`)}
${spec('.progress', 'check-in progress, step 3 of 5', `<div class="progress"><i class="on"></i><i class="on"></i><i class="on"></i><i></i><i></i></div>`)}
${spec('.eyebrow · .dot', 'section labels', `<div class="eyebrow"><span class="dot" style="background:var(--luteal)"></span>Luteal phase · day 17</div><div class="eyebrow">${I.rise} Looking ahead</div>`)}
${spec('.week', 'week strip: logged period, expected, fertile, ovulation, today, check-in dot', C.week)}
${spec('.ring', 'cycle ring: phase arcs, fertile arc, today marker', `<div class="hero">${C.ring}</div>`)}
${spec('.hchart', 'schematic hormone curves + phase band', `<div>${C.hormone}</div>`)}
${spec('.card.lift', 'Looking ahead: tinted by current phase', `<section class="card lift" style="--tint:var(--luteal)"><div class="eyebrow">${I.rise} Looking ahead</div><h2>Progesterone is at work</h2><p class="lede">It peaks about a week after ovulation. For many people it brings calmer, sleepier evenings.</p><div class="next"><span>Progesterone peaks</span><b>in 5 days · Mon 19 Oct</b></div><p class="mine"><span class="eyebrow">From your log</span>In this phase you often log calm (50%) and content (45%).</p></section>`)}
${spec('.card.invert.checkin', 'check-in card, before and after', `<section class="card invert checkin"><div class="eyebrow">${I.sun} Morning check-in</div><h2>How are you feeling this morning?</h2><button class="btn light">Begin check-in</button></section><section class="card invert checkin"><div class="eyebrow">${I.moon} Evening reflection</div><div class="done">${C.faces[3]}<div><div style="font-weight:600">You checked in · Good</div><div class="tags"><span class="tag">Calm</span><span class="tag">Focused</span></div></div></div></section>`)}
${spec('.card.quote · .card.echo', 'daily quote, one cycle ago', `<section class="card quote"><div class="eyebrow" style="margin-bottom:14px">Daily stoic</div><blockquote>“Very little is needed to make a happy life.”</blockquote><cite>Marcus Aurelius</cite></section><section class="card echo"><div class="eyebrow">One cycle ago · day 17</div><div class="echo-row">${C.faces[3]}<div><div style="font-weight:600">You felt good</div><div class="tags"><span class="tag">Calm</span><span class="tag">Content</span></div></div></div><p class="note">“Dinner with friends, lots of laughing.”</p></section>`)}
${spec('.stat', 'Journey number tiles', `<div class="stats"><div class="stat"><div class="eyebrow">Avg cycle</div><div class="v">29<small>days</small></div><div class="s">range 27–30</div></div><div class="stat"><div class="eyebrow">Streak</div><div class="v">7<small>days</small></div><div class="s">keep it going</div></div></div>`)}
${spec('.bar-row', 'average mood by phase', `<div class="bars" style="margin:0">${[['menstrual', 3.0], ['follicular', 3.9], ['ovulatory', 4.3], ['luteal', 3.4], ['premenstrual', 2.5]].map(([k, v]) => `<div class="bar-row"><span>${C.phases.find(p => p[0] === k)[1]}</span><div class="track"><div class="fill" style="width:${v / 5 * 100}%;background:var(--${k})"></div></div><span class="val">${v.toFixed(1)}</span></div>`).join('')}</div>`)}
${spec('.mchart', 'Your good stretch: mood per cycle day', C.goodStretch || '<p class="fine">Needs sample data.</p>')}
${spec('.list · .row', 'settings rows', `<div class="list" style="margin:0"><div class="row"><span>Usual cycle length</span><div class="mini-step"><button>−</button><span>28</span><button>+</button></div></div><button class="row"><span>Export backup</span><span class="r">.json</span></button><button class="row danger"><span>Delete all data</span></button></div>`)}
${spec('details', 'Learn accordion, closed and inline variant', `<details><summary>When to see a doctor</summary><div class="body"><ul><li>Bleeding for more than 7 days</li></ul></div></details><details class="mild"><summary>What may also come up</summary><ul><li>Bloating, sore breasts and headaches are common.</li></ul></details>`)}
${spec('.banner · .note-card · .toast', 'notices', `<div class="banner"><span>You are looking at sample data.</span><button class="link">Start fresh</button></div><section class="card note-card"><h3>Worth mentioning to a doctor</h3><ul><li>A period lasted longer than 7 days.</li></ul></section><div class="toast" style="position:static;transform:none;align-self:flex-start">Period start saved.</div>`)}
${spec('.tabbar', 'floating tab bar', `<div style="position:relative;height:70px">${S.today.slice(S.today.indexOf('<nav class="tabbar">'))}</div>`)}
${spec('icons', 'inline SVG, 1.6 stroke', `<div class="icons">${C.icons.map(([k, svg]) => `<div>${svg}${k}</div>`).join('')}</div>`)}
</div>

<h2 class="sec-title">Screens</h2>
<p class="sec-note">Full screens at phone size. Sheets and the check-in flow are shown over the screen they open from.</p>
<div class="frames">
${frame('Welcome', S.welcome, true)}
${frame('Onboarding · question', S.onboardLength, true)}
${frame('Today', S.today)}
${S.flow.map(([n, h]) => frame('Check-in · ' + n, h, true)).join('\n')}
${frame('Calendar', S.calendar)}
${frame('Calendar · day sheet', S.daySheet, true)}
${frame('Journey', S.journey)}
${frame('Learn', S.learn)}
${frame('Settings sheet', S.settings, true)}
${frame('Confirm sheet', S.ask, true)}
</div>

</div>
<script>
// Scaffold only: light/dark toggle.
document.querySelectorAll('[data-theme-set]').forEach(b => b.addEventListener('click', () => {
  document.documentElement.dataset.theme = b.dataset.themeSet;
  document.querySelectorAll('[data-theme-set]').forEach(x => x.classList.toggle('on', x === b));
}));
</script>
</body>
</html>
`;
fs.writeFileSync(outPath, page);
console.log('wrote', outPath, Math.round(page.length / 1024) + ' KB');
