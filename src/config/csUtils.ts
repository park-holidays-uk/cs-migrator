import { MigrationConfigurationType, PublishEnvironments, ScraperCtx, StackName } from '../types';

const createHeaders = (context: ScraperCtx, stackName: StackName): HeadersInit => {
  const apiConfig = context.apiDetails.find((config) => config.stackName === stackName);
  const headers = { 'Content-Type': 'application/json' };
  if (!apiConfig) return { ...headers };
  if (context.CS_BASE_URL.includes('eu-api.contentstack.com')) {
    return {
      ...headers,
      'api_key': apiConfig?.apiKey,
      'authorization': apiConfig.mgmtToken,
    };
  }
  return {
    ...headers,
    'x-api-key': apiConfig?.apiKey,
    'x-authorization': apiConfig.mgmtToken,
  };
};

const getPublishEnvironments = (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
): string[] => {
  const apiConfig = context.apiDetails.find((config) =>
    config.stackName === migrationConfig.stackName
  );
  if (!apiConfig) return [];
  const includedEnvs = apiConfig.environmentUids.filter((env) =>
    (migrationConfig.publishEnvironments ?? []).includes(env.environment as PublishEnvironments),
  );
  return includedEnvs.map((env) => env.uid);
};

export { createHeaders, getPublishEnvironments };
