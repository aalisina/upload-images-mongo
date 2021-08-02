const express = require('express');

const app = express();

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');
});

const PORT = 3001;

app.listen(PORT, ()=> {
    console.log(`Server started on port: ${PORT}`);
});

