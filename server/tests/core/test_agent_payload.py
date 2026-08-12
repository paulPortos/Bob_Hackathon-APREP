import unittest

from app.core.agent_payload import (
    AgentPayloadError,
    build_request_body,
    extract_response_value,
    expand_legacy_request_template,
    validate_request_body_template,
    validate_response_path,
)


class AgentPayloadTests(unittest.TestCase):
    def test_builds_nested_request_without_breaking_json_characters(self) -> None:
        template = """{
          "settings": {"mode": "concise"},
          "inputs": [{"role": "user", "content": "{{message}}"}]
        }"""

        body = build_request_body(template, 'Say "hello"\nnext line')

        self.assertEqual(body["settings"]["mode"], "concise")
        self.assertEqual(body["inputs"][0]["content"], 'Say "hello"\nnext line')

    def test_replaces_placeholder_inside_larger_string(self) -> None:
        body = build_request_body('{"input": "Question: {{message}}"}', "Why?")
        self.assertEqual(body, {"input": "Question: Why?"})

    def test_supports_projects_created_with_the_old_single_field_mapping(self) -> None:
        self.assertEqual(build_request_body("prompt", "Why?"), {"prompt": "Why?"})
        self.assertEqual(
            expand_legacy_request_template("prompt"),
            '{\n  "prompt": "{{message}}"\n}',
        )

    def test_rejects_template_without_message_placeholder(self) -> None:
        with self.assertRaisesRegex(AgentPayloadError, "must contain"):
            validate_request_body_template('{"message": "fixed"}')

    def test_extracts_nested_array_response(self) -> None:
        payload = {"choices": [{"message": {"content": "The answer"}}]}
        self.assertEqual(
            extract_response_value(payload, "choices[0].message.content"),
            "The answer",
        )

    def test_normalizes_structured_response(self) -> None:
        self.assertEqual(
            extract_response_value({"result": {"score": 4}}, "result"),
            '{"score":4}',
        )

    def test_rejects_invalid_or_missing_response_path(self) -> None:
        with self.assertRaises(AgentPayloadError):
            validate_response_path("choices..content")
        with self.assertRaisesRegex(AgentPayloadError, "was not found"):
            extract_response_value({"choices": []}, "choices[0].message.content")


if __name__ == "__main__":
    unittest.main()
