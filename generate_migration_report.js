module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { project, batch_id, figma_links } = req.body || {};
  if (!project || !batch_id || !Array.isArray(figma_links)) return res.status(400).json({ error: 'project, batch_id, and figma_links[] are required' });
  res.status(200).json({
    report_url: "https://example.com/report/REPORT.md",
    index_csv_url: "https://example.com/report/INDEX.csv",
    checklist_md: "# Figma Checklist\n- Pan: Space + drag\n- Comment: C\n"
  });
};