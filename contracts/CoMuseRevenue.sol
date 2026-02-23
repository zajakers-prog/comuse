// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CoMuseRevenue
 * @notice 공동집필 플랫폼 CoMuse의 IP 판매 수익 배분 스마트 컨트랙트
 *
 * 흐름:
 * 1. 플랫폼이 IP 판매 수익(ETH)을 이 컨트랙트로 전송
 * 2. 각 기여자의 배분 비율은 AI 분석 결과를 바탕으로 플랫폼이 등록
 * 3. 기여자들이 직접 withdraw() 호출하여 자신의 몫을 수령
 * 4. 플랫폼 수수료는 platformFee (기본 10%)
 */
contract CoMuseRevenue {
    address public owner;
    uint256 public platformFeeBps = 1000; // 10% (basis points)

    struct WorkRevenue {
        string workId;          // CoMuse DB의 Work UUID
        uint256 totalAmount;    // 총 판매 ETH
        bool distributed;       // 배분 완료 여부
        address[] contributors;
        mapping(address => uint256) shares; // basis points (합계 = 10000 - platformFeeBps)
        mapping(address => uint256) claimed;
    }

    mapping(bytes32 => WorkRevenue) private revenues;

    event RevenueDeposited(bytes32 indexed workHash, string workId, uint256 amount);
    event SharesSet(bytes32 indexed workHash, address[] contributors, uint256[] shareBps);
    event Claimed(bytes32 indexed workHash, address contributor, uint256 amount);
    event PlatformFeeWithdrawn(address to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice IP 판매 수익을 특정 작품에 예치
     * @param workId CoMuse DB의 Work UUID
     */
    function depositRevenue(string calldata workId) external payable {
        require(msg.value > 0, "No ETH sent");
        bytes32 workHash = keccak256(bytes(workId));
        WorkRevenue storage rev = revenues[workHash];
        rev.workId = workId;
        rev.totalAmount += msg.value;
        emit RevenueDeposited(workHash, workId, msg.value);
    }

    /**
     * @notice AI 분석 결과 기반 배분 비율을 설정 (플랫폼 운영자만)
     * @param workId 작품 ID
     * @param contributors 기여자 지갑 주소 배열
     * @param shareBps 각 기여자의 배분 비율 (basis points, 합계 = 10000 - platformFeeBps)
     */
    function setShares(
        string calldata workId,
        address[] calldata contributors,
        uint256[] calldata shareBps
    ) external onlyOwner {
        require(contributors.length == shareBps.length, "Length mismatch");
        bytes32 workHash = keccak256(bytes(workId));
        WorkRevenue storage rev = revenues[workHash];
        require(!rev.distributed, "Already distributed");

        uint256 totalShares = 0;
        for (uint256 i = 0; i < shareBps.length; i++) {
            totalShares += shareBps[i];
        }
        require(
            totalShares == 10000 - platformFeeBps,
            "Shares must sum to (10000 - platformFee)"
        );

        rev.contributors = contributors;
        for (uint256 i = 0; i < contributors.length; i++) {
            rev.shares[contributors[i]] = shareBps[i];
        }

        emit SharesSet(workHash, contributors, shareBps);
    }

    /**
     * @notice 기여자가 자신의 몫을 수령
     * @param workId 작품 ID
     */
    function claim(string calldata workId) external {
        bytes32 workHash = keccak256(bytes(workId));
        WorkRevenue storage rev = revenues[workHash];
        require(rev.totalAmount > 0, "No revenue");
        require(rev.shares[msg.sender] > 0, "No share");

        uint256 total = rev.totalAmount;
        uint256 shareBps = rev.shares[msg.sender];
        uint256 entitled = (total * shareBps) / 10000;
        uint256 alreadyClaimed = rev.claimed[msg.sender];
        uint256 claimable = entitled - alreadyClaimed;

        require(claimable > 0, "Nothing to claim");

        rev.claimed[msg.sender] += claimable;

        (bool success, ) = msg.sender.call{value: claimable}("");
        require(success, "Transfer failed");

        emit Claimed(workHash, msg.sender, claimable);
    }

    /**
     * @notice 플랫폼 수수료 수령
     * @param workId 작품 ID
     */
    function withdrawPlatformFee(string calldata workId) external onlyOwner {
        bytes32 workHash = keccak256(bytes(workId));
        WorkRevenue storage rev = revenues[workHash];
        require(rev.totalAmount > 0, "No revenue");

        uint256 fee = (rev.totalAmount * platformFeeBps) / 10000;
        (bool success, ) = owner.call{value: fee}("");
        require(success, "Transfer failed");

        emit PlatformFeeWithdrawn(owner, fee);
    }

    /**
     * @notice 작품의 수익 정보 조회
     */
    function getWorkRevenue(string calldata workId)
        external
        view
        returns (
            uint256 totalAmount,
            address[] memory contributors,
            uint256[] memory shareBps,
            uint256[] memory claimed
        )
    {
        bytes32 workHash = keccak256(bytes(workId));
        WorkRevenue storage rev = revenues[workHash];

        uint256 len = rev.contributors.length;
        uint256[] memory shares = new uint256[](len);
        uint256[] memory claimedArr = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            shares[i] = rev.shares[rev.contributors[i]];
            claimedArr[i] = rev.claimed[rev.contributors[i]];
        }

        return (rev.totalAmount, rev.contributors, shares, claimedArr);
    }

    /**
     * @notice 플랫폼 수수료 비율 변경 (최대 20%)
     */
    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 2000, "Fee cannot exceed 20%");
        platformFeeBps = newFeeBps;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    receive() external payable {}
}
