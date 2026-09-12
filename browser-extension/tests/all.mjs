// Master test suite: run all verifications in sequence.
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const steps = [
  ['编译 + 结构完整性校验 (64 个测试码)', 'tests/run_tests.mjs'],
  ['真实 scratch-vm 运行时执行 (64 个测试码)', 'tests/run_runtime.mjs'],
];
let allOk = true;
for (const [label, script] of steps) {
  console.log(`\n========== ${label} ==========`);
  const r = spawnSync('node', [script], { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  if (r.status !== 0) allOk = false;
}
console.log(allOk ? '\n✅ 全部测试通过' : '\n❌ 存在失败项');
process.exitCode = allOk ? 0 : 1;
