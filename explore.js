import * as THREE from "./vendor/three.module.js";
import { OrbitControls } from "./vendor/OrbitControls.js";

const viewer = document.querySelector("#carViewer");
const zonePanel = document.querySelector("#zonePanel");
const partList = document.querySelector("#partList");
const enterInteriorBtn = document.querySelector("#enterInteriorBtn");
const resetCameraBtn = document.querySelector("#resetCameraBtn");
const viewButtons = [...document.querySelectorAll("[data-view]")];

const zones = {
  mirror: {
    title: "驾驶员侧后视镜",
    description: "新手常见问题：启动后不展开、锁车不合拢、镜片角度不会调。",
    camera: [-4.6, 2.2, 3.5],
    target: [-2.25, 1.05, 0.85],
    issue: "后视镜不自动打开",
    parts: ["外后视镜壳体", "镜片", "合拢/展开功能", "驾驶员车门上的后视镜旋钮"],
  },
  door: {
    title: "驾驶员车门",
    description: "门板上集中放着车窗、后视镜、门锁、儿童锁和部分座椅记忆按钮。",
    camera: [-4.9, 2.0, 1.1],
    target: [-2.25, 0.7, 0],
    issue: "后排车窗按键没反应",
    parts: ["车窗升降按钮", "后视镜旋钮", "儿童保护按钮", "门锁按钮", "座椅记忆 SET/数字键"],
  },
  wheel: {
    title: "左前轮胎",
    description: "轮胎相关问题优先看胎压、破损、明显亏气和胎压监控提示。",
    camera: [-4.4, 1.3, 2.4],
    target: [-1.45, -0.35, 1.25],
    issue: "胎压灯亮了",
    parts: ["轮胎", "轮毂", "气门嘴", "胎压标贴", "胎压监控 TPMS"],
  },
  fuel: {
    title: "右后油箱盖",
    description: "加油相关操作通常在车身右后侧，锁车状态会影响油箱盖能否打开。",
    camera: [4.7, 1.6, -3.3],
    target: [1.45, 0.45, -1.22],
    issue: "油箱盖打不开",
    parts: ["油箱盖板", "加油口", "燃油标号提示", "锁止状态"],
  },
  trunk: {
    title: "行李厢/后备厢",
    description: "后备厢相关问题包括打不开、便捷开启无反应、应急物品位置。",
    camera: [0, 1.9, -5.0],
    target: [0, 0.65, -1.72],
    issue: "后备厢打不开",
    parts: ["行李厢盖", "车尾开启按钮", "便捷开启感应区", "警告三角牌/随车工具"],
  },
  hood: {
    title: "发动机舱盖",
    description: "打开发动机舱盖要先拉车内开锁杆；有蒸汽或冷却液提示时不要贸然打开。",
    camera: [0, 2.1, 5.1],
    target: [0, 0.75, 1.72],
    issue: "机盖怎么开",
    parts: ["发动机舱盖", "车内开锁杆", "车头二道锁手柄", "玻璃水/机油/冷却液位置"],
  },
  cabin: {
    title: "驾驶舱",
    description: "车内视角用于认识方向盘、仪表、中控屏、选档杆和常用按钮。",
    camera: [0, 2.45, 4.2],
    target: [0, 1.15, -0.25],
    issue: "方向盘怎么调",
    parts: ["方向盘", "组合仪表", "中控屏/MMI", "选档杆", "电子手刹/自动驻车", "双闪按钮"],
  },
};

