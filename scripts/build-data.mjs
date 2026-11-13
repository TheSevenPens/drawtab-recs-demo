// Joins the ratings, notes and lists (recs/sevenpens-recs.json) with tablet, pen,
// brand and family data from a DrawTabData checkout, and writes the slim
// catalog the site loads (static/data/catalog.json).
//
// Usage:
//   node scripts/build-data.mjs                      (finds ../GitHub/DrawTabData or the Explorer's data-repo)
//   node scripts/build-data.mjs --data C:\path\to\DrawTabData
//
// No npm dependencies: plain Node 18+.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argIdx = process.argv.indexOf("--data");
// Default: a DrawTabData clone next to this folder's GitHub siblings, or the
// Explorer's data-repo submodule.
const guesses = [
  path.join(root, "..", "GitHub", "DrawTabData"),
  path.join(root, "..", "GitHub", "DrawTabDataExplorer", "data-repo"),
];
const dtdRoot = path.resolve(
  argIdx > -1 ? process.argv[argIdx + 1] : process.env.DRAWTABDATA ?? guesses.find((g) => fs.existsSync(g)) ?? guesses[0],
);
const dataDir = fs.existsSync(path.join(dtdRoot, "data", "tablets")) ? path.join(dtdRoot, "data") : dtdRoot;
if (!fs.existsSync(path.join(dataDir, "tablets"))) {
  console.error(`Can't find DrawTabData at ${dtdRoot}. Pass --data <path to your DrawTabData clone>.`);
  process.exit(1);
}

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8").replace(/^\uFEFF/, ""));
const readAll = (dir, key) =>
  fs.existsSync(path.join(dataDir, dir))
    ? fs.readdirSync(path.join(dataDir, dir)).filter((f) => f.endsWith(".json")).flatMap((f) => readJson(path.join(dataDir, dir, f))[key] ?? [])
    : [];

const tablets = new Map(readAll("tablets", "DrawingTablets").map((t) => [t.Meta.EntityId, t]));
const pens = new Map(readAll("pens", "Pens").map((p) => [p.EntityId, p]));
const families = new Map(readAll("tablet-families", "TabletFamilies").map((f) => [f.EntityId, f]));
const brands = new Map(readJson(path.join(dataDir, "brands", "brands.json")).Brands.map((b) => [b.BrandId, b]));
const ranges = readAll("pressure-range", "PressureRange");
const version = fs.existsSync(path.join(dataDir, "version.json")) ? readJson(path.join(dataDir, "version.json")) : {};

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
// ---------- pen pressure: IAF and max pressure, one value per pen unit ----------
// Same rules as the Explorer (DrawTabData lib/pressure/range-resolve.ts): a pen
// unit with direct measurements uses those, otherwise one estimate per
// pressure-response session (bracket midpoints, lib/pressure/interpolate.ts).
// Units flagged defective in Seven's inventory are left out.
const sessions = readAll("pressure-response", "PressureResponse");
const invPens = fs.existsSync(path.join(dataDir, "inventory", "sevenpens-pens.json"))
  ? readJson(path.join(dataDir, "inventory", "sevenpens-pens.json")).InventoryPens ?? []
  : [];
