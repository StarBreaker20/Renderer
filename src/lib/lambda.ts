import type { AwsRegion } from "@remotion/lambda";

/**
 * Central Lambda configuration, read from environment variables that the deploy
 * script (scripts/deploy.mjs) prints after provisioning. See README "Export".
 *
 *   REMOTION_AWS_REGION       e.g. us-east-1
 *   REMOTION_LAMBDA_FUNCTION  deployed function name
 *   REMOTION_SERVE_URL        deployed site URL (S3 serveUrl)
 *
 * Credentials come from the standard AWS env vars used by @remotion/lambda:
 *   REMOTION_AWS_ACCESS_KEY_ID / REMOTION_AWS_SECRET_ACCESS_KEY
 *   (or AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY).
 */
export type LambdaConfig = {
  region: AwsRegion;
  functionName: string;
  serveUrl: string;
};

export function getLambdaConfig(): LambdaConfig | null {
  const region = process.env.REMOTION_AWS_REGION as AwsRegion | undefined;
  const functionName = process.env.REMOTION_LAMBDA_FUNCTION;
  const serveUrl = process.env.REMOTION_SERVE_URL;

  if (!region || !functionName || !serveUrl) return null;
  return { region, functionName, serveUrl };
}

export function isLambdaConfigured(): boolean {
  return getLambdaConfig() !== null;
}
