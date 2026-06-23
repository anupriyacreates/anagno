/**
 * Anagno Design Kit — Figma plugin generator.
 * Builds three pages (Foundations, Components, Screens) from Anagno's real
 * design tokens (src/styles.css) + component specs. Run once; it creates color
 * styles, text styles, components, and screen mockups, then closes.
 *
 * Fidelity note: this is a clean, on-brand recreation via the Figma Plugin API —
 * not a pixel-perfect render of the live CSS.
 */

// ---------------------------------------------------------------- tokens
const LIGHT = {
  "sand-light": "#f5efe6",
  "sand-mid": "#ede4d3",
  driftwood: "#d6cfc7",
  "ocean-blue": "#7bbfb5",
  seafoam: "#a8d5cb",
  "reef-green": "#7a9e7e",
  "reef-deep": "#5c8a62",
  terracotta: "#c47c5a",
  "text-dark": "#2d2416",
  "text-mid": "#6b5c4e",
  paper: "#ffffff",
  panel: "#faf7f2",
};
const DARK = {
  "sand-light": "#0e1f26",
  "sand-mid": "#16323c",
  driftwood: "#2c4a54",
  "ocean-blue": "#7bbfb5",
  seafoam: "#a8d5cb",
  "reef-green": "#8bb190",
  "reef-deep": "#76a87b",
  terracotta: "#d68a64",
  "text-dark": "#ece3d6",
  "text-mid": "#a99d8c",
  paper: "#16323d",
  panel: "#112730",
};
const FW_COLORS = ["#7bbfb5", "#6b9bb5", "#c47c5a", "#c2a45c", "#7a9e7e", "#5c8a62", "#b0876a"];
const GOLD = "#d9a23a"; // scan/emerging highlight

const SANS = "Plus Jakarta Sans";
const DISPLAY = "Caveat";
const MONO = "Roboto Mono";

// ---------------------------------------------------------------- helpers
function hex(h) {
  const n = h.replace("#", "");
  return {
    r: parseInt(n.slice(0, 2), 16) / 255,
    g: parseInt(n.slice(2, 4), 16) / 255,
    b: parseInt(n.slice(4, 6), 16) / 255,
  };
}
function solid(h, a) {
  return { type: "SOLID", color: hex(h), opacity: a == null ? 1 : a };
}
function cardShadow(dark) {
  return [
    {
      type: "DROP_SHADOW",
      color: dark
        ? { r: 0, g: 0, b: 0, a: 0.35 }
        : { r: 45 / 255, g: 36 / 255, b: 22 / 255, a: 0.1 },
      offset: { x: 0, y: 6 },
      radius: 18,
      spread: 0,
      visible: true,
      blendMode: "NORMAL",
    },
  ];
}

const loaded = new Set();
function styleForWeight(w) {
  return w >= 700 ? "Bold" : w >= 600 ? "SemiBold" : w >= 500 ? "Medium" : "Regular";
}
async function tryFont(family, style) {
  try {
    await figma.loadFontAsync({ family, style });
    loaded.add(family + ":" + style);
  } catch (e) {
    /* not available — pick() will fall back */
  }
}
async function loadFonts() {
  await tryFont("Inter", "Regular");
  await tryFont("Inter", "Bold");
  for (const s of ["Regular", "Medium", "SemiBold", "Bold"]) await tryFont(SANS, s);
  for (const s of ["Medium", "SemiBold", "Bold"]) await tryFont(DISPLAY, s);
  for (const s of ["Regular", "Medium", "Bold"]) await tryFont(MONO, s);
}
function pick(family, weight) {
  const style = styleForWeight(weight || 400);
  if (loaded.has(family + ":" + style)) return { family, style };
  if (loaded.has("Inter:" + style)) return { family: "Inter", style };
  return { family: "Inter", style: "Regular" };
}

