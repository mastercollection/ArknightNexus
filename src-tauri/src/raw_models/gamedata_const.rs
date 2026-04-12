use std::collections::HashMap;

use serde::Deserialize;

pub type RawTermDescriptionDict = HashMap<String, RawTermDescription>;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawTermDescription {
    #[serde(default)]
    pub term_id: String,
    #[serde(default)]
    pub term_name: String,
    #[serde(default)]
    pub description: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawGameDataConst {
    #[serde(default)]
    pub term_description_dict: RawTermDescriptionDict,
}

impl RawGameDataConst {
    pub fn into_term_descriptions(self) -> HashMap<String, String> {
        self.term_description_dict
            .into_iter()
            .filter_map(|(key, value)| {
                let description = value.description.trim().to_string();
                if description.is_empty() {
                    None
                } else {
                    Some((key, description))
                }
            })
            .collect()
    }
}
