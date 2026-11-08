// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ThreatReportRegistry
 * @dev Decentralized Threat Intelligence Registry for PhishFree
 * 
 * Provides cryptographic integrity, timestamped proof of existence, and public
 * tamper-verification for AI and cybersecurity threat analysis reports.
 * 
 * IMPORTANT:
 * This registry stores only deterministic cryptographic digests (Keccak-256) of canonical
 * forensic reports. It records WHEN and BY WHOM a fingerprint was registered.
 * The blockchain record proves report integrity and immutability; it does NOT independently
 * determine whether the analyzed website or message was malicious.
 */
contract ThreatReportRegistry {

    struct ThreatReport {
        bytes32 reportHash;
        uint256 timestamp;
        address submitter;
        bool exists;
    }

    // Mapping from report Keccak-256 hash to stored ThreatReport record
    mapping(bytes32 => ThreatReport) public reports;

    // Ordered list of all registered hashes for public auditability
    bytes32[] public reportHashes;

    // Total count of reports registered
    uint256 public totalReportsRegistered;

    // Registry contract deployer/owner address
    address public immutable owner;

    // Events
    event ReportRegistered(
        bytes32 indexed reportHash,
        address indexed submitter,
        uint256 timestamp
    );

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Registers a new threat report cryptographic fingerprint on-chain.
     * @param reportHash The 32-byte Keccak-256 hash of the canonical report.
     * @return success True upon successful registration.
     */
    function registerReport(bytes32 reportHash) external returns (bool success) {
        // Validation: reject null/zero hash
        require(reportHash != bytes32(0), "Invalid report hash: zero hash rejected");

        // Validation: prevent duplicate registration
        require(!reports[reportHash].exists, "Report hash already registered");

        // Record the report
        reports[reportHash] = ThreatReport({
            reportHash: reportHash,
            timestamp: block.timestamp,
            submitter: msg.sender,
            exists: true
        });

        reportHashes.push(reportHash);
        totalReportsRegistered += 1;

        emit ReportRegistered(reportHash, msg.sender, block.timestamp);

        return true;
    }

    /**
     * @notice Verifies whether a given report hash exists in the registry.
     * @param reportHash The 32-byte Keccak-256 hash to query.
     * @return exists Whether the report hash is registered on-chain.
     * @return registeredHash The registered hash recorded in storage.
     * @return timestamp The block timestamp when the report was registered.
     * @return submitter The address that submitted the registration.
     */
    function verifyReport(bytes32 reportHash)
        external
        view
        returns (
            bool exists,
            bytes32 registeredHash,
            uint256 timestamp,
            address submitter
        )
    {
        ThreatReport storage rep = reports[reportHash];
        if (rep.exists) {
            return (true, rep.reportHash, rep.timestamp, rep.submitter);
        }
        return (false, bytes32(0), 0, address(0));
    }

    /**
     * @notice Helper to check existence of a report hash.
     * @param reportHash The 32-byte hash to test.
     */
    function isReportRegistered(bytes32 reportHash) external view returns (bool) {
        return reports[reportHash].exists;
    }

    /**
     * @notice Returns full ThreatReport struct for a registered hash.
     * @param reportHash The registered 32-byte hash.
     */
    function getReportDetails(bytes32 reportHash) external view returns (ThreatReport memory) {
        require(reports[reportHash].exists, "Report not registered");
        return reports[reportHash];
    }

    /**
     * @notice Returns total number of registered reports.
     */
    function getTotalReports() external view returns (uint256) {
        return totalReportsRegistered;
    }

    /**
     * @notice Returns up to `count` most recent registered threat reports for dashboard exploration.
     * @param count Maximum number of recent reports to fetch.
     */
    function getRecentReports(uint256 count) external view returns (ThreatReport[] memory) {
        uint256 total = reportHashes.length;
        if (total == 0) {
            return new ThreatReport[](0);
        }

        uint256 fetchCount = count;
        if (fetchCount > total) {
            fetchCount = total;
        }

        ThreatReport[] memory recent = new ThreatReport[](fetchCount);
        for (uint256 i = 0; i < fetchCount; i++) {
            bytes32 h = reportHashes[total - 1 - i];
            recent[i] = reports[h];
        }

        return recent;
    }
}