// text node
function T(chars, o) {
  o = o || {};
  const t = figma.createText();
  t.fontName = o.font || pick(o.family || SANS, o.weight || 400);
  t.fontSize = o.size || 14;
  t.characters = chars;
  t.fills = [solid(o.color || "#2d2416", o.opacity)];
  if (o.tracking != null) t.letterSpacing = { unit: "PERCENT", value: o.tracking };
  if (o.line != null) t.lineHeight = { unit: "PERCENT", value: o.line };
  if (o.upper) t.textCase = "UPPER";
  if (o.align) t.textAlignHorizontal = o.align;
  if (o.width) {
    t.textAutoResize = "HEIGHT";
    t.resize(o.width, t.height);
  } else {
    t.textAutoResize = "WIDTH_AND_HEIGHT";
  }
  return t;
}

// auto-layout frame
function F(o) {
  o = o || {};
  const f = figma.createFrame();
  f.layoutMode = o.dir || "VERTICAL";
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.itemSpacing = o.gap == null ? 0 : o.gap;
  const p = o.pad;
  if (p != null) {
    if (Array.isArray(p)) {
      f.paddingTop = p[0];
      f.paddingRight = p[1];
      f.paddingBottom = p[2] == null ? p[0] : p[2];
      f.paddingLeft = p[3] == null ? p[1] : p[3];
    } else {
      f.paddingTop = f.paddingBottom = f.paddingLeft = f.paddingRight = p;
    }
  }
  f.fills = o.fill ? [solid(o.fill, o.fillOpacity)] : [];
  if (o.radius != null) f.cornerRadius = o.radius;
  if (o.stroke) {
    f.strokes = [solid(o.stroke, o.strokeOpacity)];
    f.strokeWeight = o.strokeW || 1;
  }
  if (o.align) f.counterAxisAlignItems = o.align; // MIN|CENTER|MAX
  if (o.justify) f.primaryAxisAlignItems = o.justify;
  if (o.effects) f.effects = o.effects;
  if (o.name) f.name = o.name;
  if (o.clip != null) f.clipsContent = o.clip;
  return f;
}
function add(parent) {
  for (let i = 1; i < arguments.length; i++) parent.appendChild(arguments[i]);
  return parent;
}
function dot(size, color) {
  const e = figma.createEllipse();
  e.resize(size, size);
  e.fills = [solid(color)];
  return e;
}

// ---------------------------------------------------------------- styles
function makePaintStyles(prefix, palette) {
  for (const k of Object.keys(palette)) {
    const s = figma.createPaintStyle();
    s.name = "Anagno/" + prefix + "/" + k;
    s.paints = [solid(palette[k])];
  }
}
function makeTextStyles() {
  const defs = [
    ["Display/hero", DISPLAY, 700, 46],
    ["Heading/2xl", SANS, 600, 30],
    ["Heading/xl", SANS, 600, 22],
    ["Title/lg", SANS, 600, 18],
    ["Body/md", SANS, 400, 15],
    ["Body/base", SANS, 400, 14],
    ["Label/sm", SANS, 600, 12.5],
    ["Label/xs", SANS, 700, 11],
    ["Mono/xs", MONO, 500, 11],
  ];
  for (const [name, fam, w, size] of defs) {
    const ts = figma.createTextStyle();
    ts.name = "Anagno/" + name;
    ts.fontName = pick(fam, w);
    ts.fontSize = size;
    if (name.indexOf("Label") === 0) ts.letterSpacing = { unit: "PERCENT", value: 8 };
  }
}

