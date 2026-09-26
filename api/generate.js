export default async function handler(req, res) {
  // Configura os cabeçalhos de CORS
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
    const { prompt, mode } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'O prompt é obrigatório.' });
    }

    const HF_TOKEN = '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';
    const MODEL_REPO = 'LuffyNox/radamn-ai-v1';

    // Chamada para a Inference API oficial do Hugging Face
    const hfResponse = await fetch(`https://api-inference.huggingface.co/models/${MODEL_REPO}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 512,
          temperature: 0.7,
          return_full_text: false
        }
      })
    });

    const result = await hfResponse.json();

    // Trata quando o modelo está carregando na GPU do Hugging Face
    if (hfResponse.status === 503) {
      return res.status(200).json({ 
        response: '⚠️ O modelo Radamn AI está a ser inicializado na GPU do Hugging Face. Por favor, aguarde 20 segundos e tente novamente!' 
      });
    }

    if (!hfResponse.ok) {
      return res.status(hfResponse.status).json({ 
        error: result.error || 'Erro ao comunicar com o Hugging Face.' 
      });
    }

    let textGenerated = '';

    if (Array.isArray(result) && result[0]?.generated_text) {
      textGenerated = result[0].generated_text;
    } else if (typeof result === 'string') {
      textGenerated = result;
    } else {
      textGenerated = JSON.stringify(result);
    }

    return res.status(200).json({
      success: true,
      response: textGenerated,
      code: textGenerated
    });

  } catch (error) {
    console.error("Erro na API generate:", error);
    return res.status(500).json({ error: 'Erro interno no servidor: ' + error.message });
  }
}
