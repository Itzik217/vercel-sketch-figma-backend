// api/upload_and_audit_sketch.js
import { put } from "@vercel/blob";
import AdmZip from "adm-zip";

export const config = { api: { bodyParser: { sizeLimit: "50mb" } } };

// Basic .sketch audit by unzipping and reading JSON
function parseSketch(zipBuf) {
  const zip = new AdmZip(zipBuf);
  const entries = zip.getEntries();

  const jsonByPath = {};
  for (const e of entries) {
    if (e.entryName.endsWith(".json")) {
      try {
        jsonByPath[e.entryName] = JSON.parse(e.getData().toString("utf8"));
      } catch {}
    }
  }

  let pages = 0;
  let symbolMasters = 0;
  let textLayers = 0;
  let hiddenLayers = 0;
  let emptyGroups = 0;
  let sharedTextStyles = 0;
  let sharedColorStyles = 0;

  const doc = jsonByPath["document.json"];
  if (doc?.layerTextStyles?.objects) sharedTextStyles = doc.layerTextStyles.objects.length || 0;
  if (doc?.layerStyles?.objects) sharedColorStyles = doc.layerStyles.objects.length || 0;

  for (const [path, json] of Object.entries(jsonByPath)) {
    if (path.startsWith("pages/") && path.endsWith(".json")) {
      pages++;
      const walk = (layer) => {
        if (!layer) return;
        if (layer._class === "symbolMaster") symbolMasters++;
        if (layer._class === "text") textLayers++;
        if (layer.isVisible === false) hiddenLayers++;
        if (layer._class === "group" && (!layer.layers || layer.layers.length === 0)) emptyGroups++;
        if (Array.isArray(layer.layers)) layer.layers.forEach(walk);
      };
      (json.layers || []).forEach(walk);
    }
  }

  return {
    pages,
    symbols: symbolMasters,
    text_layers: textLayers,
    hidden_layers: hiddenLayers,
    empty_groups: emptyGroups,
    shared_text_styles: sharedTextStyles,
    shared_color_styles: sharedColorStyles
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { files } = req.body || {};
  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "files[] base64 .sketch required" });
  }

  const batchId = `${Date.now()}`;
  const out = [];

  for (let i = 0; i < files.length; i++) {
    const base64 = files[i];
    const buf = Buffer.from(base64, "base64");

    // Save original upload to Blob (public URL)
    const blob = await put(`uploads/${batchId}/file_${i + 1}.sketch`, buf, {
      contentType: "application/zip",
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    // Audit contents
    const audit = parseSketch(buf);

    out.push({
      file_id: `file_${i + 1}`,
      name: `file_${i + 1}.sketch`,
      blob_url: blob.url,
      ...audit
    });
  }

  return res.status(200).json({ batch_id: batchId, files: out });
}
