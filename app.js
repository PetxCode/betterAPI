const express = require("express");
const port = process.env.PORT || 3357;
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const GridFS = require("gridfs-stream");

const app = express();
const url = "mongodb://localhost/newTestDB";
const url_online =
  "mongodb+srv://AuthClass:AuthClass@codelab.u4drr.mongodb.net/Election?retryWrites=true&w=majority";

const conn = mongoose.createConnection(url_online);
let gfs;

app.use(cors({ origin: "*" }));
app.use(express.json());

conn.once("open", () => {
  gfs = GridFS(conn.db, mongoose.mongo);
  gfs.collection("uploads");
  console.log("db connected successfully...!");
});

const storage = new GridFsStorage({
  url: url,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }

        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads"
        };

        return resolve(fileInfo);
      });
    });
  }
});

var storage1 = new GridFsStorage({
  url: url,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads"
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload1 = multer({ storage }).single("pixx");

const upload = multer({ storage }).single("pix");

app.get("/", (req, res) => {
  res.end("Starting something greater with CodeLab");
});

app.get("/image", (req, res) => {
  gfs.files.find().toArray((err, el) => {
    if (err) {
      return null;
    }
    return res.status(200).json(el);
  });
});

app.post("/", upload, (req, res) => {
  res.status(201).json({
    message: "uploaded successfully",
    data: req.file
  });
});

app.listen(port, () => {
  console.log(`server and port i up: ${port}`);
});
