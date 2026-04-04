import express from "express";
import {
  getAllTags,
  getTagsByPostId,
  searchTags,
  getPostsByTag
} from "../controllers/tagController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protectRoute, getAllTags);
router.get("/search", protectRoute, searchTags);
router.get("/post/:post_id", protectRoute, getTagsByPostId);
router.get("/filter/:tagName", protectRoute, getPostsByTag);

export default router;
