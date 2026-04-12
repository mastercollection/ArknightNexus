use std::collections::HashMap;

use crate::cache_model::{
    CachedBlackboardEntry, CachedOperator, CachedOperatorPotential, CachedOperatorSkill,
    CachedOperatorModule, CachedModuleBattlePart, CachedModuleBattlePhase, CachedModuleCost,
    CachedModuleTalentCandidate, CachedModuleTraitCandidate, CachedOperatorRange,
    CachedOperatorRangeGrid, CachedOperatorSkillLevel, CachedOperatorStatPoint,
    CachedOperatorStatProgression, CachedOperatorTalent, CachedOperatorTrait,
};
use crate::data_sources::RegionCode;
use crate::raw_models::{
    RawBattleEquipEntry, RawBattleEquipPart, RawBattleEquipTable, RawBattleEquipTalentCandidate,
    RawBattleEquipTraitCandidate, RawBlackboard, RawCharacterEntry, RawCharacterTable,
    RawEquipEntry, RawFavorTable, RawItemEntry, RawKeyFrame, RawLevelValue, RawNumberValue,
    RawPhaseValue, RawPotentialRank, RawRangeEntry, RawRangeTable, RawRarityValue, RawSkillEntry,
    RawSkillLevel, RawSkillReference, RawSkillTable, RawTalentCandidate, RawTraitCandidate,
};

pub fn normalize_operators(
    _region: RegionCode,
    characters: RawCharacterTable,
    skills: RawSkillTable,
    range_table: &RawRangeTable,
    modules_by_char: &HashMap<String, Vec<RawEquipEntry>>,
    battle_equip_table: &RawBattleEquipTable,
    favor_table: &RawFavorTable,
    items_by_id: &HashMap<String, RawItemEntry>,
    sub_prof_names: &HashMap<String, String>,
    power_names: &HashMap<String, String>,
) -> Vec<CachedOperator> {
    let mut operators = characters
        .into_iter()
        .filter_map(|(id, character)| {
            normalize_operator(
                id,
                character,
                &skills,
                range_table,
                modules_by_char,
                battle_equip_table,
                favor_table,
                items_by_id,
                sub_prof_names,
                power_names,
            )
        })
        .collect::<Vec<_>>();

    operators.sort_by(|left, right| {
        right
            .rarity
            .cmp(&left.rarity)
            .then_with(|| left.name.cmp(&right.name))
    });

    operators
}

