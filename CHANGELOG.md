# Changelog

All notable changes to SSQPE will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project intends to use [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.8] - 2026-07-28

### Added

- Added per-section copy controls to operator details, using two-column TSV for property tables and line-oriented plain text for expressions and column lists.

### Fixed

- Graph camera bounds now follow the rendered zoom level and reserve space for the open details drawer, preventing hidden rightmost nodes and excessive empty panning at reduced zoom.

## [0.2.7] - 2026-07-28

### Fixed

- Row-estimate bars, graph cards, and severity badges now compare `EstimateRows` with actual rows per execution instead of cumulative `ActualRows` from all executions.

## [0.2.6] - 2026-07-28

### Added

- Added a Show Raw Plan viewer for the complete source XML and Copy controls to both raw-plan and SQL-text viewers, including an offline clipboard fallback.

### Changed

- Replaced the Metric label with an Expand all control for collapsed operator-list subtrees.
- Text viewers now preserve long lines and expose horizontal scrolling instead of wrapping them.

### Fixed

- Show SQL Text now displays every `StatementText` from the current ShowPlan batch instead of stopping after the selected statement; long batches remain fully scrollable.

## [0.2.5] - 2026-07-28

### Added

- Added collapsed-by-default, expandable sections for operands and predicates, output columns, and defined values in operator details.

### Changed

- Graph cards now show the estimated current-operator elapsed time and self cost instead of raw subtree elapsed time and subtree cost.
- Renamed `ActualCPUms` labels to "Actual elapsed CPU time" in the English interface and its Russian equivalent.

## [0.2.4] - 2026-07-28

### Changed

- Replaced CPU in the Time list metric with a mode-aware current-operator elapsed-time estimate that handles cumulative Row Mode counters and node-only Batch Mode counters without recursively double-counting Row subtrees.

## [0.2.3] - 2026-07-28

### Changed

- Redesigned the Time list metric to show only SQL Server runtime counters: dark Actual Elapsed Time, bright CPU, and CPU as the numeric value.

## [0.2.2] - 2026-07-27

### Changed

- Replaced fixed leaf-slot graph positioning with contour-based tidy-tree packing so sibling subtrees use nearby free space while preserving node clearance and parent centering.
- Added a subtle application-version label beside the SSQPE title.

## [0.2.1] - 2026-07-27

### Fixed

- Derived operator time now considers every measured descendant, and the Time list value shows the derived operator contribution instead of inclusive elapsed time.
- Collapse controls no longer fall through to row selection or begin horizontal list panning.

## [0.2.0] - 2026-07-27

### Changed

- Changed the plan graph to a top-down layout with sibling branches arranged around their parent axis.
- Added collapsible operator-list subtrees and graph-camera focus from list selection.
- Added bidirectional camera focus: selecting a graph node now reveals and centers its matching list row.
- Redesigned the Rows metric as overlapping estimated/actual ranges normalized to the largest row count, with PEV2-style severity colors.
- Made list metric backgrounds opaque and enlarged collapse controls that appear on row hover.
- Labeled and documented the derived exclusive elapsed-time approximation in operator details.
- Wrapped each metric bar and numeric value in one opaque sticky column that masks scrolling operator names, and changed graph controls to wheel scrolling with Ctrl+wheel zooming.
- Derived exclusive time now traverses untimed child operators to the nearest descendants with elapsed counters.
- Improved large-graph panning by skipping off-screen card rendering, avoiding an unnecessary 100% scale layer, coalescing drag updates to animation frames, and suspending graph hit-testing during a drag.
- Refined selection clearing, details visibility, and horizontal list dragging without Ctrl.
- Replaced emoji language flags with self-contained inline SVG icons.

## [0.1.0] - 2026-07-27

### Added

- Offline parsing and visualization of SQL Server ShowPlan XML.
- Time, cost, and row-estimation views.
- Interactive graph navigation and operator details.
- Local history and English/Russian localization.
- Reusable-subplan detection and PEV2-style severity badges.
