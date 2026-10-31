# AI Code Reviewer – Setup Notes

## Backend (`/backend`)
1. `cd backend && npm install`
2. `.env.example` ko copy karke `.env` banao aur `GOOGLE_GEMINI_KEY` bharo
3. `npm run dev` (nodemon) ya `npm start`

## Frontend (`/Frontend`)
1. `cd Frontend && npm install`
2. (optional) `.env.example` ko `.env` banao aur `VITE_API_URL` set karo
3. `npm run dev`

## Libraries used
prismjs, react-simple-code-editor (code editor), axios (API calls),
react-markdown + rehype-highlight + highlight.js (review ko markdown mein dikhane ke liye)
