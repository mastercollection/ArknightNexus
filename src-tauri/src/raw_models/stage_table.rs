use std::collections::HashMap;

use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawStageTable {
    #[serde(default)]
    pub stages: HashMap<String, RawStageEntry>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawStageEntry {
    pub stage_id: String,
    #[serde(default)]
    pub code: Option<String>,
}
