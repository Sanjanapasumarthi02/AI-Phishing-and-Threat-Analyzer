import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import analyzeHandler from './api/analyze.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// Bind the Vercel serverless function to local Express /api/analyze route
app.post('/api/analyze', async (req, res) => {
  // Construct a mock Vercel response object
  const mockRes = {
    status: (code) => {
      res.status(code);
      return {
        json: (data) => res.json(data),
        end: () => res.end()
      };
    },
    setHeader: (name, value) => {
      res.setHeader(name, value);
    },
    end: () => {
      res.end();
    }
  };

  try {
    await analyzeHandler(req, mockRes);
  } catch (err) {
    console.error('Express wrapper error:', err);
    res.status(500).json({ error: 'Internal server error in development wrapper.' });
  }
});

// Serve static assets from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Fallback for SPA routing: send index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(` AegisAI Development Server Ready!`);
  console.log(` Local URL: http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});
