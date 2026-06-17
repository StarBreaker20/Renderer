import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

// Entry point bundled for both the Remotion Studio and the Lambda site deploy.
registerRoot(RemotionRoot);
