import { NextRequest, NextResponse } from "next/server";
import {
  renderMediaOnLambda,
  getRenderProgress,
} from "@remotion/lambda/client";
import { getProject } from "@/lib/storage";
import { getLambdaConfig } from "@/lib/lambda";
import { COMPOSITION_ID } from "@/remotion/constants";
import { projectToInputProps } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Start a Lambda render for a project. Returns the renderId + bucketName the
 * client then polls via GET. The heavy lifting (frames, encoding, S3 upload)
 * happens on Lambda — this handler just kicks it off.
 */
export async function POST(req: NextRequest) {
  const config = getLambdaConfig();
  if (!config) {
    return NextResponse.json(
      {
        error:
          "Lambda is not configured. Set REMOTION_AWS_REGION, " +
          "REMOTION_LAMBDA_FUNCTION and REMOTION_SERVE_URL (see README › Export).",
      },
      { status: 503 },
    );
  }

  const { projectId } = await req.json();
  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const inputProps = projectToInputProps(project);
  if (!inputProps.src || inputProps.src.startsWith("/")) {
    return NextResponse.json(
      {
        error:
          "Video source is not publicly reachable. Set PUBLIC_BASE_URL or a " +
          "public video URL so Lambda can fetch the asset.",
      },
      { status: 400 },
    );
  }

  try {
    const { renderId, bucketName } = await renderMediaOnLambda({
      region: config.region,
      functionName: config.functionName,
      serveUrl: config.serveUrl,
      composition: COMPOSITION_ID,
      inputProps,
      codec: "h264",
      imageFormat: "jpeg",
      maxRetries: 1,
      privacy: "public",
      downloadBehavior: {
        type: "download",
        fileName: `${project.name.replace(/[^a-z0-9]/gi, "_")}.mp4`,
      },
    });

    // Surface any immediate fatal error (e.g. bad serveUrl) right away.
    const progress = await getRenderProgress({
      renderId,
      bucketName,
      functionName: config.functionName,
      region: config.region,
    });
    if (progress.fatalErrorEncountered) {
      return NextResponse.json(
        { error: progress.errors[0]?.message ?? "Render failed to start" },
        { status: 500 },
      );
    }

    return NextResponse.json({ renderId, bucketName });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Render failed" },
      { status: 500 },
    );
  }
}

/** Poll progress: /api/render?renderId=..&bucketName=.. */
export async function GET(req: NextRequest) {
  const config = getLambdaConfig();
  if (!config) {
    return NextResponse.json({ error: "Lambda not configured" }, { status: 503 });
  }

  const renderId = req.nextUrl.searchParams.get("renderId");
  const bucketName = req.nextUrl.searchParams.get("bucketName");
  if (!renderId || !bucketName) {
    return NextResponse.json(
      { error: "renderId and bucketName are required" },
      { status: 400 },
    );
  }

  try {
    const progress = await getRenderProgress({
      renderId,
      bucketName,
      functionName: config.functionName,
      region: config.region,
    });

    if (progress.fatalErrorEncountered) {
      return NextResponse.json({
        status: "error",
        error: progress.errors[0]?.message ?? "Render failed",
      });
    }
    if (progress.done) {
      return NextResponse.json({
        status: "done",
        progress: 1,
        url: progress.outputFile,
        sizeInBytes: progress.outputSizeInBytes,
      });
    }
    return NextResponse.json({
      status: "rendering",
      progress: progress.overallProgress,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Progress check failed" },
      { status: 500 },
    );
  }
}
