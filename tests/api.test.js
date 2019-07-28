'use strict';

const request = require('supertest');
const assert = require('assert');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');
const app = require('../src/app')(db);
const buildSchemas = require('../src/schemas');

describe('API tests', () => {
    before((done) => {
        db.serialize((err) => {
            if (err) return done(err);
            buildSchemas(db);

            for (let counter = 0; counter < 30; counter++) {
                db.run(`INSERT INTO Rides (startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`, [0, 0, 0, 0, `Rider ${counter+1}`, `Driver ${counter+1}`, 'Car']);
            }

            done();
        });
    });

    describe('GET /health', () => {
        it('should return health', (done) => {
            request(app)
                .get('/health')
                .expect('Content-Type', /text/)
                .expect(200, done);
        });
    });

    describe('POST /rides', () => {
        it('should create new ride', (done) => {
            request(app)
                .post('/rides')
                .send({
                    start_lat: 0,
                    start_long: 0,
                    end_lat: 0,
                    end_long: 0,
                    rider_name: 'Rider',
                    driver_name: 'Driver',
                    driver_vehicle: 'Car',
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    assert.equal(res.body[0].rideID, 31);
                    assert.ok(res.body[0].created);
                    done();
                });
        });

        it('should return latitude longitude validation error', (done) => {
            request(app)
                .post('/rides')
                .send({
                    start_lat: 200,
                    start_long: 0,
                    end_lat: 0,
                    end_long: 0,
                    rider_name: 'Rider',
                    driver_name: 'Driver',
                    driver_vehicle: 'Car',
                })
                .expect('Content-Type', /json/)
                .expect(200, {
                    error_code: 'VALIDATION_ERROR',
                    message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively',
                }, done);
        });

        it('should return latitude longitude validation error', (done) => {
            request(app)
                .post('/rides')
                .send({
                    start_lat: 0,
                    start_long: 0,
                    end_lat: 0,
                    end_long: 200,
                    rider_name: 'Rider',
                    driver_name: 'Driver',
                    driver_vehicle: 'Car',
                })
                .expect('Content-Type', /json/)
                .expect(200, {
                    error_code: 'VALIDATION_ERROR',
                    message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively',
                }, done);
        });

        it('should return empty string validation error', (done) => {
            request(app)
                .post('/rides')
                .send({
                    start_lat: 0,
                    start_long: 0,
                    end_lat: 0,
                    end_long: 0,
                    rider_name: '',
                    driver_name: 'Driver',
                    driver_vehicle: 'Car',
                })
                .expect('Content-Type', /json/)
                .expect(200, {
                    error_code: 'VALIDATION_ERROR',
                    message: 'Rider name must be a non empty string',
                }, done);
        });
    });

    describe('GET /rides/{id}', () => {
        it('should return a ride', (done) => {
            request(app)
                .get('/rides/1')
                .expect('Content-Type', /json/)
                .expect(200, done);
        });

        it('should error could not find any rides', (done) => {
            request(app)
                .get('/rides/99')
                .expect('Content-Type', /json/)
                .expect(200, {
                    error_code: 'RIDES_NOT_FOUND_ERROR',
                    message: 'Could not find any rides',
                }, done);
        });
    });

    describe('Pagination', () => {
        it('should return default 25 rows', (done) => {
            request(app)
                .get('/rides?page=1')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    assert.equal(res.body.length, 25);
                    done();
                });
        });

        it('should return page 2', (done) => {
            request(app)
                .get('/rides?page=2')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    assert.equal(res.body[0].rideID, 26);
                    done();
                });
        });

        it('should return limit 5 rows', (done) => {
            request(app)
                .get('/rides?page=1&limit=5')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    assert.equal(res.body.length, 5);
                    done();
                });
        });
    });

    describe('dbAll', () => {
        const dbController = require('../src/db-controller');
        const { dbAll } = dbController(db);

        it('should return data rows', async () => {
            const rows = await dbAll('SELECT * FROM Rides');
            assert.equal(rows.length, 31);
        });

        it ('should throw server error', async () => {
            try {
                await dbAll('SELECT * FROM Rides WHERE foo=1');
            }
            catch (error) {
                assert.deepEqual(error, { error_code: 'SERVER_ERROR', message: 'Unknown error' });
            }
        });
    });
});
