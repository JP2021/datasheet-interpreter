require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const pdf = require('pdf-parse');

const app = express();
const port = 3000;

// Configuração do multer para armazenar os PDFs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware para servir arquivos estáticos
app.use(express.static('public'));

// Rota para exibir a página HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para o upload de arquivos PDF e processamento da pergunta
app.post('/upload', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('Nenhum arquivo enviado.');
  }

  const question = req.body.question || '';  // Captura a pergunta do usuário

  try {
    // Extrair texto do PDF
    const extractedText = await extractTextFromPDF(req.file.path);

    // Processar o texto com a pergunta do usuário via OpenAI
    const openAiResponse = await processTextWithOpenAI(extractedText, question);

    // Apagar o arquivo após processamento
    fs.unlinkSync(req.file.path);

    // Enviar a resposta final para o cliente
    res.json({
      message: 'Arquivo processado com sucesso!',
      openAiResponse: openAiResponse
    });

  } catch (error) {
    console.error('Erro no processamento:', error);
    res.status(500).send('Erro ao processar o arquivo.');
  }
});

// Função para extrair texto do PDF
async function extractTextFromPDF(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    return data.text;  // Retorna o texto extraído do PDF
  } catch (error) {
    throw new Error('Erro ao extrair texto do PDF');
  }
}

// Função para filtrar o texto e condensar o conteúdo (caso necessário)
function filterText(text) {
  // Aqui você pode aplicar algum tipo de processamento, como resumir o texto ou extrair partes relevantes
  // Como exemplo, vamos cortar o texto em 3000 caracteres (ajuste conforme necessário)
  if (text.length > 3000) {
    text = text.slice(0, 3000); // Cortar o texto caso seja muito grande
  }

  return text;
}

// Função para enviar o texto extraído e a pergunta para o OpenAI
async function processTextWithOpenAI(text, question) {
  const filteredText = filterText(text); // Filtrando o texto se necessário

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Você é um especialista em componentes eletrônicos.' },
        { role: 'user', content: filteredText },
        { role: 'user', content: `Pergunta do usuário: ${question}` }
      ],
      max_tokens: 500 // Limite de tokens para a resposta
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    throw new Error('Erro ao comunicar com a API OpenAI');
  }
}

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
