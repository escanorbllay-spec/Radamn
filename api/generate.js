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

    // Lista de modelos em ordem de estabilidade
    const models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash'];
    let lastError = null;

    for (const model of models) {
      // Tenta até 2 vezes por modelo em caso de servidor ocupado
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\n${userMessage}` }]
              }]
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

          lastError = data.error?.message || `Erro HTTP ${response.status}`;

          // Se for alta demanda (503/429), espera 1 segundo e tenta de novo antes de mudar de modelo
          if (response.status === 503 || response.status === 429 || lastError.includes('demand')) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            break; // Se for erro de nome ou permissão, pula pro próximo modelo
          }
        } catch (err) {
          lastError = err.message;
        }
      }
    }

    return res.status(200).json({
      code: `<div style="padding:2rem; text-align:center; color:#ef4444; font-family:sans-serif;">
        <h3>Servidores em alta demanda</h3>
        <p>${lastError}</p>
      </div>`,
      text: `Erro Gemini: ${lastError}`
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
