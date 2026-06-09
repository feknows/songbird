---
name: supabase-postgres-best-practices
description: Postgres performance optimization and best practices from Supabase. Use this skill when writing, reviewing, or optimizing Postgres queries, schema designs, or database configurations.
---

# Supabase Postgres Best Practices

Comprehensive performance optimization guide for Postgres, maintained by Supabase. Contains rules across 8 categories, prioritized by impact.

## When to Apply

Reference these guidelines when:
- Writing SQL queries or designing schemas
- Implementing indexes or query optimization
- Reviewing database performance issues
- Configuring connection pooling or scaling
- Optimizing for Postgres-specific features
- Working with Row-Level Security (RLS)

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Query Performance | CRITICAL | `query-` |
| 2 | Connection Management | CRITICAL | `conn-` |
| 3 | Security & RLS | CRITICAL | `security-` |
| 4 | Schema Design | HIGH | `schema-` |
| 5 | Concurrency & Locking | MEDIUM-HIGH | `lock-` |
| 6 | Data Access Patterns | MEDIUM | `data-` |
| 7 | Monitoring & Diagnostics | LOW-MEDIUM | `monitor-` |
| 8 | Advanced Features | LOW | `advanced-` |

## Reference Files

Read individual rule files for detailed explanations and SQL examples:

### Query Performance (CRITICAL)
- [`references/query-missing-indexes.md`](references/query-missing-indexes.md)
- [`references/query-partial-indexes.md`](references/query-partial-indexes.md)
- [`references/query-composite-indexes.md`](references/query-composite-indexes.md)
- [`references/query-covering-indexes.md`](references/query-covering-indexes.md)
- [`references/query-index-types.md`](references/query-index-types.md)

### Connection Management (CRITICAL)
- [`references/conn-pooling.md`](references/conn-pooling.md)
- [`references/conn-limits.md`](references/conn-limits.md)
- [`references/conn-idle-timeout.md`](references/conn-idle-timeout.md)
- [`references/conn-prepared-statements.md`](references/conn-prepared-statements.md)

### Security & RLS (CRITICAL)
- [`references/security-rls-basics.md`](references/security-rls-basics.md)
- [`references/security-rls-performance.md`](references/security-rls-performance.md)
- [`references/security-privileges.md`](references/security-privileges.md)

### Schema Design (HIGH)
- [`references/schema-primary-keys.md`](references/schema-primary-keys.md)
- [`references/schema-constraints.md`](references/schema-constraints.md)
- [`references/schema-data-types.md`](references/schema-data-types.md)
- [`references/schema-foreign-key-indexes.md`](references/schema-foreign-key-indexes.md)
- [`references/schema-lowercase-identifiers.md`](references/schema-lowercase-identifiers.md)
- [`references/schema-partitioning.md`](references/schema-partitioning.md)

### Concurrency & Locking (MEDIUM-HIGH)
- [`references/lock-short-transactions.md`](references/lock-short-transactions.md)
- [`references/lock-advisory.md`](references/lock-advisory.md)
- [`references/lock-deadlock-prevention.md`](references/lock-deadlock-prevention.md)
- [`references/lock-skip-locked.md`](references/lock-skip-locked.md)

### Data Access Patterns (MEDIUM)
- [`references/data-n-plus-one.md`](references/data-n-plus-one.md)
- [`references/data-pagination.md`](references/data-pagination.md)
- [`references/data-batch-inserts.md`](references/data-batch-inserts.md)
- [`references/data-upsert.md`](references/data-upsert.md)

### Monitoring & Diagnostics (LOW-MEDIUM)
- [`references/monitor-explain-analyze.md`](references/monitor-explain-analyze.md)
- [`references/monitor-pg-stat-statements.md`](references/monitor-pg-stat-statements.md)
- [`references/monitor-vacuum-analyze.md`](references/monitor-vacuum-analyze.md)

### Advanced Features (LOW)
- [`references/advanced-full-text-search.md`](references/advanced-full-text-search.md)
- [`references/advanced-jsonb-indexing.md`](references/advanced-jsonb-indexing.md)

## References

- <https://www.postgresql.org/docs/current/>
- <https://supabase.com/docs>
- <https://wiki.postgresql.org/wiki/Performance_Optimization>
- <https://supabase.com/docs/guides/database/overview>
- <https://supabase.com/docs/guides/auth/row-level-security>
