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

//TODO
var abi = [
	{
		"constant": false,
		"inputs": [
			{
				"name": "_pokemon",
				"type": "uint8"
			}
		],
		"name": "claimPokemon",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "_pokemon",
				"type": "uint8"
			}
		],
		"name": "listPokemonOwners",
		"outputs": [
			{
				"name": "",
				"type": "address[]"
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
				"name": "user",
				"type": "address"
			}
		],
		"name": "listUserPokemons",
		"outputs": [
			{
				"name": "",
				"type": "uint32[10]"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "_pokemon",
				"type": "uint8"
			}
		],
		"name": "LogPokemonCaught",
		"type": "event"
	}
];

//TODO
var address = "0x8cdaf0cd259887258bc13a92c0a6da92698644c0";
var acc;

function init(){
	var Contract = web3.eth.contract(abi);
	contractInstance = Contract.at(address);
	updateAccount();
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

function updatePokemonsVisibility (possessions) {
	var pokemonsDiv = document.getElementById("pokemons");
	pokemonsDiv.style.display = "block";
	var counter = 0;
	for (var indx in possessions) {
		if (possessions.hasOwnProperty(indx)) {
			var displayOption = possessions[parseInt(indx)] == 1 ?  "inline-block" : "none";
			document.getElementById("pokemon_" + indx).style.display = displayOption;
			counter += possessions[parseInt(indx)] == 1 ? 1 : 0;
		}
	}
	document.getElementById("noPokemons").style.display = counter == 0 ? "block" : "none";
}

function updateUsers(users) {
	var usersDiv = document.getElementById("users");
	usersDiv.style.display="block";
	var content = "";
	for (var indx in users) {
		if (users.hasOwnProperty(indx)) {
			content += "<br><span>" + users[indx] + "</span><br>";
		}
	}
	usersDiv.innerHTML = content;
	document.getElementById("noUsers").style.display = users.length > 0 ? "none" : "block";
}

function onClaimPressed() {
	updateAccount();
	var dropDown = document.getElementById("claimPokemonDD");
	contractInstance.claimPokemon(dropDown.value, {from : acc}, function (err, result) {
		if (!err) {
			displayMessage("Successfully executed transaction!<br>The tx hash is: " + result, true);
		} else {
			displayMessage("The pokemon could not be claimed!<br> - You can claim a pokemon once in 15 seconds<br> - You cannot claim a pokemon that you posses", false);
		}
	});
}

function onViewUserPokemons() {
	updateAccount();
	var addressInput = document.getElementById("addressInput").value;
	contractInstance.listUserPokemons.call(addressInput, {from: acc}, function (err, result) {
		if (!err) {
			var possessions = JSON.parse(JSON.stringify(result));
			updatePokemonsVisibility(possessions);
		} else {
			displayMessage("Something went wrong!", false);
		}
	});
}

function onClearUserPokemons() {
	document.getElementById("pokemons").style.display = "none";
}

function onViewPokemonUsers() {
	updateAccount();
	var dropDown = document.getElementById("viewPokemonDD");
	contractInstance.listPokemonOwners.call(dropDown.value, {from: acc}, function (err, result) {
		if (!err) {
			updateUsers(result);
		} else {
			displayMessage("Something went wrong!", false);
		}
	});
}

function onClearPokemonUsers() {
	document.getElementById("users").style.display = "none";
	document.getElementById("noUsers").style.display = "none";
}
