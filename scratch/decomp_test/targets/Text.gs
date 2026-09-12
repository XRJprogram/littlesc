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

