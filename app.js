(() => {
  const scenes = [...document.querySelectorAll('.scene')];
  const photoScenes = [...document.querySelectorAll('.photograph')];

  /* =========================================================================
     SCENE INTERSECTION OBSERVER
     ========================================================================= */
  const sceneObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-settled');
      }
    });
  }, { threshold: 0.45 });

  scenes.forEach(scene => sceneObserver.observe(scene));

  /* =========================================================================
     PHOTOGRAPH PLACEHOLDER & LOAD HANDLING
     ========================================================================= */
  photoScenes.forEach(s => {
    const img = s.querySelector('.scene-image');
    const placeholder = s.querySelector('.image-placeholder');
    if (!img) return;

    if (img.complete && img.naturalWidth) {
      if (placeholder) placeholder.classList.add('is-hidden');
    } else {
      img.addEventListener('load', () => {
        if (placeholder) placeholder.classList.add('is-hidden');
      }, { once: true });
      img.addEventListener('error', () => {
        img.style.display = 'none';
      }, { once: true });
    }
  });

  /* =========================================================================
     PARALLAX ON SCROLL
     ========================================================================= */
  function updatePhotoParallax() {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    photoScenes.forEach(scene => {
      const rect = scene.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (viewportHeight - rect.top) / (viewportHeight + rect.height)));
      let scale = 1.06 - progress * 0.06;
      let y = (1 - progress) * 1.5;

      if (scene.id === 'scene-2' || scene.id === 'scene-3' || scene.id === 'scene-4') {
        scale = 1.0;
        y = 0;
      }
      scene.style.setProperty('--image-scale', scale.toFixed(4));
      scene.style.setProperty('--image-y', `${y.toFixed(2)}%`);
    });
  }

  /* =========================================================================
     BACKDROP VISIBILITY ACROSS SCENE 1 & 2
     ========================================================================= */
  const backdrop = document.querySelector('.invitation-backdrop');
  const templeScene = document.querySelector('#scene-2');

  function updateBackdrop() {
    if (!backdrop || !templeScene) return;
    const rect = templeScene.getBoundingClientRect();
    if (rect.bottom <= 0) {
      backdrop.style.opacity = '0';
      backdrop.style.visibility = 'hidden';
    } else {
      backdrop.style.opacity = '1';
      backdrop.style.visibility = 'visible';
    }
  }

  window.addEventListener('scroll', () => {
    updatePhotoParallax();
    updateBackdrop();
  }, { passive: true });

  /* =========================================================================
     SMOOTH SCROLL FOR ANCHOR LINKS
     ========================================================================= */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* =========================================================================
     DYNAMIC 7-SECOND INTRO LOADER CONTROLLER
     ========================================================================= */
  const loader = document.querySelector('#intro-loader');
  const skipBtn = document.querySelector('#loader-skip-btn');

  function dismissLoader() {
    if (!loader || loader.classList.contains('loader-out')) return;
    loader.classList.add('loader-out');
    document.body.classList.add('invitation-ready');
    // Ensure smooth dissolve then hide from assistive tech and rendering
    setTimeout(() => {
      loader.setAttribute('aria-hidden', 'true');
      loader.style.display = 'none';
    }, 1150);
  }

  if (loader) {
    // Automatically transition seamlessly after 7 seconds
    const timer = setTimeout(dismissLoader, 7000);

    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearTimeout(timer);
        dismissLoader();
      });
    }

    // Tap/click anywhere on screen allows early transition
    loader.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON') {
        clearTimeout(timer);
        dismissLoader();
      }
    });
  } else {
    document.body.classList.add('invitation-ready');
  }

  /* =========================================================================
     MOBILE MORE INFO TOGGLES (Groom & Bride details)
     ========================================================================= */
  document.querySelectorAll('.more-info-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('aria-controls');
      const drawer = document.getElementById(targetId);
      if (!drawer) return;

      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isExpanded));
      btn.classList.toggle('is-active', !isExpanded);
      drawer.classList.toggle('is-open', !isExpanded);

      const textSpan = btn.querySelector('.toggle-text');
      if (textSpan) {
        textSpan.textContent = !isExpanded ? 'Less Info' : 'More Info';
      }
    });
  });

  updatePhotoParallax();
  updateBackdrop();
})();
