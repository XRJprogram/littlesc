target stage;

costumes "a72b11f16ffe5448349326d4e32a7db2.svg" as "背景1", "b0e285c6c024e96b2af2a92e9e049d7b.png" as "black", "d8c2fbecd7daf4fa66b51df118334357.svg" as "窄屏", "40a3edecd54b1910c35999c421b92a73.svg" as "长屏", "2dce7153500f2ccab65e77f5ad1ddaf6.png" as "mapbg", "cfe340c69f3f423f90bc700f2442a429.svg" as "Cendy", "78f1c8994065bafc771e04e2af4f7453.svg" as "fce中文";
var Condition = "inhand";
var CurrentCard = "0";
var Cnstage_card_Number = 0;
var CardGap = 2.361111111111111;
var CardHitbox_halfWidth = 97.5;
var CardRadius = 300;
var Camera_X = 0;
var Camera_Y = 118.74669444925593;
var Card_Spread_Angle = 18.88888888888889;
var CardHitbox_halfHeight = 142.5;
var Card_BaseLine_y = -100;
var SelectedCard = "0";
var Spiritleft = "西药";
var Scales = 0;
var Count_cardhit = 5;
var _return = 712.4372169764273;
var Scale_Size = 0.5;
var Scale_Centre_X = 240;
var Scale_Centre_Y = 0;
var Scale_AngularSpeed = 0;
var Scale_s_Angle = 90;
var Interface = 1;
var inhand_delete_ = 0;
var Running_sheld = "学习";
var exchoose = "";
var Main = "game";
var control_ = 1;
var skip = 0;
var short_screen_ = 1;
var _Move = 0;
var Movecard_dx = -3;
var Movecard_dy = 246;
var Touchcard_X = 0;
var Touchcard_Y = 150;
var temp_CloneInhandCard = 9;
var Energy = 0;
var StageSize = 50;
var CurrentStagecard = "0";
var return_randnum = 94296;
var PlayerHP = 44;
var PlayerMaxHP = 50;
var RoundCount = 1;
var GameInfo = 0;
var TouchedPoint = 1;
var MapCur = 1;
var GameDetail = "//巡逻者//";
var _SYSTEMbgX = 320;
var _SYSTEMbgY = 180;
var IsFinish_ = "0";
var SwitchMain = "0";
var CLOUD_CODE = "0";
var DebugMode = 1;
list stagepos_x_y_ = [0, 150];
list _system_bgx_bgy_ = [240, 180];
list Effect_name__5__;
list Point_reputation_energy_fans_resource_capacity_ = [3, 3, 0, 0, 0];
list Event;
list choosecard = ["情报网", "打磨", "打磨"];
list Music = ["break3", "clock", "typing", "typing", "break2", "clock", "typing", "typing", "break3", "clock", "break1", "clock", "break3", "break1", "clock", "typing", "typing", "break2", "clock", "break1", "clock", "break3", "clock", "break1", "break1", "break1", "break1"];
list InhandCard_name_lv_damage_hp_e_ = ["炸弹", "", "", "", "", "能量棒", "", "", "", 5, "Alpha", "", 3, 20, "", "橡皮", 1, 2, 50, 155, "混沌", 1, 5, 50, 23, "樱莲", 1, 2, 50, 1, "晨曦", 1, 2, 50, 1, "芙楠", 1, 2, 50, 1, "西药", 1, 2, 50, 1];
list PossessCard_name_lv_damage_hp_e_ = ["炸弹", "", "", "", "", "能量棒", "", "", "", 5, "Alpha", "", 3, 20, "", "橡皮", 1, 2, 50, 155, "混沌", 1, 5, 50, 23, "樱莲", 1, 2, 50, 1, "晨曦", 1, 2, 50, 1, "芙楠", 1, 2, 50, 1, "西药", 1, 2, 50, 1];
list _CardList_name_type__3__ = ["古树", "U", 0, 15, "", "影灵", "U", 1, 3, "", "Alpha", "U", 3, 20, "", "炸弹", "M", "", "", "", "能量棒", "M", 5, "", "", "医疗箱", "M", "", "", "", "空间护盾", "M", "", "", "", "能量回收", "M", "", "", "", "肾上腺素", "M", "", "", "", "镇定剂", "M", "", "", "", "橡皮", "P", "", "", "", "混沌", "P", 5, 1, "", "未来", "P", "", 1, "", "樱莲", "P", "", "", "", "西药", "P", "", 1, "", "芙楠", "P", 3, "", "", "晨曦", "P", 2, "", "", "回声", "P", 4, "", "", "极夜", "P", 5, "", "", "瑞比", "P", 4, "", "", "丹尼", "P", "", 1, "", "小桃", "P", "", 1, "", "塔塔", "P", 5, 1, "", "安然", "P", 3, "", "", "皮尔", "P", "", "", "", "华安", "P", "", 1, "", "尾兜", "P", 5, "", "", "云落", "P", 4, "", "", "AChy", "P", 3, "", "", "冰火", "P", 3, "", "", "涵影", "P", 5, "", "", "米花", "P", 2, "", "", "冰泉", "P", 2, "", "", "星空", "P", 3, "", "", "Christina", "P", "", "", "", "Cendy", "P", "", "", "", "Candace", "P", "", "", "", "Clara", "P", "", "", "", "Caitlan", "P", "", "", "", "Caitlin", "P", "", "", "", "意识集合", "P", "", "", ""];
list CardStage_name_lv__4__mhp_buff_ = ["null", "", "", "", "", "", "", "", "null", "", "", "", "", "", "", "", "电蜂", "", 6, 30, 0, 0, 30, "", "null", "", "", "", "", "", "", "", "null", "", "", "", "", "", "", "", "null", "", "", "", "", "", "", "", "null", "", "", "", "", "", "", "", "null", "", "", "", "", "", "", "", "null", "", "", "", "", "", "", "", "null", "", "", "", "", "", "", ""];
list _EnemyList_name_damage_hp_ = ["电蜂", 6, 30, "守卫", 4, 45, "巡逻者", 2, 25, "焦躁的食客", 1, 15, "电蜂巢穴", 0, 60, "钟楼守护者", 1, 40, "镜中的双生子", 5, 50, "审判官", 5, 50, "爱丽丝", 3, 30, "躁动的书", 3, 10, "历史之眼", 0, 75, "钟摆", 0, 40, "永生的灵魂", 0, 99, "痛苦的灵魂", 0, 30, "愤怒的灵魂", 5, 30, "孤独的灵魂", 0, 30, "石壁", 0, 10, "嗜血者", 1, 25, "先驱者", 1, 25, "机械巡逻者", 2, 40, "希萝茜", 0, 100, "回响者", 3, 30, "吞噬者", 5, 40, "恶意实质", 5, 60, "恶意", 5, 20, "实验残体", 3, 25, "意识屏障", 2, 20, "焦躁时钟", 3, 15, "妹妹？", 0, 40, "世界规则残片", 1, 999];
list CardEffect_id_type_;
list MapPointToPoint_Square_ = ["Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Unconnected", "Unconnected", "Unconnected", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Unconnected", "Unconnected", "Unconnected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Self", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Self", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Self", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Self", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Self", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Self", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Connected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Unconnected", "Self"];
list MapCamera__cur__target___x_y_size__ = [55.14, -116.54, 10, 55.14, -116.54, 10];
list MapPoint_7_ = ["0-1", 55.14, -116.54, 0, 0, "fight", "visible", "1-1", 47.92, -119.09, 0, 0, "fight", "invisible", "1-2", 37.99, -114.54, 0, 0, "fight", "invisible", "1-3", 29.77, -105.61, 0, 0, "fight", "invisible", "1-4", 24.59, -94.87, 0, 0, "fight", "invisible", "1-5", 19.13, -83.85, 0, 0, "fight", "invisible", "1-6", 9.34, -74.25, 0, 0, "fight", "invisible", "2-1", 6.63, -61.72, 0, 0, "fight", "invisible", "2-2", 3.3, -51.13, 0, 0, "fight", "invisible", "2-3", 0.05, -41.03, 0, 0, "fight", "invisible", "2-4", -3.03, -31.05, 0, 0, "fight", "invisible", "2-5", -5.89, -21.1, 0, 0, "fight", "invisible", "2-6", -8.51, -11.11, 0, 0, "fight", "invisible", "2-7", -10.89, -1.06, 0, 0, "fight", "invisible", "2-8", -13.02, 9.08, 0, 0, "fight", "invisible", "3-1", -14.88, 19.34, 0, 0, "fight", "invisible", "3-2", -16.5, 29.79, 0, 0, "fight", "invisible", "3-3", -17.89, 40.59, 0, 0, "fight", "invisible", "3-4", -19.08, 52.32, 0, 0, "fight", "invisible", "A-1", -25.98, 59.54, 0, 0, "fight", "invisible", "A-2", -28.73, 68.73, 0, 0, "fight", "invisible", "A-3", -26.7, 78.03, 0, 0, "fight", "invisible", "B-1", -13.19, 60.09, 0, 0, "fight", "invisible", "B-2", -11.25, 69.36, 0, 0, "fight", "invisible", "B-3", -13.8, 78.41, 0, 0, "fight", "invisible", "4-1", -20.29, 85.49, 0, 0, "fight", "invisible", "4-2", -20.02, 96.68, 0, 0, "fight", "invisible", "4-3", -19.53, 106.79, 0, 0, "fight", "invisible", "4-4", -18.89, 116.36, 0, 0, "fight", "invisible", "5-1", -18.13, 125.53, 0, 0, "spring", "invisible", "5-2", -17.29, 134.27, 0, 0, "spring", "invisible", "5-3", -16.42, 142.42, 0, 0, "spring", "invisible", "5-4", -15.64, 149.43, 0, 0, "spring", "invisible", "1-1R", 50.76, -126.42, 0, 0, "reward", "invisible", "1-2R", 34.76, -121.16, 0, 0, "reward", "invisible", "1-3R", 23.82, -109.4, 0, 0, "reward", "invisible", "1-5R", 25.32, -80.46, 0, 0, "reward", "invisible", "1-6R1", 1.98, -72.62, 0, 0, "reward", "invisible", "1-6R2", 5.88, -80.96, 0, 0, "reward", "invisible"];
list MapLink = [2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 16, 17, 17, 18, 18, 19, 20, 21, 21, 22, 23, 24, 24, 25, 26, 27, 27, 28, 28, 29, 30, 31, 31, 32, 32, 33, 2, 34, 3, 35, 4, 36, 6, 37, 7, 38, 7, 39, 1, 2, 7, 8, 15, 16, 19, 20, 19, 23, 22, 26, 25, 26, 29, 30];
list UpCard_X_Y_ = [-297, 180];
list DEBUG_LOG;
list Text_text__6__;


target "Main";

costumes "14e46ec3e2ba471c2adfe8f119052307.svg" as "empty", "ecc7fb49285bd08e02ad217c16d29420.svg" as "full", "1702dd3281c681039ac9fd5515af3f0b.svg" as "map//fight", "36d4348deee82ff5339dddb4eacf81ae.svg" as "map//spring", "af7bf1b8251feb62e751a63b83b51ed8.svg" as "map//reward", "0b7c7127c2a0b88dcc2e9e0c82a46443.svg" as "map//choose", "7be267ccbbfd1a3eb275e7af80b4ba62.svg" as "box//empty", "39be340384d3d42e87a058474c4aeaa0.svg" as "box//player", "e6520ed3d757e5b97b3b262d43cbf394.svg" as "box//sisters", "05bbcbae05fbbc0091ed720ef513a674.svg" as "box//sisters2", "efffae28616ed4a74128cd42bb8c5cbe.svg" as "box//boss", "af06fb2ff07a97f21b134df22758a635.svg" as "box//alice", "0490f097d5f27e06af5899db28a5b905.svg" as "box//szilassi", "183f6248b67d9867aba178b089dea9a2.svg" as "main//0", "9013fe74d8262d12a9b45d2da7d385c3.svg" as "main//1", "5995a7fbbff18ce4112e1ca2340b0f28.svg" as "main//2", "6abf8628427db52abaa32e9fd49244e6.svg" as "main//3", "93a7eb93f5cad314e62441304a4a54e5.svg" as "main//mainpre", "43c0f7be73ce0ad963312051b33149e7.svg" as "main//pre1", "7623cd63497ce9958a402454c3213740.svg" as "main//pre2", "18f6ef9483f71a7162f64c6c72ef2889.svg" as "background", "a8f1750801cf3e48db920c2b4c46459d.svg" as "mainbg//short", "367cd61e3eac0454e1143dbde031fd79.svg" as "mainbg//normal", "d72cea573ae31e017c047de6f881ea35.svg" as "intro";
sounds "f72c43d4688ea755266fa5a9f0f5c064.wav" as "A", "22a86a5d279b59496809e1f2b876d617.wav" as "C#", "2dfd6b64a7da1f56cbebd47c2803b003.wav" as "E", "ae1aa07c8d47c66a174cd51d7c307b0a.wav" as "Au", "40594b1688c120cf39d6ca62bc7e48f2.wav" as "G";
var temp_LoadMap = 39;
var mapForceX = 39;
var mapForceY = 38;
var return_Distance = 602.9230464993025;
var temp_MapForceTry = 39;
set_x 260;
set_y -145;
hide;

proc MapAddPoint name, outlook, condition {
    add $name to MapPoint_7_;
    add random(-2, 2) to MapPoint_7_;
    add random(-2, 2) to MapPoint_7_;
    add "0" to MapPoint_7_;
    add "0" to MapPoint_7_;
    add $outlook to MapPoint_7_;
    add $condition to MapPoint_7_;
    __ "仅适配此游戏 不完善";
    if ("S" in $name) {
    } else {
        if ("R" in $name) {
            MapAddLink ((letter_of(1, $name) & "-") & letter_of(3, $name)), $name;
        } else {
            if (not (letter_of((length $name), $name) == "1")) {
                MapAddLink "", $name;
            }
        }
    }
}

nowarp proc GameControl _Point {
    PlayLevelStory $_Point;
    SetGameDetail $_Point;
    if ((DebugMode == "1") and (key_pressed("d") or key_pressed("x"))) {
        IsFinish_ = "1";
        Main = "map";
    } else {
        IsFinish_ = "0";
        Main = "game";
    }
}

proc MapAddLink eleID1, eleID2 {
    add (((item_num($eleID1, MapPoint_7_) - 1) / 7) + 1) to MapLink;
    add (((item_num($eleID2, MapPoint_7_) - 1) / 7) + 1) to MapLink;
}

proc DivideString str, char {
    delete return_DivideString;
    add "" to return_DivideString;
    temp_DivideString = "0";
    repeat (length $str) {
        temp_DivideString++;
        if (letter_of(temp_DivideString, $str) == $char) {
            add "" to return_DivideString;
        } else {
            return_DivideString[length return_DivideString] = (return_DivideString[length return_DivideString] & letter_of(temp_DivideString, $str));
        }
    }
}

proc LoadMap {
    delete MapPointToPoint_Square_;
    delete MapCamera__cur__target___x_y_size__;
    repeat 5 {
        add "0" to MapCamera__cur__target___x_y_size__;
    }
    add "10" to MapCamera__cur__target___x_y_size__;
    temp_LoadMap = "0";
    repeat ((length MapPoint_7_ / 7) * (length MapPoint_7_ / 7)) {
        temp_LoadMap++;
        if ((temp_LoadMap - 1) == ((floor ((temp_LoadMap - 1) / (length MapPoint_7_ / 7))) * ((length MapPoint_7_ / 7) + 1))) {
            add "Self" to MapPointToPoint_Square_;
        } else {
            add "Unconnected" to MapPointToPoint_Square_;
        }
    }
    temp_LoadMap = "0";
    repeat (length MapLink / 2) {
        temp_LoadMap++;
        mapForceX = MapLink[(((temp_LoadMap - 1) * 2) + 1)];
        mapForceY = MapLink[(((temp_LoadMap - 1) * 2) + 2)];
        MapPointToPoint_Square_[(((mapForceX - 1) * (length MapPoint_7_ / 7)) + mapForceY)] = "Connected";
        MapPointToPoint_Square_[(((mapForceY - 1) * (length MapPoint_7_ / 7)) + mapForceX)] = "Connected";
    }
}

proc MapForceTry A, B, C {
    MapCamera__cur__target___x_y_size__[1] = (MapCamera__cur__target___x_y_size__[1] + ((MapCamera__cur__target___x_y_size__[4] - MapCamera__cur__target___x_y_size__[1]) / 5));
    MapCamera__cur__target___x_y_size__[2] = (MapCamera__cur__target___x_y_size__[2] + ((MapCamera__cur__target___x_y_size__[5] - MapCamera__cur__target___x_y_size__[2]) / 5));
    MapCamera__cur__target___x_y_size__[3] = (MapCamera__cur__target___x_y_size__[3] + ((MapCamera__cur__target___x_y_size__[6] - MapCamera__cur__target___x_y_size__[3]) / 5));
    MapCamera__cur__target___x_y_size__[4] = MapPoint_7_[(((MapCur - 1) * 7) + 2)];
    MapCamera__cur__target___x_y_size__[5] = MapPoint_7_[(((MapCur - 1) * 7) + 3)];
    temp_MapForceTry = "0";
    TouchedPoint = "0";
    repeat (length MapPoint_7_ / 7) {
        temp_MapForceTry++;
        Distance ((MapPoint_7_[(((temp_MapForceTry - 1) * 7) + 2)] - MapCamera__cur__target___x_y_size__[1]) * MapCamera__cur__target___x_y_size__[3]), ((MapPoint_7_[(((temp_MapForceTry - 1) * 7) + 3)] - MapCamera__cur__target___x_y_size__[2]) * MapCamera__cur__target___x_y_size__[3]), mouse_x(), mouse_y();
        if (return_Distance < (MapCamera__cur__target___x_y_size__[3] * 5)) {
            TouchedPoint = temp_MapForceTry;
        }
    }
}

proc CheckMap {
    __ "这里需要注意：升级卡牌可以退出，isfinish不一定完成，需要添加";
    Main = "map";
    if (IsFinish_ == "1") {
        MapPoint_7_[(((MapCur - 1) * 7) + 7)] = "finish";
        temp_CheckMap = ((MapCur - 1) * (length MapPoint_7_ / 7));
        repeat (length MapPoint_7_ / 7) {
            temp_CheckMap++;
            if (MapPointToPoint_Square_[temp_CheckMap] == "Connected") {
                if (MapPoint_7_[((((temp_CheckMap - ((MapCur - 1) * (length MapPoint_7_ / 7))) - 1) * 7) + 7)] == "invisible") {
                    MapPoint_7_[((((temp_CheckMap - ((MapCur - 1) * (length MapPoint_7_ / 7))) - 1) * 7) + 7)] = "visible";
                }
            }
        }
    } else {
    }
}

onflag {
    Main = "intro";
    SwitchMain = "0";
    hide;
    switch_backdrop "black";
    CLOUD_CODE = "0";
    broadcast "LOAD CLOUD";
    cloneType = "background";
    clone "_myself_";
    cloneType = "intro";
    clone "_myself_";
    wait_until (Main == "main");
    cloneType = "mainbg";
    clone "_myself_";
    cloneType = "mainbutton";
    cloneID = "0";
    repeat 3 {
        cloneID++;
        clone "_myself_";
    }
}

nowarp proc wait_fps fps {
    repeat $fps {
        wait 0;
    }
}

onflag {
    wait_until (Main == "intro");
    forever {
        wait_until (Main == "prestart");
        cloneType = "prestart";
        cloneID = "0";
        repeat 3 {
            cloneID++;
            clone "_myself_";
        }
        wait_until (not (Main == "prestart"));
    }
}

onflag {
    wait_until (Main == "intro");
    forever {
        wait_until (Main == "map");
        MainInit_DecodeCloud;
        until (Main == "main") {
            until (mouse_down() or (Main == "main")) {
                MapForceTry "", "", "";
            }
            if mouse_down() {
                wait_until (not mouse_down());
                MapForceTry "", "", "";
                if (Main == "map") {
                    if (MapCur == TouchedPoint) {
                        SwitchMain = "1";
                        wait 0.5;
                        GameControl MapPoint_7_[(((MapCur - 1) * 7) + 1)];
                        wait_until (Main == "map");
                        SwitchMain = "1";
                        wait 0.5;
                        CheckMap;
                        cloneMap;
                    } else {
                        if ((MapPoint_7_[(((TouchedPoint - 1) * 7) + 7)] == "visible") and (MapPointToPoint_Square_[(((MapCur - 1) * (length MapPoint_7_ / 7)) + TouchedPoint)] == "Connected")) {
                            MapCur = TouchedPoint;
                        }
                    }
                }
            }
        }
    }
}

onclone {
    forever {
        wait_until (touching_mouse_pointer() and mouse_down());
        wait_until (not mouse_down());
        if touching_mouse_pointer() {
            if (cloneType == "mainbutton") {
                if (Main == "main") {
                    if (cloneID == "1") {
                        if (CLOUD_CODE == "0") {
                            SwitchMain = "1";
                            Main = "map";
                        } else {
                            Main = "prestart";
                        }
                    }
                    if (cloneID == "2") {
                        if (CLOUD_CODE == "0") {
                        } else {
                            SwitchMain = "1";
                            Main = "map";
                        }
                    }
                    if (cloneID == "3") {
                        Main = "settings";
                    }
                }
            }
            if (cloneType == "prestart") {
                if (Main == "prestart") {
                    if (cloneID == "2") {
                        Main = "main";
                    }
                    if (cloneID == "3") {
                        SwitchMain = "1";
                        Main = "map";
                    }
                }
            }
        }
    }
}

onclone {
    if (cloneType == "mainbutton") {
        wait_until (not ((Main == "prestart") or (Main == "main")));
        repeat 10 {
            change_ghost_effect 10;
        }
        delete_this_clone;
    }
    if (cloneType == "prestart") {
        wait_until (not (Main == "prestart"));
        repeat 10 {
            change_ghost_effect 10;
            MoveOut x_position(), y_position(), (size() + -9), costume_name();
        }
        delete_this_clone;
    }
}

proc MoveOut x, y, size, name {
    switch_costume "full";
    goto $x, $y;
    if ($size > "100") {
        switch_costume "empty";
    } else {
        switch_costume "full";
    }
    set_size $size;
    switch_costume $name;
}

proc AddText text, x, y, size, color, _ln, shake {
    add $text to Text_text__6__;
    add $x to Text_text__6__;
    add $y to Text_text__6__;
    add $size to Text_text__6__;
    add $color to Text_text__6__;
    add $_ln to Text_text__6__;
    add $shake to Text_text__6__;
}

proc __ number_or_text {
}

nowarp proc WaitMouse {
    wait_until mouse_down();
    wait_until (not mouse_down());
}

nowarp proc WaitChoice {
    storyChoice = "0";
    until (storyChoice > "0") {
        if (key_pressed("1") or key_pressed("a")) {
            storyChoice = "1";
        } else {
            if (key_pressed("2") or key_pressed("b")) {
                storyChoice = "2";
            } else {
                if mouse_down() {
                    if (mouse_x() < "0") {
                        storyChoice = "1";
                    } else {
                        storyChoice = "2";
                    }
                    wait_until (not mouse_down());
                }
            }
        }
    }
}

proc ShowDialog costume {
    showDialog = "0";
    dialogCostume = $costume;
    showDialog = "1";
    cloneType = "dialog";
    clone "_myself_";
}

onkey "d" {
    if ((DebugMode == "1") and (Main == "game")) {
        IsFinish_ = "1";
        Main = "map";
    }
}

proc Distance x1, y1, x2, y2 {
    return_Distance = (sqrt ((($x1 - $x2) * ($x1 - $x2)) + (($y1 - $y2) * ($y1 - $y2))));
}

onclone {
    if (cloneType == "map") {
        hide;
        clear_graphic_effects;
        if (MapPoint_7_[(((cloneID - 1) * 7) + 7)] == "visible") {
            show;
        }
        if (MapPoint_7_[(((cloneID - 1) * 7) + 7)] == "finish") {
            set_brightness_effect -20;
            show;
        }
        until (not (Main == "map")) {
            MoveOut ((MapPoint_7_[(((cloneID - 1) * 7) + 2)] - MapCamera__cur__target___x_y_size__[1]) * MapCamera__cur__target___x_y_size__[3]), ((MapPoint_7_[(((cloneID - 1) * 7) + 3)] - MapCamera__cur__target___x_y_size__[2]) * MapCamera__cur__target___x_y_size__[3]), (6 * MapCamera__cur__target___x_y_size__[3]), ("map//" & MapPoint_7_[(((cloneID - 1) * 7) + 6)]);
        }
        delete_this_clone;
    }
    if (cloneType == "mapchoose") {
        show;
        set_brightness_effect -20;
        set_size (6 * MapCamera__cur__target___x_y_size__[3]);
        until (not (Main == "map")) {
            change_size ((((6 + (3 * (MapCur == TouchedPoint))) * MapCamera__cur__target___x_y_size__[3]) - size()) / 3);
            MoveOut ((MapPoint_7_[(((MapCur - 1) * 7) + 2)] - MapCamera__cur__target___x_y_size__[1]) * MapCamera__cur__target___x_y_size__[3]), ((MapPoint_7_[(((MapCur - 1) * 7) + 3)] - MapCamera__cur__target___x_y_size__[2]) * MapCamera__cur__target___x_y_size__[3]), size(), "map//choose";
        }
        delete_this_clone;
    }
}

onclone {
    __ "循环效果";
    if (cloneType == "mainbg") {
        until ((Main == "map") or (Main == "game")) {
            MoveOut (mouse_x() / -40), (mouse_y() / -40), "105", costume_name();
        }
        delete_this_clone;
    }
    if (cloneType == "mainbutton") {
        until ((Main == "map") or (Main == "game")) {
            set_brightness_effect ((50 * touching_mouse_pointer()) * ((not (cloneID == "2")) or (not (CLOUD_CODE == "0"))));
        }
        delete_this_clone;
    }
    if (cloneType == "prestart") {
        until ((Main == "map") or (Main == "game")) {
            set_brightness_effect ((50 * touching_mouse_pointer()) * (not (cloneID == "1")));
        }
        delete_this_clone;
    }
}

onkey "x" {
    if ((DebugMode == "1") and (Main == "game")) {
        IsFinish_ = "1";
        Main = "map";
    }
}

proc HideDialog {
    showDialog = "0";
}

nowarp proc PlayLevelStory level {
    if ($level == "0-1") {
        ShowDialog "box//empty";
        AddText "【第一幕：钟楼广场】~", "-200", "-95", "24", "ffffff", "20", "0";
        WaitMouse;
        AddText "永恒之日的钟声在城市上空回荡……~", "-200", "-95", "22", "ffffff", "20", "0";
        WaitMouse;
        AddText "城内的异能波动已将前方的人化为了怪物。~", "-200", "-95", "22", "ffffff", "20", "0";
        WaitMouse;
        ShowDialog "box//player";
        AddText "抉择：[1] 亮出卡牌迎击   [2] 寻找掩体观察~", "-200", "-95", "20", "ffffff", "20", "0";
        WaitChoice;
        if (storyChoice == "1") {
            AddText "你握紧了最初的卡牌，战意涌动！~", "-200", "-95", "20", "ffffff", "20", "0";
            WaitMouse;
        } else {
            AddText "你冷静观察，锁定了对方行动的破绽。~", "-200", "-95", "20", "ffffff", "20", "0";
            WaitMouse;
        }
        HideDialog;
    }
    if ($level == "1-4") {
        ShowDialog "box//empty";
        AddText "【事件：遗落的发卡】~", "-200", "-95", "24", "ffffff", "20", "0";
        WaitMouse;
        AddText "橱窗里静静躺着一枚发卡，和妹妹照片里戴的一模一样……~", "-200", "-95", "20", "ffffff", "20", "0";
        WaitMouse;
        ShowDialog "box//player";
        AddText "抉择：[1] 取走发卡   [2] 留在原处~", "-200", "-95", "20", "ffffff", "20", "0";
        WaitChoice;
        if (storyChoice == "1") {
            AddText "你收起发卡，隐隐感受到了与妹妹的共鸣。~", "-200", "-95", "20", "ffffff", "20", "0";
            WaitMouse;
        } else {
            AddText "你将它留在原处，心中的信念愈发坚定（本格生命+10）！~", "-200", "-95", "20", "ffffff", "20", "0";
            PlayerHP = (PlayerHP + "10");
            WaitMouse;
        }
        HideDialog;
    }
}

onkey "0" {
    DebugMode = (1 - DebugMode);
}

proc cloneMap {
    cloneType = "map";
    cloneID = "0";
    __ "MapPoint[name,x,y,vx,vy,outlook,condition]";
    repeat (length MapPoint_7_ / 7) {
        cloneID++;
        clone "_myself_";
    }
    cloneType = "mapchoose";
    clone "_myself_";
}

onclone {
    if (cloneType == "background") {
        MoveOut "0", "0", "100", "background";
        clear_graphic_effects;
        hide;
        forever {
            wait_until (SwitchMain == "1");
            set_ghost_effect 100;
            goto_front;
            show;
            repeat 10 {
                change_ghost_effect -10;
            }
            if (Main == "map") {
                switch_backdrop "mapbg";
            } else {
                switch_backdrop "black";
            }
            SwitchMain = "0";
            repeat 10 {
                change_ghost_effect 10;
            }
            hide;
        }
    }
    if (cloneType == "intro") {
        switch_costume "intro";
        goto 0, 0;
        set_size 100;
        clear_graphic_effects;
        set_ghost_effect 100;
        show;
        repeat 100 {
            change_ghost_effect -1;
        }
        AddText "最终我还是同意了他的交易~", (40 - _SYSTEMbgX), "0", "30", "102020", ((_SYSTEMbgX - 20) / 15), "0";
        WaitMouse;
        AddText "001010101111111111111111000000~", (40 - _SYSTEMbgX), "0", "30", "102020", ((_SYSTEMbgX - 20) / 15), "0";
        WaitMouse;
        AddText "001010101111111111111111000000~", (40 - _SYSTEMbgX), "0", "30", "102020", ((_SYSTEMbgX - 20) / 15), "0";
        WaitMouse;
        AddText "欢迎来到 永恒之日~", (40 - _SYSTEMbgX), "0", "30", "102020", ((_SYSTEMbgX - 20) / 15), "0";
        WaitMouse;
        wait_fps "30";
        repeat 2 {
            set_brightness_effect 100;
            wait_fps random(2, 4);
            set_brightness_effect 0;
            wait_fps "5";
        }
        repeat 100 {
            change_ghost_effect 1;
        }
        Main = "main";
    }
    if (cloneType == "mainbg") {
        set_ghost_effect 100;
        if (_SYSTEMbgX < "300") {
            MoveOut "", "", "105", "mainbg//short";
        } else {
            MoveOut "", "", "105", "mainbg//normal";
        }
        show;
        repeat 100 {
            change_ghost_effect -1;
        }
    }
    if (cloneType == "mainbutton") {
        set_ghost_effect 100;
        MoveOut (_SYSTEMbgX - 60), (-40 - (35 * cloneID)), "100", ("main//" & cloneID);
        show;
        repeat (50 + (50 * ((not (cloneID == "2")) or (not (CLOUD_CODE == "0"))))) {
            change_ghost_effect -1;
        }
    }
    if (cloneType == "prestart") {
        if (cloneID == "1") {
            set_ghost_effect 100;
            show;
            MoveOut "", "", "10", "main//mainpre";
            repeat 10 {
                change_ghost_effect -10;
                MoveOut "", "", (size() + 9), "main//mainpre";
            }
        }
        if (cloneID == "2") {
            set_ghost_effect 100;
            wait_fps "5";
            show;
            MoveOut "-70", "-70", "100", "main//pre1";
            repeat 10 {
                change_ghost_effect -80;
            }
        }
        if (cloneID == "3") {
            set_ghost_effect 100;
            wait_fps "5";
            show;
            MoveOut "70", "-70", "100", "main//pre2";
            repeat 10 {
                change_ghost_effect -80;
            }
        }
    }
}

proc SetGameDetail level {
    GameDetail = "/焦躁的食客/巡逻者/焦躁的食客/";
    if ($level == "0-1") {
        GameDetail = "//巡逻者//";
    }
    if ($level == "1-1") {
        GameDetail = "/焦躁的食客/巡逻者/焦躁的食客/";
    }
    if ($level == "1-2") {
        GameDetail = "/焦躁的食客//焦躁的食客/";
    }
    if ($level == "1-3") {
        GameDetail = "/电蜂/电蜂/电蜂/";
    }
    if ($level == "1-4") {
        GameDetail = "//巡逻者//";
    }
    if ($level == "1-5") {
        GameDetail = "/电蜂/电蜂巢穴/电蜂/";
    }
    if ($level == "1-6") {
        GameDetail = "/巡逻者//电蜂/";
    }
    if ($level == "1-7") {
        GameDetail = "//钟楼守护者//";
    }
    if ($level == "1-1R") {
        GameDetail = "//焦躁的食客//";
    }
    if ($level == "1-2R") {
        GameDetail = "//焦躁的食客//";
    }
    if ($level == "1-3R") {
        GameDetail = "//焦躁的食客//";
    }
    if ($level == "1-5R") {
        GameDetail = "//焦躁的食客//";
    }
    if ($level == "1-6R1") {
        GameDetail = "//焦躁的食客//";
    }
    if ($level == "1-6R2") {
        GameDetail = "//焦躁的食客//";
    }
    if ($level == "2-1") {
        GameDetail = "//镜中的双生子//";
    }
    if ($level == "2-2") {
        GameDetail = "/躁动的书//躁动的书/";
    }
    if ($level == "2-3") {
        GameDetail = "//审判官//";
    }
    if ($level == "2-4") {
        GameDetail = "/躁动的书/审判官/躁动的书/";
    }
    if ($level == "2-5") {
        GameDetail = "//爱丽丝//";
    }
    if ($level == "2-6") {
        GameDetail = "/躁动的书/躁动的书/躁动的书/";
    }
    if ($level == "2-7") {
        GameDetail = "/躁动的书//躁动的书/";
    }
    if ($level == "2-8") {
        GameDetail = "//历史之眼//";
    }
    if ($level == "3-1") {
        GameDetail = "//钟摆//";
    }
    if ($level == "3-2") {
        GameDetail = "//先驱者//";
    }
    if ($level == "3-3") {
        GameDetail = "/痛苦的灵魂/愤怒的灵魂/孤独的灵魂/";
    }
    if ($level == "3-4") {
        GameDetail = "//永生的灵魂//";
    }
    if ($level == "A-1") {
        GameDetail = "/嗜血者/嗜血者/嗜血者/";
    }
    if ($level == "A-2") {
        GameDetail = "/嗜血者//机械巡逻者/";
    }
    if ($level == "A-3") {
        GameDetail = "/机械巡逻者//机械巡逻者/";
    }
    if ($level == "B-1") {
        GameDetail = "/回响者/回响者/回响者/";
    }
    if ($level == "B-2") {
        GameDetail = "/回响者//焦躁时钟/";
    }
    if ($level == "B-3") {
        GameDetail = "//希萝茜//";
    }
    if ($level == "4-1") {
        GameDetail = "//吞噬者//";
    }
    if ($level == "4-2") {
        GameDetail = "//恶意实质//";
    }
    if ($level == "4-3") {
        GameDetail = "/实验残体//意识屏障/";
    }
    if ($level == "4-4") {
        GameDetail = "/恶意实质//恶意/";
    }
    if ($level == "5-1") {
        GameDetail = "//妹妹？//";
    }
    if ($level == "5-2") {
        GameDetail = "//妹妹？//";
    }
    if ($level == "5-3") {
        GameDetail = "//妹妹？//";
    }
    if ($level == "5-4") {
        GameDetail = "//世界规则残片//";
    }
}

proc MapInit {
    __ "点击会出现波纹，再点一下出现";
    __ "R：奖励";
    __ "condition类型：visible：解锁没点过；invisible：未解锁；struct：仅用于支撑结构；finish：已通过；hide：路线不同半虚化";
    delete MapPoint_7_;
    delete MapLink;
    MapAddPoint "0-1", "fight", "visible";
    MapCur = "1";
    temp_MapInit = "0";
    repeat 6 {
        temp_MapInit++;
        MapAddPoint ("1-" & temp_MapInit), "fight", "invisible";
    }
    temp_MapInit = "0";
    repeat 8 {
        temp_MapInit++;
        MapAddPoint ("2-" & temp_MapInit), "fight", "invisible";
    }
    temp_MapInit = "0";
    repeat 4 {
        temp_MapInit++;
        MapAddPoint ("3-" & temp_MapInit), "fight", "invisible";
    }
    temp_MapInit = "0";
    repeat 3 {
        temp_MapInit++;
        MapAddPoint ("A-" & temp_MapInit), "fight", "invisible";
    }
    temp_MapInit = "0";
    repeat 3 {
        temp_MapInit++;
        MapAddPoint ("B-" & temp_MapInit), "fight", "invisible";
    }
    temp_MapInit = "0";
    repeat 4 {
        temp_MapInit++;
        MapAddPoint ("4-" & temp_MapInit), "fight", "invisible";
    }
    temp_MapInit = "0";
    repeat 4 {
        temp_MapInit++;
        MapAddPoint ("5-" & temp_MapInit), "spring", "invisible";
    }
    MapAddPoint "1-1R", "reward", "invisible";
    MapAddPoint "1-2R", "reward", "invisible";
    MapAddPoint "1-3R", "reward", "invisible";
    MapAddPoint "1-5R", "reward", "invisible";
    MapAddPoint "1-6R1", "reward", "invisible";
    MapAddPoint "1-6R2", "reward", "invisible";
    MapAddLink "0-1", "1-1";
    MapAddLink "1-6", "2-1";
    MapAddLink "2-8", "3-1";
    MapAddLink "3-4", "A-1";
    MapAddLink "3-4", "B-1";
    MapAddLink "A-3", "4-1";
    MapAddLink "B-3", "4-1";
    MapAddLink "4-4", "5-1";
}

proc MainInit_DecodeCloud {
    Main = "map";
    cloneMap;
}

onclone {
    if ((cloneType == "map") or (cloneType == "mapchoose")) {
        set_ghost_effect 100;
        repeat 10 {
            change_ghost_effect -10;
        }
        wait_until (SwitchMain == "1");
        repeat 10 {
            change_ghost_effect 10;
        }
        delete_this_clone;
    }
}


target "Card";

costumes "22e0b970a524751555da488c4cc8155e.svg" as "inhand//电蜂", "00ec1de1dd380b43ae60382b712346c4.svg" as "inhand//电蜂巢", "dcd4d1d23fca234066980c82c2c4e371.svg" as "inhand//守卫", "5383809801a32454d1fd930b8531fe24.svg" as "inhand//石壁", "4efbb4b5018e3f7702b4372d6e062a6e.svg" as "inhand//爱丽丝", "35fdee08a7173e8f7c21e7cd38d196e6.svg" as "inhand//凝聚器", "76eadaa6c12664b947991d1128e777c0.svg" as "inhand//孤独的灵魂", "cd21e73522946ba7f8ba1dabca106399.svg" as "inhand//愤怒的灵魂", "ca72edd80a0d278225d3c2ad40664f63.svg" as "inhand//永生的灵魂", "b71ca2c40fbab9adacb1756a19b89f30.svg" as "inhand//痛苦的灵魂", "92b7b74f8310de45a292ae4d212abd7e.svg" as "inhand//null", "6a39d81180dd910e8cb625ea5a71e39a.svg" as "inhand//null2", "747740b711c5ec5c9610106d4e936045.svg" as "inhand//炸弹", "73e779c185c77527df6c7c13a2b81b8e.svg" as "inhand//能量棒", "f2e44b84b29e888af47496e44e61e945.svg" as "inhand//A的本格", "5a6d6a3552061db9ce949fcdab0a5c28.svg" as "inhand//A的XX", "36a88d34597f15152bab78c3f7320436.svg" as "inhand//Alpha", "d4b783a774cfb4bcdf50e21afda3bd04.svg" as "inhand//样例", "33103efa807b08ef8ae71b48fb5904f7.svg" as "inhand//样例2", "069386f3f2806dc66a963e53cfe44bfe.svg" as "inhand//橡皮1", "a630cd8a9ca6858183cedefebb3cab34.svg" as "inhand//混沌1", "083824992bdb15ce4b1c774cb37a9564.svg" as "inhand//樱莲1", "4be1bc41f0b5284de8a390944a71c23f.svg" as "inhand//西药1", "e29ac9e17b1e6e381d72f15f642f5165.svg" as "inhand//西药2", "143b9d54ff8e365a0cb855808caab73d.svg" as "inhand//西药3", "a7d3aee3f1751a6d712f531f307cc26e.svg" as "inhand//芙楠1", "5c0f88c0f5af2e32f074ee5e849ed7ea.svg" as "inhand//晨曦1", "fb0d7b1888546f5b4f0227fec2262452.svg" as "inhand//晨曦2", "2fd510cba59611aad0335d3ca3a1ea0d.svg" as "inhand//晨曦3", "9dd4eabe5ce400a4540d307ef26480b8.svg" as "inhand//回声1", "3e07756217eb246b59abc6ed1f298fe2.svg" as "inhand//极夜1", "cc4b06fad53300031e53a69f5cb12f52.svg" as "inhand//瑞比1", "54ad54510a95a8692d5e0af7401cdfdf.svg" as "inhand//丹尼1", "8823d21d4a5724125c205a9b7d331faf.svg" as "inhand//小桃1", "e9ee51b2454897945c5d411b960fe89f.svg" as "inhand//塔塔1", "ec65cd2a32349cee0aee7006497fe181.svg" as "inhand//安然1", "6f4c51c38fdb4021dc53f45149272d58.svg" as "inhand//皮尔1", "3c35bb9188233d8032c3cdcb9b16c09f.svg" as "inhand//华安1", "118875f59586460da29c1f2a2bfdb365.svg" as "inhand//尾兜1", "4c7ffbd6aae0497b2a291f870a885f33.svg" as "inhand//AChy1", "63a1f2e2ebf9b0dbe6a95f8fd000f400.svg" as "inhand//云落1", "5eda63b1aeb47714a2495c1d54305f16.svg" as "inhand//冰火1", "2b364ed5f80c2e309d99caafb083a165.svg" as "inhand//涵影1", "9870e65ed0008fce4046924d9ffe1c12.svg" as "inhand//米花1", "17d57e72c1f7f64356468f94648912cc.svg" as "inhand//冰泉1", "671e4f25a34bc96d517230f3539653ad.svg" as "inhand//星空1", "650c10197d92826ba254ef0473b857b4.svg" as "inhand//Christina1", "d22a548e2f44a53015d2eb4a526b8051.svg" as "inhand//Cendy1", "71fc1de3959cd27401eab146240f7ce2.svg" as "inhand//Candace1", "2e81901988a1dc867aefd51f24fff9ec.svg" as "inhand//Clara1", "65c19342fae3be5be30ee5dc6f8f3469.svg" as "inhand//Caitlan1", "e4b9d0f8f28d6794d210d82aa8fdf47f.svg" as "inhand//Caitlin1", "2f8b40845f3a2600d88a629099abf095.svg" as "inhand//意识集合1", "91e660145d34666c6e9daf54745cfbe0.svg" as "player", "a970d63a272e42c8e9a85e1b10cf59a3.svg" as "hint//无牌可出", "f04cce8cc67b8417915495c2cd28fdb5.svg" as "buff//focus", "f48f55d4e5bfe0b4f5c95004d7b47edf.svg" as "buff//energy", "7567f0f3e7d846456ab095dbbd268fd2.svg" as "buff//defence", "df5b198fd19436b0509fdf0040e959dd.svg" as "number//+", "83856fb3afe11a155f8ead737cc203af.svg" as "number//-", "0ab822e52c2af699e97b28f467780287.svg" as "number//1", "17c7c048baa46302ac5fe6f125ec8d78.svg" as "number//2", "e74affd7c6ce7ec96dbecbfee2c9afe4.svg" as "number//3", "5c47d4390e327758bfb272d66f2968e3.svg" as "number//4", "fc4ed6226c349508638f1af63f3786a4.svg" as "number//5", "d35f18aee0ab378bce02089d257fd0c4.svg" as "number//6", "969a866d9f4607a11dad386bcff5ab19.svg" as "number//7", "851a20a5cc20d23a1a037bf52ffa6c2e.svg" as "number//8", "064fa393b299012d62ea9fe36aa69e41.svg" as "number//9", "261989d4b25c0c369304ea42d3583aa3.svg" as "number//0", "588dbf22fcaced8667adb655d20caecf.svg" as "stage//background", "588dbf22fcaced8667adb655d20caecf.svg" as "stage//background2", "588dbf22fcaced8667adb655d20caecf.svg" as "stage//background3", "91f7c46de4fa08a09a86430777a4400e.svg" as "next_f", "893aed10d7a526c1ea87eab8fad5752e.svg" as "back", "cd21514d0531fdffb22204e0ec5ed84a.svg" as "empty", "ae5b2e711979769e1115819a2587720e.svg" as "full", "c60f250f96e3193288bd31fa2b51704f.svg" as "next//off", "7185b8337f4824e1d5bd87099a67b5df.svg" as "next//on", "172c43c964532c1ca8e8280f118b3d9f.svg" as "enhance//damage", "f0b49db24cd25360be948dcb844b01b2.svg" as "enhance//energy", "398b0e0f65a08d1419b4d1fbdce25c37.svg" as "enhance//hp";
var temp1 = 158.33333333333334;
var pos_x = -12.961291060458587;
var pos_y = -100.28983745439339;
var anime_switch_progress = 0;
var cardAngle = -0.0000862824969061805;
var rem_Condition = 0;
var ghost = 100;
var temp_x = 0;
var temp_y = 0;
var return_CardCheck = 1;
var cloneType = "putCard//energyNum";
var cloneID = 9;
var temp_CardPosition = 0;
var tempConst_CardNumMove = 0;
var cloneXID = 3;
var temp_CloneStage = 10;
var temp_setSize = "inhand//西药2";
var temp_DetectChosenCardX = 0;
var temp_DetectChosenCardY = 18.965574988848577;
var temp_DetectStageX = 0;
var temp_DetectStageY = 0;
var temp_PutCardSize = 80;
var return_PutStageCheck = 0;
var return_cardType = 15;
var temp_CardAction = 10;
var temp_Start = 45;
var temp_runCardNow = 0;
var temp_CardActionEnergyExplode = 0;
var temp_CardActionAvailable = 0;
var temp_CardActionReflect = 0;
var temp_CardActionSum = 0;
var temp_CardActionTemp = 0;
var temp_CardActionBreak = 0;
var temp_moveto = "inhand//西药2";
var stageLighten = 0;
var temp_DivideString = 7;
var cloneBrightness = 0;
var cloneGhost = 0;
var emptyEnemySlot = 0;
var targetSlotId = 0;
var enemyEnergy = 0;
var enemyDamage = 0;
var enemyHp = 0;
var enemyTargetHp = 0;
var totalPlayerAtk = 0;
list return_CardPosition_x_y_face_ = [-0.00045177, -100.00000000000006, -270.00010785214295];
list temp_CardActionList = [7, 8, 9];
list return_DivideString = ["", "", "巡逻者", "", ""];
set_size 80;
hide;

proc DetectChosenCard__SpreadAngle_clockwise_between angel1, angel2 {
    temp_DetectChosenCardX = ($angel1 % 360);
    if (temp_DetectChosenCardX > ($angel2 % 360)) {
        _return = (360 - temp_DetectChosenCardX);
        temp_DetectChosenCardX = "0";
    } else {
        _return = "0";
    }
    _return += (($angel2 % 360) - temp_DetectChosenCardX);
}

proc DetectEnhanceCard {
    temp_DetectStageX = (mouse_x() + Camera_X);
    temp_DetectStageY = (mouse_y() + Camera_Y);
    if (((temp_DetectStageX < "-150") or (temp_DetectStageX > "150")) or ((temp_DetectStageY < "20") or (temp_DetectStageY > "160"))) {
        CurrentStagecard = "0";
    } else {
        CurrentStagecard = ((round (temp_DetectStageX / 100)) + 2);
    }
}

proc Camera x, y {
    Camera_X += (($x - Camera_X) / 4);
    Camera_Y += (($y - Camera_Y) / 4);
}

orphan {
    ___2 "我有一个命名方面的建议  ";
    ___2 "公共变量名首字母大写";
    ___2 "私有变量名首字母小写";
    ___2 "我增加了一部分choose.card相关的运算以及坐标运算";
    ___2 "还有👆一些简单的方法(见上)，目前只用于上两者 ";
    ___2 "预留了Camera X/Y(以及pos x pos y) 我觉得一定会被用到";
    ___2 " 新开了一个temp2,return 以及一些常数类的变量👇";
    Card_BaseLine_y = "-100";
    temp1 = (size() / 100);
    CardHitbox_halfHeight = (95 * temp1);
    CardHitbox_halfWidth = (65 * temp1);
}

proc __Spread_Angle_between angel1, angel2 {
    temp1 = (($angel2 % 360) - ($angel1 % 360));
    if ((abs temp1) > "180") {
        if (temp1 < "0") {
            temp1 = (-1 * temp1);
        }
        _return = (360 - temp1);
    } else {
        _return = temp1;
    }
}

proc __rotate__ x, y, _ {
    temp_x = (($x * (sin $_)) - ($y * (cos $_)));
    temp_y = (($x * (cos $_)) + ($y * (sin $_)));
}

proc AddCardList name, type, p1, p2, p3 {
    add $name to _CardList_name_type__3__;
    add $type to _CardList_name_type__3__;
    add $p1 to _CardList_name_type__3__;
    add $p2 to _CardList_name_type__3__;
    add $p3 to _CardList_name_type__3__;
}

proc DebugTest {
    delete PossessCard_name_lv_damage_hp_e_;
    AddPossessCard "炸弹", "", "", "", "";
    AddPossessCard "能量棒", "", "", "", "5";
    AddPossessCard "Alpha", "", "3", "20", "";
    AddPossessCard "橡皮", "1", "2", "50", "155";
    AddPossessCard "混沌", "1", "5", "50", "23";
    AddPossessCard "樱莲", "1", "2", "50", "1";
    AddPossessCard "晨曦", "1", "2", "50", "1";
    AddPossessCard "芙楠", "1", "2", "50", "1";
    AddPossessCard "西药", "1", "2", "50", "1";
    PutStage__Enemy "电蜂", "3";
}

proc CloneStage {
    cloneID = temp_CloneStage;
    cloneType = "stage//background";
    clone "_myself_";
    temp_CloneStage = "0";
    repeat 10 {
        temp_CloneStage++;
        cloneID = temp_CloneStage;
        cloneType = "stage//Card";
        clone "_myself_";
        cloneType = "stage//defence";
        clone "_myself_";
        cloneType = "stage//focus";
        clone "_myself_";
        CloneXCardNum_type "stage//hpNum";
        CloneXCardNum_type "stage//damageNum";
        CloneXCardNum_type "stage//defenceNum";
        CloneXCardNum_type "stage//energyNum";
    }
}

proc ___2 text {
}

proc InhandCard_bias dx, dy {
    _CardPosition cloneID, (length InhandCard_name_lv_damage_hp_e_ / 5), CurrentCard, $dx, $dy;
    point_in_direction return_CardPosition_x_y_face_[3];
    MoveTo (return_CardPosition_x_y_face_[1] - Camera_X), (return_CardPosition_x_y_face_[2] - Camera_Y);
}

proc Card name {
    return_cardType = _CardList_name_type__3__[(item_num($name, _CardList_name_type__3__) + 1)];
}

proc PutCardEffect name, stageid {
    _FutureAdd;
}

orphan {
    Condition = "inhand";
}

onclone {
    wait 0;
    if (Main == "game") {
        wait_until (not (Main == "game"));
        repeat 10 {
            change_ghost_effect 10;
        }
        delete_this_clone;
    }
    if (Main == "enhance") {
        wait_until (not (Main == "enhance"));
        repeat 10 {
            change_ghost_effect 10;
        }
        delete_this_clone;
    }
    if (Main == "level") {
        wait_until (not (Main == "level"));
        repeat 10 {
            change_ghost_effect 10;
        }
        delete_this_clone;
    }
    if (Main == "add") {
        wait_until (not (Main == "add"));
        repeat 10 {
            change_ghost_effect 10;
        }
        delete_this_clone;
    }
}

proc CardChangeCheck_ID stageid {
    if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 3)] < "0") {
        CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 3)] = "0";
    }
    if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 4)] < "0") {
        CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 4)] = "0";
    }
    if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] < "0") {
        CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] = "0";
    }
    if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 6)] < "0") {
        CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 6)] = "0";
    }
    if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 4)] == "0") {
        CardActionBreak CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)], $stageid;
    }
}

