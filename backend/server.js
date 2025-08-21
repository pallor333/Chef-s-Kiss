import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"
import { InferenceClient } from "@huggingface/inference"
import fs from 'fs';

dotenv.config()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()
const port = process.env.PORT || 8787

app.use(express.json())
// console.log("HF token:", process.env.HF_ACCESS_TOKEN);
// console.log("HF token type:", typeof process.env.HF_ACCESS_TOKEN);

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

// Serve React frontend in production
if (process.env.NODE_ENV === "production") {
    const frontendDist = path.join(__dirname, "../frontend/dist");
    console.log("Looking for frontend build at:", frontendDist); // Debug line
    app.use(express.static(frontendDist));

    app.get("/", (req, res) => { //DEBUG
        res.json({ message: "Backend is working! But frontend build might be missing." });
    });

    // DEBUG: Check if directory exists
    if (!fs.existsSync(frontendDist)) {
        console.error("❌ Frontend build directory not found!");
        console.log("Current directory contents:", fs.readdirSync(path.dirname(frontendDist)));
    } else {
        console.log("✅ Frontend build found");
        app.use(express.static(frontendDist));
        app.get('*', (req, res) => {
            res.sendFile(path.join(frontendDist, 'index.html'));
        });
    }
    // SPA fallback
    // app.get("*", (req, res) => {
    //     res.sendFile(path.join(frontendDist, "index.html"));
    // });
}


app.listen(port, () => {
console.log(`Server running on http://localhost:${port}`)
})
