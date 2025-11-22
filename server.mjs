import express from "express";
import session from "express-session";
import axios from "axios";

const app = express();
app.use(express.json());

app.use(
  session({
    secret: "mysecret",
    resave: false,
    saveUninitialized: true,
  })
);

// ---- YOUR STRAVA KEYS ----
const CLIENT_ID = "186600";
const CLIENT_SECRET = "06cb2aaadee1469c55a4fd1a86fe2d708f2852ab";
const REDIRECT_URI = "https://brooks-incondite-jabberingly.ngrok-free.dev/exchange_token";

// ---------------------------

// STEP 1: START LOGIN
app.get("/auth", (req, res) => {
  const url = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&approval_prompt=auto&scope=read,activity:read_all`;

  res.redirect(url);
});

// STEP 2: RECEIVE CODE AND EXCHANGE TOKEN
app.get("/exchange_token", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.send("No code received");
  }

  try {
    const response = await axios.post("https://www.strava.com/oauth/token", {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    });

    // save token in session
    req.session.access_token = response.data.access_token;

    res.send("Authentication successful! Now visit /activities");
  } catch (err) {
    console.error("Token exchange error:", err.response?.data);
    res.send("Token exchange failed.");
  }
});

// STEP 3: FETCH ACTIVITIES
app.get("/activities", async (req, res) => {
  const token = req.session.access_token;

  if (!token) {
    return res.send("Not authenticated. Go to /auth");
  }

  try {
    const response = await axios.get(
      "https://www.strava.com/api/v3/athlete/activities",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data);
    res.send("Error fetching activities.");
  }
});

app.listen(8080, () => console.log("Server running on 8080"));