proc CardActionAttack stageid {
    ___2 "基础伤害";
    if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 3)] > "0") {
        ___2 "如果没有敌人，不攻击，没有玩家卡，直接造成真伤";
        RandomNumber;
        if ($stageid > "5") {
            CardActionRandomAvailable "1", "5";
            if (length temp_CardActionList > "0") {
                AddEffect "attack", $stageid, temp_CardActionList[((return_randnum % length temp_CardActionList) + 1)], "", "", "";
                CardChange_ID temp_CardActionList[((return_randnum % length temp_CardActionList) + 1)], "", (0 - CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 3)]), "", "", "";
            }
        } else {
            CardActionRandomAvailable "6", "10";
            if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)] == "焦躁的食客") {
                PlayerHP += ((CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 3)] * 1) * -1);
                AddEffect "attack", $stageid, "0", "0", "0", "0";
            } else {
                if (length temp_CardActionList > "0") {
                    AddEffect "attack", $stageid, temp_CardActionList[((return_randnum % length temp_CardActionList) + 1)], "", "", "";
                    CardChange_ID temp_CardActionList[((return_randnum % length temp_CardActionList) + 1)], "", (0 - CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 3)]), "", "", "";
                } else {
                    PlayerHP += (0 - CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 3)]);
                }
            }
        }
    }
}

