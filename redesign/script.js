const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
const progress = document.querySelector(".scroll-progress");
const revealItems = document.querySelectorAll(".reveal");
const navLinks = document.querySelectorAll(".main-nav a");
const sections = [...document.querySelectorAll("main section[id]")];
const timelineCards = document.querySelectorAll(".experience-card");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mainNav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      mainNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });
}

const updateProgress = () => {
  if (!progress) return;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const percentage = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progress.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
};

const updateActiveNav = () => {
  const current = sections
    .filter((section) => section.getBoundingClientRect().top <= 130)
    .at(-1);

  navLinks.forEach((link) => {
    const isActive = Boolean(current && link.getAttribute("href") === `#${current.id}`);
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
};

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
revealItems.forEach((item, index) => {
  if (!prefersReduced) {
    const delay = Math.min(index * 70, 260);
    item.style.transitionDelay = `${delay}ms`;
  }
  observer.observe(item);
});

const timelineObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("is-focused", entry.isIntersecting);
    });
  },
  { rootMargin: "-35% 0px -35% 0px", threshold: 0.25 }
);

timelineCards.forEach((card) => timelineObserver.observe(card));

window.addEventListener("scroll", () => {
  updateProgress();
  updateActiveNav();
}, { passive: true });

updateProgress();
updateActiveNav();

