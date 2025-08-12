// api/clean_sketch_files.js
import { put } from "@vercel/blob";
import AdmZip from "adm-zip";

export const config = { api: { bodyParser: { sizeLimit: "50mb" } } };

function cleanJsonLayer(layer) {
  if (!layer) return layer;
  if (layer.isVisible === false) return null;             // drop hidden
  if (Array.isArray(layer.layers)) {
    layer.layers = layer.layers.map(cleanJsonLayer).filter(Boolean);
  }
  if (layer._class === "group" && (!layer.layers || layer.layers.length === 0)) {
    return null; // drop empty groups
  }
  return layer;
}

function cleanSketch(zipBuf) {
  const zip = new AdmZip(zipBuf);
  const out = new AdmZip();

  for (const e of zip.getEntries()) {
    if (e.entryName.startsWith("pages/") && e.entryName.endsWith(".json")) {
      try {
        const j = JSON.parse(e.getData().toString("utf8"));
        if (Array.isArray(j.layers)) j.layers = j.layers.map(cleanJsonLayer).filter(Boolean);
        out.addFile(e.entryName, Buffer.from(JSON.stringify(j)));
        continue;
      } catch {}
    }
    out.addFile(e.entryName, e.getData()); // copy others
  }
  return out.toBuffer();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { file_id, blob_url } = req.body || {};
  if (!file_id || !blob_url) return res.status(400).json({ error: "file_id and blob_url required" });

  const orig = await fetch(blob_url).then(r => r.arrayBuffer());
  const cleanedBuf = cleanSketch(Buffer.from(orig));
  const cleanedBlob = await put(`clean/${file_id}_CLEAN.sketch`, cleanedBuf, {
    contentType: "application/zip",
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN
  });

  return res.status(200).json({
    file_id,
    cleaned_file_id: `${file_id}_CLEAN`,
    cleaned_blob_url: cleanedBlob.url
  });
}
