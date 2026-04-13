#![allow(dead_code)]

mod battle_equip;
mod building_data;
mod character;
mod favor_table;
mod gamedata_const;
mod handbook_team;
mod item_table;
mod range_table;
mod stage_table;
mod skill;
mod uniequip;

use serde::de::{DeserializeOwned, Error as DeError};
use serde::{Deserialize, Deserializer};

pub use battle_equip::*;
pub use building_data::*;
pub use character::*;
pub use favor_table::*;
pub use gamedata_const::*;
pub use handbook_team::*;
pub use item_table::*;
pub use range_table::*;
pub use stage_table::*;
pub use skill::*;
pub use uniequip::*;

#[derive(Debug, Clone, Deserialize)]
pub struct RawUnlockCond {
    pub phase: RawPhaseValue,
    pub level: RawLevelValue,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
pub enum RawPhaseValue {
    Number(u8),
    Text(String),
}

#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
pub enum RawRarityValue {
    Number(u8),
    Text(String),
}

#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
pub enum RawLevelValue {
    Number(u32),
    Text(String),
}

#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
pub enum RawNumberValue {
    Integer(i64),
    Float(f64),
}

impl RawNumberValue {
    pub fn as_f64(&self) -> f64 {
        match self {
            Self::Integer(value) => *value as f64,
            Self::Float(value) => *value,
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct RawCost {
    pub id: String,
    pub count: RawNumberValue,
    #[serde(rename = "type")]
    pub cost_type: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawBlackboard {
    pub key: String,
    pub value: Option<RawNumberValue>,
    pub value_str: Option<String>,
}

pub(crate) fn parse_vec_or_empty_object<T, E>(
    value: serde_json::Value,
    label: &str,
) -> Result<Vec<T>, E>
where
    T: DeserializeOwned,
    E: DeError,
{
    match value {
        serde_json::Value::Array(entries) => entries
            .into_iter()
            .map(|entry| serde_json::from_value(entry).map_err(E::custom))
            .collect(),
        serde_json::Value::Object(entries) if entries.is_empty() => Ok(Vec::new()),
        serde_json::Value::Object(_) => Err(E::custom(format!(
            "expected an array or an empty object for {label}",
        ))),
        _ => Err(E::custom(format!(
            "expected an array or an empty object for {label}",
        ))),
    }
}

pub(crate) fn parse_optional_vec_null_or_empty_object<T, E>(
    value: Option<serde_json::Value>,
    label: &str,
) -> Result<Option<Vec<T>>, E>
where
    T: DeserializeOwned,
    E: DeError,
{
    match value {
        None | Some(serde_json::Value::Null) => Ok(None),
        Some(serde_json::Value::Array(entries)) => entries
            .into_iter()
            .map(|entry| serde_json::from_value(entry).map_err(E::custom))
            .collect::<Result<Vec<_>, _>>()
            .map(Some),
        Some(serde_json::Value::Object(entries)) if entries.is_empty() => Ok(None),
        Some(serde_json::Value::Object(_)) => Err(E::custom(format!(
            "expected null, an array, or an empty object for {label}",
        ))),
        Some(_) => Err(E::custom(format!(
            "expected null, an array, or an empty object for {label}",
        ))),
    }
}

pub(crate) fn deserialize_vec_or_empty_object<'de, D, T>(
    deserializer: D,
    label: &str,
) -> Result<Vec<T>, D::Error>
where
    D: Deserializer<'de>,
    T: DeserializeOwned,
{
    let value = serde_json::Value::deserialize(deserializer)?;
    parse_vec_or_empty_object::<T, D::Error>(value, label)
}

pub(crate) fn deserialize_optional_vec_null_or_empty_object<'de, D, T>(
    deserializer: D,
    label: &str,
) -> Result<Option<Vec<T>>, D::Error>
where
    D: Deserializer<'de>,
    T: DeserializeOwned,
{
    let value = Option::<serde_json::Value>::deserialize(deserializer)?;
    parse_optional_vec_null_or_empty_object::<T, D::Error>(value, label)
}
