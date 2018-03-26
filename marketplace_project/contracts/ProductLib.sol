pragma solidity 0.4.19;

import "./SafeMath.sol";


/**
* @title ProductLib
* @dev Library providing basic functions for creating, updating and calculating price of a product.
*/
library ProductLib {

    using SafeMath for uint;

    struct Product {
        bytes32 id;
        string name;
        uint price;
        uint quantity;
    }

    /**
    * @dev initializes and returns new product
    */
    function createProduct(bytes32 _id, string _name, uint _price, uint _quantity) internal pure returns (Product) {
		assert(bytes(_name).length != 0);
		assert(_price != 0);
		return Product({id : _id, name : _name, price : _price, quantity : _quantity});
    }

    /**
    * @dev Uses Safe Math to calculate the price of product given the quantity.
    */
    function getPrice(Product storage self, uint _quantity) internal view returns (uint) {
        uint _price = self.price.mul(_quantity);

        assert(_price.div(_quantity) == self.price);
        return _price;
    }

    /**
    * @dev Updates the quantity of a product
    */
    function updateQuantity(Product storage self, uint _quantity) internal {
        self.quantity = _quantity;
    }

}
