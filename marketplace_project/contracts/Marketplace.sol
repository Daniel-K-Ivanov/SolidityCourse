pragma solidity 0.4.19;

import "./Ownable.sol";
import "./SafeMath.sol";
import "./ProductLib.sol";

/**
* @title Marketplace
* @dev Implemets basic logic for creating, updating and buying products
*/
contract Marketplace is Ownable {

    using ProductLib for ProductLib.Product;
    using SafeMath for uint;

    mapping(bytes32 => ProductLib.Product) products;
    bytes32[] productIDs;

    modifier productExists (bytes32 _id) {
        require(products[_id].id == _id);
        _;
    }

    event ProductCreated(bytes32 indexed itemId);
    event ProductPurchased(address indexed customerAdr, bytes32 indexed itemId, uint quantity);
    event ProductQuantityUpdated(bytes32 indexed itemId, uint oldQuantity, uint newQuantity);
	event FundsWithdrawal(address indexed adr, uint amount);
	/**
	* @dev Creates new product with a unique ID. Returns the ID of the created product.
	*/
	function createProduct(string _name, uint _price, uint _quantity) public onlyOwner returns(bytes32) {
		bytes32 ID = generateID(_name);

		//Check if product exists with same id;
		assert(products[ID].id != ID);

		ProductLib.Product memory createdProduct = ProductLib.createProduct(ID, _name, _price, _quantity);

		products[ID] = createdProduct;
		productIDs.push(ID);

		ProductCreated(ID);
		return ID;
	}

    /**
    * @dev Only owner. Updates the quantity of a product.
    */
    function update(bytes32 _id, uint _quantity) public onlyOwner productExists(_id) {
        uint currentQuantity = products[_id].quantity;
        products[_id].updateQuantity(_quantity);

        ProductQuantityUpdated(_id, currentQuantity, _quantity);
    }

	/**
	* @dev msg.sender buys certain product by id. Check if the quantity is available, and the correct value is provided.
	*   Reduces the quantity of the product. Emits purchase Event
	*/
	function buy(bytes32 _id, uint _quantity) public payable productExists(_id) {
		ProductLib.Product storage product = products[_id];
		require(_quantity != 0);
		require(_quantity <= product.quantity);

		uint price = product.getPrice(_quantity);
		require(msg.value >= price);

		product.quantity = product.quantity.sub(_quantity);
		ProductPurchased(msg.sender, _id, _quantity);
	}

    /**
    * @dev Returns the name, price and quantity of a product by id.
    */
    function getProduct(bytes32 id) public view productExists(id) returns(string _name, uint _price, uint _quantity) {
        return (products[id].name, products[id].price, products[id].quantity);
    }

    /**
    * @dev Returns all product IDs.
    */
    function getProducts() public view returns(bytes32[]) {
        return productIDs;
    }

    /**
    * @dev Calculates and retrieves the price for a product by ID and quantity.
    */
    function getPrice(bytes32 _id, uint _quantity) public view productExists(_id) returns (uint) {
        return products[_id].getPrice(_quantity);
    }

    /**
    * @dev Only Owner. Transfers funds from the contract to the owner.
    */
    function withdrawFunds() public onlyOwner {
		uint withdrawnFunds = address(this).balance;
		owner.transfer(withdrawnFunds);
		FundsWithdrawal(owner, withdrawnFunds);
    }

    /**
    * @dev Internal helper function. Generates unique Hash used for product IDs.
    */
    function generateID(string _name) internal view returns (bytes32) {
        uint blockNumber = block.number;
        bytes32 blockHashNow = block.blockhash(blockNumber);
        bytes32 blockHashPrevious = block.blockhash(blockNumber - 1);

        return keccak256(_name, now, blockHashNow, blockHashPrevious);
     }

}
