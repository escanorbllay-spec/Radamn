const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Log de diagnóstico
app.use((req, res, next) => {
  console.log(`[REQUEST RECEBIDO] ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.json({ status: "Online", engine: "Radam Engine Core v11.3 (Web Enabled)" });
});

async function handleChat(req, res) {
  try {
    const { message, prompt, messages, content } = req.body || {};
    const userText = message || prompt || content;

    let formattedMessages = [];

    // System Prompt do Radam Nox com instruções para usar dados recentes
    const systemInstruction = {
      role: 'system',
      content: 'Você é o Radam Nox, uma inteligência artificial avançada conectada à internet. Responda de forma precisa, direta e utilizando dados atualizados.'
    };

    if (messages && Array.isArray(messages) && messages.length > 0) {
      formattedMessages = [systemInstruction, ...messages];
    } else if (userText) {
      formattedMessages = [systemInstruction, { role: 'user', content: userText }];
    } else {
      return res.status(400).json({ error: 'Nenhuma mensagem enviada no corpo da requisição.' });
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      console.error("ERRO: OPENROUTER_API_KEY não configurada no Render.");
      return res.status(500).json({ error: 'Chave do OpenRouter ausente no backend.' });
    }

    // Configuração com o modelo online e timeout de segurança para evitar travamentos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de limite

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://radamn.vercel.app',
        'X-Title': 'Radam Nox'
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1:free', // Adicione plugins se o seu provedor de chave permitir acesso web
        messages: formattedMessages
      })
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok) {
      console.error('Erro na resposta do OpenRouter:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Erro no provedor de IA.' });
    }

    const aiReply = data.choices?.[0]?.message?.content || 'Sem resposta gerada.';

    return res.json({ 
      reply: aiReply, 
      message: aiReply,
      text: aiReply,
      choices: [{ message: { content: aiReply } }]
    });

  } catch (error) {
    console.error('Erro interno no servidor:', error);
    
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'A conexão com a internet demorou muito para responder. Tente novamente.' });
    }

    return res.status(500).json({ error: 'Falha de comunicação no backend: ' + error.message });
  }
}

app.post('/api/chat', handleChat);
app.post('/api/generate', handleChat);
app.post('/api/completion', handleChat);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Radamn rodando na porta ${PORT}`);
});
