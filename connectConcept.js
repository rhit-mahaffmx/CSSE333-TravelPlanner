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
app.post("/createReview", (req, res) => {
    const  Text  = req.body.Text;
    const  Rating  = req.body.Rating;
    const  Destination  = req.body.Destination;
    if (!Rating) {
      
        return res.status(400).send({ message: "Invalid input: Rating is required." });
    }
    if (!Destination) {
      
        return res.status(400).send({ message: "Invalid input: Destination is required." });
    }
    if (!Text) {
      
        return res.status(400).send({ message: "Invalid input: Review cannot be empty." });
    }
      
  const userID = req.session.userID;
  console.log("userID:", userID);
      const request = new Request("CreateReview", (err) => {
          if (err) {
              console.error("Failed to execute procedure: ", err);
              res.status(500).send({ message: "Failed to create review" });
              return;
          }
      });
      request.addParameter('UserID', TYPES.Int, userID);
      request.addParameter('DestinationID', TYPES.VarChar, Destination);
      request.addParameter('StarRating', TYPES.Int, Rating);
      request.addParameter('ReviewText', TYPES.VarChar, Text);

      request.on("requestCompleted", () => {
          console.log("Review created successfully");
          console.log("userID:", userID);
          //res.send({ message: "Review created successfully" });
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
        //res.status(500).send({ message: "Expense Created" });
        res.send({ message: "Expense created successfully." });
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

app.post('/getUserName', (req, res) => {
    console.log(req.session.userName);
    res.send({Username: req.session.userName});
});
app.get('/budgets', (req, res) => {
    const userID = req.session.userID; 

    if (!userID) {
        return res.status(401).send('User not authenticated');
    }

    const request = new Request('GetBudgets', (err, rowCount, rows) => {
        if (err) {
            console.error('Error fetching budgets:', err);
            return res.status(500).send('Failed to retrieve budgets');
        }
        //console.log('defined rows:', rows);
       return rows;
    });

    request.addParameter('UserID', TYPES.Int, userID);
    request.addOutputParameter('BudgetName', TYPES.VarChar);
    request.on('returnValue', (parameterName, value, metadata) => {

        res.json(JSON.parse(value));
    });
    connection.callProcedure(request);
});

app.post('/updateEntryText', (req, res) => {
    const { EntryID, NewText } = req.body;
    const request = new Request('UpdateEntryText', (err) => {
        if (err) {
            console.error('Error updating entry text:', err);
            return res.status(500).json({ message: 'Failed to update entry text' });
        }
        res.json({ message: 'Entry text updated successfully' });
    });
    request.addParameter('EntryID', TYPES.Int, EntryID);
    request.addParameter('NewText', TYPES.NVarChar, NewText);
    connection.callProcedure(request);
});

app.post('/getBudgetInfo', (req, res) => {
    const budgetID = parseInt(req.body.BudgetID, 10);
    const request = new Request('GetBudgetInfo', (err, rowCount, rows) => {
        if (err) {
            console.error('Error fetching name:', err);
            return res.status(500).send('Failed to retrieve name');
        }
        return rows;
    });

   
    request.addParameter('BudgetID', TYPES.Int, budgetID);

    request.on('row', function(data) {
        //console.log(data[0].value)
        res.send({Name: data[0].value, RemainingBudget: data[1].value});
    });
    connection.callProcedure(request);
});

app.post('/getExpenses', (req, res) => {
    const budgetID = parseInt(req.body.BudgetID, 10);
    const request = new Request('GetBudgetWithExpenses', (err) => {
        if (err) {
            console.error('SQL error:', err);
            return res.status(500).send('Failed to execute procedure');
        }
    });

    request.addParameter('BudgetID', TYPES.Int, budgetID);
    request.addOutputParameter('ResultJSON', TYPES.NVarChar, {length: 'MAX'}, '');

    connection.callProcedure(request, (err) => {
        if (err) {
            console.error('Error calling procedure:', err);
            return res.status(500).send('Error processing request');
        }
        const resultJson = request.parameters.ResultJSON.value;
        try {
            const resultData = JSON.parse(resultJson);
            res.send({ Data: resultData });
        } catch (jsonErr) {
            console.error('Error parsing JSON:', jsonErr);
            res.status(500).send('Error parsing JSON data');
        }
    });
});

app.post('/updateBudgetName', (req, res) => {
    const { budgetID, budgetName } = req.body;
    const request = new Request('UpdateBudgetName', (err) => {
        if (err) {
            console.error('Error updating budget name:', err);
            return res.status(500).json({ message: 'Failed to update budget name' });
        }
        res.json({ message: 'Budget name updated successfully' });
    });

    request.addParameter('BudgetID', TYPES.Int, budgetID);
    request.addParameter('BudgetName', TYPES.NVarChar, budgetName);

    connection.callProcedure(request);
});

app.get('/getUsername', (req, res) => {
    const username = req.session.username;
    if (username) {
        res.json({ username });
    } else {
        res.status(404).json({ message: 'Username not found in session' });
    }
});

app.post('/getReviews', (req, res) => {
    const UserID  = req.session.userID;
    const request = new Request('GetReviews', (err) => {
        if (err) {
            console.error('Error fetching reviews:', err);
            return res.status(500).json({ message: 'Failed to retrieve reviews' });
        }
    });

    request.addParameter('UserID', TYPES.Int, UserID);
    request.addOutputParameter('ReviewText', TYPES.NVarChar, );

    request.on('returnValue', (parameterName, value, metadata) => {
        if (parameterName === 'ReviewText') {
           
            const reviews = JSON.parse(value);
            res.json(reviews);
         
            
        }
    });

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
    const { destinationID, itinerary, localEmergencyContacts, travelPlanName } = req.body;
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
    request.addParameter('travelPlanName', TYPES.VarChar, travelPlanName);

    connection.callProcedure(request);
});

app.get('/plan/:planID', (req, res) => {
    const planID = parseInt(req.params.planID, 10);

    const request = new Request('GetTravelPlan', (err) => {
        if (err) {
            console.error('Error fetching plan:', err);
            return res.status(500).json({ message: 'Failed to retrieve plan' });
        }
       if (request.parameters && request.parameters.Plan) {
            const planJson = request.parameters.Plan.value;
            try {
                const plan = JSON.parse(planJson);
                res.json(plan);
            } catch (parseErr) {
                console.error('Error parsing plan JSON:', parseErr);
                res.status(500).json({ message: 'Failed to parse plan' });
            }
        } else {
            console.error('Plan parameter is undefined:', request.parameters);
            res.status(500).json({ message: 'Failed to retrieve plan' });
        }
    });
    console.log('planID:', planID);
    request.addParameter('PlanID', TYPES.Int, planID);
    request.addOutputParameter('Plan', TYPES.VarChar, { length: 'MAX' }); 
    request.on('returnValue', (parameterName, value) => {
        console.log(`Plan received from SQL: ${value}`); 
        try {
            const parsedValue = JSON.parse(value);
            res.json(parsedValue);
        } catch (error) {
            console.error('Failed to parse JSON:', error);
            res.status(500).json({ message: 'Failed to parse JSON' });
        }
    });
    
    
    connection.callProcedure(request);
});




app.get('/plans', (req, res) => {
    const userID = req.session.userID; 

    if (!userID) {
        return res.status(401).send('User not authenticated');
    }

    const request = new Request('GetTravelPlans', (err, rowCount, rows) => {
        if (err) {
            console.error('Error fetching Travel Plans:', err);
            return res.status(500).send('Failed to retrieve Plans');
        }

       return rows;
    });

    request.addParameter('UserID', TYPES.Int, userID);
    request.addOutputParameter('TravelPlanName', TYPES.VarChar);
    request.on('returnValue', (parameterName, value, metadata) => {
        
        res.json(JSON.parse(value));
    });
    connection.callProcedure(request);
});

app.post('/destinations', (req, res) => {
  
    const request = new Request('GetDestinations', (err, rowCount, rows) => {
        if (err) {
            console.error('Error fetching destinations:', err);
            return res.status(500).send('Failed to retrieve destinations');
        }
        console.log('destinations api called');
       return rows;
    });
 
   
 
    request.on('returnValue', (parameterName, value, metadata) => {
        console.log(value);
        res.json(JSON.parse(value));
    });
    request.addOutputParameter('DestinationName', TYPES.VarChar);
    connection.callProcedure(request);
});

app.post('/deleteBudget', (req, res) => {
    const { budgetID } = req.body;
    const request = new Request('DeleteBudget', (err) => {
        if (err) {
            console.error('Error deleting budget:', err);
            return res.status(500).send('Failed to delete budget');
        }
        res.json('Budget deleted successfully');
    });
    request.addParameter('BudgetID', TYPES.Int, budgetID);
    connection.callProcedure(request);
});

app.post('/deleteJournal', (req, res) => {
    console.log('delete journal');
    console.log(req.body);  
    const { journalID } = req.body;
    console.log('Received journalId for deletion:', journalID);
    const request = new Request('DeleteJournal', (err) => {
        if (err) {
            console.error('Error deleting journal:', err);
            return res.status(500).send('Failed to delete journal');
        }
        console.log('Journal deleted successfully');
        const journalData = { journal: "Journal deleted successfully" };
        res.json(journalData); 
       
        
    });
    request.addParameter('JournalID', TYPES.Int, journalID);
    connection.callProcedure(request);
});

app.post('/deleteTravelPlan', (req, res) => {
    console.log('Attempt to delete travel plan');
    const { PlanID } = req.body;
    console.log('Received travelPlanID for deletion:', PlanID);
    const request = new Request('DeleteTravelPlan', (err) => {
        if (err) {
            console.error('Error deleting travel plan:', err);
            return res.status(500).json({ message: 'Failed to delete travel plan' });
        }
        console.log('Travel plan deleted successfully');
        res.json({ message: 'Travel plan deleted successfully' });
    });

    request.addParameter('TravelPlanID', TYPES.Int, PlanID);
    connection.callProcedure(request);
});

app.post('/deleteEntry', (req, res) => {
    const { EntryID } = req.body;
    if (!EntryID) {
        res.status(400).json({ message: 'Entry ID is required' });
        return;
    }

    const request = new Request('DeleteWrittenEntry', (err) => {
        if (err) {
            console.error('Error when calling stored procedure:', err);
            res.status(500).json({ message: 'Failed to delete entry' });
            return;
        }
        res.json({ message: 'Entry deleted successfully!' });
    });

    request.addParameter('EntryID', TYPES.Int, EntryID);

    connection.callProcedure(request);
});

app.listen(3001, ()=>{
    console.log("Port Open")
});