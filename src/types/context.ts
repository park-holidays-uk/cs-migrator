import { ApiConfig } from '../tools/login';
import { CacheEntry, CacheObject } from './cache';

type ScraperCtx = {
  apiDetails: ApiConfig[];
  CS_BASE_URL: string;
  cache: CacheObject
};

export type { ScraperCtx };
