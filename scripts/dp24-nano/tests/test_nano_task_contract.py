import unittest

from nano_machines.nano_task_contract import NanoTaskRejected, REQUIRED_BLOCKS, validate_nano_task


def valid_task():
    return {
        "identity": {
            "parent_task": "TASK-C99-C3-REPAIR-CANVAS",
            "function_id": "FUN-C99-VALID-CANVAS",
            "algorithm_id": "ALG-C99-REPAIR-CANVAS",
            "subfunction_id": "SF-03-MATERIALIZE",
            "step_id": "STEP-05-WRITE",
            "assignee": "obsidian",
        },
        "gps": {
            "terrain": "TERRENO-MOCK",
            "room": "C99-LAB-FANTASMA",
            "module": "MOD-00-CANVAS",
            "submodule": "SUB-00-MAP",
            "circuit": "CKT-00-CARTOGRAFIA",
            "port": "P00-PERSISTENCIA",
        },
        "input": {"references": ["C99-LAB-FANTASMA/C99_CANVAS.canvas"], "values": {}},
        "operation": {"tool": "NM-OBS-WRITE", "max_calls": 1},
        "contract": {"require": "preimagem conhecida", "ensure": "um arquivo escrito", "invariant": "sem expansao de escopo"},
        "authority": {"allowed_paths": ["C99-LAB-FANTASMA/C99_CANVAS.canvas"], "expand_scope": False, "effects": ["write"]},
        "transition": {"on_success": "VERIFYING", "on_failure": "BLOCKED", "retry_limit": 0},
        "evidence": {"expected": ["sha256", "bytes"], "store": "card"},
        "stop": {"condition": "after_single_operation"},
    }


class NanoTaskContractTestCase(unittest.TestCase):
    def test_valid_task_has_nine_blocks_and_tool_operation(self):
        result = validate_nano_task(valid_task())
        self.assertTrue(result["ok"])
        self.assertEqual(result["blocks"], REQUIRED_BLOCKS)
        self.assertEqual(result["tool"], "NM-OBS-WRITE")

    def test_rejects_operation_capability_drift(self):
        task = valid_task()
        task["operation"] = {"capability": "WRITE", "max_calls": 1}
        with self.assertRaisesRegex(NanoTaskRejected, "OPERATION_CAPABILITY_IS_ONTOLOGY_DRIFT"):
            validate_nano_task(task)

    def test_rejects_scope_expansion(self):
        task = valid_task()
        task["authority"]["expand_scope"] = True
        with self.assertRaisesRegex(NanoTaskRejected, "EXPAND_SCOPE_MUST_BE_FALSE"):
            validate_nano_task(task)

    def test_rejects_missing_block(self):
        task = valid_task()
        del task["stop"]
        with self.assertRaisesRegex(NanoTaskRejected, "MISSING_BLOCKS:stop"):
            validate_nano_task(task)


if __name__ == "__main__":
    unittest.main()
