# Taxonomy API Probe Results

## Status

Probe status: PASS

Probe date: 2026-06-25 KST

Scope:

- Read-only GET requests.
- No authentication.
- No project credentials or user data.
- No raw API response dumps stored in Git.
- Total official API request count for this phase: 9.

한국어 요약: 공식 GBIF API에 소량의 읽기 전용 요청만 보냈고, 원본 응답 덤프나 비밀 값은 저장하지 않았습니다.

## Official Sources Used

- GBIF taxonomy interpretation documentation: `https://techdocs.gbif.org/en/data-processing/taxonomy-interpretation`
- GBIF API reference: `https://techdocs.gbif.org/en/openapi/`
- API endpoint used for probes: `https://api.gbif.org/v2/species/match`

Verified request parameters:

- `scientificName`
- `checklistKey`

Verified checklist key:

```text
7ddf754f-d193-4cc9-b351-99906754a03b
```

Checklist source:

- Catalogue of Life eXtended Release

## Compact Probe Matrix

Rank presence columns:

- K = KINGDOM
- P = PHYLUM
- C = CLASS
- O = ORDER
- F = FAMILY
- G = GENUS
- S = SPECIES

| Input | HTTP | Usage name | Accepted usage | Rank | Status | Match type | Confidence | Synonym | K/P/C/O/F/G/S | Issues | Proposed app decision |
| --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- |
| `Homo sapiens` | 200 | `Homo sapiens Linnaeus, 1758` | None | SPECIES | ACCEPTED | EXACT | 99 | false | yes/yes/yes/yes/yes/yes/yes | none | `resolved` |
| `Apis mellifera` | 200 | `Apis mellifera Linnaeus, 1758` | None | SPECIES | ACCEPTED | EXACT | 99 | false | yes/yes/yes/yes/yes/yes/yes | none | `resolved` |
| `Taraxacum officinale` | 200 | `Taraxacum officinale Weber ex F.H.Wigg.` | None | SPECIES | ACCEPTED | EXACT | 99 | false | yes/yes/yes/yes/yes/yes/yes | none | `resolved` |
| `Amanita muscaria` | 200 | `Amanita muscaria (L.) Lam.` | None | SPECIES | ACCEPTED | EXACT | 97 | false | yes/yes/yes/yes/yes/yes/yes | none | `resolved` |
| `Homo sapines` | 200 | `Homo sapiens Linnaeus, 1758` | None | SPECIES | ACCEPTED | VARIANT | 95 | false | yes/yes/yes/yes/yes/yes/yes | none | `needsConfirmation` |
| `Homo` | 200 | `Homo Linnaeus, 1758` | None | GENUS | ACCEPTED | EXACT | 94 | false | yes/yes/yes/yes/yes/yes/no | none | `blocked` higher-rank-only |
| `Xyzabc nonexistentii` | 200 | None | None | None | None | NONE | 100 | false | no/no/no/no/no/no/no | none | `blocked` no match |
| `Felis concolor` | 200 | `Felis concolor Linnaeus, 1771` | `Puma concolor (Linnaeus, 1771)` | SPECIES | SYNONYM | EXACT | 98 | true | yes/yes/yes/yes/yes/yes/yes | none | `needsConfirmation` synonym |

## Compact Classification Findings

| Input | Accepted/source terminal key used by app | Standard lineage summary |
| --- | --- | --- |
| `Homo sapiens` | `6MB3T` | Animalia > Chordata > Mammalia > Primates > Hominidae > Homo > Homo sapiens |
| `Apis mellifera` | `FN46` | Animalia > Arthropoda > Insecta > Hymenoptera > Apidae > Apis > Apis mellifera |
| `Taraxacum officinale` | `54VX8` | Plantae > Tracheophyta > Magnoliopsida > Asterales > Asteraceae > Taraxacum > Taraxacum officinale |
| `Amanita muscaria` | `5TYZ9` | Fungi > Basidiomycota > Agaricomycetes > Agaricales > Amanitaceae > Amanita > Amanita muscaria |
| `Homo sapines` | `6MB3T` | Variant spelling resolved to Homo sapiens lineage |
| `Homo` | `636X2` | Animalia > Chordata > Mammalia > Primates > Hominidae > Homo; no species rank |
| `Xyzabc nonexistentii` | None | No classification |
| `Felis concolor` | accepted key `4QHKG`; reported synonym key `3DXV5` | Animalia > Chordata > Mammalia > Carnivora > Felidae > Puma > Puma concolor |

한국어 요약: 실제 key는 숫자만이 아니라 문자와 숫자가 섞인 문자열입니다. DB에는 text로 저장해야 합니다.

## Discrepancies From Initial Assumptions

- The endpoint and checklist key are still usable according to official GBIF documentation and live probes.
- The misspelled input returned `diagnostics.matchType = VARIANT`, not a literal `FUZZY` value.
- No `issues` flags appeared in this small probe set.
- The no-match response used HTTP 200 with no `usage`, not an HTTP error.
- GBIF source taxon keys are not numeric-only.

## API Failure Observations

- Timeout: not observed.
- HTTP 429: not observed.
- GBIF 5xx: not observed.
- Malformed JSON: not observed.
- Network failure: not observed.

Design implication:

- The future app still needs explicit `error` handling for these cases, but Phase 24A did not encounter them.

## Unresolved API Questions

- The full set of possible `diagnostics.matchType` values should be treated as provider data and mapped defensively.
- Ambiguity indicators should be validated again with official docs and targeted examples before building a candidate picker.
- GBIF rate-limit thresholds are not fixed in this project documentation; handle 429 conservatively and avoid background calls.
- Classification completeness can vary by taxon. The app must never invent missing lineage ranks.

## Phase 24A Probe Conclusion

PASS:

- Official endpoint and checklist were verified.
- Required response areas were observed in live compact probes.
- Exact accepted species, synonym, variant/misspelling, higher-rank-only, and no-match behaviors were recorded.

PARTIAL:

- API failure behavior was not naturally observed.
- Multiple/ambiguous candidate behavior was not probed in depth because Phase 24A intentionally kept request count small.

FAIL:

- None.
