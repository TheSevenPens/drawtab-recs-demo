# Drawing tablet recommendations (prototype)

> **This is a prototype.** It's published to collect feedback and changes often.
> Ratings, wording and layout are not final. The current recommendations live at
> [docs.sevenpens.com](https://docs.sevenpens.com/drawtab/recs).

Live demo: https://thesevenpens.github.io/drawtab-recs-demo/

Seven Pens' recommendations for pen tablets, pen displays, standalone devices
and pens, in one filterable, sortable site with specs inline. It is meant to
replace the ranked lists on docs.sevenpens.com/drawtab/recs.

Built with SvelteKit (same stack as the DrawTabData Explorer) and exported as a
static site, so it can be hosted on GitHub Pages.

## Run it

Needs Node 20 or newer.

```
npm install
npm run dev
```

Then open http://localhost:5178.

## Rebuild the data

The app reads `static/data/catalog.json`, built from a DrawTabData checkout.
Ratings, notes, lists and prices are DrawTabData data now
(`data/recommendations/`, `data/prices/`), so to change a rating or add a
price check, change DrawTabData, then rebuild here:

```
npm run data                                  (finds ..\GitHub\DrawTabData or the Explorer's data-repo)
npm run data -- --data C:\path\to\DrawTabData
```

## Publishing

Every push to `main` builds the site and publishes it to GitHub Pages
(`.github/workflows/deploy.yml`). Pages must be set to "GitHub Actions" under
Settings > Pages. To redeploy without a change, run the workflow from the
Actions tab.

## Build for hosting

```
npm run build                                 (site at the domain root)
set BASE_PATH=/repo-name && npm run build     (GitHub Pages project site)
```

The output is in `build/`. Every recommendation gets its own page at
`/device/<id>/`, so shared links preview with that device's name and rating.

## Layout

- DrawTabData `data/recommendations/sevenpens-{ratings,notes,lists}.json`:
  Seven's dated ratings for tablets and pens, notes and the beginner list
  (see DrawTabData `docs/RECOMMENDATIONS.md`).
- DrawTabData `data/prices/<BRAND>-prices.json`: dated price observations,
  imported from the price workbook by DrawTabData `scripts/import-prices.py`
  (see `docs/PRICES.md`).
- `recs/app-recs.json`: what isn't a DrawTabData entity yet: family
  recommendations (iPad, Galaxy Tab S, …), "also sold as" names and rating
  label aliases.
- `recs/notes-pages.json`: tablet to "Seven's notes" page links (stopgap until
  DrawTabData carries them).
- `scripts/build-data.mjs`: reads DrawTabData (specs, pressure, ratings, prices) plus
  `recs/app-recs.json` and writes the catalog.
- `src/lib/catalog.ts`: types, filtering, sorting and labels.
- `src/routes/+page.svelte`: the main page (simple / expert, cards / table).
- `src/routes/device/[id]/`, `pen/[id]/`, `family/[id]/`: detail pages.
- `static/data/catalog.json`: the generated catalog the site loads. Specs,
  pens, families, links and pressure measurements come from the public
  [DrawTabData](https://github.com/TheSevenPens/DrawTabData) repo; so do
  ratings, notes and prices; family recommendations come from `recs/`.

## Rules the data follows

- One rating per device. The current rating is the latest record; a device
  that was on more than one page takes its newest rating.
- DECENT was merged into OK.
- Family recommendations (iPad, Galaxy Tab S, etc.) are rated as families.
- Xencelabs Pen Display 16 Lite carries the rating of the original Pen
  Display 16 (same hardware, different box contents).
