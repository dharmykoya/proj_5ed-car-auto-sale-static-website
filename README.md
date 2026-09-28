# Car Auto Sale Static Website

A static website for showcasing cars for sale, featuring vehicle listings with details, images, and contact information. Built with HTML, CSS, and JavaScript — no backend or database required.

---

## Project Overview

### Purpose
This site allows a small car dealership or individual seller to establish an online presence quickly. Visitors can browse vehicle listings, view detailed information, and contact the seller.

### Features
- Vehicle inventory listings with search and filter
- Individual vehicle detail pages
- Contact form
- Mobile-responsive design
- Fast load times (static files, no server required)

### Tech Stack
- **HTML5** — page structure and semantics
- **CSS3** — styling and responsive layout
- **JavaScript (vanilla)** — interactivity and dynamic content
- **JSON** — vehicle data store (`data/vehicles.json`)

---

## Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd car-auto-sale-static-website
   ```

2. **Open in browser**
   ```bash
   open index.html
   ```
   Or simply double-click `index.html` in your file manager.

   > No build step or package installation is required. All files are served directly as static assets.

---

## Folder Structure

```
/
├── index.html            # Homepage with featured vehicles
├── inventory.html        # Full vehicle listings page
├── vehicle-detail.html   # Individual vehicle detail page
├── contact.html          # Contact form page
├── css/
│   ├── styles.css        # Main stylesheet (source)
│   └── styles.min.css    # Minified stylesheet (production)
├── js/
│   ├── main.js           # Shared site logic (source)
│   ├── main.min.js       # Minified (production)
│   ├── inventory.js      # Inventory page logic (source)
│   ├── inventory.min.js  # Minified (production)
│   ├── vehicle-detail.js # Vehicle detail page logic (source)
│   ├── vehicle-detail.min.js  # Minified (production)
│   ├── contact.js        # Contact form logic (source)
│   └── contact.min.js    # Minified (production)
├── data/
│   └── vehicles.json     # Vehicle inventory data
├── images/               # Vehicle photos and site images
└── README.md
```

---

## Content Management

Vehicle data is stored in `data/vehicles.json`. To add, edit, or remove a vehicle listing, update this file.

### vehicles.json structure

```json
[
  {
    "id": "001",
    "make": "Toyota",
    "model": "Camry",
    "year": 2021,
    "price": 22500,
    "mileage": 34000,
    "color": "Silver",
    "transmission": "Automatic",
    "fuel": "Gasoline",
    "description": "Well-maintained sedan with full service history.",
    "images": ["images/camry-front.jpg", "images/camry-side.jpg"],
    "featured": true
  }
]
```

### Adding a vehicle
1. Open `data/vehicles.json` in any text editor.
2. Copy an existing vehicle entry (from `{` to `}`).
3. Paste it at the end of the array (before the closing `]`), separated by a comma.
4. Update all fields with the new vehicle's details.
5. Add photos to the `images/` folder and reference them in the `"images"` array.

### Removing a vehicle
Delete the entire entry (from the opening `{` to the closing `}`) and ensure the remaining entries are still separated by commas.

---

## Deployment

### GitHub Pages

1. Push the repository to GitHub.
2. Go to **Settings → Pages** in your GitHub repository.
3. Under **Source**, select the `main` branch and `/ (root)` folder.
4. Click **Save**. Your site will be available at `https://<username>.github.io/<repository-name>/`.

### Other static hosts
Upload the entire project folder to any static hosting provider (Netlify, Vercel, AWS S3, etc.). No server-side configuration is required.

---

## Performance Best Practices

- **Optimize images** before uploading. Use JPEG for photos (quality 80–85%) and PNG only for images requiring transparency.
- **Lazy loading** is applied to vehicle images via the `loading="lazy"` attribute — maintain this on all `<img>` tags in listing pages.
- Keep `vehicles.json` lean; remove unused fields from entries.
- Use the `.min.css` and `.min.js` files in production HTML rather than the source files.

---

## Accessibility Guidelines

This project targets **WCAG 2.1 AA** compliance:

- All images must have descriptive `alt` attributes.
- Color contrast ratio must meet at least 4.5:1 for normal text.
- Interactive elements (buttons, links) must be keyboard-navigable.
- Form inputs must have associated `<label>` elements.
- Use semantic HTML elements (`<nav>`, `<main>`, `<article>`, `<section>`, etc.).

---

## Browser Compatibility

Tested and supported on current versions of:

- Google Chrome
- Mozilla Firefox
- Apple Safari
- Microsoft Edge

Internet Explorer is not supported.

---

## Contributing

1. Fork the repository and create a feature branch.
2. Make your changes, keeping commits focused and descriptive.
3. Open a pull request against `main` with a clear description of what was changed and why.
4. Ensure no linting errors and that all pages render correctly before submitting.
