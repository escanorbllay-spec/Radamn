export default async function generateHandler(req, res) {
  // Configuração de CORS para permitir acesso do frontend Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Tratamento da requisição preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Apenas o método POST é permitido.' });
  }

  try {
    const { prompt, image, mode } = req.body || {};

    if (!prompt && !image) {
      return res.status(400).json({ error: 'Prompt ou imagem é obrigatório.' });
    }

    const pLower = (prompt || '').toLowerCase();

    // Detecção de pedido para GERAÇÃO DE IMAGEM
    if (
      pLower.startsWith('crie uma imagem') || 
      pLower.startsWith('gere uma imagem') || 
      pLower.startsWith('desenhe') || 
      pLower.includes('imagem em alta definição') || 
      mode === 'image_gen'
    ) {
      const cleanPrompt = prompt.replace(/(crie|gere|desenhe)\s+(uma\s+)?imagem\s+(de\s+)?/i, '').trim();
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt || 'high quality detailed art')}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

      return res.status(200).json({
        success: true,
        type: 'image',
        response: `Aqui está a imagem gerada para: **${cleanPrompt || prompt}**\n\n![Imagem Gerada](${imageUrl})`,
        imageUrl: imageUrl
      });
    }

    // Processamento de TEXTO ou ANÁLISE DE IMAGEM ENVIADA
    const systemInstruction = "Você é o RadamNox AI, um assistente virtual avançado. Responda em português com clareza e com formatação Markdown útil.";
    let fullPrompt = prompt;

    if (image) {
      fullPrompt = `[O usuário enviou uma imagem]. Instrução do usuário: ${prompt || 'Descreva esta imagem em detalhes.'}`;
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
    console.error("Erro no processamento da API:", error);
    return res.status(500).json({ error: 'Erro interno no backend: ' + error.message });
  }
}
