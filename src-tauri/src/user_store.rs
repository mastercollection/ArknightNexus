use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

use crate::errors::AppError;

pub const USER_DATA_SCHEMA_VERSION: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UserData {
    #[serde(default)]
    pub schema_version: u32,
    #[serde(default)]
    pub favorites: Vec<String>,
}

pub fn load_user_data(app: &AppHandle) -> Result<UserData, AppError> {
    let path = user_data_path(app)?;
    if !path.exists() {
        return Ok(UserData {
            schema_version: USER_DATA_SCHEMA_VERSION,
            favorites: Vec::new(),
        });
    }

    let content = fs::read_to_string(path)?;
    serde_json::from_str::<UserData>(&content).map_err(|error| AppError::Serde {
        context: "user data 읽기".to_string(),
        message: error.to_string(),
    })
}

pub fn save_user_data(app: &AppHandle, data: &UserData) -> Result<(), AppError> {
    let path = user_data_path(app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    let temp_path = path.with_extension("json.tmp");
    let bytes = serde_json::to_vec_pretty(data).map_err(|error| AppError::Serde {
        context: "user data 쓰기".to_string(),
        message: error.to_string(),
    })?;
    fs::write(&temp_path, bytes)?;
    fs::rename(temp_path, path)?;
    Ok(())
}

pub fn load_favorites(app: &AppHandle) -> Result<Vec<String>, AppError> {
    let mut data = load_user_data(app)?;
    data.favorites.retain(|value| !value.trim().is_empty());
    Ok(data.favorites)
}

pub fn toggle_favorite(app: &AppHandle, operator_id: &str) -> Result<bool, AppError> {
    let operator_id = operator_id.trim();
    if operator_id.is_empty() {
        return Ok(false);
    }

    let mut data = load_user_data(app)?;
    data.schema_version = USER_DATA_SCHEMA_VERSION;

    if let Some(index) = data.favorites.iter().position(|value| value == operator_id) {
        data.favorites.remove(index);
        save_user_data(app, &data)?;
        return Ok(false);
    }

    data.favorites.push(operator_id.to_string());
    data.favorites.sort();
    data.favorites.dedup();
    save_user_data(app, &data)?;
    Ok(true)
}

fn user_data_path(app: &AppHandle) -> Result<PathBuf, AppError> {
    let base_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| AppError::AppDataDirUnavailable)?;
    Ok(base_dir.join("user").join("user_data.json"))
}
