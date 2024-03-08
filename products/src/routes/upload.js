const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const streamifier = require("streamifier");
const { isAdmin, isAuth } = require("../middlewares/authentication");

const upload = multer();

module.exports = (app, channel) => {
  app.post(
    "/upload",
    isAuth,
    isAdmin,
    upload.single("file"),
    async (req, res) => {
      cloudinary.config({
        cloud_name: "dqc6m0yzc",
        api_key: "542941884436985",
        api_secret: "6F-HnU6oG86Xl0W9k-dZ6UFKqtw",
      });
      const streamUpload = (req) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream((error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          });
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };
      const result = await streamUpload(req);
      res.send(result);
    }
  );
};
