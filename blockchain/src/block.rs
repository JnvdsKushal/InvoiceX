
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub index: u64,
    pub timestamp: u64,
    pub event_type: String,
    pub invoice_id: String,
    pub previous_hash: String,
    pub hash: String,
}

#[derive(Serialize)]
struct HashableBlock<'a> {
    index: u64,
    timestamp: u64,
    event_type: &'a str,
    invoice_id: &'a str,
    previous_hash: &'a str,
}

impl Block {
    pub fn new(
        index: u64,
        timestamp: u64,
        event_type: String,
        invoice_id: String,
        previous_hash: String,
    ) -> Self {
        let mut block = Self {
            index,
            timestamp,
            event_type,
            invoice_id,
            previous_hash,
            hash: String::new(),
        };

        block.hash = block.calculate_hash();
        block
    }

    pub fn calculate_hash(&self) -> String {
        let data = HashableBlock {
            index: self.index,
            timestamp: self.timestamp,
            event_type: &self.event_type,
            invoice_id: &self.invoice_id,
            previous_hash: &self.previous_hash,
        };

        let serialized =
            serde_json::to_vec(&data).expect("Block serialization failed");

        let digest = Sha256::digest(serialized);

        format!("{digest:x}")
    }
}
