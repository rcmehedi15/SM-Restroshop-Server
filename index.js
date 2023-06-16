const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const mg = require('nodemailer-mailgun-transport');
require('dotenv').config()
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');




const auth = {
    auth: {
      api_key: process.env.EMAIL_PRIVATE_KEY,
      domain: process.env.EMAIL_DOMAIN
    }
  }
const transporter = nodemailer.createTransport(mg(auth));

// send payment confirmation email
const sendPaymentConfirmationEmail = payment => {
    transporter.sendMail({
        from: "mdmehedihasan20188@gmail.com", // verified sender email
        to:"mdmehedihasan20188@gmail.com", // recipient email
        subject: "Your Order is confirmed.Enjoy!", // Subject line
        text: "Hello world!", // plain text body
        html: `
        <div>
            <h2>Payment Done!</h2>
            <P>Transaction ID : ${payment.transactionId}</P>
        </div>
        `, // html body
      }, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
}

// middle ware 
app.use(cors());
app.use(express.json());

// jwt
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'Unauthorized access' })
    }
    // bearer token
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}



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
        // await client.connect();

        // server to connect mongodb database
        const usersCollection = client.db("SMrestroDB").collection("users");
        const menuCollection = client.db("SMrestroDB").collection("Menu");
        const reviewsCollection = client.db("SMrestroDB").collection("reviews");
        const cartCollection = client.db("SMrestroDB").collection("carts");
        const paymentCollection = client.db("SMrestroDB").collection("payments");

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            });
            res.send({ token })
        });

        // Warning: use verifyJWT before using verifyAdmin

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ errror: true, message: 'forbidden Message' });
            }
            next();
        }

        /* 

        -------------------
            Basic
        -------------------
        1. Do not show secure links to those who should not see the links
        only show to the person/types of user who should see it

        2.do not allow to visit the link by typing on the url
        use adimnRoute that will check wheater the user is admin or not if 
        not admin then redirect to any other page .you could logout user and send them to the login page as well    
        --------------------------
        To send Data 
        -------------------------
        1. verify jwt token(send authorization token in the header to server).
        if possible use axios to send jwt token by intercepting the request
        2. if it is an admin activity.Make sure onlyu admin user in posting data by using verifyJWT
        */



        // user get  apis 
        app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        })

        // user related api 
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query);
            console.log(existingUser);
            if (existingUser) {
                return res.send({ message: 'user already exits' })
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })
        // security layer : verifyJWT
        // email same 
        // check admin
        app.get('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                res.send({ admin: false })
            }
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            const result = { admin: user?.role === 'admin' }
            res.send(result);
        })
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result)
        })



        // all menu data receive http://localhost:5000/menu
        app.get('/menu', async (req, res) => {
            const result = await menuCollection.find().toArray()
            res.send(result)
        })

        app.post('/menu', async (req, res) => {
            const newItem = req.body
            const result = await menuCollection.insertOne(newItem);
            res.send(result);
        })

        app.delete('/menu/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await menuCollection.deleteOne(query);
            res.send(result);
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
        app.get('/carts', verifyJWT, async (req, res) => {
            const email = req.query.email;
            if (!email) {
                res.send([]);
            }

            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'Forbidden access' })
            }
            const query = { email: email };
            const result = await cartCollection.find(query).toArray();
            res.send(result);

        })

        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        })
        // create payment intent
        app.post('/create-payment-intent', verifyJWT, async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });

            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })


        // payment realted api
        app.post('/payments', verifyJWT, async (req, res) => {
            const payment = req.body;
            payment.menuItems = payment.menuItems.map(item => new ObjectId(item))
            const insertResult = await paymentCollection.insertOne(payment);
            const query = { _id: { $in: payment.cartItems.map(id => new ObjectId(id)) } }
            const deleteResult = await cartCollection.deleteMany(query);

            res.send({ insertResult, deleteResult })
            sendPaymentConfirmationEmail(payment)
            console.log(payment);
        })

        // send an email

        app.get('/admin-stats', verifyJWT, verifyAdmin, async (req, res) => {
            const users = await usersCollection.estimatedDocumentCount();
            const products = await menuCollection.estimatedDocumentCount();
            const orders = await paymentCollection.estimatedDocumentCount();

            // best way to get sum of a field is to use group and sum operator


            const payments = await paymentCollection.find().toArray();
            const revenue = payments.reduce((sum, payment) => sum + payment.price, 0)
            res.send({
                users,
                products,
                orders,
                revenue

            })
        })
        /**
   * ---------------
   * ( best solution)
   * ---------------
   * 1. load all payments
   * 2. for each payment, get the menuItems array
   * 3. for each item in the menuItems array get the menuItem from the menu collection
   * 4. put them in an array: allOrderedItems
   * 5. separate allOrderedItems by category using filter
   * 6. now get the quantity by using length: pizzas.length
   * 7. for each category use reduce to get the total amount spent on this category
   * 
  */
        app.get('/order-stats', async (req, res) => {
            const pipeline = [
                {
                    $lookup: {
                        from: 'Menu',
                        localField: 'menuItems',
                        foreignField: '_id',
                        as: 'menuItemsData'
                    }
                },
                {
                    $unwind: '$menuItemsData'
                },
                {
                    $group: {
                        _id: '$menuItemsData.category',
                        count: { $sum: 1 },
                        total: { $sum: '$menuItemsData.price' }
                    }
                },
                {
                    $project: {
                        category: '$_id',
                        count: 1,
                        total: { $round: ['$total', 2] },
                        _id: 0
                    }
                }
            ];

            const result = await paymentCollection.aggregate(pipeline).toArray()
            console.log(result);
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