
use crate::block::Block;
use std::{fs, io, path::Path};

pub struct Ledger {
    pub blocks: Vec<Block>,
}

impl Ledger {
    pub fn new() -> Self {
        Self {
            blocks: vec![Block::new(
                0,
                0,
                "GENESIS".into(),
                "SYSTEM".into(),
                "0".into(),
            )],
        }
    }

    pub fn add_event(
        &mut self,
        timestamp: u64,
        event_type: String,
        invoice_id: String,
    ) {
        let previous = self.blocks.last().expect("Genesis block must exist");

        self.blocks.push(Block::new(
            previous.index + 1,
            timestamp,
            event_type,
            invoice_id,
            previous.hash.clone(),
        ));
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
                if block.index != 0
                    || block.previous_hash != "0"
                    || block.event_type != "GENESIS"
                    || block.invoice_id != "SYSTEM"
                {
                    return false;
                }
            } else {
                let previous = &self.blocks[i - 1];

                if block.index != previous.index + 1
                    || block.previous_hash != previous.hash
                {
                    return false;
                }
            }
        }

        true
    }

    pub fn save_to_file(&self, path: impl AsRef<Path>) -> io::Result<()> {
        if !self.validate() {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "Cannot save an invalid ledger",
            ));
        }

        let json = serde_json::to_string_pretty(&self.blocks)
            .map_err(|e| io::Error::other(e.to_string()))?;

        fs::write(path, json)
    }

    pub fn load_from_file(path: impl AsRef<Path>) -> io::Result<Self> {
        let json = fs::read_to_string(path)?;
        let blocks: Vec<Block> = serde_json::from_str(&json)
            .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;

        let ledger = Self { blocks };

        if !ledger.validate() {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "Ledger integrity check failed",
            ));
        }

        Ok(ledger)
    }
}

impl Default for Ledger {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_file(name: &str) -> std::path::PathBuf {
        std::env::temp_dir().join(format!(
            "invoicex-{name}-{}.json",
            std::process::id()
        ))
    }

    #[test]
    fn new_ledger_is_valid() {
        assert!(Ledger::new().validate());
    }

    #[test]
    fn appended_event_keeps_chain_valid() {
        let mut ledger = Ledger::new();
        ledger.add_event(100, "INVOICE_REGISTERED".into(), "INV-001".into());

        assert_eq!(ledger.blocks.len(), 2);
        assert!(ledger.validate());
    }

    #[test]
    fn modified_block_is_detected() {
        let mut ledger = Ledger::new();
        ledger.add_event(100, "INVOICE_REGISTERED".into(), "INV-001".into());
        ledger.blocks[1].invoice_id = "INV-999".into();

        assert!(!ledger.validate());
    }

    #[test]
    fn ledger_survives_save_and_reload() {
        let path = test_file("persistence");
        let mut original = Ledger::new();

        original.add_event(100, "INVOICE_REGISTERED".into(), "INV-001".into());
        original.save_to_file(&path).unwrap();

        let restored = Ledger::load_from_file(&path).unwrap();

        assert_eq!(restored.blocks.len(), 2);
        assert_eq!(restored.blocks[1].invoice_id, "INV-001");
        assert!(restored.validate());

        fs::remove_file(path).ok();
    }

    #[test]
    fn corrupted_saved_ledger_is_rejected() {
        let path = test_file("corruption");
        let mut ledger = Ledger::new();

        ledger.add_event(100, "INVOICE_REGISTERED".into(), "INV-001".into());
        ledger.save_to_file(&path).unwrap();

        let json = fs::read_to_string(&path).unwrap();
        fs::write(&path, json.replace("INV-001", "INV-999")).unwrap();

        assert!(Ledger::load_from_file(&path).is_err());
        fs::remove_file(path).ok();
    }
}
