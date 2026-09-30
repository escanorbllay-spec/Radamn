const express = require('express');
const cors = require('cors');

const app = express();

// Ativa o CORS para permitir requisições do frontend
app.use(cors());

// Permite interpretar requisições JSON
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.json({ status: "Online", engine: "Radam Engine Core v11.3" });
});

// Rota principal do Chat conectada ao OpenRouter
app.post('/api/chat', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const masterKey = process.env.RADAMN_MASTER_KEY;

    // 1. Validação de segurança
    if (masterKey && authHeader !== `Bearer ${masterKey}`) {
      return res.status(401).json({ error: 'Acesso não autorizado: Chave master inválida.' });
    }

    const { message, prompt, messages } = req.body;
    const userText = message || prompt;

    // Constrói o histórico de mensagens para enviar ao OpenRouter
    let formattedMessages = [];
    if (messages && Array.isArray(messages)) {
      formattedMessages = messages;
    } else if (userText) {
      formattedMessages = [{ role: 'user', content: userText }];
    } else {
      return res.status(400).json({ error: 'Nenhuma mensagem enviada.' });
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return res.status(500).json({ error: 'OPENROUTER_API_KEY não configurada no servidor.' });
    }

    // 2. Chamada real para a API do OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://radamn.vercel.app',
        'X-Title': 'Radam Nox'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free', // Modelo padrão do OpenRouter
        messages: formattedMessages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro na resposta do OpenRouter:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Erro ao comunicar com OpenRouter.' });
    }

    const aiReply = data.choices?.[0]?.message?.content || 'Sem resposta gerada.';

    // Retorna nos dois formatos para garantir compatibilidade com o frontend
    return res.json({ 
      reply: aiReply, 
      message: aiReply 
    });

  } catch (error) {
    console.error('Erro no servidor:', error);
    return res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
