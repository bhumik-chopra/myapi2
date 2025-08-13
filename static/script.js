async function calculate() {
    const num1 = document.getElementById('num1').value;
    const num2 = document.getElementById('num2').value;
    
    const response = await fetch(`/api/add?num1=${num1}&num2=${num2}`);
    const data = await response.json();
    
    document.getElementById('result').innerHTML = 
        `Result: ${data.result}`;
}