// ---------------------------------------------------------------- components
function btnCTA(label) {
  const b = F({ dir: "HORIZONTAL", pad: [13, 24], radius: 10, fill: "#c47c5a", align: "CENTER", name: "btn-cta" });
  add(b, T(label, { weight: 600, size: 15, color: "#ffffff" }));
  return b;
}
function btnGhost(label) {
  const b = F({ dir: "HORIZONTAL", pad: [12, 18], radius: 9, stroke: "#d6cfc7", strokeW: 1, align: "CENTER", name: "btn-ghost" });
  add(b, T(label, { weight: 600, size: 14, color: "#2d2416" }));
  return b;
}
// finding / Diver node card — accent left border + category/title/body
function findingNode(p) {
  p = p || {};
  const accent = p.accent || "#7bbfb5";
  const dark = !!p.dark;
  const w = p.w || 248;
  const innerW = w - 5 - 31; // minus accent bar + horizontal padding
  const card = F({
    dir: "HORIZONTAL",
    radius: 16,
    fill: dark ? "#25463f" : "#ffffff",
    effects: cardShadow(dark),
    clip: true,
    name: "finding-node",
  });
  const bar = figma.createRectangle();
  bar.resize(5, 10);
  bar.fills = [solid(p.scan ? GOLD : accent)];
  bar.layoutAlign = "STRETCH";
  const content = F({ dir: "VERTICAL", gap: 6, pad: [14, 16, 13, 15] });
  const cat = T((p.cat || "PESTEL · Political").toUpperCase(), { weight: 700, size: 11, tracking: 8, color: p.scan ? GOLD : accent, width: innerW });
  const title = T(p.title || "Switching cost is low", { weight: 600, size: 15, color: dark ? "#ece3d6" : "#2d2416", line: 130, width: innerW });
  const body = T(p.body || "Buyers can leave with little friction, so trust must be earned every visit.", { weight: 400, size: 12.5, color: dark ? "#a8d5cb" : "#6b5c4e", line: 150, width: innerW });
  add(content, cat, title, body);
  add(card, bar, content);
  return card;
}
function fwChip(name, count, color) {
  const c = F({ dir: "HORIZONTAL", gap: 12, pad: [14, 16], radius: 12, fill: "#ffffff", stroke: "#d6cfc7", align: "CENTER", effects: cardShadow(false), name: "fw-chip" });
  c.primaryAxisSizingMode = "FIXED";
  c.resize(260, 1);
  c.counterAxisSizingMode = "AUTO";
  const d = dot(12, color);
  const nm = T(name, { weight: 600, size: 14, color: "#2d2416" });
  nm.layoutGrow = 1;
  const cnt = F({ dir: "HORIZONTAL", pad: [2, 8], radius: 999, fill: "#f5efe6", align: "CENTER" });
  add(cnt, T(String(count), { family: MONO, weight: 600, size: 11, color: "#5c8a62" }));
  add(c, d, nm, cnt);
  return c;
}
function bubble(text, who) {
  const user = who === "user";
  const wrap = F({ dir: "VERTICAL", name: "chat-" + who });
  const b = F({ dir: "HORIZONTAL", pad: [9, 12], radius: 14, fill: user ? "#7bbfb5" : "#ffffff", fillOpacity: user ? 1 : 0.09 });
  const t = T(text, { weight: 400, size: 13, color: user ? "#0d2137" : "#e9f2ee", line: 150, width: 206 });
  add(b, t);
  if (user) wrap.counterAxisAlignItems = "MAX";
  add(wrap, b);
  wrap.layoutAlign = "STRETCH";
  return wrap;
}

