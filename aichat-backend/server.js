const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
// const fetch = require("node-fetch");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

app.get("/", (_req, res) => res.send("AI Chat backend up"));

app.post("/chat", async (req, res) => {
  const { message, history = [] } = req.body || {};

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        // These two help attribute traffic to you (recommended by OpenRouter):
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3001",
        "X-Title": process.env.APP_NAME || "AiChat",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          ...history.map(m => ({ role: m.role, content: m.text })),
          { role: "user", content: message }
        ]
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ reply: `Provider error ${response.status}: ${errText}` });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "No reply";
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Server error calling OpenRouter" });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
