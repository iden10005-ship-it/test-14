import defaultSiteContent from '@/src/data/defaultSiteContent.json';
import siteContent from '@/src/data/siteContent.json';
import type { BlogPost, SiteData } from '@/src/types/clearworks';

export const CLEARWORKS_IMAGES = {
  beforeHero: '/images/hero_before.jpg',
  afterHero: '/images/hero_after.jpg',
  aptBefore: '/images/apt_before.jpg',
  aptAfter: '/images/apt_after.jpg',
  storeBefore: '/images/store_before.jpg',
  storeAfter: '/images/store_after.jpg',
  buildingBefore: '/images/building_before.jpg',
  buildingAfter: '/images/building_after.jpg',
};

export const DEFAULT_BLOG_DATA: {
  sectionTitle: string;
  sectionSubtitle: string;
  posts: BlogPost[];
} = {
  sectionTitle: '유리창·외벽 관리 노하우 & 현장 소식',
  sectionSubtitle:
    '계절별 외창 관리 팁, 상업 빌딩 정기 시공 리포트, 유막·물때 방지 전문 가이드를 확인하세요.',
  posts: [
    {
      id: 'blog-rainy-season-water-stain-prevention',
      title: '장마철·미세먼지 시즌, 아파트 외창 백화·물때가 고착되기 전 관리해야 하는 이유',
      category: '업계 팁',
      excerpt:
        '빗물 속 석회질과 도로 분진이 결합해 유리 표면에 눌어붙기 전에 중성 세정과 순수(DI 워터) 린스를 적용하면 투명도와 시야를 오래 유지할 수 있습니다.',
      content:
        '계절이 바뀌며 황사와 빗물이 반복되면 아파트 외창과 상가 통유리 표면에 하얀 얼룩(백화 현상)과 기름진 유막이 빠르게 형성됩니다.\n\n일반 수돗물이나 알칼리성 세제로만 닦으면 물속 미네랄 성분이 마르면서 오히려 자국이 남아 유리 부식을 가속화할 수 있습니다. 클리어웍스는 불순물 0ppm에 가까운 탈이온 순수(DI 워터)와 유리 전용 중성 스퀴지 공법으로 잔사 없는 투명도를 회복합니다.\n\n특히 세척 직후 유리 발수 코팅을 병행하면 빗물이 표면에 머무르지 않고 둥글게 굴러 떨어져 다음 시즌까지 오염 부착 속도를 크게 줄일 수 있습니다. 1년에 1~2회 봄·가을 정기 관리만으로도 신축 같은 개방감을 오래 유지하실 수 있습니다.',
      coverImage: '/images/apt_after.jpg',
      author: '클리어웍스 기술연구소',
      publishedAt: '2026.11.10',
      readTimeMinutes: 4,
      tags: ['아파트외창청소', '유리물때제거', '발수코팅', '장마철관리'],
      seoKeywords: '아파트 외창 물때 제거, 유리창 백화현상 예방법, 순수 유리창 청소, 유리 발수코팅 효과',
      relatedServiceId: 'apt',
    },
    {
      id: 'blog-gangnam-curtainwall-maintenance-project',
      title: '강남·여의도 15층 상업 오피스 빌딩 커튼월 외벽 및 로프 고소세척 프로젝트 완료',
      category: '프로젝트 소식',
      excerpt:
        '도심 대로변 매연과 빗물 얼룩이 누적된 대형 커튼월 빌딩의 외벽 복합판넬·유리창을 무비계 로프 공법으로 안전하게 복원한 현장 리포트입니다.',
      content:
        '서울 강남 테헤란로와 여의도 오피스 권역의 대형 빌딩은 교통량으로 인한 매연 유막과 빗물 줄기 자국이 외벽 전체에 누적되기 쉽습니다.\n\n이번 프로젝트에서는 보행자 동선 방해를 최소화하기 위해 주말 야간 및 이른 오전 시간대를 분할해 안전 통제선을 설치하고, 2중 안전 로프와 앵커 하중 점검을 마친 전담 고소작업 팀이 투입되었습니다.\n\n복합 알루미늄 판넬 전용 중성 케미컬로 표면 변색 없이 오염층만 부드럽게 박리한 뒤, 전체 커튼월 외창 스퀴지 마감과 창틀 실리콘 주변 고압 린스를 완료해 건물 외관 가치를 높였습니다.',
      coverImage: '/images/building_after.jpg',
      author: '클리어웍스 고소특수팀',
      publishedAt: '2026.11.04',
      readTimeMinutes: 5,
      tags: ['빌딩외벽청소', '커튼월청소', '로프작업', '강남외벽청소'],
      seoKeywords: '강남 빌딩 외벽청소, 커튼월 유리창 청소 프로젝트, 고층 로프 외벽 세척 업체',
      relatedServiceId: 'building',
    },
    {
      id: 'blog-storefront-tint-residue-guide',
      title: '상가 원상복구·리뉴얼 시 썬팅·시트지 제거, 유리 스크래치 없이 본드까지 지우는 법',
      category: '유지관리 가이드',
      excerpt:
        '오래 경화된 매장 유리 시트지를 무리하게 긁으면 영구 스크래치가 남습니다. 열풍 연화 후 전용 박리제와 카본 블레이드로 매끈하게 복원하는 노하우를 안내합니다.',
      content:
        '카페, 의류 매장, 오피스 이전이나 인테리어 리뉴얼 시 오래 붙어 있던 썬팅지·안개 시트지·홍보 스티커를 직접 떼다 보면 유리에 끈적한 본드만 남거나 금속 칼날로 흠집이 생기는 사례가 많습니다.\n\n직사광선을 수년간 받은 필름은 점착층이 유리 표면에 경화되어 있으므로, 반드시 일정 온도의 스팀·열풍기로 필름을 먼저 연화시킨 뒤 점착제 분해 용제를 도포해 불려야 합니다.\n\n클리어웍스는 강화유리 전용 플렉시블 블레이드와 1차 유막 제거를 함께 진행해 새로 입점하는 매장 쇼윈도가 처음 시공한 듯 맑게 빛나도록 마무리합니다.',
      coverImage: '/images/store_after.jpg',
      author: '클리어웍스 상업케어팀',
      publishedAt: '2026.10.28',
      readTimeMinutes: 3,
      tags: ['시트지제거', '썬팅제거', '상가통유리청소', '원상복구'],
      seoKeywords: '상가 시트지 제거, 유리창 썬팅 본드 제거, 쇼윈도 유리 스크래치 방지 청소',
      relatedServiceId: 'tint',
    },
  ],
};

const rawSiteData = siteContent as SiteData;

export const INITIAL_SITE_DATA: SiteData = {
  ...rawSiteData,
  blog: rawSiteData.blog ?? DEFAULT_BLOG_DATA,
};

const rawDefaultData = defaultSiteContent as SiteData;

export const DEFAULT_SITE_DATA: SiteData = {
  ...rawDefaultData,
  blog: rawDefaultData.blog ?? DEFAULT_BLOG_DATA,
};
