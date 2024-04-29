document.getElementById('budgetForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const type = document.getElementById('type').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value;
    const userId = 1; 

    fetch('/createBudget', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            budgetId,
            spendingLimit,
            userId
        })
    })
    .then(response => response.text())
    .then(data => {
        console.log(data);
        alert('Budget entry added successfully!');
    })
    .catch(error => console.error('Error:', error));
});
