const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const util = require('util')
var bcrypt = require('bcrypt');
const filepath = "./tennisclub.db";
const saltRounds = 10;

let db = null;


function connectDB() {
  if (fs.existsSync(filepath)) {
      db= new sqlite3.Database(filepath);
    } else {
      db = new sqlite3.Database(filepath, async (error) => {
        if (error) {
          return console.error(error.message)         
        }
        createTables(db)
      });
      console.log("Connection with SQLite has been established")
    }
}

function createTables(db) {
  db.exec(`
  CREATE TABLE court
  (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description   TEXT NOT NULL,
    availabilityStartHour  INTEGER NOT NULL,
    availabilityEndHour INTEGER NOT NULL,
    lastWatering DATETIME NOT NULL,
    running BOOLEAN NOT NULL
  );
`);

  db.exec(`
  CREATE TABLE unavailability
  (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courtId INTEGER NOT NULL ,
    date  DATETIME NOT NULL,
    startHour INTEGER NOT NULL,
    endHour INTEGER NOT NULL,
    FOREIGN KEY(courtId) REFERENCES court(id)
  );
  `);

  db.exec(`
  CREATE TABLE reservation
  (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL ,
    courtId INTEGER NOT NULL ,
    date  DATETIME NOT NULL,
    startHour INTEGER NOT NULL,
    FOREIGN KEY(courtId) REFERENCES court(id),
    FOREIGN KEY(userId) REFERENCES user(id)
  );
  `);

  db.exec(`
  CREATE TABLE user
  (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    mail TEXT NOT NULL,
    role TEXT NOT NULL,
    password TEXT NOT NULL
  );
  `);

  db.exec(`
  CREATE TABLE article
  (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    heading TEXT NOT NULL,
    text TEXT NOT NULL
  );
  `);
}

// Method to add a new user
async function addUser(user) {
  return new Promise((resolve, reject) => {
    const { firstname, lastname, mail, password, role } = user;
    db.run(
      `INSERT INTO user (firstname, lastname, mail, password, role) VALUES (?, ?, ?, ?, ?)`,
      [firstname, lastname, mail, password, role],
      function (err) {
        if (err) {
          console.error("Error adding user:", err)
          reject(err)
        } else {
          console.log(`User added with id: ${this.lastID}`)
          resolve(this.lastID)
        }
      }
    );
  });
}

// Method to delete a user
async function deleteUserByMail(mail) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM user WHERE mail = ?`, [mail], function (err) {
      if (err) {
        console.error("Error deleting user:", err)
        reject(err)
      } else {
        console.log(`${this.changes} user deleted`)
        resolve(this.changes)
      }
    });
  });
}


// Method to find a user by mail
async function findUserByMail(mail) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM user WHERE mail = ?`, [mail], (err, row) => {
      if (err) {
        console.error("Error finding user:", err)
        reject(err)
      } else {
        resolve(row)
      }
    });
  });
}

// Method to get all users
async function findAllUsers() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT firstname, lastname, mail, role FROM user`, (err, rows) => {
      if (err) {
        console.error("Error getting all users:", err)
        reject(err)
      } else {
        resolve(rows)
      }
    });
  });
}

// Method to update a users role
async function updateUserRoleByMail(mail, newRole) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE user SET role = ? WHERE mail = ?`, [newRole, mail], function (err) {
      if (err) {
        console.error("Error changing user role:", err)
        reject(err)
      } else {
        console.log(`${this.changes} user role updated`)
        resolve(this.changes)
      }
    });
  });
}

