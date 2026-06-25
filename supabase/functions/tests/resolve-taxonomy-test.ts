import { assertEquals } from '@std/assert';
import { interpretGbifSpeciesMatch } from '../resolve-taxonomy/gbif_mapper.ts';
import {
  deriveBroadTaxonFromLineage,
  normalizeScientificNameInput,
} from '../resolve-taxonomy/taxonomy_core.ts';

Deno.test('normalizes scientific-name input for the resolver', () => {
  const result = normalizeScientificNameInput('  Homo   sapiens  ');

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.reportedScientificName, 'Homo sapiens');
    assertEquals(result.normalizedInput, 'homo sapiens');
  }
});

Deno.test('derives supported broad taxon groups deterministically', () => {
  assertEquals(deriveBroadTaxonFromLineage({ class: { key: 'IN', name: 'Insecta' } }), '곤충');
  assertEquals(deriveBroadTaxonFromLineage({ class: { key: 'AV', name: 'Aves' } }), '조류');
  assertEquals(deriveBroadTaxonFromLineage({ class: { key: 'MM', name: 'Mammalia' } }), '포유류');
  assertEquals(deriveBroadTaxonFromLineage({ class: { key: 'AM', name: 'Amphibia' } }), '양서/파충류');
  assertEquals(deriveBroadTaxonFromLineage({ kingdom: { key: 'P', name: 'Plantae' } }), '식물');
  assertEquals(deriveBroadTaxonFromLineage({ kingdom: { key: 'F', name: 'Fungi' } }), '균류');
  assertEquals(deriveBroadTaxonFromLineage({}), '기타');
});

Deno.test('maps exact GBIF species match to resolved interpretation', () => {
  const result = interpretGbifSpeciesMatch('Homo sapiens', {
    usage: {
      key: '6MB3T',
      name: 'Homo sapiens Linnaeus, 1758',
      canonicalName: 'Homo sapiens',
      rank: 'SPECIES',
      status: 'ACCEPTED',
    },
    classification: [
      { key: 'N', name: 'Animalia', rank: 'KINGDOM' },
      { key: 'CH2', name: 'Chordata', rank: 'PHYLUM' },
      { key: 'MM', name: 'Mammalia', rank: 'CLASS' },
      { key: 'PR', name: 'Primates', rank: 'ORDER' },
      { key: 'HM', name: 'Hominidae', rank: 'FAMILY' },
      { key: 'H', name: 'Homo', rank: 'GENUS' },
      { key: '6MB3T', name: 'Homo sapiens', rank: 'SPECIES' },
    ],
    diagnostics: { matchType: 'EXACT', confidence: 99 },
    synonym: false,
  });

  assertEquals(result.kind, 'resolved');
});
