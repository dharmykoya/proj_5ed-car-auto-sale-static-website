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

## Managing Vehicle Inventory

### Overview

All vehicle information displayed across this website is sourced from a single file: `data/vehicles.json`. This file contains an array of vehicle objects, each representing one listing. You do not need any technical knowledge to update the inventory — just a text editor and a few minutes of your time.

**Important:** Always validate your JSON after making changes (see [JSON Validation](#json-validation) below) to prevent the site from displaying incorrectly.

---

### Adding a New Vehicle

1. Open `data/vehicles.json` in any text editor (Notepad, TextEdit, VS Code, etc.).
2. Find the last vehicle object in the file — it ends with a `}` near the bottom of the array.
3. After that closing `}`, add a comma `,` and then paste a copy of an existing vehicle object.
4. Update **all fields** in the pasted object with the new vehicle's information. Do not leave any old values in place.
5. Generate a unique ID by incrementing the last number (e.g., if the last vehicle is `"veh-013"`, use `"veh-014"`).
6. Find car photos on [Unsplash](https://unsplash.com) — search for the vehicle make and model, then copy the image URLs (see [Image Guidelines](#image-guidelines)).
7. Save the file.
8. Validate your JSON at [jsonlint.com](https://jsonlint.com) before publishing.

---

### Editing a Vehicle

1. Open `data/vehicles.json` in a text editor.
2. Use your editor's Find function (`Ctrl+F` / `Cmd+F`) to search for the vehicle's `id` (e.g., `"veh-003"`).
3. Update the relevant field(s) with the new information.
4. Save the file and validate at [jsonlint.com](https://jsonlint.com).

---

### Removing a Vehicle

1. Open `data/vehicles.json` in a text editor.
2. Find the vehicle object you want to remove by searching for its `id`.
3. Delete the **entire object**, from its opening `{` to its closing `}`.
4. **Important:** Check that no trailing comma is left behind. If the deleted vehicle was the last item in the array, remove the comma from the item that now appears last.
5. Save the file and validate at [jsonlint.com](https://jsonlint.com).

> **Tip:** Instead of deleting a sold vehicle, consider setting `"sold": true`. The listing will be marked as sold rather than disappearing from the site entirely.

---

### Field Descriptions

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique vehicle identifier; use format `veh-NNN` | `"veh-001"` |
| `make` | string | Vehicle manufacturer | `"Toyota"` |
| `model` | string | Vehicle model name | `"Camry"` |
| `year` | integer | Four-digit model year | `2022` |
| `price` | number | Sale price in US dollars (no commas or symbols) | `24500` |
| `mileage` | integer | Current odometer reading in miles | `28000` |
| `color` | string | Exterior color name | `"Midnight Black"` |
| `transmission` | string | Must be exactly `"Automatic"` or `"Manual"` | `"Automatic"` |
| `fuelType` | string | Must be `"Gasoline"`, `"Diesel"`, `"Electric"`, or `"Hybrid"` | `"Gasoline"` |
| `vin` | string | 17-character Vehicle Identification Number | `"4T1BF1FK2NU684321"` |
| `condition` | string | Must be exactly `"Excellent"`, `"Good"`, or `"Fair"` | `"Excellent"` |
| `type` | string | Must be `"Sedan"`, `"SUV"`, `"Truck"`, `"Coupe"`, or `"Van"` | `"Sedan"` |
| `description` | string | 200+ character sales-oriented description of the vehicle | `"This 2022 Toyota..."` |
| `features` | array | List of included features as quoted strings | `["Bluetooth", "Backup Camera"]` |
| `images` | array | 4–6 Unsplash image URLs at 800×600 pixels | `["https://images.unsplash.com/..."]` |
| `thumbnail` | string | Single exterior Unsplash image URL at 400×300 pixels | `"https://images.unsplash.com/..."` |
| `sold` | boolean | `true` if the vehicle has been sold, `false` if available | `false` |

---

### Image Guidelines

This site uses [Unsplash](https://unsplash.com) for vehicle photography.

**How to find images:**
1. Go to [unsplash.com](https://unsplash.com) and search for the vehicle make and model (e.g., "Toyota Camry").
2. Click on an image to open it.
3. Right-click the image and select **Copy image address** (or **Copy image URL**).
4. The URL will look like: `https://images.unsplash.com/photo-XXXXXXXXXXXXXXXXXX`

**Recommended image sizes:**
- `images` array: append `?w=800&h=600&fit=crop` to each URL
- `thumbnail`: append `?w=400&h=300&fit=crop` to the URL

**Full URL format:**
```
https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop
```

**Recommended image types per vehicle (4–6 total):**
- Exterior front or three-quarter view (use for thumbnail as well)
- Exterior side or rear view
- Interior cabin / seats
- Dashboard / infotainment
- Engine bay or detail shot (optional)
- Cargo area or truck bed (optional)

---

### JSON Validation

JSON is strict about syntax. A single misplaced comma, missing quote, or unclosed bracket will break the entire data file and cause the site to show no vehicles.

**Always validate after editing:**
1. Copy the entire contents of `data/vehicles.json`.
2. Go to [jsonlint.com](https://jsonlint.com).
3. Paste the contents into the input box and click **Validate JSON**.
4. Fix any errors reported before saving the final version.

**Common errors to avoid:**

| Error | Wrong | Correct |
|-------|-------|---------|
| Trailing comma after last item | `"sold": false,` `}` | `"sold": false` `}` |
| Single quotes instead of double quotes | `'Bluetooth'` | `"Bluetooth"` |
| Missing comma between objects | `} {` | `}, {` |
| Unescaped special character | `"Owner's car"` | `"Owner\u2019s car"` |
| Number stored as string | `"price": "24500"` | `"price": 24500` |

---

### Example Vehicle Object

The following is a complete, annotated vehicle entry. Copy this structure when adding a new vehicle and replace every value with real data.

```json
{
  "id": "veh-014",
  "make": "Honda",
  "model": "Civic",
  "year": 2023,
  "price": 26000,
  "mileage": 12000,
  "color": "Lunar Silver Metallic",
  "transmission": "Automatic",
  "fuelType": "Gasoline",
  "vin": "2HGFC2F59PH123456",
  "condition": "Excellent",
  "type": "Sedan",
  "description": "This 2023 Honda Civic is a standout example of modern compact car excellence, blending sporty styling with Honda's legendary reliability. Equipped with a responsive turbocharged engine and a comprehensive suite of Honda Sensing safety features, it delivers a confident and enjoyable drive every day. With just 12,000 miles on the clock and meticulous one-owner care, this Civic represents outstanding value in the pre-owned market.",
  "features": [
    "Bluetooth",
    "Backup Camera",
    "Apple CarPlay",
    "Android Auto",
    "Lane Departure Warning",
    "Adaptive Cruise Control",
    "Keyless Entry",
    "Heated Seats"
  ],
  "images": [
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop"
  ],
  "thumbnail": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=300&fit=crop",
  "sold": false
}
```

> **Note:** Replace every image URL above with actual Unsplash photos of the specific vehicle you are adding. See [Image Guidelines](#image-guidelines) for instructions.

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
