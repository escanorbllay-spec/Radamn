const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Log de diagnóstico para ver no painel do Render cada chamada que chega
app.use((req, res, next) => {
  console.log(`[REQUEST RECEBIDO] ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.json({ status: "Online", engine: "Radam Engine Core v11.3" });
});

// Função centralizada para processar as mensagens via OpenRouter
async function handleChat(req, res) {
  try {
    const { message, prompt, messages, content } = req.body || {};
    const userText = message || prompt || content;

    let formattedMessages = [];
    if (messages && Array.isArray(messages) && messages.length > 0) {
      formattedMessages = messages;
    } else if (userText) {
      formattedMessages = [{ role: 'user', content: userText }];
    } else {
      return res.status(400).json({ error: 'Nenhuma mensagem enviada no corpo da requisição.' });
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      console.error("ERRO: OPENROUTER_API_KEY não configurada no Render.");
      return res.status(500).json({ error: 'Chave do OpenRouter ausente no backend.' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://radamn.vercel.app',
        'X-Title': 'Radam Nox'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: formattedMessages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro na resposta do OpenRouter:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Erro no provedor de IA.' });
    }

    const aiReply = data.choices?.[0]?.message?.content || 'Sem resposta gerada.';

    // Retorna nos formatos padrão consumidos por bibliotecas de chat
    return res.json({ 
      reply: aiReply, 
      message: aiReply,
      text: aiReply,
      choices: [{ message: { content: aiReply } }]
    });

  } catch (error) {
    console.error('Erro interno no servidor:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Aceita requisições nas rotas mais comuns
app.post('/api/chat', handleChat);
app.post('/api/generate', handleChat);
app.post('/api/completion', handleChat);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Radamn rodando na porta ${PORT}`);
});
