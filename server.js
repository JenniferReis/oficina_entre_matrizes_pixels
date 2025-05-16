const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.json());

// Garante que a pasta uploads exista
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

app.post('/upload', upload.single('image'), (req, res) => {
  try {
    const name = req.body.name;
    const imagePath = req.file.path;

    const newEntry = { name, imagePath };

    let data = [];
    if (fs.existsSync('data.json')) {
      data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    }

    data.push(newEntry);
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));

    res.json({ success: true });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

app.get('/images', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    res.json(data);
  } catch (error) {
    console.error('Erro ao carregar imagens:', error);
    res.status(500).json({ success: false, error: 'Erro ao carregar imagens' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
