import React from "react"
import IngredientsList from "./components/IngredientsList"
// import ChefRecipe from "./components/ChefRecipe"
import { getRecipeFromMistral, getRecipeFromMistralSafe} from "./ai"
import ChefRecipe from "./components/ChefRecipe"


export default function Main() {
    const [ingredients, setIngredient] = React.useState(
        ["chicken", "all the main spices", "corn", "heavy cream", "pasta"]
    )
    const [recipe, setRecipe] = React.useState("")
    const [loading, setLoading] = React.useState(false)

    function addIngredient(formData){
        const newIngredient = formData.get("ingredient")
        if(newIngredient){
            setIngredient(prevState => [...prevState, newIngredient])
        }
    }

    function deleteAllIngredients(){
        setIngredient("")
    }

    //Adding a loading state to improve UX experience
    async function getRecipe(){
        setLoading(true)
        try{
            const recipeMarkdown = await getRecipeFromMistralSafe(ingredients)
            setRecipe(recipeMarkdown)
        }catch(err){
            console.log(err)
        }finally{
            setLoading(false)
        }
    }
    
    return (
        <main>
            <form action={addIngredient} className="add-ingredient-form">
                <input 
                    type="text"
                    placeholder="e.g oregano"
                    aria-label="Add ingredient"
                    name="ingredient"
                />
                <button className="add-button">Add Ingredient</button>
                <button className="delete-button" onClick={deleteAllIngredients}>Delete All Ingredients</button>
            </form>

            {ingredients.length > 0 && 
                <IngredientsList
                    ingredients={ingredients}
                    getRecipe={getRecipe}
                    disabled={loading}
                />
            }
            
            {recipe && <ChefRecipe recipe={recipe} />}
        </main>
    )
}
