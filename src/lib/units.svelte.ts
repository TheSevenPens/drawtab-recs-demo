import type { Units } from './catalog';

// The reader's choice of units for active area, remembered per browser.
// Diagonals stay in inches everywhere: that's how sizes are talked about.
const KEY = 'recs-units';
function initial(): Units {
	try {
		const v = localStorage.getItem(KEY);
		if (v === 'mm' || v === 'in' || v === 'both') return v;
	} catch {}
	return 'mm';
}
export const units = $state({ value: 'mm' as Units, loaded: false });
// Card view only: fold a family's devices (same rating) into one card. Remembered too.
const FAM_KEY = 'recs-collapse-families';
export const familyCards = $state({ collapse: false });
export function loadUnits() {
	if (units.loaded) return;
	units.value = initial();
	try {
		familyCards.collapse = localStorage.getItem(FAM_KEY) === '1';
	} catch {}
	units.loaded = true;
}
export function setCollapseFamilies(v: boolean) {
	familyCards.collapse = v;
	try {
		localStorage.setItem(FAM_KEY, v ? '1' : '');
	} catch {}
}
export function setUnits(v: Units) {
	units.value = v;
	try {
		localStorage.setItem(KEY, v);
	} catch {}
}
