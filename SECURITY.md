# Security policy

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting feature when it is enabled for the repository. Do not disclose a security issue in a public discussion before a fix is available.

## Sensitive execution plans

SQL Server execution plans may contain query text, database and object names, predicates, literal values, parameters, and operational statistics. Remove or replace sensitive values before attaching a plan to any public issue.

SSQPE is designed to run offline and does not intentionally make network requests. A report that demonstrates unexpected network access, unsafe rendering of XML-derived content, or unintended cross-plan data exposure is considered security relevant.
