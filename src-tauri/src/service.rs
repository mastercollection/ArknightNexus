use chrono::Utc;
use reqwest::header::{ETAG, LAST_MODIFIED};
use serde::de::DeserializeOwned;
use std::collections::HashMap;
use tauri::AppHandle;

use crate::cache::{
    load_snapshot, load_statuses, load_summary_snapshot, load_terms, save_snapshot, save_terms,
};
use crate::cache_model::{
    CachedBlackboardEntry, CachedBuildingCost, CachedBuildingRequireRoom, CachedItem,
    CachedItemBuildingProduct, CachedItemStageDrop, CachedManufactFormula, CachedModuleBattlePart,
    CachedModuleBattlePhase, CachedModuleCost, CachedModuleTalentCandidate,
    CachedModuleTraitCandidate, CachedOperator, CachedOperatorModule, CachedOperatorPotential,
    CachedOperatorRange, CachedOperatorRangeGrid, CachedOperatorSkill, CachedOperatorSkillLevel,
    CachedOperatorStatPoint, CachedOperatorStatProgression, CachedOperatorSummary,
    CachedOperatorTalent, CachedOperatorTrait, CachedOperatorUpgradeCost,
    CachedOperatorUpgradeCostStage, CachedWorkshopExtraOutcome, CachedWorkshopFormula,
};
use crate::canonical::{
    BuildingCostDto, BuildingFormulaBundleDto, BuildingRequireRoomDto, ItemBuildingProductDto,
    ItemDto, ItemStageDropDto, ManufactFormulaDto, ModuleCostDto, OperatorBlackboardEntryDto,
    OperatorDetailDto, OperatorModuleBattlePartDto, OperatorModuleBattlePhaseDto,
    OperatorModuleDto, OperatorModuleTalentCandidateDto, OperatorModuleTraitCandidateDto,
    OperatorPotentialDto, OperatorRangeDto, OperatorRangeGridDto, OperatorSkillDto,
    OperatorSkillLevelDto, OperatorStatPointDto, OperatorStatProgressionDto, OperatorSummaryDto,
    OperatorTalentDto, OperatorTraitDto, OperatorUpgradeCostDto, OperatorUpgradeCostStageDto,
    RegionSyncStatus, SyncResult, UserPlanDto, UserPlanOperatorDto, WorkshopExtraOutcomeDto,
    WorkshopFormulaDto,
};
use crate::data_sources::RegionCode;
use crate::errors::AppError;
use crate::normalizers::{normalize_building_data, normalize_items, normalize_operators};
use crate::raw_models::{
    into_power_names, RawBattleEquipTable, RawBuildingData, RawCharacterTable, RawFavorTable,
    RawGameDataConst, RawHandbookTeamTable, RawItemTable, RawRangeTable, RawSkillTable,
    RawStageTable,
    RawUniequipTable,
};
use crate::user_store;

