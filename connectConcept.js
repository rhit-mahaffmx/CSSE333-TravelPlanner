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

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if(err) {
            return res.status(500).send('Failed to logout');
        }
        res.redirect('/');
    });
});


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
            res.send({val:'Login Successful'});
        }else{
            console.log("Login Fail");
            returnVal = 1;
            res.send({val:'Incorrect UserName/Password'});
        }
        
        }
    });
    
    
    request1.on("requestCompleted", ()=>{
        //console.log("Login Success");
        req.session.userID = userID;
        req.session.save();
        //res.send({val:0});
    })
    
    
})

app.post('/deleteUser', (req, res) => {
    const userID = req.session.userID;

    if (!userID) {
        return res.status(401).send('User not authenticated');
    }

    const request = new Request('DeleteUserProfile', (err) => {
        if (err) {
            console.error('Error deleting user profile:', err);
            return res.status(500).json({ message: 'Failed to delete user profile' });
        }
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).json({ message: 'Failed to delete user profile' });
            }
            res.json({ message: 'User deleted successfully' });
        });
    });

    request.addParameter('UserID', TYPES.Int, userID);
    connection.callProcedure(request);
});

app.post("/Journal", (req, res) => {
      const  Name  = req.body.Name;
      if (!Name) {
          return res.status(400).send({ message: "Invalid input: Name is required." });
        }
    const userID = req.session.userID;
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
        request.addOutputParameter('Return', TYPES.Int);

        request.on('returnValue', function (parameterName, value, metadata) { 
            res.send({num: value});
            console.log(value);
        });

        connection.callProcedure(request);
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
      request.addParameter('DestinationName', TYPES.VarChar, Destination);
      request.addParameter('StarRating', TYPES.Int, Rating);
      request.addParameter('ReviewText', TYPES.VarChar, Text);

      request.on("requestCompleted", () => {
          console.log("Review created successfully");
          console.log("userID:", userID);
          res.send({ message: "Review created successfully" });
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
        res.send({ message: "Budget created successfully" });
    });

    connection.callProcedure(request);
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

app.post('/getJournalInfo', (req, res) => {
    const journalID = parseInt(req.body.JournalID, 10);
    const request = new Request('GetJournalInfo', (err, rowCount, rows) => {
        if (err) {
            console.error('Error fetching name:', err);
            return res.status(500).send('Failed to retrieve name');
        }
        return rows;
    });

   
    request.addParameter('JournalID', TYPES.Int, journalID);

    request.on('row', function(data) {
        //console.log(data[0].value)
        res.send({Name: data[0].value});
    });
    connection.callProcedure(request);
});

app.post('/deleteExpense', (req, res) => {
    const expenseID = parseInt(req.body.ExpenseID, 10);

        const request = new Request('DeleteExpense', (err) => {
            if (err) {
                console.error('Request error:', err);
                return res.status(500).send('Failed to execute procedure');
            }
            
            res.json({ message: 'Expense deleted successfully' });
        });

        request.addParameter('ExpenseID', TYPES.Int, expenseID);

        connection.callProcedure(request);
   

 
});

app.post('/createExpense', (req, res) => {
    const UserID = req.session.userID;
    const { budgetID, category, cost, currency } = req.body;
    const request = new Request('CreateExpense', (err) => {
        if (err) {
            console.error('Error creating expense:', err);
            return res.status(500).send('Failed to create expense');
        }
        res.json({ message: 'Expense created successfully' });
    });

    request.addParameter('BudgetID', TYPES.Int, budgetID);
    request.addParameter('Category', TYPES.VarChar, category);
    request.addParameter('Currency', TYPES.VarChar, currency);   
    request.addParameter('Cost', TYPES.Float, cost);
    request.addParameter('UserID', TYPES.Int, UserID);

    connection.callProcedure(request);
});

app.post('/getExpenses', (req, res) => {
    const budgetID = parseInt(req.body.BudgetID, 10);

        const request = new Request('GetBudgetWithExpenses', (err) => {
            if (err) {
                console.error('Request error:', err);
                return res.status(500).send('Failed to execute procedure');
            }
        });

        request.addParameter('BudgetID', TYPES.Int, budgetID);
        request.addOutputParameter('Expense', TYPES.NVarChar);

        request.on('returnValue', (paramName, value) => {
            if (paramName === 'Expense') {
                try {
                    const expenses = JSON.parse(value);
                    res.json({ Expenses: expenses });
                } catch (jsonErr) {
                    console.error('Error parsing JSON:', jsonErr);
                    res.status(500).send('Error parsing JSON data');
                }
            }
        });

        connection.callProcedure(request);
   
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
app.post('/getReviewsWithDestination', (req, res) => {
    const destinationID = parseInt(req.body.DestinationID, 10);
    const request = new Request('GetReviewsWithDestination', (err) => {
        if (err) {
            console.error('Error fetching reviews:', err);
            return res.status(500).json({ message: 'Failed to retrieve reviews' });
        }
    });

    request.addParameter('DestinationID', TYPES.Int, destinationID);
    request.addOutputParameter('ReviewText', TYPES.NVarChar, );

    request.on('returnValue', (parameterName, value, metadata) => {
        if (parameterName === 'ReviewText') {
           console.log(value);
            const reviews = JSON.parse(value);
            res.json(reviews);
         
            
        }
    });

    connection.callProcedure(request);
});

app.post('/plansWithDestinations', (req, res) => {
    const userID = req.session.userID; 
    const destinationID = parseInt(req.body.DestinationID, 10);

    if (!userID) {
        return res.status(401).send('User not authenticated');
    }

    const request = new Request('GetTravelPlansWithDestination', (err, rowCount, rows) => {
        if (err) {
            console.error('Error fetching Travel Plans:', err);
            return res.status(500).send('Failed to retrieve Plans');
        }

      
    });

    request.addParameter('UserID', TYPES.Int, userID);
    request.addParameter('DestinationID', TYPES.Int, destinationID);
    request.addOutputParameter('TravelPlanName', TYPES.VarChar);
    request.on('returnValue', (parameterName, value, metadata) => {
        
        res.json(JSON.parse(value));
    });
    connection.callProcedure(request);
});

app.post('/getDestination', (req, res) => {
    const destinationID = parseInt(req.body.DestinationID, 10);
    const request = new Request('GetDestination', (err) => {
        if (err) {
            console.error('Error fetching destination:', err);
            return res.status(500).json({ message: 'Failed to retrieve destination' });
        }
    });

    request.addParameter('DestinationID', TYPES.Int, destinationID);
    request.addOutputParameter('DestinationText', TYPES.NVarChar, );

    request.on('returnValue', (parameterName, value, metadata) => {
        console.log(value);
        const destination = JSON.parse(value);
        res.json(destination);
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
       return 
    });
    console.log('planID:', planID);
    request.addParameter('PlanID', TYPES.Int, planID);
    request.addOutputParameter('Plan', TYPES.NVarChar); 
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


app.post('/editTravelPlan', (req, res) => {
    const { PlanID, TravelPlanName, Itinerary } = req.body;
    
        
            const request = new Request('EditTravelPlan', (err) => {
                if (err) {
                    console.error('Request error:', err);
                    res.status(500).json('Error executing the request');
                } else {
                    res.status(200).json('Travel plan updated successfully');
                }
               
            });

            request.addParameter('PlanID', TYPES.Int, PlanID);
            request.addParameter('TravelPlanName', TYPES.NVarChar, TravelPlanName);
            request.addParameter('Itinerary', TYPES.NVarChar, Itinerary);

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
    request.addOutputParameter('DestinationName', TYPES.VarChar);

    request.on('returnValue', (parameterName, value, metadata) => {
        console.log(value);
        res.json(JSON.parse(value));
    });
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