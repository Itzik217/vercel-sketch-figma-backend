module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { files } = req.body || {};
  if (!Array.isArray(files)) return res.status(400).json({ error: 'files array (base64 strings) is required' });
  const results = files.map((_, i) => ({
    file_id: `file_${i+1}`,
    name: `upload_${i+1}.sketch`,
    pages: 3 + i,
    symbols: 10 + i,
    text_styles: 6,
    color_styles: 5,
    fonts: ["Inter", "SF Pro"],
    plugins: []
  }));
  res.status(200).json({ batch_id: `${Date.now()}`, files: results });
};