import { Challenge, STAGES, ending, scoreGame, odorPosition } from './game.js?v=legs2';
import { stories } from './story.js?v=legs2';
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
const elderSprites = ['elder-potbelly-v12.png', 'elder-v12-bruised.png', 'elder-v12-battered.png', 'elder-v12-down.png'];
for (const file of [...elderSprites, 'legs-wojak-open-v2.png', 'legs-wojak-half-v2.png', 'legs-wojak-closed-v2.png']) { const img = new Image(); img.src = `./assets/characters/${file}`; }
function elderState() { return game.hits >= 12 ? 3 : game.hits >= 8 ? 2 : game.hits >= 4 ? 1 : 0; }
function kickSound(hit) {
  if (muted) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume();
    const now = audio.currentTime, osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(hit ? 170 : 390, now);
    osc.frequency.exponentialRampToValueAtTime(hit ? 42 : 100, now + .16);
    gain.gain.setValueAtTime(hit ? .22 : .06, now); gain.gain.exponentialRampToValueAtTime(.001, now + .2);
    osc.connect(gain); gain.connect(audio.destination); osc.start(); osc.stop(now + .21);
  } catch {}
}
function art(kind) {
  if (kind === 'urine') return '<img class="urine-man character" src="./assets/characters/black-passenger-wojak-action-v1.png" alt="花襯衫、藍短褲的黑人 Wojak 乘客">';
  if (kind === 'elder') return '<img class="elder character" src="./assets/characters/elder-potbelly-v12.png" alt="堅持要讓座的阿伯">';
  if (kind === 'odor') return '<img class="odor-man character" src="./assets/characters/odor-seated-wojak-v2.png" alt="坐在正對面、雙手抬起的 Wojak 吊嘎大哥">';
  if (kind === 'legs') return '<img class="legs-man character" src="./assets/characters/legs-wojak-open-v2.png" alt="張開雙腿的 Wojak 乘客" data-pose="0">';
  return '<div class="station-sign">理智線終點站<small>LAST STOP · KEEP CALM</small></div>';
}
function updateRoute() {
  route.innerHTML = STAGES.map((s, i) => `<span class="${phase !== 'home' && i === stage ? 'current' : ''} ${i < results.length ? 'complete' : ''}">${['接尿','讓座','消臭','合腿','下車'][i]}</span>`).join('');
}
function setPhase(next) {
  phase = next; screen.dataset.stage = STAGES[stage].id; updateRoute();
  pauseButton.hidden = !['countdown', 'play'].includes(phase);
}
function home() {
  game = null; results = []; stage = 0; paused = false;
  setPhase('home');
  screen.innerHTML = `<div class="hero"><div class="ticket">通勤生存挑戰 / 單人乘車券</div><h1>下一站，<br><em>理智斷線。</em></h1><p>上車靠運氣，下車靠實力。<br>五場荒謬挑戰，你能帶幾分下車？</p>${art('elder')}<div class="hero-bottom"><span>約 3–5 分鐘 · 手機／電腦都能玩</span><button class="primary" data-action="board">刷卡上車 →</button><small>虛構搞笑情境。友善乘車，請勿模仿攻擊行為。</small></div></div>`;
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
  screen.innerHTML = `<div class="scene">${art(stories[stage].art)}</div><div class="dialogue"><span class="speaker">第 ${stage + 1} 關 · ${STAGES[stage].duration} 秒</span><h2>${STAGES[stage].title}</h2><p>${stories[stage].instruction}</p><small>${['urine','crowd'].includes(STAGES[stage].id) ? '也可以使用鍵盤 ← →' : '滑鼠點擊或手指點按；長按不會連發'}</small><button class="primary" data-action="start">準備好了，開始！</button></div>`;
}
function start() {
  game = new Challenge(stage, random); countdown = 3; paused = false;
  lastFrame = performance.now(); setPhase('countdown');
  screen.innerHTML = `<div class="hud"><span id="time"></span><strong id="score"></strong></div><div class="arena ${game.id}" id="arena">${STAGES[stage].id === 'crowd' ? '<div class="lanes"></div><div class="judgment-line">下車線</div><div id="player" aria-label="玩家"><img src="./assets/characters/commuter-wojak-v1.png" alt=""><span>你</span></div>' : art(game.id)}<div id="targets"></div>${game.id === 'urine' ? '<svg class="urine-stream" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path id="stream-path"/></svg><div id="seat-stains"></div><div class="catch-markers"><span>左</span><span>中</span><span>右</span></div><img id="bucket" src="./assets/props/urine-bucket-wojak-v1.png" alt="接尿桶">' : ''}${STAGES[stage].id === 'elder' ? '<img id="kick" src="./assets/props/kick-wojak-v1.png" alt="踢出的球鞋"><div id="impact" aria-hidden="true">✦</div>' : STAGES[stage].id === 'odor' ? '<img class="spray-bottle" src="./assets/props/deodorizer-wojak-v1.png" alt="Wojak 除臭劑"><svg class="spray-jet" aria-hidden="true"><path/></svg><div id="spray-burst"></div>' : ''}${game.id === 'legs' ? '<div class="legs-taunt" id="legs-taunt"></div><img id="push-hand" src="./assets/props/push-hand-wojak-v1.png" alt="推膝蓋的手掌"><span id="push-impact" aria-hidden="true">✦</span>' : ''}<div id="effect" aria-live="polite"></div><div id="countdown"></div></div><div class="controls">${STAGES[stage].id === 'elder' ? '<p>直接點老人！12 次命中擊倒 · 點空也會消耗出腳機會</p>' : ['urine','crowd'].includes(game.id) ? '<button data-input="-1">← 往左</button><button data-input="1">往右 →</button>' : STAGES[stage].id === 'legs' ? '<button data-input="0" class="primary">推回去！</button>' : '<p>點掉 Wojak 臭氣！越後面越快，一團一噴。</p>'}</div><p class="play-hint" id="hint"></p>`;
  renderGame();
}
function renderLegPose() {
  const actor = screen.querySelector('.legs-man');
  const pose = game.hits >= game.total ? 2 : game.hits >= game.total / 2 ? 1 : 0;
  if (actor.dataset.pose !== String(pose) || !actor.src.endsWith('-v2.png')) {
    actor.dataset.pose = pose;
    actor.src = `./assets/characters/legs-wojak-${['open', 'half', 'closed'][pose]}-v2.png`;
  }
  actor.alt = ['囂張張腿的 89 男', '氣到臉紅、咬牙抵抗的 89 男', '雙腿合攏、氣昏的 89 男'][pose];
  const taunt = document.querySelector('#legs-taunt');
  if (taunt) taunt.textContent = pose === 2 ? '你給我記住……我先暈一下。' : pose === 1 ?
    (game.hits < 55 ? '我有練腿欸！你不要逼我！' : '下次找你算帳！先讓我撐住！') :
    (game.hits < 15 ? '這不是開腿，是我的結界。' : '欸欸！你推到我的氣場了！');
}
function pushLegs() {
  const actor = screen.querySelector('.legs-man'), arena = document.querySelector('#arena');
  const box = actor.getBoundingClientRect(), area = arena.getBoundingClientRect();
  const width = Math.min(box.width, box.height * 640 / 724), height = width * 724 / 640;
  const x = box.left - area.left + (box.width - width) / 2 + width * .35;
  const y = box.top - area.top + (box.height - height) / 2 + height * .62;
  const hand = document.querySelector('#push-hand');
  const handWidth = Math.min(240, arena.clientWidth * .6);
  hand.style.width = `${handWidth}px`;
  hand.style.left = `${x - handWidth * .85}px`;
  hand.style.top = `${y - handWidth * 2 / 3 * .35}px`;
  const impact = document.querySelector('#push-impact');
  impact.style.left = `${x}px`; impact.style.top = `${y}px`;
  for (const element of [hand, actor, impact]) {
    element.classList.remove('pushing'); void element.offsetWidth; element.classList.add('pushing');
  }
}
function renderGame() {
  if (!game) return;
  document.querySelector('#time').textContent = `剩 ${Math.ceil(game.duration - game.time)} 秒`;
  document.querySelector('#score').textContent = `${scoreGame(game)} 分`;
  document.querySelector('#countdown').textContent = phase === 'countdown' ? Math.ceil(countdown) : '';
  const hint = document.querySelector('#hint');
  if (game.id === 'urine') {
    const arenaBox = document.querySelector('#arena').getBoundingClientRect();
    const actorBox = document.querySelector('.urine-man').getBoundingClientRect();
    const spriteWidth = Math.min(actorBox.width, actorBox.height * 2 / 3);
    const spriteHeight = spriteWidth * 1.5;
    const sourceX = (actorBox.left - arenaBox.left + (actorBox.width - spriteWidth) / 2 + spriteWidth * .56) / arenaBox.width * 100;
    const sourceY = (actorBox.top - arenaBox.top + (actorBox.height - spriteHeight) / 2 + spriteHeight * .57) / arenaBox.height * 100;
    const active = game.activeTargets;
    const upcoming = active[0];
    document.querySelector('#bucket').style.left = `${20 + game.lane * 30}%`;
    document.querySelector('#targets').innerHTML = active.map(t => {
      const progress = (game.time - t.at) / 1.5;
      const x = sourceX + (20 + t.lane * 30 - sourceX) * progress;
      const y = sourceY + (77 - sourceY) * progress * progress;
      return `<img class="urine-drop" src="./assets/props/urine-drop-wojak-v1.png" style="left:${x}%;top:${y}%" alt="落向${['左','中','右'][t.lane]}側的尿滴">`;
    }).join('');
    const path = document.querySelector('#stream-path');
    path.setAttribute('d', upcoming ? `M${sourceX} ${sourceY} Q${(sourceX + 20 + upcoming.lane * 30) / 2} ${sourceY} ${20 + upcoming.lane * 30} 77` : '');
    document.querySelectorAll('.catch-markers span').forEach((el, i) => el.classList.toggle('next', upcoming?.lane === i));
    document.querySelector('#seat-stains').innerHTML = [0,1,2].map(lane => {
      const misses = game.targets.filter(t => t.resolved && !t.hit && t.lane === lane).length;
      return misses ? `<span class="seat-stain" style="left:${20 + lane * 30}%;opacity:${Math.min(.8,.25+misses*.1)}"></span>` : '';
    }).join('');
    hint.textContent = `接住 ${game.hits} / ${game.total} · 漏接 ${game.misses}${upcoming ? ` · 下一滴：${['左','中','右'][upcoming.lane]}` : ''}`;
  } else if (STAGES[stage].id === 'elder') {
    const elder = screen.querySelector('img.elder');
    elder.style.left = game.side === 0 ? '26%' : '74%';
    elder.src = `./assets/characters/${elderSprites[elderState()]}`;
    elder.classList.toggle('spent', game.attempted);
    elder.classList.toggle('down', elderState() === 3);
    hint.textContent = `命中 ${game.hits} / 12 · ${['還在嘴硬', '輕微瘀青', '鼻青臉腫', '倒地！'][elderState()]}${game.attempted ? ' · 換位中' : ' · 快點！'}`;
  } else if (STAGES[stage].id === 'odor') {
    const targets = document.querySelector('#targets');
    const active = game.activeTargets;
    for (const child of [...targets.children]) if (!active.some(t => t.id === Number(child.dataset.target))) child.remove();
    for (const t of active) {
      let button = targets.querySelector(`[data-target="${t.id}"]`);
      if (!button) {
        button = document.createElement('button'); button.className = 'odor-cloud';
        button.dataset.target = t.id; button.setAttribute('aria-label', `消滅臭氣 ${t.id + 1}`);
        button.innerHTML = '<img src="./assets/props/odor-cloud-wojak-v1.png" alt="" draggable="false">';
        targets.append(button);
      }
      const arena = document.querySelector('#arena');
      const actorBox = screen.querySelector('.odor-man').getBoundingClientRect();
      const arenaBox = arena.getBoundingClientRect();
      const width = Math.min(actorBox.width, actorBox.height * 2 / 3);
      const height = width * 1.5;
      const side = t.slot % 2 ? 1 : -1;
      const sourceX = arena.clientWidth / 2 + side * width * .23;
      const sourceY = actorBox.top - arenaBox.top + (actorBox.height - height) / 2 + height * .25;
      const point = odorPosition(t, game.time, arena.clientWidth, arena.clientHeight, sourceX, sourceY);
      button.style.left = `${point.x}px`;
      button.style.top = `${point.y}px`;
      button.classList.toggle('urgent', t.at + t.lifetime - game.time < .65);
    }
    const intensity = game.time < 9 ? '雙團來襲' : game.time < 17 ? '三團加速' : '四團暴走';
    hint.textContent = `${intensity} · 消滅 ${game.hits}/${game.total} · 漏掉 ${game.misses}`;
  } else if (STAGES[stage].id === 'legs') {
    renderLegPose();
    hint.textContent = `合腿進度 ${Math.round(game.hits / game.total * 100)}% · ${game.hits} / ${game.total} 次`;
  } else {
    document.querySelector('#player').style.left = `${(game.lane + .5) / 3 * 100}%`;
    document.querySelector('#targets').innerHTML = game.activeTargets.map(t => `<img src="./assets/characters/commuter-wojak-v1.png" class="commuter" style="left:${(t.lane + .5) / 3 * 100}%;top:${8 + (game.time - t.at) / 3 * 74}%" alt="迎面人群">`).join('');
    hint.textContent = `閃過 ${game.hits} 人 · 碰撞 ${game.misses} 次`;
  }
}
let effectUntil = 0;
function effect(text, good) {
  const el = document.querySelector('#effect');
  if (!el) return;
  el.textContent = text; el.className = good ? 'good' : 'bad'; effectUntil = performance.now() + 450;
  if (STAGES[stage].id === 'elder') kickSound(good); else beep(good);
}
function input(value) {
  if (phase !== 'play' || paused) return;
  const cloud = STAGES[stage].id === 'odor' ? document.querySelector(`[data-target="${value}"]`) : null;
  const result = game.input(value);
  if (result !== null && STAGES[stage].id === 'elder') {
    const kick = document.querySelector('#kick');
    kick.style.left = game.side === 0 ? '26%' : '74%';
    const impact = document.querySelector('#impact');
    impact.style.left = kick.style.left;
    impact.classList.remove('burst');
    if (result) { void impact.offsetWidth; impact.classList.add('burst'); }
    kick.classList.remove('kicking'); void kick.offsetWidth; kick.classList.add('kicking');
  }
  if (result && cloud) {
    const burst = document.querySelector('#spray-burst');
    burst.style.left = cloud.style.left; burst.style.top = cloud.style.top;
    burst.classList.remove('spraying'); void burst.offsetWidth; burst.classList.add('spraying');
    const arena = document.querySelector('#arena');
    const jet = screen.querySelector('.spray-jet');
    jet.setAttribute('viewBox', `0 0 ${arena.clientWidth} ${arena.clientHeight}`);
    jet.querySelector('path').setAttribute('d', `M${arena.clientWidth - 80} ${arena.clientHeight - 115} L${parseFloat(cloud.style.left)} ${parseFloat(cloud.style.top)}`);
    jet.classList.remove('spraying'); void jet.getBoundingClientRect(); jet.classList.add('spraying');
    const bottle = screen.querySelector('.spray-bottle');
    bottle.classList.remove('pumping'); void bottle.offsetWidth; bottle.classList.add('pumping');
  }
  if (result && game.id === 'legs') pushLegs();
  if (result !== null && game.id !== 'urine') effect(STAGES[stage].id === 'elder' ? (result ? '踢中！💥' : '踢空！') : STAGES[stage].id === 'odor' ? '噴！✦' : STAGES[stage].id === 'legs' ? '擠回去！' : '閃！', result);
  renderGame();
  if (game.done && STAGES[stage].id === 'elder' && phase === 'play') {
    setPhase('knockdown');
    setTimeout(() => { if (phase === 'knockdown') { phase = 'play'; finish(); } }, 850);
  } else if (game.done && game.id === 'legs') {
    setPhase('legs-faint');
    screen.querySelector('.legs-man').classList.add('fainted');
    screen.querySelector('[data-input]').disabled = true;
    effect('氣場已收納。本人已斷線。', true);
    setTimeout(() => { if (phase === 'legs-faint') { phase = 'play'; finish(); } }, 1100);
  } else if (game.done) finish();
}
function finish() {
  if (phase !== 'play') return;
  beep(true);
  results.push(game.result); setPhase('feedback');
  screen.innerHTML = `<div class="scene">${art(stories[stage].art)}</div><div class="dialogue"><span class="speaker">本段完成</span><h2>${game.result.score}<small> / 100 分</small></h2><p>${stories[stage].feedback[game.result.score >= 60 ? 1 : 0]}</p><button class="primary" data-action="advance">${STAGES[stage].id === 'crowd' ? '看看我的通勤成績' : '下一段旅程'} →</button></div>`;
  if (STAGES[stage].id === 'elder') { const elder = screen.querySelector('img.elder'); elder.src = `./assets/characters/${elderSprites[elderState()]}`; elder.classList.toggle('down', elderState() === 3); }
  if (STAGES[stage].id === 'legs') renderLegPose();
}
function resultScreen() {
  setPhase('result');
  const total = results.reduce((sum, r) => sum + r.score, 0), result = ending(total);
  screen.innerHTML = `<div class="results"><div class="ticket">本日乘車證明 / JOURNEY COMPLETE</div><div class="result-face" aria-hidden="true">${total < 200 ? '(╥﹏╥)' : total < 350 ? '(•̀ᴗ•́)و' : '(⌐■_■)✧'}</div><p>恭喜下車！你的稱號是</p><h1>${result.title}</h1><div class="total">${total}<small> / 500</small></div><p>${result.text}</p><ol>${results.map((r,i) => `<li><span>${['座椅接尿','讓座反應','芳香消臭','連點合腿','下車閃躲'][i]}</span><strong>${r.score} <small>/ 100</small></strong></li>`).join('')}</ol><button class="primary" data-action="share">分享我的通勤成績 ↗</button><button data-action="download">下載成績卡</button><p id="share-status" role="status"></p><div class="result-actions"><button data-action="replay">再搭一班</button><button data-action="home">回首頁</button></div></div>`;
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
  if (action === 'advance') { if (STAGES[stage].id === 'crowd') resultScreen(); else { stage++; line = 0; dialogue(); } }
  if (action === 'home') home();
  if (action === 'share' || action === 'download') shareCard(action === 'share');
});
screen.addEventListener('pointerdown', e => {
  if (STAGES[stage].id === 'elder' && phase === 'play' && e.target.closest('#arena')) {
    if (!e.isPrimary || e.button !== 0 || heldPointer !== null) return;
    e.preventDefault(); heldPointer = e.pointerId;
    input(e.target.matches('img.elder')); return;
  }
  const target = e.target.closest('[data-input], [data-target]');
  if (!target || !e.isPrimary || e.button !== 0 || heldPointer !== null) return;
  e.preventDefault(); heldPointer = e.pointerId;
  input(Number(target.dataset.input ?? target.dataset.target));
});
for (const event of ['pointerup','pointercancel']) window.addEventListener(event, e => { if (e.pointerId === heldPointer) heldPointer = null; });
window.addEventListener('keydown', e => {
  if (e.repeat || paused || phase !== 'play') return;
  if (['urine','crowd'].includes(STAGES[stage].id) && ['ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault(); input(e.key === 'ArrowLeft' ? -1 : 1); }
  if (STAGES[stage].id === 'legs' && e.code === 'Space') { e.preventDefault(); input(0); }
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
    ctx.font = '24px sans-serif'; ctx.fillText('/ 500 分',360,405); ctx.fillText(result.text,360,470);
    results.forEach((r,i) => { ctx.textAlign = 'left'; ctx.fillText(['座椅接尿','讓座反應','芳香消臭','連點合腿','下車閃躲'][i],110,540+i*58); ctx.textAlign = 'right'; ctx.fillText(`${r.score} / 100`,610,540+i*58); });
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
    if (game.id === 'urine' && (game.misses > misses || game.hits > hits)) {
      const caught = game.hits > hits;
      effect(caught ? '接住了！' : '座椅濕了！', caught);
      const bucket = document.querySelector('#bucket');
      bucket.classList.remove('caught'); if (caught) { void bucket.offsetWidth; bucket.classList.add('caught'); }
    }
    if (game.id === 'odor' && game.misses > misses) effect('臭氣擴散！', false);
    if (STAGES[stage].id === 'crowd' && game.misses > misses) effect('撞到啦！', false);
    else if (STAGES[stage].id === 'crowd' && game.hits > hits) effect('成功閃過！', true);
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
