let inputCount = 2;
let calculationHistory = [];
let currentOperation = 'add';
let previousResult = null;
let isNewCalculation = true;

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

function resetCalculator() {
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
    
    // Reset counters and state
    inputCount = 2;
    previousResult = null;
    isNewCalculation = true;
    
    // Clear result display but keep operation
    document.getElementById('result').innerHTML = '';
    document.getElementById('currentOperation').textContent = 'Add';
    
    // Reset all input fields
    const inputs = document.querySelectorAll('#number-inputs input');
    inputs.forEach(input => input.value = '');
}

function setOperation(operation) {
    currentOperation = operation;
    
    // Update operation display
    const operationNames = {
        'add': 'Add',
        'subtract': 'Subtract', 
        'multiply': 'Multiply',
        'divide': 'Divide'
    };
    document.getElementById('currentOperation').textContent = operationNames[operation];
    
    // Update button styles to show active operation
    const buttons = document.querySelectorAll('.operation-btn');
    buttons.forEach(btn => {
        btn.classList.remove('btn-primary', 'btn-success', 'btn-warning', 'btn-danger');
        btn.classList.add('btn-outline-primary');
    });
    
    const activeBtn = document.querySelector(`[onclick="setOperation('${operation}')"]`);
    if (activeBtn) {
        activeBtn.classList.remove('btn-outline-primary');
        switch(operation) {
            case 'add':
                activeBtn.classList.add('btn-primary');
                break;
            case 'subtract':
                activeBtn.classList.add('btn-success');
                break;
            case 'multiply':
                activeBtn.classList.add('btn-warning');
                break;
            case 'divide':
                activeBtn.classList.add('btn-danger');
                break;
        }
    }
}

function calculate() {
    const inputs = document.querySelectorAll('#number-inputs input');
    const numbers = Array.from(inputs)
        .map(input => parseFloat(input.value))
        .filter(num => !isNaN(num)); // Only include valid numbers
    
    if (numbers.length === 0) {
        document.getElementById('result').textContent = 'Please enter at least one number';
        return;
    }
    
    // Show loading state
    const resultElement = document.getElementById('result');
    resultElement.innerHTML = '<div class="text-muted">Calculating...</div>';
    
    // Prepare API parameters
    const params = new URLSearchParams({
        numbers: numbers.join(','),
        operation: currentOperation
    });
    
    // Include previous result if this is a continuation
    if (previousResult !== null && !isNewCalculation) {
        params.append('previous_result', previousResult);
    }
    
    // Call the API
    fetch(`/api/calculate?${params}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                resultElement.innerHTML = `<div class="text-danger">${data.error}</div>`;
                return;
            }
            
            // Display the result with animation
            const operationSymbol = getOperationSymbol(data.operation);
            
            let expressionDisplay;
            if (previousResult !== null && !isNewCalculation) {
                // Show continuation expression
                expressionDisplay = `(${previousResult}) ${operationSymbol} ${numbers.join(` ${operationSymbol} `)}`;
            } else {
                // Show new expression
                expressionDisplay = data.expression;
            }
            
            resultElement.innerHTML = `
                <div class="expression text-muted mb-1">${expressionDisplay}</div>
                <div class="result fs-3 fw-bold text-primary">= ${data.result}</div>
                ${previousResult !== null && !isNewCalculation ? 
                    '<div class="continuation-badge mt-1"><span class="badge bg-info">Continued</span></div>' : 
                    '<div class="continuation-badge mt-1"><span class="badge bg-success">New Calculation</span></div>'
                }
            `;
            
            resultElement.classList.add('bg-light');
            
            // Store result for next operation and mark as continuation
            previousResult = data.result;
            isNewCalculation = false;
            
            // Add to history
            addToHistory(numbers, data.result, data.operation, expressionDisplay);
            
            // Clear input fields for next numbers but keep operation
            const numberInputs = document.querySelectorAll('#number-inputs input');
            numberInputs.forEach(input => input.value = '');
            
        })
        .catch(error => {
            resultElement.innerHTML = '<div class="text-danger">Error calculating</div>';
            console.error(error);
        });
}

function startNewCalculation() {
    isNewCalculation = true;
    previousResult = null;
    const inputs = document.querySelectorAll('#number-inputs input');
    inputs.forEach(input => input.value = '');
    document.getElementById('result').innerHTML = '';
    document.getElementById('currentOperation').textContent = 'Add';
    setOperation('add');
}

function getOperationSymbol(operation) {
    switch(operation) {
        case 'add': return '+';
        case 'subtract': return '-';
        case 'multiply': return '×';
        case 'divide': return '÷';
        default: return '+';
    }
}

function addToHistory(numbers, result, operation, expression) {
    // Create history item
    const historyItem = {
        numbers: [...numbers],
        result: result,
        operation: operation,
        expression: expression,
        timestamp: new Date(),
        isContinuation: previousResult !== null && !isNewCalculation
    };
    
    // Add to beginning of history array
    calculationHistory.unshift(historyItem);
    
    // Keep only last 10 history items
    if (calculationHistory.length > 10) {
        calculationHistory.pop();
    }
    
    // Update history display
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyElement = document.getElementById('history');
    
    if (calculationHistory.length === 0) {
        historyElement.innerHTML = '<p class="text-muted text-center">No calculations yet</p>';
        return;
    }
    
    historyElement.innerHTML = '';
    
    calculationHistory.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${index === 0 ? 'border-primary' : ''} p-2 mb-2 rounded`;
        
        if (index === 0) {
            historyItem.style.backgroundColor = '#f8f9fa';
            historyItem.style.borderLeft = '4px solid #0d6efd';
        } else {
            historyItem.style.borderLeft = '4px solid #6c757d';
        }
        
        const timeString = item.timestamp.toLocaleTimeString();
        
        historyItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <div class="expression small text-muted">${item.expression}</div>
                    <div class="result fw-bold">= ${item.result}</div>
                    ${item.isContinuation ? '<small class="text-info"><i class="fas fa-link me-1"></i>Continued</small>' : ''}
                </div>
                <small class="text-muted ms-2">${timeString}</small>
            </div>
        `;
        
        historyElement.appendChild(historyItem);
    });
}

// Initialize the calculator on page load
document.addEventListener('DOMContentLoaded', function() {
    updateHistoryDisplay();
    setOperation('add');
});
