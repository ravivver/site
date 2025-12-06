import { makeDraggable } from './drag-and-resize-utilities.js'; // Importa a função makeDraggable

const profileInfoBox = document.querySelector('.profile-info-box');
const profileHeader = document.querySelector('.profile-header');
const minimizeProfileBtn = document.querySelector('.minimize-profile');
const closeProfileBtn = document.querySelector('.close-profile');
const profileBox = document.querySelector('.nav-profile-button'); // Corrigido para .nav-profile-button
const fullscreenButton = document.querySelector('.zoom-button-new'); // Seleciona o botão de fullscreen

// Novos elementos para popups e menu "Add a Game"
const newsButton = document.querySelector('.news-button');
const notificationButton = document.querySelector('.notification-button');
const emptyContentPopup = document.getElementById('empty-content-popup'); // Reutilizado para "Access Denied"

const addGameButton = document.querySelector('.add-game-button');
const manageLinkButton = document.getElementById('manage-link-button'); // Botão Manage

// Itens do menu superior
const steamMenuItem = document.getElementById('steam-menu-item');
const viewMenuItem = document.getElementById('view-menu-item');
const friendsMenuItem = document.getElementById('friends-menu-item');
const gamesMenuItem = document.getElementById('games-menu-item');
const helpMenuItem = document.getElementById('help-menu-item'); // Item de menu Help

// Janela de Ajuda
const helpWindow = document.getElementById('help-window');
const closeHelpWindowButton = helpWindow.querySelector('.close-help-window');
const helpCommandList = document.getElementById('help-command-list');

// Array de todos os comandos (precisa ser importado ou duplicado se não puder importar do console-script)
// Para simplificar, vou duplicar aqui, mas em um projeto real, importaria.
const allConsoleCommands = [
    'clear', 'help', 'noclip', 'god', 'impulse', 'lambda', 'portal',
    'whoami', 'exec', 'sv_cheats', 'bind', 'lambda_locator', 'headcrab_hunt'
];

// Função para calcular e exibir a idade
function calculateAndDisplayAge() {
    const birthDate = new Date('2002-10-22');
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    const ageProfileElement = document.getElementById('age-profile');
    const ageConsoleElement = document.getElementById('age-console');

    if (ageProfileElement) {
        ageProfileElement.textContent = age;
    }
    if (ageConsoleElement) {
        ageConsoleElement.textContent = age;
    }
}


// Função genérica para exibir feedback (Access Denied)
function showAccessDeniedFeedback(targetElement, isFalling = false) {
    const feedbackMessage = document.createElement('div');
    feedbackMessage.className = 'access-denied-feedback';
    feedbackMessage.textContent = 'Access Denied';
    if (isFalling) {
        feedbackMessage.classList.add('desce'); // Adiciona classe para animação de descida
    }
    document.body.appendChild(feedbackMessage);

    const rect = targetElement.getBoundingClientRect();
    feedbackMessage.style.left = `${rect.left + rect.width / 2}px`;
    // Posição inicial: um pouco acima do centro do elemento para subir, ou um pouco abaixo para descer
    if (isFalling) {
        feedbackMessage.style.top = `${rect.bottom + 5}px`; // Começa um pouco abaixo do elemento
    } else {
        feedbackMessage.style.top = `${rect.top + rect.height / 2 - 20}px`; // Começa 20px acima do centro
    }
    
    // Atrasar a remoção do elemento para garantir que a animação seja visível
    setTimeout(() => {
        feedbackMessage.remove();
    }, 1500); // Remove após 1.5 segundos (duração da animação)
}


