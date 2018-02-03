pragma solidity 0.4.19;

contract MathContract {
    
    function add(int256 a, int256 b) public returns (int256) {
        return a + b;
    }
    
    function substract(int256 a, int256 b) public returns (int256) {
        return a - b;
    }
    
    function multiply(int256 a, int256 b) public returns (int256) {
        return a * b;
    }
    
    function divide(int256 a, int256 b) public returns (int256) {
        // add b = 0 check?
        return a / b;
    }
    
    function raise(uint256 a, uint256 b) public returns (uint256) {
        return a ** b;
    }
    
    function divideAndRetrieveDiff(int256 a, int256 b) public returns (int256) {
        return a % b;
    }
}