// Types and pure helpers for the catalog built by scripts/build-data.mjs.

export type DeviceType = 'PENTABLET' | 'PENDISPLAY' | 'STANDALONE' | 'PEN';
export type NoteKind = 'WARNING' | 'TIP' | 'INFO';

export interface Specs {
	activeW?: number | null;
	activeH?: number | null;
	activeDiagIn?: number | null;
	activeAreaCm2?: number | null;
	pressure?: number | null;
	tilt?: number | null;
	reportRate?: number | null;
	hover?: number | null;
	digitizer?: string | null;
	weight?: number | null;
	physW?: number | null;
	physH?: number | null;
	depth?: number | null;
	includedStand?: boolean | null;
	legs?: boolean | null;
	vesa?: boolean | null;
	touch?: boolean | null;
	buttons?: number | null;
	dials?: number | null;
	bluetooth?: boolean | null;
	ports: string[];
	resolution?: string | null;
	pixelsW?: number | null;
	panel?: string | null;
	brightness?: number | null;
	srgb?: number | null;
	adobeRgb?: number | null;
	dciP3?: number | null;
	laminated?: boolean | null;
	antiGlare?: string | null;
	refresh?: number | null;
	os?: string | null;
	ram?: number | null;
	storage?: number | null;
	battery?: number | null;
}

export interface Item {
	id: string;
	kind: 'device' | 'family' | 'pen';
	brand: string;
	brandName: string;
	name: string;
	modelId: string;
	type: DeviceType;
	status: string | null;
	year: number | null;
	released: string | null;
	audience: string | null;
	family: string | null;
	familyId?: string | null;
	rating: string | null;
	ratingRank: number;
	ratedSince: string | null;
	ratingBasis: string | null;
	ratingConflict: { rating: string }[] | null;
	history: { date: string; rating: string; label: string | null; context: string | null }[];
	notes: { date: string | null; kind: NoteKind; text: string }[];
	lists: string[];
	aka: string[];
	akaNote: string | null;
	notesUrl: string | null;
	explorerUrl: string | null;
	price: null;
	inBox?: string[] | null;
	videos?: LinkRef[];
	articles?: LinkRef[];
	makerLinks?: LinkRef[];
	specs: Specs;
	pen: { id: string; name: string; modelId: string; iaf: number | null; iafSamples: number } | null;
	members?: { id: string; name: string; year: number | null; status: string | null }[];
	/** Pen items only. */
	penFacts?: {
		tilt: boolean | null;
		iaf: number | null;
		iafTier: string | null;
		max: number | null;
		maxTier: string | null;
		includedWith: number;
		compatibleWith: number;
	};
	diagRange?: [number, number];
}

export interface LinkRef {
	title: string;
	url: string;
	author: string | null;
	date: string | null;
}
/** One pen's IAF or max-pressure results: one value per pen unit Seven owns. */
export interface PressureRange {
	units: { unit: string; value: number; samples: number; source: 'measured' | 'estimated' }[];
	min: number;
	max: number;
	median: number;
	tier: string | null;
	samples: number;
}
export type PressureMetric = 'IAF' | 'MAX';
/** Tier bands, same as the Explorer and the 7P Demos ranking pages. Lower IAF
 * is better; for max pressure the sweet spot is 500–900 gf. */
