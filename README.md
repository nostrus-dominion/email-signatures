# Signature Studio

A custom email signature creator you can host on GitHub Pages. Enter your contact details, add a company logo, choose a layout, and copy the formatted signature into your email client.

Plain HTML, CSS, and JavaScript. No framework, package install, backend, or build step.

## Features

- Name, job title, company, office and mobile phone numbers, email, and website.
- Complete street address, including city, state/region, postal code, and country.
- Company logos from a public HTTPS image URL or a local PNG, JPG, GIF, or WebP file.
- Classic, stacked, and compact layouts with custom colors and text size.
- 14 font choices grouped into Serif, Sans-Serif, and Monospace.
- Live preview, HTML source, and plain-text views.
- Formatted clipboard copy, HTML and text downloads, and a manual-copy fallback.
- Save/load JSON profiles for different people or companies.
- Starts with empty contact fields and helpful placeholders; **TRY EXAMPLE** loads sample details on demand.
- Save profile, Load profile, and Clear all controls in the top navigation bar.
- Optional browser-local draft saving. Clear all removes the saved draft as well.
- Responsive layout, keyboard-accessible controls, and no analytics.
- Light and dark themes with a sun/moon toggle in the top right.

## Light and dark mode

The editor starts with your system's color preference. Click the moon to switch to dark mode, or the sun to switch back to light mode. Your choice is remembered on this device, independently of saved signature drafts.

The email preview keeps the signature on white email paper so its colors match the exported HTML. Theme settings apply to the editor and are not included in saved profiles or exported signatures.

## Fonts and licensing

The font menu groups 14 choices by style:

| Group | Fonts |
| --- | --- |
| Serif | Cambria, Constantia, Georgia, Palatino Linotype, Times New Roman |
| Sans-Serif | Arial, Calibri, Segoe UI, Tahoma, Trebuchet MS, Verdana |
| Monospace | Consolas, Courier New, Lucida Console |

Signatures request fonts already installed on the device using inline CSS font stacks. Each choice includes alternatives and a matching generic family (`serif`, `sans-serif`, or `monospace`), so a missing font can fall back to a similar style. Appearance can vary between your browser and recipients' email clients.

The app does not bundle, download, or embed font files. Microsoft permits referencing Windows-supplied font names in CSS font stacks, even when the publisher does not use Windows; see its [font redistribution FAQ, Web section](https://learn.microsoft.com/en-us/typography/fonts/font-faq#web). Font files remain subject to their owners' licenses.

Existing profiles keep the original Arial, Verdana, Georgia, and Trebuchet MS choices; Arial remains the default.

## Run it

Open `index.html` in your browser. Everything works without a server; automatic clipboard access depends on your browser's permissions, with a visible manual-copy fallback when necessary.

If you prefer a local web server:

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000>.

## Publish on GitHub Pages

1. Create a repository named `email-signature-creator` (or choose another name).
2. Put this project's files directly in the repository root, with `index.html` at the top level. Include `.nojekyll` and `.gitattributes`.
3. Commit and push to `main`.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select **main** and **/ (root)**, then save.

GitHub will show your published address. For a repository named `email-signature-creator` under `nostrus-dominion`, the expected address is:

```text
https://nostrus-dominion.github.io/email-signature-creator/
```

This address is an example until you publish the repository. All app assets use relative paths, so both project sites and a `USERNAME.github.io` repository work.

Official setup reference: [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Add a logo

### Public image URL — recommended

Use a direct HTTPS image address that can be opened without signing in, such as:

```text
https://nostrus-dominion.github.io/email-signature-creator/assets/logo.png
```

To host your own logo with the app:

1. Choose an image in the editor. It stays in your browser and appears in the preview.
2. Click **Download prepared PNG**. The editor keeps transparency, preserves proportions, and reduces the longest edge to at most 360 pixels. Uploaded GIFs become a still PNG.
3. Add the downloaded `logo.png` to the repository's `assets/` folder and push it.
4. After GitHub Pages deploys, paste the direct HTTPS image URL into the editor.
5. Wait for the logo to load, then copy or download the signature.

The app does not publish uploaded logos. In hosted mode it requires the image URL before exporting an uploaded logo, so the export cannot accidentally omit the previewed image. Sharing pages and local file paths are not image URLs.

The exported logo has explicit width and height attributes, stays within the selected maximum width, and is capped at 100 pixels high. Keep the image URL alive for as long as you use the signature. Recipients may need to allow remote images in their email client.

### Embedded image — limited support

After choosing a local file, you can select **Embed uploaded image (limited support)**. This includes the prepared PNG as a base64 data URL inside the signature HTML. Some email clients strip or do not render these images, and a large embedded image can exceed a client's signature length limit. Use the public URL option for broader compatibility.

This static tool cannot create a MIME/CID attachment in an outgoing email. If you need a logo attached to each message rather than hosted, use your email client's image insertion control after pasting the text signature.

References: [Google's signature image troubleshooting](https://support.google.com/mail/answer/11468381) and [Can I email's base64 image tests](https://www.caniemail.com/features/image-base64/).

## Install your signature

1. Enter your details in the empty fields. Use **TRY EXAMPLE** if you want to explore a sample signature first.
2. Choose a layout and style; blank optional fields are omitted.
3. Use **Copy signature** in the Signature tab, then paste normally into a rich-text signature editor. Do not use “paste as plain text” if you want the formatting and logo.
4. Save the signature, choose it for new messages and/or replies, and send yourself a test email.

| Client | Where to paste |
| --- | --- |
| Gmail web | Settings → See all settings → General → Signature |
| New Outlook / Outlook web | Settings → Accounts → Signatures |
| Classic Outlook for Windows | File → Options → Mail → Signatures |
| Other rich-text clients | Their signature settings; exact menus vary |
| Text-only clients | Use the Plain text tab or Download text |

The HTML tab's copy button copies source code. Most email editors need the formatted signature instead. Download HTML produces a standalone file you can open or import where supported.

Official guides: [Gmail](https://support.google.com/mail/answer/8395?hl=en) and [Outlook](https://support.microsoft.com/en-us/outlook/mail/how-to-add-and-change-an-email-signature-in-outlook).

## Privacy

Your details and chosen files are processed in your browser. They are not sent to an app backend. Draft persistence is off until you enable **Remember this draft on this device**. Save profile downloads a JSON file containing your details and any prepared image; treat it like a contact-information file. Uncheck the remember option or use Clear all to remove the saved draft.

Public logo URLs load images from their host, which can receive the normal image request. External help links open their respective sites. There are no analytics, external font requests, or third-party script dependencies.

## Project files

```text
index.html                 Editor and installation guide
styles.css                 Editor styles only
app.js                     Editor, image preparation, clipboard, and profiles
signature.js               Reusable email HTML / plain-text renderer
assets/favicon.svg         App icon (not included in signatures)
tests/signature.test.cjs    Export and input-handling tests
```

`signature.js` attaches `Signature` in the browser and can also be required by Node.js. Exported signatures use presentation tables, inline styles, ordinary links, and raster images; the editor's CSS and JavaScript are never included.

## Check the code

Node.js 18 or newer is sufficient; no dependencies are required.

```bash
node --check app.js
node --check signature.js
node --test tests/signature.test.cjs
```

Automated tests cover exported structure, empty fields, clickable details, text escaping, URL restrictions, profile normalization, logo dimensions, and hosted/embedded export behavior. Browser clipboard behavior and rendering in actual email clients still need a manual test on your target clients. No cross-client compatibility guarantee is implied.

## License

MIT. See [LICENSE](LICENSE).
