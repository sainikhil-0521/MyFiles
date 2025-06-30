const express = require("express");
const path = require("path");
const cors = require("cors");
const Busboy = require("busboy");
const { S3, GetObjectCommand } = require("@aws-sdk/client-s3");
const { connectDB } = require("./helpers/MongoHelper");
const {allowedMimeTypes, allowedExtensions} = require("./constants/FileConstants")
const Files = require("./models/FileSchema");

require("dotenv").config();
const app = express();
const PORT = process.env.PORT;

app.use(express.urlencoded({ extended: true, limit: "200mb" }));
app.use(express.json({ limit: "200mb" }));

app.use(cors());

const MAX_SIZE = 500 * 1024 * 1024;
const s3 = new S3({
  region: process.env.S3_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const main = async () => {
  await connectDB();
  app.get("/api/files", async (req, res) => {
    try {
      const skip = parseInt(req.query.skip) || 0;
      const limit = parseInt(req.query.limit) || 10;
      const allFiles = await Files.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit);
      res.json(
        allFiles.map((record) => {
          return { name: record.filename, created_at: record.createdAt, key: record.s3Key };
        })
      );
    } catch (error) {
      console.log("Error fetching files:", error);
      res.status(500).json({ error: "Failed to fetch files" });
    }
  });

  app.post("/api/upload", (req, res) => {
    try {
      const busboy = Busboy({ headers: req.headers });
      let customFilename = null;
      let totalBytes = 0;
      let uploadAborted = false;
      let fileName = null;
      let fileBuffer = [];
      console.log(req.body);
      busboy.on("field", (fieldname, val) => {
        if (fieldname === "filename") customFilename = val;
      });

      busboy.on("file", (fieldname, file, originalname) => {
        fileName = customFilename
          ? `${customFilename}${path.extname(originalname.filename)}`
          : originalname.filename;
        const fileExt = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
        if (
          !allowedMimeTypes.includes(originalname.mimeType) ||
          !allowedExtensions.includes(fileExt)
        ) {
          return res.status(400).json({
            error: "Only .png, .jpeg, .jpg, .txt, and .json files are allowed.",
          });
        }
        file.on("data", (chunk) => {
          totalBytes += chunk.length;
          if (totalBytes > MAX_SIZE) {
            uploadAborted = true;
            return res.status(413).json({ error: "File exceeds 500MB limit" });
          }
          fileBuffer.push(chunk);
        });

        file.on("end", async () => {
          if (uploadAborted) return;

          const buffer = Buffer.concat(fileBuffer);
          const s3Key = `uploads/${Date.now()}_${fileName}`;
          try {
            await s3.putObject({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: s3Key,
              Body: buffer,
              ContentLength: totalBytes,
              ContentType: originalname.mimeType,
            });
            await Files.insertOne({ s3Key, filename: fileName });
            res.status(200).json({ message: "Upload successful" });
          } catch (err) {
            console.log("S3 Upload error:", err);
            res.status(500).json({ error: "Upload failed" });
          }
        });
      });

      req.pipe(busboy);
    } catch (err) {
      console.log("S3 Upload error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  app.get("/api/download", async (req, res) => {
    try {
      const key = req?.query?.key;
      const mode = req?.query?.mode || "download";

      if (!key) return res.status(400).send("Missing file key");

      try {
        const command = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key,
        });
        const data = await s3.send(command);
        const stream = data.Body;
        const contentType = data.ContentType || "application/octet-stream";
        const filename = key.split("/").pop();
        res.setHeader("Content-Type", contentType);
        if (mode === "view") {
          res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
        } else {
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
          );
        }
        stream.pipe(res);
      } catch (err) {
        console.log("Error streaming S3 file:", err);
        res.status(500).send("Error downloading/viewing file");
      }
    } catch (error) {
      console.log("Error streaming S3 file:", err);
      res.status(500).send("Error downloading/viewing file");
    }
  });

  app.listen(PORT, () =>
    console.log(`Server started on http://localhost:${PORT}`)
  );
};

main();
