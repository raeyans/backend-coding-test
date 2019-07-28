'use strict';

const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const swaggerDocument = require('../swagger.json');
const dbController = require('./db-controller');
const ridesValidation = require('./rides-validation');

module.exports = (db) => {
    const { dbAll, dbRun } = dbController(db);

    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    app.get('/health', (req, res) => res.send('Healthy'));

    app.post('/rides', jsonParser, async (req, res) => {
        try {
            const values = await ridesValidation(req.body);
            const lastID = await dbRun('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)', values);
            const rows = await dbAll('SELECT * FROM Rides WHERE rideID = ?', lastID);
            res.send(rows);
        }
        catch (error) {
            return res.send(error);
        }
    });

    app.get('/rides', async (req, res) => {
        const page = (req.query.page !== undefined) ? Number(req.query.page) : 1;
        const limit = (req.query.limit !== undefined) ? Number(req.query.limit) : 25;
        const offset = (page - 1) * limit;
        const sql = 'SELECT * FROM Rides LIMIT ? OFFSET ?';
        const params = [limit, offset];

        try {
            const rows = await dbAll(sql, params);
            res.send(rows);
        }
        catch (error) {
            return res.send(error);
        }
    });

    app.get('/rides/:id', async (req, res) => {
        const ID = req.params.id;
        
        try {
            const rows = await dbAll('SELECT * FROM Rides WHERE rideID=?', ID);
            res.send(rows);
        }
        catch (error) {
            return res.send(error);
        }
    });

    return app;
};
