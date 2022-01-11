//SPDX-License-Identifier: MIT License

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract SwapRouterMock is Ownable {
    using SafeERC20 for IERC20;

    address public WHT;

    constructor(address _WHT) public {
        WHT = _WHT;
    }

    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts) {
        uint len = path.length;
        uint[] memory ret = new uint[](len);
        for (uint i = 0; i < len; i++) {
            ret[i] = amountIn;
        }

        return ret;
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts) {
        uint len = path.length;
        uint[] memory ret = new uint[](len);
        uint amountOut = amountIn/2;
        for (uint i = 0; i < len; i++) {
            ret[i] = amountOut;
        }

        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(path[len-1]).safeTransfer(to, amountOut);
        return ret;
    }

    function withdraw(
        address token,
        address payable to,
        uint amount
    ) external onlyOwner {
        if (token == address(0)) {
            to.transfer(amount);
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts) {
        uint len = path.length;
        uint[] memory ret = new uint[](len);
        for (uint i = 0; i < len; i++) {
            ret[i] = amountIn;
        }

        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn);
        address payable paTo = payable(address(to));
        paTo.transfer(amountIn);
        return ret;

    }

    function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts) {
        uint len = path.length;
        uint[] memory ret = new uint[](len);
        for (uint i = 0; i < len; i++) {
            ret[i] = amountOut;
        }

        return ret;
    }

}


