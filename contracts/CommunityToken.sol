// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract CommunityToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    constructor()
        ERC20("CommunityToken", "CTK")
        ERC20Permit("CommunityToken")
    {}

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function _burn(
        address account,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }

    function burnFrom(address account, uint256 amount) external onlyOwner {
        unchecked {
            super._approve(account, _msgSender(), amount);
        }
        _burn(account, amount);
    }

    /**
     * Avoid MetaMask issues: https://github.com/MetaMask/metamask-extension/issues/15372
     */
    fallback() external {}
}
