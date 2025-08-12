# Vercel Backend — Sketch → Figma Migration (Starter)

This is a **no-config** Vercel Serverless Functions backend. Deploy it to get a public domain
like `https://YOUR-PROJECT.vercel.app` with these endpoints:

- `POST /api/upload_and_audit_sketch`
- `POST /api/clean_sketch_files`
- `POST /api/import_to_figma`
- `POST /api/qc_check_figma`
- `POST /api/generate_migration_report`
- `GET  /api/health`

> These are **stubs** that return realistic demo data, so your ChatGPT Action works immediately.
> You (or a dev) can fill in real logic later (Sketchtool, Figma API, etc.).
