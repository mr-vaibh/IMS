import socket

def get_instance_id() -> str:
    return socket.gethostname()
