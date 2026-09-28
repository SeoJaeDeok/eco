// Isolated local records only; never passed to a write repository.
export const fixtureImagePath = `observations/${'a'.repeat(36)}/${'b'.repeat(36)}.jpg`;
export const createPaginationObservations = (count = 47) => Array.from({ length: count }, (_, index) => ({
  id: `fixture-${String(index + 1).padStart(3, '0')}`,
  name: index === 46 ? '뒤 페이지 수국' : '같은 관찰종',
  scientificName: 'Fixture species', taxon: index % 2 ? '조류' : '식물',
  location: '로컬 테스트 영역', date: '2026-01-01', description: '격리된 페이지 테스트',
  coords: { lat: 0, lng: 0 }, imageUrl: '',
  ...(index % 3 === 0 ? { imagePath: fixtureImagePath } : {}),
  status: 'approved',
}));

export const toPaginationDbRow = (observation) => ({
  id: observation.id, name: observation.name, scientific_name: observation.scientificName,
  taxon: observation.taxon, location: observation.location, observed_date: observation.date,
  description: observation.description, latitude: observation.coords.lat, longitude: observation.coords.lng,
  image_url: observation.imageUrl || null, image_path: observation.imagePath ?? null,
  image_mime_type: observation.imageMimeType ?? null, image_size_bytes: observation.imageSizeBytes ?? null,
  status: observation.status ?? 'approved',
  observer_id: null, observer_display_name: null, taxon_id: null,
  taxonomy_match_type: null, taxonomy_confidence: null, taxonomy_verified_at: null,
  created_at: '2026-01-01', updated_at: '2026-01-01',
});
