use std::collections::HashMap;

use serde::{Deserialize, Deserializer};

use super::{deserialize_vec_or_empty_object, RawCost};

pub type RawSubProfDict = HashMap<String, RawSubProfession>;
pub type RawEquipDict = HashMap<String, RawEquipEntry>;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawSubProfession {
    #[serde(default)]
    pub sub_profession_id: String,
    #[serde(default)]
    pub sub_profession_name: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawUniequipTable {
    #[serde(default)]
    pub sub_prof_dict: RawSubProfDict,
    #[serde(default)]
    pub equip_dict: RawEquipDict,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawEquipEntry {
    pub uni_equip_id: String,
    pub uni_equip_name: String,
    pub uni_equip_icon: String,
    pub uni_equip_desc: String,
    pub type_icon: String,
    pub unlock_evolve_phase: String,
    pub char_id: String,
    pub unlock_level: u32,
    #[serde(deserialize_with = "deserialize_mission_list")]
    pub mission_list: Vec<String>,
    pub unlock_favors: Option<HashMap<String, i64>>,
    #[serde(deserialize_with = "deserialize_optional_item_cost")]
    pub item_cost: Option<HashMap<String, Vec<RawCost>>>,
    pub is_special_equip: bool,
    pub special_equip_desc: Option<String>,
    #[serde(default)]
    pub char_equip_order: i64,
}

impl RawUniequipTable {
    pub fn into_sub_prof_names(self) -> HashMap<String, String> {
        self.sub_prof_dict
            .into_iter()
            .filter_map(|(key, value)| {
                let id = if value.sub_profession_id.trim().is_empty() {
                    key
                } else {
                    value.sub_profession_id
                };
                let name = value.sub_profession_name.trim().to_string();

                if id.trim().is_empty() || name.is_empty() {
                    None
                } else {
                    Some((id, name))
                }
            })
            .collect()
    }

    pub fn into_equip_modules_by_char(self) -> HashMap<String, Vec<RawEquipEntry>> {
        let mut modules_by_char = HashMap::<String, Vec<RawEquipEntry>>::new();

        for (_, equip) in self.equip_dict {
            let char_id = equip.char_id.trim().to_string();
            if char_id.is_empty() {
                continue;
            }

            modules_by_char.entry(char_id).or_default().push(equip);
        }

        modules_by_char.values_mut().for_each(|items| {
            items.sort_by(|left, right| {
                left.char_equip_order
                    .cmp(&right.char_equip_order)
                    .then_with(|| left.uni_equip_id.cmp(&right.uni_equip_id))
            });
        });

        modules_by_char
    }
}

fn deserialize_mission_list<'de, D>(deserializer: D) -> Result<Vec<String>, D::Error>
where
    D: Deserializer<'de>,
{
    deserialize_vec_or_empty_object(deserializer, "missionList")
}

fn deserialize_optional_item_cost<'de, D>(
    deserializer: D,
) -> Result<Option<HashMap<String, Vec<RawCost>>>, D::Error>
where
    D: Deserializer<'de>,
{
    let value = Option::<serde_json::Value>::deserialize(deserializer)?;

    match value {
        None | Some(serde_json::Value::Null) => Ok(None),
        Some(serde_json::Value::Object(entries)) if entries.is_empty() => Ok(None),
        Some(serde_json::Value::Object(entries)) => {
            let mut parsed = HashMap::new();

            for (key, entry_value) in entries {
                let costs = match entry_value {
                    serde_json::Value::Array(items) => items
                        .into_iter()
                        .map(|item| serde_json::from_value(item).map_err(serde::de::Error::custom))
                        .collect::<Result<Vec<RawCost>, _>>()?,
                    serde_json::Value::Object(item) if item.is_empty() => Vec::new(),
                    other => {
                        return Err(serde::de::Error::custom(format!(
                            "expected array or empty object for itemCost.{key}, got {other}",
                        )));
                    }
                };

                parsed.insert(key, costs);
            }

            Ok(Some(parsed))
        }
        Some(other) => Err(serde::de::Error::custom(format!(
            "expected object or null for itemCost, got {other}",
        ))),
    }
}
