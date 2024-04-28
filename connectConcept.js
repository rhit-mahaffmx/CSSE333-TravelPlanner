const Connection = require('tedious').Connection;  
const Request = require('tedious').Request;  
const express = require('express');
const { TYPES } = require('tedious');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));
app.get('/', (req, res) => {
res.sendFile(__dirname + '/Login.html')
})

let config = {  
    server: 'golem.csse.rose-hulman.edu',
    authentication: {
        type: 'default',
        options: {
            userName: 'whelanzm',
            password: 'Stx09067man26'
        }
    },
    options: {
        encrypt: true,
        database: 'TravelPlanner_S2G5'
    }
};  
let connection = new Connection(config);  
connection.on('connect', function(err) {
    // If no error, then good to proceed.
    console.log("Connected");  
});

app.get("/Con", (req, res)=>{
    connection.connect();
    res.send({val:"Connected"})
})
app.get("/DisCon", (req, res)=>{
    connection.close();
    res.send({val:"Disconnected"})
    process.exit(0);
})

app.post("/CreateProf", (req, res)=>{
    console.log("test")
    let username = req.body.username;
    let password = req.body.password;
    let pref = null;
    let request = new Request("CreateUserProfile", (err)=>{
        if(err){
            console.log("Failed to register");
            console.log(err);
        }

    })
     request.addParameter("userName", TYPES.VarChar, username);
     request.addParameter("Password", TYPES.VarChar, password);
    request.on("requestCompleted", (req)=>{
        console.log("Success");
        res.send({val:0});
    })

    connection.callProcedure(request);
})

app.listen(3001, ()=>{
    console.log("Port Open")
})