const interiorZones = {
  steering: {
    title: "方向盘与仪表",
    description: "这里负责转向、查看速度/档位/警告灯，也有部分驾驶辅助按键。",
    camera: [0, 2.2, 3.4],
    target: [-0.55, 1.28, -0.35],
    issue: "方向盘怎么调",
    parts: ["方向盘", "转向柱", "组合仪表", "警告灯", "驾驶辅助按键"],
  },
  center: {
    title: "中控屏与 MMI",
    description: "车辆设置、蓝牙、胎压存储、部分驾驶辅助设置通常在这里。",
    camera: [1.7, 2.0, 3.0],
    target: [0.55, 1.18, -0.45],
    issue: "蓝牙连不上",
    parts: ["中控屏", "MMI 菜单", "车辆设置", "蓝牙连接", "胎压存储入口"],
  },
  console: {
    title: "选档杆和中控台",
    description: "P/R/N/D、电子手刹、自动驻车、杯架等集中在前排中间区域。",
    camera: [1.6, 1.5, 2.6],
    target: [0.4, 0.55, 0.25],
    issue: "P档是什么意思",
    parts: ["选档杆", "P/R/N/D 档", "电子手刹", "自动驻车", "启动按钮"],
  },
  roof: {
    title: "前天花板区域",
    description: "天窗按钮和部分车内照明按钮通常在头顶，不在中控台。",
    camera: [0, 2.85, 2.4],
    target: [0, 2.15, -0.1],
    issue: "天窗忘关",
    parts: ["天窗按钮", "遮阳帘", "车内照明", "紧急呼叫区域"],
  },
};
const zoneDiagrams = {
  mirror: {
    note: "说明书级示意，用来认识外后视镜本体和门板旋钮的关系。后视镜自动合拢/展开还可能受 MMI 设置影响。",
    viewBox: "0 0 420 280",
    svg: `
      <rect x="62" y="54" width="126" height="172" rx="22" class="diagram-fill mirror-door-slice" />
      <circle cx="134" cy="160" r="24" class="diagram-fill knob" />
      <path d="M210 88 L332 66 L356 104 L336 176 L214 154 Z" class="diagram-fill mirror-shell" />
      <path d="M230 104 L318 88 L330 112 L316 150 L232 140 Z" class="diagram-fill mirror-glass" />
      <path d="M188 142 L214 132" class="diagram-line" />
      <path d="M348 106 C374 120 374 150 344 166" class="diagram-fill fold-arc" />
    `,
    labels: [
      { x: 132, y: 160, title: "门板旋钮", query: "后视镜不自动打开" },
      { x: 276, y: 92, title: "镜片", query: "后视镜不自动打开" },
      { x: 326, y: 166, title: "合拢/展开", query: "后视镜不自动打开" },
      { x: 296, y: 58, title: "外后视镜壳体", query: "锁车后视镜不自动合拢" },
      { x: 126, y: 222, title: "左/右镜选择", query: "后视镜不自动打开" },
      { x: 196, y: 122, title: "连接车门处", query: "后视镜不自动打开" },
    ],
  },
  door: {
    note: "说明书级示意，不代表当前车辆配置完全一致。实车按钮数量和位置以你的车为准。",
    viewBox: "0 0 420 280",
    svg: `
      <rect x="38" y="26" width="344" height="226" rx="26" class="diagram-fill panel" />
      <path d="M74 66 C128 28 255 26 342 54 L334 94 C242 78 154 82 76 112 Z" class="diagram-fill glass" />
      <rect x="76" y="118" width="224" height="58" rx="18" class="diagram-fill armrest" />
      <rect x="92" y="132" width="116" height="28" rx="9" class="diagram-fill switchbank" />
      <circle cx="260" cy="139" r="20" class="diagram-fill knob" />
      <rect x="86" y="190" width="82" height="34" rx="11" class="diagram-fill memory" />
      <rect x="250" y="188" width="72" height="28" rx="10" class="diagram-fill lock" />
      <path d="M318 100 L355 88 L356 122 L318 129 Z" class="diagram-fill mirror" />
    `,
    labels: [
      { x: 286, y: 128, title: "后视镜旋钮", query: "后视镜不自动打开" },
      { x: 102, y: 132, title: "车窗按钮", query: "后排车窗按键没反应" },
      { x: 155, y: 176, title: "儿童锁/后窗锁", query: "后排车窗按键没反应" },
      { x: 96, y: 228, title: "座椅记忆", query: "座椅怎么调" },
      { x: 312, y: 212, title: "门锁按钮", query: "锁车后视镜不自动合拢" },
      { x: 356, y: 82, title: "外后视镜", query: "后视镜不自动打开" },
    ],
  },
  console: {
    note: "说明书级示意，只用于帮新手建立中控台方向感。实车按键、旋钮和杯架位置可能因配置不同而变化。",
    viewBox: "0 0 420 280",
    svg: `
      <path d="M160 20 L260 20 C286 72 300 142 288 252 L132 252 C120 142 134 72 160 20 Z" class="diagram-fill console-base" />
      <rect x="166" y="38" width="88" height="46" rx="15" class="diagram-fill start-area" />
      <rect x="172" y="108" width="76" height="88" rx="24" class="diagram-fill gear" />
      <rect x="186" y="122" width="48" height="58" rx="17" class="diagram-fill gear-handle" />
      <rect x="126" y="104" width="38" height="86" rx="15" class="diagram-fill parking" />
      <rect x="256" y="104" width="38" height="86" rx="15" class="diagram-fill hold" />
      <circle cx="210" cy="224" r="24" class="diagram-fill cupholder" />
      <circle cx="252" cy="224" r="24" class="diagram-fill cupholder" />
      <path d="M178 92 L242 92" class="diagram-line" />
      <text x="190" y="102" class="diagram-text">P R N D</text>
    `,
    labels: [
      { x: 210, y: 162, title: "选档杆", query: "选档杆怎么用" },
      { x: 276, y: 92, title: "P/R/N/D", query: "P档是什么意思" },
      { x: 116, y: 124, title: "电子手刹", query: "电子手刹怎么用" },
      { x: 314, y: 142, title: "自动驻车", query: "自动驻车怎么用" },
      { x: 210, y: 50, title: "启动按钮", query: "车打不着火" },
      { x: 230, y: 246, title: "杯架/杂物区", query: "选档杆怎么用" },
    ],
  },
  steering: {
    note: "说明书级示意，用来帮新手先分清方向盘、仪表和左右拨杆。实车按键形状和数量以你的配置为准。",
    viewBox: "0 0 420 280",
    svg: `
      <rect x="120" y="32" width="180" height="72" rx="24" class="diagram-fill cluster" />
      <circle cx="170" cy="68" r="22" class="diagram-fill gauge" />
      <circle cx="250" cy="68" r="22" class="diagram-fill gauge" />
      <circle cx="210" cy="172" r="74" class="diagram-fill wheel-ring" />
      <circle cx="210" cy="172" r="32" class="diagram-fill wheel-hub" />
      <path d="M178 154 L110 118" class="diagram-fill stalk" />
      <path d="M242 154 L310 118" class="diagram-fill stalk" />
      <rect x="148" y="164" width="34" height="26" rx="8" class="diagram-fill wheel-button" />
      <rect x="238" y="164" width="34" height="26" rx="8" class="diagram-fill wheel-button" />
      <path d="M196 222 L180 252 L240 252 L224 222 Z" class="diagram-fill steering-column" />
    `,
    labels: [
      { x: 210, y: 174, title: "方向盘", query: "方向盘怎么调" },
      { x: 210, y: 42, title: "组合仪表", query: "胎压灯亮了" },
      { x: 94, y: 112, title: "左拨杆/灯光", query: "车灯AUTO" },
      { x: 326, y: 112, title: "右拨杆/雨刮", query: "雨刮不会自动工作" },
      { x: 282, y: 188, title: "驾驶辅助按键", query: "自适应巡航" },
      { x: 186, y: 246, title: "调节操纵杆", query: "方向盘怎么调" },
    ],
  },
  center: {
    note: "说明书级示意，用来说明中控屏/MMI 里的常见入口。真实菜单名称、层级和图标会因年款与配置不同而变化。",
    viewBox: "0 0 420 280",
    svg: `
      <rect x="82" y="34" width="256" height="148" rx="18" class="diagram-fill screen-frame" />
      <rect x="104" y="54" width="212" height="108" rx="10" class="diagram-fill screen" />
      <rect x="122" y="78" width="70" height="26" rx="8" class="diagram-fill menu-tile vehicle" />
      <rect x="206" y="78" width="70" height="26" rx="8" class="diagram-fill menu-tile phone" />
      <rect x="122" y="118" width="70" height="26" rx="8" class="diagram-fill menu-tile tire" />
      <rect x="206" y="118" width="70" height="26" rx="8" class="diagram-fill menu-tile park" />
      <rect x="120" y="202" width="180" height="42" rx="16" class="diagram-fill climate-panel" />
      <circle cx="146" cy="223" r="13" class="diagram-fill climate-knob" />
      <circle cx="274" cy="223" r="13" class="diagram-fill climate-knob" />
      <path d="M184 224 H236" class="diagram-line" />
    `,
    labels: [
      { x: 210, y: 52, title: "中控屏/MMI", query: "蓝牙连不上" },
      { x: 120, y: 78, title: "车辆设置", query: "锁车后视镜不自动合拢" },
      { x: 278, y: 78, title: "蓝牙/电话", query: "蓝牙连不上" },
      { x: 118, y: 146, title: "胎压存储", query: "胎压灯亮了" },
      { x: 282, y: 146, title: "驻车辅助", query: "倒车影像没反应" },
      { x: 210, y: 232, title: "空调/除雾", query: "前挡风玻璃起雾" },
    ],
  },
  hood: {
    note: "说明书级示意，只用于认识发动机舱常见检查点。发动机热、有蒸汽、漏液或红色警告时不要自行打开或补液。",
    viewBox: "0 0 420 280",
    svg: `
      <path d="M58 42 H362 L338 246 H82 Z" class="diagram-fill engine-bay" />
      <rect x="150" y="78" width="120" height="88" rx="18" class="diagram-fill engine-block" />
      <circle cx="112" cy="88" r="25" class="diagram-fill washer-cap" />
      <circle cx="306" cy="90" r="25" class="diagram-fill coolant-tank" />
      <rect x="278" y="178" width="54" height="38" rx="10" class="diagram-fill battery" />
      <circle cx="218" cy="144" r="18" class="diagram-fill oil-cap" />
      <path d="M86 236 H168" class="diagram-fill hood-latch" />
      <path d="M196 42 L224 42 L232 64 L188 64 Z" class="diagram-fill heat-warning" />
      <text x="204" y="58" class="diagram-text danger">!</text>
    `,
    labels: [
      { x: 104, y: 84, title: "玻璃水口", query: "玻璃水加在哪里" },
      { x: 220, y: 142, title: "机油加注口", query: "机油灯亮了" },
      { x: 314, y: 88, title: "冷却液罐", query: "冷却液温度高" },
      { x: 330, y: 198, title: "搭电/电瓶", query: "搭电" },
      { x: 128, y: 238, title: "机盖锁扣", query: "机盖怎么开" },
      { x: 214, y: 42, title: "热车危险", query: "冷却液温度高" },
    ],
  },
  trunk: {
    note: "说明书级示意，用来认识后备厢开启位置和常见应急物品。三角牌、急救包、工具位置可能因配置和地区不同而变化。",
    viewBox: "0 0 420 280",
    svg: `
      <path d="M82 54 H338 L362 220 H58 Z" class="diagram-fill trunk-space" />
      <path d="M108 58 H312 L296 22 H124 Z" class="diagram-fill trunk-lid" />
      <rect x="176" y="48" width="68" height="22" rx="8" class="diagram-fill trunk-button" />
      <rect x="96" y="106" width="92" height="56" rx="12" class="diagram-fill emergency-kit" />
      <path d="M252 102 L300 170 H204 Z" class="diagram-fill warning-triangle" />
      <rect x="112" y="190" width="96" height="32" rx="10" class="diagram-fill tool-box" />
      <path d="M238 220 C258 248 300 248 320 220" class="diagram-fill kick-zone" />
    `,
    labels: [
      { x: 210, y: 28, title: "后备厢盖", query: "后备厢打不开" },
      { x: 210, y: 62, title: "开启按钮", query: "后备厢打不开" },
      { x: 134, y: 118, title: "急救包", query: "急救包在哪里" },
      { x: 262, y: 122, title: "三角牌", query: "三角牌在哪里" },
      { x: 150, y: 220, title: "随车工具", query: "拖车" },
      { x: 314, y: 236, title: "脚踢感应区", query: "脚踢开后备厢" },
    ],
  },
  wheel: {
    note: "说明书级示意，用来认识轮胎、气门嘴和胎压信息。胎压灯亮时先检查是否明显亏气或破损，不要先急着复位。",
    viewBox: "0 0 420 280",
    svg: `
      <circle cx="210" cy="148" r="92" class="diagram-fill tire-outer" />
      <circle cx="210" cy="148" r="54" class="diagram-fill tire-rim" />
      <circle cx="244" cy="206" r="10" class="diagram-fill valve-stem" />
      <rect x="72" y="52" width="92" height="58" rx="12" class="diagram-fill pressure-label" />
      <path d="M160 94 L188 124" class="diagram-line" />
      <path d="M300 56 L338 96 L318 142" class="diagram-fill tire-warning" />
      <text x="316" y="92" class="diagram-text danger">!</text>
    `,
    labels: [
      { x: 210, y: 62, title: "轮胎", query: "胎压灯亮了" },
      { x: 210, y: 148, title: "轮毂", query: "胎压灯亮了" },
      { x: 266, y: 214, title: "气门嘴", query: "胎压灯亮了" },
      { x: 118, y: 54, title: "胎压标贴", query: "胎压灯亮了" },
      { x: 330, y: 140, title: "胎压警告", query: "胎压灯亮了" },
      { x: 112, y: 214, title: "明显亏气/破损", query: "胎压灯亮了" },
    ],
  },
  fuel: {
    note: "说明书级示意，用来认识油箱盖板、加油口和燃油标贴。加油前熄火，不吸烟，以油箱盖内侧标贴为准。",
    viewBox: "0 0 420 280",
    svg: `
      <rect x="70" y="60" width="280" height="160" rx="22" class="diagram-fill fuel-body" />
      <rect x="170" y="78" width="130" height="116" rx="18" class="diagram-fill fuel-door" />
      <circle cx="234" cy="136" r="34" class="diagram-fill fuel-cap" />
      <rect x="98" y="92" width="58" height="42" rx="9" class="diagram-fill fuel-label" />
      <path d="M300 132 C334 122 350 142 332 166" class="diagram-fill press-arrow" />
      <path d="M236 170 L236 204" class="diagram-line" />
    `,
    labels: [
      { x: 236, y: 82, title: "油箱盖板", query: "油箱盖打不开" },
      { x: 238, y: 138, title: "油箱封闭盖", query: "怎么加油" },
      { x: 126, y: 92, title: "燃油标贴", query: "怎么加油" },
      { x: 334, y: 132, title: "点按开启", query: "油箱盖打不开" },
      { x: 236, y: 208, title: "加油口", query: "怎么加油" },
      { x: 112, y: 202, title: "先解锁车辆", query: "油箱盖打不开" },
    ],
  },
  roof: {
    note: "说明书级示意，用来认识前天花板区域。关闭天窗/车窗时要看着操作，防止夹住人或物。",
    viewBox: "0 0 420 280",
    svg: `
      <rect x="92" y="42" width="236" height="184" rx="30" class="diagram-fill roof-console" />
      <rect x="150" y="74" width="120" height="64" rx="16" class="diagram-fill sunroof-switch" />
      <rect x="112" y="160" width="70" height="36" rx="12" class="diagram-fill cabin-light" />
      <rect x="238" y="160" width="70" height="36" rx="12" class="diagram-fill cabin-light" />
      <circle cx="210" cy="194" r="17" class="diagram-fill sos-button" />
      <path d="M162 106 H258" class="diagram-line" />
    `,
    labels: [
      { x: 210, y: 74, title: "天窗按钮", query: "天窗忘关" },
      { x: 210, y: 138, title: "遮阳帘", query: "天窗忘关" },
      { x: 126, y: 184, title: "车内照明", query: "天窗忘关" },
      { x: 294, y: 184, title: "阅读灯", query: "天窗忘关" },
      { x: 210, y: 224, title: "紧急呼叫区", query: "三角牌在哪里" },
      { x: 132, y: 52, title: "前天花板", query: "天窗忘关" },
    ],
  },
};

