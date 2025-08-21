import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"
import { InferenceClient } from "@huggingface/inference"
import path from "path";
import { fileURLToPath } from "url";

dotenv.config()

const app = express()
const port = process.env.PORT || 8787
const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(express.json())
// console.log("HF token:", process.env.HF_ACCESS_TOKEN);
// console.log("HF token type:", typeof process.env.HF_ACCESS_TOKEN);


// Serve static frontend build in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")))
}

// Init Hugging Face client
const hf = new InferenceClient(process.env.HF_ACCESS_TOKEN)

//Route Handler
app.post("/api/recipe", async (req, res) => {
    // console.log("Incoming request body:", req.body) //devbug

    const ingredients = req.body.ingredients || []
    if (!ingredients.length) {
        return res.status(400).json({ error: "No ingredients provided" })
    }

    try {
        const response = await hf.chatCompletion({
        model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
        messages: [
            { role: "system", content: "You are a helpful recipe assistant." },
            { role: "user", content: `I have ${ingredients.join(", ")}. Give me a recipe!` }
        ],
        max_tokens: 512
        })

        // console.log("Hugging Face response:", response) // DEBUG: Log the full response
        res.json({ recipe: response.choices[0].message.content })
    } catch (err) {
        console.error("Backend error:", err) // Log the error for debugging
        res.status(500).json({ error: "Failed to get recipe" })
    }
})

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});

// Fallback: serve index.html for SPA routes
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"))
  })
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
