const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const API_KEY = process.env.ANTHROPIC_API_KEY;

app.post('/api/classify', async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({
      error: { message: 'ANTHROPIC_API_KEY environment variable is not set. See README for setup.' }
    });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('');
  console.log('  ⬡  DocClassify server running');
  console.log(`  →  http://localhost:${PORT}`);
  console.log('');
  if (!API_KEY) {
    console.warn('  ⚠  WARNING: ANTHROPIC_API_KEY is not set.');
    console.warn('     Classification will fail until you set it.');
    console.warn('     See README.md for instructions.');
  } else {
    console.log('  ✓  API key loaded');
  }
  console.log('');
});
