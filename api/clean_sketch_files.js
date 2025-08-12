module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { file_id } = req.body || {};
  if (!file_id) return res.status(400).json({ error: 'file_id is required' });
  res.status(200).json({
    file_id,
    cleaned_file_id: `${file_id}_CLEAN`,
    removed_unused_symbols: 7,
    removed_unused_styles: 4,
    removed_hidden_layers: 3
  });
};
