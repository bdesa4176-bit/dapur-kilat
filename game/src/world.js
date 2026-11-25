// Dapur Kilat — the world: kitchen state, orders, cooking, serving.
// One file, one job: the rules. It knows nothing about drawing or input keys.
import {
  STEP, VIEW_W, VIEW_H, HUD_H, PLAYER, SHIFT_SECONDS, HEARTS, PLATE_SLOTS,
  MAX_ORDERS, INGREDIENTS, RECIPES, RECIPE_LIST, STATIONS, CHOP_SECONDS,
  FRY_SECONDS, BURN_SECONDS, orderTimeFor, spawnIntervalFor, levelFor,
} from './config.js';

function makeItem(ing) {
  return { ing, step: 0, progress: 0, burn: 0 };
}
function itemReady(item) {
  return item.step >= INGREDIENTS[item.ing].prep.length;
}
function nextPrep(item) {
  const prep = INGREDIENTS[item.ing].prep;
  return item.step < prep.length ? prep[item.step] : null;
}
function plateDishId(plate) {
  if (plate.length !== PLATE_SLOTS) return null;
  const have = plate.map((i) => i.ing).sort().join(',');
  for (const r of RECIPE_LIST) {
    if ([...r.needs].sort().join(',') === have) return r.id;
  }
  return null;
}

function rectDist(px, py, r) {
  const cx = Math.max(r.x, Math.min(px, r.x + r.w));
  const cy = Math.max(r.y, Math.min(py, r.y + r.h));
  return Math.hypot(px - cx, py - cy);
}

