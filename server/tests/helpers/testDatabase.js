const mongoose = require("mongoose");
const {MongoMemoryServer} = require("mongodb-memory-server");

let mongoServer;

const connectTestDatabase = async () => {
    if(mongoose.connection.readyState !== 0){
        throw new Error(
            "Mongoose is already connected. Tests require an isolated database."
        );
    }

    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri(), {
        dbName : "codecollab_test",
    });
};

const clearTestDatabase = async () => {
    const collections = mongoose.connection.collections;

    for (const collection of Object.values(collections)){
        await collection.deleteMany({});
    }
};

const closeTestDatabase = async () => {
    if (mongoose.connection.readyState !== 0){
        await mongoose.disconnect();
    }

    if (mongoServer) {
        await mongoServer.stop();
        mongoServer = undefined;
    }
};

module.exports = {
    connectTestDatabase,
    clearTestDatabase,
    closeTestDatabase,
}