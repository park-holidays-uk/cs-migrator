type CacheEntry = {
  legacy_uid: string;
  legacy_updated_at: string;
  global_id?: string;
  global_updated_at?: string;
  parkholidays_id?: string;
  parkholidays_updated_at?: string;
  parkleisure_id?: string;
  parkleisure_updated_at?: string;
};

type CachedEntries = {
  [legacy_uid: string]: CacheEntry
}

type CacheObject = {
  [contentUid: string]: CachedEntries
}
export type { CacheEntry, CachedEntries, CacheObject };
