// friends-list-script.js

import { makeDraggable, makeResizable } from './drag-and-resize-utilities.js';
import { openChatWindow } from './chat-script.js';

document.addEventListener('DOMContentLoaded', () => {
    const friendsButton = document.querySelector('.friends-chat-button');
    const friendsWindow = document.querySelector('.friends-list-window');
    const musicPlayerBox = document.querySelector('.music-player-box'); // Obter referência ao music player

    if (!friendsButton || !friendsWindow || !musicPlayerBox) {
        console.error('Elementos da lista de amigos ou music player não encontrados.');
        return;
    }

    const friendsHeader = friendsWindow.querySelector('.friends-header');
    const minimizeButton = friendsWindow.querySelector('.minimize-friends');
    const closeButton = friendsWindow.querySelector('.close-friends');
    const resizeHandle = friendsWindow.querySelector('.bottom-right-resize-handle');

    const onlineCountSpan = document.getElementById('online-count');
    // Adicionando um novo span para a contagem In-Game
    const inGameCountSpan = document.createElement('span');
    inGameCountSpan.id = 'ingame-count';
    const inGameCategory = friendsWindow.querySelector('.friend-category:nth-of-type(1)'); // Seleciona a categoria "In-Game"
    if (inGameCategory) {
        // Encontra o texto existente e substitui ou adiciona o span da contagem
        const currentText = inGameCategory.textContent;
        // Assume que o texto é "In-Game" e adiciona a contagem
        inGameCategory.innerHTML = `In-Game (<span id="ingame-count">0</span>)`;
    }


    const offlineCountSpan = document.getElementById('offline-count');
    const searchInput = friendsWindow.querySelector('.search-bar-container input');
    
    // Seleciona todos os itens de amigo que não são o próprio perfil
    const allFriendItems = friendsWindow.querySelectorAll('.friend-item:not(.friend-item-me)'); 
    
    // As listas <ul> dentro das categorias que contêm os amigos
    const friendLists = friendsWindow.querySelectorAll('.friends-body ul');


    // Função para atualizar a contagem de amigos
    function updateFriendCounts() {
        let actualOnlineCount = 0; // Para status "Online"
        let actualInGameCount = 0; // Para status "In-Game"
        let actualOfflineCount = 0; // Para status "Offline"
        let gmanIsVisibleAndOffline = false; // Flag para o Gman


        allFriendItems.forEach(item => {
            // Só considera o item se ele não estiver oculto pelo filtro de busca
            if (item.style.display !== 'none') {
                const statusElement = item.querySelector('.friend-status');
                if (statusElement) {
                    if (statusElement.classList.contains('status-online')) {
                        actualOnlineCount++;
                    } else if (statusElement.classList.contains('status-ingame')) {
                        actualInGameCount++;
                    } else if (statusElement.classList.contains('status-offline')) {
                        if (item.dataset.friendId === 'gman') {
                            gmanIsVisibleAndOffline = true; // Gman está visível e offline
                        }
                        actualOfflineCount++;
                    }
                }
            }
        });
        
        if (onlineCountSpan) {
            onlineCountSpan.textContent = actualOnlineCount;
        }
        if (document.getElementById('ingame-count')) { // Verifica se o span foi criado
            document.getElementById('ingame-count').textContent = actualInGameCount;
        }

        if (offlineCountSpan) {
            if (gmanIsVisibleAndOffline) {
                offlineCountSpan.textContent = '?'; // Brincadeira com Gman se ele estiver visível
            } else {
                offlineCountSpan.textContent = actualOfflineCount; // Mostra a contagem real de offline se Gman não estiver visível
            }
        }
    }

    // Função para posicionar a janela de amigos
    function positionFriendsWindow() {
        let bottomOffset = 20; // Padrão se o music player estiver escondido ou não tiver height

        // Se o music player está visível e não minimizado, ajusta a posição da friendlist
        if (!musicPlayerBox.classList.contains('hidden') && !musicPlayerBox.classList.contains('minimized-player')) {
            const playerRect = musicPlayerBox.getBoundingClientRect();
            // Posição vertical: Altura do player + espaço (20px do bottom do player + 20px de espaço entre player e friendlist)
            bottomOffset = playerRect.height + 40; 
        }
        
        friendsWindow.style.right = '65px'; // Alinha com o player
        friendsWindow.style.bottom = '300px';
    }

    // --- Lógica para ABRIR / FECHAR a janela ---
    friendsButton.addEventListener('click', () => {
        friendsWindow.classList.toggle('hidden');
        if (!friendsWindow.classList.contains('hidden')) {
            positionFriendsWindow(); // Posiciona ao abrir
            friendsWindow.classList.remove('minimized');
            updateFriendCounts();
        }
    });

    closeButton.addEventListener('click', () => {
        friendsWindow.classList.add('hidden');
    });

    // --- Lógica para MINIMIZAR a janela ---
    minimizeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        friendsWindow.classList.toggle('minimized');
        if (!friendsWindow.classList.contains('minimized')) {
            positionFriendsWindow(); // Reposiciona ao desminimizar
        }
    });

    // Torna a janela de amigos arrastável
    if (friendsWindow && friendsHeader) {
        makeDraggable(friendsWindow, friendsHeader);
    }

    // Torna a janela de amigos redimensionável
    if (friendsWindow && resizeHandle) {
        makeResizable(friendsWindow, resizeHandle, { minWidth: 200, minHeight: 150 });
    }

    // Adiciona o listener de duplo clique aos itens de amigo
    friendsWindow.addEventListener('dblclick', (e) => {
        const friendItem = e.target.closest('.friend-item');
        // Impede a abertura do chat ao clicar no seu próprio perfil
        if (friendItem && friendItem.dataset.friendId && !friendItem.classList.contains('friend-item-me')) {
            const friendId = friendItem.dataset.friendId;
            const friendName = friendItem.querySelector('.friend-name').textContent;
            const friendAvatar = friendItem.querySelector('.friend-avatar').src;
            const friendStatus = friendItem.querySelector('.friend-status').classList[1].replace('status-', '');
            
            openChatWindow(friendId, friendName, friendAvatar, friendStatus);
        }
    });

    // Lógica para a barra de busca
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            allFriendItems.forEach(item => {
                const friendName = item.querySelector('.friend-name').textContent.toLowerCase();
                if (friendName.includes(searchTerm)) {
                    item.style.display = 'flex'; // Mostra o amigo
                } else {
                    item.style.display = 'none'; // Oculta o amigo
                }
            });
            updateFriendCounts(); // Atualiza a contagem após filtrar
        });
    }

    // Posiciona a janela de amigos uma vez ao carregar
    if (!friendsWindow.classList.contains('hidden')) {
        positionFriendsWindow();
        updateFriendCounts();
    }

    // Ouve o evento de redimensionamento da janela para ajustar a posição
    window.addEventListener('resize', () => {
        if (!friendsWindow.classList.contains('hidden') && !friendsWindow.classList.contains('minimized')) {
            positionFriendsWindow();
        }
    });
    
    // Ouve mudanças na visibilidade/tamanho do music player para ajustar a posição da friends list
    const musicPlayerObserver = new MutationObserver(() => {
        if (!friendsWindow.classList.contains('hidden') && !friendsWindow.classList.contains('minimized')) {
            positionFriendsWindow();
        }
    });
    // Observa mudanças de estilo (display, width, height) no musicPlayerBox
    musicPlayerObserver.observe(musicPlayerBox, { attributes: true, attributeFilter: ['class', 'style'] });


    // Observa mudanças nos elementos da lista de amigos para atualizar a contagem dinamicamente
    const observer = new MutationObserver(updateFriendCounts);
    const config = { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] }; 
    
    friendLists.forEach(ul => {
        observer.observe(ul, config);
    });
    
    // Atualiza a contagem uma vez no carregamento completo do DOM
    updateFriendCounts();
});