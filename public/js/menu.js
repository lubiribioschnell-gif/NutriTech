const botaoMenu = document.getElementById("botao-menu");
const linksNavbar = document.querySelector(".links-navbar");

if (botaoMenu && linksNavbar) {
    botaoMenu.addEventListener("click", () => {
        linksNavbar.classList.toggle("ativo");
    });
}