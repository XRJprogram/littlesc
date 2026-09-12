func def_circle_area(r) { return 3.14159 * r * r; }
func def_circle_circ(r) { return 2 * 3.14159 * r; }
onflag {
    say(def_circle_area(5));
    say(def_circle_circ(5));
}
