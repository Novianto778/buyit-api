const { format } = require('date-fns');
const { v4: uuid } = require('uuid');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');

const logEvents = async (message, logFileName) => {
    const dateTime = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

    try {
        if (!fs.existsSync(path.join(__dirname, '../logs'))) {
            await fsPromises.mkdir(path.join(__dirname, '../logs'));
        }
        await fsPromises.appendFile(
            path.join(__dirname, `../logs/${logFileName}.log`),
            logItem
        );
    } catch (err) {
        console.error(err);
    }
};

const logger = (req, res, next) => {
    logEvents(
        `Request: ${req.method}\t${req.url}\t${req.headers.origin}`,
        'reqLog.log'
    );
    next();
};

module.exports = { logger, logEvents };