const defective = new Set(invPens.filter((p) => p.Defects?.length).map((p) => p.InventoryId));
function estimateIaf(recs) {
  let a = null, b = null;
  for (const [x, y] of recs) y <= 0 ? (a === null || x > a) && (a = x) : (b === null || x < b) && (b = x);
  return a !== null && b !== null && a < b ? (a + b) / 2 : null;
}
function estimateMax(recs) {
  let c = null, d = null;
  for (const [x, y] of recs) y >= 100 ? (d === null || x < d) && (d = x) : (c === null || x > c) && (c = x);
  if (c !== null && d !== null && c < d) return (c + d) / 2;
  return c === null && d !== null ? d : null;
}
// Tier bands, same as the Explorer's src/lib/bands.ts and the 7P Demos ranking pages.
const BANDS = {
  IAF: [[0, 1, "S"], [1, 2, "A"], [2, 4, "B"], [4, 6, "C"], [6, 10, "D"], [10, null, "F"]],
  MAX: [[0, 100, "F"], [100, 200, "D"], [200, 300, "C"], [300, 400, "B"], [400, 500, "A"], [500, 900, "S"], [900, null, "X"]],
};
const tierOf = (metric, v) => BANDS[metric].find(([lo, hi]) => v >= lo && (hi === null || v < hi))?.[2] ?? null;
const round1 = (v) => Math.round(v * 10) / 10;
function pressureFor(pid, metric) {
  const est = metric === "IAF" ? estimateIaf : estimateMax;
  const measured = new Map(), estimated = new Map();
  const push = (m, k, v) => (m.get(k) ?? m.set(k, []).get(k)).push(v);
  for (const r of ranges) {
    if (r.PenEntityId !== pid || r.Metric !== metric || defective.has(r.PenInventoryId)) continue;
    const v = Number(r.Value);
    if (Number.isFinite(v)) push(measured, r.PenInventoryId, v);
  }
  for (const s of sessions) {
    if (s.PenEntityId !== pid || defective.has(s.InventoryId)) continue;
    const v = est(s.Records ?? []);
    if (v !== null && Number.isFinite(v)) push(estimated, s.InventoryId, v);
  }
  const units = [...new Set([...measured.keys(), ...estimated.keys()])]
    .map((id) => {
      const m = measured.get(id);
      const vals = m?.length ? m : estimated.get(id);
      return { unit: id, value: round1(median(vals)), samples: vals.length, source: m?.length ? "measured" : "estimated" };
    })
    .sort((a, b) => a.value - b.value);
  if (!units.length) return null;
  const med = round1(median(units.map((u) => u.value)));
  return {
    units,
    min: units[0].value,
    max: units[units.length - 1].value,
    median: med,
    tier: tierOf(metric, med),
    samples: units.reduce((n, u) => n + u.samples, 0),
  };
}

const num = (v) => (v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));
const yes = (v) => (v === "YES" ? true : v === "NO" ? false : null);
const EXPLORER = "https://thesevenpens.github.io/DrawTabDataExplorer/entity/";

const recsFile = readJson(path.join(root, "recs", "sevenpens-recs.json"));
const ratingScale = recsFile.RatingScale;
// Stopgap: tablet -> Seven's notes page, taken from the current recs pages.
// Belongs in DrawTabData as a REVIEW link by Seven Pens on each tablet.
const notesPages = fs.existsSync(path.join(root, "recs", "notes-pages.json")) ? readJson(path.join(root, "recs", "notes-pages.json")) : {};
const aliases = recsFile.RatingAliases ?? {};
const norm = (r) => (r && aliases[r]) || r;
const rank = (r) => (r === null ? ratingScale.length : ratingScale.indexOf(r));
const issues = [];

// Group dated records by device. Current rating: the latest record in each
// Context, then the newest of those across contexts (DELISTED drops a context).
const byId = new Map();
const entry = (id) => byId.get(id) ?? byId.set(id, { id, history: [], notes: [], lists: [] }).get(id);
for (const r of recsFile.Ratings) entry(r.EntityId).history.push({ ...r, Label: r.Rating, Rating: norm(r.Rating) });
const akaById = new Map((recsFile.AlsoSoldAs ?? []).map((a) => [a.EntityId, a]));
// Devices that belong to a family recommendation and have no rating of their own
// are shown through the family card, not on their own.
const familyMembers = (f) =>
  [...tablets.keys()].filter((id) => (f.Members ?? []).includes(id) || (f.MemberPrefix && id.startsWith(f.MemberPrefix) && (!f.MemberStatus || tablets.get(id).Model.Status === f.MemberStatus)));
const inFamily = new Set((recsFile.FamilyRecs ?? []).flatMap(familyMembers));
for (const n of recsFile.Notes) entry(n.EntityId).notes.push(n);
for (const l of recsFile.Lists) entry(l.EntityId).lists.push(l);
for (const u of recsFile.Unmatched ?? []) issues.push({ label: u.Label, page: u.Context, issue: u.Why });
for (const id of byId.keys()) if (!tablets.has(id) && !pens.has(id)) issues.push({ label: id, page: "", issue: "EntityId not found in DrawTabData" });

