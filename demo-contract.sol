// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title VulnerableToken
 * @dev A demonstration contract with various security issues for testing the auditor
 */
contract VulnerableToken {
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;
    
    uint256 public totalSupply;
    string public name = "Vulnerable Token";
    string public symbol = "VULN";
    uint8 public decimals = 18;
    
    address public owner;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(uint256 _initialSupply) {
        totalSupply = _initialSupply;
        balances[msg.sender] = _initialSupply;
        owner = msg.sender;
    }
    
    // Critical: No access control - anyone can mint tokens
    function mint(address to, uint256 amount) public {
        totalSupply += amount;
        balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }
    
    // High: Potential integer overflow (though Solidity 0.8+ has built-in protection)
    function transfer(address to, uint256 amount) public returns (bool) {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] -= amount;
        balances[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    // Medium: Missing return value check
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(balances[from] >= amount, "Insufficient balance");
        require(allowances[from][msg.sender] >= amount, "Insufficient allowance");
        
        balances[from] -= amount;
        balances[to] += amount;
        allowances[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    // Low: Missing event emission
    function approve(address spender, uint256 amount) public returns (bool) {
        allowances[msg.sender][spender] = amount;
        return true;
    }
    
    // Critical: Reentrancy vulnerability
    function withdraw() public {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance to withdraw");
        
        balances[msg.sender] = 0;
        
        // Vulnerable external call before state update
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    // High: Unrestricted access to owner functions
    function setOwner(address newOwner) public {
        owner = newOwner;
    }
    
    // Medium: Gas optimization issue - unnecessary storage reads
    function getBalance(address account) public view returns (uint256) {
        return balances[account];
    }
    
    // Low: Missing input validation
    function burn(uint256 amount) public {
        balances[msg.sender] -= amount;
        totalSupply -= amount;
    }
    
    // Critical: Uninitialized storage pointer
    function getStorageData() public view returns (bytes32) {
        bytes32 data;
        return data;
    }
    
    // High: Timestamp dependency
    function timeBasedFunction() public view returns (bool) {
        return block.timestamp > 1000000000;
    }
    
    // Medium: Missing zero address checks
    function setNewToken(address newToken) public {
        // Should check if newToken != address(0)
    }
    
    // Low: Inconsistent naming convention
    function get_total_supply() public view returns (uint256) {
        return totalSupply;
    }
}