export const PRESSURE_BANDS: Record<PressureMetric, { lo: number; hi: number | null; tier: string; word: string }[]> = {
	IAF: [
		{ lo: 0, hi: 1, tier: 'S', word: 'super' },
		{ lo: 1, hi: 2, tier: 'A', word: 'great' },
		{ lo: 2, hi: 4, tier: 'B', word: 'good' },
		{ lo: 4, hi: 6, tier: 'C', word: 'ok' },
		{ lo: 6, hi: 10, tier: 'D', word: 'avoid' },
		{ lo: 10, hi: null, tier: 'F', word: 'fail' }
	],
	MAX: [
		{ lo: 0, hi: 100, tier: 'F', word: 'fail' },
		{ lo: 100, hi: 200, tier: 'D', word: 'avoid' },
		{ lo: 200, hi: 300, tier: 'C', word: 'ok' },
		{ lo: 300, hi: 400, tier: 'B', word: 'good' },
		{ lo: 400, hi: 500, tier: 'A', word: 'great' },
		{ lo: 500, hi: 900, tier: 'S', word: 'super' },
		{ lo: 900, hi: null, tier: 'X', word: 'excessive' }
	]
};
export const PRESSURE_TITLE: Record<PressureMetric, string> = { IAF: 'initial activation force (IAF)', MAX: 'maximum pressure' };
export const PRESSURE_DEF: Record<PressureMetric, string> = {
	IAF: 'The lowest physical force required for the pen to detect pressure. Lower is better.',
	MAX: 'The first physical force at which the pen reaches 100% pressure.'
};
export const tierWord = (m: PressureMetric, tier: string | null) => PRESSURE_BANDS[m].find((b) => b.tier === tier)?.word ?? null;

export interface TabletRef {
	id: string;
	name: string;
	modelId: string;
	year: number | null;
	type: DeviceType;
	status: string | null;
	rating: string | null;
	recommended: boolean;
}
export interface Pen {
	id: string;
	brand: string;
	brandName: string;
	name: string;
	modelId: string;
	family: string | null;
	year: number | null;
	tech: string | null;
	pressure: number | null;
	tilt: boolean | null;
	buttons: number | null;
	eraser: boolean | null;
	wheel: boolean | null;
	rotation: boolean | null;
	hover: boolean | null;
	shape: string | null;
	weight: number | null;
	length: number | null;
	diameter: number | null;
	iaf: number | null;
	iafSamples: number;
	rating: string | null;
	ratingRank: number;
	ratedSince: string | null;
	ratingBasis: string | null;
	history: { date: string; rating: string; label: string | null; context: string | null }[];
	notes: { date: string | null; kind: NoteKind; text: string }[];
	released: string | null;
	pressureIaf: PressureRange | null;
	pressureMax: PressureRange | null;
	explorerUrl: string;
	includedWith: TabletRef[];
	worksWith: TabletRef[];
}
export interface TabletFamily {
	id: string;
	brand: string;
	brandName: string;
	name: string;
	explorerUrl: string;
	members: TabletRef[];
}

export interface Catalog {
	builtAt: string;
	pens: Pen[];
	families: TabletFamily[];
	familyCoverage: { tablets: number; withoutFamily: number };
	source: { drawTabDataCommit: string | null; schemaVersion: string | null };
	ratingScale: string[];
	items: Item[];
	issues: { page: string; label: string; issue: string }[];
	notCovered: { page: string; label: string; why: string }[];
}

export const NOT_RATED = 'NOT RATED';
export const TYPES: DeviceType[] = ['PENTABLET', 'PENDISPLAY', 'STANDALONE', 'PEN'];
export const TYPE_LABEL: Record<DeviceType, string> = {
	PENTABLET: 'pen tablet',
	PENDISPLAY: 'pen display',
	STANDALONE: 'standalone',
	PEN: 'pen'
};
export const TYPE_PLURAL: Record<DeviceType, string> = {
	PENTABLET: 'pen tablets',
	PENDISPLAY: 'pen displays',
	STANDALONE: 'standalone',
	PEN: 'pens'
};
export const CONTEXT_LABEL: Record<string, string> = {
	'pen-tablet-recs-small': 'small pen tablets page',
	'pen-tablet-recs-medium': 'medium pen tablets page',
	'pen-tablet-recs-large': 'large pen tablets page',
	'pen-display-recs-small': 'small pen displays page',
	'pen-display-recs-medium': 'medium pen displays page',
	'pen-display-recs-large': 'large pen displays page',
	'mobile-device-recs': 'mobile devices page'
};
export const LIST_LABEL: Record<string, string> = { BEGINNER: 'beginner pick' };

