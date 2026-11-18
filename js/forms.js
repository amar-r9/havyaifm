/* Shared form helpers: Formspree submission + Firebase mobile OTP. */
(function () {
  var cfg = window.HAVYA_CONFIG || {};
  var FB_VERSION = '10.12.2';

  /* ---------- Submission ---------- */
  function toText(fields) {
    return Object.keys(fields).map(function (k) { return k + ': ' + (fields[k] || '-'); }).join('\n');
  }

  function send(opts) {
    // opts: { subject, fields (ordered object), replyTo }
    if (cfg.formspreeEndpoint) {
      var payload = Object.assign({ _subject: opts.subject }, opts.fields);
      if (opts.replyTo) payload._replyto = opts.replyTo;
      return fetch(cfg.formspreeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) {
        if (r.ok) return { via: 'formspree' };
        return r.json().catch(function () { return {}; }).then(function (j) {
          var msg = j && j.errors && j.errors.length ? j.errors.map(function (e) { return e.message; }).join(', ') : 'Submission failed';
          throw new Error(msg);
        });
      });
    }
    window.location.href = 'mailto:' + (cfg.contactEmail || '') + '?subject=' +
      encodeURIComponent(opts.subject) + '&body=' + encodeURIComponent(opts.body || toText(opts.fields));
    return Promise.resolve({ via: 'mailto' });
  }

  /* ---------- OTP (Firebase phone auth) ---------- */
  var fbReady = null;
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = function () { rej(new Error('Could not load ' + src)); };
      document.head.appendChild(s);
    });
  }
  function loadFirebase() {
    if (!fbReady) {
      var base = 'https://www.gstatic.com/firebasejs/' + FB_VERSION + '/';
      fbReady = loadScript(base + 'firebase-app-compat.js')
        .then(function () { return loadScript(base + 'firebase-auth-compat.js'); })
        .then(function () {
          if (!window.firebase.apps.length) window.firebase.initializeApp(cfg.firebase);
          var auth = window.firebase.auth();
          auth.useDeviceLanguage();
          return auth;
        });
    }
    return fbReady;
  }

  function normalisePhone(v) {
    var raw = (v || '').trim();
    var d = raw.replace(/\D/g, '');
    if (raw.charAt(0) === '+') return '+' + d;
    if (d.length === 10) return '+91' + d;
    if (d.length === 12 && d.indexOf('91') === 0) return '+' + d;
    if (d.length === 11 && d.charAt(0) === '0') return '+91' + d.slice(1);
    return '+' + d;
  }

  var otpCount = 0;
  function attachOtp(input) {
    var state = { enabled: !!cfg.firebase, verified: false, verifiedNumber: '' };
    if (!state.enabled || !input) {
      return { enabled: false, isVerified: function () { return true; }, focus: function () {} };
    }
    otpCount++;
    var anchor = input.closest('.form__row') || input.closest('label') || input;
    var box = document.createElement('div');
    box.className = 'otp';
    box.innerHTML =
      '<div class="otp__row">' +
        '<button type="button" class="btn btn--line btn--sm otp__send">Send OTP</button>' +
        '<input class="otp__code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6-digit OTP" aria-label="OTP code" hidden>' +
        '<button type="button" class="btn btn--blue btn--sm otp__verify" hidden>Verify</button>' +
      '</div>' +
      '<p class="otp__status" role="status">Verify your mobile number with a one-time password.</p>' +
      '<div id="otp-captcha-' + otpCount + '"></div>';
    anchor.parentNode.insertBefore(box, anchor.nextSibling);

    var sendBtn = box.querySelector('.otp__send');
    var codeIn = box.querySelector('.otp__code');
    var verifyBtn = box.querySelector('.otp__verify');
    var status = box.querySelector('.otp__status');
    var captchaId = 'otp-captcha-' + otpCount;
    var verifier = null, confirmation = null, cooldown = null;

    function setStatus(msg, kind) { status.textContent = msg; status.className = 'otp__status' + (kind ? ' otp__status--' + kind : ''); }
    function reset() {
      state.verified = false; confirmation = null;
      box.classList.remove('otp--done');
      codeIn.hidden = true; verifyBtn.hidden = true; codeIn.value = '';
      sendBtn.hidden = false;
      setStatus('Verify your mobile number with a one-time password.');
    }
    input.addEventListener('input', function () {
      if (state.verified && normalisePhone(input.value) !== state.verifiedNumber) reset();
    });

    function startCooldown() {
      var t = 30; sendBtn.disabled = true;
      clearInterval(cooldown);
      cooldown = setInterval(function () {
        t--; sendBtn.textContent = 'Resend in ' + t + 's';
        if (t <= 0) { clearInterval(cooldown); sendBtn.disabled = false; sendBtn.textContent = 'Resend OTP'; }
      }, 1000);
    }

    sendBtn.addEventListener('click', function () {
      var phone = normalisePhone(input.value);
      if (phone.replace(/\D/g, '').length < 11) {
        input.classList.add('is-invalid');
        setStatus('Enter a valid mobile number first.', 'error');
        input.focus();
        return;
      }
      input.classList.remove('is-invalid');
      sendBtn.disabled = true;
      setStatus('Sending OTP to ' + phone + '…');
      loadFirebase().then(function (auth) {
        if (!verifier) verifier = new window.firebase.auth.RecaptchaVerifier(captchaId, { size: 'invisible' });
        return auth.signInWithPhoneNumber(phone, verifier);
      }).then(function (res) {
        confirmation = res;
        codeIn.hidden = false; verifyBtn.hidden = false; codeIn.focus();
        setStatus('OTP sent to ' + phone + '. Enter it below.', 'ok');
        startCooldown();
      }).catch(function (err) {
        sendBtn.disabled = false;
        if (verifier) { try { verifier.clear(); } catch (e) {} verifier = null; document.getElementById(captchaId).innerHTML = ''; }
        var code = err && err.code || '';
        var msg = code === 'auth/too-many-requests' ? 'Too many attempts. Please try again later.' :
                  code === 'auth/invalid-phone-number' ? 'That mobile number looks invalid.' :
                  'Could not send OTP. Please try again.';
        setStatus(msg, 'error');
        if (window.console) console.warn('OTP send failed', err);
      });
    });

    function verify() {
      var c = codeIn.value.replace(/\D/g, '');
      if (!confirmation || c.length !== 6) { setStatus('Enter the 6-digit OTP.', 'error'); return; }
      verifyBtn.disabled = true;
      setStatus('Verifying…');
      confirmation.confirm(c).then(function () {
        state.verified = true; state.verifiedNumber = normalisePhone(input.value);
        box.classList.add('otp--done');
        codeIn.hidden = true; verifyBtn.hidden = true; sendBtn.hidden = true;
        clearInterval(cooldown);
        setStatus('✓ Mobile number verified', 'ok');
        verifyBtn.disabled = false;
        loadFirebase().then(function (auth) { auth.signOut(); });
      }).catch(function () {
        verifyBtn.disabled = false;
        setStatus('Incorrect OTP. Please check and try again.', 'error');
      });
    }
    verifyBtn.addEventListener('click', verify);
    codeIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); verify(); } });

    return {
      enabled: true,
      isVerified: function () { return state.verified; },
      focus: function () { setStatus('Please verify your mobile number with OTP before submitting.', 'error'); box.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    };
  }

  window.HavyaForms = { send: send, attachOtp: attachOtp, config: cfg, normalisePhone: normalisePhone };
})();
