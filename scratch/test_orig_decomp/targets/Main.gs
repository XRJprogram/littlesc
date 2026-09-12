target "Main";

costumes "14e46ec3e2ba471c2adfe8f119052307.svg" as "empty", "ecc7fb49285bd08e02ad217c16d29420.svg" as "full", "1702dd3281c681039ac9fd5515af3f0b.svg" as "map//fight", "36d4348deee82ff5339dddb4eacf81ae.svg" as "map//spring", "af7bf1b8251feb62e751a63b83b51ed8.svg" as "map//reward", "0b7c7127c2a0b88dcc2e9e0c82a46443.svg" as "map//choose", "7be267ccbbfd1a3eb275e7af80b4ba62.svg" as "box//empty", "39be340384d3d42e87a058474c4aeaa0.svg" as "box//player", "e6520ed3d757e5b97b3b262d43cbf394.svg" as "box//sisters", "05bbcbae05fbbc0091ed720ef513a674.svg" as "box//sisters2", "efffae28616ed4a74128cd42bb8c5cbe.svg" as "box//boss", "af06fb2ff07a97f21b134df22758a635.svg" as "box//alice", "0490f097d5f27e06af5899db28a5b905.svg" as "box//szilassi", "183f6248b67d9867aba178b089dea9a2.svg" as "main//0", "9013fe74d8262d12a9b45d2da7d385c3.svg" as "main//1", "5995a7fbbff18ce4112e1ca2340b0f28.svg" as "main//2", "6abf8628427db52abaa32e9fd49244e6.svg" as "main//3", "93a7eb93f5cad314e62441304a4a54e5.svg" as "main//mainpre", "43c0f7be73ce0ad963312051b33149e7.svg" as "main//pre1", "7623cd63497ce9958a402454c3213740.svg" as "main//pre2", "18f6ef9483f71a7162f64c6c72ef2889.svg" as "background", "a8f1750801cf3e48db920c2b4c46459d.svg" as "mainbg//short", "367cd61e3eac0454e1143dbde031fd79.svg" as "mainbg//normal", "d72cea573ae31e017c047de6f881ea35.svg" as "intro";
sounds "f72c43d4688ea755266fa5a9f0f5c064.wav" as "A", "22a86a5d279b59496809e1f2b876d617.wav" as "C#", "2dfd6b64a7da1f56cbebd47c2803b003.wav" as "E", "ae1aa07c8d47c66a174cd51d7c307b0a.wav" as "Au", "40594b1688c120cf39d6ca62bc7e48f2.wav" as "G";
var temp_LoadMap = 39;
var mapForceX = 39;
var mapForceY = 38;
var mapForceDX = 3.8972129082475777;
var mapForceDY = -8.344601414435573;
var mapForceD = 9.209812224905116;
var _force_line_repulsion = 39.21;
var _force_line_elasticity = 0.18;
var _force_point_repulsion = 49;
var cloneID = 39;
var return_Distance = 300.39488386712213;
var temp_MapForceTry = 39;
var temp_MapInit = 4;
var cloneType = "mapchoose";
var temp_CheckMap = 39;
var temp_DivideString = 0;
list return_DivideString;
set_x 260;
set_y -145;
hide;

