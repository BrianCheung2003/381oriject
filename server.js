var express             = require('express'),
    mongoose            = require('mongoose'),
    app                 = express(),
    passport            = require('passport'),
    localStrategy       = require('passport-local'),
    Mongooselocal       = require('passport-local-mongoose'),
    User                = require('./models/User'),
    session             = require('express-session'),
    formidable          = require('express-formidable'),
    fsPromises          = require('fs').promises,
    { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.set('view engine', 'ejs');
app.use(express.json());

/*MongoDB setting*/

mongoose.connect("mongodb+srv://s1382709:123456MonGo@lab.mc9gg.mongodb.net/?retryWrites=true&w=majority&appName=LAB");

const mongourl = 'mongodb+srv://s1382709:123456MonGo@lab.mc9gg.mongodb.net/?retryWrites=true&w=majority&appName=LAB';
const dbName = 'Lab3';
const collectionName = 'bookings';
const client = new MongoClient(mongourl, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const insertDocument = async (db, doc) => {
    var collection = db.collection(collectionName);
    let results = await collection.insertOne(doc);
    console.log("insert one document:" + JSON.stringify(results));
    return results;
}
const findDocument = async (db, criteria) => {
    var collection = db.collection(collectionName);
    let results = await collection.find(criteria).toArray();
    console.log("find the document:" + JSON.stringify(results));
    return results;
}
const updateDocument = async (db, criteria, updateData) => {
    var collection = db.collection(collectionName);
    let results = await collection.updateOne(criteria, {$set: updateData});
    console.log("update one document:" + JSON.stringify(results));
    return results;
}
  const deleteDocument = async (db, criteria) => {
    var collection = db.collection(collectionName);
    let results = await collection.deleteMany(criteria);
    console.log("delete one document:" + JSON.stringify(results));
    return results;
}

const handle_Find = async (req, res, criteria) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    const docs = await findDocument(db);
    res.status(200).render('list',{nBookings: docs.length, bookings: docs, user: req.user});
}
/*End of MongoDB settings*/

/*CURD handling function*/
const handle_Create = async (req, res) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    let newDoc = {
        bookingid: req.fields.bookingid,
        mobile: req.fields.mobile,
        location: req.fields.location
    };
    if (req.files.filetoupload && req.files.filetoupload.size > 0) {
        const data = await fsPromises.readFile(req.files.filetoupload.path);
        newDoc.photo = Buffer.from(data).toString('base64');
    }
    await insertDocument(db, newDoc);
    res.redirect('/');
}

const handle_Details = async (req, res, criteria) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    let DOCID = { _id: ObjectId.createFromHexString(criteria._id) };
    const docs = await findDocument(db, DOCID);
    res.status(200).render('details', { booking: docs[0]});
}

const handle_Edit = async (req, res, criteria) => {
    await client.connect();
    console.log("Connected successfully to server");
	const db = client.db(dbName);
    let DOCID = { _id: ObjectId.createFromHexString(criteria._id)};
	const docs = await findDocument(db, DOCID);
    if (docs.length > 0){
        res.status(200).render('edit', {booking: docs[0]});
    } else {
        res.status(500).render('info', {message: 'Unable to edit!'});
    }
}

const handle_Update = async (req, res, criteria) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    let DOCID = { _id: ObjectId.createFromHexString(req.fields._id)};
    let updateDoc = {
        bookingid: req.fields.bookingid,
        mobile: req.fields.mobile,
        location: req.fields.location
    };
    if (req.files.filetoupload && req.files.filetoupload.size > 0){
        const data = await fsPromises.readFile(req.files.filetoupload.path);
        updateDoc.photo = Buffer.from(data).toString('base64');
    }
    const docs = await updateDocument(db, DOCID, updateDoc);
    if (docs.length > 0) {
        res.status(200).render('info', {message: `Updated ${results.modifiedCount} document(s)`});
    } else {
        res.status(500).render('info', {message: 'Unable to update!'});
    }
}

