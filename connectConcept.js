const Connection = require('tedious').Connection;
const Request = require('tedious').Request;  
const express = require('express');
const { TYPES } = require('tedious');
const { Salt, Hash } = require('./UserService');
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
        encrypt: false,
        database: 'TravelPlanner_S2G5'
    }
};  
let connection = new Connection(config);  
connection.on('connect', function(err) {
    // If no error, then good to proceed.
    if(err) {
        console.log('Error: ', err)
    } 
    console.log("Connected");  
});

app.get("/Con", (req, res)=>{
    connection.connect();
    //res.send({val:"Connected"})
})
app.get("/DisCon", (req, res)=>{
    connection.close();
    //res.send({val:"Disconnected"})
    process.exit(0);
})

app.post("/CreateProf", (req, res)=>{
    let username = req.body.username;
    let password = req.body.password;
    let pref = null;
    let request = new Request("CreateUserProfile", (err)=>{
        if(err){
            console.log("Failed to register");
            console.log(err);
        }
    })
    let salt = Salt();
    let string = password + salt;
    let hash = Hash(string);
    request.addParameter("userName", TYPES.VarChar, username);
    request.addParameter("PasswordSalt", TYPES.VarChar, salt);
    request.addParameter("PasswordHash", TYPES.VarChar, hash);
    request.on("requestCompleted", (req)=>{
        console.log("Success");
        //res.send({val:0});
    })

    connection.callProcedure(request);
})
app.post("/Login", (req, res)=>{
    let username = req.body.username;
    let password = req.body.password;
    let pref = null;
    let request1 = new Request("GetPasswordInfo", (err)=>{
        if(err){
            console.log("Failed to Login");
            console.log(err);
        }
    })
    request1.addParameter("userName", TYPES.VarChar, username);
    request1.addOutputParameter('PasswordSalt', TYPES.VarChar);
    request1.addOutputParameter('PasswordHash', TYPES.VarChar);
    connection.callProcedure(request1);
    let salt = null;
    let hash = null;
    request1.on('returnValue', function(parameterName, value, metadata) {
        console.log(parameterName + ' = ' + value);
        if(parameterName == 'PasswordSalt'){
            salt = value;
        }else{
            hash = value;
        }
        let string = password + salt;
        let loginHash = Hash(string);
        let returnVal = null;
        if(parameterName == 'PasswordHash'){
        if(loginHash = hash){
            console.log("Login Success");
            returnVal = 0;
        }else{
            console.log("Login Fail");
            returnVal = 1;
        }
        res.send({val:returnVal});
        }
    });
    function getUserID(userName, callback) {
        const request = new Request("GetUserID", (err) => {
            if (err) {
                console.error("Failed to execute procedure: ", err);
                callback(err);
                return;
            }
        });
    
        request.addParameter('userName', TYPES.VarChar, userName);
        let userID = null;
        request.on("row", (columns) => {
            userID = columns[0].value;
        });
    
        request.on("requestCompleted", () => {
            callback(null, userID);
        });
    
        connection.callProcedure(request);
    }

    app.post("/CreateJournal", (req, res) => {
        const { userName, Name } = req.body;
        getUserID(userName, (err, userID) => {
            if (err) {
                res.status(500).send("Error retrieving user ID");
                return;
            }
            const request = new Request("CreateJournal", (err) => {
                if (err) {
                    console.error("Failed to execute procedure: ", err);
                    res.status(500).send({ message: "Failed to create journal" });
                    return;
                }
            });
    
            request.addParameter('userID', TYPES.Int, userID);
            request.addParameter('userName', TYPES.VarChar, userName);
            request.addParameter('Name', TYPES.VarChar,Name);
    
            request.on("requestCompleted", () => {
                console.log("Journal created successfully");
                res.send({ message: "Journal created successfully" });
            });
    
            connection.callProcedure(request);
        });
    });
    
    app.post('/createBudget', (req, res) => {
        const { budgetId, spendingLimit, userId } = req.body;
    
        const request = new Request('CreateBudget', (err) => {
            if (err) {
                console.error('Database request error:', err);
                res.status(500).send('Failed to create budget entry');
                return;
            }
            res.send('Budget entry created successfully');
        });
    
        request.addParameter('budgetId', TYPES.Int, budgetId);
        request.addParameter('spendingLimit', TYPES.VarChar, spendingLimit);

        request.addParameter('UserID', TYPES.Int, userId);
    
        connection.callProcedure(request);
    });

    request1.on("requestCompleted", (req)=>{
        console.log("Success");
        //res.send({val:0});
    })

    
})

app.listen(3001, ()=>{
    console.log("Port Open")
})