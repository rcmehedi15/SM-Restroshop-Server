const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;

// middle ware 
app.use(cors());
app.use(express.json());


app.get('/',(req,res)=>{
    res.send('SM RESTRO is Running')
})

app.listen(port,() => {
    console.log(`SM RESTRO is siiting on port ${port}`);
})
