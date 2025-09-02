// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title StakeVault - Self-stake motivation vault (USDC-only, linear release)
/// @notice Lock USDC for N days; each successful day unlocks an equal slice. Missed days accrue penalties to a beneficiary.
contract StakeVault {
    // --- Minimal IERC20 ---
    interface IERC20 {
        function transferFrom(address from, address to, uint256 amount) external returns (bool);
        function transfer(address to, uint256 amount) external returns (bool);
        function balanceOf(address) external view returns (uint256);
        function allowance(address owner, address spender) external view returns (uint256);
        function decimals() external view returns (uint8);
    }

    // --- Events ---
    event ChallengeCreated(uint256 indexed challengeId, address indexed owner, address indexed beneficiary, uint256 amount, uint256 startTime, uint256 durationDays);
    event DayAttested(uint256 indexed challengeId, uint256 dayIndex, uint256 amountUnlocked);
    event Claimed(uint256 indexed challengeId, address indexed owner, uint256 amount);
    event Finalized(uint256 indexed challengeId, uint256 penaltyToBeneficiary);

    // --- Roles ---
    address public immutable USDC;
    address public verifier; // address allowed to attest day completions
    address public owner;    // contract admin for setting verifier

    // --- Storage ---
    struct Challenge {
        address user;
        address beneficiary;
        uint256 principal;       // total deposited USDC
        uint256 released;        // total released to user
        uint256 penalized;       // total assigned to beneficiary
        uint256 startTime;       // challenge start (unix)
        uint256 durationDays;    // number of days in challenge
        uint256 dailySlice;      // principal / durationDays
        bool finalized;
        mapping(uint256 => bool) dayUnlocked; // dayIndex => unlocked
    }

    uint256 public nextChallengeId;
    mapping(uint256 => Challenge) private challenges;

    // --- Modifiers ---
    modifier onlyOwner() { require(msg.sender == owner, "NOT_OWNER"); _; }
    modifier onlyVerifier() { require(msg.sender == verifier, "NOT_VERIFIER"); _; }

    constructor(address usdc, address initialVerifier) {
        require(usdc != address(0), "USDC_ZERO");
        USDC = usdc;
        verifier = initialVerifier;
        owner = msg.sender;
    }

    function setVerifier(address v) external onlyOwner { verifier = v; }

    // --- Views ---
    function getChallenge(uint256 id)
        external
        view
        returns (
            address user,
            address beneficiary,
            uint256 principal,
            uint256 released,
            uint256 penalized,
            uint256 startTime,
            uint256 durationDays,
            uint256 dailySlice,
            bool finalized
        )
    {
        Challenge storage c = challenges[id];
        return (c.user, c.beneficiary, c.principal, c.released, c.penalized, c.startTime, c.durationDays, c.dailySlice, c.finalized);
    }

    function isDayUnlocked(uint256 id, uint256 dayIndex) external view returns (bool) {
        Challenge storage c = challenges[id];
        return c.dayUnlocked[dayIndex];
    }

    // --- Create ---
    function createChallenge(
        address beneficiary,
        uint256 amount,
        uint256 startTime,
        uint256 durationDays
    ) external returns (uint256 id) {
        require(beneficiary != address(0), "BENEFICIARY_ZERO");
        require(amount > 0, "AMOUNT_ZERO");
        require(durationDays > 0, "DURATION_ZERO");
        require(startTime >= block.timestamp, "START_PAST");

        id = ++nextChallengeId;
        Challenge storage c = challenges[id];
        c.user = msg.sender;
        c.beneficiary = beneficiary;
        c.principal = amount;
        c.released = 0;
        c.penalized = 0;
        c.startTime = startTime;
        c.durationDays = durationDays;
        c.dailySlice = amount / durationDays; // linear; rounding remainder stays in contract and goes to beneficiary on finalize
        c.finalized = false;

        // Pull USDC from user
        require(IERC20(USDC).transferFrom(msg.sender, address(this), amount), "TRANSFER_FROM_FAIL");

        emit ChallengeCreated(id, msg.sender, beneficiary, amount, startTime, durationDays);
    }

    // --- Progress / attestations ---
    /// @notice Verifier marks a given day as completed and unlocks the linear slice to the user balance
    function attestCompletion(uint256 id, uint256 dayIndex) external onlyVerifier {
        Challenge storage c = challenges[id];
        require(!c.finalized, "FINALIZED");
        require(c.user != address(0), "NOT_FOUND");
        require(dayIndex < c.durationDays, "BAD_DAY");
        require(!c.dayUnlocked[dayIndex], "ALREADY_UNLOCKED");
        require(block.timestamp >= c.startTime + dayIndex * 1 days, "DAY_NOT_STARTED");

        c.dayUnlocked[dayIndex] = true;
        c.released += c.dailySlice;

        emit DayAttested(id, dayIndex, c.dailySlice);
    }

    // --- Claims ---
    function claimUnlocked(uint256 id) external {
        Challenge storage c = challenges[id];
        require(c.user == msg.sender, "NOT_USER");
        uint256 claimable = c.released;
        require(claimable > 0, "NOTHING_TO_CLAIM");
        c.released = 0; // effects
        require(IERC20(USDC).transfer(msg.sender, claimable), "TRANSFER_FAIL");
        emit Claimed(id, msg.sender, claimable);
    }

    // --- Finalize ---
    /// @notice After the challenge window, assign all non-unlocked principal (including remainder) to beneficiary
    function finalize(uint256 id) external {
        Challenge storage c = challenges[id];
        require(!c.finalized, "FINALIZED");
        require(c.user != address(0), "NOT_FOUND");
        require(block.timestamp >= c.startTime + c.durationDays * 1 days, "NOT_ENDED");

        uint256 unlockedTotal = _sumUnlocked(c);
        uint256 remainder = c.principal - unlockedTotal;
        c.penalized += remainder;
        c.finalized = true;

        if (remainder > 0) {
            require(IERC20(USDC).transfer(c.beneficiary, remainder), "BENEFICIARY_XFER_FAIL");
        }

        emit Finalized(id, remainder);
    }

    // --- Internal ---
    function _sumUnlocked(Challenge storage c) internal view returns (uint256 total) {
        uint256 d = c.durationDays;
        for (uint256 i = 0; i < d; i++) {
            if (c.dayUnlocked[i]) total += c.dailySlice;
        }
    }
}


