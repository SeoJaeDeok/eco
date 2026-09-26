import { ExternalLink } from 'lucide-react';
import { BIODIVERSITY_SITES } from '../../constants/biodiversitySites';

export const IntroRelatedSites = () => (
  <section aria-labelledby="intro-related-sites-title" className="mt-16 border-t border-zinc-100 pt-8">
    <h2 id="intro-related-sites-title" className="font-serif text-2xl text-zinc-900">
      생물 정보 찾아보기
    </h2>
    <p className="mt-3 text-sm leading-relaxed text-zinc-500">
      생물 이름과 분류, 생태 정보를 더 알아볼 수 있는 외부 사이트입니다.
    </p>
    <ul className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
      {BIODIVERSITY_SITES.map((site) => (
        <li key={site.id} className="min-w-0">
          <a
            href={site.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-labelledby={`intro-site-${site.id}-name intro-site-${site.id}-new-tab`}
            aria-describedby={`intro-site-${site.id}-description`}
            className="group flex h-full min-w-0 flex-col border border-zinc-200 bg-white p-5 text-zinc-900 transition-colors hover:border-zinc-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
          >
            <h3 id={`intro-site-${site.id}-name`} className="font-serif text-lg [overflow-wrap:anywhere] group-hover:underline underline-offset-4">
              {site.name}
            </h3>
            <p id={`intro-site-${site.id}-description`} className="mt-3 mb-5 text-sm leading-relaxed text-zinc-600 [overflow-wrap:anywhere]">
              {site.description}
            </p>
            <span id={`intro-site-${site.id}-new-tab`} className="mt-auto inline-flex items-center gap-2 text-xs text-zinc-500">
              새 탭에서 열기
              <ExternalLink size={14} aria-hidden="true" className="shrink-0" />
            </span>
          </a>
        </li>
      ))}
    </ul>
  </section>
);
