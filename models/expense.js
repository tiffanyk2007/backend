// Get the categories container
const categoriesContainer = document.querySelector('.categories-container');
let priorityList = document.getElementById('priority-list');
let dragContainer = document.getElementById('drag-container');


// Function to add item to expenses
async function addItem() {
    let categoryDiv = this.parentNode;
    let itemName = categoryDiv.querySelector('input[type="text"]').value;
    let itemPrice = categoryDiv.querySelector('input[type="number"]').value;
    let itemDate = categoryDiv.querySelector('input[type="date"]').value;
    let category = categoryDiv.querySelector('h3').innerText;

    if (!itemName || !itemPrice || !itemDate) {
        alert("Please fill in all fields with the correct information and select a date.");
        return;
    }

    const expense = {
        name: itemName,
        price: parseFloat(itemPrice),
        date: itemDate,
        category: category
    };

    try {
        const response = await fetch('/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expense)
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message || 'Expense added successfully!');
        } else {
            alert(`Failed to add expense: ${result.error || 'Unknown error occurred.'}`);

        }
    } catch (error) {
        alert('An error occurred while adding the expense.');
    }

    categoryDiv.querySelector('input[type="text"]').value = '';
    categoryDiv.querySelector('input[type="number"]').value = '';
    categoryDiv.querySelector('input[type="date"]').value = '';
}

// Adding item event listener
document.querySelectorAll('.add-item-btn').forEach(button => {
    button.addEventListener('click', addItem);
});

// Fetch and display total expenses for the user
async function fetchTotalExpenses() {
    try {
        const response = await fetch('/total-expenses');
        if (!response.ok) {
            throw new Error('Failed to fetch total expenses');
        }

        const data = await response.json();
        const totalExpenses = data.totalExpenses || 0; // Ensure there is a fallback in case the data is missing

        // Update the total expenses in the HTML
        document.getElementById('total-expenses').innerText = totalExpenses.toFixed(2);
    } catch (error) {
        console.error(error);
        alert('An error occurred while fetching total expenses.');
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchTotalExpenses();
});


