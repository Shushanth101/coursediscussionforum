import express from "express";
import { createComment, getCommentsByPostId, updateComment, deleteComment } from "../controllers/commentController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protectRoute, createComment);
router.get("/:post_id", getCommentsByPostId);
router.put("/:comment_id", protectRoute, updateComment);
router.delete("/:comment_id", protectRoute, deleteComment);


export default router;