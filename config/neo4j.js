const neo4j = require('neo4j-driver');
const uri = "neo4j+s://d98b54cd.databases.neo4j.io";
const user = "neo4j";
const password = "ycW2VqPh2HHwTXJP29ZgVBFz4vA-PGa3hHsj-2W93NU";
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

module.exports = driver; // Corrected export
