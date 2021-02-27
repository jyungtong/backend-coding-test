const logger = require('../lib/logger');
const { getRides } = require('../lib/db-actions');

const get = (db) => async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rides = await getRides(db, id);

    if (rides.length === 0) {
      throw new Error('NO_RIDES_FOUND');
    }

    return res.send(rides);
  } catch (err) {
    logger.error(err);

    switch (err.message) {
      case 'NO_RIDES_FOUND':
        return res.status(404).send({
          error_code: 'RIDES_NOT_FOUND_ERROR',
          message: 'Could not find any rides',
        });
      default:
        return res.status(500).send({
          error_code: 'SERVER_ERROR',
          message: 'Unknown error',
        });
    }
  }
};

module.exports = get;
