import re

_BRANCH_RE = re.compile(r"([a-zA-Z]+)-(\d+)", re.IGNORECASE)


def parse_branch(branch_name: str) -> tuple[str, int] | None:
    """
    Extract (project_identifier, sequence_number) from a branch name.

    Examples:
      'eng-42-fix-login'   → ('ENG', 42)
      'refs/heads/eng-42'  → ('ENG', 42)
      'feature/eng-42'     → ('ENG', 42)
    Returns None if no match.
    """
    name = branch_name.removeprefix("refs/heads/")
    name = name.split("/")[-1]

    match = _BRANCH_RE.search(name)
    if not match:
        return None
    return match.group(1).upper(), int(match.group(2))
