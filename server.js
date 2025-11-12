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

    // 你当前是固定打 Google v1beta image:generate，这里先保留
    const upstreamUrl = `https://generativeai.googleapis.com/v1beta/image:generate?key=${apiKey}`;

    // 打印一点关键信息到日志（Cloud Run 日志里看）
    console.log("[relay] ->", upstreamUrl, "payloadKeys=", Object.keys(req.body || {}));

    const r = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body || {})
    });

    const ct = r.headers.get("content-type") || "application/json";
    const body = await r.text();
    console.log("[relay] <-", r.status, ct, body.slice(0, 300)); // 打印前 300 字符，便于诊断

    res.status(r.status).set("Content-Type", ct).send(body);
  } catch (e) {
    console.error("relay_failed:", e);
    res.status(500).json({ error: "relay_failed" });
  }
});

app.listen(8080, () => console.log("Relay running on 8080"));
