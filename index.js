// index.js
import express from "express";
import multer from "multer";
import cors from "cors";
import TelegramBot from "node-telegram-bot-api";
import path from "path";
import { fileURLToPath } from "url";

// File & dir setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express app
const app = express();

// Enable CORS so other websites can POST files
app.use(cors());

// Multer setup (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// Telegram Bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Serve optional HTML page
app.use(express.static(path.join(__dirname, "public")));

// Upload endpoint (image/video/any file)
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.json({ success: false, message: "No file uploaded!" });

  try {
    const isImage = req.file.mimetype.startsWith("image/");
    if (isImage) {
      await bot.sendPhoto(process.env.CHANNEL_ID, req.file.buffer);
    } else {
      await bot.sendDocument(
        process.env.CHANNEL_ID,
        req.file.buffer,
        {},
        { filename: req.file.originalname }
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
});

// Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
