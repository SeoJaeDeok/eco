import { Observation } from './types';

export const FIXED_OBSERVATIONS: Observation[] = [
  {
    id: 'fixed-great-tit',
    name: '박새',
    scientificName: 'Parus minor',
    taxon: '조류',
    location: '경북대학교 캠퍼스',
    date: '2026-05-06',
    description: '사람들이 매우 많이 다니는 산책로 돌담에 둥지를 틀었다. 성조가 물고있는 벌레의 크기나, 둥지에서 나는 새끼의 소리를 감안했을 때 이소 직전으로 보인다.',
    coords: { lat: 35.8888, lng: 128.6103 },
    imageUrl: '/observations/obs-great-tit.jpg'
  }
];
