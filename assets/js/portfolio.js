(function () {
  "use strict";

  /* ------------------------------------------------------- theme toggle */

  var root = document.documentElement;
  var toggle = document.querySelector(".theme-toggle");
  var label = toggle && toggle.querySelector(".theme-toggle-label");

  function currentTheme() {
    var set = root.getAttribute("data-theme");
    if (set === "light" || set === "dark") return set;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function paintToggle() {
    if (!toggle) return;
    var dark = currentTheme() === "dark";
    if (label) label.textContent = dark ? "Light mode" : "Dark mode";
    toggle.setAttribute("aria-pressed", dark ? "false" : "true");
    toggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem("theme", next);
      } catch (e) {}
      paintToggle();
    });
    paintToggle();
  }

  // Follow the OS while the visitor has not made an explicit choice.
  var scheme = window.matchMedia("(prefers-color-scheme: light)");
  var onSchemeChange = function () {
    if (!root.hasAttribute("data-theme")) paintToggle();
  };
  if (scheme.addEventListener) scheme.addEventListener("change", onSchemeChange);
  else if (scheme.addListener) scheme.addListener(onSchemeChange);

  /* ------------------------------------------------ profile image fallback */

  var frame = document.querySelector(".identity-photo");
  var photo = frame && frame.querySelector("img");

  if (frame && photo) {
    var markMissing = function () {
      frame.classList.add("photo-missing");
    };
    photo.addEventListener("error", markMissing);
    if (photo.complete && photo.naturalWidth === 0) markMissing();
  }

  /* ------------------------------------------------------ toc scroll spy */

  var links = Array.prototype.slice.call(document.querySelectorAll(".toc-list a"));
  if (!links.length) return;

  var entries = links
    .map(function (link) {
      var id = (link.getAttribute("href") || "").slice(1);
      var section = id && document.getElementById(id);
      return section ? { link: link, section: section } : null;
    })
    .filter(Boolean);

  if (!entries.length) return;

  var tocList = document.querySelector(".toc-list");
  var active = null;

  // Keeps the active chip visible in the horizontal strip used on narrow screens.
  function revealInStrip(link) {
    if (!tocList) return;
    if (window.getComputedStyle(tocList).flexDirection !== "row") return;
    if (tocList.scrollWidth <= tocList.clientWidth) return;

    var target = link.offsetLeft - (tocList.clientWidth - link.offsetWidth) / 2;
    var max = tocList.scrollWidth - tocList.clientWidth;
    tocList.scrollTo({
      left: Math.max(0, Math.min(target, max)),
      behavior: "smooth"
    });
  }

  function setActive(entry) {
    if (entry === active) return;
    if (active) active.link.removeAttribute("aria-current");
    entry.link.setAttribute("aria-current", "true");
    active = entry;
    revealInStrip(entry.link);
  }

  function sync() {
    var probe = window.scrollY + window.innerHeight * 0.28;
    var atBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 2;

    if (atBottom) {
      setActive(entries[entries.length - 1]);
      return;
    }

    var found = entries[0];
    for (var i = 0; i < entries.length; i += 1) {
      if (entries[i].section.getBoundingClientRect().top + window.scrollY <= probe) {
        found = entries[i];
      }
    }
    setActive(found);
  }

  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(function () {
      queued = false;
      sync();
    });
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  sync();
})();
