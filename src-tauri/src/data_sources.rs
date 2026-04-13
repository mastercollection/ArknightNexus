use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RegionCode {
    Cn,
    Kr,
    Jp,
    Tw,
    En,
}

impl RegionCode {
    pub fn parse(value: &str) -> Option<Self> {
        match value.trim().to_ascii_lowercase().as_str() {
            "cn" => Some(Self::Cn),
            "kr" => Some(Self::Kr),
            "jp" => Some(Self::Jp),
            "tw" => Some(Self::Tw),
            "en" => Some(Self::En),
            _ => None,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Cn => "cn",
            Self::Kr => "kr",
            Self::Jp => "jp",
            Self::Tw => "tw",
            Self::En => "en",
        }
    }

    pub fn all() -> [Self; 5] {
        [Self::Cn, Self::Kr, Self::Jp, Self::Tw, Self::En]
    }

    pub fn descriptor(&self) -> SourceDescriptor {
        let region = self.as_str();
        SourceDescriptor {
            repo: "https://github.com/ArknightsAssets/ArknightsGamedata",
            branch: "master",
            character_path: Box::leak(
                format!("{region}/gamedata/excel/character_table.json").into_boxed_str(),
            ),
            skill_path: Box::leak(
                format!("{region}/gamedata/excel/skill_table.json").into_boxed_str(),
            ),
            gamedata_const_path: Box::leak(
                format!("{region}/gamedata/excel/gamedata_const.json").into_boxed_str(),
            ),
            uniequip_path: Box::leak(
                format!("{region}/gamedata/excel/uniequip_table.json").into_boxed_str(),
            ),
            handbook_team_path: Box::leak(
                format!("{region}/gamedata/excel/handbook_team_table.json").into_boxed_str(),
            ),
            range_table_path: Box::leak(
                format!("{region}/gamedata/excel/range_table.json").into_boxed_str(),
            ),
            item_table_path: Box::leak(
                format!("{region}/gamedata/excel/item_table.json").into_boxed_str(),
            ),
            building_data_path: Box::leak(
                format!("{region}/gamedata/excel/building_data.json").into_boxed_str(),
            ),
            battle_equip_table_path: Box::leak(
                format!("{region}/gamedata/excel/battle_equip_table.json").into_boxed_str(),
            ),
            favor_table_path: Box::leak(
                format!("{region}/gamedata/excel/favor_table.json").into_boxed_str(),
            ),
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct SourceDescriptor {
    pub repo: &'static str,
    pub branch: &'static str,
    pub character_path: &'static str,
    pub skill_path: &'static str,
    pub gamedata_const_path: &'static str,
    pub uniequip_path: &'static str,
    pub handbook_team_path: &'static str,
    pub range_table_path: &'static str,
    pub item_table_path: &'static str,
    pub building_data_path: &'static str,
    pub battle_equip_table_path: &'static str,
    pub favor_table_path: &'static str,
}

impl SourceDescriptor {
    pub fn raw_url(&self, path: &str) -> String {
        let owner_repo = self
            .repo
            .trim_end_matches('/')
            .strip_prefix("https://github.com/")
            .unwrap_or(self.repo);

        format!(
            "https://raw.githubusercontent.com/{owner_repo}/refs/heads/{}/{path}",
            self.branch
        )
    }
}
