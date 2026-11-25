// Dapur Kilat — input: keyboard and mouse, turned into game actions.
// One file, one job: keys and clicks in, directions and actions out.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;

const KEYS = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyE: 'interact', Space: 'interact',
  Enter: 'confirm', KeyP: 'pause', Escape: 'pause', KeyM: 'mute',
};

export function createInput(canvas) {
  const held = new Set();
  let actions = 0;
  let interactPressed = false;
  let click = null;

  function onKeyDown(e) {
    const k = KEYS[e.code];
    if (!k) return;
    if (k === 'interact' || k === 'confirm' || k === 'pause' || k === 'mute') {
      if (!e.repeat) {
        if (k === 'interact') interactPressed = true;
        if (k === 'confirm') actions |= ACTION_CONFIRM;
        if (k === 'pause') actions |= ACTION_PAUSE;
        if (k === 'mute') actions |= ACTION_MUTE;
      }
    } else {
      held.add(k);
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  }
  function onKeyUp(e) {
    const k = KEYS[e.code];
    if (k) held.delete(k);
  }
  function onMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    click = {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
    actions |= ACTION_CONFIRM;
  }
  function onContext(e) { e.preventDefault(); }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('contextmenu', onContext);

  return {
    direction() {
      let dx = 0;
      let dy = 0;
      if (held.has('left')) dx -= 1;
      if (held.has('right')) dx += 1;
      if (held.has('up')) dy -= 1;
      if (held.has('down')) dy += 1;
      return { dx, dy };
    },
    interactHeld() {
      return held.has('interact');
    },
    takeInteractPressed() {
      const v = interactPressed;
      interactPressed = false;
      return v;
    },
    takeActions() {
      const v = actions;
      actions = 0;
      return v;
    },
    takeClick() {
      const v = click;
      click = null;
      return v;
    },
  };
}
