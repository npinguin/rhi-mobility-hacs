from __future__ import annotations
from homeassistant.components.select import SelectEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from .const import DOMAIN
from .editable_projection import async_write, editable_definitions, is_available, options, value
from .projection import logical_device_info

async def async_setup_entry(hass: HomeAssistant,entry: ConfigEntry,async_add_entities: AddEntitiesCallback) -> None:
    data=hass.data[DOMAIN][entry.entry_id]; manager=data['runtime']; controller=data['controller']; registry=data['registry']; created={}
    @callback
    def sync():
        new=[]; wanted=set()
        for aid,asset in sorted(manager.assets.items()):
            for property_key,editable in editable_definitions(registry,asset.concept_id,'select'):
                if not is_available(manager,controller,aid,property_key,editable): continue
                key=(aid,property_key); wanted.add(key)
                if key not in created:
                    entity=MobilitySelect(entry.entry_id,aid,property_key,editable,manager,controller,registry); created[key]=entity; new.append(entity)
        for key in list(created):
            if key not in wanted:
                entity=created.pop(key); hass.async_create_task(entity.async_remove(force_remove=True))
        if new: async_add_entities(new,True)
    sync(); entry.async_on_unload(manager.add_topology_listener(sync))

class MobilitySelect(SelectEntity):
    _attr_has_entity_name=True
    def __init__(self,entry_id,asset_id,property_key,editable,manager,controller,registry):
        self.asset_id=asset_id; self.property_key=property_key; self.editable=editable; self.manager=manager; self.controller=controller; self.registry=registry
        suffix=property_key.replace('.','_')
        self._attr_unique_id=f'{DOMAIN}:{asset_id}:select:{property_key}'; self._attr_suggested_object_id=f'{DOMAIN}_{asset_id}_{suffix}'
        self._attr_name=editable.get('name') or property_key.split('.')[-1].replace('_',' ').title()
        self._attr_device_info=logical_device_info(manager.hass,entry_id,manager,asset_id)
    async def async_added_to_hass(self) -> None:
        self.async_on_remove(self.manager.add_asset_listener(self.asset_id,self._changed))
    @callback
    def _changed(self): self.async_write_ha_state()
    @property
    def options(self): return options(self.manager,self.registry,self.asset_id,self.property_key,self.editable)
    @property
    def current_option(self):
        current=value(self.manager,self.controller,self.asset_id,self.property_key,self.editable)
        return None if current is None else str(current)
    @property
    def available(self): return is_available(self.manager,self.controller,self.asset_id,self.property_key,self.editable)
    async def async_select_option(self,option: str):
        if option not in self.options: raise ValueError(f'unsupported option {option}')
        await async_write(self.manager,self.controller,self.asset_id,self.property_key,self.editable,option)