// ---------------------------------------------------------------- foundations page
function buildFoundations(page) {
  const root = F({ dir: "VERTICAL", gap: 44, pad: 56, fill: "#f5efe6", name: "Foundations" });
  root.counterAxisSizingMode = "AUTO";

  add(root, T("Anagno — Foundations", { weight: 700, size: 30, color: "#2d2416" }));

  // palettes
  for (const [label, palette, bg, ink] of [
    ["Light palette", LIGHT, "#f5efe6", "#2d2416"],
    ["Dark palette", DARK, "#0e1f26", "#ece3d6"],
  ]) {
    const sec = F({ dir: "VERTICAL", gap: 16, pad: 24, radius: 18, fill: bg, name: label });
    add(sec, T(label, { weight: 700, size: 11, tracking: 8, upper: true, color: ink, opacity: 0.7 }));
    const grid = F({ dir: "HORIZONTAL", gap: 12 });
    grid.layoutWrap = "WRAP";
    grid.counterAxisSizingMode = "AUTO";
    grid.resize(980, 1);
    grid.primaryAxisSizingMode = "FIXED";
    for (const k of Object.keys(palette)) {
      const chip = F({ dir: "VERTICAL", gap: 6, name: k });
      const sw = figma.createRectangle();
      sw.resize(150, 56);
      sw.cornerRadius = 10;
      sw.fills = [solid(palette[k])];
      sw.strokes = [solid(ink, 0.12)];
      add(chip, sw, T(k, { weight: 600, size: 12.5, color: ink }), T(palette[k], { family: MONO, size: 11, color: ink, opacity: 0.6 }));
      add(grid, chip);
    }
    add(sec, grid);
    add(root, sec);
  }

  // type specimens
  const typ = F({ dir: "VERTICAL", gap: 18, pad: 24, radius: 18, fill: "#ffffff", name: "Type", effects: cardShadow(false) });
  add(typ, T("Type scale", { weight: 700, size: 11, tracking: 8, upper: true, color: "#6b5c4e" }));
  const specs = [
    ["Display · Caveat 46", DISPLAY, 700, 46, "Dive"],
    ["Heading 2xl · 30", SANS, 600, 30, "Find the real problem"],
    ["Heading xl · 22", SANS, 600, 22, "Built for problem-framers"],
    ["Title lg · 18", SANS, 600, 18, "Research from a systems lens"],
    ["Body md · 15", SANS, 400, 15, "Findings surface one at a time — keep, tweak, or toss."],
    ["Label xs · 11", SANS, 700, 11, "FRAMEWORK LIBRARY"],
    ["Mono xs · 11", MONO, 500, 11, "// SENSE THE MOOD"],
  ];
  for (const [cap, fam, w, size, sample] of specs) {
    const row = F({ dir: "VERTICAL", gap: 2 });
    add(row, T(cap, { family: MONO, size: 11, color: "#6b5c4e" }), T(sample, { family: fam, weight: w, size, color: "#2d2416", upper: cap.indexOf("Label") === 0 || cap.indexOf("Mono") === 0, tracking: cap.indexOf("Label") === 0 ? 8 : 0 }));
    add(typ, row);
  }
  add(root, typ);

  page.appendChild(root);
  root.x = 0;
  root.y = 0;
}

