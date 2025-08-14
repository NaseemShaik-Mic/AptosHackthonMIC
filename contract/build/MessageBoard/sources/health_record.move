module myAddr::health_record {
    use std::vector;
    use std::signer;
    use std::string::{Self, String};
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::guid;
    use aptos_framework::account;
    use aptos_std::table::{Self, Table};

    /// Error codes
    const EACCOUNT_ALREADY_EXISTS: u64 = 1;
    const EUNAUTHORIZED_ACCESS: u64 = 2;
    const EACCOUNT_NOT_FOUND: u64 = 3;
    const EINVALID_CID: u64 = 4;
    const ERECORD_NOT_FOUND: u64 = 5;

    /// Health record structure with IPFS integration
    struct HealthRecord has key {
        /// IPFS Content Identifiers for stored files
        cid_list: vector<String>,
        /// Metadata for each record (filename, upload time, file size, etc.)
        metadata: Table<String, RecordMetadata>,
        /// Owner of the health record
        owner: address,
        /// List of addresses with access permissions
        access_list: vector<address>,
        /// Emergency contacts who always have access
        emergency_contacts: vector<address>,
        /// Record creation timestamp
        created_at: u64,
        /// Last updated timestamp
        updated_at: u64,
    }

    /// Metadata structure for each health record
    struct RecordMetadata has store, copy, drop {
        /// Original filename
        filename: String,
        /// File size in bytes
        file_size: u64,
        /// MIME type of the file
        file_type: String,
        /// Upload timestamp
        upload_time: u64,
        /// Encryption status
        is_encrypted: bool,
        /// Record category (lab, imaging, prescription, etc.)
        category: String,
        /// Additional notes or description
        description: String,
    }

    /// Event structures for logging
    #[event]
    struct RecordAddedEvent has drop, store {
        patient: address,
        cid: String,
        filename: String,
        timestamp: u64,
    }

    #[event]
    struct AccessGrantedEvent has drop, store {
        patient: address,
        doctor: address,
        timestamp: u64,
    }

    #[event]
    struct AccessRevokedEvent has drop, store {
        patient: address,
        doctor: address,
        timestamp: u64,
    }

    /// Initialize a new patient account with health record storage
    public entry fun init_patient_account(account: &signer) {
        let addr = signer::address_of(account);
        
        // Ensure account doesn't already exist
        assert!(!exists<HealthRecord>(addr), EACCOUNT_ALREADY_EXISTS);
        
        let current_time = timestamp::now_seconds();
        
        // Create new health record
        move_to(account, HealthRecord {
            cid_list: vector::empty<String>(),
            metadata: table::new<String, RecordMetadata>(),
            owner: addr,
            access_list: vector::empty<address>(),
            emergency_contacts: vector::empty<address>(),
            created_at: current_time,
            updated_at: current_time,
        });
    }

    /// Add a new health record with IPFS CID and metadata
    public entry fun add_record(
        sender: &signer,
        patient: address,
        cid: String,
        filename: String,
        file_size: u64,
        file_type: String,
        category: String,
        description: String
    ) acquires HealthRecord {
        // Validate CID format (basic validation)
        assert!(string::length(&cid) > 0, EINVALID_CID);
        assert!(exists<HealthRecord>(patient), EACCOUNT_NOT_FOUND);
        
        let record_ref = borrow_global_mut<HealthRecord>(patient);
        let sender_addr = signer::address_of(sender);
        let current_time = timestamp::now_seconds();
        
        // Check authorization (owner, doctor with access, or emergency contact)
        assert!(
            sender_addr == record_ref.owner || 
            is_in_access_list(&record_ref.access_list, sender_addr) ||
            is_in_access_list(&record_ref.emergency_contacts, sender_addr),
            EUNAUTHORIZED_ACCESS
        );
        
        // Add CID to the list
        vector::push_back(&mut record_ref.cid_list, cid);
        
        // Create and store metadata
        let metadata = RecordMetadata {
            filename,
            file_size,
            file_type,
            upload_time: current_time,
            is_encrypted: true, // Assume all files are encrypted
            category,
            description,
        };
        
        table::add(&mut record_ref.metadata, cid, metadata);
        record_ref.updated_at = current_time;
        
        // Emit event using the new event system
        event::emit(RecordAddedEvent {
            patient,
            cid,
            filename,
            timestamp: current_time,
        });
    }

    /// Get all health records for a patient (returns CIDs only for privacy)
    public fun get_records(patient: address, requester: address): vector<String> acquires HealthRecord {
        assert!(exists<HealthRecord>(patient), EACCOUNT_NOT_FOUND);
        
        let record_ref = borrow_global<HealthRecord>(patient);
        
        // Check authorization
        assert!(
            requester == record_ref.owner || 
            is_in_access_list(&record_ref.access_list, requester) ||
            is_in_access_list(&record_ref.emergency_contacts, requester),
            EUNAUTHORIZED_ACCESS
        );
        
        record_ref.cid_list
    }

    /// Get metadata for a specific record
    public fun get_record_metadata(patient: address, cid: String, requester: address): RecordMetadata acquires HealthRecord {
        assert!(exists<HealthRecord>(patient), EACCOUNT_NOT_FOUND);
        
        let record_ref = borrow_global<HealthRecord>(patient);
        
        // Check authorization
        assert!(
            requester == record_ref.owner || 
            is_in_access_list(&record_ref.access_list, requester) ||
            is_in_access_list(&record_ref.emergency_contacts, requester),
            EUNAUTHORIZED_ACCESS
        );
        
        assert!(table::contains(&record_ref.metadata, cid), ERECORD_NOT_FOUND);
        *table::borrow(&record_ref.metadata, cid)
    }

    /// Get records by category
    public fun get_records_by_category(patient: address, category: String, requester: address): vector<String> acquires HealthRecord {
        assert!(exists<HealthRecord>(patient), EACCOUNT_NOT_FOUND);
        
        let record_ref = borrow_global<HealthRecord>(patient);
        
        // Check authorization
        assert!(
            requester == record_ref.owner || 
            is_in_access_list(&record_ref.access_list, requester) ||
            is_in_access_list(&record_ref.emergency_contacts, requester),
            EUNAUTHORIZED_ACCESS
        );
        
        let filtered_cids = vector::empty<String>();
        let i = 0;
        let len = vector::length(&record_ref.cid_list);
        
        while (i < len) {
            let cid = *vector::borrow(&record_ref.cid_list, i);
            let metadata = table::borrow(&record_ref.metadata, cid);
            
            if (metadata.category == category) {
                vector::push_back(&mut filtered_cids, cid);
            };
            
            i = i + 1;
        };
        
        filtered_cids
    }

    /// Grant access to a healthcare provider
    public entry fun grant_access(patient: &signer, doctor: address) acquires HealthRecord {
        let patient_addr = signer::address_of(patient);
        assert!(exists<HealthRecord>(patient_addr), EACCOUNT_NOT_FOUND);
        
        let record_ref = borrow_global_mut<HealthRecord>(patient_addr);
        let current_time = timestamp::now_seconds();
        
        // Add doctor to access list if not already present
        if (!is_in_access_list(&record_ref.access_list, doctor)) {
            vector::push_back(&mut record_ref.access_list, doctor);
            record_ref.updated_at = current_time;
            
            // Emit event using the new event system
            event::emit(AccessGrantedEvent {
                patient: patient_addr,
                doctor,
                timestamp: current_time,
            });
        }
    }

    /// Revoke access from a healthcare provider
    public entry fun revoke_access(patient: &signer, doctor: address) acquires HealthRecord {
        let patient_addr = signer::address_of(patient);
        assert!(exists<HealthRecord>(patient_addr), EACCOUNT_NOT_FOUND);
        
        let record_ref = borrow_global_mut<HealthRecord>(patient_addr);
        let current_time = timestamp::now_seconds();
        
        // Remove doctor from access list
        let (found, index) = vector::index_of(&record_ref.access_list, &doctor);
        if (found) {
            vector::remove(&mut record_ref.access_list, index);
            record_ref.updated_at = current_time;
            
            // Emit event using the new event system
            event::emit(AccessRevokedEvent {
                patient: patient_addr,
                doctor,
                timestamp: current_time,
            });
        }
    }

    /// Add emergency contact
    public entry fun add_emergency_contact(patient: &signer, contact: address) acquires HealthRecord {
        let patient_addr = signer::address_of(patient);
        assert!(exists<HealthRecord>(patient_addr), EACCOUNT_NOT_FOUND);
        
        let record_ref = borrow_global_mut<HealthRecord>(patient_addr);
        let current_time = timestamp::now_seconds();
        
        // Add contact to emergency list if not already present
        if (!is_in_access_list(&record_ref.emergency_contacts, contact)) {
            vector::push_back(&mut record_ref.emergency_contacts, contact);
            record_ref.updated_at = current_time;
        }
    }

    /// Remove emergency contact
    public entry fun remove_emergency_contact(patient: &signer, contact: address) acquires HealthRecord {
        let patient_addr = signer::address_of(patient);
        assert!(exists<HealthRecord>(patient_addr), EACCOUNT_NOT_FOUND);
        
        let record_ref = borrow_global_mut<HealthRecord>(patient_addr);
        let current_time = timestamp::now_seconds();
        
        // Remove contact from emergency list
        let (found, index) = vector::index_of(&record_ref.emergency_contacts, &contact);
        if (found) {
            vector::remove(&mut record_ref.emergency_contacts, index);
            record_ref.updated_at = current_time;
        }
    }

    /// Delete a health record (only by owner)
    public entry fun delete_record(patient: &signer, cid: String) acquires HealthRecord {
        let patient_addr = signer::address_of(patient);
        assert!(exists<HealthRecord>(patient_addr), EACCOUNT_NOT_FOUND);
        
        let record_ref = borrow_global_mut<HealthRecord>(patient_addr);
        let current_time = timestamp::now_seconds();
        
        // Find and remove CID from list
        let (found, index) = vector::index_of(&record_ref.cid_list, &cid);
        if (found) {
            vector::remove(&mut record_ref.cid_list, index);
            // Remove metadata
            if (table::contains(&record_ref.metadata, cid)) {
                table::remove(&mut record_ref.metadata, cid);
            };
            record_ref.updated_at = current_time;
        }
    }

    /// Get access list for a patient
    public fun get_access_list(patient: address, requester: address): vector<address> acquires HealthRecord {
        assert!(exists<HealthRecord>(patient), EACCOUNT_NOT_FOUND);
        
        let record_ref = borrow_global<HealthRecord>(patient);
        
        // Only owner can view access list
        assert!(requester == record_ref.owner, EUNAUTHORIZED_ACCESS);
        
        record_ref.access_list
    }

    /// Get emergency contacts list
    public fun get_emergency_contacts(patient: address, requester: address): vector<address> acquires HealthRecord {
        assert!(exists<HealthRecord>(patient), EACCOUNT_NOT_FOUND);
        
        let record_ref = borrow_global<HealthRecord>(patient);
        
        // Only owner can view emergency contacts list
        assert!(requester == record_ref.owner, EUNAUTHORIZED_ACCESS);
        
        record_ref.emergency_contacts
    }

    /// Check if an address has access to records
    public fun has_access(patient: address, requester: address): bool acquires HealthRecord {
        if (!exists<HealthRecord>(patient)) {
            return false
        };
        
        let record_ref = borrow_global<HealthRecord>(patient);
        
        requester == record_ref.owner || 
        is_in_access_list(&record_ref.access_list, requester) ||
        is_in_access_list(&record_ref.emergency_contacts, requester)
    }

    /// Get record count
    public fun get_record_count(patient: address, requester: address): u64 acquires HealthRecord {
        assert!(exists<HealthRecord>(patient), EACCOUNT_NOT_FOUND);
        
        let record_ref = borrow_global<HealthRecord>(patient);
        
        // Check authorization
        assert!(
            requester == record_ref.owner || 
            is_in_access_list(&record_ref.access_list, requester) ||
            is_in_access_list(&record_ref.emergency_contacts, requester),
            EUNAUTHORIZED_ACCESS
        );
        
        vector::length(&record_ref.cid_list)
    }

    /// Get account info (creation date, last update, etc.)
    public fun get_account_info(patient: address, requester: address): (u64, u64) acquires HealthRecord {
        assert!(exists<HealthRecord>(patient), EACCOUNT_NOT_FOUND);
        
        let record_ref = borrow_global<HealthRecord>(patient);
        
        // Check authorization
        assert!(
            requester == record_ref.owner || 
            is_in_access_list(&record_ref.access_list, requester) ||
            is_in_access_list(&record_ref.emergency_contacts, requester),
            EUNAUTHORIZED_ACCESS
        );
        
        (record_ref.created_at, record_ref.updated_at)
    }

    /// Helper function to check if address is in a list
    fun is_in_access_list(list: &vector<address>, addr: address): bool {
        let i = 0;
        let len = vector::length(list);
        
        while (i < len) {
            if (*vector::borrow(list, i) == addr) {
                return true
            };
            i = i + 1;
        };
        
        false
    }
}