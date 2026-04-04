import multer from "multer";

// We'll use memory storage and upload directly to Cloudinary in the route
// This avoids the peer dependency issues with multer-storage-cloudinary
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

export default upload;
