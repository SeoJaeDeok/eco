export const communityObservation = {
  id: 'community-fixture-observation', name: '격리 관찰', scientificName: 'Fixture species', taxon: '식물',
  location: '격리 테스트', date: '2026-05-01', description: '', coords: { lat: 0, lng: 0 },
  imageUrl: '', status: 'approved', observerId: 'fixture-author',
};
export const createCommentFixture = (count = 27) => Array.from({ length: count }, (_, index) => ({
  id: `comment-${String(index).padStart(3, '0')}`, observationId: communityObservation.id,
  authorId: index % 2 ? 'fixture-other' : 'fixture-author', authorDisplayName: '테스트 작성자',
  kind: index % 2 ? 'identification' : 'comment', body: `격리된 ${index + 1}번째 의견`,
  createdAt: '2026-05-01T01:00:00.000Z',
}));
