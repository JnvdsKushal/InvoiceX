mod block;
mod ledger;

use axum::{
    Json, Router,
    extract::State,
    http::{HeaderMap, StatusCode},
    routing::{get, post},
};
use ledger::Ledger;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::{
    env,
    sync::Arc,
    time::{SystemTime, UNIX_EPOCH},
};
use tokio::sync::Mutex;

#[derive(Clone)]
struct AppState {
    ledger: Arc<Mutex<Ledger>>,
    api_key: String,
}

#[derive(Deserialize)]
struct EventRequest {
    event_id: String,
    event_type: String,
    entity_type: String,
    entity_id: String,
    actor_id: String,
    payload: Value,
}

#[derive(Serialize)]
struct ApiError {
    error: String,
}

fn error(status: StatusCode, message: &str) -> (StatusCode, Json<ApiError>) {
    (
        status,
        Json(ApiError {
            error: message.to_string(),
        }),
    )
}

fn authorized(headers: &HeaderMap, api_key: &str) -> bool {
    headers
        .get("x-internal-ledger-key")
        .and_then(|value| value.to_str().ok())
        .is_some_and(|value| value == api_key)
}

async fn health() -> Json<Value> {
    Json(json!({
        "service": "InvoiceX Blockchain",
        "status": "running"
    }))
}

async fn append_event(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<EventRequest>,
) -> Result<Json<Value>, (StatusCode, Json<ApiError>)> {
    if !authorized(&headers, &state.api_key) {
        return Err(error(StatusCode::UNAUTHORIZED, "Invalid internal API key"));
    }

    if request.event_id.trim().is_empty()
        || request.event_type.trim().is_empty()
        || request.entity_type.trim().is_empty()
        || request.entity_id.trim().is_empty()
        || request.actor_id.trim().is_empty()
    {
        return Err(error(
            StatusCode::BAD_REQUEST,
            "Required fields are missing",
        ));
    }

    let mut ledger = state.ledger.lock().await;

    if let Some(existing) = ledger.find_event(&request.event_id) {
        let same_event = existing.event_type == request.event_type
            && existing.entity_type == request.entity_type
            && existing.entity_id == request.entity_id
            && existing.actor_id == request.actor_id
            && existing.payload == request.payload;
        if !same_event {
            return Err(error(
                StatusCode::CONFLICT,
                "Event ID already exists with different event data",
            ));
        }
        return Ok(Json(json!({
            "success": true,
            "duplicate": true,
            "block": existing
        })));
    }

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| error(StatusCode::INTERNAL_SERVER_ERROR, "System clock error"))?
        .as_secs();

    let block = ledger
        .add_event(
            timestamp,
            request.event_id,
            request.event_type,
            request.entity_type,
            request.entity_id,
            request.actor_id,
            request.payload,
        )
        .map_err(|_| {
            error(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Could not persist ledger event",
            )
        })?;

    Ok(Json(json!({
        "success": true,
        "duplicate": false,
        "block": block
    })))
}

async fn get_events(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, (StatusCode, Json<ApiError>)> {
    if !authorized(&headers, &state.api_key) {
        return Err(error(StatusCode::UNAUTHORIZED, "Invalid internal API key"));
    }

    let ledger = state.ledger.lock().await;

    Ok(Json(json!({
        "count": ledger.count(),
        "blocks": ledger.get_blocks()
    })))
}

async fn verify_chain(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, (StatusCode, Json<ApiError>)> {
    if !authorized(&headers, &state.api_key) {
        return Err(error(StatusCode::UNAUTHORIZED, "Invalid internal API key"));
    }

    let ledger = state.ledger.lock().await;
    let valid = ledger.validate();

    Ok(Json(json!({
        "valid": valid,
        "total_blocks": ledger.count()
    })))
}

#[tokio::main]
async fn main() {
    let api_key = env::var("LEDGER_INTERNAL_API_KEY")
        .expect("Set LEDGER_INTERNAL_API_KEY before starting the service");

    if api_key.len() < 32 {
        panic!("LEDGER_INTERNAL_API_KEY must contain at least 32 characters");
    }

    let path = "data/ledger-v2.json";

    std::fs::create_dir_all("data").expect("Could not create data directory");

    let ledger =
        Ledger::load_or_create(path).expect("Could not load or initialize blockchain ledger");

    println!("Ledger loaded: {} blocks", ledger.count());
    println!("Chain valid: {}", ledger.validate());

    let state = AppState {
        ledger: Arc::new(Mutex::new(ledger)),
        api_key,
    };

    let app = Router::new()
        .route("/health", get(health))
        .route("/internal/events", post(append_event).get(get_events))
        .route("/internal/verify", get(verify_chain))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8081")
        .await
        .expect("Could not bind blockchain service to port 8081");

    println!("InvoiceX Blockchain API: http://127.0.0.1:8081");

    axum::serve(listener, app)
        .await
        .expect("Blockchain server failed");
}
