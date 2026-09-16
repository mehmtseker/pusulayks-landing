/* Pusula YKS — tanıtım sitesi etkileşimleri. Bağımlılık yok. */
(function () {
  "use strict";

  window.__pusulaReady = true;
  var root = document.documentElement;
  /* Yedek zamanlayıcı (head'deki betik) devreye girdiyse sayfa JS'siz düzenine geçmiştir.
     Okuyan kullanıcının altından yerleşimi çekmemek için o düzeni bozmuyoruz. */
  var late = window.__pusulaLate === true;
  if (!late) root.classList.add("js");

  /* ---------- Başlık gölgesi ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobil menü ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("mobile-nav");
  if (toggle && menu) {
    var setOpen = function (open) {
      menu.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("click", function (e) {
      if (!menu.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
    /* Klavyeyle menüden çıkıldığında menü açık kalıp içeriği örtmesin */
    menu.addEventListener("focusout", function (e) {
      var next = e.relatedTarget;
      if (next && !menu.contains(next) && next !== toggle) setOpen(false);
    });
  }

  /* ---------- Ekran sekmeleri (WAI-ARIA tabs) ---------- */
  var tablist = document.querySelector('[role="tablist"]');
  if (tablist && !late) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab, false); });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = tabs.length - 1;
        if (next !== null) {
          e.preventDefault();
          select(tabs[next], true);
        }
      });
    });
    var initial = tabs.filter(function (t) { return t.getAttribute("aria-selected") === "true"; })[0] || tabs[0];
    select(initial, false);
  }

  /* ---------- Kaydırınca beliren içerik ---------- */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    revealEls.forEach(function (el) { revealer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Mobil yapışkan indirme çubuğu ----------
     Hero ekrandan çıkınca görünür, son çağrı bölümü ya da altbilgi görününce gizlenir. */
  var sticky = document.getElementById("sticky-cta");
  var hero = document.querySelector(".hero");
  if (sticky && hero && "IntersectionObserver" in window) {
    var heroOnScreen = true;
    var endOnScreen = false;
    var update = function () {
      sticky.classList.toggle("is-visible", !heroOnScreen && !endOnScreen);
    };
    new IntersectionObserver(function (entries) {
      heroOnScreen = entries[0].isIntersecting;
      update();
    }).observe(hero);

    var endEls = document.querySelectorAll(".final, .site-footer");
    if (endEls.length) {
      var endState = new Map();
      var endObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { endState.set(entry.target, entry.isIntersecting); });
        endOnScreen = Array.from(endState.values()).some(Boolean);
        update();
      });
      endEls.forEach(function (el) { endObserver.observe(el); });
    }
  }

  /* ---------- Adres çubuğundaki #bağlantı ile açılışta doğru yere in ----------
     Sayfa yüklenirken görseller yerleşince yükseklik değiştiği için tarayıcının
     ilk hesapladığı konum kayıyor; yükleme bitince hedefi yeniden hizalıyoruz. */
  if (location.hash.length > 1) {
    var hashTarget = null;
    try { hashTarget = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (err) { hashTarget = null; }
    if (hashTarget) {
      window.addEventListener("load", function () {
        hashTarget.scrollIntoView({ behavior: "auto", block: "start" });
      });
    }
  }

  /* ---------- Yıl ---------- */
  var year = String(new Date().getFullYear());
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = year; });

  /* ---------- Hesap silme talebi (/hesap-silme) ---------- */
  var form = document.getElementById("deletion-form");
  if (form) {
    var emailInput = document.getElementById("deletion-email");
    var confirmInput = document.getElementById("deletion-confirm");
    var errorBox = document.getElementById("deletion-error");
    var done = document.getElementById("deletion-done");

    var showError = function (message, field) {
      errorBox.textContent = message;
      errorBox.hidden = false;
      if (field) {
        field.setAttribute("aria-invalid", "true");
        field.setAttribute("aria-describedby", "deletion-error");
        field.focus();
      }
    };
    var clearError = function () {
      errorBox.hidden = true;
      errorBox.textContent = "";
      emailInput.removeAttribute("aria-invalid");
      emailInput.removeAttribute("aria-describedby");
      confirmInput.removeAttribute("aria-invalid");
      confirmInput.removeAttribute("aria-describedby");
    };

    emailInput.addEventListener("input", clearError);
    confirmInput.addEventListener("change", clearError);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = emailInput.value.trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError("Lütfen Pusula hesabında kullandığın geçerli e-posta adresini yaz.", emailInput);
        return;
      }
      if (!confirmInput.checked) {
        showError("Hesabının ve ilişkili verilerin silinmesini istediğini onaylamalısın.", confirmInput);
        return;
      }
      clearError();

      var subject = encodeURIComponent("Pusula YKS hesap ve veri silme talebi");
      var body = encodeURIComponent([
        "Merhaba,",
        "",
        "Pusula YKS hesabımın ve hesabımla ilişkili kişisel verilerin silinmesini talep ediyorum.",
        "Pusula hesabı e-posta adresim: " + email,
        "",
        "Bu talebin hesabımın doğrulanmasından sonra işleme alınmasını rica ederim.",
        "",
        "Teşekkürler."
      ].join("\n"));

      window.location.href = "mailto:destek@pusulayks.com?subject=" + subject + "&body=" + body;

      form.hidden = true;
      done.hidden = false;
      var doneTitle = document.getElementById("deletion-done-title");
      if (doneTitle) doneTitle.focus();
    });
  }
})();
