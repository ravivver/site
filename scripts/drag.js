// drag.js - função utilitária genérica para tornar elementos arrastáveis

export function makeDraggable(target, handle) {
  let isDragging = false;
  let offsetX = 0, offsetY = 0;

  handle.addEventListener('mousedown', (e) => {
    if (e.target.closest('.window-controls, .console-controls, .player-controls, .profile-controls')) return;

    isDragging = true;

    const rect = target.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    target.style.position = 'absolute';
    target.style.left = `${rect.left + scrollLeft}px`;
    target.style.top = `${rect.top + scrollTop}px`;
    target.style.transform = 'none';
    target.style.bottom = 'unset';
    target.style.right = 'unset';

    document.body.style.cursor = 'grabbing';
    target.style.cursor = 'grabbing';
    target.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    target.style.left = `${e.clientX - offsetX + window.pageXOffset}px`;
    target.style.top = `${e.clientY - offsetY + window.pageYOffset}px`;
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = 'default';
      target.style.cursor = 'grab';
      target.style.userSelect = 'auto';
    }
  });
}