type DeliveryTokenType = {
  environment: string;
  token: string;
};

type EnvironmentUidType = {
  environment: string;
  uid: string;
};

type EnvironmentVariableType = DeliveryTokenType | EnvironmentUidType;

type ApiConfig = {
  stackName: string;
  mgmtToken: string;
  deliveryTokens: DeliveryTokenType[];
  environmentUids: EnvironmentUidType[];
  apiKey: string;
};

type PublishEnvironments =
  | 'production'
  | 'production_parkleisure'
  | 'production_parkholidays'
  | 'staging'
  | 'staging_parkleisure'
  | 'staging_parkholidays';

type TargetStackName = 'global' | 'parkholidays' | 'parkleisure';
type StackName = TargetStackName | 'legacy';

export type {
  ApiConfig,
  DeliveryTokenType,
  EnvironmentUidType,
  EnvironmentVariableType,
  PublishEnvironments,
  StackName,
  TargetStackName,
};