const zonePhotos = {
  mirror: {
    src: "assets/car-photos/driver-mirror-close.jpg",
    note: "第二档实车照片：用于识别驾驶员侧外后视镜的位置、镜片和外壳。后视镜折叠/展开是否自动工作，还要回到车门旋钮和 MMI 设置里确认。",
    labels: [
      { x: 50, y: 48, title: "镜片", query: "后视镜不自动打开" },
      { x: 48, y: 36, title: "外后视镜外壳", query: "锁车后视镜不自动合拢" },
      { x: 25, y: 46, title: "连接车门处", query: "后视镜不自动打开" },
      { x: 17, y: 28, title: "驾驶员车窗", query: "后排车窗按键没反应" },
      { x: 62, y: 64, title: "镜片可调角度", query: "后视镜不自动打开" },
    ],
  },
  wheel: {
    src: "assets/car-photos/front-left-wheel.jpg",
    note: "第二档实车照片：用于识别轮胎、轮毂、气门嘴和胎压相关检查点。胎压报警时先安全停车，再看轮胎有没有明显亏气或破损。",
    labels: [
      { x: 55, y: 47, title: "轮胎胎面/胎壁", query: "胎压灯亮了" },
      { x: 48, y: 50, title: "轮毂", query: "胎压灯亮了" },
      { x: 42, y: 47, title: "气门嘴附近", query: "胎压灯亮了" },
      { x: 52, y: 35, title: "看有没有明显亏气", query: "胎压灯亮了" },
      { x: 35, y: 62, title: "轮胎接地处", query: "胎压灯亮了" },
    ],
  },
  trunk: {
    src: "assets/car-photos/trunk-lid-open.jpg",
    note: "第二档实车照片：用于识别后备厢盖内侧、警告三角牌位置和关闭把手。应急物品实际放置可能因配置或后期整理而不同。",
    labels: [
      { x: 50, y: 16, title: "后备厢盖内侧", query: "后备厢打不开" },
      { x: 50, y: 35, title: "警告三角牌", query: "三角牌在哪里" },
      { x: 30, y: 28, title: "关闭拉手", query: "后备厢打不开" },
      { x: 70, y: 28, title: "关闭拉手", query: "后备厢打不开" },
      { x: 50, y: 57, title: "后挡风玻璃", query: "后备厢打不开" },
    ],
  },
  hood: {
    src: "assets/car-photos/engine-bay-open.jpg",
    note: "第二档实车照片：用于识别发动机舱常见检查点。发动机热、有蒸汽、漏液或红色警告时，不要自行打开或加液。",
    labels: [
      { x: 50, y: 42, title: "发动机盖板", query: "机油灯亮了" },
      { x: 82, y: 42, title: "玻璃水加注口", query: "玻璃水加在哪里" },
      { x: 77, y: 63, title: "冷却液壶", query: "冷却液温度高" },
      { x: 20, y: 52, title: "电瓶/搭电区域", query: "搭电" },
      { x: 50, y: 76, title: "机舱前沿锁扣附近", query: "机盖怎么开" },
      { x: 50, y: 21, title: "机盖支撑区域", query: "机盖怎么开" },
    ],
  },
  door: {
    src: "assets/car-photos/driver-door-controls.jpg",
    note: "第二档实车照片：用于识别驾驶员车门上的车窗、后视镜和门锁相关按键。具体配置仍以你的实车为准。",
    labels: [
      { x: 58, y: 56, title: "车窗升降按键", query: "后排车窗按键没反应" },
      { x: 60, y: 75, title: "后窗锁/儿童保护", query: "后排车窗按键没反应" },
      { x: 65, y: 33, title: "车门拉手", query: "后备厢打不开" },
      { x: 58, y: 88, title: "储物格", query: "驾驶员车门" },
      { x: 47, y: 18, title: "门板装饰区", query: "座椅怎么调" },
    ],
  },
  steering: {
    src: "assets/car-photos/steering-cluster.jpg",
    note: "第二档实车照片：用于识别方向盘、组合仪表、左右拨杆和常用方向盘按键。",
    labels: [
      { x: 50, y: 58, title: "方向盘", query: "方向盘怎么调" },
      { x: 49, y: 25, title: "组合仪表", query: "胎压灯亮了" },
      { x: 34, y: 53, title: "左侧多功能按键", query: "车灯AUTO" },
      { x: 67, y: 53, title: "右侧多功能按键", query: "自适应巡航" },
      { x: 29, y: 38, title: "灯光/转向拨杆", query: "车灯AUTO" },
      { x: 72, y: 38, title: "雨刮拨杆", query: "雨刮不会自动工作" },
    ],
  },
  center: {
    src: "assets/car-photos/center-screen-climate.jpg?v=phone-blur-20260702",
    note: "第二档实车照片：用于识别中控屏、MMI 菜单、双闪和空调控制区。",
    labels: [
      { x: 55, y: 28, title: "中控屏/MMI", query: "蓝牙连不上" },
      { x: 55, y: 16, title: "车辆设置菜单", query: "锁车后视镜不自动合拢" },
      { x: 50, y: 54, title: "双闪按钮", query: "双闪在哪里" },
      { x: 50, y: 69, title: "空调控制区", query: "前挡风玻璃起雾" },
      { x: 38, y: 70, title: "左温区旋钮", query: "前挡风玻璃起雾" },
      { x: 63, y: 70, title: "右温区旋钮", query: "前挡风玻璃起雾" },
    ],
  },
  console: {
    src: "assets/car-photos/console-gear-selector.jpg",
    note: "第二档实车照片：用于识别选档杆、P/R/N/D 区域、电子手刹和自动驻车。",
    labels: [
      { x: 51, y: 54, title: "选档杆", query: "选档杆怎么用" },
      { x: 43, y: 63, title: "P/R/N/D 区域", query: "P档是什么意思" },
      { x: 39, y: 76, title: "电子手刹", query: "电子手刹怎么用" },
      { x: 50, y: 76, title: "自动驻车", query: "自动驻车怎么用" },
      { x: 67, y: 50, title: "启动按钮附近", query: "车打不着火" },
      { x: 34, y: 21, title: "杯架/储物区", query: "选档杆怎么用" },
    ],
  },
  roof: {
    src: "assets/car-photos/roof-controls.jpg",
    note: "第二档实车照片：用于识别前天花板区域的天窗、遮阳帘、阅读灯和紧急呼叫区。",
    labels: [
      { x: 50, y: 34, title: "天窗控制拨钮", query: "天窗忘关" },
      { x: 50, y: 48, title: "遮阳帘控制", query: "天窗忘关" },
      { x: 30, y: 40, title: "左阅读灯", query: "天窗忘关" },
      { x: 70, y: 40, title: "右阅读灯", query: "天窗忘关" },
      { x: 50, y: 21, title: "紧急呼叫区", query: "三角牌在哪里" },
      { x: 50, y: 72, title: "前天花板面板", query: "天窗忘关" },
    ],
  },
};

