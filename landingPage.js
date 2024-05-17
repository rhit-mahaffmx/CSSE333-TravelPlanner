src="Data Import.csv";
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('journal-btn').addEventListener('click', function() {
        window.location.href = '/Journal.html'; 
    });
    document.getElementById('budget-btn').addEventListener('click', function() {
        window.location.href = '/Budget.html'; 
    });
    document.getElementById('travelPlan-btn').addEventListener('click', function() {
        window.location.href = 'TravelPlanner.html'; 
    });
    document.getElementById('destination-btn').addEventListener('click', function() {
        window.location.href = 'Destination.html'; 
    });
    document.getElementById('review-btn').addEventListener('click', function() {
        window.location.href = 'Reviews.html'; 
    });
    document.getElementById('importData').addEventListener('click', function() {
        const DELIMITER = ',';
        const NEWLINE = '\n';
        const i = document.getElementById('file');
        if(!!i.files && i.files.length > 0){
            parseCSV(i.files[0]);
        }
    });

    function parseCSV(file){
        console.log('test1');
        const reader = new FileReader();
        reader.onload = function () {
            let text = reader.result;
            csvJSON(text);
        };
        reader.readAsText(file);
    }

    window.csvJSON = (csv) => {
        console.log('test2');
        let lines = csv.split("\n");
        let headers = lines[1].split(",");
        addUser(0);
        function addUser(i){
            headers = lines[i].split(",");
            fetch("/CreateProf", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: headers[2],
                    password: headers[3]
                })
            }).then((res) => {
                return res.json();
            }).then((data) => {
                if(i + 1 < lines.length){
                    addUser(i + 1);
                }else{
                    addDestination(0);
                }
                return;
            });
        }

        function addDestination(i){
            headers = lines[i].split(",");
            fetch("/createDestination", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    destinationName: headers[4],
                    country: headers[5],
                    language: headers[6],
                    customs: headers[7],
                    tips: headers[8]
                })
            }).then((res) => {
                return res.json();
            }).then((data) => {
                if(i + 1 < lines.length){
                    addDestination(i + 1);
                }else{
                    addReview(0);
                }
                return;
            });
        }

        function addReview(i){
            headers = lines[i].split(",");
            fetch("/createReview2", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Text: headers[0],
                    Rating: headers[1],
                    userName: headers[2],
                    Destination: headers[4]
                })
            }).then((res) => {
                return res.json();
            }).then((data) => {
                if(i + 1 < lines.length){
                    addReview(i + 1);
                }
                return;
            });
        }
        
    }

    document.getElementById('logout-btn').addEventListener('click', function() {
        fetch('/logout', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(response => {
            if (response.ok) {
                window.location.href = '/';
            } else {
                alert('Failed to logout');
            }
        })
        .catch(error => console.error('Error logging out:', error));
    });

    document.getElementById('deleteUser-btn').addEventListener('click', function() {
        fetch('/deleteUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'User deleted successfully') {
                window.location.href = '/';
            } else {
                alert('Failed to delete user');
            }
        })
        .catch(error => console.error('Error deleting user:', error));
    });
});
