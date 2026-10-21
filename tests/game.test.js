import test from 'node:test';
import assert from 'node:assert/strict';
import { Challenge, ending, scoreGame, odorPosition } from '../src/game.js';

test('elder direct hits require separate windows and knock down early', () => {
  const game = new Challenge(1, () => .2);
  for (let hit = 0; hit < 12; hit++) {
    assert.equal(game.input(true), true);
    assert.equal(game.input(true), null);
    if (hit < 11) game.tick(.651);
  }
  assert.equal(game.result.score, 100);
  assert.ok(game.result.time < 15);
  assert.equal(game.input(true), null);
});
test('elder misses consume a window and cooldown persists across a move', () => {
  const game = new Challenge(1);
  game.tick(.6);
  assert.equal(game.input(false), false);
  game.tick(.06);
  assert.equal(game.input(true), null);
  game.tick(.3);
  assert.equal(game.input(true), true);
  game.tick(15);
  assert.equal(game.result.score, 8);
  assert.equal(game.result.misses, 1);
});
test('odor targets score once and all expire before time runs out', () => {
  const game = new Challenge(2);
  game.tick(.25);
  assert.equal(game.input(0), true);
  assert.equal(game.input(0), null);
  game.tick(25);
  assert.equal(game.misses, 53);
  assert.equal(game.activeTargets.length, 0);
  assert.equal(game.result.score, 2);
});
test('legs has partial credit, speed bonus, cap and ignores simultaneous inputs', () => {
  const game = new Challenge(3);
  assert.equal(game.input(), true);
  assert.equal(game.input(), null);
  for (let i = 1; i < 35; i++) { game.tick(.1); game.input(); }
  assert.equal(scoreGame(game), 30);
  for (let i = 35; i < 70; i++) { game.tick(.1); game.input(); }
  assert.equal(game.done, true);
  assert.equal(game.result.score, 89);
  assert.equal(game.input(), null);
  const slow = new Challenge(3);
  slow.tick(20);
  for (let i = 0; i < 70; i++) { slow.tick(.06); slow.input(); }
  assert.ok(slow.result.score < game.result.score);
});
test('crowd waves resolve once and reward only the safe lane', () => {
  for (const perfect of [true, false]) {
    const game = new Challenge(4, () => .3);
    game.input(9); assert.equal(game.lane, 2);
    game.input(-9); assert.equal(game.lane, 0);
    for (const target of game.targets) {
      const lane = perfect ? target.safeLane : target.lanes[0];
      while (game.lane !== lane) game.input(Math.sign(lane - game.lane));
      game.tick(target.at + target.lifetime - game.time + .00001);
      const count = game.hits + game.misses;
      game.tick(.00001);
      assert.equal(game.hits + game.misses, count);
    }
    game.tick(24);
    assert.equal(game.result.score, perfect ? 100 : 0);
    assert.equal(game.hits, perfect ? 32 : 0);
    assert.equal(game.misses, perfect ? 0 : 32);
    assert.ok(game.targets.every(t => t.resolved));
  }
});
test('pause freezes time and input; all idle games complete with bounded scores', () => {
  for (let index = 0; index < 5; index++) {
    const game = new Challenge(index);
    game.paused = true;
    game.tick(30);
    assert.equal(game.time, 0);
    assert.equal(game.input(0), null);
    game.paused = false;
    game.tick(30);
    assert.equal(game.done, true);
    assert.ok(game.result.score >= 0 && game.result.score <= 100);
  }
});
test('ending boundaries have no gaps', () => {
  assert.equal(ending(0).title, ending(199).title);
  assert.notEqual(ending(199).title, ending(200).title);
  assert.equal(ending(200).title, ending(349).title);
  assert.notEqual(ending(349).title, ending(350).title);
  assert.equal(ending(350).title, ending(500).title);
});

test('every odor target is available long enough and a perfect run earns 100', () => {
  const game = new Challenge(2);
  for (let step = 0; step < 250; step++) {
    for (const target of game.activeTargets) game.input(target.id);
    game.tick(.1);
  }
  game.tick(.1);
  assert.equal(game.result.hits, 54);
  assert.equal(game.result.score, 100);
  assert.equal(game.result.misses, 0);
});

