import { Challenge, STAGES, ending, scoreGame } from './game.js';
import { stories } from './story.js';
const screen = document.querySelector('#screen');
const route = document.querySelector('#route');
const pauseButton = document.querySelector('#pause');
const pauseDialog = document.querySelector('#pause-dialog');
let stage = 0, line = 0, results = [], game = null, phase = 'home';
let countdown = 3, paused = false, lastFrame = performance.now(), heldPointer = null;
const debugParams = new URLSearchParams(location.search);
const localDebug = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
let debugSeed = Number(debugParams.get('seed') || 1) >>> 0;
function random() {
  if (!localDebug || !debugParams.has('seed')) return Math.random();
  debugSeed = (Math.imul(1664525, debugSeed) + 1013904223) >>> 0;
  return debugSeed / 4294967296;
}
let muted = false;
try { muted = localStorage.getItem('mrt-muted') === 'true'; } catch {}
let audio;
function beep(good = true) {
  if (muted) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.connect(gain); gain.connect(audio.destination);
    oscillator.frequency.value = good ? 660 : 180;
    gain.gain.setValueAtTime(.035, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .12);
    oscillator.start(); oscillator.stop(audio.currentTime + .13);
  } catch {}
}
function art(kind) {
  if (kind === 'elder') return '<img class="elder character" src="./assets/characters/elder-potbelly-v12.png" alt="堅持要讓座的阿伯">';
  if (kind === 'odor') return '<div class="person odor-man" role="img" aria-label="抬起手臂的吊嘎大哥"><span class="arm left-arm"></span><span class="arm right-arm"></span><span class="head">ಠ‿ಠ</span><span class="body">汗</span></div>';
  if (kind === 'legs') return '<div class="person legs-man" role="img" aria-label="張開雙腿的 89 男"><span class="head">⌐■_■</span><span class="body">89</span><span class="leg left-leg"></span><span class="leg right-leg"></span></div>';
  return '<div class="station-sign">理智線終點站<small>LAST STOP · KEEP CALM</small></div>';
}
function updateRoute() {
  route.innerHTML = STAGES.map((s, i) => `<span class="${phase !== 'home' && i === stage ? 'current' : ''} ${i < results.length ? 'complete' : ''}">${['讓座','消臭','合腿','下車'][i]}</span>`).join('');
}
function setPhase(next) {
  phase = next; updateRoute();
  pauseButton.hidden = !['countdown', 'play'].includes(phase);
}
function home() {
  game = null; results = []; stage = 0; paused = false;
  setPhase('home');
  screen.innerHTML = `<div class="hero"><div class="ticket">通勤生存挑戰 / 單人乘車券</div><h1>下一站，<br><em>理智斷線。</em></h1><p>上車靠運氣，下車靠實力。<br>四場荒謬挑戰，你能帶幾分下車？</p>${art('elder')}<div class="hero-bottom"><span>約 3–5 分鐘 · 手機／電腦都能玩</span><button class="primary" data-action="board">刷卡上車 →</button><small>虛構搞笑情境。友善乘車，請勿模仿攻擊行為。</small></div></div>`;
}
function opening() {
  results = []; stage = 0; line = 0; game = null; heldPointer = null;
  setPhase('opening');
  screen.innerHTML = `<div class="scene">${art('crowd')}</div><div class="dialogue"><span class="speaker">你 · 普通通勤族</span><p>下班了。你只想安靜搭車，平安回家。<br>車門即將關閉，今天的奇人異事卻才正要開始。</p><button class="primary" data-action="enter">走進車廂 →</button></div>`;
}
function dialogue() {
  setPhase('dialogue');
  const story = stories[stage];
  screen.innerHTML = `<div class="scene">${art(story.art)}<span class="scene-label">${String(stage + 1).padStart(2,'0')} / ${STAGES[stage].title}</span></div><div class="dialogue"><span class="speaker">${story.name}</span><p>${story.lines[line]}</p><button class="primary" data-action="next">${line === story.lines.length - 1 ? '看看怎麼玩' : '繼續'} →</button><small>${line + 1} / ${story.lines.length}</small></div>`;
}
function tutorial() {
  setPhase('tutorial');
  screen.innerHTML = `<div class="scene">${art(stories[stage].art)}</div><div class="dialogue"><span class="speaker">第 ${stage + 1} 關 · ${STAGES[stage].duration} 秒</span><h2>${STAGES[stage].title}</h2><p>${stories[stage].instruction}</p><small>${stage === 0 || stage === 3 ? '也可以使用鍵盤 ← →' : '滑鼠點擊或手指點按；長按不會連發'}</small><button class="primary" data-action="start">準備好了，開始！</button></div>`;
}
function start() {
  game = new Challenge(stage, random); countdown = 3; paused = false;
  lastFrame = performance.now(); setPhase('countdown');
  screen.innerHTML = `<div class="hud"><span id="time"></span><strong id="score"></strong></div><div class="arena ${game.id}" id="arena">${stage === 3 ? '<div class="lanes"></div><div class="judgment-line">下車線</div><span id="player" aria-label="玩家">你</span>' : art(game.id)}<div id="targets"></div>${stage === 0 ? '<img id="kick" src="./assets/props/sneaker.svg" alt="踢出的球鞋">' : stage === 1 ? '<img class="spray-bottle" src="./assets/props/spray.svg" alt="芳香劑"><div id="spray-burst"></div>' : ''}<div id="effect" aria-live="polite"></div><div id="countdown"></div></div><div class="controls">${stage === 0 ? '<button data-input="0">← 踢左</button><button data-input="1">踢右 →</button>' : stage === 3 ? '<button data-input="-1">← 往左</button><button data-input="1">往右 →</button>' : stage === 2 ? '<button data-input="0" class="primary">合起來！</button>' : '<p>點綠色臭氣，還車廂一口好空氣。</p>'}</div><p class="play-hint" id="hint"></p>`;
  renderGame();
}
function renderGame() {
  if (!game) return;
  document.querySelector('#time').textContent = `剩 ${Math.ceil(game.duration - game.time)} 秒`;
  document.querySelector('#score').textContent = `${scoreGame(game)} 分`;
  document.querySelector('#countdown').textContent = phase === 'countdown' ? Math.ceil(countdown) : '';
  const hint = document.querySelector('#hint');
  if (stage === 0) {
    const elder = screen.querySelector('.elder');
    elder.style.left = game.side === 0 ? '26%' : '74%';
    elder.classList.toggle('spent', game.attempted);
    hint.textContent = `第 ${game.round + 1} / ${game.total} 回合 · 命中 ${game.hits} 次${game.attempted ? ' · 等待下一回合' : ''}`;
  } else if (stage === 1) {
    const targets = document.querySelector('#targets');
    const active = game.activeTargets;
    for (const child of [...targets.children]) if (!active.some(t => t.id === Number(child.dataset.target))) child.remove();
    for (const t of active) {
      let button = targets.querySelector(`[data-target="${t.id}"]`);
      if (!button) { button = document.createElement('button'); button.className = 'odor-cloud'; button.dataset.target = t.id; button.setAttribute('aria-label','消滅臭氣'); button.textContent = '臭'; targets.append(button); }
      const age = game.time - t.at;
      button.style.left = `calc(50% + ${(t.id % 2 ? 1 : -1) * (70 + age * (8 + t.x / 8))}px)`;
      button.style.top = `calc(100% - ${180 + age * 35}px)`;
    }
    hint.textContent = `已消滅 ${game.hits} / ${game.total} 團`;
  } else if (stage === 2) {
    screen.querySelector('.legs-man').style.setProperty('--spread', `${40 * (1 - game.hits / game.total)}deg`);
    hint.textContent = `合腿進度 ${Math.round(game.hits / game.total * 100)}% · ${game.hits} / ${game.total} 次`;
  } else {
    document.querySelector('#player').style.left = `${(game.lane + .5) / 3 * 100}%`;
    document.querySelector('#targets').innerHTML = game.activeTargets.map(t => `<span class="commuter" style="left:${(t.lane + .5) / 3 * 100}%;top:${8 + (game.time - t.at) / 3 * 74}%" aria-label="迎面人群">${['急','擠','衝'][t.id % 3]}</span>`).join('');
    hint.textContent = `閃過 ${game.hits} 人 · 碰撞 ${game.misses} 次`;
  }
}
let effectUntil = 0;
function effect(text, good) {
  const el = document.querySelector('#effect');
  if (!el) return;
  el.textContent = text; el.className = good ? 'good' : 'bad'; effectUntil = performance.now() + 450;
  beep(good);
}
function input(value) {
  if (phase !== 'play' || paused) return;
  const cloud = stage === 1 ? document.querySelector(`[data-target="${value}"]`) : null;
  const result = game.input(value);
  if (result !== null && stage === 0) {
    const kick = document.querySelector('#kick');
    kick.style.left = value === 0 ? '26%' : '74%';
    kick.classList.remove('kicking'); void kick.offsetWidth; kick.classList.add('kicking');
  }
  if (result && cloud) {
    const burst = document.querySelector('#spray-burst');
    burst.style.left = cloud.style.left; burst.style.top = cloud.style.top;
    burst.classList.remove('spraying'); void burst.offsetWidth; burst.classList.add('spraying');
  }
  if (result !== null) effect(stage === 0 ? (result ? '踢中！💥' : '踢空！') : stage === 1 ? '噴！✦' : stage === 2 ? '收！' : '閃！', result);
  renderGame();
  if (game.done) finish();
}
function finish() {
  if (phase !== 'play') return;
  beep(true);
  results.push(game.result); setPhase('feedback');
  screen.innerHTML = `<div class="scene">${art(stories[stage].art)}</div><div class="dialogue"><span class="speaker">本段完成</span><h2>${game.result.score}<small> / 100 分</small></h2><p>${stories[stage].feedback[game.result.score >= 60 ? 1 : 0]}</p><button class="primary" data-action="advance">${stage === 3 ? '看看我的通勤成績' : '下一段旅程'} →</button></div>`;
  if (stage === 2) screen.querySelector('.legs-man').style.setProperty('--spread', `${40 * (1 - game.hits / game.total)}deg`);
}
function resultScreen() {
  setPhase('result');
  const total = results.reduce((sum, r) => sum + r.score, 0), result = ending(total);
  screen.innerHTML = `<div class="results"><div class="ticket">本日乘車證明 / JOURNEY COMPLETE</div><div class="result-face" aria-hidden="true">${total < 160 ? '(╥﹏╥)' : total < 280 ? '(•̀ᴗ•́)و' : '(⌐■_■)✧'}</div><p>恭喜下車！你的稱號是</p><h1>${result.title}</h1><div class="total">${total}<small> / 400</small></div><p>${result.text}</p><ol>${results.map((r,i) => `<li><span>${['讓座反應','芳香消臭','連點合腿','下車閃躲'][i]}</span><strong>${r.score} <small>/ 100</small></strong></li>`).join('')}</ol><button class="primary" data-action="share">分享我的通勤成績 ↗</button><button data-action="download">下載成績卡</button><p id="share-status" role="status"></p><div class="result-actions"><button data-action="replay">再搭一班</button><button data-action="home">回首頁</button></div></div>`;
}
function pause() {
  if (!['play','countdown'].includes(phase) || paused) return;
  paused = true; game.paused = true; heldPointer = null; pauseDialog.showModal();
}
function resume() { paused = false; if (game) game.paused = false; lastFrame = performance.now(); pauseDialog.close(); }
pauseButton.onclick = pause;
document.querySelector('#resume').onclick = resume;
document.querySelector('#restart').onclick = () => { resume(); home(); };
pauseDialog.addEventListener('cancel', e => { e.preventDefault(); resume(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('blur', pause);
const soundButton = document.querySelector('#sound');
function soundLabel() { soundButton.textContent = `音效：${muted ? '關' : '開'}`; soundButton.setAttribute('aria-pressed', String(muted)); }
soundButton.onclick = () => { muted = !muted; try { localStorage.setItem('mrt-muted', muted); } catch {} soundLabel(); beep(); };
soundLabel();
screen.addEventListener('click', e => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  beep();
  if (action === 'board' || action === 'replay') opening();
  if (action === 'enter') dialogue();
  if (action === 'next') { line++; line < stories[stage].lines.length ? dialogue() : tutorial(); }
  if (action === 'start') start();
  if (action === 'advance') { if (stage === 3) resultScreen(); else { stage++; line = 0; dialogue(); } }
  if (action === 'home') home();
  if (action === 'share' || action === 'download') shareCard(action === 'share');
});
screen.addEventListener('pointerdown', e => {
  const target = e.target.closest('[data-input], [data-target]');
  if (!target || !e.isPrimary || e.button !== 0 || heldPointer !== null) return;
  e.preventDefault(); heldPointer = e.pointerId;
  input(Number(target.dataset.input ?? target.dataset.target));
});
for (const event of ['pointerup','pointercancel']) window.addEventListener(event, e => { if (e.pointerId === heldPointer) heldPointer = null; });
window.addEventListener('keydown', e => {
  if (e.repeat || paused || phase !== 'play') return;
  if ((stage === 0 || stage === 3) && ['ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault(); input(e.key === 'ArrowLeft' ? (stage === 0 ? 0 : -1) : 1); }
  if (stage === 2 && e.code === 'Space') { e.preventDefault(); input(0); }
});
async function shareCard(share) {
  const status = document.querySelector('#share-status');
  status.textContent = '正在製作成績卡…';
  try {
    const total = results.reduce((sum, r) => sum + r.score, 0), result = ending(total);
    const canvas = document.createElement('canvas'); canvas.width = 720; canvas.height = 960;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#123d42'; ctx.fillRect(0,0,720,960);
    ctx.fillStyle = '#f8f3df'; ctx.fillRect(40,40,640,880);
    ctx.fillStyle = '#123d42'; ctx.textAlign = 'center';
    ctx.font = 'bold 26px sans-serif'; ctx.fillText('捷運迷因冒險 / 本日乘車證明',360,110);
    ctx.font = 'bold 54px sans-serif'; ctx.fillText(result.title,360,215);
    ctx.font = 'bold 112px sans-serif'; ctx.fillText(String(total),360,360);
    ctx.font = '24px sans-serif'; ctx.fillText('/ 400 分',360,405); ctx.fillText(result.text,360,470);
    results.forEach((r,i) => { ctx.textAlign = 'left'; ctx.fillText(['讓座反應','芳香消臭','連點合腿','下車閃躲'][i],110,560+i*65); ctx.textAlign = 'right'; ctx.fillText(`${r.score} / 100`,610,560+i*65); });
    ctx.textAlign = 'center'; ctx.font = '22px sans-serif'; ctx.fillText('上車靠運氣，下車靠實力。',360,860);
    const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/png'));
    if (!blob) throw new Error('image');
    const file = new File([blob], 'mrt-score.png', { type: 'image/png' });
    if (share && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: '捷運迷因冒險', text: `我是${result.title}，通勤戰鬥力 ${total} 分！` }); status.textContent = '成績卡已分享。'; return; }
      catch (error) { if (error.name === 'AbortError') { status.textContent = '已取消分享，仍可下載成績卡。'; return; } }
    }
    const url = URL.createObjectURL(blob), anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'mrt-score.png'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    status.textContent = share ? '此裝置未完成原生分享，已改為下載圖片。' : '成績卡已下載。';
  } catch { status.textContent = '成績卡製作失敗，請再試一次。'; }
}
function frame(now) {
  const dt = Math.max(0, (now - lastFrame) / 1000); lastFrame = now;
  if (!paused && phase === 'countdown') { countdown -= dt; if (countdown <= 0) setPhase('play'); renderGame(); }
  else if (!paused && phase === 'play') {
    const hits = game.hits, misses = game.misses;
    game.tick(dt);
    if (stage === 3 && game.misses > misses) effect('撞到啦！', false);
    else if (stage === 3 && game.hits > hits) effect('成功閃過！', true);
    renderGame(); if (game.done) finish();
  }
  if (now > effectUntil) { const effect = document.querySelector('#effect'); if (effect) effect.textContent = ''; }
  requestAnimationFrame(frame);
}
home();
if (localDebug && debugParams.has('stage')) {
  const selected = STAGES.findIndex(s => s.id === debugParams.get('stage'));
  if (selected >= 0) {
    stage = selected;
    results = STAGES.slice(0, stage).map(s => ({ id: s.id, score: 0 }));
    tutorial();
  }
}
requestAnimationFrame(frame);