proc CardActionSpecialpower cardname, level, stageid {
    ___2 "这部分是大招，一般来说耗能";
    if ($cardname == "橡皮") {
        if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] < (11 - (2 * $level))) {
        } else {
            RandomNumber;
            CardActionRandomAvailable "1", "5";
            if (length temp_CardActionList > "0") {
                temp_CardAction = temp_CardActionList[((return_randnum % length temp_CardActionList) + 1)];
                CardChange_ID temp_CardAction, "", "-99", "", "", "";
                AddEffect "attack", $stageid, temp_CardAction, "", "", "";
                AddEffect "superpower", $stageid, "", "", "", "";
                CardChange_ID $stageid, "", "", (0 - (11 - (2 * $level))), "", "";
            }
        }
    }
    if ($cardname == "混沌") {
        if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] < "3") {
        } else {
            temp_CardAction = "5";
            repeat 5 {
                temp_CardAction++;
                RandomNumber;
                if ((return_randnum % 4) < ($level + 1)) {
                    CardChange_ID temp_CardAction, "1", "", "", "", "";
                }
            }
            AddEffect "superpower", $stageid, "", "", "", "";
            CardChange_ID $stageid, "", "", "-3", "", "";
        }
    }
    if ($cardname == "樱莲") {
        if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] < "5") {
        } else {
            temp_CardAction = "5";
            repeat 5 {
                temp_CardAction++;
                CardChange_ID temp_CardAction, "", "", "", "5", "";
            }
            AddEffect "superpower", $stageid, "", "", "", "";
            CardChange_ID $stageid, "", "", "-5", "", "";
        }
    }
    if ($cardname == "西药") {
        if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] < "3") {
        } else {
            temp_CardAction = "5";
            repeat 5 {
                temp_CardAction++;
                CardChange_ID temp_CardAction, "", ($level * 5), "", "", "";
            }
            AddEffect "superpower", $stageid, "", "", "", "";
            CardChange_ID $stageid, "", "", "-3", "", "";
        }
    }
    if ($cardname == "芙楠") {
        if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] < "3") {
        } else {
            temp_CardAction = "0";
            repeat 5 {
                temp_CardAction++;
                CardChange_ID temp_CardAction, "", "", (0 - $level), "", "";
            }
            AddEffect "superpower", $stageid, "", "", "", "";
            CardChange_ID $stageid, "", "", "-3", "", "";
        }
    }
    if ($cardname == "晨曦") {
        ___2 "无灵魂牌不能加费";
        if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] < (5 - $level)) {
        } else {
            temp_CardActionAvailable = "5";
            repeat 5 {
                temp_CardActionAvailable++;
                if (not (CardStage_name_lv__4__mhp_buff_[(((temp_CardActionAvailable - 1) * 8) + 1)] == "null")) {
                    if (_CardList_name_type__3__[(item_num(CardStage_name_lv__4__mhp_buff_[(((temp_CardActionAvailable - 1) * 8) + 1)], _CardList_name_type__3__) + 1)] == "P") {
                        add temp_CardActionAvailable to temp_CardActionList;
                    }
                }
            }
            RandomNumber;
            temp_CardAction = temp_CardActionList[((return_randnum % length temp_CardActionList) + 1)];
            AddEffect "superpower", $stageid, "", "", "", "";
            CardChange_ID temp_CardAction, "", "", "4", "", "";
            CardChange_ID $stageid, "", "", ($level - 5), "", "";
        }
    }
    if ($cardname == "瑞比") {
        if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] < "3") {
        } else {
            temp_CardAction = "0";
            repeat 5 {
                temp_CardAction++;
                CardChange_ID temp_CardAction, "", (0 - (3 + ($level * 3))), "", "", "";
            }
            AddEffect "superpower", $stageid, "", "", "", "";
            CardChange_ID $stageid, "", "", "-3", "", "";
        }
    }
    if ($cardname == "丹尼") {
        if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] < (5 - $level)) {
        } else {
            RandomNumber;
            CardActionRandomAvailable "1", "5";
            if (length temp_CardActionList > "0") {
                temp_CardAction = temp_CardActionList[((return_randnum % length temp_CardActionList) + 1)];
                CardChange_ID temp_CardAction, "", "", "", (0 - CardStage_name_lv__4__mhp_buff_[(((temp_CardAction - 1) * 8) + 6)]), "";
                AddEffect "superpower", $stageid, "", "", "", "";
                CardChange_ID $stageid, "", "", ($level - 5), "", "";
            }
        }
    }
    if ($cardname == "小桃") {
        if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] < (5 - $level)) {
        } else {
            AddInhandCard "古树", "", "", "15", "";
            AddEffect "superpower", $stageid, "", "", "", "";
            CardChange_ID $stageid, "", "", ($level - 5), "", "";
        }
    }
    if ($cardname == "塔塔") {
        if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] < (5 - $level)) {
        } else {
            temp_CardAction = "0";
            repeat 5 {
                temp_CardAction++;
                RandomNumber;
                if ((return_randnum % 2) == "0") {
                    CardAction_EnergyExplode_ temp_CardAction;
                }
            }
            AddEffect "superpower", $stageid, "", "", "", "";
            CardChange_ID $stageid, "", "", ($level - 5), "", "";
        }
    }
    if ($cardname == "安然") {
        if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] < "2") {
        } else {
            temp_CardAction = "0";
            repeat 5 {
                temp_CardAction++;
                if ("F" in CardStage_name_lv__4__mhp_buff_[(((temp_CardAction - 1) * 8) + 8)]) {
                    AddEffect "attack", $stageid, temp_CardAction, "", "", "";
                    CardChange_ID temp_CardAction, "", (0 - (3 + ($level * 3))), "", "", "";
                }
            }
            AddEffect "superpower", $stageid, "", "", "", "";
            CardChange_ID $stageid, "", "", "-2", "", "";
        }
    }
    if ($cardname == "皮尔") {
        if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] < "3") {
        } else {
            RandomNumber;
            CardActionRandomAvailable "1", "5";
            if (length temp_CardActionList > "0") {
                temp_CardAction = temp_CardActionList[((return_randnum % length temp_CardActionList) + 1)];
                AddEffect "attack", $stageid, temp_CardAction, "", "", "";
                CardChange_ID temp_CardAction, "", (0 - (floor (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 6)] * (0.5 + (0.5 * $level))))), "", "", "";
                AddEffect "superpower", $stageid, "", "", "", "";
                CardChange_ID $stageid, "", "", "-3", "", "";
            }
        }
    }
    if ($cardname == "华安") {
        if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] < "3") {
        } else {
            temp_CardActionAvailable = "5";
            repeat 5 {
                temp_CardActionAvailable++;
                if (not (CardStage_name_lv__4__mhp_buff_[(((temp_CardActionAvailable - 1) * 8) + 1)] == "null")) {
                    if (_CardList_name_type__3__[(item_num(CardStage_name_lv__4__mhp_buff_[(((temp_CardActionAvailable - 1) * 8) + 1)], _CardList_name_type__3__) + 1)] == "P") {
                        add temp_CardActionAvailable to temp_CardActionList;
                    }
                }
            }
            RandomNumber;
            if (length temp_CardActionList > "0") {
                CardChange_ID temp_CardActionList[((return_randnum % length temp_CardActionList) + 1)], "", "", "", (5 * $level), "";
            }
            AddEffect "superpower", $stageid, "", "", "", "";
            CardChange_ID $stageid, "", "", "-3", "", "";
        }
    }
    if ($cardname == "冰火") {
        if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] < "3") {
        } else {
            temp_CardActionSum = "0";
            temp_CardAction = "5";
            repeat 5 {
                temp_CardAction++;
                temp_CardActionSum += CardStage_name_lv__4__mhp_buff_[(((temp_CardAction - 1) * 8) + 6)];
            }
            if (length temp_CardActionList > "0") {
                temp_CardAction = temp_CardActionList[((return_randnum % length temp_CardActionList) + 1)];
                AddEffect "attack", $stageid, temp_CardAction, "", "", "";
                CardChange_ID temp_CardAction, "", (0 - (floor (temp_CardActionSum * (0.25 + (0.25 * $level))))), "", "", "";
                AddEffect "superpower", $stageid, "", "", "", "";
                CardChange_ID $stageid, "", "", "-3", "", "";
            }
        }
    }
    if ($cardname == "涵影") {
        if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] < "2") {
        } else {
            RandomNumber;
            CardActionRandomAvailable "1", "5";
            if (length temp_CardActionList > "0") {
                temp_CardAction = temp_CardActionList[((return_randnum % length temp_CardActionList) + 1)];
                AddEffect "attack", $stageid, temp_CardAction, "", "", "";
                CardChange_ID $stageid, "", "", "-2", "", "";
                AddEffect "superpower", $stageid, "", "", "", "";
                CardChange_ID temp_CardAction, "", (0 - (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] * (1 + $level))), "", "", "";
            }
        }
    }
    if ($cardname == "米花") {
        if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] < (4 - $level)) {
        } else {
            RandomNumber;
            CardActionRandomAvailable "1", "5";
            if (length temp_CardActionList > "0") {
                temp_CardAction = temp_CardActionList[((return_randnum % length temp_CardActionList) + 1)];
                CardChange_ID temp_CardAction, "", "", (0 - CardStage_name_lv__4__mhp_buff_[(((temp_CardAction - 1) * 8) + 5)]), "", "";
                AddEffect "superpower", $stageid, "", "", "", "";
                CardChange_ID $stageid, "", "", ($level - 4), "", "";
            }
        }
    }
    if ($cardname == "冰泉") {
        if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] < (4 - $level)) {
        } else {
            temp_CardActionSum = "0";
            temp_CardAction = "0";
            repeat 5 {
                temp_CardAction++;
                if (CardStage_name_lv__4__mhp_buff_[(((temp_CardAction - 1) * 8) + 5)] > temp_CardActionSum) {
                    temp_CardActionSum = CardStage_name_lv__4__mhp_buff_[(((temp_CardAction - 1) * 8) + 5)];
                    temp_CardActionTemp = temp_CardAction;
                }
            }
            if (length temp_CardActionList > "0") {
                temp_CardAction = temp_CardActionList[((return_randnum % length temp_CardActionList) + 1)];
                CardChange_ID temp_CardActionTemp, "", "-99", (0 - temp_CardActionSum), "", "";
                CardChange_ID $stageid, "", "", temp_CardActionSum, "", "";
                AddEffect "superpower", $stageid, "", "", "", "";
                CardChange_ID $stageid, "", "", ($level - 4), "", "";
            }
        }
    }
    enemyEnergy = (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] * 1);
    enemyHp = (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 4)] * 1);
    enemyDamage = (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 3)] * 1);
    if ($cardname == "电蜂巢穴") {
        if (enemyEnergy > 1) {
            CardChange_ID $stageid, "0", "0", "-2", "0", $stageid;
            CardActionSummonEnemy "电蜂";
        }
    }
    if ($cardname == "先驱者") {
        if (enemyEnergy > 2) {
            CardChange_ID $stageid, "0", "0", "-3", "0", $stageid;
            CardActionSummonEnemy "嗜血者";
        }
    }
    if ($cardname == "镜中的双生子") {
        if (enemyEnergy > 2) {
            CardChange_ID $stageid, "0", "0", "-3", "0", $stageid;
            CardActionSummonEnemy "镜中的双生子";
        }
    }
    if ($cardname == "审判官") {
        if (enemyEnergy > 2) {
            CardChange_ID $stageid, "0", "0", "-3", "0", $stageid;
            targetSlotId = 1;
            repeat 5 {
                if ((not (CardStage_name_lv__4__mhp_buff_[(((targetSlotId - 1) * 8) + 1)] == "null")) and (not (CardStage_name_lv__4__mhp_buff_[(((targetSlotId - 1) * 8) + 1)] == ""))) {
                    enemyTargetHp = (CardStage_name_lv__4__mhp_buff_[(((targetSlotId - 1) * 8) + 4)] * 1);
                    if (enemyTargetHp < enemyHp) {
                        CardChange_ID targetSlotId, "0", "-9999", "0", "0", $stageid;
                    }
                }
                targetSlotId++;
            }
        }
    }
    if ($cardname == "钟摆") {
        if (enemyEnergy > 4) {
            CardChange_ID $stageid, "0", "0", "-5", "0", $stageid;
            targetSlotId = 1;
            repeat 5 {
                if (not (CardStage_name_lv__4__mhp_buff_[(((targetSlotId - 1) * 8) + 1)] == "null")) {
                    if ((CardStage_name_lv__4__mhp_buff_[(((targetSlotId - 1) * 8) + 5)] * 1) > 0) {
                        CardChange_ID targetSlotId, "0", "0", ((CardStage_name_lv__4__mhp_buff_[(((targetSlotId - 1) * 8) + 5)] * 1) * -1), "0", $stageid;
                    }
                }
                targetSlotId++;
            }
        }
    }
    if ($cardname == "永生的灵魂") {
        if (enemyEnergy > 0) {
            CardChange_ID $stageid, "0", "0", "-1", "0", $stageid;
            CardChange_ID $stageid, "0", "20", "0", "0", $stageid;
        }
    }
    if ($cardname == "愤怒的灵魂") {
        if (enemyEnergy > 2) {
            CardChange_ID $stageid, "0", "0", "-3", "0", $stageid;
            CardChange_ID $stageid, "5", "0", "0", "0", $stageid;
        }
    }
    if ($cardname == "机械巡逻者") {
        if (enemyEnergy > 0) {
            CardChange_ID $stageid, "0", "0", "-1", "0", $stageid;
            CardChange_ID $stageid, "2", "0", "0", "0", $stageid;
        }
    }
    if ($cardname == "巡逻者") {
        if (enemyEnergy > 1) {
            CardChange_ID $stageid, "0", "0", "-2", "0", $stageid;
            CardChange_ID $stageid, "1", "0", "0", "0", $stageid;
        }
    }
    if ($cardname == "回响者") {
        if (enemyEnergy > 0) {
            if (random(1, 100) < ((enemyEnergy * 20) + 1)) {
                CardActionSummonEnemy "回响者";
            }
            CardChange_ID $stageid, "0", "0", (enemyEnergy * -1), "0", $stageid;
        }
    }
    if ($cardname == "世界规则残片") {
        if (enemyHp > 900) {
            CardChange_ID $stageid, "0", "0", "0", "10", $stageid;
        } else {
            if (enemyHp > 600) {
                totalPlayerAtk = 0;
                targetSlotId = 1;
                repeat 5 {
                    if (not (CardStage_name_lv__4__mhp_buff_[(((targetSlotId - 1) * 8) + 1)] == "null")) {
                        totalPlayerAtk += (CardStage_name_lv__4__mhp_buff_[(((targetSlotId - 1) * 8) + 3)] * 1);
                    }
                    targetSlotId++;
                }
                CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 3)] = totalPlayerAtk;
            } else {
                if (enemyHp > 300) {
                    CardActionSummonEnemy "妹妹？";
                } else {
                    if (enemyHp > 50) {
                        CardChange_ID $stageid, enemyDamage, (enemyDamage * -1), "0", "0", $stageid;
                    } else {
                        CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 3)] = 0;
                        targetSlotId = 1;
                        repeat 5 {
                            if (not (CardStage_name_lv__4__mhp_buff_[(((targetSlotId - 1) * 8) + 1)] == "null")) {
                                if ((CardStage_name_lv__4__mhp_buff_[(((targetSlotId - 1) * 8) + 5)] * 1) > 0) {
                                    CardChange_ID targetSlotId, "0", "0", ((CardStage_name_lv__4__mhp_buff_[(((targetSlotId - 1) * 8) + 5)] * 1) * -1), "0", $stageid;
                                    PlayerHP += ((CardStage_name_lv__4__mhp_buff_[(((targetSlotId - 1) * 8) + 5)] * 1) * -1);
                                }
                            }
                            targetSlotId++;
                        }
                    }
                }
            }
        }
    }
}

