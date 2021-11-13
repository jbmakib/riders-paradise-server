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
        const ordersCollection = database.collection("orders");
        const messagesCollection = database.collection("messages");

        /* user part starts */

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

        /* user part ends */
        /* product part starts */

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

        // add a new product
        app.post("/products", async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.json(result);
        });

        // DELETE API for delete product
        app.delete("/products/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);

            res.json(result);
        });

        /* product part ends */
        /* orders part starts */

        // post api for adding a new order
        app.post("/orders", async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.json(result);
        });

        // get api for orders by email
        app.get("/orders/:byEmail", async (req, res) => {
            const email = req.params.byEmail;
            const cursor = ordersCollection.find({ email });
            const myOrders = await cursor.toArray();
            res.json(myOrders);
        });

        // get api for admin and check is admin true
        app.get("/orders/admin/:byEmail", async (req, res) => {
            const email = req.params.byEmail;
            const admin = await usersCollection.findOne({ email });
            if (admin.role === "admin") {
                const cursor = ordersCollection.find({});
                const allOrders = await cursor.toArray();
                res.json(allOrders);
            } else {
                res.status(403).json({ message: "Forbidden" });
            }
        });

        // DELETE API for delete order
        app.delete("/orders/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);

            res.json(result);
        });

        // Update api for update user
        app.put("/orders/:id", async (req, res) => {
            const id = req.params.id;
            const updatedOrder = req.body;
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    status: updatedOrder.status,
                },
            };
            const result = await ordersCollection.updateOne(filter, updateDoc);
            const cursor = ordersCollection.find({});
            const orders = await cursor.toArray();
            res.json({ result, orders });
        });

        /* orders part ends */
        /* message part starts */

        // post api for sending a message
        app.post("/messages", async (req, res) => {
            const order = req.body;
            const result = await messagesCollection.insertOne(order);
            res.json(result);
        });

        // post api for sending a message
        app.get("/messages/admin/:byEmail", async (req, res) => {
            const email = req.params.byEmail;
            const admin = await usersCollection.findOne({ email });
            if (admin.role === "admin") {
                const cursor = messagesCollection.find({});
                const messages = await cursor.toArray();
                res.json(messages);
            } else {
                res.status(403).json({ message: "Forbidden" });
            }
        });

        /* message part ends */
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
