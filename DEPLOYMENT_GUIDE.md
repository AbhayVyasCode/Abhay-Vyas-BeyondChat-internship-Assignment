# Deployment Guide: Vercel + Convex

This application consists of two parts that need to be deployed:
1.  **Backend**: Hosted on **Convex**.
2.  **Frontend**: Hosted on **Vercel**.

Follow these steps in order.

---

## Part 1: Deploy Backend (Convex)

1.  **Login to Convex**:
    Open your terminal and run:
    ```bash
    npx convex login
    ```

2.  **Deploy to Production**:
    Push your functions and schema to a live production environment:
    ```bash
    npx convex deploy
    ```
    *   This will create a production deployment (e.g., `https://happy-otter-123.convex.cloud`).
    *   **Keep this URL safe**, you will need it for Vercel.

3.  **Set Environment Variables (Secrets)**:
    Your production backend needs the `GOOGLE_API_KEY` to work.
    *   Go to your [Convex Dashboard](https://dashboard.convex.dev/).
    *   Select your project.
    *   Go to **Settings** > **Environment Variables**.
    *   Add:
        *   Key: `GOOGLE_API_KEY`
        *   Value: `<Your Actual Google Gemini Key>`

---

## Part 2: Deploy Frontend (Vercel)

1.  **Push to GitHub**:
    Ensure your latest code is pushed to a GitHub repository.

2.  **Import to Vercel**:
    *   Go to [Vercel Dashboard](https://vercel.com/dashboard).
    *   Click **"Add New..."** > **"Project"**.
    *   Select your GitHub repository.

3.  **Configure Project**:
    *   **Framework Preset**: Vite (Automatic).
    *   **Root Directory**: `./` (Default).
    *   **Build Command**: `npm run build` (Default).
    *   **Output Directory**: `dist` (Default).

4.  **Add Environment Variables**:
    *   Expand the **"Environment Variables"** section.
    *   Add the URL you got from Part 1:
        *   Key: `VITE_CONVEX_URL`
        *   Value: `https://<your-prod-url>.convex.cloud`
        *(Note: Do NOT add `GOOGLE_API_KEY` here. That stays in Convex).*

5.  **Deploy**:
    *   Click **"Deploy"**.
    *   Wait for the build to finish.

---

## Part 3: Final Verification

1.  Open your new Vercel URL (e.g., `https://my-app.vercel.app`).
2.  **Test the Database**: The app should load articles from your production Convex DB (which might be empty initially).
3.  **Test AI**: Try the "Analyze" feature. If it works, your `GOOGLE_API_KEY` is correctly set in Convex.

## Troubleshooting

*   **"Failed to connect to Convex"**: Check that `VITE_CONVEX_URL` in Vercel settings matches your *Production* deployment URL, not your *Dev* URL.
*   **"AI Error"**: Verify `GOOGLE_API_KEY` is set in the Convex Dashboard.
