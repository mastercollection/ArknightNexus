use serde::Deserialize;
use std::collections::HashMap;
use tauri::AppHandle;

use crate::canonical::{
    BuildingFormulaBundleDto, ItemDto, OperatorDetailDto, OperatorSummaryDto, RegionSyncStatus,
    SyncResult, UserPlanDto, UserPlanOperatorDto,
};
use crate::data_sources::RegionCode;
use crate::errors::AppError;
use crate::service;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncRegionRequest {
    pub region: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListOperatorsRequest {
    pub region: String,
    pub query: Option<String>,
    pub rarity: Option<u8>,
    pub profession: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListItemsRequest {
    pub region: String,
    pub classify_type: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListBuildingFormulasRequest {
    pub region: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetOperatorDetailRequest {
    pub region: String,
    pub operator_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToggleOperatorFavoriteRequest {
    pub operator_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveUserPlanSelectionRequest {
    pub operator_ids: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveUserPlanOperatorRequest {
    pub plan: UserPlanOperatorDto,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportUserDataRequest {
    pub content: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoveUserPlanOperatorRequest {
    pub operator_id: String,
}

#[tauri::command]
pub async fn sync_region_data(
    app: AppHandle,
    request: SyncRegionRequest,
) -> Result<SyncResult, String> {
    let region = parse_region(&request.region)?;
    service::sync_region_data(&app, region)
        .await
        .map_err(map_error)
}

#[tauri::command]
pub fn list_operators(
    app: AppHandle,
    request: ListOperatorsRequest,
) -> Result<Vec<OperatorSummaryDto>, String> {
    let region = parse_region(&request.region)?;
    service::list_operators(
        &app,
        region,
        request.query.as_deref(),
        request.rarity,
        request.profession.as_deref(),
    )
    .map_err(map_error)
}

#[tauri::command]
pub fn list_items(app: AppHandle, request: ListItemsRequest) -> Result<Vec<ItemDto>, String> {
    let region = parse_region(&request.region)?;
    service::list_items(&app, region, request.classify_type.as_deref()).map_err(map_error)
}

#[tauri::command]
pub fn list_building_formulas(
    app: AppHandle,
    request: ListBuildingFormulasRequest,
) -> Result<BuildingFormulaBundleDto, String> {
    let region = parse_region(&request.region)?;
    service::list_building_formulas(&app, region).map_err(map_error)
}

#[tauri::command]
pub fn get_operator_detail(
    app: AppHandle,
    request: GetOperatorDetailRequest,
) -> Result<Option<OperatorDetailDto>, String> {
    let region = parse_region(&request.region)?;
    service::get_operator_detail(&app, region, &request.operator_id).map_err(map_error)
}

#[tauri::command]
pub fn get_region_sync_status(app: AppHandle) -> Result<Vec<RegionSyncStatus>, String> {
    service::get_region_sync_status(&app).map_err(map_error)
}

#[tauri::command]
pub fn get_region_terms(
    app: AppHandle,
    request: SyncRegionRequest,
) -> Result<HashMap<String, String>, String> {
    let region = parse_region(&request.region)?;
    service::get_region_terms(&app, region).map_err(map_error)
}

#[tauri::command]
pub fn get_region_stage_codes(
    app: AppHandle,
    request: SyncRegionRequest,
) -> Result<HashMap<String, String>, String> {
    let region = parse_region(&request.region)?;
    service::get_region_stage_codes(&app, region).map_err(map_error)
}

#[tauri::command]
pub fn get_user_favorites(app: AppHandle) -> Result<Vec<String>, String> {
    service::get_user_favorites(&app).map_err(map_error)
}

#[tauri::command]
pub fn toggle_operator_favorite(
    app: AppHandle,
    request: ToggleOperatorFavoriteRequest,
) -> Result<bool, String> {
    service::toggle_operator_favorite(&app, &request.operator_id).map_err(map_error)
}

#[tauri::command]
pub fn get_user_plan(app: AppHandle) -> Result<UserPlanDto, String> {
    service::get_user_plan(&app).map_err(map_error)
}

#[tauri::command]
pub fn export_user_data(app: AppHandle) -> Result<String, String> {
    service::export_user_data(&app).map_err(map_error)
}

#[tauri::command]
pub fn import_user_data(app: AppHandle, request: ImportUserDataRequest) -> Result<(), String> {
    service::import_user_data(&app, &request.content).map_err(map_error)
}

#[tauri::command]
pub fn save_user_plan_selection(
    app: AppHandle,
    request: SaveUserPlanSelectionRequest,
) -> Result<Vec<String>, String> {
    service::save_user_plan_selection(&app, &request.operator_ids).map_err(map_error)
}

#[tauri::command]
pub fn save_user_plan_operator(
    app: AppHandle,
    request: SaveUserPlanOperatorRequest,
) -> Result<UserPlanOperatorDto, String> {
    service::save_user_plan_operator(&app, &request.plan).map_err(map_error)
}

#[tauri::command]
pub fn remove_user_plan_operator(
    app: AppHandle,
    request: RemoveUserPlanOperatorRequest,
) -> Result<bool, String> {
    service::remove_user_plan_operator(&app, &request.operator_id).map_err(map_error)
}

fn parse_region(value: &str) -> Result<RegionCode, String> {
    RegionCode::parse(value).ok_or_else(|| map_error(AppError::InvalidRegion))
}

fn map_error(error: AppError) -> String {
    error.to_string()
}
