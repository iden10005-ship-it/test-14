import defaultSiteContent from './defaultSiteContent.json' with { type: 'json' };
import siteContent from './siteContent.json' with { type: 'json' };
import type { SiteData } from '../types/clearworks.ts';

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

export const INITIAL_SITE_DATA: SiteData = siteContent as SiteData;
export const DEFAULT_SITE_DATA: SiteData = defaultSiteContent as SiteData;
