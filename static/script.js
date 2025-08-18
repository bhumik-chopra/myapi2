let inputCount = 2;

function addInput() {
    inputCount++;
    const newInput = document.createElement('input');
    newInput.type = 'number';
    newInput.className = 'form-control mb-2';
    newInput.placeholder = `Number ${inputCount}`;
    document.getElementById('number-inputs').appendChild(newInput);
    
    if (inputCount === 3) {
        const alertElement = document.getElementById('notificationAlert');
        alertElement.classList.remove('d-none');
        setTimeout(() => {
            alertElement.classList.add('d-none');
        }, 3000);
    }
}

function calculate() {
    const inputs = document.querySelectorAll('#number-inputs input');
    const numbers = Array.from(inputs).map(input => input.value).filter(Boolean);
    
    if (numbers.length < 2) {
        document.getElementById('result').textContent = 'Please enter at least 2 numbers';
        return;
    }

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