/** Rating key used for grouping and CSS: "VERY GOOD" → "verygood". */
export const ratingKey = (i: Pick<Item, 'rating'>) => i.rating ?? NOT_RATED;
export const tierClass = (r: string | null) =>
	r ? r.toLowerCase().replace(/[^a-z]/g, '') || 'none' : 'none';
export const ratingWord = (i: Pick<Item, 'rating' | 'audience'>) =>
	i.rating ? i.rating.toLowerCase() : i.audience ? 'general purpose' : 'not rated';

/** Plain-language size words, by device type (active-area diagonal, inches). */
export const SIZE_WORDS: Record<DeviceType, [string, number | null, number | null][]> = {
	PENTABLET: [
		['small', null, 10],
		['medium', 10, 13.5],
		['large', 13.5, null]
	],
	PENDISPLAY: [
		['small', null, 15],
		['medium', 15, 20],
		['large', 20, null]
	],
	STANDALONE: [
		['small', null, 11.5],
		['medium', 11.5, 13],
		['large', 13, null]
	],
	PEN: []
};
export const SIZE_RANGES: [string, number | null, number | null][] = [
	['under 10″', null, 10],
	['10–14″', 10, 14],
	['14–18″', 14, 18],
	['18″ and up', 18, null]
];
export const RECENT: [string, string][] = [
	['', 'any time'],
	['1', 'last year'],
	['2', 'last 2 years'],
	['3', 'last 3 years']
];

export const FEATURES: [string, string, (i: Item) => boolean][] = [
	['stand', 'stand in the box or built-in legs', (i) => i.specs.includedStand === true || i.specs.legs === true],
	['tilt', 'supports tilt', (i) => (i.specs.tilt ?? 0) > 0],
	['wireless', 'wireless (Bluetooth)', (i) => i.specs.bluetooth === true],
	['touch', 'finger touch', (i) => i.specs.touch === true],
	['laminated', 'laminated display', (i) => i.specs.laminated === true],
	['vesa', 'VESA mount', (i) => i.specs.vesa === true],
	['usbc', 'USB-C on the device', (i) => i.specs.ports.includes('USB_C')],
	['beginner', 'on a beginner list', (i) => i.lists.includes('BEGINNER')]
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2025-06-05" or "2025-06" → "Jun 2025"; a year-only date returns null. */
export function monthYear(d: string | null | undefined, long = false): string | null {
	const m = /^(\d{4})-(\d{2})/.exec(d ?? '');
	return m ? `${(long ? MONTHS_LONG : MONTHS)[+m[2] - 1]} ${m[1]}` : null;
}
/** "2025-12-05" → "5 December 2025". */
export function longDate(d: string | null | undefined): string {
	const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d ?? '');
	return m ? `${+m[3]} ${MONTHS_LONG[+m[2] - 1]} ${m[1]}` : (d ?? '');
}
/** Release dates are "YYYY-MM-DD", "YYYY-MM" or "YYYY"; a year alone counts as mid-year. */
export function releaseTime(r: string | null | undefined): number {
	if (!r) return NaN;
	return Date.parse(r.length === 4 ? `${r}-07-01` : r.length === 7 ? `${r}-15` : r);
}
export function recentCutoff(years: string, now = new Date()): number {
	const d = new Date(now);
	d.setFullYear(d.getFullYear() - Number(years));
	return d.getTime();
}

