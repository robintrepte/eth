// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IUniswapV2Router02 {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);
    
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function getAmountsOut(
        uint amountIn,
        address[] calldata path
    ) external view returns (uint[] memory amounts);
}

interface IUniswapV3Router {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external payable returns (uint256 amountOut);
}

interface IQuoterV2 {
    function quoteExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint160 sqrtPriceLimitX96
    ) external view returns (
        uint256 amountOut,
        uint160 sqrtPriceX96After,
        uint32 initializedTicksCrossed,
        uint256 gasEstimate
    );
}

interface IAsset {}

interface IBalancerVault {
    enum SwapKind { GIVEN_IN, GIVEN_OUT }
    
    struct SingleSwap {
        bytes32 poolId;
        SwapKind kind;
        address assetIn;
        address assetOut;
        uint256 amount;
        bytes userData;
    }

    struct FundManagement {
        address sender;
        bool fromInternalBalance;
        address payable recipient;
        bool toInternalBalance;
    }

    struct BatchSwapStep {
        bytes32 poolId;
        uint256 assetInIndex;
        uint256 assetOutIndex;
        uint256 amount;
        bytes userData;
    }

    function swap(
        SingleSwap memory singleSwap,
        FundManagement memory funds,
        uint256 limit,
        uint256 deadline
    ) external payable returns (uint256);

    function queryBatchSwap(
        SwapKind kind,
        BatchSwapStep[] memory swaps,
        IAsset[] memory assets,
        FundManagement memory funds
    ) external view returns (int256[] memory);
}

interface IPool {
    function flashLoanSimple(
        address receiverAddress,
        address asset,
        uint256 amount,
        bytes calldata params,
        uint16 referralCode
    ) external;
}

interface IWETH {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

contract TrustlessArbitrageBotV2 is ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    address public constant UNISWAP_V2_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address public constant UNISWAP_V3_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address public constant UNISWAP_V3_QUOTER = 0x61fFE014bA17989E743c5F6cB21bF9697530B21e;
    address public constant SUSHISWAP_ROUTER = 0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F;
    address public constant BALANCER_VAULT = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;
    address public constant AAVE_POOL = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2;
    
    // Expanded token list
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address public constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address public constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
    address public constant LINK = 0x514910771AF9Ca656af840dff83E8264EcF986CA;
    address public constant UNI = 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984;
    address public constant AAVE = 0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9;

    address public immutable operator;
    IPool public immutable aavePool;
    IWETH public immutable weth;
    IQuoterV2 public immutable quoterV2;

    struct DEXInfo {
        address router;
        string name;
        uint256 fee;
        uint8 dexType;
    }

    struct ArbitrageParams {
        address tokenIn;
        address tokenOut;
        address tokenIntermediate; // For triangle arbitrage
        uint256 amountIn;
        uint256 minOutLeg1;
        uint256 minOutLeg2;
        uint256 minOutLeg3; // For triangle arbitrage
        uint8   dexIn;
        uint8   dexOut;
        uint8   dexIntermediate; // For triangle arbitrage
        uint24  uniV3FeeIn;
        uint24  uniV3FeeOut;
        uint24  uniV3FeeIntermediate; // For triangle arbitrage
        bytes32 balancerPoolId;
        uint256 deadline;
        address recipient;
        uint256 minNetProfitWei;
        uint256 gasPriceWei;
        uint256 gasLimitEstimate;
        bool    useOwnLiquidity;
        bool    isTriangleArb; // Flag for triangle arbitrage
    }

    struct OpportunityData {
        uint8 dexIn;
        uint8 dexOut;
        uint8 dexIntermediate; // For triangle arbitrage
        uint24 uniV3FeeIn;
        uint24 uniV3FeeOut;
        uint24 uniV3FeeIntermediate; // For triangle arbitrage
        uint256 expectedProfit;
        uint256 minOutLeg1;
        uint256 minOutLeg2;
        uint256 minOutLeg3; // For triangle arbitrage
        uint256 gasEstimate;
        bool isValid;
        bool isTriangleArb; // Flag for triangle arbitrage
        address tokenIntermediate; // For triangle arbitrage
    }

    struct TriangleArbParams {
        address tokenA;
        address tokenB;
        address tokenC;
        uint256 amountIn;
    }

    DEXInfo[4] private dexConfigs;
    mapping(bytes32 => bool) public validBalancerPools;
    mapping(address => bool) public supportedTokens;
    
    uint256 public constant MAX_SLIPPAGE = 300; // 3%
    uint256 public constant MAX_TRADE_AMOUNT = 500 ether; // Increased from 300
    uint256 public constant MIN_PROFIT_THRESHOLD = 0.0005 ether; // Reduced from 0.001 for more opportunities

    mapping(address => uint256) public lastFlashLoan;
    mapping(address => uint256) public dailyFlashLoanCount;
    mapping(address => uint256) public lastDailyReset;
    uint256 public constant FLASH_LOAN_COOLDOWN = 20; // Reduced from 30
    uint256 public constant DAILY_FLASH_LOAN_LIMIT = 150; // Increased from 100

