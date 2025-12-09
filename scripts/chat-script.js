// chat-script.js

import { makeDraggable, makeResizable } from './drag-and-resize-utilities.js';

let chatWindowTemplate = document.querySelector('.chat-window[data-chat-id="template"]');
let chatTabsContainer = document.getElementById('chat-tabs-container');
let messagesContainer = chatWindowTemplate.querySelector('.messages-container');
let chatInput = chatWindowTemplate.querySelector('.chat-input');
let sendMessageButton = chatWindowTemplate.querySelector('.send-message-button');

const chatWindows = new Map();
let activeChatId = null;
let chatWindowInstance = null;

// Mensagens automáticas para cada amigo, a serem enviadas APENAS na primeira vez
const autoMessagesSequences = {
    'dream': ["tulepera con la papaya", "https://v0-yuri-portofolio-design.vercel.app"],
    'cloro': ["Hallo mein Freund", "https://clw.ro"], // "olá meu amigo" em alemão
    'gman': [
        "You’ve proved yourself a decisive man, so I don’t expect you’ll have any trouble deciding what to do. If you’re interested, just step into the portal and I will take that as a yes.",
        "Otherwise... well... I can offer you a battle you have no chance of winning. Rather an anticlimax, after what you’ve just survived.",
        "Time to choose."
    ]
};

// Objeto para armazenar os limites da área principal
let mainAreaBoundsElement = null; // Será definido no DOMContentLoaded

function getStatusColorClass(status) {
    switch (status) {
        case 'online': return 'chat-name-online';
        case 'ingame': return 'chat-name-ingame';
        case 'offline': return 'chat-name-offline';
        default: return '';
    }
}