function current(history) {
  const latestByContext = new Map();
  for (const r of [...history].sort((a, b) => a.Date.localeCompare(b.Date))) latestByContext.set(r.Context ?? "", r);
  const live = [...latestByContext.values()].filter((r) => r.Rating !== "DELISTED");
  if (!live.length) return { rating: null, since: null, conflict: null, basis: null };
  live.sort((a, b) => b.Date.localeCompare(a.Date) || rank(a.Rating) - rank(b.Rating));
  const distinct = [...new Set(live.map((r) => r.Rating))];
  return {
    rating: live[0].Rating,
    since: live[0].Date,
    basis: live[0].Basis ?? null,
    conflict: distinct.length > 1 ? live.map((r) => ({ rating: r.Rating, context: r.Context, date: r.Date })) : null,
  };
}

const isVideo = (l) => l.ContentType === "VIDEO" || /youtube\.com|youtu\.be|vimeo\.com/.test(l.URL);
const reviews = (links, video) =>
  (links ?? [])
    .filter((l) => l.Type === "REVIEW" && l.URL && isVideo(l) === video)
    .map((l) => ({ title: l.Title || l.URL, url: l.URL, author: l.Author || null, date: l.PublishDate || null }))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

const items = [];
for (const { id, history, notes, lists } of byId.values()) {
  const t = tablets.get(id);
  if (!t) continue;
  const cur = current(history);
  if (!cur.rating && (!notes.length || inFamily.has(id))) continue;
  const m = t.Model, d = t.Digitizer ?? {}, ph = t.Physical ?? {}, disp = t.Display, oi = t.OtherInputs ?? {}, c = t.Connectivity ?? {}, sa = t.Standalone;
  const brand = brands.get(m.Brand);
  const brandName = brand?.BrandName ?? m.Brand;
  const name = m.Name.toLowerCase().includes(brandName.toLowerCase()) ? m.Name : `${brandName} ${m.Name}`;
  const w = num(d.Dimensions?.Width), h = num(d.Dimensions?.Height);
  const pen = (m.IncludedPen ?? []).map((pid) => pens.get(pid)).filter(Boolean)[0];
  const sevenNotes = (m.Links ?? []).find((l) => l.URL?.startsWith("https://docs.sevenpens.com/"))?.URL;
  items.push({
    id,
    kind: "device",
    brand: m.Brand,
    brandName,
    name,
    modelId: m.Id,
    type: m.Type,
    status: m.Status ?? null,
    year: num(m.ReleaseYear),
    released: m.ReleaseDate ?? m.ReleaseYear ?? null,
    audience: m.Audience ?? null,
    family: families.get(m.Family)?.FamilyName ?? null,
    familyId: families.has(m.Family) ? m.Family : null,
    rating: cur.rating,
    ratingRank: rank(cur.rating),
    ratedSince: cur.since,
    ratingBasis: cur.basis,
    ratingConflict: cur.conflict,
    history: history
      .map((r) => ({ date: r.Date, rating: r.Rating, label: r.Label !== r.Rating ? r.Label : null, context: r.Context ?? null }))
      .sort((a, b) => a.date.localeCompare(b.date) || (a.context ?? "").localeCompare(b.context ?? "")),
    notes: notes.map((n) => ({ date: n.Date, kind: n.Kind, text: n.Text })),
    lists: [...new Set(lists.map((l) => l.List))],
    aka: akaById.get(id)?.Names ?? [],
    akaNote: akaById.get(id)?.Note ?? null,
    notesUrl: notesPages[id] ?? sevenNotes ?? null,
    explorerUrl: EXPLORER + id,
    price: null, // filled once DrawTabData carries cost data
    inBox: m.IncludedInBox ?? null,
    // Every review, by anyone, newest first: videos and written pieces apart.
    videos: reviews(m.Links, true),
    articles: reviews(m.Links, false),
    makerLinks: (m.Links ?? [])
      .filter((l) => /PRODUCTINFO|USERMANUAL/.test(l.Type) && l.URL)
      .map((l) => ({ title: l.Title || (/MANUAL/.test(l.Type) ? "user manual" : "product page"), url: l.URL, author: l.Author ?? null, date: null })),
    specs: {
      activeW: w,
      activeH: h,
      activeDiagIn: w && h ? Math.round((Math.hypot(w, h) / 25.4) * 10) / 10 : null,
      activeAreaCm2: w && h ? Math.round((w * h) / 100) : null,
      pressure: num(d.PressureLevels),
      tilt: num(d.Tilt),
      reportRate: num(d.ReportRate),
      hover: num(d.MaxHover),
      digitizer: d.Type ?? null,
      weight: num(ph.Weight),
      physW: num(ph.Dimensions?.Width),
      physH: num(ph.Dimensions?.Height),
      depth: num(ph.Dimensions?.Depth),
      includedStand: yes(ph.IncludedStand),
      legs: yes(ph.Legs),
      vesa: yes(ph.VesaMount),
      touch: yes(oi.Touch),
      buttons: num(oi.Buttons),
      dials: (num(oi.Dials) ?? 0) + (num(oi.TouchRings) ?? 0) + (num(oi.Scrollers) ?? 0) || (oi.Dials === "0" ? 0 : null),
      bluetooth: yes(c.Bluetooth),
      ports: [...(c.Ports ?? []).map((p) => p.Type), ...(c.AttachedCable ?? []).map((p) => `${p} (cable)`)],
      resolution: disp?.PixelDimensions ? `${disp.PixelDimensions.Width}×${disp.PixelDimensions.Height}` : null,
      pixelsW: num(disp?.PixelDimensions?.Width),
      panel: disp?.PanelTech ?? null,
      brightness: num(disp?.Brightness),
      srgb: num(disp?.ColorGamuts?.SRGB),
      adobeRgb: num(disp?.ColorGamuts?.ADOBERGB),
      dciP3: num(disp?.ColorGamuts?.DCIP3),
      laminated: yes(disp?.Lamination),
      antiGlare: disp?.AntiGlare ?? null,
      refresh: num(disp?.RefreshRate),
      os: sa?.OS ?? null,
      ram: num(sa?.RAM),
      storage: num(sa?.Storage),
      battery: num(sa?.BatteryCapacity),
    },
    pen: pen
      ? { id: pen.EntityId, name: pen.PenName, modelId: pen.PenId, eraser: pen.Eraser ?? null, buttons: num(pen.ButtonCount), iaf: pressureFor(pen.EntityId, "IAF")?.median ?? null, iafSamples: pressureFor(pen.EntityId, "IAF")?.units.length ?? 0 }
      : null,
  });
}

