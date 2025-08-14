module myAddr::health_record {
    use std::vector;
    use std::signer;
    use std::string::{Self, String};
    use std::error;
    use aptos_framework::event;

    // Error codes
    const EALREADY_EXISTS: u64 = 1;
    const ENOT_AUTHORIZED_ADD: u64 = 2;
    const ENOT_AUTHORIZED_GET: u64 = 3;
    const ESELF_GRANT_NOT_ALLOWED: u64 = 4;
    const ERECORD_NOT_FOUND: u64 = 5;
    const EINVALID_CID: u64 = 6;

    // Events for monitoring
    #[event]
    struct RecordAdded has drop, store {
        patient: address,
        cid: String,
        timestamp: u64,
    }

    #[event]
    struct AccessGranted has drop, store {
        patient: address,
        doctor: address,
        timestamp: u64,
    }

    #[event]
    struct AccessRevoked has drop, store {
        patient: address,
        doctor: address,
        timestamp: u64,
    }

    // HealthRecord stores a vector of CIDs and a list of authorized doctors
    struct HealthRecord has key {
        cids: vector<String>,
        authorized_doctors: vector<address>,
        created_at: u64,
        last_updated: u64,
    }

    /// Initialize the health record system for the user
    public entry fun initialize(account: &signer) {
        create_record(account);
    }

    /// Create a HealthRecord for the signer
    public fun create_record(account: &signer) {
        let addr = signer::address_of(account);
        assert!(!exists<HealthRecord>(addr), error::already_exists(EALREADY_EXISTS));
        
        let timestamp = aptos_framework::timestamp::now_microseconds();
        
        move_to(account, HealthRecord {
            cids: vector::empty<String>(),
            authorized_doctors: vector::empty<address>(),
            created_at: timestamp,
            last_updated: timestamp,
        });
    }

    /// Add a new CID (file) to the signer's record with validation
    public entry fun add_record(account: &signer, cid: String) acquires HealthRecord {
        let addr = signer::address_of(account);
        
        // Ensure the record exists, create if it doesn't
        if (!exists<HealthRecord>(addr)) {
            create_record(account);
        };

        let record = borrow_global_mut<HealthRecord>(addr);

        // Validate CID format (basic check for IPFS CID)
        assert!(string::length(&cid) >= 46, error::invalid_argument(EINVALID_CID));
        assert!(string::index_of(&cid, &string::utf8(b"Qm")) == 0, error::invalid_argument(EINVALID_CID));

        // Check for duplicate CIDs
        let len = vector::length(&record.cids);
        let mut i = 0;
        while (i < len) {
            let existing_cid = vector::borrow(&record.cids, i);
            assert!(&cid != existing_cid, error::already_exists(EALREADY_EXISTS));
            i = i + 1;
        };

        // Add the new CID
        vector::push_back(&mut record.cids, cid);
        record.last_updated = aptos_framework::timestamp::now_microseconds();

        // Emit event
        event::emit(RecordAdded {
            patient: addr,
            cid,
            timestamp: record.last_updated,
        });
    }

    /// Grant access to a doctor with validation
    public entry fun grant_access(account: &signer, doctor: address) acquires HealthRecord {
        let addr = signer::address_of(account);
        assert!(addr != doctor, error::invalid_argument(ESELF_GRANT_NOT_ALLOWED));
        
        // Ensure the record exists
        if (!exists<HealthRecord>(addr)) {
            create_record(account);
        };

        let record = borrow_global_mut<HealthRecord>(addr);

        // Check if doctor already has access
        let len = vector::length(&record.authorized_doctors);
        let mut i = 0;
        while (i < len) {
            let existing_doctor = vector::borrow(&record.authorized_doctors, i);
            assert!(&doctor != existing_doctor, error::already_exists(EALREADY_EXISTS));
            i = i + 1;
        };

        // Grant access
        vector::push_back(&mut record.authorized_doctors, doctor);
        record.last_updated = aptos_framework::timestamp::now_microseconds();

        // Emit event
        event::emit(AccessGranted {
            patient: addr,
            doctor,
            timestamp: record.last_updated,
        });
    }

    /// Revoke access from a doctor
    public entry fun revoke_access(account: &signer, doctor: address) acquires HealthRecord {
        let addr = signer::address_of(account);
        assert!(exists<HealthRecord>(addr), error::not_found(ERECORD_NOT_FOUND));
        
        let record = borrow_global_mut<HealthRecord>(addr);

        // Find and remove the doctor
        let mut new_list = vector::empty<address>();
        let len = vector::length(&record.authorized_doctors);
        let mut i = 0;
        let mut found = false;
        
        while (i < len) {
            let current_doctor = *vector::borrow(&record.authorized_doctors, i);
            if (current_doctor != doctor) {
                vector::push_back(&mut new_list, current_doctor);
            } else {
                found = true;
            };
            i = i + 1;
        };

        record.authorized_doctors = new_list;
        record.last_updated = aptos_framework::timestamp::now_microseconds();

        if (found) {
            // Emit event only if doctor was actually removed
            event::emit(AccessRevoked {
                patient: addr,
                doctor,
                timestamp: record.last_updated,
            });
        };
    }

    /// Check if a doctor has access to patient records
    public fun has_access(patient: address, doctor: address): bool acquires HealthRecord {
        if (patient == doctor) {
            return true
        };

        if (!exists<HealthRecord>(patient)) {
            return false
        };

        let record = borrow_global<HealthRecord>(patient);
        let len = vector::length(&record.authorized_doctors);
        let mut i = 0;
        
        while (i < len) {
            if (*vector::borrow(&record.authorized_doctors, i) == doctor) {
                return true
            };
            i = i + 1;
        };
        
        false
    }

    /// Fetch records (only accessible by the owner or authorized doctors)
    public fun get_records(patient: address, requester: address): vector<String> acquires HealthRecord {
        assert!(exists<HealthRecord>(patient), error::not_found(ENOT_AUTHORIZED_GET));
        
        // Check authorization
        assert!(
            requester == patient || has_access(patient, requester), 
            error::permission_denied(ENOT_AUTHORIZED_GET)
        );

        let record = borrow_global<HealthRecord>(patient);

        // Return a cloned vector (deep copy) for safety
        let mut result = vector::empty<String>();
        let len = vector::length(&record.cids);
        let mut i = 0;
        
        while (i < len) {
            let cid = vector::borrow(&record.cids, i);
            vector::push_back(&mut result, *cid);
            i = i + 1;
        };
        
        result
    }

    /// Get the list of authorized doctors for a patient
    public fun get_authorized_doctors(patient: address, requester: address): vector<address> acquires HealthRecord {
        assert!(exists<HealthRecord>(patient), error::not_found(ERECORD_NOT_FOUND));
        assert!(requester == patient, error::permission_denied(ENOT_AUTHORIZED_GET));

        let record = borrow_global<HealthRecord>(patient);
        
        // Return a copy of the authorized doctors list
        let mut result = vector::empty<address>();
        let len = vector::length(&record.authorized_doctors);
        let mut i = 0;
        
        while (i < len) {
            let doctor = vector::borrow(&record.authorized_doctors, i);
            vector::push_back(&mut result, *doctor);
            i = i + 1;
        };
        
        result
    }

    /// Get record metadata (timestamps, count)
    public fun get_record_info(patient: address, requester: address): (u64, u64, u64, u64) acquires HealthRecord {
        assert!(exists<HealthRecord>(patient), error::not_found(ERECORD_NOT_FOUND));
        assert!(
            requester == patient || has_access(patient, requester), 
            error::permission_denied(ENOT_AUTHORIZED_GET)
        );

        let record = borrow_global<HealthRecord>(patient);
        (
            record.created_at,
            record.last_updated,
            vector::length(&record.cids),
            vector::length(&record.authorized_doctors)
        )
    }

    /// Remove a specific CID from records (patient only)
    public entry fun remove_record(account: &signer, cid: String) acquires HealthRecord {
        let addr = signer::address_of(account);
        assert!(exists<HealthRecord>(addr), error::not_found(ERECORD_NOT_FOUND));
        
        let record = borrow_global_mut<HealthRecord>(addr);

        // Find and remove the CID
        let mut new_list = vector::empty<String>();
        let len = vector::length(&record.cids);
        let mut i = 0;
        let mut found = false;
        
        while (i < len) {
            let current_cid = vector::borrow(&record.cids, i);
            if (current_cid != &cid) {
                vector::push_back(&mut new_list, *current_cid);
            } else {
                found = true;
            };
            i = i + 1;
        };

        assert!(found, error::not_found(ERECORD_NOT_FOUND));
        
        record.cids = new_list;
        record.last_updated = aptos_framework::timestamp::now_microseconds();
    }

    /// Batch add multiple records (more efficient for multiple uploads)
    public entry fun batch_add_records(account: &signer, cids: vector<String>) acquires HealthRecord {
        let addr = signer::address_of(account);
        
        // Ensure the record exists
        if (!exists<HealthRecord>(addr)) {
            create_record(account);
        };

        let record = borrow_global_mut<HealthRecord>(addr);
        let timestamp = aptos_framework::timestamp::now_microseconds();

        // Add each CID with validation
        let batch_len = vector::length(&cids);
        let mut j = 0;
        
        while (j < batch_len) {
            let cid = vector::borrow(&cids, j);
            
            // Validate CID format
            assert!(string::length(cid) >= 46, error::invalid_argument(EINVALID_CID));
            assert!(string::index_of(cid, &string::utf8(b"Qm")) == 0, error::invalid_argument(EINVALID_CID));

            // Check for duplicates in existing records
            let existing_len = vector::length(&record.cids);
            let mut k = 0;
            while (k < existing_len) {
                let existing_cid = vector::borrow(&record.cids, k);
                assert!(cid != existing_cid, error::already_exists(EALREADY_EXISTS));
                k = k + 1;
            };

            // Add to records
            vector::push_back(&mut record.cids, *cid);
            
            // Emit event for each record
            event::emit(RecordAdded {
                patient: addr,
                cid: *cid,
                timestamp,
            });

            j = j + 1;
        };

        record.last_updated = timestamp;
    }

    /// Emergency revoke all access (for patient security)
    public entry fun revoke_all_access(account: &signer) acquires HealthRecord {
        let addr = signer::address_of(account);
        assert!(exists<HealthRecord>(addr), error::not_found(ERECORD_NOT_FOUND));
        
        let record = borrow_global_mut<HealthRecord>(addr);
        
        // Emit revoke events for all current doctors
        let len = vector::length(&record.authorized_doctors);
        let mut i = 0;
        let timestamp = aptos_framework::timestamp::now_microseconds();
        
        while (i < len) {
            let doctor = *vector::borrow(&record.authorized_doctors, i);
            event::emit(AccessRevoked {
                patient: addr,
                doctor,
                timestamp,
            });
            i = i + 1;
        };

        // Clear all authorized doctors
        record.authorized_doctors = vector::empty<address>();
        record.last_updated = timestamp;
    }

    // ================== View Functions for Monitoring ==================

    /// Check if a health record exists for an address
    public fun record_exists(patient: address): bool {
        exists<HealthRecord>(patient)
    }

    /// Get total number of patients in the system (for analytics)
    /// Note: This would need to be implemented with a global registry in practice
    
    /// Validate CID format without modifying state
    public fun is_valid_cid(cid: &String): bool {
        string::length(cid) >= 46 && string::index_of(cid, &string::utf8(b"Qm")) == 0
    }

    // ================== Admin Functions (Optional) ==================
    
    /// For system administrators to check system health
    /// In production, this should be restricted to admin addresses
    public fun admin_get_record_count(patient: address): (u64, u64) acquires HealthRecord {
        if (!exists<HealthRecord>(patient)) {
            return (0, 0)
        };
        
        let record = borrow_global<HealthRecord>(patient);
        (
            vector::length(&record.cids),
            vector::length(&record.authorized_doctors)
        )
    }

    // ================== Test Helper Functions ==================
    
    #[test_only]
    public fun test_create_record_for_testing(account: &signer) {
        create_record(account);
    }
    
    #[test_only]
    public fun test_get_record_data(patient: address): (vector<String>, vector<address>) acquires HealthRecord {
        assert!(exists<HealthRecord>(patient), ERECORD_NOT_FOUND);
        let record = borrow_global<HealthRecord>(patient);
        (record.cids, record.authorized_doctors)
    }
}