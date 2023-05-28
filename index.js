const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');

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
        const menuCollection = client.db("SMrestroDB").collection("Menu");
        const reviewsCollection = client.db("SMrestroDB").collection("reviews");
        // all menu data receive http://localhost:5000/menu
        app.get('/menu', async(req,res) => {
            const result = await menuCollection.find().toArray()
            res.send(result)
        })
        // all review data receive http://localhost:5000/review

        app.get('/reviews', async(req,res) => {
            const result = await reviewsCollection.find().toArray()
            res.send(result)
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
