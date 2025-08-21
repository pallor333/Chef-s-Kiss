import ReactMarkdown from "react-markdown"

export default function ChefRecipe(props){
    return (
        <section className="suggested-recipe-container">
            <h2>The Chef's Recommendation:</h2>
            <ReactMarkdown children={props.recipe}/>
        </section>
    )
}