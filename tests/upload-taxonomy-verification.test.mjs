import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canSubmitWithVerifiedTaxonomy,
  createInitialTaxonomyVerificationState,
  getTaxonomySubmitBlockMessage,
  getTaxonomyVerificationStateAfterScientificNameChange,
} from '../src/features/upload/uploadTaxonomyVerification.ts';
import { mockTaxonomyRepository } from '../src/repositories/mockTaxonomyRepository.ts';

test('taxonomy verification starts empty and becomes dirty after scientific-name input', () => {
  assert.deepEqual(createInitialTaxonomyVerificationState(''), { status: 'empty' });
  assert.deepEqual(getTaxonomyVerificationStateAfterScientificNameChange('Homo sapiens'), { status: 'dirty' });
});

test('only resolved taxonomy state can submit', async () => {
  const dirty = getTaxonomyVerificationStateAfterScientificNameChange('Homo sapiens');
  assert.equal(canSubmitWithVerifiedTaxonomy(dirty), false);
  assert.equal(getTaxonomySubmitBlockMessage(dirty), '학명 확인 후 등록할 수 있습니다.');

  const resolved = await mockTaxonomyRepository.resolveScientificName({ scientificName: 'Taraxacum officinale' });
  assert.equal(resolved.status, 'resolved');
  assert.equal(canSubmitWithVerifiedTaxonomy({ status: 'resolved', result: resolved }), true);
});

test('confirmation and blocked states keep submit disabled', async () => {
  const confirmation = await mockTaxonomyRepository.resolveScientificName({ scientificName: 'Felis concolor' });
  const blocked = await mockTaxonomyRepository.resolveScientificName({ scientificName: 'Homo' });

  assert.equal(confirmation.status, 'needsConfirmation');
  assert.equal(canSubmitWithVerifiedTaxonomy({ status: 'needsConfirmation', result: confirmation }), false);

  assert.equal(blocked.status, 'blocked');
  assert.equal(canSubmitWithVerifiedTaxonomy({ status: 'blocked', result: blocked }), false);
});

