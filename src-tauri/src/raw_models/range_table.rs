use std::collections::HashMap;

use serde::Deserialize;

pub type RawRangeTable = HashMap<String, RawRangeEntry>;

#[derive(Debug, Clone, Deserialize)]
pub struct RawRangeEntry {
    pub id: String,
    pub direction: i32,
    pub grids: Vec<RawRangeGrid>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RawRangeGrid {
    pub row: i32,
    pub col: i32,
}
