from __future__ import annotations
from homeassistant.components.select import SelectEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from .const import DOMAIN
from .editable_projection import async_write, display_option, editable_definitions, is_available, persisted_option, select_choices, value
from .projection import logical_device_info

async def async_setup_entry(hass: HomeAssistant,entry: ConfigEntry,async_add_entities: AddEntitiesCallback) -> None:
    data=hass.data[DOMAIN][entry.entry_id]; manager=data['runtime']; controller=data['controller']; registry=data['registry']; created={}
    @callback
    def sync():
        new=[]; wanted=set()
        for aid,asset in sorted(manager.assets.items()):
            for property_key,editable in editable_definitions(registry,asset.concept_id,'select'):
                key=(aid,property_key); wanted.add(key)
                if key not in created:
                    entity=MobilitySelect(entry.entry_id,aid,property_key,editable,manager,controller,registry); created[key]=entity; new.append(entity)
        for key in list(created):
            if key not in wanted:
                entity=created.pop(key); hass.async_create_task(entity.async_remove(force_remove=True))
        if new: async_add_entities(new,False)
    sync(); entry.async_on_unload(manager.add_topology_listener(sync))

class MobilitySelect(SelectEntity):
    _attr_has_entity_name=True
    def __init__(self,entry_id,asset_id,property_key,editable,manager,controller,registry):
        self.asset_id=asset_id; self.property_key=property_key; self.editable=editable; self.manager=manager; self.controller=controller; self.registry=registry
        suffix=property_key.replace('.','_')
        self._attr_unique_id=f'{DOMAIN}:{asset_id}:select:{property_key}'; self._attr_suggested_object_id=f'{DOMAIN}_{asset_id}_{suffix}'
        self._attr_name=editable.get('name') or property_key.split('.')[-1].replace('_',' ').title()
        if editable.get('write_kind') in {"configuration", "profile", "selected_charger", "ha_person", "lifecycle_status_alias", "lifecycle_enabled_alias", "manual_vehicle_configuration"}:
            self._attr_entity_category=EntityCategory.CONFIG
        self._attr_device_info=logical_device_info(manager.hass,entry_id,manager,asset_id)
    async def async_added_to_hass(self) -> None:
        self.async_on_remove(self.manager.add_asset_listener(self.asset_id,self._changed))
        # Product/V1 write metadata resolves the real HA editor entity from the entity
        # registry. The first publication can occur before this SelectEntity is registered,
        # so explicitly republish topology once registration is complete. This keeps the
        # canonical editor owner in Mobility while preventing a permanent read-only
        # "Profile: Unknown" projection caused solely by setup ordering.
        notify=getattr(self.manager,'_notify_topology',None)
        if callable(notify): notify()
    @callback
    def _changed(self): self.async_write_ha_state()
    @property
    def options(self):
        return [label for _value,label in select_choices(
            self.manager,self.registry,self.asset_id,self.property_key,self.editable
        )]
    @property
    def current_option(self):
        current=value(self.manager,self.controller,self.asset_id,self.property_key,self.editable)
        kind=self.editable.get('write_kind')
        if kind in {'profile','selected_charger','ha_person'}:
            return display_option(
                self.manager,self.registry,self.asset_id,self.property_key,self.editable,current
            )
        return None if current is None else str(current)
    @property
    def available(self): return is_available(self.manager,self.controller,self.asset_id,self.property_key,self.editable)
    @property
    def extra_state_attributes(self):
        if self.property_key!='asset.profile_id': return None
        return {
            'profile_options': [
                {'profile_id': str(row['profile_id']), 'display_name': str(row.get('display_name') or row['profile_id'])}
                for row in self.registry.profiles_for_type(self.manager.assets[self.asset_id].concept_id)
            ]
        }
    async def async_select_option(self,option: str):
        if option not in self.options:
            raise ValueError(f'unsupported option {option}')
        kind=self.editable.get('write_kind')
        persisted=(
            persisted_option(self.manager,self.registry,self.asset_id,self.property_key,self.editable,option)
            if kind in {'profile','selected_charger','ha_person'}
            else option
        )
        await async_write(self.manager,self.controller,self.asset_id,self.property_key,self.editable,persisted)
