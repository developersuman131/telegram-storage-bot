import express from "express";
import multer from "multer";
import cors from "cors";
import TelegramBot from "node-telegram-bot-api";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Telegram Bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Temporary memory storage for uploaded files info
// (Note: Server restart pe data reset ho jaayega. DB use kar sakte ho production me)
let filesList = [];

// Upload endpoint
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

    // Save in memory list for frontend
    const fileObj = {
      name: req.file.originalname,
      mimetype: req.file.mimetype,
      buffer: req.file.buffer.toString("base64") // store as base64 for download
    };
    filesList.push(fileObj);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
});

// List uploaded files
app.get("/files", (req, res) => {
  const files = filesList.map(f => ({ name: f.name, mimetype: f.mimetype }));
  res.json(files);
});

// Download file by name
app.get("/download/:filename", (req, res) => {
  const file = filesList.find(f => f.name === req.params.filename);
  if (!file) return res.status(404).send("File not found");

  const buffer = Buffer.from(file.buffer, "base64");
  res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
  res.setHeader("Content-Type", file.mimetype);
  res.send(buffer);
});

// Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
