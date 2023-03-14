const db = require("./connection");

db.wipe();

// db.insert("Apple", 5, "Very red. Or green", new Date().toISOString());
// db.insert("Orange", 5, "Very orange", new Date().toISOString());
// db.insert("Yellow", 3, "Lemons", new Date().toISOString());

db.readAll((error, results) => {
    if (error) throw error;
    
    console.log(results);
    db.disconnect();
});