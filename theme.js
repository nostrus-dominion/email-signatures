/* Apply the theme before the page paints; keep this script before styles.css. */
(() => {
  'use strict';
  const storageKey = 'signature-studio-theme';
  const root = document.documentElement;
  const systemTheme = typeof window.matchMedia === 'function' ?
    window.matchMedia('(prefers-color-scheme: dark)') : null;
  let preference = null;

  function readPreference() {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved === 'dark' || saved === 'light' ? saved : null;
    } catch { return null; }
  }

  function updateButton() {
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    const dark = root.dataset.theme === 'dark';
    button.setAttribute('aria-pressed', String(dark));
    button.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    const browserColor = document.querySelector('meta[name="theme-color"]');
    if (browserColor) browserColor.content = theme === 'dark' ? '#121b16' : '#f5f5ef';
    updateButton();
  }

  function applyPreference() {
    applyTheme(preference || (systemTheme?.matches ? 'dark' : 'light'));
  }

  function initializeButton() {
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    updateButton();
    button.addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyPreference();
      try { localStorage.setItem(storageKey, preference); }
      catch { /* The toggle still works if the browser blocks local storage. */ }
    });
  }

  preference = readPreference();
  applyPreference();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeButton, {once:true});
  } else initializeButton();

  const followSystem = () => { if (!preference) applyPreference(); };
  if (systemTheme?.addEventListener) systemTheme.addEventListener('change', followSystem);
  else if (systemTheme?.addListener) systemTheme.addListener(followSystem);

  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    preference = readPreference();
    applyPreference();
  });
})();
