# Taxonomy Resolution Design

## Purpose

This document designs a later taxonomy resolver for scientific names and canonical ranks. It is design-only for Phase 21F.

**한국어:** 이 문서는 향후 학명 기반 분류 자동 보정 기능을 설계합니다. Phase 21F에서는 앱 구현, 외부 API 호출, DB/RLS 변경을 하지 않습니다.

## Core Principle

Do not use an LLM guess as the taxonomy source of truth.

LLMs can help explain terms or summarize review decisions, but accepted taxonomy should come from authoritative taxonomy data sources such as GBIF, Catalogue of Life-style datasets, or another project-approved reference.

**한국어:** 분류의 정답 근거는 LLM 추정이 아니라 GBIF, Catalogue of Life 계열 같은 권위 있는 데이터 소스여야 합니다.

## Repository Boundary

Future external lookup should sit behind a repository/service boundary:

```text
TaxonomyRepository.resolveScientificName(input)
TaxonomyRepository.getTaxonBySourceId(source, sourceId)
```

UI components should not call third-party taxonomy APIs directly.

**한국어:** 외부 taxonomy API 호출은 UI가 직접 하지 않고 `TaxonomyRepository` 같은 경계 뒤에 둡니다.

## Match Outcomes

Resolver responses should classify matches into:

- `exact`: canonical accepted match with high confidence.
- `fuzzy`: likely match but spelling/synonym ambiguity exists.
- `ambiguous`: multiple plausible matches.
- `higherrank`: input resolved only to genus/family/etc., not species.
- `none`: no acceptable match.

**한국어:** 결과는 exact, fuzzy, ambiguous, higherrank, none처럼 검토 가능한 상태로 나눕니다.

## Confidence Gating

Suggested MVP rules:

- Exact and high-confidence matches may auto-fill canonical fields.
- Fuzzy matches should preview a suggestion and require user confirmation.
- Ambiguous matches must require user/admin selection.
- Higherrank and none must not silently fill species-level data.
- Low-confidence values should be stored as unresolved review candidates, not as accepted taxonomy.

**한국어:** 확실한 결과만 자동 채우고, 애매하거나 낮은 신뢰도인 결과는 사용자 또는 관리자 검토를 요구합니다.

## Stored Fields

Conceptual DB fields for a later migration candidate:

- `taxonomy_source`
- `taxonomy_source_id`
- `taxonomy_match_type`
- `taxonomy_confidence`
- `accepted_scientific_name`
- `kingdom`
- `phylum`
- `class_name` or another SQL-safe column name
- `order_name` or another SQL-safe column name
- `family`
- `genus`
- `species`
- `taxonomy_raw_response`
- `taxonomy_review_status`
- `taxonomy_reviewed_by`
- `taxonomy_reviewed_at`

Do not draft/apply SQL in Phase 21F. The names above are conceptual and need a separate DB/RLS phase.

**한국어:** 저장 필드는 개념 설계만 기록합니다. 실제 SQL 초안과 적용은 별도 phase에서 진행합니다.

## Future Scientific Name Required Flow

Introduce required scientific names in steps:

1. Keep scientific name optional while resolver design and data model are reviewed.
2. Add non-blocking suggestions for existing observations.
3. Add upload/edit validation warning when scientific name is missing.
4. After data quality policy is accepted, require scientific name for new submissions.
5. Provide an admin/user review path for fuzzy, ambiguous, higherrank, or none results.

**한국어:** 학명 필수화는 즉시 강제하지 않고, 제안과 경고를 거친 뒤 정책 승인 후 단계적으로 적용합니다.

## Error And Rate-Limit Handling

Future resolver code should:

- debounce lookup from UI input;
- cache successful lookup responses;
- handle third-party downtime without blocking basic observation browsing;
- record unresolved state rather than inventing a classification;
- avoid logging query strings that include personal information;
- keep API keys out of frontend code unless the provider explicitly supports browser-exposed public keys.

**한국어:** 외부 API 장애나 rate limit이 있어도 관찰 목록/지도는 계속 동작해야 하며, 실패 시 임의 분류를 만들지 않습니다.

## Non-Scope For Phase 21F

- No external API integration.
- No DB migration.
- No RLS change.
- No required scientific-name validation in app code.
- No taxonomy admin review UI.
- No graph/tree implementation.
- No new dependency.
