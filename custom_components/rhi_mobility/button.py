from __future__ import annotations
from homeassistant.components.button import ButtonEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.entity import EntityCategory
from .const import DOMAIN, RELEASE
from .projection import logical_device_info

async def async_setup_entry(hass: HomeAssistant,entry: ConfigEntry,async_add_entities: AddEntitiesCallback) -> None:
    data=hass.data[DOMAIN][entry.entry_id]; controller=data['controller']; manager=data['runtime']; created={}
    @callback
    def sync():
        new=[]
        for cid,row in controller.command_descriptors().items():
            if cid in created: continue
            entity=MobilityCommandButton(entry.entry_id,row.asset_id,row.command_key,controller,manager); created[cid]=entity; new.append(entity)
        wanted=set(controller.command_descriptors())
        # A vehicle may control its selected charger without inventing a
        # second vehicle-native service or copying the physical command source.
        for vehicle_id, asset in sorted(manager.assets.items()):
            if asset.concept_id != "vehicle":
                continue
            charger_id = manager.effective_charger_for_vehicle(vehicle_id)
            if not charger_id or charger_id not in manager.assets:
                continue
            for action in ("start", "stop"):
                cid = f"{vehicle_id}:assigned_charger:{action}"
                wanted.add(cid)
                if cid not in created:
                    entity = AssignedChargerCommandButton(
                        entry.entry_id, vehicle_id, action, controller, manager,
                    )
                    created[cid] = entity
                    new.append(entity)
                else:
                    created[cid]._changed()
        for cid in list(created):
            if cid not in wanted:
                entity=created.pop(cid); hass.async_create_task(entity.async_remove(force_remove=True))
        if new: async_add_entities(new,False)
    sync()
    entry.async_on_unload(controller.add_listener(sync))
    # Assignment configuration changes are not structural topology changes.
    # Refresh the vehicle button set only when that exact relationship changes.
    domain_config = data.get("domain_config")
    if domain_config is not None:
        def on_configuration_change(_asset_id, property_key):
            if property_key == "vehicle.selected_charger":
                sync()
        entry.async_on_unload(domain_config.add_listener(on_configuration_change))

class MobilityCommandButton(ButtonEntity):
    _attr_has_entity_name=True
    def __init__(self,entry_id,asset_id,command_key,controller,manager):
        self.entry_id=entry_id; self.asset_id=asset_id; self.command_key=command_key; self.controller=controller; self.manager=manager
        suffix=command_key.split('.')[-1]
        self._attr_unique_id=f'{DOMAIN}:{asset_id}:command:{command_key}'
        self._attr_name=suffix.replace('_',' ').title(); self._attr_icon=self._icon(command_key); self._attr_suggested_object_id=f'{DOMAIN}_{asset_id}_{suffix}'
        self._attr_device_info=logical_device_info(controller.hass,entry_id,controller.manager,asset_id)
        row=controller.command_descriptors().get(f'{asset_id}:{command_key}')
        if row and str(row.placement).endswith('.engineering'):
            self._attr_entity_category=EntityCategory.DIAGNOSTIC
    async def async_added_to_hass(self):
        # Command readiness depends on canonical runtime state (for example charger
        # operating/connection state), not only on command/executor topology. Keep
        # the button entity stable and refresh its availability when its owning
        # Mobility asset changes.
        self.async_on_remove(self.manager.add_asset_listener(self.asset_id,self._changed))
        self.async_on_remove(self.controller.add_listener(self._changed))

    @callback
    def _changed(self):
        self.async_write_ha_state()

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


class AssignedChargerCommandButton(ButtonEntity):
    """Explicit manual charger control on the assigned vehicle's HA device page."""

    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, entry_id, vehicle_id, action, controller, manager):
        self.vehicle_id = vehicle_id
        self.action = action
        self.controller = controller
        self.manager = manager
        self._attr_unique_id = f"{DOMAIN}:{vehicle_id}:command:assigned_charger_{action}"
        self._attr_suggested_object_id = f"{DOMAIN}_{vehicle_id}_assigned_charger_{action}"
        self._attr_name = f"{action.title()} charging (assigned charger)"
        self._attr_icon = "mdi:play" if action == "start" else "mdi:stop"
        self._attr_device_info = logical_device_info(controller.hass, entry_id, manager, vehicle_id)
        self._charger_unsub = None
        self._subscribed_charger = None

    def _sync_charger_listener(self):
        current = self.manager.effective_charger_for_vehicle(self.vehicle_id)
        if current == self._subscribed_charger:
            return
        if self._charger_unsub is not None:
            self._charger_unsub()
            self._charger_unsub = None
        self._subscribed_charger = current
        if current and current in self.manager.assets:
            self._charger_unsub = self.manager.add_asset_listener(current, self._changed)

    def _release_charger_listener(self):
        if self._charger_unsub is not None:
            self._charger_unsub()
            self._charger_unsub = None
        self._subscribed_charger = None

    async def async_added_to_hass(self):
        self._sync_charger_listener()
        self.async_on_remove(self._release_charger_listener)
        self.async_on_remove(self.manager.add_asset_listener(self.vehicle_id, self._changed))
        self.async_on_remove(self.controller.add_listener(self._changed))

    @callback
    def _changed(self):
        self._sync_charger_listener()
        self.async_write_ha_state()

    @property
    def available(self):
        return self.controller.assigned_charger_command_state(
            self.vehicle_id, self.action,
        )["execution_allowed"]

    @property
    def extra_state_attributes(self):
        return self.controller.assigned_charger_command_state(
            self.vehicle_id, self.action,
        )

    async def async_press(self):
        await self.controller.async_execute_assigned_charger_command(
            self.vehicle_id, self.action,
        )