zonePhotos.mirror.views = [
  {
    tab: "近景",
    src: "assets/car-photos/driver-mirror-close.jpg",
    note: "用于看清外后视镜本体、镜片和车门连接处。",
    labels: [
      { x: 32.24, y: 32.83, title: "镜片", query: "后视镜不自动打开" },
      { x: 19.86, y: 22.13, title: "外后视镜外壳", query: "锁车后视镜不自动合拢" },
      { x: 58.18, y: 22.13, title: "连接车门处", query: "后视镜不自动打开" },
      { x: 90.19, y: 34.41, title: "驾驶员车窗", query: "后排车窗按键没反应" },
      { x: 13.79, y: 43.01, title: "镜片可调角度", query: "后视镜不自动打开" },
    ],
  },
  {
    tab: "侧面",
    src: "assets/car-photos/driver-mirror-angle.jpg",
    note: "用于看后视镜在车身外侧的真实位置，帮助把门板旋钮和车外镜体对应起来。",
    labels: [
      { x: 70.09, y: 35.47, title: "镜片", query: "后视镜不自动打开" },
      { x: 83.41, y: 29.85, title: "外后视镜外壳", query: "锁车后视镜不自动合拢" },
      { x: 56.78, y: 30.2, title: "连接车门处", query: "后视镜不自动打开" },
      { x: 20, y: 33, title: "驾驶员车窗", query: "后排车窗按键没反应" },
      { x: 84.11, y: 44.24, title: "镜片外缘", query: "后视镜不自动打开" },
    ],
  },
];