pub async fn sync_region_data(app: &AppHandle, region: RegionCode) -> Result<SyncResult, AppError> {
    let descriptor = region.descriptor();
    let client = reqwest::Client::builder()
        .user_agent("ArknightsNexus/0.1.0")
        .build()?;

    let character_url = descriptor.raw_url(&descriptor.character_path);
    let skill_url = descriptor.raw_url(&descriptor.skill_path);
    let gamedata_const_url = descriptor.raw_url(&descriptor.gamedata_const_path);
    let uniequip_url = descriptor.raw_url(&descriptor.uniequip_path);
    let handbook_team_url = descriptor.raw_url(&descriptor.handbook_team_path);
    let range_table_url = descriptor.raw_url(&descriptor.range_table_path);
    let item_table_url = descriptor.raw_url(&descriptor.item_table_path);
    let stage_table_url = descriptor.raw_url(&descriptor.stage_table_path);
    let building_data_url = descriptor.raw_url(&descriptor.building_data_path);
    let battle_equip_table_url = descriptor.raw_url(&descriptor.battle_equip_table_path);
    let favor_table_url = descriptor.raw_url(&descriptor.favor_table_path);

    let character_payload = fetch_json(&client, &character_url).await?;
    let skill_payload = fetch_json(&client, &skill_url).await?;
    let gamedata_const_payload = fetch_json(&client, &gamedata_const_url).await?;
    let uniequip_payload = fetch_json(&client, &uniequip_url).await?;
    let handbook_team_payload = fetch_json(&client, &handbook_team_url).await?;
    let range_table_payload = fetch_json(&client, &range_table_url).await?;
    let item_table_payload = fetch_json(&client, &item_table_url).await?;
    let stage_table_payload = fetch_json(&client, &stage_table_url).await?;
    let building_data_payload = fetch_json(&client, &building_data_url).await?;
    let battle_equip_table_payload = fetch_json(&client, &battle_equip_table_url).await?;
    let favor_table_payload = fetch_json(&client, &favor_table_url).await?;

    let characters = parse_json_with_path::<RawCharacterTable>(
        &character_payload.body,
        &format!("{} character_table.json", region.as_str()),
    )?;
    let skills = parse_json_with_path::<RawSkillTable>(
        &skill_payload.body,
        &format!("{} skill_table.json", region.as_str()),
    )?;
    let gamedata_const = parse_json_with_path::<RawGameDataConst>(
        &gamedata_const_payload.body,
        &format!("{} gamedata_const.json", region.as_str()),
    )?;
    let uniequip = parse_json_with_path::<RawUniequipTable>(
        &uniequip_payload.body,
        &format!("{} uniequip_table.json", region.as_str()),
    )?;
    let handbook_team = parse_json_with_path::<RawHandbookTeamTable>(
        &handbook_team_payload.body,
        &format!("{} handbook_team_table.json", region.as_str()),
    )?;
    let range_table = parse_json_with_path::<RawRangeTable>(
        &range_table_payload.body,
        &format!("{} range_table.json", region.as_str()),
    )?;
    let item_table = parse_json_with_path::<RawItemTable>(
        &item_table_payload.body,
        &format!("{} item_table.json", region.as_str()),
    )?;
    let stage_table = parse_json_with_path::<RawStageTable>(
        &stage_table_payload.body,
        &format!("{} stage_table.json", region.as_str()),
    )?;
    let building_data = parse_json_with_path::<RawBuildingData>(
        &building_data_payload.body,
        &format!("{} building_data.json", region.as_str()),
    )?;
    let battle_equip_table = parse_json_with_path::<RawBattleEquipTable>(
        &battle_equip_table_payload.body,
        &format!("{} battle_equip_table.json", region.as_str()),
    )?;
    let favor_table = parse_json_with_path::<RawFavorTable>(
        &favor_table_payload.body,
        &format!("{} favor_table.json", region.as_str()),
    )?;

    let sub_prof_names = RawUniequipTable {
        sub_prof_dict: uniequip.sub_prof_dict.clone(),
        equip_dict: Default::default(),
    }
    .into_sub_prof_names();
    let modules_by_char = RawUniequipTable {
        sub_prof_dict: Default::default(),
        equip_dict: uniequip.equip_dict,
    }
    .into_equip_modules_by_char();
    let power_names = into_power_names(handbook_team);
    let operators = normalize_operators(
        region,
        characters,
        skills,
        &gamedata_const,
        &range_table,
        &modules_by_char,
        &battle_equip_table,
        &favor_table,
        &item_table.items,
        &sub_prof_names,
        &power_names,
    );
    let stage_codes_by_id = stage_table
        .stages
        .into_values()
        .filter_map(|stage| {
            let stage_id = stage.stage_id.trim();
            let code = stage.code.trim();

            if stage_id.is_empty() || code.is_empty() {
                None
            } else {
                Some((stage_id.to_string(), code.to_string()))
            }
        })
        .collect::<HashMap<_, _>>();
    let items = normalize_items(item_table.items, &stage_codes_by_id);
    let (manufact_formulas, workshop_formulas) = normalize_building_data(building_data);
    let fetched_at = Utc::now().to_rfc3339();
    let source_revision = [
        character_payload.revision.as_deref(),
        skill_payload.revision.as_deref(),
        uniequip_payload.revision.as_deref(),
        handbook_team_payload.revision.as_deref(),
        range_table_payload.revision.as_deref(),
        item_table_payload.revision.as_deref(),
        stage_table_payload.revision.as_deref(),
        building_data_payload.revision.as_deref(),
        battle_equip_table_payload.revision.as_deref(),
        favor_table_payload.revision.as_deref(),
    ]
    .into_iter()
    .flatten()
    .collect::<Vec<_>>()
    .join(" | ");
    let source_revision = if source_revision.is_empty() {
        descriptor.branch.to_string()
    } else {
        source_revision
    };

    save_snapshot(
        app,
        region,
        &source_revision,
        &fetched_at,
        &stage_codes_by_id,
        &items,
        &manufact_formulas,
        &workshop_formulas,
        &operators,
    )?;
    save_terms(app, region, &gamedata_const.into_term_descriptions())?;

    Ok(SyncResult {
        region: region.as_str().to_string(),
        source_revision,
        updated_at: fetched_at,
        operator_count: operators.len(),
        status: "success".to_string(),
    })
}