// Family recommendations: one card for a product line, with its members' size range.
for (const f of recsFile.FamilyRecs ?? []) {
  const members = familyMembers(f).map((id) => tablets.get(id));
  const diags = members
    .map((t) => t.Digitizer?.Dimensions)
    .filter((d) => d?.Width && d?.Height)
    .map((d) => Math.round((Math.hypot(d.Width, d.Height) / 25.4) * 10) / 10);
  const years = members.map((t) => num(t.Model.ReleaseYear)).filter(Boolean);
  const brandName = f.Brand ? brands.get(f.Brand)?.BrandName ?? f.Brand[0] + f.Brand.slice(1).toLowerCase() : "Various";
  items.push({
    id: `family:${f.Id}`,
    kind: "family",
    brand: f.Brand ?? "VARIOUS",
    brandName,
    name: f.Name,
    modelId: members.length ? `${members.length} models in DrawTabData` : "",
    type: f.Type,
    status: null,
    year: years.length ? Math.max(...years) : null,
    released: years.length ? String(Math.max(...years)) : null,
    audience: f.Audience ?? null,
    family: null,
    rating: f.Rating ?? null,
    ratingRank: rank(f.Rating ?? null),
    ratedSince: null,
    ratingBasis: null,
    ratingConflict: null,
    history: [],
    notes: f.Notes.map((n) => ({ date: null, kind: n.Kind, text: n.Text })),
    lists: [],
    aka: [],
    akaNote: null,
    notesUrl: f.NotesUrl ?? null,
    explorerUrl: null,
    price: null,
    members: members.map((t) => ({ id: t.Meta.EntityId, name: t.Model.Name, year: num(t.Model.ReleaseYear), status: t.Model.Status ?? null })).sort((a, b) => (b.year ?? 0) - (a.year ?? 0)),
    diagRange: diags.length ? [Math.min(...diags), Math.max(...diags)] : null,
    specs: { ports: [] },
    pen: null,
  });
}
items.sort((a, b) => a.ratingRank - b.ratingRank || (b.released ?? "").localeCompare(a.released ?? "") || a.name.localeCompare(b.name));
let commit = null;
try {
  commit = execFileSync("git", ["-C", dtdRoot, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
} catch {}
// ---------- pens: every pen a recommended tablet ships with ----------
const recIds = new Set(items.filter((i) => i.kind === "device").map((i) => i.id));
const ratingOf = new Map(items.map((i) => [i.id, i.rating]));
const tabletByModel = new Map([...tablets.values()].map((t) => [`${t.Model.Brand}|${t.Model.Id}`, t]));
const compat = readAll("pen-compat", "PenCompat");
const tabletRef = (t) => ({
  id: t.Meta.EntityId,
  name: t.Model.Name,
  modelId: t.Model.Id,
  year: num(t.Model.ReleaseYear),
  type: t.Model.Type,
  status: t.Model.Status ?? null,
  rating: ratingOf.get(t.Meta.EntityId) ?? null,
  recommended: recIds.has(t.Meta.EntityId),
});
const byNewest = (a, b) => (b.year ?? 0) - (a.year ?? 0) || a.name.localeCompare(b.name);
// Pens on the site: every pen Seven rated, plus every pen a recommended tablet ships with.
const ratedPenIds = [...byId.keys()].filter((id) => pens.has(id));
const penIds = new Set([...ratedPenIds, ...items.flatMap((i) => (i.pen ? [i.pen.id] : []))]);
const penFamilies = new Map(readAll("pen-families", "PenFamilies").map((f) => [f.EntityId, f]));
const penOut = [...penIds].map((pid) => {
  const p = pens.get(pid);
  const includedWith = [...tablets.values()].filter((t) => (t.Model.IncludedPen ?? []).includes(pid)).map(tabletRef).sort(byNewest);
  const works = compat
    .filter((c) => c.Brand === p.Brand && c.PenId === p.PenId)
    .flatMap((c) => c.TabletIds.map((tid) => tabletByModel.get(`${c.Brand}|${tid}`)).filter(Boolean))
    .map(tabletRef);
  const seen = new Set(includedWith.map((t) => t.id));
  const worksWith = works.filter((t) => !seen.has(t.id) && (seen.add(t.id), true)).sort(byNewest);
  const iafRange = pressureFor(pid, "IAF");
  const rec = byId.get(pid);
  const cur = rec ? current(rec.history) : { rating: null, since: null, basis: null };
  return {
    id: pid,
    brand: p.Brand,
    brandName: brands.get(p.Brand)?.BrandName ?? p.Brand,
    name: p.PenName ?? p.PenId,
    modelId: p.PenId,
    family: penFamilies.get(p.PenFamily)?.FamilyName ?? null,
    year: num(p.ReleaseYear),
    tech: p.PenTech ?? null,
    pressure: num(p.PressureLevels),
    tilt: yes(p.Tilt),
    buttons: num(p.ButtonCount),
    eraser: yes(p.Eraser),
    wheel: yes(p.Wheel),
    rotation: yes(p.BarrelRotation),
    hover: yes(p.Hover),
    shape: p.Shape ?? null,
    weight: num(p.Weight),
    length: num(p.Length),
    diameter: num(p.Diameter),
    iaf: iafRange?.median ?? null,
    iafSamples: iafRange?.units.length ?? 0,
    rating: cur.rating,
    ratingRank: rank(cur.rating),
    ratedSince: cur.since,
    ratingBasis: cur.basis,
    history: (rec?.history ?? [])
      .map((r) => ({ date: r.Date, rating: r.Rating, label: r.Label !== r.Rating ? r.Label : null, context: r.Context ?? null }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    notes: (rec?.notes ?? []).map((n) => ({ date: n.Date, kind: n.Kind, text: n.Text })),
    released: p.ReleaseDate ?? p.ReleaseYear ?? null,
    pressureIaf: iafRange,
    pressureMax: pressureFor(pid, "MAX"),
    explorerUrl: EXPLORER + pid,
    includedWith,
    worksWith,
  };
});

// Rated pens also appear as items, so the pens view can share the list
// machinery (rating groups, brand and release filters, sorting).
const EMPTY_SPECS = Object.fromEntries(
  Object.keys(items.find((i) => i.kind === "device")?.specs ?? {}).map((k) => [k, k === "ports" ? [] : null]),
);
for (const p of penOut) {
  if (!p.rating) continue;
  items.push({
    id: p.id,
    kind: "pen",
    brand: p.brand,
    brandName: p.brandName,
    name: p.name.toLowerCase().includes(p.brandName.toLowerCase()) ? p.name : `${p.brandName} ${p.name}`,
    modelId: p.modelId,
    type: "PEN",
    status: null,
    year: p.year,
    released: p.released,
    audience: null,
    family: p.family,
    familyId: null,
    rating: p.rating,
    ratingRank: p.ratingRank,
    ratedSince: p.ratedSince,
    ratingBasis: p.ratingBasis,
    ratingConflict: null,
    history: p.history,
    notes: p.notes,
    lists: [],
    aka: [],
    akaNote: null,
    notesUrl: null,
    explorerUrl: p.explorerUrl,
    price: null,
    inBox: null,
    specs: { ...EMPTY_SPECS, pressure: p.pressure, tilt: null, weight: p.weight },
    pen: null,
    penFacts: {
      tilt: p.tilt,
      iaf: p.pressureIaf?.median ?? null,
      iafTier: p.pressureIaf?.tier ?? null,
      max: p.pressureMax?.median ?? null,
      maxTier: p.pressureMax?.tier ?? null,
      buttons: p.buttons,
      eraser: p.eraser,
      includedWith: p.includedWith.length,
      compatibleWith: p.worksWith.length,
    },
  });
}

// ---------- tablet families: DrawTabData families with a recommended member ----------
const famIds = new Set(items.flatMap((i) => (i.familyId ? [i.familyId] : [])));
const familyOut = [...famIds].map((fid) => {
  const f = families.get(fid);
  return {
    id: fid,
    brand: f.Brand,
    brandName: brands.get(f.Brand)?.BrandName ?? f.Brand,
    name: f.FamilyName,
    explorerUrl: EXPLORER + fid,
    members: [...tablets.values()].filter((t) => t.Model.Family === fid).map(tabletRef).sort(byNewest),
  };
});
const tabletsWithoutFamily = [...tablets.values()].filter((t) => !families.has(t.Model.Family)).length;

const out = {
  builtAt: new Date().toISOString(),
  source: { drawTabDataCommit: commit, schemaVersion: version.schemaVersion ?? null },
  ratingScale,
  items,
  pens: penOut,
  families: familyOut,
  familyCoverage: { tablets: tablets.size, withoutFamily: tabletsWithoutFamily },
  issues,
  notCovered: recsFile.NotCovered ?? [],
};
fs.mkdirSync(path.join(root, "static", "data"), { recursive: true });
fs.writeFileSync(path.join(root, "static", "data", "catalog.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote static/data/catalog.json: ${items.length} tablets, ${recsFile.Ratings.length} rating records, ${recsFile.Notes.length} notes, ${issues.length} issues.`);
for (const i of issues) console.log(`  ! [${i.page}] ${i.label}: ${i.issue}`);
