"""Exercise the workflow persistence shell with stubbed Git; never commit or push."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


class TestDailyRefreshPersistence(unittest.TestCase):
    def run_persistence(self, scenario):
        bash = shutil.which("bash")
        if os.name == "nt":
            candidate = Path(os.environ.get("ProgramFiles", "C:/Program Files")) / "Git/bin/bash.exe"
            bash = str(candidate) if candidate.exists() else None
        if not bash:
            self.skipTest("Bash is required to exercise the Actions shell")
        workflow = Path(__file__).resolve().parents[1] / ".github/workflows/daily_ingestion.yml"
        lines = workflow.read_text(encoding="utf-8").splitlines()
        start = next(i for i, line in enumerate(lines) if line.strip() == "id: persist")
        start = next(i for i in range(start, len(lines)) if lines[i].strip() == "run: |") + 1
        body = []
        for line in lines[start:]:
            if line and not line.startswith("          "):
                break
            body.append(line[10:] if line else "")
        # Only Git is stubbed. Bash evaluates the actual workflow body and exit handling.
        stub = r'''git() {
  printf '%s\n' "$*" >> "$TEST_LOG"
  case "$1" in
    diff) [[ "$SCENARIO" == unchanged ]] && return 0; return 1 ;;
    pull) [[ "$SCENARIO" == rebase_failure ]] && return 1; return 0 ;;
    push) [[ "$SCENARIO" == push_failure ]] && return 1; return 0 ;;
    *) return 0 ;;
  esac
}
'''
        with tempfile.TemporaryDirectory() as temp:
            log = Path(temp) / "git.log"
            env = dict(os.environ, REFRESH_BRANCH="main", SCENARIO=scenario,
                       TEST_LOG=log.as_posix())
            result = subprocess.run([bash, "--noprofile", "--norc", "-c", stub + "\n".join(body)],
                                    env=env, capture_output=True, text=True)
            return result, log.read_text(encoding="utf-8")

    def test_changed_data_is_pushed_to_default_branch(self):
        result, calls = self.run_persistence("changed")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("add data/processed/schemes.json", calls)
        self.assertIn("pull --rebase origin main", calls)
        self.assertIn("push origin HEAD:main", calls)

    def test_rebase_failure_is_reported_without_push(self):
        result, calls = self.run_persistence("rebase_failure")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("rebase --abort", calls)
        self.assertNotIn("push ", calls)

    def test_push_failure_fails_the_step(self):
        result, calls = self.run_persistence("push_failure")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("push origin HEAD:main", calls)

    def test_unchanged_data_is_not_committed_or_pushed(self):
        result, calls = self.run_persistence("unchanged")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn("commit ", calls)
        self.assertNotIn("push ", calls)
