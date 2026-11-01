use crate::block::Block;
use serde_json::Value;
use std::{
    fs, io,
    path::{Path, PathBuf},
};

pub struct Ledger {
    pub blocks: Vec<Block>,
    path: PathBuf,
}

impl Ledger {
    pub fn new(path: impl AsRef<Path>) -> Self {
        Self {
            blocks: vec![Block::new(
                0,
                0,
                "GENESIS".into(),
                "GENESIS".into(),
                "SYSTEM".into(),
                "SYSTEM".into(),
                "SYSTEM".into(),
                Value::Null,
                "0".into(),
            )],
            path: path.as_ref().to_path_buf(),
        }
    }

    pub fn load_or_create(path: impl AsRef<Path>) -> io::Result<Self> {
        let path = path.as_ref();

        if path.exists() {
            let json = fs::read_to_string(path)?;

            let blocks: Vec<Block> = serde_json::from_str(&json)
                .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;

            let ledger = Self {
                blocks,
                path: path.to_path_buf(),
            };

            if !ledger.validate() {
                return Err(io::Error::new(
                    io::ErrorKind::InvalidData,
                    "Ledger integrity check failed",
                ));
            }

            Ok(ledger)
        } else {
            let ledger = Self::new(path);
            ledger.save()?;
            Ok(ledger)
        }
    }

    pub fn add_event(
        &mut self,
        timestamp: u64,
        event_id: String,
        event_type: String,
        entity_type: String,
        entity_id: String,
        actor_id: String,
        payload: Value,
    ) -> io::Result<Block> {
        if self.blocks.iter().any(|b| b.event_id == event_id) {
            return Err(io::Error::new(
                io::ErrorKind::AlreadyExists,
                "Duplicate event ID",
            ));
        }

        let previous = self
            .blocks
            .last()
            .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidData, "Genesis block missing"))?;

        let block = Block::new(
            previous.index + 1,
            timestamp,
            event_id,
            event_type,
            entity_type,
            entity_id,
            actor_id,
            payload,
            previous.hash.clone(),
        );

        self.blocks.push(block.clone());

        if let Err(error) = self.save() {
            self.blocks.pop();
            return Err(error);
        }

        Ok(block)
    }

    pub fn validate(&self) -> bool {
        if self.blocks.is_empty() {
            return false;
        }

        for (i, block) in self.blocks.iter().enumerate() {
            if block.hash != block.calculate_hash() {
                return false;
            }

            if i == 0 {
                if block.index != 0 || block.previous_hash != "0" || block.event_type != "GENESIS" {
                    return false;
                }
            } else {
                let previous = &self.blocks[i - 1];

                if block.index != previous.index + 1 || block.previous_hash != previous.hash {
                    return false;
                }
            }
        }

        true
    }

    fn save(&self) -> io::Result<()> {
        if !self.validate() {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "Cannot save invalid ledger",
            ));
        }

        let json =
            serde_json::to_vec_pretty(&self.blocks).map_err(|e| io::Error::other(e.to_string()))?;

        let temp_path = self.path.with_extension("tmp");

        fs::write(&temp_path, json)?;
        fs::rename(&temp_path, &self.path)?;

        Ok(())
    }

    pub fn get_blocks(&self) -> Vec<Block> {
        self.blocks.clone()
    }

    pub fn find_event(&self, event_id: &str) -> Option<Block> {
        self.blocks
            .iter()
            .find(|block| block.event_id == event_id)
            .cloned()
    }

    pub fn count(&self) -> usize {
        self.blocks.len()
    }
}


#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_path(label: &str) -> PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::env::temp_dir().join(format!("invoicex-{label}-{nonce}.json"))
    }

    fn append(ledger: &mut Ledger, event_id: &str) {
        ledger
            .add_event(
                1,
                event_id.to_string(),
                "INVOICE_CREATED".to_string(),
                "invoice".to_string(),
                "invoice-test-001".to_string(),
                "actor-test-001".to_string(),
                json!({"status": "DRAFT", "version": 1}),
            )
            .unwrap();
    }

    #[test]
    fn new_ledger_contains_valid_genesis_block() {
        let path = temp_path("genesis");
        let ledger = Ledger::load_or_create(&path).unwrap();
        assert_eq!(ledger.count(), 1);
        assert!(ledger.validate());
        let _ = fs::remove_file(path);
    }

    #[test]
    fn appended_event_links_to_previous_hash() {
        let path = temp_path("append");
        let mut ledger = Ledger::load_or_create(&path).unwrap();
        append(&mut ledger, "event-1");
        assert_eq!(ledger.count(), 2);
        assert_eq!(ledger.blocks[1].previous_hash, ledger.blocks[0].hash);
        assert!(ledger.validate());
        let _ = fs::remove_file(path);
    }

    #[test]
    fn tampered_payload_is_detected() {
        let path = temp_path("tamper");
        let mut ledger = Ledger::load_or_create(&path).unwrap();
        append(&mut ledger, "event-1");
        ledger.blocks[1].payload = json!({"status": "ALTERED"});
        assert!(!ledger.validate());
        let _ = fs::remove_file(path);
    }

    #[test]
    fn ledger_survives_reload() {
        let path = temp_path("reload");
        {
            let mut ledger = Ledger::load_or_create(&path).unwrap();
            append(&mut ledger, "event-1");
        }
        let restored = Ledger::load_or_create(&path).unwrap();
        assert_eq!(restored.count(), 2);
        assert!(restored.validate());
        let _ = fs::remove_file(path);
    }

    #[test]
    fn duplicate_event_id_is_rejected() {
        let path = temp_path("duplicate");
        let mut ledger = Ledger::load_or_create(&path).unwrap();
        append(&mut ledger, "event-1");
        let result = ledger.add_event(
            2,
            "event-1".to_string(),
            "INVOICE_UPDATED".to_string(),
            "invoice".to_string(),
            "invoice-test-001".to_string(),
            "actor-test-001".to_string(),
            json!({"status": "VERIFIED"}),
        );
        assert!(result.is_err());
        assert_eq!(ledger.count(), 2);
        let _ = fs::remove_file(path);
    }

    #[test]
    fn corrupted_persisted_ledger_is_rejected() {
        let path = temp_path("corrupt");
        fs::write(&path, "not valid json").unwrap();
        assert!(Ledger::load_or_create(&path).is_err());
        let _ = fs::remove_file(path);
    }
}
