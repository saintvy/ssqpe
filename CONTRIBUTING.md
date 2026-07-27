# Contributing to SSQPE

Thank you for helping improve SSQPE.

## Before opening an issue

- Search existing issues first.
- Confirm the problem with the latest committed HTML file.
- Never publish a production execution plan without reviewing and anonymizing SQL text, database and object names, predicates, literals, and runtime data.
- Prefer a minimal synthetic `.sqlplan` reproducer.

## Pull requests

1. Keep the application self-contained and offline. Do not add CDN or runtime network dependencies.
2. Keep user-facing strings in both `I18N.ru` and `I18N.en` near the beginning of the HTML script.
3. Preserve support for opening the HTML directly from `file://`.
4. Run `node tests/browser-smoke.mjs`.
5. Explain the ShowPlan variant and UI behavior covered by the change.

The private `References/` and `Test data/` directories are intentionally ignored. Do not force-add their contents to a pull request.

## Code style

- Use plain browser APIs and keep the generated deliverable understandable.
- Escape all XML-derived content before inserting it into HTML.
- Treat absent ShowPlan counters as unknown, not as zero.
- Avoid changing unrelated behavior in parser fixes.
