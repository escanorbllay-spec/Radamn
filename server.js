const express = require('express');
const cors = require('cors');

const app = express();

// Ativa o CORS para permitir requisições do frontend
app.use(cors());

// Permite interpretar requisições JSON
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.send('Servidor RadamNox AI rodando com sucesso!');
});

// Rota principal do Chat conectada à OpenRouter
app.post('/api/chat', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const masterKey = process.env.RADAMN_MASTER_KEY;

    // 1. Validação de segurança com a RADAMN_MASTER_KEY
    if (masterKey && authHeader !== `Bearer ${masterKey}`) {
      return res.status(401).json({ error: 'Acesso não autorizado: Chave master inválida.' });
    }

    const { message, messages } = req.body;

    // Prepara o histórico da conversa ou a mensagem individual
    const conversationHistory = messages || [
      { role: 'user', content: message }
    ];

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    if (!openRouterApiKey) {
      return res.status(500).json({ error: 'OPENROUTER_API_KEY não configurada no servidor.' });
    }

    // 2. Chamada para a OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'HTTP-Referer': 'https://radamn.vercel.app',
        'X-Title': 'RadamNox AI',
        'Content-Type': 'json'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: conversationHistory
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data.error?.message || 'Erro ao comunicar com a OpenRouter.' 
      });
    }

    // 3. Retorna a resposta gerada pela IA
    const aiResponse = data.choices[0]?.message?.content || 'Sem resposta da IA.';
    
    return res.json({ reply: aiResponse, message: aiResponse });

  } catch (error) {
    console.error('Erro no servidor:', error);
    return res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
