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

let session = require('express-session');
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: 'auto' }
    
}));
app.get("/Session", (req, res) => {
    if(req.session.userID && req.session.userName) {
      res.send(`Welcome, ${req.session.userName}`);
    } else {
      res.status(401).send("Not logged in");
    }
  });
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
      if(err) {
        return console.log(err);
      }
      res.redirect('/');
    });
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
    let request2 = new Request("GetUserID", (err)=>{
        if(err){
            console.log("Failed to get userID");
            console.log(err);
        }
    })
    request1.addParameter("userName", TYPES.VarChar, username);
    request1.addOutputParameter('PasswordSalt', TYPES.VarChar);
    request1.addOutputParameter('PasswordHash', TYPES.VarChar);
    request1.addOutputParameter('UserID', TYPES.Int);

    connection.callProcedure(request1);
    
    let salt = null;
    let hash = null;
    let userID = null;

    request1.on('returnValue', function(parameterName, value, metadata) {
        if(parameterName == 'PasswordSalt'){
            salt = value;
        }else if (parameterName == 'PasswordHash'){
            hash = value;
        }else
        if(parameterName == 'UserID'){
            userID = value;
            
        }
        let string = password + salt;
        let loginHash = Hash(string);
        let returnVal = null;
         req.session.userID = userID;
         req.session.userName = username;
        if(parameterName == 'PasswordHash'){
        if(loginHash == hash){
            console.log("Login Success");
            returnVal = 0;
        }else{
            console.log("Login Fail");
            returnVal = 1;
        }
        res.send({val:returnVal});
        }
    });
    
    
    request1.on("requestCompleted", ()=>{
        //console.log("Login Success");
        req.session.userID = userID;
        req.session.save();
        //res.send({val:0});
    })
    
    
})
app.post("/Journal", (req, res) => {
      const  Name  = req.body.Name;
      if (!Name) {
        
          return res.status(400).send({ message: "Invalid input: Name is required." });
        }
        
    const userID = req.session.userID;
    console.log("userID:", userID);
    console.log(req.body);
    const userName = req.session.userName;
        const request = new Request("CreateJournal", (err) => {
            if (err) {
                console.error("Failed to execute procedure: ", err);
                res.status(500).send({ message: "Failed to create journal" });
                return;
            }
        });
        request.addParameter('userID', TYPES.Int, userID);
        request.addParameter('userName', TYPES.VarChar, userName);
        request.addParameter('Name', TYPES.VarChar, Name);

        request.on("requestCompleted", () => {
            console.log("Journal created successfully");
            console.log("userID:", userID);
            res.send({ message: "Journal created successfully" });
        });

        connection.callProcedure(request);
    ;
});
app.post("/CreateBudget", (req, res) => {
    const  Name  = req.body.Name;
    const spendingLimit = req.body.spendingLimit;
    userID = req.session.userID;
    console.log("userID:", userID);
    console.log(req.body);
    const request = new Request("CreateBudget", (err) => {
        if (err) {
            console.error("Failed to execute procedure: ", err);
            res.status(500).send({ message: "Failed to create budget" });
            return;
        }
    });
    request.addParameter('userID', TYPES.Int, userID);
    request.addParameter('spendingLimit', TYPES.Float, spendingLimit);
    request.addParameter('budgetName', TYPES.VarChar, Name);

    request.on("requestCompleted", () => {
        if (res.headersSent) return;
        console.log("Budget created successfully");
        console.log("userID:", userID);
        res.send({ message: "Budget created successfully" });
    });

    connection.callProcedure(request);
});
app.post("/CreateExpense", (req, res) => {
    const { currency, category, cost, budgetName } = req.body;
    const userID = req.session.userID;
  

    if (!userID) {
      return res.status(401).send({ message: "User is not logged in." });
    }
  
    if (!currency || !category || !cost || !budgetName) {
      return res.status(400).send({ message: "Missing required input." });
    }
   const searchBudgetID = (budgetName, callback) => {
      let budgetID = null;
  
      const request = new Request("Search_Budget", (err) => {
        if (err) {
          console.error("Failed to search for budget: ", err);
          return callback(err, null);
        }
      });
  
      request.addParameter('BudgetID', TYPES.Int, null);
      request.addParameter('SpendingLimit', TYPES.Decimal, null);
      request.addParameter('UserID', TYPES.Int, userID);
      request.addParameter('Above_Below', TYPES.Binary, null); 
      
      request.on('row', (columns) => {
        columns.forEach((column) => {
          if (column.metadata.colName === 'BudgetID') {
            budgetID = column.value;
          }
        });
      });
  
      request.on("requestCompleted", () => {
        return callback(null, budgetID);
      });
  
      connection.callProcedure(request);
    };
  

    searchBudgetID(budgetName, (err, foundBudgetID) => {
      if (err) {
        return res.status(500).send({ message: "Error searching for budget." });
      }
      if (!foundBudgetID) {
        return res.status(404).send({ message: "Budget not found." });
      }
  

      const request = new Request("CreateExpense", (err) => {
        if (err) {
          console.error("Failed to create expense: ", err);
          return res.status(500).send({ message: "Failed to create expense." });
        }
      });
  
      request.addParameter('currency', TYPES.VarChar, currency);
      request.addParameter('category', TYPES.VarChar, category);
      request.addParameter('cost', TYPES.Decimal, cost);
      request.addParameter('userID', TYPES.Int, userID);
      request.addParameter('budgetID', TYPES.Int, foundBudgetID);
  
      request.on("requestCompleted", () => {
        console.log("Expense created successfully for Budget ID: ", foundBudgetID);
        //res.send({ message: "Expense created successfully." });
      });
  
      connection.callProcedure(request);
    });
  });
