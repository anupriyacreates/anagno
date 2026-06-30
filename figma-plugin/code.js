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

// Wrap an auto-layout frame inside a plain (NONE-layout) frame.
// An auto-layout frame appended *directly* to a page does not reflow its
// hug-height and collapses to ~0px; nested inside a plain frame it sizes
// correctly (same pattern the Workspace/Login screens already use).
// Re-stack an auto-layout column's children as hand-positioned bands inside a
// plain (NONE-layout) frame. Some Figma builds don't grow a hug-height column
// that was seeded with resize(W, 1) — it stays 1px tall and clips every band.
// Each band lays out correctly on its own, so we just reparent and place them.
// stretch=true forces each band to the full width (landing/projects sections);
// stretch=false keeps natural widths (foundations/components specimen columns).
function bake(src, opts) {
  opts = opts || {};
  const stretch = !!opts.stretch;
  const gap = src.itemSpacing || 0;
  const padL = src.paddingLeft || 0;
  const padR = src.paddingRight || 0;
  const padT = src.paddingTop || 0;
  const padB = src.paddingBottom || 0;
  const innerW = Math.max(src.width - padL - padR, 1);

  const root = figma.createFrame();
  root.name = src.name || "frame";
  root.clipsContent = false;
  root.fills = src.fills && src.fills.length ? src.fills.map((p) => Object.assign({}, p)) : [];

  const kids = src.children.slice();
  let y = padT;
  let maxW = 0;
  for (const k of kids) {
    root.appendChild(k);
    if (stretch && k.layoutMode === "HORIZONTAL") {
      k.primaryAxisSizingMode = "FIXED";
      k.resize(innerW, Math.max(k.height, 1));
    } else if (stretch && k.layoutMode === "VERTICAL") {
      k.counterAxisSizingMode = "FIXED";
      k.resize(innerW, Math.max(k.height, 1));
    }
    k.x = padL;
    k.y = y;
    y += k.height + gap;
    if (k.width > maxW) maxW = k.width;
  }
  const totalW = stretch ? Math.max(src.width, 1) : maxW + padL + padR;
  root.resize(Math.max(totalW, 1), Math.max(y - gap + padB, 1));
  src.remove();
  return root;
}

