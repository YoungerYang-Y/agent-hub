// Zero-dependency terminal interactive prompts with viewport scrolling
const ESC = "\x1B[";
const HIDE_CURSOR = `${ESC}?25l`;
const SHOW_CURSOR = `${ESC}?25h`;
const CLEAR_LINE = `${ESC}2K`;

function getViewportHeight() {
  return Math.max((process.stdout.rows || 24) - 4, 5);
}

function moveCursor(n) {
  return n > 0 ? `${ESC}${n}B` : n < 0 ? `${ESC}${-n}A` : "";
}

function renderViewport(items, cursor, selected, multi, viewHeight) {
  const total = items.length;
  const height = Math.min(viewHeight, total);

  let offset = 0;
  if (total > height) {
    offset = Math.min(Math.max(cursor - Math.floor(height / 2), 0), total - height);
  }

  let out = "";
  for (let vi = 0; vi < height; vi++) {
    const i = offset + vi;
    const isCursor = i === cursor;
    const isSelected = selected.has(i);
    let prefix, color;
    if (multi) {
      prefix = isSelected ? "● " : "○ ";
      color = isCursor ? `${ESC}36m` : isSelected ? `${ESC}32m` : `${ESC}90m`;
    } else {
      prefix = isCursor ? "● " : "○ ";
      color = isCursor ? `${ESC}36m` : `${ESC}90m`;
    }
    out += `${CLEAR_LINE}\r${color}${prefix}${items[i]}${ESC}0m\n`;
  }

  const info = total > height ? `${ESC}2m  (${cursor + 1}/${total})${ESC}0m` : "";
  out += `${CLEAR_LINE}\r${info}\n`;

  return { out, lines: height + 1 };
}

function interactivePrompt(title, items, multi, initialSelected) {
  return new Promise((resolve) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) {
      resolve(multi ? [...initialSelected] : 0);
      return;
    }

    const selected = new Set(initialSelected);
    const total = items.length;
    const viewHeight = getViewportHeight();
    let cursor = 0;
    let drawnLines = 0;

    stdin.setRawMode(true);
    stdin.resume();
    stdout.write(HIDE_CURSOR);

    const hint = multi ? ` ${ESC}2m(space=切换, a=全选, enter=确认)${ESC}0m` : "";
    if (title) stdout.write(`${ESC}1m${title}${ESC}0m${hint}\n`);

    const draw = () => {
      if (drawnLines > 0) stdout.write(moveCursor(-drawnLines));
      const { out, lines } = renderViewport(items, cursor, selected, multi, viewHeight);
      stdout.write(out);
      drawnLines = lines;
    };

    draw();

    const onData = buf => {
      const key = buf.toString();
      if (key === "\x1B[A" || key === "k") {
        cursor = (cursor - 1 + total) % total;
        draw();
      } else if (key === "\x1B[B" || key === "j") {
        cursor = (cursor + 1) % total;
        draw();
      } else if (multi && key === " ") {
        selected.has(cursor) ? selected.delete(cursor) : selected.add(cursor);
        draw();
      } else if (key === "\r" || key === "\n") {
        done();
      } else if (multi && key === "a") {
        if (selected.size === total) selected.clear();
        else items.forEach((_, i) => selected.add(i));
        draw();
      } else if (key === "\x1B" || key === "b") {
        cleanup();
        resolve(BACK);
      } else if (key === "\x03" || key === "q") {
        cleanup();
        process.exit(130);
      }
    };

    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      stdout.write(SHOW_CURSOR);
    };
    const done = () => {
      cleanup();
      resolve(multi ? [...selected].sort((a, b) => a - b) : cursor);
    };

    stdin.on("data", onData);
  });
}

export const BACK = Symbol("BACK");

export async function selectOne(title, items) {
  return interactivePrompt(title, items, false, []);
}

export async function selectMany(title, items, defaults = []) {
  return interactivePrompt(title, items, true, defaults);
}
