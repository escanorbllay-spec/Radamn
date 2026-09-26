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
    const { prompt, image, mode } = req.body;

    if (!prompt && !image) {
      return res.status(400).json({ error: 'Prompt ou imagem é obrigatório.' });
    }

    const pLower = (prompt || '').toLowerCase();

    // Deteção de pedido de GERAÇÃO DE IMAGEM
    if (pLower.startsWith('crie uma imagem') || pLower.startsWith('gere uma imagem') || pLower.startsWith('desenhe') || pLower.includes('imagem em alta definição') || mode === 'image_gen') {
      const cleanPrompt = prompt.replace(/(crie|gere|desenhe)\s+(uma\s+)?imagem\s+(de\s+)?/i, '').trim();
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt || 'high quality detailed art')}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

      return res.status(200).json({
        success: true,
        type: 'image',
        response: `Aqui está a imagem gerada em alta definição para: **${cleanPrompt || prompt}**\n\n![Imagem Gerada](${imageUrl})`,
        imageUrl: imageUrl
      });
    }

    // Processamento de ANÁLISE DE IMAGEM ENVIADA ou TEXTO DEDICADO
    let systemInstruction = "Você é o Radamn AI, um assistente virtual avançado no estilo do Google Gemini. Responda em português com clareza e formato Markdown.";
    let fullPrompt = prompt;

    if (image) {
      fullPrompt = `[O utilizador anexou uma imagem]. Instrução do utilizador: ${prompt || 'Descreva esta imagem em detalhes.'}`;
    }

    const aiResponse = await fetch(`https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?system=${encodeURIComponent(systemInstruction)}`);

    if (!aiResponse.ok) {
      throw new Error("Falha ao comunicar com a IA.");
    }

    const textGenerated = await aiResponse.text();

    return res.status(200).json({
      success: true,
      type: 'text',
      response: textGenerated
    });

  } catch (error) {
    console.error("Erro no servidor:", error);
    return res.status(500).json({ error: 'Erro interno: ' + error.message });
  }
}
