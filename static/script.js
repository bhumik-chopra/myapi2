let inputCount = 2;
let calculationHistory = [];
let currentOperation = 'add';
let previousResult = null;
let isNewCalculation = true;
let currentMode = 'simple'; // 'simple' or 'complex'
let expressionBuilder = '';

function switchMode(mode) {
    currentMode = mode;
    const simpleSection = document.getElementById('simpleSection');
    const complexSection = document.getElementById('complexSection');
    const modeButtons = document.querySelectorAll('.mode-btn');
    
    modeButtons.forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-primary');
    });
    
    document.querySelector(`[onclick="switchMode('${mode}')"]`).classList.remove('btn-outline-primary');
    document.querySelector(`[onclick="switchMode('${mode}')"]`).classList.add('btn-primary');
    
    if (mode === 'simple') {
        simpleSection.classList.remove('d-none');
        complexSection.classList.add('d-none');
        document.getElementById('currentOperation').textContent = 'Add';
    } else {
        simpleSection.classList.add('d-none');
        complexSection.classList.remove('d-none');
        updateExpressionDisplay();
    }
    
    // Reset for new mode
    startNewCalculation();
}

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
        showNotification('You\'ve added a third number!', 'info');
    }
}

function removeInput(button) {
    const inputGroup = button.parentElement;
    inputGroup.remove();
    inputCount--;
    
    const inputs = document.querySelectorAll('#number-inputs input');
    inputs.forEach((input, index) => {
        input.placeholder = `Number ${index + 1}`;
    });
    
    if (inputCount <= 2) {
        const removeButtons = document.querySelectorAll('.btn-remove');
        removeButtons.forEach(btn => btn.disabled = true);
    }
}

function resetCalculator() {
    if (currentMode === 'simple') {
        resetSimpleCalculator();
    } else {
        resetComplexCalculator();
    }
}

function resetSimpleCalculator() {
    const numberInputs = document.getElementById('number-inputs');
    numberInputs.innerHTML = '';
    
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
    
    inputCount = 2;
    previousResult = null;
    isNewCalculation = true;
    document.getElementById('result').innerHTML = '';
    document.getElementById('currentOperation').textContent = 'Add';
    
    const inputs = document.querySelectorAll('#number-inputs input');
    inputs.forEach(input => input.value = '');
}

function resetComplexCalculator() {
    expressionBuilder = '';
    previousResult = null;
    isNewCalculation = true;
    updateExpressionDisplay();
    document.getElementById('complexResult').innerHTML = '';
}

function startNewCalculation() {
    isNewCalculation = true;
    previousResult = null;
    
    if (currentMode === 'simple') {
        const inputs = document.querySelectorAll('#number-inputs input');
        inputs.forEach(input => input.value = '');
        document.getElementById('result').innerHTML = '';
        document.getElementById('currentOperation').textContent = 'Add';
        setOperation('add');
    } else {
        expressionBuilder = '';
        updateExpressionDisplay();
        document.getElementById('complexResult').innerHTML = '';
    }
}

function setOperation(operation) {
    currentOperation = operation;
    
    const operationNames = {
        'add': 'Add',
        'subtract': 'Subtract', 
        'multiply': 'Multiply',
        'divide': 'Divide'
    };
    document.getElementById('currentOperation').textContent = operationNames[operation];
    
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

// Complex Calculator Functions
function appendToExpression(value) {
    if (isNewCalculation && previousResult === null) {
        expressionBuilder = '';
        isNewCalculation = false;
    }
    
    // If we have a previous result and starting new expression, use it
    if (previousResult !== null && expressionBuilder === '') {
        expressionBuilder = previousResult.toString();
    }
    
    expressionBuilder += value;
    updateExpressionDisplay();
}

function clearExpression() {
    expressionBuilder = '';
    updateExpressionDisplay();
    document.getElementById('complexResult').innerHTML = '';
}

function backspaceExpression() {
    expressionBuilder = expressionBuilder.slice(0, -1);
    updateExpressionDisplay();
}

function updateExpressionDisplay() {
    const display = document.getElementById('expressionDisplay');
    if (expressionBuilder === '') {
        display.textContent = 'Enter expression...';
        display.classList.add('text-muted');
    } else {
        display.textContent = expressionBuilder;
        display.classList.remove('text-muted');
    }
}

function calculateComplex() {
    if (!expressionBuilder) {
        showNotification('Please enter an expression', 'warning');
        return;
    }
    
    const resultElement = document.getElementById('complexResult');
    resultElement.innerHTML = '<div class="text-muted">Calculating...</div>';
    
    fetch('/api/calculate/complex', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            expression: expressionBuilder
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            resultElement.innerHTML = `<div class="text-danger">${data.error}</div>`;
            return;
        }
        
        resultElement.innerHTML = `
            <div class="expression text-muted mb-1">${data.expression}</div>
            <div class="result fs-3 fw-bold text-primary">= ${data.result}</div>
        `;
        
        // Store result for continuation
        previousResult = data.result;
        isNewCalculation = false;
        
        addToHistory([], data.result, 'complex', data.expression);
    })
    .catch(error => {
        resultElement.innerHTML = '<div class="text-danger">Error calculating</div>';
        console.error(error);
    });
}