nowarp proc wait_fps_2 fps {
    repeat $fps {
        wait 0;
    }
}

proc CardActionSummonEnemy enemyName {
    emptyEnemySlot = 0;
    targetSlotId = 6;
    repeat 5 {
        if (emptyEnemySlot == 0) {
            if ((CardStage_name_lv__4__mhp_buff_[(((targetSlotId - 1) * 8) + 1)] == "null") or (CardStage_name_lv__4__mhp_buff_[(((targetSlotId - 1) * 8) + 1)] == "")) {
                emptyEnemySlot = targetSlotId;
            }
        }
        targetSlotId++;
    }
    if (emptyEnemySlot > 0) {
        PutStage__Enemy $enemyName, emptyEnemySlot;
        AddEffect "spawn", emptyEnemySlot, "0", "0", "0", "0";
    }
}

proc _CardPosition card, count, touchcard, dx, dy {
    if ($touchcard == "0") {
        temp_CardPosition = "0";
    } else {
        temp_CardPosition = (11 * (sqrt (abs ($card - $touchcard))));
        if ($card < $touchcard) {
            temp_CardPosition = (0 - temp_CardPosition);
        }
    }
    cardAngle += ((((CardGap * ($card - (($count + 1) / 2))) + temp_CardPosition) - cardAngle) * 0.2);
    delete return_CardPosition_x_y_face_;
    add ((CardRadius * (sin cardAngle)) + (($dx * ((cos cardAngle) * 0.8)) - ($dy * (sin (0 - cardAngle))))) to return_CardPosition_x_y_face_;
    add ((Card_BaseLine_y + (CardRadius * ((cos cardAngle) - 1))) + (($dx * (sin (0 - cardAngle))) + ($dy * ((cos cardAngle) * 0.8)))) to return_CardPosition_x_y_face_;
    if ((sin cardAngle) == "0") {
        add "90" to return_CardPosition_x_y_face_;
    } else {
        add ((180 * (not ((sin cardAngle) < "0"))) - (((atan ((0.8 * (cos cardAngle)) / (sin cardAngle))) + (180 * ((cos cardAngle) < "0"))) % 360)) to return_CardPosition_x_y_face_;
    }
}

proc PutStage__Enemy name, stageid {
    CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)] = $name;
    CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 2)] = "";
    CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 3)] = _EnemyList_name_damage_hp_[(item_num($name, _EnemyList_name_damage_hp_) + 1)];
    CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 4)] = _EnemyList_name_damage_hp_[(item_num($name, _EnemyList_name_damage_hp_) + 2)];
    CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] = "0";
    CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 6)] = "0";
    CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 7)] = _EnemyList_name_damage_hp_[(item_num($name, _EnemyList_name_damage_hp_) + 2)];
    CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 8)] = "";
    PutCardEffect $name, $stageid;
}

proc StageCard_id id, dx, dy {
    point_in_direction 90;
    MoveTo ((((-300 + ((($id - 1) % 5) * 150)) + $dx) * (StageSize / 100)) - Camera_X), ((((360 + (($id > "5") * -220)) + $dy) * (StageSize / 100)) - Camera_Y);
}

proc ghost_to target, speed {
    if ("" == $speed) {
        ghost = $target;
    } else {
        temp1 = ($target - ghost);
        if ((abs temp1) > $speed) {
            if ((temp1 * $speed) > "0") {
                ghost += $speed;
            } else {
                ghost += (-1 * $speed);
            }
        } else {
            ghost = $target;
        }
    }
    set_ghost_effect ghost;
}

orphan {
    ghost_to "0", "";
    # unsupported block: control_while
}

proc set_size_to size {
    temp_setSize = costume_name();
    switch_costume "full";
    if ($size < "100") {
        switch_costume "full";
    } else {
        switch_costume "empty";
    }
    set_size $size;
    switch_costume temp_setSize;
}

onclone {
    if ((("enhanceCard//" in cloneType) or ("addCard//" in cloneType)) or (("levelCard//" in cloneType) or ("inhandCard//" in cloneType))) {
        ___2 "移动行为";
        if ("//Card" in cloneType) {
            forever {
                InhandCard_bias "0", "0";
            }
        } else {
            if ("//hpNum" in cloneType) {
                tempConst_CardNumMove = (floor (log (0 + InhandCard_name_lv_damage_hp_e_[(((cloneID - 1) * 5) + 4)])));
                forever {
                    InhandCard_bias ((10 + (8 * cloneXID)) - (tempConst_CardNumMove * -4)), "-57";
                }
            }
            if ("//damageNum" in cloneType) {
                tempConst_CardNumMove = (floor (log (0 + InhandCard_name_lv_damage_hp_e_[(((cloneID - 1) * 5) + 3)])));
                forever {
                    InhandCard_bias ((-56 + (8 * cloneXID)) - (tempConst_CardNumMove * -4)), "-57";
                }
            }
            if ("//energyNum" in cloneType) {
                tempConst_CardNumMove = (floor (log (0 + InhandCard_name_lv_damage_hp_e_[(((cloneID - 1) * 5) + 5)])));
                forever {
                    InhandCard_bias (((-23 + ((InhandCard_name_lv_damage_hp_e_[(((cloneID - 1) * 5) + 1)] == "能量棒") * 13)) + (8 * cloneXID)) - (tempConst_CardNumMove * -4)), (-57 + ((InhandCard_name_lv_damage_hp_e_[(((cloneID - 1) * 5) + 1)] == "能量棒") * 10));
                }
            }
        }
    }
}

proc AddEnemyList name, damage, hp {
    add $name to _EnemyList_name_damage_hp_;
    add $damage to _EnemyList_name_damage_hp_;
    add $hp to _EnemyList_name_damage_hp_;
}

proc StageCardNumBias dx, dy, gap {
    StageCard_id cloneID, (($dx + (((cloneXID - 1) * 2) * $gap)) - (tempConst_CardNumMove * (0 - $gap))), $dy;
}

proc DetectStageCard {
    temp_DetectStageX = (((mouse_x() + Camera_X) * 100) / StageSize);
    temp_DetectStageY = (((mouse_y() + Camera_Y) * 100) / StageSize);
    if (((temp_DetectStageX < "-450") or (temp_DetectStageX > "375")) or ((temp_DetectStageY < "55") or (temp_DetectStageY > "460"))) {
        CurrentStagecard = "0";
    } else {
        CurrentStagecard = (((temp_DetectStageY < "255") * 5) + ((round ((temp_DetectStageX + 300) / 150)) + 1));
    }
}

proc DetectChosenCard {
    anime_switch_progress += (((CurrentCard > "0") - anime_switch_progress) * 0.2);
    CardRadius = (300 + (100 * anime_switch_progress));
    if (length InhandCard_name_lv_damage_hp_e_ == "0") {
        temp_DetectChosenCardX = "0";
    } else {
        temp_DetectChosenCardX = (1 - (1 / (length InhandCard_name_lv_damage_hp_e_ / 5)));
    }
    Card_Spread_Angle = ((10 + (10 * temp_DetectChosenCardX)) - (3 * anime_switch_progress));
    if ((length InhandCard_name_lv_damage_hp_e_ / 5) > "1") {
        CardGap = (Card_Spread_Angle / ((length InhandCard_name_lv_damage_hp_e_ / 5) - 1));
    } else {
        CardGap = "0";
    }
    temp_DetectChosenCardX = (mouse_x() - (0 - Camera_X));
    temp_DetectChosenCardY = (mouse_y() - ((Card_BaseLine_y - CardRadius) - Camera_Y));
    _return = (sqrt ((temp_DetectChosenCardX * temp_DetectChosenCardX) + (temp_DetectChosenCardY * temp_DetectChosenCardY)));
    if ((abs (_return - CardRadius)) > CardHitbox_halfHeight) {
        CurrentCard = "0";
    } else {
        _return = ((180 * (temp_DetectChosenCardY < "0")) + (atan (temp_DetectChosenCardX / temp_DetectChosenCardY)));
        temp_DetectChosenCardY = (asin (CardHitbox_halfWidth / CardRadius));
        DetectChosenCard__SpreadAngle_clockwise_between ((-1 * ((Card_Spread_Angle / 2) + temp_DetectChosenCardY)) % 360), _return;
        if (_return < (Card_Spread_Angle + (2 * temp_DetectChosenCardY))) {
            CurrentCard = (ceil ((_return - temp_DetectChosenCardY) / CardGap));
            if (CurrentCard < "1") {
                CurrentCard = "1";
            }
            if (CurrentCard > (length InhandCard_name_lv_damage_hp_e_ / 5)) {
                CurrentCard = (length InhandCard_name_lv_damage_hp_e_ / 5);
            }
        } else {
            CurrentCard = "0";
        }
    }
    if (CurrentCard == "0") {
        CurrentCard = SelectedCard;
        SelectedCard = "0";
    }
}

proc Move__relate_to_Camera_ {
    MoveTo (pos_x - Camera_X), (pos_y - Camera_Y);
}

