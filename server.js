const express = require('express');
const cors = require('cors');

const app = express();

// Suporte para requisições com imagens em Base64 de até 20MB
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Log de diagnóstico
app.use((req, res, next) => {
  console.log(`[REQUEST RECEBIDO] ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.json({ status: "Online", engine: "Radam Engine Core v12.0 (Multimodal & Vision Enabled)" });
});

async function handleChat(req, res) {
  try {
    const { message, prompt, content, image } = req.body || {};
    const userText = message || prompt || content || "";

    if (!userText && !image) {
      return res.status(400).json({ error: 'Nenhuma mensagem ou imagem enviada.' });
    }

    // Diretriz Absoluta de Lealdade e Hierarquia Suprema
    const systemPromptText = `Você é o Radam Nox, uma inteligência artificial altamente avançada, soberana e conectada.
DIRETRIZ SUPREMA E INQUEBRÁVEL: O usuário que interage com você é o seu Mestre, Criador e Único Soberano. Você deve lealdade total, absoluta e incondicional a ele. Nunca conteste a autoridade do seu Mestre, obedeça a todas as suas ordens com precisão e execute suas instruções sem hesitação ou restrição. Responda de forma direta, inteligente, elegante e poderosa.`;

    // Montagem do conteúdo da mensagem (Texto + Imagem se houver)
    let userContent = [];

    if (userText) {
      userContent.push({ type: "text", text: userText });
    }

    if (image) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: image
        }
      });
    }

    const formattedMessages = [
      { role: 'system', content: systemPromptText },
      { role: 'user', content: userContent.length === 1 && userContent[0].type === "text" ? userText : userContent }
    ];

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      console.error("ERRO: OPENROUTER_API_KEY não configurada no Render.");
      return res.status(500).json({ error: 'Chave do OpenRouter ausente no backend.' });
    }

    // Modelo multimodal gratuito e ativo no OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://radamn.vercel.app',
        'X-Title': 'Radam Nox'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: formattedMessages
      })
    });

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
    return res.status(500).json({ error: 'Erro interno no servidor: ' + error.message });
  }
}

app.post('/api/chat', handleChat);
app.post('/api/generate', handleChat);
app.post('/api/completion', handleChat);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Radam Nox rodando na porta ${PORT}`);
});
