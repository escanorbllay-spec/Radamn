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
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'O prompt é obrigatório.' });
    }

    // Chamada para modelo de IA ativo e dinâmico (Pollinations AI / Llama-3 livre de cota)
    const aiResponse = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?system=${encodeURIComponent("Você é a Radamn AI, um assistente inteligente e prestativo. Responda em português de forma clara e natural.")}`);

    if (!aiResponse.ok) {
      throw new Error("Falha ao obter resposta da IA");
    }

    const textGenerated = await aiResponse.text();

    return res.status(200).json({
      success: true,
      response: textGenerated,
      code: textGenerated
    });

  } catch (error) {
    console.error("Erro na API generate:", error);
    return res.status(500).json({ error: 'Erro interno ao gerar resposta: ' + error.message });
  }
}
