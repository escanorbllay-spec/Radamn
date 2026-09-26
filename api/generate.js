export default async function handler(req, res) {
  // Configuração de CORS para permitir acesso ao frontend
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Captura a mensagem/prompt enviada pelo utilizador
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "O campo 'prompt' é obrigatório." });
  }

  try {
    // Chamada direta para o cérebro do teu modelo Radamn AI no Hugging Face
    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/LuffyNox/radamn-ai-v1",
      {
        headers: {
          Authorization: `Bearer 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`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 512,
            temperature: 0.7
          }
        }),
      }
    );

    const data = await hfResponse.json();

    // Retorna a resposta gerada pela tua IA
    return res.status(200).json({
      success: true,
      model: "Radamn AI v1",
      response: data[0]?.generated_text || data
    });

  } catch (error) {
    return res.status(500).json({ 
      error: "Erro ao processar na Radamn AI Engine", 
      details: error.message 
    });
  }
}
