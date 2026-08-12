"""Build agent request bodies and read answers from JSON responses."""

import json
import re
from typing import Any


MESSAGE_PLACEHOLDER = "{{message}}"
DEFAULT_REQUEST_BODY_TEMPLATE = '{\n  "message": "{{message}}"\n}'
DEFAULT_RESPONSE_PATH = "answer"


class AgentPayloadError(ValueError):
    """Raised when a project's endpoint payload mapping is invalid."""


def _parse_request_template(template: str) -> Any:
    try:
        payload = json.loads(template)
    except json.JSONDecodeError as error:
        raise AgentPayloadError(
            f"Request body template is not valid JSON: {error.msg} at line {error.lineno}"
        ) from error

    if not _contains_message_placeholder(payload):
        raise AgentPayloadError(
            f"Request body template must contain {MESSAGE_PLACEHOLDER} in a JSON value"
        )
    return payload


def _contains_message_placeholder(value: Any) -> bool:
    if isinstance(value, str):
        return MESSAGE_PLACEHOLDER in value
    if isinstance(value, list):
        return any(_contains_message_placeholder(item) for item in value)
    if isinstance(value, dict):
        return any(_contains_message_placeholder(item) for item in value.values())
    return False


def validate_request_body_template(template: str) -> str:
    """Validate a JSON template while preserving its readable formatting."""
    normalized = template.strip()
    _parse_request_template(normalized)
    return normalized


def build_request_body(template: str, message: str) -> Any:
    """Replace every message placeholder in a parsed JSON template."""
    try:
        payload = _parse_request_template(template)
    except AgentPayloadError:
        # Projects created before flexible mappings stored only a JSON key.
        # Keep those records usable until their owner next edits the project.
        legacy_field = template.strip()
        if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]{0,63}", legacy_field):
            return {legacy_field: message}
        raise

    def replace(value: Any) -> Any:
        if isinstance(value, str):
            return value.replace(MESSAGE_PLACEHOLDER, message)
        if isinstance(value, list):
            return [replace(item) for item in value]
        if isinstance(value, dict):
            return {key: replace(item) for key, item in value.items()}
        return value

    return replace(payload)


def expand_legacy_request_template(template: str) -> str:
    """Present an old single-field mapping through the new template API."""
    legacy_field = template.strip()
    if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]{0,63}", legacy_field):
        return json.dumps(
            {legacy_field: MESSAGE_PLACEHOLDER}, ensure_ascii=False, indent=2
        )
    return template


_PATH_KEY = re.compile(r"[^.\[\]]+")
_PATH_INDEX = re.compile(r"\[(\d+)\]")


def parse_response_path(path: str) -> list[str | int]:
    """Parse a small, predictable dot/bracket path such as choices[0].message.content."""
    normalized = path.strip()
    if normalized == "$":
        return []
    if normalized.startswith("$."):
        normalized = normalized[2:]
    if not normalized:
        raise AgentPayloadError("Response path is required")

    tokens: list[str | int] = []
    position = 0
    expect_key = True

    while position < len(normalized):
        if normalized[position] == ".":
            if expect_key:
                raise AgentPayloadError(f"Invalid response path near position {position + 1}")
            position += 1
            expect_key = True
            continue

        index_match = _PATH_INDEX.match(normalized, position)
        if index_match:
            tokens.append(int(index_match.group(1)))
            position = index_match.end()
            expect_key = False
            continue

        if not expect_key:
            raise AgentPayloadError(f"Invalid response path near position {position + 1}")

        key_match = _PATH_KEY.match(normalized, position)
        if not key_match:
            raise AgentPayloadError(f"Invalid response path near position {position + 1}")
        tokens.append(key_match.group(0))
        position = key_match.end()
        expect_key = False

    if expect_key:
        raise AgentPayloadError("Response path cannot end with a dot")
    return tokens


def validate_response_path(path: str) -> str:
    normalized = path.strip()
    parse_response_path(normalized)
    return normalized


def extract_response_value(payload: Any, path: str) -> str:
    """Read and normalize an answer selected by a response path."""
    value = payload
    traversed: list[str] = []

    for token in parse_response_path(path):
        if isinstance(token, int):
            traversed.append(f"[{token}]")
            if not isinstance(value, list) or token >= len(value):
                raise AgentPayloadError(
                    f"Response path was not found at {''.join(traversed)}"
                )
            value = value[token]
        else:
            traversed.append(("." if traversed else "") + token)
            if not isinstance(value, dict) or token not in value:
                raise AgentPayloadError(
                    f"Response path was not found at {''.join(traversed)}"
                )
            value = value[token]

    if value is None:
        raise AgentPayloadError(f"Response value at '{path}' is null")
    if isinstance(value, str):
        return value
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