proc AddListInit {
    delete _EnemyList_name_damage_hp_;
    AddEnemyList "电蜂", "6", "30";
    AddEnemyList "守卫", "4", "45";
    AddEnemyList "巡逻者", "2", "25";
    AddEnemyList "焦躁的食客", "1", "15";
    AddEnemyList "电蜂巢穴", "0", "60";
    AddEnemyList "钟楼守护者", "1", "40";
    AddEnemyList "镜中的双生子", "5", "50";
    AddEnemyList "审判官", "5", "50";
    AddEnemyList "爱丽丝", "3", "30";
    AddEnemyList "躁动的书", "3", "10";
    AddEnemyList "历史之眼", "0", "75";
    AddEnemyList "钟摆", "0", "40";
    AddEnemyList "永生的灵魂", "0", "99";
    AddEnemyList "痛苦的灵魂", "0", "30";
    AddEnemyList "愤怒的灵魂", "5", "30";
    AddEnemyList "孤独的灵魂", "0", "30";
    AddEnemyList "石壁", "0", "10";
    AddEnemyList "嗜血者", "1", "25";
    AddEnemyList "先驱者", "1", "25";
    AddEnemyList "机械巡逻者", "2", "40";
    AddEnemyList "希萝茜", "0", "100";
    AddEnemyList "回响者", "3", "30";
    AddEnemyList "吞噬者", "5", "40";
    AddEnemyList "恶意实质", "5", "60";
    AddEnemyList "恶意", "5", "20";
    AddEnemyList "实验残体", "3", "25";
    AddEnemyList "意识屏障", "2", "20";
    AddEnemyList "焦躁时钟", "3", "15";
    AddEnemyList "妹妹？", "0", "40";
    AddEnemyList "世界规则残片", "1", "999";
    ___2 "抽牌都可以抽出来";
    ___2 "U无灵魂牌 参数列表-damage/hp";
    ___2 "M物品牌 参数列表-energy";
    ___2 "D负面牌 参数列表-/";
    ___2 "P灵魂牌 默认10hp 参数列表-damage/energy(废弃)";
    delete _CardList_name_type__3__;
    if "" {
        AddCardList "虚弱", "D", "1", "", "";
        AddCardList "镣铐", "D", "1", "", "";
        AddCardList "孤独", "D", "2", "", "";
        AddCardList "集中器", "M", "", "", "";
    }
    AddCardList "古树", "U", "0", "15", "";
    AddCardList "影灵", "U", "1", "3", "";
    AddCardList "Alpha", "U", "3", "20", "";
    AddCardList "炸弹", "M", "", "", "";
    AddCardList "能量棒", "M", "5", "", "";
    AddCardList "医疗箱", "M", "", "", "";
    AddCardList "空间护盾", "M", "", "", "";
    AddCardList "能量回收", "M", "", "", "";
    AddCardList "肾上腺素", "M", "", "", "";
    AddCardList "镇定剂", "M", "", "", "";
    AddCardList "橡皮", "P", "", "", "";
    AddCardList "混沌", "P", "5", "1", "";
    AddCardList "未来", "P", "", "1", "";
    AddCardList "樱莲", "P", "", "", "";
    AddCardList "西药", "P", "", "1", "";
    AddCardList "芙楠", "P", "3", "", "";
    AddCardList "晨曦", "P", "2", "", "";
    AddCardList "回声", "P", "4", "", "";
    AddCardList "极夜", "P", "5", "", "";
    AddCardList "瑞比", "P", "4", "", "";
    AddCardList "丹尼", "P", "", "1", "";
    AddCardList "小桃", "P", "", "1", "";
    AddCardList "塔塔", "P", "5", "1", "";
    AddCardList "安然", "P", "3", "", "";
    AddCardList "皮尔", "P", "", "", "";
    AddCardList "华安", "P", "", "1", "";
    AddCardList "尾兜", "P", "5", "", "";
    AddCardList "云落", "P", "4", "", "";
    AddCardList "AChy", "P", "3", "", "";
    AddCardList "冰火", "P", "3", "", "";
    AddCardList "涵影", "P", "5", "", "";
    AddCardList "米花", "P", "2", "", "";
    AddCardList "冰泉", "P", "2", "", "";
    AddCardList "星空", "P", "3", "", "";
    AddCardList "Christina", "P", "", "", "";
    AddCardList "Cendy", "P", "", "", "";
    AddCardList "Candace", "P", "", "", "";
    AddCardList "Clara", "P", "", "", "";
    AddCardList "Caitlan", "P", "", "", "";
    AddCardList "Caitlin", "P", "", "", "";
    AddCardList "意识集合", "P", "", "", "";
}

onclone {
    if ("stage//" in cloneType) {
        ___2 "移动行为";
        if (cloneType == "stage//background") {
            point_in_direction 90;
            forever {
                MoveTo (0 - Camera_X), ((250 * (StageSize / 100)) - Camera_Y);
            }
        } else {
            if (cloneType == "stage//Card") {
                forever {
                    StageCard_id cloneID, "", "";
                }
            } else {
                if (cloneType == "stage//damageNum") {
                    forever {
                        tempConst_CardNumMove = (floor (log (0 + CardStage_name_lv__4__mhp_buff_[(((cloneID - 1) * 8) + 3)])));
                        StageCardNumBias "-62", "-74", "5";
                    }
                }
                if (cloneType == "stage//hpNum") {
                    forever {
                        tempConst_CardNumMove = (floor (log (0 + CardStage_name_lv__4__mhp_buff_[(((cloneID - 1) * 8) + 4)])));
                        StageCardNumBias "24", "-74", "5";
                    }
                }
                if (cloneType == "stage//energyNum") {
                    forever {
                        tempConst_CardNumMove = (floor (log (0 + CardStage_name_lv__4__mhp_buff_[(((cloneID - 1) * 8) + 5)])));
                        StageCardNumBias "-20", "-74", "5";
                    }
                }
                if (cloneType == "stage//defenceNum") {
                    forever {
                        tempConst_CardNumMove = (floor (log (0 + CardStage_name_lv__4__mhp_buff_[(((cloneID - 1) * 8) + 6)])));
                        StageCardNumBias "-65", "58", "4";
                    }
                }
                if (cloneType == "stage//defence") {
                    forever {
                        StageCard_id cloneID, "-50", "60";
                    }
                }
                if (cloneType == "stage//focus") {
                    forever {
                        StageCard_id cloneID, "", "20";
                    }
                }
            }
        }
    }
    if ("enhance//" in cloneType) {
        point_in_direction 90;
        show;
        set_size_to "100";
        if (cloneType == "enhance//damage") {
            switch_costume "enhance//damage";
            forever {
                SpeicialEffectSmoothly_Brigntness (20 * (CurrentStagecard == "1")), "";
                MoveTo (-100 - Camera_X), (80 - Camera_Y);
            }
        }
        if (cloneType == "enhance//energy") {
            switch_costume "enhance//energy";
            forever {
                SpeicialEffectSmoothly_Brigntness (20 * (CurrentStagecard == "2")), "";
                MoveTo (0 - Camera_X), (80 - Camera_Y);
            }
        }
        if (cloneType == "enhance//hp") {
            switch_costume "enhance//hp";
            forever {
                SpeicialEffectSmoothly_Brigntness (20 * (CurrentStagecard == "3")), "";
                MoveTo (100 - Camera_X), (80 - Camera_Y);
            }
        }
    }
    if (cloneType == "level//background") {
        show;
        switch_costume "stage//background2";
        forever {
            set_size_to (StageSize * 2.6);
            SpeicialEffectSmoothly_Brigntness (20 * (CurrentStagecard > "0")), "";
            MoveTo (0 - Camera_X), ((256 * (StageSize / 100)) - Camera_Y);
        }
    }
    if (cloneType == "add//background") {
        show;
        switch_costume "stage//background3";
        forever {
            set_size_to (StageSize * 2.6);
            SpeicialEffectSmoothly_Brigntness (20 * (CurrentStagecard > "0")), "";
            MoveTo (0 - Camera_X), ((256 * (StageSize / 100)) - Camera_Y);
        }
    }
}

proc MoveTo x, y {
    temp_moveto = costume_name();
    switch_costume "full";
    goto $x, $y;
    switch_costume temp_moveto;
}

onclone {
    if ("system//" in cloneType) {
        hide;
        if (cloneType == "system//inhand") {
            forever {
                wait_until (not (Condition == "inhand"));
                wait_until (Condition == "inhand");
                CloneInhandCard_Type "inhandCard";
            }
        }
        if (cloneType == "system//level") {
            forever {
                wait_until (not (Condition == "inhand"));
                wait_until (Condition == "inhand");
                CloneInhandCard_Type "levelCard";
            }
        }
        if (cloneType == "system//enhance") {
            forever {
                wait_until (not (Condition == "inhand"));
                wait_until (Condition == "inhand");
                CloneInhandCard_Type "enhanceCard";
            }
        }
        if ("system//back" in cloneType) {
            show;
        }
        if ("system//player" in cloneType) {
            show;
        }
        if (cloneType == "system//back") {
            forever {
                if (touching_mouse_pointer() and mouse_down()) {
                    wait_until (not mouse_down());
                    if touching_mouse_pointer() {
                        Main = "map";
                    }
                }
            }
        }
        if (cloneType == "system//next") {
            forever {
                wait_until (Condition == "inhand");
                show;
                switch_costume "next//off";
                if (touching_mouse_pointer() and mouse_down()) {
                    switch_costume "next//on";
                    wait_until (not mouse_down());
                    if touching_mouse_pointer() {
                        if (Condition == "inhand") {
                            Condition = "run";
                            hide;
                            wait_until (Condition == "inhand");
                            show;
                        }
                    }
                }
            }
        }
        if (cloneType == "system//detector") {
            rem_Condition = "0";
            Card_BaseLine_y = "-100";
            forever {
                if (not (rem_Condition == Condition)) {
                    rem_Condition = Condition;
                    if (Condition == "inhand") {
                        CurrentCard = "0";
                        anime_switch_progress = "0";
                    }
                }
                if (Condition == "inhand") {
                    DetectChosenCard;
                }
                if ((Main == "game") or (Main == "level")) {
                    DetectStageCard;
                } else {
                    if (Main == "enhance") {
                        DetectEnhanceCard;
                    } else {
                    }
                }
            }
        }
        if (cloneType == "system//camera") {
            Camera_X = "0";
            Camera_Y = "180";
            forever {
                if ((Condition == "inhand") or (Condition == "putstage")) {
                    Camera_X += ((0 - Camera_X) / 4);
                    if (mouse_y() > "-10") {
                        if (Main == "enhance") {
                            Camera_Y += ((0 - Camera_Y) / 5);
                        } else {
                            Camera_Y += ((((stagepos_x_y_[2] / 240) * (mouse_y() + 10)) - Camera_Y) / 5);
                        }
                    } else {
                        Camera_Y += ((-10 - Camera_Y) / 5);
                    }
                } else {
                    if (Condition == "run") {
                        Camera "0", "120";
                    } else {
                    }
                }
            }
        }
    }
}

proc PutStage__Inhand order, stageid {
    CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)] = InhandCard_name_lv_damage_hp_e_[((($order - 1) * 5) + 1)];
    CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 2)] = InhandCard_name_lv_damage_hp_e_[((($order - 1) * 5) + 2)];
    CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 3)] = InhandCard_name_lv_damage_hp_e_[((($order - 1) * 5) + 3)];
    CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 4)] = InhandCard_name_lv_damage_hp_e_[((($order - 1) * 5) + 4)];
    CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] = InhandCard_name_lv_damage_hp_e_[((($order - 1) * 5) + 5)];
    CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 6)] = "5";
    CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 7)] = InhandCard_name_lv_damage_hp_e_[((($order - 1) * 5) + 4)];
    CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 8)] = "";
    PutCardEffect InhandCard_name_lv_damage_hp_e_[((($order - 1) * 5) + 1)], $stageid;
    if (not (InhandCard_name_lv_damage_hp_e_[((($order - 1) * 5) + 1)] == "影灵")) {
        repeat 5 {
            delete InhandCard_name_lv_damage_hp_e_[((($order - 1) * 5) + 1)];
        }
    }
}

proc StartGame gameinfo {
    hide;
    RoundCount = "0";
    StageSize = "50";
    cloneType = "system//inhand";
    clone "_myself_";
    cloneType = "system//detector";
    clone "_myself_";
    cloneType = "system//camera";
    clone "_myself_";
    cloneType = "system//next";
    clone "_myself_";
    cloneType = "system//run";
    clone "_myself_";
    cloneType = "system//shake";
    clone "_myself_";
    cloneType = "system//player";
    clone "_myself_";
    CloneXCardNum_type "system//playerNum";
    DivideString_2 $gameinfo, "/";
    delete CardStage_name_lv__4__mhp_buff_;
    repeat 10 {
        add "null" to CardStage_name_lv__4__mhp_buff_;
        repeat 7 {
            add "" to CardStage_name_lv__4__mhp_buff_;
        }
    }
    temp_Start = "0";
    repeat 10 {
        temp_Start++;
        if (return_DivideString[temp_Start] == "") {
        } else {
            PutStage__Enemy return_DivideString[temp_Start], temp_Start;
        }
    }
    DebugTest;
    delete InhandCard_name_lv_damage_hp_e_;
    temp_Start = "0";
    repeat length PossessCard_name_lv_damage_hp_e_ {
        temp_Start++;
        add PossessCard_name_lv_damage_hp_e_[temp_Start] to InhandCard_name_lv_damage_hp_e_;
    }
    CloneStage;
    CloneInhandCard_Type "inhandCard";
    CloneSingleCard_Type "putCard";
    PlayerHP = PlayerMaxHP;
}

proc CheckCard cardname, cardlv {
    return_CardCheck = "1";
    if (("虚弱" in InhandCard_name_lv_damage_hp_e_) or ("镣铐" in InhandCard_name_lv_damage_hp_e_)) {
        return_CardCheck = "0";
    }
}

proc face_to_R_ x, y {
    point_in_direction ((180 * (not ($x < "0"))) - (((atan ($y / $x)) + (180 * ($y < "0"))) % 360));
}

proc MoveToSmoothly x, y {
    temp_moveto = costume_name();
    switch_costume "full";
    goto (x_position() + (($x - x_position()) / 5)), (y_position() + (($y - y_position()) / 5));
    switch_costume temp_moveto;
}

proc CardChange_ID stageid, D, H, _E, S, stageidReflect {
    if (not (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)] == "null")) {
        if (_CardList_name_type__3__[(item_num(CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)], _CardList_name_type__3__) + 1)] == "P") {
            CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] = (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] + $_E);
            if ($_E > "0") {
                AddEffect "energy+", $stageid, "", "", "", "";
            } else {
                if ($_E < "0") {
                    AddEffect "energy-", $stageid, "", "", "", "";
                }
            }
        }
        CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 3)] = (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 3)] + $D);
        if ($D > "0") {
            AddEffect "damage+", $stageid, "", "", "", "";
        } else {
            if ($D < "0") {
                AddEffect "damage-", $stageid, "", "", "", "";
            }
        }
        CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 6)] = (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 6)] + $S);
        if ($S > "0") {
            AddEffect "defence+", $stageid, "", "", "", "";
        } else {
            if ($S < "0") {
                AddEffect "defence-", $stageid, "", "", "", "";
            }
            if (not (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 6)] > "0")) {
                ___2 "防止循环";
                if (not ($stageidReflect == "-1")) {
                    CardActionReflect "defbreak", "", temp_runCardNow, $stageid;
                }
            }
        }
        if ($H > "0") {
            ___2 "分别寻找血量上限";
            CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 4)] = (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 4)] + $H);
            if ($stageid > "5") {
                if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 4)] > CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 7)]) {
                    CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 4)] = CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 7)];
                }
            } else {
                if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 4)] > _EnemyList_name_damage_hp_[(item_num(CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)], _EnemyList_name_damage_hp_) + 2)]) {
                    CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 4)] = _EnemyList_name_damage_hp_[(item_num(CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)], _EnemyList_name_damage_hp_) + 2)];
                }
            }
            AddEffect "hp+", $stageid, "", "", "", "";
        } else {
            if ($H < "0") {
                ___2 "扣血：看护盾量是否够扣，扣光再扣血量";
                if (not ($stageidReflect == "-1")) {
                    CardActionReflect "damage", $H, temp_runCardNow, $stageid;
                }
                if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 6)] < (0 - $H)) {
                    if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 6)] > "0") {
                        ___2 "有护盾可扣才会扣";
                        AddEffect "defence-", $stageid, "", "", "", "";
                        if (not ($stageidReflect == "-1")) {
                            CardActionReflect "defbreak", "", temp_runCardNow, $stageid;
                        }
                    }
                    CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 4)] = (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 4)] + (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 6)] + $H));
                    CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 6)] = "0";
                    AddEffect "hp-", $stageid, "", "", "", "";
                } else {
                    CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 6)] = (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 6)] + $H);
                    AddEffect "hp-", $stageid, "", "", "", "";
                }
            }
        }
        CardChangeCheck_ID $stageid;
    }
}

proc CardActionPremove cardname, level, stageid {
    ___2 "因为cardeffect的先后次序，所以分开做，这部分是预处理，包括回合前的增伤、增能";
    if ($cardname == "橡皮") {
        CardChange_ID $stageid, "", "", "1", "", "";
    }
    if ($cardname == "混沌") {
        CardChange_ID $stageid, "", "", "1", "", "";
    }
    if ($cardname == "晨曦") {
        CardChange_ID $stageid, "", "", "1", "", "";
    }
    if ($cardname == "未来") {
        CardChange_ID $stageid, "", "", "1", "", "";
    }
    if ($cardname == "西药") {
        CardChange_ID $stageid, "", "", "1", "", "";
    }
    if ($cardname == "小桃") {
        CardChange_ID $stageid, "", "", "1", "", "";
    }
    if ($cardname == "丹尼") {
        CardChange_ID $stageid, "", "", "1", "", "";
    }
    if ($cardname == "塔塔") {
        CardChange_ID $stageid, "", "", "1", "", "";
    }
    if ($cardname == "华安") {
        CardChange_ID $stageid, "", "", "1", "", "";
    }
    if ($cardname == "意识集合") {
        temp_CardActionAvailable = "5";
        repeat 5 {
            temp_CardActionAvailable++;
            if (letter_of(1, CardStage_name_lv__4__mhp_buff_[(((temp_CardActionAvailable - 1) * 8) + 1)]) == "C") {
                CardChange_ID $stageid, CardStage_name_lv__4__mhp_buff_[(((temp_CardActionAvailable - 1) * 8) + 2)], "", "", "", "";
            }
        }
    }
    if ($cardname == "孤独的灵魂") {
        targetSlotId = 6;
        repeat 5 {
            if ((not (CardStage_name_lv__4__mhp_buff_[(((targetSlotId - 1) * 8) + 1)] == "null")) and (not (CardStage_name_lv__4__mhp_buff_[(((targetSlotId - 1) * 8) + 1)] == ""))) {
                CardChange_ID targetSlotId, "0", "0", "1", "0", $stageid;
            }
            targetSlotId++;
        }
    }
    if (($cardname == "焦躁时钟") or ($cardname == "躁动的书")) {
        if (random(1, 2) == 1) {
            CardChange_ID $stageid, "1", "0", "0", "0", $stageid;
        } else {
            CardChange_ID $stageid, "-1", "0", "0", "0", $stageid;
        }
    }
    if ($cardname == "爱丽丝") {
        CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 3)] = (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] * 1);
    }
    if ($cardname == "妹妹？") {
        PlayerHP += -5;
        targetSlotId = 1;
        repeat 5 {
            if ((not (CardStage_name_lv__4__mhp_buff_[(((targetSlotId - 1) * 8) + 1)] == "null")) and (not (CardStage_name_lv__4__mhp_buff_[(((targetSlotId - 1) * 8) + 1)] == ""))) {
                CardChange_ID targetSlotId, "1", "0", "0", "0", $stageid;
            }
            targetSlotId++;
        }
    }
}

proc CloneXCardNum_type cloneType {
    cloneType = $cloneType;
    cloneXID = "1";
    clone "_myself_";
    cloneXID = "2";
    clone "_myself_";
    cloneXID = "3";
    clone "_myself_";
}

proc DivideString_2 str, char {
    delete return_DivideString;
    add "" to return_DivideString;
    temp_DivideString = "0";
    repeat (length $str) {
        temp_DivideString++;
        if (letter_of(temp_DivideString, $str) == $char) {
            add "" to return_DivideString;
        } else {
            return_DivideString[length return_DivideString] = (return_DivideString[length return_DivideString] & letter_of(temp_DivideString, $str));
        }
    }
}

proc AddEffect name, p1, p2, p3, p4, p5 {
    add $name to Effect_name__5__;
    add $p1 to Effect_name__5__;
    add $p2 to Effect_name__5__;
    add $p3 to Effect_name__5__;
    add $p4 to Effect_name__5__;
    add $p5 to Effect_name__5__;
}

proc SpeicialEffectSmoothly_Brigntness b, g {
    if (not ($b == "")) {
        cloneBrightness += (($b - cloneBrightness) / 5);
        set_brightness_effect cloneBrightness;
    }
    if (not ($g == "")) {
        cloneGhost += (($g - cloneGhost) / 5);
        set_ghost_effect cloneGhost;
    }
}

proc _FutureAdd {
}

proc RandomNumber {
    _FutureAdd;
    return_randnum = random(0, 114514);
}

proc CloneInhandCard_Type type {
    ___2 "复制手牌，每次回合前复制一次，对应的克隆体在condition!=inhand时删除";
    ___2 "一个组件包含三个部分，卡牌本体，血量数字，伤害数字";
    temp_CloneInhandCard = "0";
    repeat (length InhandCard_name_lv_damage_hp_e_ / 5) {
        temp_CloneInhandCard++;
        cloneID = temp_CloneInhandCard;
        cloneType = ($type & "//Card");
        clone "_myself_";
        CloneXCardNum_type ($type & "//damageNum");
        CloneXCardNum_type ($type & "//hpNum");
        CloneXCardNum_type ($type & "//energyNum");
    }
}

proc Add_music music {
    add $music to Music;
}

