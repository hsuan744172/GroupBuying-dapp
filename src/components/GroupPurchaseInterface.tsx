import React, { useState, useEffect } from 'react';
import { ethers, Contract } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import GroupPurchaseABI from '../artifacts/contracts/GroupPurchase.sol/GroupPurchase.json';
import deployments from '../artifacts/deployments.json';
import { Toaster, toast } from 'react-hot-toast';

export default function GroupPurchaseInterface() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [goalAmount, setGoalAmount] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [deadline, setDeadline] = useState('');
  const [totalFunds, setTotalFunds] = useState('');
  const [participants, setParticipants] = useState(0);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  const [owner, setOwner] = useState('');
  const [supplier, setSupplier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');

  const { account, library: provider, active } = useWeb3React();

  useEffect(() => {
    const init = async () => {
      if (!active || !provider || !account) return;
      
      setIsLoading(true);
      try {
        const network = await provider.getNetwork();
        const contractAddress = deployments[network.chainId]?.GroupPurchase;
        
        if (!contractAddress) {
          throw new Error("Contract not deployed on this network");
        }

        const signer = provider.getSigner();
        const contractInstance = new ethers.Contract(
          contractAddress, 
          GroupPurchaseABI.abi, 
          signer
        );
        
        setContract(contractInstance);

        // 獲取合約信息
        const ownerAddress = await contractInstance.owner();
        const info = await contractInstance.getContractInfo();
        
        setOwner(ownerAddress);
        setSupplier(info._supplier);
        setGoalAmount(ethers.utils.formatEther(info._goalAmount));
        setItemPrice(ethers.utils.formatEther(info._itemPrice));
        const deadlineTimestamp = info._deadline.toNumber() * 1000;
        setDeadline(new Date(deadlineTimestamp).toISOString());
        setTotalFunds(ethers.utils.formatEther(info._totalFunds));
        setParticipants(info._participantCount.toNumber());

        // 獲取餘額
        const balanceWei = await provider.getBalance(account);
        setBalance(ethers.utils.formatEther(balanceWei));

        // 監聽事件
        contractInstance.on("ContributionReceived", (contributor, amount) => {
          if (contributor === account) {
            toast.success(`成功貢獻 ${ethers.utils.formatEther(amount)} ETH!`);
          }
          updateContractInfo(contractInstance);
        });
      } catch (error) {
        toast.error(`初始化失敗: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    init();

    return () => {
      if (contract) {
        contract.removeAllListeners();
      }
    };
  }, [active, provider, account]);

  useEffect(() => {
    if (!deadline) return;

    const updateTimeRemaining = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const timeDiff = deadlineTime - now;

      if (timeDiff <= 0) {
        setIsDeadlinePassed(true);
        setTimeRemaining('已結束');
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setTimeRemaining(`${days}天 ${hours}時 ${minutes}分 ${seconds}秒`);
      setIsDeadlinePassed(false);
    };

    const timer = setInterval(updateTimeRemaining, 1000);
    updateTimeRemaining(); // 立即執行一次

    return () => clearInterval(timer);
  }, [deadline]);

  const updateContractInfo = async (contractInstance) => {
    const info = await contractInstance.getContractInfo();
    setTotalFunds(ethers.utils.formatEther(info._totalFunds));
    setParticipants(info._participantCount.toNumber());
  };

  const contribute = async () => {
    if (!contract) return;
    setIsLoading(true);
    try {
      if (isDeadlinePassed) {
        throw new Error("團購已結束，無法繼續參與");
      }
      const tx = await contract.contribute({ 
        value: ethers.utils.parseEther(itemPrice) 
      });
      
      await tx.wait();
      toast.success('參與團購成功！');
      
      // 更新數據
      const funds = await contract.totalFunds();
      const participantCount = await contract.getParticipantCount();
      setTotalFunds(ethers.utils.formatEther(funds));
      setParticipants(participantCount.toNumber());
    } catch (error) {
      toast.error(`參與失敗: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const finalizePurchase = async () => {
    if (!contract) return;
    setIsLoading(true);
    try {
      if (!isDeadlinePassed) {
        throw new Error("團購還未結束，請等待截止時間到達");
      }
      const tx = await contract.finalizeGroupPurchase();
      await tx.wait();
      
      // 檢查是否達到目標金額
      if (Number(totalFunds) >= Number(goalAmount)) {
        toast.success('團購完成！資金已轉給供應商');
      } else {
        toast.success('團購未達成目標金額，資金已自動退還給參與者');
      }
      
      // 更新數據
      const funds = await contract.totalFunds();
      setTotalFunds(ethers.utils.formatEther(funds));
      const participantCount = await contract.getParticipantCount();
      setParticipants(participantCount.toNumber());
    } catch (error) {
      console.error("操作失敗:", error);
      toast.error(`操作失敗: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Toaster position="top-right" />
      
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p>處理中...</p>
          </div>
        </div>
      )}

      {!active && (
        <div className="text-center py-4">
          <p className="text-red-500">請連接MetaMask錢包以使用此應用</p>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">團購智能合約</h1>
        
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <InfoItem label="您的地址" value={account || '未連接'} />
              <InfoItem label="帳戶餘額" value={`${Number(balance).toFixed(4)} ETH`} />
              <InfoItem label="發起人地址" value={owner} />
              <InfoItem label="收款人地址" value={supplier} />
            </div>
            <div className="space-y-4">
              <InfoItem label="目標金額" value={`${goalAmount} ETH`} />
              <InfoItem label="商品價格" value={`${itemPrice} ETH`} />
              <InfoItem label="截止時間" value={formatDeadline(deadline)} />
              <InfoItem label="剩餘時間" value={timeRemaining} />
            </div>
          </div>
          
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold">進度</p>
                <p className="text-gray-600">
                  當前總資金: {totalFunds} ETH / {goalAmount} ETH
                </p>
                <p className="text-gray-600">參與人數: {participants}</p>
              </div>
              <div className="w-1/2">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-blue-500 rounded-full h-4"
                    style={{ 
                      width: `${Math.min((Number(totalFunds) / Number(goalAmount)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={contribute} 
            disabled={isLoading || isDeadlinePassed}
            className={`
              px-6 py-3 rounded-lg font-semibold text-white
              ${isDeadlinePassed 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 transform hover:scale-105 transition-all'}
            `}
          >
            參與團購
          </button>
          <button 
            onClick={finalizePurchase}
            disabled={isLoading || !isDeadlinePassed}
            className={`
              px-6 py-3 rounded-lg font-semibold text-white
              ${!isDeadlinePassed 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 transform hover:scale-105 transition-all'}
            `}
          >
            完成團購
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDeadline(dateString: string): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString();
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-600 text-sm">{label}</p>
      <p className="font-medium truncate" title={value}>
        {value}
      </p>
    </div>
  );
}