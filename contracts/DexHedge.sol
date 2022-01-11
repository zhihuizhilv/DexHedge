//SPDX-License-Identifier: MIT License

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DexHedge is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    mapping(IERC20 => mapping(address => bool)) public traders;
    mapping(IUniswapV2Router01 => uint256) public swapRouterIdMap;
    IUniswapV2Router01[] public swapRouterVec;

    event OnAddDex(address _swapRouter, uint256 _id);
    event OnRemoveDex(address _swapRouter, uint256 _id);
    event OnSetTrader(address _token, address _trader, bool _open);
    event OnSwap(address indexed _from, address indexed _to, uint256 _amountIn, uint256 _amountOut);
    event OnWithdraw(address indexed _token, address indexed _to, uint256 _amount);

    modifier onlyTrader(IERC20 _fromToken) {
        require(traders[_fromToken][msg.sender], "trader don't match the from token");
        _;
    }

    constructor() {
    }

    receive() external payable {
    }

    // Ownable interface
    function renounceOwnership() public override {
        require(false, "can't renounce ownership");
    }

    // DEX manage
    function dexPoolLen() public view returns(uint256) {
        return swapRouterVec.length;
    }

    function addDex(IUniswapV2Router01 _swapRouter) public onlyOwner {
        require(address(_swapRouter) != address(0), "invalid swap router");
        uint256 len = swapRouterVec.length;
        swapRouterVec.push(_swapRouter);
        swapRouterIdMap[_swapRouter] = len;
        emit OnAddDex(address(_swapRouter), len);
    }

    function removeDex(uint256 _dexId) public onlyOwner {
        require(_dexId < swapRouterVec.length, "invalid swap router, id over vector length");
        IUniswapV2Router01 swapRouter = swapRouterVec[_dexId];
        require(address(swapRouter) != address(0), "removed already");

        uint256 mapId = swapRouterIdMap[swapRouter];
        if (mapId == _dexId) {
            delete swapRouterIdMap[swapRouter];
        }

        swapRouterVec[_dexId] = IUniswapV2Router01(address(0));
        emit OnRemoveDex(address(swapRouter), _dexId);
    }

    // trader manage
    function setTrader(IERC20 _token, address _trader, bool _open) public onlyOwner {
        require(_trader != address(0), "invalid trader");
        _token.totalSupply();

        mapping(address => bool) storage tokenTraders = traders[_token];
        tokenTraders[_trader] = _open;
        emit OnSetTrader(address(_token), _trader, _open);
    }

    // swap
    function swap(uint256 _dexId, uint256 _amountIn, uint256 _amountOutMin, address[] calldata _path, uint _deadline) external onlyTrader(IERC20(_path[0])) {
        require(_path.length >= 2, "invalid path");
        require(_dexId < swapRouterVec.length, "invalid dex id");

        IUniswapV2Router01 router = swapRouterVec[_dexId];
        require(address(router) != address(0), "dex be removed already");

        IERC20 tokenFrom = IERC20(_path[0]);
        IERC20 tokenTo = IERC20(_path[_path.length - 1]);

        uint256 beginFromBalance = tokenFrom.balanceOf(address(this));
        uint256 beginToBalance = tokenTo.balanceOf(address(this));

        tokenFrom.approve(address(router), _amountIn);
        router.swapExactTokensForTokens(_amountIn, _amountOutMin, _path, address(this), _deadline);

        uint256 endFromBalance = tokenFrom.balanceOf(address(this));
        uint256 endToBalance = tokenTo.balanceOf(address(this));

        uint256 actualAmountIn = beginFromBalance.sub(endFromBalance);
        uint256 actualAmountOut = endToBalance.sub(beginToBalance);
        emit OnSwap(address(tokenFrom), address(tokenTo), actualAmountIn, actualAmountOut);
    }

    // withdraw
    function withdraw(IERC20 _token, address payable _to, uint256 _amount) external onlyOwner {
        if (address(_token) == address(0)) {
            _to.transfer(_amount);
        } else {
            _token.safeTransfer(_to, _amount);
        }

        emit OnWithdraw(address(_token), _to, _amount);
    }

}
