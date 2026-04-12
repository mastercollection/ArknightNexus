use std::collections::HashMap;

use serde::{Deserialize, Deserializer};

use super::{
    deserialize_optional_vec_null_or_empty_object, deserialize_vec_or_empty_object, RawBlackboard,
    RawNumberValue, RawUnlockCond,
};

pub type RawBattleEquipTable = HashMap<String, RawBattleEquipEntry>;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawBattleEquipEntry {
    #[serde(default)]
    pub phases: Vec<RawBattleEquipPhase>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawBattleEquipPhase {
    pub equip_level: u8,
    #[serde(default, deserialize_with = "deserialize_battle_parts")]
    pub parts: Vec<RawBattleEquipPart>,
    #[serde(default, deserialize_with = "deserialize_attribute_blackboard")]
    pub attribute_blackboard: Vec<RawBlackboard>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawBattleEquipPart {
    pub target: String,
    pub add_or_override_talent_data_bundle: RawBattleEquipTalentBundle,
    pub override_trait_data_bundle: RawBattleEquipTraitBundle,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawBattleEquipTalentBundle {
    #[serde(default, deserialize_with = "deserialize_optional_talent_candidates")]
    pub candidates: Option<Vec<RawBattleEquipTalentCandidate>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawBattleEquipTraitBundle {
    #[serde(default, deserialize_with = "deserialize_optional_trait_candidates")]
    pub candidates: Option<Vec<RawBattleEquipTraitCandidate>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawBattleEquipTraitCandidate {
    pub additional_description: Option<String>,
    pub unlock_condition: RawUnlockCond,
    pub required_potential_rank: RawNumberValue,
    #[serde(default, deserialize_with = "deserialize_trait_blackboard")]
    pub blackboard: Vec<RawBlackboard>,
    pub range_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawBattleEquipTalentCandidate {
    pub upgrade_description: Option<String>,
    pub unlock_condition: RawUnlockCond,
    pub required_potential_rank: RawNumberValue,
    pub name: Option<String>,
    pub range_id: Option<String>,
    #[serde(default, deserialize_with = "deserialize_talent_blackboard")]
    pub blackboard: Vec<RawBlackboard>,
}

fn deserialize_battle_parts<'de, D>(deserializer: D) -> Result<Vec<RawBattleEquipPart>, D::Error>
where
    D: Deserializer<'de>,
{
    deserialize_vec_or_empty_object(deserializer, "battleEquip.phases.parts")
}

fn deserialize_attribute_blackboard<'de, D>(
    deserializer: D,
) -> Result<Vec<RawBlackboard>, D::Error>
where
    D: Deserializer<'de>,
{
    deserialize_vec_or_empty_object(deserializer, "battleEquip.attributeBlackboard")
}

fn deserialize_optional_talent_candidates<'de, D>(
    deserializer: D,
) -> Result<Option<Vec<RawBattleEquipTalentCandidate>>, D::Error>
where
    D: Deserializer<'de>,
{
    deserialize_optional_vec_null_or_empty_object(
        deserializer,
        "battleEquip.addOrOverrideTalentDataBundle.candidates",
    )
}

fn deserialize_optional_trait_candidates<'de, D>(
    deserializer: D,
) -> Result<Option<Vec<RawBattleEquipTraitCandidate>>, D::Error>
where
    D: Deserializer<'de>,
{
    deserialize_optional_vec_null_or_empty_object(
        deserializer,
        "battleEquip.overrideTraitDataBundle.candidates",
    )
}

fn deserialize_trait_blackboard<'de, D>(
    deserializer: D,
) -> Result<Vec<RawBlackboard>, D::Error>
where
    D: Deserializer<'de>,
{
    deserialize_vec_or_empty_object(deserializer, "battleEquip.trait.blackboard")
}

fn deserialize_talent_blackboard<'de, D>(
    deserializer: D,
) -> Result<Vec<RawBlackboard>, D::Error>
where
    D: Deserializer<'de>,
{
    deserialize_vec_or_empty_object(deserializer, "battleEquip.talent.blackboard")
}
