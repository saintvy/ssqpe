# Changelog

All notable changes to SSQPE will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project intends to use [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