onflag {
    wait_until (Main == "intro");
    forever {
        wait_until (Main == "map");
        MainInit_DecodeCloud;
        until (Main == "main") {
            wait_until mouse_down();
            wait_until (not mouse_down());
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

proc GameControl _Point {
    Main = "game";
    GameDetail = "";
    IsFinish_ = "0";
    if "" {
    }
}

proc MapAddLink eleID1, eleID2 {
    add (((item_num($eleID1, MapPoint_7_) - 1) / 7) + 1) to MapLink;
    add (((item_num($eleID2, MapPoint_7_) - 1) / 7) + 1) to MapLink;
}

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
                MapAddLink ((letter_of(1, $name) & "-") & (letter_of(3, $name) - 1)), $name;
            }
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

proc Distance x1, y1, x2, y2 {
    return_Distance = (sqrt ((($x1 - $x2) * ($x1 - $x2)) + (($y1 - $y2) * ($y1 - $y2))));
}

nowarp proc wait_fps fps {
    repeat $fps {
        wait 0;
    }
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

orphan {
    forever {
        MoveOut x_position(), y_position(), "100", ("main//" & ((not touching_mouse_pointer()) * cloneID));
    }
}

nowarp proc WaitMouse {
    wait_until mouse_down();
    wait_until (not mouse_down());
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
        forever {
            MoveOut ((MapPoint_7_[(((cloneID - 1) * 7) + 2)] - MapCamera__cur__target___x_y_size__[1]) * MapCamera__cur__target___x_y_size__[3]), ((MapPoint_7_[(((cloneID - 1) * 7) + 3)] - MapCamera__cur__target___x_y_size__[2]) * MapCamera__cur__target___x_y_size__[3]), (6 * MapCamera__cur__target___x_y_size__[3]), ("map//" & MapPoint_7_[(((cloneID - 1) * 7) + 6)]);
        }
    }
    if (cloneType == "mapchoose") {
        show;
        set_brightness_effect -20;
        set_size (6 * MapCamera__cur__target___x_y_size__[3]);
        forever {
            change_size ((((6 + (3 * (MapCur == TouchedPoint))) * MapCamera__cur__target___x_y_size__[3]) - size()) / 3);
            MoveOut ((MapPoint_7_[(((MapCur - 1) * 7) + 2)] - MapCamera__cur__target___x_y_size__[1]) * MapCamera__cur__target___x_y_size__[3]), ((MapPoint_7_[(((MapCur - 1) * 7) + 3)] - MapCamera__cur__target___x_y_size__[2]) * MapCamera__cur__target___x_y_size__[3]), size(), "map//choose";
        }
    }
}

orphan {
    CLOUD_CODE = "1";
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

onclone {
    __ "循环效果";
    if (cloneType == "mainbg") {
        forever {
            MoveOut (mouse_x() / -40), (mouse_y() / -40), "105", costume_name();
        }
    }
    if (cloneType == "mainbutton") {
        forever {
            set_brightness_effect ((50 * touching_mouse_pointer()) * ((not (cloneID == "2")) or (not (CLOUD_CODE == "0"))));
        }
    }
    if (cloneType == "prestart") {
        forever {
            set_brightness_effect ((50 * touching_mouse_pointer()) * (not (cloneID == "1")));
        }
    }
}

proc __ number_or_text {
}

proc MapForceTryM Count {
    repeat $Count {
        MapForceTry _force_line_repulsion, _force_line_elasticity, _force_point_repulsion;
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

proc MainInit_DecodeCloud {
    Main = "map";
    cloneMap;
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
    temp_MapForceTry = "0";
    repeat (length MapPoint_7_ / 7) {
        temp_MapForceTry++;
        MapPoint_7_[(((temp_MapForceTry - 1) * 7) + 4)] = "0";
        MapPoint_7_[(((temp_MapForceTry - 1) * 7) + 5)] = "0";
    }
    mapForceX = "1";
    repeat ((length MapPoint_7_ / 7) - 1) {
        mapForceX++;
        mapForceY = "0";
        repeat (mapForceX - 1) {
            mapForceY++;
            mapForceDX = (MapPoint_7_[(((mapForceX - 1) * 7) + 2)] - MapPoint_7_[(((mapForceY - 1) * 7) + 2)]);
            mapForceDY = (MapPoint_7_[(((mapForceX - 1) * 7) + 3)] - MapPoint_7_[(((mapForceY - 1) * 7) + 3)]);
            mapForceD = (sqrt ((mapForceDX * mapForceDX) + (mapForceDY * mapForceDY)));
            if (MapPointToPoint_Square_[(((mapForceY - 1) * (length MapPoint_7_ / 7)) + mapForceX)] == "Unconnected") {
                temp_MapForceTry = ($C / (mapForceD * mapForceD));
            } else {
                temp_MapForceTry = "0";
                if (MapPointToPoint_Square_[(((mapForceY - 1) * (length MapPoint_7_ / 7)) + mapForceX)] == "Connected") {
                    temp_MapForceTry = (0 - ($B * mapForceD));
                }
                temp_MapForceTry += ($A / (mapForceD * mapForceD));
            }
            if (temp_MapForceTry > "1") {
                temp_MapForceTry = "1";
            }
            MapPoint_7_[(((mapForceX - 1) * 7) + 4)] = (MapPoint_7_[(((mapForceX - 1) * 7) + 4)] + (temp_MapForceTry * (mapForceDX / mapForceD)));
            MapPoint_7_[(((mapForceX - 1) * 7) + 5)] = (MapPoint_7_[(((mapForceX - 1) * 7) + 5)] + (temp_MapForceTry * (mapForceDY / mapForceD)));
            MapPoint_7_[(((mapForceY - 1) * 7) + 4)] = (MapPoint_7_[(((mapForceY - 1) * 7) + 4)] - (temp_MapForceTry * (mapForceDX / mapForceD)));
            MapPoint_7_[(((mapForceY - 1) * 7) + 5)] = (MapPoint_7_[(((mapForceY - 1) * 7) + 5)] - (temp_MapForceTry * (mapForceDY / mapForceD)));
        }
    }
    temp_MapForceTry = "0";
    repeat (length MapPoint_7_ / 7) {
        MapPoint_7_[((temp_MapForceTry * 7) + 2)] = (MapPoint_7_[((temp_MapForceTry * 7) + 2)] + MapPoint_7_[((temp_MapForceTry * 7) + 4)]);
        MapPoint_7_[((temp_MapForceTry * 7) + 3)] = (MapPoint_7_[((temp_MapForceTry * 7) + 3)] + MapPoint_7_[((temp_MapForceTry * 7) + 5)]);
        temp_MapForceTry++;
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

