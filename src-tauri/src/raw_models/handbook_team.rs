use std::collections::HashMap;

use serde::Deserialize;

pub type RawPowerDict = HashMap<String, RawPowerEntry>;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawPowerEntry {
    #[serde(default)]
    pub power_id: String,
    #[serde(default)]
    pub power_name: String,
}

pub type RawHandbookTeamTable = HashMap<String, RawPowerEntry>;

pub fn into_power_names(table: RawHandbookTeamTable) -> HashMap<String, String> {
    table
        .into_iter()
        .filter_map(|(key, value)| {
            let id = if value.power_id.trim().is_empty() {
                key
            } else {
                value.power_id
            };
            let name = value.power_name.trim().to_string();

            if id.trim().is_empty() || name.is_empty() {
                None
            } else {
                Some((id, name))
            }
        })
        .collect()
}
