let inputCount = 2;
let calculationHistory = [];
let currentOperation = 'add';
let previousResult = null;
let isNewCalculation = true;
let currentMode = 'simple'; // 'simple', 'complex', 'scientific', 'matrix'
let expressionBuilder = '';
let matrixSize = 2;
let matrixA = [];
let matrixB = [];

function switchMode(mode) {
    currentMode = mode;
    const sections = ['simpleSection', 'complexSection', 'scientificSection', 'matrixSection'];
    
    // Hide all sections
    sections.forEach(section => {
        document.getElementById(section).classList.add('d-none');
    });
    
    // Show current section
    document.getElementById(mode + 'Section').classList.remove('d-none');
    
    // Update mode buttons
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-primary');
    });
    
    document.querySelector(`[onclick="switchMode('${mode}')"]`).classList.remove('btn-outline-primary');
    document.querySelector(`[onclick="switchMode('${mode}')"]`).classList.add('btn-primary');
    
    // Reset for new mode
    startNewCalculation();
    
    // Initialize matrix if in matrix mode
    if (mode === 'matrix') {
        initializeMatrices();
    }
}

// Simple Calculator Functions
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
    } else if (currentMode === 'complex') {
        resetComplexCalculator();
    } else if (currentMode === 'scientific') {
        resetScientificCalculator();
    } else if (currentMode === 'matrix') {
        resetMatrixCalculator();
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

function resetScientificCalculator() {
    document.getElementById('scientificInput').value = '';
    document.getElementById('scientificResult').innerHTML = '';
}

function resetMatrixCalculator() {
    initializeMatrices();
    document.getElementById('matrixResult').innerHTML = '';
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
    } else if (currentMode === 'complex') {
        expressionBuilder = '';
        updateExpressionDisplay();
        document.getElementById('complexResult').innerHTML = '';
    } else if (currentMode === 'scientific') {
        document.getElementById('scientificInput').value = '';
        document.getElementById('scientificResult').innerHTML = '';
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
    
    if (previousResult !== null && expressionBuilder === '') {
        expressionBuilder = previousResult.toString();
    }
    
    let displayValue = value;
    if (value === '*') displayValue = '×';
    if (value === '/') displayValue = '÷';
    
    expressionBuilder += displayValue;
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
    
    let backendExpression = expressionBuilder.replace(/×/g, '*').replace(/÷/g, '/');
    
    fetch('/api/calculate/complex', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            expression: backendExpression
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            resultElement.innerHTML = `<div class="text-danger">${data.error}</div>`;
            return;
        }
        
        resultElement.innerHTML = `
            <div class="expression text-muted mb-1">${expressionBuilder}</div>
            <div class="result fs-3 fw-bold text-primary">= ${data.result}</div>
        `;
        
        previousResult = data.result;
        isNewCalculation = false;
        
        addToHistory([], data.result, 'complex', expressionBuilder);
    })
    .catch(error => {
        resultElement.innerHTML = '<div class="text-danger">Error calculating</div>';
        console.error(error);
    });
}

// Scientific Calculator Functions
function calculateScientific(operation) {
    const input = document.getElementById('scientificInput');
    const number = parseFloat(input.value);
    
    if (isNaN(number)) {
        showNotification('Please enter a valid number', 'warning');
        return;
    }
    
    const resultElement = document.getElementById('scientificResult');
    resultElement.innerHTML = '<div class="text-muted">Calculating...</div>';
    
    fetch('/api/calculate/scientific', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            number: number,
            operation: operation
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
        
        addToHistory([number], data.result, 'scientific', data.expression);
    })
    .catch(error => {
        resultElement.innerHTML = '<div class="text-danger">Error calculating</div>';
        console.error(error);
    });
}

// Matrix Calculator Functions
function initializeMatrices() {
    matrixSize = parseInt(document.getElementById('matrixSize').value) || 2;
    matrixA = [];
    matrixB = [];
    
    // Initialize matrices with zeros
    for (let i = 0; i < matrixSize; i++) {
        matrixA[i] = [];
        matrixB[i] = [];
        for (let j = 0; j < matrixSize; j++) {
            matrixA[i][j] = 0;
            matrixB[i][j] = 0;
        }
    }
    
    renderMatrices();
}

function renderMatrices() {
    const matrixAContainer = document.getElementById('matrixA');
    const matrixBContainer = document.getElementById('matrixB');
    
    matrixAContainer.innerHTML = '';
    matrixBContainer.innerHTML = '';
    
    for (let i = 0; i < matrixSize; i++) {
        const rowA = document.createElement('div');
        const rowB = document.createElement('div');
        rowA.className = 'matrix-row';
        rowB.className = 'matrix-row';
        
        for (let j = 0; j < matrixSize; j++) {
            const inputA = document.createElement('input');
            const inputB = document.createElement('input');
            
            inputA.type = 'number';
            inputB.type = 'number';
            inputA.className = 'matrix-input';
            inputB.className = 'matrix-input';
            inputA.value = matrixA[i][j];
            inputB.value = matrixB[i][j];
            inputA.placeholder = `A[${i+1},${j+1}]`;
            inputB.placeholder = `B[${i+1},${j+1}]`;
            
            inputA.addEventListener('input', (e) => {
                matrixA[i][j] = parseFloat(e.target.value) || 0;
            });
            
            inputB.addEventListener('input', (e) => {
                matrixB[i][j] = parseFloat(e.target.value) || 0;
            });
            
            rowA.appendChild(inputA);
            rowB.appendChild(inputB);
        }
        
        matrixAContainer.appendChild(rowA);
        matrixBContainer.appendChild(rowB);
    }
}

function calculateMatrix(operation) {
    const resultElement = document.getElementById('matrixResult');
    resultElement.innerHTML = '<div class="text-muted">Calculating...</div>';
    
    fetch('/api/calculate/matrix', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            matrix1: matrixA,
            matrix2: matrixB,
            operation: operation
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            resultElement.innerHTML = `<div class="text-danger">${data.error}</div>`;
            return;
        }
        
        let resultHTML = `
            <div class="expression text-muted mb-2">${data.expression}</div>
            <div class="result fw-bold text-primary mb-2">Result:</div>
        `;
        
        if (typeof data.result === 'number') {
            // Scalar result (determinant)
            resultHTML += `<div class="fs-4">${data.result}</div>`;
        } else {
            // Matrix result
            resultHTML += '<div class="matrix-result">';
            data.result.forEach(row => {
                resultHTML += '<div class="matrix-row">';
                row.forEach(cell => {
                    resultHTML += `<span class="matrix-cell">${cell.toFixed(2)}</span>`;
                });
                resultHTML += '</div>';
            });
            resultHTML += '</div>';
        }
        
        resultElement
