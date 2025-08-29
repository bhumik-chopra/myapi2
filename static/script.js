let inputCount = 2;
let calculationHistory = [];

function addInput() {
    inputCount++;
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group mb-2';
    
    inputGroup.innerHTML = `
        <input type="number" class="form-control" placeholder="Number ${inputCount}">
        <button class="btn btn-outline-danger btn-remove" type="button" onclick="removeInput(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.getElementById('number-inputs').appendChild(inputGroup);
    
    if (inputCount === 3) {
        const alertElement = document.getElementById('notificationAlert');
        alertElement.classList.remove('d-none');
        setTimeout(() => {
            alertElement.classList.add('d-none');
        }, 3000);
    }
}

function removeInput(button) {
    const inputGroup = button.parentElement;
    inputGroup.remove();
    inputCount--;
    
    // Update the placeholders for remaining inputs
    const inputs = document.querySelectorAll('#number-inputs input');
    inputs.forEach((input, index) => {
        input.placeholder = `Number ${index + 1}`;
    });
    
    // Disable remove buttons if we have only 2 inputs left
    if (inputCount <= 2) {
        const removeButtons = document.querySelectorAll('.btn-remove');
        removeButtons.forEach(btn => btn.disabled = true);
    }
}

function resetInputs() {
    const numberInputs = document.getElementById('number-inputs');
    numberInputs.innerHTML = '';
    
    // Add two default inputs
    for (let i = 1; i <= 2; i++) {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group mb-2';
        
        inputGroup.innerHTML = `
            <input type="number" class="form-control" placeholder="Number ${i}">
            <button class="btn btn-outline-danger btn-remove" type="button" disabled>
                <i class="fas fa-times"></i>
            </button>
        `;
        
        numberInputs.appendChild(inputGroup);
    }
    
    // Reset counter and result
    inputCount = 2;
    document.getElementById('result').textContent = '';
}

function calculate() {
    const inputs = document.querySelectorAll('#number-inputs input');
    const numbers = Array.from(inputs).map(input => parseFloat(input.value) || 0);
    
    if (numbers.length < 2) {
        document.getElementById('result').textContent = 'Please enter at least 2 numbers';
        return;
    }
    
    // Show loading state
    document.getElementById('result').textContent = 'Calculating...';
    
    // Call the API
    fetch(`/api/add?numbers=${numbers.join(',')}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById('result').textContent = data.error;
                return;
            }
            
            // Display the result with animation
            const resultElement = document.getElementById('result');
            resultElement.textContent = `Sum: ${data.result}`;
            resultElement.classList.add('bg-success', 'text-white');
            
            // Add to history
            addToHistory(numbers, data.result);
            
            // Remove animation after 2 seconds
            setTimeout(() => {
                resultElement.classList.remove('bg-success', 'text-white');
            }, 2000);
        })
        .catch(error => {
            document.getElementById('result').textContent = 'Error calculating';
            console.error(error);
        });
}

function addToHistory(numbers, sum) {
    // Create history item
    const historyItem = {
        numbers: [...numbers],
        sum: sum,
        timestamp: new Date()
    };
    
    // Add to beginning of history array
    calculationHistory.unshift(historyItem);
    
    // Keep only last 5 history items
    if (calculationHistory.length > 5) {
        calculationHistory.pop();
    }
    
    // Update history display
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyElement = document.getElementById('history');
    
    if (calculationHistory.length === 0) {
        historyElement.innerHTML = '<p class="text-muted">No calculations yet</p>';
        return;
    }
    
    historyElement.innerHTML = '';
    
    calculationHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const timeString = item.timestamp.toLocaleTimeString();
        const expression = item.numbers.join(' + ');
        
        historyItem.innerHTML = `
            <div class="d-flex justify-content-between">
                <span>${expression} = <strong>${item.sum}</strong></span>
                <small class="text-muted">${timeString}</small>
            </div>
        `;
        
        historyElement.appendChild(historyItem);
    });
}

// Initialize the history display on page load
document.addEventListener('DOMContentLoaded', function() {
    updateHistoryDisplay();
});
