const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const cors = require('cors');
require('dotenv').config()
var admin = require("firebase-admin");
const fileUpload = require('express-fileUpload');
const port = process.env.PORT || 5000

// Firebase admin initialization

var serviceAccount = require('./blog-e426a-firebase-adminsdk-itn0w-61cb425648.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

//middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iwf59.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const idToken = req.headers.authorization.split('Bearer ')[1];
        try {
            const decodeUser = await admin.auth().verifyIdToken(idToken);
            console.log('email', decodeUser.email)
        }
        catch {

        }
    }
    next();
}

async function run() {
    try {
        await client.connect();
        const database = client.db('blogDB');
        const blogsCollection = database.collection('blogs');
        const usersCollection=database.collection('users');

        app.post('/blogs', verifyToken, async (req, res) => {
            const blogTitle = req.body.blogTitle;
            const article = req.body.article;
            const pic = req.files.blogImage;
            const picData = pic.data;
            const encodedPic = picData.toString('base64');
            const imageBuffer = Buffer.from(encodedPic, 'base64');
            const blog = {
                blogTitle,
                article,
                blogImage: imageBuffer
            }
            const result = await blogsCollection.insertOne(blog);

            res.json(result);
        })

        app.post('/users', async(req,res)=>{
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        })


    }
    finally {
        // await client(close)
    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send("blog is runnig");
})
app.listen(port, () => {
    console.log('server is running at port', port);
})