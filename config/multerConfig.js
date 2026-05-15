import multer from "multer";
import path from "path";
import fs from "fs";

function getUploader(folderName = "general") {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = `uploads/${folderName}`;
            fs.mkdirSync(uploadPath, { recursive: true });
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + "-" + file.originalname);
        },
    });

    const fileFilter = (req, file, cb) => {
        // ✅ Allowed extensions
        const allowedTypes =
            /jpeg|jpg|png|webp|svg|pdf|mp3|wav|ogg|m4a|webm/;

        const extname = allowedTypes.test(
            path.extname(file.originalname).toLowerCase()
        );

        // ✅ Allowed MIME types
        const allowedMimeTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/svg+xml",
            "application/pdf",

            // Audio
            "audio/mpeg",       // mp3
            "audio/wav",
            "audio/ogg",
            "audio/x-m4a",
            "audio/mp4",
            "audio/webm"        // ✅ VERY IMPORTANT
        ];

        const mimetype = allowedMimeTypes.includes(file.mimetype);
        console.log(file, extname)
        if (
            file.mimetype.startsWith("image/") ||
            file.mimetype.startsWith("audio/") ||
            file.mimetype === "application/pdf"
        ) {
            cb(null, true);
        } else {
            cb(new Error("Only image, PDF, and audio files are allowed"), false);
        }


        cb(null, true);
    };

    return multer({
        storage,
        limits: {
            fileSize: 20 * 1024 * 1024, // 20MB
        },
        fileFilter,
    });
}

export default getUploader;
