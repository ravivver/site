import { makeDraggable } from './drag-and-resize-utilities.js'; // Importa a função makeDraggable

const loginSound = new Audio('sounds/login.m4a');
loginSound.volume = 0.07; // Volume inicial do som de login

function enterSite() {
    // Toca o som de login
    loginSound.currentTime = 0;
    loginSound.play().catch(e => console.error("Erro ao tocar o áudio de login:", e));

    // Troca para a interface principal imediatamente
    document.querySelector('.login-screen-wrapper').style.display = 'none';
    const mainUI = document.getElementById('mainUI');
    mainUI.classList.remove('hidden');
    mainUI.offsetHeight; // Força o reflow para a transição de opacidade
    mainUI.style.opacity = '1';

    // REMOVIDO: A chamada direta para startLoginSoundFadeOut() daqui.
    // Agora, o music-player-script.js enviará um evento para iniciar o fade out
    // APENAS SE O PLAYER FOR ABERTO.
}

function startLoginSoundFadeOut() {
    if (loginSound.paused || loginSound.volume === 0) {
        // Se já está pausado ou sem volume, notifica o music player imediatamente.
        document.dispatchEvent(new CustomEvent('loginSoundEnded'));
        return; 
    }

    const fadeDuration = 1000; // Duração do fade em milissegundos (1 segundo)
    const initialVolume = loginSound.volume;
    const fadeStep = initialVolume / (fadeDuration / 50); // Calcula o passo para 50ms

    const fadeOutInterval = setInterval(() => {
        loginSound.volume = Math.max(0, loginSound.volume - fadeStep); // Diminui o volume, garantindo que não seja negativo
        if (loginSound.volume <= 0.001) { // Checa por um valor bem baixo, próximo de zero
            loginSound.volume = 0; // Garante que seja 0
            loginSound.pause();
            loginSound.currentTime = 0; // Reseta o áudio
            clearInterval(fadeOutInterval);
            document.dispatchEvent(new CustomEvent('loginSoundEnded')); // Notifica que o áudio de login terminou
        }
    }, 50); // A cada 50ms
}


function toggleRememberMeColor() {
    const rememberDiv = document.querySelector('.remember');
    const checkbox = document.getElementById('remember');
    rememberDiv.classList.toggle('checked', checkbox.checked);
}

const loginWindow = document.querySelector('.login-window');
const headerBar = document.querySelector('.header-bar');
const minimizeBtn = document.querySelector('.minimize');
const closeBtn = document.querySelector('.close');


document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.querySelector('.login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', enterSite);
  }

  const rememberCheckbox = document.getElementById('remember');
  if (rememberCheckbox) {
      rememberCheckbox.addEventListener('change', toggleRememberMeColor);
      toggleRememberMeColor();
  }

  // Não precisamos mais ouvir 'startLoginFadeOut' aqui, pois enterSite() o chama diretamente.

  // Torna a janela de login arrastável usando a função utilitária
  if (loginWindow && headerBar) {
    makeDraggable(loginWindow, headerBar);
  }

  // Adiciona listeners para minimizar e fechar (já devem estar funcionando, mas garantimos)
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', e => {
        e.stopPropagation();
        loginWindow.classList.toggle('minimized');
        // Ao desminimizar, centraliza a janela se não tiver uma posição anterior salva
        if (!loginWindow.classList.contains('minimized')) {
            if (loginWindow.style.left === '50%' && loginWindow.style.top === '50%' && loginWindow.style.transform === 'translate(-50%, -50%)') {
                // Já está centralizado ou precisa ser (pode refinar essa lógica se quiser salvar a última posição não-centralizada)
            } else {
                loginWindow.style.left = '50%';
                loginWindow.style.top = '50%';
                loginWindow.style.transform = 'translate(-50%, -50%)';
            }
        }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', e => {
        e.stopPropagation();
        loginWindow.style.display = 'none';
    });
  }
});