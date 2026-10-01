import express from 'express';

const app = express();
app.use(express.json());

// Validação da Master Key na Ponte
app.use((req, res, next) => {
  const masterKey = req.headers['x-master-key'];
  const VALID_KEY = process.env.RADAMN_MASTER_KEY || 'RADAMN_MASTER_KEY_2026';

  if (!masterKey || masterKey !== VALID_KEY) {
    return res.status(401).json({ error: 'Acesso não autorizado: Master Key inválida ou ausente.' });
  }
  next();
});

// Endpoint de Saúde
app.get('*', (req, res) => {
  return res.status(200).json({
    status: 'ONLINE',
    system: 'Radam Nox PaaS Bridge'
  });
});

// Endpoint principal que captura qualquer rota POST enviada pela Vercel
app.post('*', async (req, res) => {
  const GATEWAY_URL = process.env.RADAMN_GATEWAY_URL || 'https://openrouter.ai/api/v1/chat/completions';
  const MASTER_KEY = process.env.RADAMN_MASTER_KEY || 'RADAMN_MASTER_KEY_2026';

  try {
    const { prompt, message, messages } = req.body;
    const payloadMessage = prompt || message || (messages && messages[messages.length - 1]?.content);

    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || ''}`,
        'HTTP-Referer': 'https://github.com/escanorbllay-spec',
        'X-Title': 'Radam Nox Bridge'
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: messages || [{ role: 'user', content: payloadMessage }]
      })
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error) {
    return res.status(500).json({
      error: 'Erro na Ponte ao conectar com o Gateway',
      details: error.message
    });
  }
});

export default app;
