// Dapur Kilat — the renderer: everything the player sees, drawn on one canvas.
// One file, one job: pixels. It never changes the rules.
import {
  VIEW_W, VIEW_H, HUD_H, PLAYER, INGREDIENTS, RECIPES, STATIONS,
  CHOP_SECONDS, FRY_SECONDS, BURN_SECONDS, MAX_ORDERS, PLATE_SLOTS,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const FLOOR_A = '#c89b6a';
const FLOOR_B = '#bd8f5e';
const WOOD = '#8b5a2b';
const WOOD_DARK = '#6b4423';
const STEEL = '#3a3f44';
const CREAM = '#fff8e7';
const INK = '#241a12';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, font, color, align = 'left') {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

/** Draw one ingredient at (x, y) with radius r, showing its prep stage. */
export function drawFood(ctx, item, x, y, r) {
  const ing = INGREDIENTS[item.ing];
  const stage = item.step;
  const burnt = !!item.burnt;
  ctx.save();
  ctx.translate(x, y);
  if (burnt) {
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.4); ctx.lineTo(r * 0.4, r * 0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 0.3, r * 0.5); ctx.lineTo(r * 0.5, -r * 0.4); ctx.stroke();
    ctx.restore();
    return;
  }
  if (item.ing === 'nasi') {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 2, r * 0.95, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#e8ddc0';
    ctx.beginPath(); ctx.ellipse(0, 2, r * 0.95, r * 0.3, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#f5f0e1';
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.2, r * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.35, r * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.05, r * 0.35, 0, Math.PI * 2); ctx.fill();
  } else if (item.ing === 'telur') {
    if (stage === 0) {
      ctx.fillStyle = '#fdf6e3';
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.8, r * 1.05, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.55, r * 0.75, 0.3, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#fffdf5';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d98e32'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ffb703';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd94d';
      ctx.beginPath(); ctx.arc(-r * 0.12, -r * 0.12, r * 0.28, 0, Math.PI * 2); ctx.fill();
    }
  } else if (item.ing === 'ayam') {
    if (stage === 0) {
      ctx.fillStyle = '#f2a0a0';
      ctx.beginPath(); ctx.arc(-r * 0.15, 0, r * 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.25;
      ctx.beginPath(); ctx.moveTo(r * 0.4, -r * 0.2); ctx.lineTo(r * 0.95, -r * 0.75); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(r * 0.95, -r * 0.8, r * 0.22, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.75, -r * 0.95, r * 0.22, 0, Math.PI * 2); ctx.fill();
    } else if (stage === 1) {
      ctx.fillStyle = '#f2a0a0';
      for (const [dx, dy] of [[-0.4, -0.3], [0.35, -0.35], [0, 0.35]]) {
        ctx.beginPath(); ctx.arc(dx * r, dy * r, r * 0.38, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.fillStyle = '#c97b2d';
      for (const [dx, dy] of [[-0.4, -0.3], [0.35, -0.35], [0, 0.35]]) {
        ctx.beginPath(); ctx.arc(dx * r, dy * r, r * 0.38, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#8a4d12';
      ctx.beginPath(); ctx.arc(-r * 0.4, -r * 0.3, r * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.35, -r * 0.35, r * 0.12, 0, Math.PI * 2); ctx.fill();
    }
  } else if (item.ing === 'mie') {
    ctx.strokeStyle = stage === 0 ? '#f2d492' : '#ffb703';
    ctx.lineWidth = r * 0.28;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, i * r * 0.45);
      ctx.bezierCurveTo(-r * 0.3, i * r * 0.45 - r * 0.5, r * 0.3, i * r * 0.45 + r * 0.5, r * 0.8, i * r * 0.45);
      ctx.stroke();
    }
  } else if (item.ing === 'cabai') {
    if (stage === 0) {
      ctx.strokeStyle = '#e33e2b'; ctx.lineWidth = r * 0.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, r * 0.2, r * 0.75, Math.PI * 1.15, Math.PI * 1.95); ctx.stroke();
      ctx.strokeStyle = '#4caf50'; ctx.lineWidth = r * 0.22;
      ctx.beginPath(); ctx.moveTo(r * 0.55, -r * 0.55); ctx.lineTo(r * 0.85, -r * 0.85); ctx.stroke();
    } else {
      ctx.fillStyle = '#e33e2b';
      for (const [dx, dy] of [[-0.4, -0.3], [0.3, -0.4], [0.1, 0.3], [-0.1, 0.1]]) {
        ctx.beginPath(); ctx.arc(dx * r, dy * r, r * 0.25, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (item.ing === 'sayur') {
    ctx.fillStyle = stage === 0 ? '#4caf50' : '#66bb6a';
    for (const [dx, dy, rot] of [[-0.35, -0.2, -0.6], [0.3, -0.3, 0.5], [0, 0.35, 0.1]]) {
      ctx.save();
      ctx.translate(dx * r, dy * r);
      ctx.rotate(rot);
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.32, r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawHeart(ctx, x, y, s, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 16, s / 16);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-9, -3, -6, -11, 0, -5);
  ctx.bezierCurveTo(6, -11, 9, -3, 0, 5);
  ctx.closePath();
  ctx.fillStyle = filled ? '#e33e2b' : '#5a4632';
  ctx.fill();
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function drawFloor() {
    const tile = 48;
    for (let y = HUD_H; y < VIEW_H; y += tile) {
      for (let x = 0; x < VIEW_W; x += tile) {
        const odd = ((x / tile) + (y / tile)) % 2 === 0;
        ctx.fillStyle = odd ? FLOOR_A : FLOOR_B;
        ctx.fillRect(x, y, tile, tile);
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0, HUD_H, VIEW_W, 4);
  }

  function drawCounter(c) {
    ctx.fillStyle = WOOD_DARK;
    rr(ctx, c.x, c.y, c.w, c.h, 8); ctx.fill();
    ctx.fillStyle = WOOD;
    rr(ctx, c.x + 3, c.y + 3, c.w - 6, c.h - 6, 6); ctx.fill();
    drawFood(ctx, { ing: c.ing, step: 0 }, c.x + 26, c.y + c.h / 2, 15);
    text(ctx, INGREDIENTS[c.ing].name, c.x + 48, c.y + c.h / 2, 'bold 13px system-ui, sans-serif', '#fff');
  }

  function progressRing(x, y, r, frac, color) {
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
  }

  function drawStations(s) {
    for (const c of STATIONS.counters) drawCounter(c);
    // Chopping board.
    const b = STATIONS.board;
    ctx.fillStyle = WOOD_DARK;
    rr(ctx, b.x, b.y, b.w, b.h, 8); ctx.fill();
    ctx.fillStyle = '#e8c98f';
    rr(ctx, b.x + 6, b.y + 6, b.w - 12, b.h - 12, 6); ctx.fill();
    text(ctx, 'CHOP', b.x + b.w / 2, b.y + 14, 'bold 11px system-ui, sans-serif', '#7a5a28', 'center');
    if (s.board.item) {
      drawFood(ctx, s.board.item, b.x + b.w / 2, b.y + b.h / 2 + 8, 15);
      if (s.chopping) progressRing(b.x + b.w / 2, b.y + b.h / 2 + 8, 22, s.board.item.progress / CHOP_SECONDS, '#e33e2b');
    } else {
      ctx.fillStyle = '#b9a06a';
      ctx.fillRect(b.x + b.w / 2 - 22, b.y + b.h / 2 + 2, 44, 4);
      ctx.fillRect(b.x + b.w / 2 + 18, b.y + b.h / 2 - 8, 4, 14);
    }
    // Stove with two burners.
    const st = STATIONS.stove;
    ctx.fillStyle = STEEL;
    rr(ctx, st.x, st.y, st.w, st.h, 8); ctx.fill();
    text(ctx, 'STOVE', st.x + st.w / 2, st.y + 13, 'bold 11px system-ui, sans-serif', '#cfd6dd', 'center');
    s.burners.forEach((burner, i) => {
      const cx = st.x + 50 + i * 100;
      const cy = st.y + 38;
      const item = burner.item;
      ctx.fillStyle = '#22262a';
      ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();
      if (item) {
        const cooking = item.step < INGREDIENTS[item.ing].prep.length;
        if (cooking) {
          ctx.fillStyle = '#ff5722';
          ctx.beginPath(); ctx.arc(cx, cy, 23, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffc107';
          ctx.beginPath(); ctx.arc(cx, cy, 17, 0, Math.PI * 2); ctx.fill();
        }
        drawFood(ctx, item, cx, cy, 13);
        if (cooking) progressRing(cx, cy, 26, item.progress / FRY_SECONDS, '#ff5722');
        else if (item.burnt) text(ctx, 'BURNT!', cx, cy - 30, 'bold 10px system-ui, sans-serif', '#ff5252', 'center');
        else progressRing(cx, cy, 26, Math.min(1, item.burn / BURN_SECONDS), '#9e9e9e');
      }
    });
    // Serving window.
    const w = STATIONS.window;
    ctx.fillStyle = '#5d4037';
    rr(ctx, w.x, w.y, w.w, w.h, 8); ctx.fill();
    ctx.fillStyle = '#ffe082';
    rr(ctx, w.x + 6, w.y + 6, w.w - 12, w.h - 12, 6); ctx.fill();
    for (let i = 0; i < 4; i += 1) {
      ctx.fillStyle = i % 2 ? '#e33e2b' : '#fff';
      ctx.fillRect(w.x + 6 + i * ((w.w - 12) / 4), w.y + 6, (w.w - 12) / 4, 14);
    }
    text(ctx, 'SERVE', w.x + w.w / 2, w.y + 34, 'bold 12px system-ui, sans-serif', '#5d4037', 'center');
    ctx.fillStyle = '#8d6e63';
    ctx.beginPath(); ctx.arc(w.x + w.w / 2, w.y + 62, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath(); ctx.arc(w.x + w.w / 2, w.y + 56, 5, 0, Math.PI * 2); ctx.fill();
    text(ctx, 'WINDOW', w.x + w.w / 2, w.y + w.h - 18, 'bold 11px system-ui, sans-serif', '#fff', 'center');
    // Plate station.
    const pl = STATIONS.plate;
    ctx.fillStyle = '#90a4ae';
    rr(ctx, pl.x, pl.y, pl.w, pl.h, 8); ctx.fill();
    ctx.fillStyle = '#eceff1';
    rr(ctx, pl.x + 4, pl.y + 4, pl.w - 8, pl.h - 8, 6); ctx.fill();
    text(ctx, 'PLATE', pl.x + pl.w / 2, pl.y + 13, 'bold 11px system-ui, sans-serif', '#546e7a', 'center');
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(pl.x + pl.w / 2, pl.y + 40, 62, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(pl.x + pl.w / 2, pl.y + 40, 62, 16, 0, 0, Math.PI * 2); ctx.stroke();
    s.plate.forEach((item, i) => {
      drawFood(ctx, item, pl.x + pl.w / 2 - 34 + i * 34, pl.y + 40, 12);
    });
    // Trash bin.
    const t = STATIONS.trash;
    ctx.fillStyle = '#616161';
    rr(ctx, t.x, t.y, t.w, t.h, 8); ctx.fill();
    ctx.fillStyle = '#757575';
    rr(ctx, t.x + 8, t.y + 8, t.w - 16, t.h - 16, 6); ctx.fill();
    text(ctx, 'TRASH', t.x + t.w / 2, t.y + t.h / 2, 'bold 12px system-ui, sans-serif', '#fff', 'center');
  }

  function drawPlayer(s) {
    const p = s.player;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 13, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
    // Body (apron).
    ctx.fillStyle = '#fff';
    rr(ctx, p.x - 13, p.y - 4, 26, 20, 8); ctx.fill();
    ctx.fillStyle = '#e33e2b';
    ctx.fillRect(p.x - 13, p.y + 8, 26, 4);
    // Head + chef hat.
    ctx.fillStyle = '#ffdbac';
    ctx.beginPath(); ctx.arc(p.x, p.y - 12, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(p.x - 7, p.y - 20, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x, p.y - 23, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x + 7, p.y - 20, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(p.x - 11, p.y - 22, 22, 5);
    // Eyes look where the cook faces.
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(p.x - 4 + p.dirX * 2, p.y - 12 + p.dirY * 2, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x + 4 + p.dirX * 2, p.y - 12 + p.dirY * 2, 1.6, 0, Math.PI * 2); ctx.fill();
    // Carried item in a bubble above the hat.
    if (p.hands) {
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath(); ctx.arc(p.x, p.y - 42, 15, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(p.x, p.y - 42, 15, 0, Math.PI * 2); ctx.stroke();
      if (p.hands.dish) {
        const dish = RECIPES[p.hands.dish];
        dish.needs.forEach((ing, i) => {
          drawFood(ctx, { ing, step: 99 }, p.x - 10 + i * 10, p.y - 42, 6);
        });
      } else {
        drawFood(ctx, p.hands, p.x, p.y - 42, 10);
      }
    }
  }

  function drawHUD(s, screen) {
    // Top bar.
    ctx.fillStyle = '#2b1d12';
    ctx.fillRect(0, 0, VIEW_W, HUD_H);
    ctx.fillStyle = '#3d2a1a';
    ctx.fillRect(0, HUD_H - 4, VIEW_W, 4);
    // Order tickets.
    for (let i = 0; i < MAX_ORDERS; i += 1) {
      const x = 16 + i * 212;
      const y = 8;
      const order = s.orders[i];
      if (!order) {
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        rr(ctx, x, y, 200, 60, 8); ctx.fill();
        text(ctx, '— no order —', x + 100, y + 30, '12px system-ui, sans-serif', 'rgba(255,255,255,0.35)', 'center');
        continue;
      }
      const frac = Math.max(0, order.timeLeft / order.total);
      ctx.fillStyle = CREAM;
      rr(ctx, x, y, 200, 60, 8); ctx.fill();
      text(ctx, order.dish.name, x + 10, y + 14, 'bold 14px system-ui, sans-serif', INK);
      order.dish.needs.forEach((ing, j) => {
        drawFood(ctx, { ing, step: 99 }, x + 24 + j * 34, y + 38, 11);
      });
      const barColor = frac > 0.5 ? '#4caf50' : frac > 0.25 ? '#ff9800' : '#e33e2b';
      ctx.fillStyle = '#e0d5c0';
      ctx.fillRect(x + 10, y + 52, 180, 5);
      ctx.fillStyle = barColor;
      ctx.fillRect(x + 10, y + 52, 180 * frac, 5);
      text(ctx, `${Math.ceil(order.timeLeft)}s`, x + 190, y + 14, 'bold 12px system-ui, sans-serif', frac > 0.25 ? '#666' : '#e33e2b', 'right');
    }
    // Stats on the right.
    const sx = 668;
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath(); ctx.arc(sx + 12, 24, 10, 0, Math.PI * 2); ctx.fill();
    text(ctx, '$', sx + 12, 25, 'bold 13px system-ui, sans-serif', '#7a5a00', 'center');
    text(ctx, `${s.coins}`, sx + 30, 24, 'bold 18px system-ui, sans-serif', '#fff');
    for (let i = 0; i < 3; i += 1) drawHeart(ctx, sx + 90 + i * 24, 24, 18, i < s.hearts);
    text(ctx, `LV ${s.level}`, sx + 168, 24, 'bold 15px system-ui, sans-serif', '#fff');
    const mm = Math.floor(Math.max(0, s.shiftLeft) / 60);
    const ss = Math.floor(Math.max(0, s.shiftLeft) % 60);
    const clock = `${mm}:${String(ss).padStart(2, '0')}`;
    const rushing = screen === SCREEN_PLAY && (s.orders.length === MAX_ORDERS || s.shiftLeft <= 30);
    const urgent = s.shiftLeft <= 30;
    text(ctx, clock, 920, 24, 'bold 20px system-ui, sans-serif', urgent ? '#ff5252' : '#fff', 'right');
    text(ctx, `SERVED ${s.served}  ·  COMBO x${s.combo}`, sx + 30, 52, '12px system-ui, sans-serif', '#d7c9b8');
    if (rushing) {
      ctx.fillStyle = '#e33e2b';
      rr(ctx, 862, 40, 58, 22, 6); ctx.fill();
      text(ctx, 'RUSH!', 891, 51, 'bold 12px system-ui, sans-serif', '#fff', 'center');
    }
    // Context hint for the station in reach.
    if (screen === SCREEN_PLAY && s.near) {
      const hint = hintFor(s);
      if (hint) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        const w = ctx.measureText(hint).width + 24;
        rr(ctx, (VIEW_W - w) / 2, VIEW_H - 34, w, 24, 12); ctx.fill();
        text(ctx, hint, VIEW_W / 2, VIEW_H - 21, 'bold 13px system-ui, sans-serif', '#ffe082', 'center');
      }
    }
  }

  function hintFor(s) {
    const p = s.player;
    const near = s.near;
    if (near === 'window') return p.hands && p.hands.dish ? 'E · Serve the dish!' : 'Bring a finished dish here';
    if (near === 'trash') return p.hands ? 'E · Throw it away' : null;
    if (near === 'plate') {
      if (p.hands && p.hands.dish) return null;
      if (p.hands && s.plate.length < PLATE_SLOTS) return 'E · Put it on the plate';
      if (!p.hands && s.plate.length > 0) return 'E · Take from the plate';
      return null;
    }
    if (near === 'board') {
      if (s.board.item) return s.chopping ? 'Chopping…' : 'Hold E · Chop it';
      if (p.hands) return 'E · Put it on the board';
      return null;
    }
    if (near === 'burner0' || near === 'burner1') {
      const burner = s.burners[near === 'burner0' ? 0 : 1];
      if (burner.item) return 'E · Take it off the stove';
      if (p.hands) return 'E · Put it on the stove';
      return null;
    }
    if (near && near.startsWith('counter')) {
      const idx = Number.parseInt(near.slice(7), 10);
      return p.hands ? null : `E · Take ${INGREDIENTS[STATIONS.counters[idx].ing].name}`;
    }
    return null;
  }

  function drawTitle(s, best) {
    ctx.fillStyle = 'rgba(20,12,6,0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text(ctx, 'DAPUR KILAT', VIEW_W / 2, 150, 'bold 64px system-ui, sans-serif', '#ffd54f', 'center');
    text(ctx, 'WARUNG RUSH  ·  a fast little cooking game', VIEW_W / 2, 196, '18px system-ui, sans-serif', '#fff', 'center');
    text(ctx, 'Take orders. Chop, fry, plate, serve — before the clock runs out.', VIEW_W / 2, 232, '15px system-ui, sans-serif', '#d7c9b8', 'center');
    const lines = [
      'WASD / Arrows — move around the kitchen',
      'E / Space — pick up · chop (hold) · fry · plate · serve',
      'Click — buttons and stations work too',
      'P — pause    ·    M — mute',
    ];
    lines.forEach((l, i) => text(ctx, l, VIEW_W / 2, 290 + i * 26, '15px system-ui, sans-serif', '#fff', 'center'));
    text(ctx, 'Recipes:  Nasi Goreng  ·  Mie Ayam  ·  Soto Ayam', VIEW_W / 2, 420, 'bold 15px system-ui, sans-serif', '#ffe082', 'center');
    if (best > 0) text(ctx, `Best shift: $${best}`, VIEW_W / 2, 452, '15px system-ui, sans-serif', '#fff', 'center');
    text(ctx, 'PRESS SPACE OR CLICK TO START', VIEW_W / 2, 512, 'bold 18px system-ui, sans-serif', '#fff', 'center');
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(20,12,6,0.6)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text(ctx, 'PAUSED', VIEW_W / 2, VIEW_H / 2 - 10, 'bold 48px system-ui, sans-serif', '#fff', 'center');
    text(ctx, 'Press P or Space to keep cooking', VIEW_W / 2, VIEW_H / 2 + 34, '16px system-ui, sans-serif', '#d7c9b8', 'center');
  }

  function drawOver(s, best) {
    ctx.fillStyle = 'rgba(20,12,6,0.78)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const win = s.overReason === 'shift';
    text(ctx, win ? 'SHIFT COMPLETE!' : 'GAME OVER', VIEW_W / 2, 150, 'bold 52px system-ui, sans-serif', win ? '#8bc34a' : '#ff5252', 'center');
    text(ctx, win ? 'The warung closes happy tonight.' : 'Too many orders walked out the door.', VIEW_W / 2, 196, '16px system-ui, sans-serif', '#d7c9b8', 'center');
    const rows = [
      [`Dishes served`, `${s.served}`],
      [`Coins earned`, `$${s.coins}`],
      [`Best combo`, `x${s.bestCombo}`],
      [`Level reached`, `${s.level}`],
      [`Best shift`, `$${Math.max(best, s.coins)}`],
    ];
    rows.forEach(([label, value], i) => {
      text(ctx, label, VIEW_W / 2 - 110, 260 + i * 34, '16px system-ui, sans-serif', '#fff', 'left');
      text(ctx, value, VIEW_W / 2 + 110, 260 + i * 34, 'bold 16px system-ui, sans-serif', '#ffd54f', 'right');
    });
    text(ctx, 'PRESS SPACE OR CLICK TO COOK AGAIN', VIEW_W / 2, 470, 'bold 17px system-ui, sans-serif', '#fff', 'center');
  }

  function draw(state, screen, best) {
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    drawFloor();
    drawStations(state);
    drawPlayer(state);
    if (screen !== SCREEN_TITLE) drawHUD(state, screen);
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawOver(state, best);
  }

  return { draw };
}
