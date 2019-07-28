'use strict';

const assert = require('assert');
const ridesValidation = require('../src/rides-validation');

describe('Validation', () => {
    it('should return array of valid data values', async () => {
        const data = {
            start_lat: 0,
            start_long: 0,
            end_lat: 0,
            end_long: 0,
            rider_name: 'Rider',
            driver_name: 'Driver',
            driver_vehicle: 'Car',
        };

        try {
            const values = await ridesValidation(data);
            assert.deepEqual(values, [0, 0, 0, 0, 'Rider', 'Driver', 'Car']);
        }
        catch (error) {
            assert.deepEqual(error, [0, 0, 0, 0, 'Rider', 'Driver', 'Car']);
        }
    });

    it('should throw start latitude error', async () => {
        const data = {
            start_lat: 200,
            start_long: 0,
            end_lat: 0,
            end_long: 0,
            rider_name: 'Rider',
            driver_name: 'Driver',
            driver_vehicle: 'Car',
        };

        try {
            await ridesValidation(data);
        }
        catch (error) {
            assert.deepEqual(error, {
                error_code: 'VALIDATION_ERROR',
                message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively',
            });
        }
    });

    it('should throw end latitude error', async () => {
        const data = {
            start_lat: 0,
            start_long: 0,
            end_lat: 0,
            end_long: 200,
            rider_name: 'Rider',
            driver_name: 'Driver',
            driver_vehicle: 'Car',
        };

        try {
            await ridesValidation(data);
        }
        catch (error) {
            assert.deepEqual(error, {
                error_code: 'VALIDATION_ERROR',
                message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively',
            });
        }
    });

    it('should throw empty string error', async () => {
        const data = {
            start_lat: 0,
            start_long: 0,
            end_lat: 0,
            end_long: 0,
            rider_name: '',
            driver_name: 'Driver',
            driver_vehicle: 'Car',
        };

        try {
            await ridesValidation(data);
        } catch (error) {
            assert.deepEqual(error, {
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string',
            });
        }
    });
});
