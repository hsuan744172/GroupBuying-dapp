import { Web3ReactProvider } from "@web3-react/core";
import dynamic from "next/dynamic";

import Demo, { getLibrary } from "../components/Demo";
import GroupPurchaseInterface from "../components/GroupPurchaseInterface";
import Header from "../components/Header";

const ThemeToggle = dynamic(async () => import("../components/ThemeToggle"), {
  ssr: false,
});

function App() {
  return (
    <>
      <ThemeToggle />
      <Web3ReactProvider getLibrary={getLibrary}>
        <div className="container mx-auto min-h-screen">
          <Header />
          {/* 添加團購界面組件 */}
          <GroupPurchaseInterface />
          
          {/* Demo 組件 */}
          <div className="mt-4">
            <Demo />
          </div>
          
          <div className="hero">
            <div className="text-center hero-content">
              <div className="py-8 px-4 max-w-md">
                <figure className="mb-5">
                  <img
                    src="/logo.png"
                    alt="logo"
                    className="mask mask-squircle"
                  />
                </figure>
                <h1 className="mb-5 text-5xl font-bold">團購 DApp</h1>
                <p className="mb-5">
                  一個基於區塊鏈的團購智能合約應用
                </p>
              </div>
            </div>
          </div>
        </div>
        <footer className="p-10 footer bg-base-200 text-base-content">
          {/* 原有的頁腳內容 */}
        </footer>
      </Web3ReactProvider>
    </>
  );
}

export default App;