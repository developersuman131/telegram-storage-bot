import express from "express";
import multer from "multer";
import cors from "cors";
import TelegramBot from "node-telegram-bot-api";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Temporary folder for downloads
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const upload = multer({ storage: multer.memoryStorage() });

// Telegram Bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// API: Upload file
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded!" });

  try {
    // Save file locally for download
    const filePath = path.join(UPLOAD_DIR, req.file.originalname);
    fs.writeFileSync(filePath, req.file.buffer);

    // Send to Telegram
    if (req.file.mimetype.startsWith("image/")) {
      await bot.sendPhoto(process.env.CHANNEL_ID, req.file.buffer);
    } else {
      await bot.sendDocument(process.env.CHANNEL_ID, req.file.buffer, {}, { filename: req.file.originalname });
    }

    res.json({
      success: true,
      downloadUrl: `/download/${encodeURIComponent(req.file.originalname)}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// API: Download file
app.get("/download/:filename", (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ success: false, message: "File not found!" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