pub fn list_items(
    app: &AppHandle,
    region: RegionCode,
    classify_type: Option<&str>,
) -> Result<Vec<ItemDto>, AppError> {
    let snapshot = load_snapshot(app, region)?;
    let normalized_classify_type = classify_type.map(|value| value.trim().to_lowercase());

    Ok(snapshot
        .items
        .into_iter()
        .filter(|item| {
            if item.item_id.contains("p_char") || item.item_id.contains("voucher") {
                return false;
            }

            normalized_classify_type
                .as_ref()
                .map(|value| item.classify_type.to_lowercase() == *value)
                .unwrap_or(true)
        })
        .map(cached_item_to_dto)
        .collect())
}

pub fn list_building_formulas(
    app: &AppHandle,
    region: RegionCode,
) -> Result<BuildingFormulaBundleDto, AppError> {
    let snapshot = load_snapshot(app, region)?;

    Ok(BuildingFormulaBundleDto {
        manufact_formulas: snapshot
            .manufact_formulas
            .into_iter()
            .map(cached_manufact_formula_to_dto)
            .collect(),
        workshop_formulas: snapshot
            .workshop_formulas
            .into_iter()
            .map(cached_workshop_formula_to_dto)
            .collect(),
    })
}

pub fn list_operators(
    app: &AppHandle,
    region: RegionCode,
    query: Option<&str>,
    rarity: Option<u8>,
    profession: Option<&str>,
) -> Result<Vec<OperatorSummaryDto>, AppError> {
    let snapshot = load_summary_snapshot(app, region)?;
    let normalized_query = query.unwrap_or("").trim().to_lowercase();
    let normalized_profession = profession.map(|value| value.trim().to_lowercase());

    Ok(snapshot
        .operators
        .iter()
        .filter(|operator| {
            let matches_query = normalized_query.is_empty()
                || [
                    operator.name.as_str(),
                    operator.profession.as_str(),
                    operator.branch.as_str(),
                ]
                .iter()
                .any(|value| value.to_lowercase().contains(&normalized_query));

            let matches_affiliation = normalized_query.is_empty()
                || operator
                    .teams
                    .iter()
                    .chain(operator.nations.iter())
                    .chain(operator.groups.iter())
                    .any(|value| value.to_lowercase().contains(&normalized_query));

            let matches_rarity = rarity.map(|value| operator.rarity == value).unwrap_or(true);
            let matches_profession = normalized_profession
                .as_ref()
                .map(|value| operator.profession.to_lowercase() == *value)
                .unwrap_or(true);

            (matches_query || matches_affiliation) && matches_rarity && matches_profession
        })
        .map(cached_summary_to_dto)
        .collect())
}

pub fn get_operator_detail(
    app: &AppHandle,
    region: RegionCode,
    operator_id: &str,
) -> Result<Option<OperatorDetailDto>, AppError> {
    let snapshot = load_snapshot(app, region)?;
    Ok(snapshot
        .operators
        .into_iter()
        .find(|operator| operator.id == operator_id)
        .map(cached_to_detail))
}

pub fn get_region_sync_status(app: &AppHandle) -> Result<Vec<RegionSyncStatus>, AppError> {
    load_statuses(app)
}

pub fn get_region_terms(
    app: &AppHandle,
    region: RegionCode,
) -> Result<HashMap<String, String>, AppError> {
    load_terms(app, region)
}

