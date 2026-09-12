target stage;

costumes "cd21514d0531fdffb22204e0ec5ed84a.svg" as "cd21514d0531fdffb22204e0ec5ed84a";


target "Sprite1";

costumes "927d672925e7b99f7813735c484c6922.svg" as "costume1";
var a = 0;
var op = 0;
var b = 0;
var result = 0;

onflag {
    say "加减乘除计算器已就绪";
    forever {
        ask "请输入第一个数:";
        a = answer();
        ask "请输入运算符(+ - * /):";
        op = answer();
        ask "请输入第二个数:";
        b = answer();
        if (op == "+") {
            result = (a + b);
            say ("结果: " & result);
        } else {
            if (op == "-") {
                result = (a - b);
                say ("结果: " & result);
            } else {
                if (op == "*") {
                    result = (a * b);
                    say ("结果: " & result);
                } else {
                    if (op == "/") {
                        if (b == 0) {
                            say "错误: 除数不能为0!";
                        } else {
                            result = (a / b);
                            say ("结果: " & result);
                        }
                    } else {
                        say "错误: 不支持的运算符!";
                    }
                }
            }
        }
        wait 1;
    }
}
