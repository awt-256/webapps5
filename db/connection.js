const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || "10000")
}

const db = mysql.createPool(dbConfig);

const WIPE_ALL_SQL = `DELETE FROM Items;`;
const wipeAll = (callback) => db.execute(WIPE_ALL_SQL, callback);
const INSERT_INTO_INVENTORY_SQL = `
INSERT INTO Items
    (name, quantity, description, lastModified, ownerUserId)
VALUES
    (?, ?, ?, ?, ?);`
const insertIntoInventory = (userId, name, quantity, description, lastModified, callback) => {
    db.execute(INSERT_INTO_INVENTORY_SQL, [
        name, quantity, description, lastModified, userId
    ], callback);
}
const READ_INVENTORY_SQL = `SELECT * FROM Items WHERE ownerUserId = ?;`;
const readAllInventory = (userId, callback) => {
    return db.execute(READ_INVENTORY_SQL, [userId], callback);
}
const READ_ITEM_INVENTORY_SQL = `
SELECT 
    id, name, quantity, description, lastModified
FROM
    Items
WHERE
    id = ? AND
    ownerUserId = ?;`;
const readItemInventory = (userId, id, callback) => {
    return db.execute(READ_ITEM_INVENTORY_SQL, [id, userId], callback);
}

const DELETE_ITEM_INVENTORY_SQL = `
DELETE FROM Items
WHERE id = ? AND ownerUserId = ?
`
const deleteItemInventory = (userId, id, callback) => {
    return db.execute(DELETE_ITEM_INVENTORY_SQL, [id, userId], callback);
}

const UPDATE_ITEM_INVENTORY_SQL = `
UPDATE Items
SET name = ?,
    quantity = ?,
    description = ?,
    lastModified = ?
WHERE
    ownerUserId = ? AND
    id = ?;
`
const updateItemInventory = (userId, id, name, quantity, description, lastModified, callback) => {
    return db.execute(UPDATE_ITEM_INVENTORY_SQL, [name, quantity, description, lastModified, userId, id], callback);
}

module.exports = {};
module.exports.wipe = wipeAll;
module.exports.delete = deleteItemInventory;
module.exports.insert = insertIntoInventory;
module.exports.readAll = readAllInventory;
module.exports.read = readItemInventory;
module.exports.update = updateItemInventory;
module.exports.disconnect = () => db.end();