/* Email HTML stays separate from the editor so it can be tested and reused. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Signature = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Font names reference installed typefaces; font files are never bundled or embedded.
  const FONTS = Object.freeze({
    cambria: 'Cambria, Georgia, Times New Roman, serif',
    constantia: 'Constantia, Georgia, Times New Roman, serif',
    georgia: 'Georgia, Times New Roman, serif',
    palatino: 'Palatino Linotype, Book Antiqua, Palatino, Georgia, serif',
    times: 'Times New Roman, Times, serif',
    arial: 'Arial, Helvetica, sans-serif',
    calibri: 'Calibri, Arial, Helvetica, sans-serif',
    segoe: 'Segoe UI, Arial, Helvetica, sans-serif',
    tahoma: 'Tahoma, Geneva, Arial, sans-serif',
    trebuchet: 'Trebuchet MS, Arial, sans-serif',
    verdana: 'Verdana, Geneva, sans-serif',
    consolas: 'Consolas, Menlo, Monaco, Courier New, monospace',
    courier: 'Courier New, Courier, monospace',
    lucida: 'Lucida Console, Monaco, Courier New, monospace'
  });
  const DEFAULTS = Object.freeze({
    name: '', title: '', company: '', phone: '', mobile: '', email: '', website: '',
    street: '', city: '', region: '', postal: '', country: '', footer: '',
    layout: 'classic', accent: '#285847', font: 'arial', fontSize: 13,
    showLabels: true, logoMode: 'hosted', logoUrl: '', logoData: '',
    logoAlt: 'Company logo', logoWidth: 96, logoNaturalWidth: 96, logoNaturalHeight: 96
  });
  const TEXT_FIELDS = ['name', 'title', 'company', 'phone', 'mobile', 'email', 'website',
    'street', 'city', 'region', 'postal', 'country', 'footer', 'logoUrl', 'logoAlt'];

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function number(value, min, max, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
  }

  // Absolute web URLs only. Credentials and executable URL schemes are rejected.
  function webURL(value, httpsOnly = false) {
    let candidate = String(value ?? '').trim();
    if (!candidate || /[\u0000-\u001f\u007f]/.test(candidate)) return '';
    if (!/^[a-z][a-z\d+.-]*:/i.test(candidate)) candidate = 'https://' + candidate;
    try {
      const url = new URL(candidate);
      if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password) return '';
      if (httpsOnly && url.protocol !== 'https:') return '';
      return url.href;
    } catch { return ''; }
  }

  function emailURL(value) {
    const email = String(value ?? '').trim();
    if (!/^[^\s@<>"?&#]+@[^\s@<>"?&#]+\.[^\s@<>"?&#]+$/.test(email)) return '';
    return 'mailto:' + encodeURIComponent(email).replace(/%40/g, '@');
  }

  function phoneURL(value) {
    let phone = String(value ?? '').trim();
    const extension = phone.match(/(?:ext\.?|x|#)\s*(\d+)\s*$/i);
    if (extension) phone = phone.slice(0, extension.index);
    const digits = phone.replace(/[^\d]/g, '');
    if (!digits) return '';
    return 'tel:' + (phone.startsWith('+') ? '+' : '') + digits + (extension ? ';ext=' + extension[1] : '');
  }

  function imageData(value) {
    const data = typeof value === 'string' ? value : '';
    return data.length <= 700000 && /^data:image\/(png|jpeg|gif|webp);base64,[a-z\d+/]+={0,2}$/i.test(data) ? data : '';
  }

  function normalize(input = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) input = {};
    const result = { ...DEFAULTS };
    for (const field of TEXT_FIELDS) {
      result[field] = typeof input[field] === 'string' ? input[field].trim().slice(0, field === 'footer' ? 1200 : 500) : '';
    }
    result.layout = ['classic', 'stacked', 'compact'].includes(input.layout) ? input.layout : DEFAULTS.layout;
    result.accent = /^#[a-f\d]{6}$/i.test(input.accent || '') ? input.accent : DEFAULTS.accent;
    result.font = Object.hasOwn(FONTS, input.font) ? input.font : DEFAULTS.font;
    result.fontSize = number(input.fontSize, 11, 16, DEFAULTS.fontSize);
    result.showLabels = typeof input.showLabels === 'boolean' ? input.showLabels : DEFAULTS.showLabels;
    result.logoMode = input.logoMode === 'embedded' ? 'embedded' : 'hosted';
    result.logoData = imageData(input.logoData);
    result.logoWidth = number(input.logoWidth, 48, 180, DEFAULTS.logoWidth);
    result.logoNaturalWidth = number(input.logoNaturalWidth, 1, 20000, DEFAULTS.logoNaturalWidth);
    result.logoNaturalHeight = number(input.logoNaturalHeight, 1, 20000, DEFAULTS.logoNaturalHeight);
    return result;
  }

  function addressLines(data) {
    const cityRegion = [data.city, data.region].filter(Boolean).join(', ');
    const locality = [cityRegion, data.postal].filter(Boolean).join(' ');
    return [data.street, locality, data.country].filter(Boolean);
  }

  function logoSource(data) {
    return data.logoMode === 'embedded' ? data.logoData : webURL(data.logoUrl, true);
  }

  function link(label, url, color = '#374151') {
    const text = escapeHTML(label);
    return url ? `<a href="${escapeHTML(url)}" style="color:${color};text-decoration:none;">${text}</a>` : text;
  }

  function identity(data, compact = false) {
    const titleCompany = [data.title, data.company].filter(Boolean).map(escapeHTML).join(' &middot; ');
    const name = data.name ? `<tr><td style="padding:0 0 3px;font-size:${data.fontSize + (compact ? 3 : 5)}px;line-height:${data.fontSize + 9}px;font-weight:bold;color:${data.accent};">${escapeHTML(data.name)}</td></tr>` : '';
    const title = titleCompany ? `<tr><td style="padding:0 0 10px;color:#4b5563;line-height:${data.fontSize + 6}px;">${titleCompany}</td></tr>` : '';
    return name + title;
  }

  function contactRows(data) {
    const fields = [
      ['Office', data.phone, phoneURL(data.phone)],
      ['Mobile', data.mobile, phoneURL(data.mobile)],
      ['Email', data.email, emailURL(data.email)],
      ['Web', data.website.replace(/^https?:\/\//i, '').replace(/\/$/, ''), webURL(data.website)]
    ];
    let rows = '';
    for (const [label, value, url] of fields) {
      if (!value) continue;
      const prefix = data.showLabels ? `<span style="color:#6b7280;">${label}:&nbsp;</span>` : '';
      rows += `<tr><td style="padding:0 0 3px;line-height:${data.fontSize + 6}px;">${prefix}${link(value, url)}</td></tr>`;
    }
    const address = addressLines(data);
    if (address.length) rows += `<tr><td style="padding:5px 0 0;line-height:${data.fontSize + 6}px;color:#4b5563;">${address.map(escapeHTML).join('<br>')}</td></tr>`;
    return rows;
  }

  function compactContacts(data) {
    const contacts = [
      ['Office', data.phone, phoneURL(data.phone)], ['Mobile', data.mobile, phoneURL(data.mobile)],
      ['Email', data.email, emailURL(data.email)],
      ['Web', data.website.replace(/^https?:\/\//i, '').replace(/\/$/, ''), webURL(data.website)]
    ].filter(([, value]) => value);
    // Break long contact lists into two rows to avoid an excessively wide signature.
    let result = '';
    for (let index = 0; index < contacts.length; index += 2) {
      const content = contacts.slice(index, index + 2).map(([label, value, url]) =>
        (data.showLabels ? `<span style="color:#6b7280;">${label}:&nbsp;</span>` : '') + link(value, url)
      ).join('<span style="color:#9ca3af;">&nbsp;&nbsp;|&nbsp;&nbsp;</span>');
      result += `<tr><td style="padding:0 0 3px;line-height:${data.fontSize + 6}px;">${content}</td></tr>`;
    }
    const address = addressLines(data);
    if (address.length) result += `<tr><td style="padding:5px 0 0;color:#4b5563;line-height:${data.fontSize + 6}px;">${address.map(escapeHTML).join('<br>')}</td></tr>`;
    return result;
  }

  function logoHTML(data) {
    const src = logoSource(data);
    if (!src) return '';
    const scale = Math.min(data.logoWidth / data.logoNaturalWidth, 100 / data.logoNaturalHeight);
    const width = Math.max(1, Math.round(data.logoNaturalWidth * scale));
    const height = Math.max(1, Math.round(data.logoNaturalHeight * scale));
    const image = `<img src="${escapeHTML(src)}" alt="${escapeHTML(data.logoAlt || data.company || 'Company logo')}" width="${width}" height="${height}" style="display:block;width:${width}px;height:${height}px;border:0;outline:none;text-decoration:none;">`;
    const website = webURL(data.website);
    return website ? `<a href="${escapeHTML(website)}" style="text-decoration:none;">${image}</a>` : image;
  }

  function footerHTML(data) {
    return data.footer ? `<tr><td style="padding:12px 0 0;font-size:11px;line-height:16px;color:#6b7280;">${escapeHTML(data.footer).replace(/\r?\n/g, '<br>')}</td></tr>` : '';
  }

  function render(input) {
    const data = normalize(input);
    if (!TEXT_FIELDS.some(field => !['logoUrl', 'logoAlt'].includes(field) && data[field]) && !logoSource(data)) return '';
    const font = FONTS[data.font];
    const tableStyle = `border-collapse:collapse;font-family:${font};font-size:${data.fontSize}px;color:#374151;mso-table-lspace:0pt;mso-table-rspace:0pt;`;
    const details = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${tableStyle}"><tbody>${identity(data, data.layout === 'compact')}${data.layout === 'compact' ? compactContacts(data) : contactRows(data)}</tbody></table>`;
    const logo = logoHTML(data);
    let body;
    if (data.layout === 'stacked') {
      body = (logo ? `<tr><td style="padding:0 0 14px;">${logo}</td></tr>` : '') +
        `<tr><td style="padding:12px 0 0;border-top:3px solid ${data.accent};">${details}</td></tr>`;
    } else if (data.layout === 'compact') {
      body = `<tr><td style="padding:0 0 10px;border-bottom:2px solid ${data.accent};"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${tableStyle}"><tbody><tr>${logo ? `<td valign="top" style="padding:0 14px 0 0;vertical-align:top;">${logo}</td>` : ''}<td valign="top" style="padding:0;vertical-align:top;">${details}</td></tr></tbody></table></td></tr>`;
    } else {
      body = `<tr><td><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${tableStyle}"><tbody><tr>${logo ? `<td valign="top" style="padding:0 18px 0 0;vertical-align:top;">${logo}</td>` : ''}<td valign="top" style="padding:0 0 0 18px;border-left:2px solid ${data.accent};vertical-align:top;">${details}</td></tr></tbody></table></td></tr>`;
    }
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${tableStyle}"><tbody>${body}${footerHTML(data)}</tbody></table>`;
  }

  function plainText(input) {
    const data = normalize(input);
    const identity = [data.name, [data.title, data.company].filter(Boolean).join(' | ')].filter(Boolean);
    const contacts = [['Office', data.phone], ['Mobile', data.mobile], ['Email', data.email], ['Web', data.website]]
      .filter(([, value]) => value).map(([label, value]) => (data.showLabels ? label + ': ' : '') + value);
    return [...identity, ...contacts, ...addressLines(data), ...(data.footer ? ['', data.footer] : [])].join('\n');
  }

  function documentHTML(input) {
    const data = normalize(input);
    return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHTML(data.name || 'Email')} signature</title></head><body style="margin:24px;background:#fff;">\n${render(data)}\n</body></html>\n`;
  }

  function warnings(input) {
    const data = normalize(input);
    const result = [];
    if (data.email && !emailURL(data.email)) result.push('The email address is not valid. It will appear as text until corrected.');
    if (data.website && !webURL(data.website)) result.push('Use a valid http:// or https:// website address to make it clickable.');
    if (data.logoMode === 'hosted' && data.logoUrl && !webURL(data.logoUrl, true)) result.push('The logo needs a public HTTPS image URL. A sharing page or local file path will not work.');
    if (data.logoMode === 'hosted' && !data.logoUrl && data.logoData) result.push('Your uploaded logo is available for preview. Add its public HTTPS URL before copying or downloading a signature with the logo.');
    if (data.logoMode === 'embedded' && data.logoData) result.push('Embedded images may be removed by Gmail, Outlook, or other clients. A public HTTPS logo URL is recommended.');
    if (render(data).length > 10000) result.push('This signature exceeds Gmail’s 10,000-character limit. Use a hosted logo and shorten the closing note if needed.');
    return result;
  }

  return { DEFAULTS, FONTS, escapeHTML, webURL, emailURL, phoneURL, normalize, logoSource, render, plainText, documentHTML, warnings };
});
