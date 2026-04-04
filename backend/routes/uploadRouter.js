import express from "express";
import upload from "../config/multer.js";
import { protectRoute } from "../middleware/authMiddleware.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

const router = express.Router();

router.post("/upload", protectRoute, upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }

    // Function to handle single file upload using a promise
    const uploadToCloudinary = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "course_forum_uploads",
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
      });
    };

    // Upload all files in parallel
    const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer));
    const imageUrls = await Promise.all(uploadPromises);

    res.status(200).json({
      message: "Images uploaded successfully",
      urls: imageUrls,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({ error: "Image upload failed" });
  }
});

export default router;
