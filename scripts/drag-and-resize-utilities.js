// drag-and-resize-utilities.js

export function makeDraggable(target, handle, onDragCallback = null, onDragStartCallback = null, onDragEndCallback = null, boundsElement = null) {
  let isDragging = false;
  let offsetX = 0, offsetY = 0;
  let minX, minY, maxX, maxY;

  handle.addEventListener('mousedown', (e) => {
    // Impede o arraste se o clique for em um controle de janela
    if (e.target.closest('.window-controls, .console-controls, .player-controls, .profile-controls')) return;

    isDragging = true;
    if (onDragStartCallback) {
      onDragStartCallback();
    }

    const targetRect = target.getBoundingClientRect();
    
    // Altera a posição para 'fixed' para que o arraste funcione em relação à viewport
    target.style.position = 'fixed';
    target.style.left = `${targetRect.left}px`;
    target.style.top = `${targetRect.top}px`;
    target.style.transform = 'none'; // Remove qualquer transformação CSS que possa interferir
    target.style.bottom = 'unset'; // Garante que não haja conflito com bottom/right
    target.style.right = 'unset';

    offsetX = e.clientX - targetRect.left;
    offsetY = e.clientY - targetRect.top;

    // --- INÍCIO DA SEÇÃO DE AJUSTE MANUAL DE LIMITES (DRAG) ---
    // Os limites são calculados com base no boundsElement (geralmente a área principal da sua UI)
    // Se boundsElement não for fornecido, usará a janela do navegador.
    if (boundsElement) {
        const boundsRect = boundsElement.getBoundingClientRect();
        
        // minX: Borda esquerda do boundsElement
        minX = boundsRect.left;
        // minY: Borda superior do boundsElement
        minY = boundsRect.top;
        // maxX: Borda direita do boundsElement menos a largura do elemento alvo
        maxX = boundsRect.right - targetRect.width;
        // maxY: Borda inferior do boundsElement menos a altura do elemento alvo
        maxY = boundsRect.bottom - targetRect.height;
        
        // EXEMPLOS DE AJUSTES MANUAIS AQUI:
        // Para adicionar um padding de 10px das bordas do boundsElement:
        // minX += 10;
        // minY += 10;
        // maxX -= 10;
        // maxY -= 10;
        
        // Para impedir que a janela suba acima de 50px do topo da tela, mesmo que boundsElement comece mais acima:
        // minY = Math.max(minY, 50); 
        
        // Para impedir que a janela desça abaixo de (altura da tela - 100px - altura da janela), por exemplo:
        // maxY = Math.min(maxY, window.innerHeight - 100 - targetRect.height);

        // Se você quer que a janela não vá muito para a esquerda, mesmo que boundsElement comece mais à esquerda:
        // minX = Math.max(minX, 20); // Exemplo: mínimo X é 20px

        // Se você quer que a janela não vá muito para a direita:
        // maxX = Math.min(maxX, window.innerWidth - targetRect.width - 20); // Exemplo: máximo X é 20px da borda direita

    } else {
        // Fallback: se nenhum boundsElement for fornecido, use a janela como limite
        minX = 0;
        minY = 0;
        maxX = window.innerWidth - targetRect.width;
        maxY = window.innerHeight - targetRect.height;
    }
    // --- FIM DA SEÇÃO DE AJUSTE MANUAL DE LIMITES (DRAG) ---
    
    target.classList.add('no-transition');
    document.body.style.cursor = 'grabbing';
    handle.style.cursor = 'grabbing';
    target.style.userSelect = 'none';
    target.style.webkitUserDrag = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();

    let newLeft = e.clientX - offsetX;
    let newTop = e.clientY - offsetY;

    // Aplicar limites
    newLeft = Math.max(minX, Math.min(newLeft, maxX));
    newTop = Math.max(minY, Math.min(newTop, maxY));
    
    target.style.left = `${newLeft}px`;
    target.style.top = `${newTop}px`;
    if (onDragCallback) {
      onDragCallback();
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      target.classList.remove('no-transition');
      document.body.style.cursor = 'default';
      handle.style.cursor = 'grab';
      target.style.userSelect = 'auto';
      target.style.webkitUserDrag = 'auto';
      if (onDragEndCallback) {
        onDragEndCallback();
      }
    }
  });
}

