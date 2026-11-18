(function () {
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav__toggle');

  function onScroll() { nav.classList.toggle('is-scrolled', nav.classList.contains('nav--solid') || window.scrollY > 40); }
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

  // Contact form -> Formspree (or email app fallback), with optional mobile OTP
  var form = document.getElementById('contactForm');
  if (form && window.HavyaForms) {
    var note = form.querySelector('.form__note');
    var btn = form.querySelector('button[type=submit]');
    var otp = window.HavyaForms.attachOtp(form.elements.phone);
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (f) {
        var bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value)) ||
          (f.type === 'tel' && f.value.replace(/\D/g, '').length < 10);
        f.classList.toggle('is-invalid', bad);
        if (bad) ok = false;
      });
      if (!ok) { note.textContent = 'Please fill in the highlighted fields.'; return; }
      if (!otp.isVerified()) { note.textContent = 'Please verify your mobile number.'; otp.focus(); return; }
      var d = new FormData(form);
      var fields = {
        'Form': 'Website enquiry',
        'Name': d.get('name'),
        'Company': d.get('company'),
        'Email': d.get('email'),
        'Mobile': d.get('phone'),
        'Mobile verified': otp.enabled ? 'Yes (OTP)' : 'Not checked',
        'Property type': d.get('type'),
        'Message': d.get('message')
      };
      btn.disabled = true; note.textContent = 'Sending…';
      window.HavyaForms.send({ subject: 'Website enquiry from ' + d.get('name'), fields: fields, replyTo: d.get('email') })
        .then(function (r) {
          if (r.via === 'formspree') { form.reset(); note.textContent = 'Thank you! Your enquiry has been sent. Our team will contact you shortly.'; }
          else { note.textContent = 'Opening your email app… just press send. Thank you!'; }
        })
        .catch(function () { note.textContent = 'Sorry, something went wrong. Please call or WhatsApp us on +91 76762 76066.'; })
        .then(function () { btn.disabled = false; });
    });
  }

  document.getElementById('year').textContent = new Date().getFullYear();
})();
