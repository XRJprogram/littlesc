func def_json_get(s, key) {
    local i = 1;
    while (i <= length(s)) {
        local k = def_json_key(s, i);
        if (k == key) {
            return def_json_val(s, i);
        }
        i += 1;
    }
    return "";
}
func def_json_key(s, idx) {
    local i = idx;
    while (i <= length(s)) {
        local ch = letter_of(i, s);
        if (ch == ":") {
            local k = "";
            local j = idx;
            while (j < i) {
                local c2 = letter_of(j, s);
                if (c2 != "\"" and c2 != "{" and c2 != " " and c2 != ",") { k = k & c2; }
                j += 1;
            }
            return k;
        }
        i += 1;
    }
    return "";
}
func def_json_val(s, idx) {
    local i = idx;
    local found = 0;
    local v = "";
    while (i <= length(s)) {
        local ch = letter_of(i, s);
        if (ch == ":") { found = 1; }
        else if (found == 1) {
            if (ch == "\"") { found = 2; }
            else if (ch == "," or ch == "}") { if (found == 2) { return v; } }
            else { if (found == 2) { v = v & ch; } }
        }
        i += 1;
    }
    return v;
}
onflag {
    say(def_json_get("{\"name\":\"amy\",\"age\":7}", "name"));
}