    uint256 public totalTrades;
    uint256 public totalVolume;
    uint256 public totalProfit;
    uint256 public totalTriangleArbs; // Track triangle arbitrage trades
    
    uint256 public gasPriceHintWei;
    uint256 public flashPremiumBps = 5;
    bool public enableTriangleArb = true; // Toggle for triangle arbitrage

    event ArbitrageExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        address tokenIntermediate,
        uint256 amountIn,
        uint256 profit,
        uint8 dexIn,
        uint8 dexOut,
        uint8 dexIntermediate,
        bool usedOwnLiquidity,
        bool isTriangleArb
    );

    event OpportunityFound(
        address indexed tokenA,
        address indexed tokenB,
        address tokenIntermediate,
        uint256 amount,
        uint256 expectedProfit,
        uint8 dexIn,
        uint8 dexOut,
        uint8 dexIntermediate,
        bool isTriangleArb
    );

    event CapitalDeposited(address indexed token, uint256 amount);
    event CapitalWithdrawn(address indexed token, uint256 amount);
    event TradeLegExecuted(
        uint8 indexed dexId,
        address indexed tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    event GasPriceHintUpdated(uint256 newHintWei);
    event FlashPremiumBpsUpdated(uint256 newBps);
    event TriangleArbToggled(bool enabled);

    constructor() {
        operator = msg.sender;
        aavePool = IPool(AAVE_POOL);
        weth = IWETH(WETH);
        quoterV2 = IQuoterV2(UNISWAP_V3_QUOTER);
        
        dexConfigs[0] = DEXInfo({
            router: UNISWAP_V2_ROUTER,
            name: "Uniswap V2",
            fee: 300,
            dexType: 0
        });
        
        dexConfigs[1] = DEXInfo({
            router: SUSHISWAP_ROUTER,
            name: "Sushiswap",
            fee: 300,
            dexType: 2
        });
        
        dexConfigs[2] = DEXInfo({
            router: UNISWAP_V3_ROUTER,
            name: "Uniswap V3",
            fee: 500,
            dexType: 1
        });
        
        dexConfigs[3] = DEXInfo({
            router: BALANCER_VAULT,
            name: "Balancer",
            fee: 100,
            dexType: 3
        });
        
        // Balancer pools
        validBalancerPools[0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014] = true;
        validBalancerPools[0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019] = true;
        validBalancerPools[0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a] = true;
        
        // Expanded token support
        supportedTokens[WETH] = true;
        supportedTokens[USDC] = true;
        supportedTokens[USDT] = true;
        supportedTokens[DAI] = true;
        supportedTokens[WBTC] = true;
        supportedTokens[LINK] = true;
        supportedTokens[UNI] = true;
        supportedTokens[AAVE] = true;
    }

    modifier onlyOperator() {
        require(msg.sender == operator, "Not operator");
        _;
    }

    modifier validTokens(address tokenA, address tokenB) {
        require(tokenA != address(0) && tokenB != address(0), "Invalid tokens");
        require(tokenA != tokenB, "Same tokens");
        require(supportedTokens[tokenA] && supportedTokens[tokenB], "Unsupported tokens");
        _;
    }

    modifier rateLimited() {
        if (block.timestamp > lastDailyReset[msg.sender] + 1 days) {
            dailyFlashLoanCount[msg.sender] = 0;
            lastDailyReset[msg.sender] = block.timestamp;
        }
        _;
    }
    
    /**
     * @notice Enhanced opportunity finder with triangle arbitrage support
     * @param maxAmount Maximum amount to trade
     * @return bestOpportunity Best opportunity found
     * @return tokenA First token in the route
     * @return tokenB Second token in the route
     * @return tokenIntermediate Intermediate token (for triangle arb) or address(0)
     * @return amount Optimal amount to trade
     */
    function StartNative(uint256 maxAmount) external view returns (
        OpportunityData memory bestOpportunity,
        address tokenA,
        address tokenB,
        address tokenIntermediate,
        uint256 amount
    ) {
        require(maxAmount > 0 && maxAmount <= MAX_TRADE_AMOUNT, "Invalid amount");
        
        address tokenIn = WETH;
        address[] memory tokensOut = new address[](8);
        tokensOut[0] = USDC;
        tokensOut[1] = USDT;
        tokensOut[2] = DAI;
        tokensOut[3] = WBTC;
        tokensOut[4] = LINK;
        tokensOut[5] = UNI;
        tokensOut[6] = AAVE;
        tokensOut[7] = WETH; // For triangle arbitrage
        
        uint24[3] memory v3Fees = [uint24(500), uint24(3000), uint24(10000)];
        uint256 maxProfit = 0;
        
        // Test different trade amounts (optimized)
        uint256[] memory amounts = new uint256[](5);
        amounts[0] = maxAmount / 20; // 5%
        amounts[1] = maxAmount / 10; // 10%
        amounts[2] = maxAmount / 5;  // 20%
        amounts[3] = maxAmount / 2;  // 50%
        amounts[4] = maxAmount;      // 100%
        
        // First, try 2-leg arbitrage
        for (uint j = 0; j < tokensOut.length - 1; j++) { // Exclude WETH for 2-leg
            address tokenOut = tokensOut[j];
            
            for (uint k = 0; k < amounts.length; k++) {
                for (uint feeIn = 0; feeIn < v3Fees.length; feeIn++) {
                    for (uint feeOut = 0; feeOut < v3Fees.length; feeOut++) {
                        OpportunityData memory opp = _findOpportunity(
                            tokenIn,
                            tokenOut, 
                            amounts[k],
                            v3Fees[feeIn],
                            v3Fees[feeOut],
                            address(0), // No intermediate token for 2-leg
                            false
                        );
                        
                        if (opp.isValid && opp.expectedProfit > maxProfit) {
                            maxProfit = opp.expectedProfit;
                            bestOpportunity = opp;
                            tokenA = tokenIn;
                            tokenB = tokenOut;
                            tokenIntermediate = address(0);
                            amount = amounts[k];
                        }
                    }
                }
            }
        }
        
        // Then try triangle arbitrage if enabled
        if (enableTriangleArb) {
            for (uint i = 0; i < tokensOut.length - 1; i++) {
                address tokenB_temp = tokensOut[i];
                for (uint j = i + 1; j < tokensOut.length - 1; j++) {
                    address tokenC = tokensOut[j];
                    
                    for (uint k = 0; k < amounts.length; k++) {
                        OpportunityData memory triangleOpp = _findTriangleOpportunity(
                            tokenIn,
                            tokenB_temp,
                            tokenC,
                            amounts[k]
                        );
                        
                        if (triangleOpp.isValid && triangleOpp.expectedProfit > maxProfit) {
                            maxProfit = triangleOpp.expectedProfit;
                            bestOpportunity = triangleOpp;
                            tokenA = tokenIn;
                            tokenB = tokenC; // Final token
                            tokenIntermediate = tokenB_temp;
                            amount = amounts[k];
                        }
                    }
                }
            }
        }
    }

    /**
     * @notice Enhanced auto arbitrage with triangle support
     */
    function AutoArbitrage(uint256 maxAmount, uint256 estimatedGasLimit) 
        external 
        onlyOperator
        nonReentrant 
        whenNotPaused 
    {
        require(maxAmount > 0 && maxAmount <= MAX_TRADE_AMOUNT, "Invalid amount");
        require(estimatedGasLimit > 0 && estimatedGasLimit < 2000000, "Invalid gas limit");
        
        (
            OpportunityData memory opportunity,
            address tokenA,
            address tokenB,
            address tokenIntermediate,
            uint256 bestAmount
        ) = this.StartNative(maxAmount);
        
        require(opportunity.isValid, "No opportunity found");
        require(tokenA == WETH, "Only WETH-in routes supported");
        require(opportunity.expectedProfit >= MIN_PROFIT_THRESHOLD, "Profit too low");
        
        uint256 gasPrice = tx.gasprice;
        uint256 finalGasLimit = estimatedGasLimit > opportunity.gasEstimate ? 
            estimatedGasLimit : opportunity.gasEstimate;
        
        ArbitrageParams memory params = ArbitrageParams({
            tokenIn: tokenA,
            tokenOut: tokenB,
            tokenIntermediate: tokenIntermediate,
            amountIn: bestAmount,
            minOutLeg1: opportunity.minOutLeg1,
            minOutLeg2: opportunity.minOutLeg2,
            minOutLeg3: opportunity.minOutLeg3,
            dexIn: opportunity.dexIn,
            dexOut: opportunity.dexOut,
            dexIntermediate: opportunity.dexIntermediate,
            uniV3FeeIn: opportunity.uniV3FeeIn,
            uniV3FeeOut: opportunity.uniV3FeeOut,
            uniV3FeeIntermediate: opportunity.uniV3FeeIntermediate,
            balancerPoolId: _getBalancerPoolId(tokenA, tokenB),
            deadline: block.timestamp + 60,
            recipient: operator,
            minNetProfitWei: MIN_PROFIT_THRESHOLD,
            gasPriceWei: gasPrice,
            gasLimitEstimate: finalGasLimit,
            useOwnLiquidity: IERC20(tokenA).balanceOf(address(this)) >= bestAmount,
            isTriangleArb: opportunity.isTriangleArb
        });
        
        _executeArbWithOptionalFlash(params);
    }

    function depositETH() external payable onlyOperator {
        require(msg.value > 0, "No ETH sent");
        weth.deposit{value: msg.value}();
        emit CapitalDeposited(WETH, msg.value);
    }

    function withdrawETH(uint256 amount) external onlyOperator {
        require(amount > 0, "Invalid amount");
        uint256 wethBalance = IERC20(WETH).balanceOf(address(this));
        require(wethBalance >= amount, "Insufficient WETH");
        
        weth.withdraw(amount);
        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");
        
        emit CapitalWithdrawn(WETH, amount);
    }

    function sweep(address token) external onlyOperator {
        require(token != address(0), "Invalid token");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No balance");
        
        IERC20(token).safeTransfer(msg.sender, balance);
        emit CapitalWithdrawn(token, balance);
    }

    function pause() external onlyOperator {
        _pause();
    }

    function unpause() external onlyOperator {
        _unpause();
    }

    function setGasPriceHint(uint256 _gasPrice) external onlyOperator {
        gasPriceHintWei = _gasPrice;
        emit GasPriceHintUpdated(_gasPrice);
    }
    
    function setFlashPremiumBps(uint256 _bps) external onlyOperator {
        require(_bps < 100, "Premium too high");
        flashPremiumBps = _bps;
        emit FlashPremiumBpsUpdated(_bps);
    }

    function setTriangleArbEnabled(bool _enabled) external onlyOperator {
        enableTriangleArb = _enabled;
        emit TriangleArbToggled(_enabled);
    }

    /**
     * @notice Find 2-leg arbitrage opportunity
     */
    function _findOpportunity(
        address tokenA,
        address tokenB,
        uint256 amountIn,
        uint24 v3FeeIn,
        uint24 v3FeeOut,
        address tokenIntermediate,
        bool isTriangle
    ) internal view returns (OpportunityData memory bestOpportunity) {
        uint256 maxProfit = 0;
        
        for (uint8 i = 0; i < 4; i++) {
            for (uint8 j = 0; j < 4; j++) {
                if (i == j) continue;
                
                (uint256 profit, uint256 minOut1, uint256 minOut2) = _calculateProfitForRoute(
                    tokenA, 
                    tokenB, 
                    amountIn, 
                    i, 
                    j,
                    v3FeeIn,
                    v3FeeOut
                );
                
                if (profit > maxProfit) {
                    maxProfit = profit;
                    bestOpportunity = OpportunityData({
                        dexIn: i,
                        dexOut: j,
                        dexIntermediate: 0,
                        uniV3FeeIn: v3FeeIn,
                        uniV3FeeOut: v3FeeOut,
                        uniV3FeeIntermediate: 0,
                        expectedProfit: profit,
                        minOutLeg1: minOut1,
                        minOutLeg2: minOut2,
                        minOutLeg3: 0,
                        gasEstimate: _estimateGasCost(i, j, false),
                        isValid: profit > 0,
                        isTriangleArb: false,
                        tokenIntermediate: address(0)
                    });
                }
            }
        }
    }

    /**
     * @notice Find triangle arbitrage opportunity (A -> B -> C -> A)
     */
    function _findTriangleOpportunity(
        address tokenA,
        address tokenB,
        address tokenC,
        uint256 amountIn
    ) internal view returns (OpportunityData memory bestOpportunity) {
        uint256 maxProfit = 0;
        uint24[3] memory v3Fees = [uint24(500), uint24(3000), uint24(10000)];
        
        // Try all combinations of DEXes and fees
        for (uint8 i = 0; i < 4; i++) {
            for (uint8 j = 0; j < 4; j++) {
                if (i == j) continue;
                for (uint8 k = 0; k < 4; k++) {
                    if (j == k || i == k) continue; // Use different DEXes
                    
                    OpportunityData memory candidate = _testTriangleConfig(
                        tokenA, tokenB, tokenC, amountIn,
                        i, j, k, v3Fees
                    );
                    
                    if (candidate.isValid && candidate.expectedProfit > maxProfit) {
                        maxProfit = candidate.expectedProfit;
                        bestOpportunity = candidate;
                    }
                }
            }
        }
    }

    /**
     * @notice Test a specific triangle configuration
     */
    function _testTriangleConfig(
        address tokenA,
        address tokenB,
        address tokenC,
        uint256 amountIn,
        uint8 dex1,
        uint8 dex2,
        uint8 dex3,
        uint24[3] memory v3Fees
    ) internal view returns (OpportunityData memory) {
        uint256 maxProfit = 0;
        uint24 bestFee1 = 0;
        uint24 bestFee2 = 0;
        uint24 bestFee3 = 0;
        uint256 bestMinOut1 = 0;
        uint256 bestMinOut2 = 0;
        uint256 bestMinOut3 = 0;
        
        for (uint fee1 = 0; fee1 < v3Fees.length; fee1++) {
            for (uint fee2 = 0; fee2 < v3Fees.length; fee2++) {
                for (uint fee3 = 0; fee3 < v3Fees.length; fee3++) {
                    (uint256 profit, uint256 minOut1, uint256 minOut2, uint256 minOut3) = 
                        _calculateTriangleProfit(
                            tokenA, tokenB, tokenC, amountIn,
                            dex1, dex2, dex3,
                            v3Fees[fee1], v3Fees[fee2], v3Fees[fee3]
                        );
                    
                    if (profit > maxProfit) {
                        maxProfit = profit;
                        bestFee1 = v3Fees[fee1];
                        bestFee2 = v3Fees[fee2];
                        bestFee3 = v3Fees[fee3];
                        bestMinOut1 = minOut1;
                        bestMinOut2 = minOut2;
                        bestMinOut3 = minOut3;
                    }
                }
            }
        }
        
        return OpportunityData({
            dexIn: dex1,
            dexIntermediate: dex2,
            dexOut: dex3,
            uniV3FeeIn: bestFee1,
            uniV3FeeIntermediate: bestFee2,
            uniV3FeeOut: bestFee3,
            expectedProfit: maxProfit,
            minOutLeg1: bestMinOut1,
            minOutLeg2: bestMinOut2,
            minOutLeg3: bestMinOut3,
            gasEstimate: _estimateGasCost(dex1, dex3, true),
            isValid: maxProfit > 0,
            isTriangleArb: true,
            tokenIntermediate: tokenB
        });
    }

    function _calculateProfitForRoute(
        address tokenA,
        address tokenB,
        uint256 amountIn,
        uint8 dexIn,
        uint8 dexOut,
        uint24 v3FeeIn,
        uint24 v3FeeOut
    ) internal view returns (uint256 profit, uint256 minOut1, uint256 minOut2) {
        uint256 intermediateAmount = _getExpectedAmountOut(tokenA, tokenB, amountIn, dexIn, v3FeeIn);
        if (intermediateAmount == 0) return (0, 0, 0);
        
        minOut1 = intermediateAmount * (10000 - MAX_SLIPPAGE) / 10000;
        
        uint256 finalAmount = _getExpectedAmountOut(tokenB, tokenA, intermediateAmount, dexOut, v3FeeOut);
        if (finalAmount <= amountIn) return (0, 0, 0);
        
        minOut2 = finalAmount * (10000 - MAX_SLIPPAGE) / 10000;
        
        uint256 grossProfit = finalAmount > amountIn ? finalAmount - amountIn : 0;
        
        uint256 effectiveGasPrice = gasPriceHintWei == 0 ? tx.gasprice : gasPriceHintWei;
        uint256 estimatedGasCost = effectiveGasPrice * _estimateGasCost(dexIn, dexOut, false);
        uint256 flashPremium = (amountIn * flashPremiumBps) / 10000;
        
        if (grossProfit > estimatedGasCost + flashPremium + MIN_PROFIT_THRESHOLD) {
            profit = grossProfit;
        } else {
            profit = 0;
        }
    }

    /**
     * @notice Calculate profit for triangle arbitrage (A -> B -> C -> A)
     */
    function _calculateTriangleProfit(
        address tokenA,
        address tokenB,
        address tokenC,
        uint256 amountIn,
        uint8 dex1,
        uint8 dex2,
        uint8 dex3,
        uint24 fee1,
        uint24 fee2,
        uint24 fee3
    ) internal view returns (uint256 profit, uint256 minOut1, uint256 minOut2, uint256 minOut3) {
        // Leg 1: A -> B
        uint256 amount1 = _getExpectedAmountOut(tokenA, tokenB, amountIn, dex1, fee1);
        if (amount1 == 0) return (0, 0, 0, 0);
        minOut1 = amount1 * (10000 - MAX_SLIPPAGE) / 10000;
        
        // Leg 2: B -> C
        uint256 amount2 = _getExpectedAmountOut(tokenB, tokenC, amount1, dex2, fee2);
        if (amount2 == 0) return (0, 0, 0, 0);
        minOut2 = amount2 * (10000 - MAX_SLIPPAGE) / 10000;
        
        // Leg 3: C -> A
        uint256 finalAmount = _getExpectedAmountOut(tokenC, tokenA, amount2, dex3, fee3);
        if (finalAmount <= amountIn) return (0, 0, 0, 0);
        minOut3 = finalAmount * (10000 - MAX_SLIPPAGE) / 10000;
        
        uint256 grossProfit = finalAmount > amountIn ? finalAmount - amountIn : 0;
        
        uint256 effectiveGasPrice = gasPriceHintWei == 0 ? tx.gasprice : gasPriceHintWei;
        uint256 estimatedGasCost = effectiveGasPrice * _estimateGasCost(dex1, dex3, true);
        uint256 flashPremium = (amountIn * flashPremiumBps) / 10000;
        
        if (grossProfit > estimatedGasCost + flashPremium + MIN_PROFIT_THRESHOLD) {
            profit = grossProfit;
        } else {
            profit = 0;
        }
    }

    function _getExpectedAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint8 dexId,
        uint24 v3Fee
    ) internal view returns (uint256) {
        if (dexId >= 4) return 0;
        
        DEXInfo memory dex = dexConfigs[dexId];
        
        if (dex.dexType == 0 || dex.dexType == 2) {
            address[] memory path = new address[](2);
            path[0] = tokenIn;
            path[1] = tokenOut;
            
            try IUniswapV2Router02(dex.router).getAmountsOut(amountIn, path) returns (uint[] memory amounts) {
                return amounts[1];
            } catch {
                return 0;
            }
        } else if (dex.dexType == 1) {
            try quoterV2.quoteExactInputSingle(
                tokenIn,
                tokenOut,
                v3Fee,
                amountIn,
                0
            ) returns (uint256 amountOut, uint160, uint32, uint256) {
                return amountOut;
            } catch {
                return 0;
            }
        } else if (dex.dexType == 3) {
            bytes32 poolId = _getBalancerPoolId(tokenIn, tokenOut);
            if (poolId == bytes32(0)) return 0;
            
            IBalancerVault.BatchSwapStep[] memory swaps = new IBalancerVault.BatchSwapStep[](1);
            swaps[0] = IBalancerVault.BatchSwapStep({
                poolId: poolId,
                assetInIndex: 0,
                assetOutIndex: 1,
                amount: amountIn,
                userData: ""
            });
            
            IAsset[] memory assets = new IAsset[](2);
            assets[0] = IAsset(tokenIn);
            assets[1] = IAsset(tokenOut);
            
            IBalancerVault.FundManagement memory funds = IBalancerVault.FundManagement({
                sender: address(this),
                fromInternalBalance: false,
                recipient: payable(address(this)),
                toInternalBalance: false
            });
            
            try IBalancerVault(BALANCER_VAULT).queryBatchSwap(
                IBalancerVault.SwapKind.GIVEN_IN,
                swaps,
                assets,
                funds
            ) returns (int256[] memory deltas) {
                return deltas[1] < 0 ? uint256(-deltas[1]) : 0;
            } catch {
                return 0;
            }
        }
        
        return 0;
    }

    /**
     * @notice Optimized gas estimation
     */
    function _estimateGasCost(uint8 dexIn, uint8 dexOut, bool isTriangle) internal view returns (uint256) {
        uint256 gasIn = 140000; // Optimized from 150000
        uint256 gasOut = 140000; // Optimized from 150000
        uint256 gasIntermediate = isTriangle ? 140000 : 0;
        
        if (dexConfigs[dexIn].dexType == 1) gasIn = 170000; // Optimized from 180000
        if (dexConfigs[dexOut].dexType == 1) gasOut = 170000; // Optimized from 180000
        if (dexConfigs[dexIn].dexType == 3) gasIn = 190000; // Optimized from 200000
        if (dexConfigs[dexOut].dexType == 3) gasOut = 190000; // Optimized from 200000
        
        uint256 baseGas = 90000; // Optimized from 100000
        
        return gasIn + gasOut + gasIntermediate + baseGas;
    }

    function _getBalancerPoolId(address tokenA, address tokenB) internal pure returns (bytes32) {
        if ((tokenA == WETH && tokenB == USDC) || (tokenA == USDC && tokenB == WETH)) {
            return 0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019;
        }
        if ((tokenA == WETH && tokenB == DAI) || (tokenA == DAI && tokenB == WETH)) {
            return 0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a;
        }
        if ((tokenA == WETH && tokenB == WBTC) || (tokenA == WBTC && tokenB == WETH)) {
            return 0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014;
        }
        return bytes32(0);
    }

    function _executeArbWithOptionalFlash(ArbitrageParams memory params) internal {
        bool hasOwnLiquidity = IERC20(params.tokenIn).balanceOf(address(this)) >= params.amountIn;
        
        if (hasOwnLiquidity && params.useOwnLiquidity) {
            uint256 balanceBefore = IERC20(params.tokenIn).balanceOf(address(this));
            
            if (params.isTriangleArb) {
                _executeTriangleArbitrageInternal(params);
            } else {
                _executeArbitrageInternal(params);
            }
            
            uint256 balanceAfter = IERC20(params.tokenIn).balanceOf(address(this));
            require(balanceAfter > balanceBefore, "No profit");
            
            uint256 profit = balanceAfter - balanceBefore;
            uint256 gasCost = params.gasPriceWei * params.gasLimitEstimate;
            
            require(profit > gasCost + params.minNetProfitWei, "Net profit too low");
            
            if (profit > 0) {
                IERC20(params.tokenIn).safeTransfer(params.recipient, profit);
            }
            
            totalTrades++;
            totalVolume += params.amountIn;
            totalProfit += profit;
            if (params.isTriangleArb) totalTriangleArbs++;
            
            emit ArbitrageExecuted(
                params.recipient,
                params.tokenIn,
                params.tokenOut,
                params.tokenIntermediate,
                params.amountIn,
                profit,
                params.dexIn,
                params.dexOut,
                params.dexIntermediate,
                true,
                params.isTriangleArb
            );
        } else {
            _executeFlashLoanArbitrage(params);
        }
    }

    function _executeFlashLoanArbitrage(ArbitrageParams memory params) internal {
        if (block.timestamp > lastDailyReset[msg.sender] + 1 days) {
            dailyFlashLoanCount[msg.sender] = 0;
            lastDailyReset[msg.sender] = block.timestamp;
        }
        
        require(
            block.timestamp >= lastFlashLoan[msg.sender] + FLASH_LOAN_COOLDOWN,
            "Flash loan cooldown active"
        );
        require(
            dailyFlashLoanCount[msg.sender] < DAILY_FLASH_LOAN_LIMIT,
            "Daily flash loan limit exceeded"
        );
        
        lastFlashLoan[msg.sender] = block.timestamp;
        dailyFlashLoanCount[msg.sender]++;
        
        bytes memory paramsData = abi.encode(params, msg.sender);
        
        aavePool.flashLoanSimple(
            address(this),
            params.tokenIn,
            params.amountIn,
            paramsData,
            0
        );
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        require(msg.sender == address(aavePool), "Invalid caller");
        require(initiator == address(this), "Invalid initiator");
        
        (ArbitrageParams memory arbParams, address originalUser) = abi.decode(params, (ArbitrageParams, address));
        
        uint256 balanceBefore = IERC20(asset).balanceOf(address(this));
        
        if (arbParams.isTriangleArb) {
            _executeTriangleArbitrageInternal(arbParams);
        } else {
            _executeArbitrageInternal(arbParams);
        }
        
        uint256 balanceAfter = IERC20(asset).balanceOf(address(this));
        uint256 totalDebt = amount + premium;
        
        require(balanceAfter >= totalDebt, "Insufficient profit for flash loan");
        
        uint256 profit = balanceAfter - totalDebt;
        uint256 gasCost = arbParams.gasPriceWei * arbParams.gasLimitEstimate;
        
        require(profit >= gasCost + arbParams.minNetProfitWei, "Net profit too low after gas");
        
        _approveMaxIfNeeded(asset, address(aavePool), totalDebt);
        
        _finalizeArbitrage(asset, originalUser, profit, arbParams);
        
        return true;
    }
    
    function _finalizeArbitrage(
        address asset,
        address user,
        uint256 profit,
        ArbitrageParams memory params
    ) internal {
        if (profit > 0) {
            IERC20(asset).safeTransfer(user, profit);
        }
        
        totalTrades++;
        totalVolume += params.amountIn;
        totalProfit += profit;
        if (params.isTriangleArb) totalTriangleArbs++;
        
        emit ArbitrageExecuted(
            user,
            params.tokenIn,
            params.tokenOut,
            params.tokenIntermediate,
            params.amountIn,
            profit,
            params.dexIn,
            params.dexOut,
            params.dexIntermediate,
            false,
            params.isTriangleArb
        );
    }

    function _executeArbitrageInternal(ArbitrageParams memory params) internal {
        require(params.recipient != address(0), "Invalid recipient");
        
        uint256 intermediateAmount = _executeTrade(
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            params.minOutLeg1,
            params.dexIn,
            params.uniV3FeeIn,
            params.balancerPoolId,
            params.deadline
        );
        
        uint256 finalAmount = _executeTrade(
            params.tokenOut,
            params.tokenIn,
            intermediateAmount,
            params.minOutLeg2,
            params.dexOut,
            params.uniV3FeeOut,
            params.balancerPoolId,
            params.deadline
        );
    }

    /**
     * @notice Execute triangle arbitrage (A -> B -> C -> A)
     */
    function _executeTriangleArbitrageInternal(ArbitrageParams memory params) internal {
        require(params.recipient != address(0), "Invalid recipient");
        require(params.tokenIntermediate != address(0), "Invalid intermediate token");
        
        // Leg 1: A -> B
        uint256 amount1 = _executeTrade(
            params.tokenIn,
            params.tokenIntermediate,
            params.amountIn,
            params.minOutLeg1,
            params.dexIn,
            params.uniV3FeeIn,
            bytes32(0),
            params.deadline
        );
        
        // Leg 2: B -> C
        uint256 amount2 = _executeTrade(
            params.tokenIntermediate,
            params.tokenOut,
            amount1,
            params.minOutLeg2,
            params.dexIntermediate,
            params.uniV3FeeIntermediate,
            bytes32(0),
            params.deadline
        );
        
        // Leg 3: C -> A
        uint256 finalAmount = _executeTrade(
            params.tokenOut,
            params.tokenIn,
            amount2,
            params.minOutLeg3,
            params.dexOut,
            params.uniV3FeeOut,
            bytes32(0),
            params.deadline
        );
    }

    function _executeTrade(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        uint8 dexId,
        uint24 uniV3Fee,
        bytes32 balancerPoolId,
        uint256 deadline
    ) internal returns (uint256 amountOut) {
        DEXInfo memory dex = dexConfigs[dexId];
        
        if (dex.dexType == 0 || dex.dexType == 2) {
            amountOut = _executeV2Trade(tokenIn, tokenOut, amountIn, minAmountOut, dex.router, deadline);
        } else if (dex.dexType == 1) {
            amountOut = _executeV3Trade(tokenIn, tokenOut, amountIn, minAmountOut, uniV3Fee, deadline);
        } else if (dex.dexType == 3) {
            amountOut = _executeBalancerTrade(tokenIn, tokenOut, amountIn, minAmountOut, balancerPoolId, deadline);
        }
        
        require(amountOut >= minAmountOut, "Trade slippage exceeded");
        
        emit TradeLegExecuted(dexId, tokenIn, tokenOut, amountIn, amountOut);
    }

    function _executeV2Trade(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address router,
        uint256 deadline
    ) internal returns (uint256) {
        _approveMaxIfNeeded(tokenIn, router, amountIn);
        
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        uint256[] memory amounts = IUniswapV2Router02(router).swapExactTokensForTokens(
            amountIn,
            minAmountOut,
            path,
            address(this),
            deadline
        );
        
        return amounts[1];
    }

    function _executeV3Trade(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        uint24 fee,
        uint256 deadline
    ) internal returns (uint256) {
        _approveMaxIfNeeded(tokenIn, UNISWAP_V3_ROUTER, amountIn);
        
        IUniswapV3Router.ExactInputSingleParams memory params = 
            IUniswapV3Router.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: fee,
                recipient: address(this),
                deadline: deadline,
                amountIn: amountIn,
                amountOutMinimum: minAmountOut,
                sqrtPriceLimitX96: 0
            });
        
        return IUniswapV3Router(UNISWAP_V3_ROUTER).exactInputSingle(params);
    }

    function _executeBalancerTrade(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        bytes32 poolId,
        uint256 deadline
    ) internal returns (uint256) {
        require(validBalancerPools[poolId], "Invalid Balancer pool");
        
        _approveMaxIfNeeded(tokenIn, BALANCER_VAULT, amountIn);
        
        IBalancerVault.SingleSwap memory singleSwap = IBalancerVault.SingleSwap({
            poolId: poolId,
            kind: IBalancerVault.SwapKind.GIVEN_IN,
            assetIn: tokenIn,
            assetOut: tokenOut,
            amount: amountIn,
            userData: ""
        });
        
        IBalancerVault.FundManagement memory funds = IBalancerVault.FundManagement({
            sender: address(this),
            fromInternalBalance: false,
            recipient: payable(address(this)),
            toInternalBalance: false
        });
        
        return IBalancerVault(BALANCER_VAULT).swap(singleSwap, funds, minAmountOut, deadline);
    }

    function _approveMaxIfNeeded(address token, address spender, uint256 amount) internal {
        uint256 current = IERC20(token).allowance(address(this), spender);
        if (current < amount) {
            (bool success,) = token.call(abi.encodeWithSelector(IERC20.approve.selector, spender, 0));
            require(success, "Approve reset failed");
            
            (success,) = token.call(abi.encodeWithSelector(IERC20.approve.selector, spender, type(uint256).max));
            require(success, "Approve max failed");
        }
    }

    function GetStatus() external view returns (
        uint256 contractTotalTrades,
        uint256 contractTotalVolume,
        uint256 contractTotalProfit,
        uint256 contractTriangleArbs,
        uint256 userFlashLoansToday,
        uint256 userRemainingCooldown,
        uint256 userDailyLimit,
        bool canTrade,
        uint256 contractWETHBalance
    ) {
        contractTotalTrades = totalTrades;
        contractTotalVolume = totalVolume;
        contractTotalProfit = totalProfit;
        contractTriangleArbs = totalTriangleArbs;
        userFlashLoansToday = dailyFlashLoanCount[msg.sender];
        
        uint256 timeSinceLastLoan = block.timestamp > lastFlashLoan[msg.sender] ? 
            block.timestamp - lastFlashLoan[msg.sender] : 0;
        userRemainingCooldown = timeSinceLastLoan >= FLASH_LOAN_COOLDOWN ? 
            0 : FLASH_LOAN_COOLDOWN - timeSinceLastLoan;
        
        userDailyLimit = DAILY_FLASH_LOAN_LIMIT;
        canTrade = userRemainingCooldown == 0 && userFlashLoansToday < DAILY_FLASH_LOAN_LIMIT && !paused();
        contractWETHBalance = IERC20(WETH).balanceOf(address(this));
    }

    function isTokenSupported(address token) external view returns (bool) {
        return supportedTokens[token];
    }

    function getDEXInfo(uint8 dexId) external view returns (DEXInfo memory) {
        require(dexId < 4, "Invalid DEX");
        return dexConfigs[dexId];
    }

    function isValidBalancerPool(bytes32 poolId) external view returns (bool) {
        return validBalancerPools[poolId];
    }

    function getUserCooldown(address user) external view returns (uint256) {
        uint256 timeSinceLastLoan = block.timestamp > lastFlashLoan[user] ? 
            block.timestamp - lastFlashLoan[user] : 0;
        return timeSinceLastLoan >= FLASH_LOAN_COOLDOWN ? 
            0 : FLASH_LOAN_COOLDOWN - timeSinceLastLoan;
    }

    function getUserDailyCount(address user) external view returns (uint256) {
        if (block.timestamp > lastDailyReset[user] + 1 days) {
            return 0;
        }
        return dailyFlashLoanCount[user];
    }

    function isTriangleArbEnabled() external view returns (bool) {
        return enableTriangleArb;
    }

    receive() external payable {
        require(msg.sender == WETH, "ETH only from WETH");
    }

    fallback() external payable {
        revert("Function not found");
    }
}

