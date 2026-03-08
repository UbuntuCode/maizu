# MAIZU Frontend Setup Guide

This guide explains how to install and run the frontend for the MAIZU marketplace using Next.js.

## Step 1 — Clone the Repository

```bash
git clone https://github.com/UbuntuCode/maizu.git
cd maizu
```

## Step 2 — Enter the Frontend Folder

```bash
cd frontend
```

## Step 3 — Install Next.js

Run the following command:

```bash
npx create-next-app@latest .
```

Select the following options:

* TypeScript: Yes
* ESLint: Yes
* Tailwind CSS: Yes
* Use src directory: Yes
* App Router: Yes

## Step 4 — Install Dependencies

```bash
npm install
```

## Step 5 — Start the Development Server

```bash
npm run dev
```

Open the browser:

http://localhost:3000

You should see the Next.js starter page.

## Step 6 — Push Changes

After setup run:

```bash
git add .
git commit -m "Setup Next.js frontend"
git push
```

Now the frontend setup will be available to the entire team.
