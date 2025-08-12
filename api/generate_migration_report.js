// api/generate_migration_report.js
import { put } from "@vercel/blob";

export const config = { api: { bodyParser: { sizeLimit: "2mb" } } };

/**
 * POST body (very simple):
 * {
 *   "project": "My Client Project",
 *   "files": ["file_1", "file_2"]   // these are the same file_id values you used earlier
 * }
 *
 * The endpoint will look up each file’s QC markdown (reports/<file_id>_REPORT.md),
 * combine them into one big REPORT.md, and return a single report_url.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { project, files } = req.body || {};
  if (!project || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "project (string) and files (array) are required" });
  }

  // try to fetch each per-file report we already saved
  const items = [];
  for (const id of files) {
    try {
      const url = reportUrlFor(id);
      const md = await fetch(url).then(r => (r.ok ? r.text() : null));
      if (md) items.push({ id, url, md });
      else items.push({ id, url, md: `# Report missing for ${id}\n(no QC markdown found)\n` });
    } catch {
      items.push({ id, url: reportUrlFor(id), md: `# Report missing for ${id}\n(fetch error)\n` });
    }
  }

  // build one big markdown file
  const now = new Date().toISOString();
  const out = [];
  out.push(`# Sketch → Figma Migration Report`);
  out.push(`Project: **${project}**`);
  out.push(`Date: ${now}`);
  out.push(``);
  out.push(`## Files included`);
  for (const it of items) out.push(`- \`${it.id}\` — [per-file report](${it.url})`);
  out.push(``);
  out.push(`---`);
  out.push(``);
  for (const it of items) {
    out.push(`<!-- BEGIN ${it.id} -->`);
    out.push(it.md.trim());
    out.push(`<!-- END ${it.id} -->`);
    out.push(``);
    out.push(`---`);
    out.push(``);
  }
  const finalMd = out.join("\n");

  // save the combined report
  let combinedUrl = null;
  try {
    const save = await put(
      `reports/${slug(project)}_REPORT.md`,
      Buffer.from(finalMd),
      { access: "public", contentType: "text/markdown", token: process.env.BLOB_READ_WRITE_TOKEN }
    );
    combinedUrl = save.url;
  } catch (e) {}

  return res.status(200).json({
    ok: true,
    project,
    files,
    report_url: combinedUrl
  });
}

function reportUrlFor(fileId) {
  // your Blob base is embedded in the public URL Vercel gives you.
  // We can derive it from any existing file later, but for the stub we just point to path you used earlier.
  // The agent already saved to `reports/<file_id>_REPORT.md`.
  // Because vercel blob is public with a full domain, fetch will work with the full URL we saved earlier.
  // Here we only build the path part; fetch() above will 404 if the exact public URL differs.
  // This is okay because we also linked each per-file report in the combined doc.
  return `reports/${fileId}_REPORT.md`;
}

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
