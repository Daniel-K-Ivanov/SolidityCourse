//this function will be called when the whole page is loaded
window.onload = function(){
	if (typeof web3 === 'undefined') {
		//if there is no web3 variable
		displayMessage("Error! Are you sure that you are using metamask?", false);
	} else {
		displayMessage("Successfully connected to Ethereum blockchain!", true);
		init();
	}
}

var contractInstance;

var abi = [
	{
		"constant": false,
		"inputs": [
			{
				"name": "_id",
				"type": "bytes32"
			},
			{
				"name": "_quantity",
				"type": "uint256"
			}
		],
		"name": "buy",
		"outputs": [],
		"payable": true,
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "withdrawFunds",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "id",
				"type": "bytes32"
			}
		],
		"name": "getProduct",
		"outputs": [
			{
				"name": "_name",
				"type": "string"
			},
			{
				"name": "_price",
				"type": "uint256"
			},
			{
				"name": "_quantity",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "_name",
				"type": "string"
			},
			{
				"name": "_price",
				"type": "uint256"
			},
			{
				"name": "_quantity",
				"type": "uint256"
			}
		],
		"name": "createProduct",
		"outputs": [
			{
				"name": "",
				"type": "bytes32"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "_id",
				"type": "bytes32"
			},
			{
				"name": "_quantity",
				"type": "uint256"
			}
		],
		"name": "update",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "getProducts",
		"outputs": [
			{
				"name": "",
				"type": "bytes32[]"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "_id",
				"type": "bytes32"
			},
			{
				"name": "_quantity",
				"type": "uint256"
			}
		],
		"name": "getPrice",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "itemId",
				"type": "bytes32"
			}
		],
		"name": "ProductCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "customerAdr",
				"type": "address"
			},
			{
				"indexed": true,
				"name": "itemId",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"name": "quantity",
				"type": "uint256"
			}
		],
		"name": "ProductPurchased",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "itemId",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"name": "oldQuantity",
				"type": "uint256"
			},
			{
				"indexed": false,
				"name": "newQuantity",
				"type": "uint256"
			}
		],
		"name": "ProductQuantityUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "adr",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "FundsWithdrawal",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	}
];

var address = "0xaa588d3737b611bafd7bd713445b314bd453a5c8";
var acc;

function init(){
	var Contract = web3.eth.contract(abi);
	contractInstance = Contract.at(address);
	updateAccount();

	loadProductIDs()
}

function updateAccount(){
	//in metamask, the accounts array is of size 1 and only contains the currently selected account. The user can select a different account and so we need to update our account variable
	acc = web3.eth.accounts[0];
}

function displayMessage(message, isSuccess){
	var el = document.getElementById("message");
	el.innerHTML = message;
	el.style.color = isSuccess ? "green" : "red";
}

function handleError(err) {
	console.log("Something went wrong. Details: " + err);
}

function loadProductIDs() {
	contractInstance.getProducts.call((err, result) => {
		if (err) {
			handleError(err);
		} else {
			loadProductsDetails(result);
		}
	});
}

function loadProductsDetails (ids) {
	if (ids.length == 0) {
		displayMessage("There are no contracts to display!", false);
	} else {
		ids.map(id => {
			loadProductDetails(id);
		})
	}
}

function loadProductDetails(id) {
	contractInstance.getProduct.call(id, (err, result) => {
		if (err) {
			handleError(err);
		} else {
			let product = {
				id: id,
				name:result[0],
				price: web3.fromWei(result[1], 'ether').toNumber(),
				quantity: result[2].toNumber()
			};
			displayProduct(product);
		}
	})
}

function displayProduct(product) {
	let table = document.getElementById("productsTable");

	let row = table.insertRow(-1);
	let nameCell = row.insertCell(0);
	nameCell.innerHTML = product.name;
	let priceCell = row.insertCell(1);
	priceCell.innerHTML = product.price;
	let quantityCell = row.insertCell(2);
	quantityCell.innerHTML = product.quantity;
	let buyCell = row.insertCell(3);
	buyCell.style.width="25%";

	let inputTxt = document.createElement("input");
	inputTxt.type = "text";
	buyCell.appendChild(inputTxt);

	let btn = document.createElement("input");
	btn.type = "button";
	btn.value = "Buy";
	btn.name = "btn";
	btn.onclick = function() {
		executeBuy(product.id, inputTxt.value);
		inputTxt.value = "";
	};
	btn.style.marginLeft = "15px";
	btn.style.width = "50px";
	buyCell.appendChild(btn);
}

function executeBuy(id, quantity) {
	updateAccount();
	contractInstance.getPrice.call(id, quantity, (err, result) => {
		if (err) {
			handleError(err);
		} else {
			contractInstance.buy(id, quantity, {from: acc, value: result}, (err, result) => {
				if (err) {
					handleError(err);
				} else {
					displayMessage("Successfully bought product! Tx hash is: " + result, true);
				}
			})
		}
	})
}
