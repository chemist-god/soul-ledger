import { getPublicClient, getWalletClient } from "wagmi/actions";
import { baseSepolia } from "wagmi/chains";
import { Address, parseUnits, formatUnits } from "viem";
import { config } from "@/app/providers";

export const STAKE_VAULT_ADDRESS: Address = (process.env.NEXT_PUBLIC_STAKE_VAULT_ADDRESS || "0x0000000000000000000000000000000000000000") as Address;
export const USDC_ADDRESS: Address = (process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e") as Address;

export const STAKE_VAULT_ABI = [
    {
        "type": "function", "name": "createChallenge", "inputs": [
            { "name": "beneficiary", "type": "address" },
            { "name": "amount", "type": "uint256" },
            { "name": "startTime", "type": "uint256" },
            { "name": "durationDays", "type": "uint256" }
        ], "outputs": [{ "name": "id", "type": "uint256" }], "stateMutability": "nonpayable"
    },
    { "type": "function", "name": "claimUnlocked", "inputs": [{ "name": "id", "type": "uint256" }], "outputs": [], "stateMutability": "nonpayable" },
    { "type": "function", "name": "finalize", "inputs": [{ "name": "id", "type": "uint256" }], "outputs": [], "stateMutability": "nonpayable" },
    {
        "type": "function", "name": "getChallenge", "inputs": [{ "name": "id", "type": "uint256" }], "outputs": [
            { "name": "user", "type": "address" },
            { "name": "beneficiary", "type": "address" },
            { "name": "principal", "type": "uint256" },
            { "name": "released", "type": "uint256" },
            { "name": "penalized", "type": "uint256" },
            { "name": "startTime", "type": "uint256" },
            { "name": "durationDays", "type": "uint256" },
            { "name": "dailySlice", "type": "uint256" },
            { "name": "finalized", "type": "bool" }
        ], "stateMutability": "view"
    },
    { "type": "function", "name": "isDayUnlocked", "inputs": [{ "name": "id", "type": "uint256" }, { "name": "dayIndex", "type": "uint256" }], "outputs": [{ "name": "", "type": "bool" }], "stateMutability": "view" },
] as const;

export const ERC20_ABI = [
    { "type": "function", "name": "approve", "inputs": [{ "name": "spender", "type": "address" }, { "name": "amount", "type": "uint256" }], "outputs": [{ "type": "bool" }], "stateMutability": "nonpayable" },
] as const;

export async function createChallenge(params: { beneficiary: Address; amount: string; startDate: Date; days: number; decimals?: number }) {
    const publicClient = getPublicClient(config);
    const walletClient = await getWalletClient(config);
    if (!publicClient || !walletClient) throw new Error("Wallet not connected");
    const decimals = params.decimals ?? 6; // USDC
    const amount = parseUnits(params.amount, decimals);

    // Approve USDC to StakeVault
    await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [STAKE_VAULT_ADDRESS, amount],
        chain: baseSepolia,
    });

    // Create challenge
    const startTime = BigInt(Math.floor(params.startDate.getTime() / 1000));
    const id = await walletClient.writeContract({
        address: STAKE_VAULT_ADDRESS,
        abi: STAKE_VAULT_ABI,
        functionName: "createChallenge",
        args: [params.beneficiary, amount, startTime, BigInt(params.days)],
        chain: baseSepolia,
    });
    return id;
}

export async function claimUnlocked(id: bigint) {
    const walletClient = await getWalletClient(config);
    if (!walletClient) throw new Error("Wallet not connected");
    await walletClient.writeContract({
        address: STAKE_VAULT_ADDRESS,
        abi: STAKE_VAULT_ABI,
        functionName: "claimUnlocked",
        args: [id],
        chain: baseSepolia,
    });
}

export async function finalizeChallenge(id: bigint) {
    const walletClient = await getWalletClient(config);
    if (!walletClient) throw new Error("Wallet not connected");
    await walletClient.writeContract({
        address: STAKE_VAULT_ADDRESS,
        abi: STAKE_VAULT_ABI,
        functionName: "finalize",
        args: [id],
        chain: baseSepolia,
    });
}

export async function getChallengeData(id: bigint) {
    const publicClient = getPublicClient(config);
    if (!publicClient) throw new Error("Client not available");

    const data = await publicClient.readContract({
        address: STAKE_VAULT_ADDRESS,
        abi: STAKE_VAULT_ABI,
        functionName: "getChallenge",
        args: [id],
        chain: baseSepolia,
    });

    return {
        user: data[0],
        beneficiary: data[1],
        principal: data[2],
        released: data[3],
        penalized: data[4],
        startTime: data[5],
        durationDays: data[6],
        dailySlice: data[7],
        finalized: data[8],
    };
}

export async function checkDayUnlocked(id: bigint, dayIndex: number) {
    const publicClient = getPublicClient(config);
    if (!publicClient) throw new Error("Client not available");

    return await publicClient.readContract({
        address: STAKE_VAULT_ADDRESS,
        abi: STAKE_VAULT_ABI,
        functionName: "isDayUnlocked",
        args: [id, BigInt(dayIndex)],
        chain: baseSepolia,
    });
}

export function formatUSDC(amount: bigint, decimals: number = 6): string {
    return formatUnits(amount, decimals);
}