proc GameoverCheck {
    ___2 "每次放置卡牌的攻击，或使用物品牌都要检测是否游戏结束";
    ___2 "因为有反伤等复杂效果的设定，所以每次都要全部检查";
    ___2 "如果同时死亡：本格=0且敌人也被击杀，则是敌人胜利";
    ___2 "返回0：未结束；返回1：玩家胜利；返回-1：敌人胜利";
    _FutureAdd;
}

onclone {
    if ((("enhanceCard//" in cloneType) or ("addCard//" in cloneType)) or (("levelCard//" in cloneType) or ("inhandCard//" in cloneType))) {
        ___2 "外观和删除行为";
        hide;
        clear_graphic_effects;
        if ("enhanceCard//" in cloneType) {
            if (_CardList_name_type__3__[(item_num(InhandCard_name_lv_damage_hp_e_[(((cloneID - 1) * 5) + 1)], _CardList_name_type__3__) + 1)] == "P") {
            } else {
                set_ghost_effect 50;
            }
        }
        if ("levelCard//" in cloneType) {
            if ((InhandCard_name_lv_damage_hp_e_[(((cloneID - 1) * 5) + 2)] == "2") or (InhandCard_name_lv_damage_hp_e_[(((cloneID - 1) * 5) + 2)] == "1")) {
            } else {
                set_ghost_effect 50;
            }
        }
        if ("//Card" in cloneType) {
            show;
            switch_costume ("inhand//" & (InhandCard_name_lv_damage_hp_e_[(((cloneID - 1) * 5) + 1)] & InhandCard_name_lv_damage_hp_e_[(((cloneID - 1) * 5) + 2)]));
            set_size_to "75";
        } else {
            if ("//damageNum" in cloneType) {
                CardNumbersOutlook InhandCard_name_lv_damage_hp_e_[(((cloneID - 1) * 5) + 3)], "", "";
            }
            if ("//hpNum" in cloneType) {
                CardNumbersOutlook InhandCard_name_lv_damage_hp_e_[(((cloneID - 1) * 5) + 4)], "", "";
            }
            if ("//energyNum" in cloneType) {
                CardNumbersOutlook InhandCard_name_lv_damage_hp_e_[(((cloneID - 1) * 5) + 5)], "", "70";
                set_color_effect 110;
            }
            set_size_to "67";
        }
        wait_until (not (Condition == "inhand"));
        repeat 10 {
            change_ghost_effect 10;
        }
        delete_this_clone;
    }
}

proc _LOG text {
    ___2 "用于便携日志";
    add $text to DEBUG_LOG;
    __log__ $text;
}

proc PutStageCheck order, stageid, listorder, boolean {
    ___2 "return是给stage卡牌做高亮显示用的，putOn是putCard实际操作行为";
    ___2 "putOn不需要放东西，return放一个不成立就行";
    ___2 "return说明：0表示此位置不可以，1表示此位置可以，-1表示此操作的高亮归属background";
    return_PutStageCheck = "0";
    if ($stageid > "0") {
        if ((_CardList_name_type__3__[($listorder + 1)] == "U") or (_CardList_name_type__3__[($listorder + 1)] == "P")) {
            if (($stageid > "5") and (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)] == "null")) {
                if $boolean {
                    return_PutStageCheck = "1";
                } else {
                    PutStage__Inhand $order, $stageid;
                }
            }
        }
        if (_CardList_name_type__3__[($listorder + 1)] == "M") {
            if (_CardList_name_type__3__[$listorder] == "炸弹") {
                if ((not ($stageid > "5")) and (not (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)] == "null"))) {
                    if $boolean {
                        return_PutStageCheck = "1";
                    } else {
                        AddEffect "boom", $stageid, "", "", "", "";
                        CardChange_ID $stageid, "", "-20", "", "", "";
                        repeat 5 {
                            delete InhandCard_name_lv_damage_hp_e_[((($order - 1) * 5) + 1)];
                        }
                        AddEffect "break", $stageid, "100", "", "", "";
                    }
                }
            }
            if (_CardList_name_type__3__[$listorder] == "能量棒") {
                if (($stageid > "5") and (not (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)] == "null"))) {
                    if (_CardList_name_type__3__[(item_num(CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)], _CardList_name_type__3__) + 1)] == "P") {
                        if $boolean {
                            return_PutStageCheck = "1";
                        } else {
                            CardChange_ID $stageid, "", "", InhandCard_name_lv_damage_hp_e_[((($order - 1) * 5) + 5)], "", "";
                            repeat 5 {
                                delete InhandCard_name_lv_damage_hp_e_[((($order - 1) * 5) + 1)];
                            }
                            AddEffect "break", $stageid, "100", "", "", "";
                        }
                    }
                }
            }
            if (_CardList_name_type__3__[$listorder] == "医疗箱") {
                if (($stageid > "5") and (not (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)] == "null"))) {
                    if $boolean {
                        return_PutStageCheck = "1";
                    } else {
                        CardChange_ID $stageid, "", (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 7)] - CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 4)]), "", "", "";
                        repeat 5 {
                            delete InhandCard_name_lv_damage_hp_e_[((($order - 1) * 5) + 1)];
                        }
                        AddEffect "break", $stageid, "100", "", "", "";
                    }
                }
            }
            if (_CardList_name_type__3__[$listorder] == "空间护盾") {
                if (($stageid > "5") and (not (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)] == "null"))) {
                    if $boolean {
                        return_PutStageCheck = "1";
                    } else {
                        CardChange_ID $stageid, "", "", "", "10", "";
                        repeat 5 {
                            delete InhandCard_name_lv_damage_hp_e_[((($order - 1) * 5) + 1)];
                        }
                        AddEffect "break", $stageid, "100", "", "", "";
                    }
                }
            }
            if (_CardList_name_type__3__[$listorder] == "能量回收器") {
                if (($stageid > "5") and (not (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)] == "null"))) {
                    if $boolean {
                        return_PutStageCheck = "1";
                    } else {
                        AddInhandCard "能量棒", "", "", "", CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)];
                        CardChange_ID $stageid, "", "", (0 - CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)]), "", "";
                        repeat 5 {
                            delete InhandCard_name_lv_damage_hp_e_[((($order - 1) * 5) + 1)];
                        }
                        AddEffect "break", $stageid, "100", "", "", "";
                    }
                }
            }
            if (_CardList_name_type__3__[$listorder] == "肾上腺素") {
                if (($stageid > "5") and (not (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)] == "null"))) {
                    if $boolean {
                        return_PutStageCheck = "1";
                    } else {
                        CardChange_ID $stageid, "1", "", "", "", "";
                        repeat 5 {
                            delete InhandCard_name_lv_damage_hp_e_[((($order - 1) * 5) + 1)];
                        }
                        AddEffect "break", $stageid, "100", "", "", "";
                    }
                }
            }
            if (_CardList_name_type__3__[$listorder] == "镇定剂") {
                if (($stageid > "5") and (not (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)] == "null"))) {
                    if $boolean {
                        return_PutStageCheck = "1";
                    } else {
                        CardChange_ID $stageid, "-1", "10", "", "", "";
                        repeat 5 {
                            delete InhandCard_name_lv_damage_hp_e_[((($order - 1) * 5) + 1)];
                        }
                        AddEffect "break", $stageid, "100", "", "", "";
                    }
                }
            }
        }
        if (_CardList_name_type__3__[($listorder + 1)] == "D") {
            if (not ($stageid == "0")) {
                if $boolean {
                    return_PutStageCheck = "-1";
                } else {
                    _FutureAdd;
                }
            }
        }
    }
}

onflag {
    delete DEBUG_LOG;
}

proc AddInhandCard name, lv, damage, hp, energy {
    add $name to InhandCard_name_lv_damage_hp_e_;
    add $lv to InhandCard_name_lv_damage_hp_e_;
    add $damage to InhandCard_name_lv_damage_hp_e_;
    add $hp to InhandCard_name_lv_damage_hp_e_;
    add $energy to InhandCard_name_lv_damage_hp_e_;
}

proc AddPossessCard name, lv, damage, hp, energy {
    add $name to PossessCard_name_lv_damage_hp_e_;
    add $lv to PossessCard_name_lv_damage_hp_e_;
    add $damage to PossessCard_name_lv_damage_hp_e_;
    add $hp to PossessCard_name_lv_damage_hp_e_;
    add $energy to PossessCard_name_lv_damage_hp_e_;
}

proc CardAction_EnergyExplode_ stageid {
    if (not (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)] == "null")) {
        AddEffect "explode", $stageid, "", "", "", "";
        if ($stageid > "5") {
            temp_CardActionEnergyExplode = "5";
            repeat 5 {
                temp_CardActionEnergyExplode++;
                if (CardStage_name_lv__4__mhp_buff_[(((temp_CardActionEnergyExplode - 1) * 8) + 1)] == "回声") {
                    CardChange_ID temp_CardActionEnergyExplode, CardStage_name_lv__4__mhp_buff_[(((temp_CardActionEnergyExplode - 1) * 8) + 2)], "", "", "", "";
                }
                if (CardStage_name_lv__4__mhp_buff_[(((temp_CardActionEnergyExplode - 1) * 8) + 1)] == "极夜") {
                    RandomNumber;
                    if ((return_randnum % 4) < ($level + 1)) {
                        AddEffect "focus", $stageid, "", "", "", "";
                        if (not ($stageidReflect == "-1")) {
                            CardActionReflect "focus", "", temp_runCardNow, $stageid;
                        }
                        CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 8)] = "F";
                    }
                    _FutureAdd;
                    ___2 "有更多可添加的状态时，应该更改完善buff条的编辑方式";
                }
                if (CardStage_name_lv__4__mhp_buff_[(((temp_CardActionEnergyExplode - 1) * 8) + 1)] == "瑞比") {
                    CardChange_ID temp_CardActionEnergyExplode, "", "", "1", "", "";
                }
            }
        } else {
            _FutureAdd;
        }
    }
}

onflag {
    clear_graphic_effects;
    AddListInit;
    PlayerMaxHP = "50";
    stagepos_x_y_[1] = "0";
    stagepos_x_y_[2] = "150";
    forever {
        wait_until (Main == "enhance");
        StartEnhance;
        Condition = "inhand";
        wait_until (not (Main == "enhance"));
    }
}

proc StartEnhance {
    cloneType = "system//back";
    clone "_myself_";
    cloneType = "system//enhance";
    clone "_myself_";
    cloneType = "system//detector";
    clone "_myself_";
    cloneType = "system//camera";
    clone "_myself_";
    delete InhandCard_name_lv_damage_hp_e_;
    temp_Start = "0";
    repeat length PossessCard_name_lv_damage_hp_e_ {
        temp_Start++;
        add PossessCard_name_lv_damage_hp_e_[temp_Start] to InhandCard_name_lv_damage_hp_e_;
    }
    cloneType = "enhance//damage";
    clone "_myself_";
    cloneType = "enhance//energy";
    clone "_myself_";
    cloneType = "enhance//hp";
    clone "_myself_";
    CloneInhandCard_Type "enhanceCard";
    CloneSingleCard_Type "upCard";
}

onclone {
    if ("system//" in cloneType) {
        if (cloneType == "system//detector") {
            forever {
                wait_until mouse_down();
                if ((CurrentCard > "0") and (not (Condition == "putstage"))) {
                    if (Main == "game") {
                        CheckCard InhandCard_name_lv_damage_hp_e_[(((CurrentCard - 1) * 5) + 1)], InhandCard_name_lv_damage_hp_e_[(((CurrentCard - 1) * 5) + 2)];
                        if (return_CardCheck == "1") {
                            ___2 "符合条件的才能发动卡牌";
                            Condition = "putstage";
                            SelectedCard = CurrentCard;
                            Movecard_dx = (Touchcard_X - mouse_x());
                            Movecard_dy = (Touchcard_Y - mouse_y());
                        } else {
                            wait_until (not mouse_down());
                        }
                    } else {
                        if (Main == "level") {
                            if ((InhandCard_name_lv_damage_hp_e_[(((CurrentCard - 1) * 5) + 2)] == "1") or (InhandCard_name_lv_damage_hp_e_[(((CurrentCard - 1) * 5) + 2)] == "2")) {
                                ___2 "符合条件的才能发动卡牌";
                                Condition = "putstage";
                                SelectedCard = CurrentCard;
                            } else {
                                wait_until (not mouse_down());
                            }
                        } else {
                            if (Main == "enhance") {
                                if (_CardList_name_type__3__[(item_num(InhandCard_name_lv_damage_hp_e_[(((CurrentCard - 1) * 5) + 1)], _CardList_name_type__3__) + 1)] == "P") {
                                    Condition = "putstage";
                                    SelectedCard = CurrentCard;
                                } else {
                                    wait_until (not mouse_down());
                                }
                            }
                        }
                    }
                } else {
                    wait_until (not mouse_down());
                }
            }
        }
        if ("system//player" in cloneType) {
            point_in_direction 90;
            clear_graphic_effects;
            if ("Num" in cloneType) {
                set_size_to "100";
                forever {
                    tempConst_CardNumMove = (floor (log PlayerHP));
                    MoveTo ((((-230 + (10 * cloneXID)) - (tempConst_CardNumMove * -5)) + ((_SYSTEMbgX - 240) * -0.8)) - Camera_X), ((-70 + (30 * (Condition == "run"))) - Camera_Y);
                    CardNumbersOutlook PlayerHP, "", "20";
                }
            } else {
                switch_costume "player";
                set_size_to "80";
                forever {
                    MoveTo ((-200 + ((_SYSTEMbgX - 240) * -0.8)) - Camera_X), ((-20 + (30 * (Condition == "run"))) - Camera_Y);
                }
            }
        }
        if (cloneType == "system//back") {
            point_in_direction 90;
            clear_graphic_effects;
            switch_costume "back";
            set_size_to "50";
            forever {
                MoveTo (200 + ((_SYSTEMbgX - 240) * 0.8)), "150";
            }
        }
        if (cloneType == "system//next") {
            point_in_direction 90;
            clear_graphic_effects;
            set_brightness_effect 20;
            set_size_to "100";
            forever {
                MoveTo ((220 + ((_SYSTEMbgX - 240) * 0.8)) - Camera_X), (-20 - Camera_Y);
            }
        }
        if (cloneType == "system//run") {
            wait_until (Condition == "inhand");
            forever {
                wait_until (Condition == "run");
                RoundCount++;
                wait_fps_2 "30";
                temp_runCardNow = "5";
                repeat 5 {
                    temp_runCardNow++;
                    if (not (CardStage_name_lv__4__mhp_buff_[(((temp_runCardNow - 1) * 8) + 1)] == "null")) {
                        CardActionPremove CardStage_name_lv__4__mhp_buff_[(((temp_runCardNow - 1) * 8) + 1)], CardStage_name_lv__4__mhp_buff_[(((temp_runCardNow - 1) * 8) + 2)], temp_runCardNow;
                        wait_fps_2 "5";
                    }
                }
                temp_runCardNow = "5";
                repeat 5 {
                    temp_runCardNow++;
                    if (not (CardStage_name_lv__4__mhp_buff_[(((temp_runCardNow - 1) * 8) + 1)] == "null")) {
                        CardActionSpecialpower CardStage_name_lv__4__mhp_buff_[(((temp_runCardNow - 1) * 8) + 1)], CardStage_name_lv__4__mhp_buff_[(((temp_runCardNow - 1) * 8) + 2)], temp_runCardNow;
                        wait_fps_2 "10";
                        CardActionAttack temp_runCardNow;
                        wait_fps_2 "15";
                    }
                }
                wait_fps_2 "30";
                temp_runCardNow = "0";
                repeat 5 {
                    temp_runCardNow++;
                    if (not (CardStage_name_lv__4__mhp_buff_[(((temp_runCardNow - 1) * 8) + 1)] == "null")) {
                        CardActionPremove CardStage_name_lv__4__mhp_buff_[(((temp_runCardNow - 1) * 8) + 1)], "", temp_runCardNow;
                        wait_fps_2 "5";
                    }
                }
                temp_runCardNow = "0";
                repeat 5 {
                    temp_runCardNow++;
                    if (not (CardStage_name_lv__4__mhp_buff_[(((temp_runCardNow - 1) * 8) + 1)] == "null")) {
                        CardActionSpecialpower CardStage_name_lv__4__mhp_buff_[(((temp_runCardNow - 1) * 8) + 1)], "", temp_runCardNow;
                        wait_fps_2 "10";
                        CardActionAttack temp_runCardNow;
                        wait_fps_2 "15";
                    }
                }
                Condition = "inhand";
            }
        }
    }
}

onflag {
    forever {
        wait_until (Main == "game");
        StartGame GameDetail;
        Condition = "inhand";
        wait_until (not (Main == "game"));
    }
}

proc CardNumbersOutlook number, type, d {
    hide;
    set_brightness_effect (-80 + $d);
    if (cloneXID == "1") {
        if ($number > "99") {
            show;
            switch_costume ("number//" & (floor ($number / 100)));
        }
    }
    if (cloneXID == "2") {
        if ($number > "9") {
            show;
            switch_costume ("number//" & ((floor ($number / 10)) % 10));
        }
    }
    if (cloneXID == "3") {
        if (($number > "0") or ($type == "P")) {
            show;
            switch_costume ("number//" & ($number % 10));
        }
    }
}

onflag {
    forever {
        wait_until (Main == "level");
        StartLevelup;
        Condition = "inhand";
        wait_until (not (Main == "level"));
    }
}

proc StartLevelup {
    cloneType = "system//back";
    clone "_myself_";
    cloneType = "system//level";
    clone "_myself_";
    cloneType = "system//detector";
    clone "_myself_";
    cloneType = "system//camera";
    clone "_myself_";
    delete InhandCard_name_lv_damage_hp_e_;
    temp_Start = "0";
    repeat length PossessCard_name_lv_damage_hp_e_ {
        temp_Start++;
        add PossessCard_name_lv_damage_hp_e_[temp_Start] to InhandCard_name_lv_damage_hp_e_;
    }
    cloneType = "level//background";
    clone "_myself_";
    CloneInhandCard_Type "levelCard";
    CloneSingleCard_Type "upCard";
}

onflag {
    forever {
        wait_until (Main == "add");
        StartAddcard GameDetail, "3";
        Condition = "inhand";
        wait_until (not (Main == "add"));
    }
}

proc CardActionBreak cardname, stageid {
    if ($cardname == "希萝茜") {
        _FutureAdd;
    } else {
        if ($cardname == "Christina") {
            AddInhandCard "Christina", CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 2)], (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 3)] + (2 + CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 2)])), CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 7)], CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)];
        }
        if ($cardname == "Cendy") {
            temp_CardActionBreak = "0";
            repeat length PossessCard_name_lv_damage_hp_e_ {
                temp_CardActionBreak++;
                if (PossessCard_name_lv_damage_hp_e_[temp_CardActionBreak] == "Cendy") {
                    PossessCard_name_lv_damage_hp_e_[(temp_CardActionBreak + 2)] = (PossessCard_name_lv_damage_hp_e_[(temp_CardActionBreak + 2)] + CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 2)]);
                }
            }
        }
        if ($cardname == "Candace") {
            temp_CardActionBreak = "0";
            repeat length PossessCard_name_lv_damage_hp_e_ {
                temp_CardActionBreak++;
                if (PossessCard_name_lv_damage_hp_e_[temp_CardActionBreak] == "Candace") {
                    PossessCard_name_lv_damage_hp_e_[(temp_CardActionBreak + 3)] = (PossessCard_name_lv_damage_hp_e_[(temp_CardActionBreak + 3)] + CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 2)]);
                }
            }
        }
        if ($cardname == "Clara") {
            temp_CardActionAvailable = "5";
            repeat 5 {
                temp_CardActionAvailable++;
                if (letter_of(1, CardStage_name_lv__4__mhp_buff_[(((temp_CardActionAvailable - 1) * 8) + 1)]) == "C") {
                    CardChange_ID temp_CardActionAvailable, "", "", "", (10 * CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 2)]), "";
                }
            }
        }
        if ($cardname == "Caitlan") {
            temp_CardActionAvailable = "5";
            repeat 5 {
                temp_CardActionAvailable++;
                if (letter_of(1, CardStage_name_lv__4__mhp_buff_[(((temp_CardActionAvailable - 1) * 8) + 1)]) == "C") {
                    CardChange_ID temp_CardActionAvailable, CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 2)], "", "", "", "";
                }
            }
        }
        if ($cardname == "Caitlin") {
            temp_CardActionAvailable = "5";
            repeat 5 {
                temp_CardActionAvailable++;
                if (CardStage_name_lv__4__mhp_buff_[(((temp_CardActionAvailable - 1) * 8) + 1)] == "Caitlan") {
                    CardChange_ID temp_CardActionAvailable, (5 + (5 * CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 2)])), "", "", "", "";
                }
            }
        }
        CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)] = "null";
        CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 2)] = "";
        CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 3)] = "";
        CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 5)] = "";
        CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 6)] = "";
        CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 7)] = "";
        CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 8)] = "";
    }
    GameoverCheck;
}

