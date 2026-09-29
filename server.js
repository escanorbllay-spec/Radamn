const express = require('express');
const cors = require('cors');
const app = express();

// Ativa o CORS sem restrições de origem
app.use(cors());

// Garante que o servidor entenda requisições JSON
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Servidor RadamNox AI rodando com sucesso!');
});

// Certifique-se de que a rota POST corresponde ao que o frontend chama
app.post('/api/chat', async (req, res) => {
  try {
    // Sua lógica de chamada da OpenRouter aqui
    const { message } = req.body;
    // ...
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
