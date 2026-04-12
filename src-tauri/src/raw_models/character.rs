use std::collections::HashMap;

use serde::{Deserialize, Deserializer};

use super::{
    deserialize_optional_vec_null_or_empty_object, deserialize_vec_or_empty_object, RawBlackboard,
    RawCost, RawNumberValue, RawRarityValue, RawUnlockCond,
};

pub type RawCharacterTable = HashMap<String, RawCharacterEntry>;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawCharacterEntry {
    pub name: String,
    pub description: Option<String>,
    pub sort_index: i64,
    pub sp_target_type: String,
    pub sp_target_id: Option<String>,
    pub can_use_general_potential_item: bool,
    pub can_use_activity_potential_item: bool,
    pub potential_item_id: Option<String>,
    pub activity_potential_item_id: Option<String>,
    pub nation_id: Option<String>,
    pub group_id: Option<String>,
    pub team_id: Option<String>,
    pub main_power: RawPower,
    pub display_number: Option<String>,
    pub appellation: String,
    pub position: String,
    pub tag_list: Option<Vec<String>>,
    pub item_usage: Option<String>,
    pub item_desc: Option<String>,
    pub item_obtain_approach: Option<String>,
    pub is_not_obtainable: bool,
    pub is_sp_char: bool,
    pub max_potential_level: i64,
    pub rarity: RawRarityValue,
    pub profession: String,
    pub sub_profession_id: String,
    #[serde(rename = "trait")]
    pub trait_field: Option<RawTrait>,
    pub phases: Vec<RawPhase>,
    #[serde(deserialize_with = "deserialize_skill_references")]
    pub skills: Vec<RawSkillReference>,
    pub talents: Option<Vec<RawTalent>>,
    #[serde(deserialize_with = "deserialize_potential_ranks")]
    pub potential_ranks: Vec<RawPotentialRank>,
    pub favor_key_frames: Option<Vec<RawKeyFrame>>,
    #[serde(deserialize_with = "deserialize_all_skill_lvlup")]
    pub all_skill_lvlup: Vec<RawAllSkillLvlup>,
    pub sub_power: Option<Vec<RawPower>>,
    pub classic_potential_item_id: Option<String>,
    pub display_token_dict: Option<HashMap<String, bool>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawPower {
    pub nation_id: Option<String>,
    pub group_id: Option<String>,
    pub team_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawPhase {
    pub character_prefab_key: String,
    pub range_id: Option<String>,
    pub max_level: u32,
    pub attributes_key_frames: Vec<RawKeyFrame>,
    #[serde(deserialize_with = "deserialize_optional_costs")]
    pub evolve_cost: Option<Vec<RawCost>>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RawKeyFrame {
    pub level: u32,
    pub data: RawAttributeData,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawAttributeData {
    pub max_hp: RawNumberValue,
    pub atk: RawNumberValue,
    pub def: RawNumberValue,
    pub magic_resistance: RawNumberValue,
    pub cost: RawNumberValue,
    pub block_cnt: RawNumberValue,
    pub move_speed: RawNumberValue,
    pub attack_speed: RawNumberValue,
    pub base_attack_time: RawNumberValue,
    pub respawn_time: RawNumberValue,
    pub hp_recovery_per_sec: RawNumberValue,
    pub sp_recovery_per_sec: RawNumberValue,
    pub max_deploy_count: RawNumberValue,
    pub max_deck_stack_cnt: RawNumberValue,
    pub taunt_level: RawNumberValue,
    pub mass_level: RawNumberValue,
    pub base_force_level: RawNumberValue,
    pub stun_immune: bool,
    pub silence_immune: bool,
    pub sleep_immune: bool,
    pub frozen_immune: bool,
    pub levitate_immune: bool,
    pub disarmed_combat_immune: bool,
    pub feared_immune: bool,
    pub palsy_immune: bool,
    pub attract_immune: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawSkillReference {
    pub skill_id: Option<String>,
    pub override_prefab_key: Option<String>,
    pub override_token_key: Option<String>,
    #[serde(deserialize_with = "deserialize_level_up_cost_conditions")]
    pub level_up_cost_cond: Vec<RawLevelUpCostCond>,
    pub unlock_cond: RawUnlockCond,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawLevelUpCostCond {
    pub unlock_cond: RawUnlockCond,
    pub lvl_up_time: RawNumberValue,
    pub level_up_cost: Option<Vec<RawCost>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawAllSkillLvlup {
    pub unlock_cond: RawUnlockCond,
    pub lvl_up_cost: Option<Vec<RawCost>>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RawPotentialRank {
    #[serde(rename = "type")]
    pub rank_type: RawPotentialRankType,
    pub description: String,
    pub buff: Option<RawBuff>,
    pub equivalent_cost: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
pub enum RawPotentialRankType {
    Number(i64),
    Text(String),
}

#[derive(Debug, Clone, Deserialize)]
pub struct RawBuff {
    pub attributes: RawAttributes,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawAttributes {
    pub abnormal_flags: Option<serde_json::Value>,
    pub abnormal_immunes: Option<serde_json::Value>,
    pub abnormal_antis: Option<serde_json::Value>,
    pub abnormal_combos: Option<serde_json::Value>,
    pub abnormal_combo_immunes: Option<serde_json::Value>,
    pub attribute_modifiers: Vec<RawAttributeModifier>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawAttributeModifier {
    pub attribute_type: String,
    pub formula_item: String,
    pub value: RawNumberValue,
    pub load_from_blackboard: bool,
    pub fetch_base_value_from_source_entity: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RawTrait {
    pub candidates: Vec<RawTraitCandidate>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawTraitCandidate {
    pub unlock_condition: RawUnlockCond,
    pub required_potential_rank: RawNumberValue,
    #[serde(deserialize_with = "deserialize_blackboard_items")]
    pub blackboard: Vec<RawBlackboard>,
    pub override_descripton: Option<String>,
    pub prefab_key: Option<String>,
    pub range_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RawTalent {
    pub candidates: Option<Vec<RawTalentCandidate>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawTalentCandidate {
    pub unlock_condition: RawUnlockCond,
    pub required_potential_rank: RawNumberValue,
    pub prefab_key: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub range_id: Option<String>,
    #[serde(deserialize_with = "deserialize_blackboard_items")]
    pub blackboard: Vec<RawBlackboard>,
    pub is_hide_talent: bool,
    pub token_key: Option<String>,
}

fn deserialize_skill_references<'de, D>(deserializer: D) -> Result<Vec<RawSkillReference>, D::Error>
where
    D: Deserializer<'de>,
{
    deserialize_vec_or_empty_object(deserializer, "skills")
}

fn deserialize_all_skill_lvlup<'de, D>(deserializer: D) -> Result<Vec<RawAllSkillLvlup>, D::Error>
where
    D: Deserializer<'de>,
{
    deserialize_vec_or_empty_object(deserializer, "allSkillLvlup")
}

fn deserialize_optional_costs<'de, D>(deserializer: D) -> Result<Option<Vec<RawCost>>, D::Error>
where
    D: Deserializer<'de>,
{
    deserialize_optional_vec_null_or_empty_object(deserializer, "evolveCost")
}

fn deserialize_level_up_cost_conditions<'de, D>(
    deserializer: D,
) -> Result<Vec<RawLevelUpCostCond>, D::Error>
where
    D: Deserializer<'de>,
{
    deserialize_vec_or_empty_object(deserializer, "levelUpCostCond")
}

fn deserialize_potential_ranks<'de, D>(deserializer: D) -> Result<Vec<RawPotentialRank>, D::Error>
where
    D: Deserializer<'de>,
{
    deserialize_vec_or_empty_object(deserializer, "potentialRanks")
}

fn deserialize_blackboard_items<'de, D>(deserializer: D) -> Result<Vec<RawBlackboard>, D::Error>
where
    D: Deserializer<'de>,
{
    deserialize_vec_or_empty_object(deserializer, "blackboard")
}