// Method to find all courts
async function findAllCourts() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT court.* FROM court`, (err, courts) => {
      if (err) {
        console.error("Error getting courts:", err)
        reject(err)
      } else {
        resolve(courts)
      }
    });
  });
}

// Method to find all courts
async function findAllCourtsWithReservationsUnavailabilites(date) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT court.* FROM court`, (err, courts) => {
      if (err) {
        console.error("Error getting courts:", err)
        reject(err)
      } else {
        // Fetch reservations for each court
        Promise.all(courts.map(court => {
          return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM reservation WHERE courtId = ? AND date = ?`,
              [court.id, date],
              (err, reservations) => {
                if (err) {
                  console.error("Error getting reservations:", err)
                  reject(err)
                } else {
                  court.reservations = reservations.map(reservation=>reservation.startHour)
                  resolve()
                }
              });
          });
        })).then(() => {
          // Fetch unavailabilities for each court
          Promise.all(courts.map(court => {
            return new Promise((resolve, reject) => {
              db.all(`SELECT * FROM unavailability WHERE courtId = ? AND date = ?`,
                [court.id, date],
                (err, unavailabilities) => {
                  if (err) {
                    console.error("Error getting unavailabilities:", err)
                    reject(err)
                  } else {
                    court.unavailabilities = unavailabilities.map(unavailability=>Array.from(new Array(unavailability.endHour-unavailability.startHour), (x, i) => i + unavailability.startHour)).flat()
                    resolve()
                  }
                });
            });
          })).then(() => {
            resolve(courts)
          }).catch(reject)
        }).catch(reject)
      }
    });
  });
}

// Method to add a reservation on a court
async function addReservation(reservation) {
  const { userId, courtId, date, startHour } = reservation;
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO reservation (userId, courtId, date, startHour) VALUES (?, ?, ?, ?)`,
      [userId, courtId, date, startHour],
      function (err) {
        if (err) {
          console.error("Error adding reservation:", err);
          reject(err)
        } else {
          console.log(`Reservation added with id: ${this.lastID}`);
          resolve(this.lastID)
        }
      }
    );
  });
}

// Method to delete a reservation on a court
async function deleteReservation(reservationId) {
  return new Promise((resolve, reject) => {

    db.get(`SELECT * FROM reservation WHERE id = ?`, [reservationId], (err, row) => {
      if (err) {
        console.error("Error retrieving reservation to delete:", err);
        reject(err);
        return;
      }

      // Store the retrieved row before deletion
      const deletedRow = row;
      
      db.run(`DELETE FROM reservation WHERE id = ?`, [reservationId], function (err) {
        if (err) {
          console.error("Error deleting reservation:", err)
          reject(err)
        } else {
          console.log(`${this.changes} reservation deleted`)
          resolve(deletedRow)
        }
      });
    })
  });
}

// Method to add a reservation on a court
async function findAllArticles() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM article`, (err, rows) => {
      if (err) {
        console.error("Error getting all articles:", err)
        reject(err)
      } else {
        resolve(rows)
      }
    });
  });
}

// Method to find the reservations of a user
async function findPersonalReservations(userId, date) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM reservation WHERE userId = ? AND date = ?`,
      [userId, date],
      (err, rows) => {
        if (err) {
          console.error("Error getting reservations by user and day:", err)
          reject(err)
        } else {
          resolve(rows)
        }
      });
  });
}

// Method to start watering on a court
async function startWatering(courtId) {
  newDate = new Date()
  return new Promise((resolve, reject) => {
    db.run(`UPDATE court SET lastWatering = ?, running = true WHERE id = ?`, [newDate, courtId], function (err) {
      if (err) {
        console.error("Error starting watering:", err)
        reject(err)
      } else {
        console.log(`${this.changes} court started watering`)
        resolve(newDate.getTime());
      }
    });
  });
}

// Method to stop watering on a court
async function stopWatering(courtId) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE court SET running = false WHERE id = ?`, [courtId], function (err) {
      if (err) {
        console.error("Error stopping watering:", err)
        reject(err);
      } else {
        console.log(`${this.changes} court stopped watering`)
        resolve(this.changes);
      }
    });
  });
}


// Connect to the database upon startup and stop server on error
connectDB()

module.exports = {
  user: {
    addUser,
    deleteUserByMail,
    updateUserRoleByMail,
    findUserByMail,
    findAllUsers
  },
  court:{
    findAllCourts,
    findAllCourtsWithReservationsUnavailabilites,
    addReservation,
    deleteReservation,
    findPersonalReservations,
    startWatering,
    stopWatering
  },
  article:{
    findAllArticles
  }
};
