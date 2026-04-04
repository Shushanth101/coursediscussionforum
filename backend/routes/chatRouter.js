import Router from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import { initChat, generateContent, getPastChats, getConversationHistory } from "../controllers/chatController.js";

const router = Router();

router.get("/init", protectRoute, initChat);
router.post("/generateContent", protectRoute, generateContent);
router.get("/past-chats", protectRoute, getPastChats);
router.get("/:conversation_id", protectRoute, getConversationHistory);



export default router;