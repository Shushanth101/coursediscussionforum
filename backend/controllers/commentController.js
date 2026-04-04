import pool from "../config/db.js";

import crypto from "crypto";

export const createComment = async (req, res) => {
  try {
    const { post_id, parent_id, content } = req.body;
    const author_id = req.user.user_id; // Securely taking from middleware

    if (!content || !post_id) {
      return res.status(400).json({ error: "post_id and content are required" });
    }

    const timestamp = Date.now().toString(36);
    const randomStr = crypto.randomBytes(10).toString('hex');
    const comment_id = `${timestamp}${randomStr}`.substring(0, 30);

    const result = await pool.query(
      `INSERT INTO comments
      (comment_id, author_id, post_id, parent_id, content)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *`,
      [comment_id, author_id, post_id, parent_id, content]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const getCommentsByPostId = async (req, res) => {
  try {
    const { post_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at DESC`, [post_id])

    const comments = result.rows;
    let roots = []
    let map = {}
    comments.forEach(c => {
      map[c.comment_id] = { ...c, replies: [] }
    })
    comments.forEach(c => {
      if (c.parent_id) {
        if (map[c.parent_id]) {
          map[c.parent_id].replies.push(map[c.comment_id]);
        }
      } else {
        roots.push(map[c.comment_id])
      }
    })

    res.json(roots)
  } catch (err) {

    console.error(err);
    res.status(500).json({
      error: "Failed to fetch comments"
    });

  }
}

export const updateComment = async (req, res) => {
  try {
    const { comment_id } = req.params;
    const { content } = req.body;
    const author_id = req.user.user_id;

    if (!content) {
      return res.status(400).json({ error: "content is required" });
    }

    const result = await pool.query(
      `UPDATE comments SET content = $1 WHERE comment_id = $2 AND author_id = $3 RETURNING *`,
      [content, comment_id, author_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found or unauthorized" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update comment error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { comment_id } = req.params;
    const author_id = req.user.user_id;

    const result = await pool.query(
      `DELETE FROM comments WHERE comment_id = $1 AND author_id = $2 RETURNING comment_id`,
      [comment_id, author_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found or unauthorized" });
    }

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ error: err.message });
  }
};