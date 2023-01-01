require('dotenv').config();
require('express-async-errors');
const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const { logger, logEvents } = require('./middleware/logger');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const connectDB = require('./config/dbConn');
const mongoose = require('mongoose');
const credentials = require('./middleware/credentials');
const verifyJWT = require('./middleware/verifyJWT');
const fileUpload = require('express-fileupload');
const PORT = process.env.PORT || 3500;
mongoose.set('strictQuery', true);

connectDB();

app.use(logger);
app.use(credentials);
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.use(fileUpload({ createParentPath: true }));

app.use('/', express.static(path.join(__dirname, 'public'))); // here to find static files
app.use('/files', express.static(path.join(__dirname, 'files'))); // here to find static files
app.use('/', require('./routes/root')); // here to find routes
app.use('/auth', require('./routes/authRoutes'));

app.use(verifyJWT);
app.use('/products', require('./routes/productRoutes'));
app.use('/orders', require('./routes/orderRoutes'));
app.use('/users', require('./routes/userRoutes'));

app.all('*', (req, res) => {
    res.status(404);
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views/404.html'));
        return;
    } else if (req.accepts('json')) {
        res.json({ message: 'Not found' });
        return;
    } else {
        res.type('txt').send('Not found');
        return;
    }
});

app.use(errorHandler);

mongoose.connection.once('open', () => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});

mongoose.connection.on('error', (err) => {
    console.log('Mongoose connection error: ', err);
    logEvents(
        `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
        'mongoErrLog.log'
    );
});
