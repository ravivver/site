// console-script.js

import { makeDraggable, makeResizable } from './drag-and-resize-utilities.js';

let defaultConsoleContent = '';
let lambdaIcon = null;
let headcrabHuntContainer = null;
let headcrabs = [];
let score = 0;
let gameInterval;
let gameDuration = 15000; // 15 segundos de jogo
let headcrabSpawnInterval; // Intervalo para spawn de headcrabs (se usado)

let consoleInput; // Variável para o input do console
let consoleSuggestionsContainer; // Variável para o container de sugestões
let consoleSuggestionsOuterContainer; // Variável para o outer container
let consoleBox; // Precisa ser global para usar no posicionamento das sugestões
let currentSuggestionIndex = -1; // Para navegação com teclado
let consoleSubmitBtn; // Variável para o botão de submit

// Objeto para armazenar os limites da área principal (será o mainUI)
let mainAreaBoundsElement = null; // Será definido no DOMContentLoaded

// Lista de todos os comandos disponíveis para a sugestão
const allCommands = [
    'clear', 'help', 'noclip', 'god', 'impulse', 'lambda', 'portal',
    'whoami', 'exec', 'sv_cheats', 'bind', 'lambda_locator', 'headcrab_hunt'
];

function showCopyFeedback(targetElement) {
    if (!targetElement) return;
    const feedbackMessage = document.createElement('div');
    feedbackMessage.className = 'copy-feedback-dynamic';
    feedbackMessage.textContent = 'Copied!';
    document.body.appendChild(feedbackMessage);
    const rect = targetElement.getBoundingClientRect();
    feedbackMessage.style.left = `${rect.left + rect.width / 2}px`;
    feedbackMessage.style.top = `${rect.top + rect.height / 2 - 30}px`;
    setTimeout(() => {
        feedbackMessage.remove();
    }, 1500); // Remove após 1.5 segundos (duração da animação)
}

// Função para atualizar as sugestões em tempo real
function updateSuggestions() {
    const inputText = consoleInput.value.toLowerCase().trim();
    consoleSuggestionsContainer.innerHTML = ''; // Limpa sugestões antigas
    currentSuggestionIndex = -1; // Reseta o índice de seleção

    if (inputText.length === 0) {
        consoleSuggestionsOuterContainer.classList.add('hidden'); // Esconde o outer container
        return;
    }

    const matchingCommands = allCommands.filter(cmd => cmd.startsWith(inputText));

    if (matchingCommands.length > 0) {
        matchingCommands.forEach((cmd, index) => {
            const suggestionItem = document.createElement('div');
            suggestionItem.classList.add('suggestion-item');
            suggestionItem.textContent = cmd;
            suggestionItem.dataset.command = cmd; // Armazena o comando completo

            suggestionItem.addEventListener('click', () => {
                consoleInput.value = cmd; // Preenche o input com a sugestão
                consoleSuggestionsOuterContainer.classList.add('hidden'); // Esconde o outer container
                consoleInput.focus(); // Mantém o foco no input
            });
            consoleSuggestionsContainer.appendChild(suggestionItem);
        });
        consoleSuggestionsOuterContainer.classList.remove('hidden'); // Mostra o outer container
        positionSuggestionsContainer(); // Posiciona as sugestões
    } else {
        consoleSuggestionsOuterContainer.classList.add('hidden'); // Esconde o outer container
    }
}

// Função para posicionar o contêiner de sugestões
function positionSuggestionsContainer() {
    // Só posiciona se o console estiver visível e não minimizado, E se a barra de sugestões não estiver escondida por updateSuggestions
    if (consoleBox.classList.contains('hidden') || consoleBox.classList.contains('minimized-console') || consoleSuggestionsOuterContainer.classList.contains('hidden')) {
        return;
    }

    const inputRect = consoleInput.getBoundingClientRect();
    // Ajusta a largura para ser a mesma do consoleInput
    // Ajusta o top com um padding maior
    const outerWidth = inputRect.width; 
    const topOffset = inputRect.bottom + 15; // Aumentado o espaço para 15px

    consoleSuggestionsOuterContainer.style.left = `${inputRect.left}px`;
    consoleSuggestionsOuterContainer.style.top = `${topOffset}px`;
    consoleSuggestionsOuterContainer.style.width = `${outerWidth}px`; 
}


