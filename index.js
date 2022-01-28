const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require("mongodb").ObjectId;
require('dotenv').config();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aneek.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        console.log("endgame connected");
        const database = client.db('endgame');
        const blogsCollection = database.collection('blogs');
        const usersCollection = database.collection('users');

        //GET blogs
        app.get('/blogs', async (req, res) => {
            console.log(req.query);
            const cursor = blogsCollection.find({});
            const page = req.query.page;
            const size = parseInt(req.query.size);
            const status = req.params.status;
            const query = { status: status };
            const currentStatus = await blogsCollection.findOne(query);
            let isStatus = false;
            if (currentStatus?.status === 'approved') {
                isStatus = true;
            }
            let blogs;
            // const blogs = await cursor.toArray();
            const count = await cursor.count();
            //console.log(count);
            if (page && (isStatus = true)) {
                blogs = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                if (isStatus = true) { blogs = await cursor.toArray(); }
            }

            res.send({ count, blogs, approved: isStatus });
        })

        //GET USER
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        // GET Single Blog
        app.get('/blogs/:id', async (req, res) => {
            const id = req.params.id;
            console.log('blog', id);
            const query = { _id: ObjectId(id) };
            const blog = await blogsCollection.findOne(query);
            res.json(blog);
        })

        // add Experience
        app.post("/addExperience", async (req, res) => {
            const addExperience = req.body;
            console.log(addExperience);
            const result = await blogsCollection.insertOne(addExperience);
            console.log(result);
            res.json(result);
        });



        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            // console.log(result);
            res.json(result);
        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        // Delete Blogs by Admin
        app.delete("/deleteBlogs/:id", async (req, res) => {
            // console.log(req.params.id);
            const result = await blogsCollection.deleteOne({
                _id: ObjectId(req.params.id),
            });
            res.json(result);
        });

        //UPDATE API
        app.put("/updateStatus/:id", async (req, res) => {
            const id = req.params.id;
            console.log("updated", id);
            // console.log(req);
            const updatedStatus = req.body;
            // console.log(updatedStatus);

            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: updatedStatus.status
                },
            };
            const result = await blogsCollection.updateOne(filter, updateDoc, options);
            // console.log('updated', id, req);
            res.json(result);

        })

        // Admin Set
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            // console.log(user);
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);

        })


    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Endgame server is running');
});

app.listen(port, () => {
    console.log('Endgame Server running at port', port);
})