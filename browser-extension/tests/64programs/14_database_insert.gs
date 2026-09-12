var names = [];
var ages = [];
func def_add(name, age) {
    add name to names;
    add age to ages;
}
func def_count() {
    return length(names);
}
onflag {
    def_add("amy", 7);
    def_add("bob", 12);
    say(def_count());
    say(ages[2]);
}
