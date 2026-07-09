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
    link.classList.toggle("is-active", current && link.getAttribute("href") === `#${current.id}`);
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

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 60, 220)}ms`;
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