// ---------------------------------------------------------------- components page
function buildComponents(page) {
  const root = F({ dir: "VERTICAL", gap: 36, pad: 56, fill: "#f5efe6", name: "Components" });
  add(root, T("Anagno — Components", { weight: 700, size: 30, color: "#2d2416" }));

  function group(title, body) {
    const g = F({ dir: "VERTICAL", gap: 14 });
    add(g, T(title, { weight: 700, size: 11, tracking: 8, upper: true, color: "#6b5c4e" }), body);
    return g;
  }

  // buttons
  const btns = F({ dir: "HORIZONTAL", gap: 12, align: "CENTER" });
  add(btns, btnCTA("Get started"), btnGhost("Log in"));
  add(root, group("Buttons", btns));

  // finding nodes
  const nodes = F({ dir: "HORIZONTAL", gap: 16, align: "MIN" });
  add(
    nodes,
    findingNode({ cat: "Stakeholders", title: "Power users feel unheard", accent: "#c47c5a" }),
    findingNode({ cat: "Pattern · scan", title: "Churn feeds neglect — a reinforcing loop", scan: true }),
    findingNode({ cat: "Systems", title: "No owner for retention", accent: "#7a9e7e", dark: true })
  );
  add(root, group("Finding nodes", nodes));

  // framework chips
  const chips = F({ dir: "HORIZONTAL", gap: 12 });
  add(chips, fwChip("Environment & forces", 3, FW_COLORS[0]), fwChip("People & stakeholders", 3, FW_COLORS[2]), fwChip("Systems & causality", 3, FW_COLORS[4]));
  add(root, group("Framework chips", chips));

  // panel headers
  const heads = F({ dir: "HORIZONTAL", gap: 16 });
  for (const [label, bg, ink] of [["Dive", "#0d2137", "#e9f2ee"], ["Surface", "#faf7f2", "#2d2416"]]) {
    const ph = F({ dir: "HORIZONTAL", pad: [14, 16], radius: 12, fill: bg, justify: "SPACE_BETWEEN", align: "CENTER" });
    ph.primaryAxisSizingMode = "FIXED";
    ph.resize(280, 1);
    ph.counterAxisSizingMode = "AUTO";
    const tt = T(label, { family: DISPLAY, weight: 700, size: 26, color: ink });
    add(ph, tt, T("⌄", { weight: 600, size: 16, color: ink, opacity: 0.7 }));
    add(heads, ph);
  }
  add(root, group("Panel headers (Caveat)", heads));

  // chat
  const chat = F({ dir: "VERTICAL", gap: 10, pad: 16, radius: 16, fill: "#0d2137", name: "chat" });
  chat.primaryAxisSizingMode = "FIXED";
  chat.resize(320, 1);
  chat.counterAxisSizingMode = "AUTO";
  add(chat, bubble("what do carpenters value?", "user"), bubble("Here's what Value Proposition surfaces for carpenters — pride in visible craftsmanship, clear scope, and trust they'll get paid.", "bot"));
  // composer
  const comp = F({ dir: "VERTICAL", gap: 8, pad: 10, radius: 16, stroke: "#2c4a54", strokeW: 1 });
  comp.layoutAlign = "STRETCH";
  const lens = F({ dir: "HORIZONTAL", gap: 6, pad: [3, 9], radius: 999, fill: "#ffffff", fillOpacity: 0.1, align: "CENTER" });
  add(lens, dot(8, "#c47c5a"), T("Value Proposition", { weight: 600, size: 11.5, color: "#e9f2ee" }));
  const lensRow = F({ dir: "HORIZONTAL", gap: 6 });
  add(lensRow, lens);
  add(comp, lensRow, T("Ask through the attached lens…", { size: 13, color: "#e9f2ee", opacity: 0.55 }));
  const bar = F({ dir: "HORIZONTAL", justify: "SPACE_BETWEEN", align: "CENTER" });
  bar.layoutAlign = "STRETCH";
  const lensBtn = F({ dir: "HORIZONTAL", gap: 5, pad: [6, 12], radius: 999, fill: "#a8d5cb", align: "CENTER" });
  add(lensBtn, T("+ Lens", { weight: 600, size: 12, color: "#0d2137" }));
  const send = F({ dir: "HORIZONTAL", pad: 9, radius: 999, fill: "#c47c5a", align: "CENTER" });
  add(send, T("↑", { weight: 700, size: 14, color: "#ffffff" }));
  add(bar, lensBtn, send);
  add(comp, bar);
  add(chat, comp);
  add(root, group("Chat + lens composer", chat));

  page.appendChild(root);
  root.x = 0;
  root.y = 0;
}