pub fn get_region_stage_codes(
    app: &AppHandle,
    region: RegionCode,
) -> Result<HashMap<String, String>, AppError> {
    let snapshot = load_snapshot(app, region)?;
    Ok(snapshot.stage_codes)
}

pub fn get_user_favorites(app: &AppHandle) -> Result<Vec<String>, AppError> {
    user_store::load_favorites(app)
}

pub fn toggle_operator_favorite(app: &AppHandle, operator_id: &str) -> Result<bool, AppError> {
    user_store::toggle_favorite(app, operator_id)
}

pub fn get_user_plan(app: &AppHandle) -> Result<UserPlanDto, AppError> {
    user_store::load_plan(app)
}

pub fn export_user_data(app: &AppHandle) -> Result<String, AppError> {
    user_store::export_user_data_json(app)
}

pub fn import_user_data(app: &AppHandle, content: &str) -> Result<(), AppError> {
    user_store::import_user_data_json(app, content)
}

pub fn save_user_plan_selection(
    app: &AppHandle,
    operator_ids: &[String],
) -> Result<Vec<String>, AppError> {
    user_store::save_plan_selection(app, operator_ids)
}

pub fn save_user_plan_operator(
    app: &AppHandle,
    plan: &UserPlanOperatorDto,
) -> Result<UserPlanOperatorDto, AppError> {
    user_store::save_plan_operator(app, plan)
}

pub fn remove_user_plan_operator(app: &AppHandle, operator_id: &str) -> Result<bool, AppError> {
    user_store::remove_plan_operator(app, operator_id)
}

struct FetchedJson {
    body: String,
    revision: Option<String>,
}

async fn fetch_json(client: &reqwest::Client, url: &str) -> Result<FetchedJson, AppError> {
    let response = client.get(url).send().await?.error_for_status()?;
    let revision = response
        .headers()
        .get(ETAG)
        .and_then(|value| value.to_str().ok())
        .map(str::to_string)
        .or_else(|| {
            response
                .headers()
                .get(LAST_MODIFIED)
                .and_then(|value| value.to_str().ok())
                .map(str::to_string)
        });
    let body = response.text().await?;

    Ok(FetchedJson { body, revision })
}

fn parse_json_with_path<T>(payload: &str, context: &str) -> Result<T, AppError>
where
    T: DeserializeOwned,
{
    let mut deserializer = serde_json::Deserializer::from_str(payload);
    serde_path_to_error::deserialize(&mut deserializer).map_err(|error| AppError::Parse {
        context: context.to_string(),
        path: error.path().to_string(),
        message: error.inner().to_string(),
    })
}

fn cached_summary_to_dto(operator: &CachedOperatorSummary) -> OperatorSummaryDto {
    OperatorSummaryDto {
        id: operator.id.clone(),
        name: operator.name.clone(),
        rarity: operator.rarity,
        profession: operator.profession.clone(),
        branch: operator.branch.clone(),
        teams: operator.teams.clone(),
        nations: operator.nations.clone(),
        groups: operator.groups.clone(),
        thumbnail_hue: operator.thumbnail_hue,
    }
}

fn cached_to_detail(operator: CachedOperator) -> OperatorDetailDto {
    OperatorDetailDto {
        id: operator.id,
        name: operator.name,
        codename: operator.codename,
        rarity: operator.rarity,
        profession: operator.profession,
        branch: operator.branch,
        teams: operator.teams,
        nations: operator.nations,
        groups: operator.groups,
        thumbnail_hue: operator.thumbnail_hue,
        quote: operator.quote,
        tags: operator.tags,
        traits: operator
            .traits
            .into_iter()
            .map(cached_trait_to_dto)
            .collect(),
        talents: operator
            .talents
            .into_iter()
            .map(cached_talent_to_dto)
            .collect(),
        potentials: operator
            .potentials
            .into_iter()
            .map(cached_potential_to_dto)
            .collect(),
        modules: operator
            .modules
            .into_iter()
            .map(cached_module_to_dto)
            .collect(),
        archetype_description: operator.archetype_description,
        elite_caps: operator.elite_caps,
        elite_exp_costs: operator.elite_exp_costs,
        elite_upgrade_gold_costs: operator.elite_upgrade_gold_costs,
        elite_evolve_gold_costs: operator.elite_evolve_gold_costs,
        elite_evolve_costs: operator
            .elite_evolve_costs
            .into_iter()
            .map(|costs| costs.into_iter().map(cached_upgrade_cost_to_dto).collect())
            .collect(),
        all_skill_level_up_costs: operator
            .all_skill_level_up_costs
            .into_iter()
            .map(cached_upgrade_cost_stage_to_dto)
            .collect(),
        stats: operator
            .stats
            .into_iter()
            .map(cached_stats_to_dto)
            .collect(),
        skills: operator
            .skills
            .into_iter()
            .map(cached_skill_to_dto)
            .collect(),
    }
}

