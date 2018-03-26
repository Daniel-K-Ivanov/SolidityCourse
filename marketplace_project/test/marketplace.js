const Marketplace = artifacts.require("Marketplace");

function assertProductsEqual(p1, arrayProduct2) {
	assert(p1.name == arrayProduct2[0], "names should be equal");
	assert(p1.price == arrayProduct2[1], "prices should be equal");
	assert(p1.quantity == arrayProduct2[2], "quantities should be equal");
}

function findEvent(tx, eventToSearchFor) {
	let events = tx.logs.filter(e => {
		return e.event = eventToSearchFor.name;
	});
	assert(events.length > 0, "No events with name ${eventToSearchFor.name} were found");
	return events;
}

function findEventAndGetArguments(tx, eventToSearch) {
	return findEvent(tx, eventToSearch)[0].args;
}

async function executeAndExpectThrow(fn) {
	let hasFailed = false;
	await fn().catch(err => {
		const invalidOpcode = err.message.search('invalid opcode') >= 0;
		const outOfGas = err.message.search('out of gas') >= 0;
		const revert = err.message.search('revert') >= 0;
		assert(invalidOpcode || outOfGas || revert, 'Expected throw, got \'' + err + '\' instead');
		hasFailed = true;
	});
	assert(hasFailed, "An error was expected, but there was not");
}

const Products = {
	basicProduct : {
		name: "basicProduct",
		price : 15000,
		quantity: 15
	},
	zeroPriceProduct : {
		name: "zeroPriceProduct",
		price : 0,
		quantity: 15
	},
	emptyNameProduct : {
		name : "",
		price : 1000,
		quantity : 1
	},
	zeroQuantityProduct : {
		name : "zeroQuantityProduct",
		price : 1200,
		quantity : 0
	}
};

const Events = {
	productCreated : {
		name : "ProductCreated",
		args : ["itemId"]
	},
	productPurchased : {
		name : "ProductPurchased",
		args : ["customerAdr", "itemId", "quantity"]
	},
	productUpdated : {
		name : "ProductQuantityUpdated",
		args : ["itemId", "oldQuantity", "newQuantity"]
	},
	ownershipTransferred : {
		name : "OwnershipTransferred",
		args : ["previousOwner", "newOwner"]
	},
	fundsWithdrawal : {
		name : "FundsWithdrawal",
		args : ["adr", "amonut"]
	}
};

/**
*	Contract Util functions [START]
*/
async function createProduct(contractInstance, product, sender) {
	let productTx = await contractInstance.createProduct(product.name, product.price, product.quantity, {from : sender});
	let eventArgs = findEventAndGetArguments(productTx, Events.productCreated);
	assert(eventArgs.itemId, "An event argument itemId was expected, but not found");
	return eventArgs.itemId;
}

async function createProductNegative(contractInstance, product, sender) {
	await contractInstance.createProduct(product.name, product.price, product.quantity, {from : sender});
}

/**
*	Contract Util functions [END]
*/

contract('Test Owner logic', async (accounts) => {
	let marketplace;
	beforeEach(async () => {
		marketplace = await Marketplace.new(accounts[0]);
	})

	it("Check owner after deploy", async () => {
		let owner = await marketplace.owner.call();
		assert(owner == accounts[0]);
	})

	it("Withdraw funds with owner", async () => {
		let withdrawTx = await marketplace.withdrawFunds();
		let adr = findEventAndGetArguments(withdrawTx, Events.fundsWithdrawal).adr;
		assert(adr == accounts[0], "Addresses do not match, after withdraw tx");
	})

	it("[Negative] Withdraw funds with non-owner", async () => {
		await executeAndExpectThrow(async () => {await marketplace.withdrawFunds({from: accounts[1]})});
	})
})

