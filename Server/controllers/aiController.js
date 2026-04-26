import dotenv from "dotenv";
dotenv.config();

// Minimal AI assistant handler with optional Gemini support
export const askAssistant = async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: "prompt is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Stubbed response if no key is configured
      return res.json({
        success: true,
        model: "stub",
        reply:
          "AI assistant is running in stub mode. Set GEMINI_API_KEY in Server/.env to enable live answers.",
      });
    }

    // Live call using fetch (avoid adding heavy deps). Adjust model as needed.
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
        encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }], role: "user" }],
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ message: "Gemini request failed", detail: text });
    }

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") ||
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response";

    res.json({ success: true, model: "gemini", reply });
  } catch (e) {
    console.error("AI assistant error:", e);
    res.status(500).json({ message: "AI assistant error" });
  }
};


