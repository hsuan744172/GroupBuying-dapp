import React, { useState, useEffect } from 'react';
import { ethers, Contract } from 'ethers';
import GroupPurchaseABI from '../artifacts/contracts/GroupPurchase.sol/GroupPurchase.json';
import deployments from '../artifacts/deployments.json';

export default function GroupPurchaseInterface() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [account, setAccount] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [deadline, setDeadline] = useState('');
  const [totalFunds, setTotalFunds] = useState('');
  const [participants, setParticipants] = useState(0);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  const [owner, setOwner] = useState('');
  const [supplier, setSupplier] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
        
        // 獲取所有可用帳戶
        const accounts = await provider.listAccounts();
        setAccounts(accounts);
        setSelectedAccount(accounts[0]);
        
        // 獲取網絡ID
        const network = await provider.getNetwork();
        // 從部署資訊中獲取合約地址
        const contractAddress = deployments[network.chainId]?.GroupPurchase;
        
        if (!contractAddress) {
          throw new Error("Contract not deployed on this network");
        }

        // 使用選擇的帳戶作為signer
        const signer = provider.getSigner(accounts[0]);
        const contractInstance = new ethers.Contract(contractAddress, GroupPurchaseABI.abi, signer);
        
        setContract(contractInstance);
        setAccount(await signer.getAddress());

        // 獲取 owner 和 supplier 地址
        const ownerAddress = await contractInstance.owner();
        const info = await contractInstance.getContractInfo();
        
        setOwner(ownerAddress);
        setSupplier(info._supplier);
        
        setGoalAmount(ethers.utils.formatEther(info._goalAmount));
        setItemPrice(ethers.utils.formatEther(info._itemPrice));
        setDeadline(new Date(info._deadline.toNumber() * 1000).toLocaleString());
        setTotalFunds(ethers.utils.formatEther(info._totalFunds));
        setParticipants(info._participantCount.toNumber());

        // 監聽事件
        contractInstance.on("ContributionReceived", (contributor, amount) => {
          if (contributor === account) {
            alert(`成功貢獻 ${ethers.utils.formatEther(amount)} ETH!`);
          }
          updateContractInfo(contractInstance);
        });
      } catch (error) {
        console.error("初始化失敗:", error);
        alert(error.message);
      }
    };
    init();

    // Cleanup
    return () => {
      if (contract) {
        contract.removeAllListeners();
      }
    };
  }, []);

  useEffect(() => {
    // 添加檢查截止時間的邏輯
    const checkDeadline = () => {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      setIsDeadlinePassed(now > deadlineDate);
    };

    // 每秒更新截止時間狀態
    const timer = setInterval(checkDeadline, 1000);

    return () => {
      clearInterval(timer);
      if (contract) {
        contract.removeAllListeners();
      }
    };
  }, [deadline]);

  // 切換帳戶
  const handleAccountChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newAccount = event.target.value;
    setSelectedAccount(newAccount);
    
    if (contract) {
      const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
      const signer = provider.getSigner(newAccount);
      const newContract = contract.connect(signer);
      setContract(newContract);
      setAccount(newAccount);
    }
  };

  const updateContractInfo = async (contractInstance) => {
    const info = await contractInstance.getContractInfo();
    setTotalFunds(ethers.utils.formatEther(info._totalFunds));
    setParticipants(info._participantCount.toNumber());
  };

  const contribute = async () => {
    if (!contract) return;
    try {
      if (isDeadlinePassed) {
        throw new Error("團購已結束，無法繼續參與");
      }
      const tx = await contract.contribute({ 
        value: ethers.utils.parseEther(itemPrice) 
      });
      await tx.wait();
      alert('貢獻成功！');
      
      // 更新數據
      const funds = await contract.totalFunds();
      const participantCount = await contract.getParticipantCount();
      setTotalFunds(ethers.utils.formatEther(funds));
      setParticipants(participantCount.toNumber());
    } catch (error) {
      console.error("貢獻失敗:", error);
      alert(`貢獻失敗: ${error.message}`);
    }
  };

  const finalizePurchase = async () => {
    if (!contract) return;
    try {
      if (!isDeadlinePassed) {
        throw new Error("團購還未結束，請等待截止時間到達");
      }
      const tx = await contract.finalizeGroupPurchase();
      await tx.wait();
      alert('團購已完成！');
      
      // 更新數據
      const funds = await contract.totalFunds();
      setTotalFunds(ethers.utils.formatEther(funds));
    } catch (error) {
      console.error("完成失敗:", error);
      alert(`完成失敗: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">團購合約界面</h1>
      
      {/* 添加帳戶選擇器 */}
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          選擇帳戶:
        </label>
        <select 
          value={selectedAccount}
          onChange={handleAccountChange}
          className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          {accounts.map((acc, index) => (
            <option key={acc} value={acc}>
              Account {index}: {acc}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <p><strong>您的地址:</strong> {account}</p>
        <p><strong>發起人地址:</strong> {owner}</p>
        <p><strong>收款人地址:</strong> {supplier}</p>
        <p><strong>目標金額:</strong> {goalAmount} ETH</p>
        <p><strong>商品價格:</strong> {itemPrice} ETH</p>
        <p><strong>截止時間:</strong> {deadline}</p>
        <p><strong>當前總資金:</strong> {totalFunds} ETH</p>
        <p><strong>參與人數:</strong> {participants}</p>
      </div>
      
      <div className="flex space-x-4">
        <button 
          onClick={contribute} 
          disabled={isDeadlinePassed}
          className={`px-4 py-2 rounded ${
            isDeadlinePassed 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-700'
          } text-white`}
        >
          參與團購
        </button>
        <button 
          onClick={finalizePurchase}
          disabled={!isDeadlinePassed}
          className={`px-4 py-2 rounded ${
            !isDeadlinePassed 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-500 hover:bg-green-700'
          } text-white`}
        >
          完成團購
        </button>
      </div>
    </div>
  );
}