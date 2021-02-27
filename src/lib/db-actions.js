function cleanDb(db) {
  return new Promise((resolve, reject) => {
    db.run(`
    DELETE FROM Rides;
    `, (err) => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });
}

function resetIncrement(db) {
  return new Promise((resolve, reject) => {
    db.run(`
    DELETE FROM sqlite_sequence where name='Rides';
    `, (err) => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });
}

function createRide(db, values) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)', values, function returnLastId(err) {
      if (err) {
        return reject(err);
      }

      return resolve(this.lastID);
    });
  });
}

function listRides(db, cursor) {
  const MAX_PER_PAGE = 3;

  return new Promise((resolve, reject) => {
    db.all(`
    SELECT * FROM Rides
    WHERE rideID > ${Number(cursor)}
    limit ${MAX_PER_PAGE}`, (err, rows) => {
      if (err) {
        return reject(err);
      }

      return resolve(rows);
    });
  });
}

function getRides(db, id) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM Rides WHERE rideID = ?', id, (err, rows) => {
      if (err) {
        return reject(err);
      }

      return resolve(rows);
    });
  });
}

module.exports = {
  cleanDb,
  createRide,
  getRides,
  listRides,
  resetIncrement,
};