function renderZoneDiagram(zoneId) {
  const diagram = zoneDiagrams[zoneId];
  if (!diagram) return "";
  const [, , width, height] = diagram.viewBox.split(/\s+/).map(Number);
  const labels = diagram.labels.map((label, index) => {
    const position = getFixedHotspotPosition("diagram", zoneId, "main", index, (label.x / width) * 100, (label.y / height) * 100);
    return `
    <a class="diagram-label" href="./index.html?query=${encodeURIComponent(label.query)}" style="left:${position.x}%; top:${position.y}%;" aria-label="${label.title}">
      <i>${index + 1}</i>
      <span>${label.title}</span>
    </a>
  `;
  }).join("");
  const legend = diagram.labels.map((label, index) => renderLegendItem(label, index, "diagram-legend-item")).join("");

  return `
    <section class="zone-diagram">
      <div class="zone-diagram-head">
        <strong>区域放大示意</strong>
        <small>${diagram.note}</small>
        <em>&#28857;&#32534;&#21495;&#25110;&#19979;&#26041;&#32034;&#24341;&#65292;&#21487;&#30452;&#25509;&#25171;&#24320;&#23545;&#24212;&#25945;&#31243;&#12290;</em>
      </div>
      <div class="diagram-stage" style="--diagram-width:420; --diagram-height:280;">
        <svg viewBox="${diagram.viewBox}" role="img" aria-label="区域放大示意图">
          ${diagram.svg}
        </svg>
        ${labels}
      </div>
      <div class="diagram-legend" aria-label="区域示意索引">
        ${legend}
      </div>
    </section>
  `;
}

function renderZonePhoto(zoneId) {
  const photo = zonePhotos[zoneId];
  if (!photo) return "";
  const labels = photo.labels.map((label, index) => {
    const position = getFixedHotspotPosition("photo", zoneId, "single", index, label.x, label.y);
    return `
    <a class="photo-label" href="./index.html?query=${encodeURIComponent(label.query)}" style="left:${position.x}%; top:${position.y}%;" aria-label="${label.title}">
      <i>${index + 1}</i>
      <span>${label.title}</span>
    </a>
  `;
  }).join("");
  const legend = photo.labels.map((label, index) => renderLegendItem(label, index, "photo-legend-item")).join("");

  return `
    <section class="zone-photo">
      <div class="zone-diagram-head">
        <strong>实车照片热点</strong>
        <small>${photo.note}</small>
        <em>&#28857;&#32534;&#21495;&#25110;&#19979;&#26041;&#32034;&#24341;&#65292;&#21487;&#30452;&#25509;&#25171;&#24320;&#23545;&#24212;&#25945;&#31243;&#12290;</em>
      </div>
      <div class="photo-stage">
        <img src="${photo.src}" alt="实车照片热点标注" loading="lazy" />
        ${labels}
      </div>
      <div class="photo-legend" aria-label="照片热点索引">
        ${legend}
      </div>
    </section>
  `;
}

function renderZonePhotoGallery(zoneId) {
  const photo = zonePhotos[zoneId];
  if (!photo?.views?.length || photo.views.length === 1) return renderZonePhoto(zoneId);
  const group = `photo-views-${zoneId}`;
  const toggles = photo.views.map((view, index) => `
    <input class="photo-view-toggle photo-view-toggle-${index}" type="radio" name="${group}" id="${group}-${index}" ${index === 0 ? "checked" : ""} />
  `).join("");
  const tabs = photo.views.map((view, index) => `
    <label class="photo-view-tab photo-view-tab-${index}" for="${group}-${index}">${view.tab}</label>
  `).join("");
  const panels = photo.views.map((view, viewIndex) => {
    const labels = view.labels.map((label, index) => {
      const position = getFixedHotspotPosition("photo", zoneId, `view-${viewIndex}`, index, label.x, label.y);
      return `
      <a class="photo-label" href="./index.html?query=${encodeURIComponent(label.query)}" style="left:${position.x}%; top:${position.y}%;" aria-label="${label.title}">
        <i>${index + 1}</i>
        <span>${label.title}</span>
      </a>
    `;
    }).join("");
    const legend = view.labels.map((label, index) => renderLegendItem(label, index, "photo-legend-item")).join("");

    return `
      <div class="photo-view photo-view-${viewIndex}">
        <div class="zone-diagram-head">
          <strong>实车照片热点</strong>
          <small>${view.note}</small>
          <em>&#28857;&#32534;&#21495;&#25110;&#19979;&#26041;&#32034;&#24341;&#65292;&#21487;&#30452;&#25509;&#25171;&#24320;&#23545;&#24212;&#25945;&#31243;&#12290;</em>
        </div>
        <div class="photo-stage">
          <img src="${view.src}" alt="实车照片热点标注" loading="lazy" />
          ${labels}
        </div>
        <div class="photo-legend" aria-label="照片热点索引">
          ${legend}
        </div>
      </div>
    `;
  }).join("");

  return `
    <section class="zone-photo zone-photo-gallery" style="--photo-view-count:${photo.views.length};">
      ${toggles}
      <div class="photo-view-tabs" aria-label="实车照片角度切换">
        ${tabs}
      </div>
      <div class="photo-view-panels">
        ${panels}
      </div>
    </section>
  `;
}