contract('Test Products logic', async (accounts) => {
	let marketplace;
	beforeEach(async () => {
		marketplace = await Marketplace.new(accounts[0]);
	})

	it("[Negative] Get non-existing product", async () => {
		await executeAndExpectThrow(async () => {await marketplace.getProduct.call("fakeID")});
	})

	it("Create product", async () => {
		let basicProductId = await createProduct(marketplace, Products.basicProduct, accounts[0]);
		let createdProduct = await marketplace.getProduct.call(basicProductId);
		await assertProductsEqual(Products.basicProduct, createdProduct);
	})

	it("Create product with zero quantity", async () => {
		let zeroQuantityProductId = await createProduct(marketplace, Products.zeroQuantityProduct, accounts[0]);
		let createdProduct = await marketplace.getProduct.call(zeroQuantityProductId);
		await assertProductsEqual(Products.zeroQuantityProduct, createdProduct);
	})

	it("[Negative] Create product with non-owner", async () => {
		await executeAndExpectThrow(async () => {await createProductNegative(marketplace, Products.basicProduct, accounts[1])});
	})

	it("[Negative] Create product with empty name", async () => {
		await executeAndExpectThrow(async () => {await createProductNegative(marketplace, Products.emptyNameProduct, accounts[0])});
	})

	it("[Negative] Create product with zero price", async () => {
		await executeAndExpectThrow(async () => {await createProductNegative(marketplace, Products.zeroPriceProduct, accounts[0])});
	})

	it("Change ownership, and create product with new owner", async () => {
		let changeOwnershipTx = await marketplace.transferOwnership(accounts[1]);
		let newOwnerAddr = findEventAndGetArguments(changeOwnershipTx, Events.ownershipTransferred).newOwner;
		assert(newOwnerAddr == accounts[1], "Owners do not match after transfer of ownership");

		let productId = await createProduct(marketplace, Products.basicProduct, accounts[1]);
		let createdProduct = await marketplace.getProduct.call(productId);
		await assertProductsEqual(Products.basicProduct, createdProduct);
	})

	it("[Negative] Change ownership, and create product with old owner", async () => {
		let changeOwnershipTx = await marketplace.transferOwnership(accounts[2]);
		let newOwnerAddr = findEventAndGetArguments(changeOwnershipTx, Events.ownershipTransferred).newOwner;
		assert(newOwnerAddr == accounts[2], "Owners do not match after transfer of ownership");

		await executeAndExpectThrow(async () => {await createProductNegative(marketplace, Products.basicProduct, accounts[1])});
	})

	it("Check all created product IDs", async () => {
		let product1Id = await createProduct(marketplace, Products.basicProduct, accounts[0]);
		let ids = await marketplace.getProducts.call();
		assert(ids.length == 1, "Number of product ids should be 1");
		assert(ids[0] == product1Id, "Product Ids should match");

		let product2Id = await createProduct(marketplace, Products.zeroQuantityProduct, accounts[0]);
		ids = await marketplace.getProducts.call();
		assert(ids.length == 2, "Number of product ids should be 2");
		assert(ids[1] == product2Id, "Product Ids should match");

		let product3Id = await createProduct(marketplace, Products.basicProduct, accounts[0]);
		ids = await marketplace.getProducts.call();
		assert(ids.length == 3, "Number of product ids should be 3");
		assert(ids[2] == product3Id, "Product Ids should match");

		let product4Id = await createProduct(marketplace, Products.zeroQuantityProduct, accounts[0]);
		ids = await marketplace.getProducts.call();
		assert(ids.length == 4, "Number of product ids should be 4");
		assert(ids[3] == product4Id, "Product Ids should match");

		await executeAndExpectThrow(async () => {await createProduct(marketplace, Products.zeroPriceProduct, accounts[0])});
		ids = await marketplace.getProducts.call();
		assert(ids.length == 4, "Number of product ids should be 4");
	})
})

