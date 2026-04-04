import express from "express";
import {
    createPost,
    getPosts as getAllPosts,
    searchPosts,
    votePost,
    getPostById,
    updatePost,
    deletePost
} from "../controllers/postController.js"
import { protectRoute } from "../middleware/authMiddleware.js";


const router = express.Router();

router.get("/search", protectRoute, searchPosts);
router.post("/create-post", protectRoute, createPost);
router.post("/:post_id/vote", protectRoute, votePost);
router.get("/", protectRoute, getAllPosts);
router.get("/:post_id", protectRoute, getPostById);
router.put("/:post_id", protectRoute, updatePost);
router.delete("/:post_id", protectRoute, deletePost);

export default router;