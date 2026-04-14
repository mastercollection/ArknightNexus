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
            data_version_path: format!("{region}/gamedata/excel/data_version.txt"),
            character_path: format!("{region}/gamedata/excel/character_table.json"),
            skill_path: format!("{region}/gamedata/excel/skill_table.json"),
            gamedata_const_path: format!("{region}/gamedata/excel/gamedata_const.json"),
            uniequip_path: format!("{region}/gamedata/excel/uniequip_table.json"),
            handbook_team_path: format!("{region}/gamedata/excel/handbook_team_table.json"),
            range_table_path: format!("{region}/gamedata/excel/range_table.json"),
            item_table_path: format!("{region}/gamedata/excel/item_table.json"),
            stage_table_path: format!("{region}/gamedata/excel/stage_table.json"),
            building_data_path: format!("{region}/gamedata/excel/building_data.json"),
            battle_equip_table_path: format!("{region}/gamedata/excel/battle_equip_table.json"),
            favor_table_path: format!("{region}/gamedata/excel/favor_table.json"),
        }
    }
}

#[derive(Debug, Clone)]
pub struct SourceDescriptor {
    pub repo: &'static str,
    pub branch: &'static str,
    pub data_version_path: String,
    pub character_path: String,
    pub skill_path: String,
    pub gamedata_const_path: String,
    pub uniequip_path: String,
    pub handbook_team_path: String,
    pub range_table_path: String,
    pub item_table_path: String,
    pub stage_table_path: String,
    pub building_data_path: String,
    pub battle_equip_table_path: String,
    pub favor_table_path: String,
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