fn cached_trait_to_dto(trait_item: CachedOperatorTrait) -> OperatorTraitDto {
    OperatorTraitDto {
        group_key: trait_item.group_key,
        description: trait_item.description,
        elite: trait_item.elite,
        level: trait_item.level,
        required_potential_rank: trait_item.required_potential_rank,
        blackboard: trait_item
            .blackboard
            .into_iter()
            .map(cached_blackboard_to_dto)
            .collect(),
    }
}

fn cached_talent_to_dto(talent: CachedOperatorTalent) -> OperatorTalentDto {
    OperatorTalentDto {
        group_key: talent.group_key,
        name: talent.name,
        description: talent.description,
        elite: talent.elite,
        level: talent.level,
        required_potential_rank: talent.required_potential_rank,
        blackboard: talent
            .blackboard
            .into_iter()
            .map(cached_blackboard_to_dto)
            .collect(),
    }
}

fn cached_potential_to_dto(potential: CachedOperatorPotential) -> OperatorPotentialDto {
    OperatorPotentialDto {
        rank: potential.rank,
        description: potential.description,
    }
}

fn cached_module_to_dto(module: CachedOperatorModule) -> OperatorModuleDto {
    OperatorModuleDto {
        uni_equip_id: module.uni_equip_id,
        uni_equip_name: module.uni_equip_name,
        uni_equip_icon: module.uni_equip_icon,
        uni_equip_desc: module.uni_equip_desc,
        type_icon: module.type_icon,
        unlock_evolve_phase: module.unlock_evolve_phase,
        char_id: module.char_id,
        unlock_level: module.unlock_level,
        mission_list: module.mission_list,
        unlock_favors: module.unlock_favors,
        unlock_favor_percents: module.unlock_favor_percents,
        item_cost: module.item_cost.map(|items| {
            items
                .into_iter()
                .map(|(key, value)| {
                    (
                        key,
                        value.into_iter().map(cached_module_cost_to_dto).collect(),
                    )
                })
                .collect()
        }),
        is_special_equip: module.is_special_equip,
        special_equip_desc: module.special_equip_desc,
        battle_phases: module
            .battle_phases
            .into_iter()
            .map(cached_module_battle_phase_to_dto)
            .collect(),
    }
}

fn cached_module_cost_to_dto(cost: CachedModuleCost) -> ModuleCostDto {
    ModuleCostDto {
        id: cost.id,
        count: cost.count,
        cost_type: cost.cost_type,
        item_name: cost.item_name,
        item_rarity: cost.item_rarity,
        item_icon_id: cost.item_icon_id,
        item_type: cost.item_type,
    }
}

fn cached_module_battle_phase_to_dto(
    phase: CachedModuleBattlePhase,
) -> OperatorModuleBattlePhaseDto {
    OperatorModuleBattlePhaseDto {
        equip_level: phase.equip_level,
        parts: phase
            .parts
            .into_iter()
            .map(cached_module_battle_part_to_dto)
            .collect(),
        attribute_blackboard: phase
            .attribute_blackboard
            .into_iter()
            .map(cached_blackboard_to_dto)
            .collect(),
    }
}

fn cached_module_battle_part_to_dto(part: CachedModuleBattlePart) -> OperatorModuleBattlePartDto {
    OperatorModuleBattlePartDto {
        target: part.target,
        trait_candidates: part
            .trait_candidates
            .into_iter()
            .map(cached_module_trait_candidate_to_dto)
            .collect(),
        talent_candidates: part
            .talent_candidates
            .into_iter()
            .map(cached_module_talent_candidate_to_dto)
            .collect(),
    }
}