contract('Test Update quantity logic', async (accounts) => {
	let marketplace;
	let productId;
	beforeEach(async () => {
		marketplace = await Marketplace.new(accounts[0]);
		productId = await createProduct(marketplace, Products.basicProduct, accounts[0]);
	})

	it("Update quantity with owner", async () => {
		let updateTx = await marketplace.update(productId, 10, {from: accounts[0]});
		let updateEvent = findEventAndGetArguments(updateTx, Events.productUpdated);

		assert(updateEvent.itemId == productId, "Product Ids do not match, after update quantity");
		assert(updateEvent.oldQuantity == Products.basicProduct.quantity, "Old quantities do not match");
		assert(updateEvent.newQuantity == 10, "Logged quantity in event do not match the requested quantity");

		let product = await marketplace.getProduct.call(productId);
		assert(product[2] == 10, "Product quantity do not match the requested one");
	})

	it("Update quantity to 0", async () => {
		await marketplace.update(productId, 0, {from: accounts[0]});
		let product = await marketplace.getProduct.call(productId);
		assert(product[2] == 0, "Product quantity do not match the requested one");
	})

	it("[Negative] update product quantity with non-owner", async () => {
		await executeAndExpectThrow(async () => {await marketplace.update(productId, 10, {from: accounts[1]})});
	})

	it("Change ownership and update quantity with new owner", async () => {
		let changeOwnershipTx = await marketplace.transferOwnership(accounts[1]);
		let newOwnerAddr = findEventAndGetArguments(changeOwnershipTx, Events.ownershipTransferred).newOwner;
		assert(newOwnerAddr == accounts[1], "Owners do not match after transfer of ownership");

		await marketplace.update(productId, 999999, {from: accounts[1]});
		let product = await marketplace.getProduct.call(productId);
		assert(product[2] == 999999, "Product quantity do not match the requested one");
	})

	it("[Negative] change ownership, execute update quantity with old owner", async () => {
		let changeOwnershipTx = await marketplace.transferOwnership(accounts[1]);
		let newOwnerAddr = findEventAndGetArguments(changeOwnershipTx, Events.ownershipTransferred).newOwner;
		assert(newOwnerAddr == accounts[1], "Owners do not match after transfer of ownership");

		await executeAndExpectThrow(async () => {await marketplace.update(productId, 20, {from: accounts[0]})});
	})
})

contract("Test Buy product logic", async (accounts) => {

	let marketplace;
	beforeEach(async () => {
		marketplace = await Marketplace.new(accounts[0]);
	})

	it("buy product", async () => {
		let productId = await createProduct(marketplace, Products.basicProduct, accounts[0]);
		let buyTx= await marketplace.buy(productId, 10, {value : Products.basicProduct.price * 10});
		let purchaseEvent = findEventAndGetArguments(buyTx, Events.productPurchased);

		assert(purchaseEvent.customerAdr == accounts[0], "Purchase address does not match with event argument");
		assert(purchaseEvent.itemId == productId, "Product ID does not match with event argument");
		assert(purchaseEvent.quantity == 10, "Quantity does not match with event argument");

		let product = await marketplace.getProduct.call(productId);
		assert(product[2] == 5, "Quantities do not match after buy");
	})

	it("[Negative] buy product with not enough value", async () => {
		let productId = await createProduct(marketplace, Products.basicProduct, accounts[0]);
		await executeAndExpectThrow(async () => {await marketplace.buy(productId, 10, {value : Products.basicProduct.price * 5})});
	})

	it("[Negative] buy non-existing product", async () => {
		await executeAndExpectThrow(async () => {await marketplace.buy("0xnonexistingid", 10, {value : 100000})});
	})

	it("[Negative] buy product after quantity update", async () => {
		let zeroQuantityProductId = await createProduct(marketplace, Products.zeroQuantityProduct, accounts[0]);
		await executeAndExpectThrow(async () => {await marketplace.buy(zeroQuantityProductId, 10, {value : 100000})});

		await marketplace.update(zeroQuantityProductId, 1000, {from: accounts[0]});
		await marketplace.buy(zeroQuantityProductId, 100, {value : 1200*100});

		let product = await marketplace.getProduct.call(zeroQuantityProductId);
		assert(product[2] == 900, "quantity was not reduced after buying");
	})

	it("[Negative] buy product that does not have quantity", async () => {
		let zeroQuantityProductId = await createProduct(marketplace, Products.zeroQuantityProduct, accounts[0]);
		await executeAndExpectThrow(async () => {await marketplace.buy(zeroQuantityProductId, 10, {value: 100000})});
	})

	it("[Negative] buy product with zero quantity", async () => {
		let productId = await createProduct(marketplace, Products.basicProduct, accounts[0]);
		await executeAndExpectThrow(async () => {await marketplace.buy(productId, 0, {value: 100000})});
	})
})

contract("Test Calculate price logic", async (accounts) => {
	let marketplace;
	beforeEach(async () => {
		marketplace = await Marketplace.new(accounts[0]);
	})

	it("calculate prices of products", async () => {
		let productId = await createProduct(marketplace, Products.basicProduct, accounts[0]);
		let price = await marketplace.getPrice.call(productId, 150);
		assert(price == Products.basicProduct.price * 150, "Calculated price was not correct");

		let zeroQuantityProductId = await createProduct(marketplace, Products.zeroQuantityProduct, accounts[0]);
		price = await marketplace.getPrice.call(zeroQuantityProductId, 1);
		assert(price == Products.zeroQuantityProduct.price, "Calculated price was not correct");
	})
})
