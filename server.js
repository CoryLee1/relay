require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 根路径，显示服务器状态
app.get("/", (req, res) => {
  res.json({
    status: "running",
    message: "Relay server is running",
    endpoint: "/proxy",
    method: "POST"
  });
});

app.post("/proxy", async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured" });
    }
    // 上游 API：换成你的真实端点
    const r = await fetch(`https://generativeai.googleapis.com/v1beta/image:generate?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    const text = await r.text();
    res.status(r.status).send(text);
  } catch (e) {
    res.status(500).json({ error: "relay_failed" });
  }
});

app.listen(8080, () => console.log("Relay running on 8080"));
