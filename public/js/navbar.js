document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".navbar").forEach(function (navbar) {
        const botaoMobile = navbar.querySelector(".botao-menu-mobile");
        const menu = navbar.querySelector(".menu");
        const botaoUsuario = navbar.querySelector(".botao-perfil");
        const menuUsuario = navbar.querySelector(".menu-usuario");

        if (botaoMobile && menu) {
            botaoMobile.addEventListener("click", function () {
                const aberto = menu.classList.toggle("ativo");
                botaoMobile.setAttribute("aria-expanded", String(aberto));
                botaoMobile.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
            });
            menu.querySelectorAll("a").forEach(function (link) {
                link.addEventListener("click", function () {
                    menu.classList.remove("ativo");
                    botaoMobile.setAttribute("aria-expanded", "false");
                    botaoMobile.setAttribute("aria-label", "Abrir menu");
                });
            });
        }

        if (botaoUsuario && menuUsuario) {
            botaoUsuario.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                const aberto = menuUsuario.classList.toggle("ativo");
                botaoUsuario.setAttribute("aria-expanded", String(aberto));
            });

            menuUsuario.addEventListener("click", function (event) {
                event.stopPropagation();
            });

            menuUsuario.querySelectorAll("a").forEach(function (link) {
                link.addEventListener("click", function () {
                    menuUsuario.classList.remove("ativo");
                    botaoUsuario.setAttribute("aria-expanded", "false");
                });
            });
        }
    });

    document.addEventListener("click", function () {
        document.querySelectorAll(".menu-usuario.ativo").forEach(function (menuUsuario) {
            menuUsuario.classList.remove("ativo");
            const botao = menuUsuario.parentElement.querySelector(".botao-perfil");
            if (botao) botao.setAttribute("aria-expanded", "false");
        });
    });
});
