// Get the categories container
const categoriesContainer = document.querySelector('.categories-container');
let priorityList = document.getElementById('priority-list');
let dragContainer = document.getElementById('drag-container');

let wants = [];
let needs = [];
let draggedItem = null;
let draggedIndex = null;
let monthlyIncome = 0;

// Function to add a Want item
function addWantItem() {
    const itemName = document.getElementById('wantInput').value;
    const itemCost = document.getElementById('wantCostInput').value;

    if (itemName && itemCost) {
        const wantItem = { name: itemName, cost: parseFloat(itemCost) };
        wants.push(wantItem);

        updateWantItems();
        document.getElementById('wantInput').value = '';
        document.getElementById('wantCostInput').value = '';
    }
}

// Function to update the list of Want items and make them draggable
function updateWantItems() {
    const wantList = document.getElementById('want-items');
    wantList.innerHTML = '';

    wants.forEach((want, index) => {
        const li = document.createElement('li');
        li.textContent = `${want.name}: $${want.cost}`;
        li.setAttribute('draggable', true);
        li.setAttribute('data-index', index);

        // Add drag event listeners
        li.addEventListener('dragstart', dragStart);
        li.addEventListener('dragover', dragOver);
        li.addEventListener('drop', drop);
        li.addEventListener('dragend', dragEnd);

        wantList.appendChild(li);
    });
}

// Drag and Drop Functions

// Triggered when dragging starts
function dragStart(event) {
    draggedItem = event.target;
    draggedIndex = draggedItem.getAttribute('data-index');
    setTimeout(() => {
        event.target.style.visibility = 'hidden'; // Keep the space but make the item invisible
    }, 0);
}

// Allow dropping by preventing the default behavior
function dragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move'; // Shows a move cursor
}

// Triggered when an item is dropped
function drop(event) {
    event.preventDefault();
    const target = event.target;

    // Ensure drop is on a valid LI element (list item) and not on the dragged item itself
    if (target.tagName === 'LI' && target !== draggedItem) {
        const targetIndex = target.getAttribute('data-index');

        // Swap the items in the array
        const temp = wants[draggedIndex];
        wants[draggedIndex] = wants[targetIndex];
        wants[targetIndex] = temp;

        // Re-render the list to reflect the new order
        updateWantItems();
        saveBudget();
    }
}

// Reset the dragged item display after dragging ends
function dragEnd(event) {
    setTimeout(() => {
        event.target.style.visibility = 'visible'; // Restore visibility
        draggedItem = null;
        draggedIndex = null;
    }, 0);
}


// Function to add a Need item
function addNeedItem() {
    const needName = document.getElementById('needInput').value;
    const needCost = document.getElementById('needCostInput').value;

    if (needName && needCost) {
        const needItem = { name: needName, cost: parseFloat(needCost) };
        needs.push(needItem);

        updateNeedItems();
        document.getElementById('needInput').value = '';
        document.getElementById('needCostInput').value = '';
    }
}

// Function to update the list of Need items
function updateNeedItems() {
    const needList = document.getElementById('need-items');
    needList.innerHTML = '';

    needs.forEach((need, index) => {
        const li = document.createElement('li');
        li.textContent = `${need.name}: $${need.cost}`;
        needList.appendChild(li);
    });
}


// Calculate remaining income and display it
function calculateRemainingIncome() {
    const monthlyIncome = parseFloat(document.getElementById("monthlyIncome").value);
    let totalNeedsCost = 0;

    // Sum the cost of all need items
    needs.forEach(need => {
        totalNeedsCost += need.cost;
    });

    // Calculate remaining income
    remainingIncome = monthlyIncome - totalNeedsCost;

    // Update remaining income display
    const remainingIncomeElement = document.getElementById("remaining-income");
    if (remainingIncome < 0) {
        remainingIncomeElement.textContent = "You have overspent on your needs, please reduce your needs. Remaining income is $0.00";
        remainingIncome = 0; // Set remaining income to 0 to prevent negative values
    } else {
        remainingIncomeElement.textContent = `Remaining income is: $${remainingIncome.toFixed(2)}`;
    }

    // Save the calculated remaining income
    saveBudget();
}


// Function to calculate time to afford the highest priority Want
function calculatePriorities() {
    const remainingIncomeText = document.getElementById('remaining-income').textContent;
    let remainingIncome = parseFloat(remainingIncomeText.replace(/[^0-9.-]+/g, "")); // Parse remaining income as a number
    const highestPriorityWant = wants[0]; // Assuming wants are added in priority order
    const monthlyIncome = parseFloat(document.getElementById("monthlyIncome").value); // Get the monthly income from the input

    let incomeCost = remainingIncome; // Start with the current remaining income
    let monthsToAfford = 0;

    // Increment incomeCost each month until it meets or exceeds the cost of the highest priority item
    while (incomeCost < highestPriorityWant.cost) {
        incomeCost += monthlyIncome;
        monthsToAfford += 1; // Count each month added
    }

    const wantMoney = incomeCost - highestPriorityWant.cost;

    // Display the result
    if (remainingIncome >= highestPriorityWant.cost) {
        document.getElementById('timeResult').textContent = 
            `Your highest priority item, "${highestPriorityWant.name}", can be purchased immediately with your current budget!
             You have $${wantMoney.toFixed(2)} left for other items.`;
    } else {
        document.getElementById('timeResult').textContent = 
            `You need more money to purchase your highest priority item, "${highestPriorityWant.name}". 
            You can afford it in ${monthsToAfford} month(s) with your current savings plan. 
            You will have $${wantMoney.toFixed(2)} left after purchasing it.`;
    }
}

