(function () {
  var form = document.getElementById('assessForm');
  if (!form) return;
  var mapInput = document.getElementById('mapLink');
  var locBtn = document.getElementById('useLocation');
  var locStatus = document.getElementById('locStatus');
  var preview = document.getElementById('previewMap');
  var note = document.getElementById('assessNote');
  var servicesError = document.getElementById('servicesError');
  var PHONE = '917676276066';
  var EMAIL = 'info@havyaifm.com';
  var via = 'email';

  function updatePreview() {
    var v = mapInput.value.trim();
    if (/^https?:\/\//i.test(v)) { preview.href = v; preview.hidden = false; }
    else { preview.hidden = true; }
  }
  mapInput.addEventListener('input', updatePreview);

  locBtn.addEventListener('click', function () {
    if (!navigator.geolocation) {
      locStatus.textContent = 'Location is not available in this browser. Please paste a Google Maps link instead.';
      return;
    }
    locStatus.textContent = 'Finding your location…';
    locBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(function (pos) {
      var lat = pos.coords.latitude.toFixed(6), lng = pos.coords.longitude.toFixed(6);
      mapInput.value = 'https://www.google.com/maps?q=' + lat + ',' + lng;
      locStatus.textContent = 'Location added (' + lat + ', ' + lng + '). Check the pin to make sure it is your site.';
      locBtn.disabled = false;
      updatePreview();
    }, function () {
      locStatus.textContent = 'Could not get your location. Please allow location access, or paste a Google Maps link.';
      locBtn.disabled = false;
    }, { enableHighAccuracy: true, timeout: 15000 });
  });

  form.querySelectorAll('button[type=submit]').forEach(function (b) {
    b.addEventListener('click', function () { via = b.getAttribute('data-via'); });
  });

  function val(name) { var el = form.elements[name]; return el && el.value ? el.value.trim() : ''; }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var ok = true, firstBad = null;
    form.querySelectorAll('[required]').forEach(function (f) {
      var bad = !f.value.trim() ||
        (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value)) ||
        (f.type === 'tel' && f.value.replace(/\D/g, '').length < 10);
      f.classList.toggle('is-invalid', bad);
      if (bad) { ok = false; firstBad = firstBad || f; }
    });
    var services = Array.prototype.map.call(form.querySelectorAll('input[name=services]:checked'), function (c) { return c.value; });
    if (!services.length) { ok = false; servicesError.textContent = 'Please select at least one service.'; }
    else { servicesError.textContent = ''; }

    if (!ok) {
      note.textContent = 'Please complete the highlighted fields.';
      (firstBad || servicesError).scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    var lines = [
      'SITE ASSESSMENT REQUEST',
      '',
      '— Site details —',
      'Site name: ' + val('site_name'),
      'Property type: ' + val('property_type'),
      'Built-up area: ' + (val('area') || '-'),
      'Floors / blocks: ' + (val('floors') || '-'),
      'Occupants / units: ' + (val('occupancy') || '-'),
      'Address: ' + val('address'),
      'City: ' + val('city') + (val('pincode') ? ' - ' + val('pincode') : ''),
      'Google location: ' + (val('map_link') || '-'),
      '',
      '— Services —',
      services.join(', '),
      'Request type: ' + val('request_type'),
      'Preferred visit date: ' + (val('visit_date') || '-'),
      'Notes: ' + (val('notes') || '-'),
      '',
      '— Contact —',
      'Name: ' + val('name') + (val('designation') ? ' (' + val('designation') + ')' : ''),
      'Company: ' + (val('company') || '-'),
      'Mobile: ' + val('mobile'),
      'Email: ' + val('email'),
      'Preferred contact: ' + val('contact_pref')
    ];
    var body = lines.join('\n');

    if (via === 'whatsapp') {
      window.open('https://wa.me/' + PHONE + '?text=' + encodeURIComponent(body), '_blank', 'noopener');
      note.textContent = 'Opening WhatsApp… just press send. Thank you!';
    } else {
      window.location.href = 'mailto:' + EMAIL + '?subject=' +
        encodeURIComponent('Site assessment request – ' + val('site_name') + ', ' + val('city')) +
        '&body=' + encodeURIComponent(body);
      note.textContent = 'Opening your email app… just press send. Thank you!';
    }
  });
})();
