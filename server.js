const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('public'));

// Rota para servir o index.html no root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Pasta temporária para uploads no ambiente serverless (Vercel)
const uploadsDir = path.join('/tmp', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Caminho do arquivo data.json na pasta temporária
const dataFile = path.join('/tmp', 'data.json');

app.use('/uploads', express.static(uploadsDir));
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

app.post('/upload', upload.single('image'), (req, res) => {
  try {
    const name = req.body.name;
    const imagePath = req.file.path;

    const newEntry = { name, imagePath };

    let data = [];
    if (fs.existsSync(dataFile)) {
      data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    }

    data.push(newEntry);
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

    res.json({ success: true });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

app.get('/images', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    res.json(data);
  } catch (error) {
    console.error('Erro ao carregar imagens:', error);
    res.status(500).json({ success: false, error: 'Erro ao carregar imagens' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
