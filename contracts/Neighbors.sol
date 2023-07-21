// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC20Burnable {
    function burnFrom(address account, uint256 amount) external;
}

interface IERC20Mint {
    function mint(address to, uint256 amount) external;
}

contract Neighbors is Ownable {
    struct NeighborInfo {
        address owner;
        uint16 lotNumber;
        uint16 area; //m2
        uint debt;
        uint lastMint;
    }
    NeighborInfo[] public _neighbors;
    uint public timeWithinTransfers = 1 minutes;
    address public governanceTokenAddress;
    address public executorAddress;

    constructor(address _governanceTokenAddress, address _executorAddress) {
        governanceTokenAddress = _governanceTokenAddress;
        executorAddress = _executorAddress;
    }

    event RegisterNieghbor(address indexed neighbor, uint16 indexed lotNumber);
    event TransferLotOwnership(
        address indexed oldNeighbor,
        address indexed newNeighbor,
        uint16 indexed lotNumber
    );
    event RegisterPayment(
        address indexed lotOwner,
        uint16 indexed lotNumber,
        uint256 value
    );

    function registerNeighbor(
        address owner,
        uint16 lotNumber,
        uint16 area
    ) external onlyOwner {
        require(lotNumber > 0, "Lot number should be bigger than 0");
        require(area > 0, "Area should be bigger than 0");
        require(
            !_neighborOrLotExists(owner, lotNumber),
            "Member or Lot already registered. Use `transferOwnership` to update neighbor's data."
        );
        require(msg.sender != owner);

        _neighbors.push(
            NeighborInfo({
                owner: owner,
                lotNumber: lotNumber,
                area: area,
                debt: 0,
                lastMint: 0
            })
        );

        emit RegisterNieghbor(owner, lotNumber);
    }

    function loadDebt(uint16 lotNumber, uint256 debt) external onlyOwner {
        NeighborInfo storage neighbor = _getNeighborInfo(address(0), lotNumber);
        neighbor.debt += debt;
    }

    /**
     * Transfer lot ownership. Old owner should cancel the debts before transfering ownership.
     * Governance tokens are burnt and the new owner starts with balance=0;
     *
     */
    function transferLotOwnership(address _newLotNeighbor) external payable {
        require(
            !_neighborOrLotExists(_newLotNeighbor, 0),
            "New neighbor already owns another lot."
        );
        NeighborInfo storage neighbor = _getNeighborInfo(msg.sender, 0);
        require(
            neighbor.debt - msg.value == 0,
            "Debt must be cancelled completely before transfer ownership."
        );
        address _oldLotOwner = neighbor.owner;
        //get old owner's balance
        uint256 balance = IERC20(governanceTokenAddress).balanceOf(
            _oldLotOwner
        );
        //burn all old owner's tokens
        IERC20Burnable(governanceTokenAddress).burnFrom(_oldLotOwner, balance);

        //update debt
        neighbor.debt -= msg.value;
        neighbor.owner = _newLotNeighbor;
        neighbor.lastMint = 0;
        emit TransferLotOwnership(
            _oldLotOwner,
            _newLotNeighbor,
            neighbor.lotNumber
        );
    }

    function _neighborOrLotExists(
        address _owner,
        uint16 _lotNumber
    ) internal view returns (bool) {
        int index = _findIndex(_owner, _lotNumber);
        if (index == -1) {
            return false;
        }
        return true;
    }

    function _findIndex(
        address _owner,
        uint16 _lotNumber
    ) internal view returns (int) {
        for (uint i; i < _neighbors.length; i++) {
            if (
                _neighbors[i].owner == _owner ||
                _neighbors[i].lotNumber == _lotNumber
            ) {
                return int(i);
            }
        }
        return -1;
    }

    /**
     * Returns storage reference of the neighbor or fails if it doens't exist.
     *
     */
    function _getNeighborInfo(
        address _owner,
        uint16 _lotNumber
    ) internal view returns (NeighborInfo storage) {
        int index = _findIndex(_owner, _lotNumber);
        if (index == -1) {
            revert("Neighbor not found");
        }
        return _neighbors[uint256(index)];
    }

    /**
        _afterPayment will tramsfer governance tokens for the payer
     */
    function _afterPayment(NeighborInfo storage neighbor) internal {
        uint amount = 1 ether;
        //Mint once every _timeWithinTransfers (1 minute)
        if (
            neighbor.lastMint != 0 &&
            block.timestamp - neighbor.lastMint < timeWithinTransfers
        ) {
            return;
        }
        //less than 1000m2
        if (neighbor.area > 500 && neighbor.area < 1000) {
            amount = 2 ether;
        }
        //more than 1000 m2
        if (neighbor.area >= 1000) {
            amount = 3 ether;
        }

        IERC20Mint(governanceTokenAddress).mint(neighbor.owner, amount);
        neighbor.lastMint = block.timestamp;
    }

    function updateTimeWhitinTransfers(uint newTime) external onlyOwner {
        require(newTime < 28 days, "Time should be lower than 28 days");
        timeWithinTransfers = newTime;
    }

    function neighbors() external view returns (NeighborInfo[] memory) {
        return _neighbors;
    }

    /**
     * Receives a payment and updates neighbor debt.
     *
     */
    receive() external payable {
        NeighborInfo storage neighbor = _getNeighborInfo(msg.sender, 0);
        require(neighbor.lotNumber > 0);
        require(
            neighbor.debt - msg.value >= 0,
            "Received a payment bigger than the debt."
        );
        neighbor.debt -= msg.value;
        emit RegisterPayment(neighbor.owner, neighbor.lotNumber, msg.value);

        _afterPayment(neighbor);

        //10% of the payment is tansferred to the budget holder (timelock executor)
        uint extraBudget = (msg.value * 10) / 100;
        (bool s, ) = payable(executorAddress).call{value: extraBudget}("");
        require(s, "Failed to send Ether to Budget holder.");
    }

    /**
     * Avoid MetaMask issues: https://github.com/MetaMask/metamask-extension/issues/15372
     */
    fallback() external {}
}
