import { getNodesBounds, getViewportForBounds, type ReactFlowInstance } from "@xyflow/react";
import { toPng, toSvg } from "html-to-image";

/** Exports the full chart (not just the visible viewport) by temporarily
 * rendering the whole node-bounds region at a fixed pixel size — the same
 * technique used by React Flow's own "download image" example. */
export async function exportChartImage(
  reactFlow: ReactFlowInstance,
  format: "png" | "svg",
  filename: string
): Promise<void> {
  const nodes = reactFlow.getNodes();
  if (nodes.length === 0) throw new Error("Nothing to export.");

  const bounds = getNodesBounds(nodes);
  const padding = 80;
  const rawWidth = bounds.width + padding * 2;
  const rawHeight = bounds.height + padding * 2;

  // Compact/deep charts can produce a canvas many thousands of pixels tall
  // (or wide, in horizontal mode). Exporting that 1:1 makes a mostly-blank
  // image where the actual cards are a tiny fraction of the file — cap the
  // longest side and let getViewportForBounds scale everything down to fit,
  // the same way the PDF's "fit to one page" option does.
  const MAX_DIMENSION = 3000;
  const shrink = Math.min(1, MAX_DIMENSION / rawWidth, MAX_DIMENSION / rawHeight);
  const imageWidth = Math.max(400, Math.round(rawWidth * shrink));
  const imageHeight = Math.max(300, Math.round(rawHeight * shrink));

  const viewport = getViewportForBounds(bounds, imageWidth, imageHeight, 0.05, 2, padding);

  const viewportEl = document.querySelector(".react-flow__viewport") as HTMLElement | null;
  if (!viewportEl) throw new Error("Chart canvas is not ready yet.");

  const captureFn = format === "png" ? toPng : toSvg;
  const dataUrl = await captureFn(viewportEl, {
    backgroundColor: "#ffffff",
    width: imageWidth,
    height: imageHeight,
    style: {
      width: `${imageWidth}px`,
      height: `${imageHeight}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    },
  });

  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