// Pin an explicit height on a hug-height auto-layout frame. Some Figma builds
// leave the height at the seeded resize(W, 1) instead of growing to fit
// children, which clips the content. Call this AFTER children are added and the
// width is set; it computes the real height from the (already-correct) children.
function fixH(f) {
  if (!f || !f.layoutMode || f.layoutMode === "NONE") return;
  const padT = f.paddingTop || 0;
  const padB = f.paddingBottom || 0;
  const padL = f.paddingLeft || 0;
  const padR = f.paddingRight || 0;
  const kids = f.children;
  if (f.layoutWrap === "WRAP") {
    const innerW = Math.max(f.width - padL - padR, 1);
    const gap = f.itemSpacing || 0;
    const vgap = f.counterAxisSpacing == null ? gap : f.counterAxisSpacing;
    let x = 0;
    let rowH = 0;
    let total = 0;
    let first = true;
    for (const k of kids) {
      if (!first && x + gap + k.width > innerW) {
        total += rowH + vgap;
        x = 0;
        rowH = 0;
        first = true;
      }
      x += (first ? 0 : gap) + k.width;
      if (k.height > rowH) rowH = k.height;
      first = false;
    }
    total += rowH;
    f.counterAxisSizingMode = "FIXED";
    f.resize(f.width, Math.max(total + padT + padB, 1));
    return;
  }
  let h;
  if (f.layoutMode === "HORIZONTAL") {
    let mx = 0;
    for (const k of kids) if (k.height > mx) mx = k.height;
    h = mx + padT + padB;
    f.counterAxisSizingMode = "FIXED";
  } else {
    const gap = f.itemSpacing || 0;
    h = padT + padB;
    for (let i = 0; i < kids.length; i++) h += kids[i].height + (i ? gap : 0);
    f.primaryAxisSizingMode = "FIXED";
  }
  f.resize(f.width, Math.max(h, 1));
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
  fixH(c);
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

// actor / factor systems-model nodes
function kindNode(p) {
  const isActor = p.kind === "actor";
  const accent = isActor ? "#c47c5a" : "#7bbfb5";
  const badgeText = isActor ? "ACTOR" : "FACTOR";
  const badgeColor = isActor ? "#9c4a28" : "#2f6f66";
  const w = p.w || 248;
  const innerW = w - 5 - 31;
  const card = F({ dir: "HORIZONTAL", radius: 16, fill: "#ffffff", effects: cardShadow(false), clip: true, name: p.kind + "-node" });
  const bar = figma.createRectangle();
  bar.resize(5, 10);
  bar.fills = [solid(accent)];
  bar.layoutAlign = "STRETCH";
  const content = F({ dir: "VERTICAL", gap: 6, pad: [14, 16, 13, 15] });
  const catRow = F({ dir: "HORIZONTAL", gap: 6, align: "CENTER" });
  const badge = F({ dir: "HORIZONTAL", pad: [1, 6], radius: 999, fill: accent, fillOpacity: 0.16, align: "CENTER" });
  add(badge, T(badgeText, { weight: 700, size: 9, tracking: 8, color: badgeColor }));
  add(catRow, badge);
  const title = T(p.title, { weight: 600, size: 15, color: "#2d2416", line: 130, width: innerW });
  add(content, catRow, title);
  if (isActor) {
    const chips = F({ dir: "HORIZONTAL", gap: 5 });
    for (const [c, bg, fg] of [
      ["power: high", "#ede4d3", "#6b5c4e"],
      ["interest: high", "#ede4d3", "#6b5c4e"],
      ["ally", "rgba", "#4a6b4e"],
    ]) {
      const ch = F({ dir: "HORIZONTAL", pad: [2, 8], radius: 999, fill: bg === "rgba" ? "#7a9e7e" : bg, fillOpacity: bg === "rgba" ? 0.2 : 1, align: "CENTER" });
      add(ch, T(c, { weight: 600, size: 10.5, color: fg }));
      add(chips, ch);
    }
    add(content, chips);
  }
  add(card, bar, content);
  return card;
}

// signed causal link pill (the +/- on a connection)
function signedLink(sign, label) {
  const row = F({ dir: "HORIZONTAL", gap: 4, align: "CENTER" });
  const s = F({ dir: "HORIZONTAL", radius: 999, fill: sign === "+" ? "#7a9e7e" : "#c47c5a", align: "CENTER", justify: "CENTER" });
  s.primaryAxisSizingMode = "FIXED";
  s.counterAxisSizingMode = "FIXED";
  s.resize(16, 16);
  add(s, T(sign, { family: MONO, weight: 700, size: 10, color: "#ffffff" }));
  const pill = F({ dir: "HORIZONTAL", pad: [1, 7], radius: 999, fill: "#ffffff", stroke: "#d6cfc7", align: "CENTER" });
  add(pill, T(label, { family: MONO, weight: 500, size: 9.5, color: "#5c8a62" }));
  add(row, s, pill);
  return row;
}

// canvas element cards (sticky / text / shape / link)
function stickyCard() {
  const c = F({ dir: "VERTICAL", gap: 6, pad: 12, radius: 6, fill: "#f3e2a9", name: "sticky" });
  c.primaryAxisSizingMode = "FIXED";
  c.counterAxisSizingMode = "FIXED";
  c.resize(170, 130);
  add(c, T("Sticky note", { weight: 700, size: 11, tracking: 6, upper: true, color: "#8a6d1f" }), T("A quick thought, parked on the canvas.", { size: 13, color: "#5a4a1c", line: 145, width: 146 }));
  return c;
}
function textCard() {
  const c = F({ dir: "VERTICAL", pad: 6 });
  add(c, T("Free text on the canvas", { weight: 600, size: 18, color: "#2d2416" }));
  return c;
}
function shapeRow() {
  const row = F({ dir: "HORIZONTAL", gap: 12, align: "CENTER" });
  // rect
  const r = figma.createRectangle();
  r.resize(64, 44);
  r.cornerRadius = 8;
  r.fills = [solid("#7bbfb5", 0.85)];
  // ellipse
  const e = figma.createEllipse();
  e.resize(54, 44);
  e.fills = [solid("#c47c5a", 0.85)];
  // triangle
  const t = figma.createPolygon();
  t.pointCount = 3;
  t.resize(50, 46);
  t.fills = [solid("#7a9e7e", 0.85)];
  // diamond (square rotated)
  const d = figma.createPolygon();
  d.pointCount = 4;
  d.resize(46, 46);
  d.fills = [solid("#c2a45c", 0.85)];
  add(row, r, e, t, d);
  return row;
}
function linkCard() {
  const c = F({ dir: "HORIZONTAL", gap: 10, pad: 10, radius: 12, fill: "#ffffff", stroke: "#d6cfc7", align: "CENTER", effects: cardShadow(false), name: "link" });
  c.primaryAxisSizingMode = "FIXED";
  c.resize(280, 1);
  c.counterAxisSizingMode = "AUTO";
  const thumb = F({ dir: "HORIZONTAL", radius: 8, fill: "#f5efe6", align: "CENTER", justify: "CENTER" });
  thumb.primaryAxisSizingMode = "FIXED";
  thumb.counterAxisSizingMode = "FIXED";
  thumb.resize(46, 46);
  add(thumb, T("↗", { weight: 700, size: 16, color: "#5c8a62" }));
  const meta = F({ dir: "VERTICAL", gap: 2 });
  meta.layoutGrow = 1;
  add(meta, T("Why modular homes stall — a field study", { weight: 600, size: 13, color: "#2d2416", line: 130, width: 180 }), T("modulushousing.com", { family: MONO, size: 10.5, color: "#6b5c4e" }));
  add(c, thumb, meta);
  fixH(c);
  return c;
}

// Surface confirm card with keep/tweak/toss + carousel + bring-into-chat
function surfaceCard() {
  const wrap = F({ dir: "VERTICAL", gap: 10, name: "surface-confirm" });
  wrap.primaryAxisSizingMode = "FIXED";
  wrap.resize(320, 1);
  wrap.counterAxisSizingMode = "AUTO";
  add(wrap, T("1 / 4", { family: MONO, weight: 600, size: 12.5, color: "#6b5c4e" }));
  const card = findingNode({ cat: "Value Proposition", title: "Trust they'll get paid", body: "Carpenters value reliable, on-time payment as much as the work itself — late pay erodes the relationship fast.", accent: "#c47c5a", w: 320 });
  add(wrap, card);
  const acts = F({ dir: "HORIZONTAL", gap: 8 });
  add(acts, btnCTA("Keep it"), btnGhost("Tweak it"), btnGhost("Toss it"));
  add(wrap, acts);
  const bring = F({ dir: "HORIZONTAL", pad: [7, 12], radius: 9, stroke: "#d6cfc7", strokeW: 1, align: "CENTER" });
  add(bring, T("Bring into chat", { weight: 600, size: 12.5, color: "#5c8a62" }));
  add(wrap, bring);
  fixH(bring);
  fixH(wrap);
  return wrap;
}

// project card + new-project tile (Projects page)
function projectCard(name, desc, edited, hue) {
  const c = F({ dir: "VERTICAL", radius: 16, fill: "#ffffff", stroke: "#d6cfc7", effects: cardShadow(false), clip: true, name: "project" });
  c.primaryAxisSizingMode = "AUTO";
  c.counterAxisSizingMode = "FIXED";
  c.resize(260, 1);
  const banner = figma.createRectangle();
  banner.resize(260, 84);
  banner.fills = [solid(hue)];
  banner.layoutAlign = "STRETCH";
  const body = F({ dir: "VERTICAL", gap: 4, pad: [12, 16, 16, 16] });
  body.layoutAlign = "STRETCH";
  add(body, T(name, { weight: 600, size: 18, color: "#2d2416" }), T(desc, { size: 12.5, color: "#6b5c4e", line: 140, width: 228 }), T(edited, { size: 11, color: "#6b5c4e", opacity: 0.85 }));
  add(c, banner, body);
  fixH(body);
  fixH(c);
  return c;
}
function newProjectCard() {
  const c = F({ dir: "VERTICAL", gap: 8, pad: 24, radius: 16, stroke: "#d6cfc7", align: "CENTER", justify: "CENTER", name: "project-new" });
  c.primaryAxisSizingMode = "FIXED";
  c.counterAxisSizingMode = "FIXED";
  c.resize(260, 196);
  c.dashPattern = [6, 4];
  add(c, T("+", { weight: 700, size: 26, color: "#6b5c4e" }), T("New project", { weight: 600, size: 13, color: "#6b5c4e" }));
  return c;
}

// login modal card
function loginCard() {
  const card = F({ dir: "VERTICAL", gap: 6, pad: 30, radius: 18, fill: "#ffffff", stroke: "#d6cfc7", effects: cardShadow(false), name: "login-card" });
  card.primaryAxisSizingMode = "AUTO";
  card.counterAxisSizingMode = "FIXED";
  card.resize(400, 1);
  const brand = F({ dir: "HORIZONTAL", gap: 9, align: "CENTER" });
  add(brand, dot(12, "#7bbfb5"), T("Anagno", { weight: 700, size: 15, color: "#2d2416" }));
  add(card, brand);
  add(card, T("Welcome back", { weight: 600, size: 22, color: "#2d2416" }));
  add(card, T("Sign in to your workspace.", { size: 14, color: "#6b5c4e" }));
  for (const [lbl, val] of [["Email", "you@studio.com"], ["Password", "••••••••"]]) {
    const field = F({ dir: "VERTICAL", gap: 6 });
    field.layoutAlign = "STRETCH";
    const input = F({ dir: "HORIZONTAL", pad: [10, 12], radius: 10, fill: "#f5efe6", stroke: "#d6cfc7" });
    input.layoutAlign = "STRETCH";
    add(input, T(val, { size: 14, color: "#6b5c4e" }));
    add(field, T(lbl, { weight: 600, size: 12.5, color: "#6b5c4e" }), input);
    const sp = F({});
    sp.resize(1, 14);
    sp.fills = [];
    add(card, sp, field);
  }
  const sp2 = F({});
  sp2.resize(1, 16);
  sp2.fills = [];
  const cta = F({ dir: "HORIZONTAL", pad: [13, 24], radius: 10, fill: "#c47c5a", align: "CENTER", justify: "CENTER" });
  cta.layoutAlign = "STRETCH";
  add(cta, T("Sign in", { weight: 600, size: 15, color: "#ffffff" }));
  add(card, sp2, cta);
  fixH(cta);
  fixH(card);
  return card;
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
    fixH(grid);
    add(sec, grid);
    fixH(sec);
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

  const wrap = bake(root, { stretch: false });
  page.appendChild(wrap);
  wrap.x = 0;
  wrap.y = 0;
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

  // systems-model nodes (actor / factor)
  const kinds = F({ dir: "HORIZONTAL", gap: 16, align: "MIN" });
  add(
    kinds,
    kindNode({ kind: "actor", title: "Power users" }),
    kindNode({ kind: "factor", title: "Switching cost" })
  );
  add(root, group("Systems nodes — actor / factor", kinds));

  // signed causal links
  const links = F({ dir: "HORIZONTAL", gap: 18, align: "CENTER" });
  add(links, signedLink("+", "amplifies"), signedLink("-", "contradicts"), signedLink("+", "relates to"));
  add(root, group("Signed causal links", links));

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
    fixH(ph);
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
  fixH(comp);
  add(chat, comp);
  fixH(chat);
  add(root, group("Chat + lens composer", chat));

  // canvas elements
  const els = F({ dir: "HORIZONTAL", gap: 16, align: "CENTER" });
  add(els, stickyCard(), textCard(), shapeRow(), linkCard());
  add(root, group("Canvas elements — sticky / text / shapes / link", els));

  // surface confirm card
  add(root, group("Surface — confirm card (keep / tweak / toss)", surfaceCard()));

  const wrap = bake(root, { stretch: false });
  page.appendChild(wrap);
  wrap.x = 0;
  wrap.y = 0;
}

// ---------------------------------------------------------------- screens page
function heroMap() {
  const map = F({ dir: "VERTICAL", radius: 18, fill: "#ffffff", stroke: "#d6cfc7", effects: cardShadow(false), clip: true });
  map.layoutMode = "NONE";
  map.resize(540, 340);
  const n1 = findingNode({ cat: "Stakeholders", title: "Power users feel unheard", accent: "#c47c5a", w: 180 });
  const n2 = findingNode({ cat: "PESTEL · forces", title: "Switching cost is low", accent: "#7bbfb5", w: 180 });
  const n3 = findingNode({ cat: "Pattern · scan", title: "Churn feeds neglect", scan: true, w: 200 });
  map.appendChild(n1); n1.x = 24; n1.y = 32;
  map.appendChild(n2); n2.x = 320; n2.y = 26;
  map.appendChild(n3); n3.x = 150; n3.y = 196;
  const badge = F({ dir: "HORIZONTAL", gap: 7, pad: [5, 11], radius: 999, fill: "#ffffff", stroke: "#d6cfc7", align: "CENTER", effects: cardShadow(false) });
  add(badge, dot(8, GOLD), T("Pattern scan · 1 loop", { weight: 600, size: 11, color: "#6b5c4e" }));
  map.appendChild(badge); badge.x = 310; badge.y = 286;
  return map;
}

function cardThree(items) {
  const row = F({ dir: "HORIZONTAL", gap: 22, align: "MIN" });
  const cardW = 372;
  const innerW = cardW - 48;
  for (const [a, b, c] of items) {
    const card = F({ dir: "VERTICAL", gap: 8, pad: 24, radius: 16, fill: "#ffffff", stroke: "#d6cfc7", effects: cardShadow(false) });
    card.counterAxisSizingMode = "FIXED";
    card.resize(cardW, 1);
    if (c !== undefined)
      add(card, T(a, { family: MONO, size: 12.5, color: "#5c8a62" }), T(b, { weight: 600, size: 18, color: "#2d2416", width: innerW }), T(c, { size: 14, color: "#6b5c4e", line: 155, width: innerW }));
    else add(card, T(a, { weight: 600, size: 18, color: "#2d2416", width: innerW }), T(b, { size: 14, color: "#6b5c4e", line: 155, width: innerW }));
    fixH(card);
    add(row, card);
  }
  return row;
}

function landingScreen() {
  const W = 1280;
  const screen = F({ dir: "VERTICAL", gap: 0, fill: "#f5efe6", name: "Landing", clip: true });
  screen.counterAxisSizingMode = "FIXED";
  screen.primaryAxisSizingMode = "AUTO";
  screen.resize(W, 1);

  const band = (o) => {
    const b = F({ dir: o.dir || "VERTICAL", gap: o.gap == null ? 16 : o.gap, pad: o.pad || [44, 40], fill: o.fill, align: o.align, justify: o.justify });
    b.layoutAlign = "STRETCH";
    return b;
  };

  // nav
  const nav = band({ dir: "HORIZONTAL", pad: [18, 40], align: "CENTER", justify: "SPACE_BETWEEN" });
  const brand = F({ dir: "HORIZONTAL", gap: 10, align: "CENTER" });
  add(brand, dot(12, "#7bbfb5"), T("Anagno", { weight: 700, size: 18, color: "#2d2416" }));
  const navlinks = F({ dir: "HORIZONTAL", gap: 22, align: "CENTER" });
  for (const l of ["Product", "Use cases", "Pricing", "Changelog", "Contact"]) add(navlinks, T(l, { weight: 600, size: 15, color: "#2d2416" }));
  const navright = F({ dir: "HORIZONTAL", gap: 12, align: "CENTER" });
  add(navright, T("Log in", { weight: 600, size: 14, color: "#2d2416" }), btnCTA("Sign up"));
  add(nav, brand, navlinks, navright);
  add(screen, nav);

  // hero
  const hero = band({ dir: "HORIZONTAL", gap: 48, pad: [40, 40, 64, 40], align: "CENTER" });
  const copy = F({ dir: "VERTICAL", gap: 18 });
  copy.layoutGrow = 1;
  add(copy, T("AI-NATIVE RESEARCH CANVAS", { weight: 700, size: 11, tracking: 8, upper: true, color: "#5c8a62" }));
  add(copy, T("Find the real problem, not just the obvious one.", { weight: 700, size: 46, color: "#2d2416", line: 105, width: 560 }));
  add(copy, T("Anagno blends an AI research companion with an infinite canvas — explore a problem space from a systems lens and watch the connections surface.", { size: 18, color: "#6b5c4e", line: 155, width: 520 }));
  const cta = F({ dir: "HORIZONTAL", gap: 14, align: "CENTER" });
  add(cta, btnCTA("Get started"), btnGhost("See how it works"));
  add(copy, cta);
  add(hero, copy, heroMap());
  add(screen, hero);

  // logo strip
  const logos = band({ pad: [28, 40], align: "CENTER", gap: 18 });
  add(logos, T("TRUSTED BY RESEARCH & DESIGN TEAMS", { weight: 700, size: 11, tracking: 8, color: "#6b5c4e", align: "CENTER" }));
  const logoRow = F({ dir: "HORIZONTAL", gap: 34, align: "CENTER", justify: "CENTER" });
  logoRow.layoutAlign = "STRETCH";
  for (const n of ["Northwind", "Lumen", "Fjord Labs", "Cairn", "Meridian", "Halcyon"]) {
    const li = F({ dir: "HORIZONTAL", gap: 8, align: "CENTER" });
    add(li, dot(14, "#9aa0a8"), T(n, { weight: 700, size: 15, color: "#8a8f97" }));
    add(logoRow, li);
  }
  add(logos, logoRow);
  add(screen, logos);

  // how it works
  const how = band({ pad: [40, 40], gap: 18 });
  add(how, T("HOW IT WORKS", { weight: 700, size: 11, tracking: 8, color: "#5c8a62" }));
  add(how, cardThree([
    ["01", "Research from a systems lens", "Run your problem space through proven frameworks at once — PESTEL, stakeholders, causal loops."],
    ["02", "Stay in control of every insight", "Findings surface one at a time. Keep, tweak, or toss — nothing lands without you."],
    ["03", "See the system, not a list", "Insights become connected nodes. Scan for patterns to surface loops and leverage points."],
  ]));
  add(screen, how);

  // frameworks moment
  const fw = band({ dir: "HORIZONTAL", pad: [40, 40], gap: 44, align: "CENTER" });
  const fwCopy = F({ dir: "VERTICAL", gap: 12 });
  fwCopy.layoutGrow = 1;
  add(fwCopy, T("FRAMEWORK LIBRARY", { weight: 700, size: 11, tracking: 8, color: "#5c8a62" }), T("Load a lens. Dive. Watch findings surface.", { weight: 700, size: 30, color: "#2d2416", line: 115, width: 420 }), T("Stack proven lenses into the Diver and run them together — or define your own.", { size: 15, color: "#6b5c4e", line: 155, width: 420 }));
  const fwChips = F({ dir: "VERTICAL", gap: 10 });
  fwChips.layoutGrow = 1;
  add(fwChips, fwChip("Environment & forces", 3, FW_COLORS[0]), fwChip("People & stakeholders", 3, FW_COLORS[2]), fwChip("Systems & causality", 3, FW_COLORS[4]));
  add(fw, fwCopy, fwChips);
  add(screen, fw);

  // quote band
  const quote = band({ pad: [48, 120], fill: "#faf7f2", align: "CENTER", gap: 14 });
  add(quote, T("“The first tool that made our research feel like a system instead of a graveyard of docs.”", { weight: 500, size: 24, color: "#2d2416", line: 140, align: "CENTER", width: 900 }));
  add(quote, T("Maya Okonkwo · Head of UX Research, Meridian", { weight: 600, size: 13, color: "#6b5c4e", align: "CENTER" }));
  add(screen, quote);

  // use cases
  const uc = band({ pad: [40, 40], gap: 18 });
  add(uc, T("USE CASES", { weight: 700, size: 11, tracking: 8, color: "#5c8a62" }));
  add(uc, cardThree([
    ["Product designers", "Map the messy problem behind a feature request before you open Figma."],
    ["User researchers", "Turn interviews into a living system of insights, not another report nobody reopens."],
    ["Product managers", "Pressure-test a problem from every angle and spot the leverage points."],
  ]));
  add(screen, uc);

  // changelog
  const clog = band({ pad: [40, 40], gap: 12 });
  add(clog, T("CHANGELOG — WHAT'S NEW", { weight: 700, size: 11, tracking: 8, color: "#5c8a62" }));
  for (const [v, note] of [["v0.5 · Jun 2026", "Star & pin individual chat responses."], ["v0.4 · May 2026", "Pattern scan flags contradictions & emerging insights."], ["v0.3 · Apr 2026", "Framework library by category + custom lenses."]]) {
    const row = F({ dir: "HORIZONTAL", gap: 18, pad: [10, 0] });
    row.layoutAlign = "STRETCH";
    add(row, T(v, { family: MONO, weight: 700, size: 11, color: "#5c8a62" }), T(note, { size: 14, color: "#2d2416" }));
    add(clog, row);
  }
  add(screen, clog);

  // pricing (coming soon)
  const pricing = band({ pad: [48, 40], fill: "#faf7f2", align: "CENTER", gap: 10 });
  add(pricing, T("PRICING", { weight: 700, size: 11, tracking: 8, color: "#5c8a62", align: "CENTER" }), T("Simple pricing is on the way", { weight: 600, size: 30, color: "#2d2416", align: "CENTER" }), T("Free while in early access — start diving now.", { size: 15, color: "#6b5c4e", align: "CENTER" }));
  const pcta = btnCTA("Get started");
  add(pricing, pcta);
  add(screen, pricing);

  // CTA band
  const ctaBand = band({ pad: [60, 40], fill: "#5c8a62", align: "CENTER", gap: 10 });
  add(ctaBand, T("Ready to find the real problem?", { weight: 700, size: 30, color: "#ffffff", align: "CENTER" }), T("Set a context, load a lens, and watch the system surface.", { size: 15, color: "#ffffff", opacity: 0.85, align: "CENTER" }));
  add(ctaBand, btnCTA("Get started"));
  add(screen, ctaBand);

  // footer
  const footer = band({ dir: "HORIZONTAL", pad: [32, 40], justify: "SPACE_BETWEEN", align: "CENTER" });
  add(footer, T("Anagno — Problem discovery, from the surface to the reef.", { size: 13, color: "#6b5c4e" }), T("© 2026 Anagno", { size: 12.5, color: "#6b5c4e" }));
  add(screen, footer);

  return bake(screen, { stretch: true });
}

function loginScreen() {
  const screen = figma.createFrame();
  screen.name = "Login";
  screen.resize(1280, 800);
  screen.fills = [solid("#0d2137")];
  screen.clipsContent = true;
  const card = loginCard();
  screen.appendChild(card);
  card.x = (1280 - 400) / 2;
  card.y = 150;
  return screen;
}

function projectsScreen() {
  const W = 1280;
  const screen = F({ dir: "VERTICAL", gap: 0, fill: "#f5efe6", name: "Projects", clip: true });
  screen.counterAxisSizingMode = "FIXED";
  screen.primaryAxisSizingMode = "AUTO";
  screen.resize(W, 1);

  const nav = F({ dir: "HORIZONTAL", pad: [18, 40], align: "CENTER", justify: "SPACE_BETWEEN" });
  nav.layoutAlign = "STRETCH";
  const brand = F({ dir: "HORIZONTAL", gap: 10, align: "CENTER" });
  add(brand, dot(12, "#7bbfb5"), T("Anagno", { weight: 700, size: 18, color: "#2d2416" }));
  add(nav, brand, T("Log out", { weight: 600, size: 14, color: "#2d2416" }));
  add(screen, nav);

  const main = F({ dir: "VERTICAL", gap: 22, pad: [36, 40, 60, 40] });
  main.layoutAlign = "STRETCH";
  add(main, T("Your projects", { weight: 700, size: 30, color: "#2d2416" }), T("Pick up where you left off, or start a fresh dive.", { size: 15, color: "#6b5c4e" }));
  const grid = F({ dir: "HORIZONTAL", gap: 20 });
  add(
    grid,
    newProjectCard(),
    projectCard("Research retention", "Why insights die after a project ends", "Edited 2 days ago", "#7bbfb5"),
    projectCard("Onboarding friction", "First-week drop-off for new PMs", "Edited 1 week ago", "#c47c5a"),
    projectCard("Marketplace trust", "Buyer/seller confidence loops", "Edited 3 weeks ago", "#7a9e7e")
  );
  add(main, grid);
  add(screen, main);
  return bake(screen, { stretch: true });
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
  const tr = F({ dir: "HORIZONTAL", gap: 10, align: "CENTER" });
  const exp = F({ dir: "HORIZONTAL", pad: [6, 12], radius: 8, fill: "#c47c5a", align: "CENTER" });
  add(exp, T("Export", { weight: 600, size: 12.5, color: "#ffffff" }));
  add(tr, btnGhost("Description"), exp, T("☾", { size: 16, color: "#6b5c4e" }));
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
  const a = kindNode({ kind: "actor", title: "Power users", w: 210 });
  const b = kindNode({ kind: "factor", title: "Switching cost", w: 200 });
  const c = findingNode({ cat: "Pattern · scan", title: "Churn feeds neglect — a reinforcing loop", scan: true, w: 240 });
  const d = kindNode({ kind: "factor", title: "Retention ownership", w: 200 });
  canvas.appendChild(a); a.x = 40; a.y = 60;
  canvas.appendChild(b); b.x = 470; b.y = 50;
  canvas.appendChild(c); c.x = 250; c.y = 240;
  canvas.appendChild(d); d.x = 60; d.y = 360;
  // signed-link pills on the connections
  const e1 = signedLink("+", "amplifies");
  const e2 = signedLink("-", "contradicts");
  canvas.appendChild(e1); e1.x = 250; e1.y = 150;
  canvas.appendChild(e2); e2.x = 430; e2.y = 150;
  screen.appendChild(canvas); canvas.x = 380; canvas.y = 48;

  // right Surface panel
  const surf = F({ dir: "VERTICAL", gap: 14, pad: 16, fill: "#faf7f2", justify: "SPACE_BETWEEN" });
  surf.resize(360, H - 48);
  surf.primaryAxisSizingMode = "FIXED";
  surf.counterAxisSizingMode = "FIXED";
  const stop = F({ dir: "VERTICAL", gap: 14 });
  stop.layoutAlign = "STRETCH";
  add(stop, T("Surface", { family: DISPLAY, weight: 700, size: 26, color: "#2d2416" }));
  // confirm card (carousel 1 / 4)
  add(stop, T("1 / 4", { family: MONO, weight: 600, size: 12.5, color: "#6b5c4e" }));
  const confirm = findingNode({ cat: "Value Proposition", title: "Trust they'll get paid", body: "Carpenters value reliable, on-time payment as much as the work itself — late pay erodes the relationship fast.", accent: "#c47c5a", w: 320 });
  add(stop, confirm);
  const actions = F({ dir: "HORIZONTAL", gap: 8 });
  add(actions, btnCTA("Keep it"), btnGhost("Tweak"), btnGhost("Toss"));
  add(stop, actions);
  add(surf, stop);
  const scan = F({ dir: "HORIZONTAL", pad: [13, 24], radius: 10, fill: "#5c8a62", align: "CENTER", justify: "CENTER" });
  scan.layoutAlign = "STRETCH";
  add(scan, T("Scan for Patterns", { weight: 600, size: 15, color: "#ffffff" }));
  add(surf, scan);
  screen.appendChild(surf); surf.x = W - 360; surf.y = 48;

  return screen;
}

function buildScreens(page) {
  // lay screens out in a row so the tall Landing doesn't overlap the others
  const screens = [
    ["Landing", landingScreen()],
    ["Login", loginScreen()],
    ["Projects", projectsScreen()],
    ["Workspace", workspaceScreen()],
  ];
  let x = 0;
  for (const [name, frame] of screens) {
    const label = T(name, { weight: 700, size: 24, color: "#2d2416" });
    page.appendChild(label);
    label.x = x;
    label.y = -56;
    page.appendChild(frame);
    frame.x = x;
    frame.y = 0;
    x += Math.ceil(frame.width) + 160;
  }
}

// ---------------------------------------------------------------- run
(async () => {
  await loadFonts();

  // Remember pages from earlier runs so we can clear them afterwards — otherwise
  // the plugin appends a *second* set and you may be staring at the old, broken
  // "03 Screens" page thinking nothing changed.
  const stale = figma.root.children.filter((p) =>
    /^0[123] (Foundations|Components|Screens)$/.test(p.name)
  );

  // Drop previously generated Anagno styles so re-runs don't pile up duplicates.
  try {
    for (const s of figma.getLocalPaintStyles()) if (s.name.indexOf("Anagno/") === 0) s.remove();
    for (const s of figma.getLocalTextStyles()) if (s.name.indexOf("Anagno/") === 0) s.remove();
  } catch (e) {}

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

  // Land on the freshly built Screens page so there's no chance of viewing a stale one.
  figma.currentPage = pScreens;
  figma.viewport.scrollAndZoomIntoView(pScreens.children);

  // Remove the stale pages from prior runs (can't remove the current page).
  for (const p of stale) {
    try {
      if (p.id !== figma.currentPage.id) p.remove();
    } catch (e) {}
  }

  figma.closePlugin("Anagno Design Kit regenerated ✓ — showing 03 Screens (old pages cleared)");
})();
