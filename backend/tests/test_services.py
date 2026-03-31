import pytest

from app.core.security import create_access_token, decode_token, hash_password, verify_password
from app.utils.crypto import decrypt_value, encrypt_value


class TestPasswordHashing:
    def test_hash_and_verify(self):
        plain = "minha_senha_123"
        hashed = hash_password(plain)
        assert hashed != plain
        assert verify_password(plain, hashed)

    def test_wrong_password(self):
        hashed = hash_password("correta")
        assert not verify_password("errada", hashed)


class TestJWT:
    def test_create_and_decode_access_token(self):
        data = {"sub": "42", "email": "user@test.com"}
        token = create_access_token(data)
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "42"
        assert payload["type"] == "access"

    def test_invalid_token_returns_none(self):
        assert decode_token("token.invalido.aqui") is None


class TestFernetCrypto:
    def test_encrypt_decrypt(self):
        original = "senha_super_secreta"
        encrypted = encrypt_value(original)
        assert encrypted != original
        decrypted = decrypt_value(encrypted)
        assert decrypted == original
