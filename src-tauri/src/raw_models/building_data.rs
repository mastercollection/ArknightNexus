use std::collections::HashMap;

use serde::Deserialize;

use super::{RawCost, deserialize_vec_or_empty_object};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawBuildingData {
    #[serde(default)]
    pub manufact_formulas: HashMap<String, RawManufactFormula>,
    #[serde(default)]
    pub workshop_formulas: HashMap<String, RawWorkshopFormula>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawManufactFormula {
    pub formula_id: String,
    pub item_id: String,
    pub count: i64,
    pub weight: i64,
    pub cost_point: i64,
    pub formula_type: String,
    pub buff_type: String,
    #[serde(default, deserialize_with = "deserialize_formula_costs")]
    pub costs: Vec<RawCost>,
    #[serde(default, deserialize_with = "deserialize_require_rooms")]
    pub require_rooms: Vec<RawBuildingRequireRoom>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawWorkshopFormula {
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
    #[serde(default, deserialize_with = "deserialize_extra_outcomes")]
    pub extra_outcome_group: Vec<RawWorkshopExtraOutcome>,
    #[serde(default, deserialize_with = "deserialize_formula_costs")]
    pub costs: Vec<RawCost>,
    #[serde(default, deserialize_with = "deserialize_require_rooms")]
    pub require_rooms: Vec<RawBuildingRequireRoom>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawWorkshopExtraOutcome {
    pub weight: i64,
    pub item_id: String,
    pub item_count: i64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawBuildingRequireRoom {
    pub room_id: String,
    pub room_level: i64,
    pub room_count: i64,
}

fn deserialize_formula_costs<'de, D>(deserializer: D) -> Result<Vec<RawCost>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    deserialize_vec_or_empty_object(deserializer, "building formula costs")
}

fn deserialize_require_rooms<'de, D>(deserializer: D) -> Result<Vec<RawBuildingRequireRoom>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    deserialize_vec_or_empty_object(deserializer, "building requireRooms")
}

fn deserialize_extra_outcomes<'de, D>(
    deserializer: D,
) -> Result<Vec<RawWorkshopExtraOutcome>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    deserialize_vec_or_empty_object(deserializer, "building extraOutcomeGroup")
}
