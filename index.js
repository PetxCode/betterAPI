const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 2277;
const app = express();

cloudinary.config({
  cloud_name: "dry8nywub",
  api_key: "629241972579982",
  api_secret: "Pc2-culzxkssn7oX8SIZoMLR6vc"
});

const url_online =
  "mongodb+srv://AuthClass:AuthClass@codelab.u4drr.mongodb.net/Election?retryWrites=true&w=majority";

const url = "mongodb://localhost/electionDB";

const candidateModel1 = mongoose.Schema(
  {
    name: {
      type: String
    },
    position: {
      type: String
    },
    point: {
      type: Number
    },
    avatar: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

const candidateModel = mongoose.model("candidates", candidateModel1);

const userModel1 = mongoose.Schema(
  {
    name: {
      type: String
    },
    email: {
      type: String,
      unique: true,
      required: true
    },
    password: {
      type: String
    },
    avatar: {
      type: String
    },

    isAdmin: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const userModel = mongoose.model("users", userModel1);

mongoose.connect(url_online).then(() => {
  console.log("db is now connected...!");
});

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/", (req, res) => {
  res
    .status(200)
    .end(
      "This API server, is design for CodeLab fellow's Election, Although it can be used for any purpose of Election! Let's start ROCKING 🚀👍"
    );
});

app.get("/voter", async (req, res) => {
  try {
    const getVoters = await userModel.find();
    res
      .status(200)
      .json({ message: "found voters successfully", data: getVoters });
  } catch (err) {
    res.status(400).json({ message: `error found: ${err.message}` });
  }
});

app.get("/voter/:id", async (req, res) => {
  try {
    const getVoters = await userModel.findById(req.params.id);
    res.status(200).json({ message: "successful", data: getVoters });
  } catch (err) {
    res.status(400).json({ message: `error found: ${err.message}` });
  }
});

app.patch("/voter/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const getVoters = await userModel.findByIdAndUpdate(
      req.params.id,
      {
        name
      },
      { new: true }
    );
    res.status(200).json({ message: "updated successfully", data: getVoters });
  } catch (err) {
    res.status(400).json({ message: `error found: ${err.message}` });
  }
});

app.delete("/voter/:id", async (req, res) => {
  try {
    await userModel.findByIdAndRemove(req.params.id, req.body);
    res.status(200).json({ message: "deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: `error found: ${err.message}` });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  }
});

const upload = multer({ storage }).single("avatar");

app.post("/voter/register", upload, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const image = await cloudinary.uploader.upload(req.file.path);

    const getVoters = await userModel.create({
      name,
      email,
      password: hash,
      avatar: image.secure_url
    });
    res.status(200).json({ message: "created successfully", data: getVoters });
  } catch (err) {
    res.status(400).json({ message: `error found: ${err.message}` });
  }
});

app.post("/voter/signin", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const checkEmail = await userModel.findOne({ email });

    if (checkEmail) {
      const checkPassword = await bcrypt.compare(password, checkEmail.password);
      if (checkPassword) {
        const { password, ...info } = checkEmail._doc;

        const token = jwt.sign(
          {
            _id: checkEmail._id,
            name: checkEmail.name,
            email: checkEmail.email,
            isAdmin: checkEmail.isAdmin
          },
          "THSIISWhatIConsiderAStheToekNNNN",
          { expiresIn: "2d" }
        );

        res
          .status(200)
          .json({ message: "created successfully", data: { ...info, token } });
      } else {
        res.status(400).json({ message: `error Password not found` });
      }
    } else {
      res.status(400).json({ message: `error Email not found` });
    }
  } catch (err) {
    res.status(400).json({ message: `error found: ${err.message}` });
  }
});

const verified = (req, res, next) => {
  const checkAuth = req.headers.authorization;
  if (checkAuth) {
    const token = checkAuth.split(" ")[1];
    jwt.verify(token, "THSIISWhatIConsiderAStheToekNNNN", (err, payload) => {
      if (err) {
        res.status(400).json({ message: `error found: ${err.message}` });
      } else {
        req.user = payload;
        next();
      }
    });
  } else {
    res.status(400).json({ message: `error at Token level` });
  }
};

app.post("/candidate/create", verified, upload, async (req, res) => {
  try {
    if (req.user.isAdmin) {
      const { name, point, position } = req.body;
      const image = await cloudinary.uploader.upload(req.file.path);
      const getCandidates = await candidateModel.create({
        name,
        position,
        point,
        avatar: image.secure_url
      });
      res
        .status(200)
        .json({ message: "found all successfully", data: getCandidates });
    }
  } catch (err) {
    res.status(400).json({ message: `error found: ${err.message}` });
  }
});

app.get("/candidate", async (req, res) => {
  try {
    const getCandidates = await candidateModel.find();
    res
      .status(200)
      .json({ message: "found all successfully", data: getCandidates });
  } catch (err) {
    res.status(400).json({ message: `error found: ${err.message}` });
  }
});

app.get("/candidate/:id", async (req, res) => {
  try {
    const getCandidates = await candidateModel.findById(req.params.id);
    res
      .status(200)
      .json({ message: "found individual successfully", data: getCandidates });
  } catch (err) {
    res.status(400).json({ message: `error found: ${err.message}` });
  }
});

app.patch("/candidate/:id", async (req, res) => {
  try {
    const getCandidates = await candidateModel.findByIdAndUpdate(
      req.params.id,
      {
        point: req.body.point
      },
      { new: true }
    );
    res.status(200).json({
      message: "updated individual point successfully",
      data: getCandidates
    });
  } catch (err) {
    res.status(400).json({ message: `error found: ${err.message}` });
  }
});

app.listen(port, () => {
  console.log("server is now running on 🚀 port: ", port);
});
