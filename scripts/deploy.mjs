// Deploys the Remotion Lambda function + site bundle, then prints the env vars
// the Next.js app needs to trigger renders. Run with: npm run remotion:deploy
//
// Requires AWS credentials in the environment (REMOTION_AWS_ACCESS_KEY_ID /
// REMOTION_AWS_SECRET_ACCESS_KEY, or the standard AWS_* vars).
import path from "node:path";
import {
  deployFunction,
  deploySite,
  getOrCreateBucket,
} from "@remotion/lambda";

const region = process.env.REMOTION_AWS_REGION ?? "us-east-1";
const entryPoint = path.join(process.cwd(), "src", "remotion", "index.ts");

async function main() {
  console.log(`▶ Deploying Remotion Lambda in ${region}…`);

  const { functionName } = await deployFunction({
    region,
    timeoutInSeconds: 240,
    memorySizeInMb: 3009,
    diskSizeInMb: 10240,
    createCloudWatchLogGroup: true,
  });
  console.log(`✓ Function: ${functionName}`);

  const { bucketName } = await getOrCreateBucket({ region });
  console.log(`✓ Bucket: ${bucketName}`);

  const { serveUrl } = await deploySite({
    region,
    bucketName,
    entryPoint,
    siteName: "renderer-video-editor",
  });
  console.log(`✓ Site: ${serveUrl}`);

  console.log("\nAdd these to your .env.local:\n");
  console.log(`REMOTION_AWS_REGION=${region}`);
  console.log(`REMOTION_LAMBDA_FUNCTION=${functionName}`);
  console.log(`REMOTION_SERVE_URL=${serveUrl}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
