// test/grouppurchase.test.ts
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("GroupPurchase", function () {
  it("Should allow users to contribute and finalize purchase", async function() {
    const [owner, supplier, user1, user2] = await ethers.getSigners();
    
    const GroupPurchase = await ethers.getContractFactory("GroupPurchase");
    
    // Deploy with parameters: initialOwner, supplier, goalAmount (in ether), duration (in seconds), itemPrice (in ether)
    const groupPurchase = await upgrades.deployProxy(GroupPurchase, [
      owner.address, 
      supplier.address, 
      2, // Goal: 2 ether
      3600, // Duration: 1 hour
      1 // Item price: 1 ether
    ]);
    await groupPurchase.deployed();
    
    // Users contribute
    await groupPurchase.connect(user1).contribute({ value: ethers.utils.parseEther("1.0") });
    await groupPurchase.connect(user2).contribute({ value: ethers.utils.parseEther("1.0") });
    
    // Fast forward past the deadline
    await time.increase(3601);
    
    // Check participant count
    expect(await groupPurchase.getParticipantCount()).to.equal(2);
    
    // Finalize the purchase
    await groupPurchase.finalizeGroupPurchase();
    
    // Verify supplier received the funds
    // This would need a check on supplier's balance before and after
  });
});