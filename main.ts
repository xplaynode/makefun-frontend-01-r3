// Lucky Frontend hand-in program (Node 22, standard library only).
// Copies app/ and screenshots/ into the output directory and writes
// dossier.json there with the vendored buildDossier library, byte for
// byte as the scorer rebuilds it. The output directory itself is never
// deleted: it is created when missing and only its contents are cleared.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for "/output":
//   MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const target = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(target, { recursive: true });
for (const name of readdirSync(target)) rmSync(join(target, name), { recursive: true, force: true });

cpSync(join(root, 'app'), join(target, 'app'), { recursive: true });
mkdirSync(join(target, 'screenshots'), { recursive: true });
const shotsDir = join(root, 'screenshots');
if (existsSync(shotsDir)) cpSync(shotsDir, join(target, 'screenshots'), { recursive: true });

const dossier = buildDossier(target, {
  text_max_bytes: 163840,
  screenshots: { max: 3, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(target, 'dossier.json'), dossier);
console.log('wrote dossier.json (' + dossier.length + ' bytes) to ' + target);
