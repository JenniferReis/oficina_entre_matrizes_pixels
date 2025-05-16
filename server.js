const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const { Readable } = require('stream');
const cloudinary = require('./cloudinary');

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

const upload = multer(); // Usamos o multer só pra capturar o buffer, sem salvar no disco

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const name = req.body.name;
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'galeria_virtual' },
        (error, result) => {
          if (result) resolve(result);
          else reject(error);
        }
      );
      bufferStream.pipe(stream);
    });

    const newEntry = {
      name,
      imageUrl: result.secure_url,
      public_id: result.public_id
    };

    let data = [];
    if (fs.existsSync('data.json')) {
      data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    }

    data.push(newEntry);
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));

    res.json({ success: true, image: newEntry });
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
