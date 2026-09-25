export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { prompt, mode, currentCode } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Prompt não fornecido' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Chave GEMINI_API_KEY não configurada na Vercel.' });
    }

    let systemInstruction = "Você é um Engenheiro de Software Full-Stack Sênior e UI/UX Designer. Sua função é gerar código limpo, moderno, responsivo com Tailwind CSS e TOTALMENTE INTERATIVO em JavaScript nativo. Retorne EXCLUSIVAMENTE o código HTML/JS completo sem explicações em texto.";
    
    let userMessage = prompt;
    if (mode === 'refine' && currentCode) {
      userMessage = `Código HTML/JS Atual:\n${currentCode}\n\nSolicitação de Alteração do Usuário: ${prompt}`;
    } else if (mode === 'chat') {
      systemInstruction = "Você é um Engenheiro de Software Full-Stack e Consultor de TI. Responda em texto corrido e amigável tirando dúvidas sem gerar páginas inteiras de código.";
    }

    // Endpoint atualizado para o modelo estável gemini-1.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemInstruction}\n\n${userMessage}` }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Erro no Gemini: ${data.error?.message || 'Erro ao comunicar com a IA'}`
      });
    }

    const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanCode = outputText.replace(/```html|```jsx|```javascript|```/g, '').trim();

    // Retorna 'code' e 'text' garantidos para evitar erro no frontend
    return res.status(200).json({ 
      code: cleanCode, 
      text: outputText 
    });

  } catch (err) {
    return res.status(500).json({ error: 'Erro interno no servidor ao processar o prompt.' });
  }
}
