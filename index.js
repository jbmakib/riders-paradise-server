const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// connection string
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pdj6v.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

async function run() {
    try {
        await client.connect();
        const database = client.db("riders-paradise");
        const usersCollection = database.collection("users");
        const productsCollection = database.collection("products");

        // get a specific user
        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const user = await usersCollection.findOne({ email });
            user ? res.json(user) : res.json({});
        });

        // add user to database
        app.post("/users", async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });

        // make a user an admin
        app.put("/users/admin", async (req, res) => {
            const request = req.body;
            const user = request.userEmail;
            const requester = request.adminEmail;
            const requesterAccount = await usersCollection.findOne({
                email: requester,
            });
            if (requesterAccount.role === "admin") {
                const filter = { email: user };
                const updateDoc = { $set: { role: "admin" } };
                const result = await usersCollection.updateOne(
                    filter,
                    updateDoc
                );
                res.json(result);
            } else {
                res.status(403).json({
                    message: "you do not have access to make admin",
                });
            }
        });

        // get all product
        app.get("/products", async (req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.json(products);
        });

        // get a single product by id
        app.get("/products/:_id", async (req, res) => {
            const _id = req.params._id;
            const query = { _id: ObjectId(_id) };
            const product = await productsCollection.findOne(query);
            res.json(product);
        });
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Example app listening port: ${port}`);
});