proc CardActionRandomAvailable stageid1, stageid2 {
    delete temp_CardActionList;
    temp_CardActionAvailable = ($stageid1 - 1);
    repeat (($stageid2 - $stageid1) + 1) {
        temp_CardActionAvailable++;
        if (not (CardStage_name_lv__4__mhp_buff_[(((temp_CardActionAvailable - 1) * 8) + 1)] == "null")) {
            add temp_CardActionAvailable to temp_CardActionList;
        }
    }
}

proc CloneSingleCard_Type type {
    cloneType = ($type & "//Card");
    clone "_myself_";
    CloneXCardNum_type ($type & "//damageNum");
    CloneXCardNum_type ($type & "//hpNum");
    CloneXCardNum_type ($type & "//energyNum");
}

onclone {
    if ("stage//" in cloneType) {
        ___2 "外观行为";
        hide;
        if (cloneType == "stage//background") {
            show;
            forever {
                switch_costume "stage//background";
                set_size_to (StageSize * 3.6);
            }
        } else {
            if (cloneType == "stage//Card") {
                show;
                forever {
                    switch_costume ("inhand//" & (CardStage_name_lv__4__mhp_buff_[(((cloneID - 1) * 8) + 1)] & CardStage_name_lv__4__mhp_buff_[(((cloneID - 1) * 8) + 2)]));
                    set_brightness_effect (stageLighten * 30);
                    set_size_to (StageSize * 1.2);
                }
            } else {
                if (cloneType == "stage//damageNum") {
                    forever {
                        CardNumbersOutlook CardStage_name_lv__4__mhp_buff_[(((cloneID - 1) * 8) + 3)], "", (stageLighten * 50);
                        set_size_to StageSize;
                    }
                }
                if (cloneType == "stage//hpNum") {
                    forever {
                        CardNumbersOutlook CardStage_name_lv__4__mhp_buff_[(((cloneID - 1) * 8) + 4)], "", (stageLighten * 50);
                        set_size_to StageSize;
                    }
                }
                if (cloneType == "stage//energyNum") {
                    forever {
                        CardNumbersOutlook CardStage_name_lv__4__mhp_buff_[(((cloneID - 1) * 8) + 5)], "", (70 + (stageLighten * 30));
                        set_color_effect 110;
                        set_size_to StageSize;
                    }
                }
                if (cloneType == "stage//defenceNum") {
                    forever {
                        CardNumbersOutlook CardStage_name_lv__4__mhp_buff_[(((cloneID - 1) * 8) + 6)], "", (60 + (stageLighten * 30));
                        set_color_effect 110;
                        set_size_to StageSize;
                    }
                }
                if (cloneType == "stage//defence") {
                    forever {
                        hide;
                        switch_costume "buff//defence";
                        if ((0 + CardStage_name_lv__4__mhp_buff_[(((cloneID - 1) * 8) + 6)]) == "0") {
                            wait_until (CardStage_name_lv__4__mhp_buff_[(((cloneID - 1) * 8) + 6)] > "0");
                        }
                        show;
                        until (not (CardStage_name_lv__4__mhp_buff_[(((cloneID - 1) * 8) + 6)] > "0")) {
                            set_size_to (StageSize / 2);
                        }
                    }
                }
                if (cloneType == "stage//focus") {
                    forever {
                        hide;
                        switch_costume "buff//focus";
                        if (not ("F" in CardStage_name_lv__4__mhp_buff_[(((cloneID - 1) * 8) + 8)])) {
                            wait_until ("F" in CardStage_name_lv__4__mhp_buff_[(((cloneID - 1) * 8) + 8)]);
                        }
                        show;
                        until (not ("F" in CardStage_name_lv__4__mhp_buff_[(((cloneID - 1) * 8) + 8)])) {
                            set_size_to (StageSize * 2);
                        }
                    }
                }
            }
        }
    }
}

proc StartAddcard alltype, count {
    ___2 "M物品牌 P人物牌非妹妹 S妹妹牌";
    cloneType = "system//level";
    clone "_myself_";
    cloneType = "system//detector";
    clone "_myself_";
    cloneType = "system//camera";
    clone "_myself_";
    delete InhandCard_name_lv_damage_hp_e_;
    until (length InhandCard_name_lv_damage_hp_e_ == $count) {
        RandomNumber;
        temp_Start = (return_randnum % (length _CardList_name_type__3__ / 5));
        if (("M" in $alltype) and ((not (_CardList_name_type__3__[((temp_Start * 5) + 1)] == "能量棒")) and (_CardList_name_type__3__[((temp_Start * 5) + 2)] == "M"))) {
            AddInhandCard _CardList_name_type__3__[(((temp_Start - 1) * 5) + 1)], "", "", "", "";
        }
        if (("P" in $alltype) and ((not ((_CardList_name_type__3__[((temp_Start * 5) + 1)] == "意识集合") or (letter_of(1, _CardList_name_type__3__[((temp_Start * 5) + 1)]) == "C"))) and (_CardList_name_type__3__[((temp_Start * 5) + 2)] == "P"))) {
            AddInhandCard _CardList_name_type__3__[(((temp_Start - 1) * 5) + 1)], "1", _CardList_name_type__3__[(((temp_Start - 1) * 5) + 3)], "50", "";
        }
        if (("S" in $alltype) and ((_CardList_name_type__3__[((temp_Start * 5) + 1)] == "意识集合") or (letter_of(1, _CardList_name_type__3__[((temp_Start * 5) + 1)]) == "C"))) {
            AddInhandCard _CardList_name_type__3__[(((temp_Start - 1) * 5) + 1)], "1", "", "50", "";
        }
    }
    cloneType = "add//background";
    clone "_myself_";
    CloneInhandCard_Type "addCard";
    CloneSingleCard_Type "upCard";
}

proc CardActionRemove cardname, level, stageid {
    ___2 "表述了卡牌击破后的行为";
    _FutureAdd;
}

proc CardActionReflect typename, HP, stageidTrigger, stageid {
    ___2 "stageid 反射给stageidTrigger效应";
    _LOG ((($typename & " ") & $stageidTrigger) & (" " & $stageid));
    if ($typename == "damage") {
        if ((not ($stageidTrigger == $stageid)) and (not ($stageidTrigger == ""))) {
            if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)] == "樱莲") {
                _LOG ("樱莲" & $stageidTrigger);
                CardChange_ID $stageid, "", "", CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 2)], "", "-1";
            }
            if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)] == "星空") {
                CardChange_ID $stageidTrigger, "", "", (0 - CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 2)]), "", "-1";
            }
        }
    }
    if ($typename == "defbreak") {
        if (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 1)] == "尾兜") {
            delete temp_CardActionList;
            temp_CardActionAvailable = "5";
            repeat 5 {
                temp_CardActionAvailable++;
                if (not (temp_CardActionAvailable == $stageid)) {
                    if (not (CardStage_name_lv__4__mhp_buff_[(((temp_CardActionAvailable - 1) * 8) + 1)] == "null")) {
                        if (_CardList_name_type__3__[(item_num(CardStage_name_lv__4__mhp_buff_[(((temp_CardActionAvailable - 1) * 8) + 1)], _CardList_name_type__3__) + 1)] == "P") {
                            add temp_CardActionAvailable to temp_CardActionList;
                        }
                    }
                }
            }
            RandomNumber;
            if (length temp_CardActionList > "0") {
                CardChange_ID temp_CardActionList[((return_randnum % length temp_CardActionList) + 1)], "", "", (CardStage_name_lv__4__mhp_buff_[((($stageid - 1) * 8) + 2)] + 1), "", "-1";
            }
        }
    }
    if ($typename == "focus") {
        temp_CardActionReflect = "5";
        repeat 5 {
            temp_CardActionReflect++;
            if (CardStage_name_lv__4__mhp_buff_[(((temp_CardActionReflect - 1) * 8) + 1)] == "云落") {
                temp_CardActionAvailable = "5";
                repeat 5 {
                    temp_CardActionAvailable++;
                    RandomNumber;
                    if ((return_randnum % 4) < (CardStage_name_lv__4__mhp_buff_[(((temp_CardActionReflect - 1) * 8) + 2)] + 1)) {
                        CardChange_ID temp_CardActionAvailable, "", "", "1", "", "-1";
                    }
                }
            }
            if (CardStage_name_lv__4__mhp_buff_[(((temp_CardActionReflect - 1) * 8) + 1)] == "AChy") {
                CardChange_ID temp_CardActionReflect, CardStage_name_lv__4__mhp_buff_[(((temp_CardActionReflect - 1) * 8) + 2)], "", "", "", "-1";
            }
        }
    }
}

onclone {
    if ("putCard//" in cloneType) {
        ___2 "放置行为";
        forever {
            wait_until (Condition == "putstage");
            wait_until (not mouse_down());
            PutStageCheck SelectedCard, CurrentStagecard, item_num(InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 1)], _CardList_name_type__3__), "";
            ___2 "inhandcard(4*(order-1)+1)是卡牌名，找到cardlist对应的卡牌，然后查询属性";
            Condition = "inhand";
        }
    }
    if ("upcard//" in cloneType) {
        forever {
            wait_until (Condition == "putstage");
            wait_until (not mouse_down());
            if (Main == "enhance") {
                if (CurrentStagecard == "0") {
                    if ("//Card" in cloneType) {
                        Condition = "inhand";
                    }
                } else {
                    if ("//Card" in cloneType) {
                        if (CurrentStagecard == "1") {
                            PossessCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 3)] = (InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 3)] + 1);
                        } else {
                            if (CurrentStagecard == "2") {
                                PossessCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 5)] = (InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 5)] + 1);
                            } else {
                                if (CurrentStagecard == "3") {
                                    PossessCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 4)] = (InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 4)] + 5);
                                }
                            }
                        }
                        AddEffect "enhance", "", "", "", "", "";
                        IsFinish_ = "1";
                        wait_fps_2 "30";
                        Main = "map";
                    }
                }
            }
            if (Main == "level") {
                if (CurrentStagecard == "0") {
                    if ("//Card" in cloneType) {
                        Condition = "inhand";
                    }
                } else {
                    if ("//Card" in cloneType) {
                        PossessCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 2)] = (InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 2)] + 1);
                        AddEffect "enhance", "", "", "", "", "";
                    }
                    IsFinish_ = "1";
                    wait_fps_2 "30";
                    Main = "map";
                }
            }
            if (Main == "add") {
                if (CurrentStagecard == "0") {
                    if ("//Card" in cloneType) {
                        Condition = "inhand";
                    }
                } else {
                    if ("//Card" in cloneType) {
                        add InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 1)] to PossessCard_name_lv_damage_hp_e_;
                        add InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 2)] to PossessCard_name_lv_damage_hp_e_;
                        add InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 3)] to PossessCard_name_lv_damage_hp_e_;
                        add InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 4)] to PossessCard_name_lv_damage_hp_e_;
                        add InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 5)] to PossessCard_name_lv_damage_hp_e_;
                        AddEffect "enhance", "", "", "", "", "";
                    }
                    IsFinish_ = "1";
                    wait_fps_2 "30";
                    Main = "map";
                }
            }
        }
    }
}

onclone {
    if ("stage//" in cloneType) {
        ___2 "拖拽时的高亮提示";
        stageLighten = "0";
        if (cloneType == "stage//background") {
            clear_graphic_effects;
            forever {
                set_ghost_effect 0;
                wait_until (Condition == "putstage");
                until (not (Condition == "putstage")) {
                    PutStageCheck SelectedCard, CurrentStagecard, item_num(InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 1)], _CardList_name_type__3__), (not "");
                    SpeicialEffectSmoothly_Brigntness "", (50 * return_PutStageCheck);
                }
            }
        } else {
            forever {
                set_ghost_effect ((cloneType == "stage//focus") * 50);
                stageLighten = "0";
                wait_until (Condition == "putstage");
                until (not (Condition == "putstage")) {
                    PutStageCheck SelectedCard, cloneID, item_num(InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 1)], _CardList_name_type__3__), (not "");
                    if (cloneType == "stage//focus") {
                        SpeicialEffectSmoothly_Brigntness "", (75 - (25 * return_PutStageCheck));
                    } else {
                        SpeicialEffectSmoothly_Brigntness "", (50 - (50 * return_PutStageCheck));
                    }
                    stageLighten = ((CurrentStagecard == cloneID) * return_PutStageCheck);
                }
            }
        }
    }
}

onclone {
    if ("putCard//" in cloneType) {
        ___2 "外观行为1";
        forever {
            if ((((mouse_y() + Camera_Y) * 100) / StageSize) > "150") {
                temp_PutCardSize = (StageSize * 1.1);
            } else {
                temp_PutCardSize = ((StageSize * 1.1) + ((((((mouse_y() + Camera_Y) * 100) / StageSize) - 150) / ((((mouse_y() + Camera_Y) * 100) / StageSize) - -500)) * (StageSize - 75)));
            }
            if ("//Card" in cloneType) {
                MoveTo mouse_x(), mouse_y();
                set_size_to (temp_PutCardSize * 1.08);
            } else {
                if ("//hpNum" in cloneType) {
                    tempConst_CardNumMove = (floor (log (0 + InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 4)])));
                    MoveTo ((((5 + (5 * cloneXID)) - (tempConst_CardNumMove * -2.5)) * (temp_PutCardSize / StageSize)) + mouse_x()), ((-33 * (temp_PutCardSize / StageSize)) + mouse_y());
                }
                if ("//damageNum" in cloneType) {
                    tempConst_CardNumMove = (floor (log (0 + InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 3)])));
                    MoveTo ((((-33 + (5 * cloneXID)) - (tempConst_CardNumMove * -2.5)) * (temp_PutCardSize / StageSize)) + mouse_x()), ((-33 * (temp_PutCardSize / StageSize)) + mouse_y());
                }
                if ("//energyNum" in cloneType) {
                    tempConst_CardNumMove = (floor (log (0 + InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 5)])));
                    MoveTo (((((-14 + (9 * (InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 1)] == "能量棒"))) + (5 * cloneXID)) - (tempConst_CardNumMove * -2.5)) * (temp_PutCardSize / StageSize)) + mouse_x()), (((-33 + (6 * (InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 1)] == "能量棒"))) * (temp_PutCardSize / StageSize)) + mouse_y());
                }
                set_size_to temp_PutCardSize;
            }
        }
    }
    if ("upCard//" in cloneType) {
        if ("//Card" in cloneType) {
            delete UpCard_X_Y_;
            add "" to UpCard_X_Y_;
            add "" to UpCard_X_Y_;
        }
        forever {
            if (((mouse_y() + Camera_Y) * 50) > "150") {
                temp_PutCardSize = "80";
            } else {
                temp_PutCardSize = (80 + ((((((mouse_y() + Camera_Y) * 100) / 80) - 150) / ((((mouse_y() + Camera_Y) * 100) / 80) - -500)) * 13));
            }
            if ("//Card" in cloneType) {
                if (IsFinish_ == "0") {
                    MoveTo mouse_x(), mouse_y();
                    UpCard_X_Y_[1] = mouse_x();
                    UpCard_X_Y_[2] = mouse_y();
                } else {
                    MoveToSmoothly "", "";
                    UpCard_X_Y_[1] = x_position();
                    UpCard_X_Y_[2] = y_position();
                }
                set_size_to (temp_PutCardSize * 1.08);
            } else {
                if ("//hpNum" in cloneType) {
                    tempConst_CardNumMove = (floor (log (0 + InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 4)])));
                    MoveTo ((((5 + (5 * cloneXID)) - (tempConst_CardNumMove * -2.5)) * (temp_PutCardSize / 50)) + UpCard_X_Y_[1]), ((-33 * (temp_PutCardSize / 50)) + UpCard_X_Y_[2]);
                }
                if ("//damageNum" in cloneType) {
                    tempConst_CardNumMove = (floor (log (0 + InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 3)])));
                    MoveTo ((((-33 + (5 * cloneXID)) - (tempConst_CardNumMove * -2.5)) * (temp_PutCardSize / 50)) + UpCard_X_Y_[1]), ((-33 * (temp_PutCardSize / 50)) + UpCard_X_Y_[2]);
                }
                if ("//energyNum" in cloneType) {
                    tempConst_CardNumMove = (floor (log (0 + InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 5)])));
                    MoveTo ((((-15 + (5 * cloneXID)) - (tempConst_CardNumMove * -2.5)) * (temp_PutCardSize / 50)) + UpCard_X_Y_[1]), ((-33 * (temp_PutCardSize / 50)) + UpCard_X_Y_[2]);
                }
                set_size_to temp_PutCardSize;
            }
        }
    }
}

onclone {
    if ("putCard//" in cloneType) {
        ___2 "外观行为2";
        clear_graphic_effects;
        point_in_direction 90;
        forever {
            wait_until (Condition == "putstage");
            if (cloneType == "putCard//Card") {
                switch_costume ("inhand//" & (InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 1)] & InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 2)]));
                show;
            } else {
                if (cloneType == "putCard//damageNum") {
                    CardNumbersOutlook InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 3)], "", "";
                }
                if (cloneType == "putCard//hpNum") {
                    CardNumbersOutlook InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 4)], "", "";
                }
                if (cloneType == "putCard//energyNum") {
                    CardNumbersOutlook InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 5)], "", "70";
                    set_color_effect 110;
                }
            }
            wait_until (not (Condition == "putstage"));
            hide;
        }
    }
    if ("upCard//" in cloneType) {
        clear_graphic_effects;
        point_in_direction 90;
        if (Main == "enhance") {
            forever {
                hide;
                wait_until (Condition == "putstage");
                if (cloneType == "upCard//Card") {
                    switch_costume ("inhand//" & (InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 1)] & InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 2)]));
                    show;
                    wait_until (not (Condition == "putstage"));
                } else {
                    if (cloneType == "upCard//damageNum") {
                        until (not (Condition == "putstage")) {
                            CardNumbersOutlook (InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 3)] + (CurrentStagecard == "1")), "", (50 * (CurrentStagecard == "1"));
                        }
                    }
                    if (cloneType == "upCard//hpNum") {
                        until (not (Condition == "putstage")) {
                            CardNumbersOutlook (InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 4)] + (5 * (CurrentStagecard == "3"))), "", (50 * (CurrentStagecard == "3"));
                        }
                    }
                    if (cloneType == "upCard//energyNum") {
                        set_color_effect 110;
                        until (not (Condition == "putstage")) {
                            CardNumbersOutlook (InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 5)] + (CurrentStagecard == "2")), "", (60 + (20 * (CurrentStagecard == "2")));
                        }
                    }
                }
            }
        }
        if (Main == "level") {
            forever {
                hide;
                wait_until (Condition == "putstage");
                if (cloneType == "upCard//Card") {
                    show;
                    until (not (Condition == "putstage")) {
                        switch_costume ("inhand//" & (InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 1)] & ((CurrentStagecard > "0") + InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 2)])));
                    }
                } else {
                    if (cloneType == "upCard//damageNum") {
                        until (not (Condition == "putstage")) {
                            CardNumbersOutlook InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 3)], "", "";
                        }
                    }
                    if (cloneType == "upCard//hpNum") {
                        until (not (Condition == "putstage")) {
                            CardNumbersOutlook InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 4)], "", "";
                        }
                    }
                    if (cloneType == "upCard//energyNum") {
                        set_color_effect 110;
                        until (not (Condition == "putstage")) {
                            CardNumbersOutlook InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 5)], "", "60";
                        }
                    }
                }
            }
        }
        if (Main == "add") {
            forever {
                hide;
                wait_until (Condition == "putstage");
                if (cloneType == "upCard//Card") {
                    show;
                    until (not (Condition == "putstage")) {
                        switch_costume ("inhand//" & (InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 1)] & InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 2)]));
                    }
                } else {
                    if (cloneType == "upCard//damageNum") {
                        until (not (Condition == "putstage")) {
                            CardNumbersOutlook InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 3)], "", "";
                        }
                    }
                    if (cloneType == "upCard//hpNum") {
                        until (not (Condition == "putstage")) {
                            CardNumbersOutlook InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 4)], "", "";
                        }
                    }
                    if (cloneType == "upCard//energyNum") {
                        set_color_effect 110;
                        until (not (Condition == "putstage")) {
                            CardNumbersOutlook InhandCard_name_lv_damage_hp_e_[(((SelectedCard - 1) * 5) + 5)], "", "60";
                        }
                    }
                }
            }
        }
    }
}


