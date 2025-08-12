module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { original_file_id, figma_file_id } = req.body || {};
  if (!original_file_id || !figma_file_id) return res.status(400).json({ error: 'original_file_id and figma_file_id are required' });
  res.status(200).json({
    avg_parity: 96.4,
    frames_total: 12,
    frames_passed: 11,
    issues: [
      { frame: "Home/Hero", type: "font", note: "Fallback changed line height slightly" }
    ],
    diff_bundle_url: "https://example.com/qc/diff.zip"
  });
};