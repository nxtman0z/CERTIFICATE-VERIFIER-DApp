import { BrowserProvider } from "ethers";

export async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not found");
    return null;
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    return { provider, signer, address };
  } catch (err) {
    console.error("Wallet connect error:", err);
    return null;
  }
}
