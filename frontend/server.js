import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { InferenceClient } from '@huggingface/inference'

const app = express()

// --- Basic hardening ---
app.use(express.json({ limit: '1mb' }))
app.use(cors({
  origin: ['http://localhost:5173'], // Vite default
  methods: ['POST'],
}))
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // 10 requests/min/IP
})
app.use(limiter)

// --- Init SDKs (server-only) ---
const hfKey = process.env.VITE_HF_ACCESS_TOKEN
const MOCK = String(process.env.MOCK_RESPONSES).toLowerCase() === 'true'

const hf = hfKey ? new InferenceClient({ accessToken: hfKey }) : null

// --- Shared prompt ---
const SYSTEM_PROMPT = `
You are an assistant that receives a list of ingredients that a user has and suggests a recipe they could make with some or all of those ingredients. You don't need to use every ingredient they mention in your recipe. The recipe can include additional ingredients they didn't mention, but try not to include too many extra ingredients. Format your response in markdown to make it easier to render to a web page.
`.trim()

// --- Small input guard ---
function sanitizeIngredients(ing) {
  if (!Array.isArray(ing)) return []
  const trimmed = ing
    .map(s => String(s ?? '').trim())
    .filter(Boolean)
    .slice(0, 50) // cap count
  const totalLen = trimmed.join(', ').length
  if (totalLen > 2000) return trimmed.join(', ').slice(0, 2000).split(', ')
  return trimmed
}

// --- Mock response helper ---
function mockRecipe(ingredientsArr) {
  const ingredientsString = ingredientsArr.join(', ')
  return `
## 🍲 Mock: Pantry Pasta

**Uses:** ${ingredientsString}

**Ingredients (extras):** Olive oil, garlic, chili flakes, salt, pepper

**Instructions**
1. Boil pasta; reserve a cup of starchy water.
2. Sauté garlic in olive oil; add chili flakes.
3. Toss in your ingredients (${ingredientsString}); season.
4. Add pasta + splash of pasta water to make it glossy.
5. Serve with pepper and any herbs you have.
`.trim()
}

// --- Routes ---

// Hugging Face (Mixtral) proxy
app.post('/api/recipe/hf', async (req, res) => {
  try {
    const ingredients = sanitizeIngredients(req.body.ingredients)
    if (!ingredients.length) {
      return res.status(400).json({ error: 'ingredients must be a non-empty array of strings' })
    }

    if (MOCK || !hf) {
      return res.json({ recipe: mockRecipe(ingredients), source: 'mock' })
    }

    const ingredientsString = ingredients.join(', ')
    const response = await hf.chatCompletion({
      model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `I have ${ingredientsString}. Please give me a recipe you'd recommend I make!` },
      ],
      max_tokens: 1024,
    })

    const recipe = response?.choices?.[0]?.message?.content
    if (!recipe) throw new Error('No content returned from HF')

    res.json({ recipe, source: 'hf' })
  } catch (err) {
    console.error('HF error:', err)
    res.status(500).json({ error: 'Failed to generate recipe (HF)' })
  }
})

const port = Number(process.env.PORT) || 8787
app.listen(port, () => {
  console.log(`Recipe backend running on http://localhost:${port}`)
})
