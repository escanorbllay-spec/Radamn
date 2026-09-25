export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ text: 'Método não permitido.' });
  }

  const { prompt } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ text: 'Por favor, digite uma mensagem.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ text: 'Erro: A GEMINI_API_KEY não foi encontrada na Vercel.' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ text: `Erro no Gemini: ${data.error?.message || 'Falha na comunicação.'}` });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return res.status(200).json({ text: reply || 'Sem resposta recebida da IA.' });
  } catch (error) {
    return res.status(500).json({ text: `Erro interno: ${error.message}` });
  }
}
