func def_fizzbuzz(n) {
    local i = 1;
    while (i <= n) {
        if (i % 15 == 0) { say("FizzBuzz"); }
        else if (i % 3 == 0) { say("Fizz"); }
        else if (i % 5 == 0) { say("Buzz"); }
        else { say(i); }
        i += 1;
    }
}
onflag {
    def_fizzbuzz(15);
}
