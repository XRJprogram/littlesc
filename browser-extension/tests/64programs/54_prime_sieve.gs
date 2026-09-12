var sieve = [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
func def_sieve(n) {
    local i = 2;
    while (i * i <= n) {
        if (sieve[i] == 1) {
            local j = i * i;
            while (j <= n) {
                sieve[j] = 0;
                j += i;
            }
        }
        i += 1;
    }
}
func def_count_primes(n) {
    def_sieve(n);
    local count = 0;
    local i = 2;
    while (i <= n) {
        if (sieve[i] == 1) { count += 1; }
        i += 1;
    }
    return count;
}
onflag {
    say(def_count_primes(20));
}
