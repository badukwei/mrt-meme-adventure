import test from 'node:test';
import assert from 'node:assert/strict';
import { Challenge, ending, scoreGame } from '../src/game.js';

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
  assert.equal(game.input(0), true);
  assert.equal(game.input(0), null);
  game.tick(25);
  assert.equal(game.misses, 23);
  assert.equal(game.activeTargets.length, 0);
  assert.equal(game.result.score, 4);
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
test('crowd resolves each person once, permits passage and clamps lanes', () => {
  const game = new Challenge(4, () => 0);
  game.input(1); game.input(1);
  assert.equal(game.lane, 2);
  for (let i = 0; i < 300; i++) game.tick(.1);
  game.tick(.1);
  assert.equal(game.result.score, 100);
  assert.ok(game.targets.every(t => t.resolved));
  const collision = new Challenge(4, () => 0);
  collision.input(-1);
  collision.tick(30);
  assert.equal(collision.result.score, 0);
  assert.equal(collision.misses, 20);
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
  assert.equal(game.result.hits, 24);
  assert.equal(game.result.score, 100);
  assert.equal(game.result.misses, 0);
});

test('crowd arrivals are separated and all resolve inside the time limit', () => {
  const game = new Challenge(4);
  assert.ok(game.targets.at(-1).at + 3 < game.duration);
  for (let i = 1; i < game.targets.length; i++) {
    assert.ok(game.targets[i].at - game.targets[i - 1].at > 1);
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
