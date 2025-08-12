module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { cleaned_file_id, figma_project_id } = req.body || {};
  if (!cleaned_file_id || !figma_project_id) return res.status(400).json({ error: 'cleaned_file_id and figma_project_id are required' });
  const figma_file_id = `FIGMA_${Math.random().toString(36).slice(2,8)}`;
  res.status(200).json({
    figma_file_id,
    figma_url: `https://www.figma.com/file/${figma_file_id}/Imported`
  });
};