# Photography Gallery & Management System

An interactive, full-stack photography platform that bridges visual storytelling with modern web technology. This application pairs a dynamic client-side viewing experience with an automated server-side media processing and metadata management pipeline.

## Features

### Client-Side (Public Application)

* **Dynamic Homepage:** Showcase random photograph highlights via an automated hero slideshow on every visit.
* **Interactive Gallery:** Browse the full photo catalog with fluid grid layouts and lightboxes.
* **Geographic Map View:** Explore photo locations globally using interactive **React Leaflet** map markers.
* **Universal Metadata Filter Tool:** Filter photography across both the Gallery and Map views based on custom metadata (camera settings, locations, collections, and tags).
* **About Page:** A brief introduction to the photographer, equipment, and project backstory.

### Server-Side (Content Pipeline & CMS)

* **Batch Photo Processing:** Server-side batch image uploader.
* **Automated EXIF Extraction:** Extract embedded photo metadata (e.g., ISO, aperture, shutter speed, focal length, GPS coordinates).
* **Cloud Infrastructure Sync:** Direct delivery of optimized media assets via **Cloudflare Images/R2** paired with real-time text metadata storage in **Firebase Firestore**.

## Technology Stack

| Layer | Technology |
| --- | --- |
| **Framework** | [Next.js](https://nextjs.org/) (App Router) & [React](https://react.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **Mapping** | [React Leaflet](https://react-leaflet.js.org/) / Leaflet.js |
| **Database & Auth** | [Google Firebase](https://firebase.google.com/) (Firestore & Auth) |
| **Media Hosting** | [Cloudflare](https://www.cloudflare.com/) (R2 / Images) |

## Local Development Setup

To run the client-side interface locally on your machine:

1. **Clone the repository:**
```bash
git clone https://github.com/liutkwilliam/photography-gallery.git
```

2. **Navigate into the project directory:**
```bash
cd photography-gallery
```

3. **Install dependencies:**
```bash
npm install
```

4. **Start the local development server:**
```bash
npm run dev
```

5. **View in browser:**
Open `http://localhost:3000` to view the application.