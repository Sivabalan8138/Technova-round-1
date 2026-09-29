# TECHNOVA — ROUND 1: SPARK START

Coordinator-controlled presentation system for the TechNova Spark Start event.

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run locally:
   ```bash
   npm run dev
   ```

## Usage

### 1. Excel Template
- Go to the `/admin` panel.
- Click **DOWNLOAD EXCEL TEMPLATE** to get the correctly formatted Excel file.
- The file has columns for: S.NO, Question, Option A, Option B, Option C, Option D, Time, Image URL.
- **Do not add an Answer column.**

### 2. Excel Upload
- Click **UPLOAD EXCEL** and select your filled template.
- The system will parse questions, options, time limits, and external image URLs.

### 3. Image Folder Upload
- For "Emoji Decode" or questions with local images, click **UPLOAD IMAGE FOLDER**.
- Select all images for the round.
- Name them like `Q1.png`, `2.jpg`, etc. The system matches the number to the `S.NO` column.

### 4. Admin Panel
- Choose the **Activity Mode** (Quick Mix or Emoji Decode).
- Set a **Default Timer** for questions that lack a specific time in the Excel file.
- Use the **Live Controls** (Start, Pause, Resume, Next, Previous) to control the display screen.

### 5. Display Screen
- Click **FULL SCREEN DISPLAY** in the Admin Panel to open the presentation window.
- The display will remain synchronized with the admin controls.

### 6. Timer
- The timer appears in the top-right corner.
- It counts down automatically when the round is running.
- The presentation automatically advances to the next question when the time reaches zero.

### 7. Fullscreen
- Click the fullscreen icon in the bottom right of the display screen, or press `F` (when the feature is enabled via keyboard shortcuts).

## Vercel Deployment

This project is fully ready for Vercel deployment.

1. Push your code to GitHub.
2. Import the project in Vercel.
3. Vercel will automatically detect the Vite (React) framework.
4. Leave the default build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Click **Deploy**.