// Função para enviar uma mensagem automática com atraso
function sendAutoMessage(friendId, friendName, friendAvatar, friendStatus, messageIndex = 0) {
    const messages = autoMessagesSequences[friendId];
    if (!messages || messageIndex >= messages.length) {
        return; // Todas as mensagens foram enviadas ou não há mensagens para este amigo
    }

    const messageText = messages[messageIndex];
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const message = {
        text: messageText,
        senderName: friendName,
        senderAvatar: friendAvatar,
        time: timeString,
        isSelf: false, // Mensagem enviada pelo "amigo"
        senderStatus: friendStatus
    };

    const chatData = chatWindows.get(friendId);
    if (chatData) {
        chatData.messages.push(message);
        // Renderiza a mensagem APENAS se o chat for o ativo
        if (activeChatId === friendId) {
            messagesContainer.appendChild(createChatMessageElement(
                message.text, 
                message.senderName, 
                message.senderAvatar, 
                message.time, 
                message.isSelf, 
                message.senderStatus
            ));
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // Envia a próxima mensagem após um atraso (3 segundos)
        setTimeout(() => {
            sendAutoMessage(friendId, friendName, friendAvatar, friendStatus, messageIndex + 1);
        }, 3000); // 3 segundos entre mensagens
    }
}


export function openChatWindow(friendId, friendName, friendAvatar, friendStatus) {
    if (!chatWindowInstance) {
        chatWindowInstance = chatWindowTemplate.cloneNode(true);
        chatWindowInstance.removeAttribute('data-chat-id');
        chatWindowInstance.classList.remove('hidden');
        document.body.appendChild(chatWindowInstance);

        // Posicionamento inicial fixo para a janela de chat
        chatWindowInstance.style.position = 'fixed';
        chatWindowInstance.style.bottom = '100px';
        chatWindowInstance.style.right = '350px';

        // Re-selecionar elementos para a NOVA instância da janela de chat
        chatTabsContainer = chatWindowInstance.querySelector('#chat-tabs-container');
        messagesContainer = chatWindowInstance.querySelector('.messages-container');
        chatInput = chatWindowInstance.querySelector('.chat-input');
        sendMessageButton = chatWindowInstance.querySelector('.send-message-button');

        // Adicionar listeners para arrastar e redimensionar à nova instância
        makeDraggable(chatWindowInstance, chatWindowInstance.querySelector('.chat-header'), null, null, null, mainAreaBoundsElement);
        makeResizable(chatWindowInstance, chatWindowInstance.querySelector('.bottom-right-resize-handle'), { minWidth: 300, minHeight: 220 }, null, null, null, mainAreaBoundsElement);

        // Adicionar listeners de controle da janela principal (minimizar/fechar)
        chatWindowInstance.querySelector('.minimize-chat').addEventListener('click', () => {
            chatWindowInstance.classList.toggle('minimized-chat');
        });
        chatWindowInstance.querySelector('.close-chat').addEventListener('click', () => {
            chatWindowInstance.classList.add('hidden');
            chatTabsContainer.innerHTML = '';
            messagesContainer.innerHTML = '';
            chatWindows.clear();
            activeChatId = null;
            if (chatWindowInstance.parentNode) {
                chatWindowInstance.parentNode.removeChild(chatWindowInstance);
            }
            chatWindowInstance = null;
        });

    } else {
        chatWindowInstance.classList.remove('hidden');
        chatWindowInstance.classList.remove('minimized-chat');
    }

    // Se o chat já está aberto, apenas o selecione
    if (chatWindows.has(friendId)) {
        selectChatTab(friendId);
        return;
    }

    // Adicionar nova aba e conteúdo do chat
    addNewChatTab(friendId, friendName, friendAvatar, friendStatus);
    
    // Armazenar o estado inicial do chat (messages, firstVisit flag, and friend data)
    chatWindows.set(friendId, {
        messages: [],
        firstVisit: true, // Flag para controlar a mensagem automática
        friendName: friendName, // Armazenar o nome do amigo
        friendAvatar: friendAvatar, // Armazenar o avatar do amigo
        friendStatus: friendStatus // Armazenar o status do amigo
    });

    selectChatTab(friendId); // Seleciona o chat recém-adicionado
}

function addNewChatTab(friendId, friendName, friendAvatar, friendStatus) {
    const chatTab = document.createElement('div');
    chatTab.classList.add('chat-tab');
    chatTab.dataset.friendId = friendId;

    const avatarImg = document.createElement('img');
    avatarImg.classList.add('tab-avatar');
    avatarImg.src = friendAvatar;
    avatarImg.alt = 'Avatar';

    const nameSpan = document.createElement('span');
    nameSpan.classList.add('tab-name');
    nameSpan.classList.add(getStatusColorClass(friendStatus));
    nameSpan.textContent = friendName;

    const closeTabButton = document.createElement('button');
    closeTabButton.classList.add('tab-close-button');
    closeTabButton.textContent = '×';
    closeTabButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Impede que o clique da aba selecione a aba
        closeChatTab(friendId);
    });

    chatTab.appendChild(avatarImg);
    chatTab.appendChild(nameSpan);
    chatTab.appendChild(closeTabButton);

    chatTab.addEventListener('click', () => {
        selectChatTab(friendId);
    });
    // Adiciona listener para middle-click na aba
    chatTab.addEventListener('auxclick', (e) => {
        if (e.button === 1) { // Botão do meio do mouse (middle-click)
            e.preventDefault(); // Previne o comportamento padrão do middle-click (ex: abrir em nova aba)
            closeChatTab(friendId);
        }
    });

    chatTabsContainer.appendChild(chatTab);
}

function selectChatTab(friendId) {
    chatTabsContainer.querySelectorAll('.chat-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    const selectedTab = chatTabsContainer.querySelector(`.chat-tab[data-friend-id="${friendId}"]`);
    if (selectedTab) {
        selectedTab.classList.add('active');
        sendMessageButton.onclick = () => sendChatMessage(friendId);
        chatInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                sendChatMessage(friendId);
            }
        };
    } else {
        console.warn(`[Chat] Aba para ${friendId} não encontrada para selecionar.`);
    }

    messagesContainer.innerHTML = ''; // Limpar o conteúdo atual
    const chatData = chatWindows.get(friendId);
    if (chatData) {
        chatData.messages.forEach(msg => {
            messagesContainer.appendChild(createChatMessageElement(msg.text, msg.senderName, msg.senderAvatar, msg.time, msg.isSelf, msg.senderStatus));
        });

        // Lógica para enviar mensagem automática APENAS na primeira visita do chat
        if (chatData.firstVisit && autoMessagesSequences[friendId]) {
            // Inicia o envio da sequência de mensagens após 3 segundos
            setTimeout(() => {
                sendAutoMessage(friendId, chatData.friendName, chatData.friendAvatar, chatData.friendStatus);
            }, 3000); // Atraso de 3 segundos entre mensagens
            chatData.firstVisit = false; // Marca como visitado, para não enviar novamente
        }

    } else {
        console.warn(`[Chat] Dados de chat para ${friendId} não encontrados.`);
    }
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    activeChatId = friendId;
}