// ---------------------------------------------------------------- screens page
function landingScreen() {
  const W = 1280;
  const screen = figma.createFrame();
  screen.name = "Landing";
  screen.resize(W, 880);
  screen.fills = [solid("#f5efe6")];
  screen.clipsContent = true;

  // nav
  const nav = F({ dir: "HORIZONTAL", justify: "SPACE_BETWEEN", align: "CENTER", pad: [18, 40] });
  nav.layoutMode = "HORIZONTAL";
  nav.resize(W, 64);
  nav.primaryAxisSizingMode = "FIXED";
  const brand = F({ dir: "HORIZONTAL", gap: 10, align: "CENTER" });
  add(brand, dot(12, "#7bbfb5"), T("Anagno", { weight: 700, size: 18, color: "#2d2416" }));
  const navlinks = F({ dir: "HORIZONTAL", gap: 22, align: "CENTER" });
  for (const l of ["Product", "Use cases", "Pricing", "Changelog"]) add(navlinks, T(l, { weight: 600, size: 15, color: "#2d2416" }));
  const navright = F({ dir: "HORIZONTAL", gap: 12, align: "CENTER" });
  add(navright, T("Log in", { weight: 600, size: 14, color: "#2d2416" }), btnCTA("Sign up"));
  add(nav, brand, navlinks, navright);
  screen.appendChild(nav);
  nav.x = 0;
  nav.y = 0;

  // hero copy
  const hero = F({ dir: "VERTICAL", gap: 18 });
  hero.resize(560, 1);
  hero.primaryAxisSizingMode = "AUTO";
  add(hero, T("AI-NATIVE RESEARCH CANVAS", { weight: 700, size: 11, tracking: 8, upper: true, color: "#5c8a62" }));
  const h1 = T("Find the real problem, not just the obvious one.", { weight: 700, size: 46, color: "#2d2416", line: 105, width: 560 });
  add(hero, h1);
  add(hero, T("Anagno blends an AI research companion with an infinite canvas — explore a problem space from a systems lens and watch the connections surface.", { size: 18, color: "#6b5c4e", line: 155, width: 540 }));
  const cta = F({ dir: "HORIZONTAL", gap: 14, align: "CENTER" });
  add(cta, btnCTA("Get started"), btnGhost("See how it works"));
  add(hero, cta);
  screen.appendChild(hero);
  hero.x = 40;
  hero.y = 120;

  // hero map preview (right)
  const map = F({ dir: "VERTICAL", radius: 18, fill: "#ffffff", stroke: "#d6cfc7", effects: cardShadow(false), clip: true });
  map.resize(560, 360);
  map.layoutMode = "NONE";
  const n1 = findingNode({ cat: "Stakeholders", title: "Power users feel unheard", accent: "#c47c5a", w: 180 });
  const n2 = findingNode({ cat: "PESTEL · forces", title: "Switching cost is low", accent: "#7bbfb5", w: 180 });
  const n3 = findingNode({ cat: "Pattern · scan", title: "Churn feeds neglect", scan: true, w: 200 });
  map.appendChild(n1); n1.x = 24; n1.y = 36;
  map.appendChild(n2); n2.x = 330; n2.y = 28;
  map.appendChild(n3); n3.x = 150; n3.y = 200;
  const badge = F({ dir: "HORIZONTAL", gap: 7, pad: [5, 11], radius: 999, fill: "#ffffff", stroke: "#d6cfc7", align: "CENTER", effects: cardShadow(false) });
  add(badge, dot(8, GOLD), T("Pattern scan · 1 loop", { weight: 600, size: 11, color: "#6b5c4e" }));
  map.appendChild(badge); badge.x = 330; badge.y = 300;
  screen.appendChild(map);
  map.x = 660;
  map.y = 120;

  // how-it-works cards
  const how = F({ dir: "HORIZONTAL", gap: 22 });
  const steps = [
    ["01", "Research from a systems lens", "Run your problem space through proven frameworks at once — PESTEL, stakeholders, causal loops."],
    ["02", "Stay in control of every insight", "Findings surface one at a time. Keep, tweak, or toss — nothing lands without you."],
    ["03", "See the system, not a list", "Insights become connected nodes. Scan for patterns to surface loops and leverage points."],
  ];
  for (const [n, t, b] of steps) {
    const c = F({ dir: "VERTICAL", gap: 8, pad: 24, radius: 16, fill: "#ffffff", stroke: "#d6cfc7", effects: cardShadow(false) });
    c.resize(380, 1);
    c.primaryAxisSizingMode = "AUTO";
    c.counterAxisSizingMode = "FIXED";
    add(c, T(n, { family: MONO, size: 12.5, color: "#5c8a62" }), T(t, { weight: 600, size: 18, color: "#2d2416" }), T(b, { size: 14, color: "#6b5c4e", line: 155, width: 332 }));
    add(how, c);
  }
  screen.appendChild(how);
  how.x = 40;
  how.y = 540;

  return screen;
}

