const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 8888;

// Middleware
app.use(cors());
app.use(express.static("uploads")); // Serve static files from the uploads directory

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
  },
});

const upload = multer({ storage });

// Create uploads directory if it doesn't exist
const dir = "./uploads";
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

app.get("/images", (req, res) => {
  fs.readdir("./uploads", (err, files) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Unable to scan directory: " + err });
    }
    const images = files.map((file) => {
      return {
        name: file,
        url: `http://localhost:${PORT}/${file}`, // Construct URL for each file
      };
    });
    res.json(images);
  });
});

// Upload endpoint
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({
    success: true,
    message: "File uploaded successfully!",
    filePath: req.file.path,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
