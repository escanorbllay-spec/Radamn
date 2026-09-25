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

    // Endpoint oficial compatível com OpenAI do Gemini (estável e aceita os novos modelos)
    const url = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

    // Modelos na ordem recomendada pela própria API da Google
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-3.1-pro-preview'];
    let lastError = null;

    for (const model of models) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: userMessage }
            ],
            temperature: 0.2
          })
        });

        const data = await response.json();

        if (response.ok && data.choices?.[0]?.message?.content) {
          const outputText = data.choices[0].message.content;
          const cleanCode = outputText.replace(/```html|```jsx|```javascript|```/g, '').trim();

          return res.status(200).json({ 
            code: cleanCode || '<div>Sem código gerado.</div>', 
            text: outputText || 'Sem texto gerado.' 
          });
        }

        lastError = data.error?.message || `Erro HTTP ${response.status} no modelo ${model}`;
      } catch (err) {
        lastError = err.message;
      }
    }

    return res.status(200).json({
      code: `<div style="padding:2rem; text-align:center; color:#ef4444; font-family:sans-serif;">
        <h3>Erro na API do Gemini</h3>
        <p>${lastError || 'Falha ao comunicar com os modelos do Gemini.'}</p>
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
