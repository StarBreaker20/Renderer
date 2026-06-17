// Configuration used by the Remotion CLI / Studio (npm run remotion:studio).
// The Next.js app and Lambda render path do NOT read this file; it only
// affects local CLI rendering and the studio preview.
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(4);

// We point the studio at the same entry the app bundles for Lambda.
Config.setEntryPoint("src/remotion/index.ts");
