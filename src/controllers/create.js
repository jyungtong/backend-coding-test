const logger = require('../lib/logger');
const { createRide, getRides } = require('../lib/db-actions');
const ValidationError = require('../lib/ValidationError');

function validate(payload) {
  const startLatitude = Number(payload.start_lat);
  const startLongitude = Number(payload.start_long);
  const endLatitude = Number(payload.end_lat);
  const endLongitude = Number(payload.end_long);
  const riderName = payload.rider_name;
  const driverName = payload.driver_name;
  const driverVehicle = payload.driver_vehicle;

  if (startLatitude < -90 || startLatitude > 90 || startLongitude < -180 || startLongitude > 180) {
    throw new ValidationError('Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively');
  }

  if (endLatitude < -90 || endLatitude > 90 || endLongitude < -180 || endLongitude > 180) {
    throw new ValidationError('End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively');
  }

  if (typeof riderName !== 'string' || riderName.length < 1) {
    throw new ValidationError('Rider name must be a non empty string');
  }

  if (typeof driverName !== 'string' || driverName.length < 1) {
    throw new ValidationError('Driver name must be a non empty string');
  }

  if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
    throw new ValidationError('Driver vehicle must be a non empty string');
  }
}

const create = (db) => async (req, res) => {
  const values = [
    req.body.start_lat,
    req.body.start_long,
    req.body.end_lat,
    req.body.end_long,
    req.body.rider_name,
    req.body.driver_name,
    req.body.driver_vehicle,
  ];

  try {
    validate(req.body);

    const lastId = await createRide(db, values);
    const rides = await getRides(db, lastId);

    return res.status(201).send(rides);
  } catch (err) {
    logger.error(err);

    switch (err.name) {
      case 'VALIDATION_ERROR':
        return res.status(400).send({
          error_code: err.name,
          message: err.message,
        });

      default:
        return res.send({
          error_code: 'SERVER_ERROR',
          message: 'Unknown error',
        });
    }
  }
};

module.exports = create;
