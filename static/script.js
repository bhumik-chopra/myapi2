let inputCount = 2;
const toast = new bootstrap.Toast(document.getElementById('notificationToast'));

function addInput() {
    inputCount++;
    const newInput = document.createElement('input');
    newInput.type = 'number';
    newInput.className = 'form-control mb-2';
    newInput.placeholder = `Number ${inputCount}`;
    document.getElementById('number-inputs').appendChild(newInput);
    
    // Show toast notification when 3rd number is added
    if (inputCount === 3) {
        toast.show();
    }
}

function calculate() {
    const inputs = document.querySelectorAll('#number-inputs input');
    const numbers = Array.from(inputs).map(input => input.value).filter(Boolean);
    
    if (numbers.length < 2) {
        document.getElementById('result').textContent = 'Please enter at least 2 numbers';
        return;
    }

    // Simple GET request
    fetch(`/api/add?numbers=${numbers.join(',')}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('result').textContent = `Sum: ${data.result}`;
        })
        .catch(error => {
            document.getElementById('result').textContent = 'Error calculating';
            console.error(error);
        });
}