fn cached_module_trait_candidate_to_dto(
    candidate: CachedModuleTraitCandidate,
) -> OperatorModuleTraitCandidateDto {
    OperatorModuleTraitCandidateDto {
        description: candidate.description,
        elite: candidate.elite,
        level: candidate.level,
        required_potential_rank: candidate.required_potential_rank,
        blackboard: candidate
            .blackboard
            .into_iter()
            .map(cached_blackboard_to_dto)
            .collect(),
        range: candidate.range.map(cached_range_to_dto),
    }
}

fn cached_module_talent_candidate_to_dto(
    candidate: CachedModuleTalentCandidate,
) -> OperatorModuleTalentCandidateDto {
    OperatorModuleTalentCandidateDto {
        name: candidate.name,
        description: candidate.description,
        elite: candidate.elite,
        level: candidate.level,
        required_potential_rank: candidate.required_potential_rank,
        blackboard: candidate
            .blackboard
            .into_iter()
            .map(cached_blackboard_to_dto)
            .collect(),
        range: candidate.range.map(cached_range_to_dto),
    }
}

fn cached_stats_to_dto(stats: CachedOperatorStatProgression) -> OperatorStatProgressionDto {
    OperatorStatProgressionDto {
        level: stats.level,
        min: cached_stat_point_to_dto(stats.min),
        max: cached_stat_point_to_dto(stats.max),
        range: stats.range.map(cached_range_to_dto),
    }
}

fn cached_stat_point_to_dto(point: CachedOperatorStatPoint) -> OperatorStatPointDto {
    OperatorStatPointDto {
        hp: point.hp,
        attack: point.attack,
        defense: point.defense,
        resistance: point.resistance,
        redeploy_time: point.redeploy_time,
        dp_cost: point.dp_cost,
        block: point.block,
        attack_interval: point.attack_interval,
        hp_recovery_per_sec: point.hp_recovery_per_sec,
    }
}

fn cached_skill_to_dto(skill: CachedOperatorSkill) -> OperatorSkillDto {
    OperatorSkillDto {
        id: skill.id,
        icon_id: skill.icon_id,
        name: skill.name,
        recovery_type: skill.recovery_type,
        activation_type: skill.activation_type,
        description: skill.description,
        unlock_elite: skill.unlock_elite,
        unlock_level: skill.unlock_level,
        upgrade_costs: skill
            .upgrade_costs
            .into_iter()
            .map(cached_upgrade_cost_stage_to_dto)
            .collect(),
        levels: skill
            .levels
            .into_iter()
            .map(cached_skill_level_to_dto)
            .collect(),
    }
}

fn cached_upgrade_cost_stage_to_dto(
    cost: CachedOperatorUpgradeCostStage,
) -> OperatorUpgradeCostStageDto {
    OperatorUpgradeCostStageDto {
        level: cost.level,
        costs: cost
            .costs
            .into_iter()
            .map(cached_upgrade_cost_to_dto)
            .collect(),
    }
}

fn cached_upgrade_cost_to_dto(cost: CachedOperatorUpgradeCost) -> OperatorUpgradeCostDto {
    OperatorUpgradeCostDto {
        id: cost.id,
        count: cost.count,
        cost_type: cost.cost_type,
        item_name: cost.item_name,
        item_rarity: cost.item_rarity,
        item_icon_id: cost.item_icon_id,
        item_type: cost.item_type,
    }
}

fn cached_skill_level_to_dto(level: CachedOperatorSkillLevel) -> OperatorSkillLevelDto {
    OperatorSkillLevelDto {
        level: level.level,
        sp_cost: level.sp_cost,
        initial_sp: level.initial_sp,
        duration: level.duration,
        description: level.description,
        blackboard: level
            .blackboard
            .into_iter()
            .map(cached_blackboard_to_dto)
            .collect(),
        range: level.range.map(cached_range_to_dto),
    }
}

