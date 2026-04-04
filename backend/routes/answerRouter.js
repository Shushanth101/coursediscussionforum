import { Router } from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
    getAnswers,
    createAnswer,
    updateAnswer,
    deleteAnswer
} from "../controllers/answerController.js";

const router = Router();


router.get("/:id", protectRoute, getAnswers);


router.post("/:id", protectRoute, createAnswer);

router.put("/:id", protectRoute, updateAnswer);


router.delete("/:id", protectRoute, deleteAnswer);

export default router;