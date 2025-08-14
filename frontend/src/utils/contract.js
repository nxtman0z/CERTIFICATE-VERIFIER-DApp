import { Contract } from "ethers";
import contractABI from "../contractABI.json";

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

export function getContract(signerOrProvider) {
  return new Contract(CONTRACT_ADDRESS, contractABI, signerOrProvider);
}

export async function issueCertificate(signer, toAddress, ipfsHash) {
  const contract = getContract(signer);
  const tx = await contract.issueCertificate(toAddress, ipfsHash);
  await tx.wait();
  return tx.hash;
}

export async function getCertificates(provider, walletAddress) {
  const contract = getContract(provider);
  const certs = await contract.getCertificates(walletAddress);
  return certs;
}