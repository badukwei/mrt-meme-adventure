export const STAGES = [
  { id: 'elder', title: '座位很多，戲也很多', duration: 25, total: 20 },
  { id: 'odor', title: '車廂空氣保衛戰', duration: 25, total: 24 },
  { id: 'legs', title: '你的腿有買兩張票？', duration: 25, total: 70 },
  { id: 'crowd', title: '先下後上，很難嗎？', duration: 30, total: 20 },
];
const clamp = value => Math.max(0, Math.min(100, Math.round(value)));
export function scoreGame(game) {
  if (game.id === 'legs') {
    return clamp(game.hits < game.total ? game.hits / game.total * 60 : 60 + 40 * (1 - game.time / game.duration));
  }
  return clamp(game.hits / game.total * 100);
}
export function ending(total) {
  return total < 160 ? { title: '通勤倖存者', text: '人下車了，靈魂還在下一站。' }
    : total < 280 ? { title: '車廂秩序委員', text: '今天的捷運，多虧你還能呼吸。' }
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
    this.targets = Array.from({ length: this.total }, (_, id) => ({
      id, at: this.id === 'crowd' ? id * 1.3 : id * .9,
      lane: Math.floor(random() * 3), x: 15 + random() * 70,
      y: 20 + random() * 40, resolved: false, hit: false,
    }));
    this.updateRound();
  }
  updateRound() {
    if (this.id !== 'elder') return;
    const round = Math.min(this.total - 1, Math.floor(this.time / (this.duration / this.total)));
    if (round !== this.round) {
      this.round = round;
      this.side = this.random() < .5 ? 0 : 1;
      this.attempted = false;
    }
  }
  get activeTargets() {
    const lifetime = this.id === 'odor' ? 2.8 : 3;
    return this.targets.filter(t => !t.resolved && this.time >= t.at && this.time < t.at + lifetime);
  }
  tick(seconds) {
    if (this.done || this.paused || seconds <= 0) return;
    this.time = Math.min(this.duration, this.time + seconds);
    this.updateRound();
    if (this.id === 'odor' || this.id === 'crowd') {
      for (const target of this.targets) {
        if (!target.resolved && this.time >= target.at + (this.id === 'odor' ? 2.8 : 3)) {
          target.resolved = true;
          if (this.id === 'crowd' && target.lane !== this.lane) {
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
      if (this.attempted || this.time - this.lastAction < .2) return null;
      this.attempted = true;
      this.lastAction = this.time;
      const hit = value === this.side;
      if (hit) this.hits++; else this.misses++;
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
