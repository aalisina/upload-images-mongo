const express = require('express');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const { resolve } = require('path');
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Mongo URI
const MONGO_URI = 'mongodb://localhost:27017'

// Create Mongo connection
const conn = mongoose.createConnection(MONGO_URI)

// Init grid fs steam
let gfs;

conn.once('open', ()=> {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});

// Create storage engine
// Create storage engine
const storage = new GridFsStorage({
    url: MONGO_URI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });

const upload = multer({storage})

// @ route GET /
// desc loads form
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');
});

// @route POST upload
// @desc Uploads file to DB
app.post('/upload', upload.single('file'), (req, res)=> {
    // res.json({file: req.file});
    res.redirect('/')
})

//

const PORT = 3001;

app.listen(PORT, ()=> {
    console.log(`Server started on port: ${PORT}`);
});

