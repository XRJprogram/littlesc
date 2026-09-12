import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import net from 'net';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend-js');

console.log('====================================================');
console.log('  🚀 littlesc (TurboWarp + AI Copilot) 启动器');
console.log('====================================================\n');

// 1. Check & Install Backend Dependencies
function ensureDependencies(dir, label) {
    const nm = path.join(dir, 'node_modules');
    if (!fs.existsSync(nm)) {
        console.log(`[依赖检查] 正在为 ${label} 安装 npm 依赖，请稍候...`);
        return new Promise((resolve, reject) => {
            const isWin = process.platform === 'win32';
            const npmCmd = isWin ? 'npm.cmd' : 'npm';
            const child = spawn(npmCmd, ['install'], {
                cwd: dir,
                stdio: 'inherit',
                shell: true
            });
            child.on('exit', code => {
                if (code === 0) {
                    console.log(`✓ ${label} 依赖安装完成！\n`);
                    resolve();
                } else {
                    reject(new Error(`${label} npm install 退出，错误码: ${code}`));
                }
            });
            child.on('error', reject);
        });
    }
    return Promise.resolve();
}

// 2. Wait for port to become available
function waitForPort(port, timeoutMs = 45000) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        const check = () => {
            const socket = new net.Socket();
            socket.setTimeout(800);
            socket.on('connect', () => {
                socket.destroy();
                resolve();
            });
            socket.on('timeout', () => {
                socket.destroy();
                retry();
            });
            socket.on('error', () => {
                socket.destroy();
                retry();
            });
            socket.connect(port, '127.0.0.1');
        };

        const retry = () => {
            if (Date.now() - start > timeoutMs) {
                reject(new Error(`等待端口 ${port} 超时 (${timeoutMs}ms)`));
            } else {
                setTimeout(check, 800);
            }
        };

        check();
    });
}

// 3. Open browser
function openBrowser(url) {
    console.log(`\n🌐 正在自动打开浏览器: ${url}`);
    if (process.platform === 'win32') {
        exec(`start "" "${url}"`);
    } else if (process.platform === 'darwin') {
        exec(`open "${url}"`);
    } else {
        exec(`xdg-open "${url}"`);
    }
}

async function main() {
    try {
        // Step 1: Ensure dependencies
        await ensureDependencies(BACKEND_DIR, '后端 (backend-js)');
        await ensureDependencies(ROOT_DIR, '前端 (TurboWarp scratch-gui)');

        const isWin = process.platform === 'win32';
        const npmCmd = isWin ? 'npm.cmd' : 'npm';

        // Step 2: Start backend server (:8000)
        console.log('[启动服务] 正在启动后端编译服务 (:8000)...');
        const backendProc = spawn(process.execPath, ['src/server.js'], {
            cwd: BACKEND_DIR,
            stdio: ['ignore', 'inherit', 'inherit']
        });

        // Step 3: Start frontend dev server (:8601)
        console.log('[启动服务] 正在启动前端开发服务器 (:8601)...');
        const frontendProc = spawn(npmCmd, ['start'], {
            cwd: ROOT_DIR,
            stdio: ['ignore', 'inherit', 'inherit'],
            shell: true
        });

        // Cleanup on exit
        const killAll = () => {
            console.log('\n[退出中] 正在关闭所有服务...');
            try { backendProc.kill(); } catch (_) {}
            try { frontendProc.kill(); } catch (_) {}
            process.exit(0);
        };

        process.on('SIGINT', killAll);
        process.on('SIGTERM', killAll);
        backendProc.on('exit', () => killAll());
        frontendProc.on('exit', () => killAll());

        // Step 4: Wait for frontend to be ready, then open browser
        console.log('[等待就绪] 等待 Webpack DevServer 就绪中...');
        try {
            await waitForPort(8601);
            console.log('\n🎉 TurboWarp 前后端全部就绪！');
            openBrowser('http://localhost:8601');
        } catch (e) {
            console.warn(`[提示] 自动检测端口超时，你可以在几秒后手动访问: http://localhost:8601`);
        }
    } catch (err) {
        console.error('\n❌ 启动失败:', err.message);
        process.exit(1);
    }
}

main();
