// api/generate_migration_report.js
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { project, batch_id, figma_links = [] } = req.body || {};
    if (!project || !batch_id || !Array.isArray(figma_links)) {
      return res.status(400).json({ error: 'project, batch_id, and figma_links are required' });
    }

    // 1) Build contents we want to save
    const reportMd = [
      '# Sketch → Figma Migration Report',
      `**Project:** ${project}`,
      `**Batch:** ${batch_id}`,
      `**Run Date:** ${new Date().toISOString().slice(0,10)}`,
      '',
      '## Files',
      ...figma_links.map((f, i) =>
        `- ${i + 1}. ${f.source_file} → ${f.figma_url} — ${f.status} — ${f.avg_parity}% (${f.frames_passed}/${f.frames_total})`
      )
    ].join('\n');

    const indexCsvHeader = 'source_file,figma_url,file_status,avg_parity,frames_total,frames_passed,timestamp';
    const indexCsvRows = figma_links.map(f =>
      [
        f.source_file,
        f.figma_url,
        f.status,
        f.avg_parity,
        f.frames_total,
        f.frames_passed,
        new Date().toISOString()
      ].join(',')
    );
    const indexCsv = [indexCsvHeader, ...indexCsvRows].join('\n');

    const mappingsJson = { note: 'example mappings file; fill with real component/style mappings as needed' };

    // 2) Paths in the Blob store
    const base = `exports/${project}`;
    const reportPath   = `${base}/report/REPORT.md`;
    const indexCsvPath = `${base}/figma_links/INDEX.csv`;
    const mappingsPath = `${base}/mappings/mappings.json`;

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    // 3) Save to Vercel Blob (public so you can click links)
    await put(indexCsvPath, indexCsv, { access: 'public', token });
    await put(reportPath, reportMd,   { access: 'public', token });
    await put(mappingsPath, JSON.stringify(mappingsJson, null, 2), { access: 'public', token });

    // 4) Return both contents (for your GPT) and the locations
    return res.status(200).json({
      report_md: reportMd,
      index_csv: indexCsv,
      mappings_json: mappingsJson,
      locations: {
        report:          `/${reportPath}`,
        figma_links_index:`/${indexCsvPath}`,
        mappings:        `/${mappingsPath}`,
        qc:              `/${base}/qc/`,
        cleaned_sketch:  `/${base}/cleaned_sketch/`
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate report', details: String(err) });
  }
}
