const mongoDb = require('mongodb');
const mongoClient = mongoDb.MongoClient;

let _db;

const mongoConnect = (callBack) => {
    mongoClient.connect('mongodb+srv://elishaibukun:ExpProject1234@cluster0.qxzkg.mongodb.net/shop?retryWrites=true&w=majority&appName=Cluster0')
    .then(client => {
        _db = client.db();
        console.log('Connection Suucessful')
        callBack();
    })
    .catch(
        err => {
            console.log(err)
            throw err;
        }
    );
};

const getDb = () => {
    if(_db){
        return _db;
    }
    throw "No database found!"; 
}

// module.exports = mongoConnect;

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;



