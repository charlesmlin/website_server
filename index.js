import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import getImageUrl from "./controllers/imageController.js";
import { S3Client } from "@aws-sdk/client-s3";

dotenv.config();

const PORT = process.env.PORT || 80;
const EXPRESS_CORS = (process.env.EXPRESS_CORS || "").split(",");

const S3_BUCKET = process.env.S3_BUCKET;
const S3_REGION = process.env.S3_REGION;
const S3_KEYS = process.env.S3_KEYS.split(","); // 'a,b,c'
const S3_EXPIRE_SECS = 600; // 10 minutes

const initializeApp = (
  expressCors,
  s3Client,
  s3BuckeName,
  s3Keys,
  s3ExpireSecs
) => {
  const s3KeysString = s3Keys.join("|");

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin || expressCors.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  };

  const router = express.Router();
  router.use(cors(corsOptions));
  router.get(
    `/imageurl/:imageName(${s3KeysString})`,
    getImageUrl(s3Client, s3BuckeName, s3ExpireSecs)
  );

  const app = express();
  app.use(express.json());
  app.use("/", router);
  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  return app;
};

const s3Client = new S3Client({
  region: S3_REGION,
});
const app = initializeApp(
  EXPRESS_CORS,
  s3Client,
  S3_BUCKET,
  S3_KEYS,
  S3_EXPIRE_SECS
);

export default app;