/** Name without the brand prefix: "Huion Kamvas 16 GEN3" → "Kamvas 16 GEN3". */
export function shortName(i: Pick<Item, 'name' | 'brandName'>): string {
	const b = (i.brandName || '').toLowerCase();
	return b && i.name.toLowerCase().startsWith(b + ' ') ? i.name.slice(b.length + 1) : i.name;
}
export function sizeLabel(i: Item): string {
	if (i.diagRange) {
		const [a, b] = i.diagRange;
		return a === b ? `${a}″` : `${a}–${b}″`;
	}
	return i.specs.activeDiagIn ? `${i.specs.activeDiagIn}″` : '';
}
export const resolutionLabel = (s: Specs) =>
	s.resolution ? ((s.pixelsW ?? 0) >= 3840 ? `${s.resolution} (4K)` : s.resolution) : null;

export type Units = 'mm' | 'in' | 'both';
const inch = (mm: number) => (mm / 25.4).toFixed(1);
/** Active area as the reader prefers it: "240 × 135 mm", "9.4 × 5.3 in" or both. */
export function areaLabel(s: Pick<Specs, 'activeW' | 'activeH'>, units: Units): string | null {
	if (!s.activeW || !s.activeH) return null;
	const mm = `${s.activeW} × ${s.activeH} mm`;
	const inches = `${inch(s.activeW)} × ${inch(s.activeH)} in`;
	return units === 'mm' ? mm : units === 'in' ? inches : `${mm} (${inches})`;
}
/** "PW600L" or "Pro Pen 3 (ACP-500)": the model number whenever it differs from the name. */
export const penLabel = (p: { name: string; modelId: string }) =>
	p.modelId && p.modelId.toLowerCase() !== p.name.toLowerCase() ? `${p.name} (${p.modelId})` : p.name;

/** Label/value rows for a simple card. */
export function cardFacts(i: Item, units: Units = 'mm'): [string, string][] {
	const s = i.specs;
	const out: [string, string][] = [];
	if (i.kind === 'pen') {
		const p = i.penFacts;
		if (p?.iaf != null) out.push(['IAF', `${p.iaf} gf${p.iafTier ? `, tier ${p.iafTier}` : ''}`]);
		if (p?.max != null) out.push(['max pressure', `${p.max} gf${p.maxTier ? `, tier ${p.maxTier}` : ''}`]);
		if (p?.includedWith) out.push(['included with', `${p.includedWith} tablet${p.includedWith === 1 ? '' : 's'}`]);
		const rel = monthYear(i.released) ?? (i.year ? String(i.year) : null);
		if (rel) out.push(['released', rel]);
		return out;
	}
	if (i.kind === 'family') {
		out.push(['type', TYPE_LABEL[i.type]]);
		if (i.members?.length) out.push(['models', String(i.members.length)]);
		return out;
	}
	if (i.type === 'PENTABLET') {
		const a = areaLabel(s, units);
		if (a) out.push(['active area', a]);
	} else {
		const r = resolutionLabel(s);
		if (r) out.push(['display', r]);
	}
	if (i.pen?.name) out.push(['pen', penLabel(i.pen)]);
	const rel = monthYear(i.released) ?? (i.year ? String(i.year) : null);
	if (rel) out.push(['released', rel]);
	return out;
}

const NOTE_ORDER: Record<NoteKind, number> = { WARNING: 0, TIP: 1, INFO: 2 };
export const sortedNotes = (i: Item) => [...i.notes].sort((a, b) => NOTE_ORDER[a.kind] - NOTE_ORDER[b.kind]);

/** The rating this device held before its current one, if it changed. */
export function previousRating(i: Item): string | null {
	const before = i.history.filter((h) => h.rating !== 'DELISTED' && h.date < (i.ratedSince ?? '') && h.rating !== i.rating);
	return before.length ? before[before.length - 1].rating : null;
}

