const displayDOM = document.getElementById("display");
let lastNumber = "0";
let lastOperation = "";
let expression = "";
let expressionToEval = "";
let isComaPresent = false;
let leftBracket = "";
let rightBracket = "";
let leftBracketCount = 0;
let noValueFromUser = true;
let divider = "";
let exchangeRates = [];
let currencyCode = "";
let codePLN = "";

document.addEventListener('DOMContentLoaded', (event) => {
    addBtnsEventListeners();
    getExchangeRates(); 
});

function addBtnsEventListeners() {
    addLisToMultiBtns("number", createNumber);
    addLisToMultiBtns("operator", addOperator);
    document.getElementsByClassName("root")[0].addEventListener("click", createRoot);
    document.getElementsByClassName("left-bracket")[0].addEventListener("click", openBrackets);
    document.getElementsByClassName("right-bracket")[0].addEventListener("click", closeBrackets);
    document.getElementsByClassName("result")[0].addEventListener("click", getResult);
    document.getElementsByClassName("clear")[0].addEventListener("click", function() { clearCalc(); });
    document.getElementsByClassName("clear-last-num")[0].addEventListener("click", clearLastNumber);
}

function addLisToMultiBtns(className, functionName) {
    let btnListDOM = document.getElementsByClassName(className);
    for (let index = 0; index < btnListDOM.length; index++) {
        let button = btnListDOM[index];
        let value = button.getAttribute("value");
        button.addEventListener("click", function() {
            functionName(value);
        });
    }
}

function createNumber(element) {
    if (lastNumber.startsWith("Nie")) {
        lastNumber = "0";
    }
    
    if (element === "," && isComaPresent ) {
        return;
    } else if (element === "," && lastNumber === "") {
        lastNumber = "0"
        isComaPresent = true;
    } else if (element === ",") {
        isComaPresent = true;
    } else if (noValueFromUser || lastNumber === "0") {
        lastNumber = "";
        isComaPresent = false;
        codePLN = (currencyCode ? codePLN : "");
    } 

    noValueFromUser = false;
    lastNumber = lastNumber + element;
    displayMathOperation();
}

function displayMathOperation() {
    displayDOM.textContent = expression + lastOperation + divider + leftBracket + (currencyCode ? (currencyCode + "(") : "") + lastNumber + rightBracket;
}

function addOperator(op) {
    if (lastNumber.startsWith("Nie")) {
        return;
    } else if (lastNumber !== "") {
        expression = expression + lastOperation + divider + leftBracket + (currencyCode ? (currencyCode + "(") : "") + lastNumber + rightBracket + " ";
        expressionToEval = (expressionToEval + lastOperation + divider + leftBracket + (currencyCode ? ("(" + exchangeCurrencyToPLN(currencyCode) + " * (") : "") + "(" + lastNumber + ")" + (currencyCode ? ")" : "")+ rightBracket);
        leftBracket = rightBracket = currencyCode = "";
    }
    
    (expression !== "" && op !== "^ (1 / (") ? divider = " " : divider = "";
    lastNumber = "";
    isComaPresent = false;
    lastOperation = op;
    noValueFromUser = false;
    displayMathOperation();
}

function createRoot() {
    leftBracketCount+=2;
    addOperator("^ (1 / (");
}

function getResult() {
    if ((lastNumber && lastOperation) || (lastNumber && currencyCode)) {
        while(leftBracketCount > 0) {
            rightBracket += ")";
            leftBracketCount--;
        }

        expressionToEval = (expressionToEval + lastOperation + divider + leftBracket + (currencyCode ? ("(" + exchangeCurrencyToPLN(currencyCode) + " * (") : "") + "(" + lastNumber + ")" + (currencyCode ? ")" : "")+ rightBracket);
        expressionToEval = expressionToEval.replace(/\,/g,'.').replace(/\^/g,'**').replace(/PLN/g,'');
        lastNumber = eval(expressionToEval).toString();
        lastNumber = lastNumber.replace(/\./g,',');
        lastNumber = lastNumber + (codePLN ? (" " + codePLN) : "");
        lastNumber.includes(',') ? isComaPresent = true : isComaPresent = false;

        if (lastNumber.includes("Infinity")) {
            lastNumber = "Nie można dzielić przez zero";
        } else if (lastNumber.includes("NaN")) {
            lastNumber = "Nieokreślony wynik";
        }
        clearCalc(lastNumber, isComaPresent, codePLN);
    }
}

function clearCalc(lastNum = "0", isComaPres = false, pln = "") {
    lastNumber = lastNum;
    lastOperation = "";
    expression = "";
    expressionToEval = "";
    isComaPresent = isComaPres;
    leftBracket = "";
    rightBracket = "";
    currencyCode = "";
    leftBracketCount = 0;
    noValueFromUser = true;
    divider = "";
    codePLN = pln;
    displayMathOperation();
}

function clearLastNumber() {
    if (expression === "") {
        lastNumber = "0";
    } else if (lastNumber && currencyCode) {
        lastNumber = "";
        rightBracket = rightBracket.substring(0, rightBracket.length - 1);
        currencyCode = "";
    } else if (lastNumber) {
        lastNumber = "";
    }
    displayMathOperation();
} 

function openBrackets() {
    leftBracketCount++;
    leftBracket += "(";
    displayMathOperation();
}

function closeBrackets() {
    if (leftBracketCount > 0) {
        leftBracketCount--;
        rightBracket += ")";
        displayMathOperation();
    }
}

function getExchangeRates() { 
    let url = "http://api.nbp.pl/api/exchangerates/tables/A";
    fetch(url).then(function(response) {
    response.text().then(function(data) {
        exchangeRates = JSON.parse(data);
        let dropdownMenuDOM = document.getElementsByClassName("dropdown-menu")[0];
        let currencyList = exchangeRates[0].rates;
        currencyList.forEach(addLinkToCurrencyDropdown, dropdownMenuDOM);       
    });
  });
}

function addLinkToCurrencyDropdown(item) {
    let currCode = item.code;
    let linkDOM = document.createElement('a');
    let linkText = document.createTextNode(currCode);
    linkDOM.appendChild(linkText);
    linkDOM.className = "dropdown-item";

    linkDOM.onclick = function() {
        addCurrency(currCode);
    };
    this.appendChild(linkDOM);
}

function addCurrency(currCode){
    codePLN = "PLN";
    if (currencyCode === "") {
        rightBracket += ")";
    }
    currencyCode = currCode;
    displayMathOperation();
}

function exchangeCurrencyToPLN(currCode) {
    let currency = exchangeRates[0].rates.find(obj => {
        return obj.code === currCode;
    });
    return currency.mid;
}

function checkDisplay(exp) {
    if (displayDOM.textContent !== exp) {
        console.trace();
        console.log("display: '" + displayDOM.textContent + "'", "should be: '" + exp + "'", displayDOM.textContent === exp);
    }
}