export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { message, messages } = req.body;

  // URL do seu servidor backend no Render e a Master Key
  const RENDER_BACKEND_URL = process.env.MY_CUSTOM_API_URL || 'https://radamnox-backend.onrender.com/api/chat';
  const MASTER_KEY = process.env.RADAMN_MASTER_KEY || process.env.MY_CUSTOM_API_KEY;

  try {
    const response = await fetch(RENDER_BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(MASTER_KEY ? { 'Authorization': `Bearer ${MASTER_KEY}` } : {})
      },
      body: JSON.stringify({
        message: message || (messages && messages[messages.length - 1]?.content),
        messages: messages || [{ role: 'user', content: message }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data.error || 'Erro no servidor backend no Render' 
      });
    }

    // Retorna no formato que o seu index.html espera
    const replyContent = data.reply || data.message || 'Sem resposta da IA.';

    return res.status(200).json({
      reply: replyContent,
      choices: [
        {
          message: {
            role: 'assistant',
            content: replyContent
          }
        }
      ]
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Erro ao conectar ao servidor no Render',
      details: error.message 
    });
  }
}
