(() => {
  document.querySelectorAll('.slider-slide').forEach(slide => {
    const image = slide.querySelector('img');
    if (!image || !Array.from(image.attributes).some(attr => attr.value.includes('banner-boas-vindas-j-griffes'))) return;
    slide.classList.add('jg-welcome-video');
    const phone = document.createElement('div');
    phone.className = 'jg-iphone';
    phone.setAttribute('aria-label', 'Vídeo de moda em um iPhone');
    phone.innerHTML = '<div class="jg-iphone-screen"><video autoplay muted loop playsinline webkit-playsinline preload="auto" aria-label="Vídeo de moda J Griffes"><source src="videos/jgriffes-moda.mp4" type="video/mp4"></video><span class="jg-iphone-island" aria-hidden="true"></span><span class="jg-iphone-home" aria-hidden="true"></span><button class="jg-iphone-toggle" type="button" aria-label="Reproduzir vídeo">▶</button></div>';
    slide.appendChild(phone);
    const video = phone.querySelector('video');
    const button = phone.querySelector('button');
    video.muted = true;
    video.autoplay = true;
    video.defaultMuted = true;
    video.playsInline = true;
    let userPaused = false;
    const sync = () => {
      button.textContent = video.paused ? '▶' : 'Ⅱ';
      button.setAttribute('aria-label', video.paused ? 'Reproduzir vídeo' : 'Pausar vídeo');
    };
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    button.addEventListener('click', event => {
      event.stopPropagation();
      userPaused = !video.paused;
      if (video.paused) video.play().catch(sync); else video.pause();
    });
    const startPlayback = () => {
      if (!userPaused) video.play().catch(sync);
    };
    video.addEventListener('canplay', startPlayback, { once: true });
    window.addEventListener('pageshow', startPlayback);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') startPlayback();
    });
    // Retry after the first interaction if the browser blocks autoplay.
    document.addEventListener('pointerdown', startPlayback, { once: true });
    document.addEventListener('keydown', startPlayback, { once: true });
    startPlayback();
  });
})();
