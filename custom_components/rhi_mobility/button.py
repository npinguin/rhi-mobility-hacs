from __future__ import annotations
from homeassistant.components.button import ButtonEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from .const import DOMAIN, RELEASE
from .projection import logical_device_info

async def async_setup_entry(hass: HomeAssistant,entry: ConfigEntry,async_add_entities: AddEntitiesCallback) -> None:
    data=hass.data[DOMAIN][entry.entry_id]; controller=data['controller']; created={}
    @callback
    def sync():
        new=[]
        for cid,row in controller.command_descriptors().items():
            if cid in created: continue
            entity=MobilityCommandButton(entry.entry_id,row.asset_id,row.command_key,controller); created[cid]=entity; new.append(entity)
        wanted=set(controller.command_descriptors())
        for cid in list(created):
            if cid not in wanted:
                entity=created.pop(cid); hass.async_create_task(entity.async_remove(force_remove=True))
        if new: async_add_entities(new,True)
    sync(); entry.async_on_unload(controller.add_listener(sync))

class MobilityCommandButton(ButtonEntity):
    _attr_has_entity_name=True
    def __init__(self,entry_id,asset_id,command_key,controller):
        self.entry_id=entry_id; self.asset_id=asset_id; self.command_key=command_key; self.controller=controller
        suffix=command_key.split('.')[-1]
        self._attr_unique_id=f'{DOMAIN}:{asset_id}:command:{command_key}'
        self._attr_name=suffix.replace('_',' ').title(); self._attr_icon=self._icon(command_key); self._attr_suggested_object_id=f'{DOMAIN}_{asset_id}_{suffix}'
        self._attr_device_info=logical_device_info(controller.hass,entry_id,controller.manager,asset_id)
    @staticmethod
    def _icon(key):
        if key.endswith('.start'): return 'mdi:play'
        if key.endswith('.stop'): return 'mdi:stop'
        if key.endswith('.lock'): return 'mdi:lock'
        if key.endswith('.unlock'): return 'mdi:lock-open-variant'
        if 'climate' in key: return 'mdi:car-defrost-front'
        if 'restart' in key: return 'mdi:restart'
        if 'identify' in key: return 'mdi:crosshairs-gps'
        return 'mdi:gesture-tap-button'
    @property
    def available(self):
        row=self.controller.command_descriptors().get(f'{self.asset_id}:{self.command_key}')
        return bool(row and row.execution_allowed)
    @property
    def extra_state_attributes(self):
        row=self.controller.command_descriptors().get(f'{self.asset_id}:{self.command_key}')
        if not row:return {'supported':False,'command_key':self.command_key}
        return {'supported':True,'command_key':self.command_key,'execution_allowed':row.execution_allowed,'blocked_reason':row.blocked_reason,'placement':row.placement,'protective':row.protective}
    async def async_press(self):
        await self.controller.async_execute_command(self.asset_id,self.command_key)
