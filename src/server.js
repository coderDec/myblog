import express from 'express';
import bodyParser from 'body-parser';
import MongoClient from 'mongodb';
import path from 'path';


const app = express();
app.use(express.static(path.join(__dirname,'/build')));
app.use (bodyParser.json());
const withDB  = async (operations, res) => {
    try{
        const client = await MongoClient.connect('mongodb://localhost:27017',{useNewUrlParser :true, useUnifiedTopology: true });
        const db = client.db('my-blog');
        await operations(db);
        client.close();
    } catch {
        res.status(500).json({message:'Error connecting to db', error});
    }
}

app.get('/hello', (req, res) => res.send("Hello !"));
app.get('/hello/:name', (req,res) => res.send(`Hello ${req.params.name}`))
app.get('/api/articles/:name', async (req,res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
        const articlesInfo = await db.collection('articles').findOne({name:articleName});
        res.status(200).json(articlesInfo);
    }, res) 
})
app.post('/api/articles/:name/upvote', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name; 
        const articlesInfo = await db.collection('articles').findOne({name:articleName});
        await db.collection('articles').updateOne({name:articleName}, 
            {'$set': {
                "upvotes": articlesInfo.upvotes+1}

        })
        const updatedArticleInfo = await db.collection('articles').findOne({name:articleName});
        res.status(200).json(updatedArticleInfo);
    }, res) 
})

app.post('/api/articles/:name/addcomment', (req, res) => {
    withDB(async (db) => {
        const {username,text} = req.body;
        const articleName = req.params.name;
        const articlesInfo = await db.collection('articles').findOne({name:articleName});
        await db.collection('articles').updateOne({name:articleName}, 
            {'$set': {
                "comments": articlesInfo.comments.concat({username,text})}

        })
        const updatedArticleInfo = await db.collection('articles').findOne({name:articleName});
        res.status(200).json(updatedArticleInfo);
    }, res) 
})
app.post('/hello', (req, res) => res.send(`Hello ${req.body.name}!`));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
});
app.listen(8000, () => console.log('Listeining on Port 8000'));