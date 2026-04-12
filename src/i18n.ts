import type { RegionCode } from '~/types/operator'
import { createI18n } from 'vue-i18n'

type ProfessionKey
  = | 'vanguard'
    | 'sniper'
    | 'medic'
    | 'caster'
    | 'guard'
    | 'defender'
    | 'supporter'
    | 'specialist'

const messages = {
  kr: {
    profession: {
      vanguard: '뱅가드',
      sniper: '스나이퍼',
      medic: '메딕',
      caster: '캐스터',
      guard: '가드',
      defender: '디펜더',
      supporter: '서포터',
      specialist: '스페셜리스트',
    },
    skill: {
      recovery: {
        auto_recovery: '자동 회복',
        attack_recovery: '공격 회복',
        defense_recovery: '피격 회복',
        unknown_recovery: '알 수 없음',
      },
      activation: {
        passive: '패시브',
        manual_trigger: '수동 발동',
        auto_trigger: '자동 발동',
        unknown_trigger: '알 수 없음',
      },
    },
    stats: {
      hp: '체력',
      atk: '공격력',
      def: '방어력',
      magic_res: '마법 저항',
      cost: '배치 코스트',
      block_cnt: '저지 수',
      respawn_time: '재배치 시간',
      attack_interval: '공격 간격',
      hp_recovery_per_sec: '초당 HP 회복',
      secondsValue: '{value}초',
    },
    operatorDetail: {
      sections: {
        stats: '스탯',
        abilities: '능력',
        potentials: '잠재',
        modules: '모듈',
        skills: '스킬',
      },
      summaries: {
        stats: '정예화와 레벨에 따라 현재 수치를 확인합니다.',
        abilities: '정예화 단계에 따라 특성과 재능 효과를 비교합니다.',
        potentials: '잠재 상승으로 해금되는 추가 효과 목록입니다.',
        modules: '모듈 효과와 해금 조건을 확인합니다.',
        skills: '레벨별 변화와 발동 정보를 한 번에 확인합니다.',
      },
      labels: {
        elite: '정예화',
        level: '레벨',
        attackRange: '공격 범위',
        trait: '특성',
        commonTrait: '공통 특성',
        talent: '재능',
        skillRange: '스킬 범위',
        displayLevel: '표시 기준 레벨',
        levelComparison: '레벨 비교',
        item: '항목',
        moduleType: '모듈 타입',
        unlockCondition: '해금 조건',
        favorCondition: '필요 신뢰도',
        moduleStage: '모듈 단계',
        moduleStatBonus: '능력치 증가',
        moduleEffects: '효과 변경',
        traitOverride: '특성 변경',
        talentOverride: '재능 변경',
        specialModule: '스페셜',
        missionUnlocked: '임무 필요',
        termSheet: '용어 설명',
        selectedLevel: 'Lv.{level} 기준',
        eliteShort: 'E{elite}',
        conditionLevel: 'Lv.{level}',
        potentialValue: '잠재 {value}',
        potentialStage: '잠재 {rank}단계',
      },
      descriptions: {
        attackRange: '0,0을 기준으로 현재 정예화 단계의 기본 사거리를 표시합니다.',
        trait: '직군 특성과 단계별 변화를 확인합니다.',
        talent: '정예화와 잠재 조건에 따라 해금되는 재능 효과입니다.',
        modules: '선택한 모듈의 단계별 효과와 해금 조건을 확인합니다.',
        skillDisplayLevel: '상단 설명과 표 강조는 선택한 레벨 기준으로 표시합니다.',
        skillLevelComparison: '레벨이 바뀌며 달라지는 값만 한 번에 비교합니다.',
      },
      states: {
        noTalentForCurrentStage: '현재 단계에서 해금되는 재능이 없습니다.',
        loadingTitle: '오퍼레이터 정보를 불러오는 중입니다.',
        loadingDescription: '지역 데이터 캐시와 상세 정보를 확인하고 있습니다.',
        errorTitle: '오퍼레이터 정보를 불러오지 못했습니다.',
        notFoundTitle: '오퍼레이터를 찾을 수 없습니다.',
        notFoundDescription: '잘못된 경로이거나 아직 1차 데이터에 포함되지 않은 캐릭터입니다.',
        backToList: '목록으로 돌아가기',
        noModules: '표시할 모듈 정보가 없습니다.',
        noModuleDetails: '선택한 단계에 표시할 추가 효과가 없습니다.',
      },
      messages: {
        shareCopied: '상세 링크를 복사했습니다.',
        shareFailed: '공유를 완료하지 못했습니다.',
        favoriteAdded: '즐겨찾기에 추가했습니다.',
        favoriteRemoved: '즐겨찾기에서 제거했습니다.',
        favoriteFailed: '즐겨찾기를 저장하지 못했습니다.',
      },
    },
    operatorsList: {
      topBar: {
        title: '오퍼레이터 목록',
        description: '검색과 필터를 고정 상단에서 바로 제어합니다.',
      },
      search: {
        placeholder: '이름, 소속, 직군 검색',
      },
      states: {
        noFilters: '필터 없음',
        loadingTitle: '오퍼레이터 데이터를 불러오는 중입니다.',
        loadingDescription: '지역 데이터 동기화 상태를 확인하고 있습니다.',
        errorTitle: '오퍼레이터 데이터를 불러오지 못했습니다.',
        emptyTitle: '조건에 맞는 오퍼레이터가 없습니다.',
        emptyDescription: '검색어를 비우거나 등급/직군 필터를 조정해 주세요.',
      },
      filters: {
        title: '목록 필터',
        affiliation: '소속',
        rarity: '등급',
        profession: '직군',
        reset: '필터 초기화',
      },
    },
  },
  cn: {
    profession: {
      vanguard: '先锋',
      sniper: '狙击',
      medic: '医疗',
      caster: '术师',
      guard: '近卫',
      defender: '重装',
      supporter: '辅助',
      specialist: '特种',
    },
    skill: {
      recovery: {
        auto_recovery: '自动回复',
        attack_recovery: '攻击回复',
        defense_recovery: '受击回复',
        unknown_recovery: '未知',
      },
      activation: {
        passive: '被动',
        manual_trigger: '手动触发',
        auto_trigger: '自动触发',
        unknown_trigger: '未知',
      },
    },
    stats: {
      hp: 'HP',
      atk: 'ATK',
      def: 'DEF',
      magic_res: '法术抗性',
      cost: '部署费用',
      block_cnt: '阻挡数',
      respawn_time: '再部署时间',
      attack_interval: '攻击间隔',
      hp_recovery_per_sec: '每秒生命回复',
      secondsValue: '{value}秒',
    },
    operatorDetail: {
      sections: {
        stats: '属性',
        abilities: '能力',
        potentials: '潜能',
        modules: '模组',
        skills: '技能',
      },
      summaries: {
        stats: '按精英化与等级查看当前属性。',
        abilities: '比较不同精英化阶段下的特性与天赋效果。',
        potentials: '潜能提升后解锁的附加效果列表。',
        modules: '查看模组效果与解锁条件。',
        skills: '一次查看各等级变化与触发信息。',
      },
      labels: {
        elite: '精英化',
        level: '等级',
        attackRange: '攻击范围',
        trait: '特性',
        commonTrait: '通用特性',
        talent: '天赋',
        skillRange: '技能范围',
        displayLevel: '显示等级',
        levelComparison: '等级对比',
        item: '项目',
        moduleType: '模组类型',
        unlockCondition: '解锁条件',
        favorCondition: '需求信赖',
        moduleStage: '模组阶段',
        moduleStatBonus: '属性提升',
        moduleEffects: '效果变更',
        traitOverride: '特性变更',
        talentOverride: '天赋变更',
        specialModule: '特殊',
        missionUnlocked: '需任务',
        termSheet: '术语说明',
        selectedLevel: '以 Lv.{level} 为准',
        eliteShort: 'E{elite}',
        conditionLevel: 'Lv.{level}',
        potentialValue: '潜能 {value}',
        potentialStage: '潜能 {rank}阶段',
      },
      descriptions: {
        attackRange: '以 0,0 为基准显示当前精英化阶段的基础攻击范围。',
        trait: '查看职业特性及阶段变化。',
        talent: '按精英化与潜能条件解锁的天赋效果。',
        modules: '显示所选模组各阶段的效果与解锁条件。',
        skillDisplayLevel: '上方说明与表格高亮会按所选等级显示。',
        skillLevelComparison: '一次比较随等级变化而不同的数值。',
      },
      states: {
        noTalentForCurrentStage: '当前阶段没有解锁的天赋。',
        loadingTitle: '正在加载干员信息。',
        loadingDescription: '正在检查区域缓存与详情数据。',
        errorTitle: '无法加载干员信息。',
        notFoundTitle: '找不到该干员。',
        notFoundDescription: '路径无效，或该角色尚未包含在首批数据中。',
        backToList: '返回列表',
        noModules: '没有可显示的模组信息。',
        noModuleDetails: '所选阶段没有可显示的附加效果。',
      },
      messages: {
        shareCopied: '已复制详情链接。',
        shareFailed: '未能完成分享。',
        favoriteAdded: '已添加到收藏。',
        favoriteRemoved: '已从收藏中移除。',
        favoriteFailed: '无法保存收藏状态。',
      },
    },
    operatorsList: {
      topBar: {
        title: '干员列表',
        description: '可在固定顶部栏直接控制搜索与筛选。',
      },
      search: {
        placeholder: '搜索名称、所属、职业',
      },
      states: {
        noFilters: '无筛选',
        loadingTitle: '正在加载干员数据。',
        loadingDescription: '正在检查区域数据同步状态。',
        errorTitle: '无法加载干员数据。',
        emptyTitle: '没有符合条件的干员。',
        emptyDescription: '请清空搜索词或调整稀有度/职业筛选。',
      },
      filters: {
        title: '列表筛选',
        affiliation: '所属',
        rarity: '稀有度',
        profession: '职业',
        reset: '重置筛选',
      },
    },
  },
  jp: {
    profession: {
      vanguard: '先鋒',
      sniper: '狙撃',
      medic: '医療',
      caster: '術師',
      guard: '前衛',
      defender: '重装',
      supporter: '補助',
      specialist: '特殊',
    },
    skill: {
      recovery: {
        auto_recovery: '自動回復',
        attack_recovery: '攻撃回復',
        defense_recovery: '被撃回復',
        unknown_recovery: '不明',
      },
      activation: {
        passive: 'パッシブ',
        manual_trigger: '手動発動',
        auto_trigger: '自動発動',
        unknown_trigger: '不明',
      },
    },
    stats: {
      hp: 'HP',
      atk: 'ATK',
      def: 'DEF',
      magic_res: '術耐性',
      cost: 'コスト',
      block_cnt: 'ブロック数',
      respawn_time: '再配置時間',
      attack_interval: '攻撃間隔',
      hp_recovery_per_sec: '秒間HP回復',
      secondsValue: '{value}秒',
    },
    operatorDetail: {
      sections: {
        stats: 'ステータス',
        abilities: '能力',
        potentials: '潜在',
        modules: 'モジュール',
        skills: 'スキル',
      },
      summaries: {
        stats: '昇進段階とレベルに応じた現在値を確認します。',
        abilities: '昇進段階ごとの素質と天賦効果を比較します。',
        potentials: '潜在上昇で解放される追加効果の一覧です。',
        modules: 'モジュール効果と解放条件を確認します。',
        skills: 'レベル別の変化と発動情報をまとめて確認します。',
      },
      labels: {
        elite: '昇進',
        level: 'レベル',
        attackRange: '攻撃範囲',
        trait: '素質',
        commonTrait: '共通特性',
        talent: '天賦',
        skillRange: 'スキル範囲',
        displayLevel: '表示基準レベル',
        levelComparison: 'レベル比較',
        item: '項目',
        moduleType: 'モジュール種別',
        unlockCondition: '解放条件',
        favorCondition: '必要信頼度',
        moduleStage: 'モジュール段階',
        moduleStatBonus: '能力値上昇',
        moduleEffects: '効果変化',
        traitOverride: '素質変化',
        talentOverride: '天賦変化',
        specialModule: '特別',
        missionUnlocked: '任務必要',
        termSheet: '用語説明',
        selectedLevel: 'Lv.{level}基準',
        eliteShort: 'E{elite}',
        conditionLevel: 'Lv.{level}',
        potentialValue: '潜在 {value}',
        potentialStage: '潜在 {rank}段階',
      },
      descriptions: {
        attackRange: '0,0を基準に現在の昇進段階の基本射程を表示します。',
        trait: '職分の素質と段階ごとの変化を確認します。',
        talent: '昇進と潜在条件に応じて解放される天賦効果です。',
        modules: '選択したモジュールの段階別効果と解放条件を表示します。',
        skillDisplayLevel: '上部説明と表の強調表示は選択レベル基準で表示されます。',
        skillLevelComparison: 'レベルで変化する値だけをまとめて比較します。',
      },
      states: {
        noTalentForCurrentStage: '現在の段階で解放される天賦はありません。',
        loadingTitle: 'オペレーター情報を読み込み中です。',
        loadingDescription: '地域データのキャッシュと詳細情報を確認しています。',
        errorTitle: 'オペレーター情報を読み込めませんでした。',
        notFoundTitle: 'オペレーターが見つかりません。',
        notFoundDescription: '無効なパスか、まだ一次データに含まれていないキャラクターです。',
        backToList: '一覧に戻る',
        noModules: '表示できるモジュール情報がありません。',
        noModuleDetails: '選択した段階で表示できる追加効果はありません。',
      },
      messages: {
        shareCopied: '詳細リンクをコピーしました。',
        shareFailed: '共有を完了できませんでした。',
        favoriteAdded: 'お気に入りに追加しました。',
        favoriteRemoved: 'お気に入りから削除しました。',
        favoriteFailed: 'お気に入り状態を保存できませんでした。',
      },
    },
    operatorsList: {
      topBar: {
        title: 'オペレーター一覧',
        description: '検索とフィルターを固定上部バーからすぐ操作できます。',
      },
      search: {
        placeholder: '名前、所属、職分で検索',
      },
      states: {
        noFilters: 'フィルターなし',
        loadingTitle: 'オペレーターのデータを読み込んでいます。',
        loadingDescription: '地域データの同期状態を確認しています。',
        errorTitle: 'オペレーターデータを読み込めませんでした。',
        emptyTitle: '条件に合うオペレーターがいません。',
        emptyDescription: '検索語を消すか、レア度/職分フィルターを調整してください。',
      },
      filters: {
        title: '一覧フィルター',
        affiliation: '所属',
        rarity: 'レア度',
        profession: '職分',
        reset: 'フィルターをリセット',
      },
    },
  },
  tw: {
    profession: {
      vanguard: '先鋒',
      sniper: '狙擊',
      medic: '醫療',
      caster: '術師',
      guard: '近衛',
      defender: '重裝',
      supporter: '輔助',
      specialist: '特種',
    },
    skill: {
      recovery: {
        auto_recovery: '自動回復',
        attack_recovery: '攻擊回復',
        defense_recovery: '受擊回復',
        unknown_recovery: '未知',
      },
      activation: {
        passive: '被動',
        manual_trigger: '手動觸發',
        auto_trigger: '自動觸發',
        unknown_trigger: '未知',
      },
    },
    stats: {
      hp: 'HP',
      atk: 'ATK',
      def: 'DEF',
      magic_res: '法術抗性',
      cost: '部署費用',
      block_cnt: '阻擋數',
      respawn_time: '再部署時間',
      attack_interval: '攻擊間隔',
      hp_recovery_per_sec: '每秒生命回復',
      secondsValue: '{value}秒',
    },
    operatorDetail: {
      sections: {
        stats: '屬性',
        abilities: '能力',
        potentials: '潛能',
        modules: '模組',
        skills: '技能',
      },
      summaries: {
        stats: '依精英化與等級查看目前數值。',
        abilities: '比較不同精英化階段下的特性與天賦效果。',
        potentials: '潛能提升後解鎖的額外效果列表。',
        modules: '查看模組效果與解鎖條件。',
        skills: '一次查看各等級變化與發動資訊。',
      },
      labels: {
        elite: '精英化',
        level: '等級',
        attackRange: '攻擊範圍',
        trait: '特性',
        commonTrait: '通用特性',
        talent: '天賦',
        skillRange: '技能範圍',
        displayLevel: '顯示基準等級',
        levelComparison: '等級比較',
        item: '項目',
        moduleType: '模組類型',
        unlockCondition: '解鎖條件',
        favorCondition: '需求信賴',
        moduleStage: '模組階段',
        moduleStatBonus: '屬性提升',
        moduleEffects: '效果變更',
        traitOverride: '特性變更',
        talentOverride: '天賦變更',
        specialModule: '特殊',
        missionUnlocked: '需任務',
        termSheet: '術語說明',
        selectedLevel: '以 Lv.{level} 為準',
        eliteShort: 'E{elite}',
        conditionLevel: 'Lv.{level}',
        potentialValue: '潛能 {value}',
        potentialStage: '潛能 {rank}階段',
      },
      descriptions: {
        attackRange: '以 0,0 為基準顯示目前精英化階段的基礎攻擊範圍。',
        trait: '查看職分類特性與階段變化。',
        talent: '依精英化與潛能條件解鎖的天賦效果。',
        modules: '顯示所選模組各階段的效果與解鎖條件。',
        skillDisplayLevel: '上方說明與表格高亮會依所選等級顯示。',
        skillLevelComparison: '一次比較隨等級變化而不同的數值。',
      },
      states: {
        noTalentForCurrentStage: '目前階段沒有解鎖的天賦。',
        loadingTitle: '正在載入幹員資訊。',
        loadingDescription: '正在檢查區域快取與詳細資料。',
        errorTitle: '無法載入幹員資訊。',
        notFoundTitle: '找不到該幹員。',
        notFoundDescription: '路徑無效，或該角色尚未包含在第一批資料中。',
        backToList: '返回列表',
        noModules: '沒有可顯示的模組資訊。',
        noModuleDetails: '所選階段沒有可顯示的附加效果。',
      },
      messages: {
        shareCopied: '已複製詳細連結。',
        shareFailed: '未能完成分享。',
        favoriteAdded: '已加入收藏。',
        favoriteRemoved: '已從收藏移除。',
        favoriteFailed: '無法儲存收藏狀態。',
      },
    },
    operatorsList: {
      topBar: {
        title: '幹員列表',
        description: '可在固定頂部列直接控制搜尋與篩選。',
      },
      search: {
        placeholder: '搜尋名稱、所屬、職業',
      },
      states: {
        noFilters: '無篩選',
        loadingTitle: '正在載入幹員資料。',
        loadingDescription: '正在檢查區域資料同步狀態。',
        errorTitle: '無法載入幹員資料。',
        emptyTitle: '沒有符合條件的幹員。',
        emptyDescription: '請清空搜尋詞或調整稀有度/職業篩選。',
      },
      filters: {
        title: '列表篩選',
        affiliation: '所屬',
        rarity: '稀有度',
        profession: '職業',
        reset: '重設篩選',
      },
    },
  },
  en: {
    profession: {
      vanguard: 'Vanguard',
      sniper: 'Sniper',
      medic: 'Medic',
      caster: 'Caster',
      guard: 'Guard',
      defender: 'Defender',
      supporter: 'Supporter',
      specialist: 'Specialist',
    },
    skill: {
      recovery: {
        auto_recovery: 'Auto Recovery',
        attack_recovery: 'Attack Recovery',
        defense_recovery: 'Defense Recovery',
        unknown_recovery: 'Unknown Recovery',
      },
      activation: {
        passive: 'Passive',
        manual_trigger: 'Manual Trigger',
        auto_trigger: 'Auto Trigger',
        unknown_trigger: 'Unknown Trigger',
      },
    },
    stats: {
      hp: 'HP',
      atk: 'ATK',
      def: 'DEF',
      magic_res: 'Magic Resist',
      cost: 'Cost',
      block_cnt: 'Block Count',
      respawn_time: 'Redeploy Time',
      attack_interval: 'Attack Interval',
      hp_recovery_per_sec: 'HP Recovery / Sec',
      secondsValue: '{value}s',
    },
    operatorDetail: {
      sections: {
        stats: 'Stats',
        abilities: 'Abilities',
        potentials: 'Potentials',
        modules: 'Modules',
        skills: 'Skills',
      },
      summaries: {
        stats: 'Check current stats by elite phase and level.',
        abilities: 'Compare trait and talent effects across elite phases.',
        potentials: 'Additional effects unlocked by potential upgrades.',
        modules: 'Review module effects and unlock conditions.',
        skills: 'Review level scaling and activation details at a glance.',
      },
      labels: {
        elite: 'Elite',
        level: 'Level',
        attackRange: 'Attack Range',
        trait: 'Trait',
        commonTrait: 'Common Trait',
        talent: 'Talent',
        skillRange: 'Skill Range',
        displayLevel: 'Display Level',
        levelComparison: 'Level Comparison',
        item: 'Item',
        moduleType: 'Module Type',
        unlockCondition: 'Unlock Condition',
        favorCondition: 'Required Trust',
        moduleStage: 'Module Stage',
        moduleStatBonus: 'Stat Bonus',
        moduleEffects: 'Effect Changes',
        traitOverride: 'Trait Override',
        talentOverride: 'Talent Override',
        specialModule: 'Special',
        missionUnlocked: 'Mission Required',
        termSheet: 'Term Notes',
        selectedLevel: 'Based on Lv.{level}',
        eliteShort: 'E{elite}',
        conditionLevel: 'Lv.{level}',
        potentialValue: 'Potential {value}',
        potentialStage: 'Potential Rank {rank}',
      },
      descriptions: {
        attackRange: 'Shows the base attack range for the current elite phase using 0,0 as the origin.',
        trait: 'Review class trait behavior and phase changes.',
        talent: 'Talent effects unlocked by elite and potential conditions.',
        modules: 'Shows stage-based module effects and unlock conditions.',
        skillDisplayLevel: 'The top description and highlighted table column follow the selected level.',
        skillLevelComparison: 'Compare only the values that change across skill levels.',
      },
      states: {
        noTalentForCurrentStage: 'No talents are unlocked at the current phase.',
        loadingTitle: 'Loading operator details.',
        loadingDescription: 'Checking regional cache and detailed data.',
        errorTitle: 'Failed to load operator details.',
        notFoundTitle: 'Operator not found.',
        notFoundDescription: 'The route is invalid, or this character is not included in the current dataset yet.',
        backToList: 'Back to list',
        noModules: 'No module information is available.',
        noModuleDetails: 'No additional effects are available for the selected stage.',
      },
      messages: {
        shareCopied: 'Copied the detail link.',
        shareFailed: 'Could not complete sharing.',
        favoriteAdded: 'Added to favorites.',
        favoriteRemoved: 'Removed from favorites.',
        favoriteFailed: 'Could not save favorite state.',
      },
    },
    operatorsList: {
      topBar: {
        title: 'Operator List',
        description: 'Control search and filters directly from the fixed top bar.',
      },
      search: {
        placeholder: 'Search by name, affiliation, or class',
      },
      states: {
        noFilters: 'No filters',
        loadingTitle: 'Loading operator data.',
        loadingDescription: 'Checking regional data sync status.',
        errorTitle: 'Failed to load operator data.',
        emptyTitle: 'No operators match the current filters.',
        emptyDescription: 'Clear the search or adjust the rarity/class filters.',
      },
      filters: {
        title: 'List Filters',
        affiliation: 'Affiliation',
        rarity: 'Rarity',
        profession: 'Class',
        reset: 'Reset Filters',
      },
    },
  },
} as const

