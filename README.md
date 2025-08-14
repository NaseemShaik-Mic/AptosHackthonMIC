# CuraVault – Decentralized-AI Health Records 

**Aptos Blockchain + IPFS solution** for secure, patient-controlled medical records.


##  Key Features

### 1 Patient Record Management
- Add & batch upload **medical files (PDF, images)** via IPFS.
- Remove records anytime.
- Track **timestamps** for creation & updates.

### 2 Doctor Access Control
- Grant/revoke individual doctor access.
- Emergency **revoke all access** feature.
- Prevent self-granting of access.
- View list of authorized doctors (patient-only).

### 3 Record Access & Security
- Only patient or authorized doctors can fetch records.
- Metadata: creation time, last updated, record count, doctor count.
- **CID validation** ensures proper IPFS format (`Qm...`).

### 4 Event Tracking & Audit
- **RecordAdded** – new record added.
- **AccessGranted** – doctor access granted.
- **AccessRevoked** – doctor access revoked.

###  5.Admin & Testing
- View record counts per patient (admin-only).
- Test helpers to simulate accounts and fetch record data.


##  Public Functions

| Function | Description |
|----------|-------------|
| `initialize(account)` | Create a health record for patient |
| `add_record(account, cid)` | Add a new medical file |
| `batch_add_records(account, cids)` | Upload multiple files |
| `remove_record(account, cid)` | Delete a specific file |
| `grant_access(account, doctor)` | Allow doctor to view records |
| `revoke_access(account, doctor)` | Remove doctor access |
| `revoke_all_access(account)` | Emergency revoke all access |
| `get_records(patient, requester)` | Fetch accessible records |
| `has_access(patient, doctor)` | Check doctor access |


##  Security & Privacy
- On-chain storage under patient account.
- Authorization enforced for all sensitive actions.
- IPFS CIDs **store files off-chain**; only references on-chain.
- Events provide **transparent audit trail**.

## ScreenShots
<img width="1307" height="635" alt="image" src="https://github.com/user-attachments/assets/22558750-a5ec-493a-83a5-7bcfcfedfb66" />
<img width="1316" height="635" alt="image" src="https://github.com/user-attachments/assets/0ae46e1f-63f1-4197-ae80-aebf6ee8ab45" />
<img width="1317" height="602" alt="image" src="https://github.com/user-attachments/assets/a775d4b7-6acf-418b-b60b-9a98a4141a01" />



##Developers


SK.Naseem -DVR&Dr.H.S MIC college of Technology
P.Sujith Kumar-DVr&Dr.H.S.MIC College of Technology