function closeChatTab(friendId) {
    const tabToClose = chatTabsContainer.querySelector(`.chat-tab[data-friend-id="${friendId}"]`);
    if (tabToClose) {
        tabToClose.remove();
        chatWindows.delete(friendId);

        if (activeChatId === friendId) {
            const remainingTabs = chatTabsContainer.querySelectorAll('.chat-tab');
            if (remainingTabs.length > 0) {
                selectChatTab(remainingTabs[0].dataset.friendId);
            } else {
                messagesContainer.innerHTML = '';
                chatInput.value = ''; // Limpa o input também
                activeChatId = null;
                chatWindowInstance.classList.add('hidden');
                if (chatWindowInstance.parentNode) {
                    chatWindowInstance.parentNode.removeChild(chatWindowInstance);
                }
                chatWindowInstance = null;
            }
        }
    } else {
        console.warn(`[Chat] Aba para ${friendId} não encontrada para fechar.`);
    }
}

function sendChatMessage(targetFriendId) {
    const messageText = chatInput.value.trim();
    if (messageText === '') return;

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const myAvatar = document.querySelector('.profile-pic').src;
    const myName = document.querySelector('.profile-name').textContent;

    const message = {
        text: messageText,
        senderName: myName,
        senderAvatar: myAvatar,
        time: timeString,
        isSelf: true,
        senderStatus: 'online'
    };

    const chatData = chatWindows.get(targetFriendId);
    if (chatData) {
        chatData.messages.push(message);
        if (activeChatId === targetFriendId) {
            messagesContainer.appendChild(createChatMessageElement(message.text, message.senderName, message.senderAvatar, message.time, message.isSelf, message.senderStatus));
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    chatInput.value = ''; // Limpa o input
}

function createChatMessageElement(text, senderName, senderAvatar, time, isSelf, senderStatus) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message');
    if (isSelf) {
        messageDiv.classList.add('self');
    } else {
        messageDiv.classList.add('other');
    }

    const avatarImg = document.createElement('img');
    avatarImg.classList.add('message-avatar');
    avatarImg.src = senderAvatar;
    avatarImg.alt = 'Avatar';

    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('message-content-wrapper');

    const headerSpan = document.createElement('span');
    headerSpan.classList.add('message-header');
    headerSpan.textContent = senderName;
    headerSpan.classList.add(getStatusColorClass(senderStatus));

    const timeSpan = document.createElement('span');
    timeSpan.classList.add('message-time');
    timeSpan.textContent = `(${time})`;
    headerSpan.appendChild(timeSpan);

    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    messageContent.innerHTML = formatMessageText(text);

    contentWrapper.appendChild(headerSpan);
    contentWrapper.appendChild(messageContent);

    messageDiv.appendChild(avatarImg);
    messageDiv.appendChild(contentWrapper);

    return messageDiv;
}

function formatMessageText(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => `<a href="${url}" target="_blank">${url}</a>`);
}

window.addEventListener('resize', () => {
    if (chatWindowInstance && !chatWindowInstance.classList.contains('hidden')) {
        // Atualiza a referência do elemento mainAreaBoundsElement e suas dimensões
        mainAreaBoundsElement = document.getElementById('mainUI'); 
        // Nada de novo aqui, apenas para manter
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Define mainAreaBoundsElement no DOMContentLoaded
    mainAreaBoundsElement = document.getElementById('mainUI'); 
});