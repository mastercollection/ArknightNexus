use serde::Deserialize;

pub type RawFavorTable = RawFavorRoot;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawFavorRoot {
    pub max_favor: i64,
    #[serde(default)]
    pub favor_frames: Vec<RawFavorFrame>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawFavorFrame {
    pub level: i64,
    pub data: RawFavorFrameData,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawFavorFrameData {
    pub favor_point: i64,
    pub percent: i64,
    pub battle_phase: i64,
}
