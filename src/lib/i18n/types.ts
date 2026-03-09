export type Locale = "ko" | "en";

/** UI dictionary – used by React components via useDict() */
export interface Dict {
  meta: {
    title: string;
    description: string;
  };
  header: {
    subtitle: string;
    historyLink: string;
    glossaryLink: string;
    downloadJSON: string;
    importFile: string;
    share: string;
    resetAll: string;
    linkCopied: string;
    copyFailed: string;
    invalidJSON: string;
  };
  userMenu: {
    login: string;
    logout: string;
  };
  login: {
    subtitle: string;
    privacyLink: string;
    privacyAgree: string;
    required: string;
    googleLogin: string;
    guestAccess: string;
    guestNotice: string;
  };
  history: {
    title: string;
    backHome: string;
    loading: string;
    emptyTitle: string;
    emptyDesc: string;
    startDesign: string;
    justNow: string;
    minutesAgo: (n: number) => string;
    hoursAgo: (n: number) => string;
    daysAgo: (n: number) => string;
    loadBtn: string;
    deleteBtn: string;
    deleteAll: string;
    editNameTooltip: string;
    perMonth: string;
    wafrScore: (n: number) => string;
    deleteAllConfirm: string;
  };
  privacy: {
    title: string;
    lastUpdated: string;
    sections: {
      heading: string;
      content: string;
      list?: string[];
    }[];
  };
  result: {
    completionTitle: string;
    completionDesc: string;
    saveBtn: string;
    saved: string;
    loginRequired: string;
    loginRequiredDesc: string;
    googleLogin: string;
    close: string;
    tabs: {
      summary: string;
      serviceDetail: string;
      diagram: string;
      validation: string;
      checklist: string;
      checklistPct: (pct: number) => string;
      securityGroups: string;
      cost: (amount: string) => string;
      wafr: (score: number) => string;
      code: string;
      codeCnt: (cnt: number) => string;
    };
  };
  wizard: {
    prevBtn: string;
    nextStep: (label: string) => string;
    generateArch: string;
    returnToResult: string;
    recGuide: string;
    recRequired: string;
    recRecommended: string;
    recCostSave: string;
    recStrongly: string;
    recBestPractice: string;
    recCostOpt: string;
    autoSelect: string;
    stepHint: string;
  };
  phases: {
    id: string;
    label: string;
    desc: string;
    tip: string;
  }[];
  templates: {
    id: string;
    label: string;
    desc: string;
  }[];
  templateSelector: {
    title: string;
    desc: string;
    apply: string;
  };
  budgetModal: {
    title: string;
    desc: string;
    costFirst: string;
    costFirstDesc: string;
    balanced: string;
    balancedDesc: string;
    perfFirst: string;
    perfFirstDesc: string;
    estimated: string;
    perMonth: string;
    keyChanges: string;
    cancel: string;
    generate: string;
  };
  questionCard: {
    helpToggle: string;
    moreInfo: string;
  };
  summaryView: {
    archOverview: string;
    archPattern: string;
    keyServices: string;
    monthlyEstimate: string;
    perMonth: string;
    wafrScore: string;
    points: string;
    securityLevel: string;
    availabilityTarget: string;
    networkArch: string;
    deployStrategy: string;
  };
  stateSummary: {
    title: string;
    editBtn: string;
  };
  codeView: {
    title: string;
    desc: string;
    copyBtn: string;
    copied: string;
  };
  diagramView: {
    title: string;
    exportSvg: string;
    exportPng: string;
    reset: string;
    zoomIn: string;
    zoomOut: string;
    noData: string;
    loading: string;
    tabNetwork: string;
    tabData: string;
    tabCompute: string;
    tabFull: string;
  };
  infoPanel: {
    close: string;
    why: string;
    related: string;
  };
  archOutput: {
    waPillarTitle: string;
    pillars: { k: string; l: string }[];
    scoreLevels: string[];
    waNote: string;
    serviceCount: (n: number) => string;
    colService: string;
    colDetail: string;
    colReason: string;
    colCost: string;
    colOptimize: string;
    designPoints: string;
  };
  validationView: {
    noIssues: string;
    noIssuesDesc: string;
    mustFix: string;
    reviewRecommended: string;
    count: (n: number) => string;
    relatedPhase: string;
    summaryTitle: string;
    errors: string;
    warnings: string;
    errorDesc: string;
    warningDesc: string;
  };
  securityGroupView: {
    title: string;
    sgCount: (n: number) => string;
    showDiagram: string;
    showCode: string;
    copied: string;
    copy: string;
    inboundAllow: string;
    outboundAllow: string;
    allBlocked: string;
    prefixWarning: string;
  };
  checklistView: {
    overallProgress: string;
    completed: string;
    criticalItems: (n: number) => string;
    viewAll: string;
    criticalOnly: string;
    todoOnly: string;
    reset: string;
    critical: string;
    noCritical: string;
    allDone: string;
    moveToPhase: (name: string) => string;
    allPhasesComplete: string;
    allPhasesDoneDesc: string;
  };
  costView: {
    categories: Record<string, string>;
    currentCost: string;
    optimizedScenario: string;
    savingMsg: (amount: string, pct: number) => string;
    perMonthEstimate: string;
    range: string;
    commitDiscount: string;
    spotMixed: string;
    optimizedDesc: (saving: string) => string;
    perMonth: string;
    included: string;
    periodCompare: string;
    periods: { label: string; mult: number }[];
    optimized: string;
    costTips: string;
    tips: {
      commit: string;
      spot: string;
      nat: string;
      s3: string;
      cache: string;
      shield: string;
    };
  };
  wafrView: {
    pillars: { id: string; label: string }[];
    overallScore: string;
    pillarBasis: string;
    exportJson: string;
    detailEval: string;
    pts: string;
    gainPossible: (n: number) => string;
    recommendations: (n: number) => string;
    pillarScores: string;
    scoreCriteria: string;
    grades: { range: string; grade: string; desc: string }[];
  };
  glossary: {
    title: string;
    subtitle: string;
    backHome: string;
    searchPlaceholder: string;
    noResults: string;
    placementLabel: string;
    relatedLabel: string;
    analogyLabel: string;
    badgeAll: string;
    badgeAws: string;
    badgeGeneral: string;
    badgeK8s: string;
    badgeDocker: string;
    groups: Record<string, string>;
    placements: Record<string, string>;
  };
  hero: {
    headline: string;
    subheadline: string;
    features: { icon: string; title: string; desc: string }[];
    cta: string;
  };
  share: {
    designYourOwn: string;
    sharedDesign: string;
    perMonth: string;
    services: string;
  };
  diagram: {
    title: string;
    serviceCount: (n: number) => string;
    cardView: string;
    drawioView: string;
    editInDrawio: string;
    download: string;
    internet: string;
    edgeZone: string;
    regionLabel: string;
    accountOrg: string;
    networkBasis: string;
    publicSubnet: (az: string) => string;
    privateSubnet: (az: string) => string;
    cacheZone: (az: string) => string;
    dbZone: (az: string, is3tier: boolean) => string;
    storageZone: string;
    messagingZone: string;
    batchZone: string;
    dataPipeZone: string;
    drZone: string;
    k8sZone: string;
    appStackZone: string;
    securityZone: string;
    monitoringZone: string;
    cicdZone: string;
    costZone: string;
    flowHttps: string;
    flowAsync: string;
    flowSchedule: string;
    flowDr: string;
    footerDesc: (total: number) => string;
  };
}