const handle_Delete = async (req, res) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    let DOCID = { _id: ObjectId.createFromHexString(req.query._id)};
    let docs = await findDocument(db, DOCID);
    if (docs.length > 0) {
        await deleteDocument(db, DOCID);
    }
    if (docs.length > 0) {
        res.status(200).render('info', {message: `Booking ID ${docs[0].bookingid} removed.`});
    } else {
        res.status(500).render('info', {message: 'Unable to delete!'}); 
    }
}
/*End of CURD handling function*/

/*passport setting*/
/*End of Passport settings*/

/*APP setting*/
app.use(formidable());

app.use((req,res,next) => {
    let d = new Date();
    console.log(`TRACE: ${req.path} was requested at ${d.toLocaleDateString()}`);  
    next();
});

app.get('/', (req,res) => {
    res.redirect('/list');
})

app.get("/list", function (req, res) {
    handle_Find(req, res, req.query.docs);
});

app.get('/create', (req,res) => {
    res.status(200).render('create',{user: req.user});
});

app.post('/create', (req,res) => {
    handle_Create(req, res);
});

app.get('/details', (req,res) => {
    handle_Details(req, res, req.query);
});

app.get('/edit', (req,res) => {
    handle_Edit(req, res, req.query);
});

app.post('/update', (req,res) => {
    handle_Update(req, res, req.query);
});

app.get('/delete', (req,res) => {
    handle_Delete(req, res);
});

app.post('/api/booking/:bookingid', async (req,res) => {
    if (req.params.bookingid) {
        console.log(req.body)
		await client.connect();
		console.log("Connected successfully to server");
	    const db = client.db(dbName);
	    let newDoc = {
	        bookingid: req.fields.bookingid,
	        mobile: req.fields.mobile,
	        location: req.fields.location};
	    if (req.files.filetoupload && req.files.filetoupload.size > 0) {
	        const data = await fsPromises.readFile(req.files.filetoupload.path);
	        newDoc.photo = Buffer.from(data).toString('base64');}
		await insertDocument(db, newDoc);
	    res.status(200).json({"Successfully inserted":newDoc}).end();
    } else {
        res.status(500).json({"error": "missing bookingid"});
    }
})

app.get('/api/booking/:bookingid', async (req,res) => {
	if (req.params.bookingid) {
		console.log(req.body)
        let criteria = {};
        criteria['bookingid'] = req.params.bookingid;
		await client.connect();
	    console.log("Connected successfully to server");
		const db = client.db(dbName);
		const docs = await findDocument(db, criteria);
	    res.status(200).json(docs);
	} else {
        res.status(500).json({"error": "missing bookingid"}).end();
    }
});

app.put('/api/booking/:bookingid', async (req,res) => {
    if (req.params.bookingid) {
        console.log(req.body)
		let criteria = {};
        criteria['bookingid'] = req.params.bookingid;
			await client.connect();
			console.log("Connected successfully to server");
		    const db = client.db(dbName);
		    let updateData = {
		        bookingid: req.fields.bookingid || req.params.bookingid,
		        mobile: req.fields.mobile,
		        location: req.fields.location,
		    };
		    if (req.files.filetoupload && req.files.filetoupload.size > 0) {
		        const data = await fsPromises.readFile(req.files.filetoupload.path);
		        updateData.photo = Buffer.from(data).toString('base64');
		    }
		    const results = await updateDocument(db, criteria, updateData);
		    res.status(200).json(results).end();
    } else {
        res.status(500).json({"error": "missing bookingid"});
    }
})

app.delete('/api/booking/:bookingid', async (req,res) => {
    if (req.params.bookingid) {
		console.log(req.body)
		let criteria = {};
        criteria['bookingid'] = req.params.bookingid;
		await client.connect();
		console.log("Connected successfully to server");
	    const db = client.db(dbName);
	    const results = await deleteDocument(db, criteria);
        console.log(results)
	    res.status(200).json(results).end();
    } else {
        res.status(500).json({"error": "missing bookingid"});       
    }
})

app.get('/*', (req,res) => {
    res.status(404).render('info', {message: `${req.path} - Unknown request!` });
})

const port = process.env.PORT || 8099;
app.listen(port, () => {console.log(`Listening at http://localhost:${port}`);});
