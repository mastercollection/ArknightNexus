use std::fs;
use std::collections::HashMap;
use std::path::PathBuf;

use tauri::{AppHandle, Manager};

use crate::cache_model::{CachedOperator, RegionSnapshot, REGION_SNAPSHOT_SCHEMA_VERSION};
use crate::canonical::RegionSyncStatus;
use crate::data_sources::RegionCode;
use crate::errors::AppError;

pub fn load_snapshot(app: &AppHandle, region: RegionCode) -> Result<RegionSnapshot, AppError> {
    let path = snapshot_path(app, region)?;
    if !path.exists() {
        return Err(AppError::SnapshotMissing);
    }

    let content = fs::read_to_string(path)?;
    let raw_value = serde_json::from_str::<serde_json::Value>(&content).map_err(|error| AppError::Serde {
        context: "snapshot 캐시 읽기".to_string(),
        message: error.to_string(),
    })?;

    let schema_version = raw_value
        .get("schemaVersion")
        .and_then(serde_json::Value::as_u64)
        .unwrap_or_default() as u32;

    if schema_version != REGION_SNAPSHOT_SCHEMA_VERSION {
        return Err(AppError::SnapshotMissing);
    }

    let snapshot =
        serde_json::from_value::<RegionSnapshot>(raw_value).map_err(|error| AppError::Serde {
            context: "snapshot 캐시 읽기".to_string(),
            message: error.to_string(),
        })?;

    Ok(snapshot)
}

pub fn save_snapshot(
    app: &AppHandle,
    region: RegionCode,
    source_revision: &str,
    fetched_at: &str,
    operators: &[CachedOperator],
) -> Result<RegionSnapshot, AppError> {
    let snapshot = RegionSnapshot {
        schema_version: REGION_SNAPSHOT_SCHEMA_VERSION,
        region: region.as_str().to_string(),
        source_revision: source_revision.to_string(),
        fetched_at: fetched_at.to_string(),
        operators: operators.to_vec(),
    };

    let snapshot_path = snapshot_path(app, region)?;
    let status_path = status_path(app, region)?;

    if let Some(parent) = snapshot_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let snapshot_temp = snapshot_path.with_extension("json.tmp");
    let status_temp = status_path.with_extension("json.tmp");

    let snapshot_bytes = serde_json::to_vec_pretty(&snapshot).map_err(|error| AppError::Serde {
        context: "snapshot 캐시 쓰기".to_string(),
        message: error.to_string(),
    })?;
    fs::write(&snapshot_temp, snapshot_bytes)?;
    fs::rename(snapshot_temp, &snapshot_path)?;

    let status = RegionSyncStatus {
        region: region.as_str().to_string(),
        source_revision: Some(source_revision.to_string()),
        fetched_at: Some(fetched_at.to_string()),
        operator_count: operators.len(),
        is_ready: true,
    };

    let status_bytes = serde_json::to_vec_pretty(&status).map_err(|error| AppError::Serde {
        context: "status 캐시 쓰기".to_string(),
        message: error.to_string(),
    })?;
    fs::write(&status_temp, status_bytes)?;
    fs::rename(status_temp, &status_path)?;

    Ok(snapshot)
}

pub fn load_terms(
    app: &AppHandle,
    region: RegionCode,
) -> Result<HashMap<String, String>, AppError> {
    let path = terms_path(app, region)?;
    if !path.exists() {
        return Err(AppError::SnapshotMissing);
    }

    let content = fs::read_to_string(path)?;
    serde_json::from_str::<HashMap<String, String>>(&content).map_err(|error| AppError::Serde {
        context: "terms 캐시 읽기".to_string(),
        message: error.to_string(),
    })
}

pub fn save_terms(
    app: &AppHandle,
    region: RegionCode,
    terms: &HashMap<String, String>,
) -> Result<(), AppError> {
    let path = terms_path(app, region)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    let temp_path = path.with_extension("json.tmp");
    let bytes = serde_json::to_vec_pretty(terms).map_err(|error| AppError::Serde {
        context: "terms 캐시 쓰기".to_string(),
        message: error.to_string(),
    })?;
    fs::write(&temp_path, bytes)?;
    fs::rename(temp_path, path)?;
    Ok(())
}

pub fn load_statuses(app: &AppHandle) -> Result<Vec<RegionSyncStatus>, AppError> {
    RegionCode::all()
        .iter()
        .map(|region| load_region_status(app, *region))
        .collect()
}

fn load_region_status(app: &AppHandle, region: RegionCode) -> Result<RegionSyncStatus, AppError> {
    let path = status_path(app, region)?;
    if !path.exists() {
        return Ok(RegionSyncStatus {
            region: region.as_str().to_string(),
            source_revision: None,
            fetched_at: None,
            operator_count: 0,
            is_ready: false,
        });
    }

    let content = fs::read_to_string(path)?;
    serde_json::from_str::<RegionSyncStatus>(&content).map_err(|error| AppError::Serde {
        context: "status 캐시 읽기".to_string(),
        message: error.to_string(),
    })
}

fn snapshot_path(app: &AppHandle, region: RegionCode) -> Result<PathBuf, AppError> {
    Ok(region_dir(app, region)?.join("operators.snapshot.json"))
}

fn status_path(app: &AppHandle, region: RegionCode) -> Result<PathBuf, AppError> {
    Ok(region_dir(app, region)?.join("status.json"))
}

fn terms_path(app: &AppHandle, region: RegionCode) -> Result<PathBuf, AppError> {
    Ok(region_dir(app, region)?.join("terms.json"))
}

fn region_dir(app: &AppHandle, region: RegionCode) -> Result<PathBuf, AppError> {
    let base_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| AppError::AppDataDirUnavailable)?;
    Ok(base_dir.join("regions").join(region.as_str()))
}
