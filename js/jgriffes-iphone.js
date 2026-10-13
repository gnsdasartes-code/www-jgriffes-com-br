(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.slider-slide').forEach(slide => {
    const image = slide.querySelector('img');
    if (!image || !Array.from(image.attributes).some(attr => attr.value.includes('banner-boas-vindas-j-griffes'))) return;
    slide.classList.add('jg-welcome-video');
    const phone = document.createElement('div');
    phone.className = 'jg-iphone';
    phone.setAttribute('aria-label', 'Vídeo de moda em um iPhone');
    phone.innerHTML = '<div class="jg-iphone-screen"><video muted loop playsinline preload="metadata" aria-label="Vídeo de moda J Griffes"><source src="videos/jgriffes-moda.mp4" type="video/mp4"></video><span class="jg-iphone-island" aria-hidden="true"></span><span class="jg-iphone-home" aria-hidden="true"></span><button class="jg-iphone-toggle" type="button" aria-label="Reproduzir vídeo">▶</button></div>';
    slide.appendChild(phone);
    const video = phone.querySelector('video');
    const button = phone.querySelector('button');
    video.muted = true;
    video.autoplay = !reducedMotion;
    let userPaused = reducedMotion;
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
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !userPaused) video.play().catch(sync);
        else video.pause();
      });
    }, { threshold: 0.25 });
    observer.observe(phone);
  });
})();