const professionKeyMap: Record<string, ProfessionKey> = {
  Vanguard: 'vanguard',
  Sniper: 'sniper',
  Medic: 'medic',
  Caster: 'caster',
  Guard: 'guard',
  Defender: 'defender',
  Supporter: 'supporter',
  Specialist: 'specialist',
}

const skillRecoveryKeys = new Set([
  'auto_recovery',
  'attack_recovery',
  'defense_recovery',
  'unknown_recovery',
])

const skillActivationKeys = new Set([
  'passive',
  'manual_trigger',
  'auto_trigger',
  'unknown_trigger',
])

const statKeys = new Set([
  'hp',
  'atk',
  'def',
  'magic_res',
  'cost',
  'block_cnt',
  'respawn_time',
  'attack_interval',
  'hp_recovery_per_sec',
])

export const i18n = createI18n({
  legacy: false,
  locale: 'kr',
  fallbackLocale: 'en',
  messages,
})

export function translateSecondsValue(value: string | number) {
  return i18n.global.t('stats.secondsValue', { value })
}

export function setI18nLocale(region: RegionCode) {
  i18n.global.locale.value = region
}

export function translateProfession(profession: string) {
  const key = professionKeyMap[profession]
  if (!key)
    return profession

  return i18n.global.t(`profession.${key}`)
}

export function translateSkillRecovery(recoveryType: string) {
  if (!skillRecoveryKeys.has(recoveryType))
    return recoveryType

  return i18n.global.t(`skill.recovery.${recoveryType}`)
}

export function translateSkillActivation(activationType: string) {
  if (!skillActivationKeys.has(activationType))
    return activationType

  return i18n.global.t(`skill.activation.${activationType}`)
}

export function translateStatLabel(statKey: string) {
  if (!statKeys.has(statKey))
    return statKey

  return i18n.global.t(`stats.${statKey}`)
}
