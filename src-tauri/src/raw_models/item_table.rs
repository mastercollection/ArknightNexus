use std::collections::HashMap;

use serde::Deserialize;

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
    pub rarity: RawStringLikeValue,
    pub icon_id: String,
    pub item_type: RawStringLikeValue,
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
