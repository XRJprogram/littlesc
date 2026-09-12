target "System";

costumes "3339a2953a3bf62bb80e54ff575dbced.svg" as "造型1";
set_x 320;
set_y 180;

onflag {
    goto 10000, 10000;
    _SYSTEMbgX = x_position();
    _SYSTEMbgY = y_position();
}