// Initialize the need items display on page load
updateNeedItems();

document.addEventListener('DOMContentLoaded', loadBudget); // Automatically load saved data on page load

let remainingIncome = 0; // Initialize remaining income

async function loadBudget() {
    try {
        const response = await fetch('https://product-1-7zzv.onrender.com/load-budget'); // Updated with the Render URL
        if (!response.ok) {
            throw new Error('Failed to load budget');
        }

        const data = await response.json();
        needs = data.needs || [];
        wants = data.wants || [];
        remainingIncome = data.remainingIncome || 0;

        // Update the UI with loaded data
        updateNeedItems();
        updateWantItems();
        document.getElementById('remaining-income').textContent = `Remaining income is: $${remainingIncome.toFixed(2)}`;
    } catch (error) {
        console.error('Error loading budget:', error);
    }
}


// Save the current state of Needs, Wants, and Remaining Income to the server
async function saveBudget() {
    try {
        const response = await fetch('https://product-1-7zzv.onrender.com/save-budget', { // Updated with the Render URL
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ needs, wants, remainingIncome })
        });

        if (response.ok) {
            document.getElementById('save-message').innerText = 'Budget saved successfully!';
            console.log('Budget saved successfully!');
        } else {
            console.error('Failed to save budget');
            document.getElementById('save-message').innerText = 'Failed to save budget';
        }
    } catch (error) {
        console.error('Error saving budget:', error);
        document.getElementById('save-message').innerText = 'Error saving budget';
    }
}

// Update the "Needs" list items in the UI
function updateNeedItems() {
    const needList = document.getElementById('need-items');
    needList.innerHTML = ''; // Clear the list

    needs.forEach((need, index) => {
        const li = document.createElement('li');
        li.textContent = `${need.name}: $${need.cost}`;

        // Add delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-btn';
        deleteButton.onclick = function () {
            needs.splice(index, 1); // Remove item from the array
            updateNeedItems(); // Re-render list
            saveBudget(); // Save updated list to database
        };

        li.appendChild(deleteButton);
        needList.appendChild(li);
    });
}

// Update the "Wants" list items in the UI with drag-and-drop and delete functionality
function updateWantItems() {
    const wantList = document.getElementById('want-items');
    wantList.innerHTML = ''; // Clear the list

    wants.forEach((want, index) => {
        const li = document.createElement('li');
        li.textContent = `${want.name}: $${want.cost}`;
        li.setAttribute('draggable', true);
        li.setAttribute('data-index', index);

        // Drag event listeners
        li.addEventListener('dragstart', dragStart);
        li.addEventListener('dragover', dragOver);
        li.addEventListener('drop', drop);
        li.addEventListener('dragend', dragEnd);

        // Add delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-btn';
        deleteButton.onclick = function () {
            wants.splice(index, 1); // Remove item from the array
            updateWantItems(); // Re-render list
            saveBudget(); // Save updated list to database
        };

        li.appendChild(deleteButton);
        wantList.appendChild(li);
    });
}

// Drag and Drop Functions
function dragStart(event) {
    draggedItem = event.target;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', draggedItem.innerHTML);
    draggedItem.classList.add('dragging');
}

function dragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
}

function drop(event) {
    event.preventDefault();
    const target = event.target.closest('li'); // Ensure drop target is an <li> element

    if (target && target !== draggedItem) {
        const draggedIndex = draggedItem.getAttribute('data-index');
        const targetIndex = target.getAttribute('data-index');

        // Swap the items in the array
        [wants[draggedIndex], wants[targetIndex]] = [wants[targetIndex], wants[draggedIndex]];

        // Update the UI and save the new order
        updateWantItems();
        saveBudget();
    }
}

function dragEnd(event) {
    draggedItem.classList.remove('dragging');
    draggedItem = null;
}



  // Set up key listeners for the "Need" inputs
document.getElementById('needInput').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission
        document.getElementById('needCostInput').focus(); // Move focus to cost input
    }
});

document.getElementById('needCostInput').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission
        addNeedItem(); // Call the function to add the item
    }
});

// Set up key listeners for the "Want" inputs
document.getElementById('wantInput').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('wantCostInput').focus();
    }
});

document.getElementById('wantCostInput').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addWantItem();
    }
});

document.getElementById('monthlyIncome').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        calculateRemainingIncome();
    }
});