export function makeResizable(target, handle, options = {}, onResizeCallback = null, onResizeStartCallback = null, onResizeEndCallback = null, boundsElement = null) {
    let isResizing = false;
    let initialX, initialY;
    let initialWidth, initialHeight;
    const minWidth = options.minWidth || 100;
    const minHeight = options.minHeight || 100;

    let boundsRect = null; // Declarado aqui para ser atualizado no mousedown

    handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        if (onResizeStartCallback) {
          onResizeStartCallback();
        }
        initialX = e.clientX;
        initialY = e.clientY;

        const rect = target.getBoundingClientRect();
        target.style.position = 'fixed'; // Altera a posição para 'fixed' para redimensionamento
        target.style.left = `${rect.left}px`;
        target.style.top = `${rect.top}px`;
        target.style.transform = 'none';
        target.style.right = 'unset';
        target.style.bottom = 'unset';

        initialWidth = rect.width;
        initialHeight = rect.height;

        // --- Recalcular boundsRect AQUI para pegar as dimensões mais recentes no início do resize ---
        if (boundsElement) {
            boundsRect = boundsElement.getBoundingClientRect();
        } else {
            boundsRect = null; // Garante que se não tiver boundsElement, use limites da janela
        }
        // --- FIM DO RECALCULO ---

        target.classList.add('no-transition');
        document.body.style.cursor = 'se-resize';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        e.preventDefault();

        const deltaX = e.clientX - initialX;
        const deltaY = e.clientY - initialY;

        let newWidth = initialWidth + deltaX;
        let newHeight = initialHeight + deltaY;

        const currentTargetRect = target.getBoundingClientRect(); // Posição atual do target para limites

        // --- INÍCIO DA SEÇÃO ONDE VOCÊ PODE AJUSTAR OS LIMITES MANUAIS (RESIZE) ---
        if (boundsRect) {
            // Limites de resizable (não pode ir além da direita/baixo do boundsElement)
            let maxAllowedWidth = boundsRect.right - currentTargetRect.left;
            let maxAllowedHeight = boundsRect.bottom - currentTargetRect.top;
            
            // EXEMPLOS DE AJUSTES MANUAIS AQUI:
            // Para adicionar um padding de 10px da borda direita do boundsElement ao redimensionar:
            // maxAllowedWidth = boundsRect.right - currentTargetRect.left - 10; 
            
            // Para adicionar um padding de 20px da borda inferior do boundsElement ao redimensionar:
            // maxAllowedHeight = boundsRect.bottom - currentTargetRect.top - 20;

            newWidth = Math.min(newWidth, maxAllowedWidth);
            newHeight = Math.min(newHeight, maxAllowedHeight);
        } else {
            // Limites da janela se não houver boundsElement
            let maxAllowedWidth = window.innerWidth - currentTargetRect.left;
            let maxAllowedHeight = window.innerHeight - currentTargetRect.top;

            newWidth = Math.min(newWidth, maxAllowedWidth);
            newHeight = Math.min(newHeight, maxAllowedHeight);
        }
        // --- FIM DA SEÇÃO DE AJUSTE MANUAL DE LIMITES (RESIZE) ---
        
        // Aplicar limites mínimos
        newWidth = Math.max(minWidth, newWidth);
        newHeight = Math.max(minHeight, newHeight);

        target.style.width = `${newWidth}px`;
        target.style.height = `${newHeight}px`;

        if (onResizeCallback) {
          onResizeCallback();
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            target.classList.remove('no-transition');
            document.body.style.cursor = 'default';
            if (onResizeEndCallback) {
              onResizeEndCallback();
            }
        }
    });
}