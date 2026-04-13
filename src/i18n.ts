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
    home: {
      hero: {
        title: '탐색 허브',
      },
      search: {
        eyebrow: '빠른 탐색',
        placeholder: '오퍼레이터 이름, 직군, 진영 검색',
        action: '오퍼레이터 검색',
      },
      menu: {
        status: {
          active: '활성',
          pending: '준비중',
        },
        operators: {
          caption: '오퍼레이터 도감과 상세 스탯',
        },
        enemies: {
          caption: '적 타입과 위협 요소 정리',
        },
        operations: {
          caption: '맵 구조와 오퍼레이션 흐름',
        },
        items: {
          caption: '재화와 파밍 동선 관리',
        },
        plan: {
          caption: '육성과 제작 계획을 정리',
        },
      },
      states: {
        loadingOperators: '오퍼레이터 데이터를 불러오는 중입니다.',
      },
      settings: {
        title: '홈 설정',
        syncStatusTitle: '현재 동기화 상태',
        syncReady: '준비됨',
        syncNeeded: '동기화 필요',
        syncAction: '동기화 실행',
        morePending: '추가 설정은 준비 중',
      },
      messages: {
        settingsPending: '세부 설정 화면은 준비 중입니다.',
      },
    },
    itemsPage: {
      topBar: {
        title: '아이템 목록',
        description: '동기화된 아이템 데이터를 지역 기준으로 확인합니다.',
      },
      search: {
        placeholder: '이름, 타입, 획득처 검색',
      },
      states: {
        loading: '아이템 데이터를 불러오는 중입니다.',
        error: '아이템 데이터를 불러오지 못했습니다.',
        empty: '조건에 맞는 아이템이 없습니다.',
      },
    },
    itemsDetail: {
      topBar: {
        title: '아이템 상세',
        description: '아이템 기본 정보와 획득 정보를 확인합니다.',
      },
      sort: {
        dropRate: '드랍률',
        sampleCount: '표본 수',
      },
      sections: {
        description: '설명',
        usage: '용도',
        stageDrops: '드랍 가능 스테이지',
        penguinDrops: '펭귄 통계',
        buildingRecipes: '제조 레시피',
        recipeCosts: '필요 재료',
      },
      labels: {
        rarity: '희귀도',
        classifyType: '분류',
        itemType: '아이템 타입',
        obtainApproach: '획득처',
        dropRate: '드랍률',
        sampleCount: '표본 수',
        dropSourceStatic: '게임 데이터',
        dropSourcePenguin: 'Penguin Stats · {server}',
        formulaId: '공식',
      },
      states: {
        error: '아이템 상세를 불러오지 못했습니다.',
        notFound: '아이템을 찾을 수 없습니다.',
        notFoundDescription: '현재 지역 데이터에 해당 아이템이 없습니다.',
        backToList: '목록으로 돌아가기',
        noStageDrops: '등록된 드랍 가능 스테이지가 없습니다.',
        penguinError: 'Penguin Stats 데이터를 불러오지 못했습니다.',
        noPenguinDrops: '표시할 Penguin Stats 드랍 데이터가 없습니다.',
        buildingFormulaError: '제조 데이터를 불러오지 못했습니다.',
      },
    },
    planPage: {
      topBar: {
        title: 'Plan',
        description: '육성과 제작 계획 화면을 준비합니다.',
      },
      tabs: {
        operators: '오퍼레이터',
        summary: '종합 결과',
      },
      sections: {
        selected: '선택한 오퍼레이터',
        favorites: '즐겨찾기 오퍼레이터',
      },
      actions: {
        addOperator: '오퍼레이터 추가',
        removeOperator: '제거',
        retry: '다시 불러오기',
      },
      states: {
        errorTitle: '플랜 화면을 불러오지 못했습니다.',
        selectedDescription: '현재 플랜에 포함된 오퍼레이터입니다.',
        favoritesDescription: '즐겨찾기에서 빠르게 플랜을 시작할 수 있습니다.',
        emptyTitle: '아직 선택한 오퍼레이터가 없습니다.',
        emptyDescription: '즐겨찾기에서 바로 시작하거나 오퍼레이터 선택기에서 추가해 주세요.',
      },
      detail: {
        title: '육성 상세',
        description: '초기 상태와 목표 상태를 설정해 육성 비용을 계산합니다.',
        errorTitle: '육성 상세를 불러오지 못했습니다.',
        notFoundDescription: '대상 오퍼레이터 정보를 찾을 수 없습니다.',
        currentTitle: '초기 상태',
        currentDescription: '현재 육성 단계를 입력합니다.',
        targetTitle: '목표 상태',
        targetDescription: '도달할 목표 육성 단계를 입력합니다.',
        stateTitle: '상태 비교',
        stateDescription: '현재와 목표를 한 번에 맞춰 보면서 입력합니다.',
        elite: '정예화',
        level: '레벨',
        stage: '단계',
        skillsTitle: '스킬 설정',
        skillsDescription: '스킬 1~3의 초기/목표 레벨을 1~10 기준으로 입력합니다.',
        currentSkill: '초기 레벨',
        targetSkill: '목표 레벨',
        skillLevelHint: '8~10은 내부적으로 특화 1~3으로 계산됩니다.',
        modulesTitle: '모듈 설정',
        modulesDescription: '보유 모듈별 초기/목표 단계를 지정합니다.',
        currentModule: '초기 단계',
        targetModule: '목표 단계',
        moduleLocked: '미해금',
        summaryTitle: '계산 결과',
        summaryDescription: '입력한 상태 차이를 기준으로 필요한 자원을 집계합니다.',
        save: '저장',
        saving: '저장 중',
        saved: '플랜을 저장했습니다.',
        noMaterials: '추가 재료가 없습니다.',
      },
      summary: {
        operators: '집계 오퍼레이터',
        lmd: 'LMD',
        exp: 'EXP',
        expLabel: '경험치',
        lmdLabel: '용문폐',
        errorTitle: '종합 결과를 불러오지 못했습니다.',
        validationTitle: '입력 확인 필요',
        materialsTitle: '필요 재료',
        materialsDescription: '선택된 오퍼레이터 전체 기준 재료 총합입니다.',
        farmingTitle: '파밍 환산',
        farmingDescription: '공급 스테이지 기준 예상 클리어 횟수와 이성 소모입니다.',
        runs: '{count}회 클리어',
        totalSanity: '{count} 이성 소모',
        routeLabel: '{current} → {target}',
        openDetail: '상세 열기',
        miscTier: '기타',
        emptyTitle: '종합할 오퍼레이터가 없습니다.',
        emptyDescription: '먼저 오퍼레이터를 플랜에 추가해 주세요.',
      },
      picker: {
        title: '오퍼레이터 선택',
        searchPlaceholder: '이름, 소속, 직군 검색',
        add: '추가',
        emptyTitle: '추가할 수 있는 오퍼레이터가 없습니다.',
        emptyDescription: '검색어를 조정하거나 이미 추가된 목록을 확인해 주세요.',
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
    home: {
      hero: {
        title: '探索枢纽',
      },
      search: {
        eyebrow: '快速探索',
        placeholder: '搜索干员名称、职业、阵营',
        action: '搜索干员',
      },
      menu: {
        status: {
          active: '启用',
          pending: '准备中',
        },
        operators: {
          caption: '干员图鉴与详细属性',
        },
        enemies: {
          caption: '敌人类型与威胁要素整理',
        },
        operations: {
          caption: '地图结构与作战流程',
        },
        items: {
          caption: '资源与刷取路线管理',
        },
        plan: {
          caption: '整理养成与制作计划',
        },
      },
      statusPanel: {
        title: '优先实现干员图鉴',
        description: '首页以探索为中心进行了简化，目前实际可进入的模块只有 Operators。',
      },
      states: {
        loadingOperators: '正在加载干员数据。',
      },
      settings: {
        title: '首页设置',
        syncStatusTitle: '当前同步状态',
        syncReady: '已就绪',
        syncNeeded: '需要同步',
        syncAction: '执行同步',
        morePending: '更多设置准备中',
      },
      messages: {
        settingsPending: '详细设置界面仍在准备中。',
      },
    },
    itemsPage: {
      topBar: {
        title: '道具列表',
        description: '按当前地区查看已同步的道具数据。',
      },
      search: {
        placeholder: '搜索名称、类型、获取途径',
      },
      states: {
        loading: '正在加载道具数据。',
        error: '无法加载道具数据。',
        empty: '没有符合条件的道具。',
      },
    },
    itemsDetail: {
      topBar: {
        title: '道具详情',
        description: '查看道具基础信息与获取方式。',
      },
      sort: {
        dropRate: '掉落率',
        sampleCount: '样本数',
      },
      sections: {
        description: '说明',
        usage: '用途',
        stageDrops: '可掉落关卡',
        penguinDrops: '企鹅物流统计',
        buildingRecipes: '制造配方',
        recipeCosts: '所需材料',
      },
      labels: {
        rarity: '稀有度',
        classifyType: '分类',
        itemType: '道具类型',
        obtainApproach: '获取途径',
        dropRate: '掉落率',
        sampleCount: '样本数',
        dropSourceStatic: '游戏数据',
        dropSourcePenguin: 'Penguin Stats · {server}',
        formulaId: '配方',
      },
      states: {
        error: '无法加载道具详情。',
        notFound: '找不到该道具。',
        notFoundDescription: '当前地区数据中不存在该道具。',
        backToList: '返回列表',
        noStageDrops: '没有登记的可掉落关卡。',
        penguinError: '无法加载 Penguin Stats 数据。',
        noPenguinDrops: '没有可显示的 Penguin Stats 掉落数据。',
        buildingFormulaError: '无法加载制造数据。',
      },
    },
    planPage: {
      topBar: {
        title: 'Plan',
        description: '用于养成与制作规划的页面正在准备中。',
      },
      sections: {
        selected: '已选择干员',
        favorites: '收藏干员',
      },
      actions: {
        addOperator: '添加干员',
        removeOperator: '移除',
        retry: '重新加载',
      },
      states: {
        errorTitle: '无法加载计划页面。',
        selectedDescription: '当前已加入计划的干员。',
        favoritesDescription: '可从收藏干员快速开始计划。',
        emptyTitle: '还没有选择干员。',
        emptyDescription: '可以先从收藏开始，或在选择器中直接添加干员。',
      },
      picker: {
        title: '选择干员',
        searchPlaceholder: '搜索名称、所属、职业',
        add: '添加',
        emptyTitle: '没有可添加的干员。',
        emptyDescription: '请调整搜索词，或确认这些干员是否已经加入。',
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
    home: {
      hero: {
        title: '探索ハブ',
      },
      search: {
        eyebrow: 'クイック探索',
        placeholder: 'オペレーター名、職分、陣営を検索',
        action: 'オペレーター検索',
      },
      menu: {
        status: {
          active: '有効',
          pending: '準備中',
        },
        operators: {
          caption: 'オペレーター図鑑と詳細ステータス',
        },
        enemies: {
          caption: '敵タイプと脅威要素の整理',
        },
        operations: {
          caption: 'マップ構造とオペレーションの流れ',
        },
        items: {
          caption: '資源と周回導線の管理',
        },
        plan: {
          caption: '育成と製造の計画整理',
        },
      },
      statusPanel: {
        title: 'オペレーター図鑑を優先実装',
        description: 'トップ画面は探索中心に簡素化しており、現在実際に入れるセクションは Operators のみです。',
      },
      states: {
        loadingOperators: 'オペレーターデータを読み込み中です。',
      },
      settings: {
        title: 'ホーム設定',
        syncStatusTitle: '現在の同期状態',
        syncReady: '準備完了',
        syncNeeded: '同期が必要',
        syncAction: '同期を実行',
        morePending: '追加設定は準備中',
      },
      messages: {
        settingsPending: '詳細設定画面は準備中です。',
      },
    },
    itemsPage: {
      topBar: {
        title: 'アイテム一覧',
        description: '同期済みアイテムデータを地域基準で確認します。',
      },
      search: {
        placeholder: '名前、タイプ、入手先で検索',
      },
      states: {
        loading: 'アイテムデータを読み込み中です。',
        error: 'アイテムデータを読み込めませんでした。',
        empty: '条件に合うアイテムがありません。',
      },
    },
    itemsDetail: {
      topBar: {
        title: 'アイテム詳細',
        description: 'アイテムの基本情報と入手先を確認します。',
      },
      sort: {
        dropRate: 'ドロップ率',
        sampleCount: 'サンプル数',
      },
      sections: {
        description: '説明',
        usage: '用途',
        stageDrops: 'ドロップ可能ステージ',
        penguinDrops: 'Penguin Stats 統計',
        buildingRecipes: '製造レシピ',
        recipeCosts: '必要素材',
      },
      labels: {
        rarity: 'レア度',
        classifyType: '分類',
        itemType: 'アイテムタイプ',
        obtainApproach: '入手先',
        dropRate: 'ドロップ率',
        sampleCount: 'サンプル数',
        dropSourceStatic: 'ゲームデータ',
        dropSourcePenguin: 'Penguin Stats · {server}',
        formulaId: 'レシピ',
      },
      states: {
        error: 'アイテム詳細を読み込めませんでした。',
        notFound: 'アイテムが見つかりません。',
        notFoundDescription: '現在の地域データに該当アイテムがありません。',
        backToList: '一覧へ戻る',
        noStageDrops: '登録されたドロップ可能ステージがありません。',
        penguinError: 'Penguin Stats のデータを読み込めませんでした。',
        noPenguinDrops: '表示できる Penguin Stats ドロップデータがありません。',
        buildingFormulaError: '製造データを読み込めませんでした。',
      },
    },
    planPage: {
      topBar: {
        title: 'Plan',
        description: '育成や製造の計画ページを準備しています。',
      },
      sections: {
        selected: '選択中のオペレーター',
        favorites: 'お気に入りオペレーター',
      },
      actions: {
        addOperator: 'オペレーター追加',
        removeOperator: '削除',
        retry: '再読み込み',
      },
      states: {
        errorTitle: 'Planページを読み込めませんでした。',
        selectedDescription: '現在このプランに含まれているオペレーターです。',
        favoritesDescription: 'お気に入りから素早くプランを開始できます。',
        emptyTitle: 'まだオペレーターが選択されていません。',
        emptyDescription: 'お気に入りから始めるか、選択画面でオペレーターを追加してください。',
      },
      picker: {
        title: 'オペレーター選択',
        searchPlaceholder: '名前、所属、職分を検索',
        add: '追加',
        emptyTitle: '追加できるオペレーターがありません。',
        emptyDescription: '検索条件を調整するか、すでに追加済みか確認してください。',
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
    home: {
      hero: {
        title: '探索中樞',
      },
      search: {
        eyebrow: '快速探索',
        placeholder: '搜尋幹員名稱、職業、陣營',
        action: '搜尋幹員',
      },
      menu: {
        status: {
          active: '啟用',
          pending: '準備中',
        },
        operators: {
          caption: '幹員圖鑑與詳細屬性',
        },
        enemies: {
          caption: '敵人類型與威脅要素整理',
        },
        operations: {
          caption: '地圖結構與作戰流程',
        },
        items: {
          caption: '資源與刷取路線管理',
        },
        plan: {
          caption: '整理養成與製造計畫',
        },
      },
      statusPanel: {
        title: '優先實作幹員圖鑑',
        description: '首頁以探索為核心做了簡化，目前實際可進入的區塊只有 Operators。',
      },
      states: {
        loadingOperators: '正在載入幹員資料。',
      },
      settings: {
        title: '首頁設定',
        syncStatusTitle: '目前同步狀態',
        syncReady: '已就緒',
        syncNeeded: '需要同步',
        syncAction: '執行同步',
        morePending: '更多設定準備中',
      },
      messages: {
        settingsPending: '詳細設定畫面仍在準備中。',
      },
    },
    itemsPage: {
      topBar: {
        title: '道具列表',
        description: '依照目前地區查看已同步的道具資料。',
      },
      search: {
        placeholder: '搜尋名稱、類型、獲取方式',
      },
      states: {
        loading: '正在載入道具資料。',
        error: '無法載入道具資料。',
        empty: '沒有符合條件的道具。',
      },
    },
    itemsDetail: {
      topBar: {
        title: '道具詳情',
        description: '查看道具基本資訊與獲取方式。',
      },
      sort: {
        dropRate: '掉落率',
        sampleCount: '樣本數',
      },
      sections: {
        description: '說明',
        usage: '用途',
        stageDrops: '可掉落關卡',
        penguinDrops: '企鵝物流統計',
        buildingRecipes: '製造配方',
        recipeCosts: '所需材料',
      },
      labels: {
        rarity: '稀有度',
        classifyType: '分類',
        itemType: '道具類型',
        obtainApproach: '獲取方式',
        dropRate: '掉落率',
        sampleCount: '樣本數',
        dropSourceStatic: '遊戲資料',
        dropSourcePenguin: 'Penguin Stats · {server}',
        formulaId: '配方',
      },
      states: {
        error: '無法載入道具詳情。',
        notFound: '找不到該道具。',
        notFoundDescription: '目前地區資料中沒有該道具。',
        backToList: '返回列表',
        noStageDrops: '沒有已登記的可掉落關卡。',
        penguinError: '無法載入 Penguin Stats 資料。',
        noPenguinDrops: '沒有可顯示的 Penguin Stats 掉落資料。',
        buildingFormulaError: '無法載入製造資料。',
      },
    },
    planPage: {
      topBar: {
        title: 'Plan',
        description: '正在準備養成與製造規劃頁面。',
      },
      sections: {
        selected: '已選擇幹員',
        favorites: '收藏幹員',
      },
      actions: {
        addOperator: '新增幹員',
        removeOperator: '移除',
        retry: '重新載入',
      },
      states: {
        errorTitle: '無法載入計畫頁面。',
        selectedDescription: '目前已加入計畫的幹員。',
        favoritesDescription: '可以從收藏幹員快速開始規劃。',
        emptyTitle: '尚未選擇任何幹員。',
        emptyDescription: '可先從收藏開始，或在選擇器中直接新增幹員。',
      },
      picker: {
        title: '選擇幹員',
        searchPlaceholder: '搜尋名稱、所屬、職業',
        add: '新增',
        emptyTitle: '沒有可新增的幹員。',
        emptyDescription: '請調整搜尋條件，或確認是否已經加入。',
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
    home: {
      search: {
        eyebrow: 'Quick Search',
        placeholder: 'Search operator name, class, faction',
        action: 'Search Operators',
      },
      menu: {
        status: {
          active: 'Active',
          pending: 'Pending',
        },
        operators: {
          caption: 'Operator index and detailed stats',
        },
        enemies: {
          caption: 'Enemy types and threat notes',
        },
        operations: {
          caption: 'Map structure and operation flow',
        },
        items: {
          caption: 'Currencies and farming route management',
        },
        plan: {
          caption: 'Track upgrade and crafting plans',
        },
      },
      statusPanel: {
        title: 'Operator index comes first',
        description: 'The first screen is simplified around navigation, and Operators is the only fully available section right now.',
      },
      states: {
        loadingOperators: 'Loading operator data.',
      },
      settings: {
        title: 'Home Settings',
        syncStatusTitle: 'Current Sync Status',
        syncReady: 'Ready',
        syncNeeded: 'Need Sync',
        syncAction: 'Run Sync',
        morePending: 'More settings are coming soon',
      },
      messages: {
        settingsPending: 'Detailed settings are still in progress.',
      },
    },
    itemsPage: {
      topBar: {
        title: 'Item List',
        description: 'Browse synced item data for the current region.',
      },
      search: {
        placeholder: 'Search by name, type, or obtain method',
      },
      states: {
        loading: 'Loading item data.',
        error: 'Failed to load item data.',
        empty: 'No items match the current query.',
      },
    },
    itemsDetail: {
      topBar: {
        title: 'Item Details',
        description: 'Review the item basics and acquisition info.',
      },
      sort: {
        dropRate: 'Drop Rate',
        sampleCount: 'Samples',
      },
      sections: {
        description: 'Description',
        usage: 'Usage',
        stageDrops: 'Possible Stages',
        penguinDrops: 'Penguin Stats',
        buildingRecipes: 'Crafting Recipes',
        recipeCosts: 'Required Materials',
      },
      labels: {
        rarity: 'Rarity',
        classifyType: 'Classify Type',
        itemType: 'Item Type',
        obtainApproach: 'Obtain Approach',
        dropRate: 'Drop Rate',
        sampleCount: 'Samples',
        dropSourceStatic: 'Game Data',
        dropSourcePenguin: 'Penguin Stats · {server}',
        formulaId: 'Formula',
      },
      states: {
        error: 'Failed to load item details.',
        notFound: 'Item not found.',
        notFoundDescription: 'This item is not available in the current region data.',
        backToList: 'Back to list',
        noStageDrops: 'No possible drop stages are registered.',
        penguinError: 'Failed to load Penguin Stats data.',
        noPenguinDrops: 'No Penguin Stats drop data is available.',
        buildingFormulaError: 'Failed to load crafting data.',
      },
    },
    planPage: {
      topBar: {
        title: 'Plan',
        description: 'Preparing a workspace for upgrade and crafting plans.',
      },
      tabs: {
        operators: 'Operators',
        summary: 'Summary',
      },
      sections: {
        selected: 'Selected Operators',
        favorites: 'Favorite Operators',
      },
      actions: {
        addOperator: 'Add Operator',
        removeOperator: 'Remove',
        retry: 'Reload',
      },
      states: {
        errorTitle: 'Failed to load the planning view.',
        selectedDescription: 'Operators currently included in this plan.',
        favoritesDescription: 'Start quickly from your favorites.',
        emptyTitle: 'No operators have been selected yet.',
        emptyDescription: 'Start from favorites or add operators directly from the picker.',
      },
      detail: {
        title: 'Upgrade Detail',
        description: 'Set current and target progression to calculate the required cost.',
        errorTitle: 'Failed to load the upgrade detail view.',
        notFoundDescription: 'The target operator could not be found.',
        currentTitle: 'Current State',
        currentDescription: 'Enter the current upgrade state.',
        targetTitle: 'Target State',
        targetDescription: 'Enter the target upgrade state.',
        stateTitle: 'State Comparison',
        stateDescription: 'Compare current and target values side by side.',
        elite: 'Elite',
        level: 'Level',
        stage: 'Stage',
        skillsTitle: 'Skill Setup',
        skillsDescription: 'Set current and target levels for skill 1-3 on a 1-10 scale.',
        currentSkill: 'Current Level',
        targetSkill: 'Target Level',
        skillLevelHint: 'Levels 8-10 are mapped internally to Mastery 1-3.',
        modulesTitle: 'Module Setup',
        modulesDescription: 'Configure the current and target stage for each module.',
        currentModule: 'Current Stage',
        targetModule: 'Target Stage',
        moduleLocked: 'Locked',
        summaryTitle: 'Cost Summary',
        summaryDescription: 'Resources are aggregated from the difference between the two states.',
        save: 'Save',
        saving: 'Saving',
        saved: 'Plan saved.',
        noMaterials: 'No extra materials are required.',
      },
      summary: {
        operators: 'Operators',
        lmd: 'LMD',
        exp: 'EXP',
        expLabel: 'EXP',
        lmdLabel: 'LMD',
        errorTitle: 'Failed to load the aggregate result.',
        validationTitle: 'Validation Needed',
        materialsTitle: 'Required Materials',
        materialsDescription: 'Combined material total across selected operators.',
        farmingTitle: 'Farming Estimate',
        farmingDescription: 'Estimated runs and sanity cost based on supply stages.',
        runs: '{count} clears',
        totalSanity: '{count} sanity',
        routeLabel: '{current} → {target}',
        openDetail: 'Open Detail',
        miscTier: 'Misc',
        emptyTitle: 'No operators are selected.',
        emptyDescription: 'Add operators to the plan first.',
      },
      picker: {
        title: 'Select Operators',
        searchPlaceholder: 'Search by name, affiliation, or class',
        add: 'Add',
        emptyTitle: 'No operators are available to add.',
        emptyDescription: 'Adjust the search or check whether they are already added.',
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
