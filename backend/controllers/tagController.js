import pool from "../config/db.js";

// Get all tags (for autocomplete/browsing)
export const getAllTags = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.tag_id, t.name, COUNT(pt.post_id) AS post_count
      FROM tags t
      LEFT JOIN post_tags pt ON t.tag_id = pt.tag_id
      GROUP BY t.tag_id, t.name
      ORDER BY post_count DESC, t.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Get all tags error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get tags for a specific post
export const getTagsByPostId = async (req, res) => {
  try {
    const { post_id } = req.params;
    const result = await pool.query(`
      SELECT t.tag_id, t.name
      FROM tags t
      JOIN post_tags pt ON t.tag_id = pt.tag_id
      WHERE pt.post_id = $1
      ORDER BY t.name
    `, [post_id]);
    res.json(result.rows);
  } catch (err) {
    console.error("Get tags by post error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Search tags by prefix (for autocomplete)
export const searchTags = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Search query 'q' is required" });
    }
    const result = await pool.query(`
      SELECT t.tag_id, t.name, COUNT(pt.post_id) AS post_count
      FROM tags t
      LEFT JOIN post_tags pt ON t.tag_id = pt.tag_id
      WHERE t.name ILIKE $1
      GROUP BY t.tag_id, t.name
      ORDER BY post_count DESC
      LIMIT 10
    `, [`${q}%`]);
    res.json(result.rows);
  } catch (err) {
    console.error("Search tags error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Helper: upsert tags and link them to a post (used by postController)
export const attachTagsToPost = async (post_id, tagNames) => {
  if (!tagNames || tagNames.length === 0) return [];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Remove existing tags for this post
    await client.query('DELETE FROM post_tags WHERE post_id = $1', [post_id]);

    const attachedTags = [];

    for (const name of tagNames) {
      const normalizedName = name.trim().toLowerCase();
      if (!normalizedName || normalizedName.length > 50) continue;

      // Upsert the tag
      const tagResult = await client.query(`
        INSERT INTO tags (name)
        VALUES ($1)
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING tag_id, name
      `, [normalizedName]);

      const tag = tagResult.rows[0];

      // Link to post
      await client.query(`
        INSERT INTO post_tags (post_id, tag_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [post_id, tag.tag_id]);

      attachedTags.push(tag);
    }

    await client.query('COMMIT');
    return attachedTags;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Attach tags error:", err);
    throw err;
  } finally {
    client.release();
  }
};

// Get posts filtered by tag name
export const getPostsByTag = async (req, res) => {
  try {
    const { tagName } = req.params;

    const result = await pool.query(`
      SELECT p.post_id, p.author_id, p.title, p.body, p.created_at,
        COALESCE((SELECT count(*) FROM comments c WHERE c.post_id = p.post_id), 0) AS comment_count,
        COALESCE((SELECT sum(vote_type) FROM votes WHERE post_id = p.post_id), 0) AS vote_count
      FROM posts p
      JOIN post_tags pt ON p.post_id = pt.post_id
      JOIN tags t ON pt.tag_id = t.tag_id
      WHERE t.name = $1
      ORDER BY p.created_at DESC
    `, [tagName.toLowerCase()]);

    res.json(result.rows);
  } catch (err) {
    console.error("Get posts by tag error:", err);
    res.status(500).json({ error: err.message });
  }
};
