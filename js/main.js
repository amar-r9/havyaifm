(function () {
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav__toggle');

  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 40); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
  });
  document.querySelectorAll('.nav__links a').forEach(function (a) {
    a.addEventListener('click', function () {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Reveal on scroll
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var siblings = Array.prototype.indexOf.call(e.target.parentNode.children, e.target);
          e.target.style.transitionDelay = Math.min(siblings, 5) * 70 + 'ms';
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  // Contact form -> opens the visitor's mail client (static site, no backend)
  var form = document.getElementById('contactForm');
  var note = form.querySelector('.form__note');
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var ok = true;
    form.querySelectorAll('[required]').forEach(function (f) {
      var bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
      f.classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) { note.textContent = 'Please fill in the highlighted fields.'; return; }
    var d = new FormData(form);
    var body = 'Name: ' + d.get('name') + '\nCompany: ' + d.get('company') + '\nEmail: ' + d.get('email') +
      '\nPhone: ' + d.get('phone') + '\nProperty type: ' + d.get('type') + '\n\n' + d.get('message');
    window.location.href = 'mailto:info@havyaifm.com?subject=' +
      encodeURIComponent('Enquiry from ' + d.get('name')) + '&body=' + encodeURIComponent(body);
    note.textContent = 'Opening your email app… Thank you for reaching out!';
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