export function createWorld(random) {
  const state = {
    time: 0, shiftLeft: SHIFT_SECONDS, level: 1, served: 0, coins: 0,
    combo: 0, bestCombo: 0, hearts: HEARTS, over: false, overReason: null,
    player: { x: 480, y: 340, dirX: 0, dirY: 1, hands: null },
    board: { item: null },
    burners: [{ item: null }, { item: null }],
    plate: [],
    orders: [], spawnIn: 2, nextOrderId: 1,
    near: null, chopping: false,
  };

  function reset() {
    state.time = 0; state.shiftLeft = SHIFT_SECONDS; state.level = 1;
    state.served = 0; state.coins = 0; state.combo = 0; state.bestCombo = 0;
    state.hearts = HEARTS; state.over = false; state.overReason = null;
    state.player.x = 480; state.player.y = 340; state.player.dirX = 0;
    state.player.dirY = 1; state.player.hands = null;
    state.board.item = null;
    state.burners[0].item = null; state.burners[1].item = null;
    state.plate = []; state.orders = []; state.spawnIn = 2; state.nextOrderId = 1;
    state.near = null; state.chopping = false;
  }

  function spawnOrder() {
    if (state.orders.length >= MAX_ORDERS) return;
    const dish = random.pick(RECIPE_LIST);
    const total = orderTimeFor(state.level);
    state.orders.push({ id: state.nextOrderId++, dish, timeLeft: total, total });
  }

  function nearestStation() {
    const p = state.player;
    let best = null;
    let bestD = Infinity;
    const consider = (key, rect) => {
      const d = rectDist(p.x, p.y, rect);
      if (d < bestD) { bestD = d; best = key; }
    };
    consider('window', STATIONS.window);
    consider('plate', STATIONS.plate);
    consider('board', STATIONS.board);
    consider('trash', STATIONS.trash);
    STATIONS.counters.forEach((c, i) => consider('counter' + i, c));
    // Stove burners are the two halves of the stove rect.
    consider('burner0', { x: STATIONS.stove.x, y: STATIONS.stove.y, w: 100, h: STATIONS.stove.h });
    consider('burner1', { x: STATIONS.stove.x + 100, y: STATIONS.stove.y, w: 100, h: STATIONS.stove.h });
    return bestD <= PLAYER.reach ? best : null;
  }

  function hitsSolid(x, y) {
    if (x < 16 + PLAYER.radius || x > VIEW_W - 16 - PLAYER.radius) return true;
    if (y < HUD_H + 8 + PLAYER.radius || y > VIEW_H - 16 - PLAYER.radius) return true;
    const rects = [
      ...STATIONS.counters, STATIONS.board, STATIONS.stove,
      STATIONS.window, STATIONS.plate, STATIONS.trash,
    ];
    for (const r of rects) {
      if (x + PLAYER.radius > r.x && x - PLAYER.radius < r.x + r.w &&
          y + PLAYER.radius > r.y && y - PLAYER.radius < r.y + r.h) return true;
    }
    return false;
  }

  function interact(events) {
    const p = state.player;
    const near = state.near;
    if (!near) return;
    if (near === 'window') {
      const hands = p.hands;
      if (hands && hands.dish) {
        const idx = state.orders.findIndex((o) => o.dish.id === hands.dish);
        if (idx >= 0) {
          const order = state.orders[idx];
          state.orders.splice(idx, 1);
          const bonus = order.timeLeft > 15 ? 5 : 0;
          state.coins += order.dish.price + bonus;
          state.served += 1;
          state.combo += 1;
          state.bestCombo = Math.max(state.bestCombo, state.combo);
          p.hands = null;
          events.push('serve');
          const lv = levelFor(state.served);
          if (lv !== state.level) { state.level = lv; events.push('levelUp'); }
        } else {
          events.push('reject');
        }
      }
      return;
    }
    if (near === 'trash') {
      if (p.hands) { p.hands = null; events.push('trash'); }
      return;
    }
    if (near === 'plate') {
      const dishId = plateDishId(state.plate);
      if (dishId && !p.hands) {
        p.hands = { dish: dishId, plate: true };
        state.plate = [];
        events.push('pickupPlate');
        return;
      }
      if (p.hands && !p.hands.dish && itemReady(p.hands) && state.plate.length < PLATE_SLOTS) {
        state.plate.push(p.hands);
        p.hands = null;
        events.push('place');
        return;
      }
      if (!p.hands && state.plate.length > 0) {
        p.hands = state.plate.pop();
        events.push('pickup');
      }
      return;
    }
    if (near === 'board') {
      const item = state.board.item;
      if (!item && p.hands && !p.hands.dish && nextPrep(p.hands) === 'chop') {
        state.board.item = p.hands;
        p.hands = null;
        events.push('place');
        return;
      }
      if (item && !p.hands) {
        p.hands = item;
        state.board.item = null;
        events.push('pickup');
      }
      return;
    }
    if (near === 'burner0' || near === 'burner1') {
      const burner = state.burners[near === 'burner0' ? 0 : 1];
      if (!burner.item && p.hands && !p.hands.dish && nextPrep(p.hands) === 'fry') {
        burner.item = p.hands;
        p.hands = null;
        events.push('place');
        return;
      }
      if (burner.item && !p.hands) {
        p.hands = burner.item;
        burner.item = null;
        events.push('pickup');
      }
      return;
    }
    if (near.startsWith('counter')) {
      const idx = Number.parseInt(near.slice(7), 10);
      if (!p.hands) {
        p.hands = makeItem(STATIONS.counters[idx].ing);
        events.push('pickup');
      }
    }
  }

  function step(dt, input, holdingInteract) {
    const events = [];
    if (state.over) return events;
    state.time += dt;

    // Shift clock.
    state.shiftLeft -= dt;
    if (state.shiftLeft <= 0) {
      state.shiftLeft = 0;
      state.over = true;
      state.overReason = 'shift';
      events.push('shiftDone');
      return events;
    }

    // Orders: spawn and expire.
    state.spawnIn -= dt;
    if (state.spawnIn <= 0) {
      spawnOrder();
      state.spawnIn = spawnIntervalFor(state.level);
    }
    for (let i = state.orders.length - 1; i >= 0; i -= 1) {
      const o = state.orders[i];
      o.timeLeft -= dt;
      if (o.timeLeft <= 0) {
        state.orders.splice(i, 1);
        state.hearts -= 1;
        state.combo = 0;
        events.push('expire');
        if (state.hearts <= 0) {
          state.over = true;
          state.overReason = 'hearts';
          events.push('gameOver');
          return events;
        }
      }
    }

    // Chopping: hold interact next to the board.
    state.chopping = false;
    if (holdingInteract && state.near === 'board' && state.board.item &&
        nextPrep(state.board.item) === 'chop') {
      state.chopping = true;
      const item = state.board.item;
      item.progress += dt;
      if (item.progress >= CHOP_SECONDS) {
        item.progress = 0;
        item.step += 1;
        events.push('chopDone');
      }
    }

    // Frying: automatic on the burners; left too long it burns.
    for (const burner of state.burners) {
      const item = burner.item;
      if (!item) continue;
      if (nextPrep(item) === 'fry') {
        item.progress += dt;
        if (item.progress >= FRY_SECONDS) {
          item.progress = 0;
          item.step += 1;
          events.push('fryDone');
        }
      } else if (itemReady(item)) {
        item.burn += dt;
        if (item.burn >= BURN_SECONDS) {
          item.burnt = true;
          events.push('burnt');
        }
      }
    }

    // Movement with simple axis-separated collision.
    const p = state.player;
    let dx = input.dx || 0;
    let dy = input.dy || 0;
    const len = Math.hypot(dx, dy);
    if (len > 0) { dx /= len; dy /= len; p.dirX = dx; p.dirY = dy; }
    const nx = p.x + dx * PLAYER.speed * dt;
    if (!hitsSolid(nx, p.y)) p.x = nx;
    const ny = p.y + dy * PLAYER.speed * dt;
    if (!hitsSolid(p.x, ny)) p.y = ny;

    state.near = nearestStation();
    if (input.interactPressed) interact(events);
    return events;
  }

  return {
    state, reset, step, plateDishId: () => plateDishId(state.plate),
    itemReady, nextPrep, STATIONS,
  };
}
