require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "15mb" }));   // 放大体积，避免 JSON 超限

// 新增健康检查（之前没有这个路由，curl 才看到 404）
app.get("/healthz", (_, res) => res.send("ok"));

app.get("/", (req, res) => {
  res.json({ status: "running", message: "Relay server is running", endpoint: "/proxy", method: "POST" });
});

app.post("/proxy", async (req, res) => {
    try {
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "API key not configured" });
  
      // ✅ 正确的上游端点（模型可做成环境变量）
      const BASE = "https://generativelanguage.googleapis.com/v1beta";
      const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
      const upstreamUrl = `${BASE}/models/${MODEL}:generateContent`;
  
      // ✅ 正确的鉴权头（不要用 ?key=）
      const headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      };
  
      // ✅ 正确的最小请求体（把你传进来的 prompt 适配到 contents）
      const prompt = (req.body && req.body.prompt) || "A photo of a white cat on a glass table";
      const payload = {
        contents: [{ parts: [{ text: prompt }] }]
      };
  
      console.log("[relay] ->", upstreamUrl, "prompt=", prompt.slice(0, 60));
  
      const r = await fetch(upstreamUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
  
      const ct = r.headers.get("content-type") || "application/json";
      const bodyText = await r.text();
      console.log("[relay] <-", r.status, ct, bodyText.slice(0, 300));
      res.status(r.status).set("Content-Type", ct).send(bodyText);
    } catch (e) {
      console.error("relay_failed:", e);
      res.status(500).json({ error: "relay_failed" });
    }
  });
  

app.listen(8080, () => console.log("Relay running on 8080"));
app.get("/healthz", (_, res) => res.send("ok"));

