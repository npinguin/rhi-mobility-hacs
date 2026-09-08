from __future__ import annotations
from homeassistant.components.number import NumberEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from .const import DOMAIN
from .editable_projection import async_write, bounds, editable_definitions, is_available, value
from .projection import logical_device_info


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    data=hass.data[DOMAIN][entry.entry_id]
    controller=data['controller']; manager=data['runtime']; registry=data['registry']; created={}

    @callback
    def sync() -> None:
        new=[]; wanted=set()
        for asset_id,asset in sorted(manager.assets.items()):
            for property_key,editable in editable_definitions(registry,asset.concept_id,'number'):
                if not is_available(manager,controller,asset_id,property_key,editable):
                    continue
                key=(asset_id,property_key); wanted.add(key)
                if key not in created:
                    entity=MobilityNumber(entry.entry_id,asset_id,property_key,editable,manager,controller,registry)
                    created[key]=entity; new.append(entity)
        for key in list(created):
            if key not in wanted:
                entity=created.pop(key); hass.async_create_task(entity.async_remove(force_remove=True))
        if new: async_add_entities(new,True)

    sync()
    entry.async_on_unload(manager.add_topology_listener(sync))
    entry.async_on_unload(controller.add_listener(sync))


class MobilityNumber(NumberEntity):
    _attr_has_entity_name=True

    def __init__(self,entry_id,asset_id,property_key,editable,manager,controller,registry):
        self.asset_id=asset_id; self.property_key=property_key; self.editable=editable
        self.manager=manager; self.controller=controller; self.registry=registry
        suffix=property_key.replace('.','_')
        self._attr_unique_id=f'{DOMAIN}:{asset_id}:number:{property_key}'
        self._attr_suggested_object_id=f'{DOMAIN}_{asset_id}_{suffix}'
        self._attr_name=editable.get('name') or property_key.split('.')[-1].replace('_',' ').title()
        definition=registry.semantic_catalog['properties'].get(property_key,{})
        self._attr_native_unit_of_measurement=definition.get('unit')
        self._attr_device_info=logical_device_info(manager.hass,entry_id,manager,asset_id)

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(self.manager.add_asset_listener(self.asset_id,self._changed))
        if self.editable.get('write_kind') in {'charger_requested_power','vehicle_requested_power','charger_requested_current'}:
            self.async_on_remove(self.controller.add_listener(self._changed))

    @callback
    def _changed(self) -> None:
        self.async_write_ha_state()

    @property
    def native_min_value(self): return bounds(self.manager,self.controller,self.asset_id,self.property_key,self.editable)[0]
    @property
    def native_max_value(self): return bounds(self.manager,self.controller,self.asset_id,self.property_key,self.editable)[1]
    @property
    def native_step(self): return bounds(self.manager,self.controller,self.asset_id,self.property_key,self.editable)[2]
    @property
    def native_value(self): return value(self.manager,self.controller,self.asset_id,self.property_key,self.editable)
    @property
    def available(self): return is_available(self.manager,self.controller,self.asset_id,self.property_key,self.editable)

    @property
    def extra_state_attributes(self):
        kind=self.editable.get('write_kind')
        if kind in {'charger_requested_power','vehicle_requested_power'}:
            target=self.asset_id if kind=='charger_requested_power' else self.manager.effective_charger_for_vehicle(self.asset_id)
            status={} if not target else self.controller.requested_power_status(target)
            return {**status,'write_kind':kind,'actual_not_requested':True,'canonical_property':self.property_key}
        return {'configuration_owner':'rhi_mobility','technical_selection_owner':'rhi_foundation','canonical_property':self.property_key}

    async def async_set_native_value(self,new_value: float) -> None:
        await async_write(self.manager,self.controller,self.asset_id,self.property_key,self.editable,float(new_value))
