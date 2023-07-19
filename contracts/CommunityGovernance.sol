// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CommunityGovernance is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    Ownable
{
    struct AllowedTarget {
        address target;
        string description;
    }

    AllowedTarget[] private _allowedTargets;

    constructor(
        IVotes _token
    )
        Governor("CommunityGovernance")
        //Keep this settings as lower
        GovernorSettings(2, 5, 1 ether)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)
    {}

    function votingDelay()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(
        uint256 blockNumber
    )
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function state(
        uint256 proposalId
    ) public view override(Governor) returns (ProposalState) {
        return super.state(proposalId);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor) returns (uint256) {
        for (uint i; i < targets.length; i++) {
            require(
                _targetExists(targets[i]),
                "One of the sepcified target is not whitelisted"
            );
        }
        return super.propose(targets, values, calldatas, description);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor) returns (address) {
        return super._executor();
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(Governor) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _findTargetIdx(address target) internal view returns (int) {
        for (uint i; i < _allowedTargets.length; i++) {
            AllowedTarget memory t = _allowedTargets[i];
            if (t.target == target) {
                return int(i);
            }
        }
        return -1;
    }

    function _targetExists(address target) internal view returns (bool) {
        return _findTargetIdx(target) > -1;
    }

    function addTarget(
        address target,
        string calldata description
    ) external onlyOwner returns (bool) {
        require(!_targetExists(target), "Target already exists");
        bytes memory descriptionBytes = bytes(description);
        require(descriptionBytes.length > 0, "Description cannot be empty");
        _allowedTargets.push(
            AllowedTarget({target: target, description: description})
        );
        return true;
    }

    function removeTarget(address target) external onlyOwner returns (bool) {
        int targetIdx = _findTargetIdx(target);
        require(targetIdx > -1, "Target does not exists");
        delete _allowedTargets[uint(targetIdx)];
        return true;
    }

    function allowedTargets() external view returns (AllowedTarget[] memory) {
        return _allowedTargets;
    }
}
