// Dapur Kilat — configuration: canvas, kitchen layout, ingredients, recipes.
// One file, one job: every number the game tunes lives here.
export const STEP = 1 / 60;
export const VIEW_W = 960;
export const VIEW_H = 600;
export const HUD_H = 76;

export const PLAYER = {
  radius: 14,
  speed: 178,
  reach: 46,
};

export const SHIFT_SECONDS = 150;
export const HEARTS = 3;
export const HAND_LIMIT = 1;
export const PLATE_SLOTS = 3;
export const MAX_ORDERS = 3;
export const BEST_KEY = 'dapur-kilat-best';

// Ingredients. prep is the ordered list of steps an item needs before it is
// ready to plate: 'chop' on the board, 'fry' on a stove burner.
export const INGREDIENTS = {
  nasi:   { id: 'nasi',   name: 'Nasi',   color: '#f5f0e1', prep: [] },
  telur:  { id: 'telur',  name: 'Telur',  color: '#ffd94d', prep: ['fry'] },
  ayam:   { id: 'ayam',   name: 'Ayam',   color: '#f2a0a0', prep: ['chop', 'fry'] },
  mie:    { id: 'mie',    name: 'Mie',    color: '#ffcf4d', prep: ['fry'] },
  cabai:  { id: 'cabai',  name: 'Cabai',  color: '#e33e2b', prep: ['chop'] },
  sayur:  { id: 'sayur',  name: 'Sayur',  color: '#4caf50', prep: ['chop'] },
};

// Dishes: three components each, mixing the preps in different ways.
export const RECIPES = {
  nasiGoreng: { id: 'nasiGoreng', name: 'Nasi Goreng', price: 18, needs: ['nasi', 'telur', 'cabai'] },
  mieAyam:    { id: 'mieAyam',    name: 'Mie Ayam',    price: 22, needs: ['mie', 'ayam', 'sayur'] },
  sotoAyam:   { id: 'sotoAyam',   name: 'Soto Ayam',   price: 25, needs: ['nasi', 'ayam', 'telur'] },
};
export const RECIPE_LIST = [RECIPES.nasiGoreng, RECIPES.mieAyam, RECIPES.sotoAyam];

// Kitchen stations. Counters are solid; the player interacts from next to them.
export const STATIONS = {
  counters: [
    { ing: 'nasi',  x: 16,  y: 96,  w: 104, h: 62 },
    { ing: 'telur', x: 16,  y: 168, w: 104, h: 62 },
    { ing: 'ayam',  x: 16,  y: 240, w: 104, h: 62 },
    { ing: 'mie',   x: 16,  y: 312, w: 104, h: 62 },
    { ing: 'cabai', x: 16,  y: 384, w: 104, h: 62 },
    { ing: 'sayur', x: 16,  y: 456, w: 104, h: 62 },
  ],
  board:  { x: 330, y: 96,  w: 130, h: 64 },
  stove:  { x: 620, y: 96,  w: 200, h: 64 },
  window: { x: 880, y: 220, w: 64,  h: 160 },
  plate:  { x: 380, y: 484, w: 200, h: 64 },
  trash:  { x: 860, y: 484, w: 84,  h: 64 },
};

export const CHOP_SECONDS = 1.2;
export const FRY_SECONDS = 3.0;
export const BURN_SECONDS = 6.0;

export function orderTimeFor(level) {
  return Math.max(30, 50 - (level - 1) * 2);
}
export function spawnIntervalFor(level) {
  return Math.max(7, 14 - (level - 1) * 0.7);
}
export function levelFor(served) {
  return Math.floor(served / 4) + 1;
}
