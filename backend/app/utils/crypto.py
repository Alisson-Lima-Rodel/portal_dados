"""Criptografia Fernet para senhas de conexões externas.

Diferença entre HASH e CRIPTOGRAFIA:
  - Hash (bcrypt): transforma texto → hash IRREVERSÍVEL. Não dá para voltar.
    Usamos para senhas de USUÁRIOS (não precisamos recuperar a senha original).

  - Criptografia (Fernet): transforma texto → texto cifrado REVERSÍVEL.
    Usamos para senhas de CONEXÕES (precisamos da senha original para conectar).
    A chave FERNET_KEY no .env é necessária para decriptar.

IMPORTANTE: Se perder a FERNET_KEY, todas as senhas de conexão ficam ilegíveis.
"""
from cryptography.fernet import Fernet

from app.core.config import settings

_fernet = Fernet(settings.FERNET_KEY.encode())


def encrypt_value(plain: str) -> str:
    return _fernet.encrypt(plain.encode()).decode()


def decrypt_value(token: str) -> str:
    return _fernet.decrypt(token.encode()).decode()
