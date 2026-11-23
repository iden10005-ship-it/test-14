import type {
  PageRoute,
  RegionDetail,
  ServiceItem,
  SiteData,
} from '@/src/types/clearworks';
import { getFeaturedPostsForRegion } from '@/src/utils/galleryRegions';
import { getServiceSeoStems, inferMetroPrefix } from '@/src/utils/seo';

export type KeywordGroupType = 'related' | 'longtail';

export interface SeoKeywordSuggestion {
  keyword: string;
  group?: KeywordGroupType;
  intent: string;
  reason: string;
  sourceLabel?: string;
}

export interface ExtractedTextSignal {
  label: string;
  value: string;
}

export interface PageKeywordAnalysis {
  pageKey: string;
  pageKindLabel: string;
  extractedSignals: ExtractedTextSignal[];
  relatedKeywords: SeoKeywordSuggestion[];
  longTailKeywords: SeoKeywordSuggestion[];
  allSuggestions: SeoKeywordSuggestion[];
  recommendedTitle: string;
  recommendedDescription: string;
  corpusSummary: string;
}

const GENERIC_PLACEHOLDERS = ['중심 상권', '아파트 밀집 구역', '랜드마크 아파트', '중심 상업지구'];

function cleanToken(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

function isUsefulRegionToken(token: string, regionName: string): boolean {
  const cleaned = cleanToken(token);
  if (!cleaned || cleaned.length < 2) return false;
  if (GENERIC_PLACEHOLDERS.some((p) => cleaned.includes(p))) return false;
  if (cleaned === `${regionName} 1동` || cleaned === `${regionName} 2동`) return false;
  return true;
}

function extractMatchingKeywords(text: string, dictionary: Array<{ pattern: RegExp; term: string }>): string[] {
  const found: string[] = [];
  for (const entry of dictionary) {
    if (entry.pattern.test(text) && !found.includes(entry.term)) {
      found.push(entry.term);
    }
  }
  return found;
}

const AUDIENCE_DICT: Array<{ pattern: RegExp; term: string }> = [
  { pattern: /아파트|공동주택|주거/, term: '아파트' },
  { pattern: /주상복합/, term: '주상복합' },
  { pattern: /오피스텔/, term: '오피스텔' },
  { pattern: /빌라|주택/, term: '빌라·주택' },
  { pattern: /상가|로드샵|매장/, term: '상가 매장' },
  { pattern: /카페|베이커리|음식점/, term: '카페·매장' },
  { pattern: /쇼윈도|통유리/, term: '매장 통유리' },
  { pattern: /사무실|오피스/, term: '사무실' },
  { pattern: /빌딩|사옥|건물/, term: '빌딩 건물' },
  { pattern: /병원|학원/, term: '병원·학원' },
  { pattern: /신축|준공|입주/, term: '입주·준공' },
];

const PROBLEM_SCOPE_DICT: Array<{ pattern: RegExp; term: string }> = [
  { pattern: /외창|외부\s*유리/, term: '외창 청소' },
  { pattern: /창틀|샷시|레일/, term: '창틀·샷시 청소' },
  { pattern: /방충망/, term: '방충망 세척' },
  { pattern: /물때|석회|백화/, term: '유리 물때·백화 제거' },
  { pattern: /미세먼지|황사|매연/, term: '미세먼지 외창 세척' },
  { pattern: /고압\s*세척/, term: '외벽 고압세척' },
  { pattern: /로프|스카이|고소/, term: '고층 로프·스카이차 작업' },
  { pattern: /커튼월|알루미늄|복합판넬|징크|석재/, term: '커튼월·외장재 세척' },
  { pattern: /간판|플렉스|채널/, term: '매장 간판 세척' },
  { pattern: /어닝|천막/, term: '어닝 세척' },
  { pattern: /시트지|썬팅|필름|안개/, term: '썬팅·시트지 제거' },
  { pattern: /본드|점착|잔여물|끈적/, term: '유리 본드자국 제거' },
  { pattern: /발수\s*코팅|오염\s*방지/, term: '유리 발수코팅' },
  { pattern: /조류|비둘기|배설물/, term: '조류 배설물·특수청소' },
  { pattern: /정기\s*관리|월\s*관리/, term: '정기 유리창 관리' },
];

const EQUIPMENT_METHOD_DICT: Array<{ pattern: RegExp; term: string }> = [
  { pattern: /스퀴지/, term: '전문 스퀴지 공법' },
  { pattern: /중성|친환경|전용\s*세제/, term: '친환경 중성 케미컬' },
  { pattern: /초고순수|정제수|물자국/, term: '정제수 무자국 세척' },
  { pattern: /고압\s*세척/, term: '고압 세척 장비' },
  { pattern: /열풍기|스크래퍼/, term: '열풍·무스크래치 제거' },
  { pattern: /스카이|고소\s*작업/, term: '고소작업차(스카이차)' },
  { pattern: /로프|안전\s*인증/, term: '고층 로프 안전시공' },
  { pattern: /발수/, term: '초발수 코팅제' },
];

function dedupeSuggestions(items: SeoKeywordSuggestion[]): SeoKeywordSuggestion[] {
  const seen = new Set<string>();
  const out: SeoKeywordSuggestion[] = [];
  for (const item of items) {
    const kw = cleanToken(item.keyword);
    const norm = kw.replace(/\s+/g, '').toLowerCase();
    if (!kw || kw.length < 2 || seen.has(norm)) continue;
    seen.add(norm);
    out.push({ ...item, keyword: kw });
  }
  return out;
}

function splitServiceTitleSegments(title: string): string[] {
  return title
    .split(/[·,/()]/)
    .map((s) => cleanToken(s))
    .filter((s) => s.length >= 2);
}

function getCorePriceCue(priceGuide: string): string {
  if (/평/.test(priceGuide)) return '평형별 비용';
  if (/층|견적/.test(priceGuide)) return '현장 견적 비용';
  if (/면적|난이도/.test(priceGuide)) return '면적별 단가';
  return '시공 비용';
}

function buildServiceAnalysis(
  service: ServiceItem,
  siteData: SiteData
): PageKeywordAnalysis {
  const { detail } = service;
  const companyName = siteData.company.name || '클리어웍스';
  const stems = getServiceSeoStems(service.id, service.title);
  const titleSegments = splitServiceTitleSegments(service.title);
  const primaryStem = stems[0] || titleSegments[0] || service.title;
  const secondaryStem = stems[1] || titleSegments[1] || '유리창청소';

  const fullText = [
    service.badge || '',
    service.title,
    service.description,
    detail.tagline,
    detail.targetAudience,
    detail.scopeList.join(' '),
    detail.equipment.join(' '),
    detail.duration,
    detail.priceGuide,
    (detail.faqList || []).map((f) => `${f.q} ${f.a}`).join(' '),
  ].join(' ');

  const audiences = extractMatchingKeywords(
    `${detail.targetAudience} ${service.description} ${service.title}`,
    AUDIENCE_DICT
  );
  const scopes = extractMatchingKeywords(
    `${detail.scopeList.join(' ')} ${service.description} ${detail.tagline}`,
    PROBLEM_SCOPE_DICT
  );
  const methods = extractMatchingKeywords(detail.equipment.join(' '), EQUIPMENT_METHOD_DICT);
  const topRegions = siteData.regions.list
    .slice(0, 6)
    .map((r) => inferMetroPrefix(r).shortAlias)
    .filter(Boolean);
  const priceCue = getCorePriceCue(detail.priceGuide);

  const extractedSignals: ExtractedTextSignal[] = [
    { label: '서비스명', value: service.title },
    ...(audiences.length > 0
      ? [{ label: '추천 대상(targetAudience)', value: audiences.slice(0, 3).join(', ') }]
      : []),
    ...(scopes.length > 0
      ? [{ label: '시공 범위(scopeList)', value: scopes.slice(0, 3).join(', ') }]
      : []),
    ...(methods.length > 0
      ? [{ label: '장비·공법(equipment)', value: methods.slice(0, 2).join(', ') }]
      : []),
    { label: '견적·시간(priceGuide)', value: detail.priceGuide },
  ];

  const primaryAudience = audiences[0] || titleSegments[0] || '건물';
  const secondAudience = audiences[1] || '';
  const primaryScope = scopes[0] || secondaryStem;
  const secondScope = scopes[1] || '';
  const primaryMethod = methods[0] || '';
  const faqHasAs = /A\/S|재시공|비/.test(fullText);
  const faqHasTime = /시간|소요|방문/.test(fullText);

  const relatedRaw: SeoKeywordSuggestion[] = [
    {
      keyword: primaryStem,
      group: 'related',
      intent: '연관검색어',
      sourceLabel: '서비스 핵심',
      reason: `'${service.title}' 본문 제목과 설명에서 가장 검색량이 높은 대표 연관 키워드입니다.`,
    },
    {
      keyword: secondaryStem,
      group: 'related',
      intent: '연관검색어',
      sourceLabel: '서비스 슬로건',
      reason: `'${detail.tagline}'의 핵심 수요를 대변하는 구글·네이버 연관 검색어입니다.`,
    },
    ...titleSegments.slice(0, 2).map((seg) => ({
      keyword: seg.includes('청소') || seg.includes('제거') || seg.includes('코팅') ? seg : `${seg} 청소`,
      group: 'related' as const,
      intent: '연관검색어',
      sourceLabel: '서비스 타이틀',
      reason: `서비스 제목 '${seg}'에서 직접 검색되는 고객 탐색형 키워드입니다.`,
    })),
    ...(scopes.slice(0, 3).map((sc) => ({
      keyword: sc,
      group: 'related' as const,
      intent: '서비스핵심',
      sourceLabel: '시공 범위',
      reason: `체크리스트(${detail.scopeList[0]?.slice(0, 18) || sc}...)에 명시된 세부 시공 키워드입니다.`,
    }))),
    ...(topRegions[0]
      ? [
          {
            keyword: `${topRegions[0]} ${primaryStem}`,
            group: 'related' as const,
            intent: '지역검색',
            sourceLabel: '출장 지역',
            reason: `주요 출장지(${topRegions[0]})와 서비스 핵심어를 결합해 지역 검색 유입을 높입니다.`,
          },
        ]
      : []),
    {
      keyword: `${companyName} ${primaryStem}`,
      group: 'related',
      intent: '브랜드·신뢰',
      sourceLabel: '브랜드명',
      reason: `브랜드 검색 시 해당 서비스 상세 페이지가 함께 노출되도록 연결합니다.`,
    },
  ];

  const longTailRaw: SeoKeywordSuggestion[] = [
    {
      keyword: `${primaryStem} ${priceCue}`,
      group: 'longtail',
      intent: '롱테일·문의',
      sourceLabel: '예상 견적 기준',
      reason: `견적 기준('${detail.priceGuide}')을 바탕으로 가격 비교 고객이 검색하는 고전환 키워드입니다.`,
    },
    {
      keyword: `${primaryAudience} ${primaryScope} 전문 업체`,
      group: 'longtail',
      intent: '롱테일·문의',
      sourceLabel: '추천 대상·체크리스트',
      reason: `추천 대상('${detail.targetAudience.slice(0, 22)}...')과 세부 범위를 묶은 업체 탐색 키워드입니다.`,
    },
    ...(secondScope
      ? [
          {
            keyword: `${primaryAudience} ${secondScope} 방법 가격`,
            group: 'longtail' as const,
            intent: '롱테일·문의',
            sourceLabel: '시공 범위',
            reason: `구체적 오염/시공 범위('${secondScope}') 해결을 찾는 실수요자 롱테일 문구입니다.`,
          },
        ]
      : []),
    ...(primaryMethod
      ? [
          {
            keyword: `${primaryMethod} ${primaryStem} 추천`,
            group: 'longtail' as const,
            intent: '롱테일·신뢰',
            sourceLabel: '장비·공법',
            reason: `사용 장비('${detail.equipment[0]?.slice(0, 18) || primaryMethod}') 차별점을 검색하는 고객을 유입시킵니다.`,
          },
        ]
      : []),
    ...(secondAudience
      ? [
          {
            keyword: `${secondAudience} ${primaryStem} 무료견적`,
            group: 'longtail' as const,
            intent: '롱테일·문의',
            sourceLabel: '추천 대상',
            reason: `세부 타겟('${secondAudience}')의 견적 문의 직전 검색 패턴에 맞춘 키워드입니다.`,
          },
        ]
      : []),
    ...(topRegions[0] && topRegions[1]
      ? [
          {
            keyword: `${topRegions[0]} ${topRegions[1]} ${primaryStem} 잘하는곳`,
            group: 'longtail' as const,
            intent: '지역검색',
            sourceLabel: '출장 지역 연계',
            reason: `네이버에서 선호하는 '지역+세부서비스+잘하는곳/후기' 조합 롱테일 검색어입니다.`,
          },
        ]
      : []),
    ...(faqHasAs
      ? [
          {
            keyword: `${primaryStem} 비온후 무상 AS 보증`,
            group: 'longtail' as const,
            intent: '브랜드·신뢰',
            sourceLabel: '자주 묻는 질문(FAQ)',
            reason: `FAQ에 안내된 사후 보증 정책을 검색하는 신중한 고객층의 전환율을 높입니다.`,
          },
        ]
      : []),
    ...(faqHasTime
      ? [
          {
            keyword: `${primaryStem} 작업 소요시간 예약 안내`,
            group: 'longtail' as const,
            intent: '롱테일·문의',
            sourceLabel: '소요시간·FAQ',
            reason: `평균 소요 시간('${detail.duration}') 정보를 찾는 예약 직전 고객용 롱테일입니다.`,
          },
        ]
      : []),
  ];

  const relatedKeywords = dedupeSuggestions(relatedRaw).slice(0, 8);
  const longTailKeywords = dedupeSuggestions(longTailRaw).slice(0, 8);
  const allSuggestions = dedupeSuggestions([...relatedKeywords, ...longTailKeywords]);

  const topLongTailTitle = longTailKeywords[0]?.keyword || `${primaryStem} 무료견적`;
  const recommendedTitle = `${service.title} · ${primaryStem} | 서울·경기·인천 ${companyName}`;
  const recommendedDescription = `${detail.tagline} ${detail.targetAudience} 맞춤 ${primaryScope} 및 ${detail.equipment[0] || '전문 장비'} 시공 (${detail.priceGuide}). ${topLongTailTitle} 상담 ${companyName}.`.slice(
    0,
    158
  );

  const corpusSummary = [
    `[페이지 유형] ServiceDetailPage (${service.title})`,
    `[뱃지] ${service.badge || ''}`,
    `[핵심 슬로건] ${detail.tagline}`,
    `[서비스 요약] ${service.description}`,
    `[추천 대상] ${detail.targetAudience}`,
    `[시공 범위 체크리스트] ${detail.scopeList.join(' / ')}`,
    `[사용 장비 및 공법] ${detail.equipment.join(' / ')}`,
    `[소요 시간] ${detail.duration}`,
    `[예상 견적 기준] ${detail.priceGuide}`,
    detail.faqList && detail.faqList.length > 0
      ? `[자주 묻는 질문] ${detail.faqList.map((f) => `${f.q} -> ${f.a}`).join(' / ')}`
      : '',
    `[주요 출장 지역] ${siteData.regions.list.slice(0, 8).join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    pageKey: `service:${service.id}`,
    pageKindLabel: '서비스 상세 페이지 (ServiceDetailPage)',
    extractedSignals,
    relatedKeywords,
    longTailKeywords,
    allSuggestions,
    recommendedTitle,
    recommendedDescription,
    corpusSummary,
  };
}

function buildRegionAnalysis(
  regionName: string,
  siteData: SiteData,
  focusedService?: ServiceItem
): PageKeywordAnalysis {
  const companyName = siteData.company.name || '클리어웍스';
  const metro = inferMetroPrefix(regionName);
  const detail: RegionDetail = siteData.regions.details[regionName] ?? {
    name: regionName,
    subDistricts: [`${regionName} 1동`, `${regionName} 2동`, '중심 상권', '아파트 밀집 구역'],
    description: `${regionName} 전지역 아파트 외창 및 상가 유리창 전문 신속 출장`,
    leadTime: '상담 접수 후 24시간 이내 방문 견적 가능',
    popularComplexes: [`${regionName} 랜드마크 아파트`, `${regionName} 중심 상업지구`],
    notice: `${regionName} 지역 단체 및 공동구매 접수 시 특별 할인 적용`,
  };

  const usefulSubDistricts = detail.subDistricts.filter((s) => isUsefulRegionToken(s, regionName));
  const usefulComplexes = detail.popularComplexes.filter((c) => isUsefulRegionToken(c, regionName));
  const sub1 = usefulSubDistricts[0] || detail.subDistricts[0] || '';
  const sub2 = usefulSubDistricts[1] || '';
  const complex1 = usefulComplexes[0] || '';
  const complex2 = usefulComplexes[1] || '';

  const featuredPosts = getFeaturedPostsForRegion(
    siteData.gallery.posts,
    regionName,
    detail.subDistricts,
    siteData.regions.list,
    4
  );

  const svcList = siteData.services.items;
  const activeService = focusedService || svcList[0];
  const activeStems = activeService
    ? getServiceSeoStems(activeService.id, activeService.title)
    : ['유리창청소', '아파트 외창청소'];
  const primaryServiceStem = activeStems[0] || '유리창청소';

  const hasGroupDiscount = /공동구매|단체|할인/.test(`${detail.notice} ${detail.description}`);
  const hasSameDay = /당일|익일|24시간|신속/.test(`${detail.leadTime} ${detail.description}`);

  const extractedSignals: ExtractedTextSignal[] = [
    { label: '대상 지역', value: `${metro.displayRegion} (${metro.shortAlias})` },
    ...(usefulSubDistricts.length > 0
      ? [{ label: '출장 세부 동(subDistricts)', value: usefulSubDistricts.slice(0, 4).join(', ') }]
      : []),
    ...(usefulComplexes.length > 0
      ? [{ label: '주요 단지·상권(popularComplexes)', value: usefulComplexes.slice(0, 3).join(', ') }]
      : []),
    { label: '방문·공지(leadTime/notice)', value: `${detail.leadTime}` },
    ...(focusedService ? [{ label: '선택 서비스', value: focusedService.title }] : []),
  ];

  const relatedRaw: SeoKeywordSuggestion[] = [
    {
      keyword: `${metro.shortAlias} 유리창청소`,
      group: 'related',
      intent: '지역검색',
      sourceLabel: '지역명 핵심',
      reason: `네이버·구글에서 '${metro.shortAlias}' 지역 유리창 청소 검색 시 최우선 유입되는 대표 키워드입니다.`,
    },
    {
      keyword: `${metro.displayRegion} 외창청소`,
      group: 'related',
      intent: '지역검색',
      sourceLabel: '광역+지역명',
      reason: `광역('${metro.metroShort}')과 기초지자체('${metro.shortAlias}')를 모두 포함하는 정석 지역 키워드입니다.`,
    },
    ...(focusedService
      ? [
          {
            keyword: `${metro.shortAlias} ${primaryServiceStem}`,
            group: 'related' as const,
            intent: '연관검색어',
            sourceLabel: '지역×서비스 조합',
            reason: `'${focusedService.title}' 서비스를 찾는 ${metro.shortAlias} 고객의 직접 유입 키워드입니다.`,
          },
        ]
      : [
          {
            keyword: `${metro.shortAlias} 아파트 외창청소`,
            group: 'related' as const,
            intent: '연관검색어',
            sourceLabel: '지역 대표 설명',
            reason: `지역 설명('${detail.description.slice(0, 24)}...')의 핵심 주거 수요를 겨냥합니다.`,
          },
          {
            keyword: `${metro.shortAlias} 상가 유리창청소`,
            group: 'related' as const,
            intent: '연관검색어',
            sourceLabel: '지역 상권',
            reason: `${metro.shortAlias} 로드샵·카페·사무실 점주가 자주 검색하는 상업용 키워드입니다.`,
          },
        ]),
    ...(sub1
      ? [
          {
            keyword: `${sub1} 유리창청소`,
            group: 'related' as const,
            intent: '지역검색',
            sourceLabel: '세부 동(subDistricts)',
            reason: `실제 출장 가능 동('${sub1}') 단위 좁은 지역 검색에서 경쟁 강도가 낮고 노출이 빠릅니다.`,
          },
        ]
      : []),
    ...(sub2
      ? [
          {
            keyword: `${sub2} 외창청소`,
            group: 'related' as const,
            intent: '지역검색',
            sourceLabel: '세부 동(subDistricts)',
            reason: `'${sub2}' 인근 거주자 및 상가 고객의 로컬 검색 유입을 확보합니다.`,
          },
        ]
      : []),
    {
      keyword: `${metro.shortAlias} 외벽청소`,
      group: 'related',
      intent: '서비스핵심',
      sourceLabel: '지역 시공 범위',
      reason: `${metro.shortAlias} 빌딩·오피스텔 관리자가 함께 검색하는 연관 외벽 키워드입니다.`,
    },
    {
      keyword: `${metro.shortAlias} ${companyName}`,
      group: 'related',
      intent: '브랜드·신뢰',
      sourceLabel: '지역+브랜드',
      reason: `지역명과 상호를 조합해 지역 브랜드 인지도를 높입니다.`,
    },
  ];

  const longTailRaw: SeoKeywordSuggestion[] = [
    ...(complex1
      ? [
          {
            keyword: `${complex1.replace(/\s*등$/, '')} 외창청소 견적`,
            group: 'longtail' as const,
            intent: '롱테일·문의',
            sourceLabel: '주요 단지·상권',
            reason: `페이지에 등록된 '${complex1}' 입주민·입점사의 핀포인트 검색을 정확히 선점합니다.`,
          },
        ]
      : []),
    ...(complex2
      ? [
          {
            keyword: `${complex2.replace(/\s*등$/, '')} 유리창 물때 청소`,
            group: 'longtail' as const,
            intent: '롱테일·문의',
            sourceLabel: '주요 단지·상권',
            reason: `'${complex2}' 지역 상권 및 건물 관리자의 구체적 청소 니즈에 대응합니다.`,
          },
        ]
      : []),
    {
      keyword: `${metro.shortAlias} ${focusedService ? primaryServiceStem : '아파트 외창청소'} 비용 견적`,
      group: 'longtail',
      intent: '롱테일·문의',
      sourceLabel: '견적 문의 문구',
      reason: `견적 폼 및 지역 안내에 포함된 무료 방문 견적 수요자용 고전환 롱테일입니다.`,
    },
    ...(sub1
      ? [
          {
            keyword: `${metro.shortAlias} ${sub1} 상가 통유리 시트지 제거`,
            group: 'longtail' as const,
            intent: '롱테일·문의',
            sourceLabel: '세부 동+시공',
            reason: `세부 동명('${sub1}')과 상가 원상복구·통유리 청소 수요를 묶은 정밀 롱테일입니다.`,
          },
        ]
      : []),
    ...(hasGroupDiscount
      ? [
          {
            keyword: `${metro.shortAlias} 아파트 외창청소 공동구매 할인`,
            group: 'longtail' as const,
            intent: '롱테일·문의',
            sourceLabel: '지역 안내 공지',
            reason: `공지('${detail.notice.slice(0, 22)}...')의 공동구매·단체 할인 혜택을 검색어로 전환합니다.`,
          },
        ]
      : []),
    ...(hasSameDay
      ? [
          {
            keyword: `${metro.shortAlias} 빠른 출장 유리창청소 추천 업체`,
            group: 'longtail' as const,
            intent: '롱테일·신뢰',
            sourceLabel: '방문 리드타임',
            reason: `방문 일정('${detail.leadTime}')을 강조해 긴급 출장을 원하는 고객을 유도합니다.`,
          },
        ]
      : []),
    {
      keyword: `${metro.displayRegion} 고층 빌딩 로프 외벽 고압세척`,
      group: 'longtail',
      intent: '서비스핵심',
      sourceLabel: '신뢰 보증 본문',
      reason: `안전 인증 장비와 고소 작업 역량을 검색하는 건물 관리자 타겟 롱테일입니다.`,
    },
    ...(featuredPosts[0]
      ? [
          {
            keyword: `${metro.shortAlias} ${featuredPosts[0].category} 청소 후기`,
            group: 'longtail' as const,
            intent: '브랜드·신뢰',
            sourceLabel: '지역 시공 일지',
            reason: `연동된 지역 실제 시공 사례('${featuredPosts[0].title.slice(0, 20)}...')를 뒷받침하는 후기형 키워드입니다.`,
          },
        ]
      : []),
  ];

  const relatedKeywords = dedupeSuggestions(relatedRaw).slice(0, 8);
  const longTailKeywords = dedupeSuggestions(longTailRaw).slice(0, 8);
  const allSuggestions = dedupeSuggestions([...relatedKeywords, ...longTailKeywords]);

  const subPreview = usefulSubDistricts.slice(0, 3).join('·') || metro.shortAlias;
  const complexPreview = usefulComplexes[0] ? ` (${usefulComplexes[0]} 등)` : '';
  const recommendedTitle = focusedService
    ? `${metro.displayRegion} ${focusedService.title} · ${subPreview} | ${companyName}`
    : `${metro.displayRegion} 유리창청소·외창청소 (${subPreview}) | ${companyName}`;
  const recommendedDescription = `${detail.description}. ${subPreview}${complexPreview} 출장 가능 · ${detail.leadTime}. ${longTailKeywords[0]?.keyword || `${metro.shortAlias} 유리창청소 견적`} 전문 ${companyName}.`.slice(
    0,
    158
  );

  const corpusSummary = [
    `[페이지 유형] RegionDetailPage (${metro.displayRegion})`,
    `[지역 대표 설명] ${detail.description}`,
    `[출장 가능 세부 동] ${detail.subDistricts.join(', ')}`,
    `[주요 아파트/상권] ${detail.popularComplexes.join(', ')}`,
    `[방문 일정] ${detail.leadTime}`,
    `[지역 안내 공지] ${detail.notice}`,
    focusedService
      ? `[선택된 서비스] ${focusedService.title} (${focusedService.description} / ${focusedService.detail.priceGuide})`
      : `[제공 서비스 목록] ${svcList.map((s) => s.title).join(', ')}`,
    featuredPosts.length > 0
      ? `[지역 실제 작업 사례] ${featuredPosts.map((p) => `${p.region} ${p.category}: ${p.title}`).join(' / ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    pageKey: `region:${regionName}`,
    pageKindLabel: `지역 상세 페이지 (${metro.displayRegion})`,
    extractedSignals,
    relatedKeywords,
    longTailKeywords,
    allSuggestions,
    recommendedTitle,
    recommendedDescription,
    corpusSummary,
  };
}

function buildMatrixAnalysis(
  regionName: string,
  service: ServiceItem,
  siteData: SiteData
): PageKeywordAnalysis {
  const srvAnalysis = buildServiceAnalysis(service, siteData);
  const regAnalysis = buildRegionAnalysis(regionName, siteData, service);
  const metro = inferMetroPrefix(regionName);
  const stems = getServiceSeoStems(service.id, service.title);
  const primaryStem = stems[0] || service.title;
  const detail = siteData.regions.details[regionName];
  const usefulSubs = (detail?.subDistricts ?? []).filter((s) => isUsefulRegionToken(s, regionName));
  const usefulComplexes = (detail?.popularComplexes ?? []).filter((c) =>
    isUsefulRegionToken(c, regionName)
  );

  const combinedRelated = dedupeSuggestions([
    {
      keyword: `${metro.shortAlias} ${primaryStem}`,
      group: 'related',
      intent: '지역검색',
      sourceLabel: '지역×서비스',
      reason: `지역명('${metro.shortAlias}')과 서비스 핵심어('${primaryStem}')를 직결한 핵심 키워드입니다.`,
    },
    ...(usefulSubs[0]
      ? [
          {
            keyword: `${usefulSubs[0]} ${primaryStem}`,
            group: 'related' as const,
            intent: '지역검색',
            sourceLabel: '세부 동×서비스',
            reason: `세부 동('${usefulSubs[0]}') 기준 지역 맞춤 검색 시 상위 노출에 유리합니다.`,
          },
        ]
      : []),
    ...regAnalysis.relatedKeywords.slice(0, 3),
    ...srvAnalysis.relatedKeywords.slice(0, 3),
  ]).slice(0, 8);

  const combinedLongTail = dedupeSuggestions([
    ...(usefulComplexes[0]
      ? [
          {
            keyword: `${usefulComplexes[0].replace(/\s*등$/, '')} ${primaryStem} 비용`,
            group: 'longtail' as const,
            intent: '롱테일·문의',
            sourceLabel: '단지×서비스×견적',
            reason: `주요 단지/상권명과 서비스 견적 의도가 결합된 초고전환 롱테일입니다.`,
          },
        ]
      : []),
    {
      keyword: `${metro.displayRegion} ${primaryStem} ${getCorePriceCue(service.detail.priceGuide)}`,
      group: 'longtail',
      intent: '롱테일·문의',
      sourceLabel: '지역×견적기준',
      reason: `가격 기준('${service.detail.priceGuide}') 기반의 견적 문의 직전 검색어입니다.`,
    },
    ...(usefulSubs[0]
      ? [
          {
            keyword: `${metro.shortAlias} ${usefulSubs[0]} ${service.title.split('·')[0]} 잘하는곳`,
            group: 'longtail' as const,
            intent: '롱테일·신뢰',
            sourceLabel: '세부동×업체추천',
            reason: `지역 세부동 기반 업체 추천/비교 검색어를 타겟팅합니다.`,
          },
        ]
      : []),
    ...srvAnalysis.longTailKeywords.slice(0, 3),
    ...regAnalysis.longTailKeywords.slice(0, 2),
  ]).slice(0, 8);

  const allSuggestions = dedupeSuggestions([...combinedRelated, ...combinedLongTail]);

  return {
    pageKey: `matrix:${regionName}:${service.id}`,
    pageKindLabel: `지역×서비스 맞춤 페이지 (${metro.shortAlias} × ${service.title})`,
    extractedSignals: dedupeSignals([
      ...regAnalysis.extractedSignals.slice(0, 3),
      ...srvAnalysis.extractedSignals.slice(0, 3),
    ]),
    relatedKeywords: combinedRelated,
    longTailKeywords: combinedLongTail,
    allSuggestions,
    recommendedTitle: `${metro.displayRegion} ${service.title} (${usefulSubs.slice(0, 2).join('·') || metro.shortAlias}) | ${siteData.company.name}`,
    recommendedDescription: `${metro.displayRegion} ${usefulSubs.slice(0, 2).join('·') || ''} ${service.title} 전문 ${siteData.company.name}. ${service.detail.tagline} (${service.detail.priceGuide}, ${detail?.leadTime || '신속 출장'}).`.slice(
      0,
      158
    ),
    corpusSummary: `${regAnalysis.corpusSummary}\n\n${srvAnalysis.corpusSummary}`,
  };
}

function dedupeSignals(signals: ExtractedTextSignal[]): ExtractedTextSignal[] {
  const seen = new Set<string>();
  return signals.filter((s) => {
    if (seen.has(s.label)) return false;
    seen.add(s.label);
    return true;
  });
}

export function analyzePageSeoKeywords(
  route: PageRoute,
  siteData: SiteData,
  options?: { regionServiceId?: string }
): PageKeywordAnalysis {
  if (route.type === 'service') {
    const srv =
      siteData.services.items.find((s) => s.id === route.serviceId) ??
      siteData.services.items[0];
    if (srv) return buildServiceAnalysis(srv, siteData);
  }

  if (route.type === 'region') {
    const focused = options?.regionServiceId
      ? siteData.services.items.find((s) => s.id === options.regionServiceId)
      : undefined;
    return buildRegionAnalysis(route.regionName, siteData, focused);
  }

  if (route.type === 'matrix') {
    const srv =
      siteData.services.items.find((s) => s.id === route.serviceId) ??
      siteData.services.items[0];
    if (srv) return buildMatrixAnalysis(route.regionName, srv, siteData);
  }

  if (route.type === 'gallery_detail') {
    const post =
      siteData.gallery.posts.find((p) => p.id === route.postId) ??
      siteData.gallery.posts[0];
    if (post) {
      const metro = inferMetroPrefix(post.region || siteData.company.region);
      const relatedKeywords = dedupeSuggestions([
        {
          keyword: `${metro.shortAlias} ${post.category} 청소`,
          group: 'related',
          intent: '지역검색',
          sourceLabel: '시공 사례 지역',
          reason: `시공 사례 지역('${post.region}')과 카테고리('${post.category}') 결합 키워드입니다.`,
        },
        ...post.tags.slice(0, 4).map((tag) => ({
          keyword: tag,
          group: 'related' as const,
          intent: '연관검색어',
          sourceLabel: '사례 태그',
          reason: `시공 일지 본문 태그에서 추출된 핵심 연관 검색어입니다.`,
        })),
        {
          keyword: `${post.category} 시공 전후 비교`,
          group: 'related',
          intent: '서비스핵심',
          sourceLabel: '사례 본문',
          reason: `비포·애프터 실제 결과를 찾는 고객의 검색 의도와 일치합니다.`,
        },
      ]);
      const longTailKeywords = dedupeSuggestions([
        {
          keyword: `${metro.shortAlias} ${post.category} 청소 실제 작업 후기`,
          group: 'longtail',
          intent: '브랜드·신뢰',
          sourceLabel: '시공 일지 제목',
          reason: `실제 작업 일지를 기반으로 신뢰도를 높이는 후기 탐색형 롱테일입니다.`,
        },
        ...post.equipmentUsed.slice(0, 2).map((eq) => ({
          keyword: `${eq} ${post.category} 시공 비용`,
          group: 'longtail' as const,
          intent: '롱테일·문의',
          sourceLabel: '사용 장비',
          reason: `현장 투입 장비('${eq}')와 견적 의도를 연결한 롱테일 키워드입니다.`,
        })),
      ]);
      return {
        pageKey: `gallery_detail:${post.id}`,
        pageKindLabel: '시공 일지 상세 페이지',
        extractedSignals: [
          { label: '사례 지역·분야', value: `${post.region} · ${post.category}` },
          ...(post.equipmentUsed.length > 0
            ? [{ label: '투입 장비', value: post.equipmentUsed.join(', ') }]
            : []),
          ...(post.tags.length > 0 ? [{ label: '핵심 태그', value: post.tags.join(', ') }] : []),
        ],
        relatedKeywords,
        longTailKeywords,
        allSuggestions: dedupeSuggestions([...relatedKeywords, ...longTailKeywords]),
        recommendedTitle: `${post.title} | ${siteData.company.name}`,
        recommendedDescription: `${post.region} ${post.category} 실제 시공 사례. ${post.excerpt}`.slice(0, 158),
        corpusSummary: `[시공 일지] ${post.title}\n[지역/카테고리] ${post.region} / ${post.category}\n[요약] ${post.excerpt}\n[장비] ${post.equipmentUsed.join(', ')}\n[포인트] ${post.keyPoints.join(' / ')}`,
      };
    }
  }

  // Fallback: Home or Gallery List
  const companyName = siteData.company.name || '클리어웍스';
  const regionTokens = siteData.company.region
    .split(/[·,\s/]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const topMetro = regionTokens[0] || '서울';
  const topServices = siteData.services.items.slice(0, 4);

  const relatedKeywords = dedupeSuggestions([
    {
      keyword: `${topMetro} 유리창청소`,
      group: 'related',
      intent: '지역검색',
      sourceLabel: '대표 지역',
      reason: `업체 대표 권역(${siteData.company.region}) 핵심 유입 키워드입니다.`,
    },
    ...topServices.map((srv) => ({
      keyword: getServiceSeoStems(srv.id, srv.title)[0] || srv.title,
      group: 'related' as const,
      intent: '연관검색어',
      sourceLabel: '주요 서비스',
      reason: `홈페이지 핵심 서비스('${srv.title}')와 연동된 대표 연관 검색어입니다.`,
    })),
    {
      keyword: companyName,
      group: 'related',
      intent: '브랜드·신뢰',
      sourceLabel: '상호명',
      reason: `브랜드 직접 검색 노출을 위한 필수 키워드입니다.`,
    },
  ]);

  const longTailKeywords = dedupeSuggestions([
    {
      keyword: `${regionTokens.join('·') || '수도권'} 아파트 외창청소 비용 견적`,
      group: 'longtail',
      intent: '롱테일·문의',
      sourceLabel: '가격·지역',
      reason: `광역 출장 권역과 아파트 외창 견적 수요를 결합한 고전환 롱테일입니다.`,
    },
    {
      keyword: '상가 매장 통유리 쇼윈도 정기청소 업체',
      group: 'longtail',
      intent: '롱테일·문의',
      sourceLabel: '상가 서비스',
      reason: `정기 관리 계약을 원하는 매장·프랜차이즈 점주용 롱테일입니다.`,
    },
    {
      keyword: '고층 빌딩 로프 외벽 고압세척 무료견적',
      group: 'longtail',
      intent: '롱테일·문의',
      sourceLabel: '빌딩 서비스',
      reason: `건물 시설 관리자의 견적 비교 검색에 맞춘 롱테일입니다.`,
    },
    {
      keyword: '유리창 썬팅 시트지 제거 발수코팅 전문',
      group: 'longtail',
      intent: '서비스핵심',
      sourceLabel: '특수·필름 서비스',
      reason: `특수 공정(시트지 제거·발수코팅) 동시 의뢰 고객용 롱테일입니다.`,
    },
  ]);

  return {
    pageKey: route.type === 'gallery_list' ? 'gallery_list' : 'home',
    pageKindLabel: route.type === 'gallery_list' ? '시공 갤러리 목록' : '메인 홈페이지',
    extractedSignals: [
      { label: '서비스 권역', value: siteData.company.region },
      { label: '핵심 서비스', value: topServices.map((s) => s.title).join(', ') },
    ],
    relatedKeywords,
    longTailKeywords,
    allSuggestions: dedupeSuggestions([...relatedKeywords, ...longTailKeywords]),
    recommendedTitle: `${siteData.company.region.replace(/·/g, ' ')} 유리창청소·외벽청소 전문 | ${companyName}`,
    recommendedDescription: `${siteData.company.region} 아파트·상가·빌딩 유리창청소 전문 ${companyName}. ${siteData.hero.subtitle}`.slice(
      0,
      158
    ),
    corpusSummary: `[메인/갤러리] ${companyName}\n[권역] ${siteData.company.region}\n[서비스] ${siteData.services.items.map((s) => s.title).join(', ')}`,
  };
}
