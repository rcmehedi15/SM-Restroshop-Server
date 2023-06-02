const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middle ware 
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@mehedi15.lrak9tg.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        // server to connect mongodb database
        const usersCollection = client.db("SMrestroDB").collection("users");
        const menuCollection = client.db("SMrestroDB").collection("Menu");
        const reviewsCollection = client.db("SMrestroDB").collection("reviews");
        const cartCollection = client.db("SMrestroDB").collection("carts");


        // user related api 
        app.post('/users',async(req,res) =>{
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })
        // all menu data receive http://localhost:5000/menu
        app.get('/menu', async (req, res) => {
            const result = await menuCollection.find().toArray()
            res.send(result)
        })
        // all review data receive http://localhost:5000/reviews

        app.get('/reviews', async (req, res) => {
            const result = await reviewsCollection.find().toArray()
            res.send(result)
        })
        // cart collection http://localhost:5000/carts
        app.post('/carts/', async (req, res) => {
            const item = req.body;
            console.log(item);
            const result = await cartCollection.insertOne(item);
            res.send(result)
        })
        // unique data receive
        app.get('/carts', async (req, res) => {
            const email = req.query.email;
            if (!email) {
                res.send([]);
            }
            const query = { email: email };
            const result = await cartCollection.find(query).toArray();
            res.send(result);

        })

        app.delete('/carts/:id',async(req,res) =>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('SM RESTRO is Running')
})

app.listen(port, () => {
    console.log(`SM RESTRO is siiting on port ${port}`);
})
/**
 * ---------------------------------------
 * Naming Convention
 * --------------------------------------
 * 1. users : userCollection
 * 2. app.get('/users')    = all user get
 * 3. app.get('/users/:id') = peticular user neeeded
 * 4. app.post('/users') = new post create
 * 5. app.patch('/users/:id') = perticular user data update
 * 6. app.put('/users/:id')
 * 7. app.delete('users/:id') = user delete or data delete
 * 
 */