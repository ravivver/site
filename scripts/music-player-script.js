// music-player-script.js

import { makeDraggable, makeResizable } from './drag-and-resize-utilities.js';

document.addEventListener('DOMContentLoaded', () => {
    const musicPlayerBox = document.querySelector('.music-player-box');
    const musicPlayerOpenButton = document.querySelector('.music-player-open-button'); 
    const playerHeader = musicPlayerBox.querySelector('.player-header'); 
    const minimizePlayerBtn = musicPlayerBox.querySelector('.minimize-player');
    const closePlayerBtn = musicPlayerBox.querySelector('.close-player');

    // Elementos do player
    const albumArtElement = musicPlayerBox.querySelector('.album-art');
    const songTitleElement = musicPlayerBox.querySelector('.song-title');
    const songArtistElement = musicPlayerBox.querySelector('.song-artist');
    const progressBar = musicPlayerBox.querySelector('.progress-bar');
    const playPauseButton = musicPlayerBox.querySelector('.play-pause-button');
    const prevButton = musicPlayerBox.querySelector('.prev-button');
    const nextButton = musicPlayerBox.querySelector('.next-button');
    const volumeSlider = musicPlayerBox.querySelector('.volume-slider');
    const volumeIconButton = musicPlayerBox.querySelector('.volume-icon-button');

    // Objeto de áudio global
    const audio = new Audio();
    let currentSongIndex = 0;
    let isMuted = false;
    let previousVolume = 0.5; // Para guardar o volume antes de mutar

    // --- CONFIGURAÇÃO DA PLAYLIST ---
    const playlist = [
        {
            src: 'sounds/player/musica1.mp3',
            title: 'Iz-US',
            artist: 'Aphex Twin',
            albumArt: 'https://i.gifer.com/NLQW.gif'
        },
        {
            src: 'sounds/player/musica2.mp3',
            title: 'Fingerbib',
            artist: 'Aphex Twin',
            albumArt: 'https://i.gifer.com/NLQW.gif'
        },
        {
            src: 'sounds/player/musica3.mp3',
            title: 'Polynomial-C',
            artist: 'Aphex Twin',
            albumArt: 'https://i.gifer.com/NLQW.gif'
        },
        {
            src: 'sounds/player/musica4.mp3',
            title: 'Tha',
            artist: 'Aphex Twin',
            albumArt: 'https://i.gifer.com/NLQW.gif'
        }
    ];

    // Função para carregar uma música
    function loadSong(songIndex) {
        if (playlist.length === 0) {
            console.warn("Player: Playlist vazia. Nenhuma música para carregar.");
            return;
        }
        currentSongIndex = (songIndex + playlist.length) % playlist.length;
        const song = playlist[currentSongIndex];

        audio.src = song.src;
        songTitleElement.textContent = song.title;
        songArtistElement.textContent = song.artist;
        albumArtElement.src = song.albumArt;

        audio.load(); // Carrega a música
    }

    // Atualiza o botão de play/pause
    function updatePlayPauseButton() {
        if (audio.paused) {
            playPauseButton.classList.remove('pause-icon');
            playPauseButton.classList.add('play-icon');
        } else {
            playPauseButton.classList.remove('play-icon');
            playPauseButton.classList.add('pause-icon');
        }
    }

    // Alterna entre play e pause
    function togglePlayPause() {
        if (audio.paused) {
            // Se o usuário clicar em Play manualmente, para o som de login imediatamente
            // e então inicia a música do player.
            document.dispatchEvent(new CustomEvent('stopLoginSoundImmediately')); 
            audio.play().catch(e => console.error("Erro ao dar play:", e));
        } else {
            audio.pause();
        }
        updatePlayPauseButton();
    }

    // Pula para a próxima música
    function playNextSong() {
        loadSong(currentSongIndex + 1);
        audio.play().catch(e => console.error("Erro ao tocar a próxima música:", e));
        updatePlayPauseButton();
    }

    // Pula para a música anterior
    function playPrevSong() {
        loadSong(currentSongIndex - 1);
        audio.play().catch(e => console.error("Erro ao tocar a música anterior:", e));
        updatePlayPauseButton();
    }

    // Atualiza a barra de progresso
    function updateProgressBar() {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressBar.value = isNaN(progress) ? 0 : progress;
    }

    // Busca na música pela barra de progresso
    function seekSong() {
        const seekTime = (progressBar.value / 100) * audio.duration;
        audio.currentTime = seekTime;
    }

    // Alterna mudo/desmudo
    function toggleMute() {
        isMuted = !isMuted;
        audio.muted = isMuted;

        if (isMuted) {
            previousVolume = audio.volume;
            audio.volume = 0;
            volumeSlider.value = 0;
            volumeIconButton.classList.add('muted-icon');
            volumeIconButton.classList.remove('volume-icon');
        } else {
            // Se desmutar e o volume anterior for 0, define um mínimo.
            audio.volume = previousVolume > 0 ? previousVolume : 0.1; 
            volumeSlider.value = audio.volume * 100;
            volumeIconButton.classList.remove('muted-icon');
            volumeIconButton.classList.add('volume-icon');
        }
    }

    // Controla o volume
    function setVolume() {
        const newVolume = volumeSlider.value / 100;
        audio.volume = newVolume;

        if (newVolume === 0) {
            if (!isMuted) {
                isMuted = true;
                volumeIconButton.classList.add('muted-icon');
                volumeIconButton.classList.remove('volume-icon');
            }
        } else {
            isMuted = false;
            volumeIconButton.classList.remove('muted-icon');
            volumeIconButton.classList.add('volume-icon');
            previousVolume = newVolume;
        }
        audio.muted = isMuted;
    }

    // --- Event listeners para os controles do player ---
    playPauseButton.addEventListener('click', togglePlayPause);
    prevButton.addEventListener('click', playPrevSong);
    nextButton.addEventListener('click', playNextSong);
    progressBar.addEventListener('input', seekSong);
    volumeSlider.addEventListener('input', setVolume);
    volumeIconButton.addEventListener('click', toggleMute);

    // Atualiza a barra de progresso enquanto a música toca
    audio.addEventListener('timeupdate', updateProgressBar);
    // Avança para a próxima música automaticamente quando a atual termina
    audio.addEventListener('ended', playNextSong);

    // --- Lógica para abrir o player ---
    if (musicPlayerOpenButton) {
        musicPlayerOpenButton.addEventListener('click', () => {
            if (musicPlayerBox) {
                musicPlayerBox.classList.remove('hidden');
                musicPlayerBox.classList.remove('minimized-player'); 

                // Posiciona o player no canto inferior direito
                musicPlayerBox.style.position = 'fixed'; 
                musicPlayerBox.style.bottom = '80px';
                musicPlayerBox.style.right = '40px';
                
                // Dispara o evento para iniciar o fade out do som de login
                // APENAS QUANDO O PLAYER É ABERTO.
                document.dispatchEvent(new CustomEvent('startLoginSoundFadeOut'));

                // A música do player só será iniciada após o evento 'loginSoundEnded'
                // ou se o usuário clicar no play manualmente.
                updatePlayPauseButton();
                musicPlayerBox.offsetHeight; // Força um reflow
            } else {
                console.error('Music Player: Elemento musicPlayerBox não encontrado.');
            }
        });
    } else {
        console.warn('Music Player: Botão .music-player-open-button não encontrado no DOM.');
    }

    // --- Lógica para minimizar o player ---
    if (minimizePlayerBtn && musicPlayerBox) {
        minimizePlayerBtn.addEventListener('click', e => {
            e.stopPropagation();
            musicPlayerBox.classList.toggle('minimized-player');
            if (musicPlayerBox.classList.contains('minimized-player')) {
                // Se minimizado, pausa a música
                audio.pause();
            } else {
                // Se desminimizado, e não estiver escondido, continua a música
                // Se a música não estiver tocando, e o som de login já tiver terminado, inicia.
                if (!musicPlayerBox.classList.contains('hidden') && audio.paused && loginSound.paused) {
                    audio.play().catch(e => console.error("Erro ao continuar a música:", e));
                }
            }
            updatePlayPauseButton(); // Atualiza o ícone de play/pause
        });
    } else {
        console.warn('Music Player: Botão Minimizar ou Music Player Box não encontrados.');
    }

    // --- Lógica para arrastar o player (usando makeDraggable) ---
    if (musicPlayerBox && playerHeader) {
        makeDraggable(musicPlayerBox, playerHeader);
    } else {
        console.warn('Music Player: Header ou Music Player Box não encontrados para arrastar.');
    }

    // --- Lógica para fechar o player ---
    if (closePlayerBtn && musicPlayerBox) {
        closePlayerBtn.addEventListener('click', e => {
            e.stopPropagation();
            musicPlayerBox.classList.add('hidden');
            audio.pause(); // Pausa a música ao fechar o player
            updatePlayPauseButton();
        });
    } else {
        console.warn('Music Player: Botão .close-player ou .music-player-box não encontrados no DOM.');
    }

    // --- Inicialização do Player ---
    loadSong(currentSongIndex);
    audio.volume = 0.1; // Define o volume inicial para 0.1 (10%)
    volumeSlider.value = audio.volume * 100; // Sincroniza o slider com o volume inicial
    updatePlayPauseButton(); // Define o ícone correto de play/pause no carregamento
    
    // Esconde o music player por padrão ao carregar a página
    musicPlayerBox.classList.add('hidden'); 

    // Ouve o evento 'loginSoundEnded' para iniciar a música
    document.addEventListener('loginSoundEnded', () => {
        // A música do player só deve iniciar se o player não estiver escondido ou minimizado
        // E se a música não estiver já tocando (para não reiniciar se o usuário já deu play manual)
        if (!musicPlayerBox.classList.contains('hidden') && !musicPlayerBox.classList.contains('minimized-player') && audio.paused) {
            audio.play().catch(e => console.error("Erro ao iniciar a música após fade out do login:", e));
            updatePlayPauseButton();
        }
    });

    // Ouve o evento para parar o som de login imediatamente (se o usuário clicar no play do player)
    document.addEventListener('stopLoginSoundImmediately', () => {
        if (loginSound) {
            loginSound.pause();
            loginSound.currentTime = 0;
        }
    });
});