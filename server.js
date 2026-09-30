const express = require('express');
const cors = require('cors');

const app = express();

// Ativa o CORS para permitir requisições do frontend
app.use(cors());

// Permite interpretar requisições JSON
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.json({ status: "Online", engine: "Radam Engine Core v11.3" });
});

// Rota principal do Chat integrada à tua Engine Própria
app.post('/api/chat', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const masterKey = process.env.RADAMN_MASTER_KEY;

    // 1. Validação de segurança opcional
    if (masterKey && authHeader !== `Bearer ${masterKey}`) {
      return res.status(401).json({ error: 'Acesso não autorizado: Chave master inválida.' });
    }

    const { message, prompt } = req.body;
    const userText = message || prompt;

    if (!userText) {
      return res.status(400).json({ error: 'Nenhuma mensagem enviada.' });
    }

    // --- AQUI ENTRA A TUA LÓGICA DA TUA PRÓPRIA INTELIGÊNCIA ---
    // Podes processar o 'userText' aqui e gerar a resposta real da tua engine.
    
    const respostaDaEngine = `Recebi o teu comando na Radam Engine: "${userText}". Processado com sucesso!`;
    // -------------------------------------------------------------

    return res.json({ 
      reply: respostaDaEngine, 
      message: respostaDaEngine 
    });

  } catch (error) {
    console.error('Erro no servidor:', error);
    return res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
