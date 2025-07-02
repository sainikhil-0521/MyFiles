const express = require("express");
const path = require("path");
const cors = require("cors");
const Busboy = require("busboy");
const { S3, GetObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { connectDB } = require("./helpers/MongoHelper");
const {allowedMimeTypes, allowedExtensions} = require("./constants/FileConstants")
const Files = require("./models/FileSchema");
const { PassThrough } = require("stream");
const { Upload } = require("@aws-sdk/lib-storage");

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
      const limit = parseInt(req.query.limit) || 20;
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
      let fileName = null;
      let uploadPromise = null;
      let uploadAborted = false;

      busboy.on("field", (fieldname, val) => {
        if (fieldname === "filename") customFilename = val;
      });

      busboy.on("file", (fieldname, file, info) => {
        const { filename, mimeType } = info;
        fileName = customFilename
          ? `${customFilename}${path.extname(filename)}`
          : filename;

        const fileExt = path.extname(fileName).toLowerCase();
        if (
          !allowedMimeTypes.includes(mimeType) ||
          !allowedExtensions.includes(fileExt)
        ) {
          res.status(400).json({
            error: "Only .png, .jpeg, .jpg, .txt, and .json files are allowed.",
          });
          uploadAborted = true;
          file.resume();
          return;
        }

        const passThrough = new PassThrough();
        const s3Key = `uploads/${Date.now()}_${fileName}`;

        uploadPromise = new Upload({
          client: new S3Client({ region: process.env.S3_BUCKET_REGION }),
          params: {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: s3Key,
            Body: passThrough,
            ContentType: mimeType,
          },
        });

        let totalBytes = 0;

        file.on("data", (chunk) => {
          totalBytes += chunk.length;
          if (totalBytes > MAX_SIZE) {
            uploadAborted = true;
            file.unpipe(passThrough);
            passThrough.end();
            res.status(413).json({ error: "File exceeds 500MB limit" });
            return;
          }
          passThrough.write(chunk);
        });

        file.on("end", async () => {
          passThrough.end();
          if (uploadAborted) return;

          try {
            await uploadPromise.done();
            await Files.insertOne({ s3Key, filename: fileName });
            res.status(200).json({ message: "Upload successful" });
          } catch (err) {
            console.error("Upload failed:", err);
            if (!res.headersSent) {
              res.status(500).json({ error: "Upload failed" });
            }
          }
        });
      });

      req.pipe(busboy);
    } catch (err) {
      console.error("Unexpected error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Unexpected error occurred" });
      }
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