// FUNÇÃO EXISTENTE: sendMessageToConsole
function sendMessageToConsole() {
    const consoleOutput = document.querySelector('.console-output');
    if (!consoleInput || !consoleOutput) return;

    let message = consoleInput.value.trim(); // Pega a mensagem do input
    consoleInput.value = ''; // Limpa o input após enviar
    consoleSuggestionsOuterContainer.classList.add('hidden'); // Esconde o outer container
    currentSuggestionIndex = -1; // Reseta o índice de seleção

    if (defaultConsoleContent === '') defaultConsoleContent = consoleOutput.innerHTML;

    const newMessageElement = document.createElement('p');
    newMessageElement.textContent = `> ${message}`;
    consoleOutput.appendChild(newMessageElement);

    // Lógica para comandos do console
    const responseElement = document.createElement('p');
    responseElement.style.color = '#a2c490'; // Cor de resposta do console
    
    const fullCommandLower = message.toLowerCase(); // Comando completo em minúsculas
    const commandParts = fullCommandLower.split(' ');
    const mainCommand = commandParts[0];
    const argument = commandParts[1]; // Pega o argumento, se houver

    if (message.trim() === '') {
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
        return;
    }

    // Flag para saber se o comando foi reconhecido por um case específico
    let commandRecognized = false;

    // AVALIAÇÃO DOS COMANDOS
    if (fullCommandLower === 'clear') {
        consoleOutput.innerHTML = defaultConsoleContent;
        commandRecognized = true;
    } else if (fullCommandLower === 'help') {
        responseElement.innerHTML = `&gt; Available commands:<br>
        &gt; clear - Clears the console output.<br>
        &gt; help - Displays this help message.<br>
        &gt; noclip - Activates/deactivates noclip mode. (Visual only)<br>
        &gt; god - Activates/deactivates god mode. (Visual only)<br>
        &gt; impulse 101 - Gives all weapons. (Visual only)<br>
        &gt; lambda - Displays a message about Lambda. (Half-Life)<br>
        &gt; portal - Initiates a portal sequence. (Visual only)<br>
        &gt; whoami - Displays current user info.<br>
        &gt; exec - Executes the config file. (Not really)<br>
        &gt; sv_cheats [0/1] - Enables/Disables cheats.<br>
        &gt; bind [key] \"command\" - Binds a command to a key.<br>
        &gt; lambda_locator - Activates the Lambda locator.<br>
        &gt; headcrab_hunt [0/1] - Starts/Stops the Headcrab Hunt mini-game.<br>`;
        consoleOutput.appendChild(responseElement);
        commandRecognized = true;
    } else if (fullCommandLower === 'noclip') {
        responseElement.textContent = "> Noclip ON. You can fly now (in your imagination).";
        consoleOutput.appendChild(responseElement);
        commandRecognized = true;
    } else if (fullCommandLower === 'god') {
        responseElement.textContent = "> God mode ON. You are invincible (to web elements).";
        consoleOutput.appendChild(responseElement);
        commandRecognized = true;
    } else if (fullCommandLower === 'lambda') {
        responseElement.textContent = "> The right man in the wrong place can make all the difference in the world.";
        consoleOutput.appendChild(responseElement);
        commandRecognized = true;
    } else if (fullCommandLower === 'portal') {
        responseElement.innerHTML = `&gt; Initiating portal sequence...<br>
        &gt; WARNING: Dimensional instability detected. Proceed with caution.`;
        consoleOutput.appendChild(responseElement);
        commandRecognized = true;
    } else if (fullCommandLower === 'whoami') {
        const profileName = document.querySelector('.profile-name').textContent;
        const profileBio = document.querySelector('.profile-bio-text').textContent;
        const profileAge = document.querySelector('.profile-level-badge span').textContent;
        responseElement.innerHTML = `&gt; Name: ${profileName}<br>
        &gt; Age: ${profileAge}<br>
        &gt; Bio: ${profileBio}`;
        consoleOutput.appendChild(responseElement);
        commandRecognized = true;
    }
    // Comandos com argumentos ou explicações (usando if/else if para melhor controle de fluxo)
    else if (mainCommand === 'impulse') {
        if (fullCommandLower === 'impulse 101') {
            responseElement.textContent = "> Impulse 101: All weapons acquired! (Just kidding, it's a browser).";
        } else if (!argument) {
             responseElement.textContent = "> Usage: impulse <number> - Specific impulses trigger various game events. Try 'impulse 101'.";
        } else {
            responseElement.textContent = "> Impulse command not recognized. Try 'impulse 101'.";
        }
        consoleOutput.appendChild(responseElement);
        commandRecognized = true;
    } else if (mainCommand === 'exec') {
        if (fullCommandLower === 'exec config.cfg') {
            responseElement.textContent = "> Executing user config... Nothing found here, Mr. Freeman.";
        } else if (!argument) {
            responseElement.textContent = "> Usage: exec <filename.cfg> - Executes a configuration script file.";
        } else {
            responseElement.textContent = `> Exec: file '${message.substring(5).trim()}' not found.`;
        }
        consoleOutput.appendChild(responseElement);
        commandRecognized = true;
    } else if (mainCommand === 'sv_cheats') {
        if (fullCommandLower === 'sv_cheats 1') {
            responseElement.textContent = "> Cheats enabled! Prepare for unforeseen consequences.";
        } else if (fullCommandLower === 'sv_cheats 0') {
            responseElement.textContent = "> Cheats disabled. Back to normal operations.";
        } else if (!argument) { // Se for só "sv_cheats"
            responseElement.textContent = "> Usage: sv_cheats [0|1] - Enables or disables cheats in the game.";
        } else { // Argumento inválido para sv_cheats
            responseElement.textContent = "> Usage: sv_cheats [0|1] - Invalid argument.";
        }
        consoleOutput.appendChild(responseElement);
        commandRecognized = true;
    } else if (mainCommand === 'bind') {
        if (commandParts.length === 1) { // Só "bind"
            responseElement.textContent = "> Usage: bind <key> \"command\" - Binds a command to a key.";
        } else {
            const parts = message.split('"');
            if (parts.length === 3 && fullCommandLower.startsWith('bind ')) {
                const key = message.split(' ')[1];
                const command = parts[1];
                responseElement.textContent = `> Bound "${command}" to key "${key}". Good luck, you'll need it.`;
            } else {
                responseElement.textContent = "> Bind command format: bind [key] \"command\"";
            }
        }
        consoleOutput.appendChild(responseElement);
        commandRecognized = true;
    } else if (mainCommand === 'lambda_locator') {
        triggerLambdaLocator();
        responseElement.textContent = "> Lambda locator activated.";
        consoleOutput.appendChild(responseElement);
        commandRecognized = true;
    } else if (mainCommand === 'headcrab_hunt') {
        if (commandParts.length === 1) { // Só "headcrab_hunt"
            responseElement.textContent = "> Usage: headcrab_hunt [0|1] - Starts (1) or stops (0) the Headcrab Hunt mini-game.";
        } else if (argument === '1') {
            startHeadcrabHunt();
            responseElement.textContent = "> Headcrab Hunt initiated!";
        } else if (argument === '0') {
            endHeadcrabHunt(true); // Chama a função para terminar o jogo e esconder
            responseElement.textContent = "> Headcrab Hunt stopped.";
        } else {
            responseElement.textContent = "> Usage: headcrab_hunt [0|1] - Invalid argument.";
        }
        consoleOutput.appendChild(responseElement);
        commandRecognized = true;
    }

    // Se o comando não foi reconhecido por nenhum dos 'if/else if' acima
    // E o comando principal NÃO está na lista de `allCommands` (para não mostrar "unknown" para sugestões parciais)
    const isMainCommandKnown = allCommands.includes(mainCommand); // Verifica se o comando principal é conhecido
    
    if (!commandRecognized && !isMainCommandKnown) { 
        responseElement.style.color = '#FF4500'; // Vermelho para comando não reconhecido
        responseElement.textContent = `> Unknown command: ${message}`;
        consoleOutput.appendChild(responseElement);
    }
    
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// Lógica do Lambda Locator
function triggerLambdaLocator() {
    let lambdaIcon = document.getElementById('lambda-locator-icon');
    if (!lambdaIcon) {
        lambdaIcon = document.createElement('img');
        lambdaIcon.id = 'lambda-locator-icon';
        lambdaIcon.src = 'images/lambda.png';
        lambdaIcon.style.position = 'fixed';
        lambdaIcon.style.width = '50px';
        lambdaIcon.style.height = '50px';
        lambdaIcon.style.zIndex = '1000';
        lambdaIcon.style.transition = 'opacity 0.5s ease-in-out';
        lambdaIcon.style.opacity = '0';
        lambdaIcon.style.pointerEvents = 'none';
        document.body.appendChild(lambdaIcon);
    }

    const maxX = window.innerWidth - lambdaIcon.offsetWidth;
    const maxY = window.innerHeight - lambdaIcon.offsetHeight;
    const randomX = Math.random() * maxX;
    const randomY = Math.random() * maxY;

    lambdaIcon.style.left = `${randomX}px`;
    lambdaIcon.style.top = `${randomY}px`;
    lambdaIcon.style.opacity = '1';
    lambdaIcon.style.pointerEvents = 'auto';

    setTimeout(() => {
        lambdaIcon.style.opacity = '0';
        lambdaIcon.style.pointerEvents = 'none';
    }, 2000);
}

// Lógica do Headcrab Hunt
function startHeadcrabHunt() {
    if (!headcrabHuntContainer) {
        headcrabHuntContainer = document.getElementById('headcrab-hunt-container');
    }
    if (!headcrabHuntContainer) {
        console.error("Headcrab Hunt container not found in HTML.");
        return;
    }
    
    endHeadcrabHunt(false); // Não esconde o container, apenas limpa e reseta
    
    score = 0;
    headcrabs = [];
    headcrabHuntContainer.innerHTML = `<div id="headcrab-hunt-score">Score: 0</div>`;
    
    // Timer do jogo
    let timeLeft = gameDuration / 1000;
    const gameTimerElement = document.createElement('div');
    gameTimerElement.id = 'headcrab-hunt-timer';
    gameTimerElement.textContent = `Time: ${timeLeft}s`;
    gameTimerElement.style.fontSize = '1.5em';
    gameTimerElement.style.color = 'yellow';
    headcrabHuntContainer.appendChild(gameTimerElement);

    headcrabHuntContainer.style.display = 'flex'; // Mostra o container do jogo

    // Cria headcrabs iniciais
    for (let i = 0; i < 3; i++) {
        createHeadcrab();
    }

    clearInterval(gameInterval); // Limpa qualquer intervalo anterior do jogo
    gameInterval = setInterval(() => {
        timeLeft--;
        gameTimerElement.textContent = `Time: ${timeLeft}s`;
        if (timeLeft <= 0) {
            endHeadcrabHunt(true); // Esconde no final do tempo
        } else {
            if (Math.random() < 0.5) { // 50% de chance de spawnar a cada segundo
                createHeadcrab();
            }
        }
    }, 1000);
}

function createHeadcrab() {
    const headcrab = document.createElement('img');
    headcrab.src = 'images/headcrab.png'; // Certifique-se de ter a imagem
    headcrab.className = 'headcrab';
    
    // Posicionamento aleatório dentro dos limites do headcrabHuntContainer
    const containerRect = headcrabHuntContainer.getBoundingClientRect();
    const headcrabSize = 50; // Tamanho do headcrab em px
    const randomX = Math.random() * (containerRect.width - headcrabSize);
    const randomY = Math.random() * (containerRect.height - headcrabSize);

    headcrab.style.left = `${randomX}px`;
    headcrab.style.top = `${randomY}px`;
    headcrab.style.position = 'absolute';

    headcrab.style.transform = `rotate(${Math.random() * 360}deg)`;

    const clickHandler = () => hitHeadcrab(headcrab);
    headcrab.addEventListener('click', clickHandler);
    
    headcrabHuntContainer.appendChild(headcrab);
    headcrabs.push(headcrab);

    setTimeout(() => {
        if (headcrab.parentNode === headcrabHuntContainer) {
            headcrab.removeEventListener('click', clickHandler);
            headcrab.remove();
        }
    }, 2500);
}

function hitHeadcrab(headcrab) {
    score++;
    const scoreElement = document.getElementById('headcrab-hunt-score');
    if (scoreElement) {
        scoreElement.textContent = `Score: ${score}`;
    }
    headcrab.removeEventListener('click', hitHeadcrab); 
    headcrab.remove();
}

function endHeadcrabHunt(hideContainer = true) {
    clearInterval(gameInterval);
    clearInterval(headcrabSpawnInterval);
    headcrabs.forEach(hc => {
        if (hc.parentNode) {
            hc.parentNode.removeChild(hc);
        }
    });
    headcrabs = [];

    if (hideContainer) {
        const scoreElement = document.getElementById('headcrab-hunt-score');
        const finalScoreMessage = document.createElement('div');
        finalScoreMessage.textContent = `Game Over! Final Score: ${score}`;
        
        headcrabHuntContainer.innerHTML = '';
        headcrabHuntContainer.appendChild(finalScoreMessage);
        
        const closeGameButton = document.createElement('button');
        closeGameButton.textContent = 'Close Game';
        closeGameButton.style.marginTop = '20px';
        closeGameButton.style.padding = '10px 20px';
        closeGameButton.style.backgroundColor = '#4a5d4e';
        closeGameButton.style.color = '#fff';
        closeGameButton.style.border = '1px solid #a2c490';
        closeGameButton.style.cursor = 'pointer';
        closeGameButton.addEventListener('click', () => {
            headcrabHuntContainer.style.display = 'none';
            gameDuration = 15000;
            score = 0;
            headcrabHuntContainer.innerHTML = '';
        });
        headcrabHuntContainer.appendChild(closeGameButton);
    } else {
        // Se não for para esconder, apenas limpa os headcrabs e reinicia o score/timer
        score = 0;
        if (document.getElementById('headcrab-hunt-score')) {
            document.getElementById('headcrab-hunt-score').textContent = `Score: 0`;
        }
        if (document.getElementById('headcrab-hunt-timer')) {
            document.getElementById('headcrab-hunt-timer').textContent = `Time: ${gameDuration / 1000}s`;
        }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    consoleBox = document.querySelector('.console-box'); // Atribuir consoleBox aqui também
    const consoleButton = document.querySelector('.console-button');
    const consoleHeader = document.querySelector('.console-header');
    const minimizeConsoleBtn = document.querySelector('.minimize-console');
    const closeConsoleBtn = document.querySelector('.close-console');
    const resizeHandle = consoleBox.querySelector('.bottom-right-resize-handle');

    consoleInput = document.querySelector('.console-input');
    consoleSuggestionsContainer = document.getElementById('console-suggestions');
    consoleSuggestionsOuterContainer = document.getElementById('console-suggestions-outer-container'); // Selecionar o outer container
    consoleSubmitBtn = document.querySelector('.console-submit-btn'); // Atribuir consoleSubmitBtn

    // Objeto para armazenar os limites da área principal (mainUI)
    // Este será o elemento HTML que define onde as janelas podem se mover
    const mainAreaBoundsElement = document.getElementById('mainUI'); 

    // Funções de callback para arraste e redimensionamento
    const onConsoleMoveOrResize = () => {
        positionSuggestionsContainer();
    };

    const onDragStartConsole = () => {
        consoleSuggestionsOuterContainer.classList.add('hidden'); // Esconde ao começar a arrastar
    };

    const onDragEndConsole = () => {
        if (!consoleBox.classList.contains('hidden') && !consoleBox.classList.contains('minimized-console')) {
            updateSuggestions(); // Re-verifica e mostra sugestões se aplicável
            positionSuggestionsContainer(); // Garante o posicionamento correto
        }
    };

    const onResizeStartConsole = () => {
        consoleSuggestionsOuterContainer.classList.add('hidden'); // Esconde ao começar a redimensionar
    };

    const onResizeEndConsole = () => {
        if (!consoleBox.classList.contains('hidden') && !consoleBox.classList.contains('minimized-console')) {
            updateSuggestions(); // Re-verifica e mostra sugestões se aplicável
            positionSuggestionsContainer(); // Garante o posicionamento correto
        }
    };


    // Esconde o console na primeira abertura
    if (consoleBox) {
        consoleBox.classList.add('hidden');
    }

    if (consoleButton && consoleBox) {
        consoleButton.addEventListener('click', () => {
            consoleBox.classList.remove('hidden');
            consoleBox.classList.remove('minimized-console');
            // Reposiciona o console para uma posição mais baixa
            consoleBox.style.position = 'fixed';
            consoleBox.style.top = '310px'; // Aumentado de 250px para 300px
            consoleBox.style.left = 'calc(50% - 290px)';
            consoleBox.style.bottom = '';
            consoleBox.style.right = '';
            consoleBox.style.transform = '';
            consoleInput.focus(); // Foca no input ao abrir

            positionSuggestionsContainer(); // Posiciona as sugestões ao abrir
        });
    }

    // Torna a janela do console arrastável
    if (consoleBox && consoleHeader) {
        // Passa o elemento mainAreaBoundsElement como o último argumento
        makeDraggable(consoleBox, consoleHeader, onConsoleMoveOrResize, onDragStartConsole, onDragEndConsole, mainAreaBoundsElement); 
    }
    if (closeConsoleBtn) closeConsoleBtn.addEventListener('click', e => {
        e.stopPropagation();
        consoleBox.classList.add('hidden');
        consoleSuggestionsOuterContainer.classList.add('hidden'); // Esconde o outer container de sugestões
        endHeadcrabHunt(); // Garante que o jogo termine se o console for fechado
    });

    if (minimizeConsoleBtn) minimizeConsoleBtn.addEventListener('click', e => {
        e.stopPropagation();
        consoleBox.classList.toggle('minimized-console');
        // Esconde sugestões ao minimizar
        if (consoleBox.classList.contains('minimized-console')) {
            consoleSuggestionsOuterContainer.classList.add('hidden');
        } else {
            // Reapresenta se desminimizado e há texto no input
            if (consoleInput.value.trim().length > 0) {
                updateSuggestions();
            }
            positionSuggestionsContainer(); // Reposiciona ao desminimizar
        }
    });

    const discordUser = document.querySelector('.copy-on-click');
    if (discordUser) discordUser.addEventListener('click', () => {
        navigator.clipboard.writeText(discordUser.dataset.copy).then(() => showCopyFeedback(discordUser));
    });

    if (consoleSubmitBtn) consoleSubmitBtn.addEventListener('click', sendMessageToConsole);

    // Adiciona listener para o evento 'input' para sugestões em tempo real
    if (consoleInput) {
        consoleInput.addEventListener('input', updateSuggestions);
        consoleInput.addEventListener('keydown', (e) => {
            const suggestions = consoleSuggestionsContainer.querySelectorAll('.suggestion-item');
            const numSuggestions = suggestions.length;

            if (numSuggestions > 0 && !consoleSuggestionsOuterContainer.classList.contains('hidden')) { // Verifica a visibilidade do OUTER container
                if (e.key === 'ArrowDown') {
                    e.preventDefault(); // Evita o scroll da página
                    currentSuggestionIndex = (currentSuggestionIndex + 1) % numSuggestions;
                    highlightSuggestion(suggestions);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault(); // Evita o scroll da página
                    currentSuggestionIndex = (currentSuggestionIndex - 1 + numSuggestions) % numSuggestions;
                    highlightSuggestion(suggestions);
                } else if (e.key === 'Tab') {
                    e.preventDefault(); // Evita a tabulação padrão
                    if (currentSuggestionIndex !== -1) {
                        consoleInput.value = suggestions[currentSuggestionIndex].dataset.command;
                    } else if (numSuggestions > 0) { // Se não tem nada selecionado, mas tem sugestões
                        consoleInput.value = suggestions[0].dataset.command; // Seleciona o primeiro
                    }
                    consoleSuggestionsOuterContainer.classList.add('hidden'); // Esconde ao usar Tab
                    currentSuggestionIndex = -1; // Reseta o índice
                }
            }
            
            // Lógica para Enter
            if (e.key === 'Enter') {
                e.preventDefault(); // Sempre previne o Enter padrão (que pode enviar formulários, etc.)
                if (currentSuggestionIndex !== -1) {
                    // Se uma sugestão estiver selecionada, usa-a
                    consoleInput.value = suggestions[currentSuggestionIndex].dataset.command;
                }
                sendMessageToConsole(); // Envia o comando (selecionado ou digitado)
            } else if (e.key === 'Escape') {
                consoleSuggestionsOuterContainer.classList.add('hidden'); // Esconde o outer container
                currentSuggestionIndex = -1;
            }
        });
    }

    function highlightSuggestion(suggestions) {
        suggestions.forEach((item, index) => {
            item.classList.remove('selected');
            if (index === currentSuggestionIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
        });
    }

    // Ouve o redimensionamento da janela do navegador para reposicionar as sugestões
    window.addEventListener('resize', () => {
        // Atualiza a referência do elemento mainAreaBoundsElement e suas dimensões
        mainAreaBoundsElement = document.getElementById('mainUI'); 
        if (!consoleBox.classList.contains('hidden') && !consoleBox.classList.contains('minimized-console')) {
            positionSuggestionsContainer();
        }
    });

    // Torna a janela do console redimensionável
    if (consoleBox && resizeHandle) {
        // Passa o elemento mainAreaBoundsElement como o último argumento
        makeResizable(consoleBox, resizeHandle, { minWidth: 550, minHeight: 220 }, onConsoleMoveOrResize, onResizeStartConsole, onResizeEndConsole, mainAreaBoundsElement); 
    }

    headcrabHuntContainer = document.getElementById('headcrab-hunt-container');
    if (!headcrabHuntContainer) {
        console.error("Headcrab Hunt container not found in HTML.");
    } else {
        headcrabHuntContainer.style.display = 'none'; // Initially hide the game container
    }

    // Garante que o console esteja escondido ao carregar a página
    if (consoleBox) {
        consoleBox.classList.add('hidden');
    }
});