document.addEventListener('DOMContentLoaded', () => {
    calculateAndDisplayAge();
    if (profileBox && profileInfoBox) {
        profileBox.addEventListener('click', () => {
            profileInfoBox.classList.remove('hidden');
            profileInfoBox.classList.remove('minimized-profile');
            // Garante que a janela de perfil seja posicionada adequadamente ao abrir
            profileInfoBox.style.top = '5%'; 
            profileInfoBox.style.left = '37%';
            profileInfoBox.style.bottom = ''; 
            profileInfoBox.style.right = ''; 
            profileInfoBox.style.transform = ''; 
        });
    }

    // Torna a janela de perfil arrastável usando a função utilitária
    if (profileInfoBox && profileHeader) {
        makeDraggable(profileInfoBox, profileHeader);
    }

    if (minimizeProfileBtn) {
        minimizeProfileBtn.addEventListener('click', e => {
            e.stopPropagation();
            profileInfoBox.classList.toggle('minimized-profile');
        });
    }
    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', e => {
            e.stopPropagation();
            profileInfoBox.classList.add('hidden');
        });
    }

    // Lógica para o botão de Fullscreen
    if (fullscreenButton) {
        fullscreenButton.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error(`Erro ao tentar modo tela cheia: ${err.message} (${err.name})`);
                });
            } else {
                document.exitFullscreen();
            }
        });
    }

    // Lógica para Notificação/Notícias (empty content)
    function showEmptyContentPopup() {
        emptyContentPopup.classList.remove('hidden');
        emptyContentPopup.style.pointerEvents = 'auto'; // Ativa pointer-events para cliques fora
    }

    function hideEmptyContentPopup() {
        emptyContentPopup.classList.add('hidden');
        emptyContentPopup.style.pointerEvents = 'none'; // Desativa para não bloquear
    }

    if (newsButton) {
        newsButton.addEventListener('click', showEmptyContentPopup);
    }
    if (notificationButton) {
        notificationButton.addEventListener('click', showEmptyContentPopup);
    }

    // Fechar pop-up "empty-content-popup" ao clicar fora
    document.addEventListener('click', (e) => {
        if (!emptyContentPopup.classList.contains('hidden') && !emptyContentPopup.contains(e.target) && e.target !== newsButton && e.target !== notificationButton) {
            hideEmptyContentPopup();
        }
    });


    // Lógica para "Add a Game..." e "Manage"
    if (addGameButton) {
        addGameButton.addEventListener('click', (e) => {
            showAccessDeniedFeedback(e.currentTarget, false); // Sobe a mensagem
            e.stopPropagation(); // Impede que o clique se propague para o document
        });
    }

    if (manageLinkButton) {
        manageLinkButton.addEventListener('click', (e) => {
            showAccessDeniedFeedback(e.currentTarget, false); // Sobe a mensagem
            e.stopPropagation(); // Impede que o clique se propague para o document
        });
    }

    // Lógica para os itens do menu superior ("Steam", "View", "Friends", "Games")
    const topMenuItems = [steamMenuItem, viewMenuItem, friendsMenuItem, gamesMenuItem];
    topMenuItems.forEach(item => {
        if (item) {
            item.addEventListener('click', (e) => {
                showAccessDeniedFeedback(e.currentTarget, true); // Desce a mensagem
                e.stopPropagation();
            });
        }
    });

    // Lógica para a janela de Ajuda
    function showHelpWindow() {
        helpWindow.classList.remove('hidden');
        helpWindow.style.opacity = '0'; // Começa transparente para a transição
        helpWindow.style.pointerEvents = 'auto';

        // Preenche a lista de comandos
        helpCommandList.innerHTML = ''; // Limpa antes de preencher
        allConsoleCommands.forEach(command => {
            const listItem = document.createElement('li');
            listItem.textContent = command;
            helpCommandList.appendChild(listItem);
        });

        // --- Posição desejada: Topo 300px, Esquerda 100px ---
        helpWindow.style.position = 'fixed';
        helpWindow.style.top = '230px';  // Posição fixa definida pelo usuário
        helpWindow.style.left = '50px'; // Posição fixa definida pelo usuário
        helpWindow.style.right = 'auto'; // Limpa
        helpWindow.style.bottom = 'auto'; // Limpa
        helpWindow.style.transform = 'none'; // Remove qualquer centralização

        // Ativar a transição de opacidade
        setTimeout(() => {
            helpWindow.style.opacity = '1';
        }, 10); // Pequeno atraso para a transição funcionar
    }

    function hideHelpWindow() {
        helpWindow.style.opacity = '0';
        helpWindow.style.pointerEvents = 'none';
        setTimeout(() => {
            helpWindow.classList.add('hidden');
        }, 300); // Esconde depois da transição de opacidade
    }

    if (helpMenuItem) {
        helpMenuItem.addEventListener('click', (e) => {
            showHelpWindow();
            e.stopPropagation(); // Impede que o clique se propague
        });
    }

    // REMOVIDO: Este event listener para fechar a janela de ajuda ao clicar fora
    /*
    document.addEventListener('click', (e) => {
        if (!helpWindow.classList.contains('hidden') && !helpWindow.contains(e.target) && e.target !== helpMenuItem) {
            hideHelpWindow();
        }
    });
    */

    // Fechar botão 'x' na janela de ajuda
    if (closeHelpWindowButton) {
        closeHelpWindowButton.addEventListener('click', hideHelpWindow);
    }
    
    // Torna a janela de ajuda arrastável
    if (helpWindow) {
        makeDraggable(helpWindow, helpWindow.querySelector('.header'));
    }
});