function renderZoneMedia(zoneId) {
  const photoHtml = renderZonePhotoGallery(zoneId);
  const diagramHtml = renderZoneDiagram(zoneId);
  if (photoHtml && diagramHtml) {
    const group = `zone-media-${zoneId}`;
    return `
      <section class="zone-media">
        <input class="media-toggle media-toggle-photo" type="radio" name="${group}" id="${group}-photo" checked />
        <input class="media-toggle media-toggle-diagram" type="radio" name="${group}" id="${group}-diagram" />
        <div class="media-tabs-ui" role="tablist" aria-label="区域图示切换">
          <label class="media-tab media-tab-photo" for="${group}-photo" role="tab">&#23454;&#36710;&#29031;&#29255;</label>
          <label class="media-tab media-tab-diagram" for="${group}-diagram" role="tab">&#32467;&#26500;&#31034;&#24847;</label>
        </div>
        <div class="media-panels">
          <div class="media-panel media-panel-photo">${photoHtml}</div>
          <div class="media-panel media-panel-diagram">${diagramHtml}</div>
        </div>
      </section>
    `;
  }
  return photoHtml || diagramHtml;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf7f2ea);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
viewer.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 3.2;
controls.maxDistance = 8;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clickable = [];
const labelSprites = [];
let mode = "exterior";
let activeZoneId = null;
let cameraTween = null;

const fixedHotspotPositions = {};

function getFixedHotspotPosition(kind, zoneId, viewId, index, x, y) {
  return fixedHotspotPositions[`${kind}:${zoneId}:${viewId}:${index}`] || { x, y };
}

const beginnerHints = {
  "门板旋钮": "驾驶员车门上控制左右后视镜和折叠的圆形旋钮。",
  "镜片": "真正反光、让你看后方车辆的那块玻璃。",
  "合拢/展开": "后视镜向车身收起或向外打开的动作。",
  "外后视镜壳体": "包住镜片的外壳，通常也是折叠时会动的部分。",
  "左/右镜选择": "先选左镜或右镜，再调镜片角度。",
  "连接车门处": "后视镜和车门相连的根部，折叠机构通常在这里。",
  "后视镜旋钮": "调镜片、选左右镜、控制折叠的旋钮。",
  "车窗按钮": "升降车窗的按钮，通常四个排列在一起。",
  "儿童锁/后窗锁": "限制后排车窗或车门操作的安全开关。",
  "座椅记忆": "保存或调用座椅位置的 SET/数字键。",
  "门锁按钮": "从车内锁车或解锁车门的按钮。",
  "外后视镜": "车外两侧的小镜子，用来看后方和侧后方。",
  "轮胎": "接触地面的橡胶圈，亏气或破损要优先处理。",
  "轮毂": "轮胎中间的金属圈，不等于轮胎本身。",
  "气门嘴": "给轮胎打气的接口，通常有一个小帽子。",
  "胎压标贴": "写着标准胎压的贴纸，多在车门框附近。",
  "胎压监控": "车内提醒轮胎压力异常的系统，也叫 TPMS。",
  "选档杆": "切换 P/R/N/D 档的操纵杆或拨杆。",
  "P/R/N/D": "停车、倒车、空档、前进四个基础档位。",
  "电子手刹": "用按钮代替传统手刹，停车后用于刹住车辆。",
  "自动驻车": "短暂停车时帮你保持刹车，常见标识是 Auto Hold。",
  "启动按钮": "启动车辆或切换电源状态的按钮。",
  "杯架/杂物区": "放水杯、钥匙或小物件的位置。",
  "方向盘": "控制车辆转向的圆形部件。",
  "组合仪表": "显示车速、档位、警告灯等信息的屏幕或仪表。",
  "左拨杆/灯光": "方向盘左侧常用来控制转向灯、远近光灯。",
  "右拨杆/雨刮": "方向盘右侧常用来控制雨刮和喷水。",
  "驾驶辅助按键": "巡航、车距、限速等辅助功能的按键。",
  "调节操纵杆": "调方向盘上下前后的释放杆或调节件。",
  "中控屏/MMI": "车机屏幕，很多车辆设置都从这里进入。",
  "车辆设置": "调灯光、锁车、后视镜等车辆功能的菜单。",
  "蓝牙/电话": "连接手机、电话和媒体音频的入口。",
  "胎压存储": "补气后在车机里保存当前轮胎压力。",
  "驻车辅助": "倒车影像、雷达或泊车相关功能入口。",
  "空调/除雾": "控制温度、风量、前挡除雾的区域。",
};

function getBeginnerHint(title) {
  return beginnerHints[title] || "点击编号或下方索引，可以打开对应的新手教程。";
}

function renderLegendItem(label, index, className) {
  return `
    <a class="${className}" href="./index.html?query=${encodeURIComponent(label.query)}">
      <i>${index + 1}</i>
      <span>
        <strong>${label.title}</strong>
        <small>${getBeginnerHint(label.title)}</small>
      </span>
    </a>
  `;
}

function renderZoneNavigator(currentZoneId) {
  const entries = Object.entries(mode === "interior" ? interiorZones : zones)
    .filter(([zoneId]) => zoneId !== "cabin");
  return `
    <section class="zone-nav" aria-label="同层区域导览">
      <div class="zone-nav-head">
        <strong>你还可以看</strong>
        <span>${mode === "interior" ? "车内区域" : "车外区域"}</span>
      </div>
      <div class="zone-nav-grid">
        ${entries.map(([zoneId, zone]) => `
          <button type="button" class="zone-nav-chip${zoneId === currentZoneId ? " active" : ""}" data-zone-jump="${zoneId}">
            <b>${zone.title}</b>
            <small>${zone.parts[0]}</small>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

const exteriorGroup = new THREE.Group();
const interiorGroup = new THREE.Group();
scene.add(exteriorGroup, interiorGroup);

function makeMat(color, roughness = 0.72, metalness = 0.08) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function addBox(parent, name, size, position, color, zoneId = null, opacity = 1) {
  const material = makeMat(color);
  material.transparent = opacity < 1;
  material.opacity = opacity;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (zoneId) {
    mesh.userData.zoneId = zoneId;
    clickable.push(mesh);
  }
  parent.add(mesh);
  return mesh;
}

function addWheel(parent, position, zoneId = null) {
  const tire = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.09, 18, 56),
    makeMat(0x171512, 0.85, 0.12),
  );
  tire.position.set(...position);
  tire.castShadow = true;
  if (zoneId) {
    tire.userData.zoneId = zoneId;
    clickable.push(tire);
  }
  parent.add(tire);

  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.08, 32),
    makeMat(0xc9c1b4, 0.45, 0.45),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.copy(tire.position);
  parent.add(rim);
}

