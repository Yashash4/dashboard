const { Router } = require("express");
const db = require("../db");
const router = Router();

// GET /api/kb/documents
router.get("/documents", (req, res) => {
  const { search, status } = req.query;
  let where = "1=1";
  const params = {};
  if (search) { where += " AND name LIKE @search"; params.search = `%${search}%`; }
  if (status) { where += " AND status = @status"; params.status = status; }

  try {
    const rows = db.prepare(`SELECT * FROM kb_documents WHERE ${where} ORDER BY created_at DESC`).all(params);
    res.json({ documents: rows });
  } catch {
    res.status(500).json({ error: "Failed to query documents" });
  }
});

// POST /api/kb/documents
router.post("/documents", (req, res) => {
  const { name, file_type, file_size, content } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });

  try {
    const stmt = db.prepare(
      "INSERT INTO kb_documents (name, file_type, file_size, content) VALUES (@name, @file_type, @file_size, @content)"
    );
    const info = stmt.run({ name, file_type: file_type || null, file_size: file_size || 0, content: content || null });
    const doc = db.prepare("SELECT * FROM kb_documents WHERE rowid = @rowid").get({ rowid: info.lastInsertRowid });
    res.status(201).json({ document: doc });
  } catch {
    res.status(500).json({ error: "Failed to create document" });
  }
});

// DELETE /api/kb/documents/:id
router.delete("/documents/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM kb_documents WHERE id = @id").run({ id: req.params.id });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete document" });
  }
});

// PATCH /api/kb/documents/:id
router.patch("/documents/:id", (req, res) => {
  const allowed = ["status", "chunk_count", "retrieval_count", "error_message", "indexed_at"];
  const sets = [];
  const params = { id: req.params.id };
  for (const key of allowed) {
    if (key in req.body) { sets.push(`${key} = @${key}`); params[key] = req.body[key]; }
  }
  if (sets.length === 0) return res.status(400).json({ error: "No updates" });

  try {
    db.prepare(`UPDATE kb_documents SET ${sets.join(", ")} WHERE id = @id`).run(params);
    const doc = db.prepare("SELECT * FROM kb_documents WHERE id = @id").get({ id: req.params.id });
    res.json({ document: doc });
  } catch {
    res.status(500).json({ error: "Failed to update document" });
  }
});

// GET /api/kb/search
router.get("/search", (req, res) => {
  const { q, limit = "10" } = req.query;
  if (!q) return res.status(400).json({ error: "q required" });
  const lim = Math.min(parseInt(limit) || 10, 50);

  try {
    // Simple text search fallback (vector search done via embedding service)
    const rows = db.prepare(
      "SELECT c.content, c.chunk_index, d.name as document_name FROM kb_chunks c JOIN kb_documents d ON c.document_id = d.id WHERE c.content LIKE @q ORDER BY c.chunk_index LIMIT @lim"
    ).all({ q: `%${q}%`, lim });
    res.json({ results: rows });
  } catch {
    res.status(500).json({ error: "Failed to search" });
  }
});

// POST /api/kb/chunks
router.post("/chunks", (req, res) => {
  const { document_id, content, chunk_index, embedding, metadata } = req.body;
  if (!document_id || !content) return res.status(400).json({ error: "document_id and content required" });

  try {
    db.prepare(
      "INSERT INTO kb_chunks (document_id, content, chunk_index, embedding, metadata) VALUES (@document_id, @content, @chunk_index, @embedding, @metadata)"
    ).run({
      document_id, content, chunk_index: chunk_index || 0,
      embedding: embedding ? Buffer.from(embedding) : null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
    res.status(201).json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to create chunk" });
  }
});

module.exports = router;
