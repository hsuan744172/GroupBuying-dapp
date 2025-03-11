import { ethers, upgrades } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Deploying to Volta testnet...");
  const supplierAddress = process.env.M2_ADDRESS;

  // 獲取部署賬戶
  const [deployer] = await ethers.getSigners();
  
  const GroupPurchase = await ethers.getContractFactory("GroupPurchase");
  const groupPurchase = await upgrades.deployProxy(GroupPurchase, [
    deployer.address, // 使用部署者的地址而不是私鑰
    supplierAddress,  // MetaMask Account 2作為supplier
    2, // 目標金額 1 ETH 
    600, // 期限 10 分鐘
    1 // 商品價格 0.1 ETH
  ]);

  await groupPurchase.deployed();

  console.log("GroupPurchase deployed to:", groupPurchase.address);
  console.log("Owner (Deployer):", deployer.address);
  console.log("Supplier:", supplierAddress);

  // 將部署信息保存到前端可訪問的位置
  const artifactsDir = path.join(__dirname, "../src/artifacts");
  if (!fs.existsSync(artifactsDir)){
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  // Volta chainId是73799
  const deployments = {
    "73799": {
      GroupPurchase: groupPurchase.address
    }
  }

  const deploymentsPath = path.join(artifactsDir, "deployments.json");
  fs.writeFileSync(
    deploymentsPath,
    JSON.stringify(deployments, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
