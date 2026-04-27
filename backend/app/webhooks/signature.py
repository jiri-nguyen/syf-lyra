import hashlib
import hmac


def verify_github_signature(payload_bytes: bytes, signature_header: str, secret: str) -> bool:
    """
    GitHub sends: X-Hub-Signature-256: sha256=<hex>
    Computes HMAC-SHA256(secret, payload) and compares in constant time.
    """
    expected = "sha256=" + hmac.new(
        secret.encode(), payload_bytes, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)