function addLabel(parent, text, position, zoneId) {
  const canvas = document.createElement("canvas");
  canvas.width = 360;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(31,36,39,0.92)";
  roundRect(ctx, 10, 12, 340, 64, 22);
  ctx.fill();
  ctx.fillStyle = "#fffaf1";
  ctx.font = "700 28px Microsoft YaHei, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 180, 44);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.position.set(...position);
  sprite.scale.set(1.25, 0.34, 1);
  sprite.userData.zoneId = zoneId;
  labelSprites.push(sprite);
  parent.add(sprite);
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function buildExterior() {
  addBox(exteriorGroup, "body", [4.4, 0.72, 1.75], [0, 0.45, 0], 0x9a1f2d);
  addBox(exteriorGroup, "roof", [2.25, 0.62, 1.45], [-0.22, 1.08, -0.08], 0x24292d);
  addBox(exteriorGroup, "windshield", [0.78, 0.5, 1.34], [0.95, 1.18, 0.02], 0x9fc0cc, null, 0.72);
  addBox(exteriorGroup, "rear-window", [0.68, 0.48, 1.22], [-1.12, 1.16, -0.02], 0x9fc0cc, null, 0.72);
  addBox(exteriorGroup, "hood-zone", [1.15, 0.78, 1.83], [1.72, 0.57, 0], 0xb92b38, "hood", 0.92);
  addBox(exteriorGroup, "trunk-zone", [0.82, 0.76, 1.8], [-1.86, 0.56, 0], 0x7f1a25, "trunk", 0.92);
  addBox(exteriorGroup, "driver-door-zone", [1.1, 0.82, 0.08], [-0.42, 0.55, 0.93], 0xc8912c, "door", 0.86);
  addBox(exteriorGroup, "mirror-zone", [0.34, 0.2, 0.14], [0.82, 0.97, 1.05], 0x171512, "mirror");
  addBox(exteriorGroup, "fuel-zone", [0.46, 0.32, 0.08], [-1.32, 0.62, -0.93], 0xc8912c, "fuel", 0.9);
  addWheel(exteriorGroup, [1.35, 0, 0.96], "wheel");
  addWheel(exteriorGroup, [-1.35, 0, 0.96]);
  addWheel(exteriorGroup, [1.35, 0, -0.96]);
  addWheel(exteriorGroup, [-1.35, 0, -0.96]);
  addBox(exteriorGroup, "cabin-entry", [1.15, 0.78, 0.08], [-0.35, 0.72, -0.93], 0x387a4f, "cabin", 0.82);

  addLabel(exteriorGroup, "后视镜", [0.95, 1.55, 1.18], "mirror");
  addLabel(exteriorGroup, "驾驶员车门", [-0.45, 1.35, 1.35], "door");
  addLabel(exteriorGroup, "轮胎", [1.35, 0.78, 1.25], "wheel");
  addLabel(exteriorGroup, "油箱盖", [-1.35, 1.16, -1.25], "fuel");
  addLabel(exteriorGroup, "后备厢", [-2.05, 1.24, 0], "trunk");
  addLabel(exteriorGroup, "发动机舱", [1.75, 1.28, 0], "hood");
  addLabel(exteriorGroup, "进入车内", [-0.35, 1.45, -1.28], "cabin");
}

function buildInterior() {
  interiorGroup.visible = false;
  addBox(interiorGroup, "floor", [4.2, 0.12, 3.0], [0, -0.08, 0], 0x2b2a27);
  addBox(interiorGroup, "dashboard", [3.7, 0.55, 0.36], [0, 1.15, -0.9], 0x24292d);
  addBox(interiorGroup, "center-screen", [0.92, 0.5, 0.08], [0.55, 1.48, -0.68], 0x101820, "center");
  addBox(interiorGroup, "cluster", [0.85, 0.38, 0.08], [-0.58, 1.45, -0.66], 0x101820, "steering");
  addBox(interiorGroup, "console", [1.0, 0.28, 1.55], [0.34, 0.42, 0.4], 0x3a3630, "console");
  addBox(interiorGroup, "gear-selector", [0.22, 0.36, 0.42], [0.34, 0.72, 0.35], 0x171512, "console");
  addBox(interiorGroup, "hazard", [0.22, 0.12, 0.06], [0.48, 1.17, -0.48], 0xb21f2d, "center");
  addBox(interiorGroup, "roof-panel", [1.15, 0.12, 0.62], [0, 2.25, -0.05], 0xe7ddd0, "roof");

  const wheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.045, 16, 52),
    makeMat(0x16191b, 0.7, 0.2),
  );
  wheel.position.set(-0.72, 1.12, -0.22);
  wheel.rotation.x = Math.PI * 0.5;
  wheel.userData.zoneId = "steering";
  clickable.push(wheel);
  interiorGroup.add(wheel);

  addBox(interiorGroup, "driver-seat", [0.85, 0.28, 0.9], [-0.82, 0.18, 1.15], 0x4b4740);
  addBox(interiorGroup, "passenger-seat", [0.85, 0.28, 0.9], [0.95, 0.18, 1.15], 0x4b4740);
  addLabel(interiorGroup, "方向盘/仪表", [-0.62, 1.9, -0.35], "steering");
  addLabel(interiorGroup, "中控屏", [0.58, 1.92, -0.52], "center");
  addLabel(interiorGroup, "选档杆区域", [0.38, 1.05, 0.86], "console");
  addLabel(interiorGroup, "天窗按钮", [0, 2.55, 0.28], "roof");
}

