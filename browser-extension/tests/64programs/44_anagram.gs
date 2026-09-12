var lst = [];
var chars1 = [];
func def_anagram(s1, s2) {
    if (length(s1) != length(s2)) { return 0; }
    def_sorted(s1);
    chars1 = [];
    local i = 1;
    while (i <= length(lst)) {
        add lst[i] to chars1;
        i += 1;
    }
    def_sorted(s2);
    local j = 1;
    while (j <= length(lst)) {
        if (j <= length(chars1)) {
            if (lst[j] != chars1[j]) { return 0; }
        }
        j += 1;
    }
    return 1;
}
func def_sorted(s) {
    lst = [];
    local i = 1;
    while (i <= length(s)) {
        add letter_of(i, s) to lst;
        i += 1;
    }
    local n = length(lst);
    local a = 1;
    while (a < n) {
        local b = 1;
        while (b <= n - a) {
            if (lst[b] > lst[b + 1]) {
                local t = lst[b];
                lst[b] = lst[b + 1];
                lst[b + 1] = t;
            }
            b += 1;
        }
        a += 1;
    }
}
onflag {
    say(def_anagram("listen", "silent"));
    say(def_anagram("hello", "world"));
}
