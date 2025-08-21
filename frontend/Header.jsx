import chefLogo from "./images/chef-emoji.png"

export default function Header() {
    return (
        <header>
            <img src={chefLogo}/>
            <h1>Chef's Kiss</h1>
        </header>
    )
}