function setPanel(zoneId) {
  const zone = mode === "interior" ? interiorZones[zoneId] : zones[zoneId];
  if (!zone) return;
  activeZoneId = zoneId;
  const backLabel = mode === "interior" ? "返回车内总览" : "返回车外总览";
  const switchLabel = mode === "interior" ? "返回车外 360" : "进入车内";
  const switchModeTarget = mode === "interior" ? "exterior" : "interior";
  const rootLabel = mode === "interior" ? "\u8f66\u5185\u603b\u89c8" : "\u8f66\u5916\u603b\u89c8";
  zonePanel.innerHTML = `
    <div class="zone-breadcrumb" aria-label="&#24403;&#21069;&#20301;&#32622;">
      <span>${rootLabel}</span>
      <i>/</i>
      <strong>${zone.title}</strong>
    </div>
    <p class="eyebrow">${mode === "interior" ? "车内区域" : "当前区域"}</p>
    <h2>${zone.title}</h2>
    <p>${zone.description}</p>
    <div class="part-list">
      ${zone.parts.map((part) => `<button type="button" class="part-pill">${part}</button>`).join("")}
    </div>
    ${renderZoneNavigator(zoneId)}
    ${renderZoneMedia(zoneId)}
    <div class="zone-actions">
      <button class="nav-button" type="button" data-panel-action="overview">${backLabel}</button>
      <button class="nav-button subtle" type="button" data-panel-action="${switchModeTarget}">${switchLabel}</button>
    </div>
    <a class="vehicle-link dark-link" href="./index.html?query=${encodeURIComponent(zone.issue)}">&#26597;&#30475;&#30456;&#20851;&#25945;&#31243;&#65306;${zone.issue}</a>
  `;
}

function setOverviewPanel() {
  activeZoneId = null;
  if (mode === "exterior") {
    const overviewParts = [
      ["后视镜", "mirror"],
      ["驾驶员车门", "door"],
      ["轮胎", "wheel"],
      ["油箱盖", "fuel"],
      ["后备厢", "trunk"],
      ["发动机舱", "hood"],
      ["进入车内", "cabin"],
    ];
    zonePanel.innerHTML = `
      <p class="eyebrow">当前区域</p>
      <h2>车外总览</h2>
      <p>拖动画面旋转车辆，点击发光区域查看说明。外部区域先覆盖后视镜、驾驶员车门、轮胎、油箱盖、后备厢和发动机舱。</p>
      <div class="part-list">
        ${overviewParts.map(([part, zoneId]) => `<button type="button" class="part-pill clickable" data-zone-jump="${zoneId}">${part}</button>`).join("")}
      </div>
      <div class="zone-actions">
        <button class="nav-button" type="button" data-panel-action="interior">进入车内</button>
      </div>
    `;
    moveCamera([4.6, 2.8, 5.2], [0, 0.65, 0]);
    return;
  }

  const interiorParts = [
    ["方向盘/仪表", "steering"],
    ["中控屏/MMI", "center"],
    ["选档杆区域", "console"],
    ["天窗按钮", "roof"],
  ];
  zonePanel.innerHTML = `
    <p class="eyebrow">车内总览</p>
    <h2>驾驶舱总览</h2>
    <p>车内先分成方向盘/仪表、中控屏、选档杆区域和前天花板。点击热点后会放大到对应区域并列出部件名称。</p>
    <div class="part-list">
      ${interiorParts.map(([part, zoneId]) => `<button type="button" class="part-pill clickable" data-zone-jump="${zoneId}">${part}</button>`).join("")}
    </div>
    <div class="zone-actions">
      <button class="nav-button" type="button" data-panel-action="exterior">返回车外 360</button>
    </div>
  `;
  moveCamera([0, 2.35, 4.3], [0, 1.1, -0.2]);
}

function focusZone(zoneId) {
  if (zoneId === "cabin") {
    switchMode("interior");
    setPanel("steering");
    moveCamera(interiorZones.steering.camera, interiorZones.steering.target);
    return;
  }
  const zone = mode === "interior" ? interiorZones[zoneId] : zones[zoneId];
  if (!zone) return;
  setPanel(zoneId);
  moveCamera(zone.camera, zone.target);
}

function moveCamera(position, target) {
  cameraTween = {
    startPos: camera.position.clone(),
    endPos: new THREE.Vector3(...position),
    startTarget: controls.target.clone(),
    endTarget: new THREE.Vector3(...target),
    started: performance.now(),
    duration: 650,
  };
}

function switchMode(nextMode) {
  mode = nextMode;
  exteriorGroup.visible = mode === "exterior";
  interiorGroup.visible = mode === "interior";
  viewButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === mode));
  activeZoneId = null;
  setOverviewPanel();
}

function handlePointer(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects([...clickable, ...labelSprites], false);
  const hit = hits.find((item) => item.object.visible && item.object.parent?.visible !== false);
  if (hit?.object.userData.zoneId) focusZone(hit.object.userData.zoneId);
}

function resize() {
  const width = viewer.clientWidth;
  const height = viewer.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function animate() {
  requestAnimationFrame(animate);
  if (cameraTween) {
    const t = Math.min(1, (performance.now() - cameraTween.started) / cameraTween.duration);
    const eased = 1 - Math.pow(1 - t, 3);
    camera.position.lerpVectors(cameraTween.startPos, cameraTween.endPos, eased);
    controls.target.lerpVectors(cameraTween.startTarget, cameraTween.endTarget, eased);
    if (t >= 1) cameraTween = null;
  } else if (mode === "exterior" && !activeZoneId) {
    exteriorGroup.rotation.y += 0.0016;
  }
  controls.update();
  renderer.render(scene, camera);
}

scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc2ae, 1.1));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
keyLight.position.set(4, 6, 5);
keyLight.castShadow = true;
scene.add(keyLight);
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(4.6, 96),
  new THREE.MeshStandardMaterial({ color: 0xe8dfd0, roughness: 0.92 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.42;
ground.receiveShadow = true;
scene.add(ground);

buildExterior();
buildInterior();
camera.position.set(4.6, 2.8, 5.2);
controls.target.set(0, 0.65, 0);
setOverviewPanel();

const params = new URLSearchParams(window.location.search);
const initialMode = params.get("mode");
const initialZone = params.get("zone");
if (initialMode === "interior") {
  switchMode("interior");
  if (initialZone) requestAnimationFrame(() => focusZone(initialZone));
} else if (initialZone) {
  requestAnimationFrame(() => focusZone(initialZone));
}

renderer.domElement.addEventListener("click", handlePointer);
enterInteriorBtn.addEventListener("click", () => switchMode("interior"));
resetCameraBtn.addEventListener("click", () => setOverviewPanel());
viewButtons.forEach((button) => {
  button.addEventListener("click", () => switchMode(button.dataset.view));
});
zonePanel.addEventListener("click", (event) => {
  const zoneJump = event.target.closest("[data-zone-jump]");
  if (zoneJump) {
    focusZone(zoneJump.dataset.zoneJump);
    return;
  }

  const button = event.target.closest("[data-panel-action]");
  if (!button) return;
  const action = button.dataset.panelAction;
  if (action === "overview") setOverviewPanel();
  if (action === "interior" || action === "exterior") switchMode(action);
});
window.addEventListener("resize", resize);
resize();
animate();
