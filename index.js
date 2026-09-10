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
    const usersCollection = db.collection("user");
    const promptsCollection = db.collection("prompts");
    const plansCollection = db.collection("plans");
    const subscriptionCollection = db.collection("subscriptions");

    app.get('/api/user', async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.patch('/api/user/:id/role', async (req, res) => {
      const { id } = req.params;
      const { role } = req.body;

      if (!['user', 'creator', 'admin'].includes(role)) {
        return res.status(400).send({ message: "Invalid role specified." });
      }

      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: role,
          updatedAt: new Date()
        }
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete('/api/user/:id', async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    app.get('/api/prompts', async (req, res) => {
      const result = await promptsCollection.find().toArray();
      res.send(result || {});
    })
    app.get('/api/prompts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await promptsCollection.findOne(query)
      res.send(result || {});
    })
    app.get('/api/featured', async (req, res) => {
      const result = await promptsCollection.find().sort({ createdAt: -1 }).limit(6).toArray();
      res.send(result || []);
    })
    app.get('/api/my/prompts', async (req, res) => {
      const query = {};
      if (req.query.userId) {
        query.userId = req.query.userId;
      }
      if (req.query.status) {
        query.status = req.query.status;
      }
      const result = await promptsCollection.find(query).toArray();
      res.send(result || {});
    })

    app.post('/api/prompts', async (req, res) => {
      const Promt = req.body;
      const newPromt = {
        ...Promt,
        createdAt: new Date()
      }
      const result = await promptsCollection.insertOne(newPromt);
      res.send(result)
    })
    app.patch('/api/prompts/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: req.body
      }
      const result = await promptsCollection.updateOne(filter, updateDoc);
      res.send(result);
    })
    app.delete('/api/prompts/:id', async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await promptsCollection.deleteOne(query);
      res.send(result);
    });


    /* ---------Plans--------- */

    app.get('/api/plans', async (req, res) => {
      const query = {}
      if (req.query.plan_id) {
        query.id = req.query.plan_id;
      }
      const result = await plansCollection.findOne(query);
      res.send(result || {});
    })


    app.get('/api/subscriptions', async (req, res) => {
      const result = await subscriptionCollection.aggregate([
        {
          $lookup: {
            from: 'user',            // target collection to join
            localField: 'email',     // field in subscriptionCollection
            foreignField: 'email',   // field in user collection
            as: 'userInfo'           // result array field
          }
        },
        {
          $unwind: {
            path: '$userInfo',
            preserveNullAndEmptyArrays: true // keeps subscription if user isn't found
          }
        }
      ]).toArray();

      res.send(result || []);
    });


    app.post('/api/subscriptions', async (req, res) => {
      const data = req.body;
      const subsInfo = {
        ...data,
        createdAt: new Date()
      }
      const result = await subscriptionCollection.insertOne(subsInfo);

      //update user plan information
      const filter = { email: data.email };
      const updateDocument = {
        $set: {
          plan: data.planId,
        },
      };
      const updateResult = await usersCollection.updateOne(filter, updateDocument);
      res.send(updateResult);
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