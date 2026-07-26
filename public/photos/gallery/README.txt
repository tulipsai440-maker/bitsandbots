Photo Gallery — public page at /gallery
=======================================

1. Drop photos into this folder (.jpg, .jpeg, .png, or .webp).
2. Run this once from the project folder:

     python3 scripts/optimize-photos.py

That shrinks each photo, makes a small thumbnail for the grid, and updates
src/lib/gallery-photos.ts so the new photos show up on the site.

3. Refresh http://localhost:8080/gallery to check, then deploy with:

     npm run deploy

Notes
-----
Photos appear newest-last, sorted by filename. Numbered names keep the order
predictable, and "Gallery 10" correctly sorts after "Gallery 9":

  Gallery 1.jpg, Gallery 2.jpg, Gallery 3.jpg ...

Dated names work well too:

  2025-summer-campout.jpg
  2024-court-of-honor.jpg

Delete a photo from this folder and re-run the script to remove it from the site.
Your untouched originals are kept in photo-originals/ and are never published.
The first four gallery photos also appear in the home page slideshow.
