// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @custom:security-contact your-email@example.com
contract GroupPurchase is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    address public supplier;
    uint public goalAmount;
    uint public deadline;
    uint public totalFunds;
    uint public itemPrice; // 商品價格
    mapping(address => uint) public contributions;
    address[] public participants; // 儲存所有參與者的地址
    
    event ContributionReceived(address contributor, uint amount);
    event PurchaseFinalized(bool success, uint totalAmount);
    event RefundProcessed(address participant, uint amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address initialOwner,
        address _supplier, 
        uint _goalAmount, 
        uint _duration, 
        uint _itemPrice
    ) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        
        supplier = _supplier;
        goalAmount = _goalAmount * 1 ether;
        itemPrice = _itemPrice * 1 ether; // 商品價格設定為 ether 單位
        deadline = block.timestamp + _duration;
    }

    // 是否在截止時間前
    modifier beforeDeadline() {
        require(block.timestamp < deadline, "Contribution period ended");
        _;
    }

    // 繳款金額是否符合商品價格
    modifier correctAmount() {
        require(msg.value == itemPrice, "Contribution must match the item price");
        _;
    }

    // 參與者進行繳款
    function contribute() public payable beforeDeadline correctAmount {
        contributions[msg.sender] += msg.value;
        totalFunds += msg.value;

        // 第一次參與，參與者地址加入列表
        if (contributions[msg.sender] == msg.value) {
            participants.push(msg.sender);
        }
        
        emit ContributionReceived(msg.sender, msg.value);
    }

    // 最終購買，將錢轉移給供應商或退款
    function finalizeGroupPurchase() public {
        require(block.timestamp >= deadline, "Contribution period still active");
        
        bool success = totalFunds >= goalAmount;
        
        if (success) {
            payable(supplier).transfer(totalFunds); // 達成目標，資金轉給供應商進行購買
        } else {
            refund(); // 未達成目標，退款給參與者
        }
        
        emit PurchaseFinalized(success, totalFunds);
    }

    // 退款
    function refund() private {
        for (uint i = 0; i < participants.length; i++) {
            address participant = participants[i];
            uint amount = contributions[participant];
            payable(participant).transfer(amount);
            contributions[participant] = 0;
            
            emit RefundProcessed(participant, amount);
        }
        // 清空參與者列表
        delete participants;
        totalFunds = 0;
    }
    
    // 取得參與者數量
    function getParticipantCount() public view returns (uint) {
        return participants.length;
    }
    
    // 更新供應商地址 (僅限擁有者)
    function updateSupplier(address _newSupplier) public onlyOwner {
        supplier = _newSupplier;
    }
    
    // 延長截止時間 (僅限擁有者)
    function extendDeadline(uint _additionalTime) public onlyOwner {
        deadline += _additionalTime;
    }

    // 新增 getter 函數
    function getContractInfo() public view returns (
        address _supplier,
        uint _goalAmount,
        uint _deadline,
        uint _totalFunds,
        uint _itemPrice,
        uint _participantCount
    ) {
        return (
            supplier,
            goalAmount,
            deadline,
            totalFunds,
            itemPrice,
            participants.length
        );
    }

    function getContributionAmount(address participant) public view returns (uint) {
        return contributions[participant];
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}