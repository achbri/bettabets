import express from "express";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const app = express();
app.use(express.json());

app.post("/api/ai/analyze", async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || "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"; // fallback for demo
    const { prompt } = req.body;
    
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://bettabets.com",
        "X-Title": "BettaBets AI",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {"role": "system", "content": "You are an expert soccer analyst and predictor."},
          {"role": "user", "content": prompt}
        ],
      })
    });
    
    const data = await response.json();
    res.json(data);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to generate AI response" });
  }
});

app.post("/api/ai/support", async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || "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";
    const { messages } = req.body;
    
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://bettabets.com",
        "X-Title": "BettaBets AI",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {"role": "system", "content": "You are a helpful customer support agent for BettaBets, a soccer analytics platform that offers VIP and VVIP subscription plans for predictions with secure, verified high success rates. You handle user queries nicely and concisely."},
          ...messages
        ],
      })
    });
    
    const data = await response.json();
    res.json(data);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to generate AI response" });
  }
});

app.post("/api/ai/verify-receipt", async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || "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";
    const { imageUrl } = req.body;
    
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://bettabets.com",
        "X-Title": "BettaBets AI",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-pro-vision", 
        messages: [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": "Check this payment receipt. Verify if it looks like a valid payment transaction receipt. Return only valid JSON in the format: { \"isValid\": boolean, \"amount\": number | null, \"confidence\": number, \"reason\": string }"
              },
              {
                "type": "image_url",
                "image_url": {
                  "url": imageUrl
                }
              }
            ]
          }
        ],
      })
    });
    
    const data = await response.json();
    res.json(data);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to generate AI response" });
  }
});

app.post("/api/ai/logos", async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || "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";
    const { match } = req.body;
    
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://bettabets.com",
        "X-Title": "BettaBets AI",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        response_format: { type: "json_object" },
        messages: [
          {"role": "system", "content": "You are a sports data assistant. Given a soccer match string (e.g. 'Arsenal vs Chelsea'), return a pure JSON object containing 'homeLogo' and 'awayLogo'. These should be valid URLs to the clubs' official crests/logos (Use wikimedia commons, reliable CDNs, or logo.clearbit.com guessing their official domain). Do NOT include markdown blocks. MUST return JSON like {\"homeLogo\": \"Url\", \"awayLogo\": \"Url\"}."},
          {"role": "user", "content": `Get logos for: ${match}`}
        ],
      })
    });
    
    const data = await response.json();
    res.json(data);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to fetch logos" });
  }
});

export default app;