// Orbital card tilt interaction (desktop only, respects reduced-motion)
const orbital = document.querySelector('.orbital-card.primary-profile');
if (orbital && !prefersReduced && !('ontouchstart' in window)) {
  orbital.addEventListener('mousemove', (e) => {
    const rect = orbital.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rx = (y - 0.5) * 6; // rotateX small
    const ry = (x - 0.5) * -8; // rotateY small
    orbital.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
  orbital.addEventListener('mouseleave', () => {
    orbital.style.transform = '';
  });
}

// Skill meter animation on scroll
const skillMeters = document.querySelectorAll('.skill-meter');
if (skillMeters.length && !prefersReduced) {
  const skillsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('meter-animate');
        skillsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  skillMeters.forEach((m) => skillsObserver.observe(m));
}

// Contact form: build mailto link and show toast
const contactForm = document.getElementById('contact-form');
const toast = document.getElementById('toast');
function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.hidden = false;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => (toast.hidden = true), 220);
  }, 3000);
}

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    if (!name || !email || !message) { showToast('Please complete the form'); return; }
    const subject = encodeURIComponent(`Portfolio contact from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    const mailto = `mailto:skadakash@gmail.com?subject=${subject}&body=${body}`;
    showToast('Opening your mail client...');
    setTimeout(() => (window.location.href = mailto), 600);
  });

  const copyBtn = document.getElementById('copy-email');
  if (copyBtn) copyBtn.addEventListener('click', () => {
    navigator.clipboard?.writeText('skadakash@gmail.com').then(() => showToast('Email copied to clipboard'));
  });
}

// Publication expand/collapse
const pubToggles = document.querySelectorAll('.pub-toggle');
pubToggles.forEach((btn, idx) => {
  btn.addEventListener('click', (e) => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    const targetId = btn.getAttribute('aria-controls');
    const target = document.getElementById(targetId);
    if (!target) return;
    if (expanded) {
      btn.setAttribute('aria-expanded', 'false');
      target.classList.remove('open');
      target.hidden = true;
      // allow transition to finish
      setTimeout(() => { target.style.maxHeight = null; }, 360);
      btn.textContent = 'Read abstract';
    } else {
      btn.setAttribute('aria-expanded', 'true');
      target.hidden = false;
      // measure height
      requestAnimationFrame(() => {
        const h = target.scrollHeight + 20;
        target.style.maxHeight = h + 'px';
        target.classList.add('open');
      });
      btn.textContent = 'Hide abstract';
    }
  });
});

// Collapse/expand experience timeline to reduce initial scroll
const expToggle = document.getElementById('toggle-experience');
const expTimeline = document.querySelector('.experience-timeline');
if (expToggle && expTimeline) {
  expToggle.addEventListener('click', () => {
    const expanded = expTimeline.classList.toggle('expanded');
    expToggle.setAttribute('aria-expanded', String(expanded));
    expToggle.textContent = expanded ? 'Show less' : 'Show more experience';
    // smooth scroll to keep context when collapsing
    if (!expanded) expTimeline.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// Precise connector lengths: measure distances and set --connector-length per card so connectors meet the marker exactly
function updateTimelineConnectors() {
  const container = document.querySelector('.experience-timeline');
  if (!container) return;
  const containerRect = container.getBoundingClientRect();
  const items = document.querySelectorAll('.experience-item');
  items.forEach((item, idx) => {
    const card = item.querySelector('.experience-card');
    if (!card) return;
    const cardRect = card.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();

    // Anchor connectors to the timeline centerline X and the row vertical center Y
    const markerCenterX = containerRect.left + containerRect.width / 2;
    const markerCenterY = itemRect.top + (itemRect.height / 2);

    // determine if card is left or right by comparing card center to marker center X
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const isLeft = cardCenterX < markerCenterX;
    let length = 0;
    if (isLeft) {
      length = Math.round(markerCenterX - cardRect.right);
    } else {
      length = Math.round(cardRect.left - markerCenterX);
    }

    // compute connector top relative to the card so the horizontal line meets the row center Y
    let connectorTop = Math.round(markerCenterY - cardRect.top);
    // clamp to card bounds (small padding) to avoid the pseudo-element being positioned far outside the card
    connectorTop = Math.max(6, Math.min(Math.round(cardRect.height - 6), connectorTop));
    card.style.setProperty('--connector-top', connectorTop + 'px');

    if (length <= 6) {
      card.style.setProperty('--connector-length', '0px');
      card.classList.add('no-connector');
    } else {
      card.style.setProperty('--connector-length', length + 'px');
      card.classList.remove('no-connector');
    }

    // lightweight debug logging when hash contains '#tl-debug'
    try {
      if (window.location && window.location.hash === '#tl-debug') {
        // eslint-disable-next-line no-console
        console.debug(`TLDEBUG[${idx}] side:${isLeft? 'left':'right'} length:${card.style.getPropertyValue('--connector-length')} top:${card.style.getPropertyValue('--connector-top')} itemY:${Math.round(itemRect.top)} markerY:${Math.round(markerCenterY)}`);
        card.setAttribute('data-connector-length', card.style.getPropertyValue('--connector-length'));
        card.setAttribute('data-connector-top', card.style.getPropertyValue('--connector-top'));
      }
    } catch (e) {
      // ignore in non-browser environments
    }
  });
}

// Stagger items so each starts roughly midway down the previous one (first item starts at the top)
function applyAlternateStagger() {
  const items = Array.from(document.querySelectorAll('.experience-item'));
  // reset
  items.forEach(it => {
    it.style.marginTop = '';
    it.style.zIndex = '';
  });

  // disable staggering on small screens
  if (window.innerWidth <= 980) return;

  const container = document.querySelector('.experience-timeline');
  if (!container) return;
  const containerRect = container.getBoundingClientRect();
  const centerX = containerRect.left + containerRect.width / 2;

  // Build arrays for left and right items using index parity (reliable alternation)
  const leftItems = [];
  const rightItems = [];
  items.forEach((el, idx) => {
    const card = el.querySelector('.experience-card');
    if ((idx % 2) === 0) leftItems.push({ el, card }); else rightItems.push({ el, card });
  });

  // Force a fixed visible overlap between same-side consecutive cards (user requested visible condensation)
  const fixedOverlapLeft = 40; // left column overlap
  const fixedOverlapRight = 80; // right column overlap - pulled up more to reduce the gap shown in your screenshot

  function applyFixedOverlap(list, overlapPx) {
    for (let i = 1; i < list.length; i++) {
      const cur = list[i].el;
      // apply fixed negative margin to visually condense the gap
      cur.style.marginTop = `-${overlapPx}px`;
      // stacking order so earlier items appear above later ones
      list[i - 1].el.style.zIndex = 200 - i;
      cur.style.zIndex = 190 - i;
    }
  }

  applyFixedOverlap(leftItems, fixedOverlapLeft);
  applyFixedOverlap(rightItems, fixedOverlapRight);
}

let _floatingPositions = [];
const floatingMarkerEl = document.getElementById('floating-marker');
const floatingYearEl = document.getElementById('floating-year');
function computeFloatingPositions() {
  const container = document.querySelector('.experience-timeline');
  if (!container) return;
  const items = Array.from(document.querySelectorAll('.experience-item'));
  const containerRect = container.getBoundingClientRect();
  const containerTop = containerRect.top + window.scrollY;
  _floatingPositions = items.map((it) => {
    const articleRect = it.getBoundingClientRect();
    const docY = articleRect.top + window.scrollY; // use top of article so marker moves with item start
    const relTop = docY - containerTop; // position relative to container
    // year label: prefer data-year attribute, fallback to extracting year from .timeline-date text
    const yearFromAttr = it.dataset.year;
    let label = yearFromAttr || '';
    if (!label) {
      const dateEl = it.querySelector('.timeline-date');
      if (dateEl) {
        const txt = dateEl.textContent.trim();
        const maybeYear = txt.match(/(19|20)\d{2}/g);
        if (maybeYear && maybeYear.length) label = maybeYear[0];
      }
    }
    return { el: it, y: relTop, docY, label };
  }).filter(Boolean);

  // sort positions by document Y to ensure scroll order is correct even if DOM order differs
  _floatingPositions.sort((a, b) => a.docY - b.docY);
}

let ticking = false;
function updateFloatingMarkerOnScroll() {
  if (!floatingMarkerEl || !_floatingPositions.length) return;
  const container = document.querySelector('.experience-timeline');
  const containerRect = container.getBoundingClientRect();
  const containerTop = containerRect.top + window.scrollY;
  const viewportAnchor = window.scrollY + window.innerHeight * 0.5; // activation line at viewport center

  // find active index: the last item whose docY is <= viewportAnchor
  let active = 0;
  for (let i = 0; i < _floatingPositions.length; i++) {
    if (_floatingPositions[i].docY <= viewportAnchor) active = i;
    else break;
  }

  const pos = _floatingPositions[active];
  // compute top inside container to place floating marker (align with marker center)
  // For sticky behavior (education-style): update the floating marker label and highlight the row.
  floatingYearEl.textContent = pos.label;

  // animate a small pulse/shift to mimic movement
  floatingMarkerEl.classList.add('pulse');
  setTimeout(() => floatingMarkerEl.classList.remove('pulse'), 300);

  // highlight the corresponding article row (since per-row markers are removed)
  document.querySelectorAll('.experience-item').forEach((it) => it.classList.remove('is-active-row'));
  if (pos && pos.el) pos.el.classList.add('is-active-row');
}

function onScrollHandler() {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      updateFloatingMarkerOnScroll();
      ticking = false;
    });
    ticking = true;
  }
}

function layoutTimeline() {
  // apply stagger positions (odd/even overlap pattern: each starts mid of previous)
  applyAlternateStagger();
  // compute connectors
  updateTimelineConnectors();
  // compute floating positions and set initial marker
  computeFloatingPositions();
  // set initial floating year to first item (start from newest/latest)
  if (_floatingPositions && _floatingPositions.length) {
    const first = _floatingPositions[0];
    if (floatingYearEl) floatingYearEl.textContent = first.label || '';
  }
  updateFloatingMarkerOnScroll();
}

let resizeTimer = null;
window.addEventListener('resize', () => {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    layoutTimeline();
  }, 140);
});

// scroll listener for floating marker
window.addEventListener('scroll', onScrollHandler, { passive: true });

// run after load to ensure fonts and images have affected layout
window.addEventListener('load', () => {
  layoutTimeline();
  // re-run shortly after load to account for late layout shifts (fonts/images)
  setTimeout(layoutTimeline, 300);
});

// also run on DOMContentLoaded in case script executed earlier
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', layoutTimeline);
} else {
  layoutTimeline();
}
