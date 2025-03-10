import { ethers, upgrades } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer, supplier] = await ethers.getSigners();
  
  // 部署合約
  const GroupPurchase = await ethers.getContractFactory("GroupPurchase");
  const groupPurchase = await upgrades.deployProxy(GroupPurchase, [
    deployer.address,    // 初始擁有者
    supplier.address,    // 供應商地址
    10,                 // 目標金額 10 ETH
    600,              // 期限 10 分鐘
    1                  // 商品價格 1 ETH
  ]);
  
  await groupPurchase.deployed();

  console.log("GroupPurchase deployed to:", groupPurchase.address);
  console.log("Owner:", deployer.address);
  console.log("Supplier:", supplier.address);

  // 獲取當前網絡ID
  const network = await ethers.provider.getNetwork();
  
  // 確保目錄存在
  const artifactsDir = path.join(__dirname, "../src/artifacts");
  if (!fs.existsSync(artifactsDir)){
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  // 準備部署信息
  const deployments = {
    [network.chainId]: {
      GroupPurchase: groupPurchase.address
    }
  }

  // 將部署信息寫入文件
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
