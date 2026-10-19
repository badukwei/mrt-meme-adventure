export const STAGES = [
  { id: 'urine', title: '這是座椅，不是馬桶', duration: 12, total: 18 },
  { id: 'elder', title: '座位很多，戲也很多', duration: 15, total: 12 },
  { id: 'odor', title: '車廂空氣保衛戰', duration: 25, total: 54 },
  { id: 'legs', title: '你的腿有買兩張票？', duration: 25, total: 70 },
  { id: 'crowd', title: '先下後上，很難嗎？', duration: 30, total: 20 },
];
const clamp = value => Math.max(0, Math.min(100, Math.round(value)));
function odorTargets(random) {
  const targets = [];
  for (let wave = 0; wave < 18; wave++) {
    const count = 2 + Math.floor(wave / 6);
    for (let slot = 0; slot < count; slot++) {
      targets.push({ id: targets.length, wave, slot,
        at: .25 + wave * 1.55 - .018 * wave * (wave - 1) + slot * .12,
        lifetime: 3.1 - wave / 17 * 1.4,
        angle: [-2.8, -.34, -2.05, -1.09][slot] + (random() - .5) * .12,
        resolved: false, hit: false });
    }
  }
  return targets;
}
// Integrate the accelerating speed so positions depend only on active game time.
export function odorPosition(target, time, width, height, sourceX, sourceY) {
  const age = Math.max(0, time - target.at);
  const distance = ((40 + 4 * target.at) * age + 2 * age * age) * Math.min(1.4, width / 390);
  const side = target.slot % 2 ? 1 : -1;
  const reflect = (value, min, max) => {
    const span = Math.max(1, max - min);
    const offset = ((value - min) % (2 * span) + 2 * span) % (2 * span);
    return min + (offset <= span ? offset : 2 * span - offset);
  };
  return {
    x: reflect(sourceX + side * (target.slot >= 2 ? 16 : -8) + Math.cos(target.angle) * distance, 36, width - 36),
    y: reflect(sourceY + (target.slot >= 2 ? -18 : 10) + Math.sin(target.angle) * distance, 58, height - 88),
  };
}
export function scoreGame(game) {
  if (game.id === 'legs') {
    return clamp(game.hits < game.total ? game.hits / game.total * 60 : 60 + 40 * (1 - game.time / game.duration));
  }
  return clamp(game.hits / game.total * 100);
}
export function ending(total) {
  return total < 200 ? { title: '通勤倖存者', text: '人下車了，靈魂還在下一站。' }
    : total < 350 ? { title: '車廂秩序委員', text: '今天的捷運，多虧你還能呼吸。' }
      : { title: '捷運傳說', text: '你一上車，連廣播都說謝謝。' };
}
export class Challenge {
  constructor(index, random = Math.random) {
    Object.assign(this, STAGES[index]);
    this.time = 0;
    this.hits = 0;
    this.misses = 0;
    this.paused = false;
    this.done = false;
    this.lane = 1;
    this.round = -1;
    this.attempted = false;
    this.lastAction = -Infinity;
    this.random = random;
    this.targets = this.id === 'odor' ? odorTargets(random) : Array.from({ length: this.total }, (_, id) => ({
      id, at: this.id === 'urine' ? .3 + id * .55 : this.id === 'crowd' ? id * 1.3 : id * .9,
      lane: Math.floor(random() * 3), x: 15 + random() * 70,
      y: 20 + random() * 40, resolved: false, hit: false,
    }));
    this.updateRound();
  }
  updateRound() {
    if (this.id !== 'elder') return;
    const round = Math.floor(this.time / .65);
    if (round !== this.round) {
      this.round = round;
      this.side = this.side === undefined ? (this.random() < .5 ? 0 : 1) : 1 - this.side;
      this.attempted = false;
    }
  }
  get activeTargets() {
    const lifetime = this.id === 'urine' ? 1.5 : 3;
    return this.targets.filter(t => !t.resolved && this.time >= t.at && this.time < t.at + (t.lifetime ?? lifetime));
  }
  tick(seconds) {
    if (this.done || this.paused || seconds <= 0) return;
    this.time = Math.min(this.duration, this.time + seconds);
    this.updateRound();
    if (['urine', 'odor', 'crowd'].includes(this.id)) {
      for (const target of this.targets) {
        if (!target.resolved && this.time >= target.at + (target.lifetime ?? (this.id === 'urine' ? 1.5 : 3))) {
          target.resolved = true;
          if ((this.id === 'crowd' && target.lane !== this.lane) || (this.id === 'urine' && target.lane === this.lane)) {
            target.hit = true;
            this.hits++;
          } else this.misses++;
        }
      }
    }
    if (this.time >= this.duration) this.finish();
  }
  input(value) {
    if (this.done || this.paused) return null;
    if (this.id === 'elder') {
      if (this.attempted || this.time - this.lastAction < .32) return null;
      this.attempted = true;
      this.lastAction = this.time;
      const hit = value === true;
      if (hit) this.hits++; else this.misses++;
      if (this.hits >= this.total) this.finish();
      return hit;
    }
    if (this.id === 'odor') {
      const target = this.activeTargets.find(t => t.id === value);
      if (!target) return null;
      target.resolved = target.hit = true;
      this.hits++;
      return true;
    }
    if (this.id === 'legs') {
      if (this.time - this.lastAction < .055) return null;
      this.lastAction = this.time;
      this.hits++;
      if (this.hits >= this.total) this.finish();
      return true;
    }
    this.lane = Math.max(0, Math.min(2, this.lane + value));
    return true;
  }
  finish() {
    if (this.done) return this.result;
    this.done = true;
    return this.result = { id: this.id, score: scoreGame(this), hits: this.hits,
      misses: this.misses, total: this.total, time: this.time };
  }
}