fn cached_item_to_dto(item: CachedItem) -> ItemDto {
    ItemDto {
        item_id: item.item_id,
        name: item.name,
        description: item.description,
        rarity: item.rarity,
        icon_id: item.icon_id,
        sort_id: item.sort_id,
        usage: item.usage,
        obtain_approach: item.obtain_approach,
        classify_type: item.classify_type,
        item_type: item.item_type,
        stage_drop_list: item
            .stage_drop_list
            .into_iter()
            .map(cached_item_stage_drop_to_dto)
            .collect(),
        building_product_list: item
            .building_product_list
            .into_iter()
            .map(cached_item_building_product_to_dto)
            .collect(),
    }
}

fn cached_item_stage_drop_to_dto(entry: CachedItemStageDrop) -> ItemStageDropDto {
    ItemStageDropDto {
        stage_id: entry.stage_id,
        stage_code: entry.stage_code,
        occ_per: entry.occ_per,
    }
}

fn cached_item_building_product_to_dto(entry: CachedItemBuildingProduct) -> ItemBuildingProductDto {
    ItemBuildingProductDto {
        room_type: entry.room_type,
        formula_id: entry.formula_id,
    }
}

fn cached_manufact_formula_to_dto(entry: CachedManufactFormula) -> ManufactFormulaDto {
    ManufactFormulaDto {
        formula_id: entry.formula_id,
        item_id: entry.item_id,
        count: entry.count,
        weight: entry.weight,
        cost_point: entry.cost_point,
        formula_type: entry.formula_type,
        buff_type: entry.buff_type,
        costs: entry
            .costs
            .into_iter()
            .map(cached_building_cost_to_dto)
            .collect(),
        require_rooms: entry
            .require_rooms
            .into_iter()
            .map(cached_building_require_room_to_dto)
            .collect(),
    }
}

fn cached_workshop_formula_to_dto(entry: CachedWorkshopFormula) -> WorkshopFormulaDto {
    WorkshopFormulaDto {
        sort_id: entry.sort_id,
        formula_id: entry.formula_id,
        rarity: entry.rarity,
        item_id: entry.item_id,
        count: entry.count,
        gold_cost: entry.gold_cost,
        ap_cost: entry.ap_cost,
        formula_type: entry.formula_type,
        buff_type: entry.buff_type,
        extra_outcome_rate: entry.extra_outcome_rate,
        extra_outcome_group: entry
            .extra_outcome_group
            .into_iter()
            .map(cached_workshop_extra_outcome_to_dto)
            .collect(),
        costs: entry
            .costs
            .into_iter()
            .map(cached_building_cost_to_dto)
            .collect(),
        require_rooms: entry
            .require_rooms
            .into_iter()
            .map(cached_building_require_room_to_dto)
            .collect(),
    }
}

fn cached_building_cost_to_dto(entry: CachedBuildingCost) -> BuildingCostDto {
    BuildingCostDto {
        id: entry.id,
        count: entry.count,
        cost_type: entry.cost_type,
    }
}

fn cached_building_require_room_to_dto(entry: CachedBuildingRequireRoom) -> BuildingRequireRoomDto {
    BuildingRequireRoomDto {
        room_id: entry.room_id,
        room_level: entry.room_level,
        room_count: entry.room_count,
    }
}

fn cached_workshop_extra_outcome_to_dto(
    entry: CachedWorkshopExtraOutcome,
) -> WorkshopExtraOutcomeDto {
    WorkshopExtraOutcomeDto {
        weight: entry.weight,
        item_id: entry.item_id,
        item_count: entry.item_count,
    }
}

fn cached_range_to_dto(range: CachedOperatorRange) -> OperatorRangeDto {
    OperatorRangeDto {
        id: range.id,
        grids: range
            .grids
            .into_iter()
            .map(cached_range_grid_to_dto)
            .collect(),
    }
}

fn cached_range_grid_to_dto(grid: CachedOperatorRangeGrid) -> OperatorRangeGridDto {
    OperatorRangeGridDto {
        row: grid.row,
        col: grid.col,
    }
}

fn cached_blackboard_to_dto(entry: CachedBlackboardEntry) -> OperatorBlackboardEntryDto {
    OperatorBlackboardEntryDto {
        key: entry.key,
        value: entry.value,
        value_str: entry.value_str,
    }
}
