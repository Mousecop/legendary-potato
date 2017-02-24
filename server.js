const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');

const app = express();
app.use(bodyParser.json());
const {BlogPost} = require('./models');




app.get('/posts',(req, res) => {
    BlogPost
        .find()
        .limit(14)
        .exec()
        .then(posts => {
            res.json({
                posts: posts.map(post => post.apiRepr())
            });
        })
        .catch(err => {
            console.error(err)
            res.status(500).json({message: 'Internal Server Error'});
        });
});

app.get('/posts/:id', (req, res) => {
  BlogPost
      .findById(req.params.id)
      .exec()
      .then(posts => res.json(posts.apiRepr()))
      .catch(err => {
          console.error(err);
          res.status(500).json({message: 'Internal Service Error'})
      });
});

app.post('/posts/', (req, res) => {
  const requiredFields = ['title', 'author', 'content'];

  for(let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if(!(field in req.body)){
      const message = `Missing ${field}, your post is rejected`;
      console.error(message);
      return res.status(400).send(message);
    }
  }
  BlogPost
    .create({
      title: req.body.title,
      authorName: req.body.author.firstName + ' ' + req.body.author.lastName,
      content: req.body.content
    })
    .then(posts => {
      res.status(201).json(posts.apiRepr())
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'internal server error' + err})
    });
});

app.put('/posts/:id', (req, res) => {
  if(!(req.body.id && req.params.id && req.params.id === req.body.id)) {
    const message = `Request path id ${req.params.id} and request body id ${req.body.id} must match.`;
    console.error(message);
    res.status(400).json({message: message});
  }
  const toUpdate = {};
  const updateableFields = ['title', 'content', 'author'];
  updateableFields.forEach(field => {
    if(field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  BlogPost
    .findByIdAndUpdate(req.params.id, {$set: toUpdate})
    .exec()
    .then(post => {
      res.status(204).end();
    })
    .catch(err => {
      res.status(500).json({message: 'Internal Server Error ' + err});
    })
});
app.delete('/posts/:id', (req, res) => {
  BlogPost
    .findByIdAndRemove(req.params.id)
    .exec()
    .then(post => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal Server Error '+ err}));
});








function runServer(databaseUrl=DATABASE_URL, port=PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
     return new Promise((resolve, reject) => {
       console.log('Closing server');
       server.close(err => {
           if (err) {
               return reject(err);
           }
           resolve();
       });
     });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};
