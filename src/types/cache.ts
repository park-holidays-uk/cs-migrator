type CacheEntry = {
  legacyUid: string;
  globalUid: string;
  parkholidaysUid: string;
  parkleisureUid: string;
};

type CachedEntries = {
  [legacyUid: string]: CacheEntry
}

type CacheObject = {
  [contentUid: string]: CachedEntries
}
export type { CacheEntry, CacheObject };
