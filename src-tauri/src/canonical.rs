use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperatorSummaryDto {
    pub id: String,
    pub name: String,
    pub rarity: u8,
    pub profession: String,
    pub branch: String,
    #[serde(default)]
    pub teams: Vec<String>,
    #[serde(default)]
    pub nations: Vec<String>,
    #[serde(default)]
    pub groups: Vec<String>,
    pub thumbnail_hue: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperatorStatPointDto {
    pub hp: i64,
    pub attack: i64,
    pub defense: i64,
    pub resistance: i64,
    pub redeploy_time: i64,
    pub dp_cost: i64,
    pub block: i64,
    pub attack_interval: f64,
    #[serde(default)]
    pub hp_recovery_per_sec: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperatorStatProgressionDto {
    pub level: u32,
    pub min: OperatorStatPointDto,
    pub max: OperatorStatPointDto,
    #[serde(default)]
    pub range: Option<OperatorRangeDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperatorBlackboardEntryDto {
    pub key: String,
    pub value: Option<f64>,
    pub value_str: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperatorUpgradeCostDto {
    pub id: String,
    pub count: f64,
    #[serde(rename = "type")]
    pub cost_type: String,
    pub item_name: Option<String>,
    pub item_rarity: Option<String>,
    pub item_icon_id: Option<String>,
    pub item_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperatorUpgradeCostStageDto {
    pub level: u8,
    #[serde(default)]
    pub costs: Vec<OperatorUpgradeCostDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperatorSkillLevelDto {
    pub level: u8,
    pub sp_cost: u32,
    pub initial_sp: u32,
    pub duration: u32,
    pub description: String,
    #[serde(default)]
    pub blackboard: Vec<OperatorBlackboardEntryDto>,
    #[serde(default)]
    pub range: Option<OperatorRangeDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperatorRangeDto {
    pub id: String,
    #[serde(default)]
    pub grids: Vec<OperatorRangeGridDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperatorRangeGridDto {
    pub row: i32,
    pub col: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperatorSkillDto {
    pub id: String,
    #[serde(default)]
    pub icon_id: Option<String>,
    pub name: String,
    pub recovery_type: String,
    pub activation_type: String,
    pub description: String,
    #[serde(default)]
    pub unlock_elite: u8,
    #[serde(default)]
    pub unlock_level: u32,
    #[serde(default)]
    pub upgrade_costs: Vec<OperatorUpgradeCostStageDto>,
    pub levels: Vec<OperatorSkillLevelDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemStageDropDto {
    pub stage_id: String,
    pub occ_per: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemBuildingProductDto {
    pub room_type: String,
    pub formula_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BuildingCostDto {
    pub id: String,
    pub count: f64,
    #[serde(rename = "type")]
    pub cost_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BuildingRequireRoomDto {
    pub room_id: String,
    pub room_level: i64,
    pub room_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkshopExtraOutcomeDto {
    pub weight: i64,
    pub item_id: String,
    pub item_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManufactFormulaDto {
    pub formula_id: String,
    pub item_id: String,
    pub count: i64,
    pub weight: i64,
    pub cost_point: i64,
    pub formula_type: String,
    pub buff_type: String,
    #[serde(default)]
    pub costs: Vec<BuildingCostDto>,
    #[serde(default)]
    pub require_rooms: Vec<BuildingRequireRoomDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkshopFormulaDto {
    pub sort_id: i64,
    pub formula_id: String,
    pub rarity: i64,
    pub item_id: String,
    pub count: i64,
    pub gold_cost: i64,
    pub ap_cost: i64,
    pub formula_type: String,
    pub buff_type: String,
    pub extra_outcome_rate: f64,
    #[serde(default)]
    pub extra_outcome_group: Vec<WorkshopExtraOutcomeDto>,
    #[serde(default)]
    pub costs: Vec<BuildingCostDto>,
    #[serde(default)]
    pub require_rooms: Vec<BuildingRequireRoomDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BuildingFormulaBundleDto {
    #[serde(default)]
    pub manufact_formulas: Vec<ManufactFormulaDto>,
    #[serde(default)]
    pub workshop_formulas: Vec<WorkshopFormulaDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemDto {
    pub item_id: String,
    pub name: String,
    pub description: String,
    pub rarity: String,
    pub icon_id: String,
    pub sort_id: i64,
    pub usage: String,
    pub obtain_approach: String,
    pub classify_type: String,
    pub item_type: String,
    #[serde(default)]
    pub stage_drop_list: Vec<ItemStageDropDto>,
    #[serde(default)]
    pub building_product_list: Vec<ItemBuildingProductDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperatorTalentDto {
    pub group_key: String,
    pub name: String,
    pub description: String,
    pub elite: u8,
    pub level: u32,
    pub required_potential_rank: u8,
    #[serde(default)]
    pub blackboard: Vec<OperatorBlackboardEntryDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperatorPotentialDto {
    pub rank: u8,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperatorModuleDto {
    pub uni_equip_id: String,
    pub uni_equip_name: String,
    pub uni_equip_icon: String,
    pub uni_equip_desc: String,
    pub type_icon: String,
    pub unlock_evolve_phase: String,
    pub char_id: String,
    pub unlock_level: u32,
    #[serde(default)]
    pub mission_list: Vec<String>,
    pub unlock_favors: Option<std::collections::HashMap<String, i64>>,
    #[serde(default)]
    pub unlock_favor_percents: Option<std::collections::HashMap<String, u32>>,
    pub item_cost: Option<std::collections::HashMap<String, Vec<ModuleCostDto>>>,
    pub is_special_equip: bool,
    pub special_equip_desc: Option<String>,
    #[serde(default)]
    pub battle_phases: Vec<OperatorModuleBattlePhaseDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModuleCostDto {
    pub id: String,
    pub count: f64,
    #[serde(rename = "type")]
    pub cost_type: String,
    pub item_name: Option<String>,
    pub item_rarity: Option<String>,
    pub item_icon_id: Option<String>,
    pub item_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperatorModuleBattlePhaseDto {
    pub equip_level: u8,
    #[serde(default)]
    pub parts: Vec<OperatorModuleBattlePartDto>,
    #[serde(default)]
    pub attribute_blackboard: Vec<OperatorBlackboardEntryDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperatorModuleBattlePartDto {
    pub target: String,
    #[serde(default)]
    pub trait_candidates: Vec<OperatorModuleTraitCandidateDto>,
    #[serde(default)]
    pub talent_candidates: Vec<OperatorModuleTalentCandidateDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperatorModuleTraitCandidateDto {
    pub description: String,
    pub elite: u8,
    pub level: u32,
    pub required_potential_rank: u8,
    #[serde(default)]
    pub blackboard: Vec<OperatorBlackboardEntryDto>,
    #[serde(default)]
    pub range: Option<OperatorRangeDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperatorModuleTalentCandidateDto {
    pub name: Option<String>,
    pub description: String,
    pub elite: u8,
    pub level: u32,
    pub required_potential_rank: u8,
    #[serde(default)]
    pub blackboard: Vec<OperatorBlackboardEntryDto>,
    #[serde(default)]
    pub range: Option<OperatorRangeDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperatorTraitDto {
    pub group_key: String,
    pub description: String,
    pub elite: u8,
    pub level: u32,
    pub required_potential_rank: u8,
    #[serde(default)]
    pub blackboard: Vec<OperatorBlackboardEntryDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperatorDetailDto {
    pub id: String,
    pub name: String,
    pub codename: String,
    pub rarity: u8,
    pub profession: String,
    pub branch: String,
    #[serde(default)]
    pub teams: Vec<String>,
    #[serde(default)]
    pub nations: Vec<String>,
    #[serde(default)]
    pub groups: Vec<String>,
    pub thumbnail_hue: u16,
    pub quote: String,
    pub tags: Vec<String>,
    #[serde(default)]
    pub traits: Vec<OperatorTraitDto>,
    #[serde(default)]
    pub talents: Vec<OperatorTalentDto>,
    #[serde(default)]
    pub potentials: Vec<OperatorPotentialDto>,
    #[serde(default)]
    pub modules: Vec<OperatorModuleDto>,
    pub archetype_description: String,
    pub elite_caps: Vec<u32>,
    #[serde(default)]
    pub elite_exp_costs: Vec<Vec<i64>>,
    #[serde(default)]
    pub elite_upgrade_gold_costs: Vec<Vec<i64>>,
    #[serde(default)]
    pub elite_evolve_gold_costs: Vec<i64>,
    #[serde(default)]
    pub elite_evolve_costs: Vec<Vec<OperatorUpgradeCostDto>>,
    #[serde(default)]
    pub all_skill_level_up_costs: Vec<OperatorUpgradeCostStageDto>,
    pub stats: Vec<OperatorStatProgressionDto>,
    pub skills: Vec<OperatorSkillDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserPlanModuleDto {
    pub module_id: String,
    pub current_stage: u8,
    pub target_stage: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserPlanOperatorStateDto {
    pub elite: u8,
    pub level: u32,
    #[serde(default)]
    pub skill_levels: Vec<u8>,
    #[serde(default)]
    pub modules: Vec<UserPlanModuleDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserPlanOperatorDto {
    pub operator_id: String,
    pub current: UserPlanOperatorStateDto,
    pub target: UserPlanOperatorStateDto,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserPlanDto {
    #[serde(default)]
    pub selected_operator_ids: Vec<String>,
    #[serde(default)]
    pub operators: Vec<UserPlanOperatorDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegionSyncStatus {
    pub region: String,
    pub source_revision: Option<String>,
    pub fetched_at: Option<String>,
    pub operator_count: usize,
    pub is_ready: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncResult {
    pub region: String,
    pub source_revision: String,
    pub updated_at: String,
    pub operator_count: usize,
    pub status: String,
}
