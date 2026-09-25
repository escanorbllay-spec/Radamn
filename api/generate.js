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
      return res.status(400).json({ 
        code: '<div style="padding:2rem;color:red;">Prompt não fornecido.</div>',
        text: 'Prompt não fornecido.' 
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        code: '<div style="padding:2rem;color:red;">Chave GEMINI_API_KEY não configurada na Vercel.</div>',
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

    // Modelo exigido pela API oficial do Gemini
    const models = ['gemini-3.1-pro-preview', 'gemini-3.5-flash'];
    let lastError = null;

    for (const model of models) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `${systemInstruction}\n\n${userMessage}` }]
            }]
          })
        });

        const data = await response.json();

        if (response.ok) {
          const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleanCode = outputText.replace(/```html|```jsx|```javascript|```/g, '').trim();

          return res.status(200).json({ 
            code: cleanCode || '<div>Sem código gerado.</div>', 
            text: outputText || 'Sem texto gerado.' 
          });
        } else {
          lastError = data.error?.message || `Erro no modelo ${model}`;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    return res.status(200).json({
      code: `<div style="padding:2rem; text-align:center; color:#f59e0b; font-family:sans-serif;">
        <h3>Erro na comunicação com a API Gemini</h3>
        <p>${lastError || 'Tente novamente em alguns instantes.'}</p>
      </div>`,
      text: `Erro na API: ${lastError || 'Instabilidade temporária'}`
    });

  } catch (err) {
    return res.status(200).json({ 
      code: `<div style="padding:2rem; text-align:center; color:#ef4444; font-family:sans-serif;">
        <h3>Erro interno no servidor</h3>
        <p>${err.message}</p>
      </div>`,
      text: 'Erro interno ao processar requisição.' 
    });
  }
}
