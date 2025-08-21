import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"
import { InferenceClient } from "@huggingface/inference"

dotenv.config()

const app = express()
const port = process.env.PORT || 8787
const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(express.json())

// Serve static frontend build in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")))
}

// Init Hugging Face client
const hf = new InferenceClient({ accessToken: process.env.HF_ACCESS_TOKEN })

app.post("/api/recipe", async (req, res) => {
  const ingredients = req.body.ingredients || []
  try {
    const response = await hf.chatCompletion({
      model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
      messages: [
        { role: "system", content: "You are a helpful recipe assistant." },
        { role: "user", content: `I have ${ingredients.join(", ")}. Give me a recipe!` }
      ],
      max_tokens: 512
    })
    res.json({ recipe: response.choices[0].message.content })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to get recipe" })
  }
})

// Fallback: serve index.html for SPA routes
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"))
  })
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
