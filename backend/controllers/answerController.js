import pool from "../config/db.js";

export const getAnswers = async (req, res) => {
    const post_id = req.params.id;
    try {
        const result = await pool.query(
            `SELECT answer_id, post_id, author_id, content, created_at, updated_at, is_edited 
             FROM answers 
             WHERE post_id = $1 
             ORDER BY created_at DESC`,
            [post_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching answers:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const createAnswer = async (req, res) => {
    const post_id = req.params.id;
    const { content } = req.body;
    const author_id = req.user.user_id;

    if (!content || content.trim() === "") {
        return res.status(400).json({ error: "Answer content cannot be empty" });
    }

    try {
        const result = await pool.query(
            `INSERT INTO answers (post_id, author_id, content, is_edited) 
             VALUES ($1, $2, $3, false) 
             RETURNING answer_id, post_id, author_id, content, created_at, updated_at, is_edited`,
            [post_id, author_id, content]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating answer:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateAnswer = async (req, res) => {
    const answer_id = req.params.id;
    const { content } = req.body;
    const user_id = req.user.user_id;

    if (!content || content.trim() === "") {
        return res.status(400).json({ error: "Answer content cannot be empty" });
    }

    try {
        const result = await pool.query(
            `UPDATE answers 
             SET content = $1, updated_at = NOW(), is_edited = true 
             WHERE answer_id = $2 AND author_id = $3 
             RETURNING answer_id, post_id, author_id, content, created_at, updated_at, is_edited`,
            [content, answer_id, user_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Answer not found or you are not authorized" });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error("Error updating answer:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteAnswer = async (req, res) => {
    const answer_id = req.params.id;
    const user_id = req.user.user_id;

    try {
        const result = await pool.query(
            `DELETE FROM answers 
             WHERE answer_id = $1 AND author_id = $2 
             RETURNING answer_id, post_id, author_id, content, created_at, updated_at, is_edited`,
            [answer_id, user_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Answer not found or you are not authorized" });
        }
        res.status(200).json({ message: "Answer deleted successfully", answer: result.rows[0] });
    } catch (err) {
        console.error("Error deleting answer:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
