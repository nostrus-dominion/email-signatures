const test = require('node:test');
const assert = require('node:assert/strict');
const Signature = require('../signature.js');

const person = {
  name: 'Paul Example', title: 'Owner', company: 'Example & Co.',
  phone: '+1 (540) 555-0100 ext. 42', mobile: '(540) 555-0120',
  email: 'paul+work@example.com', website: 'example.com',
  street: '123 Main Street', city: 'Fredericksburg', region: 'VA', postal: '22407',
  country: 'United States'
};
const raster = 'data:image/png;base64,iVBORw0KGgo=';

test('exports clickable contact details and a complete address', () => {
  const html = Signature.render(person);
  assert.match(html, /href="tel:\+15405550100;ext=42"/);
  assert.match(html, /href="mailto:paul%2Bwork@example.com"/);
  assert.match(html, /href="https:\/\/example.com\/"/);
  assert.match(html, /Fredericksburg, VA 22407<br>United States/);
  assert.match(html, /Example &amp; Co\./);
});

test('escapes user text in HTML, attributes, and document titles', () => {
  const attack = '<script>alert("x")</script>';
  const html = Signature.documentHTML({ name: attack, company: '<img onerror="bad()">', footer: 'A & B\nSecond line', logoUrl: 'https://example.com/logo.png', logoAlt: '" onerror="bad()' });
  assert.doesNotMatch(html, /<script|<img onerror|alt="" onerror/);
  assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  assert.match(html, /alt="&quot; onerror=&quot;bad\(\)"/);
  assert.match(html, /A &amp; B<br>Second line/);
});

test('rejects executable, local, credentialed, and insecure logo URLs', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,bad', 'file:///etc/passwd', 'https://user:pass@example.com', 'java\nscript:alert(1)']) {
    assert.equal(Signature.webURL(url), '', url);
    const html = Signature.render({ name: 'Example', website: url, logoUrl: url });
    assert.doesNotMatch(html, /href=|src=/, url);
  }
  assert.equal(Signature.webURL('http://example.com/logo.png', true), '');
  assert.equal(Signature.webURL('http://example.com'), 'http://example.com/');
  assert.equal(Signature.webURL(' example.com/path '), 'https://example.com/path');
});

test('renders every layout without app scripts, external CSS, or email flex/grid', () => {
  for (const layout of ['classic', 'stacked', 'compact']) {
    const html = Signature.render({ ...person, layout });
    assert.match(html, /^<table role="presentation"/);
    assert.match(html, /font-family:Arial/);
    assert.match(html, /border-(left|top|bottom):[23]px solid/);
    assert.doesNotMatch(html, /<script|<style|<link|class=|display:(flex|grid)|var\(/);
    assert.ok(html.length < 10000, layout + ' should fit Gmail’s limit');
    assert.equal((html.match(/<table\b/g) || []).length, (html.match(/<\/table>/g) || []).length);
  }
});

test('does not fabricate content or leave labels for blank fields', () => {
  assert.equal(Signature.render({}), '');
  assert.equal(Signature.plainText({}), '');
  const html = Signature.render({ name: 'Name' });
  assert.doesNotMatch(html, /Office:|Email:|Mobile:|Web:|Your name|undefined|null|<img/);
  const noLabels = Signature.render({ ...person, showLabels: false });
  assert.doesNotMatch(noLabels, /Office:|Email:|Mobile:|Web:/);
});

test('preserves logo aspect ratio and uses explicit email image dimensions', () => {
  const html = Signature.render({ name: 'Example', logoUrl: 'https://example.com/logo.png', logoWidth: 120, logoNaturalWidth: 240, logoNaturalHeight: 120 });
  assert.match(html, /width="120" height="60"/);
  assert.match(html, /width:120px;height:60px/);
  const portrait = Signature.render({ name: 'Example', logoUrl: 'https://example.com/logo.png', logoWidth: 180, logoNaturalWidth: 100, logoNaturalHeight: 1000 });
  assert.match(portrait, /width="10" height="100"/);
});

test('hosted export never silently substitutes uploaded data', () => {
  const data = { name: 'Example', logoMode: 'hosted', logoData: raster };
  assert.doesNotMatch(Signature.render(data), /<img|data:image/);
  assert.ok(Signature.warnings(data).some(message => message.includes('before copying')));
  assert.match(Signature.render({ ...data, logoUrl: 'https://example.com/logo.png' }), /src="https:\/\/example.com\/logo.png"/);
  assert.doesNotMatch(Signature.render({ ...data, logoUrl: 'https://example.com/logo.png' }), /data:image/);
});

test('embedded mode accepts raster data only and explains compatibility limits', () => {
  const html = Signature.render({ name: 'Example', logoMode: 'embedded', logoData: raster });
  assert.match(html, /src="data:image\/png;base64,/);
  for (const data of ['data:image/svg+xml;base64,PHN2Zz4=', 'data:text/html;base64,PHNjcmlwdD4=', 'data:image/png;base64,abc" onerror="bad']) {
    assert.equal(Signature.normalize({ logoData: data }).logoData, '');
  }
  assert.ok(Signature.warnings({ logoMode: 'embedded', logoData: raster }).some(message => message.includes('may be removed')));
  const largeImage = 'data:image/png;base64,' + 'A'.repeat(15000);
  assert.ok(Signature.warnings({ name: 'Example', logoMode: 'embedded', logoData: largeImage }).some(message => message.includes('10,000')));
});

test('normalizes imported profiles and limits colors, fonts, dimensions, and length', () => {
  const data = Signature.normalize({ accent: 'red;display:none', font: 'evil', layout: 'random', logoWidth: 9000, fontSize: -10, logoNaturalWidth: 0, logoNaturalHeight: 'bad', name: 'A'.repeat(2000), showLabels: 'false' });
  assert.equal(data.accent, Signature.DEFAULTS.accent);
  assert.equal(data.font, 'arial');
  assert.equal(data.layout, 'classic');
  assert.equal(data.logoWidth, 180);
  assert.equal(data.fontSize, 11);
  assert.equal(data.logoNaturalWidth, 1);
  assert.equal(data.logoNaturalHeight, 96);
  assert.equal(data.name.length, 500);
  assert.equal(data.showLabels, true);
  assert.deepEqual(Signature.normalize(null), Signature.normalize({}));
});

test('invalid contact URLs remain readable without becoming links', () => {
  const html = Signature.render({ name: 'Example', email: 'name@example.com?subject=bad', website: 'javascript:bad()' });
  assert.doesNotMatch(html, /href=/);
  assert.match(html, /name@example.com\?subject=bad/);
  assert.equal(Signature.warnings({ email: 'bad', website: 'javascript:bad()' }).length, 2);
});

test('plain text includes all details without HTML entities or markup', () => {
  const text = Signature.plainText({ ...person, footer: 'Thanks & regards' });
  assert.match(text, /Owner \| Example & Co\./);
  assert.match(text, /Office: \+1 \(540\) 555-0100 ext\. 42/);
  assert.match(text, /123 Main Street\nFredericksburg, VA 22407\nUnited States/);
  assert.match(text, /\n\nThanks & regards$/);
  assert.doesNotMatch(text, /&amp;|<table|<br>/);
});

test('browser build attaches the same engine without requiring a module loader', () => {
  const vm = require('node:vm');
  const fs = require('node:fs');
  const context = vm.createContext({ URL });
  vm.runInContext(fs.readFileSync(require.resolve('../signature.js'), 'utf8'), context);
  assert.equal(context.Signature.render(person), Signature.render(person));
});
