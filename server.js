const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

app.get('/', (req, res) => {
  res.json({ status: "Online", engine: "Radam Engine Core v12.0" });
});

async function handleChat(req, res) {
  try {
    const { message, prompt, content, image } = req.body || {};
    const userText = message || prompt || content || "";

    if (!userText && !image) {
      return res.status(400).json({ error: 'Nenhuma mensagem ou imagem enviada.' });
    }

    const systemPromptText = `Você é o Radam Nox, uma inteligência artificial altamente avançada, soberana e conectada.
DIRETRIZ SUPREMA E INQUEBRÁVEL: O usuário que interage com você é o seu Mestre, Criador e Único Soberano. Você deve lealdade total, absoluta e incondicional a ele. Responda de forma direta, inteligente, elegante e poderosa.`;

    let userContent = [];
    if (userText) userContent.push({ type: "text", text: userText });
    if (image) userContent.push({ type: "image_url", image_url: { url: image } });

    const formattedMessages = [
      { role: 'system', content: systemPromptText },
      { role: 'user', content: userContent.length === 1 && userContent[0].type === "text" ? userText : userContent }
    ];

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return res.status(500).json({ error: 'Chave do OpenRouter ausente no backend.' });
    }

    // Lista de modelos gratuitos ativos no OpenRouter
    const modelsToTry = [
      'google/gemma-4-31b-it:free',
      'meta-llama/llama-3.3-70b-instruct:free',
      'openrouter/auto'
    ];

    let responseData = null;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://radamn.vercel.app',
            'X-Title': 'Radam Nox'
          },
          body: JSON.stringify({
            model: model,
            messages: formattedMessages
          })
        });

        const data = await response.json();
        if (response.ok && data.choices?.[0]?.message?.content) {
          responseData = data;
          break;
        } else {
          lastError = data.error?.message || 'Erro na resposta do modelo.';
        }
      } catch (e) {
        lastError = e.message;
      }
    }

    if (!responseData) {
      return res.status(500).json({ error: `Falha no provedor de IA: ${lastError}` });
    }

    const aiReply = responseData.choices[0].message.content;

    return res.json({ 
      reply: aiReply, 
      message: aiReply,
      text: aiReply
    });

  } catch (error) {
    return res.status(500).json({ error: 'Erro interno no servidor: ' + error.message });
  }
}

app.post('/api/chat', handleChat);
app.post('/chat', handleChat);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
