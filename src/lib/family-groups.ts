import type { Item, TabletFamily } from './catalog';
import { shortName, ratingKey } from './catalog';

/** Several devices of one family, shown as a single card. */
export interface FamilyGroup {
	id: string;
	familyId: string;
	/** "Intuos Pro 2025", from "Wacom Intuos Pro 2025 tablet series". */
	name: string;
	members: Item[];
	/** What sets each member apart: "Large" for "Intuos Pro 2025 Large". */
	labels: string[];
}
export type CardEntry = { kind: 'item'; item: Item } | { kind: 'family'; group: FamilyGroup };

const familyTitle = (f: TabletFamily | undefined, fallback: string) => {
	if (!f) return fallback;
	let n = f.name.replace(/\s+tablet series$/i, '').replace(/\s+series$/i, '');
	const b = f.brandName.toLowerCase();
	if (n.toLowerCase().startsWith(b + ' ')) n = n.slice(b.length + 1);
	return n;
};

/** Drops the words every member name shares at the start; keeps the full name if nothing is left. */
export function memberLabels(names: string[]): string[] {
	const words = names.map((n) => n.split(/\s+/));
	let k = 0;
	while (words.every((w) => k < w.length - 1 && w[k].toLowerCase() === words[0][k].toLowerCase())) k++;
	return words.map((w, i) => (k ? w.slice(k).join(' ') : names[i]));
}

/**
 * Turns a sorted list into card entries, folding devices that share a family and a rating
 * into one family card at the place of the first of them. A family with a single device in
 * the list stays an ordinary card. Pens and family recommendations are never folded.
 */
export function collapseFamilies(list: Item[], families: TabletFamily[]): CardEntry[] {
	const byId = new Map(families.map((f) => [f.id, f]));
	const key = (i: Item) => (i.kind === 'device' && i.familyId ? `${i.familyId}|${ratingKey(i)}` : null);
	const buckets = new Map<string, Item[]>();
	for (const i of list) {
		const k = key(i);
		if (k) (buckets.get(k) ?? buckets.set(k, []).get(k)!).push(i);
	}
	const out: CardEntry[] = [];
	const placed = new Set<string>();
	for (const i of list) {
		const k = key(i);
		const members = k ? buckets.get(k)! : null;
		if (!k || !members || members.length < 2) {
			out.push({ kind: 'item', item: i });
			continue;
		}
		if (placed.has(k)) continue;
		placed.add(k);
		const sorted = [...members].sort((a, b) => (b.specs.activeDiagIn ?? 0) - (a.specs.activeDiagIn ?? 0));
		out.push({
			kind: 'family',
			group: {
				id: k,
				familyId: i.familyId!,
				name: familyTitle(byId.get(i.familyId!), i.family ?? shortName(i)),
				members: sorted,
				labels: memberLabels(sorted.map(shortName))
			}
		});
	}
	return out;
}
