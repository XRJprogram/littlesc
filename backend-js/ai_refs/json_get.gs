var g_json_out = "";
func def_json_get(s, key) {
    g_json_out = "";
    local k = "\"" & key & "\"";
    local i = 1;
    local n = length(s);
    while (i <= n - length(k) + 1 and g_json_out == "") {
        local w = "";
        local j = i;
        while (j <= i + length(k) - 1) { w = w & letter_of(j, s); j += 1; }
        if (w == k) {
            local p = i + length(k);
            while (p <= n and letter_of(p, s) != ":") { p += 1; }
            p += 1;
            while (p <= n and letter_of(p, s) != "\"") { p += 1; }
            p += 1;
            while (p <= n and letter_of(p, s) != "\"") { g_json_out = g_json_out & letter_of(p, s); p += 1; }
        }
        i += 1;
    }
    return g_json_out;
}