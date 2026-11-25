// Dapur Kilat — screenshot scenes: a scripted cook plays the real rules
// forward from a fresh world, so each ?shot= frame is what a short real
// game looks like, and the same seed always gives the same frame.
import { STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const SAMPLE = STEP;
const APPROACH = {
  nasi: [150, 127],
  telur: [150, 199],
  cabai: [150, 415],
  board: [395, 190],
  stove: [670, 190],
  plate: [480, 470],
};

function moveToward(state, tx, ty) {
  const p = state.player;
  const dx = tx - p.x;
  const dy = ty - p.y;
  const d = Math.hypot(dx, dy);
  if (d < 8) return { dx: 0, dy: 0, arrived: true };
  return { dx: dx / d, dy: dy / d, arrived: false };
}

/**
 * Run one scripted phase list. A phase is {at, do, for} — walk to a spot,
 * then do 'interact' once, 'holdChop' while holding E, or 'wait' seconds.
 */
function runScript(world, phases) {
  const state = world.state;
  for (const phase of phases) {
    let done = false;
    let held = 0;
    let guard = 0;
    while (!done && guard < 600 * 60) {
      guard += 1;
      const move = phase.at ? moveToward(state, phase.at[0], phase.at[1]) : { dx: 0, dy: 0, arrived: true };
      let input = { dx: move.dx, dy: move.dy, interactPressed: false };
      let holding = false;
      if (move.arrived) {
        if (phase.do === 'interact') {
          input.interactPressed = true;
          done = true;
        } else if (phase.do === 'holdChop') {
          holding = true;
          held += SAMPLE;
          if (held >= (phase.for || 0)) done = true;
        } else if (phase.do === 'wait') {
          held += SAMPLE;
          if (held >= (phase.for || 0)) done = true;
        } else {
          done = true;
        }
      }
      world.step(SAMPLE, input, holding);
      if (state.over) return;
    }
  }
}

// Cook one Nasi Goreng most of the way: rice and fried egg on the plate,
// chilli on the board half chopped — a dish mid-assembly.
const COOK_NASI_GORENG = [
  { at: APPROACH.nasi, do: 'interact' },
  { at: APPROACH.plate, do: 'interact' },
  { at: APPROACH.telur, do: 'interact' },
  { at: APPROACH.stove, do: 'interact' },
  { at: APPROACH.stove, do: 'wait', for: 3.5 },
  { at: APPROACH.stove, do: 'interact' },
  { at: APPROACH.plate, do: 'interact' },
  { at: APPROACH.cabai, do: 'interact' },
  { at: APPROACH.board, do: 'interact' },
  { at: APPROACH.board, do: 'holdChop', for: 0.6 },
];

// Finish the Nasi Goreng on the board, plate it and serve it at the window.
const FINISH_AND_SERVE = [
  { at: APPROACH.board, do: 'holdChop', for: 0.8 },
  { at: APPROACH.board, do: 'interact' },
  { at: APPROACH.plate, do: 'interact' },
  { at: APPROACH.plate, do: 'interact' },
  { at: [850, 300], do: 'interact' },
];

function waitForOrders(world, count) {
  let guard = 0;
  while (world.state.orders.length < count && guard < 600 * 60 && !world.state.over) {
    guard += 1;
    world.step(SAMPLE, { dx: 0, dy: 0, interactPressed: false }, false);
  }
}

function waitForLowTimer(world, seconds) {
  let guard = 0;
  while (guard < 600 * 60 && !world.state.over) {
    guard += 1;
    world.step(SAMPLE, { dx: 0, dy: 0, interactPressed: false }, false);
    const min = Math.min(...world.state.orders.map((o) => o.timeLeft));
    if (world.state.orders.length > 0 && min <= seconds) return;
  }
}

function idleUntilOver(world) {
  let guard = 0;
  while (!world.state.over && guard < 900 * 60) {
    guard += 1;
    world.step(SAMPLE, { dx: 0, dy: 0, interactPressed: false }, false);
  }
}

/**
 * Set `world` to the named scene (start, play, rush or end) and return the
 * screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'play' || name === 'rush') {
    runScript(world, COOK_NASI_GORENG);
    waitForOrders(world, 3);
    if (name === 'rush') waitForLowTimer(world, 12);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'end') {
    runScript(world, COOK_NASI_GORENG);
    waitForOrders(world, 3);
    runScript(world, FINISH_AND_SERVE);
    idleUntilOver(world);
    return { screen: SCREEN_OVER, best: world.state.coins };
  }
  for (let i = 0; i < 5 / SAMPLE; i += 1) {
    world.step(SAMPLE, { dx: 0, dy: 0, interactPressed: false }, false);
  }
  return { screen: SCREEN_TITLE, best: 0 };
}