fn normalize_operator(
    id: String,
    character: RawCharacterEntry,
    skills: &HashMap<String, RawSkillEntry>,
    range_table: &RawRangeTable,
    modules_by_char: &HashMap<String, Vec<RawEquipEntry>>,
    battle_equip_table: &RawBattleEquipTable,
    favor_table: &RawFavorTable,
    items_by_id: &HashMap<String, RawItemEntry>,
    sub_prof_names: &HashMap<String, String>,
    power_names: &HashMap<String, String>,
) -> Option<CachedOperator> {
    if character.is_not_obtainable || matches!(character.profession.as_str(), "TOKEN" | "TRAP") {
        return None;
    }

    let elite_caps = character
        .phases
        .iter()
        .map(|phase| phase.max_level)
        .collect::<Vec<_>>();

    let stats = character
        .phases
        .iter()
        .enumerate()
        .filter_map(|(index, phase)| {
            let min = phase.attributes_key_frames.first()?;
            let max = phase.attributes_key_frames.last()?;

            Some(CachedOperatorStatProgression {
                level: index as u32 + 1,
                min: normalize_keyframe(min),
                max: normalize_keyframe(max),
                range: normalize_range(character.phases.get(index).and_then(|phase| phase.range_id.as_deref()), range_table),
            })
        })
        .collect::<Vec<_>>();

    let traits = character
        .trait_field
        .as_ref()
        .map(|value| {
            value
                .candidates
                .iter()
                .enumerate()
                .filter_map(|(index, candidate)| normalize_trait_candidate(index, candidate))
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();

    let talents = character
        .talents
        .as_ref()
        .into_iter()
        .flat_map(|talents| talents.iter().enumerate())
        .flat_map(|(group_index, talent)| {
            talent.candidates.as_ref().into_iter().flat_map(move |items| {
                items.iter().filter_map(move |candidate| {
                    normalize_talent_candidate(group_index, candidate)
                })
            })
        })
        .collect::<Vec<_>>();

    let potentials = character
        .potential_ranks
        .iter()
        .enumerate()
        .filter_map(|(index, rank)| normalize_potential_rank(index, rank))
        .collect::<Vec<_>>();

    let normalized_skills = character
        .skills
        .iter()
        .filter_map(|skill_ref| normalize_skill_reference(skill_ref, skills, range_table))
        .collect::<Vec<_>>();

    let modules = modules_by_char
        .get(&id)
        .map(|items| {
            items
                .iter()
                .map(|item| {
                    normalize_module(item, battle_equip_table, favor_table, range_table, items_by_id)
                })
                .collect()
        })
        .unwrap_or_default();

    let teams = resolve_power_names([character.team_id.as_deref()], power_names);
    let nations = resolve_power_names([character.nation_id.as_deref()], power_names);
    let groups = resolve_power_names([character.group_id.as_deref()], power_names);

    let tags = character
        .tag_list
        .unwrap_or_default()
        .into_iter()
        .filter(|value| !value.trim().is_empty())
        .collect::<Vec<_>>();

    let archetype_description = character
        .description
        .clone()
        .or_else(|| character.item_desc.clone())
        .unwrap_or_default();

    let quote = character
        .item_desc
        .clone()
        .or_else(|| character.description.clone())
        .unwrap_or_default();

    Some(CachedOperator {
        thumbnail_hue: generate_hue(&id),
        id,
        name: character.name.clone(),
        codename: if character.appellation.trim().is_empty() {
            character.name
        } else {
            character.appellation
        },
        rarity: parse_rarity_value(&character.rarity),
        profession: humanize_profession(&character.profession),
        branch: sub_prof_names
            .get(&character.sub_profession_id)
            .cloned()
            .unwrap_or_else(|| humanize_slug(&character.sub_profession_id)),
        teams,
        nations,
        groups,
        quote,
        tags,
        traits,
        talents,
        potentials,
        modules,
        archetype_description,
        elite_caps,
        stats,
        skills: normalized_skills,
    })
}

fn normalize_module(
    module: &RawEquipEntry,
    battle_equip_table: &RawBattleEquipTable,
    favor_table: &RawFavorTable,
    range_table: &RawRangeTable,
    items_by_id: &HashMap<String, RawItemEntry>,
) -> CachedOperatorModule {
    CachedOperatorModule {
        uni_equip_id: module.uni_equip_id.clone(),
        uni_equip_name: module.uni_equip_name.clone(),
        uni_equip_icon: module.uni_equip_icon.clone(),
        uni_equip_desc: module.uni_equip_desc.clone(),
        type_icon: module.type_icon.clone(),
        unlock_evolve_phase: module.unlock_evolve_phase.clone(),
        char_id: module.char_id.clone(),
        unlock_level: module.unlock_level,
        mission_list: module.mission_list.clone(),
        unlock_favors: module.unlock_favors.clone(),
        unlock_favor_percents: normalize_module_favor_percents(module, favor_table),
        item_cost: module.item_cost.as_ref().map(|items| {
            items.iter()
                .map(|(key, value)| {
                    (
                        key.clone(),
                        value
                            .iter()
                            .map(|cost| CachedModuleCost {
                                item_name: items_by_id.get(&cost.id).map(|item| item.name.clone()),
                                item_rarity: items_by_id.get(&cost.id).map(|item| item.rarity.as_string()),
                                item_icon_id: items_by_id.get(&cost.id).map(|item| item.icon_id.clone()),
                                item_type: items_by_id.get(&cost.id).map(|item| item.item_type.as_string()),
                                id: cost.id.clone(),
                                count: cost.count.as_f64(),
                                cost_type: cost.cost_type.clone(),
                            })
                            .collect(),
                    )
                })
                .collect()
        }),
        is_special_equip: module.is_special_equip,
        special_equip_desc: module.special_equip_desc.clone(),
        battle_phases: battle_equip_table
            .get(&module.uni_equip_id)
            .map(|entry| normalize_module_battle_phases(entry, range_table))
            .unwrap_or_default(),
    }
}

fn normalize_module_favor_percents(
    module: &RawEquipEntry,
    favor_table: &RawFavorTable,
) -> Option<HashMap<String, u32>> {
    let unlock_favors = module.unlock_favors.as_ref()?;
    let mut favor_frames = favor_table
        .favor_frames
        .iter()
        .map(|frame| (frame.data.favor_point, frame.data.percent))
        .collect::<Vec<_>>();

    if favor_frames.is_empty() {
        return None;
    }

    favor_frames.sort_by_key(|(favor_point, _)| *favor_point);

    let mut percents = HashMap::new();

    for (stage, favor_point) in unlock_favors {
        if *favor_point <= 0 {
            continue;
        }

        let percent = favor_frames
            .iter()
            .rev()
            .find(|(point, _)| *point <= *favor_point)
            .map(|(_, percent)| (*percent).max(0) as u32);

        if let Some(percent) = percent {
            percents.insert(stage.clone(), percent);
        }
    }

    if percents.is_empty() {
        None
    } else {
        Some(percents)
    }
}

fn normalize_module_battle_phases(
    entry: &RawBattleEquipEntry,
    range_table: &RawRangeTable,
) -> Vec<CachedModuleBattlePhase> {
    entry
        .phases
        .iter()
        .map(|phase| CachedModuleBattlePhase {
            equip_level: phase.equip_level,
            parts: phase
                .parts
                .iter()
                .map(|part| normalize_module_battle_part(part, range_table))
                .collect(),
            attribute_blackboard: phase
                .attribute_blackboard
                .iter()
                .filter_map(normalize_blackboard_entry)
                .collect(),
        })
        .collect()
}

fn normalize_module_battle_part(
    part: &RawBattleEquipPart,
    range_table: &RawRangeTable,
) -> CachedModuleBattlePart {
    CachedModuleBattlePart {
        target: part.target.clone(),
        trait_candidates: part
            .override_trait_data_bundle
            .candidates
            .as_ref()
            .into_iter()
            .flat_map(|items| items.iter())
            .filter_map(|candidate| normalize_module_trait_candidate(candidate, range_table))
            .collect(),
        talent_candidates: part
            .add_or_override_talent_data_bundle
            .candidates
            .as_ref()
            .into_iter()
            .flat_map(|items| items.iter())
            .filter_map(|candidate| normalize_module_talent_candidate(candidate, range_table))
            .collect(),
    }
}

fn normalize_module_trait_candidate(
    candidate: &RawBattleEquipTraitCandidate,
    range_table: &RawRangeTable,
) -> Option<CachedModuleTraitCandidate> {
    let description = candidate.additional_description.as_deref()?.trim();
    if description.is_empty() {
        return None;
    }

    Some(CachedModuleTraitCandidate {
        description: description.to_string(),
        elite: parse_phase_value(&candidate.unlock_condition.phase),
        level: parse_level_value(&candidate.unlock_condition.level),
        required_potential_rank: round_number_to_i64(&candidate.required_potential_rank).max(0)
            as u8,
        blackboard: candidate
            .blackboard
            .iter()
            .filter_map(normalize_blackboard_entry)
            .collect(),
        range: normalize_range(candidate.range_id.as_deref(), range_table),
    })
}

fn normalize_module_talent_candidate(
    candidate: &RawBattleEquipTalentCandidate,
    range_table: &RawRangeTable,
) -> Option<CachedModuleTalentCandidate> {
    let description = candidate.upgrade_description.as_deref()?.trim();
    if description.is_empty() {
        return None;
    }

    Some(CachedModuleTalentCandidate {
        name: candidate.name.clone().filter(|value| !value.trim().is_empty()),
        description: description.to_string(),
        elite: parse_phase_value(&candidate.unlock_condition.phase),
        level: parse_level_value(&candidate.unlock_condition.level),
        required_potential_rank: round_number_to_i64(&candidate.required_potential_rank).max(0)
            as u8,
        blackboard: candidate
            .blackboard
            .iter()
            .filter_map(normalize_blackboard_entry)
            .collect(),
        range: normalize_range(candidate.range_id.as_deref(), range_table),
    })
}

fn resolve_power_names<'a, const N: usize>(
    ids: [Option<&'a str>; N],
    power_names: &HashMap<String, String>,
) -> Vec<String> {
    let mut resolved = Vec::new();

    for id in ids.into_iter().flatten() {
        let trimmed = id.trim();
        if trimmed.is_empty() {
            continue;
        }

        let name = power_names
            .get(trimmed)
            .cloned()
            .unwrap_or_else(|| humanize_slug(trimmed));

        if !name.trim().is_empty() && !resolved.contains(&name) {
            resolved.push(name);
        }
    }

    resolved
}

fn normalize_keyframe(keyframe: &RawKeyFrame) -> CachedOperatorStatPoint {
    CachedOperatorStatPoint {
        hp: round_number_to_i64(&keyframe.data.max_hp),
        attack: round_number_to_i64(&keyframe.data.atk),
        defense: round_number_to_i64(&keyframe.data.def),
        resistance: round_number_to_i64(&keyframe.data.magic_resistance),
        redeploy_time: round_number_to_i64(&keyframe.data.respawn_time),
        dp_cost: round_number_to_i64(&keyframe.data.cost),
        block: round_number_to_i64(&keyframe.data.block_cnt),
        attack_interval: keyframe.data.base_attack_time.as_f64(),
        hp_recovery_per_sec: keyframe.data.hp_recovery_per_sec.as_f64(),
    }
}

fn normalize_skill_reference(
    skill_ref: &RawSkillReference,
    skills: &HashMap<String, RawSkillEntry>,
    range_table: &RawRangeTable,
) -> Option<CachedOperatorSkill> {
    let skill_id = skill_ref.skill_id.as_ref()?.to_owned();
    let skill = skills.get(&skill_id)?;
    let first_level = skill.levels.first()?;

    let levels = skill
        .levels
        .iter()
        .enumerate()
        .map(|(index, level)| normalize_skill_level(index as u8 + 1, level, range_table))
        .collect::<Vec<_>>();

    let description = first_level
        .description
        .clone()
        .unwrap_or_else(|| first_level.name.clone());

    Some(CachedOperatorSkill {
        id: skill_id,
        name: first_level.name.clone(),
        recovery_type: map_sp_recovery(first_level.sp_data.as_ref().map(|value| &value.sp_type)),
        activation_type: map_activation_type(first_level.skill_type.as_deref()),
        description,
        unlock_elite: parse_phase_value(&skill_ref.unlock_cond.phase),
        unlock_level: parse_level_value(&skill_ref.unlock_cond.level),
        levels,
    })
}

fn normalize_skill_level(
    level: u8,
    skill_level: &RawSkillLevel,
    range_table: &RawRangeTable,
) -> CachedOperatorSkillLevel {
    let sp_data = skill_level.sp_data.as_ref();

    CachedOperatorSkillLevel {
        level,
        sp_cost: sp_data
            .map(|value| value.sp_cost.as_f64().max(0.0).round() as u32)
            .unwrap_or_default(),
        initial_sp: sp_data
            .map(|value| value.init_sp.as_f64().max(0.0).round() as u32)
            .unwrap_or_default(),
        duration: skill_level
            .duration
            .as_ref()
            .map(|value| value.as_f64().max(0.0).round() as u32)
            .unwrap_or_default(),
        description: skill_level
            .description
            .clone()
            .unwrap_or_else(|| skill_level.name.clone()),
        blackboard: skill_level
            .blackboard
            .as_ref()
            .map(|items| items.iter().filter_map(normalize_blackboard_entry).collect())
            .unwrap_or_default(),
        range: normalize_range(skill_level.range_id.as_deref(), range_table),
    }
}

fn normalize_range(range_id: Option<&str>, range_table: &RawRangeTable) -> Option<CachedOperatorRange> {
    let range_id = range_id?.trim();
    if range_id.is_empty() {
        return None;
    }

    let entry = range_table.get(range_id)?;
    Some(cached_range_from_entry(entry, range_id))
}

fn cached_range_from_entry(entry: &RawRangeEntry, fallback_id: &str) -> CachedOperatorRange {
    CachedOperatorRange {
        id: if entry.id.trim().is_empty() {
            fallback_id.to_string()
        } else {
            entry.id.clone()
        },
        grids: entry
            .grids
            .iter()
            .map(|grid| CachedOperatorRangeGrid {
                row: grid.row,
                col: grid.col,
            })
            .collect(),
    }
}

fn normalize_trait_candidate(
    group_index: usize,
    candidate: &RawTraitCandidate,
) -> Option<CachedOperatorTrait> {
    let description = candidate.override_descripton.as_ref()?.trim();
    if description.is_empty() {
        return None;
    }

    Some(CachedOperatorTrait {
        group_key: candidate
            .prefab_key
            .clone()
            .filter(|value| !value.trim().is_empty())
            .unwrap_or_else(|| format!("trait-{group_index}")),
        description: description.to_string(),
        elite: parse_phase_value(&candidate.unlock_condition.phase),
        level: parse_level_value(&candidate.unlock_condition.level),
        required_potential_rank: round_number_to_i64(&candidate.required_potential_rank).max(0) as u8,
        blackboard: candidate
            .blackboard
            .iter()
            .filter_map(normalize_blackboard_entry)
            .collect(),
    })
}

fn normalize_talent_candidate(
    group_index: usize,
    candidate: &RawTalentCandidate,
) -> Option<CachedOperatorTalent> {
    let name = candidate.name.as_ref()?.trim();
    if name.is_empty() {
        return None;
    }

    let description = candidate.description.as_deref().unwrap_or("").trim();
    let description = if description.is_empty() {
        name.to_string()
    } else {
        description.to_string()
    };

    Some(CachedOperatorTalent {
        group_key: candidate
            .prefab_key
            .clone()
            .filter(|value| !value.trim().is_empty())
            .unwrap_or_else(|| format!("talent-{group_index}")),
        name: name.to_string(),
        description,
        elite: parse_phase_value(&candidate.unlock_condition.phase),
        level: parse_level_value(&candidate.unlock_condition.level),
        required_potential_rank: round_number_to_i64(&candidate.required_potential_rank).max(0) as u8,
        blackboard: candidate
            .blackboard
            .iter()
            .filter_map(normalize_blackboard_entry)
            .collect(),
    })
}

fn normalize_potential_rank(
    index: usize,
    rank: &RawPotentialRank,
) -> Option<CachedOperatorPotential> {
    let description = rank.description.trim();
    if description.is_empty() {
        None
    } else {
        Some(CachedOperatorPotential {
            rank: index as u8 + 2,
            description: description.to_string(),
        })
    }
}

fn normalize_blackboard_entry(blackboard: &RawBlackboard) -> Option<CachedBlackboardEntry> {
    let key = blackboard.key.trim();
    if key.is_empty() {
        return None;
    }

    Some(CachedBlackboardEntry {
        key: key.to_string(),
        value: blackboard.value.as_ref().map(RawNumberValue::as_f64),
        value_str: blackboard.value_str.clone(),
    })
}

fn map_sp_recovery(sp_type: Option<&crate::raw_models::RawSpTypeValue>) -> String {
    match sp_type {
        Some(crate::raw_models::RawSpTypeValue::Text(value)) => match value.as_str() {
            "INCREASE_WITH_TIME" => "auto_recovery".to_string(),
            "INCREASE_WHEN_ATTACK" => "attack_recovery".to_string(),
            "INCREASE_WHEN_TAKEN_DAMAGE" => "defense_recovery".to_string(),
            _ => "unknown_recovery".to_string(),
        },
        Some(crate::raw_models::RawSpTypeValue::Number(1)) => "auto_recovery".to_string(),
        Some(crate::raw_models::RawSpTypeValue::Number(2)) => "attack_recovery".to_string(),
        Some(crate::raw_models::RawSpTypeValue::Number(4)) => "defense_recovery".to_string(),
        _ => "unknown_recovery".to_string(),
    }
}

fn map_activation_type(skill_type: Option<&str>) -> String {
    match skill_type.unwrap_or_default() {
        "PASSIVE" => "passive".to_string(),
        "MANUAL" => "manual_trigger".to_string(),
        "AUTO" => "auto_trigger".to_string(),
        _ => "unknown_trigger".to_string(),
    }
}

fn humanize_profession(value: &str) -> String {
    match value {
        "PIONEER" => "Vanguard".to_string(),
        "SNIPER" => "Sniper".to_string(),
        "MEDIC" => "Medic".to_string(),
        "CASTER" => "Caster".to_string(),
        "WARRIOR" => "Guard".to_string(),
        "TANK" => "Defender".to_string(),
        "SUPPORT" => "Supporter".to_string(),
        "SPECIAL" => "Specialist".to_string(),
        other => humanize_slug(other),
    }
}


fn humanize_slug(value: &str) -> String {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return "Unknown".to_string();
    }

    if trimmed.chars().all(|ch| !ch.is_ascii_alphabetic() || ch.is_ascii_uppercase()) {
        return trimmed
            .replace(['_', '-', '/'], " ")
            .split_whitespace()
            .map(|part| {
                let lower = part.to_ascii_lowercase();
                let mut chars = lower.chars();
                match chars.next() {
                    Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                    None => String::new(),
                }
            })
            .collect::<Vec<_>>()
            .join(" ");
    }

    let mut output = String::with_capacity(trimmed.len());
    let mut capitalize_next = true;

    for ch in trimmed.chars() {
        if matches!(ch, '_' | '-' | '/') {
            output.push(' ');
            capitalize_next = true;
            continue;
        }

        if ch.is_ascii_uppercase() && !output.ends_with(' ') && !output.is_empty() {
            output.push(' ');
        }

        if capitalize_next {
            output.extend(ch.to_uppercase());
            capitalize_next = false;
        } else if output.ends_with(' ') {
            output.extend(ch.to_uppercase());
        } else {
            output.extend(ch.to_lowercase());
        }
    }

    output
}

fn generate_hue(id: &str) -> u16 {
    let value = id
        .bytes()
        .fold(0u16, |acc, byte| acc.wrapping_add(byte as u16));

    value % 360
}

fn parse_rarity(value: &str) -> u8 {
    let trimmed = value.trim();

    if let Some(number) = trimmed.strip_prefix("TIER_") {
        return number.parse::<u8>().unwrap_or(0);
    }

    trimmed.parse::<u8>().unwrap_or(0)
}

fn round_to_i64(value: f64) -> i64 {
    value.round() as i64
}

fn parse_phase_value(value: &RawPhaseValue) -> u8 {
    match value {
        RawPhaseValue::Number(value) => *value,
        RawPhaseValue::Text(value) => value
            .trim()
            .strip_prefix("PHASE_")
            .and_then(|number| number.parse::<u8>().ok())
            .unwrap_or(0),
    }
}

fn parse_rarity_value(value: &RawRarityValue) -> u8 {
    match value {
        RawRarityValue::Number(value) => *value,
        RawRarityValue::Text(value) => parse_rarity(value),
    }
}

fn parse_level_value(value: &RawLevelValue) -> u32 {
    match value {
        RawLevelValue::Number(value) => *value,
        RawLevelValue::Text(value) => value.trim().parse::<u32>().unwrap_or(0),
    }
}

fn round_number_to_i64(value: &RawNumberValue) -> i64 {
    round_to_i64(value.as_f64())
}
