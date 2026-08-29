const express = require('express');
const app = express()
require('dotenv').config();
const cors = require('cors')
const port = process.env.PORT || 5000
const uri = process.env.MONGODB_URI;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors())
app.use(express.json())

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const db = client.db("Aiverse_db");
    const promptsCollection = db.collection("prompts");

    app.get('/api/prompts', async (req, res)=> {
      const result = await promptsCollection.find().toArray();
      res.send(result || {});
    })
    
    app.get('/api/my/prompts', async (req, res)=> {
      const query={};
      if(req.query.userId){
        query.userId = req.query.userId;
      }
      if(req.query.status){
        query.status = req.query.status;
      }
      const result = await promptsCollection.find(query).toArray();
      res.send(result || {});
    })

    app.post('/api/prompts', async (req, res)=> {
        const Promt = req.body;
        const newPromt ={
          ...Promt,
          createdAt: new Date()
        }
        const result = await promptsCollection.insertOne(newPromt);
        res.send(result)
    })



    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})