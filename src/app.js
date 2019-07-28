'use strict';

const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const swaggerDocument = require('../swagger.json');
const dbController = require('./db-controller');


module.exports = (db) => {
    const { dbAll, dbRun } = dbController(db);

    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    app.get('/health', (req, res) => res.send('Healthy'));

    app.post('/rides', jsonParser, async (req, res) => {
        const startLatitude = Number(req.body.start_lat);
        const startLongitude = Number(req.body.start_long);
        const endLatitude = Number(req.body.end_lat);
        const endLongitude = Number(req.body.end_long);
        const riderName = req.body.rider_name;
        const driverName = req.body.driver_name;
        const driverVehicle = req.body.driver_vehicle;

        if (startLatitude < -90 || startLatitude > 90 || startLongitude < -180 || startLongitude > 180) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
            });
        }

        if (endLatitude < -90 || endLatitude > 90 || endLongitude < -180 || endLongitude > 180) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
            });
        }

        if (typeof riderName !== 'string' || riderName.length < 1) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string'
            });
        }

        if (typeof driverName !== 'string' || driverName.length < 1) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string'
            });
        }

        if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string'
            });
        }

        var values = [req.body.start_lat, req.body.start_long, req.body.end_lat, req.body.end_long, req.body.rider_name, req.body.driver_name, req.body.driver_vehicle];

        try {
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
        let sql, params = [];

        if (page > 0) {
            sql = 'SELECT * FROM Rides LIMIT ? OFFSET ?';
            const offset = (page - 1) * limit;
            params = [limit, offset];
        }

        try {
            const rows = await dbAll(sql, params);
            res.send(rows);
        }
        catch (error) {
            return res.send(error);
        }
    });

    app.get('/rides/:id', async (req, res) => {
        try {
            const rows = await dbAll(`SELECT * FROM Rides WHERE rideID='${req.params.id}'`);
            res.send(rows);
        }
        catch (error) {
            return res.send(error);
        }
    });

    return app;
};