// ---------- filter state ----------
export interface Filters {
	q: string;
	type: DeviceType | '';
	ratings: Set<string>;
	brands: Set<string>;
	feats: Set<string>;
	diagMin: string;
	diagMax: string;
	widthMin: string;
	weightMax: string;
	recent: string;
	hideDisc: boolean;
	hideAvoid: boolean;
	mode: 'simple' | 'expert';
	view: 'cards' | 'table';
	sort: string;
}
export const defaultFilters = (): Filters => ({
	q: '',
	type: 'PENTABLET',
	ratings: new Set(),
	brands: new Set(),
	feats: new Set(),
	diagMin: '',
	diagMax: '',
	widthMin: '',
	weightMax: '',
	recent: '',
	hideDisc: false,
	hideAvoid: false,
	mode: 'simple',
	view: 'cards',
	sort: 'rating'
});

const SETS = ['ratings', 'brands', 'feats'] as const;
const STRS = ['q', 'type', 'diagMin', 'diagMax', 'widthMin', 'weightMax', 'recent', 'mode', 'view', 'sort'] as const;

/** Filters ↔ URL hash, so any filtered view is a shareable link. */
export function filtersFromHash(hash: string): Filters {
	const f = defaultFilters();
	const p = new URLSearchParams(hash.replace(/^#/, ''));
	for (const k of SETS) if (p.get(k)) f[k] = new Set(p.get(k)!.split(','));
	for (const k of STRS) if (p.has(k)) (f as unknown as Record<string, string>)[k] = p.get(k)!;
	// Old links used types=A,B; the page now picks one type at a time.
	if (!p.has('type') && p.get('types') && !p.get('types')!.includes(',')) f.type = p.get('types') as DeviceType;
	f.hideDisc = p.get('hideDisc') === '1';
	f.hideAvoid = p.get('hideAvoid') === '1';
	return f;
}
export function filtersToHash(f: Filters): string {
	const p = new URLSearchParams();
	const d = defaultFilters();
	for (const k of SETS) if (f[k].size) p.set(k, [...f[k]].join(','));
	for (const k of STRS) if (f[k] !== d[k]) p.set(k, String(f[k]));
	if (f.hideDisc) p.set('hideDisc', '1');
	if (f.hideAvoid) p.set('hideAvoid', '1');
	const s = p.toString();
	return s ? `#${s}` : '';
}

const norm = (s: string) => s.toLowerCase().normalize('NFC');
const strip = (s: string) => norm(s).replace(/[^\p{L}\p{M}\p{N}]/gu, '');

/** Does an item pass the filters? `skip` leaves one facet out, for that facet's own counts. */
export function matches(i: Item, f: Filters, skip?: string, now = new Date()): boolean {
	if (f.q) {
		const hay = [i.name, i.brandName, i.modelId, i.family, i.pen?.name, ...i.aka, ...(i.members ?? []).map((m) => m.name)].filter(
			Boolean
		) as string[];
		const q = norm(f.q),
			qs = strip(f.q);
		if (!hay.some((h) => norm(h).includes(q) || (qs && strip(h).includes(qs)))) return false;
	}
	if (skip !== 'type' && f.type && i.type !== f.type) return false;
	if (skip !== 'ratings' && f.ratings.size && !f.ratings.has(ratingKey(i))) return false;
	if (skip !== 'brands' && f.brands.size && !f.brands.has(i.brand)) return false;
	if (skip !== 'recent' && f.recent && !(releaseTime(i.released) >= recentCutoff(f.recent, now))) return false;
	if (f.hideAvoid && i.rating === 'AVOID') return false;
	if (skip !== 'size' && i.kind === 'family') {
		// A family matches a size range if any member does.
		const [lo, hi] = i.diagRange ?? [null, null];
		if (f.diagMin !== '' && !(hi !== null && hi >= +f.diagMin)) return false;
		if (f.diagMax !== '' && !(lo !== null && lo <= +f.diagMax)) return false;
	}
	if (i.kind === 'family' || i.kind === 'pen') {
		// Spec filters don't apply to families or pens.
		return !(f.widthMin !== '' || f.weightMax !== '' || f.feats.size);
	}
	const d = i.specs.activeDiagIn;
	if (skip !== 'size') {
		if (f.diagMin !== '' && !(d != null && d >= +f.diagMin)) return false;
		if (f.diagMax !== '' && !(d != null && d <= +f.diagMax)) return false;
	}
	if (f.widthMin !== '' && !((i.specs.activeW ?? 0) >= +f.widthMin)) return false;
	if (f.weightMax !== '' && !(i.specs.weight != null && i.specs.weight <= +f.weightMax)) return false;
	for (const [k, , fn] of FEATURES) if (f.feats.has(k) && !fn(i)) return false;
	if (f.hideDisc && i.status === 'DISCONTINUED') return false;
	return true;
}

export const iafOf = (i: Item) => (i.kind === 'pen' ? i.penFacts?.iaf : i.pen?.iaf) ?? null;
export const diagOf = (i: Item) => i.specs.activeDiagIn ?? i.diagRange?.[1] ?? null;
const byRating = (a: Item, b: Item) =>
	a.ratingRank - b.ratingRank || (releaseTime(b.released) || 0) - (releaseTime(a.released) || 0) || a.name.localeCompare(b.name);
export const SORTS: Record<string, [string, (a: Item, b: Item) => number]> = {
	rating: ['rating', byRating],
	'year-desc': ['newest release', (a, b) => (releaseTime(b.released) || 0) - (releaseTime(a.released) || 0) || byRating(a, b)],
	'size-desc': ['size, largest', (a, b) => (diagOf(b) ?? -1) - (diagOf(a) ?? -1) || byRating(a, b)],
	'size-asc': ['size, smallest', (a, b) => (diagOf(a) ?? 1e9) - (diagOf(b) ?? 1e9) || byRating(a, b)],
	'weight-asc': ['weight, lightest', (a, b) => (a.specs.weight ?? 1e9) - (b.specs.weight ?? 1e9) || byRating(a, b)],
	'rated-desc': ['recently rated', (a, b) => (b.ratedSince ?? '').localeCompare(a.ratedSince ?? '') || byRating(a, b)],
	'iaf-asc': ['pen IAF, lowest', (a, b) => (iafOf(a) ?? 1e9) - (iafOf(b) ?? 1e9) || byRating(a, b)]
};

/** Size choices: small/medium/large words once one device type is picked, inch ranges otherwise. */
export function sizeChoices(type: DeviceType | ''): [string, number | null, number | null][] {
	if (!type) return SIZE_RANGES;
	return SIZE_WORDS[type].map(([w, a, b]) => [
		`${w} · ${a === null ? `under ${b}` : b === null ? `${a}+` : `${a}–${b}`}″`,
		a,
		b
	]);
}

/** URL segment for an item. Family ids ("family:ipad") lose the colon, which Windows can't put in a file name. */
export const slugOf = (i: Pick<Item, 'id'>) => i.id.replace(/:/g, '-');
/** A pen's id is "brand.pen.model"; pens have their own page. */
export const deviceHref = (base: string, i: Pick<Item, 'id'>) =>
	/^[^.]+\.pen\./.test(i.id) ? `${base}/pen/${i.id}/` : `${base}/device/${slugOf(i)}/`;
export const penHref = (base: string, id: string) => `${base}/pen/${id}/`;
export const familyHref = (base: string, id: string) => `${base}/family/${id}/`;
/** Where a tablet reference links: its recommendation page when it has one, else the Explorer. */
export const tabletHref = (base: string, t: Pick<TabletRef, 'id' | 'recommended'>) =>
	t.recommended ? deviceHref(base, t) : `https://thesevenpens.github.io/DrawTabDataExplorer/entity/${t.id}`;

/** Best rating among some tablets, by the order of the rating scale. */
export function bestRating(refs: { rating: string | null }[], scale: string[]): string | null {
	const ranks = refs.map((r) => (r.rating ? scale.indexOf(r.rating) : -1)).filter((n) => n >= 0);
	return ranks.length ? scale[Math.min(...ranks)] : null;
}
