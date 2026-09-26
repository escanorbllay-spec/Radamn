export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Apenas método POST é permitido.' });
  }

  try {
    const { prompt, mode } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'O prompt é obrigatório.' });
    }

    // Resposta direta e rápida do Assistente Radamn AI
    const respostaAssistente = `Olá! Sou o assistente Radamn AI.\n\nRecebi a sua mensagem: "${prompt}"\n\nComo posso ajudar com o seu projeto hoje?`;

    return res.status(200).json({
      success: true,
      response: respostaAssistente,
      code: respostaAssistente
    });

  } catch (error) {
    return res.status(500).json({ error: 'Erro no servidor: ' + error.message });
  }
}
