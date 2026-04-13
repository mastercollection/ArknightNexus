use std::collections::HashMap;

use serde::{Deserialize, Deserializer};

use super::{RawBlackboard, RawNumberValue};

pub type RawSkillTable = HashMap<String, RawSkillEntry>;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawSkillEntry {
    pub skill_id: Option<String>,
    pub icon_id: Option<String>,
    pub hidden: Option<bool>,
    pub levels: Vec<RawSkillLevel>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawSkillLevel {
    pub name: String,
    pub range_id: Option<String>,
    pub description: Option<String>,
    pub skill_type: Option<String>,
    pub duration_type: Option<String>,
    pub sp_data: Option<RawSpData>,
    pub prefab_id: Option<String>,
    pub duration: Option<RawNumberValue>,
    #[serde(deserialize_with = "deserialize_optional_blackboard")]
    pub blackboard: Option<Vec<RawBlackboard>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawSpData {
    pub sp_type: RawSpTypeValue,
    pub level_up_cost: Option<RawNumberValue>,
    pub max_charge_time: Option<RawNumberValue>,
    pub sp_cost: RawNumberValue,
    pub init_sp: RawNumberValue,
    pub increment: Option<RawNumberValue>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
pub enum RawSpTypeValue {
    Number(i32),
    Text(String),
}

fn deserialize_optional_blackboard<'de, D>(
    deserializer: D,
) -> Result<Option<Vec<RawBlackboard>>, D::Error>
where
    D: Deserializer<'de>,
{
    let value = Option::<serde_json::Value>::deserialize(deserializer)?;

    match value {
        None | Some(serde_json::Value::Null) => Ok(None),
        Some(other) => {
            super::parse_vec_or_empty_object::<RawBlackboard, D::Error>(other, "blackboard")
                .map(Some)
        }
    }
}
