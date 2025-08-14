module myAddr::health_record {
    use std::vector;
    use std::signer;
    use std::string;
    
    /// Error codes
    const EALREADY_EXISTS: u64 = 1;
    const ENOT_AUTHORIZED_ADD: u64 = 2;
    const ENOT_AUTHORIZED_GET: u64 = 3;
    const ESELF_GRANT_NOT_ALLOWED: u64 = 4;
    const ERECORD_NOT_FOUND: u64 = 5;
    
    /// HealthRecord stores a vector of CIDs and a list of authorized doctors
    struct HealthRecord has key {
        cids: vector<string::String>,
        authorized_doctors: vector<address>,
    }
    
    /// Create a HealthRecord for the signer
    public fun create_record(account: &signer) {
        let addr = signer::address_of(account);
        assert!(!exists<HealthRecord>(addr), EALREADY_EXISTS);
        move_to(account, HealthRecord {
            cids: vector::empty<string::String>(),
            authorized_doctors: vector::empty<address>(),
        });
    }
    
    /// Add a new CID (file) to the signer's record
    public fun add_record(account: &signer, cid: string::String) acquires HealthRecord {
        let addr = signer::address_of(account);
        assert!(exists<HealthRecord>(addr), ERECORD_NOT_FOUND);
        let record = borrow_global_mut<HealthRecord>(addr);
        
        // Check for duplicates using built-in function
        assert!(!vector::contains(&record.cids, &cid), EALREADY_EXISTS);
        vector::push_back(&mut record.cids, cid);
    }
    
    /// Grant access to a doctor
    public fun grant_access(account: &signer, doctor: address) acquires HealthRecord {
        let addr = signer::address_of(account);
        assert!(addr != doctor, ESELF_GRANT_NOT_ALLOWED);
        assert!(exists<HealthRecord>(addr), ERECORD_NOT_FOUND);
        let record = borrow_global_mut<HealthRecord>(addr);
        
        // Check if already authorized using built-in function
        assert!(!vector::contains(&record.authorized_doctors, &doctor), EALREADY_EXISTS);
        vector::push_back(&mut record.authorized_doctors, doctor);
    }
    
    /// Revoke access from a doctor
    public fun revoke_access(account: &signer, doctor: address) acquires HealthRecord {
        let addr = signer::address_of(account);
        assert!(exists<HealthRecord>(addr), ERECORD_NOT_FOUND);
        let record = borrow_global_mut<HealthRecord>(addr);
        
        // Use built-in remove function
        let (found, index) = vector::index_of(&record.authorized_doctors, &doctor);
        if (found) {
            vector::remove(&mut record.authorized_doctors, index);
        };
    }
    
    /// Check if an address is authorized to access records
    fun is_authorized(record: &HealthRecord, requester: address, patient: address): bool {
        if (requester == patient) {
            return true
        };
        vector::contains(&record.authorized_doctors, &requester)
    }
    
    /// Fetch records (only accessible by the owner or authorized doctors)
    public fun get_records(patient: address, requester: address): vector<string::String> acquires HealthRecord {
        assert!(exists<HealthRecord>(patient), ENOT_AUTHORIZED_GET);
        let record = borrow_global<HealthRecord>(patient);
        
        assert!(is_authorized(record, requester, patient), ENOT_AUTHORIZED_GET);
        record.cids
    }
    
    /// View function to check if a doctor is authorized (read-only)
    #[view]
    public fun is_doctor_authorized(patient: address, doctor: address): bool acquires HealthRecord {
        if (!exists<HealthRecord>(patient)) {
            return false
        };
        let record = borrow_global<HealthRecord>(patient);
        vector::contains(&record.authorized_doctors, &doctor)
    }
    
    /// View function to get the number of records (read-only)
    #[view]
    public fun get_record_count(patient: address): u64 acquires HealthRecord {
        if (!exists<HealthRecord>(patient)) {
            return 0
        };
        let record = borrow_global<HealthRecord>(patient);
        vector::length(&record.cids)
    }
}