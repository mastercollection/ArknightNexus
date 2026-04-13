use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub const REGION_SNAPSHOT_SCHEMA_VERSION: u32 = 25;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedBlackboardEntry {
    pub key: String,
    pub value: Option<f64>,
    pub value_str: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedOperatorSummary {
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
pub struct CachedOperatorUpgradeCost {
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
pub struct CachedOperatorUpgradeCostStage {
    pub level: u8,
    #[serde(default)]
    pub costs: Vec<CachedOperatorUpgradeCost>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedOperatorStatPoint {
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
pub struct CachedOperatorStatProgression {
    pub level: u32,
    pub min: CachedOperatorStatPoint,
    pub max: CachedOperatorStatPoint,
    #[serde(default)]
    pub range: Option<CachedOperatorRange>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedOperatorTrait {
    pub group_key: String,
    pub description: String,
    pub elite: u8,
    pub level: u32,
    pub required_potential_rank: u8,
    #[serde(default)]
    pub blackboard: Vec<CachedBlackboardEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedOperatorTalent {
    pub group_key: String,
    pub name: String,
    pub description: String,
    pub elite: u8,
    pub level: u32,
    pub required_potential_rank: u8,
    #[serde(default)]
    pub blackboard: Vec<CachedBlackboardEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedOperatorPotential {
    pub rank: u8,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedOperatorModule {
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
    pub item_cost: Option<std::collections::HashMap<String, Vec<CachedModuleCost>>>,
    pub is_special_equip: bool,
    pub special_equip_desc: Option<String>,
    #[serde(default)]
    pub battle_phases: Vec<CachedModuleBattlePhase>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedModuleCost {
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
pub struct CachedModuleBattlePhase {
    pub equip_level: u8,
    #[serde(default)]
    pub parts: Vec<CachedModuleBattlePart>,
    #[serde(default)]
    pub attribute_blackboard: Vec<CachedBlackboardEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedModuleBattlePart {
    pub target: String,
    #[serde(default)]
    pub trait_candidates: Vec<CachedModuleTraitCandidate>,
    #[serde(default)]
    pub talent_candidates: Vec<CachedModuleTalentCandidate>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedModuleTraitCandidate {
    pub description: String,
    pub elite: u8,
    pub level: u32,
    pub required_potential_rank: u8,
    #[serde(default)]
    pub blackboard: Vec<CachedBlackboardEntry>,
    #[serde(default)]
    pub range: Option<CachedOperatorRange>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedModuleTalentCandidate {
    pub name: Option<String>,
    pub description: String,
    pub elite: u8,
    pub level: u32,
    pub required_potential_rank: u8,
    #[serde(default)]
    pub blackboard: Vec<CachedBlackboardEntry>,
    #[serde(default)]
    pub range: Option<CachedOperatorRange>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedOperatorSkillLevel {
    pub level: u8,
    pub sp_cost: u32,
    pub initial_sp: u32,
    pub duration: u32,
    pub description: String,
    #[serde(default)]
    pub blackboard: Vec<CachedBlackboardEntry>,
    #[serde(default)]
    pub range: Option<CachedOperatorRange>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedOperatorRange {
    pub id: String,
    #[serde(default)]
    pub grids: Vec<CachedOperatorRangeGrid>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedOperatorRangeGrid {
    pub row: i32,
    pub col: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedOperatorSkill {
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
    pub upgrade_costs: Vec<CachedOperatorUpgradeCostStage>,
    pub levels: Vec<CachedOperatorSkillLevel>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedItemStageDrop {
    pub stage_id: String,
    #[serde(default)]
    pub stage_code: Option<String>,
    pub occ_per: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedBuildingRequireRoom {
    pub room_id: String,
    pub room_level: i64,
    pub room_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedWorkshopExtraOutcome {
    pub weight: i64,
    pub item_id: String,
    pub item_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedManufactFormula {
    pub formula_id: String,
    pub item_id: String,
    pub count: i64,
    pub weight: i64,
    pub cost_point: i64,
    pub formula_type: String,
    pub buff_type: String,
    #[serde(default)]
    pub costs: Vec<CachedBuildingCost>,
    #[serde(default)]
    pub require_rooms: Vec<CachedBuildingRequireRoom>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedWorkshopFormula {
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
    pub extra_outcome_group: Vec<CachedWorkshopExtraOutcome>,
    #[serde(default)]
    pub costs: Vec<CachedBuildingCost>,
    #[serde(default)]
    pub require_rooms: Vec<CachedBuildingRequireRoom>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedBuildingCost {
    pub id: String,
    pub count: f64,
    #[serde(rename = "type")]
    pub cost_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedItemBuildingProduct {
    pub room_type: String,
    pub formula_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedItem {
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
    pub stage_drop_list: Vec<CachedItemStageDrop>,
    #[serde(default)]
    pub building_product_list: Vec<CachedItemBuildingProduct>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedOperator {
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
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub traits: Vec<CachedOperatorTrait>,
    #[serde(default)]
    pub talents: Vec<CachedOperatorTalent>,
    #[serde(default)]
    pub potentials: Vec<CachedOperatorPotential>,
    #[serde(default)]
    pub modules: Vec<CachedOperatorModule>,
    pub archetype_description: String,
    #[serde(default)]
    pub elite_caps: Vec<u32>,
    #[serde(default)]
    pub elite_exp_costs: Vec<Vec<i64>>,
    #[serde(default)]
    pub elite_upgrade_gold_costs: Vec<Vec<i64>>,
    #[serde(default)]
    pub elite_evolve_gold_costs: Vec<i64>,
    #[serde(default)]
    pub elite_evolve_costs: Vec<Vec<CachedOperatorUpgradeCost>>,
    #[serde(default)]
    pub all_skill_level_up_costs: Vec<CachedOperatorUpgradeCostStage>,
    #[serde(default)]
    pub stats: Vec<CachedOperatorStatProgression>,
    #[serde(default)]
    pub skills: Vec<CachedOperatorSkill>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegionSnapshot {
    #[serde(default)]
    pub schema_version: u32,
    pub region: String,
    pub source_revision: String,
    pub fetched_at: String,
    #[serde(default)]
    pub stage_codes: HashMap<String, String>,
    #[serde(default)]
    pub items: Vec<CachedItem>,
    #[serde(default)]
    pub manufact_formulas: Vec<CachedManufactFormula>,
    #[serde(default)]
    pub workshop_formulas: Vec<CachedWorkshopFormula>,
    #[serde(default)]
    pub operators: Vec<CachedOperator>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegionSummarySnapshot {
    #[serde(default)]
    pub schema_version: u32,
    pub region: String,
    pub source_revision: String,
    pub fetched_at: String,
    #[serde(default)]
    pub operators: Vec<CachedOperatorSummary>,
}
