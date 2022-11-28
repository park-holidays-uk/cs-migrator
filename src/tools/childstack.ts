import { ApiConfig, EntryObj, ScraperCtx } from '../types';
import * as Contentstack from 'contentstack';
import { apiDelay } from '.';

const findEntryWithParentInAnyEnvironment = async (
  contentUid: string,
  parentEntryUid: string | undefined,
  apiConfig: ApiConfig,
): Promise<EntryObj | undefined> => {
  if (!parentEntryUid) return;
  for (const deliveryToken of apiConfig.deliveryTokens) {
    const csStack = Contentstack.Stack({
      api_key: apiConfig.apiKey,
      delivery_token: deliveryToken.token,
      environment: deliveryToken.environment,
      region: Contentstack.Region.EU,
    });
    const query = csStack.ContentType(contentUid).Query();
    const data = await query.where('parent_uid', parentEntryUid).find();
    if (data?.[0]?.[0]) {
      return data[0][0].toJSON();
    }
  }
};

export { findEntryWithParentInAnyEnvironment };

const findChildStackUids = async (
  context: ScraperCtx,
  contentUid: string,
  entry: EntryObj
): Promise<object> => {
  await apiDelay(4000);
  const childApiConfigs = context.apiDetails.filter((config) => {
    return config.stackName === 'parkleisure' || config.stackName === 'parkholidays'
  });
  const childUids = {};
  for (const childApiConfig of childApiConfigs) {
    const childEntry = await findEntryWithParentInAnyEnvironment(
      contentUid,
      entry.uid,
      childApiConfig,
    );
    if (childEntry) {
      childUids[`${childApiConfig.stackName}_uid`] = childEntry.uid;
      childUids[`${childApiConfig.stackName}_updated_at`] = childEntry.updated_at;
    }
  }
  return childUids;
};

export { findChildStackUids };
