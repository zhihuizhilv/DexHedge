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

    mapping(IERC20 => mapping(address => bool)) traders;
    mapping(IUniswapV2Router01 => uint256) public swapRouterIdMap;
    IUniswapV2Router01[] public swapRouterVec;

    event OnAddSwap(address _swapRouter);
    event OnRemoveSwap(address _swapRouter);
    event OnSetTrader(address _token, address _trader, bool _open);
    event OnSwap(address indexed _from, address indexed _to, uint256 _amountIn, uint256 _amountOut);
    event OnWithdraw(address indexed _token, address indexed _to, uint256 _amount);

    modifier onlyTrader(IERC20 _fromToken) {
        require(traders[_fromToken][msg.sender], "trader dont match the token");
        _;
    }

    constructor() {
    }

    // Ownable interface
    function renounceOwnership() public view override onlyOwner {
        require(false, "can't renounce ownership");
    }

    // swap manage
    function addSwap(IUniswapV2Router01 _swapRouter) public onlyOwner {
        require(address(_swapRouter) != address(0), "invalid swap router");
        uint256 len = swapRouterVec.length;
        swapRouterVec.push(_swapRouter);
        swapRouterIdMap[_swapRouter] = len;
        emit OnAddSwap(address(_swapRouter));
    }

    function removeSwap(IUniswapV2Router01 _swapRouter) public onlyOwner {
        require(address(_swapRouter) != address(0), "invalid swap router");
        uint256 id = swapRouterIdMap[_swapRouter];
        require(id < swapRouterVec.length, "invalid swap router, id over vector length");
        require(swapRouterVec[id] == _swapRouter, "invalid swap router, cant find in vector");

        delete swapRouterIdMap[_swapRouter];
        swapRouterVec[id] = IUniswapV2Router01(address(0));
        emit OnRemoveSwap(address(_swapRouter));
    }

    // trader manage
    function setTrader(address _token, address _trader, bool _open) public onlyOwner {
        require(_trader != address(0), "invalid trader");

        IERC20 token = IERC20(_token);
        token.totalSupply();

        mapping(address => bool) storage tokenTraders = traders[token];
        tokenTraders[_trader] = _open;
        emit OnSetTrader(_token, _trader, _open);
    }

    // swap
    function swap(uint256 _dexId, uint256 _amountIn, uint256 _amountOutMin, address[] calldata _path, uint _deadline) external onlyTrader(IERC20(_path[0])) {
        require(_path.length >= 2, "invalid path");
        require(_dexId < swapRouterVec.length, "invalid dex id");

        IUniswapV2Router01 router = swapRouterVec[_dexId];
        require(address(router) != address(0), "invalid swap router address");

        uint256 beginFromBalance = IERC20(_path[0]).balanceOf(address(this));
        uint256 beginToBalance = IERC20(_path[_path.length - 1]).balanceOf(address(this));

        IERC20(_path[0]).approve(address(router), _amountIn);
        router.swapExactTokensForTokens(_amountIn, _amountOutMin, _path, address(this), _deadline);

        address swapFrom = _path[0];
        address swapTo = _path[_path.length - 1];
        uint256 endFromBalance = IERC20(swapFrom).balanceOf(address(this));
        uint256 endToBalance = IERC20(swapTo).balanceOf(address(this));

        uint256 actualAmountIn = beginFromBalance.sub(endFromBalance);
        uint256 actualAmountOut = endToBalance.sub(beginToBalance);
        emit OnSwap(swapFrom, swapTo, actualAmountIn, actualAmountOut);
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
