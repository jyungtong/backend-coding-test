const chai = require('chai');
const request = require('supertest');
const sqlite3 = require('sqlite3').verbose();
const buildSchemas = require('../src/schemas');
const { cleanDb, resetIncrement } = require('../src/lib/db-actions');

const db = new sqlite3.Database(':memory:');
const app = require('../src/app')(db);
chai.use(require('chai-shallow-deep-equal'));

const { expect } = chai;

const mockRidePayload = {
  start_lat: 3.0468888401012952,
  start_long: 101.70134502398477,
  end_lat: 3.047938771790838,
  end_long: 101.68853469647756,
  rider_name: 'John Doe',
  driver_name: 'Bill Gates',
  driver_vehicle: 'Tesla Model 3',
};

const mockResponse = {
  startLat: 3.0468888401012952,
  startLong: 101.70134502398477,
  endLat: 3.047938771790838,
  endLong: 101.68853469647756,
  riderName: 'John Doe',
  driverName: 'Bill Gates',
  driverVehicle: 'Tesla Model 3',
};

function createRide(payload) {
  return request(app)
    .post('/rides')
    .send(payload);
}

describe('API tests', () => {
  before((done) => {
    db.serialize((err) => {
      if (err) {
        return done(err);
      }

      buildSchemas(db);

      return done();
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
    describe('with valid payload', () => {
      it('should create a new ride', (done) => {
        request(app)
          .post('/rides')
          .send(mockRidePayload)
          .expect('Content-Type', /application\/json/)
          .expect(201)
          .then((response) => {
            expect(response.body[0]).to.shallowDeepEqual({
              rideID: 1,
              startLat: 3.0468888401012952,
              startLong: 101.70134502398477,
              endLat: 3.047938771790838,
              endLong: 101.68853469647756,
              riderName: 'John Doe',
              driverName: 'Bill Gates',
              driverVehicle: 'Tesla Model 3',
            });
            expect(response.body[0]).to.haveOwnProperty('created');

            done();
          })
          .catch((err) => done(err));
      });
    });

    describe('with invalid', () => {
      describe('start_lat', () => {
        it('should response with error', (done) => {
          request(app)
            .post('/rides')
            .send({
              ...mockRidePayload,
              start_lat: -100,
            })
            .expect('Content-Type', /application\/json/)
            .expect(400)
            .then((response) => {
              expect(response.body).to.shallowDeepEqual({
                error_code: 'VALIDATION_ERROR',
                message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively',
              });

              done();
            })
            .catch((err) => done(err));
        });
      });

      describe('end_lat', () => {
        it('should response with error', (done) => {
          request(app)
            .post('/rides')
            .send({
              ...mockRidePayload,
              end_lat: -100,
            })
            .expect('Content-Type', /application\/json/)
            .expect(400)
            .then((response) => {
              expect(response.body).to.shallowDeepEqual({
                error_code: 'VALIDATION_ERROR',
                message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively',
              });

              done();
            })
            .catch((err) => done(err));
        });
      });

      describe('rider_name', () => {
        it('should response with error', (done) => {
          request(app)
            .post('/rides')
            .send({
              ...mockRidePayload,
              rider_name: undefined,
            })
            .expect('Content-Type', /application\/json/)
            .expect(400)
            .then((response) => {
              expect(response.body).to.shallowDeepEqual({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string',
              });

              done();
            })
            .catch((err) => done(err));
        });
      });

      describe('driver_name', () => {
        it('should response with error', (done) => {
          request(app)
            .post('/rides')
            .send({
              ...mockRidePayload,
              driver_name: undefined,
            })
            .expect('Content-Type', /application\/json/)
            .expect(400)
            .then((response) => {
              expect(response.body).to.shallowDeepEqual({
                error_code: 'VALIDATION_ERROR',
                message: 'Driver name must be a non empty string',
              });

              done();
            })
            .catch((err) => done(err));
        });
      });

      describe('driver_vehicle', () => {
        it('should response with error', (done) => {
          request(app)
            .post('/rides')
            .send({
              ...mockRidePayload,
              driver_vehicle: undefined,
            })
            .expect('Content-Type', /application\/json/)
            .expect(400)
            .then((response) => {
              expect(response.body).to.shallowDeepEqual({
                error_code: 'VALIDATION_ERROR',
                message: 'Driver vehicle must be a non empty string',
              });

              done();
            })
            .catch((err) => done(err));
        });
      });
    });
  });

  describe('GET /rides', () => {
    describe('when db is empty', () => {
      before(async () => {
        await Promise.all([
          cleanDb(db),
          resetIncrement(db),
        ]);
      });

      it('should return not found', (done) => {
        request(app)
          .get('/rides')
          .expect('Content-Type', /application\/json/)
          .expect(404)
          .then((response) => {
            expect(response.body).to.shallowDeepEqual(
              {
                error_code: 'RIDES_NOT_FOUND_ERROR',
                message: 'Could not find any rides',
              },
            );

            return done();
          });
      });
    });

    describe('when db has data', () => {
      before(async () => {
        await Promise.all([
          createRide(mockRidePayload),
          createRide(mockRidePayload),
          createRide(mockRidePayload),
          createRide(mockRidePayload),
          createRide(mockRidePayload),
          createRide(mockRidePayload),
        ]);
      });

      describe('without cursor', () => {
        it('should return list of first 3 rides', (done) => {
          request(app)
            .get('/rides')
            .expect('Content-Type', /application\/json/)
            .expect(200)
            .then((response) => {
              expect(response.body).to.shallowDeepEqual([
                {
                  ...mockResponse,
                  rideID: 1,
                },
                {
                  ...mockResponse,
                  rideID: 2,
                },
                {
                  ...mockResponse,
                  rideID: 3,
                },

              ]);
              expect(response.body[0]).to.haveOwnProperty('created');

              done();
            })
            .catch((err) => done(err));
        });
      });

      describe('with cursor=3', () => {
        it('should return list of last 3 rides', (done) => {
          request(app)
            .get('/rides?cursor=3')
            .expect('Content-Type', /application\/json/)
            .expect(200)
            .then((response) => {
              expect(response.body).to.shallowDeepEqual([
                {
                  ...mockResponse,
                  rideID: 4,
                },
                {
                  ...mockResponse,
                  rideID: 5,
                },
                {
                  ...mockResponse,
                  rideID: 6,
                },

              ]);
              expect(response.body[0]).to.haveOwnProperty('created');

              done();
            })
            .catch((err) => done(err));
        });
      });

      describe('with malicious code passed in', () => {
        it('should return error', (done) => {
          request(app)
            .get('/rides?cursor=0;DROP TABLE Rides;')
            .expect('Content-Type', /application\/json/)
            .expect(500)
            .then((response) => {
              expect(response.body).to.shallowDeepEqual({
                error_code: 'SERVER_ERROR',
                message: 'Unknown error',
              });

              done();
            })
            .catch((err) => done(err));
        });
      });
    });
  });

  describe('GET /rides/:id', () => {
    describe('when ride is exists', () => {
      it('should return the ride', (done) => {
        request(app)
          .get('/rides/1')
          .expect('Content-Type', /application\/json/)
          .expect(200)
          .then((response) => {
            expect(response.body).to.shallowDeepEqual([
              {
                ...mockResponse,
                rideID: 1,
              },
            ]);
            expect(response.body[0]).to.haveOwnProperty('created');

            done();
          })
          .catch((err) => done(err));
      });
    });

    describe('when ride is not exists', () => {
      it('should return not found', (done) => {
        request(app)
          .get('/rides/33')
          .expect('Content-Type', /application\/json/)
          .expect(404)
          .then((response) => {
            expect(response.body).to.shallowDeepEqual(
              {
                error_code: 'RIDES_NOT_FOUND_ERROR',
                message: 'Could not find any rides',
              },
            );

            done();
          })
          .catch((err) => done(err));
      });
    });

    describe('when malicious code is passed in', () => {
      it('should return not found error', (done) => {
        request(app)
          .get('/rides/1;DROP TABLE Rides;')
          .expect('Content-Type', /application\/json/)
          .expect(404)
          .then((response) => {
            expect(response.body).to.shallowDeepEqual(
              {
                error_code: 'RIDES_NOT_FOUND_ERROR',
                message: 'Could not find any rides',
              },
            );

            done();
          })
          .catch((err) => done(err));
      });
    });
  });
});
