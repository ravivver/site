// scripts/easter-eggs.js

document.addEventListener('DOMContentLoaded', () => {
    const gmanImage = document.getElementById('gman-easter-egg');
    let gmanTimeout;

    function showGmanRandomly() {
        if (!gmanImage) return;

        // Limpa qualquer timeout anterior para evitar múltiplos Gmans
        clearTimeout(gmanTimeout);

        // Garante que o Gman esteja dentro dos limites da tela
        const maxX = window.innerWidth - gmanImage.offsetWidth;
        const maxY = window.innerHeight - gmanImage.offsetHeight;
        
        const randomX = Math.random() * maxX;
        const randomY = Math.random() * maxY;

        gmanImage.style.left = `${randomX}px`;
        gmanImage.style.top = `${randomY}px`;
        gmanImage.style.opacity = '1';
        gmanImage.style.pointerEvents = 'auto'; // Habilita cliques enquanto visível

        gmanTimeout = setTimeout(() => {
            gmanImage.style.opacity = '0';
            gmanImage.style.pointerEvents = 'none'; // Desabilita cliques após sumir
        }, 1000); // Gman visível por 1 segundo
    }

    // Função para adicionar uma chance de Gman aparecer ao clicar em certos botões
    const mainButtons = document.querySelectorAll('.friends-chat-button, .console-button, .music-player-open-button');
    mainButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (Math.random() < 0.15) { // 15% de chance de Gman aparecer ao clicar
                showGmanRandomly();
            }
        });
    });

    // Você pode adicionar outras condições para o Gman aparecer aqui,
    // como uma chance a cada X segundos ou ao rolar a página etc.
    // Exemplo: Aparecer a cada 30 segundos (com chance)
    // setInterval(() => {
    //     if (Math.random() < 0.05) { // 5% de chance a cada 30s
    //         showGmanRandomly();
    //     }
    // }, 30000);
});