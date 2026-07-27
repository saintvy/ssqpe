# SSQPE — SQL Server Query Plan Explorer

SSQPE is a self-contained, offline visualizer and analyzer for Microsoft SQL Server ShowPlan XML files. It is a vibe-coded SQL Server analogue of [PEV2](https://github.com/dalibo/pev2): open one HTML file, load a plan exported by SQL Server Management Studio, and inspect the operator tree without sending the plan anywhere.

> Project status: early preview. The parser already handles the supplied actual, estimated, parallel, cursor, multi-statement, columnstore, spill, and spool plans, but SQL Server ShowPlan is a large format and uncommon operators may still need refinement.

## Highlights

- One portable HTML file with no server, build step, CDN, or runtime dependency.
- Drag-and-drop, file picker, and pasted ShowPlan XML input.
- Actual and estimated rows, elapsed time, CPU, estimated cost, executions, reads, spills, warnings, predicates, objects, output columns, and per-thread counters.
- A hierarchical operator list with Time, Cost, and Rows views.
- A compact contour-packed, top-down, pannable, and zoomable node graph with expandable nodes and a lockable details drawer.
- PEV2-style severity badges for slow operators and row-estimation errors.
- Structural detection of repeated subtrees, rendered as reusable subplans with call-site links.
- Multi-statement plans and statements that do not contain a physical operator tree.
- English and Russian UI with the selected language remembered locally.
- Local plan names and browser-only history backed by IndexedDB.

## Quick start

1. Download [`app/ms-sql-plan-analyzer.html`](app/ms-sql-plan-analyzer.html), or download it from a GitHub Release.
2. Open the file in a current Chrome, Edge, or Firefox browser.
3. Drop an SSMS `.sqlplan` file onto the page, choose a file, or paste ShowPlan XML.

No web server is required. The HTML file can be copied to an offline workstation and opened directly.

### Exporting a plan from SSMS

1. Display an estimated plan with **Ctrl+L**, or include the actual execution plan with **Ctrl+M** and run the query.
2. In the execution-plan tab, choose **Save Execution Plan As…**.
3. Open the resulting `.sqlplan` file in SSQPE.

## Controls

| Action | Control |
| --- | --- |
| Pan the graph | Drag with the left mouse button |
| Zoom the graph | Hold **Ctrl** and use the mouse wheel over the graph |
| Scroll the graph vertically | Use the mouse wheel over the graph |
| Pan the operator list horizontally | Drag with the left mouse button |
| Scroll the operator list vertically | Use the mouse wheel |
| Collapse or expand a list subtree | Select the chevron beside its parent operator |
| Inspect an operator | Click its graph node or list row; each view centers its camera on the matching operator in the other view |
| Clear the selected operator | Click it again or click empty graph space |
| Keep details closed | Select **Keep details hidden** in the details drawer |
| Reset graph position and zoom | Select **Reset view** |

## Severity badges

SSQPE follows the thresholds used by PEV2 1.23.0:

- slow operator clock: more than **10% / 40% / 90%** of total execution time gives a yellow / orange / red badge;
- row-estimation list: an error factor above **10× / 100× / 1000×** gives a yellow / orange / red badge.

For elapsed-time severity, SSQPE compares an operator's exclusive elapsed time with the statement root time. Some SQL Server plans contain runtime row counters but omit `ActualElapsedms`; SSQPE shows `—` instead of inventing a zero duration.

The Time view in the operator list uses only counters reported by SQL Server. Its dark bar is `ActualElapsedms`, its bright bar is `ActualCPUms`, and the numeric value is CPU time. Both bars share one scale normalized to the largest elapsed or CPU value in the statement, so CPU can extend beyond elapsed in a parallel plan.

The Rows view uses the largest estimated or actual row count in the statement as 100%. Its dark segment represents the estimate and its bright segment represents the actual count; the extension beyond the shorter segment makes under- and overestimation visible. Green, yellow, orange, and red shades use the same 10× / 100× / 1000× error thresholds as the badges.

SQL Server exposes elapsed time for an operator, but not a reliable exclusive elapsed counter. SSQPE therefore labels its detail-panel approximation as **Exclusive elapsed time (derived)** and calculates it as the operator elapsed time minus the greatest elapsed time among all of its measured descendants. This prevents short or untimed intermediate operators from hiding a longer-running node deeper on the same execution path. This value is used for slow-operator badges, not for the Time list scale. It is a critical-path approximation: parallel workers and streaming pipelines overlap, so it must not be interpreted as an exact duration measured by SQL Server.

## Privacy and local storage

Plan parsing happens entirely in the browser. SSQPE makes no network requests and does not upload query text, object names, predicates, or runtime statistics.

Opened plans and the selected interface language are stored in the browser's IndexedDB/local storage for the local HTML origin. Use **Clear** on the history screen to remove saved plans.

Execution plans can contain sensitive SQL text, database names, schema names, object names, literals, and operational statistics. Review a plan before sharing it or attaching it to a public issue.

## Development and tests

The committed smoke test has no package dependencies and uses an installed Chrome, Chromium, or Edge browser:

```bash
node tests/browser-smoke.mjs
```

In a public clone it runs against an embedded synthetic ShowPlan fixture. Maintainers can keep a private `Test data/` directory; when present, the same test automatically opens every `.sqlplan` and `.sqplan` file below it and performs additional regression checks.

Set `CHROME_PATH` if the browser executable is not in a standard location.

## Publishing

The repository includes three dependency-free GitHub workflows:

- `ci.yml` runs the synthetic browser smoke test on pushes and pull requests;
- `pages.yml` publishes the single HTML file as the GitHub Pages `index.html` from `main`;
- `release.yml` creates a GitHub Release and attaches a versioned standalone HTML file when a `v*` tag is pushed.

For example, after updating the changelog:

```bash
git tag v0.2.3
git push origin main --tags
```

## Contributing

Bug reports and focused pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a change. Please use anonymized plans or minimal synthetic fixtures in public reports.

For security-sensitive reports, follow [SECURITY.md](SECURITY.md).

## Inspiration and acknowledgements

- [PEV2](https://github.com/dalibo/pev2) by Dalibo inspired the interaction model, subtree visualization, and severity thresholds.
- [html-query-plan](https://github.com/JustinPealing/html-query-plan) was used as a reference for the SQL Server ShowPlan format and operator presentation.
- Reingold and Tilford's [tidy-tree algorithm](https://www.reingold.co/tidier-drawings.pdf) inspired the contour-based graph packing.

SSQPE is an independent project and is not affiliated with or endorsed by Dalibo, Microsoft, or the html-query-plan maintainers. Microsoft, SQL Server, and SSMS are trademarks of the Microsoft group of companies.

## License

[MIT](LICENSE)
