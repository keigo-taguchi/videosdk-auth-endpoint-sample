const express = require("express");
const cors = require("cors");
const KJUR = require("jsrsasign");
const axios = require("axios");
const bodyParser = require("body-parser");
const serverlessExpress = require("@vendia/serverless-express");

const app = express();
const port = process.env.PORT || 4000;

// CORS configuration
app.use(
  cors({
    origin: "*", // Replace with specific origins if necessary
    methods: ["GET", "POST", "OPTIONS", "DELETE"],
    credentials: true, // Allow cookies for cross-origin requests
  })
);
// urlencodedとjsonは別々に初期化する
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

// Enable OPTIONS requests for preflight
app.options("*", cors());

app.post("/zoom", (req, res) => {
  const iat = Math.round(new Date().getTime() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;

  const oHeader = { alg: "HS256", typ: "JWT" };

  const oPayload = {
    app_key: process.env.ZOOM_VIDEO_SDK_KEY,
    tpc: req.body.sessionName,
    role_type: req.body.role,
    user_identity: req.body.userIdentity,
    session_key: req.body.sessionKey,
    geo_regions: req.body.geoRegions,
    cloud_recording_option: req.body.cloudRecordingOption,
    cloud_recording_election: req.body.cloudRecordingElection,
    version: 1,
    iat: iat,
    exp: exp,
  };

  const sHeader = JSON.stringify(oHeader);
  const sPayload = JSON.stringify(oPayload);
  const signature = KJUR.jws.JWS.sign(
    "HS256",
    sHeader,
    sPayload,
    process.env.ZOOM_VIDEO_SDK_SECRET
  );
  console.log(signature);

  res.json({
    signature: signature,
  });
});

app.post("/whereby/delete", async (req, res) => {
  // Get API key from secure environment variable
  const apiKey = process.env.WHEREBY_API_KEY;
  if (!apiKey) {
    return res.status(401).json({ message: "Whereby API key is missing" });
  }
  console.log(req.body);
  try {
    const response = await axios.delete(
      `https://api.whereby.dev/v1/meetings/${req.body.data.meetingId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(response);

    if (response.status !== 200 && response.status !== 204) {
      throw new Error(response.data.error);
    }

    res.send("Meeting deleted");
  } catch (error) {
    console.error("Error in Whereby API request:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

app.get("/whereby", async (req, res) => {
  // Get API key from secure environment variable
  const apiKey = process.env.WHEREBY_API_KEY;
  if (!apiKey) {
    return res.status(401).json({ message: "Whereby API key is missing" });
  }
  console.log(req.query);
  try {
    const response = await axios.get(
      `https://api.whereby.dev/v1/meetings/${req.query.meetingId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    82684369;
    if (response.status !== 200 && response.status !== 204) {
      throw new Error(response.data.error);
    }

    res.send(response.data.roomUrl);
  } catch (error) {
    console.error("Error in Whereby API request:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

app.post("/whereby", async (req, res) => {
  // Get API key from secure environment variable
  const apiKey = process.env.WHEREBY_API_KEY;
  if (!apiKey) {
    return res.status(401).json({ message: "Whereby API key is missing" });
  }

  // Validate user input (if applicable)

  const data = {
    endDate: "2024-02-14T14:23:00.000Z",
    fields: ["hostRoomUrl", "viewerRoomUrl"],
  };

  try {
    const response = await axios.post(
      "https://api.whereby.dev/v1/meetings",
      data,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 201) {
      throw new Error(response.data.error);
    }

    res.json({
      response: response.data,
    });
  } catch (error) {
    console.error("Error in Whereby API request:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

app.listen(port, () =>
  console.log(
    `Zoom Video SDK Auth Endpoint Sample Node.js listening on port ${port}!`
  )
);

exports.handler = serverlessExpress({ app });
