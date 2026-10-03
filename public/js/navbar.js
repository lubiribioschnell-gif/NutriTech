document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".navbar").forEach(function (navbar) {
        var botaoMobile = navbar.querySelector(".botao-menu-mobile");
        var menu = navbar.querySelector(".menu");
        var botaoUsuario = navbar.querySelector(".botao-perfil");
        var menuUsuario = navbar.querySelector(".menu-usuario");

        if (botaoMobile && menu) {
            botaoMobile.addEventListener("click", function () {
                var aberto = menu.classList.toggle("ativo");
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
                event.stopPropagation();
                var aberto = menuUsuario.classList.toggle("ativo");
                botaoUsuario.setAttribute("aria-expanded", String(aberto));
            });

            menuUsuario.querySelectorAll("a").forEach(function (link) {
                link.addEventListener("click", function () {
                    menuUsuario.classList.remove("ativo");
                    botaoUsuario.setAttribute("aria-expanded", "false");
                });
            });

            document.addEventListener("click", function (event) {
                if (!menuUsuario.contains(event.target) && !botaoUsuario.contains(event.target)) {
                    menuUsuario.classList.remove("ativo");
                    botaoUsuario.setAttribute("aria-expanded", "false");
                }
            });
        }
    });
});
