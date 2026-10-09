/* Browser editor: no framework, network API, or build step. */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const form = $('signature-form');
  const storageKey = 'signature-studio-v1';
  const example = {
    ...Signature.DEFAULTS, name: 'Alex Morgan', title: 'Operations Director',
    company: 'Northline Co.', phone: '(540) 555-0100', email: 'alex@northline.example',
    website: 'northline.example', street: '123 Main Street, Suite 200',
    city: 'Fredericksburg', region: 'VA', postal: '22407'
  };
  let uploadedLogo = '';
  let naturalWidth = 96;
  let naturalHeight = 96;
  let activeTab = 'signature';
  let usingExample = false;
  let logoState = 'idle';
  let logoToken = 0;
  let uploadToken = 0;
  let logoTimer;
  let saveTimer;
  let toastTimer;

  function getData() {
    const data = Object.fromEntries(new FormData(form).entries());
    data.showLabels = form.elements.showLabels.checked;
    data.layout = document.querySelector('input[name="layout-choice"]:checked').value;
    data.logoData = uploadedLogo;
    data.logoNaturalWidth = naturalWidth;
    data.logoNaturalHeight = naturalHeight;
    return Signature.normalize(data);
  }

  function setData(input) {
    const data = Signature.normalize(input);
    for (const [key, value] of Object.entries(data)) {
      const control = form.elements.namedItem(key);
      if (!control) continue;
      if (control.type === 'checkbox') control.checked = value;
      else control.value = value;
    }
    document.querySelector(`input[name="layout-choice"][value="${data.layout}"]`).checked = true;
    $('accent-hex').value = data.accent;
    uploadedLogo = data.logoData;
    naturalWidth = data.logoNaturalWidth;
    naturalHeight = data.logoNaturalHeight;
    $('logo-file-name').textContent = uploadedLogo ? 'Prepared image loaded' : 'or preview a local file';
    $('logo-file').value = '';
    scheduleLogoCheck();
    update();
  }

  function notify(message) {
    clearTimeout(toastTimer);
    $('toast').textContent = message;
    $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 5000);
  }

  function update() {
    const data = getData();
    // The uploaded file may preview locally while its public URL is being set up.
    const localPreview = data.logoMode === 'hosted' && !data.logoUrl && uploadedLogo;
    const previewData = localPreview ? { ...data, logoMode: 'embedded' } : data;
    const html = Signature.render(data);
    $('signature-preview').innerHTML = Signature.render(previewData);
    $('signature-preview').querySelectorAll('a').forEach(anchor => {
      if (/^https?:/i.test(anchor.getAttribute('href'))) {
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
      }
    });
    $('empty-preview').hidden = Boolean(html || localPreview);
    $('html-output').value = html;
    $('text-output').value = Signature.plainText(data);
    $('example-badge').hidden = !usingExample;
    $('logo-settings').hidden = !(data.logoUrl || uploadedLogo);
    $('upload-options').hidden = !uploadedLogo;
    $('logo-width-value').textContent = data.logoWidth + ' px';

    const messages = Signature.warnings(data);
    if (logoState === 'pending') messages.push('Loading the hosted logo…');
    if (logoState === 'failed') messages.push('The logo could not load. Use a direct public image URL, or upload the file for a local preview.');
    if (logoState === 'loaded' && data.logoMode === 'hosted') messages.push('Hosted logo loaded. Keep this image URL available so your email signatures continue to work.');
    const warningArea = $('signature-warnings');
    warningArea.replaceChildren();
    warningArea.hidden = !messages.length;
    for (const message of messages) {
      const paragraph = document.createElement('p');
      paragraph.textContent = message;
      warningArea.append(paragraph);
    }
    const hasSignature = Boolean(html);
    for (const id of ['copy-signature', 'copy-html', 'download-html', 'download-text']) $(id).disabled = !hasSignature;
    scheduleSave();
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    if (!$('remember-draft').checked) return;
    $('save-status').textContent = 'Saving on this device…';
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ version: 1, data: getData() }));
        $('save-status').textContent = 'Saved on this device. Uncheck to remove the saved draft.';
      } catch {
        $('save-status').textContent = 'This browser could not save the draft. Use Save profile to keep a copy.';
      }
    }, 350);
  }

  function scheduleLogoCheck() {
    clearTimeout(logoTimer);
    const token = ++logoToken;
    const data = getData();
    const url = data.logoMode === 'hosted' ? Signature.webURL(data.logoUrl, true) : '';
    logoState = url ? 'pending' : 'idle';
    if (!url) return;
    logoTimer = setTimeout(() => {
      const image = new Image();
      image.referrerPolicy = 'no-referrer';
      image.onload = () => {
        if (token !== logoToken) return;
        naturalWidth = image.naturalWidth || 96;
        naturalHeight = image.naturalHeight || 96;
        logoState = 'loaded';
        update();
      };
      image.onerror = () => {
        if (token !== logoToken) return;
        logoState = 'failed';
        update();
      };
      image.src = url;
    }, 400);
  }

  function exportData() {
    const data = getData();
    if (!Signature.render(data)) { notify('Add your details first.'); return null; }
    if (data.logoMode === 'hosted' && (data.logoUrl || uploadedLogo)) {
      if (!Signature.webURL(data.logoUrl, true)) {
        notify('Add a public HTTPS logo URL, or choose embedded image export.');
        $('logo-url').focus();
        return null;
      }
      if (logoState === 'pending') { notify('Wait for the hosted logo to finish loading.'); return null; }
      if (logoState === 'failed') { notify('Fix the logo URL before exporting, or remove it.'); $('logo-url').focus(); return null; }
    }
    return data;
  }

  function selectContents(element) {
    element.focus({ preventScroll: true });
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function legacyCopy(value, rich) {
    const previousFocus = document.activeElement;
    const container = document.createElement(rich ? 'div' : 'textarea');
    container.style.cssText = 'position:fixed;left:-10000px;top:0;background:white;color:black;';
    if (rich) {
      container.contentEditable = 'true';
      container.innerHTML = value;
    } else container.value = value;
    document.body.append(container);
    let copied = false;
    try {
      if (rich) selectContents(container);
      else { container.focus(); container.select(); }
      copied = document.execCommand('copy');
    } catch { /* The visible manual-copy dialog is the final fallback. */ }
    container.remove();
    window.getSelection().removeAllRanges();
    previousFocus?.focus({ preventScroll: true });
    return copied;
  }

  function manualCopy(value, rich) {
    const container = $('manual-copy');
    if (rich) container.innerHTML = value;
    else container.textContent = value;
    container.classList.toggle('plain-copy', !rich);
    if (typeof $('copy-dialog').showModal === 'function') $('copy-dialog').showModal();
    else $('copy-dialog').setAttribute('open', '');
    selectContents(container);
  }

  async function copyText(value, successMessage) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(value);
      notify(successMessage);
    } catch {
      if (legacyCopy(value, false)) notify(successMessage);
      else manualCopy(value, false);
    }
  }

  async function copySignature() {
    if (activeTab === 'text') {
      const plain = Signature.plainText(getData());
      if (plain) await copyText(plain, 'Plain text signature copied.');
      else notify('Add your details first.');
      return;
    }
    const data = exportData();
    if (!data) return;
    const html = Signature.render(data);
    const plain = Signature.plainText(data);
    if (activeTab === 'html') { await copyText(html, 'HTML source copied.'); return; }
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error('Rich clipboard unavailable');
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' })
      })]);
      notify('Signature copied. Paste it into your email signature settings.');
    } catch {
      if (legacyCopy(html, true)) notify('Signature copied. Paste it into your email signature settings.');
      else manualCopy(html, true);
    }
  }

  function filename(data, extension) {
    const name = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
    return (name ? name + '-signature' : 'signature') + '.' + extension;
  }

  function download(content, name, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function dataBlob(data) {
    const [header, payload] = data.split(',');
    const decoded = atob(payload);
    const bytes = Uint8Array.from(decoded, char => char.charCodeAt(0));
    return new Blob([bytes], { type: header.match(/data:([^;]+)/)[1] });
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Could not read the file.'));
      reader.readAsDataURL(file);
    });
  }

  async function prepareLogo(file) {
    if (!file || file.size > 5 * 1024 * 1024) throw new Error('Choose an image smaller than 5 MB.');
    if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPG, GIF, or WebP image.');
    const source = await readFile(file);
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('This file could not be opened as an image.'));
      element.src = source;
    });
    // A small PNG preserves transparency and keeps the email payload manageable.
    const scale = Math.min(1, 360 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser cannot prepare the image. Use a public logo URL instead.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const result = canvas.toDataURL('image/png');
    if (!Signature.normalize({ logoData: result }).logoData) throw new Error('The prepared image is too large. Try a simpler or smaller logo.');
    return { data: result, width: canvas.width, height: canvas.height };
  }

  function setTab(tab) {
    activeTab = tab;
    for (const name of ['signature', 'html', 'text']) {
      const selected = name === tab;
      $('tab-' + name).setAttribute('aria-selected', selected ? 'true' : 'false');
      $('tab-' + name).tabIndex = selected ? 0 : -1;
      $('panel-' + name).hidden = !selected;
    }
    $('copy-signature').querySelector('span').textContent = tab === 'html' ? 'Copy HTML' : tab === 'text' ? 'Copy plain text' : 'Copy signature';
  }

  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', event => {
    if (!event.target.name) return;
    usingExample = false;
    if (['logoUrl', 'logoMode'].includes(event.target.name)) scheduleLogoCheck();
    if (event.target.name === 'accent') $('accent-hex').value = event.target.value;
    update();
  });
  $('accent-hex').addEventListener('input', event => {
    const valid = /^#[a-f\d]{6}$/i.test(event.target.value);
    event.target.setAttribute('aria-invalid', valid ? 'false' : 'true');
    if (valid) { $('accent').value = event.target.value; usingExample = false; update(); }
  });
  document.querySelectorAll('input[name="layout-choice"]').forEach(control => control.addEventListener('change', () => { usingExample = false; update(); }));
  document.querySelectorAll('[data-tab]').forEach(control => control.addEventListener('click', () => setTab(control.dataset.tab)));
  document.querySelector('.preview-tabs').addEventListener('keydown', event => {
    const tabs = ['signature', 'html', 'text'];
    let next;
    if (event.key === 'ArrowRight') next = tabs[(tabs.indexOf(activeTab) + 1) % tabs.length];
    if (event.key === 'ArrowLeft') next = tabs[(tabs.indexOf(activeTab) + 2) % tabs.length];
    if (event.key === 'Home') next = tabs[0];
    if (event.key === 'End') next = tabs[2];
    if (next) { event.preventDefault(); setTab(next); $('tab-' + next).focus(); }
  });

  $('logo-file').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    const token = ++uploadToken;
    $('logo-file-name').textContent = 'Preparing image…';
    try {
      const result = await prepareLogo(file);
      if (token !== uploadToken) return;
      uploadedLogo = result.data;
      naturalWidth = result.width;
      naturalHeight = result.height;
      form.elements.logoUrl.value = '';
      form.elements.logoMode.value = 'hosted';
      $('logo-file-name').textContent = file.name;
      usingExample = false;
      scheduleLogoCheck();
      update();
      notify(file.type === 'image/gif' ? 'Logo prepared as a still PNG. Add its public URL for email export.' : 'Logo ready for preview. Add its public URL for email export.');
    } catch (error) {
      if (token !== uploadToken) return;
      $('logo-file-name').textContent = uploadedLogo ? 'Prepared image loaded' : 'or preview a local file';
      notify(error.message);
    }
    event.target.value = '';
  });
  $('download-logo').addEventListener('click', () => {
    if (uploadedLogo) download(dataBlob(uploadedLogo), 'logo.png');
  });
  $('remove-logo').addEventListener('click', () => {
    ++uploadToken;
    uploadedLogo = '';
    form.elements.logoUrl.value = '';
    form.elements.logoMode.value = 'hosted';
    naturalWidth = naturalHeight = 96;
    $('logo-file-name').textContent = 'or preview a local file';
    usingExample = false;
    scheduleLogoCheck();
    update();
  });
  $('remember-draft').addEventListener('change', () => {
    if ($('remember-draft').checked) scheduleSave();
    else {
      clearTimeout(saveTimer);
      try {
        localStorage.removeItem(storageKey);
        $('save-status').textContent = 'Saved draft removed. Your current details remain in this tab.';
      } catch { $('save-status').textContent = 'This browser could not remove its saved draft. Clear this site’s browser storage to remove it.'; }
    }
  });
  $('example-button').addEventListener('click', () => { ++uploadToken; usingExample = true; setData(example); notify('Example details loaded. Replace them with your own.'); });
  $('clear-button').addEventListener('click', () => {
    ++uploadToken;
    usingExample = false;
    $('remember-draft').checked = false;
    clearTimeout(saveTimer);
    let removed = true;
    try { localStorage.removeItem(storageKey); } catch { removed = false; }
    setData({});
    $('save-status').textContent = removed ? 'Your details stay in this browser. No analytics or server uploads.' : 'Current details cleared. Clear this site’s browser storage to remove the saved draft.';
    $('name').focus();
    notify('Details cleared.');
  });

  $('copy-signature').addEventListener('click', copySignature);
  $('copy-html').addEventListener('click', () => {
    const data = exportData();
    if (data) copyText(Signature.render(data), 'HTML source copied.');
  });
  $('download-html').addEventListener('click', () => {
    const data = exportData();
    if (data) download(Signature.documentHTML(data), filename(data, 'html'), 'text/html;charset=utf-8');
  });
  $('download-text').addEventListener('click', () => {
    const data = getData();
    download(Signature.plainText(data), filename(data, 'txt'), 'text/plain;charset=utf-8');
  });
  $('save-profile').addEventListener('click', () => {
    const data = getData();
    download(JSON.stringify({ version: 1, data }, null, 2) + '\n', filename(data, 'json'), 'application/json');
    notify('Profile downloaded. Use Load profile to edit it later.');
  });
  $('load-profile').addEventListener('click', () => $('profile-file').click());
  $('profile-file').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('Choose a profile file smaller than 1 MB.');
      const profile = JSON.parse(await file.text());
      if (!profile || profile.version !== 1 || !profile.data || typeof profile.data !== 'object' || Array.isArray(profile.data)) throw new Error('This is not a Signature Studio v1 profile.');
      ++uploadToken;
      usingExample = false;
      setData(profile.data);
      notify('Profile loaded.');
    } catch (error) { notify(error instanceof SyntaxError ? 'This file does not contain valid JSON.' : error.message); }
    event.target.value = '';
  });

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const profile = JSON.parse(stored);
      if (profile?.version === 1 && profile.data && typeof profile.data === 'object' && !Array.isArray(profile.data)) {
        $('remember-draft').checked = true;
        usingExample = false;
        setData(profile.data);
      } else setData({});
    } else setData({});
  } catch { setData({}); }
})();