function calculateSimple() {
    const inputs = document.querySelectorAll('#number-inputs input');
    const numbers = Array.from(inputs)
        .map(input => parseFloat(input.value))
        .filter(num => !isNaN(num));
    
    if (numbers.length === 0) {
        document.getElementById('result').textContent = 'Please enter at least one number';
        return;
    }
    
    const resultElement = document.getElementById('result');
    resultElement.innerHTML = '<div class="text-muted">Calculating...</div>';
    
    const params = new URLSearchParams({
        numbers: numbers.join(','),
        operation: currentOperation
    });
    
    if (previousResult !== null && !isNewCalculation) {
        params.append('previous_result', previousResult);
    }
    
    fetch(`/api/calculate?${params}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                resultElement.innerHTML = `<div class="text-danger">${data.error}</div>`;
                return;
            }
            
            const operationSymbol = getOperationSymbol(data.operation);
            let expressionDisplay;
            
            if (previousResult !== null && !isNewCalculation) {
                expressionDisplay = `(${previousResult}) ${operationSymbol} ${numbers.join(` ${operationSymbol} `)}`;
            } else {
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
            
            previousResult = data.result;
            isNewCalculation = false;
            
            addToHistory(numbers, data.result, data.operation, expressionDisplay);
            
            const numberInputs = document.querySelectorAll('#number-inputs input');
            numberInputs.forEach(input => input.value = '');
        })
        .catch(error => {
            resultElement.innerHTML = '<div class="text-danger">Error calculating</div>';
            console.error(error);
        });
}

function calculate() {
    if (currentMode === 'simple') {
        calculateSimple();
    } else {
        calculateComplex();
    }
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
    const historyItem = {
        numbers: [...numbers],
        result: result,
        operation: operation,
        expression: expression,
        timestamp: new Date(),
        isContinuation: previousResult !== null && !isNewCalculation,
        mode: currentMode
    };
    
    calculationHistory.unshift(historyItem);
    
    if (calculationHistory.length > 10) {
        calculationHistory.pop();
    }
    
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
        const modeBadge = item.mode === 'complex' ? '<span class="badge bg-purple me-1">Complex</span>' : '<span class="badge bg-blue me-1">Simple</span>';
        
        historyItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    ${modeBadge}
                    ${item.isContinuation ? '<span class="badge bg-info me-1">Continued</span>' : ''}
                    <div class="expression small text-muted mt-1">${item.expression}</div>
                    <div class="result fw-bold">= ${item.result}</div>
                </div>
                <small class="text-muted ms-2">${timeString}</small>
            </div>
        `;
        
        historyElement.appendChild(historyItem);
    });
}

function showNotification(message, type = 'info') {
    const alertElement = document.getElementById('notificationAlert');
    alertElement.className = `alert alert-${type} alert-notification alert-dismissible fade show mx-auto`;
    alertElement.innerHTML = `
        <i class="fas fa-${type === 'info' ? 'info-circle' : type === 'warning' ? 'exclamation-triangle' : 'check-circle'} me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertElement.classList.remove('d-none');
    
    setTimeout(() => {
        alertElement.classList.add('d-none');
    }, 3000);
}

// Initialize the calculator on page load
document.addEventListener('DOMContentLoaded', function() {
    updateHistoryDisplay();
    setOperation('add');
    switchMode('simple');
});
