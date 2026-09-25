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

    let systemInstruction = "Você é um Engenheiro de Software Full-Stack Sênior e UI/UX Designer. Sua função é gerar código limpo, moderno, responsivo com Tailwind CSS e TOTALMENTE INTERATIVO em JavaScript nativo. Retorne EXCLUSIVAMENTE o código HTML/JS completo sem explicações em texto.";
    
    let userMessage = prompt;
    if (mode === 'refine' && currentCode) {
      userMessage = `Código HTML/JS Atual:\n${currentCode}\n\nSolicitação de Alteração do Usuário: ${prompt}`;
    } else if (mode === 'chat') {
      systemInstruction = "Você é um Engenheiro de Software Full-Stack e Consultor de TI. Responda em texto corrido e amigável tirando dúvidas sem gerar páginas inteiras de código.";
    }

    // Endpoint direto para o modelo gemini-2.0-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\n${userMessage}` }]
          }
        ]
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
    } else {
      // Exibe o erro exato que a API do Gemini devolveu
      const apiErrorMessage = data.error?.message || 'Erro ao processar na API do Gemini';
      return res.status(200).json({
        code: `<div style="padding:2rem; text-align:center; color:#ef4444; font-family:sans-serif;">
          <h3>Erro na API do Gemini</h3>
          <p>${apiErrorMessage}</p>
        </div>`,
        text: `Erro Gemini: ${apiErrorMessage}`
      });
    }

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
