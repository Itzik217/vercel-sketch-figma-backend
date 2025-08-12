// api/import_to_figma.js
import { put } from "@vercel/blob";

export const config = { api: { bodyParser: { sizeLimit: "5mb" } } };

/**
 * Inputs:
 *  - cleaned_file_id: string (e.g., "file_1_CLEAN")
 *  - cleaned_blob_url: string (public URL from the clean step)
 *  - figma_project_url: string (where you want to drop the file in Figma UI)
 *
 * What this does:
 *  - Writes a tiny mapping JSON to Blob so the agent (and you) have a trace.
 *  - Returns a "target" Figma URL and clear next actions.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { cleaned_file_id, cleaned_blob_url, figma_project_url } = req.body || {};

  if (!cleaned_file_id || !cleaned_blob_url) {
    return res.status(400).json({ error: "cleaned_file_id and cleaned_blob_url are required" });
  }

  const projectUrl = figma_project_url || process.env.DEFAULT_FIGMA_PROJECT_URL || null;

  // Write a mapping record per file (optional but handy)
  const record = {
    cleaned_file_id,
    cleaned_blob_url,
    projectUrl,
    createdAt: new Date().toISOString(),
    note: "Figma import is a manual drag-and-drop step. Open projectUrl and drop the .sketch."
  };

  let mappingUrl = null;
  try {
    const resp = await put(
      `mappings/${cleaned_file_id}.json`,
      Buffer.from(JSON.stringify(record, null, 2)),
      { access: "public", contentType: "application/json", token: process.env.BLOB_READ_WRITE_TOKEN }
    );
    mappingUrl = resp.url;
  } catch (e) {
    // still return a response even if mapping save fails
  }

  return res.status(200).json({
    cleaned_file_id,
    cleaned_blob_url,
    figma_project_url: projectUrl,
    mapping_url: mappingUrl,
    next_actions: [
      "Open the figma_project_url.",
      "Drag the CLEAN .sketch file into Figma to create/import.",
      "Name the file the same as cleaned_file_id.",
      "Then run qcCheckFigma with the returned figma file URL or ID."
    ],
    note: "Figma API does not support direct .sketch import. This is a guided manual step."
  });
}
