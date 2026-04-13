use std::collections::HashMap;

use serde::{Deserialize, Deserializer};

use super::deserialize_vec_or_empty_object;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawItemTable {
    #[serde(default)]
    pub items: HashMap<String, RawItemEntry>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawItemEntry {
    pub item_id: String,
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    pub rarity: RawStringLikeValue,
    pub icon_id: String,
    pub sort_id: i64,
    #[serde(default)]
    pub usage: Option<String>,
    #[serde(default)]
    pub obtain_approach: Option<String>,
    #[serde(default)]
    pub classify_type: String,
    pub item_type: RawStringLikeValue,
    #[serde(default, deserialize_with = "deserialize_stage_drop_list")]
    pub stage_drop_list: Vec<RawItemStageDrop>,
    #[serde(default, deserialize_with = "deserialize_building_product_list")]
    pub building_product_list: Vec<RawItemBuildingProduct>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawItemStageDrop {
    pub stage_id: String,
    pub occ_per: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawItemBuildingProduct {
    pub room_type: String,
    pub formula_id: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
pub enum RawStringLikeValue {
    Text(String),
    Number(i64),
}

impl RawStringLikeValue {
    pub fn as_string(&self) -> String {
        match self {
            Self::Text(value) => value.clone(),
            Self::Number(value) => value.to_string(),
        }
    }
}

fn deserialize_stage_drop_list<'de, D>(deserializer: D) -> Result<Vec<RawItemStageDrop>, D::Error>
where
    D: Deserializer<'de>,
{
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum StageDropListValue {
        List(Vec<RawItemStageDrop>),
        Object(HashMap<String, serde::de::IgnoredAny>),
    }

    Ok(
        match Option::<StageDropListValue>::deserialize(deserializer)? {
            Some(StageDropListValue::List(items)) => items,
            Some(StageDropListValue::Object(_)) | None => Vec::new(),
        },
    )
}

fn deserialize_building_product_list<'de, D>(
    deserializer: D,
) -> Result<Vec<RawItemBuildingProduct>, D::Error>
where
    D: Deserializer<'de>,
{
    deserialize_vec_or_empty_object(deserializer, "item buildingProductList")
}
