use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub index: u64,
    pub timestamp: u64,
    pub event_id: String,
    pub event_type: String,
    pub entity_type: String,
    pub entity_id: String,
    pub actor_id: String,
    pub payload: Value,
    pub previous_hash: String,
    pub hash: String,
}

#[derive(Serialize)]
struct HashableBlock<'a> {
    index: u64,
    timestamp: u64,
    event_id: &'a str,
    event_type: &'a str,
    entity_type: &'a str,
    entity_id: &'a str,
    actor_id: &'a str,
    payload: &'a Value,
    previous_hash: &'a str,
}

impl Block {
    pub fn new(
        index: u64,
        timestamp: u64,
        event_id: String,
        event_type: String,
        entity_type: String,
        entity_id: String,
        actor_id: String,
        payload: Value,
        previous_hash: String,
    ) -> Self {
        let mut block = Self {
            index,
            timestamp,
            event_id,
            event_type,
            entity_type,
            entity_id,
            actor_id,
            payload,
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
            event_id: &self.event_id,
            event_type: &self.event_type,
            entity_type: &self.entity_type,
            entity_id: &self.entity_id,
            actor_id: &self.actor_id,
            payload: &self.payload,
            previous_hash: &self.previous_hash,
        };

        let serialized = serde_json::to_vec(&data).expect("Block serialization failed");

        let digest = Sha256::digest(serialized);

        format!("{digest:x}")
    }
}
