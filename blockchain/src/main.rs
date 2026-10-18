
mod block;
mod ledger;

use ledger::Ledger;
use std::{error::Error, path::Path};

fn main() -> Result<(), Box<dyn Error>> {
    let path = Path::new("data").join("ledger.json");
    std::fs::create_dir_all("data")?;

    let ledger = if path.exists() {
        println!("Loading existing ledger...");
        Ledger::load_from_file(&path)?
    } else {
        println!("Creating a new ledger...");

        let mut ledger = Ledger::new();

        ledger.add_event(
            1,
            "INVOICE_REGISTERED".into(),
            "INV-DEMO-001".into(),
        );

        ledger.add_event(
            2,
            "BUYER_VERIFIED".into(),
            "INV-DEMO-001".into(),
        );

        ledger.save_to_file(&path)?;
        ledger
    };

    println!("Total blocks: {}", ledger.blocks.len());
    println!("Chain valid: {}", ledger.validate());

    for block in &ledger.blocks {
        println!(
            "Block {} | Event: {} | Invoice: {} | Hash: {}",
            block.index, block.event_type, block.invoice_id, block.hash
        );
    }

    println!("Ledger file: {}", path.display());
    Ok(())
}
