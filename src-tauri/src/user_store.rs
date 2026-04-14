use std::collections::BTreeMap;
use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

use crate::errors::AppError;

use crate::canonical::{
    UserPlanDto, UserPlanModuleDto, UserPlanOperatorDto, UserPlanOperatorStateDto,
};

pub const USER_DATA_SCHEMA_VERSION: u32 = 3;
const MAX_USER_DATA_IMPORT_BYTES: usize = 1024 * 1024;

const MAX_ELITE: u8 = 2;
const MAX_SKILL_LEVEL: u8 = 10;
const MAX_MODULE_STAGE: u8 = 3;
const MAX_PLAN_LEVEL: u32 = 90;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UserData {
    #[serde(default)]
    pub schema_version: u32,
    #[serde(default)]
    pub favorites: Vec<String>,
    #[serde(default)]
    pub selected_operator_ids: Vec<String>,
    #[serde(default)]
    pub operator_plans: Vec<UserPlanOperatorDto>,
    #[serde(default)]
    pub item_counts: BTreeMap<String, u32>,
}

pub fn load_user_data(app: &AppHandle) -> Result<UserData, AppError> {
    let path = user_data_path(app)?;
    if !path.exists() {
        return Ok(default_user_data());
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

pub fn export_user_data_json(app: &AppHandle) -> Result<String, AppError> {
    let data = normalize_user_data(load_user_data(app)?)?;
    serde_json::to_string_pretty(&data).map_err(|error| AppError::Serde {
        context: "user data 내보내기".to_string(),
        message: error.to_string(),
    })
}

pub fn import_user_data_json(app: &AppHandle, content: &str) -> Result<(), AppError> {
    let trimmed = content.trim();
    if trimmed.is_empty() || trimmed.len() > MAX_USER_DATA_IMPORT_BYTES {
        return Err(AppError::InvalidInput("content".to_string()));
    }

    let parsed = serde_json::from_str::<UserData>(trimmed).map_err(|error| AppError::Serde {
        context: "user data 가져오기".to_string(),
        message: error.to_string(),
    })?;
    let normalized = normalize_user_data(parsed)?;

    backup_user_data(app)?;
    save_user_data(app, &normalized)
}

pub fn load_favorites(app: &AppHandle) -> Result<Vec<String>, AppError> {
    let mut data = load_user_data(app)?;
    data.favorites.retain(|value| !value.trim().is_empty());
    Ok(data.favorites)
}

pub fn load_item_counts(app: &AppHandle) -> Result<BTreeMap<String, u32>, AppError> {
    let data = load_user_data(app)?;
    Ok(sanitize_item_counts(data.item_counts))
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

pub fn load_plan(app: &AppHandle) -> Result<UserPlanDto, AppError> {
    let mut data = load_user_data(app)?;
    data.selected_operator_ids = sanitize_ids(data.selected_operator_ids);
    data.operator_plans = data
        .operator_plans
        .into_iter()
        .filter_map(|plan| validate_plan(plan).ok())
        .collect();

    Ok(UserPlanDto {
        selected_operator_ids: data.selected_operator_ids,
        operators: data.operator_plans,
    })
}

pub fn save_plan_selection(
    app: &AppHandle,
    operator_ids: &[String],
) -> Result<Vec<String>, AppError> {
    let mut data = load_user_data(app)?;
    data.schema_version = USER_DATA_SCHEMA_VERSION;
    data.selected_operator_ids = sanitize_ids(operator_ids.to_vec());
    data.operator_plans.retain(|plan| {
        data.selected_operator_ids
            .iter()
            .any(|id| id == &plan.operator_id)
    });
    save_user_data(app, &data)?;
    Ok(data.selected_operator_ids)
}

pub fn save_plan_operator(
    app: &AppHandle,
    plan: &UserPlanOperatorDto,
) -> Result<UserPlanOperatorDto, AppError> {
    let mut data = load_user_data(app)?;
    data.schema_version = USER_DATA_SCHEMA_VERSION;

    let validated = validate_plan(plan.clone())?;
    if let Some(index) = data
        .operator_plans
        .iter()
        .position(|entry| entry.operator_id == validated.operator_id)
    {
        data.operator_plans[index] = validated.clone();
    } else {
        data.operator_plans.push(validated.clone());
    }

    if !data
        .selected_operator_ids
        .iter()
        .any(|operator_id| operator_id == &validated.operator_id)
    {
        data.selected_operator_ids
            .push(validated.operator_id.clone());
    }

    data.selected_operator_ids = sanitize_ids(data.selected_operator_ids);
    data.operator_plans
        .sort_by(|left, right| left.operator_id.cmp(&right.operator_id));

    save_user_data(app, &data)?;
    Ok(validated)
}

pub fn remove_plan_operator(app: &AppHandle, operator_id: &str) -> Result<bool, AppError> {
    let operator_id = sanitize_id(operator_id);
    if operator_id.is_empty() {
        return Ok(false);
    }

    let mut data = load_user_data(app)?;
    data.schema_version = USER_DATA_SCHEMA_VERSION;

    let selected_len = data.selected_operator_ids.len();
    data.selected_operator_ids
        .retain(|value| value != &operator_id);
    let plan_len = data.operator_plans.len();
    data.operator_plans
        .retain(|value| value.operator_id != operator_id);

    let changed =
        selected_len != data.selected_operator_ids.len() || plan_len != data.operator_plans.len();
    if changed {
        save_user_data(app, &data)?;
    }

    Ok(changed)
}

pub fn save_item_count(app: &AppHandle, item_id: &str, count: u32) -> Result<u32, AppError> {
    let item_id = sanitize_id(item_id);
    if item_id.is_empty() {
        return Err(AppError::InvalidInput("itemId".to_string()));
    }

    let mut data = load_user_data(app)?;
    data.schema_version = USER_DATA_SCHEMA_VERSION;
    data.item_counts = sanitize_item_counts(data.item_counts);

    if count == 0 {
        data.item_counts.remove(&item_id);
    } else {
        data.item_counts.insert(item_id, count);
    }

    save_user_data(app, &data)?;
    Ok(count)
}

pub fn import_item_counts_json(app: &AppHandle, content: &str) -> Result<usize, AppError> {
    let trimmed = content.trim();
    if trimmed.is_empty() || trimmed.len() > MAX_USER_DATA_IMPORT_BYTES {
        return Err(AppError::InvalidInput("content".to_string()));
    }

    let parsed = serde_json::from_str::<BTreeMap<String, u32>>(trimmed).map_err(|error| {
        AppError::Serde {
            context: "item counts 가져오기".to_string(),
            message: error.to_string(),
        }
    })?;
    let imported_counts = sanitize_item_counts(parsed);
    if imported_counts.is_empty() {
        return Err(AppError::InvalidInput("content".to_string()));
    }

    let mut data = load_user_data(app)?;
    data.schema_version = USER_DATA_SCHEMA_VERSION;
    data.item_counts = sanitize_item_counts(data.item_counts);

    for (item_id, count) in imported_counts.iter() {
        data.item_counts.insert(item_id.clone(), *count);
    }

    save_user_data(app, &data)?;
    Ok(imported_counts.len())
}

fn default_user_data() -> UserData {
    UserData {
        schema_version: USER_DATA_SCHEMA_VERSION,
        favorites: Vec::new(),
        selected_operator_ids: Vec::new(),
        operator_plans: Vec::new(),
        item_counts: BTreeMap::new(),
    }
}

fn normalize_user_data(data: UserData) -> Result<UserData, AppError> {
    let favorites = sanitize_ids(data.favorites);
    let selected_operator_ids = sanitize_ids(data.selected_operator_ids);
    let mut operator_plans = BTreeMap::new();

    for plan in data.operator_plans {
        let validated = validate_plan(plan)?;
        operator_plans.insert(validated.operator_id.clone(), validated);
    }

    Ok(UserData {
        schema_version: USER_DATA_SCHEMA_VERSION,
        favorites,
        selected_operator_ids,
        operator_plans: operator_plans.into_values().collect(),
        item_counts: sanitize_item_counts(data.item_counts),
    })
}

fn backup_user_data(app: &AppHandle) -> Result<(), AppError> {
    let path = user_data_path(app)?;
    if !path.exists() {
        return Ok(());
    }

    let backup_path = path.with_extension("json.bak");
    fs::copy(path, backup_path)?;
    Ok(())
}

fn sanitize_ids(values: Vec<String>) -> Vec<String> {
    let mut normalized = values
        .into_iter()
        .map(|value| sanitize_id(&value))
        .filter(|value| !value.is_empty())
        .collect::<Vec<_>>();
    normalized.sort();
    normalized.dedup();
    normalized
}

fn sanitize_id(value: &str) -> String {
    value.trim().to_string()
}

fn sanitize_item_counts(values: BTreeMap<String, u32>) -> BTreeMap<String, u32> {
    values
        .into_iter()
        .filter_map(|(key, count)| {
            let normalized = sanitize_id(&key);
            if normalized.is_empty() || count == 0 {
                None
            } else {
                Some((normalized, count))
            }
        })
        .collect()
}

fn validate_plan(plan: UserPlanOperatorDto) -> Result<UserPlanOperatorDto, AppError> {
    let operator_id = sanitize_id(&plan.operator_id);
    if operator_id.is_empty() {
        return Err(AppError::InvalidInput("operatorId".to_string()));
    }

    let current = validate_state(plan.current)?;
    let target = validate_state(plan.target)?;

    Ok(UserPlanOperatorDto {
        operator_id,
        current,
        target,
    })
}

fn validate_state(state: UserPlanOperatorStateDto) -> Result<UserPlanOperatorStateDto, AppError> {
    if state.elite > MAX_ELITE {
        return Err(AppError::InvalidInput("elite".to_string()));
    }

    if state.level == 0 || state.level > MAX_PLAN_LEVEL {
        return Err(AppError::InvalidInput("level".to_string()));
    }

    let skill_levels = if state.skill_levels.is_empty() {
        vec![1, 1, 1]
    } else {
        state
            .skill_levels
            .into_iter()
            .map(|level| {
                if !(1..=MAX_SKILL_LEVEL).contains(&level) {
                    Err(AppError::InvalidInput("skillLevels".to_string()))
                } else {
                    Ok(level)
                }
            })
            .collect::<Result<Vec<_>, _>>()?
    };

    let modules = state
        .modules
        .into_iter()
        .map(validate_module)
        .collect::<Result<Vec<_>, _>>()?;

    Ok(UserPlanOperatorStateDto {
        elite: state.elite,
        level: state.level,
        skill_levels,
        modules,
    })
}

fn validate_module(module: UserPlanModuleDto) -> Result<UserPlanModuleDto, AppError> {
    let module_id = sanitize_id(&module.module_id);
    if module_id.is_empty() {
        return Err(AppError::InvalidInput("moduleId".to_string()));
    }

    if module.current_stage > MAX_MODULE_STAGE || module.target_stage > MAX_MODULE_STAGE {
        return Err(AppError::InvalidInput("moduleStage".to_string()));
    }

    Ok(UserPlanModuleDto {
        module_id,
        current_stage: module.current_stage,
        target_stage: module.target_stage,
    })
}

fn user_data_path(app: &AppHandle) -> Result<PathBuf, AppError> {
    let base_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| AppError::AppDataDirUnavailable)?;
    Ok(base_dir.join("user").join("user_data.json"))
}
