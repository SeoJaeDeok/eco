import test from 'node:test';
import assert from 'node:assert/strict';

import { interpretGbifSpeciesMatch } from '../supabase/functions/resolve-taxonomy/gbif_mapper.ts';

const exactSpeciesResponse = {
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
};

test('maps exact accepted species to resolved interpretation', () => {
  const result = interpretGbifSpeciesMatch('Homo sapiens', exactSpeciesResponse);

  assert.equal(result.kind, 'resolved');
  assert.equal(result.taxon.sourceTaxonKey, '6MB3T');
  assert.equal(result.taxon.broadTaxon, '포유류');
  assert.equal(result.taxon.matchType, 'EXACT');
});

test('maps synonym to confirmation interpretation', () => {
  const result = interpretGbifSpeciesMatch('Felis concolor', {
    usage: {
      key: '3DXV5',
      name: 'Felis concolor Linnaeus, 1771',
      canonicalName: 'Felis concolor',
      rank: 'SPECIES',
      status: 'SYNONYM',
    },
    acceptedUsage: {
      key: '4QHKG',
      name: 'Puma concolor (Linnaeus, 1771)',
      canonicalName: 'Puma concolor',
      rank: 'SPECIES',
    },
    classification: [
      { key: 'N', name: 'Animalia', rank: 'KINGDOM' },
      { key: 'CH2', name: 'Chordata', rank: 'PHYLUM' },
      { key: 'MM', name: 'Mammalia', rank: 'CLASS' },
      { key: 'CAR', name: 'Carnivora', rank: 'ORDER' },
      { key: 'FEL', name: 'Felidae', rank: 'FAMILY' },
      { key: 'PUMA', name: 'Puma', rank: 'GENUS' },
      { key: '4QHKG', name: 'Puma concolor', rank: 'SPECIES' },
    ],
    diagnostics: { matchType: 'EXACT', confidence: 98 },
    synonym: true,
  });

  assert.equal(result.kind, 'needsConfirmation');
  assert.equal(result.taxon.reason, 'synonym');
  assert.equal(result.taxon.sourceTaxonKey, '4QHKG');
});

test('maps variant spelling to confirmation interpretation', () => {
  const result = interpretGbifSpeciesMatch('Homo sapines', {
    ...exactSpeciesResponse,
    diagnostics: { matchType: 'VARIANT', confidence: 95 },
  });

  assert.equal(result.kind, 'needsConfirmation');
  assert.equal(result.taxon.reason, 'variant');
});

test('blocks higher-rank-only and no-match responses', () => {
  const higherRank = interpretGbifSpeciesMatch('Homo', {
    usage: {
      key: '636X2',
      name: 'Homo Linnaeus, 1758',
      canonicalName: 'Homo',
      rank: 'GENUS',
      status: 'ACCEPTED',
    },
    classification: [
      { key: 'N', name: 'Animalia', rank: 'KINGDOM' },
      { key: 'CH2', name: 'Chordata', rank: 'PHYLUM' },
      { key: 'MM', name: 'Mammalia', rank: 'CLASS' },
      { key: 'PR', name: 'Primates', rank: 'ORDER' },
      { key: 'HM', name: 'Hominidae', rank: 'FAMILY' },
      { key: '636X2', name: 'Homo', rank: 'GENUS' },
    ],
    diagnostics: { matchType: 'EXACT', confidence: 94 },
    synonym: false,
  });
  const noMatch = interpretGbifSpeciesMatch('Xyzabc nonexistentii', {
    diagnostics: { matchType: 'NONE', confidence: 100 },
    synonym: false,
  });

  assert.equal(higherRank.kind, 'blocked');
  assert.equal(higherRank.reason, 'higher_rank_only');

  assert.equal(noMatch.kind, 'blocked');
  assert.equal(noMatch.reason, 'no_match');
});
