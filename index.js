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
  gfs.files.find().toArray( (err, files)=> {
    // Check if files exist
    if(!files || files.length === 0) {
      res.render('index', {files: false})
    } else {
      files.map( (file) => {
        if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
          file.isImage = true
        } else {
          file.isImage = false;
        }
      })
      res.render('index', {files: files})
    }

    // FIles do exist
    return res.json(files)
  } )
});

// @route POST upload
// @desc Uploads file to DB
app.post('/upload', upload.single('file'), (req, res)=> {
    // res.json({file: req.file});
    res.redirect('/')
})

//@ route GET /files
//@desc Display all files in json
app.get('/files', (req, res) => {
  gfs.files.find().toArray( (err, files)=> {
    // Check if files exist
    if(!files || files.length === 0) {
      return res.status(404).json({
        err: 'No files found.'
      });
    }

    // FIles do exist
    return res.json(files)
  } )
})

//@ route GET /files/:filename
//@desc Display one file in json
app.get('/files/:filename', (req, res) => {
  gfs.files.findOne({filename: req.params.filename}, (err, file)=> {
      // Check if file exists
      if(!file || file.length === 0) {
        return res.status(404).json({
          err: 'No file found.'
        });
      }
    // File found
    return res.json(file);
  })
})

//@ route GET /images/:filename
//@desc Display an image
app.get('/images/:filename', (req, res) => {
  gfs.files.findOne({filename: req.params.filename}, (err, file)=> {
      // Check if file exists
      if(!file || file.length === 0) {
        return res.status(404).json({
          err: 'No file found.'
        });
      }
    // Check if it is an image
    if(file.contentType === 'image/jpeg' || file.contentType === 'img/png') {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);

    } else {
      res.status(400).json({
        err: 'Not an image.'
      })
    }
  })
})



const PORT = 3001;

app.listen(PORT, ()=> {
    console.log(`Server started on port: ${PORT}`);
});

