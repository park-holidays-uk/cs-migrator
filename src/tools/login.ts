import dotenv from "dotenv";
import { ApiConfig, DeliveryTokenType, EnvironmentUidType, EnvironmentVariableType } from "../types";
dotenv.config();

const STACKS = ["PARKHOLIDAYS", "PARKLEISURE", "GLOBAL", "LEGACY"];
const ENVIRONMENTS = [
  "production",
  "production_parkleisure",
  "production_parkholidays",
  "staging",
  "staging_parkleisure",
  "staging_parkholidays",
];

const getEnvironmentVariable = (
  env: string,
  stackName: string,
  type: "token" | "uid"
): EnvironmentVariableType | undefined => {
  const [environment, childStack] = env.split("_"); // e.g. staging_parkholidays vs production
  const typeLookup = {
    token: "TOKEN",
    uid: "ENV_UID",
  };
  const envPrefix = environment.slice(0, 4).toUpperCase();
  const prefix = childStack
    ? `${envPrefix}_${childStack.toUpperCase()}`
    : envPrefix;
  const variableName = `${prefix}_${typeLookup[type]}_${stackName}` ?? "";
  if (process.env[variableName]) {
    return {
      environment: env,
      [type]: process.env[variableName],
    } as EnvironmentVariableType;
  }
};

const createApiDetails = (
  stacks: string[],
  environments: string[]
): ApiConfig[] => {
  return stacks.map((stackName) => ({
    stackName: stackName.toLowerCase(),
    mgmtToken: process.env[`MGMT_TOKEN_${stackName}`] ?? "",
    apiKey: process.env[`API_KEY_${stackName}`] ?? "",
    deliveryTokens: environments
      .map((env) => getEnvironmentVariable(env, stackName, "token"))
      .filter(Boolean) as DeliveryTokenType[],
    environmentUids: environments
      .map((env) => getEnvironmentVariable(env, stackName, "uid"))
      .filter(Boolean) as EnvironmentUidType[],
  }));
};

const createApiCredentials = async (ctx) => {
  const apiDetails = createApiDetails(STACKS, ENVIRONMENTS);
  console.log("TCL: createApiCredentials -> apiDetails", apiDetails);
  const context = {
    ...ctx,
    apiDetails,
  };
  return context;
};

export { createApiCredentials };

export type { ApiConfig };