test('crowd leaves a changing gap, accelerates and preserves reaction time', () => {
  for (let seed = 1; seed <= 30; seed++) {
    let state = seed;
    const game = new Challenge(4, () => { state = (Math.imul(state,1664525)+1013904223) >>> 0; return state / 4294967296; });
    assert.equal(game.targets.length,32);
    assert.ok(game.targets.at(-1).at + game.targets.at(-1).lifetime < game.duration);
    for (const [i,t] of game.targets.entries()) {
      assert.equal(new Set(t.lanes).size,2);
      assert.ok(!t.lanes.includes(t.safeLane));
      assert.ok(t.lifetime >= .649);
      if(i) {
        const prev=game.targets[i-1];
        assert.notEqual(t.safeLane,prev.safeLane);
        assert.ok(t.lifetime < prev.lifetime);
        assert.ok(t.at+t.lifetime-prev.at-prev.lifetime >= .62);
      }
    }
  }
});

test('new journeys do not retain previous results or input locks', () => {
  const old = new Challenge(3);
  old.input(); old.tick(25);
  const fresh = new Challenge(3);
  assert.equal(fresh.time, 0);
  assert.equal(fresh.hits, 0);
  assert.equal(fresh.done, false);
  assert.equal(fresh.input(), true);
});

test('urine catches matching lane exactly once and resolves all drops before timeout', () => {
  const game = new Challenge(0, () => .5);
  assert.ok(game.targets.at(-1).at + 1.5 < game.duration);
  game.tick(1.79);
  assert.equal(game.hits, 0);
  game.tick(.02);
  assert.equal(game.hits, 1);
  game.tick(.01);
  assert.equal(game.hits, 1);
  game.tick(12);
  assert.equal(game.result.score, 100);
  assert.equal(game.misses, 0);
  assert.ok(game.targets.every(t => t.resolved));
});
test('urine movement changes catch outcome; misses leave resolved unhit drops', () => {
  const game = new Challenge(0, () => .5);
  game.input(-1); game.input(-1);
  assert.equal(game.lane, 0);
  game.tick(1.81);
  assert.equal(game.misses, 1);
  assert.equal(game.targets[0].hit, false);
  game.input(1);
  game.tick(.55);
  assert.equal(game.hits, 1);
  game.paused = true;
  game.tick(10); game.input(1);
  assert.equal(game.lane, 1);
  assert.equal(game.hits, 1);
});

test('odor waves escalate from two to four with shorter gaps and fair lifetimes', () => {
  const game = new Challenge(2, () => .5);
  assert.equal(game.targets.length, 54);
  const waves = Array.from({length: 18}, (_, wave) => game.targets.filter(t => t.wave === wave));
  waves.forEach((targets, wave) => {
    assert.equal(targets.length, 2 + Math.floor(wave / 6));
    assert.ok(targets.every(t => t.lifetime >= 1.69 && t.at + t.lifetime < game.duration));
    if (wave) assert.ok(targets[0].lifetime < waves[wave - 1][0].lifetime);
  });
  assert.ok(waves[17][0].at - waves[16][0].at < waves[1][0].at - waves[0][0].at);
  game.tick(waves[12][3].at);
  assert.equal(game.activeTargets.filter(t => t.wave === 12).length, 4);
  assert.ok(game.activeTargets.length >= 4);
});

test('odor motion accelerates and stays inside phone playfields', () => {
  const early = { at: 0, slot: 0, angle: 0 };
  const late = { ...early, at: 18 };
  const earlyTravel = odorPosition(early, .2, 390, 440, 195, 200).x - odorPosition(early, .1, 390, 440, 195, 200).x;
  const lateTravel = odorPosition(late, 18.2, 390, 440, 195, 200).x - odorPosition(late, 18.1, 390, 440, 195, 200).x;
  assert.ok(lateTravel > earlyTravel * 2);
  for (const [width, height] of [[320,280],[390,447],[620,500]]) {
    for (const target of new Challenge(2).targets) {
      for (let age = 0; age < target.lifetime; age += .1) {
        const p = odorPosition(target, target.at + age, width, height, width / 2, height * .3);
        assert.ok(p.x >= 36 && p.x <= width - 36);
        assert.ok(p.y >= 58 && p.y <= height - 88);
      }
    }
  }
});

test('odor expiry rejects late taps and pause freezes moving waves', () => {
  const game = new Challenge(2, () => .5);
  game.tick(.5);
  const before = game.activeTargets.map(t => t.id);
  const time = game.time;
  game.paused = true; game.tick(20);
  assert.equal(game.input(0), null);
  assert.equal(game.time, time);
  assert.deepEqual(game.activeTargets.map(t => t.id), before);
  game.paused = false;
  game.tick(game.targets[0].at + game.targets[0].lifetime - game.time);
  assert.equal(game.input(0), null);
  assert.equal(game.misses, 1);
  game.tick(25);
  assert.equal(game.misses, 54);
  assert.equal(game.result.score, 0);
});
