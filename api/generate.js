export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { prompt, mode, currentCode } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ code: '<div>Prompt não fornecido.</div>', text: 'Prompt não fornecido.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ 
        code: '<div style="padding:2rem;color:#ef4444;text-align:center;">Chave GEMINI_API_KEY não configurada na Vercel.</div>',
        text: 'Chave GEMINI_API_KEY não configurada na Vercel.' 
      });
    }

    let systemInstruction = "Você é um Engenheiro de Software Full-Stack Sênior e UI/UX Designer. Sua função é gerar código limpo, moderno, responsivo com Tailwind CSS e TOTALMENTE INTERATIVO em JavaScript nativo. Retorne EXCLUSIVAMENTE o código HTML/JS completo em um único bloco sem explicações em texto.";
    
    let userMessage = prompt;
    if (mode === 'refine' && currentCode) {
      userMessage = `Código HTML/JS Atual:\n${currentCode}\n\nSolicitação de Alteração do Usuário: ${prompt}`;
    } else if (mode === 'chat') {
      systemInstruction = "Você é um Engenheiro de Software Full-Stack e Consultor de TI. Responda em texto corrido e amigável tirando dúvidas sem gerar páginas inteiras de código.";
    }

    // 1. Pergunta diretamente à API quais modelos estão disponíveis para esta chave
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listRes = await fetch(listUrl);
    const listData = await listRes.json();

    if (!listRes.ok || !listData.models) {
      return res.status(200).json({
        code: `<div style="padding:2rem; text-align:center; color:#ef4444; font-family:sans-serif;">
          <h3>Erro na Chave de API</h3>
          <p>${listData.error?.message || 'Não foi possível listar os modelos. Verifique se a chave está correta.'}</p>
        </div>`,
        text: `Erro ao listar modelos: ${listData.error?.message || 'Chave inválida'}`
      });
    }

    // 2. Encontra automaticamente um modelo válido que suporte geração de conteúdo
    const validModel = listData.models.find(m => 
      m.supportedGenerationMethods?.includes('generateContent') && 
      (m.name.includes('flash') || m.name.includes('pro'))
    ) || listData.models.find(m => m.supportedGenerationMethods?.includes('generateContent'));

    if (!validModel) {
      return res.status(200).json({
        code: `<div style="padding:2rem; text-align:center; color:#ef4444; font-family:sans-serif;">
          <h3>Nenhum modelo compatível</h3>
          <p>Sua chave não possui modelos com suporte a generateContent habilitados.</p>
        </div>`,
        text: 'Nenhum modelo compatível encontrado.'
      });
    }

    const modelName = validModel.name; // Ex: "models/gemini-1.5-flash"
    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;

    // 3. Executa a geração usando o modelo detetado
    const response = await fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemInstruction}\n\n${userMessage}` }] }]
      })
    });

    const data = await response.json();

    if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const outputText = data.candidates[0].content.parts[0].text;
      const cleanCode = outputText.replace(/```html|```jsx|```javascript|```/g, '').trim();

      return res.status(200).json({ 
        code: cleanCode || '<div>Sem código gerado.</div>', 
        text: outputText || 'Sem texto gerado.' 
      });
    }

    const apiErrorMessage = data.error?.message || 'Erro ao processar na API do Gemini';
    return res.status(200).json({
      code: `<div style="padding:2rem; text-align:center; color:#ef4444; font-family:sans-serif;">
        <h3>Erro na API do Gemini (${modelName})</h3>
        <p>${apiErrorMessage}</p>
      </div>`,
      text: `Erro Gemini: ${apiErrorMessage}`
    });

  } catch (err) {
    return res.status(200).json({ 
      code: `<div style="padding:2rem; text-align:center; color:#ef4444; font-family:sans-serif;">
        <h3>Erro no Servidor</h3>
        <p>${err.message}</p>
      </div>`,
      text: `Erro: ${err.message}` 
    });
  }
}