app.post('/journals', (req, res) => {
    
    const userID  = req.session.userID;
    const request = new Request('GetJournals', (err, rowCount, rows) => {
        if (err) {
            console.error('Error fetching journals:', err);
            return res.status(500).send('Failed to retrieve journals');
        }
        console.log('journals api called');
       return rows;
    });

   
    request.addParameter('UserID', TYPES.Int, userID);
    request.addOutputParameter('JournalName', TYPES.VarChar);

    request.on('returnValue', (parameterName, value, metadata) => {

        res.json(JSON.parse(value));
    });
    connection.callProcedure(request);
    
});
app.get('/budgets', (req, res) => {
    const userID = req.session.userID; // Assuming userID is stored in session

    if (!userID) {
        return res.status(401).send('User not authenticated');
    }

    const request = new Request('GetBudgets', (err, rowCount, rows) => {
        if (err) {
            console.error('Error fetching budgets:', err);
            return res.status(500).send('Failed to retrieve budgets');
        }

        const budgets = rows.map(row => ({
            BudgetID: row.BudgetID.value,
            Name: row.Name.value,
            SpendingLimit: row.SpendingLimit.value
        }));

        res.json(budgets);
    });

    request.addParameter('UserID', TYPES.Int, userID);
    connection.callProcedure(request);
});


app.post('/getEntries', (req, res) => {
    const journalID = parseInt(req.body.JournalID, 10);
    const request = new Request('GetJournalWithEntries', (err, rowCount, rows) => {
        if (err) {
            console.error('Error fetching journals:', err);
            return res.status(500).send('Failed to retrieve journals');
        }
        console.log('journals api called');
       return rows;
    });

   
    request.addParameter('JournalID', TYPES.Int, journalID);
    request.addOutputParameter('EntryText', TYPES.VarChar);

    request.on('returnValue', (parameterName, value, metadata) => {
        console.log(value);
        res.json(JSON.parse(value));
    });
    connection.callProcedure(request);
    // const journalID = parseInt(req.body.JournalID, 10);
    // console.log(journalID);
    // const request = new Request("SELECT EntryID, EntryText, [DateTime] FROM Written_Entries WHERE JournalID = " + journalID + ";", (err, rowCount, rows) => {
    // //new Request('GetJournalWithEntries', (err, rowCount, rows) => {
    //     if (err) {
    //         console.error('Error fetching journals:', err);
    //         return res.status(500).send('Failed to retrieve journals');
    //     }
    //     console.log('journals api called');       
    // });
    // request.addParameter('JournalID', TYPES.Int, journalID);
    // let rows = [];
    // request.on('row',function(columns){
    //     rows.push({
    //         "id":columns[1].value,
    //         "text":columns[2].value,
    //         "date":columns[3].value
    //     });
    //     console.log("test");
    //     console.log(rows[1].id);
    // });
    // request.on('returnValue', (parameterName, value, metadata) => {
        
    // });
    // const journal = [];
    //     rows.forEach(row => {
    //         const entry = {
    //             entryID: row.EntryID.value,
    //             entryText: row.EntryText.value,
    //             dateTime: row.DateTime.value
    //         };
    //         journal.push(entry);
    //     });
    //     journal.forEach(entry => {
    //         console.log(entry.entryID);
    //     });
    //     res.json(journal);
    //connection.callProcedure(request);
});

app.post('/journalEntry', (req, res) => {
    const { JournalID, EntryText } = req.body;
    console.log(JournalID);
    console.log('journalID');
    const request = new Request('CreateWrittenEntry', (err) => {
        if (err) {
            console.error('Error creating entry:', err);
            return res.status(500).send('Failed to create entry');
        }
        // Sending a response with newly added entry details
        res.json({ journalID: JournalID, entryText: EntryText, dateTime: new Date() });
    });
    request.addParameter('JournalID', TYPES.Int, JournalID);
    request.addParameter('EntryText', TYPES.Text, EntryText);

    connection.callProcedure(request);
});



app.post('/create-travel-plans', (req, res) => {
    const { destinationID, itinerary, localEmergencyContacts } = req.body;
    const userID = req.session.userID; 
    if (!userID || !destinationID) {
        return res.status(400).json({ message: 'UserID and DestinationID are required.' });
    }

    const request = new Request('CreateTravelPlan', (err) => {
        if (err) {
            console.error('Error creating itinerary:', err);
            return res.status(500).json({ message: 'Failed to create itinerary.' });
        }
        res.json({ message: 'Itinerary created successfully!' });
    });

    request.addParameter('UserID', TYPES.Int, userID);
    request.addParameter('DestinationID', TYPES.VarChar, destinationID);
    request.addParameter('Itinerary', TYPES.VarChar, itinerary);
    request.addParameter('LocalEmergencyContacts', TYPES.VarChar, localEmergencyContacts);

    connection.callProcedure(request);
});

app.listen(3001, ()=>{
    console.log("Port Open")
})