function workspaceScreen() {
  const W = 1440;
  const H = 860;
  const screen = figma.createFrame();
  screen.name = "Workspace";
  screen.resize(W, H);
  screen.fills = [solid("#f5efe6")];
  screen.clipsContent = true;

  // top bar
  const top = F({ dir: "HORIZONTAL", gap: 14, align: "CENTER", justify: "SPACE_BETWEEN", pad: [8, 16], fill: "#faf7f2" });
  top.resize(W, 48);
  top.primaryAxisSizingMode = "FIXED";
  const tl = F({ dir: "HORIZONTAL", gap: 14, align: "CENTER" });
  add(tl, T("⌂", { size: 18, color: "#6b5c4e" }), T("Research retention", { weight: 600, size: 15, color: "#2d2416" }));
  const tr = F({ dir: "HORIZONTAL", gap: 12, align: "CENTER" });
  add(tr, btnGhost("Description"), T("☾", { size: 16, color: "#6b5c4e" }));
  add(top, tl, tr);
  screen.appendChild(top); top.x = 0; top.y = 0;

  // left Dive panel (always dark)
  const dive = F({ dir: "VERTICAL", gap: 14, pad: 16, fill: "#0d2137" });
  dive.resize(380, H - 48);
  dive.primaryAxisSizingMode = "FIXED";
  dive.counterAxisSizingMode = "FIXED";
  const dh = F({ dir: "HORIZONTAL", justify: "SPACE_BETWEEN", align: "CENTER" });
  dh.layoutAlign = "STRETCH";
  add(dh, T("Dive", { family: DISPLAY, weight: 700, size: 26, color: "#e9f2ee" }), T("＋  ☰  ⌄", { size: 14, color: "#a8d5cb" }));
  add(dive, dh);
  add(dive, bubble("where do we go from here?", "user"), bubble("Map the lifecycle of an insight — where it's created, stored, and where the chain breaks. The loss usually happens at handoff.", "bot"));
  const sp = F({});
  sp.layoutGrow = 1;
  sp.fills = [];
  sp.layoutAlign = "STRETCH";
  add(dive, sp);
  const comp = F({ dir: "VERTICAL", gap: 8, pad: 10, radius: 16, stroke: "#2c4a54", strokeW: 1 });
  comp.layoutAlign = "STRETCH";
  add(comp, T("Ask a follow-up…", { size: 13, color: "#e9f2ee", opacity: 0.55 }));
  const cbar = F({ dir: "HORIZONTAL", justify: "SPACE_BETWEEN", align: "CENTER" });
  cbar.layoutAlign = "STRETCH";
  const lb = F({ dir: "HORIZONTAL", gap: 5, pad: [6, 12], radius: 999, fill: "#a8d5cb", align: "CENTER" });
  add(lb, T("+ Lens", { weight: 600, size: 12, color: "#0d2137" }));
  const sd = F({ dir: "HORIZONTAL", pad: 9, radius: 999, fill: "#7a9e7e", align: "CENTER" });
  add(sd, T("↑", { weight: 700, size: 14, color: "#ffffff" }));
  add(cbar, lb, sd);
  add(comp, cbar);
  add(dive, comp);
  screen.appendChild(dive); dive.x = 0; dive.y = 48;

  // canvas (middle) with nodes + edges
  const canvas = figma.createFrame();
  canvas.name = "canvas";
  canvas.resize(W - 380 - 360, H - 48);
  canvas.fills = [solid("#f5efe6")];
  canvas.clipsContent = true;
  // edges (simple lines)
  function line(x1, y1, x2, y2) {
    const ln = figma.createVector();
    ln.strokeWeight = 1.6;
    ln.strokes = [solid("#7a9e7e", 0.7)];
    ln.vectorPaths = [{ windingRule: "NONE", data: "M " + x1 + " " + y1 + " L " + x2 + " " + y2 }];
    return ln;
  }
  canvas.appendChild(line(150, 130, 360, 250));
  canvas.appendChild(line(560, 120, 400, 250));
  canvas.appendChild(line(220, 380, 380, 300));
  const a = findingNode({ cat: "Stakeholders", title: "Power users feel unheard", accent: "#c47c5a", w: 220 });
  const b = findingNode({ cat: "PESTEL · forces", title: "Switching cost is low", accent: "#7bbfb5", w: 220 });
  const c = findingNode({ cat: "Pattern · scan", title: "Churn feeds neglect — a reinforcing loop", scan: true, w: 240 });
  const d = findingNode({ cat: "Root cause", title: "No owner for retention", accent: "#7a9e7e", w: 220 });
  canvas.appendChild(a); a.x = 40; a.y = 60;
  canvas.appendChild(b); b.x = 470; b.y = 50;
  canvas.appendChild(c); c.x = 250; c.y = 240;
  canvas.appendChild(d); d.x = 60; d.y = 360;
  screen.appendChild(canvas); canvas.x = 380; canvas.y = 48;

  // right Surface panel
  const surf = F({ dir: "VERTICAL", gap: 14, pad: 16, fill: "#faf7f2", justify: "SPACE_BETWEEN" });
  surf.resize(360, H - 48);
  surf.primaryAxisSizingMode = "FIXED";
  surf.counterAxisSizingMode = "FIXED";
  const stop = F({ dir: "VERTICAL", gap: 14 });
  stop.layoutAlign = "STRETCH";
  add(stop, T("Surface", { family: DISPLAY, weight: 700, size: 26, color: "#2d2416" }));
  // confirm card
  const confirm = findingNode({ cat: "Value Proposition", title: "Trust they'll get paid", body: "Carpenters value reliable, on-time payment as much as the work itself — late pay erodes the relationship fast.", accent: "#c47c5a", w: 320 });
  add(stop, confirm);
  const actions = F({ dir: "HORIZONTAL", gap: 8 });
  add(actions, btnCTA("Keep it"), btnGhost("Tweak"), btnGhost("Toss"));
  add(stop, actions);
  add(surf, stop);
  const scan = F({ dir: "HORIZONTAL", pad: [13, 24], radius: 10, fill: "#5c8a62", align: "CENTER", justify: "CENTER" });
  scan.layoutAlign = "STRETCH";
  add(scan, T("Scan for patterns", { weight: 600, size: 15, color: "#ffffff" }));
  add(surf, scan);
  screen.appendChild(surf); surf.x = W - 360; surf.y = 48;

  return screen;
}

function buildScreens(page) {
  const title = T("Anagno — Screens", { weight: 700, size: 30, color: "#2d2416" });
  page.appendChild(title);
  title.x = 0;
  title.y = -70;
  const landing = landingScreen();
  page.appendChild(landing);
  landing.x = 0;
  landing.y = 0;
  const ws = workspaceScreen();
  page.appendChild(ws);
  ws.x = 0;
  ws.y = 960;
}

// ---------------------------------------------------------------- run
(async () => {
  await loadFonts();

  makePaintStyles("Light", LIGHT);
  makePaintStyles("Dark", DARK);
  makeTextStyles();

  const pFound = figma.createPage();
  pFound.name = "01 Foundations";
  buildFoundations(pFound);

  const pComp = figma.createPage();
  pComp.name = "02 Components";
  buildComponents(pComp);

  const pScreens = figma.createPage();
  pScreens.name = "03 Screens";
  buildScreens(pScreens);

  figma.currentPage = pFound;
  figma.viewport.scrollAndZoomIntoView(pFound.children);
  figma.closePlugin("Anagno Design Kit generated ✓  (3 pages: Foundations, Components, Screens)");
})();