target "Effect";

costumes "845e0684a7a3900896889eb55b5d4c3e.svg" as "fragment//1", "b69c11d4613ae51a1b2abc7f29a8cecf.svg" as "fragment//2", "5005b549fe531d0610633bcac28b4dd3.svg" as "fragment//3", "4ac9bc287ceec0377789b68a4ed0cbcb.svg" as "fragment//4", "5aa56cdfbaa5163e0e9fc443376dce2f.svg" as "fragment//5", "66bee8f9144d3dfc34a3020faa484947.svg" as "fragment//6", "e9f5d066524a278f9bee4bec613d1f56.svg" as "lock", "cd21514d0531fdffb22204e0ec5ed84a.svg" as "empty", "ae5b2e711979769e1115819a2587720e.svg" as "full", "0cd8b68700e359cf840e220e4c0969ad.svg" as "normal", "df5b198fd19436b0509fdf0040e959dd.svg" as "number//+", "3b625563fbaa2d6cd68ad513a54110c2.svg" as "number//++", "862546a4b830f9f66d6af521e2daaa5a.svg" as "number//+-", "83856fb3afe11a155f8ead737cc203af.svg" as "number//-", "d96dff11920a30e431e32f88a9245cd9.svg" as "number//-+", "17ed848d3b449f8aa4c5c8ad8af12928.svg" as "number//--", "783b6f95a68ecbe24f0751c7c61561a2.svg" as "number//1", "db76145647278a2a5e0ff8506ca04b01.svg" as "number//1+", "f37bb10e443c6a4963edcfaaf2d14189.svg" as "number//1-", "b09a4a510aec32c0499f2d98321ca1d3.svg" as "number//2", "a92f90dba75e22c9f6eb7d3dcfd2ce92.svg" as "number//2+", "77fdffd64098205cfc9d02a09d8b273e.svg" as "number//2-", "deb61dec3f9f462d78529669b50bb0d4.svg" as "number//3", "5524135781c6778d0ed736a00ab4abd0.svg" as "number//3+", "e74affd7c6ce7ec96dbecbfee2c9afe4.svg" as "number//3-", "8aa0a65163a1c789c69df056eae23899.svg" as "number//4", "e095e94c13e30d7763b7c56038e774de.svg" as "number//4+", "5c47d4390e327758bfb272d66f2968e3.svg" as "number//4-", "fd1507e3e24af45db0130ddb05af9bdc.svg" as "number//5", "18db7e17a0db7ff5f79e48b71038b30e.svg" as "number//5+", "fc4ed6226c349508638f1af63f3786a4.svg" as "number//5-", "933537718f881e1c8f38434cf9417c76.svg" as "number//6", "6e308361563a9c60b051edca580d0941.svg" as "number//6+", "d35f18aee0ab378bce02089d257fd0c4.svg" as "number//6-", "6e470d010c2ec61bdad8a50b2685c08d.svg" as "number//7", "5bfa07de3628c17c92bf50b31449f2de.svg" as "number//7+", "969a866d9f4607a11dad386bcff5ab19.svg" as "number//7-", "ee199117518b106fe2719c91cf423ffd.svg" as "number//8", "9ca0ae6d123c069934392071c4179ce6.svg" as "number//8+", "851a20a5cc20d23a1a037bf52ffa6c2e.svg" as "number//8-", "51a46387a85ef3d85e82b1709f129b40.svg" as "number//9", "25d5ba1f4e1dd8e8df064798d55eb0a3.svg" as "number//9+", "064fa393b299012d62ea9fe36aa69e41.svg" as "number//9-", "93967d5f7d28a049db451f3e1b14fc40.svg" as "number//0", "5c404c3b56155dba5168e3a81845013a.svg" as "number//0+", "261989d4b25c0c369304ea42d3583aa3.svg" as "number//0-", "f4ca54b79e031ec38b513bdbab29f0e2.svg" as "delete", "edd6e3d8f181308f97760e6407d23879.svg" as "delete-", "0385a9e010b27416957efbbc61f2cac2.svg" as "end", "897eb9456606ff489790c6ab9f454d32.svg" as "end-", "ae8b0395f9f3231a0f7f0ec7bf09deee.svg" as "arrow", "6085e6cd9b48c54d9c68826c65a2c8b4.svg" as "arrow2", "b177aa0ca681a71ddca858c0547cf3d8.svg" as "arrow-", "7b9081779f391532d2813a3f5cfd9800.svg" as "arrow-2", "5e5d200567489d73ae9380b53b81ae09.svg" as "arrow(1", "ff44982a79c74fa974239f925bf54953.svg" as "arrow(2", "b82d638945bbf1a61918efbbf8f70a4f.svg" as "arrow(3", "42bad3972066c2da43a4dd15ea33f7de.svg" as "arrow(4", "b07b814de56f6a263c8c9348fc64d25c.svg" as "arrow(12", "7e8c8f207754082e50715a84c4aa3dbe.svg" as "arrow(22", "39ee4db72005c8ce52715005294c5aa9.svg" as "arrow(32", "54a99b630d46dbacea98328ed183cbe6.svg" as "arrow(42", "a25a6e7df0e35ea9de681fae8ad6c1e1.svg" as "attack//1", "50f80d67b22d77f9f47a5864269c3a41.svg" as "attack//2", "4d97b808445374963efc502f679d7bbf.svg" as "attack//3", "f1c4b931eb93cce326e7bd7d92f4eec6.svg" as "attack//4", "de5fda6986d74967806e25f0ca36dfd9.svg" as "attack//5", "9b38b4754693b64fadd2c1d9afb143ff.svg" as "attack//6", "a34e895f108fab185afc1944f738244b.svg" as "attack//7", "da3d3d56b064fa8662b40cd9f687002a.svg" as "attack//8", "92e3cc9b758d8675b70f57d81f2d9952.svg" as "attack//9", "c9c141bd783a5843487cd72ec17fcc3d.svg" as "damage", "07b3f42214f9814d8d8ff5f511d1476a.svg" as "energy", "475438f9f6eb10e444163957b1434944.svg" as "hp", "bd05fdd10ce94aa5f23e8d68f9567f67.svg" as "defence", "97e4c9a51ea1294ab937b42b2dc43996.svg" as "sp", "6499c8b48cfab82d63f345e161ddfad2.svg" as "add", "f9dfeb56c57a3cc2eb0770119200c397.svg" as "recovery", "18c266e419b65da0fc5c5bb00d5c6127.png" as "hit//1", "25c4c2d2e2c5fbc5cf5944bbf8ea9344.png" as "hit//2", "c9dcb2d02fd30d5049cbd710820996d9.png" as "hit//3", "93ea3a79ff5ea6ee5c9c4bb5f618d7f3.png" as "hit//4", "a7a3d9a39c1ea3db4843f73652cf46c7.png" as "hit//5", "0212e796d075748f9725bf6f93ebce0b.png" as "hit//6";
sounds "83a9787d4cb6f3b7632b4ddfebf74367.wav" as "啵", "4b33c58ba14e4555373fa2478b3f891f.wav" as "Glass Breaking";
var __ = "1";
var x = "0";
var y = "100";
var ___2 = "50";
var ___3 = 4.2804228860887195;
var ___4 = 15;
var ____ = "0";
var _____2 = 0;
var ___5 = 121;
var lock__stage = "";
var clonex = -10;
var cloney = 20;
var effect_x__ = "";
var effect_y__ = "";
var effect_lock__ = 0;
var effect_extra_ = "";
var cloneType_2 = "hp-";
var temp_setSize_2 = "attack//7";
var temp_moveto_2 = "attack//7";
var cloneID_2 = 3;
list boom = [12, 4, 10, -16, -150];
list card_deleteChoice_;
set_x 150;
set_y 5.000000000000028;
set_size 240;
hide;

proc set_size_to_2 size {
    temp_setSize_2 = costume_name();
    switch_costume "full";
    if ($size < "100") {
        switch_costume "full";
    } else {
        switch_costume "empty";
    }
    set_size $size;
    switch_costume temp_setSize;
}

proc move_to_ x, y {
    temp_moveto_2 = costume_name();
    switch_costume "full";
    goto $x, $y;
    switch_costume temp_moveto;
}

proc AddEffect_2 name, p1, p2, p3, p4, p5 {
    add $name to Effect_name__5__;
    add $p1 to Effect_name__5__;
    add $p2 to Effect_name__5__;
    add $p3 to Effect_name__5__;
    add $p4 to Effect_name__5__;
    add $p5 to Effect_name__5__;
}

proc Explode x, y, dt, type {
    repeat random(30, 50) {
        goto random(($x + $dt), ($x - $dt)), random(($y + $dt), ($y - $dt));
        if ($type == "break") {
            switch_costume ("fragment//" & random(1, 6));
        } else {
            if ($type == "enhance") {
                switch_costume "add";
            } else {
            }
        }
        clone "_myself_";
    }
}

proc ___3 number_or_text {
}

proc CloneEffect {
    until (length Effect_name__5__ == "0") {
        CloneEffectSingle;
        repeat 6 {
            delete Effect_name__5__[1];
        }
    }
}

onflag {
    switch_costume "empty";
    delete Effect_name__5__;
    forever {
        wait_until (not (length Effect_name__5__ == "0"));
        CloneEffect;
    }
}

nowarp proc wait_fps_3 fps {
    repeat $fps {
        wait 0;
    }
}

proc CloneEffectSingle {
    hide;
    point_in_direction 90;
    clear_graphic_effects;
    cloneType_2 = Effect_name__5__[1];
    cloneID_2 = Effect_name__5__[2];
    if (Effect_name__5__[1] == "attack") {
        switch_costume ("attack//" & (abs (Effect_name__5__[2] - Effect_name__5__[3])));
        if (Effect_name__5__[2] > "5") {
            point_in_direction 90;
        } else {
            point_in_direction -90;
        }
        set_size_to_2 "240";
        move_to_ ((((-300 + (((Effect_name__5__[2] - 1) % 5) * 150)) + 0) * (StageSize / 100)) - Camera_X), ((250 * (StageSize / 100)) - Camera_Y);
        clone "_myself_";
    }
    if (Effect_name__5__[1] == "boom") {
    }
    if (Effect_name__5__[1] == "enhance") {
        set_color_effect -50;
        set_brightness_effect 50;
        Explode "", "", "50", Effect_name__5__[1];
    }
    if (Effect_name__5__[1] == "break") {
        set_color_effect 100;
        Explode ((((-300 + (((Effect_name__5__[2] - 1) % 5) * 150)) + 0) * (StageSize / 100)) - Camera_X), ((250 * (StageSize / 100)) - Camera_Y), "50", Effect_name__5__[1];
    }
    if (Effect_name__5__[1] == "explode") {
    }
    if (letter_of((length Effect_name__5__[1]), Effect_name__5__[1]) == "+") {
        if (Effect_name__5__[1] == "damage+") {
            switch_costume "damage";
        }
        if (Effect_name__5__[1] == "energy+") {
            switch_costume "energy";
        }
        if (Effect_name__5__[1] == "hp+") {
            switch_costume "hp";
        }
        if (Effect_name__5__[1] == "defence+") {
            switch_costume "defence";
        }
        set_size_to_2 "60";
        clone "_myself_";
        if (Effect_name__5__[1] == "hp+") {
            cloneType_2 = "recovery";
            switch_costume "recovery";
            repeat random(8, 10) {
                set_size_to_2 random(20, 40);
                clonex = (random(-10, 10) * 5);
                cloney = (random(0, 10) * 5);
                clone "_myself_";
            }
        }
    }
    if (letter_of((length Effect_name__5__[1]), Effect_name__5__[1]) == "-") {
    }
}

orphan {
    switch_costume Effect_name__5__[1];
    clonex = Effect_name__5__[2];
    cloney = Effect_name__5__[3];
    lock__stage = Effect_name__5__[4];
    effect_extra_ = Effect_name__5__[5];
    effect_lock__ = "0";
    effect_x__ = Effect_name__5__[2];
    effect_y__ = Effect_name__5__[3];
    goto Effect_name__5__[2], Effect_name__5__[3];
}

orphan {
    AddEffect_2 "defence+", "8", "", "", "", "";
    AddEffect_2 "damage+", "8", "", "", "", "";
    AddEffect_2 "hp+", "8", "", "", "", "";
    AddEffect_2 "energy+", "8", "", "", "", "";
}

orphan {
    wait_fps_3 "5";
}

orphan {
    AddEffect_2 "break", "8", "", "", "", "";
}

onclone {
    if (cloneType == "recovery") {
        show;
        goto_front;
        set_ghost_effect 0;
        repeat 20 {
            cloney += 5;
            change_ghost_effect 5;
        }
        delete_this_clone;
    }
    if (cloneType == "attack") {
        show;
        goto_front;
        set_ghost_effect 20;
        wait_fps_3 "5";
        repeat 8 {
            change_ghost_effect 10;
        }
        delete_this_clone;
    }
    if ("+" in cloneType) {
        show;
        goto_front;
        repeat 10 {
            set_size_to_2 (size() + 10);
            change_ghost_effect 10;
        }
        delete_this_clone;
    }
    if ("-" in cloneType) {
        show;
        goto_front;
        wait_fps_3 "3";
        repeat 10 {
            set_size_to_2 (size() + 10);
            change_ghost_effect 10;
        }
        delete_this_clone;
    }
    if ((cloneType == "enhance") or (cloneType == "break")) {
        set_ghost_effect random(0, 80);
        set_size random(0, 100);
        goto_front;
        show;
        delete boom;
        add random(10, 20) to boom;
        add random(1, 5) to boom;
        add random(-20, 20) to boom;
        add "0" to boom;
        add random(-180, 180) to boom;
        until (((x_position() < "-315") or (x_position() > "315")) or (y_position() < "-175")) {
            change_x ((cos boom[5]) * boom[1]);
            change_y ((sin boom[5]) * boom[1]);
            turn_right boom[3];
            change_y boom[4];
            boom[4] = (boom[4] - boom[2]);
        }
        delete_this_clone;
    }
}

onclone {
    if (cloneType == "damage+") {
        forever {
            move_to_ (((-342 + (((cloneID - 1) % 5) * 150)) * (StageSize / 100)) - Camera_X), (((287 + ((cloneID > "5") * -220)) * (StageSize / 100)) - Camera_Y);
        }
    }
    if (cloneType == "energy+") {
        forever {
            move_to_ (((-300 + (((cloneID - 1) % 5) * 150)) * (StageSize / 100)) - Camera_X), (((287 + ((cloneID > "5") * -220)) * (StageSize / 100)) - Camera_Y);
        }
    }
    if (cloneType == "hp+") {
        forever {
            move_to_ (((-257 + (((cloneID - 1) % 5) * 150)) * (StageSize / 100)) - Camera_X), (((287 + ((cloneID > "5") * -220)) * (StageSize / 100)) - Camera_Y);
        }
    }
    if (cloneType == "defence+") {
        forever {
            move_to_ (((-350 + (((cloneID - 1) % 5) * 150)) * (StageSize / 100)) - Camera_X), (((420 + ((cloneID > "5") * -220)) * (StageSize / 100)) - Camera_Y);
        }
    }
    if (cloneType == "recovery") {
        forever {
            move_to_ ((((-300 + (((cloneID - 1) % 5) * 150)) + clonex) * (StageSize / 100)) - Camera_X), ((((305 + cloney) + ((cloneID > "5") * -207)) * (StageSize / 100)) - Camera_Y);
        }
    }
}


target "Music";

costumes "3339a2953a3bf62bb80e54ff575dbced.svg" as "造型1";
sounds "3e20787253ea08f107ecafdcadb83e33.wav" as "typing", "e6680d8b6fbad380567bdc232aeefae4.wav" as "clock", "e31cac701d7b121a86ee6c8149cda4a7.wav" as "ticking", "06e98c73663f3e9216941994a0757090.wav" as "break1", "e6a819a243b8774997a787ae19326762.wav" as "break2", "937483b5a39fcc4804b123c00ccef319.wav" as "break3";
list clone_info_order_type_;
set_x 36;
set_y 28;

proc load_music {
    until (length Music == "0") {
        start_sound Music[1];
        delete Music[1];
    }
}

onflag {
}

orphan {
    delete Music;
    forever {
        wait_until (not (length Music == "0"));
        load_music;
    }
}


target "Text";

costumes "cd21514d0531fdffb22204e0ec5ed84a.svg" as "empty", "524a340d0ce6c8fc31e5ff7a4a112976.svg" as "full", "32e16a33ebdb1941c9b85ea7fabe570a.svg" as "~", "dc7b44f7e52befd2b2711a3bc401d170.svg" as "0", "7870b55a5c832234d65341c801a1b047.svg" as "1";
var cloneID_3 = 18;
var cloneEx = "0";
var temp_moveto_3 = "0";
set_x 140;
set_y -95;
set_size 60;
hide;

proc AddText_2 text, x, y, size, color, _ln, shake {
    add $text to Text_text__6__;
    add $x to Text_text__6__;
    add $y to Text_text__6__;
    add $size to Text_text__6__;
    add $color to Text_text__6__;
    add $_ln to Text_text__6__;
    add $shake to Text_text__6__;
}

onflag {
    switch_costume "empty";
    hide;
    delete Text_text__6__;
    forever {
        wait_until (not (length Text_text__6__ == "0"));
        CloneText;
    }
}

onclone {
    wait_until mouse_down();
    wait_until (not mouse_down());
    repeat 10 {
        change_ghost_effect 10;
        move_to__2 x_position(), (y_position() + 2);
    }
    delete_this_clone;
}

proc move_to__2 x, y {
    temp_moveto_3 = costume_name();
    switch_costume "full";
    goto $x, $y;
    switch_costume temp_moveto;
}

proc CloneText {
    ___4 "color：颜色+亮度+??";
    until (length Text_text__6__ == "0") {
        clear_graphic_effects;
        switch_costume "full";
        set_size (Text_text__6__[4] * 3);
        cloneEx = Text_text__6__[7];
        cloneID_3 = "0";
        set_color_effect ((floor (Text_text__6__[5] / 10000)) * 2);
        set_brightness_effect ((((floor (Text_text__6__[5] / 100)) % 100) - 50) * 2);
        set_pixelate_effect ((Text_text__6__[5] % 100) * 2);
        repeat (length Text_text__6__[1]) {
            cloneID_3++;
            move_to__2 (Text_text__6__[2] + (((cloneID - 1) % Text_text__6__[6]) * Text_text__6__[4])), (Text_text__6__[3] - ((floor ((cloneID - 1) / Text_text__6__[6])) * Text_text__6__[4]));
            switch_costume "0";
            switch_costume letter_of(cloneID, Text_text__6__[1]);
            clone "_myself_";
        }
        repeat 7 {
            delete Text_text__6__[1];
        }
    }
}

onclone {
    set_ghost_effect 100;
    show;
    goto_front;
    wait_fps_4 cloneID;
    repeat 10 {
        change_ghost_effect -10;
    }
}

nowarp proc wait_fps_4 fps {
    repeat $fps {
        wait 0;
    }
}

orphan {
    AddText_2 "01010111010100010110110101~", "-220", "180", "30", "505020", "10", "1";
}

proc ___4 number_or_text {
}

onclone {
    if (costume_name() == "~") {
        forever {
            if ((round timer()) == (floor timer())) {
                show;
            } else {
                hide;
            }
        }
    }
}


target "System";

costumes "3339a2953a3bf62bb80e54ff575dbced.svg" as "造型1";
set_x 320;
set_y 180;

onflag {
    goto 10000, 10000;
    _SYSTEMbgX = x_position();
    _SYSTEMbgY = y_position();
}
