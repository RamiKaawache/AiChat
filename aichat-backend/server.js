import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";

dotenv.config();
const app = express();
app.use(express.json());

// Mock Database
const coursesDB = {
  engineering: [
    "Civil Engineering",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Computer Engineering",
    "Chemical Engineering",
    "Software Engineering"
  ],
  business: [
    "Business Administration",
    "Marketing",
    "Finance",
    "Accounting",
    "Human Resources",
    "International Business"
  ],
  it: [
    "Computer Science",
    "Cybersecurity",
    "Data Science",
    "Artificial Intelligence",
    "Cloud Computing",
    "Web Development"
  ],
  arts: [
    "Graphic Design",
    "Fine Arts",
    "Music",
    "Film Studies",
    "Photography",
    "Performing Arts"
  ],
  health: [
    "Nursing",
    "Pharmacy",
    "Public Health",
    "Nutrition",
    "Medical Laboratory Science",
    "Physical Therapy"
  ],
  languages: [
    "English",
    "Spanish",
    "French",
    "Arabic",
    "German",
    "Chinese"
  ]
};

// Simple database query function

function queryDatabase(message) {
  const lower = message.toLowerCase();
  for (const [key, values] of Object.entries(coursesDB)) {
    if (lower.includes(key)) {
      return `Available ${key} courses: ${values.join(", ")}.`;
    }
  }
  return null;
}


// System prompt for LLM agent

const SYSTEM_PROMPT = `
You are a helpful customer support agent for "Learn With Us".
Always provide a response to the user.
If the user asks about courses, use database info if available.
If no info, say "I don't have that information."
`;


// Chat Route

app.post("/chat", async (req, res) => {
  const { message, history = [] } = req.body || {};

  try {
    // Step 1: Determine intent (database vs chat)
    const intentResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          { role: "system", content: "Decide if the user request needs database lookup. Reply ONLY with: 'database' or 'chat'." },
          { role: "user", content: message }
        ]
      })
    });

    const intentData = await intentResponse.json();
    console.log("Intent API response:", JSON.stringify(intentData, null, 2));

    const rawIntent = intentData?.choices?.[0]?.message?.content || "";
    const intent = rawIntent.trim().toLowerCase();
    const isDatabase = intent.includes("database");

    // Step 2: Query database if needed
    const dbResult = isDatabase ? queryDatabase(message) : null;

    // Step 3: Generate final response from LLM
    const finalResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history.map(m => ({ role: m.role, content: m.text })),
          dbResult ? { role: "system", content: `Database says: ${dbResult}` } : null,
          { role: "user", content: message }
        ].filter(Boolean) // remove nulls
      })
    });

    const data = await finalResponse.json();
    console.log("Final LLM response:", JSON.stringify(data, null, 2));

    const reply = data?.choices?.[0]?.message?.content?.trim() || "I don't have a reply for that.";
    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Server error calling OpenRouter" });
  }
});


// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
