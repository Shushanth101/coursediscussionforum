import pool from "../config/db.js";
import crypto from "crypto";
import { attachTagsToPost } from "./tagController.js";

export const createPost = async (req, res) => {
  try {
    const { title, body, tags } = req.body;
    const author_id = req.user.user_id; // Added securely from middleware

    // Generate a time-sortable ID which is highly efficient for B-Tree indexes
    const timestamp = Date.now().toString(36);
    const randomStr = crypto.randomBytes(10).toString('hex');
    const post_id = `${timestamp}${randomStr}`.substring(0, 30);

    // Basic validation
    if (!title || !body) {
      return res.status(400).json({
        error: "title and body are required"
      });
    }

    const result = await pool.query(
      `INSERT INTO posts (post_id, author_id, title, body)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [post_id, author_id, title, body]
    );

    // Attach tags if provided
    let attachedTags = [];
    if (tags && Array.isArray(tags) && tags.length > 0) {
      attachedTags = await attachTagsToPost(post_id, tags);
    }

    try {
      const response = await fetch(`${process.env.EMBEDDINGSERVICE_ENDPOINT}/process_post/${post_id}`, {
        method: "POST"
      });
      if (!response.ok) {
        console.error("Embedding service returned status:", response.status);
      } else {
        console.log("Embedding service task submitted successfully");
      }
    } catch (err) {
      console.error("Embedding service error:", err.message);
    }

    res.status(201).json({ ...result.rows[0], tags: attachedTags });

  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getPosts = async (req, res) => {
  const { limit } = req.query;
  try {
    const result = await pool.query(
      `SELECT p.post_id, p.author_id, p.title, p.body, p.created_at,
      COALESCE((SELECT count(*) FROM comments c WHERE c.post_id = p.post_id), 0) AS comment_count,
      COALESCE((SELECT sum(vote_type) FROM votes WHERE post_id = p.post_id), 0) AS vote_count,
      COALESCE(
        (SELECT json_agg(json_build_object('tag_id', t.tag_id, 'name', t.name))
         FROM post_tags pt
         JOIN tags t ON pt.tag_id = t.tag_id
         WHERE pt.post_id = p.post_id),
        '[]'
      ) AS tags
      FROM posts p
      ORDER BY p.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export const searchPosts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Search query 'q' is required" });
    }

    // Call Python embedding service
    const response = await fetch(`${process.env.EMBEDDINGSERVICE_ENDPOINT}/generate_query_embedding`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q })
    });

    if (!response.ok) {
      throw new Error(`Embedding service failed with status ${response.status}`);
    }

    const data = await response.json();
    const queryEmbedding = data.embedding;

    // Convert JS array to pgvector compatible string literal, e.g., '[0.1, 0.2, ...]'
    const vectorString = `[${queryEmbedding.join(",")}]`;

    // Query for posts sorted by cosine similarity
    const result = await pool.query(
      `SELECT post_id, author_id, title, body, created_at, 
              1 - (embedding <=> $1) AS similarity 
       FROM posts 
       WHERE embedding IS NOT NULL 
       ORDER BY embedding <=> $1 
       LIMIT 5`,
      [vectorString]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("Search posts error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const votePost = async (req, res) => {
  try {
    const { post_id } = req.params;
    const { vote_type } = req.body; // Expecting 1 for upvote, -1 for downvote, 0 to remove vote
    const user_id = req.user.user_id;

    if (![1, 0, -1].includes(vote_type)) {
      return res.status(400).json({ error: "vote_type must be 1, 0, or -1" });
    }

    // Check if the user already voted on this post
    const existing = await pool.query(
      `SELECT vote_id FROM votes WHERE post_id = $1 AND user_id = $2`,
      [post_id, user_id]
    );

    if (existing.rows.length > 0) {
      if (vote_type === 0) {
        // Remove vote
        await pool.query(
          `DELETE FROM votes WHERE post_id = $1 AND user_id = $2`,
          [post_id, user_id]
        );
        return res.status(200).json({ message: "Vote removed" });
      } else {
        // Update vote
        await pool.query(
          `UPDATE votes SET vote_type = $1 WHERE post_id = $2 AND user_id = $3`,
          [vote_type, post_id, user_id]
        );
        return res.status(200).json({ message: "Vote updated" });
      }
    } else {
      if (vote_type !== 0) {
        // Create new vote
        await pool.query(
          `INSERT INTO votes (post_id, user_id, vote_type) VALUES ($1, $2, $3)`,
          [post_id, user_id, vote_type]
        );
        return res.status(201).json({ message: "Vote created" });
      } else {
        return res.status(200).json({ message: "No vote to remove" });
      }
    }

  } catch (err) {
    console.error("Vote error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getPostById = async (req, res) => {
  try {
    const { post_id } = req.params;
    const result = await pool.query(
      `SELECT p.post_id, p.author_id, p.title, p.body, p.created_at,
      COALESCE((SELECT count(*) FROM comments c WHERE c.post_id = p.post_id), 0) AS comment_count,
      COALESCE((SELECT sum(vote_type) FROM votes WHERE post_id = p.post_id), 0) AS vote_count,
      COALESCE(
        (SELECT json_agg(json_build_object('tag_id', t.tag_id, 'name', t.name))
         FROM post_tags pt
         JOIN tags t ON pt.tag_id = t.tag_id
         WHERE pt.post_id = p.post_id),
        '[]'
      ) AS tags
      FROM posts p
      WHERE p.post_id = $1`,
      [post_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get post error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { post_id } = req.params;
    const { title, body, tags } = req.body;
    const author_id = req.user.user_id;

    if (!title || !body) {
      return res.status(400).json({ error: "title and body are required" });
    }

    const result = await pool.query(
      `UPDATE posts 
       SET title = $1, body = $2 
       WHERE post_id = $3 AND author_id = $4
       RETURNING *`,
      [title, body, post_id, author_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found or unauthorized" });
    }

    // Update tags if provided
    let attachedTags = [];
    if (tags && Array.isArray(tags)) {
      attachedTags = await attachTagsToPost(post_id, tags);
    }

    res.json({ ...result.rows[0], tags: attachedTags });
  } catch (err) {
    console.error("Update post error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { post_id } = req.params;
    const author_id = req.user.user_id;

    const result = await pool.query(
      `DELETE FROM posts 
       WHERE post_id = $1 AND author_id = $2
       RETURNING post_id`,
      [post_id, author_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found or unauthorized" });
    }

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ error: err.message });
  }
};
