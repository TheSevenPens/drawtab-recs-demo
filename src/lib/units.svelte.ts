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
export function loadUnits() {
	if (units.loaded) return;
	units.value = initial();
	units.loaded = true;
}
export function setUnits(v: Units) {
	units.value = v;
	try {
		localStorage.setItem(KEY, v);
	} catch {}
}
