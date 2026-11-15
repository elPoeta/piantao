import copy

import pytest

from piantao.config import ConfigError, _validate, load_config


@pytest.fixture(scope="module")
def base():
    return load_config()


def test_default_ui_config_is_valid(base):
    _validate(copy.deepcopy(base))


def test_old_hud_section_from_the_qt_hud_is_ignored(base):
    cfg = copy.deepcopy(base)
    cfg["ui"]["hud"] = {"corner": "centro", "size": 5}   # el HUD Qt ya no existe: una config vieja no debe romper el arranque
    _validate(cfg)


@pytest.mark.parametrize("ipc", [{"enabled": "si"}, {"socket": ""}, {"resources_interval_s": 0}])
def test_bad_ipc_config_is_rejected(base, ipc):
    cfg = copy.deepcopy(base)
    cfg["ui"]["ipc"] = ipc
    with pytest.raises(ConfigError, match="ipc"):
        _validate(cfg)
