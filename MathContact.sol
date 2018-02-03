pragma solidity 0.4.19;

contract MathContract {
    
    int256 a = 0;
    
    
    function reInitVariable() public {
        a = 0;
    }
    
    function getVariableValue() public returns (int256) {
        return a;
    }
    
    //TODO add overflow
    function add(int256 b) public {
        a += b;
    }
    
    //TODO add underflow
    function substract(int256 b) public {
        a -= b;
    }
    
    //TODO add overflow
    function multiply(int256 b) public {
        a *= b;
    }
    
    //TODO add divide by 0 check
    function divide(int256 b) public {
        a /= b;
    }
    
    //TOOD check for overflow
    function raise(uint256 b) public {
        //a = a ** b;
    }
    
    function divideAndRetrieveDiff(int256 b) public {
        a %= b;
    }
}