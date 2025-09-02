import { getPublicClient, getWalletClient } from "wagmi/actions";
import { baseSepolia } from "wagmi/chains";
import { Address, parseUnits } from "viem";

export const STAKE_VAULT_ADDRESS: Address = process.env.NEXT_PUBLIC_STAKE_VAULT_ADDRESS as Address;
export const USDC_ADDRESS: Address = (process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x0000000000000000000000000000000000000000") as Address;

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
] as const;

export const ERC20_ABI = [
    { "type": "function", "name": "approve", "inputs": [{ "name": "spender", "type": "address" }, { "name": "amount", "type": "uint256" }], "outputs": [{ "type": "bool" }], "stateMutability": "nonpayable" },
] as const;

export async function createChallenge(params: { beneficiary: Address; amount: string; startDate: Date; days: number; decimals?: number }) {
    const publicClient = getPublicClient();
    const walletClient = await getWalletClient({ chainId: baseSepolia.id });
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
    const walletClient = await getWalletClient({ chainId: baseSepolia.id });
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
    const walletClient = await getWalletClient({ chainId: baseSepolia.id });
    if (!walletClient) throw new Error("Wallet not connected");
    await walletClient.writeContract({
        address: STAKE_VAULT_ADDRESS,
        abi: STAKE_VAULT_ABI,
        functionName: "finalize",
        args: [id],
        chain: baseSepolia,
    });
}


